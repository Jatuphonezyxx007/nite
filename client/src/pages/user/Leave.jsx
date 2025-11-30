import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import th from "date-fns/locale/th";
import axios from "axios";
import "./Leave.css";

registerLocale("th", th);

const Leave = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // --- State ---
  const [formData, setFormData] = useState({
    leaveTypeId: "",
    otherTypeDetail: "",
    startDate: null,
    endDate: null,
    startTime: null,
    endTime: null,
    reason: "",
    file: null,
  });

  const [isFullDay, setIsFullDay] = useState(true);
  const [durationStr, setDurationStr] = useState("");

  // Data from API
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveStats, setLeaveStats] = useState([]);
  const [history, setHistory] = useState([]);

  // --- Modal & Filter State ---
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Filter States
  const [filterType, setFilterType] = useState("all"); // เก็บ ID ของประเภทลา (หรือ 'all')
  const [filterStatus, setFilterStatus] = useState("all"); // all, approved, pending, rejected
  const [searchTerm, setSearchTerm] = useState("");

  // --- 1. Fetch Data on Load ---
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

  const handleDateChange = (key, date) => {
    setFormData((prev) => {
      const newData = { ...prev, [key]: date };
      if (key === "startDate" && !newData.endDate) {
        newData.endDate = date;
      }
      return newData;
    });
  };

  const handleCloseModal = () => {
    setShowHistoryModal(false);
    setSelectedHistoryItem(null);
    // Reset Filters when close (Optional)
    // setFilterType("all");
    // setFilterStatus("all");
    // setSearchTerm("");
  };

  // --- Logic คำนวณเวลา ---
  useEffect(() => {
    const { startDate, endDate, startTime, endTime } = formData;
    if (!startDate || !endDate) {
      setDurationStr("");
      return;
    }

    const sDate = new Date(startDate);
    sDate.setHours(0, 0, 0, 0);
    const eDate = new Date(endDate);
    eDate.setHours(0, 0, 0, 0);

    if (eDate < sDate) {
      setDurationStr("วันที่ไม่ถูกต้อง");
      return;
    }

    if (isFullDay) {
      const diffTime = Math.abs(eDate - sDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDurationStr(`${diffDays} วัน`);
    } else {
      if (!startTime || !endTime) return;

      const startDT = new Date(startDate);
      startDT.setHours(startTime.getHours(), startTime.getMinutes());
      const endDT = new Date(endDate);
      endDT.setHours(endTime.getHours(), endTime.getMinutes());

      if (endDT <= startDT) {
        setDurationStr("เวลาไม่ถูกต้อง");
        return;
      }

      const diffMs = endDT - startDT;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / 60000);

      setDurationStr(
        `${diffHrs} ชม. ${diffMins > 0 ? diffMins + " นาที" : ""}`
      );
    }
  }, [formData, isFullDay]);

  // --- Helper Functions ---
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

  const formatDateTH = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("th-TH", {
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

  // --- Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!durationStr || durationStr.includes("ไม่ถูกต้อง")) {
      return Swal.fire("ข้อมูลไม่ครบถ้วน", "กรุณาตรวจสอบวันและเวลา", "error");
    }

    const selectedType = leaveTypes.find(
      (t) => t.id === parseInt(formData.leaveTypeId)
    );
    const typeName = selectedType ? selectedType.name : "ไม่ระบุ";

    Swal.fire({
      title: "ยืนยันการขอลา?",
      text: `ประเภท: ${typeName} | ระยะเวลา: ${durationStr}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#1e2a45",
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const submitData = new FormData();
        submitData.append("leaveTypeId", formData.leaveTypeId);
        submitData.append(
          "startDate",
          formData.startDate.toISOString().split("T")[0]
        );
        submitData.append(
          "endDate",
          formData.endDate.toISOString().split("T")[0]
        );
        submitData.append("isFullDay", isFullDay);
        submitData.append("reason", formData.reason);

        if (!isFullDay && formData.startTime && formData.endTime) {
          submitData.append(
            "startTime",
            formData.startTime.toTimeString().split(" ")[0]
          );
          submitData.append(
            "endTime",
            formData.endTime.toTimeString().split(" ")[0]
          );
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
          setFormData({
            ...formData,
            reason: "",
            file: null,
            startDate: null,
            endDate: null,
          });
          setDurationStr("");
        } catch (err) {
          Swal.fire("Error", "เกิดข้อผิดพลาดในการบันทึก", "error");
        }
      }
    });
  };

  // --- Advanced Filter Logic ---
  const filteredHistory = history.filter((item) => {
    // 1. Filter by Leave Type (ID)
    const matchType =
      filterType === "all" || item.leave_type_id === parseInt(filterType);

    // 2. Filter by Status
    const matchStatus = filterStatus === "all" || item.status === filterStatus;

    // 3. Search (Date, Name)
    const term = searchTerm.toLowerCase();
    const dateStr = formatDateTH(item.start_date);
    const matchSearch =
      (item.leave_type_name || "").toLowerCase().includes(term) ||
      dateStr.includes(term);

    return matchType && matchStatus && matchSearch;
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
          {/* LEFT: Form */}
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
                    {/* Leave Types */}
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

                    {/* Date Time */}
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
                              checked={isFullDay}
                              onChange={(e) => setIsFullDay(e.target.checked)}
                              style={{ cursor: "pointer" }}
                            />
                            <label
                              className="form-check-label fw-bold small text-dark"
                              style={{ cursor: "pointer" }}
                            >
                              {isFullDay ? "ลาเต็มวัน" : "ระบุเวลา"}
                            </label>
                          </div>
                        </div>
                        <div className="row g-3">
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
                                popperPlacement="bottom-start"
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
                                popperPlacement="bottom-start"
                                required
                              />
                            </div>
                          </div>
                          {!isFullDay && (
                            <div className="col-12 fade-in">
                              <div className="row g-3">
                                <div className="col-6">
                                  <label className="small text-muted ms-1 mb-1">
                                    เวลาเริ่ม
                                  </label>
                                  <DatePicker
                                    selected={formData.startTime}
                                    onChange={(date) =>
                                      handleDateChange("startTime", date)
                                    }
                                    showTimeSelect
                                    showTimeSelectOnly
                                    timeIntervals={15}
                                    dateFormat="HH:mm"
                                    placeholderText="09:00"
                                    className="form-control custom-input text-center fw-bold w-100"
                                  />
                                </div>
                                <div className="col-6">
                                  <label className="small text-muted ms-1 mb-1">
                                    เวลาสิ้นสุด
                                  </label>
                                  <DatePicker
                                    selected={formData.endTime}
                                    onChange={(date) =>
                                      handleDateChange("endTime", date)
                                    }
                                    showTimeSelect
                                    showTimeSelectOnly
                                    timeIntervals={15}
                                    dateFormat="HH:mm"
                                    placeholderText="18:00"
                                    className="form-control custom-input text-center fw-bold w-100"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Duration & Reason */}
                    {durationStr && (
                      <div className="col-12">
                        <div className="duration-alert fade-in">
                          <div className="d-flex align-items-center gap-2">
                            <span className="material-symbols-rounded fs-5">
                              timelapse
                            </span>
                            <span>รวม:</span>
                          </div>
                          <span className="badge bg-white text-primary fs-6 shadow-sm">
                            {durationStr}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="col-12">
                      <label className="form-label fw-bold text-muted small">
                        เหตุผล
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
                    <div className="col-12 mt-3">
                      <button
                        type="submit"
                        className="btn btn-modern-primary w-100 py-3 rounded-4 shadow-sm fw-bold"
                      >
                        ส่งคำขออนุมัติ
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* RIGHT: Stats */}
          <div className="col-lg-4">
            <div className="d-flex flex-column gap-4 h-100">
              <div className="leave-card p-4 bg-gradient-dark text-white position-relative overflow-hidden">
                <div className="position-relative z-1">
                  <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                    <span className="material-symbols-rounded">pie_chart</span>{" "}
                    โควตาวันลา
                  </h5>
                  <div className="d-flex flex-column gap-4">
                    {leaveStats.map((stat) => {
                      const cssClass = getLeaveColor(stat.name);
                      const remaining =
                        stat.remaining !== null
                          ? stat.remaining
                          : stat.max_per_year;
                      const used = stat.used;
                      const total = stat.max_per_year;
                      const percent = total > 0 ? (used / total) * 100 : 0;
                      return (
                        <div key={stat.id}>
                          <div className="d-flex justify-content-between mb-1 align-items-end">
                            <span className="fw-medium text-uppercase opacity-75 small">
                              {stat.name}
                            </span>
                            <span className="fw-bold">
                              {used}/{total}
                            </span>
                          </div>
                          <div
                            className="progress bg-white-20 rounded-pill"
                            style={{ height: "8px" }}
                          >
                            <div
                              className={`progress-bar bg-${
                                cssClass === "sick"
                                  ? "danger"
                                  : cssClass === "business"
                                  ? "warning"
                                  : "primary"
                              }`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="decorative-circle"></div>
              </div>

              {/* History Preview */}
              <div className="leave-card p-0 flex-grow-1 d-flex flex-column">
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
                  <h6 className="m-0 fw-bold text-dark">ประวัติล่าสุด</h6>
                  <small
                    className="text-primary fw-bold cursor-pointer hover-scale"
                    onClick={() => setShowHistoryModal(true)}
                  >
                    ดูทั้งหมด
                  </small>
                </div>
                <div className="history-list p-3 flex-grow-1">
                  {history.slice(0, 4).map((item) => (
                    <div key={item.id} className="history-item">
                      <div
                        className={`date-box ${getLeaveColor(
                          item.leave_type_name
                        )}`}
                      >
                        <span className="material-symbols-rounded fs-4">
                          {getLeaveIcon(item.leave_type_name)}
                        </span>
                      </div>
                      <div className="history-info">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div
                              className="fw-bold text-dark"
                              style={{ fontSize: "0.9rem" }}
                            >
                              {item.leave_type_name}
                            </div>
                            <div
                              className="text-muted"
                              style={{ fontSize: "0.75rem" }}
                            >
                              {formatDateTH(item.start_date)}
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

      {/* --- FULL HISTORY MODAL --- */}
      {showHistoryModal && (
        <div className="modal-backdrop-custom fade-in">
          <div className="modal-dialog-custom">
            <div className="modal-content-custom">
              {!selectedHistoryItem ? (
                <>
                  {/* Header */}
                  <div className="modal-header-custom p-4 border-bottom d-flex justify-content-between bg-white sticky-top">
                    <h5 className="m-0 fw-bold d-flex align-items-center gap-2">
                      <span className="material-symbols-rounded text-primary">
                        history
                      </span>
                      ประวัติการลาทั้งหมด
                    </h5>
                    <button
                      className="btn-close-custom"
                      onClick={handleCloseModal}
                    >
                      <span className="material-symbols-rounded">close</span>
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="p-3 bg-light border-bottom sticky-sub-top">
                    <div className="row g-2">
                      {/* Search Input */}
                      <div className="col-12 col-md-6">
                        <div className="input-group-modern bg-white rounded-3 shadow-sm border-0">
                          <span className="input-icon material-symbols-rounded">
                            search
                          </span>
                          <input
                            type="text"
                            className="form-control custom-input border-0 ps-5"
                            placeholder="ค้นหา วันที่, ประเภท..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                      {/* Filter: Type */}
                      <div className="col-6 col-md-3">
                        <select
                          className="form-select custom-input border-0 shadow-sm"
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                        >
                          <option value="all">ทุกประเภท</option>
                          {leaveTypes.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* Filter: Status */}
                      <div className="col-6 col-md-3">
                        <select
                          className="form-select custom-input border-0 shadow-sm"
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                        >
                          <option value="all">ทุกสถานะ</option>
                          <option value="pending">รออนุมัติ</option>
                          <option value="approved">อนุมัติแล้ว</option>
                          <option value="rejected">ไม่อนุมัติ</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* List */}
                  <div className="modal-body-custom p-3 bg-light">
                    <div className="d-flex flex-column gap-3">
                      {filteredHistory.length > 0 ? (
                        filteredHistory.map((item) => (
                          <div
                            key={item.id}
                            className="history-card-full bg-white p-3 rounded-4 shadow-sm border d-flex justify-content-between align-items-center hover-scale cursor-pointer"
                            onClick={() => setSelectedHistoryItem(item)}
                          >
                            <div className="d-flex gap-3 align-items-center">
                              <div
                                className={`date-box large ${getLeaveColor(
                                  item.leave_type_name
                                )}`}
                              >
                                <span className="material-symbols-rounded fs-3">
                                  {getLeaveIcon(item.leave_type_name)}
                                </span>
                              </div>
                              <div>
                                <h6 className="fw-bold m-0 text-dark">
                                  {item.leave_type_name}
                                </h6>
                                <div className="text-muted small mt-1">
                                  {formatDateTH(item.start_date)} -{" "}
                                  {formatDateTH(item.end_date)}
                                </div>
                              </div>
                            </div>
                            <div className="text-end d-flex flex-column align-items-end">
                              {getStatusBadge(item.status)}
                              <small
                                className="text-muted mt-1"
                                style={{ fontSize: "0.7rem" }}
                              >
                                แตะเพื่อดู
                              </small>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-5 text-muted">
                          <span className="material-symbols-rounded fs-1 opacity-25">
                            search_off
                          </span>
                          <p className="mt-2">ไม่พบข้อมูลตามเงื่อนไข</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Detail View */}
                  <div className="modal-header-custom p-3 border-bottom d-flex align-items-center gap-3 bg-white sticky-top">
                    <button
                      className="btn-back-custom"
                      onClick={() => setSelectedHistoryItem(null)}
                    >
                      <span className="material-symbols-rounded">
                        arrow_back
                      </span>
                    </button>
                    <h5 className="m-0 fw-bold">รายละเอียด</h5>
                  </div>
                  <div className="modal-body-custom p-4 bg-light">
                    <div className="bg-white rounded-4 shadow-sm p-4 border slide-in-right">
                      <div className="text-center mb-4">
                        <div
                          className={`date-box large mx-auto mb-2 ${getLeaveColor(
                            selectedHistoryItem.leave_type_name
                          )}`}
                          style={{ width: "64px", height: "64px" }}
                        >
                          <span className="material-symbols-rounded fs-1">
                            {getLeaveIcon(selectedHistoryItem.leave_type_name)}
                          </span>
                        </div>
                        <h4 className="fw-bold text-dark mb-1">
                          {selectedHistoryItem.leave_type_name}
                        </h4>
                        <div>{getStatusBadge(selectedHistoryItem.status)}</div>
                      </div>

                      <div className="row g-4 border-top pt-4">
                        <div className="col-6">
                          <label className="small text-muted fw-bold">
                            วันเริ่มลา
                          </label>
                          <div className="fw-medium">
                            {formatDateTH(selectedHistoryItem.start_date)}
                          </div>
                        </div>
                        <div className="col-6">
                          <label className="small text-muted fw-bold">
                            ถึงวันที่
                          </label>
                          <div className="fw-medium">
                            {formatDateTH(selectedHistoryItem.end_date)}
                          </div>
                        </div>
                        <div className="col-12">
                          <label className="small text-muted fw-bold mb-1">
                            จำนวนรวม
                          </label>
                          <div className="fw-bold text-primary">
                            {selectedHistoryItem.total_days} วัน
                          </div>
                        </div>
                        <div className="col-12">
                          <label className="small text-muted fw-bold mb-1">
                            เหตุผลการลา
                          </label>
                          <div className="bg-light p-3 rounded border text-secondary">
                            {selectedHistoryItem.reason || "- ไม่ได้ระบุ -"}
                          </div>
                        </div>
                        {selectedHistoryItem.medical_certificate_url && (
                          <div className="col-12 text-center mt-4">
                            <a
                              href={`${apiUrl}/uploads/leaves/${selectedHistoryItem.medical_certificate_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-2"
                            >
                              <span className="material-symbols-rounded">
                                attachment
                              </span>{" "}
                              ดูเอกสารแนบ
                            </a>
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
