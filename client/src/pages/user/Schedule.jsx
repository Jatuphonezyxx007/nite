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

  // --- Status Configuration ---
  const getStatusInfo = (status) => {
    switch (status) {
      case "ontime":
      case "present":
        return {
          label: "มาปกติ",
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
        return {
          label: "วันหยุดประจำสัปดาห์",
          icon: "weekend",
          class: "status-pending",
        };
      case "scheduled":
      default:
        return { label: "รอลงเวลา", icon: "schedule", class: "status-pending" };
    }
  };

  // ดึงข้อมูลกะงานและวันหยุดของวันที่เลือก
  const getSelectedDayData = () => {
    if (!selectedDate) return { shifts: [], holiday: null };

    const offset = selectedDate.getTimezoneOffset();
    const dateLocal = new Date(selectedDate.getTime() - offset * 60 * 1000);
    const dateStr = dateLocal.toISOString().split("T")[0];

    // กรอง Work Shifts
    const shifts = scheduleData.filter(
      (s) => s.date === dateStr && s.type === "work"
    );

    // หา Holiday หรือ Off Day
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

      days.push(
        <div
          key={i}
          className={`calendar-day 
            ${isToday ? "today" : ""} 
            ${isWeekend ? "weekend" : ""} 
            ${isSelected ? "selected" : ""} 
            ${holiday?.type === "holiday" ? "holiday" : ""}
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

          {/* Holiday / Off Label */}
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

          {/* Shift Items */}
          <div className="d-flex flex-column gap-1 mt-1">
            {dayShifts.slice(0, 3).map((shift, idx) => {
              // Map status for CSS class
              let statusClass = "pending";
              if (shift.status === "ontime") statusClass = "present";
              else if (shift.status === "scheduled") statusClass = "pending";
              else statusClass = shift.status; // late, absent, working

              return (
                <div
                  key={idx}
                  className="shift-item"
                  title={`${shift.title} (${shift.shift})`}
                >
                  <span className={`status-dot-mini ${statusClass}`}></span>
                  <span>{shift.title}</span>
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
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const { shifts: selectedShifts, holiday: selectedHoliday } =
    getSelectedDayData();

  return (
    <div className="container-fluid py-4 px-4 mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
            <span
              className="material-symbols-rounded text-primary"
              style={{ fontSize: "36px" }}
            >
              calendar_month
            </span>
            My Schedule
          </h2>
          <p className="text-muted m-0">ตรวจสอบกะงานและการลงเวลาเข้า-ออก</p>
        </div>

        {/* Legend */}
        <div className="d-flex gap-3 align-items-center bg-white px-3 py-2 rounded-pill shadow-sm border flex-wrap">
          <div className="d-flex align-items-center gap-1">
            <span className="status-dot-mini present"></span>
            <small>ปกติ</small>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span className="status-dot-mini late"></span>
            <small>สาย</small>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span className="status-dot-mini working"></span>
            <small>กำลังทำ</small>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span className="status-dot-mini absent"></span>
            <small>ขาด</small>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span className="status-dot-mini pending"></span>
            <small>รอ</small>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Calendar */}
        <div className="col-lg-8 col-xl-9">
          <div className="calendar-container h-100">
            <div className="calendar-header">
              <h4 className="fw-bold m-0 text-primary">
                {monthNames[currentDate.getMonth()]}{" "}
                <span className="text-dark">{currentDate.getFullYear()}</span>
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
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                <div className="calendar-grid mb-2">
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                    (day) => (
                      <div key={day} className="weekday-header">
                        {day}
                      </div>
                    )
                  )}
                </div>
                <div className="calendar-grid">{renderCalendar()}</div>
              </>
            )}
          </div>
        </div>

        {/* Side Panel */}
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

            {/* Holiday / Off Banner */}
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
                    ? "วันหยุดราชการ"
                    : "วันหยุดพักผ่อน"}
                </small>
              </div>
            )}

            {/* Shift List */}
            {selectedShifts.length > 0 ? (
              <div
                className="d-flex flex-column gap-2 overflow-auto"
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
                            {user?.name_th || "User"}
                          </h6>
                          <small className="text-muted">
                            {user?.position || "Employee"}
                          </small>
                        </div>
                        {/* <div className="text-end">
                          <span className="badge rounded-pill bg-light text-dark border">
                            {s.title}
                          </span>
                        </div> */}
                      </div>
                      <div className="mb-2 ps-1">
                        <span className="badge rounded-pill bg-light text-dark border">
                          {s.title}
                        </span>
                      </div>

                      <div className="w-100 ps-1">
                        <div className="d-flex justify-content-between align-items-center mb-2">
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

                        {/* Show Check-in/out only if action taken */}
                        {(s.status === "ontime" ||
                          s.status === "late" ||
                          s.status === "working") && (
                          <div className="attendance-info">
                            <div className="time-pill">
                              <span
                                className="material-symbols-rounded text-success"
                                style={{ fontSize: "16px" }}
                              >
                                login
                              </span>
                              IN: {s.checkIn || "-"}
                            </div>
                            {s.checkOut && s.checkOut !== "-" && (
                              <div className="time-pill">
                                <span
                                  className="material-symbols-rounded text-danger"
                                  style={{ fontSize: "16px" }}
                                >
                                  logout
                                </span>
                                OUT: {s.checkOut}
                              </div>
                            )}
                            {(!s.checkOut || s.checkOut === "-") &&
                              s.status === "working" && (
                                <div className="time-pill border-0 bg-transparent text-primary">
                                  <span className="spinner-grow spinner-grow-sm me-1"></span>{" "}
                                  On Duty
                                </div>
                              )}
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
                  <p className="mt-2">ไม่มีตารางงานในวันนี้</p>
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
