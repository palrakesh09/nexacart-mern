import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/slices/authSlice";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const user = useSelector(selectCurrentUser);

  if (!user?.token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/products" replace />;
  }

  return children;
};

export default ProtectedRoute;
