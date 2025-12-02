// src/components/ColorPicker/ColorPicker.jsx
import React, { useState, useRef, useEffect } from "react";
import "./ColorPicker.css";

const ModernColorPicker = ({ color, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // สี Presets แนะนำ
  const presets = [
    "#3b82f6",
    "#10b981",
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#6366f1",
    "#14b8a6",
    "#f97316",
    "#06b6d4",
    "#1e293b",
    "#64748b",
  ];

  // ปิดเมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (newColor) => {
    onChange(newColor);
    // ถ้าเลือกจาก Preset ให้ปิดเลย แต่ถ้า Custom ให้เปิดค้างไว้
    // setIsOpen(false);
  };

  return (
    <div className="modern-cp-container" ref={containerRef}>
      {/* Trigger Button */}
      <div
        className={`modern-cp-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="d-flex align-items-center">
          <div
            className="cp-preview-circle"
            style={{ backgroundColor: color }}
          ></div>
          <span className="cp-hex-text">{color.toUpperCase()}</span>
        </div>
        <span className="material-symbols-rounded text-muted">expand_more</span>
      </div>

      {/* Popover Panel */}
      {isOpen && (
        <div className="modern-cp-popover">
          <span className="cp-label">Recommended Colors</span>

          <div className="cp-presets-grid">
            {presets.map((preset) => (
              <div
                key={preset}
                className={`cp-preset-btn ${color === preset ? "active" : ""}`}
                style={{ backgroundColor: preset }}
                onClick={() => {
                  handleSelect(preset);
                  setIsOpen(false); // ปิดทันทีเมื่อเลือก Preset
                }}
                title={preset}
              />
            ))}
          </div>

          <div className="cp-custom-area">
            <label className="cp-custom-trigger">
              <span className="material-symbols-rounded fs-6">colorize</span>
              <span>Custom Mix / Pick Color</span>
              <input
                type="color"
                className="cp-native-input"
                value={color}
                onChange={(e) => handleSelect(e.target.value)}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernColorPicker;
