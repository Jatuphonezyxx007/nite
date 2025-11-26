import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./ManageEmployees.css"; // Import CSS ใหม่

function ManageEmployees() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

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
        user.name.toLowerCase().includes(term) ||
        (user.lastname && user.lastname.toLowerCase().includes(term)) ||
        (user.nickname && user.nickname.toLowerCase().includes(term)) ||
        user.email.toLowerCase().includes(term) ||
        String(user.id).toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term) ||
        (user.position && user.position.toLowerCase().includes(term))
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

  const handleAddUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    try {
      await axios.post(`${apiUrl}/api/admin/users`, data, config);
      Swal.fire({
        title: "สำเร็จ!",
        text: "เพิ่มพนักงานเรียบร้อยแล้ว",
        icon: "success",
        confirmButtonColor: "#1E2A45",
      });
      fetchUsers();
      e.target.reset();
      setShowModal(false);
    } catch (error) {
      Swal.fire("Error", "เพิ่มไม่สำเร็จ", "error");
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

  const handleEditClick = (user) => {
    Swal.fire({
      title: "Edit Info",
      text: `กำลังเตรียมข้อมูลของ: ${user.name}`,
      icon: "info",
      confirmButtonColor: "#1E2A45",
    });
  };

  return (
    <div className="manage-container p-4 fade-in">
      {/* --- Header Section --- */}
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
          {/* Custom Search */}
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

      {/* --- Filter Toggle --- */}
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

      {/* --- Modal Add User --- */}
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
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content custom-modal-content">
                <div className="custom-modal-header d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="modal-title fw-bold text-dark">
                      เพิ่มพนักงานใหม่
                    </h5>
                    <p className="m-0 text-muted small">
                      กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้ใหม่
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  <form onSubmit={handleAddUser}>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label text-muted small fw-bold text-uppercase">
                          ชื่อ-นามสกุล
                        </label>
                        <input
                          name="name"
                          className="form-control form-control-custom"
                          placeholder="เช่น สมชาย ใจดี"
                          required
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label text-muted small fw-bold text-uppercase">
                          Email
                        </label>
                        <input
                          name="email"
                          type="email"
                          className="form-control form-control-custom"
                          placeholder="example@nite.com"
                          required
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label text-muted small fw-bold text-uppercase">
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
                        <label className="form-label text-muted small fw-bold text-uppercase">
                          ตำแหน่ง
                        </label>
                        <input
                          name="position"
                          className="form-control form-control-custom"
                          placeholder="เช่น Engineer"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-muted small fw-bold text-uppercase">
                          สิทธิ์การใช้งาน
                        </label>
                        <select
                          name="role"
                          className="form-select form-control-custom"
                          style={{ backgroundImage: "none" }}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
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
                        บันทึกข้อมูล
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
