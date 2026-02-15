import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Preloader from "../components/Preloader"; // Import your preloader

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) {
    return <Preloader />;
  }
  if (!isAuthenticated) {
    console.log("ProtectedRoute: Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    console.log(
      "ProtectedRoute: Role not authorized, redirecting to appropriate dashboard",
    );

    // Redirect to appropriate dashboard based on role
    switch (user?.role) {
      case "CITIZEN":
        return <Navigate to="/dashboard" replace />;
      case "OFFICER":
        return <Navigate to="/officer-dashboard" replace />;
      case "SUPERVISOR":
        return <Navigate to="/supervisor-dashboard" replace />;
      case "ADMIN":
        return <Navigate to="/admin-dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
