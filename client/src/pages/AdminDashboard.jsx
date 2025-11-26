import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Swal from "sweetalert2";
import AdminSidebar from "../components/AdminSidebar"; // Import Sidebar

function AdminDashboard() {
  const { logout } = useContext(AuthContext);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch ข้อมูลเมื่อโหลดหน้า
  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/admin/stats`, config);
      setStats(res.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/admin/users`, config);
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
      await axios.post(`${apiUrl}/api/admin/users`, data, config);
      Swal.fire("สำเร็จ", "เพิ่มพนักงานเรียบร้อยแล้ว", "success");
      fetchUsers();
      fetchStats(); // อัปเดตตัวเลขรวม
      e.target.reset();
    } catch (error) {
      Swal.fire(
        "เกิดข้อผิดพลาด",
        error.response?.data?.message || "ไม่สามารถเพิ่มได้",
        "error"
      );
    }
  };

  const handleDeleteUser = async (id) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ?",
      text: "ข้อมูลพนักงานจะหายไปถาวร",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่, ลบเลย!",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${apiUrl}/api/admin/users/${id}`, config);
        fetchUsers();
        fetchStats();
        Swal.fire("ลบสำเร็จ!", "ข้อมูลถูกลบแล้ว", "success");
      } catch (error) {
        Swal.fire("Error", error.response?.data?.message || "Failed", "error");
      }
    }
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* ส่วนที่ 1: Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        logout={logout}
      />

      {/* ส่วนที่ 2: Main Content Area */}
      <div
        className="flex-grow-1 p-4"
        style={{ overflowY: "auto", maxHeight: "100vh" }}
      >
        {/* Header ของหน้า */}
        <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
          <h2 className="m-0 text-dark">
            {activeTab === "dashboard" && "ภาพรวมระบบ (Dashboard)"}
            {activeTab === "users" && "จัดการพนักงาน (Employees)"}
            {activeTab === "attendance" && "ตรวจสอบเวลาเข้างาน"}
            {activeTab === "settings" && "ตั้งค่าระบบ"}
          </h2>
          <div className="text-muted">Admin Access</div>
        </div>

        {/* Content: Dashboard */}
        {activeTab === "dashboard" && (
          <div className="fade-in">
            <div className="row g-4 mb-4">
              <div className="col-md-4">
                <div className="card text-white bg-primary shadow-sm h-100 border-0">
                  <div className="card-body d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="card-title mb-1">พนักงานทั้งหมด</h6>
                      <h2 className="mb-0 fw-bold">
                        {stats.totalUsers || 0} คน
                      </h2>
                    </div>
                    <span className="material-symbols-outlined fs-1 opacity-50">
                      groups
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card text-white bg-success shadow-sm h-100 border-0">
                  <div className="card-body d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="card-title mb-1">เข้างานวันนี้</h6>
                      <h2 className="mb-0 fw-bold">{stats.present || 0} คน</h2>
                    </div>
                    <span className="material-symbols-outlined fs-1 opacity-50">
                      how_to_reg
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card text-white bg-warning shadow-sm h-100 border-0">
                  <div className="card-body d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="card-title mb-1">มาสายวันนี้</h6>
                      <h2 className="mb-0 fw-bold">{stats.late || 0} คน</h2>
                    </div>
                    <span className="material-symbols-outlined fs-1 opacity-50">
                      running_with_errors
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card shadow-sm border-0">
              <div className="card-header bg-white py-3">
                <h5 className="m-0 fw-bold text-primary">
                  <span className="material-symbols-outlined align-middle me-2">
                    history
                  </span>
                  การลงเวลาล่าสุด (Real-time)
                </h5>
              </div>
              <div className="card-body p-0">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">ชื่อพนักงาน</th>
                      <th>เวลาที่ลง</th>
                      <th>สถานะ</th>
                      <th>รูปถ่าย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentActivity?.length > 0 ? (
                      stats.recentActivity.map((log, index) => (
                        <tr key={index}>
                          <td className="ps-4 fw-medium">{log.name}</td>
                          <td>
                            {new Date(log.clock_in).toLocaleTimeString("th-TH")}
                          </td>
                          <td>
                            <span
                              className={`badge rounded-pill px-3 py-2 ${
                                log.status === "late"
                                  ? "bg-danger"
                                  : "bg-success"
                              }`}
                            >
                              {log.status === "late" ? "มาสาย" : "ปกติ"}
                            </span>
                          </td>
                          <td>
                            {log.clock_in_image ? (
                              <img
                                src={log.clock_in_image}
                                alt="proof"
                                className="rounded-circle border"
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-4 text-muted">
                          ยังไม่มีการลงเวลาวันนี้
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Content: Manage Users */}
        {activeTab === "users" && (
          <div className="fade-in row">
            {/* ฟอร์มเพิ่มพนักงาน */}
            <div className="col-md-4 mb-4">
              <div
                className="card shadow-sm border-0 sticky-top"
                style={{ top: "20px", zIndex: 1 }}
              >
                <div className="card-header bg-primary text-white">
                  <h5 className="m-0">
                    <i className="bi bi-person-plus-fill me-2"></i>
                    เพิ่มพนักงานใหม่
                  </h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleAddUser}>
                    <div className="mb-3">
                      <label className="form-label text-muted small">
                        ชื่อ-นามสกุล
                      </label>
                      <input
                        name="name"
                        type="text"
                        className="form-control"
                        placeholder="เช่น สมชาย ใจดี"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small">
                        อีเมล (ใช้สำหรับเข้าสู่ระบบ)
                      </label>
                      <input
                        name="email"
                        type="email"
                        className="form-control"
                        placeholder="name@company.com"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small">
                        รหัสผ่านเริ่มต้น
                      </label>
                      <input
                        name="password"
                        type="password"
                        className="form-control"
                        placeholder="******"
                        required
                      />
                    </div>
                    <div className="row mb-3">
                      <div className="col-6">
                        <label className="form-label text-muted small">
                          สิทธิ์การใช้งาน
                        </label>
                        <select name="role" className="form-select">
                          <option value="user">พนักงานทั่วไป</option>
                          <option value="admin">ผู้ดูแลระบบ</option>
                        </select>
                      </div>
                      <div className="col-6">
                        <label className="form-label text-muted small">
                          ตำแหน่ง
                        </label>
                        <input
                          name="position"
                          type="text"
                          className="form-control"
                          placeholder="เช่น HR, Dev"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-2"
                    >
                      <span className="material-symbols-outlined align-middle me-1">
                        add_circle
                      </span>
                      บันทึกข้อมูล
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* ตารางรายชื่อ */}
            <div className="col-md-8">
              <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-4 py-3">ID</th>
                        <th>ชื่อ-นามสกุล</th>
                        <th>ตำแหน่ง</th>
                        <th>สิทธิ์</th>
                        <th className="text-end pe-4">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td className="ps-4 text-muted">#{u.id}</td>
                          <td>
                            <div className="fw-bold">{u.name}</div>
                            <div className="small text-muted">{u.email}</div>
                          </td>
                          <td>
                            <span className="badge bg-secondary fw-normal">
                              {u.position || "N/A"}
                            </span>
                          </td>
                          <td>
                            {u.role === "admin" ? (
                              <span className="badge bg-dark">
                                <i className="bi bi-shield-lock-fill me-1"></i>
                                Admin
                              </span>
                            ) : (
                              <span className="badge bg-info text-dark">
                                Employee
                              </span>
                            )}
                          </td>
                          <td className="text-end pe-4">
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1"
                              disabled={u.role === "admin"}
                              title="ลบพนักงาน"
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: "18px" }}
                              >
                                delete
                              </span>
                              ลบ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder สำหรับเมนูอื่นๆ */}
        {(activeTab === "attendance" || activeTab === "settings") && (
          <div className="text-center py-5 text-muted fade-in">
            <span className="material-symbols-outlined fs-1 d-block mb-3">
              construction
            </span>
            <h4>กำลังพัฒนาฟีเจอร์นี้...</h4>
            <p>ฟีเจอร์นี้จะพร้อมใช้งานในเวอร์ชันถัดไป</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
