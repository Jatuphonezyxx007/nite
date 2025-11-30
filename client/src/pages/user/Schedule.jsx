import React, { useState, useEffect } from "react";
import "./Schedule.css";

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [scheduleData, setScheduleData] = useState([]);

  // --- Mock Data: จำลองข้อมูลกะงาน ---
  useEffect(() => {
    // ในโปรเจ็คจริง ให้ fetch API ตามเดือน/ปี ที่เลือก
    const mockData = [
      {
        date: "2025-11-03",
        type: "work",
        status: "ontime",
        shift: "09:00 - 18:00",
        checkIn: "08:55",
        checkOut: "18:05",
      },
      {
        date: "2025-11-04",
        type: "work",
        status: "late",
        shift: "09:00 - 18:00",
        checkIn: "09:15",
        checkOut: "18:00",
      },
      {
        date: "2025-11-05",
        type: "holiday",
        title: "วันลอยกระทง",
        status: "holiday",
      },
      {
        date: "2025-11-06",
        type: "work",
        status: "ontime",
        shift: "09:00 - 18:00",
        checkIn: "08:45",
        checkOut: "18:10",
      },
      { date: "2025-11-07", type: "leave", title: "ลาป่วย", status: "leave" },
      {
        date: "2025-11-10",
        type: "work",
        status: "absent",
        shift: "09:00 - 18:00",
        title: "ขาดงาน",
      },
      // ... ข้อมูลอื่นๆ
    ];
    setScheduleData(mockData);
  }, [currentDate]);

  // --- Calendar Logic ---
  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    // ปรับให้วันจันทร์เป็นวันแรกของสัปดาห์ (0 = Mon, 6 = Sun)
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    // Auto select today
    const todayStr = today.toISOString().split("T")[0];
    const todayData = scheduleData.find((d) => d.date === todayStr);
    setSelectedDay(todayData || { date: todayStr, type: "empty" });
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const isToday = new Date().toISOString().split("T")[0] === dateStr;
      const data = scheduleData.find((d) => d.date === dateStr);
      const isSelected = selectedDay && selectedDay.date === dateStr;

      let statusClass = "";
      if (data) statusClass = data.status;

      days.push(
        <div
          key={day}
          className={`calendar-day ${statusClass} ${isToday ? "today" : ""} ${
            isSelected ? "selected" : ""
          }`}
          onClick={() =>
            setSelectedDay(data || { date: dateStr, type: "empty" })
          }
        >
          <span className="day-number">{day}</span>

          {/* Badge Indicators */}
          <div className="day-content">
            {data && (
              <>
                {data.type === "work" && (
                  <div className="shift-pill">
                    {data.status === "ontime" && (
                      <span className="material-symbols-rounded icon-mini">
                        check
                      </span>
                    )}
                    {data.status === "late" && (
                      <span className="material-symbols-rounded icon-mini">
                        warning
                      </span>
                    )}
                    {data.status === "absent" && (
                      <span className="material-symbols-rounded icon-mini">
                        close
                      </span>
                    )}
                    <span className="shift-text d-none d-sm-inline">
                      {data.shift.split(" - ")[0]}
                    </span>
                  </div>
                )}
                {(data.type === "holiday" || data.type === "leave") && (
                  <div className={`event-pill ${data.type}`}>
                    <span className="event-text">{data.title}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="schedule-page fade-in">
      <div className="container-xl py-4">
        {/* Header & Controls */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h2 className="fw-bold text-dark m-0">ตารางงานของฉัน</h2>
            <p className="text-muted m-0">ตรวจสอบกะงานและประวัติการเข้างาน</p>
          </div>

          <div className="calendar-controls">
            <button className="btn-nav" onClick={prevMonth}>
              <span className="material-symbols-rounded">chevron_left</span>
            </button>
            <div className="current-month">
              <span className="material-symbols-rounded text-primary fs-5 me-2">
                calendar_month
              </span>
              {currentDate.toLocaleDateString("th-TH", {
                month: "long",
                year: "numeric",
              })}
            </div>
            <button className="btn-nav" onClick={nextMonth}>
              <span className="material-symbols-rounded">chevron_right</span>
            </button>
            <button className="btn-today ms-2" onClick={goToToday}>
              วันนี้
            </button>
          </div>
        </div>

        {/* Legend / Stats Summary */}
        <div className="schedule-stats mb-4">
          <div className="stat-item">
            <span className="dot ontime"></span> มาปกติ
          </div>
          <div className="stat-item">
            <span className="dot late"></span> มาสาย
          </div>
          <div className="stat-item">
            <span className="dot leave"></span> ลางาน
          </div>
          <div className="stat-item">
            <span className="dot holiday"></span> วันหยุด
          </div>
          <div className="stat-item">
            <span className="dot absent"></span> ขาดงาน
          </div>
        </div>

        <div className="row g-4">
          {/* Calendar Grid */}
          <div className="col-lg-8">
            <div className="calendar-wrapper card border-0 shadow-sm rounded-4">
              <div className="weekdays-grid">
                {["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."].map((day) => (
                  <div key={day} className="weekday-header">
                    {day}
                  </div>
                ))}
              </div>
              <div className="days-grid">{renderCalendarDays()}</div>
            </div>
          </div>

          {/* Side Panel: Detail View */}
          <div className="col-lg-4">
            <div className="detail-panel card border-0 shadow-sm rounded-4 p-4 h-100">
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                <span className="material-symbols-rounded text-primary">
                  info
                </span>
                รายละเอียด
              </h5>

              {selectedDay ? (
                <div className="selected-day-info fade-in">
                  <div className="date-large mb-3">
                    {new Date(selectedDay.date).toLocaleDateString("th-TH", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </div>

                  {selectedDay.type === "work" ? (
                    <>
                      <div
                        className={`status-badge-lg mb-4 ${selectedDay.status}`}
                      >
                        {selectedDay.status === "ontime" && "เข้างานปกติ"}
                        {selectedDay.status === "late" && "มาสาย"}
                        {selectedDay.status === "absent" && "ขาดงาน"}
                      </div>

                      <div className="info-row">
                        <span className="label">กะงาน:</span>
                        <span className="value fw-bold">
                          {selectedDay.shift}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="label">เข้างาน:</span>
                        <span className="value text-success">
                          {selectedDay.checkIn || "-"}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="label">ออกงาน:</span>
                        <span className="value text-secondary">
                          {selectedDay.checkOut || "-"}
                        </span>
                      </div>
                    </>
                  ) : selectedDay.type === "holiday" ||
                    selectedDay.type === "leave" ? (
                    <div className={`special-day-box ${selectedDay.type}`}>
                      <span className="material-symbols-rounded fs-1 mb-2">
                        {selectedDay.type === "holiday"
                          ? "celebration"
                          : "sick"}
                      </span>
                      <h4>{selectedDay.title}</h4>
                    </div>
                  ) : (
                    <div className="text-center text-muted py-5">
                      <span className="material-symbols-rounded fs-1 opacity-25 d-block mb-2">
                        event_busy
                      </span>
                      ไม่มีกะงานในวันนี้
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted py-5 mt-5">
                  <span className="material-symbols-rounded fs-1 opacity-25 d-block mb-2">
                    touch_app
                  </span>
                  แตะที่วันที่เพื่อดูรายละเอียด
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
