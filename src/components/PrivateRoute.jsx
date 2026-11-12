import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import useSessionStore, { ACCESS_FOCUS_AGE_MS } from "../store/useSessionStore";
import { USES_GATEWAY } from "../services/http/apiClient";

import Loader from "./common/Loader";

const PrivateRoute = ({ element }) => {
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);
  const allowedPaths = useSessionStore((state) => state.allowedPaths); // Subscribe to changes
  const checkAccess = useSessionStore((state) => state.checkAccess);
  const refreshRights = useSessionStore((state) => state.refreshRights);
  const location = useLocation();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      if (isAuthenticated) {
        // Always refresh rights (cached for 2s) to ensure we are up to date
        // This prevents the "blip" of showing the page before redirecting if rights were revoked
        await refreshRights(false);
        setIsVerifying(false);
      } else {
        setIsVerifying(false);
      }
    };

    verifyAccess();
  }, [location.pathname, isAuthenticated, refreshRights, checkAccess]);

  // Through etms-api: re-read access when the user comes back to the tab, so an
  // admin's change in Access Rights applies without a reload.
  useEffect(() => {
    if (!USES_GATEWAY || !isAuthenticated) return undefined;
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshRights(false, ACCESS_FOCUS_AGE_MS);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isAuthenticated, refreshRights]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (isVerifying) {
    return <Loader />;
  }

  const isAllowed = checkAccess(location.pathname);

  if (!isAllowed) {
    return <Navigate to="/Unauthorized" replace />;
  }

  return element;
};

export default PrivateRoute;