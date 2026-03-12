import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  Polyline,
  Marker,
  Popup,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import polyline from "@mapbox/polyline";
import "leaflet/dist/leaflet.css";
import ManageRouteService from "../services/compliance/ManageRouteService";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-leaflet";
import MasterSidebar from "./Master/MasterSidebar";

function MapLibreLayer() {
  const map = useMap();
  const layerRef = useRef(null);
  const glMapRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    if (!window.maplibregl) {
      window.maplibregl = maplibregl;
    }

    try {
      const maplibreLayer = L.maplibreGL({
        style: "https://tiles.openfreemap.org/styles/liberty",
        interactive: false,
        maplibreOptions: {
          maxTileCacheSize: 300,
          fadeDuration: 300,
          crossSourceCollisions: false,
          optimizeForTerrain: false,
          refreshExpiredTiles: false,
          preserveDrawingBuffer: true,
          trackResize: true,
          antialias: true,
        },
      });

      maplibreLayer.addTo(map);
      layerRef.current = maplibreLayer;

      setTimeout(() => {
        if (maplibreLayer.getMaplibreMap) {
          const glMap = maplibreLayer.getMaplibreMap();
          glMapRef.current = glMap;

          if (glMap) {
            glMap.on("idle", () => {
              const currentZoom = glMap.getZoom();
              if (currentZoom < 18) {
                glMap.triggerRepaint();
              }
            });
          }
        }
      }, 500);
    } catch (err) {
      console.error("Failed to initialize MapLibre GL layer:", err);
      const fallbackLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "© OpenStreetMap",
        }
      );
      fallbackLayer.addTo(map);
      layerRef.current = fallbackLayer;
    }

    return () => {
      if (glMapRef.current) {
        glMapRef.current = null;
      }
      if (layerRef.current && map) {
        try {
          map.removeLayer(layerRef.current);
        } catch (e) {
          // Layer might already be removed
        }
      }
    };
  }, [map]);

  return null;
}

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
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError;
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

// Helper function to convert hex color to RGB
const hexToRgb = (hex) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : null;
};

const colors = ["#4285F4"];

