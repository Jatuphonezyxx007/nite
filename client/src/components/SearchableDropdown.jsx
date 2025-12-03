import React, { useState, useRef, useEffect } from "react";
import "./SearchableDropdown.css";

const SearchableDropdown = ({
  options,
  value,
  onChange,
  placeholder = "ค้นหา...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value)
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) => {
    const search = searchTerm.toLowerCase();
    return (
      opt.label.toLowerCase().includes(search) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(search)) ||
      (opt.code && opt.code.toLowerCase().includes(search)) ||
      (opt.nickname && opt.nickname.toLowerCase().includes(search))
    );
  });

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="search-dropdown-container" ref={dropdownRef}>
      <div
        className={`search-dropdown-trigger ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? "text-dark fw-medium" : "text-muted"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="material-symbols-rounded arrow">expand_more</span>
      </div>

      {isOpen && (
        <div className="search-dropdown-menu">
          <div className="search-input-wrapper">
            <span className="material-symbols-rounded search-icon">search</span>
            <input
              type="text"
              className="dropdown-search-input"
              placeholder="ชื่อ, รหัส หรือชื่อเล่น..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="dropdown-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`dropdown-item ${
                    String(value) === String(opt.value) ? "selected" : ""
                  }`}
                  onClick={() => handleSelect(opt.value)}
                >
                  <div className="d-flex justify-content-between align-items-center w-100">
                    <div>
                      <div className="fw-medium">{opt.label}</div>
                      {opt.subLabel && (
                        <div
                          className="small text-muted"
                          style={{ fontSize: "0.75rem" }}
                        >
                          {opt.subLabel}
                        </div>
                      )}
                    </div>
                    {opt.nickname && (
                      <span className="badge bg-light text-dark border ms-2">
                        {opt.nickname}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-muted small">
                ไม่พบข้อมูล
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
