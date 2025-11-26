import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./ManageEmployees.css";

function ManageEmployees() {
  // ... state เดิม ...
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  // State ใหม่สำหรับรูปภาพ
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } }; // อย่าลืม headers สำหรับ multipart/form-data ถ้า axios ไม่จัดการให้

  // ... useEffect และ fetchUsers เหมือนเดิม ...
  useEffect(() => {
    fetchUsers();
  }, [showDeleted]);

  useEffect(() => {
    // ... logic search เหมือนเดิม ...
    const results = users.filter((user) => {
      const term = searchTerm.toLowerCase();
      return (
        user.name_th?.toLowerCase().includes(term) ||
        user.name_en?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        String(user.id).toLowerCase().includes(term) ||
        user.role?.toLowerCase().includes(term) ||
        user.position?.toLowerCase().includes(term)
      );
    });
    setFilteredUsers(results);
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

  // --- Image Handling Logic ---
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
    e.stopPropagation(); // กันไม่ให้ไปกดโดน input file
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Submit Form ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    // ถ้ามีรูป ต้อง append เข้าไป (บางที input file อาจจะไม่ส่งถ้าไม่ได้เลือกผ่าน dialog)
    if (selectedImage) {
      formData.set("profile_image", selectedImage);
    }

    // แปลง FormData เป็น Object เพื่อ Debug ดู (Optional)
    // const data = Object.fromEntries(formData);
    // console.log(data);

    try {
      // ต้องระบุ Content-Type เป็น multipart/form-data สำหรับ upload ไฟล์
      await axios.post(`${apiUrl}/api/admin/users`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      Swal.fire({
        title: "สำเร็จ!",
        text: "เพิ่มพนักงานเรียบร้อยแล้ว",
        icon: "success",
        confirmButtonColor: "#1E2A45",
      });

      fetchUsers();
      e.target.reset();
      setPreviewUrl(null);
      setSelectedImage(null);
      setShowModal(false);
    } catch (error) {
      console.error(error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "เพิ่มไม่สำเร็จ",
        "error"
      );
    }
  };

  // ... handleDeleteUser และ handleEditClick เหมือนเดิม ...
  const handleDeleteUser = async (id) => {
    /* ... logic เดิม ... */
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

  const handleEditClick = (user) => {
    /* ... logic เดิม ... */
    Swal.fire({
      title: "Edit Info",
      text: `กำลังเตรียมข้อมูลของ: ${user.name_th || user.name}`, // ปรับให้รองรับ name_th
      icon: "info",
      confirmButtonColor: "#1E2A45",
    });
  };

  return (
    <div className="manage-container p-4 fade-in">
      {/* --- Header Section (เหมือนเดิม) --- */}
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
            <span className="material-symbols-outlined search-icon">
              search
            </span>
            <input
              type="text"
              className="custom-search-input"
              placeholder="ค้นหาชื่อ, อีเมล, ตำแหน่ง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="btn-add-employee"
            onClick={() => setShowModal(true)}
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span>เพิ่มพนักงาน</span>
          </button>
        </div>
      </div>

      {/* --- Filter Toggle (เหมือนเดิม) --- */}
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

      {/* --- Table Section --- */}
      <div className="custom-card">
        <div className="table-responsive">
          <table className="table custom-table mb-0">
            <thead>
              <tr>
                <th className="ps-4">พนักงาน</th>
                <th>สถานะ (Role)</th>
                <th>อีเมลติดต่อ</th>
                <th>ตำแหน่งงาน</th>
                <th className="text-end pe-4">
                  {showDeleted ? "เวลาที่ลบ" : "การจัดการ"}
                </th>{" "}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                    {/* Column 1: Info */}
                    <td className="ps-4">
                      <div className="d-flex align-items-center gap-3">
                        <div className="user-avatar-wrapper">
                          <img
                            src={`https://ui-avatars.com/api/?name=${u.name}&background=random&size=128`}
                            alt={u.name}
                            className="avatar-img"
                          />
                        </div>
                        <div>
                          <div
                            className="fw-bold text-dark"
                            style={{ fontSize: "0.95rem" }}
                          >
                            {u.name} {u.lastname}
                            {u.nickname && (
                              <span className="text-muted fw-normal ms-1">
                                ({u.nickname})
                              </span>
                            )}
                          </div>
                          <div
                            className="text-muted small"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Code: #{String(u.id).padStart(4, "0")}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Column 2: Role */}
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
                    {/* Column 3: Email */}
                    <td
                      className="text-muted"
                      style={{ fontFamily: "monospace", fontSize: "0.9rem" }}
                    >
                      {u.email}
                    </td>
                    {/* Column 4: Position */}
                    <td>
                      <div className="d-flex align-items-center text-dark fw-medium">
                        {u.position || "-"}
                      </div>
                    </td>
                    {/* Column 5: Actions */}
                    <td className="text-end pe-4">
                      {showDeleted ? (
                        // --- กรณีดูถังขยะ: แสดงเวลา ---
                        <div
                          className="text-danger opacity-75 fw-medium"
                          style={{ fontSize: "0.9rem" }}
                        >
                          <span
                            className="material-symbols-outlined align-middle me-1"
                            style={{ fontSize: "18px" }}
                          >
                            schedule
                          </span>
                          {/* ใช้ deleted_at หรือ updated_at ตาม database จริง */}
                          {u.deleted_at
                            ? new Date(u.deleted_at).toLocaleString("th-TH", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </div>
                      ) : (
                        // --- กรณีปกติ: แสดงปุ่มเครื่องมือ ---
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            className="action-btn edit"
                            onClick={() => handleEditClick(u)}
                            title="แก้ไขข้อมูล"
                          >
                            <span className="material-symbols-outlined fs-5">
                              edit
                            </span>
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.role === "admin"}
                            title="ลบพนักงาน"
                          >
                            <span className="material-symbols-outlined fs-5">
                              delete
                            </span>
                          </button>
                        </div>
                      )}
                    </td>{" "}
                  </tr>
                ))
              ) : (
                // Not Found State
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <div className="py-4 text-muted opacity-50">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "48px" }}
                      >
                        search_off
                      </span>
                      <p className="mt-2 mb-0">ไม่พบข้อมูลที่ค้นหา</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Modal Add User (Updated) --- */}
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
              {" "}
              {/* ใช้ modal-lg ให้กว้างขึ้น */}
              <div className="modal-content custom-modal-content">
                <div className="custom-modal-header d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="modal-title fw-bold text-dark">
                      เพิ่มพนักงานใหม่
                    </h5>
                    <p className="m-0 text-muted small">
                      กรอกข้อมูลให้ครบถ้วนเพื่อสร้างบัญชี
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  <form onSubmit={handleAddUser} encType="multipart/form-data">
                    <div className="row g-4">
                      {/* --- Left Column: Image Upload --- */}
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
                              <span className="material-symbols-outlined upload-icon">
                                cloud_upload
                              </span>
                              <p className="m-0 small fw-bold text-dark">
                                คลิก หรือ ลากไฟล์มาวาง
                              </p>
                              <p
                                className="m-0"
                                style={{ fontSize: "0.7rem", color: "#9ca3af" }}
                              >
                                JPG, PNG, WEBP (Max 2MB)
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

                      {/* --- Right Column: Inputs --- */}
                      <div className="col-md-8">
                        {/* ข้อมูลภาษาไทย */}
                        <div className="form-section-title mt-0">
                          ข้อมูลส่วนตัว (TH)
                        </div>
                        <div className="row g-2 mb-3">
                          <div className="col-md-3">
                            <select
                              name="prefix_th"
                              className="form-select form-control-custom"
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
                            />
                          </div>
                          <div className="col-md-5">
                            <input
                              name="lastname_th"
                              className="form-control form-control-custom"
                              placeholder="นามสกุล (ไทย)"
                              required
                            />
                          </div>
                          <div className="col-md-12 mt-2">
                            <input
                              name="nickname_th"
                              className="form-control form-control-custom"
                              placeholder="ชื่อเล่น (ไทย)"
                            />
                          </div>
                        </div>

                        {/* ข้อมูลภาษาอังกฤษ */}
                        <div className="form-section-title">
                          Personal Info (EN)
                        </div>
                        <div className="row g-2 mb-3">
                          <div className="col-md-3">
                            <select
                              name="prefix_en"
                              className="form-select form-control-custom"
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
                            />
                          </div>
                          <div className="col-md-5">
                            <input
                              name="lastname_en"
                              className="form-control form-control-custom"
                              placeholder="Last Name"
                              required
                            />
                          </div>
                          <div className="col-md-12 mt-2">
                            <input
                              name="nickname_en"
                              className="form-control form-control-custom"
                              placeholder="Nickname (EN)"
                            />
                          </div>
                        </div>
                      </div>

                      {/* --- Bottom Section: System Account --- */}
                      <div className="col-12">
                        <div className="form-section-title">
                          ข้อมูลเข้าระบบ (System)
                        </div>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label text-muted small fw-bold">
                              Email
                            </label>
                            <input
                              name="email"
                              type="email"
                              className="form-control form-control-custom"
                              placeholder="employee@nite.com"
                              required
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label text-muted small fw-bold">
                              Password
                            </label>
                            <input
                              name="password"
                              type="password"
                              className="form-control form-control-custom"
                              placeholder="••••••••"
                              required
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label text-muted small fw-bold">
                              ตำแหน่ง (Position)
                            </label>
                            <input
                              name="position"
                              className="form-control form-control-custom"
                              placeholder="เช่น Software Engineer"
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label text-muted small fw-bold">
                              สิทธิ์การใช้งาน (Role)
                            </label>
                            <select
                              name="role"
                              className="form-select form-control-custom"
                              style={{ backgroundImage: "none" }}
                            >
                              <option value="user">User (พนักงานทั่วไป)</option>
                              <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                            </select>
                          </div>
                        </div>
                      </div>
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
                        บันทึกข้อมูลพนักงาน
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
