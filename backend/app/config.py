from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    model_id: str = os.getenv("MODEL_ID", "ai4bharat/indictrans2-en-indic-dist-200M")
    model_version: str = os.getenv("MODEL_VERSION", "base-v1")
    hf_token: str | None = os.getenv("HF_TOKEN") or None
    source_language: str = os.getenv("SOURCE_LANGUAGE", "eng_Latn")
    target_language: str = os.getenv("TARGET_LANGUAGE", "mar_Deva")
    daily_translation_limit: int = int(os.getenv("DAILY_TRANSLATION_LIMIT", "20"))
    max_input_characters: int = int(os.getenv("MAX_INPUT_CHARACTERS", "500"))
    allowed_origins: tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv("ALLOWED_ORIGIN", "http://localhost:5173").split(",")
        if origin.strip()
    )
