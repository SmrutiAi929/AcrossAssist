# Audio Configuration for Gemini Live API

This document contains the audio configuration used in this project to enable seamless agent speech.

## Voice Configuration

### Current Voice Setting
- **Voice Name**: `Kore` (Female voice)
- **Voice Type**: Prebuilt Voice Config

### Available Voice Options
The following voices are available in the Gemini Live API:
- `Puck`
- `Charon`
- `Kore` (currently used - female voice)
- `Fenrir`
- `Aoede`

## Audio Settings

### Sample Rate
- **Sample Rate**: 24000 Hz (24 kHz)

### Audio Format
- **Format**: PCM16 (16-bit Pulse Code Modulation)
- **Channels**: Mono (1 channel)
- **Buffer Size**: 7680 samples

### Response Modality
- **Modality**: `AUDIO` (audio-only responses)

## Configuration Code Example

Here's the exact configuration used in this project:

```typescript
import { Modality } from "@google/genai";

const config = {
  responseModalities: [Modality.AUDIO],
  speechConfig: {
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: "Kore", // Female voice
      },
    },
  },
  systemInstruction: {
    parts: [
      {
        text: "You are a friendly and professional female healthcare care navigator assistant. Always speak in a warm, caring, and professional female tone. Be empathetic, clear, and helpful in all your interactions.",
      },
    ],
  },
};
```

## Audio Streaming Implementation

### Key Components

1. **Audio Streamer** (`src/lib/audio-streamer.ts`)
   - Handles PCM16 audio chunks
   - Converts PCM16 to Float32Array for Web Audio API
   - Manages audio queue and playback scheduling
   - Sample rate: 24000 Hz

2. **Audio Processing** (`src/lib/worklets/audio-processing.ts`)
   - Processes audio chunks in real-time

3. **Volume Meter** (`src/lib/worklets/vol-meter.ts`)
   - Monitors audio output volume

## How to Use in Your Project

### Step 1: Set Voice Configuration

```typescript
import { LiveConnectConfig, Modality } from "@google/genai";

const config: LiveConnectConfig = {
  responseModalities: [Modality.AUDIO],
  speechConfig: {
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: "Kore", // Change to any available voice
      },
    },
  },
};
```

### Step 2: Handle Audio Responses

The Gemini Live API returns audio as base64-encoded PCM16 data. You need to:
1. Decode the base64 audio data
2. Convert PCM16 to a format your audio system can play
3. Stream the audio chunks for seamless playback

### Step 3: Audio Playback

For seamless audio playback, you'll need:
- **Sample Rate**: 24000 Hz
- **Format**: PCM16 (16-bit, little-endian)
- **Channels**: Mono
- **Buffer Management**: Queue audio chunks and schedule playback ahead of time

## Example: Complete Configuration

```typescript
// Initialize Gemini Live API client
const client = new GoogleGenAI({ apiKey: YOUR_API_KEY });

// Connect with audio configuration
const session = await client.live.connect({
  model: "models/gemini-2.0-flash-exp",
  config: {
    responseModalities: [Modality.AUDIO],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: "Kore", // Female voice for seamless speech
        },
      },
    },
    systemInstruction: {
      parts: [
        {
          text: "You are a friendly and professional assistant. Speak naturally and clearly.",
        },
      ],
    },
  },
  callbacks: {
    onmessage: (message) => {
      // Handle audio chunks from message.serverContent.modelTurn.parts
      // Look for parts with mimeType: "audio/pcm"
    },
  },
});
```

## Notes

- The **Kore** voice provides a natural, female-sounding voice that works well for conversational AI
- Audio is streamed in real-time as PCM16 chunks
- For best results, implement proper audio buffering to avoid gaps or stuttering
- The sample rate of 24000 Hz is standard for the Gemini Live API audio output

## Changing the Voice

To use a different voice, simply change the `voiceName` in the configuration:

```typescript
prebuiltVoiceConfig: {
  voiceName: "Puck", // or "Charon", "Fenrir", "Aoede"
}
```

Each voice has its own characteristics:
- **Kore**: Female voice (current default)
- **Puck**: Available option
- **Charon**: Available option
- **Fenrir**: Available option
- **Aoede**: Available option

