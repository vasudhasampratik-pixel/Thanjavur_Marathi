import * as fs from 'node:fs';
import * as path from 'node:path';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';

interface FeedbackRow {
  source_english: string;
  speaker_profile: string;
  sentence_family: string;
  model_target_tm_romanized: string;
  corrected_target_tm_romanized: string;
  source_id: string;
  reviewer_id?: string;
  timestamp: string;
}

const PORT = Number(process.env.FEEDBACK_PORT || 4317);
const OUT_PATH = path.join(process.cwd(), 'src', 'data', 'processed', 'feedback_gold.jsonl');

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function writeJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function isValidRow(row: Partial<FeedbackRow>): row is FeedbackRow {
  return Boolean(
    row.source_english &&
      row.speaker_profile &&
      row.sentence_family &&
      row.model_target_tm_romanized &&
      row.corrected_target_tm_romanized &&
      row.source_id &&
      row.timestamp,
  );
}

function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('payload_too_large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    writeJson(res, 204, { ok: true });
    return;
  }

  if (req.method !== 'POST' || req.url !== '/feedback') {
    writeJson(res, 404, { ok: false, error: 'not_found' });
    return;
  }

  try {
    const raw = await parseBody(req);
    const parsed = JSON.parse(raw) as Partial<FeedbackRow>;

    const row: Partial<FeedbackRow> = {
      source_english: normalize(parsed.source_english ?? ''),
      speaker_profile: normalize(parsed.speaker_profile ?? ''),
      sentence_family: normalize(parsed.sentence_family ?? ''),
      model_target_tm_romanized: normalize(parsed.model_target_tm_romanized ?? ''),
      corrected_target_tm_romanized: normalize(parsed.corrected_target_tm_romanized ?? ''),
      source_id: normalize(parsed.source_id ?? ''),
      reviewer_id: parsed.reviewer_id ? normalize(parsed.reviewer_id) : undefined,
      timestamp: new Date().toISOString(),
    };

    if (!isValidRow(row)) {
      writeJson(res, 400, { ok: false, error: 'invalid_payload' });
      return;
    }

    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.appendFileSync(OUT_PATH, JSON.stringify(row) + '\n', 'utf-8');
    writeJson(res, 200, { ok: true, path: OUT_PATH });
  } catch (error) {
    writeJson(res, 400, { ok: false, error: (error as Error).message || 'bad_request' });
  }
});

server.listen(PORT, () => {
  console.log(`Feedback server listening at http://localhost:${PORT}`);
  console.log(`Writing corrections to: ${OUT_PATH}`);
});
