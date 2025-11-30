import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import niteLogo from "../assets/nite-logo.svg";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. ยิง API Login (ไม่ต้องมี withCredentials เพราะไม่ได้ใช้ Cookie)
      const res = await axios.post(`${apiUrl}/api/auth/login`, {
        username,
        password,
      });

      // 2. รับ Token และ User Data จาก JSON Response
      const { token, user } = res.data;

      // 3. เรียกฟังก์ชัน login ใน Context เพื่อเก็บ Token
      login(token);

      // 4. แสดง Alert ต้อนรับ
      const displayName = user.name_th
        ? `${user.name_th} ${user.lastname_th}`
        : user.username;

      Swal.fire({
        icon: "success",
        title: "Login Success!",
        text: `ยินดีต้อนรับคุณ ${displayName}`,
        timer: 1500,
        showConfirmButton: false,
      });

      // 5. Redirect ไปตาม Role
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/user");
      }
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Login Failed",
        err.response?.data?.message || "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง",
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
                    กรุณาระบุชื่อผู้ใช้งานเพื่อเข้าสู่ระบบ
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control rounded-3 bg-light border-0"
                      id="floatingInput"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                    <label htmlFor="floatingInput" className="text-muted">
                      <i className="bi bi-person-fill me-2"></i>ชื่อผู้ใช้งาน
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
