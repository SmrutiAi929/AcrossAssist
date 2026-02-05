import React from "react";
import "./hms-header.scss";
import cn from "classnames";

interface HMSHeaderProps {
  preferredLanguage: string;
  onLanguageChange: (language: string) => void;
  scenario: string;
  onScenarioChange: (scenario: string) => void;
  agent: string;
  onAgentChange: (agent: string) => void;
  agentOptions?: Array<{ value: string; label: string }>;
}

const HMSHeader: React.FC<HMSHeaderProps> = ({
  preferredLanguage,
  onLanguageChange,
  scenario,
  onScenarioChange,
  agent,
  onAgentChange,
  agentOptions = [],
}) => {
  return (
    <header className="hms-header">
      <div className="hms-header-left">
        <img 
          src="/omni.jpeg" 
          alt="Omniscient FZ LLC Logo" 
          className="hms-logo-img"
          width={80}
          height={80}
        />
        <div className="hms-branding">
          <h1 className="voice-agent-title">VoiceAgent 2.0</h1>
          <h2 className="hospital-name">HMS Mirdif Hospital</h2>
        </div>
      </div>
      <div className="hms-header-right">
        <div className="header-dropdowns" style={{ display: 'none' }}>
          <label className="dropdown-label">
            Language
          </label>
          <div className="dropdown-wrapper">
            <select
              value={preferredLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="header-select"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Arabic (Emirati)">Arabic (Emirati)</option>
            </select>
          </div>

          <label className="dropdown-label">
            Scenario
          </label>
          <div className="dropdown-wrapper">
            <select
              value={scenario}
              onChange={(e) => onScenarioChange(e.target.value)}
              className="header-select"
            >
              <option value="HMS">HMS</option>
            </select>
          </div>

          {agentOptions.length > 0 && (
            <>
              <label className="dropdown-label">
                Agent
              </label>
              <div className="dropdown-wrapper">
                <select
                  value={agent}
                  onChange={(e) => onAgentChange(e.target.value)}
                  className="header-select"
                >
                  {agentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default HMSHeader;

