from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True)

    DATABASE_URL: str

    # One-time admin setup code (required to create the first admin)
    ADMIN_SETUP_CODE: str

    # Used to encrypt email credentials stored in DB (AES-GCM)
    EMAIL_CRED_SECRET: str

    # Session cookie signing-ish secret (we store session id server-side, but still need a secret for future-proofing)
    SESSION_COOKIE_NAME: str = "lm_session"
    SESSION_TTL_DAYS: int = 14

    # Render/Proxy
    TRUST_PROXY_HEADERS: bool = True

    # Frontend build dir (served by backend)
    FRONTEND_DIST_DIR: str = "../frontend/dist"


settings = Settings()