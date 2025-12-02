import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./ThaiDatePicker.css";

const ThaiDatePicker = ({ value, onChange, placeholder = "เลือกวันที่" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    placement: "bottom",
  });

  const containerRef = useRef(null);
  const popupRef = useRef(null);

  // Helper: แปลง String "YYYY-MM-DD" เป็น Date Object สำหรับปฏิทิน (Local Time)
  const parseSafeDate = (dateStr) => {
    if (!dateStr) return new Date();
    // แตก String โดยตรง มั่นใจได้ว่าเลขวันเดือนปีถูกต้องแน่นอน
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  // State เก็บปี/เดือนที่กำลังดู
  const [viewDate, setViewDate] = useState(parseSafeDate(value));

  const thaiMonths = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  // Click Outside Logic
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        popupRef.current &&
        !popupRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", () => setIsOpen(false), {
        capture: true,
      });
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", () => setIsOpen(false), {
        capture: true,
      });
    };
  }, [isOpen]);

  // Sync value prop -> viewDate
  useEffect(() => {
    if (value) {
      setViewDate(parseSafeDate(value));
    }
  }, [value]);

  const handleToggle = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const popupHeight = 380;

      let top = rect.bottom + 8;
      let placement = "bottom";

      if (viewportHeight - rect.bottom < popupHeight) {
        top = rect.top - 8;
        placement = "top";
      }

      setPosition({
        top: top,
        left: rect.left,
        width: rect.width,
        placement: placement,
      });
    }
    setIsOpen(!isOpen);
  };

  const handleDateSelect = (day) => {
    // Construct Date String Manualy: YYYY-MM-DD
    // เพื่อป้องกันปัญหา Timezone เราจะสร้าง String เองเลย
    const year = viewDate.getFullYear();
    const month = String(viewDate.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");

    const dateISO = `${year}-${month}-${dayStr}`;
    onChange(dateISO);
    setIsOpen(false);
  };

  const handleTodayClick = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    onChange(`${year}-${month}-${day}`);
    setViewDate(today);
    setIsOpen(false);
  };

  // ✅ FIX: การแสดงผลให้ตัด String เอา ไม่แปลงเป็น Date Object ให้เพี้ยน
  const getDisplayValue = () => {
    if (!value) return "";
    try {
      const [y, m, d] = value.split("-"); // แตก YYYY-MM-DD
      const yearBE = parseInt(y, 10) + 543;
      // ประกอบร่างใหม่เป็น DD/MM/YYYY(พ.ศ.)
      return `${d}/${m}/${yearBE}`;
    } catch (e) {
      return value;
    }
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const days = [];

    for (let i = 0; i < firstDay; i++)
      days.push(<div key={`empty-${i}`} className="tdp-day empty"></div>);

    for (let day = 1; day <= daysInMonth; day++) {
      let isSelected = false;
      if (value) {
        // เทียบค่าจากการ parse string เป็นตัวเลข (แม่นยำที่สุด)
        const [vY, vM, vD] = value.split("-").map(Number);
        if (vD === day && vM - 1 === month && vY === year) {
          isSelected = true;
        }
      }

      const today = new Date();
      const isToday =
        today.getDate() === day &&
        today.getMonth() === month &&
        today.getFullYear() === year;

      days.push(
        <div
          key={day}
          className={`tdp-day ${isSelected ? "selected" : ""} ${
            isToday ? "today" : ""
          }`}
          onClick={() => handleDateSelect(day)}
        >
          {day}
        </div>
      );
    }
    return days;
  };

  const changeMonth = (offset) => {
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1)
    );
  };

  const changeYear = (offset) => {
    setViewDate(
      new Date(viewDate.getFullYear() + offset, viewDate.getMonth(), 1)
    );
  };

  return (
    <>
      <div className="thai-date-container" ref={containerRef}>
        <div
          className={`thai-date-display ${value ? "has-value" : ""}`}
          onClick={handleToggle}
        >
          <div className="d-flex align-items-center gap-2">
            <span className="material-symbols-rounded date-icon">event</span>
            <span
              className={`thai-date-text ${
                !value ? "thai-date-placeholder" : ""
              }`}
            >
              {getDisplayValue() || placeholder}
            </span>
          </div>
          <span
            className={`material-symbols-rounded dropdown-icon ${
              isOpen ? "rotate" : ""
            }`}
          >
            expand_more
          </span>
        </div>
      </div>

      {isOpen &&
        createPortal(
          <div
            className={`tdp-popup placement-${position.placement}`}
            ref={popupRef}
            style={{
              top: position.top,
              left: position.left,
              position: "fixed",
            }}
          >
            <div className="tdp-header">
              <button
                type="button"
                className="tdp-nav-btn"
                onClick={() => changeYear(-1)}
              >
                <span className="material-symbols-rounded">
                  keyboard_double_arrow_left
                </span>
              </button>
              <button
                type="button"
                className="tdp-nav-btn"
                onClick={() => changeMonth(-1)}
              >
                <span className="material-symbols-rounded">chevron_left</span>
              </button>

              <div className="tdp-title">
                <span className="tdp-month">
                  {thaiMonths[viewDate.getMonth()]}
                </span>
                <span className="tdp-year">{viewDate.getFullYear() + 543}</span>
              </div>

              <button
                type="button"
                className="tdp-nav-btn"
                onClick={() => changeMonth(1)}
              >
                <span className="material-symbols-rounded">chevron_right</span>
              </button>
              <button
                type="button"
                className="tdp-nav-btn"
                onClick={() => changeYear(1)}
              >
                <span className="material-symbols-rounded">
                  keyboard_double_arrow_right
                </span>
              </button>
            </div>

            <div className="tdp-weekdays">
              {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d, i) => (
                <div
                  key={d}
                  className={`tdp-weekday ${
                    i === 0 || i === 6 ? "weekend" : ""
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="tdp-grid">{renderCalendar()}</div>

            <div className="tdp-footer">
              <button
                type="button"
                className="tdp-cancel-btn"
                onClick={() => setIsOpen(false)}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="tdp-today-btn"
                onClick={handleTodayClick}
              >
                วันนี้
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default ThaiDatePicker;
