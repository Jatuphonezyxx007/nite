import React, { useState } from "react";
import Swal from "sweetalert2";
import "./ManageTime.css";

function ManageTime() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");

  // --- Mock Data: วันหยุดบริษัท ---
  const [holidays, setHolidays] = useState([
    {
      date: "2025-11-05",
      name: "วันลอยกระทง",
      details: "กิจกรรมบริษัทช่วงเย็น",
    },
    { date: "2025-12-05", name: "วันพ่อแห่งชาติ", details: "หยุดราชการ" },
    { date: "2025-12-31", name: "วันสิ้นปี", details: "หยุดยาวปีใหม่" },
  ]);

  // --- Mock Data: ตารางกะงาน (Shifts) ---
  const [shifts, setShifts] = useState([
    {
      id: 1,
      date: "2025-11-01",
      empId: "001",
      name: "สมชาย ใจดี",
      shift: "morning",
      avatar: "",
    },
    {
      id: 2,
      date: "2025-11-01",
      empId: "002",
      name: "วิภาดา รักสวย",
      shift: "afternoon",
      avatar: "",
    },
    {
      id: 3,
      date: "2025-11-01",
      empId: "003",
      name: "ณัฐพล คนเก่ง",
      shift: "night",
      avatar: "",
    },
    {
      id: 4,
      date: "2025-11-25",
      empId: "001",
      name: "สมชาย ใจดี",
      shift: "morning",
      avatar: "",
    },
    {
      id: 5,
      date: "2025-11-25",
      empId: "002",
      name: "วิภาดา รักสวย",
      shift: "afternoon",
      avatar: "",
    },
    // ... (ข้อมูลอื่นๆ)
  ]);

  // --- Mock Data: สรุปพนักงาน (Employee Summary Table) ---
  const employeeSummary = [
    {
      id: "001",
      name: "สมชาย ใจดี",
      morning: 15,
      afternoon: 5,
      night: 0,
      off: 8,
      leave: 1,
      absent: 0,
    },
    {
      id: "002",
      name: "วิภาดา รักสวย",
      morning: 5,
      afternoon: 15,
      night: 2,
      off: 8,
      leave: 0,
      absent: 0,
    },
    {
      id: "003",
      name: "ณัฐพล คนเก่ง",
      morning: 0,
      afternoon: 5,
      night: 18,
      off: 7,
      leave: 0,
      absent: 1,
    },
    {
      id: "004",
      name: "John Doe",
      morning: 10,
      afternoon: 10,
      night: 0,
      off: 8,
      leave: 2,
      absent: 0,
    },
  ];

  // --- Calendar Helpers ---
  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    let day = new Date(year, month, 1).getDay();
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

  // --- Handlers ---

  // ฟังก์ชันเพิ่มวันหยุด
  const handleAddHoliday = async () => {
    const { value: formValues } = await Swal.fire({
      title: "เพิ่มวันหยุดบริษัท",
      html:
        '<input id="swal-input1" class="swal2-input" type="date" placeholder="วันที่">' +
        '<input id="swal-input2" class="swal2-input" placeholder="ชื่อวันหยุด">' +
        '<input id="swal-input3" class="swal2-input" placeholder="รายละเอียดเพิ่มเติม">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: "#dc3545", // สีแดงให้รู้ว่าเป็นวันหยุด
      confirmButtonText: "บันทึกวันหยุด",
      preConfirm: () => {
        return {
          date: document.getElementById("swal-input1").value,
          name: document.getElementById("swal-input2").value,
          details: document.getElementById("swal-input3").value,
        };
      },
    });

    if (formValues && formValues.date && formValues.name) {
      setHolidays([...holidays, formValues]);
      Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        text: `เพิ่มวันหยุด "${formValues.name}" เรียบร้อยแล้ว`,
        confirmButtonColor: "#1e2a45",
      });
    }
  };

  const handleEditDay = (day) => {
    // ... Logic เดิมสำหรับการแก้ไขกะ ...
    Swal.fire({
      title: `จัดการวันที่ ${day}`,
      text: "เลือกการดำเนินการ",
      showCancelButton: true,
      confirmButtonText: "จัดการกะพนักงาน",
      cancelButtonText: "ตั้งเป็นวันหยุด",
      confirmButtonColor: "#1e2a45",
      cancelButtonColor: "#dc3545",
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.cancel) {
        // ถ้ากดปุ่มแดง ให้เรียกฟังก์ชันเพิ่มวันหยุดโดย Auto fill วันที่
        // (ในตัวอย่างนี้เรียก Modal เปล่าๆ ไปก่อน)
        handleAddHoliday();
      }
    });
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const isToday = new Date().toISOString().split("T")[0] === dateStr;

      // เช็คว่าเป็นวันหยุดหรือไม่
      const holiday = holidays.find((h) => h.date === dateStr);

      // กรอง Shifts
      const daysShifts = shifts.filter(
        (s) =>
          s.date === dateStr &&
          (s.name.includes(searchTerm) ||
            s.empId.includes(searchTerm) ||
            searchTerm === "")
      );

      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? "today" : ""} ${
            holiday ? "is-holiday" : ""
          }`}
        >
          <div className="d-flex justify-content-between align-items-start">
            {/* ถ้าเป็นวันหยุด ให้ใส่ Class holiday-text (สีแดง) */}
            <span className={`date-number ${holiday ? "holiday-text" : ""}`}>
              {day}
            </span>

            <button className="edit-day-btn" onClick={() => handleEditDay(day)}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "16px" }}
              >
                edit
              </span>
            </button>
          </div>

          {/* แสดงชื่อวันหยุด ถ้ามี */}
          {holiday && (
            <div className="holiday-label" title={holiday.details}>
              🎉 {holiday.name}
            </div>
          )}

          <div className="shift-container">
            {daysShifts.map((shift, idx) => (
              <div
                key={idx}
                className={`emp-badge ${shift.shift}`}
                title={`${shift.name} (${shift.shift})`}
              >
                <img
                  src={
                    shift.avatar ||
                    `https://ui-avatars.com/api/?name=${shift.name}&background=random`
                  }
                  alt="avatar"
                  className="emp-badge-avatar"
                />
                <div className="emp-badge-info">
                  <span className="emp-id">#{shift.empId}</span>
                  <span className="emp-name">{shift.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="manage-time-container p-4 fade-in">
      {/* 1. Header */}
      <div className="calendar-header">
        <div>
          <h2 className="fw-bold m-0 d-flex align-items-center gap-2">
            <span className="material-symbols-outlined text-primary fs-2">
              calendar_month
            </span>
            Shift Management
          </h2>
          <p className="text-muted m-0 small mt-1">
            จัดการตารางงาน กะพนักงาน และวันหยุดบริษัท
          </p>
        </div>
        <div className="d-flex gap-3 align-items-center flex-wrap">
          <div className="position-relative">
            <span
              className="material-symbols-outlined position-absolute text-muted"
              style={{
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "20px",
              }}
            >
              search
            </span>
            <input
              type="text"
              className="form-control rounded-pill ps-5"
              placeholder="ค้นหาชื่อ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="month-navigator">
            <button className="nav-btn" onClick={prevMonth}>
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="month-title">
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button className="nav-btn" onClick={nextMonth}>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          {/* ปุ่มเพิ่มวันหยุด */}
          <button
            className="btn btn-danger d-flex align-items-center gap-2 rounded-3 px-3 py-2"
            onClick={handleAddHoliday}
          >
            <span className="material-symbols-outlined">event_busy</span>
            <span className="d-none d-md-inline">เพิ่มวันหยุด</span>
          </button>
        </div>
      </div>

      {/* 2. Calendar */}
      <div className="calendar-grid">
        <div className="weekdays-row">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="weekday">
              {day}
            </div>
          ))}
        </div>
        <div className="days-grid">{renderCalendar()}</div>
      </div>

      {/* Legend */}
      <div className="legend-bar">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#10b981" }}></span>{" "}
          Morning
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#f59e0b" }}></span>{" "}
          Afternoon
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#6366f1" }}></span>{" "}
          Night
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#dc3545" }}></span>{" "}
          Holiday
        </div>
      </div>

      {/* 3. Employee Summary Table (New Section) */}
      <div className="summary-section">
        <div className="section-title">
          <span className="material-symbols-outlined text-primary">
            summarize
          </span>
          สรุปกะงานประจำเดือน (Employee Schedule Summary)
        </div>

        <div className="table-responsive">
          <table className="summary-table">
            <thead>
              <tr>
                <th>พนักงาน</th>
                <th className="text-center">เช้า (Morning)</th>
                <th className="text-center">บ่าย (Afternoon)</th>
                <th className="text-center">ดึก (Night)</th>
                <th className="text-center">วันหยุด (Off)</th>
                <th className="text-center">ลา (Leave)</th>
                <th className="text-center">ขาด (Absent)</th>
                <th className="text-end">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {employeeSummary
                .filter((emp) => emp.name.includes(searchTerm))
                .map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${emp.name}&background=random`}
                          alt={emp.name}
                          className="rounded-circle border"
                          width="36"
                          height="36"
                        />
                        <div>
                          <div className="fw-bold text-dark">{emp.name}</div>
                          <div className="text-muted small">ID: {emp.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="stat-count stat-morning">
                        {emp.morning}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="stat-count stat-afternoon">
                        {emp.afternoon}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="stat-count stat-night">{emp.night}</span>
                    </td>
                    <td className="text-center">
                      <span className="stat-count stat-off">{emp.off}</span>
                    </td>
                    <td className="text-center">
                      <span className="stat-count stat-leave">{emp.leave}</span>
                    </td>
                    <td className="text-center">
                      <span className="stat-count stat-absent">
                        {emp.absent}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn-icon" title="ดูตารางงาน">
                          <span className="material-symbols-outlined fs-6">
                            calendar_view_month
                          </span>
                        </button>
                        <button className="btn-icon" title="แก้ไข">
                          <span className="material-symbols-outlined fs-6">
                            edit
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ManageTime;
