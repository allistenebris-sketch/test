from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SLFox Music"
    secret_key: str = "change-this-secret-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    database_url: str = "sqlite:///./music_service.db"
    upload_dir: str = "uploads"

    cors_allow_origins: list[str] = ["*"]

    pbkdf2_alg: str = "sha256"
    pbkdf2_iterations: int = 390000
    pbkdf2_salt_bytes: int = 16

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
