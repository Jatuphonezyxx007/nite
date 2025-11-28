import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { useContext } from "react";
import Login from "./pages/Login";
import UserDashboard from "./pages/user/UserDashboard";
import UserHome from "./pages/user/UserHomePage";

import Navbar from "./components/Navbar";

// Admin Components
import AdminLayout from "./pages/AdminLayout";
import DashboardOverview from "./pages/admin/DashboardOverview";
import ManageEmployees from "./pages/admin/ManageEmployees";
// import AttendanceCheck from "./pages/admin/AttendanceCheck"; // อาจจะไม่ได้ใช้แล้วถ้ามีหน้ารายละเอียด
import Settings from "./pages/admin/Settings";
import AttendanceOverView from "./pages/admin/AttendanceOverView";
import ManageTime from "./pages/admin/ManageTime";
import ManageShift from "./pages/admin/ManageShifts";

const ProtectedRoute = ({ children, role }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          {/* --- Admin Routes --- */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                {/* AdminLayout เป็นตัวแม่ คุม Layout ทั้งหมดแล้ว */}
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* Redirect index ไป dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />

            <Route path="dashboard" element={<DashboardOverview />} />
            <Route path="users" element={<ManageEmployees />} />

            {/* Group: Attendance (ไม่ต้องใส่ AdminLayout ซ้ำตรงนี้!) */}
            <Route path="attendance">
              {/* ถ้าเข้า /admin/attendance เฉยๆ ให้เด้งไป overview */}
              <Route index element={<Navigate to="overview" replace />} />

              {/* Route ย่อย: /admin/attendance/overview */}
              <Route path="overview" element={<AttendanceOverView />} />
              <Route path="manage" element={<ManageTime />} />
              <Route path="shifts" element={<ManageShift />} />

              {/* คุณสามารถเพิ่ม Route ย่อยอื่นๆ ตรงนี้ได้ เช่น */}
              {/* <Route path="manage" element={<AttendanceManage />} /> */}
              {/* <Route path="shifts" element={<AttendanceShifts />} /> */}
            </Route>

            <Route path="settings" element={<Settings />} />
          </Route>

          {/* --- User Route --- */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Navbar />
                <UserHome />
              </ProtectedRoute>
            }
          />

          <Route
            path="/time-stamp"
            element={
              <ProtectedRoute>
                <Navbar />
                <UserDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
