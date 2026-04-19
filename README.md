# SLFox Music (self-hosted FastAPI)

Многопользовательский сервис для прослушивания музыки в стиле стримингового каталога:
- регистрация и логин;
- подтверждение email кодом;
- восстановление пароля;
- загрузка и стриминг музыки;
- подписка на авторов;
- многостраничный web-интерфейс (`/index.html`, `/tracks.html`, `/authors.html`, `/upload.html`) с плеером и нижним тулбаром.
- отдельное popup-окно восстановления пароля (`/password-reset.html`) и возможность запросить новый email-код.
- современный адаптивный UI в стиле glassmorphism.

## Запуск

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Откройте `http://127.0.0.1:8000`.

## SMTP отправка кодов

Для отправки verification/reset писем настройте `.env`:

- `SMTP_ENABLED=true`
- `SMTP_HOST`, `SMTP_PORT`
- `SMTP_USERNAME`, `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`
- `SMTP_USE_TLS=true` (или `SMTP_USE_SSL=true`)

Коды подтверждения и reset token будут отправляться на email через SMTP.

## Важно

По умолчанию `DEBUG_RETURN_CODES=true`, поэтому коды также возвращаются в debug-полях API для dev-режима. Для production установите `DEBUG_RETURN_CODES=false`.


Пароли хешируются через PBKDF2-HMAC-SHA256 (без зависимости от passlib/bcrypt backend).

Для проигрывания треков в `<audio>` используется `GET /api/tracks/{id}/stream?token=...`, так как браузерный аудиоплеер не умеет добавлять `Authorization` header.

Все настройки (название приложения, JWT secret, DB URL, директория загрузок и параметры PBKDF2) вынесены в `.env` через `app/config.py`.
