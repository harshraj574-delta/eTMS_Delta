import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat"; // Import the leaflet.heat plugin
import "leaflet/dist/leaflet.css"; // Ensure Leaflet CSS is imported for default map styles

// New component for the Heatmap layer with enhanced styling
const HeatmapLayer = ({ points }) => {
  const map = useMap(); // Access the Leaflet map instance
  const heatLayerRef = useRef(null);

  useEffect(() => {
    const heatData = points.map((p) => [p.geoY, p.geoX, 1]); // Intensity of 1 for each employee

    if (heatLayerRef.current) {
      // If the layer already exists, update its data
      heatLayerRef.current.setLatLngs(heatData);
    } else {
      // Otherwise, create a new heat layer with modern styling
      heatLayerRef.current = L.heatLayer(heatData, {
        radius: 35, // Slightly larger radius for a smoother spread
        blur: 25, // More blur for a softer, more blended appearance
        maxZoom: 17, // Max zoom level at which the heatmap is rendered
        minOpacity: 0.1, // Start with a low opacity for very faint areas
        // max: 1.0, // If all intensities are 1, then 1.0 is fine.
        // Modernized gradient for a more stylistic look
        gradient: {
          0.0: '#E0FFFF',   // Very light cyan/almost white for lowest density (subtle start)
          0.2: '#ADD8E6',   // Light blue
          0.4: '#FFD700',   // Gold (warm transition)
          0.6: '#FFA500',   // Orange
          0.8: '#FF4500',   // Orange-red (vibrant high density)
          1.0: '#B22222'    // Firebrick red (intense highest density)
        },
      }).addTo(map);
    }

    // Cleanup: remove the layer when the component unmounts
    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [points, map]); // Re-run effect if points or map instance changes

  return null; // This component doesn't render any visible DOM elements directly
};

const LeafletHeatMap = ({ facilityid = 1, sDate = "2025-05-29", triptype = "P", type = 1 }) => {
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapRef = useRef();

  // Default center if no data
  const defaultCenter = [28.6139, 77.209];
  const defaultZoom = 10.5;

  // Fetch Employee Data (same as before)
  useEffect(() => {
    const fetchEmpData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          "/etmsApiMap/api/v1/sp_getRoutedEmpGeocode",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              facilityid,
              sDate,
              triptype,
              type,
            }),
          },
        );

        if (!response.ok)
          throw new Error(`API Error: ${response.status}`);
        let data = await response.json();
        if (typeof data === "string") data = JSON.parse(data);
        if (Array.isArray(data)) {
         // console.log(`Fetched ${data.length} employees`);
          // Filter out invalid geocodes here for heatmap as well
          const validData = data.filter(
            (emp) =>
              typeof emp.geoY === "number" &&
              typeof emp.geoX === "number" &&
              !isNaN(emp.geoY) &&
              !isNaN(emp.geoX),
          );
          setEmployeeData(validData);
        } else {
          throw new Error("API response not an array");
        }
      } catch (err) {
        console.error("Error fetching employee data:", err);
        setError(`Error fetching employee data: ${err.message}`);
        setEmployeeData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEmpData();
  }, [facilityid, sDate, triptype, type]); // Re-run when any prop changes

  // Fit map bounds to employee data
  useEffect(() => {
    if (mapRef.current && employeeData.length > 0) {
      try {
        const latLngs = employeeData.map((emp) => [emp.geoY, emp.geoX]);
        if (latLngs.length > 0) {
          const bounds = L.latLngBounds(latLngs);
          if (bounds.isValid()) {
            mapRef.current.fitBounds(bounds, { padding: [50, 50] }); // Increased padding
          }
        }
      } catch (boundsError) {
        console.warn("Error setting map bounds:", boundsError);
      }
    }
  }, [employeeData]); // Re-run when employeeData changes

  if (loading) {
    return <p>Loading employee data...</p>;
  }
  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div style={{ height: "100%", width: "100%", position: 'relative' }}>
      {/* Total Employees/Routes Counter (Styling adjusted) */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 1000,
          background: "rgba(255, 255, 255, 0.9)", // Slightly transparent background
          padding: "12px 18px", // More generous padding
          borderRadius: "8px", // More rounded corners
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)", // Softer, larger shadow
          backdropFilter: "blur(4px)", // Subtle blur effect (modern UI)
          fontSize: "15px",
          fontWeight: 600,
          color: "#333",
          fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", // Modern font stack
        }}
      >
        {type === 2 ? 'Total Routes' : 'Total Employees'}: {employeeData.length}
      </div>

      {/* Heatmap Legend (Styling enhanced) */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          left: 30,
          zIndex: 1000,
          background: "rgba(255, 255, 255, 0.9)", // Slightly transparent background
          padding: "15px 22px", // More padding
          borderRadius: "10px", // More rounded corners
          boxShadow: "0 6px 18px rgba(0,0,0,0.2)", // Deeper, softer shadow
          backdropFilter: "blur(6px)", // More noticeable blur effect
          minWidth: 200,
          fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        <div style={{
          fontWeight: 700, // Bolder title
          marginBottom: 10,
          fontSize: 14,
          color: "#333",
          letterSpacing: "0.5px", // Slight letter spacing
        }}>Density</div>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <span style={{ fontSize: 13, marginRight: 10, color: "#555" }}>Low</span>
          <div style={{
            flex: 1,
            height: 16, // Taller color bar
            // Use a matching, smoother gradient for the legend
            background: 'linear-gradient(to right, #E0FFFF, #ADD8E6, #FFD700, #FFA500, #FF4500, #B22222)',
            borderRadius: 8, // Rounded ends for the gradient bar
            margin: '0 10px',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)', // Inner shadow for depth
          }} />
          <span style={{ fontSize: 13, marginLeft: 10, color: "#555" }}>High</span>
        </div>
      </div>

      <MapContainer
        center={employeeData.length > 0 ? [employeeData[0].geoY, employeeData[0].geoX] : defaultCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%" }}
        whenCreated={(map) => {
          mapRef.current = map;
        }}
        zoomControl={false}
      >
        <TileLayer
          // Consider a different tile layer for a more modern base map if desired, e.g., 'CartoDB positron'
          // url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
          // attribution="&copy; <a href='https://stadiamaps.com/'>Stadia Maps</a> &copy; <a href='https://openmaptiles.org/'>OpenMapTiles</a> &copy; <a href='https://openstreetmap.org'>OpenStreetMap</a> contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <HeatmapLayer points={employeeData} />
        <ZoomControl position="bottomright" />
      </MapContainer>
    </div>
  );
};

export default LeafletHeatMap;