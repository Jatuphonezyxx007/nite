import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./ManageLeaves.css";

// Components
import ModernModal from "../../components/Modal";
import AdminLeaveModal from "../../components/AdminLeaveModal";
import Pagination from "../../components/Pagination/Pagination";

function ManageLeaves() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // --- DATA STATES ---
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  // --- FILTERS & PAGINATION ---
  const [reqStatusFilter, setReqStatusFilter] = useState("pending");
  const [reqSearch, setReqSearch] = useState("");
  const [empSearch, setEmpSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // --- MODALS ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // NEW
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Data Holders
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState({ quota: [], history: [] });
  const [viewTab, setViewTab] = useState("quota");
  const [historyDetailItem, setHistoryDetailItem] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const tabsContainerRef = useRef(null);

  useEffect(() => {
    fetchRequests();
    fetchEmployees();
  }, []);

  // Filter & Pagination Logic... (เหมือนเดิม)
  useEffect(() => {
    let res = requests;
    if (reqStatusFilter !== "all")
      res = res.filter((r) => r.status === reqStatusFilter);
    if (reqSearch)
      res = res.filter((r) =>
        r.name_th.toLowerCase().includes(reqSearch.toLowerCase())
      );
    setFilteredRequests(res);
    handleTabScroll(reqStatusFilter);
  }, [requests, reqStatusFilter, reqSearch]);

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

  // API Calls... (เหมือนเดิม)
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

  // Handlers
  const handleOpenUser = (emp) => {
    setSelectedUser(emp);
    fetchUserDetail(emp.user_id);
    setViewTab(emp.total_leaves > 0 ? "history" : "quota");
    setHistoryDetailItem(null);
    setShowViewModal(true);
  };

  const handleEditRequest = () => {
    // เปิด Modal Edit โดยส่งข้อมูล selectedRequest ไป
    setShowRequestModal(false); // ปิดหน้ารายละเอียดก่อน
    setShowEditModal(true);
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${apiUrl}/api/leaves/${id}/status`, { status }, config);
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
    } catch (err) {
      Swal.fire("Error", "เกิดข้อผิดพลาด", "error");
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        })
      : "-";

  const getStatusBadge = (status) => {
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
    };
    const s = map[status] || map.pending;
    return (
      <span
        className={`badge rounded-pill ${s.class} border d-inline-flex align-items-center gap-1`}
      >
        <span className="material-symbols-rounded fs-6">{s.icon}</span>{" "}
        {s.label}
      </span>
    );
  };

  const getQuotaStyle = (name) => {
    if (name.includes("ป่วย")) return { class: "quota-sick", icon: "sick" };
    if (name.includes("กิจ"))
      return { class: "quota-business", icon: "business_center" };
    if (name.includes("พักร้อน"))
      return { class: "quota-vacation", icon: "beach_access" };
    return { class: "quota-other", icon: "event_note" };
  };

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
        <div className="dashboard-card">
          <div className="card-header-sticky">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
              <span className="material-symbols-rounded text-warning">
                notifications_active
              </span>
              คำขอลาล่าสุด
            </h6>
            <div className="tabs-fade-container">
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
                    <span className="req-count">
                      {
                        requests.filter((r) =>
                          t === "all" ? true : r.status === t
                        ).length
                      }
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="position-relative mt-3">
              <span className="search-icon-absolute material-symbols-rounded">
                search
              </span>
              <input
                type="text"
                className="search-input-modern"
                placeholder="ค้นหาใบลา..."
                value={reqSearch}
                onChange={(e) => setReqSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="scrollable-content">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className={`req-item ${req.status}`}
                  onClick={() => {
                    setSelectedRequest(req);
                    setShowRequestModal(true);
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex gap-2 align-items-center">
                      <img
                        src={
                          req.profile_image
                            ? `${apiUrl}/uploads/profile/${req.profile_image}`
                            : `https://ui-avatars.com/api/?name=${req.name_th}`
                        }
                        className="rounded-circle border"
                        width="36"
                        height="36"
                      />
                      <div className="lh-1">
                        <span
                          className="fw-bold d-block text-dark"
                          style={{ fontSize: "0.9rem" }}
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
                  <div className="d-flex justify-content-between align-items-center bg-light p-2 rounded border border-light-subtle">
                    <span className="text-primary fw-bold small">
                      {req.leave_type_name}
                    </span>
                    <span className="text-dark fw-bold small">
                      {req.total_days} วัน
                    </span>
                  </div>
                  <small
                    className="text-muted mt-1 d-block text-end"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {formatDate(req.start_date)} - {formatDate(req.end_date)}
                  </small>
                </div>
              ))
            ) : (
              <div className="text-center py-5 text-muted opacity-50">
                <span className="material-symbols-rounded fs-1 d-block mb-2">
                  inbox
                </span>
                ไม่มีรายการ
              </div>
            )}
          </div>
        </div>

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
            <div className="emp-grid-wrapper">
              {currentEmployees.map((emp) => (
                <div
                  key={emp.user_id}
                  className="emp-card-modern"
                  onClick={() => handleOpenUser(emp)}
                >
                  <div className="emp-avatar-box">
                    <img
                      src={
                        emp.profile_image
                          ? `${apiUrl}/uploads/profile/${emp.profile_image}`
                          : `https://ui-avatars.com/api/?name=${emp.name_th}`
                      }
                      className="emp-avatar-img"
                    />
                    <span
                      className={`emp-status-dot ${
                        emp.total_leaves > 0 ? "active" : ""
                      }`}
                    ></span>
                  </div>
                  <div className="w-100 mt-2 d-flex flex-column align-items-center">
                    <h6 className="text-truncate m-0 fw-bold">
                      {emp.name_th} {emp.lastname_th}
                    </h6>
                    <span className="badge-code my-1">{emp.emp_code}</span>
                    <span className="badge-position text-truncate">
                      {emp.position}
                    </span>
                  </div>
                  <div
                    className={`emp-pill mt-3 ${
                      emp.total_leaves > 0 ? "has-data" : "no-data"
                    }`}
                  >
                    {emp.total_leaves > 0 ? (
                      <>
                        <span
                          className="material-symbols-rounded"
                          style={{ fontSize: "16px" }}
                        >
                          folder_open
                        </span>
                        <span>ลาแล้ว {emp.total_leaves} ใบ</span>
                      </>
                    ) : (
                      <>
                        <span
                          className="material-symbols-rounded"
                          style={{ fontSize: "16px" }}
                        >
                          check_circle
                        </span>
                        <span>ยังไม่มีการลา</span>
                      </>
                    )}
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

      {/* 1. Create Modal */}
      <AdminLeaveModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          fetchRequests();
          fetchEmployees();
        }}
        type="create"
      />

      {/* 2. Edit Modal (New) */}
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

      {/* 3. Employee View Modal */}
      <ModernModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="ข้อมูลพนักงาน"
        icon="person"
        maxWidth="700px"
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
              <div
                className="d-grid gap-3"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                {userDetail.quota.map((q) => {
                  const style = getQuotaStyle(q.name);
                  const percent =
                    ((q.max_per_year - q.remaining) / q.max_per_year) * 100;
                  return (
                    <div
                      key={q.id}
                      className={`quota-card-premium ${style.class}`}
                    >
                      <span className="material-symbols-rounded quota-icon-bg">
                        {style.icon}
                      </span>
                      <div className="quota-content">
                        <div className="quota-title">{q.name}</div>
                        <div className="d-flex align-items-end justify-content-between">
                          <div className="quota-remain">
                            {q.remaining}{" "}
                            <span
                              style={{ fontSize: "0.8rem", fontWeight: 400 }}
                            >
                              วัน
                            </span>
                          </div>
                          <div className="quota-sub">จาก {q.max_per_year}</div>
                        </div>
                        <div className="quota-progress-bg">
                          <div
                            className="quota-progress-fill"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {viewTab === "history" && (
              <div className="d-flex flex-column gap-2">
                {userDetail.history.length > 0 ? (
                  userDetail.history.map((h) => (
                    <div
                      key={h.id}
                      className="history-row-item"
                      onClick={() => setHistoryDetailItem(h)}
                    >
                      <div>
                        <span className="fw-bold text-primary d-block">
                          {h.leave_type_name}
                        </span>
                        <small className="text-muted">
                          {formatDate(h.start_date)} - {formatDate(h.end_date)}
                        </small>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {getStatusBadge(h.status)}
                        <span className="material-symbols-rounded text-muted">
                          chevron_right
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5 text-muted">
                    ไม่มีประวัติการลา
                  </div>
                )}
              </div>
            )}
          </div>
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
              </>
            )}
          </div>
        </div>
      </ModernModal>

      {/* 4. Request Detail Modal */}
      <ModernModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="รายละเอียดคำขอ"
        icon="assignment"
        maxWidth="500px"
      >
        {selectedRequest && (
          <div className="p-4">
            <div className="d-flex align-items-center gap-3 mb-4">
              <img
                src={
                  selectedRequest.profile_image
                    ? `${apiUrl}/uploads/profile/${selectedRequest.profile_image}`
                    : `https://ui-avatars.com/api/?name=${selectedRequest.name_th}`
                }
                className="rounded-circle border"
                width="50"
                height="50"
              />
              <div>
                <h5 className="m-0 fw-bold">{selectedRequest.name_th}</h5>
                <small className="text-muted">{selectedRequest.position}</small>
              </div>
            </div>
            <div className="bg-light p-3 rounded mb-3 border">
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted small">ประเภท</span>
                <span className="fw-bold text-primary">
                  {selectedRequest.leave_type_name}
                </span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted small">วันที่</span>
                <span className="fw-bold">
                  {formatDate(selectedRequest.start_date)} -{" "}
                  {formatDate(selectedRequest.end_date)} (
                  {selectedRequest.total_days} วัน)
                </span>
              </div>
            </div>
            <div className="mb-3">
              <label className="small text-muted fw-bold">เหตุผล</label>
              <p className="m-0 fst-italic">"{selectedRequest.reason}"</p>
            </div>
            {selectedRequest.medical_certificate_url && (
              <a
                href={`${apiUrl}/uploads/leaves/${selectedRequest.medical_certificate_url}`}
                target="_blank"
                className="btn btn-sm btn-outline-primary w-100 mb-3"
              >
                ดูไฟล์แนบ
              </a>
            )}

            {/* ACTIONS */}
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

                {/* BUTTON: EDIT */}
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
