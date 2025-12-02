import React, { useState, useEffect, useRef, useMemo, memo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./ManageTime.css";
// Components
import ModernModal from "../../components/Modal";
import CalendarGrid from "../../components/Calendar/CalendarGrid";
import ThaiDatePicker from "../../components/Input/ThaiDatePicker";

// --- Helper: Format Thai Date (dd/mm/yyyy BE) ---
const formatThaiDate = (dateInput) => {
  if (!dateInput) return "-";

  // กรณีเป็น String YYYY-MM-DD ที่ Normalize มาแล้ว
  if (typeof dateInput === "string" && dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [y, m, d] = dateInput.split("-");
    const yearBE = parseInt(y, 10) + 543;
    return `${d}/${m}/${yearBE}`;
  }

  // Fallback
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear() + 543;
  return `${day}/${month}/${year}`;
};

// --- Helper: Normalize API Date (KEY FIX IS HERE) ---
// แปลงวันที่จาก DB (UTC) ให้เป็น Local Date YYYY-MM-DD ที่ถูกต้อง
const normalizeDate = (dateInput) => {
  if (!dateInput) return "";

  // ถ้าข้อมูลมาเป็น String ที่มีเวลา (เช่น 2025-12-04T17:00:00.000Z)
  // ต้องแปลงเป็น Date Object ก่อนเพื่อให้มันบวกเวลากลับเป็น Local Time (ไทย)
  if (typeof dateInput === "string" && dateInput.includes("T")) {
    const d = new Date(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // ถ้าเป็น YYYY-MM-DD อยู่แล้ว (เช่นจาก DatePicker)
  if (typeof dateInput === "string") return dateInput.substring(0, 10);

  // ถ้าเป็น Date Object
  if (dateInput instanceof Date) {
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, "0");
    const day = String(dateInput.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return "";
};

// --- Sub-Component: Custom Shift Dropdown ---
const ShiftSelector = ({ value, onChange, shiftConfigs }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState("bottom");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setPlacement(spaceBelow < 260 ? "top" : "bottom");
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const getCurrentInfo = () => {
    if (value === "off")
      return { name: "OFF", color: "#ef4444", bg: "#fef2f2" };
    const s = shiftConfigs.find((sc) => String(sc.id) === String(value));
    return s
      ? {
          name: s.name,
          color: s.color || "#3b82f6",
          bg: "#fff",
          border: s.color,
        }
      : { name: "เลือกกะ...", color: "#64748b", bg: "#f1f5f9" };
  };

  const current = getCurrentInfo();

  return (
    <div className="shift-custom-select-container" ref={containerRef}>
      <div
        className={`shift-custom-trigger ${
          value === "off" ? "is-off" : "is-shift"
        }`}
        onClick={handleToggle}
        style={{
          borderColor: value === "off" ? "transparent" : current.border,
          backgroundColor: value === "off" ? "#fee2e2" : "#ffffff",
          color: value === "off" ? "#dc2626" : "#334155",
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <span
            className="color-dot"
            style={{ backgroundColor: current.color }}
          ></span>
          <span
            className="fw-medium text-truncate"
            style={{ maxWidth: "100px" }}
          >
            {current.name}
          </span>
        </div>
        <span className="material-symbols-rounded small">
          {isOpen && placement === "top" ? "expand_less" : "expand_more"}
        </span>
      </div>

      {isOpen && (
        <div className={`shift-custom-panel position-${placement}`}>
          <div
            className={`shift-option-item ${value === "off" ? "active" : ""}`}
            onClick={() => handleSelect("off")}
          >
            <div className="d-flex align-items-center gap-2 text-danger">
              <span className="material-symbols-rounded fs-6">block</span>
              <span>OFF (วันหยุด)</span>
            </div>
            {value === "off" && (
              <span className="material-symbols-rounded fs-6">check</span>
            )}
          </div>
          <div className="dropdown-divider"></div>
          {shiftConfigs.map((sc) => (
            <div
              key={sc.id}
              className={`shift-option-item ${
                String(value) === String(sc.id) ? "active" : ""
              }`}
              onClick={() => handleSelect(sc.id)}
            >
              <div className="d-flex align-items-center gap-2">
                <span
                  className="color-dot-sm"
                  style={{ backgroundColor: sc.color || "#3b82f6" }}
                ></span>
                <div>
                  <div className="shift-name">{sc.name}</div>
                  <div className="shift-time">
                    {sc.start_time.substring(0, 5)} -{" "}
                    {sc.end_time.substring(0, 5)}
                  </div>
                </div>
              </div>
              {String(value) === String(sc.id) && (
                <span className="material-symbols-rounded fs-6 text-primary">
                  check
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const EmployeeRow = memo(
  ({ emp, assignment, onChange, shiftConfigs, apiUrl }) => {
    return (
      <div className="employee-row-card fade-in">
        <div className="d-flex align-items-center gap-3">
          <div className="avatar-wrapper">
            <img
              src={
                emp.profile_image
                  ? `${apiUrl}/uploads/profile/${emp.profile_image}`
                  : `https://ui-avatars.com/api/?name=${emp.name_th}`
              }
              alt={emp.name_th}
              loading="lazy"
            />
          </div>
          <div>
            <div className="fw-bold text-dark d-flex align-items-center gap-2">
              {emp.emp_code && (
                <span className="code-badge">{emp.emp_code}</span>
              )}
              {emp.name_th}
              {emp.nickname_th && (
                <span className="nickname">({emp.nickname_th})</span>
              )}
            </div>
            <div className="text-muted small">
              {emp.position || "พนักงานทั่วไป"}
            </div>
          </div>
        </div>
        <div style={{ minWidth: "180px", position: "relative", zIndex: 2 }}>
          <ShiftSelector
            value={assignment || "off"}
            onChange={(val) => onChange(emp.id, val)}
            shiftConfigs={shiftConfigs}
          />
        </div>
      </div>
    );
  }
);

// --- Main Component ---
function ManageTime() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Data
  const [employees, setEmployees] = useState([]);
  const [shiftConfigs, setShiftConfigs] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [holidays, setHolidays] = useState([]);

  // Modal (Shift)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [tempAssignments, setTempAssignments] = useState({});
  const [modalSearch, setModalSearch] = useState("");
  const [modalMode, setModalMode] = useState("search");

  // Modal (Holiday)
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    date: "",
    description: "",
    id: null,
  });

  // View
  const [selectedViewDate, setSelectedViewDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchMonthlyData(currentDate.getMonth() + 1, currentDate.getFullYear());
  }, [currentDate]);

  const fetchInitialData = async () => {
    try {
      const usersRes = await axios.get(
        `${apiUrl}/api/admin/users?deleted=false`,
        config
      );
      const staffOnly = usersRes.data.filter((u) => String(u.role_id) !== "1");
      setEmployees(staffOnly);
      const shiftsRes = await axios.get(`${apiUrl}/api/admin/shifts`, config);
      setShiftConfigs(shiftsRes.data);
    } catch (error) {
      console.error("Init Error:", error);
    }
  };

  const fetchMonthlyData = async (month, year) => {
    try {
      const holRes = await axios.get(
        `${apiUrl}/api/admin/schedule/holidays?month=${month}&year=${year}`,
        config
      );

      // ✅ FIX: ใช้ normalizeDate เพื่อแปลง UTC กลับเป็น Local Time วันที่จึงจะถูกต้อง
      const normalizedHolidays = holRes.data.map((h) => ({
        ...h,
        holiday_date: normalizeDate(h.holiday_date),
      }));
      setHolidays(normalizedHolidays);

      const schedRes = await axios.get(
        `${apiUrl}/api/admin/schedule/schedules?month=${month}&year=${year}`,
        config
      );
      setSchedules(schedRes.data);
    } catch (error) {
      console.error("Fetch Data Error:", error);
    }
  };

  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );

  const formatDateStr = (day) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
  };

  const handleDayClick = (day) => {
    const dateStr = formatDateStr(day);
    setSelectedViewDate(dateStr);
  };

  const isCompanyHoliday = (dateStr) => {
    return holidays.find((h) => h.holiday_date === dateStr);
  };

  const isWeekend = (day) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  // Helper Date String for Today (Local Time)
  const getLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const openManageModal = (e, day = null, mode = "search") => {
    if (e) e.stopPropagation();
    const dateStr = day ? formatDateStr(day) : selectedViewDate;

    if (day && isWeekend(day)) return;

    const holiday = isCompanyHoliday(dateStr);
    if (holiday) {
      openHolidayModal(dateStr, holiday);
      return;
    }

    setSelectedDateStr(dateStr);
    setSelectedViewDate(dateStr);
    setModalSearch("");
    setModalMode(mode);

    const assignments = {};
    employees.forEach((emp) => {
      const existing = schedules.find(
        (s) => s.date === dateStr && String(s.user_id) === String(emp.id)
      );
      assignments[emp.id] = existing ? existing.shift_id : "off";
    });
    setTempAssignments(assignments);
    setIsModalOpen(true);
  };

  const openHolidayModal = (dateStr = "", existingData = null) => {
    // ถ้าไม่มีวันที่ส่งมา (เพิ่มใหม่) ให้ใช้วันนี้ตามเวลา Local
    const initialDate = dateStr || getLocalDateStr();

    setHolidayForm({
      date: initialDate,
      description: existingData ? existingData.description : "",
      id: existingData ? existingData.holiday_date : null,
    });
    setIsHolidayModalOpen(true);
  };

  const saveHoliday = async () => {
    if (!holidayForm.description || !holidayForm.date) {
      Swal.fire("แจ้งเตือน", "กรุณาระบุข้อมูลให้ครบ", "warning");
      return;
    }
    try {
      await axios.post(
        `${apiUrl}/api/admin/schedule/holidays`,
        holidayForm,
        config
      );
      Swal.fire("สำเร็จ", "บันทึกข้อมูลเรียบร้อย", "success");
      setIsHolidayModalOpen(false);
      fetchMonthlyData(currentDate.getMonth() + 1, currentDate.getFullYear());
    } catch (error) {
      Swal.fire("Error", "บันทึกไม่สำเร็จ", "error");
    }
  };

  const deleteHoliday = async () => {
    if (!holidayForm.id) return;
    try {
      await axios.delete(
        `${apiUrl}/api/admin/schedule/holidays/${holidayForm.id}`,
        config
      );
      Swal.fire("เรียบร้อย", "ลบวันหยุดแล้ว", "success");
      setIsHolidayModalOpen(false);
      fetchMonthlyData(currentDate.getMonth() + 1, currentDate.getFullYear());
    } catch (error) {
      Swal.fire("Error", "ลบไม่สำเร็จ", "error");
    }
  };

  const handleAssignmentChange = (userId, shiftId) => {
    setTempAssignments((prev) => ({ ...prev, [userId]: shiftId }));
  };

  const saveAssignments = async () => {
    try {
      const payload = {
        date: selectedDateStr,
        assignments: Object.entries(tempAssignments).map(
          ([userId, shiftId]) => ({
            user_id: userId,
            shift_id: shiftId === "off" ? null : shiftId,
          })
        ),
      };
      await axios.post(`${apiUrl}/api/admin/schedule/assign`, payload, config);
      Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        timer: 1000,
        showConfirmButton: false,
      });
      setIsModalOpen(false);
      fetchMonthlyData(currentDate.getMonth() + 1, currentDate.getFullYear());
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "บันทึกไม่สำเร็จ", "error");
    }
  };

  const displayEmployees = useMemo(() => {
    let list = employees;
    if (modalMode === "view_working") {
      list = list.filter(
        (emp) => tempAssignments[emp.id] && tempAssignments[emp.id] !== "off"
      );
    } else if (modalMode === "view_off") {
      list = list.filter(
        (emp) => !tempAssignments[emp.id] || tempAssignments[emp.id] === "off"
      );
    }
    if (modalSearch.trim()) {
      const term = modalSearch.toLowerCase();
      list = list.filter(
        (emp) =>
          (emp.emp_code && emp.emp_code.toLowerCase().includes(term)) ||
          (emp.name_th && emp.name_th.toLowerCase().includes(term)) ||
          (emp.nickname_th && emp.nickname_th.toLowerCase().includes(term))
      );
    } else if (modalMode === "search") {
      return [];
    }
    return list;
  }, [modalSearch, employees, modalMode, tempAssignments]);

  const getModalTitle = () => {
    if (modalMode === "view_working") return "รายชื่อพนักงานเข้ากะ";
    if (modalMode === "view_off") return "รายชื่อพนักงานหยุดงาน";
    return "จัดการตารางงาน";
  };

  const renderDetailPanel = () => {
    const dailySchedules = schedules.filter((s) => s.date === selectedViewDate);
    const holidayInfo = isCompanyHoliday(selectedViewDate);
    const d = new Date(selectedViewDate);
    const isWknd = d.getDay() === 0 || d.getDay() === 6;
    const isOffDay = holidayInfo || isWknd;

    const workingStaff = [];
    const offStaff = [];

    employees.forEach((emp) => {
      const sch = dailySchedules.find(
        (s) => String(s.user_id) === String(emp.id)
      );
      if (sch) {
        const shiftInfo = shiftConfigs.find(
          (sc) => String(sc.id) === String(sch.shift_id)
        );
        workingStaff.push({ ...emp, schedule: sch, shiftInfo });
      } else {
        offStaff.push(emp);
      }
    });

    const DetailRow = ({ emp, isOff, shiftInfo }) => (
      <div
        className="detail-row-item"
        style={{
          borderLeft: `4px solid ${
            isOff ? "#cbd5e1" : shiftInfo?.color || "#3b82f6"
          }`,
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <img
            src={
              emp.profile_image
                ? `${apiUrl}/uploads/profile/${emp.profile_image}`
                : `https://ui-avatars.com/api/?name=${emp.name_th}`
            }
            alt={emp.name_th}
            className="detail-avatar"
            loading="lazy"
          />
          <div>
            <div className="fw-bold text-dark" style={{ fontSize: "0.9rem" }}>
              {emp.name_th}
            </div>
            <div className="small text-muted">{emp.position || "-"}</div>
          </div>
        </div>
        <div className="text-end">
          {isOff ? (
            <span className="badge bg-light text-secondary border fw-normal">
              OFF
            </span>
          ) : (
            <span
              className="badge rounded-pill fw-normal"
              style={{
                backgroundColor: shiftInfo?.color || "#3b82f6",
                color: "#fff",
              }}
            >
              {shiftInfo?.name}
            </span>
          )}
        </div>
      </div>
    );

    return (
      <div className="detail-panel-container fade-in">
        <div className="detail-card-section mb-3">
          <div className="detail-header sticky-top bg-white border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="fw-bold m-0 d-flex align-items-center gap-2 text-primary">
                <span className="material-symbols-rounded">work</span>
                เข้ากะ ({workingStaff.length})
              </h6>
              {!isOffDay && (
                <button
                  className="btn btn-sm btn-link text-decoration-none p-0 fw-bold"
                  onClick={(e) => openManageModal(e, null, "view_working")}
                >
                  ดูทั้งหมด
                </button>
              )}
            </div>
          </div>
          <div className="detail-list custom-scrollbar">
            {workingStaff.length > 0 ? (
              workingStaff.map((item) => (
                <DetailRow
                  key={item.id}
                  emp={item}
                  shiftInfo={item.shiftInfo}
                  isOff={false}
                />
              ))
            ) : (
              <div className="text-center py-4 text-muted small">
                ไม่มีพนักงานเข้ากะในวันนี้
              </div>
            )}
          </div>
        </div>

        <div className="detail-card-section">
          <div className="detail-header sticky-top bg-white border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="fw-bold m-0 d-flex align-items-center gap-2 text-muted">
                <span className="material-symbols-rounded">block</span>
                หยุดงาน ({offStaff.length})
              </h6>
              {!isOffDay && (
                <button
                  className="btn btn-sm btn-link text-decoration-none p-0 fw-bold text-muted"
                  onClick={(e) => openManageModal(e, null, "view_off")}
                >
                  ดูทั้งหมด
                </button>
              )}
            </div>
          </div>
          <div className="detail-list custom-scrollbar">
            {holidayInfo ? (
              <div className="text-center py-4 text-danger fw-bold opacity-75">
                <span className="d-block material-symbols-rounded fs-1 mb-1">
                  celebration
                </span>
                {holidayInfo.description}
              </div>
            ) : isWknd ? (
              <div className="text-center py-4 text-danger fw-bold opacity-75">
                WEEKEND HOLIDAY
              </div>
            ) : offStaff.length > 0 ? (
              offStaff.map((emp) => (
                <DetailRow key={emp.id} emp={emp} isOff={true} />
              ))
            ) : (
              <div className="text-center py-4 text-muted small">
                ทุกคนมีตารางงานวันนี้
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="manage-time-layout fade-in">
      <header className="page-header">
        <div className="header-title">
          <div className="icon-wrapper">
            <span className="material-symbols-rounded">calendar_month</span>
          </div>
          <div>
            <h1>Shift Management</h1>
            <p>จัดการตารางงาน</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => openHolidayModal()}
          >
            <span className="material-symbols-rounded">event_available</span>
            จัดการวันหยุด
          </button>
        </div>
      </header>

      <div className="content-grid">
        <div className="calendar-section">
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

          <CalendarGrid
            currentDate={currentDate}
            schedules={schedules}
            employees={employees}
            shiftConfigs={shiftConfigs}
            holidays={holidays}
            selectedDateStr={selectedViewDate}
            onDayClick={handleDayClick}
            onEditClick={(e, day) => openManageModal(e, day, "search")}
          />
        </div>

        <div className="detail-section-wrapper">
          <div className="mb-3 ps-1">
            <span className="text-muted small">วันที่เลือก: </span>
            <span className="fw-bold text-dark fs-5">
              {formatThaiDate(selectedViewDate)}
            </span>
          </div>
          {renderDetailPanel()}
        </div>
      </div>

      <ModernModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <div>
            <h5 className="fw-bold m-0">{getModalTitle()}</h5>
            <p className="text-muted small m-0 fw-normal">
              วันที่: {formatThaiDate(selectedDateStr)}
            </p>
          </div>
        }
        icon="edit_calendar"
        maxWidth="700px"
      >
        <div className="p-4" style={{ minHeight: "400px" }}>
          <div className="search-hero-box mb-4">
            <div className="search-input-wrapper">
              <span className="material-symbols-rounded search-icon">
                search
              </span>
              <input
                type="text"
                className="hero-input"
                placeholder="พิมพ์ชื่อ, รหัส เพื่อค้นหา..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                autoFocus={modalMode === "search"}
              />
            </div>
          </div>

          <div className="employee-result-area custom-scrollbar">
            {modalMode === "search" && !modalSearch && (
              <div className="empty-search-state text-center py-5">
                <div className="empty-icon-bg mb-3">
                  <span className="material-symbols-rounded fs-1 text-primary opacity-50">
                    person_search
                  </span>
                </div>
                <h6 className="text-muted fw-bold">เริ่มพิมพ์เพื่อค้นหา</h6>
                <p className="text-muted small">
                  พิมพ์รหัส หรือชื่อพนักงานเพื่อกำหนดกะ
                </p>
              </div>
            )}
            {(modalSearch || modalMode !== "search") &&
              displayEmployees.length === 0 && (
                <div className="text-center py-5 text-muted">ไม่พบข้อมูล</div>
              )}
            {displayEmployees.map((emp) => (
              <EmployeeRow
                key={emp.id}
                emp={emp}
                assignment={tempAssignments[emp.id]}
                onChange={handleAssignmentChange}
                shiftConfigs={shiftConfigs}
                apiUrl={apiUrl}
              />
            ))}
          </div>
        </div>
        <div className="modern-modal-footer">
          <div className="d-flex justify-content-end gap-2">
            <button
              className="btn btn-subtle"
              onClick={() => setIsModalOpen(false)}
            >
              ปิดหน้าต่าง
            </button>
            <button
              className="btn btn-save"
              onClick={saveAssignments}
              disabled={displayEmployees.length === 0 && !modalSearch}
            >
              <span className="material-symbols-rounded me-2">save</span>บันทึก
            </button>
          </div>
        </div>
      </ModernModal>

      <ModernModal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        title="จัดการวันหยุดบริษัท"
        icon="celebration"
        maxWidth="500px"
      >
        <div className="p-4">
          <div className="mb-3">
            <label className="form-label-sm">วันที่</label>
            <ThaiDatePicker
              value={holidayForm.date}
              onChange={(val) => setHolidayForm({ ...holidayForm, date: val })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label-sm">ชื่อวันหยุด</label>
            <input
              type="text"
              className="form-control modern-input"
              value={holidayForm.description}
              placeholder="เช่น วันสงกรานต์"
              onChange={(e) =>
                setHolidayForm({ ...holidayForm, description: e.target.value })
              }
            />
          </div>
        </div>
        <div className="modern-modal-footer">
          <div className="d-flex justify-content-between w-100">
            {holidayForm.id ? (
              <button
                className="btn btn-danger-soft text-danger"
                onClick={deleteHoliday}
              >
                ลบวันหยุดนี้
              </button>
            ) : (
              <div></div>
            )}
            <div className="d-flex gap-2">
              <button
                className="btn btn-subtle"
                onClick={() => setIsHolidayModalOpen(false)}
              >
                ยกเลิก
              </button>
              <button className="btn btn-save" onClick={saveHoliday}>
                บันทึก
              </button>
            </div>
          </div>
        </div>
      </ModernModal>
    </div>
  );
}

export default ManageTime;
