import React, { useEffect, useState, useMemo, useCallback, use } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  LayerGroup,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import polylineUtil from "@mapbox/polyline";
import "leaflet/dist/leaflet.css";
// import ManageRouteService from "../services/compliance/ManageRouteService";
import ManageRouteService from "../services/compliance/ManageRouteService";
// Helper function for retrying failed requests with an async function
const retryAsync = async (asyncFn, args, maxRetries = 3, delay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await asyncFn(args);
    } catch (error) {
      lastError = error;
      console.error(`Request failed (attempt ${i + 1}/${maxRetries}):`, error);
      if (i < maxRetries - 1) {
        console.log(
          `Retrying in ${delay * (i + 1)}ms (attempt ${
            i + 2
          }/${maxRetries})...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError;
};

// Helper function to convert hex color to RGB
const hexToRgb = (hex) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
        result[3],
        16
      )}`
    : null;
};

// Helper function to parse URL query parameters
const getQueryParams = () => {
  const search = window.location.search.substring(1);
  const params = {};
  search.split("&").forEach((param) => {
    const [key, value] = param.split("=");
    if (key && value !== undefined) {
      params[key] = decodeURIComponent(value);
    }
  });
  return params;
};

// Helper for colored SVG marker
function createColoredMarker(color, label) {
  const svg = `
    <svg width="28" height="28" viewBox="0 0 28 28" 
         xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="12" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <text x="14" y="19" text-anchor="middle" font-size="13" font-family="Inter,Arial,sans-serif" 
            fill="#fff" font-weight="bold">${label || ""}</text>
    </svg>
  `;
  return new L.Icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(svg),
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

const colors = [
  "#4285F4",
  "#EA4335",
  "#FBBC05",
  "#34A853",
  "#A142F4",
  "#F44292",
  "#00B8D9",
  "#FF6D01",
  "#46BDC6",
  "#FFB300",
  "#8E24AA",
  "#43A047",
  "#F4511E",
  "#3949AB",
  "#757575",
  "#C0CA33",
  "#D81B60",
  "#00897B",
  "#6D4C41",
  "#7E57C2",
];

function FitMapToRoutes({ routes }) {
  const map = useMap();
  useEffect(() => {
    if (!routes || !routes.length) return;
    let bounds = [];
    routes.forEach((route) => {
      if (route.geometry) {
        try {
          const coords = polylineUtil
            .decode(route.geometry)
            .map((coord) => [coord[0], coord[1]]);
          bounds = bounds.concat(coords);
        } catch (e) {
          console.error("Error decoding polyline for fitBounds:", e);
        }
      }
      if (route.stops) {
        bounds = bounds.concat(
          route.stops
            .filter((stop) => stop.locationY && stop.locationX)
            .map((stop) => [
              parseFloat(stop.locationY),
              parseFloat(stop.locationX),
            ])
        );
      }
    });
    if (bounds.length) {
      // Calculate appropriate padding based on number of routes
      // More routes = more padding to prevent excessive zoom out
      const basePadding = 40;
      const paddingMultiplier = Math.min(1 + (routes.length * 0.05), 2); // Cap at 2x padding
      const padding = Math.floor(basePadding * paddingMultiplier);
      
      // Set a maximum zoom level to prevent excessive zooming out
      // Lower number = more zoomed out
      const maxZoom = routes.length > 10 ? 12 : 
                     routes.length > 5 ? 11 : 
                     routes.length > 1 ? 12 : 13;
      
      map.fitBounds(bounds, { 
        padding: [padding, padding],
        maxZoom: maxZoom
      });
    }
  }, [routes, map]);
  return null;
}

const safeParseJson = (data, fieldName = "response") => {
  let parsedData = data;
  if (typeof parsedData === "string") {
    try {
      parsedData = JSON.parse(parsedData);
    } catch (e) {
      console.error(`Initial JSON.parse failed for ${fieldName}:`, e, data);
      throw new Error(`Invalid JSON string in ${fieldName}`);
    }
  }
  if (typeof parsedData === "string") {
    try {
      parsedData = JSON.parse(parsedData);
    } catch (e) {
      console.warn(
        `Secondary JSON.parse failed for ${fieldName}, using as is:`,
        e,
        parsedData
      );
    }
  }
  return parsedData;
};

const VehicleIcon = ({ type, isActive }) => {
  const getVehicleImage = (type) => {
    switch (type) {
      case "s":
        return "images/icons/letter-s.png";
      case "m":
        return "images/icons/letter-m.png";
      case "l":
        return "images/icons/letter-l.png";
      default:
        return null;
    }
  };
  const imageSrc = getVehicleImage(type);
  if (!imageSrc) return null;
  return (
    <img
      src={imageSrc}
      alt={type.toUpperCase()}
      style={{ width: "20px", height: "20px", opacity: isActive ? 0.7 : 1 }}
      title={`${type.toUpperCase()} Vehicle`}
    />
  );
};
const GuardIcon = ({ isActive }) => (
  <img
    src="images/icons/add_guard.png"
    alt="Guard"
    style={{ width: "20px", height: "20px", opacity: isActive ? 0.7 : 1 }}
    title="Guard Required"
  />
);
const SwappedIcon = ({ isActive }) => (
  <img
    src="images/icons/swap.png"
    alt="Swapped"
    style={{ width: "20px", height: "20px", opacity: isActive ? 0.7 : 1 }}
    title="Swapped Route"
  />
);
const PWDIcon = ({ isActive }) => (
  <img
    src="images/icons/pwd.png"
    alt="PWD"
    style={{ width: "20px", height: "20px", opacity: isActive ? 0.7 : 1 }}
    title="PWD"
  />
);
const MedicalIcon = ({ isActive }) => (
  <img
    src="images/icons/medical.png"
    alt="Medical"
    style={{ width: "20px", height: "20px", opacity: isActive ? 0.7 : 1 }}
    title="Medical Required"
  />
);
const NonMotorableIcon = ({ isActive }) => (
  <img
    src="images/icons/non-motorable.png"
    alt="NMT"
    style={{ width: "20px", height: "20px", opacity: isActive ? 0.7 : 1 }}
    title="Non Motorable"
  />
);

export default function RouteMap() {
  const [allRouteMetas, setAllRouteMetas] = useState([]);
  const [fetchedRoutesData, setFetchedRoutesData] = useState({});
  const [routeVisible, setRouteVisible] = useState({});
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [queryParams, setQueryParams] = useState({});
  const [ParsedRouteStats, setParsedRouteStats] = useState([]);

  useEffect(() => {
    const params = getQueryParams();
    setQueryParams(params);
  }, []);

  const fetchRouteDetailsAndGeometry = useCallback(
    async (routeID, existingRouteMeta) => {
      try {
        const [detailsResponse, geometryResponse] = await Promise.all([
          retryAsync(ManageRouteService.GetRoutesDetailsnew, {
            RouteID: routeID,
            isAdd: 0,
          }),
          retryAsync(ManageRouteService.Get_RouteGeometry, {
            RouteID: routeID,
          }),
        ]);
        const detailsData = safeParseJson(detailsResponse, "details API");
        if (!detailsData || !Array.isArray(detailsData)) {
          throw new Error(
            "Invalid details data structure from GetRoutesDetailsnew"
          );
        }
        let geometryData = safeParseJson(geometryResponse, "geometry API");
        if (Array.isArray(geometryData) && geometryData.length > 0) {
          geometryData = geometryData[0];
        }
        if (!geometryData || !geometryData.geometry) {
          throw new Error(
            "Invalid geometry data structure from Get_RouteGeometry"
          );
        }
        const stops = detailsData.map((emp) => ({
          stopNo: emp.stopNo,
          address: emp.address,
          empCode: emp.empCode,
          empName: emp.empName,
          eta: emp.ETA,
          locationX: emp.GeoX,
          locationY: emp.GeoY,
          gender: emp.Gender
        }));
        return {
          ...existingRouteMeta,
          routeid: routeID,
          geometry: geometryData.geometry,
          stops,
          facility: {
            facilityGeoX: detailsData[0]?.facGeoX,
            facilityGeoY: detailsData[0]?.facGeoY,
          },
        };
      } catch (err) {
        console.error(`Error fetching full data for route ${routeID}:`, err);
        setError(`Failed to load details for route ${routeID}. ${err.message}`);
        return null;
      }
    },
    []
  );

  useEffect(() => {
    if (
      !queryParams.sDate ||
      !queryParams.FacilityID ||
      !queryParams.TripType
    ) {
      setLoading(false);
      return;
    }
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      setAllRouteMetas([]);
      setFetchedRoutesData({});
      setRouteVisible({});
      setShowAll(false);
      try {
        const apiParams = {
          sDate: queryParams.sDate,
          eDate: queryParams.sDate,
          FacilityID: queryParams.FacilityID,
          TripType: queryParams.TripType,
          Shifttimes: queryParams.Shifttimes || "0900",
          OrderBy: "Colony",
          Direction: queryParams.Direction || "ASC",
          Routeid: "",
          occ_seater: -2,
        };
        const routesResponse = await retryAsync(
          ManageRouteService.GetRoutesByOrder,
          apiParams
        );
        const parsedRoutesMeta = safeParseJson(
          routesResponse,
          "GetRoutesByOrder"
        );
        const routeStats = {
          sdate: queryParams.sDate,
          edate: queryParams.sDate,
          triptype: queryParams.TripType,
          facilityid: queryParams.FacilityID,
          shifttime:  queryParams.Shifttimes || "0900",
        }

        const routeStatsResponse = await retryAsync(
          ManageRouteService.GetRoutesStatistics,
          routeStats
        );
        const parsedRouteStats = safeParseJson(routeStatsResponse, "GetRouteStats");
        console.log("Route Stats:", parsedRouteStats);      
        setParsedRouteStats(parsedRouteStats);

        if (!parsedRoutesMeta || !Array.isArray(parsedRoutesMeta)) {
          throw new Error(
            "Invalid response from GetRoutesByOrder: expected array"
          );
        }
       // console.log("Parsed Routes Meta:", parsedRoutesMeta);
        setAllRouteMetas(parsedRoutesMeta);
        if (parsedRoutesMeta.length > 0) {
          const firstRouteMeta = parsedRoutesMeta[0];
          const firstRouteFullData = await fetchRouteDetailsAndGeometry(
            firstRouteMeta.RouteID,
            firstRouteMeta
          );
          if (firstRouteFullData) {
            setFetchedRoutesData((prev) => ({
              ...prev,
              [firstRouteMeta.RouteID]: firstRouteFullData,
            }));
            setRouteVisible({ [firstRouteMeta.RouteID]: true });
          } else {
            setError(
              `Failed to load data for the first route (${firstRouteMeta.RouteID}).`
            );
          }
        }
      } catch (err) {
        console.error("Error fetching initial route data:", err);
        setError(err.message || "Error during initial load.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [queryParams, fetchRouteDetailsAndGeometry]);

  const displayRoutes = useMemo(() => {
    return allRouteMetas.map((meta) => {
      const fetchedDetail = fetchedRoutesData[meta.RouteID];
      if (fetchedDetail) return fetchedDetail;
      return {
        ...meta,
        routeid: meta.RouteID,
        stops: [],
        geometry: null,
        facility: {},
      };
    });
  }, [allRouteMetas, fetchedRoutesData]);

  const routesForMap = useMemo(() => {
    return displayRoutes.filter(
      (route) => routeVisible[route.routeid] && route.geometry
    );
  }, [displayRoutes, routeVisible]);

  const totalDistance = useMemo(
    () =>
      allRouteMetas.reduce(
        (sum, route) => sum + (parseFloat(route.totaldist) || 0),
        0
      ),
    [allRouteMetas]
  );
  const totalEmployees = useMemo(
    () =>
      allRouteMetas.reduce(
        (sum, route) => sum + (parseInt(route.totalStop, 10) || 0),
        0
      ),
    [allRouteMetas]
  );
  // const avgOccupancy = useMemo(() => {
  //   return allRouteMetas.length > 0 && totalEmployees > 0
  //     ? (totalEmployees / allRouteMetas.length).toFixed(2)
  //     : "0.0";
  // }, [allRouteMetas, totalEmployees]);

  const handleToggleAll = async (checked) => {
    setShowAll(checked);
    if (checked) {
      setLoading(true);
      const routesToFetchDetailsFor = allRouteMetas.filter(
        (meta) => !fetchedRoutesData[meta.RouteID]
      );
      const newDetailsPromises = routesToFetchDetailsFor.map((meta) =>
        fetchRouteDetailsAndGeometry(meta.RouteID, meta)
      );
      try {
        const newlyFetchedDetails = await Promise.all(newDetailsPromises);
        const newFetchedDataUpdate = {};
        newlyFetchedDetails.forEach((routeData) => {
          if (routeData) newFetchedDataUpdate[routeData.routeid] = routeData;
        });
        setFetchedRoutesData((prev) => ({ ...prev, ...newFetchedDataUpdate }));
        const allVisible = {};
        allRouteMetas.forEach((meta) => (allVisible[meta.RouteID] = true));
        setRouteVisible(allVisible);
      } catch (err) {
        setError("Some routes could not be loaded. " + err.message);
        const currentVis = { ...routeVisible };
        allRouteMetas.forEach((meta) => {
          if (
            fetchedRoutesData[meta.RouteID] ||
            newFetchedDataUpdate[meta.RouteID]
          ) {
            currentVis[meta.RouteID] = true;
          }
        });
        setRouteVisible(currentVis);
      } finally {
        setLoading(false);
      }
    } else {
      const noneVisible = {};
      allRouteMetas.forEach((meta) => (noneVisible[meta.RouteID] = false));
      setRouteVisible(noneVisible);
    }
  };

  const handleToggleRoute = async (routeid) => {
    const isCurrentlyVisible = !!routeVisible[routeid];
    const makeVisible = !isCurrentlyVisible;
    let operationSuccess = true;
    if (makeVisible && !fetchedRoutesData[routeid]) {
      setLoading(true);
      const routeMeta = allRouteMetas.find((meta) => meta.RouteID === routeid);
      if (routeMeta) {
        const routeFullData = await fetchRouteDetailsAndGeometry(
          routeid,
          routeMeta
        );
        if (routeFullData) {
          setFetchedRoutesData((prev) => ({
            ...prev,
            [routeid]: routeFullData,
          }));
        } else operationSuccess = false;
      } else {
        operationSuccess = false;
        setError(`Route metadata not found for ${routeid}.`);
      }
      setLoading(false);
    }
    if (operationSuccess) {
      setRouteVisible((prev) => {
        const updated = { ...prev, [routeid]: makeVisible };
        setShowAll(
          allRouteMetas.length > 0 &&
            allRouteMetas.every((meta) => updated[meta.RouteID])
        );
        return updated;
      });
    }
  };

  const LoadingScreen = () => (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
      }}
    >
      <div style={{ width: "80px", height: "80px", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            border: "4px solid #e2e8f0",
            borderTopColor: "#3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "60%",
            height: "60%",
            top: "20%",
            left: "20%",
            border: "4px solid #e2e8f0",
            borderTopColor: "#3b82f6",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite reverse",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#1e293b",
            margin: 0,
          }}
        >
          Loading Routes
        </h2>
        <p style={{ fontSize: "16px", color: "#64748b", margin: 0 }}>
          Please wait while we fetch your route data...
        </p>
      </div>
      <style>{`@keyframes spin {0% {transform: rotate(0deg);} 100% {transform: rotate(360deg);}}`}</style>
    </div>
  );

  const ErrorMessage = ({ message }) => (
    <div
      style={{
        position: "fixed",
        top: "24px",
        right: "24px",
        zIndex: 10000,
        background: "white",
        padding: "16px 20px",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        maxWidth: "400px",
        borderLeft: "4px solid #ef4444",
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "#fee2e2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ef4444",
            fontWeight: "600",
          }}
        >
          !
        </div>
        <div>
          <h3
            style={{
              margin: "0 0 4px 0",
              fontSize: "16px",
              fontWeight: "600",
              color: "#1e293b",
            }}
          >
            Error Loading Routes
          </h3>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
            {message}
          </p>
        </div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );

    const componentStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    /* Sidebar Styles */
    .sidebar-react {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 1000;
      background: white;
      padding: 12px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-height: calc(100vh - 40px);
      overflow-y: auto;
      width: 300px;
      font-family: 'Inter', sans-serif;
    }
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 15px;
    }
    .stat-item {
      background: #f8fafc;
      border-radius: 6px;
      padding: 6px;
      transition: all 0.2s ease;
    }
    .stat-item:nth-child(1) { background: #dbeafe; }
    .stat-item:nth-child(2) { background: #dcfce7; }
    .stat-item:nth-child(3) { background: #fef9c3; }
    .stat-item:nth-child(4) { background: #fee2e2; }
    .stat-label {
      color: #475569;
      font-size: 8px;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .stat-value {
      color: #1e293b;
      font-size: 14px;
      font-weight: 600;
    }
    .sidebar-switch-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
      padding: 0 2px;
    }
    .switch-label {
      font-weight: 600;
      color: #1e293b;
      font-size: 15px;
      user-select: none;
    }
    .route-item {
      font-size: 14px;
      padding: 0px;
      margin:0 0 6px 0;
      height: auto;
      width: 100%;
      cursor: pointer;
    }
    .route-summary {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      margin-bottom: 0px;
      transition: all 0.3s ease;
      color: #1e293b;
      font-size: 12px;
      line-height: 1.2;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .route-summary:hover {
      background: #f3f4f6;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    }
    .route-summary.active {
      background-color: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }
    .route-summary.active .route-name span {
        color: white;
    }
    .route-summary .route-name {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .route-icons-container {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
      min-width: fit-content;
    }
    .route-icons-container img {
      width: 20px;
      height: 20px;
      object-fit: contain;
    }
    .route-summary.active .route-icons-container img {
       opacity: 0.7; /* Or your preferred active style */
    }
    .route-summary .route-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      font-size: 14px;
      color: #475569;
    }
    .route-summary .route-stats .stat-item {
      background: #f9fafb;
      border-radius: 6px;
      padding: 6px;
      transition: all 0.3s ease;
    }
    .route-summary .route-stats .stat-item:hover {
      background: #f3f4f6;
    }
    .route-summary .route-stats .stat-label {
      font-weight: 600;
      text-transform: uppercase;
      font-size: 8px;
      color: #6b7280;
    }
    .route-summary .route-stats .stat-value {
      font-weight: 700;
      color: #111827;
      transition: color 0.2s;
    }
    .route-summary.active .route-stats .stat-item {
      background: rgba(255,255,255,0.92);
    }
    .route-summary.active .route-stats .stat-label {
      color: #2563eb;
    }
    .route-summary.active .route-stats .stat-value {
      color: #2563eb;
    }

    /* Popup (Info Window) Styles */
    .info-window {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      max-width: 200px;
      padding: 0;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 6px 20px rgba(0,0,0,0.1);
    }
    .info-header {
      font-weight: 700;
      font-size: 13px;
      padding: 6px 28px 6px 12px; /* Increased right padding for close button */
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--route-color, #2563eb);
      border-bottom: none;
      position: relative;
    }
    .info-header span {
      font-weight: 500;
      color: rgba(255, 255, 255, 0.9);
      background: rgba(0, 0, 0, 0.1);
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 10px;
    }
    .employee-details {
      list-style: none;
      padding: 8px 10px;
      margin: 0;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 4px 8px;
      background: rgba(var(--route-color-rgb, 37, 99, 235), 0.08);
    }
    .employee-details li { display: contents; }
    .employee-details strong {
      color: #475569;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 3px;
      grid-column: 1;
      padding-bottom: 4px;
      border-bottom: 1px solid #cbd5e1;
    }
    /* REMOVED .employee-details strong::before rule from here */
    .employee-details li > span {
      color: #1e293b;
      font-size: 11px;
      font-weight: 500;
      line-height: 1.3;
      text-align: right;
      word-break: break-word;
      grid-column: 2;
      padding-bottom: 4px;
      border-bottom: 1px solid #cbd5e1;
    }
    .employee-details li:last-child strong,
    .employee-details li:last-child span {
        border-bottom: none;
        padding-bottom: 0;
    }

    /* Leaflet Popup Overrides */
    .leaflet-popup-content {
      margin: 0 !important;
      font-family: 'Inter', sans-serif;
      padding: 0 !important;
    }
    .leaflet-popup-content-wrapper {
      border-radius: 8px !important;
      box-shadow: none !important;
      padding: 0 !important;
      background-color: transparent !important;
    }
    .leaflet-popup-tip {
       background-color: white !important;
       box-shadow: none !important;
    }
    .leaflet-popup-close-button {
      color: rgba(255, 255, 255, 0.85) !important;
      font-size: 18px !important;
      font-weight: bold !important;
      line-height: 20px !important;
      text-align: center !important;
      text-decoration: none !important;
      transition: all 0.2s ease !important;
      position: absolute !important;
      top: 4px !important;    /* Adjust to position from top of header */
      right: 4px !important;   /* Adjust to position from right of header */
      width: 20px !important;  /* Smaller clickable area */
      height: 20px !important; /* Smaller clickable area */
      background: transparent !important;
      border-radius: 50% !important; /* Circular button */
      z-index: 10 !important;
      padding: 0 !important;
    }
    .leaflet-popup-close-button:hover {
      color: white !important;
      background: rgba(0, 0, 0, 0.2) !important;
    }
  `;


  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        fontFamily: "'Inter', sans-serif",
        background: "#f6f8fa",
      }}
    >
      <style>{componentStyles}</style>
      {loading && <LoadingScreen />}
      {error && <ErrorMessage message={error} />}
      <div className="sidebar-react">
        <div className="summary-stats">
          <div className="stat-item">
            <div className="stat-label">Routes</div>
            <div className="stat-value">{allRouteMetas.length}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Distance</div>
            <div className="stat-value">{totalDistance.toFixed(1)} km</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Employees</div>
            <div className="stat-value">{totalEmployees}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Avg Occupancy</div>
            <div className="stat-value">{ParsedRouteStats[0]?.AvgOccupancy}</div>
          </div>
        </div>
        <div className="sidebar-switch-row">
          <span className="switch-label">Show All Routes</span>
          <label
            className="switch"
            style={{
              position: "relative",
              display: "inline-block",
              width: 44,
              height: 24,
            }}
          >
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => handleToggleAll(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              className="slider"
              style={{
                position: "absolute",
                cursor: "pointer",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: showAll ? "#3b82f6" : "#e5e7eb",
                transition: ".3s",
                borderRadius: 24,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  content: '""',
                  height: 18,
                  width: 18,
                  left: showAll ? 23 : 3,
                  bottom: 3,
                  backgroundColor: "#fff",
                  transition: ".3s",
                  borderRadius: "50%",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  display: "block",
                }}
              />
            </span>
          </label>
        </div>
        <div id="route-buttons">
          {displayRoutes.map((route, idx) => {
            const isActive = !!routeVisible[route.routeid];
            return (
              <div className="route-item" key={route.routeid}>
                <div
                  className={`route-summary${isActive ? " active" : ""}`}
                  data-routeid={route.routeid}
                  style={{
                    borderLeft: `6px solid ${colors[idx % colors.length]}`,
                  }}
                  onClick={() => handleToggleRoute(route.routeid)}
                >
                  <div className="route-name">
                    <span>Route {route.routeid}</span>
                    <div className="route-icons-container">
                      {route.varvehicleType && (
                        <VehicleIcon
                          type={route.varvehicleType}
                          isActive={isActive}
                        />
                      )}
                      {route.PlannedGuard == 1 && <GuardIcon isActive={isActive} />}
                      {(route.swapped === true || route.swapped === "true") && (
                        <SwappedIcon isActive={isActive} />
                      )}
                      {route.isPWD && <PWDIcon isActive={isActive} />}
                      {route.isMedical && <MedicalIcon isActive={isActive} />}
                      {route.isNMT && <NonMotorableIcon isActive={isActive} />}
                    </div>
                  </div>
                  <div className="route-stats">
                    <div className="stat-item">
                      <div className="stat-label">Distance</div>
                      <div className="stat-value">
                        {route.totaldist && !isNaN(parseFloat(route.totaldist))
                          ? `${parseFloat(route.totaldist).toFixed(1)} km`
                          : "—"}
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Occupancy</div>
                      <div className="stat-value">
                        {route.totalStop !== undefined &&
                        !isNaN(parseInt(route.totalStop, 10))
                          ? `${parseInt(route.totalStop, 10)}`
                          : "—"}
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Duration</div>
                      <div className="stat-value">
                        {route.duration && !isNaN(parseInt(route.duration, 10))
                          ? `${parseInt(route.duration, 10)} min`
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <MapContainer
        center={[22.5937, 78.9629]}
        zoom={6}
        style={{ height: "100vh", width: "100vw", zIndex: 1 }}
        zoomControl={false}
      >
        <FitMapToRoutes routes={routesForMap} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap"
        />
        <ZoomControl position="bottomright" />
        {routesForMap.map((route) => {
          const routeColor =
            colors[
              allRouteMetas.findIndex((meta) => meta.RouteID === route.routeid) %
                colors.length
            ];
          const routeColorRgb = hexToRgb(routeColor);
          return (
            <LayerGroup key={route.routeid}>
              {route.geometry && (
                <Polyline
                  positions={polylineUtil
                    .decode(route.geometry)
                    .map((coord) => [coord[0], coord[1]])}
                  color={routeColor}
                  weight={5}
                  opacity={1}
                />
              )}
              {route.stops &&
                route.stops.map((stop, sidx) => {
                  const lat = parseFloat(stop.locationY);
                  const lng = parseFloat(stop.locationX);
                  //console.log("Stop Coordinates:", stop);
                  if (isNaN(lat) || isNaN(lng)) return null;
                  return (
                    <Marker
                      key={`${route.routeid}-stop-${sidx}`}
                      position={[lat, lng]}
                      icon={createColoredMarker(routeColor, stop.stopNo)}
                    >
                      <Popup>
                        <div
                          className="info-window"
                          style={{
                            "--route-color": routeColor,
                            "--route-color-rgb": routeColorRgb,
                          }}
                        >
                          <div className="info-header">
                             Stop <span>{stop.stopNo}</span>
                          </div>
                          <ul className="employee-details">
                            <li>
                              <strong>Emp Name</strong>
                              <span>{stop.empName || "N/A"}</span>
                            </li>
                            <li>
                              <strong>Emp Code</strong>
                              <span>{stop.empCode || "N/A"}</span>
                            </li>
                            <li>
                              <strong>Address</strong>
                              <span>{stop.address || "No address"}</span>
                            </li>
                            <li>
                              <strong>ETA</strong>
                              <span>{stop.eta || "N/A"}</span>
                            </li>
                            <li>
                              <strong>Gender</strong>
                              <span>{stop.gender || "N/A"}</span>
                            </li>
                          </ul>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              {route.facility &&
                route.facility.facilityGeoY &&
                route.facility.facilityGeoX && (
                  <Marker
                    key={`${route.routeid}-facility`}
                    position={[
                      parseFloat(route.facility.facilityGeoY),
                      parseFloat(route.facility.facilityGeoX),
                    ]}
                    icon={
                      new L.Icon({
                        iconUrl: "images/icons/facility.png",
                        iconSize: [36, 36],
                        iconAnchor: [18, 36],
                        popupAnchor: [0, -36],
                      })
                    }
                  >
                    <Popup><b>Facility</b></Popup>
                  </Marker>
                )}
            </LayerGroup>
          );
        })}
      </MapContainer>
    </div>
  );
}
