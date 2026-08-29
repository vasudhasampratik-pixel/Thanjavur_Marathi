interface IndicTransApiResponse {
  originalInput?: string;
  romanisedText?: string;
  devanagariText?: string;
  latencyMs?: number;
  error?: string;
}

export interface IndicTransTranslation {
  originalInput: string;
  romanisedText: string;
  devanagariText: string;
  latencyMs: number;
}

const INDIC_TRANS_API_URL = (import.meta.env.VITE_INDICTRANS_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export async function translateWithIndicTrans(input: string): Promise<IndicTransTranslation> {
  const startedAt = performance.now();
  const response = await fetch(`${INDIC_TRANS_API_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: input }),
  });

  const data = await response.json().catch(() => ({})) as IndicTransApiResponse;

  if (!response.ok) {
    throw new Error(data.error || `IndicTrans2 request failed with status ${response.status}`);
  }

  return {
    originalInput: data.originalInput || input,
    romanisedText: data.romanisedText || '',
    devanagariText: data.devanagariText || '',
    latencyMs: data.latencyMs ?? Math.round(performance.now() - startedAt),
  };
}