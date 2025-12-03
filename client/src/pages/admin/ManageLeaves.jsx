import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./ManageLeaves.css";

// Components
import ModernModal from "../../components/Modal";
import AdminLeaveModal from "../../components/AdminLeaveModal";
import Pagination from "../../components/Pagination/Pagination";
import ModernDropdown from "../../components/DropDown";

function ManageLeaves() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // --- DATA STATES ---
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  // --- FILTERS ---
  const [reqStatusFilter, setReqStatusFilter] = useState("pending");
  const [reqSearch, setReqSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterType, setFilterType] = useState("");
  const [empSearch, setEmpSearch] = useState("");

  // --- PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // ปรับจำนวนต่อหน้าให้พอดีกับจอ

  // --- MODALS ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // --- DATA HOLDERS ---
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState({ quota: [], history: [] });
  const [viewTab, setViewTab] = useState("quota");
  const [historyDetailItem, setHistoryDetailItem] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [quotaIndex, setQuotaIndex] = useState(0);

  const tabsContainerRef = useRef(null);

  useEffect(() => {
    fetchRequests();
    fetchEmployees();
    fetchLeaveTypes();
  }, []);

  // Filter Logic... (Same as before)
  useEffect(() => {
    let res = requests;
    if (reqStatusFilter !== "all")
      res = res.filter((r) => r.status === reqStatusFilter);
    if (reqSearch)
      res = res.filter((r) =>
        r.name_th.toLowerCase().includes(reqSearch.toLowerCase())
      );
    if (filterMonth)
      res = res.filter(
        (r) => new Date(r.start_date).getMonth() + 1 === parseInt(filterMonth)
      );
    if (filterYear)
      res = res.filter(
        (r) => new Date(r.start_date).getFullYear() === parseInt(filterYear)
      );
    if (filterType)
      res = res.filter((r) => r.leave_type_id === parseInt(filterType));
    setFilteredRequests(res);
    handleTabScroll(reqStatusFilter);
  }, [
    requests,
    reqStatusFilter,
    reqSearch,
    filterMonth,
    filterYear,
    filterType,
  ]);

  useEffect(() => {
    let res = employees;
    if (empSearch) {
      const lower = empSearch.toLowerCase();
      res = res.filter(
        (e) =>
          e.name_th?.toLowerCase().includes(lower) ||
          e.lastname_th?.toLowerCase().includes(lower) ||
          e.emp_code?.toLowerCase().includes(lower)
      );
      setCurrentPage(1);
    }
    setFilteredEmployees(res);
  }, [employees, empSearch]);

  const handleTabScroll = (activeStatus) => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const activeTab = container.querySelector(
        `[data-status="${activeStatus}"]`
      );
      if (activeTab) {
        const scrollLeft =
          activeTab.offsetLeft -
          container.offsetWidth / 2 +
          activeTab.offsetWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = filteredEmployees.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  // API Calls... (Same as before)
  const fetchRequests = async () => {
    try {
      const res = await axios.get(
        `${apiUrl}/api/leaves/admin/requests`,
        config
      );
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(
        `${apiUrl}/api/leaves/admin/summary-all`,
        config
      );
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  const fetchUserDetail = async (userId) => {
    try {
      const res = await axios.get(
        `${apiUrl}/api/leaves/admin/user/${userId}/full-detail`,
        config
      );
      setUserDetail(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  const fetchLeaveTypes = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/leaves/summary`, config);
      setLeaveTypes(res.data.types);
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers...
  const handleOpenUser = (emp) => {
    setSelectedUser(emp);
    fetchUserDetail(emp.user_id);
    setViewTab(emp.total_leaves > 0 ? "history" : "quota");
    setHistoryDetailItem(null);
    setQuotaIndex(0);
    setShowViewModal(true);
  };
  const handleEditRequest = () => {
    setShowRequestModal(false);
    setShowEditModal(true);
  };
  const updateStatus = async (id, status) => {
    /* ...Same as before... */
    let comment = "";
    if (status === "rejected") {
      const { value: text, isDismissed } = await Swal.fire({
        input: "textarea",
        inputLabel: "ระบุเหตุผล",
        showCancelButton: true,
        confirmButtonText: "ยืนยัน",
        cancelButtonText: "ยกเลิก",
        confirmButtonColor: "#ef4444",
        inputValidator: (value) => !value && "กรุณาระบุเหตุผล!",
      });
      if (isDismissed) return;
      comment = text;
    } else if (status === "approved") {
      const result = await Swal.fire({
        title: "ยืนยันการอนุมัติ?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#10b981",
        confirmButtonText: "ยืนยัน",
        cancelButtonText: "ยกเลิก",
      });
      if (!result.isConfirmed) return;
    }
    try {
      await axios.put(
        `${apiUrl}/api/leaves/${id}/status`,
        { status, comment },
        config
      );
      Swal.fire({
        icon: "success",
        title: "บันทึกเรียบร้อย",
        timer: 1500,
        showConfirmButton: false,
      });
      setShowRequestModal(false);
      fetchRequests();
      fetchEmployees();
      if (selectedUser) fetchUserDetail(selectedUser.user_id);
      if (historyDetailItem && historyDetailItem.id === id) {
        setHistoryDetailItem(null);
        fetchUserDetail(selectedUser.user_id);
      }
    } catch (err) {
      Swal.fire("Error", "เกิดข้อผิดพลาด", "error");
    }
  };

  const handleNextQuota = () =>
    setQuotaIndex((prev) => (prev + 1) % userDetail.quota.length);
  const handlePrevQuota = () =>
    setQuotaIndex(
      (prev) => (prev - 1 + userDetail.quota.length) % userDetail.quota.length
    );

  // Helpers...
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        })
      : "-";
  const getStatusBadge = (status) => {
    /* ...Same... */
    const map = {
      pending: {
        class: "bg-warning-subtle text-warning-emphasis border-warning-subtle",
        label: "รออนุมัติ",
        icon: "hourglass_top",
      },
      approved: {
        class: "bg-success-subtle text-success-emphasis border-success-subtle",
        label: "อนุมัติ",
        icon: "check_circle",
      },
      rejected: {
        class: "bg-danger-subtle text-danger-emphasis border-danger-subtle",
        label: "ไม่อนุมัติ",
        icon: "cancel",
      },
      cancelled: {
        class:
          "bg-secondary-subtle text-secondary-emphasis border-secondary-subtle",
        label: "ยกเลิก",
        icon: "block",
      },
    };
    const s = map[status] || map.pending;
    return (
      <span
        className={`badge rounded-pill ${s.class} border d-inline-flex align-items-center gap-1 shadow-sm`}
      >
        <span className="material-symbols-rounded fs-6">{s.icon}</span>{" "}
        {s.label}
      </span>
    );
  };
  const getLeaveTypeStyle = (name) => {
    /* ...Same... */
    if (name.includes("ป่วย"))
      return {
        color: "text-danger",
        icon: "medical_services",
        bg: "bg-danger-subtle",
      };
    if (name.includes("กิจ"))
      return {
        color: "text-warning",
        icon: "business_center",
        bg: "bg-warning-subtle",
      };
    if (name.includes("พักร้อน"))
      return {
        color: "text-primary",
        icon: "beach_access",
        bg: "bg-primary-subtle",
      };
    return { color: "text-info", icon: "event_note", bg: "bg-info-subtle" };
  };

  // Helper for Chart Gradients (Defines Stop Colors)
  const getChartGradient = (name) => {
    if (name.includes("ป่วย"))
      return { id: "gradSick", start: "#fca5a5", end: "#ef4444" }; // Red
    if (name.includes("กิจ"))
      return { id: "gradBusiness", start: "#fdba74", end: "#f97316" }; // Orange
    if (name.includes("พักร้อน"))
      return { id: "gradVacation", start: "#93c5fd", end: "#3b82f6" }; // Blue
    return { id: "gradOther", start: "#67e8f9", end: "#06b6d4" }; // Cyan
  };

  // Options...
  const monthOptions = [
    { value: "", label: "ทุกเดือน" },
    { value: "1", label: "ม.ค." },
    { value: "2", label: "ก.พ." },
    { value: "3", label: "มี.ค." },
    { value: "4", label: "เม.ย." },
    { value: "5", label: "พ.ค." },
    { value: "6", label: "มิ.ย." },
    { value: "7", label: "ก.ค." },
    { value: "8", label: "ส.ค." },
    { value: "9", label: "ก.ย." },
    { value: "10", label: "ต.ค." },
    { value: "11", label: "พ.ย." },
    { value: "12", label: "ธ.ค." },
  ];
  const yearOptions = [
    { value: "", label: "ทุกปี" },
    {
      value: new Date().getFullYear(),
      label: `${new Date().getFullYear() + 543}`,
    },
    {
      value: new Date().getFullYear() - 1,
      label: `${new Date().getFullYear() + 543 - 1}`,
    },
  ];
  const typeOptions = [
    { value: "", label: "ทุกประเภท" },
    ...leaveTypes.map((t) => ({ value: t.id, label: t.name })),
  ];

  return (
    <div className="manage-leaves-container p-3 fade-in">
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h3 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <span className="material-symbols-rounded text-primary fs-1">
              admin_panel_settings
            </span>
            จัดการวันลาพนักงาน
          </h3>
          <p className="text-muted m-0 ms-1 small">
            Admin Dashboard & Leave Management
          </p>
        </div>
        <button
          className="btn-create-glow"
          onClick={() => setShowCreateModal(true)}
        >
          <span className="material-symbols-rounded">add_circle</span>{" "}
          สร้างใบลาใหม่
        </button>
      </div>

      <div className="dashboard-grid">
        {/* LEFT: REQUESTS (Same) */}
        <div className="dashboard-card">
          <div className="card-header-sticky">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold m-0 d-flex align-items-center gap-2 text-dark">
                <span className="material-symbols-rounded text-warning">
                  notifications_active
                </span>{" "}
                คำขอลาล่าสุด
              </h6>
              <span className="badge bg-light text-dark border">
                {filteredRequests.length} รายการ
              </span>
            </div>
            <div className="tabs-fade-container mb-3">
              <div className="req-tabs-wrapper" ref={tabsContainerRef}>
                {["pending", "approved", "rejected", "all"].map((t) => (
                  <button
                    key={t}
                    data-status={t}
                    className={`req-tab-btn ${
                      reqStatusFilter === t ? `active ${t}` : ""
                    }`}
                    onClick={() => setReqStatusFilter(t)}
                  >
                    {t === "all"
                      ? "ทั้งหมด"
                      : t === "pending"
                      ? "รออนุมัติ"
                      : t === "approved"
                      ? "อนุมัติ"
                      : "ปฏิเสธ"}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-grid mb-2">
              <div style={{ flex: 1 }}>
                <ModernDropdown
                  options={monthOptions}
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  placeholder="เดือน"
                />
              </div>
              <div style={{ width: "80px" }}>
                <ModernDropdown
                  options={yearOptions}
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  placeholder="ปี"
                />
              </div>
              <div style={{ flex: 1.2 }}>
                <ModernDropdown
                  options={typeOptions}
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  placeholder="ประเภท"
                />
              </div>
            </div>
            <div className="position-relative">
              <span className="search-icon-absolute material-symbols-rounded">
                search
              </span>
              <input
                type="text"
                className="search-input-modern"
                placeholder="ค้นหาชื่อ..."
                value={reqSearch}
                onChange={(e) => setReqSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="scrollable-content">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => {
                const typeStyle = getLeaveTypeStyle(req.leave_type_name);
                return (
                  <div
                    key={req.id}
                    className={`req-item ${req.status}`}
                    onClick={() => {
                      setSelectedRequest(req);
                      setShowRequestModal(true);
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex gap-3 align-items-center">
                        <img
                          src={
                            req.profile_image
                              ? `${apiUrl}/uploads/profile/${req.profile_image}`
                              : `https://ui-avatars.com/api/?name=${req.name_th}`
                          }
                          className="rounded-circle border shadow-sm"
                          width="42"
                          height="42"
                        />
                        <div className="lh-1">
                          <span
                            className="fw-bold d-block text-dark"
                            style={{ fontSize: "0.95rem" }}
                          >
                            {req.name_th}
                          </span>
                          <small
                            className="text-muted"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {req.department}
                          </small>
                        </div>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="d-flex justify-content-between align-items-center bg-white p-2 rounded border border-light-subtle mt-2 shadow-sm">
                      <div
                        className={`d-flex align-items-center gap-2 ${typeStyle.color}`}
                      >
                        <div
                          className={`p-1 rounded ${typeStyle.bg} d-flex align-items-center justify-content-center`}
                        >
                          <span className="material-symbols-rounded fs-6">
                            {typeStyle.icon}
                          </span>
                        </div>
                        <span className="fw-bold small">
                          {req.leave_type_name}
                        </span>
                      </div>
                      <span className="badge bg-light text-dark border">
                        {req.total_days} วัน
                      </span>
                    </div>
                    <small
                      className="text-muted mt-2 d-flex align-items-center justify-content-end gap-1"
                      style={{ fontSize: "0.75rem" }}
                    >
                      <span className="material-symbols-rounded fs-6">
                        calendar_month
                      </span>{" "}
                      {formatDate(req.start_date)} - {formatDate(req.end_date)}
                    </small>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-5 text-muted opacity-50">
                <span className="material-symbols-rounded fs-1 d-block mb-2">
                  inbox
                </span>{" "}
                ไม่มีรายการ
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: EMPLOYEES (Grid Improved) */}
        <div className="dashboard-card">
          <div className="card-header-sticky d-flex justify-content-between align-items-center">
            <h6 className="fw-bold m-0 d-flex align-items-center gap-2 text-dark">
              <span className="material-symbols-rounded text-info">groups</span>{" "}
              รายชื่อพนักงาน ({filteredEmployees.length})
            </h6>
            <div className="position-relative" style={{ width: "250px" }}>
              <span className="search-icon-absolute material-symbols-rounded">
                search
              </span>
              <input
                type="text"
                className="search-input-modern"
                placeholder="ชื่อ, รหัส..."
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="scrollable-content">
            <div className="emp-grid-wrapper-premium">
              {currentEmployees.map((emp) => (
                <div
                  key={emp.user_id}
                  className="emp-card-premium"
                  onClick={() => handleOpenUser(emp)}
                >
                  <div className="emp-card-header">
                    <div className="emp-avatar-wrapper">
                      <img
                        src={
                          emp.profile_image
                            ? `${apiUrl}/uploads/profile/${emp.profile_image}`
                            : `https://ui-avatars.com/api/?name=${emp.name_th}`
                        }
                        className="emp-avatar-img"
                      />
                      <span
                        className={`emp-online-dot ${
                          emp.total_leaves > 0 ? "active" : ""
                        }`}
                      ></span>
                    </div>
                  </div>
                  <div className="emp-card-body">
                    <h6 className="emp-name text-truncate">
                      {emp.name_th} {emp.lastname_th}
                    </h6>
                    <div className="emp-badges">
                      <span className="badge-code">{emp.emp_code}</span>
                      <span className="badge-pos text-truncate">
                        {emp.position}
                      </span>
                    </div>
                    <div
                      className={`emp-status-pill ${
                        emp.total_leaves > 0 ? "has-leaves" : "no-leaves"
                      }`}
                    >
                      {emp.total_leaves > 0 ? (
                        <>
                          <span className="material-symbols-rounded">
                            folder_open
                          </span>{" "}
                          {emp.total_leaves} ใบลา
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-rounded">
                            check_circle
                          </span>{" "}
                          ไม่มีประวัติ
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredEmployees.length === 0 && (
              <div className="text-center py-5 text-muted">ไม่พบข้อมูล</div>
            )}
          </div>
          <div className="pagination-toolbar-end">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      <AdminLeaveModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          fetchRequests();
          fetchEmployees();
        }}
        type="create"
      />
      <AdminLeaveModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          fetchRequests();
          fetchEmployees();
        }}
        type="edit"
        leaveData={selectedRequest}
      />

      {/* EMPLOYEE DETAIL MODAL (PREMIUM CHART) */}
      <ModernModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="ข้อมูลพนักงาน"
        icon="person"
        maxWidth="750px"
      >
        <div className="p-0 modal-view-container">
          <div
            className={`view-slide ${
              historyDetailItem ? "inactive-left" : "active"
            }`}
          >
            <div className="modal-tabs-modern mb-3">
              <button
                className={`modal-tab-modern ${
                  viewTab === "quota" ? "active" : ""
                }`}
                onClick={() => setViewTab("quota")}
              >
                โควต้าคงเหลือ
              </button>
              <button
                className={`modal-tab-modern ${
                  viewTab === "history" ? "active" : ""
                }`}
                onClick={() => setViewTab("history")}
              >
                ประวัติการลา
              </button>
            </div>

            {viewTab === "quota" && (
              <div className="quota-carousel-container fade-in">
                {userDetail.quota.length > 0 ? (
                  <>
                    {(() => {
                      const q = userDetail.quota[quotaIndex];
                      const percent =
                        q.max_per_year > 0
                          ? ((q.max_per_year - q.remaining) / q.max_per_year) *
                            100
                          : 0;
                      const gradientInfo = getChartGradient(q.name);
                      const radius = 80;
                      const circumference = 2 * Math.PI * radius;
                      const offset =
                        circumference - (percent / 100) * circumference;

                      return (
                        <div className="carousel-wrapper" key={q.id}>
                          <div className="carousel-nav">
                            <button
                              className="btn-nav-carousel"
                              onClick={handlePrevQuota}
                            >
                              <span className="material-symbols-rounded">
                                chevron_left
                              </span>
                            </button>
                            <h5 className="carousel-title text-truncate">
                              {q.name}
                            </h5>
                            <button
                              className="btn-nav-carousel"
                              onClick={handleNextQuota}
                            >
                              <span className="material-symbols-rounded">
                                chevron_right
                              </span>
                            </button>
                          </div>

                          <div className="chart-wrapper-premium">
                            <div className="circular-chart-premium">
                              <svg
                                width="220"
                                height="220"
                                viewBox="0 0 220 220"
                              >
                                <defs>
                                  <linearGradient
                                    id={gradientInfo.id}
                                    x1="0%"
                                    y1="0%"
                                    x2="100%"
                                    y2="100%"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor={gradientInfo.start}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor={gradientInfo.end}
                                    />
                                  </linearGradient>
                                  <filter
                                    id="glow"
                                    x="-20%"
                                    y="-20%"
                                    width="140%"
                                    height="140%"
                                  >
                                    <feGaussianBlur
                                      stdDeviation="3"
                                      result="coloredBlur"
                                    />
                                    <feMerge>
                                      <feMergeNode in="coloredBlur" />
                                      <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                  </filter>
                                </defs>
                                {/* Track */}
                                <circle
                                  cx="110"
                                  cy="110"
                                  r={radius}
                                  fill="none"
                                  stroke="#f1f5f9"
                                  strokeWidth="12"
                                  strokeLinecap="round"
                                />
                                {/* Progress */}
                                <circle
                                  cx="110"
                                  cy="110"
                                  r={radius}
                                  fill="none"
                                  stroke={`url(#${gradientInfo.id})`}
                                  strokeWidth="12"
                                  strokeDasharray={circumference}
                                  strokeDashoffset={offset}
                                  strokeLinecap="round"
                                  transform="rotate(-90 110 110)"
                                  filter="url(#glow)"
                                  style={{
                                    transition: "stroke-dashoffset 1s ease-out",
                                  }}
                                />
                              </svg>
                              <div className="circle-inner-premium">
                                <span
                                  className="circle-value-premium"
                                  style={{
                                    backgroundImage: `linear-gradient(to right, ${gradientInfo.start}, ${gradientInfo.end})`,
                                  }}
                                >
                                  {q.remaining}
                                </span>
                                <span className="circle-unit-premium">
                                  วันคงเหลือ
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="carousel-footer mt-4">
                            <div className="stat-box">
                              <span className="stat-label">ใช้ไปแล้ว</span>
                              <span className="stat-val text-danger">
                                {q.used}
                              </span>
                            </div>
                            <div className="divider"></div>
                            <div className="stat-box">
                              <span className="stat-label">สิทธิ์ทั้งหมด</span>
                              <span className="stat-val text-dark">
                                {q.max_per_year}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <div className="text-center py-5 text-muted">
                    ไม่พบข้อมูลโควต้า
                  </div>
                )}
              </div>
            )}

            {viewTab === "history" && (
              <div className="d-flex flex-column gap-2">
                {userDetail.history.length > 0 ? (
                  userDetail.history.map((h) => {
                    const typeStyle = getLeaveTypeStyle(h.leave_type_name);
                    return (
                      <div
                        key={h.id}
                        className="history-row-item"
                        onClick={() => setHistoryDetailItem(h)}
                      >
                        <div>
                          <span
                            className={`fw-bold d-flex align-items-center gap-2 ${typeStyle.color}`}
                          >
                            <span className="material-symbols-rounded">
                              {typeStyle.icon}
                            </span>
                            {h.leave_type_name}
                            {h.medical_certificate_url && (
                              <span
                                className="material-symbols-rounded text-muted"
                                style={{ fontSize: "16px" }}
                                title="มีไฟล์แนบ"
                              >
                                attachment
                              </span>
                            )}
                          </span>
                          <small className="text-muted ms-4">
                            {formatDate(h.start_date)} -{" "}
                            {formatDate(h.end_date)}
                          </small>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          {getStatusBadge(h.status)}
                          <span className="material-symbols-rounded text-muted">
                            chevron_right
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-5 text-muted">
                    ไม่มีประวัติการลา
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Detail Slide (Same) */}
          <div
            className={`view-slide ${
              historyDetailItem ? "active" : "inactive-right"
            }`}
          >
            {historyDetailItem && (
              <>
                <div className="detail-view-header">
                  <button
                    className="btn-back-modal"
                    onClick={() => setHistoryDetailItem(null)}
                  >
                    <span className="material-symbols-rounded">arrow_back</span>
                  </button>
                  <h5 className="m-0 fw-bold">รายละเอียดใบลา</h5>
                </div>
                <div className="bg-white p-3 rounded-3 border mb-3 shadow-sm">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">ประเภท</span>
                    <span className="fw-bold text-primary">
                      {historyDetailItem.leave_type_name}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">วันที่</span>
                    <span className="fw-bold">
                      {formatDate(historyDetailItem.start_date)} -{" "}
                      {formatDate(historyDetailItem.end_date)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">จำนวนวัน</span>
                    <span className="fw-bold">
                      {historyDetailItem.total_days} วัน
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted small">สถานะ</span>
                    {getStatusBadge(historyDetailItem.status)}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="fw-bold small text-muted">เหตุผล</label>
                  <div className="p-3 bg-light rounded border text-dark fst-italic">
                    "{historyDetailItem.reason || "-"}"
                  </div>
                </div>
                {historyDetailItem.medical_certificate_url && (
                  <a
                    href={`${apiUrl}/uploads/leaves/${historyDetailItem.medical_certificate_url}`}
                    target="_blank"
                    className="btn btn-outline-primary w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
                  >
                    <span className="material-symbols-rounded">visibility</span>{" "}
                    ดูไฟล์แนบ
                  </a>
                )}
                {historyDetailItem.status === "pending" && (
                  <div className="d-flex gap-2 pt-2 border-top mt-3">
                    <button
                      className="btn btn-danger flex-grow-1"
                      onClick={() =>
                        updateStatus(historyDetailItem.id, "rejected")
                      }
                    >
                      ไม่อนุมัติ
                    </button>
                    <button
                      className="btn btn-success flex-grow-1"
                      onClick={() =>
                        updateStatus(historyDetailItem.id, "approved")
                      }
                    >
                      อนุมัติ
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </ModernModal>

      {/* Request Modal (Same) */}
      <ModernModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="รายละเอียดคำขอ"
        icon="assignment"
        maxWidth="500px"
      >
        {selectedRequest && (
          <div className="p-4">
            <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded-3 border">
              <img
                src={
                  selectedRequest.profile_image
                    ? `${apiUrl}/uploads/profile/${selectedRequest.profile_image}`
                    : `https://ui-avatars.com/api/?name=${selectedRequest.name_th}`
                }
                className="rounded-circle border shadow-sm"
                width="50"
                height="50"
              />
              <div>
                <h5 className="m-0 fw-bold">{selectedRequest.name_th}</h5>
                <small className="text-muted">{selectedRequest.position}</small>
              </div>
            </div>
            <div className="bg-white p-3 rounded mb-3 border shadow-sm">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">ประเภท</span>
                <span className="fw-bold text-primary">
                  {selectedRequest.leave_type_name}
                </span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">วันที่</span>
                <span className="fw-bold">
                  {formatDate(selectedRequest.start_date)} -{" "}
                  {formatDate(selectedRequest.end_date)}
                </span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted small">จำนวนวัน</span>
                <span className="fw-bold">
                  {selectedRequest.total_days} วัน
                </span>
              </div>
            </div>
            <div className="mb-3">
              <label className="small text-muted fw-bold">เหตุผล</label>
              <p className="m-0 fst-italic p-3 bg-light rounded border">
                "{selectedRequest.reason}"
              </p>
            </div>
            {selectedRequest.medical_certificate_url && (
              <a
                href={`${apiUrl}/uploads/leaves/${selectedRequest.medical_certificate_url}`}
                target="_blank"
                className="btn btn-sm btn-outline-primary w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
              >
                <span className="material-symbols-rounded">visibility</span>{" "}
                ดูไฟล์แนบ
              </a>
            )}
            {selectedRequest.status === "pending" ? (
              <div className="d-flex gap-2">
                <button
                  className="btn btn-danger flex-grow-1"
                  onClick={() => updateStatus(selectedRequest.id, "rejected")}
                >
                  ไม่อนุมัติ
                </button>
                <button
                  className="btn btn-success flex-grow-1"
                  onClick={() => updateStatus(selectedRequest.id, "approved")}
                >
                  อนุมัติ
                </button>
              </div>
            ) : (
              <div className="pt-3 border-top mt-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted small">สถานะปัจจุบัน:</span>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <button
                  className="btn btn-primary w-100 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                  onClick={handleEditRequest}
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                    border: "none",
                  }}
                >
                  <span className="material-symbols-rounded">edit_square</span>{" "}
                  แก้ไขข้อมูลใบลา
                </button>
              </div>
            )}
          </div>
        )}
      </ModernModal>
    </div>
  );
}

export default ManageLeaves;
