import React, { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import dayjs from "dayjs";
import "dayjs/locale/th"; // ใช้ภาษาไทย
import Swal from "sweetalert2";

// ตั้งค่าภาษาไทยให้ dayjs
dayjs.locale("th");

const UserHomePage = () => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [attendanceType, setAttendanceType] = useState(""); // 'IN' หรือ 'OUT'
  const webcamRef = useRef(null);

  // Mockup ข้อมูลตารางงาน (ของจริงต้องดึงจาก API)
  const [workSchedule, setWorkSchedule] = useState([
    {
      date: "2023-11-28",
      day: "พฤหัสบดี",
      shift: "08:00 - 17:00",
      status: "ปกติ",
    },
    {
      date: "2023-11-29",
      day: "ศุกร์",
      shift: "08:00 - 17:00",
      status: "ปกติ",
    },
    { date: "2023-11-30", day: "เสาร์", shift: "-", status: "วันหยุด" },
  ]);

  // นาฬิกาเดินตลอดเวลา
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ฟังก์ชันเปิดกล้อง
  const handleOpenCheckIn = (type) => {
    setAttendanceType(type);
    setIsCameraOpen(true);
  };

  // ฟังก์ชันถ่ายรูปและบันทึก
  const captureAndSubmit = useCallback(async () => {
    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) return;

    // TODO: ตรงนี้คือจุดที่ต้อง Call API (Axios)
    // ส่ง { image: imageSrc, type: attendanceType, timestamp: ... } ไปที่ Back-end
    console.log("Image Captured:", imageSrc); // รูปเป็น Base64 string

    // จำลองการบันทึกสำเร็จ
    setIsCameraOpen(false);

    await Swal.fire({
      icon: "success",
      title: `บันทึก${attendanceType === "IN" ? "เข้างาน" : "ออกงาน"}สำเร็จ`,
      text: `เวลา: ${dayjs().format("HH:mm:ss")}`,
      timer: 2000,
      showConfirmButton: false,
    });
  }, [webcamRef, attendanceType]);

  return (
    <div className="container mt-5 pt-5 pb-5">
      {/* --- Section 1: Header & Clock --- */}
      <div className="row mb-4">
        <div className="col-12 text-center">
          <h2 className="fw-bold text-primary">ระบบลงเวลาทำงาน</h2>
          <p className="text-secondary">สวัสดี, จตุพล (Software Engineer)</p>

          <div
            className="card border-0 shadow-sm mx-auto"
            style={{ maxWidth: "400px" }}
          >
            <div className="card-body bg-light rounded-4">
              <h1 className="display-4 fw-bold text-dark mb-0">
                {currentTime.format("HH:mm:ss")}
              </h1>
              <p className="mb-0 text-muted">
                {currentTime.format("DD MMMM YYYY")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Section 2: Action Buttons --- */}
      <div className="row justify-content-center mb-5 gap-3">
        <div className="col-auto">
          <button
            className="btn btn-success btn-lg px-5 py-3 rounded-pill shadow hover-scale"
            onClick={() => handleOpenCheckIn("IN")}
          >
            <i className="bi bi-box-arrow-in-right me-2"></i> บันทึกเข้างาน
          </button>
        </div>
        <div className="col-auto">
          <button
            className="btn btn-danger btn-lg px-5 py-3 rounded-pill shadow hover-scale"
            onClick={() => handleOpenCheckIn("OUT")}
          >
            <i className="bi bi-box-arrow-left me-2"></i> บันทึกออกงาน
          </button>
        </div>
      </div>

      {/* --- Section 3: Camera Modal (Overlay) --- */}
      {isCameraOpen && (
        <div className="camera-overlay">
          <div className="camera-container bg-white p-3 rounded-4 shadow-lg">
            <h5 className="text-center mb-3">
              กรุณาถ่ายรูปเพื่อยืนยัน (
              {attendanceType === "IN" ? "เข้างาน" : "ออกงาน"})
            </h5>

            <div className="webcam-wrapper rounded-3 overflow-hidden mb-3">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
                videoConstraints={{ facingMode: "user" }}
              />
            </div>

            <div className="d-flex justify-content-center gap-2">
              <button
                className="btn btn-secondary rounded-pill px-4"
                onClick={() => setIsCameraOpen(false)}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-primary rounded-pill px-4"
                onClick={captureAndSubmit}
              >
                <i className="bi bi-camera me-1"></i> ถ่ายรูปและบันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Section 4: Work Schedule Table --- */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold border-start border-4 border-primary ps-3">
                📅 ตารางงานสัปดาห์นี้
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="py-3 ps-4">วันที่</th>
                      <th>วัน</th>
                      <th>กะงาน</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workSchedule.map((item, index) => (
                      <tr key={index}>
                        <td className="ps-4 fw-medium">
                          {dayjs(item.date).format("DD/MM/YYYY")}
                        </td>
                        <td>{item.day}</td>
                        <td>
                          <span
                            className={`badge rounded-pill ${
                              item.shift === "-"
                                ? "bg-secondary"
                                : "bg-info text-dark"
                            }`}
                          >
                            {item.shift}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge rounded-pill ${
                              item.status === "วันหยุด"
                                ? "bg-danger"
                                : "bg-success"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserHomePage;
