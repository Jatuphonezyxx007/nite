import React, { useState, useEffect, useContext } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./AdminSidebar.css";

const AdminSidebar = () => {
  const { user, logout } = useContext(AuthContext);

  const [isOpen, setIsOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const location = useLocation();

  // --- ส่วนที่แก้ไข (Safe Data Access) ---
  // ตรวจสอบว่า user มีอยู่จริงไหม ถ้าไม่มีให้ใช้ค่า Default ป้องกัน Error
  const userName = user?.name || "Admin User";
  const userRole = user?.role || "Administrator";
  // ใช้ profile_image จาก DB ถ้ามี ถ้าไม่มีใช้ null
  const userAvatar = user?.profile_image
    ? `${import.meta.env.VITE_API_URL}/uploads/profile/${user.profile_image}`
    : null;

  // Menu Configuration
  const menuItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: "grid_view" },
    { path: "/admin/users", label: "พนักงานทั้งหมด", icon: "group" },
    {
      label: "เวลาเข้างาน",
      icon: "schedule",
      id: "attendance",
      subItems: [
        { path: "/admin/attendance/overview", label: "ภาพรวมเวลาเข้างาน" },
        { path: "/admin/attendance/manage", label: "จัดการเวลาพนักงาน" },
        { path: "/admin/attendance/shifts", label: "กะการเข้างาน" },
      ],
    },
    { path: "/admin/reports", label: "รายงานสรุป", icon: "description" },
    { path: "/admin/settings", label: "ตั้งค่าระบบ", icon: "settings" },
  ];

  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.subItems) {
        const isChildActive = item.subItems.some(
          (sub) => sub.path === location.pathname
        );
        if (isChildActive) {
          setExpandedMenu(item.id);
        }
      }
    });
  }, [location.pathname]);

  const handleMenuClick = (item) => {
    if (!isOpen) {
      setIsOpen(true);
      if (item.subItems) {
        setTimeout(() => setExpandedMenu(item.id), 100);
      }
    } else {
      if (item.subItems) {
        setExpandedMenu(expandedMenu === item.id ? null : item.id);
      }
    }
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? "open" : "closed"}`}>
      {/* 1. Header & Logo */}
      <div className="sidebar-header">
        {isOpen && (
          <div className="brand-text fade-in">
            Nite<span style={{ color: "#FFBD28" }}>.</span>Admin
          </div>
        )}
        <button
          className="toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? "ย่อเมนู" : "ขยายเมนู"}
        >
          <span className="material-symbols-outlined">
            {isOpen ? "menu_open" : "menu"}
          </span>
        </button>
      </div>

      {/* 2. Menu Items */}
      <ul className="menu-list">
        {menuItems.map((item, index) => {
          const hasSub = !!item.subItems;
          const isExpanded = expandedMenu === item.id;
          const isParentActive =
            hasSub &&
            item.subItems.some((sub) => sub.path === location.pathname);

          return (
            <li className="menu-item" key={index}>
              {hasSub ? (
                <div
                  className={`menu-link cursor-pointer ${
                    isParentActive ? "active" : ""
                  }`}
                  onClick={() => handleMenuClick(item)}
                  aria-expanded={isExpanded}
                  style={{ cursor: "pointer" }}
                >
                  <span className={`material-symbols-outlined menu-icon`}>
                    {item.icon}
                  </span>
                  <span className="menu-text">{item.label}</span>
                  {isOpen && (
                    <span
                      className={`material-symbols-outlined menu-arrow ${
                        isExpanded ? "rotated" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  )}
                </div>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `menu-link ${isActive ? "active" : ""}`
                  }
                  title={!isOpen ? item.label : ""}
                  onClick={() => setExpandedMenu(null)}
                >
                  <span className="material-symbols-outlined menu-icon">
                    {item.icon}
                  </span>
                  <span className="menu-text">{item.label}</span>
                </NavLink>
              )}

              {hasSub && isExpanded && isOpen && (
                <ul className="submenu-list fade-in">
                  {item.subItems.map((sub, subIndex) => (
                    <li key={subIndex} className="submenu-item">
                      <NavLink
                        to={sub.path}
                        className={({ isActive }) =>
                          `submenu-link ${isActive ? "active" : ""}`
                        }
                      >
                        {sub.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {/* 3. User Profile Section */}
      <div className="user-wrapper">
        <div className="user-card" title={userName}>
          <div className="user-avatar-box">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt="User"
                className="user-img"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${userName}&background=00089b&color=fff`;
                }}
              />
            ) : (
              // Fallback Avatar: ใช้อักษรตัวแรกของชื่อ (Safe Access)
              <div
                className="user-initial-avatar"
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#00089b",
                  color: "#fff",
                  fontWeight: "bold",
                  borderRadius: "50%",
                  fontSize: "1.2rem",
                }}
              >
                {/* ใช้ Optional Chaining (?.) เพื่อป้องกัน Error ตรงนี้ */}
                {userName?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="status-dot"></span>
          </div>

          <div className="user-details">
            <span
              className="user-name text-truncate"
              style={{ maxWidth: "120px" }}
            >
              {userName}
            </span>
            <span className="user-role">{userRole}</span>
          </div>

          {isOpen && (
            <button
              onClick={logout}
              className="logout-btn-mini"
              title="ออกจากระบบ"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "18px" }}
              >
                logout
              </span>
            </button>
          )}
        </div>

        {!isOpen && (
          <button
            onClick={logout}
            className="logout-closed-btn mt-2"
            title="ออกจากระบบ"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
