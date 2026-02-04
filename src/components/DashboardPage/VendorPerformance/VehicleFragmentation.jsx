import React, { useState, useEffect, useMemo } from "react";
import { apiService } from "../../../services/api.js";
import Loader from "../../common/Loader";
import EChartsBase, {
  ANIMATION_CONFIG,
} from "../EChartsBase";

const VehicleFragmentation = ({ filter = {} }) => {
  const [vehicleData, setVehicleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const {
    sDate = "",
    eDate = "",
    locationid = "",
    facilityid = "",
    vendorid = "",
    triptype = "",
  } = filter;

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!mounted) return;
      setLoading(true);
      setError(null);

      try {
        const params = {
          sDate,
          eDate,
          locationid,
          facilityid,
          vendorid,
          triptype,
        };

        let data = await apiService.getchart_VehFrag(params);

        if (typeof data === "string") {
          try {
            data = JSON.parse(data);
          } catch (parseErr) {
            throw new Error("Invalid JSON returned from API");
          }
        }

        if (!Array.isArray(data))
          throw new Error("API did not return an array");

        const mapped = data.map((item) => ({
          name: item.Vehicletype,
          value: Number(item.totalroute) || 0,
          routePer:
            item.routePer !== undefined ? Number(item.routePer) : undefined,
        }));

        if (mapped.length === 0) throw new Error("No data available");

        if (mounted) {
          setVehicleData(mapped);
          setRetryCount(0);
          setError(null);
        }
      } catch (err) {
        console.error("VehicleFragmentation fetch error:", err);
        setError(err.message || String(err));

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying VehicleFragmentation... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          if (mounted) setVehicleData([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [sDate, eDate, locationid, facilityid, vendorid, triptype, retryCount]);

  // Generate ECharts option for radar chart
  const chartOption = useMemo(() => {
    if (!vehicleData || vehicleData.length === 0) return null;

    const maxValue = Math.max(100, ...vehicleData.map((d) => d.value));
    const indicators = vehicleData.map((d) => ({
      name: d.name,
      max: maxValue,
    }));
    const values = vehicleData.map((d) => d.value);

    return {
      ...ANIMATION_CONFIG,
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        textStyle: {
          color: "#374151",
          fontSize: 13,
        },
        padding: [10, 14],
        extraCssText: "box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); border-radius: 8px;",
        formatter: (params) => {
          if (!params.value) return "";
          let result = `<div style="font-weight: 600; margin-bottom: 8px;">${params.name}</div>`;
          vehicleData.forEach((item, idx) => {
            const percent = item.routePer !== undefined ? ` (${item.routePer}%)` : "";
            result += `<div style="margin: 4px 0;">${item.name}: <strong>${params.value[idx]} routes</strong>${percent}</div>`;
          });
          return result;
        },
      },
      radar: {
        indicator: indicators,
        shape: "polygon",
        radius: "60%",
        center: ["50%", "50%"],
        axisName: {
          color: "#6b7280",
          fontSize: 10,
        },
        splitArea: {
          areaStyle: {
            color: ["rgba(99, 102, 241, 0.02)", "rgba(99, 102, 241, 0.04)"],
          },
        },
        axisLine: {
          lineStyle: {
            color: "#e5e7eb",
          },
        },
        splitLine: {
          lineStyle: {
            color: "#e5e7eb",
          },
        },
      },
      series: [
        {
          name: "Vehicle Types",
          type: "radar",
          data: [
            {
              value: values,
              name: "Routes by Vehicle",
              symbol: "circle",
              symbolSize: 6,
              lineStyle: {
                color: "#3b82f6",
                width: 2,
              },
              itemStyle: {
                color: "#3b82f6",
              },
              areaStyle: {
                color: "rgba(59, 130, 246, 0.2)",
              },
            },
          ],
        },
      ],
    };
  }, [vehicleData]);

  if (error && retryCount >= maxRetries) {
    return (
      <div className="cardx border-0 p-3 h-100">
        <h6>Vehicle Fragmentation</h6>
        <hr />
        <div
          style={{
            padding: "2rem",
            background: "#fff3cd",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #ffc107",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "240px",
          }}
        >
          <p style={{ color: "#856404", marginBottom: "1rem" }}>
            ⚠️ Failed to load chart data
          </p>
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
      </div>
    );
  }

  return (
    <div className="cardx border-0 p-3 h-100">
      <Loader isVisible={loading} fullScreen={false} />
      <h6>Vehicle Fragmentation</h6>
      <hr />
      {!loading && chartOption && (
        <>
          <EChartsBase
            option={chartOption}
            height="240px"
            loading={loading}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 10,
            }}
          >
            {vehicleData.map((d, i) => (
              <div
                key={i}
                title={`${d.name} - ${d.value} routes${
                  d.routePer !== undefined ? ` - ${d.routePer}%` : ""
                }`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 8px",
                  borderRadius: 12,
                  background: "#f5f5f5",
                  fontSize: 12,
                  color: "#333",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    background: "#3b82f6",
                    borderRadius: 2,
                    display: "inline-block",
                  }}
                />
                <span style={{ whiteSpace: "nowrap" }}>
                  {d.name} — {Number(d.value || 0).toLocaleString()} routes
                  {d.routePer !== undefined ? ` — ${d.routePer}%` : ""}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
      {!loading && !chartOption && (
        <div className="text-center text-muted py-5">
          <p>No data available.</p>
        </div>
      )}
    </div>
  );
};

export default VehicleFragmentation;