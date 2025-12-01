import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Schedule.css";

// --- Helper: สร้างวันที่แบบ Dynamic ---
const getDateString = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0]; // Returns YYYY-MM-DD
};

// --- MOCK DATA: สร้างข้อมูลจำลองตามวันจริง ---
const mockSchedules = [
  // 1. อดีต: มาปกติ (3 วันที่แล้ว)
  {
    id: 101,
    date: getDateString(-3),
    empName: "จตุ (Jatu)",
    role: "Frontend",
    shift: "morning",
    time: "08:00 - 17:00",
    status: "present",
    checkIn: "07:55",
    checkOut: "17:05",
  },
  // 2. อดีต: มาสาย (2 วันที่แล้ว)
  {
    id: 102,
    date: getDateString(-2),
    empName: "สมชาย",
    role: "Backend",
    shift: "night",
    time: "22:00 - 06:00",
    status: "late",
    checkIn: "22:15",
    checkOut: "06:00",
  },
  // 3. อดีต: ขาดงาน (เมื่อวาน)
  {
    id: 103,
    date: getDateString(-1),
    empName: "วิภา",
    role: "QA",
    shift: "afternoon",
    time: "13:00 - 22:00",
    status: "absent",
    checkIn: "-",
    checkOut: "-",
  },
  // 4. ปัจจุบัน (วันนี้): กำลังทำงาน (Working)
  {
    id: 104,
    date: getDateString(0),
    empName: "จตุ (Jatu)",
    role: "Frontend",
    shift: "morning",
    time: "08:00 - 17:00",
    status: "working", // กำลังปฏิบัติงาน
    checkIn: "07:58",
    checkOut: null, // ยังไม่ออก
  },
  {
    id: 105,
    date: getDateString(0),
    empName: "อารีย์",
    role: "Designer",
    shift: "afternoon",
    time: "13:00 - 22:00",
    status: "pending", // ยังไม่ถึงเวลาเข้างาน
    checkIn: null,
    checkOut: null,
  },
  // 5. อนาคต: กะงานที่กำลังจะมาถึง (พรุ่งนี้)
  {
    id: 106,
    date: getDateString(1),
    empName: "มานะ",
    role: "DevOps",
    shift: "morning",
    time: "08:00 - 17:00",
    status: "pending",
  },
  {
    id: 107,
    date: getDateString(1),
    empName: "จตุ (Jatu)",
    role: "Frontend",
    shift: "morning",
    time: "08:00 - 17:00",
    status: "pending",
  },
  // 6. อนาคต: อีก 2 วัน
  {
    id: 108,
    date: getDateString(2),
    empName: "สมชาย",
    role: "Backend",
    shift: "night",
    time: "22:00 - 06:00",
    status: "pending",
  },
];

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedShifts, setSelectedShifts] = useState([]);

  // Init Data: Load today's shift on mount
  useEffect(() => {
    handleDateClick(new Date().getDate());
  }, []);

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
    // Format YYYY-MM-DD with Local Timezone consideration
    const offset = targetDate.getTimezoneOffset();
    const dateLocal = new Date(targetDate.getTime() - offset * 60 * 1000);
    const clickDateStr = dateLocal.toISOString().split("T")[0];

    const shifts = mockSchedules.filter((s) => s.date === clickDateStr);
    setSelectedDate(targetDate);
    setSelectedShifts(shifts);
  };

  // Helper สำหรับการแสดงผลสถานะ
  const getStatusInfo = (status) => {
    switch (status) {
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
      case "absent":
        return { label: "ขาดงาน", icon: "cancel", class: "status-absent" };
      case "working":
        return {
          label: "กำลังทำงาน",
          icon: "timelapse",
          class: "status-working",
        };
      default:
        return { label: "รอลงเวลา", icon: "schedule", class: "status-pending" };
    }
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

      // Fix Local Date String issue
      const offset = dateObj.getTimezoneOffset();
      const dateLocal = new Date(dateObj.getTime() - offset * 60 * 1000);
      const dateStr = dateLocal.toISOString().split("T")[0];

      const dayShifts = mockSchedules.filter((s) => s.date === dateStr);
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

          <div className="d-flex flex-column gap-1 mt-1">
            {dayShifts.slice(0, 3).map(
              (
                shift,
                idx // Show up to 3 items
              ) => (
                <div key={idx} className={`shift-item shift-${shift.shift}`}>
                  <span className={`status-dot-mini ${shift.status}`}></span>
                  <span>{shift.empName.split(" ")[0]}</span>
                </div>
              )
            )}
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
            Shift & Attendance
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
                <div className="nav-btn" onClick={handlePrevMonth}>
                  <span className="material-symbols-rounded">chevron_left</span>
                </div>
                <div
                  className="nav-btn"
                  onClick={() => {
                    setCurrentDate(new Date());
                    setSelectedDate(new Date());
                  }}
                >
                  <span className="material-symbols-rounded">today</span>
                </div>
                <div className="nav-btn" onClick={handleNextMonth}>
                  <span className="material-symbols-rounded">
                    chevron_right
                  </span>
                </div>
              </div>
            </div>

            <div className="calendar-grid mb-2">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                <div key={day} className="weekday-header">
                  {day}
                </div>
              ))}
            </div>

            <div className="calendar-grid">{renderCalendar()}</div>
          </div>
        </div>

        {/* Detail Panel */}
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

            {selectedShifts.length > 0 ? (
              <div
                className="d-flex flex-column gap-2 overflow-auto"
                style={{ maxHeight: "600px" }}
              >
                {selectedShifts.map((s) => {
                  const statusInfo = getStatusInfo(s.status);

                  return (
                    <div key={s.id} className="detail-row">
                      {/* Row Header */}
                      <div className="d-flex align-items-center w-100 mb-2">
                        <div className="user-avatar">{s.empName.charAt(0)}</div>
                        <div className="flex-grow-1">
                          <h6 className="mb-0 fw-bold text-dark">
                            {s.empName}
                          </h6>
                          <small className="text-muted">{s.role}</small>
                        </div>
                        <div className="text-end">
                          <span
                            className={`badge rounded-pill 
                                        ${
                                          s.shift === "morning"
                                            ? "bg-primary-subtle text-primary"
                                            : s.shift === "night"
                                            ? "bg-purple-subtle text-purple"
                                            : "bg-warning-subtle text-warning"
                                        } 
                                        mb-1 d-inline-block border`}
                          >
                            {s.shift.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Row Body: Info */}
                      <div className="w-100 ps-1">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <small className="text-muted d-flex align-items-center gap-1">
                            <span
                              className="material-symbols-rounded"
                              style={{ fontSize: "16px" }}
                            >
                              schedule
                            </span>
                            {s.time}
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

                        {/* แสดงเวลาเข้าออกจริง เฉพาะถ้ามีการลงเวลาแล้ว (Present, Late, Working) */}
                        {(s.status === "present" ||
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
                            {s.checkOut && (
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
                            {!s.checkOut && s.status === "working" && (
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
              <div className="text-center py-5 text-muted opacity-50 h-100 d-flex flex-column justify-content-center align-items-center">
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: "64px" }}
                >
                  event_busy
                </span>
                <p className="mt-2">ไม่มีตารางงานในวันนี้</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
