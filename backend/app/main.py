from contextlib import asynccontextmanager
from time import perf_counter

import firebase_admin
from fastapi import FastAPI, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from firebase_admin import firestore

from .auth import AuthenticationError, verify_bearer_token
from .config import Settings
from .model import IndicTrans2Model, ModelNotReadyError
from .quota import FirestoreUsageStore, QuotaExceededError, UsageStore


class TranslationRequest(BaseModel):
    text: str = Field(min_length=1)


class UnavailableUsageStore:
    def reserve(self, _: str):
        raise RuntimeError("Firestore usage storage is unavailable.")


def create_app(
    settings: Settings | None = None,
    model: IndicTrans2Model | None = None,
    usage_store: UsageStore | None = None,
    load_model: bool = True,
) -> FastAPI:
    config = settings or Settings()
    translation_model = model or IndicTrans2Model(
        config.model_id,
        config.source_language,
        config.target_language,
        config.hf_token,
    )

    if usage_store is None:
        try:
            if not firebase_admin._apps:
                firebase_admin.initialize_app()
            usage_store = FirestoreUsageStore(firestore.client(), config.daily_translation_limit)
        except Exception:
            usage_store = UnavailableUsageStore()

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        if load_model and not translation_model.ready:
            translation_model.load()
        yield

    app = FastAPI(title="Thanjavur Marathi Translation API", lifespan=lifespan)
    app.state.settings = config
    app.state.translation_model = translation_model
    app.state.usage_store = usage_store

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(config.allowed_origins),
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.exception_handler(AuthenticationError)
    async def authentication_error_handler(_: Request, exc: AuthenticationError):
        return JSONResponse(status_code=401, content={"error": {"code": "unauthorized", "message": str(exc)}})

    @app.exception_handler(QuotaExceededError)
    async def quota_error_handler(_: Request, exc: QuotaExceededError):
        return JSONResponse(status_code=429, content={"error": {"code": "daily_limit_reached", "message": str(exc)}})

    @app.exception_handler(ModelNotReadyError)
    async def model_not_ready_handler(_: Request, exc: ModelNotReadyError):
        return JSONResponse(status_code=503, content={"error": {"code": "model_not_ready", "message": str(exc)}})

    @app.exception_handler(RuntimeError)
    async def runtime_error_handler(_: Request, exc: RuntimeError):
        return JSONResponse(status_code=500, content={"error": {"code": "backend_failure", "message": "The translation service is unavailable right now."}})

    @app.get("/health")
    async def health():
        return {"status": "ok", "modelReady": translation_model.ready}

    @app.post("/translate")
    async def translate(payload: TranslationRequest, authorization: str | None = Header(default=None)):
        text = payload.text.strip()
        if not text:
            return JSONResponse(status_code=400, content={"error": {"code": "invalid_text", "message": "Text must not be empty."}})
        if len(text) > config.max_input_characters:
            return JSONResponse(status_code=400, content={"error": {"code": "text_too_long", "message": f"Text must be {config.max_input_characters} characters or fewer."}})

        if not translation_model.ready:
            raise ModelNotReadyError("Translation model is not ready.")

        uid = verify_bearer_token(authorization)
        usage = app.state.usage_store.reserve(uid)
        started = perf_counter()
        translation = translation_model.translate(text)
        _ = perf_counter() - started
        return {
            "translation": translation,
            "modelVersion": config.model_version,
            "usage": usage,
        }

    return app


app = create_app()
