import { Navigate, useLocation } from "react-router-dom";

const PrivateRoute = ({ element }) => {
  const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
  const allowedMenusRaw = sessionStorage.getItem("allowedMenus");
  const allowedMenus = allowedMenusRaw ? JSON.parse(allowedMenusRaw) : [];

  const location = useLocation();
  const currentPath = location.pathname.replace(/^\/+/, ""); // e.g., "Dashboard"

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const isAllowed = allowedMenus.includes(currentPath);

  if (!isAllowed) {
    return <Navigate to="/" replace />; // unauthorized redirect to login
  }

  return element;
};

export default PrivateRoute;