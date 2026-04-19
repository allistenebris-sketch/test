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

## Важно

Сейчас email-коды и reset token отдаются в ответе API в debug-полях (для self-hosted разработки без SMTP). Для production замените на отправку почты через SMTP/API провайдера.


Пароли хешируются через PBKDF2-HMAC-SHA256 (без зависимости от passlib/bcrypt backend).

Для проигрывания треков в `<audio>` используется `GET /api/tracks/{id}/stream?token=...`, так как браузерный аудиоплеер не умеет добавлять `Authorization` header.

Все настройки (название приложения, JWT secret, DB URL, директория загрузок и параметры PBKDF2) вынесены в `.env` через `app/config.py`.
