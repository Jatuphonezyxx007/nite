import React, { useState, useContext, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";
import { AuthContext } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [activeLink, setActiveLink] = useState(location.pathname);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // เช็คสถานะการเลื่อนหน้าจอ
  const [isNavOpen, setIsNavOpen] = useState(false);

  const dropdownRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  const menuItems = [
    { name: "Dashboard", path: "/user/home", icon: "bi-grid-1x2-fill" },
    { name: "Attendance", path: "/user/attendance", icon: "bi-fingerprint" },
    {
      name: "Schedule",
      path: "/user/schedule",
      icon: "bi-calendar-range-fill",
    },
    {
      name: "Holidays",
      path: "/user/holidays",
      icon: "bi-brightness-alt-high-fill",
    },
  ];

  // 1. Detect Scroll เพื่อเปลี่ยนสี Navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location]);

  // Click Outside logic
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    // ถ้า Scroll แล้ว ให้เพิ่ม class 'scrolled' เข้าไป
    <nav
      className={`navbar navbar-expand-lg fixed-top premium-navbar ${
        isScrolled ? "scrolled" : ""
      }`}
    >
      <div className="container">
        {/* --- BRAND LOGO --- */}
        <Link className="brand-wrapper" to="/user/home">
          <div className="brand-logo-bg">
            <i className="bi bi-layers-fill"></i>
          </div>
          <span className="brand-text">HR SYSTEM</span>
        </Link>

        {/* --- TOGGLER (MOBILE) --- */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsNavOpen(!isNavOpen)}
        >
          <span className="bi bi-list fs-2"></span>
        </button>

        {/* --- MENU ITEMS --- */}
        <div className={`collapse navbar-collapse ${isNavOpen ? "show" : ""}`}>
          <ul className="navbar-nav mx-auto align-items-center">
            {menuItems.map((item) => (
              <li className="nav-item" key={item.name}>
                <Link
                  className={`nav-link-modern ${
                    activeLink === item.path ? "active" : ""
                  }`}
                  to={item.path}
                  onClick={() => setIsNavOpen(false)}
                >
                  <i className={`bi ${item.icon} fs-6`}></i>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* --- USER PROFILE SECTION --- */}
          <div className="d-flex align-items-center mt-3 mt-lg-0">
            {user ? (
              <div className="dropdown position-relative" ref={dropdownRef}>
                {/* Profile Trigger */}
                <div
                  className="profile-trigger"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <img
                    src={
                      user.profile_image
                        ? `${apiUrl}/uploads/profile/${user.profile_image}`
                        : `https://ui-avatars.com/api/?name=${user.name_th}&background=random`
                    }
                    alt="Avatar"
                    className="avatar-circle"
                  />
                  <div className="profile-info d-none d-sm-flex">
                    <span className="profile-name">{user.name_th}</span>
                    <span className="profile-role">
                      {user.position || "Employee"}
                    </span>
                  </div>
                  <i
                    className={`bi bi-chevron-down text-muted small transition-transform ${
                      showDropdown ? "rotate-180" : ""
                    }`}
                  ></i>
                </div>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="dropdown-menu dropdown-menu-end animate-dropdown show">
                    <div className="px-3 py-2 border-bottom mb-2 bg-light rounded-top">
                      <small
                        className="text-uppercase fw-bold text-muted"
                        style={{ fontSize: "0.65rem" }}
                      >
                        Signed in as
                      </small>
                      <div
                        className="fw-bold text-dark text-truncate"
                        style={{ maxWidth: "180px" }}
                      >
                        {user.email || user.username}
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      className="dropdown-item-modern text-decoration-none"
                      onClick={() => setShowDropdown(false)}
                    >
                      <i className="bi bi-person-circle"></i> Profile Setting
                    </Link>
                    <Link
                      to="/history"
                      className="dropdown-item-modern text-decoration-none"
                      onClick={() => setShowDropdown(false)}
                    >
                      <i className="bi bi-clock-history"></i> Work History
                    </Link>

                    <div className="dropdown-divider my-2"></div>

                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        logout();
                      }}
                      className="dropdown-item-modern logout-btn w-100 text-start bg-transparent"
                    >
                      <i className="bi bi-box-arrow-right"></i> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
