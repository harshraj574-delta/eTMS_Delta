import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  CircleMarker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import "leaflet/dist/leaflet.css";
import Loader from "../common/Loader";

// Show individual markers at high zoom
const EmployeeMarkers = ({ points, type, currentZoom }) => {
  if (currentZoom < 16) return null;
  return (
    <>
      {points.map((point, idx) => (
        <CircleMarker
          key={idx}
          center={[point.geoY, point.geoX]}
          radius={3}
          pathOptions={{
            color: "#8B0000",
            fillColor: "#DC143C",
            fillOpacity: 0.9,
            weight: 1,
          }}
        >
          <Popup>
            <div>
              <strong>
                {type === 2 ? "Route" : "Employee"} #{idx + 1}
              </strong>
              <br />
              Lat: {point.geoY?.toFixed(6)}
              <br />
              Lng: {point.geoX?.toFixed(6)}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
};

const StrongIntensityHeatmapLayer = ({ points, onDensityStats }) => {
  const map = useMap();
  const heatLayerRef = useRef(null);
  const globalMaxDensityRef = useRef(0);

  const calculateFixedIntensityDensity = (points, zoomLevel) => {
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
        gridSize: Math.round(gridSize * 100000) / 100000,
        zoomLevel,
        globalMaxDensity: globalMaxDensityRef.current,
      },
    };
  };

  const getStrongIntensityOptions = (zoomLevel) => ({
    radius:
      zoomLevel < 11 ? 50 : zoomLevel < 13 ? 40 : zoomLevel < 15 ? 30 : 25,
    blur: zoomLevel < 11 ? 25 : zoomLevel < 13 ? 20 : zoomLevel < 15 ? 15 : 10,
    minOpacity: 0.5,
    maxZoom: 20,
    gradient: {
      0.0: "rgba(255,255,255,0)",
      0.1: "rgba(0,0,255,0.6)",
      0.2: "rgba(0,128,255,0.7)",
      0.3: "rgba(0,255,255,0.8)",
      0.4: "rgba(0,255,0,0.85)",
      0.5: "rgba(255,255,0,0.9)",
      0.6: "rgba(255,165,0,0.92)",
      0.7: "rgba(255,69,0,0.95)",
      0.8: "rgba(255,0,0,0.97)",
      0.9: "rgba(220,0,0,0.99)",
      1.0: "rgba(139,0,0,1.0)",
    },
  });

  useEffect(() => {
    const updateHeatLayer = () => {
      const currentZoom = map.getZoom();
      const { heatData, stats } = calculateFixedIntensityDensity(
        points,
        currentZoom
      );
      if (onDensityStats) onDensityStats(stats);
      if (heatLayerRef.current) {
        heatLayerRef.current.setLatLngs(heatData);
        heatLayerRef.current.setOptions(getStrongIntensityOptions(currentZoom));
      } else {
        heatLayerRef.current = L.heatLayer(
          heatData,
          getStrongIntensityOptions(currentZoom)
        ).addTo(map);
      }
    };

    updateHeatLayer();

    const handleZoomEnd = updateHeatLayer;
    map.on("zoomend", handleZoomEnd);
    return () => {
      map.off("zoomend", handleZoomEnd);
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, [points, map, onDensityStats]);

  return null;
};

const LeafletHeatMap = ({ filter, type = 1 }) => {
  const fetchBody = {
    facilityid: filter?.facilityid,
    sDate: filter?.sDate,
    eDate: filter?.eDate,
    triptype: filter?.triptype,
    type: type,
  };

  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [densityStats, setDensityStats] = useState({});
  const [currentZoom, setCurrentZoom] = useState(10.5);
  const [retryCount, setRetryCount] = useState(0);
  const mapRef = useRef();
  const maxRetries = 3;

  const defaultCenter = [28.6139, 77.209];
  const defaultZoom = 10.5;

  useEffect(() => {
    const fetchEmpData = async () => {
      setLoading(true);
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
        if (!Array.isArray(data)) throw new Error("API response not an array");

        setEmployeeData(
          data.filter(
            (emp) =>
              typeof emp.geoY === "number" &&
              typeof emp.geoX === "number" &&
              !isNaN(emp.geoY) &&
              !isNaN(emp.geoX)
          )
        );

        setRetryCount(0);
        setError(null);
      } catch (err) {
        console.error("HeatMap Error:", err);
        setError(`Error fetching employee data: ${err.message}`);

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying HeatMap... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          setEmployeeData([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEmpData();
    // eslint-disable-next-line
  }, [
    filter?.facilityid,
    filter?.sDate,
    filter?.eDate,
    filter?.triptype,
    type,
    retryCount,
  ]);

  useEffect(() => {
    if (mapRef.current && employeeData.length) {
      const latLngs = employeeData.map((emp) => [emp.geoY, emp.geoX]);
      try {
        const bounds = L.latLngBounds(latLngs);
        if (bounds.isValid()) {
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch {
        /* bounds failure ignored */
      }
    }
  }, [employeeData]);

  if (error && retryCount >= maxRetries) {
    return (
      <div
        style={{
          height: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff3cd",
          borderRadius: "8px",
          flexDirection: "column",
        }}
      >
        <p style={{ color: "#856404", marginBottom: "1rem" }}>⚠️ {error}</p>
        <button
          onClick={() => setRetryCount(0)}
          style={{
            padding: "0.5rem 1rem",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <Loader isVisible={loading} fullScreen={false} />
      <div style={{ height: "70vh", width: "100%", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 8,
            background: "rgba(255,255,255,0.95)",
            padding: "10px",
            borderRadius: "4px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            backdropFilter: "blur(6px)",
            fontSize: 12,
            fontWeight: 700,
            color: "#333",
          }}
        >
          <div>
            <strong>Total {type === 2 ? "Routes" : "Employees"}: </strong>
            {employeeData.length}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            zIndex: 8,
            background: "rgba(255,255,255,0.95)",
            padding: "10px",
            borderRadius: "4px",
            boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: 12, marginBottom: 4, color: "#555" }}>
            Low
          </span>
          <div
            style={{
              width: 11,
              height: 100,
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0), rgba(0,0,255,0.6), rgba(0,128,255,0.7), rgba(0,255,255,0.8), rgba(0,255,0,0.85), rgba(255,255,0,0.9), rgba(255,165,0,0.92), rgba(255,69,0,0.95), rgba(255,0,0,0.97), rgba(220,0,0,0.99), rgba(139,0,0,1.0))",
              borderRadius: 11,
              boxShadow:
                "inset 2px 0 4px rgba(0,0,0,0.1), 1px 0 2px rgba(0,0,0,0.1)",
              border: "1px solid rgba(0,0,0,0.2)",
              marginLeft: 6,
              marginTop: 6,
            }}
          />
          <span style={{ fontSize: 12, marginTop: 4, color: "#555" }}>
            High
          </span>
        </div>
        {!loading && employeeData.length > 0 && (
          <MapContainer
            center={
              employeeData.length
                ? [employeeData[0].geoY, employeeData[0].geoX]
                : defaultCenter
            }
            zoom={defaultZoom}
            style={{ height: "100%", width: "100%" }}
            whenCreated={(map) => {
              mapRef.current = map;
              map.on("zoomend", () => setCurrentZoom(map.getZoom()));
            }}
            zoomControl={false}
          >
            <TileLayer
              style={{ zIndex: -1, opacity: 0.9 }}
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <StrongIntensityHeatmapLayer
              points={employeeData}
              onDensityStats={setDensityStats}
            />
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

export default React.memo(LeafletHeatMap);