import React, { useRef, useState } from "react";
import "./bottom-toolbar.scss";
import cn from "classnames";

// Simple SVG icons
const ChevronLeftIcon = () => (
  <svg className="chevron-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="chevron-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

interface BottomToolbarProps {
  sessionStatus: "CONNECTED" | "DISCONNECTED" | "CONNECTING";
  onToggleConnection: () => void;
  isPTTActive: boolean;
  setIsPTTActive: (val: boolean) => void;
  isPTTUserSpeaking: boolean;
  handleTalkButtonDown: () => void;
  handleTalkButtonUp: () => void;
  isEventsPaneExpanded: boolean;
  setIsEventsPaneExpanded: (val: boolean) => void;
  isAudioPlaybackEnabled: boolean;
  setIsAudioPlaybackEnabled: (val: boolean) => void;
  codec: string;
  onCodecChange: (newCodec: string) => void;
  onFileUpload: (file: File) => void;
  onUrlUpload: (url: string) => void;
}

function BottomToolbar({
  sessionStatus,
  onToggleConnection,
  isPTTActive,
  setIsPTTActive,
  isPTTUserSpeaking,
  handleTalkButtonDown,
  handleTalkButtonUp,
  isEventsPaneExpanded,
  setIsEventsPaneExpanded,
  isAudioPlaybackEnabled,
  setIsAudioPlaybackEnabled,
  codec,
  onCodecChange,
  onFileUpload,
  onUrlUpload,
}: BottomToolbarProps) {
  const isConnected = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUrlUpload = () => {
    if (audioUrl.trim()) {
      onUrlUpload(audioUrl.trim());
      setAudioUrl("");
    }
  };

  const handleCodecChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCodec = e.target.value;
    onCodecChange(newCodec);
  };

  function getConnectionButtonLabel() {
    if (isConnected) return "Disconnect";
    if (isConnecting) return "Connecting...";
    return "Connect";
  }

  function getConnectionButtonClasses() {
    const baseClasses = "connection-button";
    if (isConnected) {
      return cn(baseClasses, "connected", { disabled: isConnecting });
    }
    return cn(baseClasses, "disconnected", { disabled: isConnecting });
  }

  return (
    <div className="bottom-toolbar">
      <button
        onClick={onToggleConnection}
        className={getConnectionButtonClasses()}
        disabled={isConnecting}
      >
        {getConnectionButtonLabel()}
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden-file-input"
        accept="audio/*"
      />

      <button
        onClick={handleUploadClick}
        className={cn("upload-audio-button", { disabled: !isConnected })}
        disabled={!isConnected}
      >
        Upload Audio
      </button>

      <div className="url-input-group">
        <input
          type="url"
          value={audioUrl}
          onChange={(e) => setAudioUrl(e.target.value)}
          placeholder="Enter audio URL..."
          className={cn("url-input-field", { disabled: !isConnected })}
          disabled={!isConnected}
        />
        <button
          onClick={handleUrlUpload}
          className={cn("process-url-button", { 
            disabled: !isConnected || !audioUrl.trim() 
          })}
          disabled={!isConnected || !audioUrl.trim()}
        >
          Process URL
        </button>
      </div>

      <div className="checkbox-group">
        <input
          id="push-to-talk"
          type="checkbox"
          checked={isPTTActive}
          onChange={(e) => setIsPTTActive(e.target.checked)}
          disabled={!isConnected}
          className="checkbox-input"
        />
        <label htmlFor="push-to-talk" className="checkbox-label">
          Push to talk
        </label>
        <button
          onMouseDown={handleTalkButtonDown}
          onMouseUp={handleTalkButtonUp}
          onTouchStart={handleTalkButtonDown}
          onTouchEnd={handleTalkButtonUp}
          disabled={!isPTTActive}
          className={cn("talk-button", {
            speaking: isPTTUserSpeaking,
            disabled: !isPTTActive,
          })}
        >
          Talk
        </button>
      </div>

      <div className="checkbox-group">
        <input
          id="audio-playback"
          type="checkbox"
          checked={isAudioPlaybackEnabled}
          onChange={(e) => setIsAudioPlaybackEnabled(e.target.checked)}
          disabled={!isConnected}
          className="checkbox-input"
        />
        <label htmlFor="audio-playback" className="checkbox-label">
          Audio playback
        </label>
      </div>

      <div className="view-toggle-group">
        <button
          onClick={() => setIsEventsPaneExpanded(!isEventsPaneExpanded)}
          className="chevron-button"
          title={isEventsPaneExpanded ? "Collapse Details" : "Expand Details"}
        >
          {isEventsPaneExpanded ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
        <div className="view-toggle-text">
          {isEventsPaneExpanded ? "Hide Agent View" : "Show Agent View"}
        </div>
      </div>

      <div className="codec-group">
        <div>Codec:</div>
        <select
          id="codec-select"
          value={codec}
          onChange={handleCodecChange}
          className="codec-select"
        >
          <option value="opus">Opus (48 kHz)</option>
          <option value="pcmu">PCMU (8 kHz)</option>
          <option value="pcma">PCMA (8 kHz)</option>
        </select>
      </div>
    </div>
  );
}

export default BottomToolbar;
