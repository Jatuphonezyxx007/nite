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

const UserLayout = () => {
  return (
    <ProtectedRoute>
      <Navbar />
      <div className="container mx-auto p-4">
        <Outlet />
      </div>
    </ProtectedRoute>
  );
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
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardOverview />} />
            <Route path="users" element={<ManageEmployees />} />
            <Route path="attendance">
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<AttendanceOverView />} />
              <Route path="manage" element={<ManageTime />} />
              <Route path="shifts" element={<ManageShift />} />
            </Route>
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* --- User Route --- */}
          <Route
            path="/user"
            element={
              <ProtectedRoute role="user">
                <UserLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<UserHome />} />
            <Route path="time-stamp" element={<UserDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