// Updated marker function to match RouteMap styling with gender-based colors
function createColoredMarker(color, stopNo, gender) {
  const genderInitial = gender ? gender.charAt(0).toUpperCase() : "";
  const markerText = `${stopNo}${genderInitial}`;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16" fill="white" stroke="#333" stroke-width="2"/>
      <circle cx="18" cy="18" r="14" fill="${color}"/>
      <text x="18" y="23" text-anchor="middle" 
            font-family="Arial Black, sans-serif" 
            font-size="12" 
            font-weight="900" 
            fill="white" 
            stroke="rgba(0,0,0,0.8)" 
            stroke-width="2" 
            paint-order="stroke fill">${markerText}</text>
    </svg>
  `;
  return new L.Icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(svg),
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

function FitToPolyline({ geometry }) {
  const map = useMap();
  useEffect(() => {
    if (!geometry) return;
    try {
      const coords = polyline
        .decode(geometry)
        .map((coord) => [coord[0], coord[1]]);
      if (coords.length > 1) {
        map.fitBounds(coords, { padding: [40, 40] });
      } else if (coords.length === 1) {
        map.setView(coords[0], 15);
      }
    } catch {
      // Error decoding polyline
    }
  }, [geometry, map]);
  return null;
}

// Loading spinner component
const LoadingSpinner = () => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    }}
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #4285F4",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          animation: "spin 2s linear infinite",
          marginBottom: "16px",
        }}
      />
      <p style={{ fontWeight: 500, color: "#4285F4" }}>
        Loading route details...
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
);

export default function OffcanvasRouteDetails({ show, onClose, routeId, width = "50vw" }) {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [queryParams, setQueryParams] = useState({});

  // Initialize query parameters from URL
  useEffect(() => {
    const params = getQueryParams();
    setQueryParams(params);
  }, []);

  useEffect(() => {
    if (!show || !routeId) return;

    setLoading(true);
    setMapReady(false);
    setError(null);

    (async () => {
      try {
        const apiParams = {
          sDate: queryParams.sDate || "",
          eDate: queryParams.sDate || "",
          FacilityID: queryParams.FacilityID,
          TripType: queryParams.TripType,
          Shifttimes: queryParams.Shifttimes,
          OrderBy: "Colony",
          Direction: queryParams.Direction || "ASC",
          Routeid: routeId,
          occ_seater: -2,
        };

        const routeResponse = await retryAsync(
          ManageRouteService.GetRoutesByOrder,
          apiParams
        );

        let routeData =
          typeof routeResponse === "string"
            ? JSON.parse(routeResponse)
            : routeResponse;
        if (typeof routeData === "string") routeData = JSON.parse(routeData);

        if (!Array.isArray(routeData) || !routeData[0])
          throw new Error("No route found");
        const routeInfo = routeData[0];

        const [details, geometry] = await Promise.all([
          retryAsync(ManageRouteService.GetRoutesDetailsnew, {
            RouteID: routeId,
            isAdd: 0,
          }),
          retryAsync(ManageRouteService.Get_RouteGeometry, {
            RouteID: routeId,
          }),
        ]);

        let parsedDetails =
          typeof details === "string" ? JSON.parse(details) : details;
        if (typeof parsedDetails === "string")
          parsedDetails = JSON.parse(parsedDetails);

        let parsedGeometry =
          typeof geometry === "string" ? JSON.parse(geometry) : geometry;
        if (typeof parsedGeometry === "string")
          parsedGeometry = JSON.parse(parsedGeometry);

        if (Array.isArray(parsedGeometry) && parsedGeometry.length > 0) {
          parsedGeometry = parsedGeometry[0];
        }

        setRoute({
          ...routeInfo,
          stops: parsedDetails,
          geometry: parsedGeometry.geometry,
          facility: {
            facilityGeoX: parsedDetails[0]?.facGeoX,
            facilityGeoY: parsedDetails[0]?.facGeoY,
          },
        });

        setTimeout(() => {
          setLoading(false);
          setTimeout(() => {
            setMapReady(true);
          }, 800);
        }, 500);
      } catch (err) {
        console.error("Error fetching route data:", err);
        setError(err.message);
        setLoading(false);
      }
    })();

    return () => {
      if (!show) {
        setRoute(null);
        setError(null);
        setMapReady(false);
      }
    };
  }, [show, routeId, queryParams]);

  // Removed early return to allow animation
  
  let mapCenter = [22.5937, 78.9629];
  if (route && route.stops && route.stops.length) {
    const lat = parseFloat(route.stops[0].locationY);
    const lng = parseFloat(route.stops[0].locationX);
    if (!isNaN(lat) && !isNaN(lng)) {
      mapCenter = [lat, lng];
    }
  }

  const routeColor = colors[0];
  const routeColorRgb = hexToRgb(routeColor);

  return (
    <MasterSidebar
      show={show}
      onClose={onClose}
      title="Route Map"
      width={width}
      bodyStyle={{ height: "100%", position: "relative" }}
      bodyClassName="p-0"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        .info-window {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          max-width: 220px;
          padding: 0;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 6px 20px rgba(0,0,0,0.1);
        }

        .info-header {
          font-weight: 700;
          font-size: 13px;
          padding: 8px 28px 8px 12px;
          color: white;
          background: var(--route-color, #2563eb);
          border-bottom: none;
          position: relative;
        }

        .stop-route-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .stop-label, .route-label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .stop-number, .route-number {
          font-weight: 700;
          color: white;
          background: rgba(0, 0, 0, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
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

        .employee-details li {
          display: contents;
        }

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
          top: 4px !important;
          right: 4px !important;
          width: 20px !important;
          height: 20px !important;
          background: transparent !important;
          border-radius: 50% !important;
          z-index: 10 !important;
          padding: 0 !important;
        }

        .leaflet-popup-close-button:hover {
          color: white !important;
          background: rgba(0, 0, 0, 0.2) !important;
        }

        .leaflet-top.leaflet-right {
          top: 80px !important;
          right: 10px !important;
        }

        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
        }

        .leaflet-control-zoom a {
          background: #fff !important;
          color: #333 !important;
          font-size: 18px !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
        }

        .leaflet-control-zoom a:hover {
          background: #f5f5f5 !important;
        }
      `}</style>

      {/* Map as background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
        }}
      >
        <MapContainer
          center={mapCenter}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={false}
          zoomSnap={0.25}
          zoomDelta={0.5}
          wheelPxPerZoomLevel={120}
        >
          <MapLibreLayer />
          <ZoomControl position="topright" />
          {route && route.geometry && <FitToPolyline geometry={route.geometry} />}
          {route && route.geometry && (
            <Polyline
              positions={polyline
                .decode(route.geometry)
                .map((coord) => [coord[0], coord[1]])}
              color={routeColor}
              weight={4}
              opacity={0.8}
            />
          )}
          {/* Employee Markers with RouteMap styling */}
          {route &&
            route.stops &&
            route.stops.map((emp, idx) => {
              const lat = parseFloat(emp.GeoY);
              const lng = parseFloat(emp.GeoX);
              if (!isNaN(lat) && !isNaN(lng)) {
                // Gender-based color: Pink for female, Blue for male
                const markerColor =
                  emp.Gender === "F" ? "#F44292" : "#4285F4";
                const markerColorRgb = hexToRgb(markerColor);
                return (
                  <Marker
                    key={`emp-${idx}`}
                    position={[lat, lng]}
                    icon={createColoredMarker(
                      markerColor,
                      emp.SNo,
                      emp.Gender
                    )}
                  >
                    <Popup>
                      <div
                        className="info-window"
                        style={{
                          "--route-color": markerColor,
                          "--route-color-rgb": markerColorRgb,
                        }}
                      >
                        <div className="info-header">
                          <div className="stop-route-info">
                            <span className="stop-label">
                              Stop{" "}
                              <span className="stop-number">{emp.stopNo}</span>
                            </span>
                            <span className="route-label">
                              Route{" "}
                              <span className="route-number">
                                {route.RouteID}
                              </span>
                            </span>
                          </div>
                        </div>
                        <ul className="employee-details">
                          <li>
                            <strong>Emp Name</strong>
                            <span>{emp.empName || "N/A"}</span>
                          </li>
                          <li>
                            <strong>Emp Code</strong>
                            <span>{emp.empCode || "N/A"}</span>
                          </li>
                          <li>
                            <strong>Address</strong>
                            <span>{emp.address || "No address"}</span>
                          </li>
                          <li>
                            <strong>ETA</strong>
                            <span>{emp.ETA || "N/A"}</span>
                          </li>
                          <li>
                            <strong>Gender</strong>
                            <span>{emp.Gender || "N/A"}</span>
                          </li>
                        </ul>
                      </div>
                    </Popup>
                  </Marker>
                );
              }
              return null;
            })}
          {route &&
            route.facility &&
            !isNaN(parseFloat(route.facility.facilityGeoY)) &&
            !isNaN(parseFloat(route.facility.facilityGeoX)) && (
              <Marker
                position={[
                  parseFloat(route.facility.facilityGeoY),
                  parseFloat(route.facility.facilityGeoX),
                ]}
                icon={
                  new L.Icon({
                    iconUrl: "/images/icons/facility.png",
                    iconSize: [36, 36],
                    iconAnchor: [18, 36],
                    popupAnchor: [0, -36],
                  })
                }
              >
                <Popup>
                  <b>Facility</b>
                </Popup>
              </Marker>
            )}
        </MapContainer>
      </div>

      {/* Loading overlay */}
      {(loading || !mapReady) && <LoadingSpinner />}

      {/* Error overlay */}
      {error && !loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 3,
            padding: "0 32px",
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 64, marginBottom: 8 }}>⚠️</div>
            <h3 style={{ color: "#d32f2f", marginBottom: 12 }}>
              Error Loading Route
            </h3>
            <p>{error}</p>
            <button
              onClick={onClose}
              style={{
                backgroundColor: "#d32f2f",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: 4,
                marginTop: 16,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Compact floating summary card */}
      {mapReady && route && (
        <div
          style={{
            position: "absolute",
            top: 15,
            left: 15,
            zIndex: 3,
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            padding: 10,
            display: "flex",
            flexDirection: "column",
            fontSize: 15,
          }}
        >
          <div className="mb-2 d-flex justify-content-between">
            <div>
              {route.varvehicleType === "s" && (
                <img
                  src="images/icons/letter-s.png"
                  alt="Map"
                  style={{ cursor: "pointer", width: "20px", height: "20px" }}
                  title="Small"
                />
              )}
              {route.varvehicleType === "m" && (
                <img
                  src="images/icons/letter-m.png"
                  alt="Map"
                  style={{
                    cursor: "pointer",
                    width: "20px",
                    height: "20px",
                    margin: "0 8px",
                  }}
                  title="Medium"
                />
              )}
              {route.varvehicleType === "l" && (
                <img
                  src="images/icons/letter-l.png"
                  alt="Map"
                  style={{ cursor: "pointer", width: "20px", height: "20px" }}
                  title="Large"
                />
              )}
            </div>
            <div>
              {route.swapped === true && (
                <img
                  src="images/icons/swap.png"
                  alt="Swap"
                  style={{
                    cursor: "pointer",
                    width: "20px",
                    height: "20px",
                    margin: "0 8px",
                  }}
                  title="Swap"
                />
              )}
              {route.PlannedGuard === 1 && (
                <img
                  src="images/icons/add_guard.png"
                  alt="Guard"
                  style={{ cursor: "pointer", width: "20px", height: "20px" }}
                  title="Guard Required"
                />
              )}
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 4,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                background: "#dbeafe",
                borderRadius: 6,
                padding: 10,
                minWidth: 100,
              }}
            >
              <div
                style={{
                  color: "#475569",
                  fontSize: 8,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                Route ID
              </div>
              <div style={{ color: "#1e293b", fontSize: 14, fontWeight: 600 }}>
                {route.RouteID}
              </div>
            </div>
            <div
              style={{
                background: "#dcfce7",
                borderRadius: 6,
                padding: 10,
                minWidth: 100,
              }}
            >
              <div
                style={{
                  color: "#475569",
                  fontSize: 8,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                Distance
              </div>
              <div style={{ color: "#1e293b", fontSize: 14, fontWeight: 600 }}>
                {route.totaldist
                  ? `${parseFloat(route.totaldist).toFixed(1)} km`
                  : "—"}
              </div>
            </div>
            <div
              style={{
                background: "#fef9c3",
                borderRadius: 6,
                padding: 10,
                minWidth: 100,
              }}
            >
              <div
                style={{
                  color: "#475569",
                  fontSize: 8,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                Occupancy
              </div>
              <div style={{ color: "#1e293b", fontSize: 14, fontWeight: 600 }}>
                {route.stops ? route.stops.length : "—"}
              </div>
            </div>
            <div
              style={{
                background: "#fee2e2",
                borderRadius: 6,
                padding: 10,
                minWidth: 100,
              }}
            >
              <div
                style={{
                  color: "#475569",
                  fontSize: 8,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                Duration
              </div>
              <div style={{ color: "#1e293b", fontSize: 14, fontWeight: 600 }}>
                {route.duration ? route.duration : "—"} min
              </div>
            </div>
          </div>
        </div>
      )}
    </MasterSidebar>
  );
}