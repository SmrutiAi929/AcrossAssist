import React, { useRef, useEffect, useState } from "react";
import "./transcript.scss";
import { useLoggerStore } from "../../lib/store-logger";
import cn from "classnames";

interface TranscriptProps {
  userText: string;
  setUserText: (text: string) => void;
  onSendMessage: () => void;
  downloadRecording: () => void;
  canSend: boolean;
  shouldRenderTranscript?: boolean;
}

const Transcript: React.FC<TranscriptProps> = ({
  userText,
  setUserText,
  onSendMessage,
  downloadRecording,
  canSend,
  shouldRenderTranscript = true,
}) => {
  const { logs } = useLoggerStore();
  const transcriptRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [justCopied, setJustCopied] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [logs]);

  // Autofocus on text box input on load
  useEffect(() => {
    if (canSend && inputRef.current) {
      inputRef.current.focus();
    }
  }, [canSend]);

  // Filter conversation logs
  const conversationLogs = logs.filter((log) => {
    if (typeof log.message === "string") {
      return log.type.includes("content") || log.type.includes("message");
    }
    if (typeof log.message === "object") {
      return (
        ("turns" in log.message && "turnComplete" in log.message) ||
        "serverContent" in log.message
      );
    }
    return false;
  });

  const handleCopyTranscript = async () => {
    if (!transcriptRef.current) return;
    try {
      await navigator.clipboard.writeText(transcriptRef.current.innerText);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy transcript:", error);
    }
  };

  return (
    <div className="transcript-container">
      <div className="transcript-wrapper">
        {/* Header */}
        <div className="transcript-header">
          <span className="transcript-title">
            {shouldRenderTranscript ? "Transcript" : "HMS Mirdif Hospital"}
          </span>
          <div className="transcript-header-actions">
            <button
              onClick={handleCopyTranscript}
              className="action-button copy-button"
            >
              <span className="material-symbols-outlined">content_copy</span>
              {justCopied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={downloadRecording}
              className="action-button download-button"
            >
              <span className="material-symbols-outlined">download</span>
              <span>Download Audio</span>
            </button>
          </div>
        </div>

        {/* Transcript Content */}
        <div
          ref={transcriptRef}
          className={cn("transcript-content", {
            "transcript-empty-state": !shouldRenderTranscript || conversationLogs.length === 0,
          })}
        >
          {shouldRenderTranscript && conversationLogs.length > 0 ? (
            conversationLogs.map((log, index) => {
              const isUser = log.type.includes("send") || log.type.includes("client");
              const isAssistant = log.type.includes("receive") || log.type.includes("server");
              const message = typeof log.message === "string"
                ? log.message
                : JSON.stringify(log.message);
              const timestamp = new Date(log.date).toLocaleTimeString().slice(0, 5);

              return (
                <div
                  key={index}
                  className={cn("transcript-message", {
                    "message-user": isUser,
                    "message-assistant": isAssistant,
                  })}
                >
                  <div className="message-bubble">
                    <div className={cn("message-timestamp", {
                      "timestamp-user": isUser,
                      "timestamp-assistant": isAssistant,
                    })}>
                      {timestamp}
                    </div>
                    <div className="message-text">
                      {typeof log.message === "string" ? (
                        <p>{log.message}</p>
                      ) : (
                        <pre>{JSON.stringify(log.message, null, 2)}</pre>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="transcript-empty">
              <h2>HMS Mirdif Hospital</h2>
              <p>Multispeciality care in the heart of Dubai.</p>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="transcript-input-area">
        <input
          ref={inputRef}
          type="text"
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSend) {
              onSendMessage();
            }
          }}
          className="transcript-input"
          placeholder="Type a message..."
          disabled={!canSend}
        />
        <button
          onClick={onSendMessage}
          disabled={!canSend || !userText.trim()}
          className="send-button"
        >
          <span className="material-symbols-outlined">arrow_upward</span>
        </button>
      </div>
    </div>
  );
};

export default Transcript;
