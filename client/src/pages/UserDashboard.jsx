import { useState, useEffect, useContext } from "react";
import WebcamCapture from "../components/WebcamCapture";
import axios from "axios";
import Swal from "sweetalert2";
import { AuthContext } from "../context/AuthContext";

function UserDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [image, setImage] = useState(null);
  const [history, setHistory] = useState([]);
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/attendance/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleClockIn = async () => {
    if (!image) return Swal.fire("Error", "กรุณาถ่ายรูปก่อนลงเวลา", "error");

    try {
      await axios.post(
        `${apiUrl}/api/attendance/clock-in`,
        { image },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire("Success", "ลงเวลาเข้างานสำเร็จ!", "success");
      fetchHistory(); // โหลดข้อมูลใหม่ทันที
      setImage(null); // Reset รูป
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "เกิดข้อผิดพลาด",
        "error"
      );
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>สวัสดี, {user?.name}</h2>
        <button onClick={logout} className="btn btn-outline-danger">
          Logout
        </button>
      </div>

      <div className="row">
        {/* ฝั่งซ้าย: ลงเวลา */}
        <div className="col-md-5 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              ลงเวลาเข้างาน
            </div>
            <div className="card-body text-center">
              <WebcamCapture onCapture={(img) => setImage(img)} />
              {image && <p className="text-success mt-2">บันทึกภาพแล้ว!</p>}
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

        {/* ฝั่งขวา: ประวัติ */}
        <div className="col-md-7">
          <div className="card shadow-sm">
            <div className="card-header bg-secondary text-white">
              ประวัติการลงเวลาล่าสุด
            </div>
            <div className="card-body">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>วันที่</th>
                    <th>เวลาเข้า</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length > 0 ? (
                    history.map((log) => (
                      <tr key={log.id}>
                        <td>{new Date(log.date).toLocaleDateString()}</td>
                        <td>
                          {log.clock_in
                            ? new Date(log.clock_in).toLocaleTimeString()
                            : "-"}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              log.status === "late" ? "bg-danger" : "bg-success"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center">
                        ไม่พบข้อมูล
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
