import { useState, useEffect } from "react";
import axios from "axios";

function DashboardOverview() {
  const [stats, setStats] = useState({});
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="fade-in">
      <h2 className="mb-4 text-dark">ภาพรวมระบบ (Dashboard)</h2>
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card text-white bg-primary shadow-sm h-100 border-0">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <h6 className="card-title mb-1">พนักงานทั้งหมด</h6>
                <h2 className="mb-0 fw-bold">{stats.totalUsers || 0} คน</h2>
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
            การลงเวลาล่าสุด
          </h5>
        </div>
        <div className="card-body p-0">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                {/* 1. เพิ่มหัวตารางสำหรับลำดับ */}
                <th className="ps-4 text-center" style={{ width: "60px" }}>
                  ลำดับ
                </th>
                <th>ชื่อพนักงาน</th>
                <th>เวลา</th>
                <th>สถานะ</th>
                <th>รูปถ่าย</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentActivity?.length > 0 ? (
                stats.recentActivity.map((log, index) => (
                  <tr key={index}>
                    {/* 2. แสดงลำดับ โดยใช้ index + 1 */}
                    <td className="ps-4 text-muted fw-light text-center">
                      {index + 1}
                    </td>

                    <td className="align-middle">
                      {/* 3. เพิ่ม 'align-items-start' เพื่อบังคับให้ทุกอย่างในกล่องนี้ชิดซ้าย */}
                      <div className="d-flex flex-column justify-content-center align-items-start">
                        {/* ส่วนชื่อ-นามสกุล */}
                        <div className="mb-1 text-nowrap">
                          <span className="fw-semibold text-dark">
                            {log.name_th
                              ? `${log.name_th} ${log.lastname_th}`
                              : "-"}
                          </span>
                          {log.nickname_th && (
                            <small className="text-body-secondary ms-2 fw-normal">
                              ({log.nickname_th})
                            </small>
                          )}
                        </div>

                        {/* รหัสพนักงาน (เอา div ที่ซ้อนกันออก เพื่อให้ align-items-start ของแม่ทำงานได้ตรงๆ) */}
                        <span className="badge bg-light text-secondary border rounded-pill fw-normal d-inline-flex align-items-center px-2 py-1">
                          <i className="bi bi-person-badge me-1"></i>
                          <span>{log.emp_code || "No ID"}</span>
                        </span>
                      </div>
                    </td>

                    <td>
                      {new Date(log.clock_in).toLocaleTimeString("th-TH")}
                    </td>
                    <td>
                      <span
                        className={`badge rounded-pill px-3 py-2 ${
                          log.status === "late" ? "bg-danger" : "bg-success"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td>
                      {log.clock_in_image ? (
                        <img
                          src={log.clock_in_image}
                          className="rounded-circle border"
                          alt="clock-in"
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
                  {/* อย่าลืมปรับ colSpan เป็น 5 เพราะเราเพิ่มมา 1 คอลัมน์ */}
                  <td colSpan="5" className="text-center py-4 text-muted">
                    ยังไม่มีข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>{" "}
        </div>
      </div>
    </div>
  );
}
export default DashboardOverview;
