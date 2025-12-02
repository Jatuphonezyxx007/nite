import React, { useState, useEffect, useContext } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Schedule.css";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

const Schedule = () => {
  const { user } = useContext(AuthContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchSchedule(currentDate.getMonth() + 1, currentDate.getFullYear());
  }, [currentDate]);

  const fetchSchedule = async (month, year) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${apiUrl}/api/schedule/my-schedule`, {
        params: { month, year },
        headers: { Authorization: `Bearer ${token}` },
      });
      setScheduleData(res.data);
    } catch (err) {
      console.error("Error fetching schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (day) => {
    const targetDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    setSelectedDate(targetDate);
  };

  // --- Helpers for Display ---
  const getStatusDisplay = (status) => {
    switch (status) {
      case "ontime":
        return {
          text: "ปกติ",
          color: "#10b981",
          bg: "#d1fae5",
          icon: "check_circle",
        };
      case "present":
        return {
          text: "ปกติ",
          color: "#10b981",
          bg: "#d1fae5",
          icon: "check_circle",
        };
      case "late":
        return {
          text: "สาย",
          color: "#b45309",
          bg: "#ffedd5",
          icon: "warning",
        };
      case "working":
        return {
          text: "กำลังทำ",
          color: "#0369a1",
          bg: "#e0f2fe",
          icon: "timelapse",
        };
      case "absent":
        return {
          text: "ขาดงาน",
          color: "#b91c1c",
          bg: "#fee2e2",
          icon: "cancel",
        };
      default:
        return null;
    }
  };

  // --- Status Mapping (สำหรับ Detail Panel) ---
  const getStatusInfo = (status) => {
    switch (status) {
      case "ontime":
      case "present":
        return {
          label: "เข้างานปกติ",
          icon: "check_circle",
          class: "status-present",
        };
      case "late":
        return {
          label: "มาสาย",
          icon: "history_toggle_off",
          class: "status-late",
        };
      case "working":
        return {
          label: "กำลังทำงาน",
          icon: "timelapse",
          class: "status-working",
        };
      case "absent":
        return { label: "ขาดงาน", icon: "cancel", class: "status-absent" };
      case "holiday":
        return {
          label: "วันหยุด",
          icon: "celebration",
          class: "status-pending",
        };
      case "off":
        return { label: "วันหยุด", icon: "weekend", class: "status-pending" };
      case "leave":
        return {
          label: "ลางาน",
          icon: "flight_takeoff",
          class: "status-pending",
        }; // เพิ่ม case leave
      case "scheduled":
      default:
        return { label: "รอลงเวลา", icon: "schedule", class: "status-pending" };
    }
  };

  const getSelectedDayData = () => {
    if (!selectedDate) return { shifts: [], holiday: null, leaves: [] };
    const offset = selectedDate.getTimezoneOffset();
    const dateLocal = new Date(selectedDate.getTime() - offset * 60 * 1000);
    const dateStr = dateLocal.toISOString().split("T")[0];

    const dayData = scheduleData.filter((s) => s.date === dateStr);

    const shifts = dayData.filter((s) => s.type === "work");
    const leaves = dayData.filter((s) => s.type === "leave");
    const holiday = dayData.find(
      (s) => s.type === "holiday" || s.type === "off"
    );

    // รวม leaves เข้าไปใน shifts เพื่อแสดงใน Detail Panel หรือแยกก็ได้
    // ในที่นี้ขอแยกส่งออกไปเพื่อให้จัดการง่าย
    return { shifts, holiday, leaves };
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        i
      );
      const offset = dateObj.getTimezoneOffset();
      const dateLocal = new Date(dateObj.getTime() - offset * 60 * 1000);
      const dateStr = dateLocal.toISOString().split("T")[0];

      // Filter Data
      const dayData = scheduleData.filter((s) => s.date === dateStr);
      const dayShifts = dayData.filter((s) => s.type === "work");
      const dayLeaves = dayData.filter((s) => s.type === "leave");
      const holiday = dayData.find(
        (s) => s.type === "holiday" || s.type === "off"
      );

      const isToday = new Date().toDateString() === dateObj.toDateString();
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const isSelected =
        selectedDate && selectedDate.toDateString() === dateObj.toDateString();

      // Border Color Logic
      let boxClass = "";
      if (dayShifts.some((s) => s.status === "absent")) boxClass = "absent";

      days.push(
        <div
          key={i}
          className={`calendar-day 
            ${isToday ? "today" : ""} 
            ${isWeekend ? "weekend" : ""} 
            ${isSelected ? "selected" : ""} 
            ${holiday?.type === "holiday" ? "holiday" : ""}
            ${boxClass}
          `}
          onClick={() => handleDateClick(i)}
        >
          {/* Header: Date Number */}
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="day-number">{i}</span>
            {(dayShifts.length > 0 || dayLeaves.length > 0) && (
              <span
                className="badge rounded-pill bg-light text-secondary border"
                style={{ fontSize: "0.55rem" }}
              >
                {dayShifts.length + dayLeaves.length}
              </span>
            )}
          </div>

          {/* 1. Holiday Label */}
          {holiday && (
            <div className="holiday-label" title={holiday.title}>
              <span
                className="material-symbols-rounded"
                style={{ fontSize: "12px" }}
              >
                {holiday.type === "holiday" ? "celebration" : "weekend"}
              </span>
              <span>{holiday.title}</span>
            </div>
          )}

          {/* 2. Leaves (แสดงก่อนงาน) */}
          {dayLeaves.map((leave, idx) => (
            <div
              key={`leave-${idx}`}
              className="mb-1 px-1 rounded text-white text-truncate d-flex align-items-center"
              style={{
                backgroundColor: leave.color || "#a855f7",
                fontSize: "0.65rem",
                paddingTop: "2px",
                paddingBottom: "2px",
              }}
              title={leave.title}
            >
              <span
                className="material-symbols-rounded me-1"
                style={{ fontSize: "10px" }}
              >
                flight_takeoff
              </span>
              {leave.title}
            </div>
          ))}

          {/* 3. Shifts (Work) */}
          <div className="d-flex flex-column gap-1">
            {dayShifts.slice(0, 2).map((shift, idx) => {
              const statusMeta = getStatusDisplay(shift.status);

              return (
                <div
                  key={`shift-${idx}`}
                  className="p-1 rounded position-relative"
                  style={{
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #e9ecef",
                  }}
                >
                  {/* Pill 1: Shift Info (แผนงาน) */}
                  <div className="d-flex align-items-center gap-1">
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: shift.color || "#ccc",
                        flexShrink: 0,
                      }}
                    ></span>
                    <span
                      className="text-truncate fw-bold text-dark"
                      style={{ fontSize: "0.65rem" }}
                    >
                      {shift.title}
                    </span>
                  </div>

                  {/* Pill 2: Attendance Status (ผลลัพธ์) - แสดงเมื่อมีสถานะแล้ว */}
                  {statusMeta && (
                    <div
                      className="mt-1 rounded px-1 d-flex align-items-center justify-content-center gap-1"
                      style={{
                        backgroundColor: statusMeta.bg,
                        color: statusMeta.color,
                        border: `1px solid ${statusMeta.color}30`, // 30 opacity
                        fontSize: "0.6rem",
                        fontWeight: 600,
                      }}
                    >
                      <span
                        className="material-symbols-rounded"
                        style={{ fontSize: "10px" }}
                      >
                        {statusMeta.icon}
                      </span>
                      {statusMeta.text}
                    </div>
                  )}
                </div>
              );
            })}

            {/* ถ้ามีรายการเกิน 2 (รวม leave และ shift) ให้แสดง +More */}
            {dayShifts.length + dayLeaves.length > 3 && (
              <small
                className="text-muted text-center d-block"
                style={{ fontSize: "0.6rem", marginTop: "-2px" }}
              >
                +{dayShifts.length + dayLeaves.length - 2} รายการ
              </small>
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  const monthNames = [
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

  const {
    shifts: selectedShifts,
    holiday: selectedHoliday,
    leaves: selectedLeaves,
  } = getSelectedDayData();

  // รวมรายการทั้งหมดเพื่อแสดงใน Detail Panel
  const allDetailItems = [
    ...selectedLeaves.map((l) => ({ ...l, isLeave: true })),
    ...selectedShifts.map((s) => ({ ...s, isLeave: false })),
  ];

  return (
    <div className="container-fluid py-4 px-4 mt-4">
      <div className="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
            <span
              className="material-symbols-rounded text-primary"
              style={{ fontSize: "36px" }}
            >
              calendar_month
            </span>
            ตารางงานของฉัน
          </h2>
          <p className="text-muted m-0">
            ตรวจสอบกะงาน, วันลา และประวัติการลงเวลา
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* Left: Calendar */}
        <div className="col-lg-8 col-xl-9">
          <div className="calendar-container h-100">
            <div className="calendar-header">
              <h4 className="fw-bold m-0 text-primary">
                {monthNames[currentDate.getMonth()]}{" "}
                <span className="text-dark">
                  {currentDate.getFullYear() + 543}
                </span>
              </h4>
              <div className="d-flex gap-2">
                <button className="nav-btn" onClick={handlePrevMonth}>
                  <span className="material-symbols-rounded">chevron_left</span>
                </button>
                <button
                  className="nav-btn"
                  onClick={() => {
                    const now = new Date();
                    setCurrentDate(now);
                    setSelectedDate(now);
                  }}
                >
                  <span className="material-symbols-rounded">today</span>
                </button>
                <button className="nav-btn" onClick={handleNextMonth}>
                  <span className="material-symbols-rounded">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div
                  className="spinner-border text-primary"
                  role="status"
                ></div>
              </div>
            ) : (
              <>
                <div className="calendar-grid mb-2">
                  {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day) => (
                    <div key={day} className="weekday-header">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="calendar-grid">{renderCalendar()}</div>

                {/* Legend Updated */}
                <div className="d-flex gap-3 mt-3 pt-3 border-top justify-content-center flex-wrap small text-muted">
                  <div className="d-flex align-items-center gap-1">
                    <span
                      className="material-symbols-rounded text-success"
                      style={{ fontSize: "16px" }}
                    >
                      check_circle
                    </span>{" "}
                    มาปกติ
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <span
                      className="material-symbols-rounded text-warning"
                      style={{ fontSize: "16px" }}
                    >
                      warning
                    </span>{" "}
                    สาย
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <span
                      className="material-symbols-rounded text-danger"
                      style={{ fontSize: "16px" }}
                    >
                      cancel
                    </span>{" "}
                    ขาด
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <span
                      className="material-symbols-rounded text-info"
                      style={{ fontSize: "16px" }}
                    >
                      timelapse
                    </span>{" "}
                    กำลังทำ
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <span
                      className="material-symbols-rounded"
                      style={{ fontSize: "16px", color: "#a855f7" }}
                    >
                      flight_takeoff
                    </span>{" "}
                    ลางาน
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div className="col-lg-4 col-xl-3">
          <div className="detail-panel">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2 border-bottom pb-3">
              <span className="material-symbols-rounded text-primary">
                event_note
              </span>
              {selectedDate
                ? selectedDate.toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "รายละเอียด"}
            </h5>

            {selectedHoliday && (
              <div className="holiday-banner fade-in">
                <span className="material-symbols-rounded d-block fs-1 mb-2">
                  {selectedHoliday.type === "holiday"
                    ? "celebration"
                    : "weekend"}
                </span>
                <h5 className="fw-bold m-0">{selectedHoliday.title}</h5>
                <small>
                  {selectedHoliday.type === "holiday"
                    ? "วันหยุดบริษัท"
                    : "วันหยุดประจำสัปดาห์"}
                </small>
              </div>
            )}

            {allDetailItems.length > 0 ? (
              <div
                className="d-flex flex-column gap-3 overflow-auto"
                style={{ maxHeight: "600px" }}
              >
                {allDetailItems.map((item, idx) => {
                  const statusInfo = getStatusInfo(item.status);

                  // Detail for Leaves
                  if (item.isLeave) {
                    return (
                      <div
                        key={`d-leave-${idx}`}
                        className="detail-row"
                        style={{ borderLeft: `4px solid ${item.color}` }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <span
                              className="badge mb-2"
                              style={{ backgroundColor: item.color }}
                            >
                              {item.title}
                            </span>
                            <h6 className="mb-0 fw-bold text-dark">
                              {user?.name_th}
                            </h6>
                            <small className="text-muted">ขออนุมัติลา</small>
                          </div>
                          <span
                            className="material-symbols-rounded text-muted opacity-25"
                            style={{ fontSize: "32px" }}
                          >
                            flight_takeoff
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // Detail for Shifts
                  return (
                    <div key={`d-shift-${idx}`} className="detail-row">
                      <div className="d-flex align-items-center w-100 mb-2">
                        <div className="user-avatar">
                          {user?.name_th ? user.name_th.charAt(0) : "U"}
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-0 fw-bold text-dark">
                            {user?.name_th}
                          </h6>
                          <small className="text-muted">{user?.position}</small>
                        </div>
                      </div>

                      <div className="mb-2 ps-1">
                        <span
                          className="badge rounded-pill border"
                          style={{
                            backgroundColor: item.color || "#f8f9fa",
                            color: "#fff",
                            borderColor: item.color,
                          }}
                        >
                          {item.title}
                        </span>
                      </div>

                      <div className="w-100 ps-1">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <small className="text-muted d-flex align-items-center gap-1">
                            <span
                              className="material-symbols-rounded"
                              style={{ fontSize: "16px" }}
                            >
                              schedule
                            </span>
                            {item.shift}
                          </small>
                          <div
                            className={`status-badge-lg ${statusInfo.class}`}
                          >
                            <span
                              className="material-symbols-rounded"
                              style={{ fontSize: "14px" }}
                            >
                              {statusInfo.icon}
                            </span>
                            {statusInfo.label}
                          </div>
                        </div>

                        {(item.status === "ontime" ||
                          item.status === "late" ||
                          item.status === "working") && (
                          <div className="attendance-info-box">
                            <div className="time-entry mb-2">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="text-success fw-bold small">
                                  <i className="bi bi-box-arrow-in-right me-1"></i>
                                  เข้างาน
                                </span>
                                <span className="fw-bold text-dark">
                                  {item.checkIn || "-"}
                                </span>
                              </div>
                              {item.checkInImage && (
                                <div className="img-thumbnail-wrapper">
                                  <img
                                    src={`${apiUrl}/uploads/${item.checkInImage}`}
                                    alt="Check In"
                                    onClick={() =>
                                      window.open(
                                        `${apiUrl}/uploads/${item.checkInImage}`
                                      )
                                    }
                                  />
                                </div>
                              )}
                            </div>

                            {item.checkOut && item.checkOut !== "-" && (
                              <div className="time-entry">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="text-danger fw-bold small">
                                    <i className="bi bi-box-arrow-right me-1"></i>
                                    ออกงาน
                                  </span>
                                  <span className="fw-bold text-dark">
                                    {item.checkOut}
                                  </span>
                                </div>
                                {item.checkOutImage && (
                                  <div className="img-thumbnail-wrapper">
                                    <img
                                      src={`${apiUrl}/uploads/${item.checkOutImage}`}
                                      alt="Check Out"
                                      onClick={() =>
                                        window.open(
                                          `${apiUrl}/uploads/${item.checkOutImage}`
                                        )
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {item.status === "absent" && (
                          <div className="alert alert-danger py-2 px-3 small m-0 text-center">
                            ไม่พบข้อมูลการลงเวลา
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              !selectedHoliday && (
                <div className="text-center py-5 text-muted opacity-50 h-100 d-flex flex-column justify-content-center align-items-center">
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: "64px" }}
                  >
                    event_busy
                  </span>
                  <p className="mt-2">ไม่มีตารางงาน</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
