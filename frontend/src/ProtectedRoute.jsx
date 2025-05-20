import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  // Not authenticated at all
  if (!isAuthenticated) {
    return <Navigate to="/parent/login" state={{ from: location }} replace />;
  }

  // If a specific role is required and user doesn't have it
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on role
    if (user?.role === 'parent') {
      return <Navigate to="/parent" replace />;
    } else if (user?.role === 'driver') {
      return <Navigate to="/driver" replace />;
    } else if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    
    // Fallback to login if role is not recognized
    return <Navigate to="/parent/login" replace />;
  }

  return children;
}