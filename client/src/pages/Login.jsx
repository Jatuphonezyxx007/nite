import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import niteLogo from "../assets/nite-logo.svg";

function Login() {
  // 1. เปลี่ยน State จาก email เป็น empCode
  const [empCode, setEmpCode] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 2. เปลี่ยน payload ที่ส่งไปหลังบ้านเป็น emp_code
      const res = await axios.post(`${apiUrl}/api/auth/login`, {
        emp_code: empCode,
        password,
      });
      login(res.data.token);

      Swal.fire({
        icon: "success",
        title: "Welcome Back!",
        text: `สวัสดีคุณ ${res.data.user.name_th} ${res.data.user.lastname_th}`,
        timer: 3000,
        showConfirmButton: false,
      });

      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/user");
      }
    } catch (err) {
      Swal.fire(
        "Login Failed",
        // ปรับข้อความ Error ให้สอดคล้อง
        err.response?.data?.message || "รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง",
        "error"
      );
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className="mb-3">
                    <img
                      src={niteLogo}
                      alt="Nite Logo"
                      style={{ height: "60px", width: "auto" }}
                      className="img-fluid"
                    />
                  </div>
                  <h4 className="fw-bold text-dark">ยินดีต้อนรับ</h4>
                  <p className="text-muted small">
                    กรุณาระบุรหัสพนักงานเพื่อเข้าสู่ระบบ
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* 3. แก้ไข Input Field */}
                  <div className="form-floating mb-3">
                    <input
                      type="text" // เปลี่ยนเป็น text เพราะรหัสพนักงานอาจไม่ใช่ format email
                      className="form-control rounded-3 bg-light border-0"
                      id="floatingInput"
                      placeholder="รหัสพนักงาน"
                      value={empCode}
                      onChange={(e) => setEmpCode(e.target.value)}
                      required
                    />
                    <label htmlFor="floatingInput" className="text-muted">
                      {/* เปลี่ยน Icon และ Label */}
                      <i className="bi bi-person-badge me-2"></i>รหัสพนักงาน
                    </label>
                  </div>

                  <div className="form-floating mb-4">
                    <input
                      type="password"
                      className="form-control rounded-3 bg-light border-0"
                      id="floatingPassword"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <label htmlFor="floatingPassword" className="text-muted">
                      <i className="bi bi-key me-2"></i>รหัสผ่าน
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm mb-3 hover-scale"
                    style={{ letterSpacing: "1px" }}
                  >
                    เข้าสู่ระบบ
                  </button>
                </form>

                <div className="mt-4 text-center border-top pt-3">
                  <span className="text-muted small d-block mb-2">
                    ติดปัญหาการใช้งาน?
                  </span>
                  <a href="tel:0889979999" className="text-decoration-none">
                    <div className="d-inline-flex align-items-center justify-content-center px-3 py-2 rounded-pill bg-light text-dark border hover-bg-gray">
                      <i className="bi bi-telephone-fill text-primary me-2"></i>
                      <span className="fw-semibold">088-997-9999</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
            <div className="text-center mt-3 text-muted small">
              &copy; 2025 Nite Project. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
