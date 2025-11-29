// client/src/pages/admin/DashboardOverview.jsx
import { useState, useEffect } from "react";
import axios from "axios";

function DashboardOverview() {
  // State สำหรับเก็บข้อมูล
  const [stats, setStats] = useState({
    totalUsers: 0,
    present: 0,
    late: 0,
    recentActivity: [],
  });

  const [loading, setLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchStats();
    // ตั้งเวลาให้ดึงข้อมูลใหม่ทุกๆ 30 วินาที (Real-time update)
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-5">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="fade-in">
      <h2 className="mb-4 fw-bold text-dark">ภาพรวมระบบ (Dashboard)</h2>

      {/* 1. ส่วนแสดงตัวเลขสถิติ (Cards) */}
      <div className="row g-4 mb-4">
        {/* Card: พนักงานทั้งหมด */}
        <div className="col-md-4">
          <div className="card text-white bg-primary shadow-sm h-100 border-0 rounded-4">
            <div className="card-body d-flex align-items-center justify-content-between p-4">
              <div>
                <h6 className="card-title mb-1 opacity-75">พนักงานทั้งหมด</h6>
                <h2 className="mb-0 fw-bold display-5">{stats.totalUsers}</h2>
                <small className="opacity-75">คน</small>
              </div>
              <span
                className="material-symbols-rounded fs-1 opacity-50" // Updated
                style={{ fontSize: "4rem" }}
              >
                groups
              </span>
            </div>
          </div>
        </div>

        {/* Card: เข้างานวันนี้ */}
        <div className="col-md-4">
          <div className="card text-white bg-success shadow-sm h-100 border-0 rounded-4">
            <div className="card-body d-flex align-items-center justify-content-between p-4">
              <div>
                <h6 className="card-title mb-1 opacity-75">เข้างานวันนี้</h6>
                <h2 className="mb-0 fw-bold display-5">{stats.present}</h2>
                <small className="opacity-75">คน</small>
              </div>
              <span
                className="material-symbols-rounded fs-1 opacity-50" // Updated
                style={{ fontSize: "4rem" }}
              >
                how_to_reg
              </span>
            </div>
          </div>
        </div>

        {/* Card: มาสายวันนี้ */}
        <div className="col-md-4">
          <div className="card text-white bg-warning shadow-sm h-100 border-0 rounded-4">
            <div className="card-body d-flex align-items-center justify-content-between p-4">
              <div>
                <h6 className="card-title mb-1 text-dark opacity-75">
                  มาสายวันนี้
                </h6>
                <h2 className="mb-0 fw-bold display-5 text-dark">
                  {stats.late}
                </h2>
                <small className="text-dark opacity-75">คน</small>
              </div>
              <span
                className="material-symbols-rounded fs-1 text-dark opacity-50" // Updated
                style={{ fontSize: "4rem" }}
              >
                running_with_errors
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ส่วนตาราง Activity ล่าสุด */}
      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-header bg-white py-3 border-0">
          <h5 className="m-0 fw-bold text-primary d-flex align-items-center">
            <span className="material-symbols-rounded me-2">history</span>{" "}
            {/* Updated */}
            การลงเวลาล่าสุด (Real-time)
          </h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr className="text-secondary">
                  <th className="ps-4 py-3">พนักงาน</th>
                  <th>เวลาที่ลง</th>
                  <th>สถานะ</th>
                  <th>หลักฐาน</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((log, index) => (
                    <tr key={index}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          {/* รูปโปรไฟล์ */}
                          <img
                            src={
                              log.profile_image
                                ? `${apiUrl}/uploads/profile/${log.profile_image}`
                                : "https://ui-avatars.com/api/?background=random"
                            }
                            alt="profile"
                            className="rounded-circle me-3 shadow-sm"
                            style={{
                              width: "40px",
                              height: "40px",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.target.src =
                                "https://ui-avatars.com/api/?background=random";
                            }}
                          />
                          {/* ชื่อ-นามสกุล */}
                          <div>
                            <div className="fw-bold text-dark">
                              {log.name_th} {log.lastname_th}
                            </div>
                            <div className="small text-muted">
                              {log.emp_code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="fw-medium text-secondary">
                        {new Date(log.clock_in).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        น.
                      </td>
                      <td>
                        {/* Status Badge */}
                        <span
                          className={`badge rounded-pill px-3 py-2 ${
                            log.status === "late"
                              ? "bg-danger-subtle text-danger"
                              : "bg-success-subtle text-success"
                          }`}
                        >
                          {log.status === "late" ? "มาสาย" : "ปกติ"}
                        </span>
                      </td>
                      <td>
                        {/* รูปถ่ายตอนลงเวลา (Base64) */}
                        {log.clock_in_image ? (
                          <img
                            src={log.clock_in_image}
                            alt="proof"
                            className="rounded border"
                            style={{
                              width: "50px",
                              height: "50px",
                              objectFit: "cover",
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              Swal.fire({
                                imageUrl: log.clock_in_image,
                                imageAlt: "Clock In Image",
                                showConfirmButton: false,
                                width: 500,
                              })
                            }
                          />
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-5 text-muted">
                      <span className="material-symbols-rounded fs-1 d-block mb-2 text-secondary opacity-25">
                        {" "}
                        {/* Updated */}
                        event_busy
                      </span>
                      ยังไม่มีการลงเวลาวันนี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardOverview;
