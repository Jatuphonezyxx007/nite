import React, { useState, useRef, useEffect } from "react";
import "./DropDown.css";

const ModernDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = "เลือกรายการ...",
  name,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // หา Label ของค่าที่ถูกเลือกปัจจุบัน
  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value)
  );

  // ปิด Dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    // จำลอง Event Object เพื่อให้เข้ากับ handleInputChange เดิม
    const fakeEvent = {
      target: {
        name: name,
        value: optionValue,
      },
    };
    onChange(fakeEvent);
    setIsOpen(false);
  };

  return (
    <div className="modern-dropdown-container" ref={dropdownRef}>
      {/* Trigger Button */}
      <div
        className={`modern-dropdown-trigger ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={!selectedOption ? "text-muted" : ""}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="material-symbols-rounded dropdown-arrow fs-5">
          expand_more
        </span>
      </div>

      {/* Dropdown Menu */}
      <div className={`modern-dropdown-menu ${isOpen ? "open" : ""}`}>
        <div className="modern-dropdown-menu-inner">
          {options.map((option) => (
            <div
              key={option.value}
              className={`modern-dropdown-item ${
                String(value) === String(option.value) ? "selected" : ""
              }`}
              onClick={() => handleSelect(option.value)}
            >
              {/* ถ้ามี Icon ใน option ก็ใส่ได้ (Optional) */}
              {option.icon && (
                <span className="material-symbols-rounded fs-6 opacity-75">
                  {option.icon}
                </span>
              )}
              {option.label}

              {/* Check Icon เมื่อเลือก */}
              {String(value) === String(option.value) && (
                <span className="material-symbols-rounded ms-auto fs-6 text-primary">
                  check
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModernDropdown;
