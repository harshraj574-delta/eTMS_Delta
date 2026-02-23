import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  CircleMarker,
  Popup,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import "leaflet/dist/leaflet.css";

// Employee markers at high zoom
const EmployeeMarkers = memo(({ points, type, currentZoom }) => {
  if (currentZoom < 16) return null;
  return (
    <>
      {points.map((point, idx) => (
        <CircleMarker
          key={`marker-${idx}-${point.geoY}-${point.geoX}`}
          center={[point.geoY, point.geoX]}
          radius={4}
          pathOptions={{
            color: "#6366f1",
            fillColor: "#818cf8",
            fillOpacity: 0.9,
            weight: 2,
          }}
        >
          <Popup>
            <div style={{ fontSize: "12px", lineHeight: 1.5 }}>
              <strong style={{ color: "#1e293b" }}>
                {type === 2 ? "Route" : "Employee"} #{idx + 1}
              </strong>
              <br />
              <span style={{ color: "#64748b" }}>
                Lat: {point.geoY?.toFixed(6)}
              </span>
              <br />
              <span style={{ color: "#64748b" }}>
                Lng: {point.geoX?.toFixed(6)}
              </span>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
});

EmployeeMarkers.displayName = "EmployeeMarkers";

// Heatmap layer with smooth transitions
const HeatmapLayer = memo(({ points, onDensityStats }) => {
  const map = useMap();
  const heatLayerRef = useRef(null);
  const globalMaxDensityRef = useRef(0);

  const calculateDensity = useCallback((points, zoomLevel) => {
    if (!points.length) return { heatData: [], stats: {} };

    const gridSize =
      zoomLevel < 11
        ? 0.01
        : zoomLevel < 13
          ? 0.005
          : zoomLevel < 15
            ? 0.003
            : 0.002;

    const grid = {};
    points.forEach((pt) => {
      const gridX = Math.floor(pt.geoX / gridSize);
      const gridY = Math.floor(pt.geoY / gridSize);
      const key = `${gridX},${gridY}`;
      if (!grid[key]) {
        grid[key] = {
          lat: (gridY + 0.5) * gridSize,
          lng: (gridX + 0.5) * gridSize,
          count: 0,
        };
      }
      grid[key].count++;
    });

    const densities = Object.values(grid).map((cell) => cell.count);
    const maxDensity = Math.max(...densities);
    const minDensity = Math.min(...densities);
    const avgDensity = densities.reduce((a, b) => a + b, 0) / densities.length;

    if (maxDensity > globalMaxDensityRef.current) {
      globalMaxDensityRef.current = maxDensity;
    }

    const fixedMaxReference = Math.max(globalMaxDensityRef.current, 10);
    const heatData = Object.values(grid).map((cell) => [
      cell.lat,
      cell.lng,
      Math.max(0.3, Math.min(1, (cell.count / fixedMaxReference) * 2)),
    ]);

    return {
      heatData,
      stats: {
        maxDensity: Math.round(maxDensity),
        minDensity: Math.round(minDensity),
        avgDensity: Math.round(avgDensity * 100) / 100,
        totalCells: Object.keys(grid).length,
      },
    };
  }, []);

  const getHeatOptions = useCallback((zoomLevel) => ({
    radius:
      zoomLevel < 11 ? 50 : zoomLevel < 13 ? 40 : zoomLevel < 15 ? 30 : 25,
    blur: zoomLevel < 11 ? 25 : zoomLevel < 13 ? 20 : zoomLevel < 15 ? 15 : 10,
    minOpacity: 0.5,
    maxZoom: 20,
    gradient: {
      0.0: "rgba(255,255,255,0)",
      0.1: "rgba(99,102,241,0.5)",
      0.2: "rgba(79,70,229,0.6)",
      0.3: "rgba(67,56,202,0.7)",
      0.4: "rgba(16,185,129,0.75)",
      0.5: "rgba(245,158,11,0.8)",
      0.6: "rgba(249,115,22,0.85)",
      0.7: "rgba(239,68,68,0.9)",
      0.8: "rgba(220,38,38,0.95)",
      0.9: "rgba(185,28,28,0.98)",
      1.0: "rgba(127,29,29,1.0)",
    },
  }), []);

  useEffect(() => {
    const updateHeatLayer = () => {
      const currentZoom = map.getZoom();
      const { heatData, stats } = calculateDensity(points, currentZoom);
      if (onDensityStats) onDensityStats(stats);

      if (heatLayerRef.current) {
        heatLayerRef.current.setLatLngs(heatData);
        heatLayerRef.current.setOptions(getHeatOptions(currentZoom));
      } else {
        heatLayerRef.current = L.heatLayer(
          heatData,
          getHeatOptions(currentZoom)
        ).addTo(map);
      }
    };

    updateHeatLayer();
    map.on("zoomend", updateHeatLayer);

    return () => {
      map.off("zoomend", updateHeatLayer);
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [points, map, onDensityStats, calculateDensity, getHeatOptions]);

  return null;
});

HeatmapLayer.displayName = "HeatmapLayer";

// Zoom tracker component
const ZoomTracker = memo(({ onZoomChange }) => {
  const map = useMap();

  useEffect(() => {
    const handleZoom = () => onZoomChange(map.getZoom());
    map.on("zoomend", handleZoom);
    return () => map.off("zoomend", handleZoom);
  }, [map, onZoomChange]);

  return null;
});

ZoomTracker.displayName = "ZoomTracker";

// Map bounds fitter
const BoundsFitter = memo(({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length > 0) {
      try {
        const latLngs = points.map((p) => [p.geoY, p.geoX]);
        const bounds = L.latLngBounds(latLngs);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
      } catch {
        // Bounds calculation failed silently
      }
    }
  }, [points, map]);

  return null;
});

BoundsFitter.displayName = "BoundsFitter";

const LeafletHeatMap = ({ filter, type = 1, height = "100%", isFullscreen = false }) => {
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(10.5);
  const [retryCount, setRetryCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevTypeRef = useRef(type);
  const maxRetries = 3;

  const defaultCenter = [28.6139, 77.209];
  const defaultZoom = 10.5;

  const fetchBody = {
    facilityid: filter?.facilityid,
    sDate: filter?.sDate,
    eDate: filter?.eDate,
    triptype: filter?.triptype,
    type: type,
  };

  // Handle type change with smooth transition
  useEffect(() => {
    if (prevTypeRef.current !== type) {
      setIsTransitioning(true);
      prevTypeRef.current = type;
    }
  }, [type]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isTransitioning) {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await fetch("/api/api/v1/sp_getRoutedEmpGeocode", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(fetchBody),
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        let data = await response.json();
        if (typeof data === "string") data = JSON.parse(data);
        if (!Array.isArray(data)) throw new Error("Invalid response format");

        const validData = data.filter(
          (emp) =>
            typeof emp.geoY === "number" &&
            typeof emp.geoX === "number" &&
            !isNaN(emp.geoY) &&
            !isNaN(emp.geoX)
        );

        setEmployeeData(validData);
        setRetryCount(0);
        setError(null);
      } catch (err) {
        console.error("HeatMap fetch error:", err);
        setError(err.message);

        if (retryCount < maxRetries) {
          setTimeout(() => setRetryCount((prev) => prev + 1), 2000);
        }
      } finally {
        setLoading(false);
        setIsTransitioning(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(fetchBody), retryCount]);

  const handleZoomChange = useCallback((zoom) => {
    setCurrentZoom(zoom);
  }, []);

  const handleRetry = useCallback(() => {
    setRetryCount(0);
    setError(null);
  }, []);

  const typeLabel = type === 2 ? "Routes" : "Employees";
  const showOverlay = loading || isTransitioning;

  // Error state
  if (error && retryCount >= maxRetries) {
    return (
      <div className="heatmap-error">
        <div className="heatmap-error-content">
          <div className="heatmap-error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h4>Unable to Load Map Data</h4>
          <p>{error}</p>
          <button className="heatmap-retry-btn" onClick={handleRetry}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .heatmap-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 12px;
          overflow: hidden;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .heatmap-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }

        .heatmap-overlay.visible {
          opacity: 1;
          visibility: visible;
        }

        .heatmap-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .heatmap-spinner {
          width: 44px;
          height: 44px;
          border: 3px solid #e2e8f0;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: heatmapSpin 0.8s linear infinite;
        }

        @keyframes heatmapSpin {
          to { transform: rotate(360deg); }
        }

        .heatmap-loader-text {
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
        }

        .heatmap-stats-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 800;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04);
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .heatmap-stats-badge:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.04);
        }

        .heatmap-stats-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          border-radius: 6px;
          color: white;
        }

        .heatmap-stats-icon svg {
          width: 12px;
          height: 12px;
        }

        .heatmap-stats-count {
          color: #6366f1;
          font-weight: 700;
        }

        .heatmap-legend {
          position: absolute;
          bottom: 16px;
          left: 12px;
          z-index: 800;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04);
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: transform 0.2s ease;
        }

        .heatmap-legend:hover {
          transform: translateY(-2px);
        }

        .heatmap-legend-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .heatmap-legend-bar {
          width: 100px;
          height: 10px;
          border-radius: 5px;
          background: linear-gradient(90deg,
            rgba(99,102,241,0.5) 0%,
            rgba(16,185,129,0.7) 25%,
            rgba(245,158,11,0.8) 50%,
            rgba(239,68,68,0.9) 75%,
            rgba(127,29,29,1) 100%
          );
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
        }

        .heatmap-legend-fullscreen .heatmap-legend-bar {
          width: 140px;
          height: 12px;
        }

        .heatmap-zoom-hint {
          position: absolute;
          bottom: 16px;
          right: 12px;
          z-index: 800;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          padding: 8px 12px;
          font-size: 11px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .heatmap-zoom-hint svg {
          width: 14px;
          height: 14px;
          opacity: 0.7;
        }

        .heatmap-error {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border-radius: 12px;
        }

        .heatmap-error-content {
          text-align: center;
          padding: 32px;
        }

        .heatmap-error-icon {
          color: #ef4444;
          margin-bottom: 16px;
        }

        .heatmap-error-content h4 {
          margin: 0 0 8px;
          font-size: 16px;
          font-weight: 600;
          color: #991b1b;
        }

        .heatmap-error-content p {
          margin: 0 0 20px;
          font-size: 13px;
          color: #b91c1c;
        }

        .heatmap-retry-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .heatmap-retry-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }

        .leaflet-container {
          height: 100%;
          width: 100%;
          border-radius: 12px;
          font-family: inherit;
        }

        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
          border-radius: 10px !important;
          overflow: hidden;
        }

        .leaflet-control-zoom a {
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          color: #475569 !important;
          background: white !important;
          border: none !important;
          transition: background 0.2s, color 0.2s !important;
        }

        .leaflet-control-zoom a:hover {
          background: #f1f5f9 !important;
          color: #1e293b !important;
        }

        .leaflet-popup-content-wrapper {
          border-radius: 10px !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
          padding: 0 !important;
        }

        .leaflet-popup-content {
          margin: 12px 14px !important;
        }

        .leaflet-popup-tip {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>

      <div className="heatmap-wrapper" style={{ height }}>
        {/* Loading Overlay */}
        <div className={`heatmap-overlay ${showOverlay ? "visible" : ""}`}>
          <div className="heatmap-loader">
            <div className="heatmap-spinner" />
            <span className="heatmap-loader-text">
              Loading {typeLabel}...
            </span>
          </div>
        </div>

        {/* Stats Badge */}
        <div className="heatmap-stats-badge">
          <div className="heatmap-stats-icon">
            {type === 2 ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            )}
          </div>
          <span>
            Total {typeLabel}:{" "}
            <span className="heatmap-stats-count">
              {employeeData.length.toLocaleString()}
            </span>
          </span>
        </div>

        {/* Legend */}
        <div className={`heatmap-legend ${isFullscreen ? "heatmap-legend-fullscreen" : ""}`}>
          <span className="heatmap-legend-label">Low</span>
          <div className="heatmap-legend-bar" />
          <span className="heatmap-legend-label">High</span>
        </div>

        {/* Zoom Hint */}
        {currentZoom < 14 && employeeData.length > 0 && (
          <div className="heatmap-zoom-hint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            Zoom in for details
          </div>
        )}

        {/* Map */}
        {!loading && (
          <MapContainer
            center={
              employeeData.length > 0
                ? [employeeData[0].geoY, employeeData[0].geoX]
                : defaultCenter
            }
            zoom={defaultZoom}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <ZoomControl position="topright" />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <BoundsFitter points={employeeData} />
            <ZoomTracker onZoomChange={handleZoomChange} />
            <HeatmapLayer points={employeeData} />
            <EmployeeMarkers
              points={employeeData}
              type={type}
              currentZoom={currentZoom}
            />
          </MapContainer>
        )}
      </div>
    </>
  );
};

export default memo(LeafletHeatMap)