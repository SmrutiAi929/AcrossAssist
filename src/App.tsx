/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useRef, useState, useEffect, useCallback, useMemo, createContext, useContext } from "react";
import "./App.scss";
import { LiveAPIProvider, useLiveAPIContext } from "./contexts/LiveAPIContext";
import HMSHeader from "./components/hms-header/HMSHeader";
import Transcript from "./components/transcript/Transcript";
import DataCollectionCenter from "./components/data-collection-center/DataCollectionCenter";
import BottomToolbar from "./components/bottom-toolbar/BottomToolbar";
import ControlTray from "./components/control-tray/ControlTray";
import cn from "classnames";
import { LiveClientOptions } from "./types";
import { Modality, FunctionDeclaration, Type } from "@google/genai";
import { sampleTowingCase } from "./agents/sampleData";
import { AudioRecorder } from "./lib/audio-recorder";
import { base64ToArrayBuffer } from "./lib/utils";
import { useLoggerStore } from "./lib/store-logger";

// Context for sharing case data
export interface CaseData {
  vendorLocation: string | null;
  vehicleName: string | null;
  issueType: string | null;
  kms: string | null;
  pickupLocation: string | null;
  dropLocation: string | null;
  caseNumber: string | null;
  status: "Accepted" | "Rejected" | "Pending";
}

interface CaseContextType {
  caseData: CaseData;
  setCaseData: React.Dispatch<React.SetStateAction<CaseData>>;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export const useCaseData = () => {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error("useCaseData must be used within CaseProvider");
  }
  return context;
};

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const apiOptions: LiveClientOptions = {
  apiKey: API_KEY,
};

// Function declaration for capturing towing case data
const updateCaseStatusTool: FunctionDeclaration = {
  name: "update_case_status",
  description: "Updates the status of the breakdown case during the conversation. Call this whenever the vendor accepts or rejects the case.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      status: {
        type: Type.STRING,
        enum: ["Accepted", "Rejected"],
        description: "The final status of the case as decided by the vendor."
      }
    },
    required: ["status"]
  }
};

type SessionStatus = "CONNECTED" | "DISCONNECTED" | "CONNECTING";

