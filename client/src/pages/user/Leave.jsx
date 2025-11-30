import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import th from "date-fns/locale/th"; // Import locale ไทย
import "./Leave.css";

// Register Locale
registerLocale("th", th);

const Leave = () => {
  // --- State ---
  const [formData, setFormData] = useState({
    leaveType: "sick",
    otherTypeDetail: "",
    startDate: null, // เก็บเป็น Date Object
    endDate: null, // เก็บเป็น Date Object
    startTime: null, // เก็บเป็น Date Object (เอาแค่เวลา)
    endTime: null, // เก็บเป็น Date Object (เอาแค่เวลา)
    reason: "",
    file: null,
  });

  const [isFullDay, setIsFullDay] = useState(true);
  const [durationStr, setDurationStr] = useState("");

  const leaveTypes = ["sick", "business", "vacation", "other"];

  // --- Modal & Filter State ---
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock Data
  const leaveStats = {
    sick: { used: 2, total: 30, color: "danger", icon: "sick" },
    business: { used: 1, total: 7, color: "warning", icon: "business_center" },
    vacation: { used: 3, total: 10, color: "primary", icon: "beach_access" },
  };

  const [history, setHistory] = useState([
    {
      id: 1,
      type: "sick",
      typeName: "ลาป่วย",
      dates: "10 พ.ย. 68",
      duration: "1 วัน",
      status: "approved",
      reason: "ปวดหัว ตัวร้อน เป็นไข้หวัด",
      requestDate: new Date("2025-11-09"),
    },
    {
      id: 2,
      type: "business",
      typeName: "ลากิจ",
      dates: "05 ต.ค. 68 (09:00 - 12:00)",
      duration: "3 ชม.",
      status: "approved",
      reason: "ติดต่อราชการ",
      requestDate: new Date("2025-10-01"),
    },
  ]);

  // --- Helpers for Formatting ---
  const formatDateTH = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  };

  const formatTimeTH = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- Logic Handlers ---
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleDateChange = (key, date) => {
    setFormData((prev) => {
      const newData = { ...prev, [key]: date };
      // Auto-set End Date if Start Date is selected and End Date is empty
      if (key === "startDate" && !newData.endDate) {
        newData.endDate = date;
      }
      return newData;
    });
  };

  // Calculation Effect
  useEffect(() => {
    const { startDate, endDate, startTime, endTime } = formData;

    // Reset duration if basic dates are missing
    if (!startDate || !endDate) {
      setDurationStr("");
      return;
    }

    // 1. ตรวจสอบวันที่ (Start ต้องไม่มากกว่า End)
    // ใช้ setHours(0,0,0,0) เพื่อเปรียบเทียบเฉพาะวันที่
    const sDate = new Date(startDate);
    sDate.setHours(0, 0, 0, 0);
    const eDate = new Date(endDate);
    eDate.setHours(0, 0, 0, 0);

    if (eDate < sDate) {
      setDurationStr("วันที่ไม่ถูกต้อง");
      return;
    }

    if (isFullDay) {
      // --- คำนวณแบบวัน ---
      const diffTime = Math.abs(eDate - sDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDurationStr(`${diffDays} วัน`);
    } else {
      // --- คำนวณแบบเวลา ---
      if (!startTime || !endTime) {
        setDurationStr(""); // รอเลือกเวลาให้ครบ
        return;
      }

      // สร้าง Date Object ที่รวมวัน+เวลา
      const startDateTime = new Date(startDate);
      startDateTime.setHours(startTime.getHours(), startTime.getMinutes());

      const endDateTime = new Date(endDate);
      endDateTime.setHours(endTime.getHours(), endTime.getMinutes());

      if (endDateTime <= startDateTime) {
        setDurationStr("เวลาไม่ถูกต้อง");
        return;
      }

      const diffMs = endDateTime - startDateTime;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / 60000);

      let text = "";
      if (diffHrs > 0) text += `${diffHrs} ชม. `;
      if (diffMins > 0) text += `${diffMins} นาที`;
      setDurationStr(text || "0 นาที");
    }
  }, [formData, isFullDay]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.leaveType === "other" && !formData.otherTypeDetail.trim()) {
      Swal.fire("กรุณาระบุ", "โปรดระบุประเภทการลาอื่นๆ", "warning");
      return;
    }
    if (!durationStr || durationStr.includes("ไม่ถูกต้อง")) {
      Swal.fire("ข้อมูลไม่ครบถ้วน", "กรุณาตรวจสอบวันและเวลา", "error");
      return;
    }

    const typeName =
      formData.leaveType === "other"
        ? `อื่นๆ (${formData.otherTypeDetail})`
        : getLeaveLabel(formData.leaveType);

    const dateDisplay = isFullDay
      ? `${formatDateTH(formData.startDate)} - ${formatDateTH(
          formData.endDate
        )}`
      : `${formatDateTH(formData.startDate)} (${formatTimeTH(
          formData.startTime
        )} - ${formatTimeTH(formData.endTime)})`;

    Swal.fire({
      title: "ยืนยันการขอลา?",
      html: `
        <div class="text-start fs-6 p-2">
          <p class="mb-1"><strong>ประเภท:</strong> ${typeName}</p>
          <p class="mb-1"><strong>ระยะเวลา:</strong> ${durationStr}</p>
          <p class="mb-0 text-muted small">ช่วงเวลา: ${dateDisplay}</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#1e2a45",
      confirmButtonText: "ส่งคำขอ",
      cancelButtonText: "ยกเลิก",
      customClass: { popup: "rounded-4" },
    }).then((result) => {
      if (result.isConfirmed) {
        // Add to Mock History
        const newItem = {
          id: Date.now(),
          type: formData.leaveType,
          typeName: typeName,
          dates: dateDisplay,
          duration: durationStr,
          status: "pending",
          reason: formData.reason,
          requestDate: new Date(),
        };
        setHistory([newItem, ...history]);

        Swal.fire("สำเร็จ!", "ส่งคำขอลาเรียบร้อยแล้ว", "success");
        // Reset Form
        setFormData({
          leaveType: "sick",
          otherTypeDetail: "",
          reason: "",
          file: null,
          startDate: null,
          endDate: null,
          startTime: null,
          endTime: null,
        });
        setDurationStr("");
      }
    });
  };

  // Helper Labels & Icons
  const getLeaveLabel = (t) =>
    t === "sick"
      ? "ลาป่วย"
      : t === "business"
      ? "ลากิจ"
      : t === "vacation"
      ? "พักร้อน"
      : "อื่นๆ";
  const getLeaveIcon = (t) =>
    t === "sick"
      ? "sick"
      : t === "business"
      ? "business_center"
      : t === "vacation"
      ? "beach_access"
      : "category";

  const getStatusBadge = (status) => {
    const config = {
      approved: { text: "อนุมัติ", class: "approved", icon: "check_circle" },
      rejected: { text: "ไม่อนุมัติ", class: "rejected", icon: "cancel" },
      pending: { text: "รออนุมัติ", class: "pending", icon: "hourglass_top" },
    };
    const s = config[status] || config.pending;
    return (
      <span className={`status-badge ${s.class}`}>
        <span className="material-symbols-rounded fs-6">{s.icon}</span> {s.text}
      </span>
    );
  };

  // Filter History
  const filteredHistory = history.filter((item) => {
    const matchType = filterType === "all" || item.type === filterType;
    const term = searchTerm.toLowerCase();
    const matchSearch =
      item.typeName.toLowerCase().includes(term) ||
      item.dates.toLowerCase().includes(term);
    return matchType && matchSearch;
  });

  return (
    <div className="leave-page fade-in">
      <div className="container-xl py-4">
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div>
            <h2 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
              <div className="icon-bg-primary">
                <span className="material-symbols-rounded">wb_sunny</span>
              </div>
              ระบบแจ้งการลา
            </h2>
            <p className="text-muted m-0 mt-1 ms-1">Leave Request Management</p>
          </div>
        </div>

        <div className="row g-4">
          {/* --- LEFT: Request Form --- */}
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
                  <div className="row g-4">
                    {/* 1. ประเภทการลา */}
                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small mb-3">
                        เลือกประเภทการลา
                      </label>
                      <div className="leave-type-selector">
                        {leaveTypes.map((type) => (
                          <label
                            key={type}
                            className={`type-option ${
                              formData.leaveType === type ? "active" : ""
                            } ${type}`}
                          >
                            <input
                              type="radio"
                              name="leaveType"
                              value={type}
                              checked={formData.leaveType === type}
                              onChange={handleChange}
                              className="d-none"
                            />
                            <div className="icon-circle mb-2">
                              <span className="material-symbols-rounded">
                                {getLeaveIcon(type)}
                              </span>
                            </div>
                            <span className="fw-semibold">
                              {getLeaveLabel(type)}
                            </span>
                          </label>
                        ))}
                      </div>
                      {formData.leaveType === "other" && (
                        <div className="mt-3 fade-in">
                          <label className="form-label text-primary small fw-bold ms-1">
                            โปรดระบุประเภทการลา
                          </label>
                          <input
                            type="text"
                            name="otherTypeDetail"
                            className="form-control custom-input border-primary"
                            placeholder="เช่น ลาบวช, ลาฝึกอบรม, ลาคลอด"
                            value={formData.otherTypeDetail}
                            onChange={handleChange}
                            autoFocus
                          />
                        </div>
                      )}
                    </div>

                    {/* 2. วันที่และเวลา */}
                    <div className="col-12">
                      <div className="bg-light rounded-4 p-3 border">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <label className="form-label fw-bold text-muted small m-0">
                            ระบุวันและเวลา
                          </label>
                          <div className="form-check form-switch d-flex align-items-center gap-2 m-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              id="fullDaySwitch"
                              checked={isFullDay}
                              onChange={(e) => setIsFullDay(e.target.checked)}
                              style={{ cursor: "pointer" }}
                            />
                            <label
                              className="form-check-label fw-bold small text-dark"
                              htmlFor="fullDaySwitch"
                              style={{ cursor: "pointer" }}
                            >
                              {isFullDay
                                ? "ลาเต็มวัน (Full Day)"
                                : "ระบุเวลา (Time)"}
                            </label>
                          </div>
                        </div>
                        <div className="row g-3">
                          {/* Date Pickers */}
                          <div className="col-md-6">
                            <div className="input-group-modern">
                              <span className="input-icon material-symbols-rounded">
                                calendar_today
                              </span>
                              <DatePicker
                                selected={formData.startDate}
                                onChange={(date) =>
                                  handleDateChange("startDate", date)
                                }
                                className="form-control custom-input ps-5 w-100"
                                placeholderText="ตั้งแต่วันที่"
                                dateFormat="dd/MM/yyyy"
                                locale="th"
                                popperPlacement="bottom-start" // บังคับแสดงด้านล่าง
                                required
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="input-group-modern">
                              <span className="input-icon material-symbols-rounded">
                                event_upcoming
                              </span>
                              <DatePicker
                                selected={formData.endDate}
                                onChange={(date) =>
                                  handleDateChange("endDate", date)
                                }
                                className="form-control custom-input ps-5 w-100"
                                placeholderText="ถึงวันที่"
                                dateFormat="dd/MM/yyyy"
                                minDate={formData.startDate}
                                locale="th"
                                popperPlacement="bottom-start" // บังคับแสดงด้านล่าง
                                required
                              />
                            </div>
                          </div>

                          {/* Time Pickers (Show if NOT Full Day) */}
                          {!isFullDay && (
                            <div className="col-12 fade-in">
                              <div className="row g-3">
                                <div className="col-6">
                                  <label className="small text-muted ms-1 mb-1">
                                    ตั้งแต่เวลา
                                  </label>
                                  <div className="input-group-modern">
                                    <span className="input-icon material-symbols-rounded">
                                      schedule
                                    </span>
                                    <DatePicker
                                      selected={formData.startTime}
                                      onChange={(date) =>
                                        handleDateChange("startTime", date)
                                      }
                                      showTimeSelect
                                      showTimeSelectOnly
                                      timeIntervals={15}
                                      timeCaption="เวลา"
                                      dateFormat="HH:mm"
                                      placeholderText="09:00"
                                      locale="th"
                                      popperPlacement="bottom-start" // บังคับแสดงด้านล่าง
                                      className="form-control custom-input ps-5 text-center fw-bold w-100"
                                    />
                                  </div>
                                </div>
                                <div className="col-6">
                                  <label className="small text-muted ms-1 mb-1">
                                    ถึงเวลา
                                  </label>
                                  <div className="input-group-modern">
                                    <span className="input-icon material-symbols-rounded">
                                      schedule
                                    </span>
                                    <DatePicker
                                      selected={formData.endTime}
                                      onChange={(date) =>
                                        handleDateChange("endTime", date)
                                      }
                                      showTimeSelect
                                      showTimeSelectOnly
                                      timeIntervals={15}
                                      timeCaption="เวลา"
                                      dateFormat="HH:mm"
                                      placeholderText="18:00"
                                      locale="th"
                                      popperPlacement="bottom-start" // บังคับแสดงด้านล่าง
                                      className="form-control custom-input ps-5 text-center fw-bold w-100"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Alert Duration */}
                    {durationStr && (
                      <div className="col-12">
                        <div className="duration-alert fade-in">
                          <div className="d-flex align-items-center gap-2">
                            <span className="material-symbols-rounded fs-5">
                              timelapse
                            </span>
                            <span>รวมระยะเวลา:</span>
                          </div>
                          <span className="badge bg-white text-primary fs-6 shadow-sm">
                            {durationStr}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Reason & Files */}
                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small">
                        เหตุผลการลา
                      </label>
                      <textarea
                        className="form-control custom-input"
                        rows="2"
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        placeholder="ระบุสาเหตุ..."
                        required
                        style={{ resize: "none" }}
                      ></textarea>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small">
                        เอกสารแนบ
                      </label>
                      <div className="input-group-modern">
                        <span className="input-icon material-symbols-rounded">
                          attach_file
                        </span>
                        <input
                          type="file"
                          className="form-control custom-input ps-5"
                          name="file"
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="col-12 mt-4">
                      <button
                        type="submit"
                        className="btn btn-modern-primary w-100 py-3 rounded-4 shadow-sm fw-bold text-white"
                      >
                        ส่งคำขออนุมัติ{" "}
                        <span className="material-symbols-rounded align-middle ms-1 fs-5">
                          send
                        </span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* --- RIGHT: Stats & History --- */}
          <div className="col-lg-4">
            <div className="d-flex flex-column gap-4 h-100">
              {/* Stats Card */}
              <div className="leave-card p-4 bg-gradient-dark text-white position-relative overflow-hidden">
                <div className="position-relative z-1">
                  <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                    <span className="material-symbols-rounded">pie_chart</span>{" "}
                    โควตาวันลา
                  </h5>
                  <div className="d-flex flex-column gap-4">
                    {Object.entries(leaveStats).map(([key, stat]) => (
                      <div key={key}>
                        <div className="d-flex justify-content-between mb-1 align-items-end">
                          <span className="fw-medium text-uppercase opacity-75 small">
                            {getLeaveLabel(key)}
                          </span>
                          <span className="fw-bold">
                            {stat.used}/{stat.total}
                          </span>
                        </div>
                        <div
                          className="progress bg-white-20 rounded-pill"
                          style={{ height: "8px" }}
                        >
                          <div
                            className={`progress-bar bg-${stat.color}`}
                            style={{
                              width: `${(stat.used / stat.total) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="decorative-circle"></div>
              </div>

              {/* History Preview */}
              <div className="leave-card p-0 flex-grow-1 d-flex flex-column">
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
                  <h6 className="m-0 fw-bold text-dark">ประวัติล่าสุด</h6>
                  <small
                    className="text-primary fw-bold cursor-pointer hover-scale d-flex align-items-center gap-1"
                    onClick={() => setShowHistoryModal(true)}
                  >
                    ดูทั้งหมด{" "}
                    <span className="material-symbols-rounded fs-6">
                      arrow_forward
                    </span>
                  </small>
                </div>
                <div className="history-list p-3 flex-grow-1">
                  {history.slice(0, 4).map((item) => (
                    <div key={item.id} className="history-item">
                      <div className={`date-box ${item.type}`}>
                        <span className="material-symbols-rounded fs-4">
                          {getLeaveIcon(item.type)}
                        </span>
                      </div>
                      <div className="history-info">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div
                              className="fw-bold text-dark"
                              style={{ fontSize: "0.9rem" }}
                            >
                              {item.typeName}
                            </div>
                            <div
                              className="text-muted"
                              style={{ fontSize: "0.75rem" }}
                            >
                              {item.dates}
                            </div>
                          </div>
                          <div className="text-end">
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- HISTORY MODAL --- */}
      {showHistoryModal && (
        <div className="modal-backdrop-custom fade-in">
          <div className="modal-dialog-custom">
            <div className="modal-content-custom">
              {!selectedHistoryItem ? (
                <>
                  <div className="modal-header-custom p-4 border-bottom d-flex justify-content-between align-items-center bg-white sticky-top">
                    <div>
                      <h5 className="m-0 fw-bold text-dark d-flex align-items-center gap-2">
                        <span className="material-symbols-rounded text-primary">
                          history
                        </span>{" "}
                        ประวัติการลาทั้งหมด
                      </h5>
                      <small className="text-muted">ปีงบประมาณ 2025</small>
                    </div>
                    <button
                      className="btn-close-custom"
                      onClick={handleCloseModal}
                    >
                      <span className="material-symbols-rounded">close</span>
                    </button>
                  </div>
                  <div className="p-3 bg-light border-bottom sticky-sub-top">
                    <div className="row g-2">
                      <div className="col-md-8">
                        <div className="input-group-modern bg-white rounded-3 shadow-sm border-0">
                          <span className="input-icon material-symbols-rounded">
                            search
                          </span>
                          <input
                            type="text"
                            className="form-control custom-input border-0 ps-5"
                            placeholder="ค้นหา..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <select
                          className="form-select custom-input border-0 shadow-sm"
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                        >
                          <option value="all">ทุกประเภท</option>
                          <option value="sick">ลาป่วย</option>
                          <option value="business">ลากิจ</option>
                          <option value="vacation">พักร้อน</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="modal-body-custom p-3 bg-light">
                    <div className="d-flex flex-column gap-3">
                      {filteredHistory.map((item) => (
                        <div
                          key={item.id}
                          className="history-card-full bg-white p-3 rounded-4 shadow-sm border d-flex justify-content-between align-items-center hover-scale cursor-pointer"
                          onClick={() => setSelectedHistoryItem(item)}
                        >
                          <div className="d-flex gap-3 align-items-center">
                            <div className={`date-box large ${item.type}`}>
                              <span className="material-symbols-rounded fs-3">
                                {getLeaveIcon(item.type)}
                              </span>
                            </div>
                            <div>
                              <h6 className="fw-bold m-0 text-dark">
                                {item.typeName}
                              </h6>
                              <div className="text-muted small mt-1">
                                <span className="material-symbols-rounded fs-6 align-middle me-1">
                                  event
                                </span>
                                {item.dates}
                              </div>
                            </div>
                          </div>
                          <div className="text-end d-flex flex-column align-items-end gap-1">
                            {getStatusBadge(item.status)}
                            <small className="text-muted fw-bold d-flex align-items-center gap-1 mt-1">
                              ดูรายละเอียด{" "}
                              <span className="material-symbols-rounded fs-6">
                                chevron_right
                              </span>
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="modal-header-custom p-3 border-bottom d-flex align-items-center gap-3 bg-white sticky-top">
                    <button
                      className="btn-back-custom"
                      onClick={() => setSelectedHistoryItem(null)}
                    >
                      <span className="material-symbols-rounded">
                        arrow_back
                      </span>
                    </button>
                    <div>
                      <h5 className="m-0 fw-bold text-dark">รายละเอียดการลา</h5>
                      <small className="text-muted">
                        ID: #{selectedHistoryItem.id}
                      </small>
                    </div>
                  </div>
                  <div className="modal-body-custom p-4 bg-light">
                    <div className="bg-white rounded-4 shadow-sm p-4 border slide-in-right">
                      <div className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom">
                        <div className="d-flex gap-3 align-items-center">
                          <div
                            className={`date-box large ${selectedHistoryItem.type}`}
                          >
                            <span className="material-symbols-rounded fs-2">
                              {getLeaveIcon(selectedHistoryItem.type)}
                            </span>
                          </div>
                          <div>
                            <h4 className="fw-bold m-0 text-dark">
                              {selectedHistoryItem.typeName}
                            </h4>
                            <div className="text-primary fw-bold mt-1">
                              {selectedHistoryItem.duration}
                            </div>
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="mb-1 text-muted small">สถานะ</div>
                          {getStatusBadge(selectedHistoryItem.status)}
                        </div>
                      </div>
                      <div className="row g-4 mb-4">
                        <div className="col-6">
                          <label className="text-muted small fw-bold mb-1">
                            วันที่ขอลา
                          </label>
                          <div className="d-flex align-items-center gap-2">
                            <span className="material-symbols-rounded text-muted">
                              date_range
                            </span>
                            <span className="fw-medium">
                              {selectedHistoryItem.dates}
                            </span>
                          </div>
                        </div>
                        <div className="col-6">
                          <label className="text-muted small fw-bold mb-1">
                            วันที่ยื่นเรื่อง
                          </label>
                          <div className="d-flex align-items-center gap-2">
                            <span className="material-symbols-rounded text-muted">
                              today
                            </span>
                            <span className="fw-medium">
                              {formatDateTH(selectedHistoryItem.requestDate)}
                            </span>
                          </div>
                        </div>
                        <div className="col-12">
                          <label className="text-muted small fw-bold mb-1">
                            เหตุผลการลา
                          </label>
                          <div className="bg-light p-3 rounded-3 border text-secondary">
                            {selectedHistoryItem.reason || "- ไม่ได้ระบุ -"}
                          </div>
                        </div>
                      </div>
                      <div className="timeline-container mt-4">
                        <h6 className="fw-bold mb-3">สถานะการดำเนินการ</h6>
                        <div className="timeline-item completed">
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <div className="fw-bold">ส่งคำขอแล้ว</div>
                            <small className="text-muted">
                              {formatDateTH(selectedHistoryItem.requestDate)}
                            </small>
                          </div>
                        </div>
                        <div
                          className={`timeline-item ${
                            selectedHistoryItem.status !== "pending"
                              ? "completed"
                              : "active"
                          }`}
                        >
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <div className="fw-bold">หัวหน้างานพิจารณา</div>
                            <small className="text-muted">
                              {selectedHistoryItem.status === "pending"
                                ? "กำลังดำเนินการ..."
                                : "ผ่านการอนุมัติ"}
                            </small>
                          </div>
                        </div>
                        {selectedHistoryItem.status === "approved" && (
                          <div className="timeline-item completed">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                              <div className="fw-bold text-success">
                                อนุมัติเรียบร้อย
                              </div>
                            </div>
                          </div>
                        )}
                        {selectedHistoryItem.status === "rejected" && (
                          <div className="timeline-item rejected">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                              <div className="fw-bold text-danger">
                                ไม่อนุมัติ
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leave;
