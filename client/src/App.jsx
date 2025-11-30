// 1. เพิ่ม Outlet ใน import
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { useContext } from "react";
import axios from "axios";
import Login from "./pages/Login";

import UserDashboard from "./pages/user/UserDashboard";
import UserHome from "./pages/user/UserHomePage";
import Attendance from "./pages/user/Attendance";
import Schedule from "./pages/user/Schedule";
import Leave from "./pages/user/Leave";

import Navbar from "./components/Navbar";

// Admin Components
import AdminLayout from "./pages/AdminLayout";
import DashboardOverview from "./pages/admin/DashboardOverview";
import ManageEmployees from "./pages/admin/ManageEmployees";
import Settings from "./pages/admin/Settings";
import AttendanceOverView from "./pages/admin/AttendanceOverView";
import ManageTime from "./pages/admin/ManageTime";
import ManageShift from "./pages/admin/ManageShifts";

const token = localStorage.getItem("token");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return null; // หรือใส่ <div className="p-4">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const UserLayout = () => {
  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4">
        <Outlet />
      </div>
    </>
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
            <Route path="attendance" element={<Attendance />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="leave" element={<Leave />} />
            <Route path="time-stamp" element={<UserDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