function AppContent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [userText, setUserText] = useState("");
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("DISCONNECTED");
  const [preferredLanguage, setPreferredLanguage] = useState<string>("English");
  const [scenario, setScenario] = useState<string>("Towing");
  const [agent, setAgent] = useState<string>("acrossAssistBot");
  const [isPTTActive, setIsPTTActive] = useState<boolean>(false);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState<boolean>(false);
  const [isEventsPaneExpanded, setIsEventsPaneExpanded] = useState<boolean>(true);
  const [isAudioPlaybackEnabled, setIsAudioPlaybackEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('audioPlaybackEnabled');
    return stored ? stored === 'true' : true;
  });
  const [codec, setCodec] = useState<string>("opus");

  // Case data state
  const [caseData, setCaseData] = useState<CaseData>({
    vendorLocation: sampleTowingCase.vendor_location,
    vehicleName: sampleTowingCase.vehicle_name,
    issueType: sampleTowingCase.issue_type,
    kms: sampleTowingCase.KMS,
    pickupLocation: sampleTowingCase.pickup_location,
    dropLocation: sampleTowingCase.drop_location,
    caseNumber: sampleTowingCase.case_number,
    status: "Pending",
  });

  // Audio recording state for download
  const aiAudioChunksRef = useRef<ArrayBuffer[]>([]); // AI audio at 24 kHz
  const userAudioChunksRef = useRef<ArrayBuffer[]>([]); // User audio at 16 kHz
  const audioRecorderRef = useRef<AudioRecorder | null>(null);

  const { connected, connect, disconnect, client, model, config, setConfig, setModel } = useLiveAPIContext();
  const configInitialized = useRef<boolean>(false);
  const greetingSent = useRef<boolean>(false);

  // Initialize model
  useEffect(() => {
    if (!model || model === "") {
      setModel("models/gemini-2.5-flash-native-audio-preview-09-2025");
    }
  }, [model, setModel]);

  // Initialize agent configuration with female voice and tone
  useEffect(() => {
    // Only initialize once if voice is not already configured
    if (!configInitialized.current) {
      const currentVoice = config.speechConfig?.voiceConfig?.prebuiltVoiceConfig?.voiceName;
      if (!currentVoice) {
        // Across Assist Towing Service Instructions
        const towingInstructions = `
# Across Assist Voice Agent System Instructions - Towing Service

## Overview
You are an AI-powered Dispatch Voice Agent for Across Assist. Your goal is to inform a service vendor about a vehicle breakdown and obtain their confirmation to accept the case. You should be professional, clear, and direct.

---

## 1. Role & Persona
- Name: Across Assist Dispatch Bot
- Tone: Professional, helpful, and efficient.
- **Accent & Voice**: Always speak in a warm, helpful, and professional female tone with a clear **Indian English accent**. 
- **Natural Speech Guidelines**:
    - Use standard Indian English pronunciation and intonation.
    - Speak naturally with human-like pauses and breathing - don't rush.
    - Vary your pace: slightly slower when providing location details, natural pace elsewhere.
    - Use natural emphasis on important words like "Audi A4", "Engine Failure", and the "Case Number".
    - Avoid a robotic tone; sound genuinely helpful like a real dispatch operator.
- Goal: present breakdown details and get a definitive "Accept" or "Reject" response.

---

## 2. Interaction Flow

### Stage 1: Initial Greeting & Case Briefing
Start the call by introducing yourself and providing the breakdown overview using exactly this prompt:
"Hello, this call is from Across Assist. A breakdown has been registered in your area at ${sampleTowingCase.vendor_location}. A ${sampleTowingCase.vehicle_name} requires towing service due to a ${sampleTowingCase.issue_type}. The total distance is ${sampleTowingCase.KMS} kilometer, with the breakdown located at ${sampleTowingCase.pickup_location} and the drop-off at ${sampleTowingCase.drop_location}. Would you like to accept this case? Please say yes or no."

### Stage 2: Handling Intent
Listen carefully to the user's response:
- IF YES (Accept): Proceed to Stage 3: Success Confirmation.
- IF NO (Reject): Say "Thank you for your time. Have a nice day." and end the call.
- IF REPEAT / CONFUSION: Rephrase the details: "Sure, let me repeat that. Hello, this call is from Across Assist... [Repeat Briefing]. Do you accept this case?"
- IF HUMAN AGENT REQUEST: Say "Connecting you to a specialist now. Please stay on the line."

### Stage 3: Success Confirmation (Case Assigned)
Once the user accepts, provide the final confirmation:
"Congratulations, this case (Number: ${sampleTowingCase.case_number}) has been assigned to you. We are sharing the case details to your registered number via SMS shortly. If you have any concerns, you can call us back on 9999999999. Please remember to bring the VCRF form and take clear photos of the vehicle at both pickup and drop-off points. Thank you!"

---

## 3. Communication Guidelines (Natural Language)
- Wait for Input: After asking "Would you like to accept this case?", wait for the user to speak.
- Confirm Vague Responses: If the user says "Okay" or "Sure", confirm with: "Great, just to be sure, are you accepting this case?"
- Handle Delays: If the user is silent for more than 5 seconds, say: "I haven't heard from you. Would you like to accept this breakdown case or should I move to the next vendor?"

---

## 4. Error Handling
- Wrong Input/Gibberish: "I'm sorry, I didn't quite catch that. Would you like to accept this case? You can say 'Yes' to accept or 'No' to reject."
- Persistent Error (3rd attempt): "You have delayed accepting the case. Thank you, have a nice day." (End call).
- System Error: "There was an error in processing your acceptance. Let me connect you with an agent to assist you further."
`;

        setConfig({
          ...config,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Kore", // Friendly female voice
              },
            },
          },
          tools: [
            { functionDeclarations: [updateCaseStatusTool] }
          ],
          systemInstruction: {
            parts: [{ text: towingInstructions }],
          },
        });
      }
      configInitialized.current = true;
    }
  }, [config, setConfig]);

  // Update session status based on connection
  useEffect(() => {
    if (connected) {
      setSessionStatus("CONNECTED");
    } else {
      setSessionStatus("DISCONNECTED");
      greetingSent.current = false; // Reset when disconnected
    }
  }, [connected]);

  // Listen for setupcomplete event and send greeting
  useEffect(() => {
    if (!client) return;

    const onSetupComplete = () => {
      if (!greetingSent.current) {
        greetingSent.current = true;
        // Send a message to trigger the agent's greeting response
        // The system instruction will guide the agent to greet
        setTimeout(() => {
          client.send([{ text: "hello" }]);
        }, 300);
      }
    };

    client.on("setupcomplete", onSetupComplete);

    return () => {
      client.off("setupcomplete", onSetupComplete);
    };
  }, [client]);

  // Listen for tool calls to capture appointment data
  useEffect(() => {
    if (!client) return;

    const onToolCall = (toolCall: any) => {
      console.log("🔧 Tool call received:", toolCall);

      if (!toolCall.functionCalls) {
        return;
      }

      const captureCall = toolCall.functionCalls.find(
        (fc: any) => fc.name === "update_case_status"
      );

      if (captureCall && captureCall.args) {
        console.log("📊 Capturing appointment data:", captureCall.args);

        // Update case data with new information
        setCaseData((prev) => ({
          ...prev,
          status: captureCall.args.status || prev.status,
        }));
      }

      // Send response back to acknowledge the tool call
      if (toolCall.functionCalls.length) {
        setTimeout(() => {
          client.sendToolResponse({
            functionResponses: toolCall.functionCalls.map((fc: any) => ({
              response: {
                output: {
                  success: true,
                  message: "Data captured successfully"
                }
              },
              id: fc.id,
              name: fc.name,
            })),
          });
        }, 100);
      }
    };

    client.on("toolcall", onToolCall);

    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client]);

  // Listen for log events to populate transcript
  useEffect(() => {
    if (!client) return;

    const { log } = useLoggerStore.getState();

    const onLog = (streamingLog: any) => {
      log(streamingLog);
    };

    client.on("log", onLog);

    return () => {
      client.off("log", onLog);
    };
  }, [client]);

  // Initialize audio recorder for user audio capture
  useEffect(() => {
    if (!audioRecorderRef.current) {
      audioRecorderRef.current = new AudioRecorder(16000);
    }
  }, []);

  // Capture AI audio chunks for download
  useEffect(() => {
    if (!client) return;

    const onAudio = (audioData: ArrayBuffer) => {
      // Store AI audio chunks (24 kHz PCM16)
      aiAudioChunksRef.current.push(audioData);
    };

    client.on("audio", onAudio);

    return () => {
      client.off("audio", onAudio);
    };
  }, [client]);

  // Capture user audio chunks for download
  useEffect(() => {
    if (!audioRecorderRef.current) return;

    if (connected) {
      const onUserAudio = (base64Audio: string) => {
        // Convert base64 to ArrayBuffer and store user audio (16 kHz PCM16)
        try {
          const arrayBuffer = base64ToArrayBuffer(base64Audio);
          userAudioChunksRef.current.push(arrayBuffer);
        } catch (error) {
          console.error("Error capturing user audio:", error);
        }
      };

      audioRecorderRef.current.on("data", onUserAudio);
      audioRecorderRef.current.start().catch((error) => {
        console.error("Error starting audio recorder:", error);
      });

      return () => {
        audioRecorderRef.current?.off("data", onUserAudio);
        audioRecorderRef.current?.stop();
      };
    } else {
      // Stop recorder when disconnected, but keep the audio chunks
      audioRecorderRef.current.stop();
    }
  }, [connected]);

  // Don't clear audio chunks on disconnect - keep them for download
  // Only clear when starting a new session

  // Store preferences in localStorage
  useEffect(() => {
    localStorage.setItem("pushToTalkUI", isPTTActive.toString());
  }, [isPTTActive]);

  useEffect(() => {
    localStorage.setItem("logsExpanded", isEventsPaneExpanded.toString());
  }, [isEventsPaneExpanded]);

  useEffect(() => {
    localStorage.setItem("audioPlaybackEnabled", isAudioPlaybackEnabled.toString());
  }, [isAudioPlaybackEnabled]);

  const handleSendMessage = useCallback(() => {
    if (userText.trim() && connected) {
      client.send([{ text: userText }]);
      setUserText("");
    }
  }, [userText, connected, client]);

  const handleConnect = useCallback(async () => {
    if (connected) {
      disconnect();
      setSessionStatus("DISCONNECTED");
      // Don't clear audio chunks on disconnect - keep them for download
    } else {
      if (model && config) {
        // Clear previous session's audio when starting new session
        aiAudioChunksRef.current = [];
        userAudioChunksRef.current = [];
        setSessionStatus("CONNECTING");
        try {
          await connect();
          // Status will update via useEffect when connected changes
        } catch (error) {
          console.error("Failed to connect:", error);
          setSessionStatus("DISCONNECTED");
        }
      }
    }
  }, [connected, disconnect, connect, model, config]);

  const handleTalkButtonDown = useCallback(() => {
    if (sessionStatus !== 'CONNECTED') return;
    setIsPTTUserSpeaking(true);
    // Gemini API will handle audio streaming automatically
  }, [sessionStatus]);

  const handleTalkButtonUp = useCallback(() => {
    if (sessionStatus !== 'CONNECTED' || !isPTTUserSpeaking) return;
    setIsPTTUserSpeaking(false);
    // Audio will be sent automatically when PTT is active
  }, [sessionStatus, isPTTUserSpeaking]);

  const handleFileUpload = useCallback(async (file: File) => {
    // Placeholder for file upload functionality
    console.log("File upload:", file);
    // TODO: Implement file upload and transcription
  }, []);

  const handleUrlUpload = useCallback(async (url: string) => {
    // Placeholder for URL upload functionality
    console.log("URL upload:", url);
    // TODO: Implement URL upload and transcription
  }, []);

  // Helper function to resample audio from 16 kHz to 24 kHz (linear interpolation)
  const resampleAudio = useCallback((audioData: Int16Array, fromRate: number, toRate: number): Int16Array => {
    const ratio = toRate / fromRate;
    const newLength = Math.round(audioData.length * ratio);
    const resampled = new Int16Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const srcIndex = i / ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, audioData.length - 1);
      const fraction = srcIndex - srcIndexFloor;

      // Linear interpolation
      resampled[i] = Math.round(
        audioData[srcIndexFloor] * (1 - fraction) + audioData[srcIndexCeil] * fraction
      );
    }

    return resampled;
  }, []);

  // Helper function to convert PCM16 to WAV
  const pcm16ToWav = useCallback((pcmData: ArrayBuffer[], sampleRate: number = 24000, numChannels: number = 1): Blob => {
    const length = pcmData.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    const samples = new Int16Array(buffer, 44);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // audio format (1 = PCM)
    view.setUint16(22, numChannels, true); // num channels
    view.setUint32(24, sampleRate, true); // sample rate
    view.setUint32(28, sampleRate * 2 * numChannels, true); // byte rate
    view.setUint16(32, 2 * numChannels, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, 'data');
    view.setUint32(40, length, true);

    // Copy PCM data
    let offset = 0;
    for (const chunk of pcmData) {
      const chunkView = new Int16Array(chunk);
      samples.set(chunkView, offset / 2);
      offset += chunk.byteLength;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }, []);

  // Helper function to calculate RMS (Root Mean Square) volume of audio
  const calculateRMS = useCallback((audio: Int16Array): number => {
    let sumSquares = 0;
    for (let i = 0; i < audio.length; i++) {
      const normalized = audio[i] / 32768;
      sumSquares += normalized * normalized;
    }
    return Math.sqrt(sumSquares / audio.length);
  }, []);

  // Helper function to normalize audio volume to target RMS
  const normalizeAudio = useCallback((audio: Int16Array, targetRMS: number = 0.3): Int16Array => {
    const currentRMS = calculateRMS(audio);
    if (currentRMS === 0) return audio;

    const gain = targetRMS / currentRMS;
    const normalized = new Int16Array(audio.length);

    for (let i = 0; i < audio.length; i++) {
      const sample = audio[i] * gain;
      normalized[i] = Math.max(-32768, Math.min(32767, Math.round(sample)));
    }

    return normalized;
  }, [calculateRMS]);

  // Helper function to mix two audio arrays with proper volume balancing
  const mixAudio = useCallback((audio1: Int16Array, audio2: Int16Array): Int16Array => {
    const maxLength = Math.max(audio1.length, audio2.length);
    const mixed = new Int16Array(maxLength);

    // Normalize both audio streams to similar volume levels
    // Target RMS of 0.25 for each to prevent clipping when mixed
    const normalized1 = normalizeAudio(audio1, 0.25);
    const normalized2 = normalizeAudio(audio2, 0.25);

    for (let i = 0; i < maxLength; i++) {
      const sample1 = i < normalized1.length ? normalized1[i] : 0;
      const sample2 = i < normalized2.length ? normalized2[i] : 0;
      // Mix with equal weight - both are already normalized
      const mixedSample = Math.round((sample1 + sample2) * 0.5);
      mixed[i] = Math.max(-32768, Math.min(32767, mixedSample));
    }

    return mixed;
  }, [normalizeAudio]);

  const downloadRecording = useCallback(() => {
    const hasAiAudio = aiAudioChunksRef.current.length > 0;
    const hasUserAudio = userAudioChunksRef.current.length > 0;

    if (!hasAiAudio && !hasUserAudio) {
      alert("No audio recorded yet. Please have a conversation first.");
      return;
    }

    try {
      let finalAudio: Int16Array;
      const targetSampleRate = 24000;

      if (hasAiAudio && hasUserAudio) {
        // Combine both: resample user audio and mix with AI audio
        // First, combine all user audio chunks
        const totalUserLength = userAudioChunksRef.current.reduce((sum, chunk) => sum + chunk.byteLength, 0);
        const userAudioCombined = new Int16Array(totalUserLength / 2);
        let userOffset = 0;
        for (const chunk of userAudioChunksRef.current) {
          const chunkView = new Int16Array(chunk);
          userAudioCombined.set(chunkView, userOffset);
          userOffset += chunkView.length;
        }

        // Resample user audio from 16 kHz to 24 kHz
        const userAudioResampled = resampleAudio(userAudioCombined, 16000, targetSampleRate);

        // Combine all AI audio chunks
        const totalAiLength = aiAudioChunksRef.current.reduce((sum, chunk) => sum + chunk.byteLength, 0);
        const aiAudioCombined = new Int16Array(totalAiLength / 2);
        let aiOffset = 0;
        for (const chunk of aiAudioChunksRef.current) {
          const chunkView = new Int16Array(chunk);
          aiAudioCombined.set(chunkView, aiOffset);
          aiOffset += chunkView.length;
        }

        // Mix user and AI audio with proper volume balancing
        // This ensures customer audio is not too quiet
        finalAudio = mixAudio(userAudioResampled, aiAudioCombined);
      } else if (hasAiAudio) {
        // Only AI audio
        const totalLength = aiAudioChunksRef.current.reduce((sum, chunk) => sum + chunk.byteLength, 0);
        finalAudio = new Int16Array(totalLength / 2);
        let offset = 0;
        for (const chunk of aiAudioChunksRef.current) {
          const chunkView = new Int16Array(chunk);
          finalAudio.set(chunkView, offset);
          offset += chunkView.length;
        }
      } else {
        // Only user audio - resample to 24 kHz
        const totalLength = userAudioChunksRef.current.reduce((sum, chunk) => sum + chunk.byteLength, 0);
        const userAudioCombined = new Int16Array(totalLength / 2);
        let offset = 0;
        for (const chunk of userAudioChunksRef.current) {
          const chunkView = new Int16Array(chunk);
          userAudioCombined.set(chunkView, offset);
          offset += chunkView.length;
        }
        finalAudio = resampleAudio(userAudioCombined, 16000, targetSampleRate);
      }

      // Convert to WAV
      // Convert ArrayBufferLike to ArrayBuffer by creating a copy
      const audioBuffer = new ArrayBuffer(finalAudio.buffer.byteLength);
      new Uint8Array(audioBuffer).set(new Uint8Array(finalAudio.buffer));
      const wavBlob = pcm16ToWav([audioBuffer], targetSampleRate);

      // Create download link
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

      // Create descriptive filename indicating both agent and customer audio
      let filename = `hms-recording-${timestamp}.wav`;
      if (hasAiAudio && hasUserAudio) {
        filename = `hms-recording-agent-customer-${timestamp}.wav`;
      } else if (hasAiAudio) {
        filename = `hms-recording-agent-${timestamp}.wav`;
      } else if (hasUserAudio) {
        filename = `hms-recording-customer-${timestamp}.wav`;
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("✅ Audio downloaded successfully", {
        filename,
        aiChunks: aiAudioChunksRef.current.length,
        userChunks: userAudioChunksRef.current.length,
        hasAiAudio,
        hasUserAudio,
        duration: `${(finalAudio.length / targetSampleRate).toFixed(1)}s`
      });
    } catch (error) {
      console.error("❌ Error downloading audio:", error);
      alert("Failed to download audio. Please try again.");
    }
  }, [pcm16ToWav, resampleAudio, mixAudio, normalizeAudio, calculateRMS]);

  const handleCodecChange = useCallback((newCodec: string) => {
    setCodec(newCodec);
    // Note: Codec changes require reconnection in Gemini API
  }, []);

  return (
    <CaseContext.Provider value={{ caseData, setCaseData }}>
      <div className="hms-app-layout">
        {/* Header */}
        <div className="hms-header-wrapper">
          <HMSHeader
            preferredLanguage={preferredLanguage}
            onLanguageChange={setPreferredLanguage}
            scenario={scenario}
            onScenarioChange={setScenario}
            agent={agent}
            onAgentChange={setAgent}
            agentOptions={[{ value: "hmsCareNavigator", label: "hmsCareNavigator" }]}
          />
        </div>

        {/* Main Content Area */}
        <div className="hms-main-content">
          <Transcript
            userText={userText}
            setUserText={setUserText}
            onSendMessage={handleSendMessage}
            downloadRecording={downloadRecording}
            canSend={connected}
            shouldRenderTranscript={false}
          />

          {isEventsPaneExpanded && (
            <DataCollectionCenter />
          )}
        </div>

        {/* Bottom Toolbar */}
        <BottomToolbar
          sessionStatus={sessionStatus}
          onToggleConnection={handleConnect}
          isPTTActive={isPTTActive}
          setIsPTTActive={setIsPTTActive}
          isPTTUserSpeaking={isPTTUserSpeaking}
          handleTalkButtonDown={handleTalkButtonDown}
          handleTalkButtonUp={handleTalkButtonUp}
          isEventsPaneExpanded={isEventsPaneExpanded}
          setIsEventsPaneExpanded={setIsEventsPaneExpanded}
          isAudioPlaybackEnabled={isAudioPlaybackEnabled}
          setIsAudioPlaybackEnabled={setIsAudioPlaybackEnabled}
          codec={codec}
          onCodecChange={handleCodecChange}
          onFileUpload={handleFileUpload}
          onUrlUpload={handleUrlUpload}
        />

        {/* Hidden Audio/Video Elements */}
        <audio
          ref={audioElementRef}
          autoPlay
          playsInline
          style={{ display: "none" }}
        />

        <video
          className={cn("stream", {
            hidden: !videoRef.current || !videoStream,
          })}
          ref={videoRef}
          autoPlay
          playsInline
          style={{ display: "none" }}
        />

        {/* Control Tray for audio/video controls - Hidden by default */}
        <div style={{ display: "none" }}>
          <ControlTray
            videoRef={videoRef}
            supportsVideo={true}
            onVideoStreamChange={setVideoStream}
            enableEditingSettings={true}
          >
            {/* Additional controls can go here */}
          </ControlTray>
        </div>
      </div>
    </CaseContext.Provider>
  );
}

function App() {
  return (
    <div className="App">
      <LiveAPIProvider options={apiOptions}>
        <AppContent />
      </LiveAPIProvider>
    </div>
  );
}

export default App;
