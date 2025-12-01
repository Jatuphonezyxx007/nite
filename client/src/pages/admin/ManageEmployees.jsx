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
  const itemsPerPage = 10;

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
      // เพิ่มการค้นหาจาก emp_code ด้วย
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
    setCurrentPage(1);
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

  // --- Handlers (ส่วน Modal และ Image Upload คงเดิม) ---
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setPreviewUrl(null);
    setSelectedImage(null);
    setShowModal(true);
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    if (user.profile_image) {
      setPreviewUrl(`${apiUrl}/uploads/profile/${user.profile_image}`);
    } else {
      setPreviewUrl(null);
    }
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
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
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
    e.preventDefault();
    const formData = new FormData(e.target);
    if (selectedImage) {
      formData.set("profile_image", selectedImage);
    }

    try {
      if (editingUser) {
        await axios.put(
          `${apiUrl}/api/admin/users/${editingUser.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        Swal.fire({
          title: "อัปเดตสำเร็จ!",
          text: "แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว",
          icon: "success",
          confirmButtonColor: "#1E2A45",
        });
      } else {
        await axios.post(`${apiUrl}/api/admin/users`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        Swal.fire({
          title: "เพิ่มสำเร็จ!",
          text: "เพิ่มพนักงานเรียบร้อยแล้ว",
          icon: "success",
          confirmButtonColor: "#1E2A45",
        });
      }
      fetchUsers();
      setShowModal(false);
    } catch (error) {
      console.error(error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "ดำเนินการไม่สำเร็จ",
        "error"
      );
    }
  };

  const handleDeleteUser = async (id) => {
    const result = await Swal.fire({
      title: "ยืนยันการนำออก?",
      text: "พนักงานจะย้ายไปอยู่ในรายการที่ถูกลบ",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#E5E7EB",
      confirmButtonText: "ยืนยันลบ",
      cancelButtonText: "<span style='color:#374151'>ยกเลิก</span>",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${apiUrl}/api/admin/users/${id}`, config);
        fetchUsers();
        Swal.fire({
          title: "เรียบร้อย!",
          text: "ย้ายพนักงานไปถังขยะแล้ว",
          icon: "success",
          confirmButtonColor: "#1E2A45",
        });
      } catch (error) {
        Swal.fire("Error", "เกิดข้อผิดพลาด", "error");
      }
    }
  };

  return (
    <div className="manage-container p-4 fade-in">
      {/* Header */}
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
            <span className="material-symbols-rounded">add_circle</span>{" "}
            <span>เพิ่มพนักงาน</span>
          </button>
        </div>
      </div>

      {/* Filter Toggle */}
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
      {/* --- Modal (คงเดิม) --- */}
      {showModal && (
        <>
          <div
            className="modal-backdrop fade show"
            style={{
              zIndex: 1050,
              backgroundColor: "rgba(30,42,69,0.4)",
              backdropFilter: "blur(4px)",
            }}
          ></div>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ zIndex: 1055 }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content custom-modal-content">
                <div className="custom-modal-header d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="modal-title fw-bold text-dark">
                      {editingUser ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}
                    </h5>
                    <p className="m-0 text-muted small">
                      {editingUser
                        ? `กำลังแก้ไขข้อมูลของ: ${editingUser.name_th}`
                        : "กรอกข้อมูลให้ครบถ้วนเพื่อสร้างบัญชี"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  <form
                    key={editingUser ? editingUser.id : "new"}
                    onSubmit={handleSubmit}
                    encType="multipart/form-data"
                  >
                    <div className="row g-4">
                      {/* Image Upload Area */}
                      <div className="col-md-4">
                        <div className="form-section-title">รูปโปรไฟล์</div>
                        <div
                          className={`image-upload-area ${
                            isDragActive ? "drag-active" : ""
                          }`}
                          onClick={() => fileInputRef.current.click()}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          {previewUrl ? (
                            <>
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="preview-image"
                              />
                              <button
                                type="button"
                                className="remove-image-btn"
                                onClick={handleRemoveImage}
                                title="ลบรูป"
                              >
                                <span className="material-symbols-outlined fs-6">
                                  close
                                </span>
                              </button>
                            </>
                          ) : (
                            <div className="upload-placeholder">
                              <span className="material-symbols-rounded upload-icon">
                                cloud_upload
                              </span>
                              <p className="m-0 small fw-bold text-dark">
                                คลิก หรือ ลากไฟล์มาวาง
                              </p>
                            </div>
                          )}
                          <input
                            type="file"
                            name="profile_image"
                            ref={fileInputRef}
                            className="d-none"
                            accept="image/*"
                            onChange={handleFileSelect}
                          />
                        </div>
                      </div>
                      {/* Inputs */}
                      <div className="col-md-8">
                        <div className="form-section-title mt-0">
                          ข้อมูลส่วนตัว (TH)
                        </div>
                        <div className="row g-2 mb-3">
                          <div className="col-md-3">
                            <select
                              name="prefix_th"
                              className="form-select form-control-custom"
                              defaultValue={editingUser?.prefix_th || "นาย"}
                            >
                              <option value="นาย">นาย</option>
                              <option value="นาง">นาง</option>
                              <option value="นางสาว">นางสาว</option>
                            </select>
                          </div>
                          <div className="col-md-4">
                            <input
                              name="name_th"
                              className="form-control form-control-custom"
                              placeholder="ชื่อจริง (ไทย)"
                              required
                              defaultValue={editingUser?.name_th}
                            />
                          </div>
                          <div className="col-md-5">
                            <input
                              name="lastname_th"
                              className="form-control form-control-custom"
                              placeholder="นามสกุล (ไทย)"
                              required
                              defaultValue={editingUser?.lastname_th}
                            />
                          </div>
                          <div className="col-md-12 mt-2">
                            <input
                              name="nickname_th"
                              className="form-control form-control-custom"
                              placeholder="ชื่อเล่น (ไทย)"
                              defaultValue={editingUser?.nickname_th}
                            />
                          </div>
                        </div>

                        <div className="form-section-title">
                          Personal Info (EN)
                        </div>
                        <div className="row g-2 mb-3">
                          <div className="col-md-3">
                            <select
                              name="prefix_en"
                              className="form-select form-control-custom"
                              defaultValue={editingUser?.prefix_en || "Mr."}
                            >
                              <option value="Mr.">Mr.</option>
                              <option value="Mrs.">Mrs.</option>
                              <option value="Miss">Miss</option>
                            </select>
                          </div>
                          <div className="col-md-4">
                            <input
                              name="name_en"
                              className="form-control form-control-custom"
                              placeholder="First Name"
                              required
                              defaultValue={editingUser?.name_en}
                            />
                          </div>
                          <div className="col-md-5">
                            <input
                              name="lastname_en"
                              className="form-control form-control-custom"
                              placeholder="Last Name"
                              required
                              defaultValue={editingUser?.lastname_en}
                            />
                          </div>
                          <div className="col-md-12 mt-2">
                            <input
                              name="nickname_en"
                              className="form-control form-control-custom"
                              placeholder="Nickname (EN)"
                              defaultValue={editingUser?.nickname_en}
                            />
                          </div>
                        </div>
                      </div>
                      {/* System Account */}
                      <div className="col-12">
                        <div className="form-section-title">
                          ข้อมูลเข้าระบบ (System)
                        </div>
                        <div className="row g-3">
                          {/* --- ส่วนที่เพิ่มใหม่: รหัสพนักงาน (emp_code) --- */}
                          <div className="col-md-4">
                            <label className="form-label text-muted small fw-bold">
                              รหัสพนักงาน <span className="text-danger">*</span>
                            </label>
                            <input
                              name="emp_code"
                              className="form-control form-control-custom"
                              placeholder="เช่น 000123"
                              required
                              maxLength={6} // จำกัด 6 ตัวอักษร
                              defaultValue={editingUser?.emp_code}
                              // เพิ่ม pattern ถ้าต้องการบังคับตัวเลขเท่านั้น (Optional)
                              // pattern="[0-9]{6}"
                              // title="กรุณากรอกตัวเลข 6 หลัก"
                            />
                          </div>

                          {/* ปรับ col-md-6 เป็น col-md-8 เพื่อให้ Email ยาวขึ้นรับกับดีไซน์ */}
                          <div className="col-md-8">
                            <label className="form-label text-muted small fw-bold">
                              Email
                            </label>
                            <input
                              name="email"
                              type="email"
                              className="form-control form-control-custom"
                              placeholder="employee@nite.com"
                              required
                              defaultValue={editingUser?.email}
                            />
                          </div>

                          {/* ส่วน Password, Position, Role เหมือนเดิม แต่จัด Layout ใหม่นิดหน่อย */}
                          <div className="col-md-4">
                            <label className="form-label text-muted small fw-bold">
                              Password{" "}
                              {editingUser && (
                                <span className="text-danger small fw-normal">
                                  (เว้นว่างถ้าไม่เปลี่ยน)
                                </span>
                              )}
                            </label>
                            <input
                              name="password"
                              type="password"
                              className="form-control form-control-custom"
                              placeholder={
                                editingUser ? "••••••••" : "กำหนดรหัสผ่าน"
                              }
                              required={!editingUser}
                            />
                          </div>

                          <div className="col-md-4">
                            <label className="form-label text-muted small fw-bold">
                              ตำแหน่ง (Position)
                            </label>
                            <input
                              name="position"
                              className="form-control form-control-custom"
                              placeholder="เช่น Software Engineer"
                              defaultValue={editingUser?.position}
                            />
                          </div>

                          <div className="col-md-4">
                            <label className="form-label text-muted small fw-bold">
                              สิทธิ์การใช้งาน (Role)
                            </label>
                            <select
                              name="role"
                              className="form-select form-control-custom"
                              style={{ backgroundImage: "none" }}
                              defaultValue={editingUser?.role || "user"}
                            >
                              <option value="user">User (พนักงานทั่วไป)</option>
                              <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                            </select>
                          </div>
                        </div>
                      </div>{" "}
                    </div>

                    <div className="d-grid gap-2 mt-4 pt-2">
                      <button
                        type="submit"
                        className="btn btn-primary py-2 fw-bold"
                        style={{
                          backgroundColor: "#1E2A45",
                          border: "none",
                          borderRadius: "10px",
                        }}
                      >
                        {editingUser ? "บันทึกการแก้ไข" : "สร้างบัญชีพนักงาน"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-light py-2 text-muted fw-bold"
                        onClick={() => setShowModal(false)}
                        style={{ borderRadius: "10px" }}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ManageEmployees;
