import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import useSessionStore, { ACCESS_CHECK_INTERVAL_MS } from "../store/useSessionStore";
import { USES_GATEWAY } from "../services/http/apiClient";

import Loader from "./common/Loader";

const PrivateRoute = ({ element }) => {
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);
  // Subscribed so a change in access re-renders this route (and redirects if revoked).
  useSessionStore((state) => state.allowedPaths);
  const access = useSessionStore((state) => state.access);
  const checkAccess = useSessionStore((state) => state.checkAccess);
  const refreshRights = useSessionStore((state) => state.refreshRights);
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      if (!isAuthenticated) {
        setIsVerifying(false);
        return;
      }
      if (USES_GATEWAY && access) {
        // Through etms-api: show the page with the access we have and check the
        // version in the background (a 304 when nothing changed). If the page was
        // revoked, the new access re-renders this route and redirects below.
        setIsVerifying(false);
        refreshRights();
        return;
      }
      // Legacy path, or no access loaded yet: wait for the check before deciding.
      await refreshRights(USES_GATEWAY);
      setIsVerifying(false);
    };

    verifyAccess();
    // `access` is left out on purpose: a new access must not trigger another check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isAuthenticated, refreshRights]);

  // Through etms-api: check again when the user comes back to the tab, and every few
  // minutes while it is visible, so an admin's change in Access Rights applies
  // without a click.
  useEffect(() => {
    if (!USES_GATEWAY || !isAuthenticated) return undefined;
    const checkIfVisible = () => {
      if (document.visibilityState === "visible") refreshRights();
    };
    document.addEventListener("visibilitychange", checkIfVisible);
    const timer = setInterval(checkIfVisible, ACCESS_CHECK_INTERVAL_MS);
    return () => {
      document.removeEventListener("visibilitychange", checkIfVisible);
      clearInterval(timer);
    };
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
