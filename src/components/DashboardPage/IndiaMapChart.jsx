import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as echarts from "echarts";
import Loader from "../common/Loader";

// India states with their approximate centers for data aggregation
const INDIA_STATES = {
  "Delhi": { center: [77.209, 28.6139], aliases: ["New Delhi", "NCT of Delhi", "NCR"] },
  "Haryana": { center: [76.0856, 29.0588], aliases: ["HR"] },
  "Uttar Pradesh": { center: [80.9462, 26.8467], aliases: ["UP"] },
  "Maharashtra": { center: [75.7139, 19.7515], aliases: ["MH"] },
  "Karnataka": { center: [75.7139, 15.3173], aliases: ["KA", "Bengaluru", "Bangalore"] },
  "Tamil Nadu": { center: [78.6569, 11.1271], aliases: ["TN", "Chennai"] },
  "Gujarat": { center: [71.1924, 22.2587], aliases: ["GJ"] },
  "Rajasthan": { center: [74.2179, 27.0238], aliases: ["RJ"] },
  "West Bengal": { center: [87.855, 22.9868], aliases: ["WB", "Kolkata"] },
  "Punjab": { center: [75.3412, 31.1471], aliases: ["PB"] },
  "Madhya Pradesh": { center: [78.6569, 22.9734], aliases: ["MP"] },
  "Bihar": { center: [85.3131, 25.0961], aliases: ["BR"] },
  "Andhra Pradesh": { center: [79.74, 15.9129], aliases: ["AP"] },
  "Telangana": { center: [79.0193, 18.1124], aliases: ["TS", "Hyderabad"] },
  "Kerala": { center: [76.2711, 10.8505], aliases: ["KL"] },
  "Odisha": { center: [85.0985, 20.9517], aliases: ["OR", "Orissa"] },
  "Jharkhand": { center: [85.2799, 23.6102], aliases: ["JH"] },
  "Chhattisgarh": { center: [81.8661, 21.2787], aliases: ["CG"] },
  "Assam": { center: [92.9376, 26.2006], aliases: ["AS"] },
  "Uttarakhand": { center: [79.0193, 30.0668], aliases: ["UK", "Uttaranchal"] },
  "Himachal Pradesh": { center: [77.1734, 31.1048], aliases: ["HP"] },
  "Goa": { center: [74.124, 15.2993], aliases: ["GA"] },
  "Jammu and Kashmir": { center: [74.7973, 33.7782], aliases: ["JK"] },
  "Ladakh": { center: [77.6151, 34.1526], aliases: ["LA"] },
  "Chandigarh": { center: [76.7794, 30.7333], aliases: ["CH"] },
  "Puducherry": { center: [79.8083, 11.9416], aliases: ["PY", "Pondicherry"] },
  "Andaman and Nicobar Islands": { center: [92.6586, 11.7401], aliases: ["AN"] },
  "Lakshadweep": { center: [72.6369, 10.5667], aliases: ["LD"] },
  "Dadra and Nagar Haveli and Daman and Diu": { center: [73.0169, 20.1809], aliases: ["DN", "DD"] },
  "Sikkim": { center: [88.5122, 27.533], aliases: ["SK"] },
  "Arunachal Pradesh": { center: [94.7278, 28.218], aliases: ["AR"] },
  "Nagaland": { center: [94.5624, 26.1584], aliases: ["NL"] },
  "Manipur": { center: [93.9063, 24.6637], aliases: ["MN"] },
  "Mizoram": { center: [92.9376, 23.1645], aliases: ["MZ"] },
  "Tripura": { center: [91.9882, 23.9408], aliases: ["TR"] },
  "Meghalaya": { center: [91.3662, 25.467], aliases: ["ML"] },
};

// India GeoJSON URL (using a CDN-hosted version)
const INDIA_GEOJSON_URL = "https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson";

