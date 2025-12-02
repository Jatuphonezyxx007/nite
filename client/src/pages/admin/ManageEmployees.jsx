import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./ManageEmployees.css";
import Modal from "../../components/Modal";
import Dropdown from "../../components/DropDown";

function ManageEmployees() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- Modal & Form State ---
  const [showModal, setShowModal] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  // Form Data State
  const initialFormState = {
    id: null,
    emp_code: "",
    username: "",
    role_id: "2",
    email: "",
    password: "",
    position: "",
    prefix_th: "นาย",
    name_th: "",
    lastname_th: "",
    nickname_th: "",
    prefix_en: "Mr.",
    name_en: "",
    lastname_en: "",
    nickname_en: "",
  };
  const [formData, setFormData] = useState(initialFormState);

  // Image State
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const roleOptions = [
    { value: "2", label: "User (ทั่วไป)", icon: "person" },
    { value: "1", label: "Admin (ผู้ดูแลระบบ)", icon: "verified_user" },
  ];

  const prefixThOptions = [
    { value: "นาย", label: "นาย" },
    { value: "นาง", label: "นาง" },
    { value: "นางสาว", label: "นางสาว" },
  ];

  const prefixEnOptions = [
    { value: "Mr.", label: "Mr." },
    { value: "Mrs.", label: "Mrs." },
    { value: "Ms.", label: "Ms." },
  ];

  useEffect(() => {
    fetchUsers();
  }, [showDeleted]);

  useEffect(() => {
    if (users.length > 0) {
      const results = users.filter((user) => {
        const term = searchTerm.toLowerCase();
        return (
          user.username?.toLowerCase().includes(term) ||
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
    }
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

  // --- Handlers ---
  const handleOpenAddModal = () => {
    setFormData(initialFormState);
    setPreviewUrl(null);
    setSelectedImage(null);
    setShowModal(true);
  };

  const handleEditClick = (user) => {
    setFormData({
      id: user.id,
      emp_code: user.emp_code || "",
      username: user.username || "",
      role_id: user.role_id ? String(user.role_id) : "2",
      email: user.email || "",
      password: "", // Password is blank on edit
      position: user.position || "",
      prefix_th: user.prefix_th || "นาย",
      name_th: user.name_th || "",
      lastname_th: user.lastname_th || "",
      nickname_th: user.nickname_th || "",
      prefix_en: user.prefix_en || "Mr.",
      name_en: user.name_en || "",
      lastname_en: user.lastname_en || "",
      nickname_en: user.nickname_en || "",
    });

    if (user.profile_image) {
      setPreviewUrl(`${apiUrl}/uploads/profile/${user.profile_image}`);
    } else {
      setPreviewUrl(null);
    }
    setSelectedImage(null);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Image Handlers
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

    // Basic Validation
    if (!formData.name_th || !formData.lastname_th || !formData.username) {
      Swal.fire({
        icon: "warning",
        title: "ข้อมูลไม่ครบถ้วน",
        text: "กรุณากรอกข้อมูลสำคัญ (ชื่อผู้ใช้, ชื่อ-นามสกุล) ให้ครบ",
        confirmButtonColor: "#1E2A45",
      });
      return;
    }

    const submitData = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null) {
        submitData.append(key, formData[key]);
      }
    });

    if (selectedImage) {
      submitData.append("profile_image", selectedImage);
    }

    try {
      if (formData.id) {
        await axios.put(
          `${apiUrl}/api/admin/users/${formData.id}`,
          submitData,
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
        await axios.post(`${apiUrl}/api/admin/users`, submitData, {
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
              placeholder="ค้นหาชื่อ, username, อีเมล..."
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
      <div className="custom-card">
        <div className="table-responsive">
          <table className="table custom-table mb-0">
            <thead>
              <tr>
                <th className="ps-4">พนักงาน</th>
                <th>สิทธิ์การเข้าถึง</th>
                <th>บัญชีผู้ใช้ / อีเมล</th>
                <th>ตำแหน่งงาน</th>
                <th className="text-end pe-4">
                  {showDeleted ? "เวลาที่ลบ" : "การจัดการ"}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((u) => (
                  <tr key={u.id}>
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
                      {u.role_name === "admin" ? (
                        <div className="role-badge admin">
                          <span className="role-dot"></span> Admin
                        </div>
                      ) : (
                        <div className="role-badge user">
                          <span className="role-dot"></span> User
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="d-flex flex-column">
                        <span
                          className="fw-bold text-dark"
                          style={{ fontSize: "0.9rem" }}
                        >
                          {u.username}
                        </span>
                        <span
                          className="text-muted small"
                          style={{ fontFamily: "monospace" }}
                        >
                          {u.email}
                        </span>
                      </div>
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

      {/* --- ALL-IN-ONE MODAL FORM --- */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="1100px"
        icon={formData.id ? "edit_square" : "person_add"}
        title={
          <div>
            <h5 className="fw-bold text-dark m-0">
              {formData.id ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}
            </h5>
            <p className="text-muted small m-0 mt-1">
              กรอกข้อมูลพนักงานให้ครบถ้วนเพื่อบันทึกลงในระบบ
            </p>
          </div>
        }
      >
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="row g-0">
            {/* Left Column: Image */}
            <div className="col-lg-4 bg-soft-gray p-4 border-end d-flex flex-column align-items-center justify-content-start">
              <div
                className="text-center w-100 sticky-top"
                style={{ top: "20px" }}
              >
                <h6 className="text-muted fw-bold mb-4">รูปโปรไฟล์</h6>

                {/* แก้ไขตรงนี้: เปลี่ยน className เป็น profile-upload-card */}
                <div
                  className={`profile-upload-card ${
                    isDragActive ? "drag-active" : ""
                  }`}
                  onClick={() => fileInputRef.current.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="profile-preview-img"
                    />
                  ) : (
                    <div className="upload-placeholder-content">
                      <span
                        className="material-symbols-rounded"
                        style={{ fontSize: "48px" }}
                      >
                        add_photo_alternate
                      </span>
                      <span className="small mt-2 fw-medium">
                        อัปโหลดรูปภาพ
                      </span>
                    </div>
                  )}

                  {previewUrl && (
                    <button
                      type="button"
                      className="remove-img-mini-btn"
                      onClick={handleRemoveImage}
                      title="ลบรูปภาพ"
                    >
                      <span className="material-symbols-rounded fs-6">
                        close
                      </span>
                    </button>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="d-none"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </div>

                <div className="mt-3 text-muted small">
                  รองรับไฟล์: JPG, PNG, GIF
                </div>
              </div>
            </div>
            {/* Right Column: All Forms */}
            <div className="col-lg-8 p-4 bg-white">
              {/* 1. System Info */}
              <h6 className="section-header text-primary mb-3">
                <span className="material-symbols-rounded align-bottom me-2 fs-5">
                  manage_accounts
                </span>
                ข้อมูลเข้าสู่ระบบ
              </h6>
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label-sm">รหัสพนักงาน</label>
                  <input
                    name="emp_code"
                    className="form-control modern-input"
                    value={formData.emp_code}
                    onChange={handleInputChange}
                    placeholder="เช่น EMP-001"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label-sm">
                    สิทธิ์การใช้งาน (Role)
                  </label>
                  <Dropdown
                    name="role_id"
                    value={formData.role_id}
                    options={roleOptions} // ส่ง Array เข้าไป
                    onChange={handleInputChange}
                    placeholder="เลือกสิทธิ์"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label-sm">ตำแหน่งงาน</label>
                  <input
                    name="position"
                    className="form-control modern-input"
                    value={formData.position}
                    onChange={handleInputChange}
                    placeholder="เช่น HR, Dev"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label-sm">
                    Username <span className="text-danger">*</span>
                  </label>
                  <input
                    name="username"
                    className="form-control modern-input"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label-sm">
                    Password{" "}
                    {formData.id && (
                      <span className="text-muted fw-normal">
                        (เว้นว่างหากไม่เปลี่ยน)
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    name="password"
                    className="form-control modern-input"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={formData.id ? "********" : ""}
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label-sm">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control modern-input"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* 2. Personal Info (TH) */}
              <h6 className="section-header text-primary mb-3 mt-4">
                <span className="material-symbols-rounded align-bottom me-2 fs-5">
                  badge
                </span>
                ข้อมูลส่วนตัว (ภาษาไทย)
              </h6>
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <label className="form-label-sm">คำนำหน้า</label>
                  <Dropdown
                    name="prefix_th"
                    value={formData.prefix_th}
                    options={prefixThOptions}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label-sm">
                    ชื่อจริง <span className="text-danger">*</span>
                  </label>
                  <input
                    name="name_th"
                    className="form-control modern-input"
                    value={formData.name_th}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-5">
                  <label className="form-label-sm">
                    นามสกุล <span className="text-danger">*</span>
                  </label>
                  <input
                    name="lastname_th"
                    className="form-control modern-input"
                    value={formData.lastname_th}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label-sm">ชื่อเล่น</label>
                  <input
                    name="nickname_th"
                    className="form-control modern-input"
                    value={formData.nickname_th}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* 3. Personal Info (EN) */}
              <h6 className="section-header text-primary mb-3 mt-4">
                <span className="material-symbols-rounded align-bottom me-2 fs-5">
                  language
                </span>
                ข้อมูลส่วนตัว (ภาษาอังกฤษ)
              </h6>
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label-sm">Prefix</label>
                  <Dropdown
                    name="prefix_en"
                    value={formData.prefix_en}
                    options={prefixEnOptions}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label-sm">First Name</label>
                  <input
                    name="name_en"
                    className="form-control modern-input"
                    value={formData.name_en}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-5">
                  <label className="form-label-sm">Last Name</label>
                  <input
                    name="lastname_en"
                    className="form-control modern-input"
                    value={formData.lastname_en}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label-sm">Nickname (EN)</label>
                  <input
                    name="nickname_en"
                    className="form-control modern-input"
                    value={formData.nickname_en}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modern-modal-footer">
            <div className="d-flex justify-content-end align-items-center w-100 gap-2">
              <button
                type="button"
                className="btn btn-subtle"
                onClick={() => setShowModal(false)}
              >
                ยกเลิก
              </button>
              <button type="submit" className="btn btn-save">
                <span className="material-symbols-rounded">save</span>{" "}
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ManageEmployees;
