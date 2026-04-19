import smtplib
from email.message import EmailMessage

from .config import settings


def _send_email(recipient: str, subject: str, body: str) -> None:
    if not settings.smtp_enabled:
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from_email
    msg["To"] = recipient
    msg.set_content(body)

    if settings.smtp_use_ssl:
        with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=20) as server:
            if settings.smtp_username:
                server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)
        return

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_username:
            server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(msg)


def send_verification_code(email: str, code: str) -> None:
    subject = "SLFox Music: код подтверждения"
    body = (
        "Ваш код подтверждения для SLFox Music:\n\n"
        f"{code}\n\n"
        "Код действует 15 минут."
    )
    _send_email(email, subject, body)


def send_password_reset_token(email: str, token: str) -> None:
    subject = "SLFox Music: восстановление пароля"
    body = (
        "Токен для восстановления пароля:\n\n"
        f"{token}\n\n"
        "Токен действует 30 минут."
    )
    _send_email(email, subject, body)
