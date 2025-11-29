import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./ManageEmployees.css";

function ManageEmployees() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // จำนวนแถวต่อหน้า

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);

  // Image State
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchUsers();
  }, [showDeleted]);

  useEffect(() => {
    const results = users.filter((user) => {
      const term = searchTerm.toLowerCase();
      return (
        user.name_th?.toLowerCase().includes(term) ||
        user.name_en?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        String(user.id).toLowerCase().includes(term) ||
        (user.emp_code && user.emp_code.toLowerCase().includes(term)) ||
        user.role?.toLowerCase().includes(term) ||
        user.position?.toLowerCase().includes(term)
      );
    });
    setFilteredUsers(results);
    setCurrentPage(1); // รีเซ็ตไปหน้า 1 ทุกครั้งที่ค้นหา
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        `${apiUrl}/api/admin/users?deleted=${showDeleted}`,
        config
      );
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // --- Pagination Logic ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // ... (Handlers เดิม: handleOpenAddModal, handleEditClick, Image Upload, Submit, Delete - คงเดิมทั้งหมด) ...
  // เพื่อความกระชับ ผมขอละไว้ในคำตอบนี้นะครับ (ให้ใช้โค้ดเดิมส่วนนี้ได้เลย)
  const handleOpenAddModal = () => {
    /* ... */ setEditingUser(null);
    setPreviewUrl(null);
    setSelectedImage(null);
    setShowModal(true);
  };
  const handleEditClick = (user) => {
    /* ... */ setEditingUser(user);
    setPreviewUrl(
      user.profile_image
        ? `${apiUrl}/uploads/profile/${user.profile_image}`
        : null
    );
    setSelectedImage(null);
    setShowModal(true);
  };
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };
  const handleDragLeave = () => {
    setIsDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };
  const processFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      Swal.fire("ผิดพลาด", "กรุณาเลือกไฟล์รูปภาพเท่านั้น", "error");
    }
  };
  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const handleSubmit = async (e) => {
    /* ... โค้ด Submit เดิม ... */ e.preventDefault(); /* ... */
  };
  const handleDeleteUser = async (id) => {
    /* ... โค้ด Delete เดิม ... */
  };

  return (
    <div className="manage-container p-4 fade-in">
      {/* Header & Filter (คงเดิม) */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
        <div>
          <h2
            className="fw-bold text-dark m-0"
            style={{ letterSpacing: "-1px" }}
          >
            Employees<span style={{ color: "#FFBD28" }}>.</span>
          </h2>
          <p className="text-muted m-0 mt-1">
            จัดการรายชื่อและสิทธิ์การใช้งานของพนักงาน
          </p>
        </div>
        <div className="d-flex flex-column flex-sm-row gap-3">
          <div className="search-wrapper">
            <span className="material-symbols-rounded search-icon">search</span>
            <input
              type="text"
              className="custom-search-input"
              placeholder="ค้นหาชื่อ, รหัส, อีเมล..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-add-employee" onClick={handleOpenAddModal}>
            <span className="material-symbols-rounded">add_circle</span>
            <span>เพิ่มพนักงาน</span>
          </button>
        </div>
      </div>

      <div className="d-flex justify-content-end mb-3">
        <label className="custom-switch">
          <span
            className={`switch-label ${
              showDeleted ? "text-danger" : "text-muted"
            }`}
          >
            {showDeleted ? "กำลังแสดง: พนักงานที่ลบ" : "แสดงพนักงานปกติ"}
          </span>
          <div className="form-check form-switch m-0">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              style={{ cursor: "pointer", width: "40px", height: "20px" }}
            />
          </div>
        </label>
      </div>

      {/* Table */}
      <div className="custom-card">
        <div className="table-responsive">
          <table className="table custom-table mb-0">
            <thead>
              <tr>
                <th className="ps-4">พนักงาน</th>
                <th>สิทธิ์การเข้าถึง</th>
                <th>อีเมลติดต่อ</th>
                <th>ตำแหน่งงาน</th>
                <th className="text-end pe-4">
                  {showDeleted ? "เวลาที่ลบ" : "การจัดการ"}
                </th>
              </tr>
            </thead>
            <tbody>
              {/* เปลี่ยนจาก filteredUsers เป็น currentItems */}
              {currentItems.length > 0 ? (
                currentItems.map((u) => (
                  <tr key={u.id}>
                    {/* ... (เนื้อหาใน Table Row เหมือนเดิมทุกประการ) ... */}
                    <td className="ps-4">
                      <div className="d-flex align-items-center gap-3">
                        <div className="user-avatar-wrapper">
                          <img
                            src={
                              u.profile_image && u.profile_image !== ""
                                ? `${apiUrl}/uploads/profile/${u.profile_image}`
                                : `https://ui-avatars.com/api/?name=${u.name_th}&background=random&size=128`
                            }
                            alt={u.name_th}
                            className="avatar-img"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${u.name_th}&background=random&size=128`;
                            }}
                          />
                        </div>
                        <div>
                          <div
                            className="fw-bold text-dark"
                            style={{ fontSize: "0.95rem" }}
                          >
                            {u.name_th} {u.lastname_th}
                            {u.nickname_th && (
                              <span className="text-muted fw-normal ms-1">
                                ({u.nickname_th})
                              </span>
                            )}
                          </div>
                          <div className="d-flex align-items-center gap-2 mt-1">
                            {u.emp_code && (
                              <span
                                className="badge bg-light text-secondary border fw-normal"
                                style={{ fontSize: "0.7rem" }}
                              >
                                {u.emp_code}
                              </span>
                            )}
                            <span
                              className="text-muted small"
                              style={{ fontSize: "0.75rem" }}
                            >
                              {u.name_en} {u.lastname_en}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {u.role === "admin" ? (
                        <div className="role-badge admin">
                          <span className="role-dot"></span> Admin
                        </div>
                      ) : (
                        <div className="role-badge user">
                          <span className="role-dot"></span> User
                        </div>
                      )}
                    </td>
                    <td
                      className="text-muted"
                      style={{ fontFamily: "monospace", fontSize: "0.9rem" }}
                    >
                      {u.email}
                    </td>
                    <td>
                      <div className="d-flex align-items-center text-dark fw-medium">
                        {u.position || "-"}
                      </div>
                    </td>
                    <td className="text-end pe-4">
                      {showDeleted ? (
                        <div
                          className="text-danger opacity-75 fw-medium"
                          style={{ fontSize: "0.9rem" }}
                        >
                          <span
                            className="material-symbols-rounded align-middle me-1"
                            style={{ fontSize: "18px" }}
                          >
                            schedule
                          </span>
                          {u.deleted_at
                            ? new Date(u.deleted_at).toLocaleString("th-TH")
                            : "-"}
                        </div>
                      ) : (
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            className="action-btn edit"
                            onClick={() => handleEditClick(u)}
                            title="แก้ไขข้อมูล"
                          >
                            <span className="material-symbols-rounded fs-5">
                              edit
                            </span>
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.role === "admin"}
                            title="ลบพนักงาน"
                          >
                            <span className="material-symbols-rounded fs-5">
                              delete
                            </span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    ไม่พบข้อมูลพนักงาน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- Pagination Controls --- */}
        {filteredUsers.length > 0 && (
          <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
            <div className="text-muted small ms-2">
              แสดง {indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, filteredUsers.length)} จาก{" "}
              {filteredUsers.length} รายการ
            </div>
            <div className="pagination-wrapper">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <span className="material-symbols-rounded fs-6">
                  chevron_left
                </span>
              </button>

              {/* สร้างปุ่มเลขหน้า */}
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  className={`pagination-btn ${
                    currentPage === index + 1 ? "active" : ""
                  }`}
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </button>
              ))}

              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <span className="material-symbols-rounded fs-6">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- Modal (เหมือนเดิม) --- */}
      {showModal && (
        // ... (Modal code คงเดิม) ...
        <div
          className="modal-backdrop fade show"
          style={{
            zIndex: 1050,
            backgroundColor: "rgba(30,42,69,0.4)",
            backdropFilter: "blur(4px)",
          }}
        ></div>
        // ...
      )}
      {/* ... ถ้าต้องการโค้ด Modal เต็มๆ บอกได้นะครับ แต่หลักๆ คือใช้โค้ดเดิมแล้วเปลี่ยนแค่ตำแหน่งการวาง ... */}
    </div>
  );
}

export default ManageEmployees;
