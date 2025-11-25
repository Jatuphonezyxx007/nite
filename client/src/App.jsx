import { useState, useEffect } from "react";

function App() {
  const [users, setUsers] = useState([]);

  // ดึงค่าจาก env ของ Vite ด้วยคำสั่ง import.meta.env
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchUsers = async () => {
    try {
      console.log("Fetching from:", apiUrl); // เช็คใน Console ดูได้เลย
      // ใช้ Template Literal เชื่อม URL
      const response = await fetch(`${apiUrl}/api/users`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow">
        <div className="card-header bg-success text-white d-flex align-items-center gap-2">
          {/* ใส่ไอคอนคน (person) ตรงหัวข้อ */}
          <span className="material-symbols-outlined">groups</span>
          <h3 className="m-0">รายชื่อผู้ใช้จาก MySQL</h3>
        </div>{" "}
        <div className="card-body">
          {/* ปุ่มกดเพื่อโหลดข้อมูลใหม่ */}
          <button
            onClick={fetchUsers}
            className="btn btn-primary mb-3 d-flex align-items-center gap-2"
          >
            <span className="material-symbols-outlined">refresh</span>
            โหลดข้อมูลล่าสุด
          </button>
          {/* ตารางแสดงข้อมูล */}
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>ชื่อ (Name)</th>
                <th>อีเมล (Email)</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center text-muted">
                    ไม่พบข้อมูล หรือ ยังไม่ได้เชื่อมต่อ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
