import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "./ManageShifts.css";

function ManageShifts() {
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid, calendar

  // --- Initial Form State ---
  const initialFormState = {
    name: "",
    startTime: "09:00",
    endTime: "18:00",
    breakTime: 60, // นาที
    isOvernight: false, // กะข้ามวัน
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    minStaff: 1,
    maxStaff: 5,
    roles: ["all"],
    pattern: "fixed", // fixed, rotation
  };

  const [formData, setFormData] = useState(initialFormState);
  const [calculatedHours, setCalculatedHours] = useState(0);
  const [warnings, setWarnings] = useState([]);

  // --- Mock Data: Shifts ---
  const [shifts, setShifts] = useState([
    {
      id: 1,
      name: "กะเช้า (Morning)",
      startTime: "08:00",
      endTime: "17:00",
      breakTime: 60,
      netHours: 8,
      type: "morning",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      staffCount: 12,
      maxStaff: 15,
    },
    {
      id: 2,
      name: "กะดึก (Night)",
      startTime: "22:00",
      endTime: "07:00",
      breakTime: 60,
      netHours: 8,
      type: "night",
      isOvernight: true,
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      staffCount: 4,
      maxStaff: 6,
    },
  ]);

  // --- Logic: คำนวณเวลาทำงานและตรวจสอบกฎหมาย ---
  useEffect(() => {
    calculateWorkHours();
  }, [
    formData.startTime,
    formData.endTime,
    formData.breakTime,
    formData.isOvernight,
  ]);

  const calculateWorkHours = () => {
    let start =
      parseInt(formData.startTime.split(":")[0]) * 60 +
      parseInt(formData.startTime.split(":")[1]);
    let end =
      parseInt(formData.endTime.split(":")[0]) * 60 +
      parseInt(formData.endTime.split(":")[1]);

    // ถ้าเป็นกะข้ามวัน ให้บวก 24 ชม. (1440 นาที) ที่เวลาเลิกงาน
    // หรือถ้า user ไม่ติ๊ก overnight แต่เวลาเลิกน้อยกว่าเริ่ม ระบบจะ auto detect ว่าข้ามวัน
    if (end < start || formData.isOvernight) {
      end += 1440;
    }

    const totalDuration = end - start;
    const netDuration = totalDuration - formData.breakTime; // ลบเวลาพัก
    const netHours = netDuration / 60;

    setCalculatedHours(netHours.toFixed(2));

    // --- Validation Rules (กฎหมายแรงงานเบื้องต้น) ---
    const newWarnings = [];
    if (netHours > 8) {
      newWarnings.push("⚠️ เวลาทำงานสุทธิเกิน 8 ชั่วโมง (อาจมี OT)");
    }
    if (formData.breakTime < 60 && totalDuration >= 300) {
      // ทำงานเกิน 5 ชม ควรพัก 1 ชม
      newWarnings.push("⚠️ เวลาพักน้อยกว่า 1 ชั่วโมง (ควรตรวจสอบกฎหมาย)");
    }
    if (netHours > 12) {
      newWarnings.push("⛔ เวลาทำงานนานเกินไป! (เสี่ยงผิดกฎหมายแรงงาน)");
    }
    setWarnings(newWarnings);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleDayToggle = (day) => {
    const currentDays = formData.days;
    if (currentDays.includes(day)) {
      setFormData({ ...formData, days: currentDays.filter((d) => d !== day) });
    } else {
      setFormData({ ...formData, days: [...currentDays, day] });
    }
  };

  const handleSave = () => {
    // Save Logic here
    Swal.fire({
      icon: "success",
      title: "บันทึกเรียบร้อย",
      text: `สร้างกะ "${formData.name}" สำเร็จ`,
      confirmButtonColor: "#0d6efd",
    });
    setShowModal(false);
  };

  // Helper to get class based on time
  const getShiftTypeClass = (start) => {
    const hour = parseInt(start.split(":")[0]);
    if (hour >= 6 && hour < 12) return "morning";
    if (hour >= 12 && hour < 18) return "afternoon";
    return "night";
  };

  return (
    <div className="manage-shifts-container p-4 fade-in">
      {/* 1. Header */}
      <div className="page-header">
        <div className="header-title">
          <h2>
            <span className="material-symbols-outlined fs-2 text-primary">
              schedule
            </span>
            Shift Management
          </h2>
          <p className="text-muted m-0 mt-1">
            จัดการกะเวลาทำงาน รูปแบบวันทำงาน และข้อกำหนดแรงงาน
          </p>
        </div>

        <div className="d-flex gap-2">
          {/* View Toggle */}
          <div className="btn-group bg-white border rounded-3 p-1">
            <button
              className={`btn btn-sm ${
                viewMode === "grid" ? "btn-primary" : "btn-light"
              }`}
              onClick={() => setViewMode("grid")}
            >
              <span className="material-symbols-outlined align-middle fs-6 me-1">
                grid_view
              </span>{" "}
              Grid
            </button>
            <button
              className={`btn btn-sm ${
                viewMode === "calendar" ? "btn-primary" : "btn-light"
              }`}
              onClick={() => setViewMode("calendar")}
            >
              <span className="material-symbols-outlined align-middle fs-6 me-1">
                calendar_month
              </span>{" "}
              Calendar
            </button>
          </div>

          <button
            className="btn btn-modern-primary d-flex align-items-center gap-2"
            onClick={() => {
              setFormData(initialFormState);
              setShowModal(true);
            }}
          >
            <span className="material-symbols-outlined">add_circle</span>
            สร้างกะใหม่
          </button>
        </div>
      </div>

      {/* 2. Shifts Grid View */}
      {viewMode === "grid" && (
        <div className="shifts-grid">
          {shifts.map((shift) => (
            <div key={shift.id} className={`shift-card ${shift.type}`}>
              <div className="shift-header">
                <span className="shift-name">{shift.name}</span>
                <span className="shift-badge">{shift.netHours} Hrs / Day</span>
              </div>

              <div className="shift-time-row">
                <div className="time-box">
                  <span className="time-label">Start</span>
                  <span className="time-value">{shift.startTime}</span>
                </div>
                <span className="material-symbols-outlined text-muted">
                  arrow_forward
                </span>
                <div className="time-box">
                  <span className="time-label">End</span>
                  <span className="time-value">{shift.endTime}</span>
                  {shift.isOvernight && (
                    <small
                      className="text-danger d-block"
                      style={{ fontSize: "0.6rem" }}
                    >
                      +1 Day
                    </small>
                  )}
                </div>
              </div>

              <div className="shift-details">
                <div className="detail-tag">
                  <span className="material-symbols-outlined fs-6">coffee</span>{" "}
                  พัก {shift.breakTime} น.
                </div>
                <div className="detail-tag">
                  <span className="material-symbols-outlined fs-6">group</span>{" "}
                  {shift.staffCount}/{shift.maxStaff} คน
                </div>
                <div className="detail-tag">
                  <span className="material-symbols-outlined fs-6">
                    calendar_today
                  </span>{" "}
                  {shift.days.length} วัน/สัปดาห์
                </div>
              </div>

              <div className="shift-actions">
                <button
                  className="btn btn-light w-100 btn-sm text-primary fw-bold"
                  onClick={() => setShowModal(true)}
                >
                  <span className="material-symbols-outlined align-middle me-1">
                    edit
                  </span>{" "}
                  แก้ไข
                </button>
                <button className="btn btn-light w-100 btn-sm text-danger fw-bold">
                  <span className="material-symbols-outlined align-middle me-1">
                    delete
                  </span>{" "}
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Calendar View (Placeholder UI) */}
      {viewMode === "calendar" && (
        <div className="card border-0 shadow-sm p-5 text-center rounded-4">
          <span
            className="material-symbols-outlined text-muted"
            style={{ fontSize: "64px" }}
          >
            calendar_month
          </span>
          <h4 className="mt-3 fw-bold text-dark">Shift Calendar View</h4>
          <p className="text-muted">
            แสดงปฏิทินแบบ Drag & Drop สำหรับจัดกะพนักงานรายวัน (แสดงผลจำลอง)
          </p>
          <div className="alert alert-info d-inline-block mx-auto">
            <small>
              ในส่วนนี้จะเป็นการนำ FullCalendar.js มา Implement
              เพื่อให้ลากวางกะได้จริง
            </small>
          </div>
        </div>
      )}

      {/* 4. Modal Form (The Core Feature) */}
      {showModal && (
        <>
          <div
            className="modal-backdrop fade show"
            style={{
              zIndex: 1050,
              backgroundColor: "rgba(30,42,69,0.5)",
              backdropFilter: "blur(5px)",
            }}
          ></div>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ zIndex: 1055 }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header border-bottom-0 pb-0">
                  <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      tune
                    </span>
                    ตั้งค่ากะการทำงาน (Configure Shift)
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  <form>
                    <div className="row g-4">
                      {/* 1. Basic Info */}
                      <div className="col-12">
                        <div className="form-section-title">
                          <span className="material-symbols-outlined fs-6">
                            badge
                          </span>{" "}
                          ข้อมูลทั่วไป
                        </div>
                        <div className="row g-3">
                          <div className="col-md-8">
                            <label className="form-label small fw-bold text-muted">
                              ชื่อกะงาน
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="เช่น กะเช้า A, กะดึกพิเศษ"
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small fw-bold text-muted">
                              รูปแบบเวร
                            </label>
                            <select
                              className="form-select"
                              name="pattern"
                              value={formData.pattern}
                              onChange={handleInputChange}
                            >
                              <option value="fixed">ประจำ (Fixed)</option>
                              <option value="rotation">
                                หมุนเวียน (Rotation)
                              </option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* 2. Time Settings & Calculation */}
                      <div className="col-12">
                        <div className="form-section-title">
                          <span className="material-symbols-outlined fs-6">
                            schedule
                          </span>{" "}
                          เวลาทำงาน
                        </div>
                        <div className="p-3 bg-light rounded-3 border">
                          <div className="row align-items-end g-3">
                            <div className="col-md-3">
                              <label className="form-label small fw-bold">
                                เริ่มงาน
                              </label>
                              <input
                                type="time"
                                className="form-control fw-bold"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="col-md-3">
                              <label className="form-label small fw-bold">
                                เลิกงาน
                              </label>
                              <input
                                type="time"
                                className="form-control fw-bold"
                                name="endTime"
                                value={formData.endTime}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="col-md-3">
                              <label className="form-label small fw-bold">
                                พัก (นาที)
                              </label>
                              <input
                                type="number"
                                className="form-control"
                                name="breakTime"
                                value={formData.breakTime}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="col-md-3">
                              <div className="form-check form-switch mb-2">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  name="isOvernight"
                                  checked={formData.isOvernight}
                                  onChange={handleInputChange}
                                  id="overnightSwitch"
                                />
                                <label
                                  className="form-check-label small"
                                  htmlFor="overnightSwitch"
                                >
                                  กะข้ามวัน
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Auto Calculation Result */}
                          <div className="mt-3 d-flex align-items-center justify-content-between border-top pt-3">
                            <span className="text-muted small">
                              คำนวณอัตโนมัติ:
                            </span>
                            <div className="text-end">
                              <span className="fs-5 fw-bold text-primary">
                                {calculatedHours}
                              </span>
                              <span className="small text-muted ms-1">
                                ชม. (สุทธิ)
                              </span>
                            </div>
                          </div>

                          {/* Alerts based on Labor Law */}
                          {warnings.length > 0 && (
                            <div className="mt-2">
                              {warnings.map((warn, idx) => (
                                <div
                                  key={idx}
                                  className="alert-modern warning p-2 mt-1"
                                >
                                  <span className="material-symbols-outlined">
                                    warning
                                  </span>{" "}
                                  {warn}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3. Work Days Pattern */}
                      <div className="col-12">
                        <div className="form-section-title">
                          <span className="material-symbols-outlined fs-6">
                            calendar_today
                          </span>{" "}
                          วันทำงาน
                        </div>
                        <div className="day-selector">
                          {[
                            "Mon",
                            "Tue",
                            "Wed",
                            "Thu",
                            "Fri",
                            "Sat",
                            "Sun",
                          ].map((day) => (
                            <label key={day} className="day-chk-label">
                              <input
                                type="checkbox"
                                className="day-chk-input"
                                checked={formData.days.includes(day)}
                                onChange={() => handleDayToggle(day)}
                              />
                              <div className="day-chk-box">{day}</div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 4. Staff Control */}
                      <div className="col-12">
                        <div className="form-section-title">
                          <span className="material-symbols-outlined fs-6">
                            group_add
                          </span>{" "}
                          ควบคุมพนักงาน
                        </div>
                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label small fw-bold text-muted">
                              ขั้นต่ำ (คน)
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              name="minStaff"
                              value={formData.minStaff}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small fw-bold text-muted">
                              สูงสุด (คน)
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              name="maxStaff"
                              value={formData.maxStaff}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small fw-bold text-muted">
                              เฉพาะตำแหน่ง
                            </label>
                            <select
                              className="form-select"
                              name="roles"
                              onChange={() => {}}
                            >
                              <option value="all">ทุกตำแหน่ง</option>
                              <option value="security">รปภ.</option>
                              <option value="nurse">พยาบาล</option>
                              <option value="engineer">วิศวกร</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="modal-footer border-top-0 pt-0 pb-4 pe-4">
                  <button
                    type="button"
                    className="btn btn-light rounded-3 fw-bold text-muted"
                    onClick={() => setShowModal(false)}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    className="btn btn-modern-primary rounded-3"
                    onClick={handleSave}
                  >
                    <span className="material-symbols-outlined align-middle fs-6 me-1">
                      save
                    </span>{" "}
                    บันทึกข้อมูล
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ManageShifts;
