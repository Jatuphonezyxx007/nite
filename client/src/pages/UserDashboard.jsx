import { useState, useContext } from "react";
import WebcamCapture from "../components/WebcamCapture";
import axios from "axios";
import Swal from "sweetalert2";
import { AuthContext } from "../context/AuthContext";

function UserDashboard() {
  const { user } = useContext(AuthContext);
  const [image, setImage] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleClockIn = async () => {
    if (!image) return Swal.fire("Error", "กรุณาถ่ายรูปก่อนลงเวลา", "error");

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${apiUrl}/api/attendance/clock-in`,
        { image },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire("Success", "ลงเวลาเข้างานสำเร็จ!", "success");
    } catch (error) {
      Swal.fire("Error", "เกิดข้อผิดพลาด", "error");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">สวัสดี, {user.name}</h2>
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">ลงเวลาเข้างาน</div>
        <div className="card-body">
          <WebcamCapture onCapture={(img) => setImage(img)} />
          <hr />
          <button
            onClick={handleClockIn}
            className="btn btn-success w-100 btn-lg"
            disabled={!image}
          >
            Clock In
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
