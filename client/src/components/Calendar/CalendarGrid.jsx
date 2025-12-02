import React from "react";
import "./CalendarGrid.css";

const CalendarGrid = ({
  currentDate,
  schedules,
  employees,
  shiftConfigs,
  holidays = [], // รับ props Holidays
  selectedDateStr,
  onDayClick,
  onEditClick,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const isWeekend = (dayIndex) => dayIndex === 0 || dayIndex === 6;

  // Render Logic
  const renderDays = () => {
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const dateObj = new Date(year, month, day);
      const dayOfWeek = dateObj.getDay();
      const isWknd = isWeekend(dayOfWeek);
      const isToday = new Date().toISOString().split("T")[0] === dateStr;
      const isSelected = selectedDateStr === dateStr;

      // Find Holiday
      const holiday = holidays.find((h) => h.holiday_date === dateStr);

      // Filter Schedules
      const daySchedules = schedules.filter((s) => s.date === dateStr);
      const visibleSchedules = daySchedules.slice(0, 3);
      const remaining = daySchedules.length - 3;

      days.push(
        <div
          key={day}
          className={`calendar-cell ${isWknd ? "weekend" : ""} ${
            holiday ? "is-holiday" : ""
          } ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
          onClick={() => onDayClick(day)}
        >
          {/* Cell Header */}
          <div className="cell-header">
            <span className="date-number">{day}</span>
            {/* Show Edit Button only if NOT Holiday and NOT Weekend */}
            {!isWknd && !holiday ? (
              <button
                className="btn-cell-action"
                onClick={(e) => onEditClick(e, day)}
                title="จัดการตารางงาน"
              >
                <span className="material-symbols-rounded fs-6">
                  edit_calendar
                </span>
              </button>
            ) : holiday ? (
              // Show Holiday Edit Button
              <button
                className="btn-cell-action holiday-edit"
                onClick={(e) => onEditClick(e, day)} // จะไปเปิด Modal Holiday แทน (logic ใน ManageTime)
                title="แก้ไขวันหยุด"
              >
                <span className="material-symbols-rounded fs-6">edit</span>
              </button>
            ) : null}
          </div>

          {/* Cell Content */}
          <div className="cell-content">
            {holiday ? (
              <div className="holiday-banner">{holiday.description}</div>
            ) : !isWknd ? (
              <>
                {visibleSchedules.map((sch, idx) => {
                  const emp = employees.find(
                    (e) => String(e.id) === String(sch.user_id)
                  );
                  if (!emp) return null;
                  let color = sch.shift_color;
                  let name = sch.shift_name;
                  if (!color || !name) {
                    const sc = shiftConfigs.find(
                      (s) => String(s.id) === String(sch.shift_id)
                    );
                    color = sc?.color || "#ccc";
                    name = sc?.name || "Shift";
                  }
                  return (
                    <div
                      key={idx}
                      className="shift-pill"
                      style={{ borderLeft: `3px solid ${color}` }}
                    >
                      {emp.name_th.split(" ")[0]} ({name})
                    </div>
                  );
                })}
                {remaining > 0 && (
                  <div className="more-badge">+{remaining} more</div>
                )}
              </>
            ) : (
              <div className="holiday-label">WEEKEND OFF</div>
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="calendar-root">
      <div className="calendar-header-row">
        {weekdays.map((day, index) => (
          <div
            key={day}
            className={`calendar-header-cell ${
              isWeekend(index) ? "weekend" : ""
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="calendar-body-grid">{renderDays()}</div>
    </div>
  );
};

export default CalendarGrid;
