# Self-hosted music service (FastAPI)

Многопользовательский сервис для прослушивания музыки в стиле стримингового каталога:
- регистрация и логин;
- подтверждение email кодом;
- восстановление пароля;
- загрузка и стриминг музыки;
- подписка на авторов;
- web-интерфейс с плеером и нижним тулбаром.

## Запуск

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Откройте `http://127.0.0.1:8000`.

## Важно

Сейчас email-коды и reset token отдаются в ответе API в debug-полях (для self-hosted разработки без SMTP). Для production замените на отправку почты через SMTP/API провайдера.
