import React from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import cn from "classnames";
import "./data-collection-center.scss";
import { FiDownload, FiHome, FiUser, FiPhone, FiCalendar, FiShare2, FiClock, FiFileText } from "react-icons/fi";

interface DataItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: "Pending" | "Collected";
}

const DataCollectionCenter: React.FC = () => {
  const { connected } = useLiveAPIContext();

  const dataItems: DataItem[] = [
    { id: "1", label: "Department", icon: <FiHome />, status: "Pending" },
    { id: "2", label: "Doctor", icon: <FiUser />, status: "Pending" },
    { id: "3", label: "Patient Name", icon: <FiUser />, status: "Pending" },
    { id: "4", label: "Mobile Number", icon: <FiPhone />, status: "Pending" },
    { id: "5", label: "Appointment Date & Time", icon: <FiCalendar />, status: "Pending" },
  ];

  const completionPercentage = Math.round((dataItems.filter(i => i.status === "Collected").length / dataItems.length) * 100);
  const capturedCount = dataItems.filter(i => i.status === "Collected").length;

  return (
    <div className="data-collection-center">
      {/* Header */}
      <div className="dc-header">
        <div className="dc-header-content">
          <div className="dc-header-text">
            <h2>Data Collection Center</h2>
            <p>Hospital Appointment Desk</p>
          </div>
          <div className={cn("collecting-indicator", { active: connected })}>
            <div className="indicator-dot"></div>
            <span>COLLECTING</span>
          </div>
        </div>
      </div>

      {/* Content Wrapper */}
      <div className="dc-content-wrapper">
        {/* Agent Section */}
        <div className="dc-agent-section">
          <div className="agent-header">
            <FiUser className="agent-icon" />
            <div className="agent-info">
              <h3>hms Care Navigator</h3>
              <p>Coordinating hospital appointments and patient queries.</p>
            </div>
            <div className={cn("agent-status", { active: connected })}>
              <span className="status-label">STATUS</span>
              <span className="status-value">{connected ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>

        {/* Data Collection Progress */}
        <div className="dc-progress-section">
          <div className="section-header">
            <h3>
              <FiHome className="section-icon" />
              Data Collection Progress
            </h3>
            <button className="download-button-inline" disabled={capturedCount === 0}>
              <FiDownload />
              Download ({capturedCount})
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          
          <div className="data-items-list">
            {dataItems.map((item) => (
              <div key={item.id} className="data-item">
                <div className="data-item-left">
                  {item.icon}
                  <span className="data-item-label">{item.label}</span>
                </div>
                <div className="data-item-right">
                  {item.status === "Collected" && (
                    <span className="data-item-value">{item.label}</span>
                  )}
                  <div className={cn("data-item-status", item.status.toLowerCase())}>
                    {item.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Network */}
        <div className="dc-network-section">
          <div className="section-header">
            <h3>
              <FiShare2 className="section-icon" />
              Agent Network
            </h3>
          </div>
          <div className="network-container">
            <p className="section-subtitle">Can handoff to:</p>
            <div className="network-buttons">
              <button className="network-button">Specialist Consultation</button>
              <button className="network-button">Human Agent</button>
            </div>
          </div>
        </div>

        {/* Session Metrics */}
        <div className="dc-metrics-section">
          <div className="section-header">
            <h3>
              <FiClock className="section-icon" />
              Session Metrics
            </h3>
          </div>
          <div className="metrics-content">
            <div className="metric-item">
              <FiFileText className="metric-icon" />
              <div className="metric-label">
                <span className="metric-name">Appointment Completion</span>
                <span className="metric-value">{capturedCount}/{dataItems.length} ({completionPercentage}%)</span>
              </div>
            </div>
            <div className="metric-item">
              <FiClock className="metric-icon" />
              <div className="metric-label">
                <span className="metric-name">Call Duration</span>
                <span className="metric-value">0:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataCollectionCenter;

