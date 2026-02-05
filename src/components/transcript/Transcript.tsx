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

  // Filter conversation logs - show all logs and let rendering handle filtering
  const conversationLogs = logs;

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
          {!shouldRenderTranscript ? (
            /* Show Hospital Branding when transcript is disabled */
            <div className="transcript-empty">
              <h2>HMS Mirdif Hospital</h2>
              <p>Multispeciality care in the heart of Dubai.</p>
            </div>
          ) : conversationLogs.length > 0 ? (
            conversationLogs.map((log, index) => {
              // Skip audio buffer and system messages
              if (typeof log.message === "string") {
                const skipMessages = ["turnComplete", "setupComplete", "interrupted", "Connected", "audio", "video"];
                if (skipMessages.includes(log.message) || log.message.startsWith("buffer")) {
                  return null;
                }
              }

              // Determine if it's user or assistant
              const isUser = log.type.includes("client.send") || log.type.includes("client.realtimeInput");
              const isAssistant = log.type.includes("server.content");

              // Skip if it's neither user nor assistant message
              if (!isUser && !isAssistant) {
                return null;
              }

              // Extract actual text content and images
              let messageText = "";
              let messageImages: Array<{ data: string; mimeType: string }> = [];

              if (typeof log.message === "object" && log.message !== null) {
                const msg = log.message as any;

                // For assistant messages (server.content)
                if (isAssistant && msg.serverContent?.modelTurn?.parts) {
                  const parts = msg.serverContent.modelTurn.parts;
                  messageText = parts
                    .filter((p: any) => p.text)
                    .map((p: any) => p.text)
                    .join(" ");
                  // Extract images from inlineData
                  messageImages = parts
                    .filter((p: any) => p.inlineData && p.inlineData.mimeType?.startsWith("image/"))
                    .map((p: any) => ({
                      data: p.inlineData.data,
                      mimeType: p.inlineData.mimeType,
                    }));
                }
                // For user messages (client.send)
                else if (isUser && msg.turns) {
                  const turns = Array.isArray(msg.turns) ? msg.turns : [msg.turns];
                  messageText = turns
                    .filter((t: any) => t.text)
                    .map((t: any) => t.text)
                    .join(" ");
                  // Extract images from inlineData
                  messageImages = turns
                    .filter((t: any) => t.inlineData && t.inlineData.mimeType?.startsWith("image/"))
                    .map((t: any) => ({
                      data: t.inlineData.data,
                      mimeType: t.inlineData.mimeType,
                    }));
                }
              }

              // Skip if no text and no images
              if ((!messageText || !messageText.trim()) && messageImages.length === 0) {
                return null;
              }

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
                      {messageText && <p>{messageText}</p>}
                      {messageImages.length > 0 && (
                        <div className="message-images">
                          {messageImages.map((img, imgIndex) => (
                            <img
                              key={imgIndex}
                              src={`data:${img.mimeType};base64,${img.data}`}
                              alt="Message attachment"
                              className="transcript-image"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="transcript-empty">
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                Click "Connect" below to start a conversation. Your transcript will appear here.
              </p>
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
