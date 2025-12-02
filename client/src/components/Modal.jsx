import React, { useEffect } from "react";
import "./Modal.css";

const ModernModal = ({
  isOpen,
  onClose,
  title,
  children,
  icon,
  maxWidth = "1100px",
}) => {
  // ป้องกันการ Scroll ที่ Body หลักเมื่อ Modal เปิด
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modern-modal-overlay" onClick={onClose}>
      <div
        className="modern-modal-container"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()} // คลิกข้างในไม่ปิด Modal
      >
        {/* Header */}
        <div className="modern-modal-header">
          <div className="d-flex align-items-center gap-3">
            {icon && (
              <div
                className="header-icon-box"
                style={{
                  width: "48px",
                  height: "48px",
                  background: "linear-gradient(135deg, #1e2a45, #34495e)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 10px rgba(30, 42, 69, 0.2)",
                }}
              >
                <span className="material-symbols-rounded fs-4 text-white">
                  {icon}
                </span>
              </div>
            )}
            <div>{title}</div>
          </div>
          <button
            type="button"
            className="modern-modal-close"
            onClick={onClose}
          >
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="modern-modal-body">{children}</div>
      </div>
    </div>
  );
};

export default ModernModal;
