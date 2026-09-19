from dataclasses import dataclass


class ModelNotReadyError(Exception):
    pass


class InvalidModelCredentialError(Exception):
    pass


@dataclass
class IndicTrans2Model:
    model_id: str
    source_language: str
    target_language: str
    hf_token: str | None = None
    tokenizer: object | None = None
    model: object | None = None
    processor: object | None = None

    def load(self) -> None:
        from IndicTransToolkit import IndicProcessor
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

        load_options = {"trust_remote_code": True}
        if self.hf_token:
            token = self.hf_token.strip()
            if not token.startswith("hf_") or any(ord(character) < 33 or ord(character) > 126 for character in token):
                raise InvalidModelCredentialError(
                    "HF_TOKEN must be a plain Hugging Face token beginning with hf_."
                )
            load_options["token"] = token

        self.tokenizer = AutoTokenizer.from_pretrained(self.model_id, **load_options)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(self.model_id, **load_options)
        self.model.eval()
        self.processor = IndicProcessor(inference=True)

    @property
    def ready(self) -> bool:
        return self.tokenizer is not None and self.model is not None and self.processor is not None

    def translate(self, text: str) -> str:
        if not self.ready:
            raise ModelNotReadyError("Translation model is not ready.")

        import torch

        batch = self.processor.preprocess_batch(
            [text],
            src_lang=self.source_language,
            tgt_lang=self.target_language,
        )
        inputs = self.tokenizer(batch, truncation=True, padding="longest", return_tensors="pt")
        with torch.inference_mode():
            generated = self.model.generate(
                **inputs,
                use_cache=True,
                min_length=0,
                max_length=256,
                num_beams=5,
                num_return_sequences=1,
            )
        decoded = self.tokenizer.batch_decode(generated, skip_special_tokens=True)
        translated = self.processor.postprocess_batch(decoded, lang=self.target_language)
        return translated[0].strip()
