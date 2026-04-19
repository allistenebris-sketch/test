from datetime import datetime, timedelta
import mimetypes
from pathlib import Path

from fastapi import Depends, FastAPI, File, Form, HTTPException, Header, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from .config import settings
from .database import Base, engine, get_db
from .mailer import send_password_reset_token, send_verification_code
from .models import EmailCode, PasswordResetToken, Subscription, Track, User
from .security import (
    create_access_token,
    decode_access_token,
    generate_code,
    generate_token,
    hash_password,
    verify_password,
)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts)
if settings.force_https_redirect:
    app.add_middleware(HTTPSRedirectMiddleware)

UPLOAD_DIR = Path(settings.upload_dir)
UPLOAD_DIR.mkdir(exist_ok=True)

Base.metadata.create_all(bind=engine)
auth_scheme = HTTPBearer()
optional_auth_scheme = HTTPBearer(auto_error=False)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class VerifyRequest(BaseModel):
    email: EmailStr
    code: str


class EmailRequest(BaseModel):
    email: EmailStr


class RequestReset(BaseModel):
    email: EmailStr


class ConfirmReset(BaseModel):
    token: str
    new_password: str


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(auth_scheme),
    db: Session = Depends(get_db),
) -> User:
    subject = decode_access_token(credentials.credentials)
    if not subject:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == subject).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_user_by_token(token: str, db: Session) -> User:
    subject = decode_access_token(token)
    if not subject:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.email == subject).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@app.post("/api/auth/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        display_name=payload.display_name,
        is_verified=False,
    )
    db.add(user)

    code = generate_code()
    db.add(EmailCode(email=payload.email, code=code, purpose="verify"))
    db.commit()
    try:
        send_verification_code(payload.email, code)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"SMTP send failed: {exc}") from exc

    response = {"message": "Registered. Verify email with code from email."}
    if settings.debug_return_codes:
        response["debug_code"] = code
    return response


@app.post("/api/auth/verify")
def verify_email(payload: VerifyRequest, db: Session = Depends(get_db)):
    code_entry = (
        db.query(EmailCode)
        .filter(EmailCode.email == payload.email, EmailCode.purpose == "verify")
        .order_by(EmailCode.id.desc())
        .first()
    )
    if not code_entry or code_entry.code != payload.code or code_entry.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_verified = True
    db.delete(code_entry)
    db.commit()
    return {"message": "Email verified"}


@app.post("/api/auth/resend-code")
def resend_verify_code(payload: EmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        return {"message": "Email already verified"}

    code = generate_code()
    db.add(EmailCode(email=payload.email, code=code, purpose="verify"))
    db.commit()
    try:
        send_verification_code(payload.email, code)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"SMTP send failed: {exc}") from exc

    response = {"message": "New verification code sent"}
    if settings.debug_return_codes:
        response["debug_code"] = code
    return response


@app.post("/api/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")

    token = create_access_token(subject=user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "display_name": user.display_name},
    }


@app.post("/api/auth/forgot-password")
def forgot_password(payload: RequestReset, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        token = generate_token()
        reset = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(minutes=30),
        )
        db.add(reset)
        db.commit()
        try:
            send_password_reset_token(payload.email, token)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"SMTP send failed: {exc}") from exc
        response = {"message": "Reset token sent to email"}
        if settings.debug_return_codes:
            response["debug_reset_token"] = token
        return response
    return {"message": "If email exists, reset instructions were sent"}