const IndiaMapChart = ({ filter, type = 1, height = "100%" }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [geoJsonLoaded, setGeoJsonLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Fetch India GeoJSON
  useEffect(() => {
    const loadGeoJson = async () => {
      try {
        const response = await fetch(INDIA_GEOJSON_URL);
        const geoJson = await response.json();
        echarts.registerMap("india", geoJson);
        setGeoJsonLoaded(true);
      } catch (err) {
        console.error("Failed to load India GeoJSON:", err);
        // Create a simple fallback India outline
        setGeoJsonLoaded(true);
      }
    };
    loadGeoJson();
  }, []);

  // Fetch employee data from API
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
          body: JSON.stringify({
            facilityid: filter?.facilityid,
            sDate: filter?.sDate,
            eDate: filter?.eDate,
            triptype: filter?.triptype,
            type: type,
          }),
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        let data = await response.json();
        if (typeof data === "string") data = JSON.parse(data);
        if (!Array.isArray(data)) throw new Error("API response not an array");

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
        console.error("IndiaMap Error:", err);
        setError(`Error fetching data: ${err.message}`);

        if (retryCount < maxRetries) {
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
  }, [
    filter?.facilityid,
    filter?.sDate,
    filter?.eDate,
    filter?.triptype,
    type,
    retryCount,
  ]);

  // Aggregate employee data by state
  const stateData = useMemo(() => {
    const stateCounts = {};
    
    // Initialize all states with 0
    Object.keys(INDIA_STATES).forEach((state) => {
      stateCounts[state] = 0;
    });

    // Count employees by finding nearest state
    employeeData.forEach((emp) => {
      let minDist = Infinity;
      let nearestState = "Delhi";

      Object.entries(INDIA_STATES).forEach(([state, info]) => {
        const dist = Math.sqrt(
          Math.pow(emp.geoX - info.center[0], 2) +
          Math.pow(emp.geoY - info.center[1], 2)
        );
        if (dist < minDist) {
          minDist = dist;
          nearestState = state;
        }
      });

      stateCounts[nearestState]++;
    });

    // Convert to array format for ECharts
    return Object.entries(stateCounts)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  }, [employeeData]);

  // Calculate stats
  const stats = useMemo(() => {
    const values = stateData.map((d) => d.value);
    const maxValue = Math.max(...values, 0);
    const total = values.reduce((a, b) => a + b, 0);
    return { maxValue, total };
  }, [stateData]);

  // Initialize and update chart
  useEffect(() => {
    if (!chartRef.current || !geoJsonLoaded) return;

    // Initialize chart
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current, null, {
        renderer: "canvas",
      });
    }

    const chart = chartInstanceRef.current;

    const option = {
      backgroundColor: "#1e293b",
      title: {
        show: false,
      },
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderColor: "#475569",
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: "#f1f5f9",
          fontSize: 13,
        },
        formatter: (params) => {
          if (params.value === undefined || params.value === 0) {
            return `<div style="font-weight: 600;">${params.name}</div>
                    <div style="color: #94a3b8; margin-top: 4px;">No data</div>`;
          }
          return `<div style="font-weight: 600;">${params.name}</div>
                  <div style="margin-top: 8px;">
                    <span style="color: #94a3b8;">${type === 2 ? "Routes" : "Employees"}:</span>
                    <span style="font-weight: 600; color: #fbbf24; margin-left: 8px;">${params.value.toLocaleString()}</span>
                  </div>`;
        },
      },
      visualMap: {
        type: "continuous",
        min: 0,
        max: stats.maxValue || 100,
        text: ["High", "Low"],
        orient: "vertical",
        right: 20,
        bottom: 20,
        itemWidth: 12,
        itemHeight: 100,
        textStyle: {
          color: "#94a3b8",
          fontSize: 11,
        },
        inRange: {
          color: [
            "#1e3a5f",
            "#2563eb",
            "#3b82f6",
            "#60a5fa",
            "#93c5fd",
            "#fbbf24",
            "#f59e0b",
            "#d97706",
            "#b45309",
          ],
        },
        calculable: true,
      },
      series: [
        {
          name: type === 2 ? "Routes" : "Employees",
          type: "map",
          map: "india",
          roam: true,
          zoom: 1.1,
          center: [82, 22],
          scaleLimit: {
            min: 0.8,
            max: 5,
          },
          label: {
            show: false,
            fontSize: 9,
            color: "#94a3b8",
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 600,
              color: "#fff",
            },
            itemStyle: {
              areaColor: "#6366f1",
              shadowBlur: 20,
              shadowColor: "rgba(99, 102, 241, 0.5)",
            },
          },
          itemStyle: {
            areaColor: "#334155",
            borderColor: "#475569",
            borderWidth: 1,
          },
          select: {
            itemStyle: {
              areaColor: "#6366f1",
            },
          },
          data: stateData,
        },
      ],
    };

    chart.setOption(option, true);

    // Handle resize
    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, [stateData, stats, type, geoJsonLoaded]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  if (error && retryCount >= maxRetries) {
    return (
      <div
        style={{
          height: height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1e293b",
          borderRadius: "12px",
          flexDirection: "column",
        }}
      >
        <p style={{ color: "#fbbf24", marginBottom: "1rem" }}>⚠️ {error}</p>
        <button
          onClick={() => setRetryCount(0)}
          style={{
            padding: "0.5rem 1rem",
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: height, width: "100%", position: "relative" }}>
      <Loader isVisible={loading || !geoJsonLoaded} fullScreen={false} />
      
      {/* Stats overlay */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 10,
          background: "rgba(15, 23, 42, 0.9)",
          backdropFilter: "blur(8px)",
          padding: "12px 16px",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
          Total {type === 2 ? "Routes" : "Employees"}
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>
          {stats.total.toLocaleString()}
        </div>
      </div>

      {/* Chart container */}
      <div
        ref={chartRef}
        style={{
          height: "100%",
          width: "100%",
          background: "#1e293b",
          borderRadius: "12px",
        }}
      />
    </div>
  );
};

export default React.memo(IndiaMapChart);
