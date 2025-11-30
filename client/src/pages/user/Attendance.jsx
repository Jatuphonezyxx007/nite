import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import "./Attendance.css";

const Attendance = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [image, setImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // --- Mockup Status Logic ---
  // จำลองว่าเข้างาน 09:00 น.
  const WORK_START_TIME = 9;
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  // Logic จำลองสถานะ (ถ้าสายกว่า 9 โมงถือว่า Late)
  const isLate =
    currentHour > WORK_START_TIME ||
    (currentHour === WORK_START_TIME && currentMinute > 0);
  const statusText = isLate ? "สาย (Late)" : "ปกติ (On Time)";
  const statusColor = isLate ? "warning" : "success";
  const statusIcon = isLate ? "running_with_errors" : "check_circle";

  // 1. นาฬิกา Real-time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. จัดการกล้อง (Start/Stop)
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, // ใช้กล้องหน้า
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      Swal.fire(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งาน",
        "error"
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  };

  // 3. ถ่ายภาพ
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      // ตั้งค่าขนาด Canvas ตาม Video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // วาดภาพจาก Video ลง Canvas
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // แปลงเป็น Base64
      const imgUrl = canvas.toDataURL("image/png");
      setImage(imgUrl);
      stopCamera(); // ปิดกล้องหลังถ่ายเสร็จ
    }
  };

  // 4. ถ่ายใหม่
  const retakePhoto = () => {
    setImage(null);
    startCamera();
  };

  // 5. บันทึกข้อมูล (Mock API)
  const handleSubmit = () => {
    if (!image) return;

    Swal.fire({
      title: "กำลังบันทึก...",
      text: "กรุณารอสักครู่",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    // Simulate API Call
    setTimeout(() => {
      Swal.fire({
        icon: "success",
        title: "บันทึกเวลาสำเร็จ",
        text: `คุณลงเวลาเมื่อ ${currentTime.toLocaleTimeString(
          "th-TH"
        )} (${statusText})`,
        confirmButtonColor: "#1e2a45",
      }).then(() => {
        // Reset state หรือ Redirect ตาม Flow งานจริง
        setImage(null);
        startCamera();
      });
    }, 1500);
  };

  // เริ่มกล้องอัตโนมัติเมื่อเข้าหน้าเว็บ
  useEffect(() => {
    startCamera();
    return () => stopCamera(); // Cleanup เมื่อออกจากหน้า
  }, []);

  return (
    <div className="attendance-page fade-in">
      <div className="container-xl attendance-container">
        {/* Header Section */}
        <div className="text-center mb-4">
          <h2 className="fw-bold text-dark m-0">ลงเวลาเข้า-ออกงาน</h2>
          <p className="text-muted">Attendance Check-in / Check-out</p>
        </div>

        <div className="row g-4 align-items-stretch">
          {/* Left Column: Time & Status Info */}
          <div className="col-lg-5 order-2 order-lg-1">
            <div className="card h-100 border-0 shadow-sm rounded-4 p-4 d-flex flex-column justify-content-between">
              {/* Clock Section */}
              <div className="text-center py-4">
                <div className="digital-clock-large mb-2">
                  {currentTime.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
                <div className="date-display text-muted">
                  {currentTime.toLocaleDateString("th-TH", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>

              {/* Status Alert Card (Mockup) */}
              <div className={`alert-card ${statusColor} mb-4`}>
                <div className="alert-icon">
                  <span className="material-symbols-rounded">{statusIcon}</span>
                </div>
                <div className="alert-content">
                  <span className="alert-label">สถานะการลงเวลา</span>
                  <strong className="alert-value">{statusText}</strong>
                  <small className="alert-desc">
                    {isLate
                      ? "คุณลงเวลาเกินกำหนด 09:00 น."
                      : "ขอบคุณที่เข้างานตรงเวลาครับ"}
                  </small>
                </div>
              </div>

              {/* Instructions */}
              <div className="instruction-box">
                <h6>
                  <span className="material-symbols-rounded align-middle me-1">
                    face
                  </span>{" "}
                  ข้อแนะนำ
                </h6>
                <ul className="small text-muted m-0 ps-3">
                  <li>กรุณาถอดหน้ากากอนามัยและแว่นตากันแดด</li>
                  <li>ให้แน่ใจว่าใบหน้าอยู่ในกรอบที่กำหนด</li>
                  <li>แสงสว่างเพียงพอต่อการระบุตัวตน</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Camera & Actions */}
          <div className="col-lg-7 order-1 order-lg-2">
            <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative bg-dark">
              {/* Camera Area */}
              <div className="camera-viewport">
                {!image ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="camera-feed"
                    ></video>
                    {/* Face Guide Overlay */}
                    <div className="face-guide-overlay">
                      <div className="scan-line"></div>
                      <div className="corner top-left"></div>
                      <div className="corner top-right"></div>
                      <div className="corner bottom-left"></div>
                      <div className="corner bottom-right"></div>
                    </div>
                  </>
                ) : (
                  <img src={image} alt="Captured" className="captured-image" />
                )}
                {/* Hidden Canvas for processing */}
                <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
              </div>

              {/* Action Buttons Area */}
              <div className="camera-controls p-4 bg-white border-top">
                {!image ? (
                  <div className="d-flex justify-content-center">
                    <button
                      className="btn-capture"
                      onClick={capturePhoto}
                      disabled={!isCameraActive}
                    >
                      <span className="material-symbols-rounded">camera</span>
                    </button>
                  </div>
                ) : (
                  <div className="d-flex gap-3 justify-content-center w-100">
                    <button
                      className="btn btn-light btn-lg rounded-pill px-4 fw-bold text-muted"
                      onClick={retakePhoto}
                    >
                      <span className="material-symbols-rounded align-middle me-2">
                        refresh
                      </span>
                      ถ่ายใหม่
                    </button>
                    <button
                      className="btn btn-primary btn-lg rounded-pill px-5 fw-bold"
                      onClick={handleSubmit}
                      style={{ backgroundColor: "#1e2a45", border: "none" }}
                    >
                      <span className="material-symbols-rounded align-middle me-2">
                        check_circle
                      </span>
                      ยืนยันลงเวลา
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
