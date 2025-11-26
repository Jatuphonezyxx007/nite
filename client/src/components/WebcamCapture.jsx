import React, { useRef, useCallback, useState } from "react";
import Webcam from "react-webcam";

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user", // กล้องหน้า
};

const WebcamCapture = ({ onCapture }) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
    onCapture(imageSrc); // ส่ง Base64 กลับไปให้ Parent Component
  }, [webcamRef, onCapture]);

  return (
    <div className="text-center">
      {imgSrc ? (
        <img src={imgSrc} alt="captured" className="img-fluid rounded mb-3" />
      ) : (
        <Webcam
          audio={false}
          height={300}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width="100%"
          videoConstraints={videoConstraints}
          className="rounded mb-3 border"
        />
      )}

      {!imgSrc ? (
        <button onClick={capture} className="btn btn-primary">
          <span className="material-symbols-outlined align-middle me-1">
            photo_camera
          </span>
          ถ่ายรูปยืนยันตัวตน
        </button>
      ) : (
        <button onClick={() => setImgSrc(null)} className="btn btn-warning">
          ถ่ายใหม่
        </button>
      )}
    </div>
  );
};

export default WebcamCapture;
