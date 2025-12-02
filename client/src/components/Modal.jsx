import React, { useEffect } from "react";
import { createPortal } from "react-dom"; // 1. เพิ่ม import นี้
import "./Modal.css";

const ModernModal = ({
  isOpen,
  onClose,
  title,
  children,
  icon,
  maxWidth = "1100px",
}) => {
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => {
        document.body.style.paddingRight = "0px";
        document.body.style.overflow = "unset";
      }, 0);
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.paddingRight = "0px";
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // 2. ใช้ createPortal ห่อ JSX ทั้งหมด แล้วส่งไปที่ document.body
  return createPortal(
    <div className="modern-modal-overlay" onClick={onClose}>
      <div
        className="modern-modal-container"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modern-modal-header">
          <div className="d-flex align-items-center gap-3">
            {icon && (
              <div className="header-icon-box">
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
    </div>,
    document.body // 3. ปลายทางที่จะให้ Modal ไปโผล่ (นอกสุดของเว็บ)
  );
};

export default ModernModal;
