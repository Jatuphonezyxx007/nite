import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./ManageLeaves.css";
// Components
import Modal from "../../components/Modal"; // เช็ค path ให้ตรงกับเครื่องคุณ

function ManageLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [filterStatus, setFilterStatus] = useState("pending"); // pending, approved, rejected, all
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // --- 1. Fetch Data ---
  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    filterData();
  }, [leaves, filterStatus]);

  const fetchLeaves = async () => {
    try {
      // เรียก API ดึงข้อมูลการลาทั้งหมด (Admin View)
      const res = await axios.get(`${apiUrl}/api/leaves/all`, config);
      setLeaves(res.data);
    } catch (error) {
      console.error("Error fetching leaves:", error);
      // Mock data ถ้ายังไม่มี API เพื่อดู UI
      // setLeaves(mockLeaves);
    }
  };

  const filterData = () => {
    if (filterStatus === "all") {
      setFilteredLeaves(leaves);
    } else {
      setFilteredLeaves(leaves.filter((l) => l.status === filterStatus));
    }
  };

  // --- 2. Action Handlers ---
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
        title: status === "approved" ? "อนุมัติเรียบร้อย" : "ปฏิเสธคำขอแล้ว",
        timer: 1500,
        showConfirmButton: false,
      });

      setShowModal(false);
      fetchLeaves(); // Refresh data
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "ทำรายการไม่สำเร็จ",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const confirmAction = (status) => {
    const isApprove = status === "approved";
    Swal.fire({
      title: isApprove ? "ยืนยันการอนุมัติ?" : "ยืนยันไม่อนุมัติ?",
      text: isApprove
        ? "พนักงานจะได้รับแจ้งเตือนการอนุมัติ"
        : "กรุณาระบุเหตุผล (ถ้ามี)",
      input: isApprove ? undefined : "text",
      inputPlaceholder: "เหตุผลการปฏิเสธ...",
      icon: isApprove ? "question" : "warning",
      showCancelButton: true,
      confirmButtonColor: isApprove ? "#16a34a" : "#dc2626",
      confirmButtonText: isApprove ? "อนุมัติเลย" : "ยืนยันปฏิเสธ",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        // ส่งค่า status และ comment (ถ้ามี)
        handleUpdateStatus(status, result.value || "");
      }
    });
  };

  // --- Helpers ---
  const getLeaveBadge = (type) => {
    switch (type) {
      case "sick":
        return <span className="leave-type-badge badge-sick">ลาป่วย</span>;
      case "business":
        return <span className="leave-type-badge badge-business">ลากิจ</span>;
      case "vacation":
        return <span className="leave-type-badge badge-vacation">พักร้อน</span>;
      default:
        return <span className="leave-type-badge badge-other">อื่นๆ</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const calculateDays = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e - s);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // --- Stats Calculation ---
  const pendingCount = leaves.filter((l) => l.status === "pending").length;
  const approvedCount = leaves.filter((l) => l.status === "approved").length;
  const todayLeaves = leaves.filter((l) => {
    const today = new Date().toISOString().split("T")[0];
    return (
      l.start_date <= today && l.end_date >= today && l.status === "approved"
    );
  }).length;

  return (
    <div className="manage-leaves-container p-4 fade-in">
      {/* Header */}
      <div className="page-header d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark m-0">
            Leave Management<span style={{ color: "#FFBD28" }}>.</span>
          </h2>
          <p className="text-muted m-0 mt-1">
            จัดการคำขอลาและประวัติการลาของพนักงาน
          </p>
        </div>
        <div className="d-flex gap-2">
          {/* อาจเพิ่มปุ่ม Export Report ตรงนี้ได้ */}
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon pending">
            <span className="material-symbols-rounded">hourglass_top</span>
          </div>
          <div className="stat-info">
            <h3>{pendingCount}</h3>
            <p>รออนุมัติ</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon approved">
            <span className="material-symbols-rounded">check_circle</span>
          </div>
          <div className="stat-info">
            <h3>{approvedCount}</h3>
            <p>อนุมัติเดือนนี้</p>
          </div>
        </div>
        <div className="stat-card">
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
      <div className="filter-bar">
        {["pending", "approved", "rejected", "all"].map((status) => (
          <button
            key={status}
            className={`filter-btn ${filterStatus === status ? "active" : ""}`}
            onClick={() => setFilterStatus(status)}
          >
            {status === "pending" && "⏳ รออนุมัติ"}
            {status === "approved" && "✅ อนุมัติแล้ว"}
            {status === "rejected" && "❌ ปฏิเสธ"}
            {status === "all" && "ทั้งหมด"}
          </button>
        ))}
      </div>

      {/* Leaves List */}
      <div className="leaves-list">
        {filteredLeaves.length > 0 ? (
          filteredLeaves.map((leave) => (
            <div
              key={leave.id}
              className="leave-card d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"
            >
              {/* Left: User Info */}
              <div
                className="d-flex align-items-center gap-3 user-profile-section"
                style={{ minWidth: "250px" }}
              >
                <img
                  src={
                    leave.profile_image
                      ? `${apiUrl}/uploads/profile/${leave.profile_image}`
                      : `https://ui-avatars.com/api/?name=${leave.name_th}`
                  }
                  alt="Profile"
                />
                <div>
                  <h6 className="fw-bold m-0 text-dark">
                    {leave.name_th} {leave.lastname_th}
                  </h6>
                  <small className="text-muted">
                    {leave.position || "พนักงาน"}
                  </small>
                </div>
              </div>

              {/* Middle: Leave Info */}
              <div className="flex-grow-1 d-flex flex-column flex-md-row gap-3 gap-md-5">
                <div>
                  <small className="text-muted d-block mb-1">ประเภทการลา</small>
                  {getLeaveBadge(leave.leave_type)}
                </div>
                <div>
                  <small className="text-muted d-block mb-1">
                    ช่วงวันที่ลา (
                    {calculateDays(leave.start_date, leave.end_date)} วัน)
                  </small>
                  <span className="fw-medium text-dark">
                    {formatDate(leave.start_date)} -{" "}
                    {formatDate(leave.end_date)}
                  </span>
                </div>
              </div>

              {/* Right: Status & Action */}
              <div
                className="d-flex align-items-center gap-3 justify-content-between justify-content-md-end"
                style={{ minWidth: "200px" }}
              >
                {leave.status === "pending" ? (
                  <span className="status-indicator status-pending">
                    <span className="material-symbols-rounded fs-6">
                      hourglass_empty
                    </span>{" "}
                    รอตรวจสอบ
                  </span>
                ) : leave.status === "approved" ? (
                  <span className="status-indicator status-approved">
                    <span className="material-symbols-rounded fs-6">check</span>{" "}
                    อนุมัติแล้ว
                  </span>
                ) : (
                  <span className="status-indicator status-rejected">
                    <span className="material-symbols-rounded fs-6">close</span>{" "}
                    ไม่ผ่าน
                  </span>
                )}

                <button
                  className="btn btn-light btn-sm rounded-circle p-2"
                  onClick={() => handleViewDetail(leave)}
                >
                  <span className="material-symbols-rounded text-primary">
                    visibility
                  </span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-5 text-muted bg-white rounded-4 border border-light">
            <span className="material-symbols-rounded fs-1 opacity-25">
              inbox
            </span>
            <p className="mt-2">ไม่พบรายการคำขอลา</p>
          </div>
        )}
      </div>

      {/* --- Detail Modal --- */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="รายละเอียดการลา"
        icon="assignment"
        maxWidth="600px"
      >
        {selectedLeave && (
          <div className="p-4">
            {/* Header Profile */}
            <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
              <img
                src={
                  selectedLeave.profile_image
                    ? `${apiUrl}/uploads/profile/${selectedLeave.profile_image}`
                    : `https://ui-avatars.com/api/?name=${selectedLeave.name_th}`
                }
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "16px",
                  objectFit: "cover",
                }}
              />
              <div>
                <h5 className="fw-bold m-0">
                  {selectedLeave.name_th} {selectedLeave.lastname_th}
                </h5>
                <p className="text-muted m-0 small">
                  {selectedLeave.position} •{" "}
                  {selectedLeave.department || "General"}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="leave-detail-row">
              <span className="leave-detail-label">ประเภท</span>
              <span className="leave-detail-value">
                {getLeaveBadge(selectedLeave.leave_type)}
              </span>
            </div>
            <div className="leave-detail-row">
              <span className="leave-detail-label">วันที่ลา</span>
              <span className="leave-detail-value text-dark">
                {formatDate(selectedLeave.start_date)} ถึง{" "}
                {formatDate(selectedLeave.end_date)}
                <span className="ms-2 badge bg-light text-dark border">
                  รวม{" "}
                  {calculateDays(
                    selectedLeave.start_date,
                    selectedLeave.end_date
                  )}{" "}
                  วัน
                </span>
              </span>
            </div>

            <div className="mt-3">
              <span className="leave-detail-label mb-2 d-block">
                เหตุผลการลา:
              </span>
              <div className="reason-box">
                "{selectedLeave.reason || "ไม่ระบุเหตุผล"}"
              </div>
            </div>

            {/* Attachments (ถ้ามี) */}
            {selectedLeave.attachment && (
              <div className="mt-3">
                <span className="leave-detail-label">เอกสารแนบ:</span>
                <a
                  href={`${apiUrl}/uploads/leaves/${selectedLeave.attachment}`}
                  target="_blank"
                  className="text-primary d-flex align-items-center gap-1 mt-1"
                >
                  <span className="material-symbols-rounded">attach_file</span>{" "}
                  ดูเอกสาร
                </a>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="modern-modal-footer">
          <div className="d-flex justify-content-end gap-2 w-100">
            <button
              className="btn btn-subtle me-auto"
              onClick={() => setShowModal(false)}
            >
              ปิดหน้าต่าง
            </button>

            {/* ปุ่มจะขึ้นเฉพาะสถานะ Pending */}
            {selectedLeave?.status === "pending" && (
              <>
                <button
                  className="btn btn-danger-soft d-flex align-items-center gap-2"
                  onClick={() => confirmAction("rejected")}
                  style={{
                    backgroundColor: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fee2e2",
                  }}
                >
                  <span className="material-symbols-rounded">close</span>{" "}
                  ไม่อนุมัติ
                </button>
                <button
                  className="btn btn-save d-flex align-items-center gap-2"
                  onClick={() => confirmAction("approved")}
                >
                  <span className="material-symbols-rounded">check</span>{" "}
                  อนุมัติ
                </button>
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ManageLeaves;
