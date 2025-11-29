import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import "./UserHomePage.css";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useContext(AuthContext);
  // Mock logic คงเดิม
  // 1. ปรับ State ให้รองรับข้อมูลเริ่มต้น (Default values)
  const [stats, setStats] = useState({
    totalHours: "0",
    averageHours: "0",
    onTimePercentage: "0",
    lateDays: "0",
  });

  const [recentAttendance, setRecentAttendance] = useState([
    {
      date: "2024-01-15",
      checkIn: "08:02",
      checkOut: "17:15",
      status: "on-time",
    },
    { date: "2024-01-14", checkIn: "08:15", checkOut: "17:20", status: "late" },
    {
      date: "2024-01-13",
      checkIn: "07:55",
      checkOut: "17:05",
      status: "on-time",
    },
    {
      date: "2024-01-12",
      checkIn: "08:05",
      checkOut: "17:10",
      status: "on-time",
    },
  ]);

  const [weeklySchedule, setWeeklySchedule] = useState([
    { day: "Mon", date: "15", shift: "09:00 - 18:00", status: "completed" },
    { day: "Tue", date: "16", shift: "09:00 - 18:00", status: "completed" },
    { day: "Wed", date: "17", shift: "09:00 - 18:00", status: "completed" },
    { day: "Thu", date: "18", shift: "09:00 - 18:00", status: "today" },
    { day: "Fri", date: "19", shift: "09:00 - 18:00", status: "upcoming" },
    { day: "Sat", date: "20", shift: "Day Off", status: "holiday" },
    { day: "Sun", date: "21", shift: "Day Off", status: "holiday" },
  ]);

  // 2. ฟังก์ชันดึงข้อมูลจาก Backend
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token"); // ดึง Token
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      // ยิง API ไปที่ Endpoint ที่เราสร้างไว้ข้างบน
      const res = await axios.get(`${apiUrl}/api/user/dashboard-stats`, config);

      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // 3. เรียกใช้ฟังก์ชันดึงข้อมูลเมื่อ Component โหลด
    fetchDashboardData();

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="page-wrapper">
      <div className="container-xl py-5 dashboard-top-spacing">
        {/* Header Section */}
        <div className="row align-items-center mb-5 fade-in">
          <div className="col-lg-7">
            <div className="d-flex flex-column gap-1">
              <span className="text-secondary fw-medium">
                {currentTime.toLocaleDateString("th-TH", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <h1 className="display-5 fw-bold text-dark mb-0">
                Good {currentTime.getHours() < 12 ? "Morning" : "Afternoon"},
                {/* 3. แสดงชื่อ User จริง ถ้าไม่มีแสดง "User" */}
                <span className="text-primary ms-2">
                  {user?.name_th || "User"}
                </span>
              </h1>{" "}
            </div>
          </div>
          {/* <div className="col-lg-5 text-lg-end mt-4 mt-lg-0">
            <div className="action-buttons-wrapper">
              <div className="digital-clock mb-3 mb-lg-0">
                {currentTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
            </div>
          </div> */}
        </div>

        {/* Stats Grid */}
        <div className="row g-4 mb-5">
          {[
            {
              label: "Total Hours",
              value: `${stats.totalHours}h`, // 4. ค่าจะถูกอัปเดตตรงนี้อัตโนมัติ
              sub: "Recorded work time",
              icon: "schedule",
              color: "blue",
            },
            {
              label: "Daily Avg",
              value: `${stats.averageHours}h`,
              sub: "Per day worked",
              icon: "bar_chart",
              color: "purple",
            },
            {
              label: "On Time",
              value: `${stats.onTimePercentage}%`,
              sub: "Performance",
              icon: "check_circle",
              color: "green",
            },
            {
              label: "Late Days",
              value: stats.lateDays,
              sub: "Total late counts",
              icon: "warning",
              color: "orange",
            },
          ].map((stat, index) => (
            <div className="col-sm-6 col-lg-3" key={index}>
              <div className="card border-0 shadow-sm rounded-4 h-100 hover-lift">
                <div className="card-body p-4">
                  <div className={`icon-box bg-${stat.color}-soft mb-3`}>
                    <span
                      className={`material-symbols-rounded text-${stat.color}`}
                    >
                      {stat.icon}
                    </span>
                  </div>
                  <h3 className="fw-bold mb-1">{stat.value}</h3>
                  <p className="text-secondary mb-1 text-uppercase fs-7 fw-bold ls-1">
                    {stat.label}
                  </p>
                  <small
                    className={`text-${
                      stat.color === "orange" ? "danger" : "success"
                    } fw-medium`}
                  >
                    {stat.sub}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Split */}
        <div className="row g-4">
          {/* Left Column: Attendance & Chart */}
          <div className="col-lg-8">
            {/* Chart Card */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-header bg-transparent border-0 p-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <span className="material-symbols-rounded text-primary">
                    monitoring
                  </span>
                  Weekly Overview
                </h5>
              </div>
              <div className="card-body px-4 pb-4 pt-0">
                <div className="chart-placeholder-modern">
                  {/* Mock Bars */}
                  {[65, 80, 75, 90, 85, 40, 0].map((h, i) => (
                    <div key={i} className="bar-group">
                      <div className="bar" style={{ height: `${h}%` }}></div>
                      <span className="day-label">
                        {["M", "T", "W", "T", "F", "S", "S"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Attendance List */}
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-transparent border-0 p-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">Recent Activity</h5>
                <Link
                  to="/user/attendance"
                  className="text-primary text-decoration-none fw-medium d-flex align-items-center"
                >
                  View All{" "}
                  <span className="material-symbols-rounded fs-5">
                    chevron_right
                  </span>
                </Link>
              </div>
              <div className="card-body p-0">
                {recentAttendance.map((record, index) => (
                  <div
                    key={index}
                    className="attendance-row px-4 py-3 border-bottom-light"
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="date-badge">
                        <span className="day">
                          {new Date(record.date).getDate()}
                        </span>
                        <span className="month">
                          {new Date(record.date).toLocaleDateString("en-US", {
                            month: "short",
                          })}
                        </span>
                      </div>
                      <div>
                        <div className="fw-bold text-dark">
                          {new Date(record.date).toLocaleDateString("en-US", {
                            weekday: "long",
                          })}
                        </div>
                        <div className="text-secondary small">
                          In: {record.checkIn} • Out: {record.checkOut}
                        </div>
                      </div>
                    </div>
                    <span className={`status-pill ${record.status}`}>
                      {record.status === "on-time" ? "On Time" : "Late"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Schedule & Actions */}
          <div className="col-lg-4">
            {/* Quick Actions */}
            <div className="card border-0 shadow-sm rounded-4 mb-4 bg-primary text-white overflow-hidden position-relative">
              <div className="card-body p-4 position-relative z-1">
                <h5 className="fw-bold mb-4">Quick Shortcuts</h5>
                <div className="row g-2">
                  {[
                    {
                      name: "My Schedule",
                      icon: "calendar_month",
                      link: "/user/schedule",
                    },
                    {
                      name: "Leave Request",
                      icon: "beach_access",
                      link: "/user/holidays",
                    },
                    { name: "Report", icon: "description", link: "/report" },
                    { name: "Profile", icon: "person", link: "/profile" },
                  ].map((action, i) => (
                    <div className="col-6" key={i}>
                      <Link to={action.link} className="quick-action-btn">
                        <span className="material-symbols-rounded">
                          {action.icon}
                        </span>
                        <span>{action.name}</span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
              {/* Decorative Circle */}
              <div className="decoration-circle"></div>
            </div>

            {/* Weekly Schedule Mini */}
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-transparent border-0 p-4">
                <h5 className="fw-bold mb-0">This Week</h5>
              </div>
              <div className="card-body p-4 pt-0">
                <div className="d-flex flex-column gap-3">
                  {weeklySchedule.map((day, i) => (
                    <div key={i} className={`mini-schedule-row ${day.status}`}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold day-name">
                          {day.day}, {day.date}
                        </span>
                        {day.status === "today" && (
                          <span className="badge bg-primary">Today</span>
                        )}
                      </div>
                      <div className="text-secondary small d-flex align-items-center gap-1">
                        <span className="material-symbols-rounded fs-6 icon-status">
                          {day.status === "holiday"
                            ? "beach_access"
                            : "schedule"}
                        </span>
                        {day.shift}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
