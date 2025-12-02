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
      case "scheduled":
      default:
        return { label: "รอลงเวลา", icon: "schedule", class: "status-pending" };
    }
  };

  // --- Helper: Get Status Color for Dot ---
  const getStatusDotColor = (status) => {
    switch (status) {
      case "ontime":
        return "#10b981"; // เขียว
      case "late":
        return "#f59e0b"; // ส้ม
      case "absent":
        return "#ef4444"; // แดง
      case "working":
        return "#3b82f6"; // ฟ้า (กำลังทำ)
      default:
        return null; // ไม่แสดงถ้ายังไม่ถึงเวลา (scheduled)
    }
  };

  const getSelectedDayData = () => {
    if (!selectedDate) return { shifts: [], holiday: null };
    const offset = selectedDate.getTimezoneOffset();
    const dateLocal = new Date(selectedDate.getTime() - offset * 60 * 1000);
    const dateStr = dateLocal.toISOString().split("T")[0];

    const shifts = scheduleData.filter(
      (s) => s.date === dateStr && s.type === "work"
    );
    const holiday = scheduleData.find(
      (s) => s.date === dateStr && (s.type === "holiday" || s.type === "off")
    );
    return { shifts, holiday };
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

      const dayData = scheduleData.filter((s) => s.date === dateStr);
      const dayShifts = dayData.filter((s) => s.type === "work");
      const holiday = dayData.find(
        (s) => s.type === "holiday" || s.type === "off"
      );

      const isToday = new Date().toDateString() === dateObj.toDateString();
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const isSelected =
        selectedDate && selectedDate.toDateString() === dateObj.toDateString();

      // Border Color Logic (ยังคงไว้สำหรับ Absent ทั้งวัน)
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
          <div className="d-flex justify-content-between align-items-center">
            <span className="day-number">{i}</span>
            {dayShifts.length > 0 && (
              <span
                className="badge rounded-pill bg-secondary text-white border border-white"
                style={{ fontSize: "0.6rem" }}
              >
                {dayShifts.length}
              </span>
            )}
          </div>

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

          <div className="d-flex flex-column gap-1 mt-1">
            {dayShifts.slice(0, 3).map((shift, idx) => {
              const statusColor = getStatusDotColor(shift.status);

              return (
                <div key={idx} className="shift-item" title={shift.title}>
                  <div
                    className="d-flex align-items-center gap-1"
                    style={{ width: "12px" }}
                  >
                    {/* Dot 1: Shift Color (บอกกะ) */}
                    <span
                      className="status-dot-mini"
                      style={{ backgroundColor: shift.color || "#ccc" }}
                    ></span>

                    {/* Dot 2: Status Color (บอกสถานะ - ถ้ามี) */}
                    {statusColor && (
                      <span
                        className="status-dot-mini"
                        style={{
                          backgroundColor: statusColor,
                          borderRadius: "2px", // ทำให้เป็นสี่เหลี่ยมมนนิดๆ เพื่อแยกความต่าง
                          width: "5px",
                          height: "5px",
                        }}
                        title={shift.status}
                      ></span>
                    )}
                  </div>

                  <span className="text-truncate">{shift.title}</span>
                </div>
              );
            })}

            {dayShifts.length > 3 && (
              <small
                className="text-muted text-center"
                style={{ fontSize: "0.65rem" }}
              >
                +{dayShifts.length - 3}
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
  const { shifts: selectedShifts, holiday: selectedHoliday } =
    getSelectedDayData();

  return (
    <div className="container-fluid py-4 px-4 mt-4">
      {/* ... (Header เหมือนเดิม) ... */}
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
          <p className="text-muted m-0">ตรวจสอบกะงานและประวัติการลงเวลา</p>
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

                {/* Legend อธิบายจุดสี */}
                <div className="d-flex gap-3 mt-3 pt-3 border-top justify-content-center flex-wrap small text-muted">
                  <div className="d-flex align-items-center gap-1">
                    <span
                      className="status-dot-mini"
                      style={{
                        backgroundColor: "#10b981",
                        borderRadius: "2px",
                      }}
                    ></span>{" "}
                    มาปกติ
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <span
                      className="status-dot-mini"
                      style={{
                        backgroundColor: "#f59e0b",
                        borderRadius: "2px",
                      }}
                    ></span>{" "}
                    สาย
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <span
                      className="status-dot-mini"
                      style={{
                        backgroundColor: "#ef4444",
                        borderRadius: "2px",
                      }}
                    ></span>{" "}
                    ขาด
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <span
                      className="status-dot-mini"
                      style={{
                        backgroundColor: "#3b82f6",
                        borderRadius: "2px",
                      }}
                    ></span>{" "}
                    กำลังทำ
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Detail Panel (ส่วนนี้เหมือนเดิม) */}
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

            {selectedShifts.length > 0 ? (
              <div
                className="d-flex flex-column gap-3 overflow-auto"
                style={{ maxHeight: "600px" }}
              >
                {selectedShifts.map((s, idx) => {
                  const statusInfo = getStatusInfo(s.status);
                  return (
                    <div key={idx} className="detail-row">
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
                            backgroundColor: s.color || "#f8f9fa",
                            color: "#fff",
                            borderColor: s.color,
                          }}
                        >
                          {s.title}
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
                            {s.shift}
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

                        {(s.status === "ontime" ||
                          s.status === "late" ||
                          s.status === "working") && (
                          <div className="attendance-info-box">
                            <div className="time-entry mb-2">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="text-success fw-bold small">
                                  <i className="bi bi-box-arrow-in-right me-1"></i>
                                  เข้างาน
                                </span>
                                <span className="fw-bold text-dark">
                                  {s.checkIn || "-"}
                                </span>
                              </div>
                              {s.checkInImage && (
                                <div className="img-thumbnail-wrapper">
                                  <img
                                    src={`${apiUrl}/uploads/${s.checkInImage}`}
                                    alt="Check In"
                                    onClick={() =>
                                      window.open(
                                        `${apiUrl}/uploads/${s.checkInImage}`
                                      )
                                    }
                                  />
                                </div>
                              )}
                            </div>

                            {s.checkOut && s.checkOut !== "-" && (
                              <div className="time-entry">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="text-danger fw-bold small">
                                    <i className="bi bi-box-arrow-right me-1"></i>
                                    ออกงาน
                                  </span>
                                  <span className="fw-bold text-dark">
                                    {s.checkOut}
                                  </span>
                                </div>
                                {s.checkOutImage && (
                                  <div className="img-thumbnail-wrapper">
                                    <img
                                      src={`${apiUrl}/uploads/${s.checkOutImage}`}
                                      alt="Check Out"
                                      onClick={() =>
                                        window.open(
                                          `${apiUrl}/uploads/${s.checkOutImage}`
                                        )
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {s.status === "absent" && (
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
