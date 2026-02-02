import type { AudioTranscriptionRequest, AudioTranscriptionResult } from "../../types.js";
import { fetchWithTimeout, normalizeBaseUrl, readErrorResponse } from "../shared.js";

export const DEFAULT_ELEVENLABS_STT_BASE_URL = "https://api.elevenlabs.io/v1";
export const DEFAULT_ELEVENLABS_STT_MODEL = "scribe_v2";

function resolveModel(model?: string): string {
  const trimmed = model?.trim();
  return trimmed || DEFAULT_ELEVENLABS_STT_MODEL;
}

type ElevenLabsTranscriptResponse = {
  text?: string;
  language_code?: string;
  language_probability?: number;
  words?: Array<{
    text: string;
    start: number;
    end: number;
    type: string;
    speaker_id?: string;
  }>;
};

export async function transcribeElevenLabsAudio(
  params: AudioTranscriptionRequest,
): Promise<AudioTranscriptionResult> {
  const fetchFn = params.fetchFn ?? fetch;
  const baseUrl = normalizeBaseUrl(params.baseUrl, DEFAULT_ELEVENLABS_STT_BASE_URL);
  const model = resolveModel(params.model);
  const url = `${baseUrl}/speech-to-text`;

  const form = new FormData();
  const bytes = new Uint8Array(params.buffer);
  const blob = new Blob([bytes], {
    type: params.mime ?? "application/octet-stream",
  });
  form.append("file", blob, params.fileName || "audio");
  form.append("model_id", model);

  if (params.language?.trim()) {
    form.append("language_code", params.language.trim());
  }

  const headers = new Headers(params.headers);
  if (!headers.has("xi-api-key")) {
    headers.set("xi-api-key", params.apiKey);
  }

  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers,
      body: form,
    },
    params.timeoutMs,
    fetchFn,
  );

  if (!res.ok) {
    const detail = await readErrorResponse(res);
    const suffix = detail ? `: ${detail}` : "";
    throw new Error(`ElevenLabs audio transcription failed (HTTP ${res.status})${suffix}`);
  }

  const payload = (await res.json()) as ElevenLabsTranscriptResponse;
  const text = payload.text?.trim();
  if (!text) {
    throw new Error("ElevenLabs audio transcription response missing text");
  }
  return { text, model };
}
