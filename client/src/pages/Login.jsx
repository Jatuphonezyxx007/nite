import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import niteLogo from "../assets/nite-logo.svg";
import "./Login.css"; // อย่าลืม Import ไฟล์ CSS นะครับ

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${apiUrl}/api/auth/login`, {
        email,
        password,
      });
      login(res.data.token);

      Swal.fire({
        icon: "success",
        title: "Welcome Back!",
        text: `สวัสดีคุณ ${res.data.user.name}`,
        timer: 2000,
        showConfirmButton: false,
      });

      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      Swal.fire(
        "Login Failed",
        err.response?.data?.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        "error"
      );
    }
  };

  return (
    <div className="login-bg">
      <div className="glass-card card-padding">
        {/* Header Section */}
        <div className="text-center mb-4">
          <img
            src={niteLogo}
            alt="Nite Logo"
            className="logo-img mb-3"
            style={{
              height: "auto",
              filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))",
            }}
          />
          <h5 className="text-white-50 fw-bold">ยินดีต้อนรับ</h5>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit}>
          <div className="form-floating mb-3">
            <input
              type="email"
              className="form-control rounded-3"
              id="floatingInput"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label htmlFor="floatingInput">Email address</label>
          </div>

          <div className="form-floating mb-4">
            <input
              type="password"
              className="form-control rounded-3"
              id="floatingPassword"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label htmlFor="floatingPassword">Password</label>
          </div>

          <button
            type="submit"
            className="btn btn-nite w-100 py-3 rounded-3 fs-5"
          >
            เข้าสู่ระบบ
          </button>
        </form>

        {/* Footer / Help Section */}
        <div className="mt-4 pt-3 border-top border-white border-opacity-10 text-center">
          <small className="text-white-50 d-block mb-2">
            ติดปัญหาการใช้งาน?
          </small>
          <a href="tel:0889979999" className="text-decoration-none">
            <span className="badge bg-white bg-opacity-10 text-white fw-normal px-3 py-2 border border-white border-opacity-25 hover-effect">
              <i className="bi bi-telephone-fill me-2 text-warning"></i>
              088-997-9999
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;
