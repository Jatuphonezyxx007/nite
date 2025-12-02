import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "./ManageTime.css";

// --- Mock Data (ย้ายออกมาเพื่อความสะอาดของ Component) ---
const INITIAL_HOLIDAYS = [
  { date: "2025-11-15", name: "วันลอยกระทง", details: "กิจกรรมบริษัท" },
  { date: "2025-12-05", name: "วันพ่อแห่งชาติ", details: "หยุดราชการ" },
  { date: "2025-12-31", name: "วันสิ้นปี", details: "หยุดยาวปีใหม่" },
];

const INITIAL_EMPLOYEES = [
  { id: "001", name: "สมชาย ใจดี", role: "Frontend" },
  { id: "002", name: "วิภาดา รักสวย", role: "Designer" },
  { id: "003", name: "ณัฐพล คนเก่ง", role: "Backend" },
  { id: "004", name: "John Doe", role: "Manager" },
];

const INITIAL_SHIFTS = [
  { id: 1, date: "2025-11-01", empId: "001", shift: "morning" },
  { id: 2, date: "2025-11-01", empId: "002", shift: "afternoon" },
  { id: 3, date: "2025-11-01", empId: "003", shift: "night" },
];

function ManageTime() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [holidays, setHolidays] = useState(INITIAL_HOLIDAYS);
  const [shifts, setShifts] = useState(INITIAL_SHIFTS);
  const [employees] = useState(INITIAL_EMPLOYEES);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateForEdit, setSelectedDateForEdit] = useState(null);
  const [tempShiftData, setTempShiftData] = useState({}); // เก็บค่าชั่วคราวขณะแก้ใน Modal

  // --- Helpers ---
  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const formatDate = (date) => date.toISOString().split("T")[0];

  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );

  // --- Handlers ---

  // เปิด Modal จัดการกะ (Core Feature ใหม่)
  const openManageModal = (day) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    setSelectedDateForEdit(dateStr);

    // เตรียมข้อมูลเพื่อแสดงใน Modal (Map พนักงานทุกคนเข้ากับกะที่มีอยู่)
    const initialTempData = {};
    employees.forEach((emp) => {
      const existingShift = shifts.find(
        (s) => s.date === dateStr && s.empId === emp.id
      );
      initialTempData[emp.id] = existingShift ? existingShift.shift : "off"; // default คือ off
    });
    setTempShiftData(initialTempData);
    setIsModalOpen(true);
  };

  const handleTempShiftChange = (empId, newShift) => {
    setTempShiftData((prev) => ({ ...prev, [empId]: newShift }));
  };

  const saveChanges = () => {
    // ลบกะเก่าของวันนี้ออกให้หมดก่อน
    const otherDaysShifts = shifts.filter(
      (s) => s.date !== selectedDateForEdit
    );

    // สร้างกะใหม่จาก tempShiftData
    const newShiftsForDay = [];
    Object.entries(tempShiftData).forEach(([empId, shiftType]) => {
      if (shiftType !== "off") {
        // ถ้าไม่ใช่ off ให้บันทึก
        newShiftsForDay.push({
          id: Date.now() + Math.random(), // Mock ID
          date: selectedDateForEdit,
          empId: empId,
          shift: shiftType,
        });
      }
    });

    setShifts([...otherDaysShifts, ...newShiftsForDay]);
    setIsModalOpen(false);
    Swal.fire({
      icon: "success",
      title: "บันทึกเรียบร้อย",
      text: "อัปเดตตารางงานสำเร็จ",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // เพิ่มวันหยุด
  const handleAddHoliday = async () => {
    const { value: formValues } = await Swal.fire({
      title: "เพิ่มวันหยุดบริษัท",
      html: `
        <div class="swal-form-group">
            <label>วันที่</label>
            <input id="swal-date" class="swal2-input" type="date">
        </div>
        <div class="swal-form-group">
            <label>ชื่อวันหยุด</label>
            <input id="swal-name" class="swal2-input" placeholder="เช่น วันปีใหม่">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      confirmButtonText: "บันทึก",
      preConfirm: () => {
        return {
          date: document.getElementById("swal-date").value,
          name: document.getElementById("swal-name").value,
        };
      },
    });

    if (formValues && formValues.date && formValues.name) {
      setHolidays([...holidays, { ...formValues, details: "เพิ่มเติม" }]);
    }
  };

  // --- Render Functions ---

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty Slots
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Actual Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const isToday = formatDate(new Date()) === dateStr;
      const holiday = holidays.find((h) => h.date === dateStr);

      // Filter Shifts for display
      const daysShifts = shifts.filter((s) => s.date === dateStr);
      // Join with employee info
      const shiftsWithInfo = daysShifts
        .map((s) => {
          const emp = employees.find((e) => e.id === s.empId);
          return {
            ...s,
            name: emp?.name,
            avatar: `https://ui-avatars.com/api/?name=${emp?.name}&background=random`,
          };
        })
        .filter((s) => s.name?.includes(searchTerm) || searchTerm === "");

      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? "today" : ""} ${
            holiday ? "is-holiday" : ""
          }`}
        >
          <div className="day-header">
            <span className={`date-number ${holiday ? "holiday-text" : ""}`}>
              {day}
            </span>
            <button
              className="btn-edit-day"
              onClick={() => openManageModal(day)}
              title="จัดการกะ"
            >
              <span className="material-symbols-rounded">settings</span>
            </button>
          </div>

          {holiday && <div className="holiday-badge">🎉 {holiday.name}</div>}

          <div className="shift-list-scroll">
            {shiftsWithInfo.map((shift, idx) => (
              <div key={idx} className={`shift-pill ${shift.shift}`}>
                <img src={shift.avatar} alt="avt" className="pill-avatar" />
                <span className="pill-name">{shift.name}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="manage-time-layout fade-in">
      {/* HEADER */}
      <header className="page-header">
        <div className="header-title">
          <div className="icon-wrapper">
            <span className="material-symbols-rounded">calendar_month</span>
          </div>
          <div>
            <h1>Shift Management</h1>
            <p>จัดการตารางงานและกะพนักงาน</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="search-bar">
            <span className="material-symbols-rounded">search</span>
            <input
              type="text"
              placeholder="ค้นหาพนักงาน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-primary-outline" onClick={handleAddHoliday}>
            <span className="material-symbols-rounded">event_busy</span>
            วันหยุด
          </button>
        </div>
      </header>

      {/* CONTROLS & CALENDAR */}
      <div className="calendar-controls">
        <button className="btn-nav" onClick={prevMonth}>
          <span className="material-symbols-rounded">chevron_left</span>
        </button>
        <h2 className="current-month">
          {currentDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <button className="btn-nav" onClick={nextMonth}>
          <span className="material-symbols-rounded">chevron_right</span>
        </button>
      </div>

      <div className="calendar-wrapper">
        <div className="weekdays-header">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="days-grid">{renderCalendar()}</div>
      </div>

      {/* LEGEND */}
      <div className="status-legend">
        <div className="legend-item">
          <span className="dot morning"></span>Morning (08:00 - 17:00)
        </div>
        <div className="legend-item">
          <span className="dot afternoon"></span>Afternoon (13:00 - 22:00)
        </div>
        <div className="legend-item">
          <span className="dot night"></span>Night (22:00 - 07:00)
        </div>
        <div className="legend-item">
          <span className="dot holiday"></span>Holiday
        </div>
      </div>

      {/* SUMMARY TABLE (สามารถใช้ logic เดิม หรือปรับ UI ให้สวยขึ้นตาม CSS ใหม่) */}
      <div className="summary-card">
        <div className="card-header">
          <h3>
            <span className="material-symbols-rounded">summarize</span>{" "}
            สรุปภาพรวมเดือนนี้
          </h3>
        </div>
        {/* ... (Table implementation same as before but wrapped in new classes) ... */}
        {/* เพื่อความกระชับ ขอละ Table Body ไว้โดยใช้ CSS class .summary-table จากไฟล์ CSS ใหม่ */}
      </div>

      {/* --- MODAL จัดการกะ --- */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                จัดการกะ:{" "}
                {new Date(selectedDateForEdit).toLocaleDateString("th-TH", {
                  dateStyle: "full",
                })}
              </h3>
              <button
                className="btn-close"
                onClick={() => setIsModalOpen(false)}
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <div className="modal-body">
              {employees.map((emp) => (
                <div key={emp.id} className="employee-row">
                  <div className="emp-info">
                    <img
                      src={`https://ui-avatars.com/api/?name=${emp.name}&background=random`}
                      alt="avt"
                    />
                    <div>
                      <div className="name">{emp.name}</div>
                      <div className="role">{emp.role}</div>
                    </div>
                  </div>
                  <div className="shift-selector">
                    {/* สร้าง Custom Radio หรือ Select */}
                    <select
                      value={tempShiftData[emp.id] || "off"}
                      onChange={(e) =>
                        handleTempShiftChange(emp.id, e.target.value)
                      }
                      className={`shift-select ${tempShiftData[emp.id]}`}
                    >
                      <option value="off">OFF (หยุด)</option>
                      <option value="morning">Morning ☀️</option>
                      <option value="afternoon">Afternoon ⛅</option>
                      <option value="night">Night 🌙</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setIsModalOpen(false)}
              >
                ยกเลิก
              </button>
              <button className="btn-save" onClick={saveChanges}>
                บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageTime;
