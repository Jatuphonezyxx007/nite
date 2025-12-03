import React from "react";
import "./CalendarGrid.css";

const CalendarGrid = ({
  currentDate,
  schedules = [],
  employees = [],
  shiftConfigs = [],
  holidays = [],
  selectedDateStr,
  onDayClick,
  onEditClick,
  readOnly = false,
  renderEvent = null,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const isWeekend = (dayIndex) => dayIndex === 0 || dayIndex === 6;

  const renderDays = () => {
    const days = [];

    // Empty Cells
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
    }

    // Days 1...31
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const dateObj = new Date(year, month, day);
      const dayOfWeek = dateObj.getDay();
      const isWknd = isWeekend(dayOfWeek);
      const isToday = new Date().toISOString().split("T")[0] === dateStr;
      const isSelected = selectedDateStr === dateStr;

      const holiday = holidays.find((h) => h.holiday_date === dateStr);
      const daySchedules = schedules.filter((s) => s.date === dateStr);

      // Limit visible items
      const maxVisible = 3;
      const visibleSchedules = daySchedules.slice(0, maxVisible);
      const remaining = daySchedules.length - maxVisible;

      days.push(
        <div
          key={day}
          className={`calendar-cell ${isWknd ? "weekend" : ""} ${
            holiday ? "is-holiday" : ""
          } ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
          onClick={() => onDayClick(day)}
        >
          {/* Header */}
          <div className="cell-header">
            <span className="date-number">{day}</span>
            {!readOnly && (
              <>
                {!isWknd && !holiday ? (
                  <button
                    className="btn-cell-action"
                    onClick={(e) => onEditClick(e, day)}
                    title="แก้ไขกะงาน"
                  >
                    <span className="material-symbols-rounded fs-6">edit</span>
                  </button>
                ) : holiday ? (
                  <button
                    className="btn-cell-action holiday-edit"
                    onClick={(e) => onEditClick(e, day)}
                    title="แก้ไขวันหยุด"
                  >
                    <span className="material-symbols-rounded fs-6">edit</span>
                  </button>
                ) : null}
              </>
            )}
          </div>

          {/* Content */}
          <div className="cell-content">
            {/* 1. Show Holiday Banner FIRST (Top) */}
            {holiday && (
              <div className="holiday-banner" title={holiday.description}>
                {holiday.description}
              </div>
            )}

            {/* 2. Show Schedules below Holiday */}
            {!isWknd ? (
              <>
                {visibleSchedules.map((sch, idx) => {
                  if (renderEvent) {
                    return renderEvent(sch, idx);
                  }

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

                  const empName = emp.name_th
                    ? emp.name_th.split(" ")[0]
                    : "Unknown";
                  const displayText = `${empName} (${name})`;

                  return (
                    <div
                      key={idx}
                      className="shift-pill"
                      style={{ borderLeft: `3px solid ${color}` }}
                      title={`${emp.name_th} - ${name}`}
                    >
                      {displayText}
                    </div>
                  );
                })}
                {remaining > 0 && (
                  <div className="more-badge">+{remaining} รายการ</div>
                )}
              </>
            ) : (
              // Show OFF label only if NO holiday (Holiday banner already shows status)
              !holiday && <div className="holiday-label">OFF</div>
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
