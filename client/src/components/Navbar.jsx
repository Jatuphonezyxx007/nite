import React, { useState, useContext, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";
import { AuthContext } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [activeLink, setActiveLink] = useState(location.pathname);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const dropdownRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  // Map icons to Google Material Symbols names
  const menuItems = [
    { name: "หน้าหลัก", path: "/user/home", icon: "home" },
    { name: "ลงเวลา", path: "/user/attendance", icon: "schedule" },
    { name: "ตารางงาน", path: "/user/schedule", icon: "calendar_month" },
    { name: "วันหยุด", path: "/user/holidays", icon: "wb_sunny" },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. สร้าง Widget นาฬิกาเก็บไว้ในตัวแปร เพื่อเรียกใช้ได้ 2 ที่
  const ClockWidget = (isMobile = false) => (
    <div
      className={`nav-clock ${isMobile ? "mobile-mode" : "d-none d-lg-flex"}`}
    >
      <div className="clock-icon-wrapper">
        <span className="material-symbols-rounded icon">schedule</span>
      </div>
      <div className="clock-info">
        <span className="time-text">
          {currentTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })}
        </span>
        <span className="date-text">
          {/* วันภาษาไทย เช่น "อา." */}
          {currentTime.toLocaleDateString("th-TH", { weekday: "short" })}{" "}
          {/* วันที่แบบย่อ 30/11/25 */}
          {currentTime.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}
        </span>
      </div>
    </div>
  );

  return (
    <nav className={`modern-navbar ${isScrolled ? "scrolled" : ""}`}>
      <div className="container-xl nav-container">
        {/* Brand */}
        <Link className="nav-brand" to="/user/home">
          <div className="brand-logo">
            <span className="material-symbols-rounded">timelapse</span>
          </div>
          <span className="brand-text">TimeTrack</span>
        </Link>

        <div className="d-flex d-lg-none ms-auto align-items-center">
          {ClockWidget(true)}
        </div>

        {/* Mobile Toggle */}
        <button
          className="nav-toggle-btn"
          onClick={() => setIsNavOpen(!isNavOpen)}
        >
          <span className="material-symbols-rounded">
            {isNavOpen ? "close" : "menu"}
          </span>
        </button>

        {/* Menu & Profile Wrapper */}
        <div className={`nav-content-wrapper ${isNavOpen ? "open" : ""}`}>
          {/* Menu */}
          <div className="nav-menu">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`nav-link-item ${
                  activeLink === item.path ? "active" : ""
                }`}
                onClick={() => setIsNavOpen(false)}
              >
                <span className="material-symbols-rounded icon">
                  {item.icon}
                </span>
                <span className="label">{item.name}</span>
              </Link>
            ))}
          </div>

          <div className="nav-clock d-none d-lg-flex">
            <div className="clock-icon-wrapper">
              <span className="material-symbols-rounded icon">schedule</span>
            </div>
            <div className="clock-info">
              {/* ส่วนเวลา */}
              <span className="time-text">
                {currentTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
              </span>
              {/* ส่วนวันที่ Formatted: Sun 30/11/25 */}
              <span className="date-text">
                {currentTime.toLocaleDateString("th-TH", { weekday: "short" })}{" "}
                {currentTime.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Profile */}
          <div className="nav-profile-section" ref={dropdownRef}>
            <div
              className="profile-btn"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <img
                src={
                  user?.profile_image
                    ? `${apiUrl}/uploads/profile/${user.profile_image}`
                    : `https://ui-avatars.com/api/?name=${
                        user?.name_th || "User"
                      }&background=6366f1&color=fff`
                }
                alt="Profile"
                className="avatar-img"
              />
              <div className="profile-meta d-none d-md-flex flex-column align-items-start gap-1 ms-2">
                <span className="name">{user?.name_th || "User"}</span>
                <span className="role">{user?.position || "Employee"}</span>
              </div>{" "}
              <span
                className={`material-symbols-rounded arrow ${
                  showDropdown ? "rotate" : ""
                }`}
              >
                expand_more
              </span>
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <div className="modern-dropdown">
                <div className="dropdown-info">
                  <p className="name" style={{ fontSize: "1rem" }}>
                    {user?.name_th} {user?.lastname_th}{" "}
                    {user?.nickname_th && `(${user.nickname_th})`}
                  </p>
                  <p className="id-badge">ID: {user?.emp_code || "N/A"}</p>
                </div>{" "}
                <div className="dropdown-links">
                  <Link
                    to="/profile"
                    className="dd-link"
                    onClick={() => setShowDropdown(false)}
                  >
                    <span className="material-symbols-rounded">
                      manage_accounts
                    </span>
                    Profile Settings
                  </Link>
                  <Link
                    to="/history"
                    className="dd-link"
                    onClick={() => setShowDropdown(false)}
                  >
                    <span className="material-symbols-rounded">monitoring</span>
                    Analytics
                  </Link>
                  <div className="divider"></div>
                  <button
                    className="dd-link logout"
                    onClick={() => {
                      setShowDropdown(false);
                      logout();
                    }}
                  >
                    <span className="material-symbols-rounded">logout</span>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
