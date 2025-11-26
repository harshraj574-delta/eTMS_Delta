import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import useSessionStore from "../store/useSessionStore";

const PrivateRoute = ({ element }) => {
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);
  const allowedPaths = useSessionStore((state) => state.allowedPaths); // Subscribe to changes
  const checkAccess = useSessionStore((state) => state.checkAccess);
  const refreshRights = useSessionStore((state) => state.refreshRights);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      refreshRights();
    }
  }, [location.pathname, isAuthenticated, refreshRights]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const isAllowed = checkAccess(location.pathname);

  if (!isAllowed) {
    return <Navigate to="/Unauthorized" replace />;
  }

  return element;
};

export default PrivateRoute;