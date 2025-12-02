import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./ManageShifts.css";
import Modal from "../../components/Modal";
// Import Component ที่สร้างใหม่
import ModernColorPicker from "../../components/ColorPicker/ColorPicker";

function ManageShifts() {
  const [shifts, setShifts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- Form State ---
  const initialFormState = {
    id: null,
    name: "",
    start_time: "09:00",
    end_time: "18:00",
    break_minutes: 60,
    color: "#3b82f6", // Default Blue Hex
  };
  const [formData, setFormData] = useState(initialFormState);

  const [calculatedInfo, setCalculatedInfo] = useState({
    netHours: 0,
    isOvernight: false,
  });

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Helper Map สำหรับแปลงชื่อสีเก่าใน DB ให้เป็น Hex (กรณีมีข้อมูลเก่า)
  const legacyColorMap = {
    blue: "#3b82f6",
    green: "#10b981",
    purple: "#8b5cf6",
    orange: "#f59e0b",
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/admin/shifts`, config);
      setShifts(res.data);
    } catch (error) {
      console.error("Error fetching shifts:", error);
    }
  };

  useEffect(() => {
    calculateWorkHours();
  }, [formData.start_time, formData.end_time, formData.break_minutes]);

  const calculateWorkHours = () => {
    if (!formData.start_time || !formData.end_time) return;

    const start = timeToMinutes(formData.start_time);
    let end = timeToMinutes(formData.end_time);
    let isOvernight = false;

    if (end < start) {
      end += 1440;
      isOvernight = true;
    }

    const totalDuration = end - start;
    const netDuration = totalDuration - (parseInt(formData.break_minutes) || 0);
    const netHours = (netDuration / 60).toFixed(2);

    setCalculatedInfo({ netHours, isOvernight });
  };

  const timeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handler สำหรับ ColorPicker Component
  const handleColorChange = (newColor) => {
    setFormData({ ...formData, color: newColor });
  };

  const handleOpenAddModal = () => {
    setFormData(initialFormState);
    setShowModal(true);
  };

  const handleEditClick = (shift) => {
    // แปลงสีเก่าถ้าจำเป็น
    let safeColor = shift.color || "#3b82f6";
    if (!safeColor.startsWith("#") && legacyColorMap[safeColor]) {
      safeColor = legacyColorMap[safeColor];
    }

    setFormData({
      id: shift.id,
      name: shift.name,
      start_time: shift.start_time.substring(0, 5),
      end_time: shift.end_time.substring(0, 5),
      break_minutes: shift.break_minutes,
      color: safeColor,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ?",
      text: "ข้อมูลกะงานนี้จะหายไปจากระบบ",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยันลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#E5E7EB",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${apiUrl}/api/admin/shifts/${id}`, config);
        Swal.fire("เรียบร้อย", "ลบข้อมูลสำเร็จ", "success");
        fetchShifts();
      } catch (error) {
        Swal.fire("Error", "ไม่สามารถลบข้อมูลได้", "error");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (formData.id) {
        await axios.put(
          `${apiUrl}/api/admin/shifts/${formData.id}`,
          formData,
          config
        );
        Swal.fire({
          icon: "success",
          title: "อัปเดตสำเร็จ",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await axios.post(`${apiUrl}/api/admin/shifts`, formData, config);
        Swal.fire({
          icon: "success",
          title: "สร้างสำเร็จ",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      fetchShifts();
      setShowModal(false);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "เกิดข้อผิดพลาดในการบันทึก", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper เพื่อดึงสีที่ปลอดภัย
  const getSafeColor = (color) => {
    if (!color) return "#3b82f6";
    if (color.startsWith("#")) return color;
    return legacyColorMap[color] || color;
  };

  return (
    <div className="manage-shifts-container p-4 fade-in">
      {/* Header */}
      <div className="page-header d-flex flex-column flex-md-row justify-content-between align-items-center mb-5 gap-3">
        <div>
          <h2 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            Work Shifts{" "}
            <span
              style={{ color: "#FFBD28", fontSize: "1.5em", lineHeight: 0 }}
            >
              .
            </span>
          </h2>
          <p className="text-muted m-0 mt-1">
            จัดการรอบเวลาและกะการทำงานของพนักงาน
          </p>
        </div>
        <button className="btn-add-employee" onClick={handleOpenAddModal}>
          <span className="material-symbols-rounded fs-5">add_circle</span>
          <span>สร้างกะใหม่</span>
        </button>
      </div>

      {/* Grid View */}
      <div className="shifts-grid">
        {shifts.map((shift) => {
          const displayColor = getSafeColor(shift.color);
          return (
            <div
              key={shift.id}
              className="shift-card"
              style={{ borderLeft: `6px solid ${displayColor}` }}
            >
              {/* Header & Title */}
              <div className="shift-header d-flex justify-content-between align-items-start">
                <div>
                  <h5 className="fw-bold m-0 text-dark">{shift.name}</h5>
                  <span
                    className="badge rounded-pill mt-2 fw-normal"
                    style={{
                      backgroundColor: displayColor,
                      color: "#fff",
                      letterSpacing: "0.5px",
                      // Shadow เพื่อให้อ่านง่ายขึ้น
                      textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                    }}
                  >
                    {/* แสดงค่า Hex หรือชื่อสีออกมาเลย */}
                    {shift.color ? shift.color.toUpperCase() : "NO COLOR"}
                  </span>
                </div>
              </div>

              {/* Time Display */}
              <div className="shift-time-row d-flex align-items-center justify-content-between">
                <div className="text-center flex-grow-1">
                  <span className="time-label">START TIME</span>
                  <span className="time-value">
                    {shift.start_time.substring(0, 5)}
                  </span>
                </div>

                <div className="text-muted d-flex align-items-center px-2">
                  <span className="material-symbols-rounded fs-4 opacity-50">
                    arrow_right_alt
                  </span>
                </div>

                <div className="text-center flex-grow-1">
                  <span className="time-label">END TIME</span>
                  <span className="time-value">
                    {shift.end_time.substring(0, 5)}
                  </span>
                </div>
              </div>

              {/* Break Time */}
              <div className="d-flex mb-3">
                <div className="break-badge d-flex align-items-center gap-2">
                  <span className="material-symbols-rounded fs-6 text-warning">
                    local_cafe
                  </span>
                  <span>พัก {shift.break_minutes} นาที</span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="action-buttons-container d-flex gap-2">
                <button
                  className="btn-action edit flex-fill d-flex align-items-center justify-content-center gap-2"
                  onClick={() => handleEditClick(shift)}
                >
                  <span className="material-symbols-rounded fs-5">
                    edit_square
                  </span>
                  <span>แก้ไข</span>
                </button>

                <button
                  className="btn-action delete flex-fill d-flex align-items-center justify-content-center gap-2"
                  onClick={() => handleDelete(shift.id)}
                >
                  <span className="material-symbols-rounded fs-5">delete</span>
                  <span>ลบ</span>
                </button>
              </div>
            </div>
          );
        })}

        {shifts.length === 0 && (
          <div className="col-12 py-5 text-center">
            <div className="d-inline-flex align-items-center justify-content-center bg-white p-4 rounded-circle shadow-sm mb-3">
              <span className="material-symbols-rounded fs-1 text-muted opacity-50">
                schedule
              </span>
            </div>
            <h5 className="text-muted fw-normal">ยังไม่มีข้อมูลกะการทำงาน</h5>
          </div>
        )}
      </div>

      {/* --- Modal Form --- */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={formData.id ? "แก้ไขกะการทำงาน" : "สร้างกะใหม่"}
        icon={formData.id ? "edit_calendar" : "add_task"}
        maxWidth="600px"
      >
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <div className="mb-4">
              <label className="form-label-sm">
                ชื่อกะงาน <span className="text-danger">*</span>
              </label>
              <input
                className="form-control modern-input mb-3"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="เช่น กะเช้า, กะดึก (Overnight)"
                required
              />

              <label className="form-label-sm mb-2">ธีมสี (Color Theme)</label>

              {/* ใช้ Component ModernColorPicker ที่สร้างใหม่ */}
              <ModernColorPicker
                color={formData.color}
                onChange={handleColorChange}
              />
            </div>

            <div className="bg-soft-gray p-4 rounded-4 border-0">
              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label-sm text-muted">
                    เวลาเข้างาน
                  </label>
                  <input
                    type="time"
                    className="form-control modern-input fw-bold text-dark"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label-sm text-muted">
                    เวลาเลิกงาน
                  </label>
                  <input
                    type="time"
                    className="form-control modern-input fw-bold text-dark"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label-sm text-muted">
                    พักเบรค (นาที)
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control modern-input fw-bold text-dark"
                      name="break_minutes"
                      value={formData.break_minutes}
                      onChange={handleInputChange}
                      min="0"
                    />
                    <span className="input-group-text bg-white border-0 text-muted ms-1 rounded-3 small">
                      นาที
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-top border-secondary-subtle d-flex justify-content-between align-items-center">
                <div>
                  {calculatedInfo.isOvernight && (
                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 rounded-3">
                      <span className="material-symbols-rounded fs-6 align-middle me-1">
                        dark_mode
                      </span>
                      กะข้ามวัน (+1 Day)
                    </span>
                  )}
                </div>
                <div className="text-end">
                  <span className="text-muted small me-2 d-block">
                    ชั่วโมงทำงานสุทธิ
                  </span>
                  <span className="fw-bold fs-3 text-primary lh-1">
                    {calculatedInfo.netHours}
                  </span>
                  <span className="text-muted small ms-1">ชม.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="modern-modal-footer">
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-subtle"
                onClick={() => setShowModal(false)}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="btn btn-save"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-rounded me-1">save</span>
                    บันทึกข้อมูล
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ManageShifts;
