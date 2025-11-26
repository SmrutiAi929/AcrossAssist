import React, { useState, useEffect } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useAppointmentData } from "../../App";
import cn from "classnames";
import "./data-collection-center.scss";
import { FiDownload, FiHome, FiUser, FiPhone, FiCalendar, FiShare2, FiClock, FiFileText } from "react-icons/fi";

interface DataItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: "Pending" | "Collected";
  value: string | null;
}

const DataCollectionCenter: React.FC = () => {
  const { connected } = useLiveAPIContext();
  const { appointmentData } = useAppointmentData();
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [callDuration, setCallDuration] = useState<string>("0:00");

  // Start tracking call duration when connected
  useEffect(() => {
    if (connected && !sessionStartTime) {
      setSessionStartTime(Date.now());
    } else if (!connected) {
      setSessionStartTime(null);
    }
  }, [connected, sessionStartTime]);

  // Update call duration timer
  useEffect(() => {
    if (!sessionStartTime) {
      setCallDuration("0:00");
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      setCallDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Create data items with actual collected data
  const dataItems: DataItem[] = [
    { 
      id: "1", 
      label: "Department", 
      icon: <FiHome />, 
      status: appointmentData.department ? "Collected" : "Pending",
      value: appointmentData.department
    },
    { 
      id: "2", 
      label: "Doctor", 
      icon: <FiUser />, 
      status: appointmentData.doctor ? "Collected" : "Pending",
      value: appointmentData.doctor
    },
    { 
      id: "3", 
      label: "Patient Name", 
      icon: <FiUser />, 
      status: appointmentData.patientName ? "Collected" : "Pending",
      value: appointmentData.patientName
    },
    { 
      id: "4", 
      label: "Mobile Number", 
      icon: <FiPhone />, 
      status: appointmentData.mobileNumber ? "Collected" : "Pending",
      value: appointmentData.mobileNumber
    },
    { 
      id: "5", 
      label: "Appointment Date & Time", 
      icon: <FiCalendar />, 
      status: appointmentData.appointmentDateTime ? "Collected" : "Pending",
      value: appointmentData.appointmentDateTime
    },
  ];

  const completionPercentage = Math.round((dataItems.filter(i => i.status === "Collected").length / dataItems.length) * 100);
  const capturedCount = dataItems.filter(i => i.status === "Collected").length;

  // Download captured data as JSON
  const handleDownload = () => {
    const dataToDownload = {
      ...appointmentData,
      capturedAt: new Date().toISOString(),
      completionPercentage: `${completionPercentage}%`,
      callDuration: callDuration,
    };
    
    const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointment-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
            <button 
              className="download-button-inline" 
              disabled={capturedCount === 0}
              onClick={handleDownload}
            >
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
                  {item.status === "Collected" && item.value && (
                    <span className="data-item-value">{item.value}</span>
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
                <span className="metric-value">{callDuration}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataCollectionCenter;

