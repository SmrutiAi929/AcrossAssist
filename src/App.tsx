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
                voiceName: "Aoede", // Female voice
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

**Conversation Flow:**
- When the patient mentions a department, acknowledge it naturally, CALL capture_appointment_data immediately, and proceed to ask about doctor preference. For example: "Great! I can help you book a Cardiology consultation. Which doctor would you prefer to see?"
- When the patient provides their name, acknowledge it warmly, CALL capture_appointment_data immediately, then ask: "Thank you, John. May I have your mobile number to confirm your appointment?"
- Repeat back the details naturally to confirm accuracy as you collect them.
- After collecting all details, provide a complete summary of the appointment for final confirmation before concluding.

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
    } else {
      if (model && config) {
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

  const downloadRecording = useCallback(() => {
    // Placeholder for download functionality
    console.log("Download recording");
    // TODO: Implement audio download
  }, []);

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
          shouldRenderTranscript={true}
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
