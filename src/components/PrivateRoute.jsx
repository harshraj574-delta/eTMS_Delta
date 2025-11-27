import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import useSessionStore from "../store/useSessionStore";

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
        // First check locally
        const hasAccess = checkAccess(location.pathname);
        
        if (hasAccess) {
          setIsVerifying(false);
          // Refresh in background to keep updated
          refreshRights(false);
        } else {
          // If denied locally, force refresh from server to be sure
          await refreshRights(true);
          setIsVerifying(false);
        }
      } else {
        setIsVerifying(false);
      }
    };

    verifyAccess();
  }, [location.pathname, isAuthenticated, refreshRights, checkAccess]);

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