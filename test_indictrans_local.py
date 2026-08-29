from pathlib import Path
import time

import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from IndicTransToolkit import IndicProcessor


PROJECT_ROOT = Path(__file__).resolve().parent
MODEL_DIR = PROJECT_ROOT / "models" / "indictrans2-en-indic-dist-200M"

SOURCE_LANGUAGE = "eng_Latn"
TARGET_LANGUAGE = "mar_Deva"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

SENTENCES = [
    "Hello, how are you?",
    "Please close the door.",
    "I went to the market yesterday.",
]


def main():
    if not MODEL_DIR.exists():
        raise FileNotFoundError(
            f"Model folder was not found:\n{MODEL_DIR}\n"
            "Check that the script is in your project root."
        )

    print(f"Device: {DEVICE}")
    print(f"Model path: {MODEL_DIR}")
    print("Loading tokenizer and model...")
    load_start = time.perf_counter()

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

    load_seconds = time.perf_counter() - load_start
    print(f"Model load time: {load_seconds:.2f} seconds")

    prepared_sentences = processor.preprocess_batch(
        SENTENCES,
        src_lang=SOURCE_LANGUAGE,
        tgt_lang=TARGET_LANGUAGE,
    )

    inputs = tokenizer(
        prepared_sentences,
        truncation=True,
        padding="longest",
        max_length=256,
        return_tensors="pt",
        return_attention_mask=True,
    ).to(DEVICE)

    translation_start = time.perf_counter()

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

    translations = processor.postprocess_batch(
        decoded_tokens,
        lang=TARGET_LANGUAGE,
    )

    translation_ms = (time.perf_counter() - translation_start) * 1000

    print(f"Translation latency: {translation_ms:.2f} ms")
    print("\nResults:")
    print("-" * 60)

    for original, translation in zip(SENTENCES, translations):
        print(f"English: {original}")
        print(f"Standard Marathi: {translation}")
        print("-" * 60)


if __name__ == "__main__":
    main()