import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { useContext } from "react";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";

// Admin Components
import AdminLayout from "./pages/AdminLayout";
import DashboardOverview from "./pages/admin/DashboardOverview";
import ManageEmployees from "./pages/admin/ManageEmployees";
import AttendanceCheck from "./pages/admin/AttendanceCheck";
import Settings from "./pages/admin/Settings";

const ProtectedRoute = ({ children, role }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin Routes แบบ Nested */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* เมื่อเข้า /admin เฉยๆ ให้เด้งไป dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardOverview />} />
            <Route path="users" element={<ManageEmployees />} />
            <Route path="attendance" element={<AttendanceCheck />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* User Route */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
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
