from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import time

import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from IndicTransToolkit import IndicProcessor


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = Path(os.environ.get("INDICTRANS_MODEL_DIR", PROJECT_ROOT / "models" / "indictrans2-en-indic-dist-200M"))
HOST = os.environ.get("INDICTRANS_HOST", "127.0.0.1")
PORT = int(os.environ.get("INDICTRANS_PORT", "8000"))
SOURCE_LANGUAGE = "eng_Latn"
TARGET_LANGUAGE = "mar_Deva"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

tokenizer = None
model = None
processor = None


def load_model_once():
    global tokenizer, model, processor

    if tokenizer is not None and model is not None and processor is not None:
        return

    if not MODEL_DIR.exists():
        raise FileNotFoundError(f"IndicTrans2 model folder was not found: {MODEL_DIR}")

    tokenizer = AutoTokenizer.from_pretrained(
        str(MODEL_DIR),
        trust_remote_code=True,
        local_files_only=True,
    )
    model = AutoModelForSeq2SeqLM.from_pretrained(
        str(MODEL_DIR),
        trust_remote_code=True,
        local_files_only=True,
        torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
    ).to(DEVICE)
    model.eval()
    processor = IndicProcessor(inference=True)


def translate_text(text):
    load_model_once()

    prepared = processor.preprocess_batch(
        [text],
        src_lang=SOURCE_LANGUAGE,
        tgt_lang=TARGET_LANGUAGE,
    )
    inputs = tokenizer(
        prepared,
        truncation=True,
        padding="longest",
        max_length=256,
        return_tensors="pt",
        return_attention_mask=True,
    ).to(DEVICE)

    with torch.inference_mode():
        generated_tokens = model.generate(
            **inputs,
            use_cache=True,
            min_length=0,
            max_length=256,
            num_beams=5,
            num_return_sequences=1,
        )

    with tokenizer.as_target_tokenizer():
        decoded_tokens = tokenizer.batch_decode(
            generated_tokens.detach().cpu().tolist(),
            skip_special_tokens=True,
            clean_up_tokenization_spaces=True,
        )

    return processor.postprocess_batch(decoded_tokens, lang=TARGET_LANGUAGE)[0]


class IndicTransHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if self.path != "/health":
            self.send_json({"error": "Not found"}, status=404)
            return

        self.send_json({"ok": True, "device": DEVICE, "modelDir": str(MODEL_DIR)})

    def do_POST(self):
        if self.path != "/translate":
            self.send_json({"error": "Not found"}, status=404)
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(content_length) or b"{}")
            text = str(payload.get("text", "")).strip()

            if not text:
                self.send_json({"error": "Field 'text' is required."}, status=400)
                return

            started_at = time.perf_counter()
            translation = translate_text(text)
            self.send_json({
                "originalInput": text,
                "devanagariText": translation,
                "romanisedText": "",
                "source": "indictrans2",
                "latencyMs": round((time.perf_counter() - started_at) * 1000),
            })
        except Exception as error:
            self.send_json({"error": str(error)}, status=500)

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    load_model_once()
    server = ThreadingHTTPServer((HOST, PORT), IndicTransHandler)
    print(f"IndicTrans2 server running at http://{HOST}:{PORT}")
    print(f"Device: {DEVICE}")
    print(f"Model path: {MODEL_DIR}")
    server.serve_forever()


if __name__ == "__main__":
    main()