import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoutes";
import CitizenDashboard from "./pages/CitizenDashboard";
import OfficerDashboard from "./pages/OfficerDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ComplaintDetails from "./pages/ComplaintDetails";
import EditComplaint from "./pages/EditComplaint";
import NewComplaint from "./pages/NewComplaint";
import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import Home from "./pages/Homepage";
import ProfilePage from "./pages/ProfilePage";
import { ToastProvider } from "./context/ToastContext";
import {useEffect} from "react"


function App() {
  useEffect(() => {
    console.log("API URL:", import.meta.env.VITE_API_URL);
  }, []);
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* ===== PUBLIC ROUTES ===== */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* ===== PROTECTED ROUTES ===== */}

            {/* CITIZEN DASHBOARD */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["CITIZEN"]}>
                  <CitizenDashboard />
                </ProtectedRoute>
              }
            />

            {/* OFFICER DASHBOARD */}
            <Route
              path="/officer-dashboard"
              element={
                <ProtectedRoute allowedRoles={["OFFICER"]}>
                  <OfficerDashboard />
                </ProtectedRoute>
              }
            />

            {/* SUPERVISOR DASHBOARD */}
            <Route
              path="/supervisor-dashboard"
              element={
                <ProtectedRoute allowedRoles={["SUPERVISOR"]}>
                  <SupervisorDashboard />
                </ProtectedRoute>
              }
            />

            {/* ADMIN DASHBOARD */}
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

           
            <Route
              path="/profile"
              element={
                <ProtectedRoute
                  allowedRoles={["CITIZEN", "OFFICER", "SUPERVISOR", "ADMIN"]}
                >
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/complaints/new"
              element={
                <ProtectedRoute allowedRoles={["CITIZEN"]}>
                  <NewComplaint />
                </ProtectedRoute>
              }
            />
            <Route
              path="/complaints/:id"
              element={
                <ProtectedRoute
                  allowedRoles={["CITIZEN", "OFFICER", "SUPERVISOR", "ADMIN"]}
                >
                  <ComplaintDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/complaints/:id/edit"
              element={
                <ProtectedRoute
                  allowedRoles={["CITIZEN", "OFFICER", "SUPERVISOR", "ADMIN"]}
                >
                  <EditComplaint />
                </ProtectedRoute>
              }
            />

            {/* ===== FALLBACK ===== */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
