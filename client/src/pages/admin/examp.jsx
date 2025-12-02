import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./ManageEmployees.css";
// import Modal Component ที่สร้างขึ้นใหม่
import ModernModal from "../components/ModernModal/ModernModal"; // ปรับ path ตามจริง

function ManageEmployees() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Form Data
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

  // ... (Logic useEffect, fetchUsers, Pagination เหมือนเดิม ไม่ต้องแก้) ...
  // เพื่อความกระชับ ผมจะละ Code ส่วน Logic เดิมไว้ หากต้องการให้แปะเต็มบอกได้ครับ
  // สมมติว่า Logic: useEffect, fetchUsers, handlePageChange, handleInputChange,
  // handleFileSelect, processFile, handleSubmit, handleDeleteUser ยังคงเหมือนเดิม

  useEffect(() => {
    fetchUsers();
  }, [showDeleted]);
  useEffect(() => {
    if (users.length > 0) {
      const term = searchTerm.toLowerCase();
      const results = users.filter(
        (user) =>
          user.username?.toLowerCase().includes(term) ||
          user.name_th?.toLowerCase().includes(term) ||
          String(user.id).includes(term)
      );
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

  // Handlers
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const handlePageChange = (n) => setCurrentPage(n);

  const handleOpenAddModal = () => {
    setFormData(initialFormState);
    setPreviewUrl(null);
    setSelectedImage(null);
    setCurrentStep(1);
    setShowModal(true);
  };

  const handleEditClick = (user) => {
    setFormData({ ...user, password: "" }); // Copy user data, clear password
    setPreviewUrl(
      user.profile_image
        ? `${apiUrl}/uploads/profile/${user.profile_image}`
        : null
    );
    setSelectedImage(null);
    setCurrentStep(1);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => processFile(e.target.files[0]);
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };
  const handleDragLeave = () => setIsDragActive(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    processFile(e.dataTransfer.files[0]);
  };
  const processFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      Swal.fire("ผิดพลาด", "เลือกไฟล์รูปภาพเท่านั้น", "error");
    }
  };
  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleNextStep = () => {
    if (!formData.name_th || !formData.lastname_th) {
      Swal.fire({
        icon: "warning",
        title: "แจ้งเตือน",
        text: "กรุณากรอกชื่อ-นามสกุล (ไทย)",
      });
      return;
    }
    setCurrentStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null) submitData.append(key, formData[key]);
    });
    if (selectedImage) submitData.append("profile_image", selectedImage);

    try {
      const url = formData.id
        ? `${apiUrl}/api/admin/users/${formData.id}`
        : `${apiUrl}/api/admin/users`;
      const method = formData.id ? axios.put : axios.post;
      await method(url, submitData, {
        headers: { ...config.headers, "Content-Type": "multipart/form-data" },
      });

      Swal.fire(
        "สำเร็จ",
        formData.id ? "อัปเดตข้อมูลแล้ว" : "เพิ่มพนักงานแล้ว",
        "success"
      );
      fetchUsers();
      setShowModal(false);
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "เกิดข้อผิดพลาด",
        "error"
      );
    }
  };

  const handleDeleteUser = async (id) => {
    /* ... Logic เดิม ... */
  };

  return (
    <div className="manage-container p-4 fade-in">
      {/* --- HEADER & TABLE SECTION (เหมือนเดิม) --- */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
        <div>
          <h2
            className="fw-bold text-dark m-0"
            style={{ letterSpacing: "-1px" }}
          >
            Employees<span style={{ color: "#FFBD28" }}>.</span>
          </h2>
          <p className="text-muted m-0 mt-1">จัดการรายชื่อและสิทธิ์การใช้งาน</p>
        </div>
        <div className="d-flex gap-3">
          <div className="search-wrapper">
            <span className="material-symbols-rounded search-icon">search</span>
            <input
              type="text"
              className="custom-search-input"
              placeholder="ค้นหา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-add-employee" onClick={handleOpenAddModal}>
            <span className="material-symbols-rounded">add_circle</span>{" "}
            เพิ่มพนักงาน
          </button>
        </div>
      </div>

      <div className="custom-card">
        {/* ... Table Code เดิม ... */}
        <div className="table-responsive">
          <table className="table custom-table mb-0">
            {/* ... thead, tbody map users ... */}
            <thead>
              <tr>
                <th>พนักงาน</th>
                <th>ตำแหน่ง</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((u) => (
                <tr key={u.id}>
                  <td>{u.name_th}</td>
                  <td>{u.position}</td>
                  <td>
                    <button
                      className="action-btn edit"
                      onClick={() => handleEditClick(u)}
                    >
                      edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- เรียกใช้ ModernModal Component --- */}
      <ModernModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="1100px"
        icon={formData.id ? "edit_square" : "person_add"}
        title={
          <div>
            <h5 className="fw-bold text-dark m-0">
              {formData.id ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}
            </h5>
            <div className="d-flex align-items-center gap-2 mt-1">
              <span
                className={`step-dot ${
                  currentStep === 1 ? "active" : "completed"
                }`}
              >
                1
              </span>
              <span className="text-muted small">ข้อมูลส่วนตัว</span>
              <span className="text-muted small mx-1">/</span>
              <span className={`step-dot ${currentStep === 2 ? "active" : ""}`}>
                2
              </span>
              <span className="text-muted small">ข้อมูลระบบ</span>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="row g-0">
            {/* Left Column: Image */}
            <div className="col-lg-4 bg-soft-gray p-4 border-end d-flex flex-column align-items-center justify-content-center">
              <div className="text-center w-100">
                <h6 className="text-muted fw-bold mb-4">รูปโปรไฟล์</h6>
                <div
                  className={`profile-upload-circle large ${
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
                      <span className="material-symbols-rounded fs-1 text-muted">
                        add_a_photo
                      </span>
                    </div>
                  )}
                  {previewUrl && (
                    <button
                      type="button"
                      className="remove-img-mini-btn"
                      onClick={handleRemoveImage}
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
              </div>
            </div>

            {/* Right Column: Bootstrap Forms */}
            <div className="col-lg-8 p-4 bg-white">
              {/* Step 1 */}
              {currentStep === 1 && (
                <div className="fade-in">
                  <h6 className="section-header text-primary mb-3">
                    ข้อมูลส่วนตัว (ภาษาไทย)
                  </h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-3">
                      <label className="form-label-sm">คำนำหน้า</label>
                      <select
                        name="prefix_th"
                        className="form-select modern-input"
                        value={formData.prefix_th}
                        onChange={handleInputChange}
                      >
                        <option value="นาย">นาย</option>
                        <option value="นาง">นาง</option>
                      </select>
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
                      />
                    </div>
                  </div>
                  {/* ใส่ Field ภาษาอังกฤษที่นี่ตามต้องการ โดยใช้ col-md-* ของ Bootstrap เหมือนเดิม */}
                </div>
              )}

              {/* Step 2 */}
              {currentStep === 2 && (
                <div className="fade-in">
                  <h6 className="section-header text-primary mb-3">
                    ข้อมูลเข้าระบบ
                  </h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label-sm">Username</label>
                      <input
                        name="username"
                        className="form-control modern-input"
                        value={formData.username}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label-sm">Role</label>
                      <select
                        name="role_id"
                        className="form-select modern-input"
                        value={formData.role_id}
                        onChange={handleInputChange}
                      >
                        <option value="2">User</option>
                        <option value="1">Admin</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label-sm">Password</label>
                      <input
                        type="password"
                        name="password"
                        className="form-control modern-input"
                        value={formData.password}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="modern-modal-footer">
            <div className="d-flex justify-content-between align-items-center w-100">
              <div>
                {currentStep === 2 && (
                  <button
                    type="button"
                    className="btn btn-subtle text-primary"
                    onClick={() => setCurrentStep(1)}
                  >
                    ย้อนกลับ
                  </button>
                )}
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-subtle"
                  onClick={() => setShowModal(false)}
                >
                  ยกเลิก
                </button>
                {currentStep === 1 ? (
                  <button
                    type="button"
                    className="btn btn-save"
                    onClick={handleNextStep}
                  >
                    ถัดไป
                  </button>
                ) : (
                  <button type="submit" className="btn btn-save">
                    บันทึก
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </ModernModal>
    </div>
  );
}

export default ManageEmployees;
