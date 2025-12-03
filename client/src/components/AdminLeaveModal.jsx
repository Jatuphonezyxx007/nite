import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import ModernModal from "./Modal";
import ThaiDatePicker from "./Input/ThaiDatePicker";
import SearchableDropdown from "./SearchableDropdown";
import ModernTimePicker from "./Input/ModernTimePicker"; // Import TimePicker

const AdminLeaveModal = ({
  isOpen,
  onClose,
  type = "create",
  leaveData = null,
}) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const [users, setUsers] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    userId: "",
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    startTime: "09:00",
    endTime: "18:00",
    reason: "",
    isFullDay: true,
    file: null, // ไฟล์ใหม่ที่เลือก
  });

  // State สำหรับเก็บชื่อไฟล์เดิม (กรณี Edit)
  const [existingFile, setExistingFile] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      if (type === "edit" && leaveData) {
        setupEditData();
      } else {
        resetForm();
      }
    }
  }, [isOpen, type, leaveData]);

  const fetchInitialData = async () => {
    try {
      const [usersRes, summaryRes] = await Promise.all([
        axios.get(`${apiUrl}/api/leaves/users`, config),
        axios.get(`${apiUrl}/api/leaves/summary`, config),
      ]);
      setUsers(usersRes.data);
      setLeaveTypes(summaryRes.data.types);
    } catch (err) {
      console.error(err);
    }
  };

  const setupEditData = () => {
    // แปลงวันที่ YYYY-MM-DD
    const start = leaveData.start_date.split("T")[0];
    const end = leaveData.end_date.split("T")[0];

    // เช็คคร่าวๆ ว่าเต็มวันไหม (ถ้า total_days >= 1 และไม่มีระบุช่วงเวลาชัดเจน)
    // หรือถ้า API มี field is_full_day ส่งมาจะแม่นยำกว่า
    // ในที่นี้สมมติถ้าไม่มีเวลา start_time ใน DB อาจจะถือว่าเป็น Full Day
    const isFull = true;

    setFormData({
      userId: leaveData.user_id,
      leaveTypeId: leaveData.leave_type_id,
      startDate: start,
      endDate: end,
      startTime: "09:00",
      endTime: "18:00",
      reason: leaveData.reason || "",
      isFullDay: isFull,
      file: null, // เริ่มต้นไม่มีไฟล์ใหม่
    });

    // เก็บชื่อไฟล์เดิมไว้แสดง
    setExistingFile(leaveData.medical_certificate_url || null);
  };

  const resetForm = () => {
    setFormData({
      userId: "",
      leaveTypeId: "",
      startDate: "",
      endDate: "",
      startTime: "09:00",
      endTime: "18:00",
      reason: "",
      isFullDay: true,
      file: null,
    });
    setExistingFile(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.userId ||
      !formData.startDate ||
      !formData.endDate ||
      !formData.reason
    )
      return Swal.fire("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบถ้วน", "warning");

    const submitData = new FormData();
    submitData.append("targetUserId", formData.userId);
    submitData.append("leaveTypeId", formData.leaveTypeId);
    submitData.append("startDate", formData.startDate);
    submitData.append("endDate", formData.endDate);
    submitData.append("isFullDay", formData.isFullDay);
    submitData.append("reason", formData.reason);

    if (!formData.isFullDay) {
      submitData.append("startTime", formData.startTime);
      submitData.append("endTime", formData.endTime);
    }

    // แนบไฟล์เฉพาะถ้ามีการเลือกไฟล์ใหม่
    if (formData.file) {
      submitData.append("file", formData.file);
    }

    try {
      const headerConfig = {
        headers: { ...config.headers, "Content-Type": "multipart/form-data" },
      };

      if (type === "edit") {
        // ใช้ PUT สำหรับอัปเดต (Backend ต้องรองรับ File Upload ใน PUT ด้วย)
        // ถ้า Backend แยก Route upload ต้องปรับตรงนี้
        // สมมติว่า Route PUT /api/leaves/:id รองรับ multipart/form-data
        await axios.put(
          `${apiUrl}/api/leaves/${leaveData.id}`,
          submitData,
          headerConfig
        );
      } else {
        await axios.post(
          `${apiUrl}/api/leaves/admin/create`,
          submitData,
          headerConfig
        );
      }

      Swal.fire(
        "สำเร็จ",
        type === "edit" ? "แก้ไขข้อมูลเรียบร้อย" : "สร้างใบลาเรียบร้อย",
        "success"
      );
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("ผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้", "error");
    }
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={type === "edit" ? "แก้ไขใบลา" : "สร้างใบลาใหม่"}
      icon={type === "edit" ? "edit_note" : "add_circle"}
      maxWidth="600px"
    >
      <div className="p-4">
        {/* 1. เลือกพนักงาน */}
        <div className="mb-4">
          <label className="form-label fw-bold text-muted small">พนักงาน</label>
          {type === "edit" ? (
            <div className="form-control bg-light text-muted">
              {/* แสดงชื่อพนักงานเดิม (ค้นหาจาก ID หรือใช้จาก leaveData ถ้ามี) */}
              {users.find((u) => String(u.value) === String(formData.userId))
                ?.label ||
                (leaveData
                  ? `${leaveData.name_th} ${leaveData.lastname_th}`
                  : "Unknown")}
            </div>
          ) : (
            <SearchableDropdown
              options={users}
              value={formData.userId}
              onChange={(val) => setFormData({ ...formData, userId: val })}
              placeholder="ค้นหาชื่อ, รหัส หรือชื่อเล่น..."
            />
          )}
        </div>

        {/* 2. ประเภทการลา */}
        <div className="mb-4">
          <label className="form-label fw-bold text-muted small">
            ประเภทการลา
          </label>
          <div className="d-flex gap-2 flex-wrap">
            {leaveTypes.map((t) => (
              <button
                key={t.id}
                className={`btn btn-sm rounded-pill px-3 ${
                  parseInt(formData.leaveTypeId) === t.id
                    ? "btn-primary"
                    : "btn-light border"
                }`}
                onClick={() => setFormData({ ...formData, leaveTypeId: t.id })}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* 3. วันที่และเวลา */}
        <div className="bg-light p-3 rounded-3 mb-4 border">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <label className="fw-bold text-dark m-0">ช่วงเวลา</label>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="fullDayCheck"
                checked={formData.isFullDay}
                onChange={(e) =>
                  setFormData({ ...formData, isFullDay: e.target.checked })
                }
              />
              <label className="form-check-label small" htmlFor="fullDayCheck">
                ลาเต็มวัน
              </label>
            </div>
          </div>
          <div className="row g-2">
            <div className="col-6">
              <small className="text-muted">วันที่เริ่ม</small>
              <ThaiDatePicker
                value={formData.startDate}
                onChange={(d) => setFormData({ ...formData, startDate: d })}
              />
            </div>
            <div className="col-6">
              <small className="text-muted">วันที่สิ้นสุด</small>
              <ThaiDatePicker
                value={formData.endDate}
                onChange={(d) => setFormData({ ...formData, endDate: d })}
              />
            </div>
          </div>
          {!formData.isFullDay && (
            <div className="row g-2 mt-2 fade-in">
              <div className="col-6">
                <small className="text-muted">เวลาเริ่ม</small>
                {/* <input
                  type="time"
                  className="form-control"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                /> */}
                <ModernTimePicker
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                />
              </div>
              <div className="col-6">
                <small className="text-muted">เวลาสิ้นสุด</small>
                {/* <input
                  type="time"
                  className="form-control"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                /> */}
                <ModernTimePicker
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. เหตุผล */}
        <div className="mb-3">
          <label className="form-label fw-bold text-muted small">เหตุผล</label>
          <textarea
            className="form-control"
            rows="2"
            value={formData.reason}
            onChange={(e) =>
              setFormData({ ...formData, reason: e.target.value })
            }
            placeholder="ระบุสาเหตุ..."
          ></textarea>
        </div>

        {/* 5. แนบไฟล์ (Logic ใหม่) */}
        <div className="mb-4">
          <label className="form-label fw-bold text-muted small">
            เอกสารแนบ {type === "edit" && "(ถ้าต้องการเปลี่ยน)"}
          </label>

          <div className="d-flex flex-column gap-2">
            {/* กรณี Edit และมีไฟล์เดิม -> ปุ่มดูไฟล์ */}
            {type === "edit" && existingFile && !formData.file && (
              <div className="d-flex align-items-center justify-content-between p-2 border rounded bg-white">
                <div className="d-flex align-items-center gap-2 text-primary">
                  <span className="material-symbols-rounded">attachment</span>
                  <span
                    className="small text-truncate"
                    style={{ maxWidth: "200px" }}
                  >
                    ไฟล์เดิม: {existingFile}
                  </span>
                </div>
                <a
                  href={`${apiUrl}/uploads/leaves/${existingFile}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-outline-primary"
                >
                  ดูไฟล์
                </a>
              </div>
            )}

            {/* Input เลือกไฟล์ใหม่ */}
            <input
              type="file"
              className="form-control"
              onChange={handleFileChange}
            />

            {/* แสดงชื่อไฟล์ใหม่ที่เลือก (ถ้ามี) */}
            {formData.file && (
              <small className="text-success d-flex align-items-center gap-1">
                <span className="material-symbols-rounded fs-6">
                  check_circle
                </span>
                เลือกไฟล์ใหม่แล้ว: {formData.file.name}
              </small>
            )}
          </div>
        </div>

        <button
          className="btn btn-primary w-100 py-2 fw-bold shadow-sm"
          onClick={handleSubmit}
        >
          บันทึกข้อมูล
        </button>
      </div>
    </ModernModal>
  );
};

export default AdminLeaveModal;
