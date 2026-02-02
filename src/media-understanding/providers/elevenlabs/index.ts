import type { MediaUnderstandingProvider } from "../../types.js";
import { transcribeElevenLabsAudio } from "./audio.js";

export const elevenlabsProvider: MediaUnderstandingProvider = {
  id: "elevenlabs",
  capabilities: ["audio"],
  transcribeAudio: transcribeElevenLabsAudio,
};