@app.post("/api/auth/reset-password")
def reset_password(payload: ConfirmReset, db: Session = Depends(get_db)):
    reset = db.query(PasswordResetToken).filter(PasswordResetToken.token == payload.token).first()
    if not reset or reset.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = db.query(User).filter(User.id == reset.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(payload.new_password)
    db.delete(reset)
    db.commit()
    return {"message": "Password updated"}


@app.get("/api/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "display_name": current_user.display_name}


@app.get("/api/health")
def health():
    return {"status": "ok", "service": settings.app_name}


@app.post("/api/tracks")
def upload_track(
    title: str = Form(...),
    artist_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    extension = Path(file.filename or "track.mp3").suffix or ".mp3"
    stored_name = f"{datetime.utcnow().timestamp()}_{current_user.id}{extension}"
    target_path = UPLOAD_DIR / stored_name

    with target_path.open("wb") as f:
        f.write(file.file.read())

    track = Track(title=title, artist_name=artist_name, file_path=str(target_path), author_id=current_user.id)
    db.add(track)
    db.commit()
    db.refresh(track)

    return {"message": "Track uploaded", "track_id": track.id}


@app.get("/api/tracks")
def list_tracks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    subscribed_ids = [sub.author_id for sub in current_user.subscriptions]

    tracks = db.query(Track).order_by(Track.uploaded_at.desc()).all()
    return [
        {
            "id": t.id,
            "title": t.title,
            "artist_name": t.artist_name,
            "uploaded_at": t.uploaded_at,
            "author_id": t.author_id,
            "author_display_name": t.author.display_name,
            "is_subscribed": t.author_id in subscribed_ids,
            "stream_url": f"/api/tracks/{t.id}/stream",
        }
        for t in tracks
    ]


@app.get("/api/tracks/{track_id}/stream")
def stream_track(
    track_id: int,
    token: str | None = Query(default=None),
    range_header: str | None = Header(default=None, alias="Range"),
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_auth_scheme),
    db: Session = Depends(get_db),
):
    raw_token = credentials.credentials if credentials else token
    if not raw_token:
        raise HTTPException(status_code=401, detail="Token required")
    get_user_by_token(raw_token, db)

    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    file_path = Path(track.file_path)
    file_size = file_path.stat().st_size
    media_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"

    if not range_header:
        response = FileResponse(file_path, media_type=media_type)
        response.headers["Accept-Ranges"] = "bytes"
        return response

    try:
        units, range_spec = range_header.split("=", 1)
        if units != "bytes":
            raise ValueError("Invalid range unit")
        start_str, end_str = range_spec.split("-", 1)
        start = int(start_str) if start_str else 0
        end = int(end_str) if end_str else file_size - 1
        if start > end or end >= file_size:
            raise ValueError("Invalid range bounds")
    except ValueError:
        raise HTTPException(status_code=416, detail="Invalid Range header")

    chunk_size = end - start + 1

    def file_iterator():
        with file_path.open("rb") as f:
            f.seek(start)
            remaining = chunk_size
            while remaining > 0:
                read_size = min(64 * 1024, remaining)
                data = f.read(read_size)
                if not data:
                    break
                remaining -= len(data)
                yield data

    headers = {
        "Accept-Ranges": "bytes",
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Content-Length": str(chunk_size),
    }
    return StreamingResponse(file_iterator(), status_code=206, media_type=media_type, headers=headers)


@app.get("/api/authors")
def list_authors(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    subscribed_ids = {s.author_id for s in current_user.subscriptions}
    authors = db.query(User).filter(User.id != current_user.id, User.is_verified.is_(True)).all()
    return [
        {
            "id": author.id,
            "display_name": author.display_name,
            "email": author.email,
            "subscribed": author.id in subscribed_ids,
        }
        for author in authors
    ]


@app.post("/api/authors/{author_id}/subscribe")
def subscribe(author_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if author_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot subscribe to yourself")

    author = db.query(User).filter(User.id == author_id, User.is_verified.is_(True)).first()
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")

    exists = (
        db.query(Subscription)
        .filter(Subscription.subscriber_id == current_user.id, Subscription.author_id == author_id)
        .first()
    )
    if exists:
        db.delete(exists)
        db.commit()
        return {"message": "Unsubscribed"}

    sub = Subscription(subscriber_id=current_user.id, author_id=author_id)
    db.add(sub)
    db.commit()
    return {"message": "Subscribed"}


app.mount("/", StaticFiles(directory="static", html=True), name="static")
