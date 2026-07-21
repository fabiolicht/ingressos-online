from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://catalog:catalog@localhost:5434/catalog"
    redis_url: str = "redis://localhost:6379/0"
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"
    internal_api_key: str = "dev-internal-key"
    cache_ttl_seconds: int = 60

    class Config:
        env_file = ".env"


settings = Settings()
