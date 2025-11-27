import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import Swal from "sweetalert2";
import "./AttendanceOverView.css";

// Register ChartJS
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
);
ChartJS.defaults.font.family = "'Kanit', sans-serif";
ChartJS.defaults.color = "#6c757d";

function AttendanceOverView() {
  const [filterType, setFilterType] = useState("today");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time Clock Effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Mock Data: Stats ---
  const stats = {
    totalEmployees: 45,
    present: 38,
    late: 5,
    leave: 2,
  };

  // --- Charts Data (เหมือนเดิม แต่ปรับสีนิดหน่อย) ---
  const doughnutData = {
    labels: [
      "มาปกติ (On Time)",
      "สาย (Late)",
      "ลา (Leave)",
      "กำลังทำงาน (Working)",
    ],
    datasets: [
      {
        data: [30, 5, 2, 8], // สมมติว่ามีคนยังไม่ตอกบัตรออก
        backgroundColor: ["#198754", "#ffc107", "#dc3545", "#0dcaf0"],
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { usePointStyle: true, padding: 20 },
      },
    },
  };

  const barData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "มาปกติ",
        data: [40, 42, 38, 41, 39, 15, 10],
        backgroundColor: "#0d6efd",
        borderRadius: 4,
      },
      {
        label: "สาย",
        data: [2, 1, 5, 2, 3, 0, 0],
        backgroundColor: "#ffc107",
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top", align: "end" } },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        grid: { color: "#f1f5f9", borderDash: [5, 5] },
        border: { display: false },
      },
    },
  };

  // --- Mock Data List (เพิ่ม Shift และ Status 'working') ---
  const attendanceLogs = [
    {
      id: 1,
      emp_code: "00101",
      name: "สมชาย ใจดี",
      shift: "08:00 - 17:00",
      timeIn: "07:55",
      timeOut: "17:05",
      status: "ontime",
      totalHours: "9h 10m",
      date: "2023-10-25",
    },
    {
      id: 2,
      emp_code: "00102",
      name: "วิภาดา รักสวย",
      shift: "08:00 - 17:00",
      timeIn: "08:15",
      timeOut: "17:30",
      status: "late",
      totalHours: "9h 15m",
      date: "2023-10-25",
    },
    {
      id: 3,
      emp_code: "00103",
      name: "ณัฐพล คนเก่ง",
      shift: "09:00 - 18:00",
      timeIn: "08:50",
      timeOut: "-",
      status: "working",
      totalHours: "-",
      date: "2023-10-25",
    }, // Working status
    {
      id: 4,
      emp_code: "00104",
      name: "John Doe",
      shift: "08:00 - 17:00",
      timeIn: "-",
      timeOut: "-",
      status: "leave",
      totalHours: "0h",
      date: "2023-10-25",
    },
    {
      id: 5,
      emp_code: "00105",
      name: "Sarah Smith",
      shift: "Night (22:00 - 07:00)",
      timeIn: "21:50",
      timeOut: "07:00",
      status: "ontime",
      totalHours: "9h 10m",
      date: "2023-10-25",
    },
  ];

  // 1. Export ภาพรวม (Summary)
  const handleExportSummary = () => {
    Swal.fire({
      icon: "success",
      title: "Exporting Summary...",
      text: "ดาวน์โหลดรายงานสรุปภาพรวมสำเร็จ (Excel/CSV)",
      timer: 2000,
      showConfirmButton: false,
    });
  };

  // 2. Export รายบุคคล (Individual)
  const handleExportPersonal = (name) => {
    Swal.fire({
      icon: "info",
      title: `Generating Report for ${name}`,
      text: "กำลังสร้างรายงานประวัติการเข้างานรายบุคคล...",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  return (
    <div className="overview-container p-4 fade-in">
      {/* 1. Header & Controls */}
      <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center mb-4 gap-3">
        <div>
          <h2
            className="fw-bold text-dark m-0 d-flex align-items-center gap-2"
            style={{ letterSpacing: "-0.5px" }}
          >
            Attendance Hub{" "}
            <span
              className="badge bg-primary rounded-pill fs-6 align-middle"
              style={{ fontWeight: 400 }}
            >
              Overview
            </span>
          </h2>
          <p className="text-muted m-0 mt-1">
            ศูนย์กลางข้อมูลการลงเวลา ตรวจสอบสถานะ และออกรายงาน
          </p>
        </div>

        {/* Right Side: Clock & Main Actions */}
        <div className="d-flex flex-wrap align-items-center gap-3">
          {/* Digital Clock */}
          <div className="digital-clock d-none d-md-flex">
            <span className="material-symbols-outlined">schedule</span>
            {currentTime.toLocaleTimeString("th-TH")}
          </div>

          <select
            className="form-select-modern"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="today">📅 วันนี้ (Today)</option>
            <option value="week">📅 สัปดาห์นี้ (Week)</option>
            <option value="month">📅 เดือนนี้ (Month)</option>
          </select>

          <button className="btn-modern-primary" onClick={handleExportSummary}>
            <span className="material-symbols-outlined">description</span>
            สรุปรายงาน (Summary)
          </button>
        </div>
      </div>

      {/* 2. Stats Cards */}
      <div className="row g-4 mb-4">
        {/* ... (การ์ด 4 ใบเดิม แต่เพิ่มการ์ดที่ 5 หรือปรับให้กระชับได้ตามต้องการ) ... */}
        <div className="col-xl-3 col-md-6">
          <div className="stat-card primary">
            <div className="stat-header">
              <span className="stat-title">พนักงานทั้งหมด</span>
              <div className="stat-icon">
                <span className="material-symbols-outlined">groups</span>
              </div>
            </div>
            <div className="stat-value">{stats.totalEmployees}</div>
            <small className="text-muted">Active Users</small>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="stat-card success">
            <div className="stat-header">
              <span className="stat-title text-success">เข้างานแล้ว</span>
              <div className="stat-icon">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
            </div>
            <div className="stat-value text-success">{stats.present}</div>
            <small className="text-success opacity-75">98% On Time</small>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="stat-card warning">
            <div className="stat-header">
              <span className="stat-title text-warning">สาย (Late)</span>
              <div className="stat-icon">
                <span className="material-symbols-outlined">
                  running_with_errors
                </span>
              </div>
            </div>
            <div className="stat-value text-warning">{stats.late}</div>
            <small className="text-warning opacity-75">+15 นาทีโดยเฉลี่ย</small>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="stat-card danger">
            <div className="stat-header">
              <span className="stat-title text-danger">ขาด/ลา</span>
              <div className="stat-icon">
                <span className="material-symbols-outlined">person_off</span>
              </div>
            </div>
            <div className="stat-value text-danger">{stats.leave}</div>
            <small className="text-muted">Sick Leave</small>
          </div>
        </div>
      </div>

      {/* 3. Charts Section */}
      <div className="row g-4 mb-5">
        <div className="col-lg-4">
          <div className="chart-card">
            <div className="chart-header">
              <div className="chart-title">สัดส่วนวันนี้</div>
            </div>
            <div style={{ height: "280px", position: "relative" }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
        </div>
        <div className="col-lg-8">
          <div className="chart-card">
            <div className="chart-header">
              <div className="chart-title">สถิติย้อนหลัง 7 วัน</div>
            </div>
            <div style={{ height: "280px" }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Detailed Table (The Core) */}
      <div className="table-card">
        <div className="table-header flex-wrap gap-3">
          <h5 className="m-0 fw-bold text-dark d-flex align-items-center">
            <span className="material-symbols-outlined me-2 text-primary">
              table_view
            </span>
            รายการลงเวลา (Attendance Logs)
          </h5>
          <div className="search-modern-wrapper">
            <span className="material-symbols-outlined search-icon">
              search
            </span>
            <input
              type="text"
              className="search-modern-input"
              placeholder="ค้นหาชื่อ, รหัส..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Shift (กะงาน)</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Total Hrs</th>
                <th>Status</th>
                <th className="text-end">Tools</th>
              </tr>
            </thead>
            <tbody>
              {attendanceLogs
                .filter(
                  (log) =>
                    log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    log.emp_code.includes(searchTerm)
                )
                .map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="bg-light rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold shadow-sm"
                          style={{
                            width: "42px",
                            height: "42px",
                            fontSize: "1.1rem",
                          }}
                        >
                          {log.name.charAt(0)}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{log.name}</div>
                          <div
                            className="text-muted small"
                            style={{ fontSize: "0.75rem" }}
                          >
                            ID: {log.emp_code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div
                        className="text-dark fw-medium"
                        style={{ fontSize: "0.9rem" }}
                      >
                        {log.date}
                      </div>
                      <span className="shift-badge">{log.shift}</span>
                    </td>
                    <td
                      className="text-success fw-bold"
                      style={{ fontFamily: "monospace", fontSize: "1rem" }}
                    >
                      {log.timeIn}
                    </td>
                    <td
                      className="text-secondary fw-bold"
                      style={{ fontFamily: "monospace", fontSize: "1rem" }}
                    >
                      {log.timeOut}
                    </td>
                    <td className="text-dark">{log.totalHours}</td>
                    <td>
                      {log.status === "ontime" && (
                        <span className="status-pill ontime">
                          <span className="status-dot"></span> On Time
                        </span>
                      )}
                      {log.status === "late" && (
                        <span className="status-pill late">
                          <span className="status-dot"></span> Late
                        </span>
                      )}
                      {log.status === "leave" && (
                        <span className="status-pill leave">
                          <span className="status-dot"></span> Leave
                        </span>
                      )}
                      {/* Status: Working (Pulse) */}
                      {log.status === "working" && (
                        <span className="status-pill working">
                          <span className="status-dot pulse"></span> Working...
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        {/* ปุ่ม Download รายบุคคล */}
                        <button
                          className="btn btn-light btn-sm rounded-circle text-primary action-btn"
                          title="Download Personal Report"
                          onClick={() => handleExportPersonal(log.name)}
                        >
                          <span className="material-symbols-outlined fs-5">
                            download
                          </span>
                        </button>
                        <button
                          className="btn btn-light btn-sm rounded-circle text-muted action-btn"
                          title="View Details"
                        >
                          <span className="material-symbols-outlined fs-5">
                            visibility
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AttendanceOverView;
