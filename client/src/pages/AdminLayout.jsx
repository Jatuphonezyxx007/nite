import { useContext } from "react";
import { Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";

function AdminLayout() {
  const { logout } = useContext(AuthContext);

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* Sidebar อยู่ซ้ายตลอด */}
      <AdminSidebar logout={logout} />

      {/* พื้นที่แสดงผลเนื้อหา (เปลี่ยนไปตาม Route) */}
      <div
        className="flex-grow-1 p-4"
        style={{ overflowY: "auto", maxHeight: "100vh" }}
      >
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
