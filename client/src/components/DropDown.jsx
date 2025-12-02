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

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value)
  );

  // ... (useEffect handleClickOutside เหมือนเดิม) ...
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
    const fakeEvent = { target: { name: name, value: optionValue } };
    onChange(fakeEvent);
    setIsOpen(false);
  };

  return (
    <div className="modern-dropdown-container" ref={dropdownRef}>
      {/* แก้ไขตรงนี้: 
         เพิ่ม Logic เช็ค selectedOption?.className 
      */}
      <div
        className={`modern-dropdown-trigger ${isOpen ? "active" : ""} ${
          selectedOption?.className ? selectedOption.className : ""
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="d-flex align-items-center gap-2">
          {/* แสดง Icon ด้วยถ้ามี */}
          {selectedOption?.icon && (
            <span className="material-symbols-rounded fs-6 opacity-75">
              {selectedOption.icon}
            </span>
          )}
          <span className={!selectedOption ? "text-muted" : ""}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <span className="material-symbols-rounded dropdown-arrow fs-5">
          expand_more
        </span>
      </div>

      {/* ... (ส่วน Dropdown Menu เหมือนเดิม) ... */}
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
              {option.icon && (
                <span className="material-symbols-rounded fs-6 opacity-75">
                  {option.icon}
                </span>
              )}
              {option.label}
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
