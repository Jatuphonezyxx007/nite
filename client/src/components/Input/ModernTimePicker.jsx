import React, { useState, useEffect, useRef } from "react";
import "./ModernTimePicker.css";

const ModernTimePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Refs for scrolling elements
  const hourRef = useRef(null);
  const minuteRef = useRef(null);

  // Timers for debounce scrolling
  const scrollTimeout = useRef({ hour: null, minute: null });

  // Constants
  const ITEM_HEIGHT = 40; // Pixel height of each item

  // State for temporary value while scrolling (before clicking OK)
  const [tempH, setTempH] = useState(0);
  const [tempM, setTempM] = useState(0);

  // Initial Data
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // --- Parse Input Value ---
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":").map(Number);
      setTempH(isNaN(h) ? 9 : h);
      setTempM(isNaN(m) ? 0 : m);
    }
  }, [value, isOpen]);

  // --- Scroll to Position (Animation) ---
  const scrollToValue = (ref, val, smooth = true) => {
    if (ref.current) {
      ref.current.scrollTo({
        top: val * ITEM_HEIGHT,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  // Scroll to initial position when opening
  useEffect(() => {
    if (isOpen) {
      // Use setTimeout to allow DOM to render
      setTimeout(() => {
        scrollToValue(hourRef, tempH, false);
        scrollToValue(minuteRef, tempM, false);
      }, 0);
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // --- Handle Scrolling (Snapping Logic) ---
  const handleScroll = (type, e) => {
    const scrollTop = e.target.scrollTop;

    // Clear existing timeout
    if (scrollTimeout.current[type]) clearTimeout(scrollTimeout.current[type]);

    // Set new timeout to detect "Stop Scrolling"
    scrollTimeout.current[type] = setTimeout(() => {
      // Calculate nearest index
      const index = Math.round(scrollTop / ITEM_HEIGHT);

      // Update State
      if (type === "hour") setTempH(index);
      if (type === "minute") setTempM(index);

      // Snap Animation
      e.target.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: "smooth",
      });
    }, 150); // Wait 150ms after scroll stops
  };

  // --- Handle Click on Item ---
  const handleClickItem = (type, val) => {
    if (type === "hour") {
      setTempH(val);
      scrollToValue(hourRef, val, true);
    }
    if (type === "minute") {
      setTempM(val);
      scrollToValue(minuteRef, val, true);
    }
  };

  // --- Confirm Selection ---
  const handleConfirm = (e) => {
    e.stopPropagation(); // Prevent re-opening
    const formattedTime = `${String(tempH).padStart(2, "0")}:${String(
      tempM
    ).padStart(2, "0")}`;
    onChange(formattedTime);
    setIsOpen(false);
  };

  return (
    <div className="mtp-container" ref={containerRef}>
      {/* Trigger Display */}
      <div
        className={`mtp-display ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="d-flex align-items-center">
          <span className="material-symbols-rounded mtp-icon">schedule</span>
          <span className="mtp-value">
            {/* Show value from Props if closed, else show temp value */}
            {isOpen
              ? `${String(tempH).padStart(2, "0")}:${String(tempM).padStart(
                  2,
                  "0"
                )} น.`
              : `${value || "09:00"} น.`}
          </span>
        </div>
        <span className="material-symbols-rounded mtp-arrow">expand_more</span>
      </div>

      {/* Wheel Popup */}
      {isOpen && (
        <div className="mtp-popup">
          <div className="mtp-header">เลือกเวลา (ชั่วโมง : นาที)</div>

          <div className="mtp-wheel">
            <div className="mtp-highlight"></div>

            {/* Hours Column */}
            <div
              className="mtp-column"
              ref={hourRef}
              onScroll={(e) => handleScroll("hour", e)}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className={`mtp-item ${h === tempH ? "selected" : ""}`}
                  onClick={() => handleClickItem("hour", h)}
                >
                  {String(h).padStart(2, "0")}
                </div>
              ))}
            </div>

            <div className="mtp-colon">:</div>

            {/* Minutes Column */}
            <div
              className="mtp-column"
              ref={minuteRef}
              onScroll={(e) => handleScroll("minute", e)}
            >
              {minutes.map((m) => (
                <div
                  key={m}
                  className={`mtp-item ${m === tempM ? "selected" : ""}`}
                  onClick={() => handleClickItem("minute", m)}
                >
                  {String(m).padStart(2, "0")}
                </div>
              ))}
            </div>
          </div>

          <div className="mtp-footer">
            <button
              type="button"
              className="mtp-btn-confirm"
              onClick={handleConfirm}
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernTimePicker;
