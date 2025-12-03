import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import "./Leave.css";

// Import Components
import ThaiDatePicker from "../../components/Input/ThaiDatePicker"; //
import ModernModal from "../../components/Modal";
import ModernDropdown from "../../components/DropDown"; // ปรับ path ตามจริง

const Leave = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // --- Main State ---
  const [formData, setFormData] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    startTime: "09:00",
    endTime: "18:00",
    reason: "",
    file: null,
  });

  const [isFullDay, setIsFullDay] = useState(true);
  const [durationStr, setDurationStr] = useState("");

  // Data State
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveStats, setLeaveStats] = useState([]);
  const [history, setHistory] = useState([]);

  // --- Modal & Search State ---
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // สำหรับ Dropdown Filter

  useEffect(() => {
    fetchSummary();
    fetchHistory();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/leaves/summary`, config);
      setLeaveTypes(res.data.types);
      setLeaveStats(res.data.balances);
      if (res.data.types.length > 0) {
        setFormData((prev) => ({ ...prev, leaveTypeId: res.data.types[0].id }));
      }
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/leaves/history`, config);
      setHistory(res.data);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleDateChange = (key, dateStr) => {
    setFormData((prev) => {
      const newData = { ...prev, [key]: dateStr };
      if (key === "startDate" && !prev.endDate) {
        newData.endDate = dateStr;
      }
      return newData;
    });
  };

  // --- Duration Logic ---
  useEffect(() => {
    const { startDate, endDate, startTime, endTime } = formData;
    if (!startDate || !endDate) {
      setDurationStr("");
      return;
    }

    const start = new Date(`${startDate}T${isFullDay ? "00:00" : startTime}`);
    const end = new Date(`${endDate}T${isFullDay ? "23:59" : endTime}`);

    if (end < start) {
      setDurationStr("วัน/เวลาไม่ถูกต้อง");
      return;
    }

    if (isFullDay) {
      const sDate = new Date(startDate);
      const eDate = new Date(endDate);
      const diffTime = Math.abs(eDate - sDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDurationStr(`${diffDays} วัน`);
    } else {
      const diffMs = end - start;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / 60000);
      setDurationStr(
        `${diffHrs} ชม. ${diffMins > 0 ? diffMins + " นาที" : ""}`
      );
    }
  }, [formData, isFullDay]);

  // --- Helpers ---
  const getLeaveColor = (name = "") => {
    if (name.includes("ป่วย")) return "sick";
    if (name.includes("กิจ")) return "business";
    if (name.includes("พักร้อน")) return "vacation";
    return "other";
  };

  const getLeaveIcon = (name = "") => {
    if (name.includes("ป่วย")) return "sick";
    if (name.includes("กิจ")) return "business_center";
    if (name.includes("พักร้อน")) return "beach_access";
    return "category";
  };

  const formatDateTH = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const map = {
      approved: { text: "อนุมัติ", class: "approved", icon: "check_circle" },
      rejected: { text: "ไม่อนุมัติ", class: "rejected", icon: "cancel" },
      pending: { text: "รออนุมัติ", class: "pending", icon: "hourglass_top" },
      cancelled: { text: "ยกเลิก", class: "rejected", icon: "block" },
    };
    const s = map[status] || map.pending;
    return (
      <span className={`status-badge ${s.class}`}>
        <span className="material-symbols-rounded fs-6">{s.icon}</span> {s.text}
      </span>
    );
  };

  // --- Filter Logic for Modal ---
  const getFilteredHistory = () => {
    return history.filter((item) => {
      // 1. Search Text (Reason or Leave Type)
      const textMatch =
        item.leave_type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.reason &&
          item.reason.toLowerCase().includes(searchTerm.toLowerCase()));

      // 2. Filter Dropdown
      const typeMatch =
        filterType === "all" || item.leave_type_name === filterType;

      return textMatch && typeMatch;
    });
  };

  // --- Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!durationStr || durationStr.includes("ไม่ถูกต้อง")) {
      return Swal.fire("ข้อมูลไม่ครบถ้วน", "กรุณาตรวจสอบวันและเวลา", "warning");
    }

    const selectedType = leaveTypes.find(
      (t) => t.id === parseInt(formData.leaveTypeId)
    );
    const typeName = selectedType ? selectedType.name : "ไม่ระบุ";

    Swal.fire({
      title: "ยืนยันการขอลา?",
      html: `
        <div class="text-start fs-6">
          <p class="mb-1"><strong>ประเภท:</strong> ${typeName}</p>
          <p class="mb-1"><strong>วันที่:</strong> ${formatDateTH(
            formData.startDate
          )} - ${formatDateTH(formData.endDate)}</p>
          <p class="mb-0"><strong>รวม:</strong> <span class="text-primary">${durationStr}</span></p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "ยืนยันส่งใบลา",
      cancelButtonText: "ตรวจสอบก่อน",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const submitData = new FormData();
        submitData.append("leaveTypeId", formData.leaveTypeId);
        submitData.append("startDate", formData.startDate);
        submitData.append("endDate", formData.endDate);
        submitData.append("isFullDay", isFullDay);
        submitData.append("reason", formData.reason);

        if (!isFullDay) {
          submitData.append("startTime", formData.startTime);
          submitData.append("endTime", formData.endTime);
        }

        if (formData.file) {
          submitData.append("file", formData.file);
        }

        try {
          await axios.post(`${apiUrl}/api/leaves`, submitData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });
          Swal.fire("สำเร็จ!", "ส่งคำขอลาเรียบร้อยแล้ว", "success");
          fetchHistory();
          fetchSummary();
          setFormData((prev) => ({
            ...prev,
            reason: "",
            file: null,
            startDate: "",
            endDate: "",
          }));
          setDurationStr("");
        } catch (err) {
          console.error(err);
          Swal.fire("Error", "เกิดข้อผิดพลาดในการบันทึก", "error");
        }
      }
    });
  };

  const handleHistoryClick = (item) => {
    if (item.status === "rejected" && item.reject_reason) {
      Swal.fire({
        title: "ถูกปฏิเสธคำขอ",
        html: `<p class="text-muted">เหตุผล:</p><div class="p-3 bg-light rounded text-danger fst-italic border">"${item.reject_reason}"</div>`,
        icon: "error",
        confirmButtonColor: "#64748b",
        confirmButtonText: "ปิด",
      });
    } else if (item.status === "approved") {
      Swal.fire({
        title: "อนุมัติแล้ว",
        text: "รายการนี้ได้รับอนุมัติเรียบร้อย",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  return (
    <div className="leave-page fade-in">
      <div className="container-xl py-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div>
            <h2 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
              <div className="icon-bg-primary">
                <span className="material-symbols-rounded">edit_calendar</span>
              </div>
              ระบบแจ้งการลา
            </h2>
            <p className="text-muted m-0 mt-1 ms-1">Leave Request Management</p>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="leave-card p-0 overflow-hidden h-100">
              <div className="card-header-custom p-4 border-bottom">
                <h5 className="m-0 fw-bold d-flex align-items-center gap-2">
                  <span className="material-symbols-rounded text-primary">
                    edit_square
                  </span>{" "}
                  แบบฟอร์มขอลา
                </h5>
              </div>
              <div className="p-4">
                <form onSubmit={handleSubmit}>
                  {/* ... (ส่วน Form เหมือนเดิม ไม่ได้เปลี่ยนแปลง Logic แต่ใช้ Layout เดิม) ... */}
                  <div className="row g-4">
                    {/* 1. Leave Types */}
                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small mb-3">
                        เลือกประเภทการลา
                      </label>
                      <div className="leave-type-selector">
                        {leaveTypes.map((type) => {
                          const cssClass = getLeaveColor(type.name);
                          const isActive =
                            parseInt(formData.leaveTypeId) === type.id;
                          return (
                            <label
                              key={type.id}
                              className={`type-option ${
                                isActive ? "active" : ""
                              } ${cssClass}`}
                            >
                              <input
                                type="radio"
                                name="leaveTypeId"
                                value={type.id}
                                checked={isActive}
                                onChange={handleChange}
                                className="d-none"
                              />
                              <div className="icon-circle mb-2">
                                <span className="material-symbols-rounded">
                                  {getLeaveIcon(type.name)}
                                </span>
                              </div>
                              <span className="fw-semibold">{type.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Date Section (Keep logic as is) */}
                    <div className="col-12">
                      <div className="bg-light rounded-4 p-4 border date-section-wrapper">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <label className="form-label fw-bold text-dark m-0 d-flex align-items-center gap-2">
                            <span className="material-symbols-rounded text-primary">
                              schedule
                            </span>
                            ระบุช่วงเวลา
                          </label>

                          <div className="toggle-switch-container">
                            <input
                              type="checkbox"
                              id="fullDaySwitch"
                              checked={isFullDay}
                              onChange={(e) => setIsFullDay(e.target.checked)}
                            />
                            <label
                              htmlFor="fullDaySwitch"
                              className="toggle-label"
                            >
                              <span className="toggle-inner"></span>
                              <span className="toggle-switch"></span>
                            </label>
                            <span className="ms-2 small fw-bold text-muted">
                              {isFullDay ? "ลาเต็มวัน" : "ระบุเวลา"}
                            </span>
                          </div>
                        </div>

                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="small text-muted mb-1">
                              ตั้งแต่วันที่
                            </label>
                            <ThaiDatePicker
                              value={formData.startDate}
                              onChange={(date) =>
                                handleDateChange("startDate", date)
                              }
                              placeholder="เลือกวันเริ่มลา"
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="small text-muted mb-1">
                              ถึงวันที่
                            </label>
                            <ThaiDatePicker
                              value={formData.endDate}
                              onChange={(date) =>
                                handleDateChange("endDate", date)
                              }
                              placeholder="เลือกวันสิ้นสุด"
                            />
                          </div>

                          {!isFullDay && (
                            <div className="col-12 fade-in">
                              <div className="time-selector-group">
                                <div className="time-box">
                                  <label>เวลาเริ่ม</label>
                                  <input
                                    type="time"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    className="time-input"
                                  />
                                </div>
                                <div className="separator">
                                  <span className="material-symbols-rounded">
                                    arrow_forward
                                  </span>
                                </div>
                                <div className="time-box">
                                  <label>เวลาสิ้นสุด</label>
                                  <input
                                    type="time"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    className="time-input"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Duration Display */}
                    {durationStr && (
                      <div className="col-12">
                        <div className="duration-alert fade-in">
                          <div className="d-flex align-items-center gap-2">
                            <span className="material-symbols-rounded fs-5">
                              timelapse
                            </span>
                            <span>ระยะเวลาที่ขอลา:</span>
                          </div>
                          <span className="badge bg-white text-primary fs-6 shadow-sm px-3 py-2">
                            {durationStr}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Reason & File */}
                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small">
                        เหตุผลการลา <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control custom-input"
                        rows="3"
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        placeholder="ระบุสาเหตุการลา..."
                        required
                        style={{ resize: "none" }}
                      ></textarea>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small">
                        เอกสารแนบ (ถ้ามี)
                      </label>
                      <div className="file-upload-wrapper">
                        <input
                          type="file"
                          id="fileUpload"
                          className="d-none"
                          name="file"
                          onChange={handleChange}
                        />
                        <label
                          htmlFor="fileUpload"
                          className="file-upload-label"
                        >
                          <span className="material-symbols-rounded fs-3 mb-2 text-primary">
                            cloud_upload
                          </span>
                          <span className="fw-bold text-dark">
                            {formData.file
                              ? formData.file.name
                              : "คลิกเพื่ออัปโหลดไฟล์"}
                          </span>
                          <small className="text-muted">
                            รองรับ PDF, JPG, PNG (Max 5MB)
                          </small>
                        </label>
                      </div>
                    </div>

                    <div className="col-12 mt-4">
                      <button
                        type="submit"
                        className="btn btn-modern-primary w-100 py-3 rounded-4 shadow-sm fw-bold d-flex align-items-center justify-content-center gap-2"
                      >
                        <span className="material-symbols-rounded">send</span>
                        ส่งคำขออนุมัติ
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* =======================================================
            RIGHT: NEW PREMIUM STATS & HISTORY (ส่วนที่แก้ใหม่)
           ======================================================= */}
          <div className="col-lg-4">
            <div className="d-flex flex-column gap-4 h-100">
              <div className="premium-stats-card">
                <div className="premium-header">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="icon-bg-primary"
                      style={{ borderRadius: "50%" }}
                    >
                      <span className="material-symbols-rounded">
                        pie_chart
                      </span>
                    </div>
                    <h5 className="fw-bold m-0 text-dark">โควตาวันลา</h5>
                  </div>
                </div>

                <div className="quota-premium-list mt-3">
                  {leaveStats.map((stat) => {
                    const cssClass = getLeaveColor(stat.name);
                    const used = stat.used;
                    const total = stat.max_per_year;
                    const percent = total > 0 ? (used / total) * 100 : 0;
                    const remaining = total - used;

                    // Map class to gradient
                    let gradientClass = "grad-other";
                    if (cssClass === "sick") gradientClass = "grad-sick";
                    if (cssClass === "business")
                      gradientClass = "grad-business";
                    if (cssClass === "vacation")
                      gradientClass = "grad-vacation";

                    return (
                      <div key={stat.id} className="quota-visual-item">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="quota-label">{stat.name}</span>
                          <span className="quota-remain">
                            เหลือ {remaining} วัน
                          </span>
                        </div>

                        <div className="premium-progress-bg">
                          <div
                            className={`premium-progress-bar ${gradientClass}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>

                        <div className="quota-detail">
                          <span>ใช้ไปแล้ว {used} วัน</span>
                          <span>ทั้งหมด {total} วัน</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* --- 2. RECENT HISTORY SECTION --- */}
                <div className="history-premium-wrapper">
                  <div className="premium-header bg-transparent border-0 pb-3 pt-4">
                    <div className="d-flex align-items-center gap-2">
                      <span className="material-symbols-rounded text-primary fs-5">
                        history
                      </span>
                      <h6 className="fw-bold m-0 text-dark">ประวัติล่าสุด</h6>
                    </div>
                    <button
                      className="btn-see-all"
                      onClick={() => setShowHistoryModal(true)}
                    >
                      ดูทั้งหมด{" "}
                      <span className="material-symbols-rounded align-middle fs-6">
                        arrow_forward
                      </span>
                    </button>
                  </div>

                  <div className="history-premium-list">
                    {history.slice(0, 4).map((item) => (
                      // <div key={item.id} className="history-timeline-item">
                      <div
                        key={item.id}
                        className="history-timeline-item"
                        onClick={() => handleHistoryClick(item)}
                        style={{ cursor: "pointer" }}
                      >
                        <div
                          className={`icon-box-premium ${getLeaveColor(
                            item.leave_type_name
                          )}`}
                        >
                          <span className="material-symbols-rounded fs-5">
                            {getLeaveIcon(item.leave_type_name)}
                          </span>
                        </div>
                        <div className="history-content">
                          <div className="history-title">
                            {item.leave_type_name}
                          </div>
                          <div className="history-date">
                            {formatDateTH(item.start_date)}
                          </div>
                        </div>
                        <div>
                          {/* Badge แบบย่อ */}
                          {item.status === "approved" && (
                            <span className="material-symbols-rounded text-success">
                              check_circle
                            </span>
                          )}
                          {item.status === "rejected" && (
                            <span className="material-symbols-rounded text-danger">
                              cancel
                            </span>
                          )}
                          {item.status === "pending" && (
                            <span className="material-symbols-rounded text-secondary">
                              hourglass_top
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {history.length === 0 && (
                      <div className="text-center text-muted py-5 opacity-50">
                        <span className="material-symbols-rounded fs-1 d-block mb-2">
                          event_note
                        </span>
                        ไม่มีประวัติการลา
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =======================================================
        MODAL: FULL HISTORY (New Beautiful Design)
       ======================================================= */}
      <ModernModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="ประวัติการลาทั้งหมด"
        icon="history_edu"
        maxWidth="900px"
      >
        <div
          className="p-4"
          style={{ background: "#f8fafc", minHeight: "60vh" }}
        >
          {/* Search Bar */}
          <div className="row g-3 mb-4">
            <div className="col-md-8">
              <div className="input-group-modern bg-white rounded-4 shadow-sm">
                <span className="material-symbols-rounded input-icon">
                  search
                </span>
                <input
                  type="text"
                  className="form-control custom-input ps-5 border-0"
                  placeholder="ค้นหา..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <ModernDropdown
                name="filterType"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                options={[
                  { label: "ทั้งหมด", value: "all" },
                  ...leaveTypes.map((t) => ({ label: t.name, value: t.name })),
                ]}
              />
            </div>
          </div>

          {/* Full History List */}
          <div className="history-full-list-wrapper">
            {getFilteredHistory().length > 0 ? (
              getFilteredHistory().map((item) => (
                <div
                  key={item.id}
                  className={`full-history-card ${getLeaveColor(
                    item.leave_type_name
                  )}`}
                >
                  <div className="d-flex gap-3 align-items-start">
                    <div
                      className={`icon-box-premium ${getLeaveColor(
                        item.leave_type_name
                      )}`}
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "18px",
                        fontSize: "1.8rem",
                      }}
                    >
                      <span className="material-symbols-rounded">
                        {getLeaveIcon(item.leave_type_name)}
                      </span>
                    </div>

                    <div className="full-history-info">
                      <h6>{item.leave_type_name}</h6>
                      <div className="full-history-meta mb-2">
                        <span>
                          <i className="material-symbols-rounded fs-6">
                            calendar_today
                          </i>
                          {formatDateTH(item.start_date)} -{" "}
                          {formatDateTH(item.end_date)}
                        </span>
                        <span className="text-primary fw-bold bg-primary-subtle px-2 rounded">
                          {item.total_days} วัน
                        </span>
                      </div>
                      {item.reason && (
                        <p className="text-muted m-0 small fst-italic">
                          "{item.reason}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="d-flex flex-column align-items-end justify-content-between h-100 gap-2">
                    <div className={`pill-badge ${item.status}`}>
                      {item.status === "approved" && (
                        <>
                          <span className="material-symbols-rounded fs-6">
                            check
                          </span>{" "}
                          อนุมัติ
                        </>
                      )}
                      {item.status === "rejected" && (
                        <>
                          <span className="material-symbols-rounded fs-6">
                            close
                          </span>{" "}
                          ไม่อนุมัติ
                        </>
                      )}
                      {item.status === "pending" && (
                        <>
                          <span className="material-symbols-rounded fs-6">
                            hourglass_empty
                          </span>{" "}
                          รออนุมัติ
                        </>
                      )}
                      {item.status === "cancelled" && (
                        <>
                          <span className="material-symbols-rounded fs-6">
                            block
                          </span>{" "}
                          ยกเลิก
                        </>
                      )}
                    </div>
                    <small
                      className="text-muted opacity-50"
                      style={{ fontSize: "0.7rem" }}
                    >
                      {formatDateTH(item.created_at)}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-5">
                <div className="text-muted opacity-50">
                  <span className="material-symbols-rounded fs-1">
                    search_off
                  </span>
                  <p className="mt-2">ไม่พบข้อมูล</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </ModernModal>
    </div>
  );
};

export default Leave;
