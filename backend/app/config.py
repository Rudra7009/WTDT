from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "BMRS Wind Forecast Intelligence Portal"
    API_V1_STR: str = "/api/v1"
    ELEXON_BASE_URL: str = "https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets"
    ELEXON_API_KEY: Optional[str] = None
    DEFAULT_AUCTION_GATE_HOUR: int = 11  # 11:00 AM GMT on Day D-1
    NOMINAL_WIND_CAPACITY_MW: float = 30000.0  # Approx UK Wind Fleet capacity in MW

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
