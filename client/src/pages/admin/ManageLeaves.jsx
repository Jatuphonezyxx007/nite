import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./ManageLeaves.css";
// Components
import ModernModal from "../../components/Modal";

function ManageLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    filterData();
  }, [leaves, filterStatus]);

  const fetchLeaves = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/leaves/all`, config);
      setLeaves(res.data);
    } catch (error) {
      console.error("Error fetching leaves:", error);
    }
  };

  const filterData = () => {
    if (filterStatus === "all") {
      setFilteredLeaves(leaves);
    } else {
      setFilteredLeaves(leaves.filter((l) => l.status === filterStatus));
    }
  };

  // --- Handlers ---
  const handleViewDetail = (leave) => {
    setSelectedLeave(leave);
    setShowModal(true);
  };

  const handleUpdateStatus = async (status, adminComment = "") => {
    if (!selectedLeave) return;
    setIsLoading(true);
    try {
      await axios.put(
        `${apiUrl}/api/leaves/${selectedLeave.id}/status`,
        { status, comment: adminComment },
        config
      );
      Swal.fire({
        icon: "success",
        title: status === "approved" ? "อนุมัติแล้ว" : "ปฏิเสธคำขอแล้ว",
        timer: 1500,
        showConfirmButton: false,
      });
      setShowModal(false);
      fetchLeaves();
    } catch (error) {
      Swal.fire("Error", "เกิดข้อผิดพลาด", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmAction = (status) => {
    const isApprove = status === "approved";
    Swal.fire({
      title: isApprove ? "อนุมัติการลา?" : "ไม่อนุมัติ?",
      text: isApprove
        ? "ระบบจะตัดวันลาคงเหลือของพนักงาน"
        : "กรุณาระบุเหตุผล (ถ้ามี)",
      input: isApprove ? undefined : "text",
      inputPlaceholder: "ระบุเหตุผล...",
      icon: isApprove ? "question" : "warning",
      showCancelButton: true,
      confirmButtonColor: isApprove ? "#10b981" : "#ef4444",
      confirmButtonText: isApprove ? "ยืนยันอนุมัติ" : "ยืนยันปฏิเสธ",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        handleUpdateStatus(status, result.value || "");
      }
    });
  };

  // --- Helpers ---
  const formatThaiDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return d.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getLeaveBadge = (leave) => {
    const typeKey = leave.leave_type || "other";
    const typeName = leave.leave_type_name || "อื่นๆ";
    let badgeClass = "badge-other";
    let icon = "pending";

    if (typeKey === "sick") {
      badgeClass = "badge-sick";
      icon = "sick";
    } else if (typeKey === "business") {
      badgeClass = "badge-business";
      icon = "business_center";
    } else if (typeKey === "vacation") {
      badgeClass = "badge-vacation";
      icon = "beach_access";
    }

    return (
      <span className={`leave-type-badge ${badgeClass}`}>
        <span className="material-symbols-rounded fs-6">{icon}</span>
        {typeName}
      </span>
    );
  };

  // Stats
  const pendingCount = leaves.filter((l) => l.status === "pending").length;
  const approvedCount = leaves.filter((l) => l.status === "approved").length;
  const todayLeaves = leaves.filter((l) => {
    const today = new Date().toISOString().split("T")[0];
    const start = l.start_date.split("T")[0];
    const end = l.end_date.split("T")[0];
    return today >= start && today <= end && l.status === "approved";
  }).length;

  return (
    <div className="manage-leaves-container p-4 fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <span className="material-symbols-rounded text-primary fs-2">
              fact_check
            </span>
            Leave Requests
          </h2>
          <p className="text-muted m-0 mt-1">จัดการคำขอลาและประวัติการลา</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card" style={{ color: "#f97316" }}>
          <div className="stat-icon pending">
            <span className="material-symbols-rounded">hourglass_top</span>
          </div>
          <div className="stat-info">
            <h3>{pendingCount}</h3>
            <p>รอตรวจสอบ</p>
          </div>
        </div>
        <div className="stat-card" style={{ color: "#16a34a" }}>
          <div className="stat-icon approved">
            <span className="material-symbols-rounded">check_circle</span>
          </div>
          <div className="stat-info">
            <h3>{approvedCount}</h3>
            <p>อนุมัติแล้ว</p>
          </div>
        </div>
        <div className="stat-card" style={{ color: "#3b82f6" }}>
          <div className="stat-icon total">
            <span className="material-symbols-rounded">event_busy</span>
          </div>
          <div className="stat-info">
            <h3>{todayLeaves}</h3>
            <p>ลาวันนี้</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-container">
        {["pending", "approved", "rejected", "all"].map((status) => (
          <button
            key={status}
            className={`filter-btn ${filterStatus === status ? "active" : ""}`}
            onClick={() => setFilterStatus(status)}
          >
            {status === "pending" && "⏳ รออนุมัติ"}
            {status === "approved" && "✅ อนุมัติแล้ว"}
            {status === "rejected" && "❌ ปฏิเสธ"}
            {status === "all" && "รายการทั้งหมด"}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="leaves-list">
        {filteredLeaves.length > 0 ? (
          filteredLeaves.map((leave) => (
            <div key={leave.id} className="leave-card">
              {/* Left: User */}
              <div className="user-profile-section">
                <img
                  src={
                    leave.profile_image
                      ? `${apiUrl}/uploads/profile/${leave.profile_image}`
                      : `https://ui-avatars.com/api/?name=${leave.name_th}`
                  }
                  alt="Profile"
                />
                <div className="user-text">
                  <h6>
                    {leave.name_th} {leave.lastname_th}
                  </h6>
                  <small>
                    {leave.position}{" "}
                    {leave.nickname_th ? `(${leave.nickname_th})` : ""}
                  </small>
                </div>
              </div>

              {/* Middle: Info */}
              <div className="leave-info-section">
                <div className="info-group">
                  <label>ประเภท</label>
                  {getLeaveBadge(leave)}
                </div>
                <div className="info-group">
                  <label>วันที่ลา</label>
                  <span>
                    {formatThaiDate(leave.start_date)} -{" "}
                    {formatThaiDate(leave.end_date)}
                  </span>
                </div>
                <div className="info-group">
                  <label>จำนวน</label>
                  <span>{Number(leave.total_days)} วัน</span>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="actions-section d-flex align-items-center gap-3">
                {/* Status Badge */}
                {leave.status === "pending" ? (
                  <span className="status-indicator status-pending">
                    <span className="material-symbols-rounded fs-6">
                      hourglass_empty
                    </span>{" "}
                    รอตรวจสอบ
                  </span>
                ) : leave.status === "approved" ? (
                  <span className="status-indicator status-approved">
                    <span className="material-symbols-rounded fs-6">
                      check_circle
                    </span>{" "}
                    อนุมัติ
                  </span>
                ) : (
                  <span className="status-indicator status-rejected">
                    <span className="material-symbols-rounded fs-6">
                      cancel
                    </span>{" "}
                    ไม่ผ่าน
                  </span>
                )}

                {/* View Button */}
                <button
                  className="btn-view"
                  onClick={() => handleViewDetail(leave)}
                  title="ดูรายละเอียด"
                >
                  <span className="material-symbols-rounded">visibility</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-5">
            <div className="d-inline-flex align-items-center justify-content-center bg-white p-4 rounded-circle shadow-sm mb-3">
              <span className="material-symbols-rounded fs-1 text-muted opacity-50">
                inbox
              </span>
            </div>
            <h6 className="text-muted">ไม่พบข้อมูลใบลา</h6>
          </div>
        )}
      </div>

      {/* --- Detail Modal --- */}
      <ModernModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="รายละเอียดการลา"
        icon="assignment"
        maxWidth="600px"
      >
        {selectedLeave && (
          <div className="p-4">
            {/* Header */}
            <div className="d-flex align-items-center gap-3 mb-4 pb-4 border-bottom">
              <img
                src={
                  selectedLeave.profile_image
                    ? `${apiUrl}/uploads/profile/${selectedLeave.profile_image}`
                    : `https://ui-avatars.com/api/?name=${selectedLeave.name_th}`
                }
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "20px",
                  objectFit: "cover",
                }}
              />
              <div>
                <h5 className="fw-bold m-0">
                  {selectedLeave.name_th} {selectedLeave.lastname_th}
                </h5>
                <p className="text-muted m-0 small">
                  {selectedLeave.position} • {selectedLeave.department}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="leave-detail-grid">
              <div className="detail-item">
                <span className="detail-label">ประเภทการลา</span>
                <span className="detail-value">
                  {getLeaveBadge(selectedLeave)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">ช่วงวันที่</span>
                <span className="detail-value text-end">
                  {formatThaiDate(selectedLeave.start_date)} -{" "}
                  {formatThaiDate(selectedLeave.end_date)}
                  <div className="small text-muted fw-normal">
                    รวม {Number(selectedLeave.total_days)} วัน
                  </div>
                </span>
              </div>
            </div>

            {/* Reason */}
            <div className="mt-4">
              <span className="detail-label d-block mb-2">เหตุผลการลา</span>
              <div className="reason-container">
                <p className="reason-text m-0">
                  "{selectedLeave.reason || "-"}"
                </p>
              </div>
            </div>

            {/* Attachment */}
            {selectedLeave.attachment && (
              <div className="mt-3">
                <a
                  href={`${apiUrl}/uploads/leaves/${selectedLeave.attachment}`}
                  target="_blank"
                  className="attachment-btn"
                >
                  <span className="material-symbols-rounded fs-5">
                    attach_file
                  </span>
                  <span>ดูเอกสารแนบ / ใบรับรองแพทย์</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="modern-modal-footer">
          <div className="d-flex justify-content-end gap-2 w-100">
            <button className="btn-cancel" onClick={() => setShowModal(false)}>
              ปิดหน้าต่าง
            </button>

            {selectedLeave?.status === "pending" && (
              <>
                <button
                  className="btn-cancel text-danger border-danger-subtle bg-danger-subtle"
                  onClick={() => confirmAction("rejected")}
                >
                  ไม่อนุมัติ
                </button>
                <button
                  className="btn-save"
                  onClick={() => confirmAction("approved")}
                >
                  อนุมัติการลา
                </button>
              </>
            )}
          </div>
        </div>
      </ModernModal>
    </div>
  );
}

export default ManageLeaves;
