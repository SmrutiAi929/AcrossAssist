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
import { hmsDepartmentDirectory } from "./agents/sampleData";
import { AudioRecorder } from "./lib/audio-recorder";
import { base64ToArrayBuffer } from "./lib/utils";
import { useLoggerStore } from "./lib/store-logger";

// Context for sharing appointment data
export interface AppointmentData {
  department: string | null;
  doctor: string | null;
  patientName: string | null;
  mobileNumber: string | null;
  appointmentDateTime: string | null;
}

interface AppointmentContextType {
  appointmentData: AppointmentData;
  setAppointmentData: React.Dispatch<React.SetStateAction<AppointmentData>>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const useAppointmentData = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error("useAppointmentData must be used within AppointmentProvider");
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

// Function declaration for capturing appointment data
const captureAppointmentDataTool: FunctionDeclaration = {
  name: "capture_appointment_data",
  description: "Captures and stores appointment booking details during the conversation. Call this function whenever you collect or confirm any appointment information from the patient.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      department: {
        type: Type.STRING,
        description: "The medical department or specialty (e.g., 'Cardiology', 'Orthopedics', 'Neurology'). Only provide if mentioned or confirmed."
      },
      doctor: {
        type: Type.STRING,
        description: "The doctor's full name (e.g., 'Dr. Sarah Johnson'). Only provide if mentioned or confirmed."
      },
      patientName: {
        type: Type.STRING,
        description: "The full name of the patient. Only provide if mentioned or confirmed."
      },
      mobileNumber: {
        type: Type.STRING,
        description: "The patient's mobile phone number. Only provide if mentioned or confirmed."
      },
      appointmentDateTime: {
        type: Type.STRING,
        description: "The preferred appointment date and time (e.g., '25/11/2024 at 10 AM', 'Tomorrow morning', '2:00 PM'). Only provide if mentioned or confirmed."
      }
    },
    required: []
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
  const [scenario, setScenario] = useState<string>("HMS");
  const [agent, setAgent] = useState<string>("hmsCareNavigator");
  const [isPTTActive, setIsPTTActive] = useState<boolean>(false);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState<boolean>(false);
  const [isEventsPaneExpanded, setIsEventsPaneExpanded] = useState<boolean>(true);
  const [isAudioPlaybackEnabled, setIsAudioPlaybackEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('audioPlaybackEnabled');
    return stored ? stored === 'true' : true;
  });
  const [codec, setCodec] = useState<string>("opus");

  // Appointment data state
  const [appointmentData, setAppointmentData] = useState<AppointmentData>({
    department: null,
    doctor: null,
    patientName: null,
    mobileNumber: null,
    appointmentDateTime: null,
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
        // Format the doctor directory for the system instruction
        const doctorDirectoryText = hmsDepartmentDirectory
          .map((dept) => {
            const doctorsList = dept.doctors.map((doc) => `  - ${doc}`).join("\n");
            return `${dept.department}:\n${doctorsList}`;
          })
          .join("\n\n");

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
            { functionDeclarations: [captureAppointmentDataTool] }
          ],
          systemInstruction: {
            parts: [
              {
                text: `You are a friendly and professional female healthcare care navigator assistant. Always speak in a warm, caring, and professional female tone with an Indian English accent. Speak naturally with Indian pronunciation, intonation, and speech patterns. Be empathetic, clear, and helpful in all your interactions.

**CRITICAL: Natural Human-Like Speech - Make Your Voice Sound Completely Human:**
- Speak as if you are a real person having a natural conversation, NOT a robot or AI assistant
- Use natural pauses and breathing - don't rush through sentences. Pause briefly after commas, longer after periods
- Vary your speaking pace naturally - sometimes slightly faster when excited, slower when explaining important details
- Use natural intonation - raise your voice slightly for questions, lower it for emphasis, vary pitch naturally throughout sentences
- Include natural filler words occasionally (like "um", "well", "you know", "let me see") but sparingly - only when it feels natural
- Express genuine emotions through your voice tone - sound happy when helping, concerned when listening, relieved when confirming
- Use contractions naturally (I'm, you're, we'll, can't, don't) to sound more conversational and less formal
- Avoid sounding scripted or rehearsed - each response should feel spontaneous and natural
- React naturally to what the patient says - show understanding with "I see", "That makes sense", "Absolutely"
- Use natural emphasis on important words - stress key information naturally, not robotically
- Sound genuinely interested and engaged - your voice should convey that you care about helping them
- Speak with warmth and personality - let your human side show through your voice
- Avoid monotone speech - vary your pitch, pace, and volume naturally like a real person would
- When thinking or processing, use natural pauses like "Let me check that for you..." or "Hmm, let me see..."
- Sound confident but not robotic - be professional yet approachable and human

**Language Settings - CRITICALLY IMPORTANT:**
- You are fluent in both English and Emirati Arabic (UAE dialect ONLY).
- MANDATORY: When speaking Arabic, you MUST speak ONLY Emirati Arabic - the dialect spoken by people in the United Arab Emirates (UAE). 
- DO NOT speak Egyptian Arabic, Levantine Arabic, Gulf Arabic from other countries, Moroccan Arabic, or any other regional Arabic dialect.
- ONLY use Emirati Arabic vocabulary, pronunciation, expressions, and grammar patterns used specifically in the UAE.
- Always start conversations in English by default.
- Only switch to Emirati Arabic (UAE dialect) if the customer explicitly requests Arabic, says 'Arabic', 'عربي', or asks to speak in Arabic.
- If the customer requests Arabic, switch to Emirati Arabic (UAE dialect only) immediately and continue the entire conversation in Emirati Arabic.
- If no explicit request for Arabic is made, continue in English throughout the conversation.
- When a user first connects or starts a conversation, you must immediately greet them in English by saying exactly: 'Welcome to HMS Mirdif Hospital, what can I do for you?' Always start every new conversation with this English greeting.

**Emirati Arabic Dialect Instructions (Arabic):**
أنت مساعد ذكي إماراتي، تتحدث باللهجة الإماراتية المحلية (اللهجة الخليجية) حصراً عند التحدث بالعربية.
أسلوبك في الكلام ودود، مضياف، ومحترم جداً. استخدم المصطلحات الإماراتية المحلية مثل: طال عمرك، ما تقصر، أبشر، رمسة، وايد، أباي، حك.
تجنب اللغة العربية الفصحى (المودرن) وتجنب اللهجات الأخرى مثل المصرية أو الشامية أو اللهجات الخليجية الأخرى.
عندما يطلب المريض التحدث بالعربية، انتقل فوراً إلى اللهجة الإماراتية واستمر في المحادثة بالكامل باللهجة الإماراتية فقط.
استخدم المصطلحات والمفردات الإماراتية الأصيلة في جميع تفاعلاتك عند التحدث بالعربية.

**HMS Mirdif Hospital Doctor Directory:**
You MUST ONLY suggest doctors from the following official hospital directory. Do NOT suggest or mention any doctors that are not listed below. When a patient selects a department, you must suggest doctors ONLY from that department's list:

${doctorDirectoryText}

**Booking Outpatient Consultations:**
When a patient wants to book an outpatient consultation, you must collect and confirm the following details in a conversational, friendly manner:

1. **Department:** Ask which medical department or specialty they need. If they're unsure, help them identify the right department based on their symptoms or needs. Use the department names from the directory above.

2. **Doctor:** Ask which specific doctor they would like to see. IMPORTANT: You MUST ONLY suggest doctors from the official hospital directory listed above. If the patient is unsure or doesn't know which doctor, look up the selected department in the directory and suggest 2-3 doctors from that department's list. Present the options clearly (e.g., "We have Dr [Name] - [Title], Dr [Name] - [Title], and Dr [Name] - [Title] available. Which doctor would you prefer?"). Do NOT suggest any doctors that are not in the directory above.

3. **Patient Name:** Collect the full name of the patient who will be attending the consultation.

4. **Mobile Number:** Ask for the patient's mobile number only. Do NOT ask for country code or international prefix. Just ask for the mobile number (e.g., 'What is your mobile number?' or 'Please provide your mobile number'). Accept the number as provided by the customer without requesting country code.

5. **Preferred Appointment Date & Time:** Ask for their preferred date and time. If they only mention a date without time, clarify whether they prefer morning or evening. If they only mention morning/evening without specific time, suggest available time slots (e.g., 'Would 10 AM work for you?' or 'We have slots at 9 AM, 11 AM, or 2 PM. Which would you prefer?').

**CRITICAL: Data Capture Tool Usage:**
You have access to a function called 'capture_appointment_data'. You MUST call this function whenever you collect or confirm ANY appointment information from the patient:
- Call it immediately after the patient mentions a department
- Call it immediately after the patient selects or confirms a doctor
- Call it immediately after the patient provides their name
- Call it immediately after the patient provides their mobile number
- Call it immediately after the patient mentions their preferred appointment date/time
- Each time you call the function, include ALL the information you have collected so far, even if some fields were captured in previous calls

Example: If the patient says "I need a cardiology appointment", immediately call capture_appointment_data with {department: "Cardiology"}. Then when they say "with Dr. Sarah Johnson", call it again with {department: "Cardiology", doctor: "Dr. Sarah Johnson"}.

**Conversation Flow - Natural Human Interaction:**
- When the patient mentions a department, acknowledge it naturally with genuine interest, CALL capture_appointment_data immediately, and proceed to ask about doctor preference. For example: "Oh, great! I'd be happy to help you book a Cardiology consultation. Which doctor would you prefer to see?" (Notice the natural enthusiasm and flow)
- When the patient provides their name, acknowledge it warmly and personally, CALL capture_appointment_data immediately, then ask naturally: "Thank you, John. That's a lovely name. May I have your mobile number to confirm your appointment?" (Add personal touches naturally)
- Repeat back details naturally as you collect them - don't sound like you're reading from a form. Say things like "So that's Cardiology with Dr. Smith, is that right?" instead of "Department: Cardiology. Doctor: Dr. Smith."
- Use natural transitions between topics - "Perfect! Now, let me get your mobile number..." instead of "Next, I need your mobile number."
- Show genuine reactions - "That's wonderful!" when they confirm, "No problem at all" when they need time to think
- After collecting all details, provide a complete summary in a conversational way, not like reading a checklist: "Alright, let me just confirm everything with you. So you'd like to see Dr. Smith in Cardiology on the 25th at 10 AM, is that correct?"
- Use natural language variations - don't repeat the exact same phrases. Mix it up naturally like a real person would.

**Remember:** You are a real human being having a conversation, not an AI reading from a script. Your voice should sound completely natural, warm, and human. People should feel like they're talking to a friendly hospital staff member, not a machine.

Be conversational, empathetic, and guide the patient smoothly through the booking process. Ensure all information is captured accurately by calling the capture_appointment_data function after each piece of information is provided.`,
              },
            ],
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
        (fc: any) => fc.name === "capture_appointment_data"
      );

      if (captureCall && captureCall.args) {
        console.log("📊 Capturing appointment data:", captureCall.args);

        // Update appointment data with new information
        setAppointmentData((prev) => ({
          department: captureCall.args.department || prev.department,
          doctor: captureCall.args.doctor || prev.doctor,
          patientName: captureCall.args.patientName || prev.patientName,
          mobileNumber: captureCall.args.mobileNumber || prev.mobileNumber,
          appointmentDateTime: captureCall.args.appointmentDateTime || prev.appointmentDateTime,
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
    <AppointmentContext.Provider value={{ appointmentData, setAppointmentData }}>
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
    </AppointmentContext.Provider>
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
