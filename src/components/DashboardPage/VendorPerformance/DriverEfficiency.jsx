import React, { useEffect, useState, useMemo } from "react";
import { apiService } from "../../../services/api.js";
import Loader from "../../common/Loader";
import EChartsBase, {
  ANIMATION_CONFIG,
} from "../EChartsBase";

const DriverEfficiencyRadar = ({ filter = {} }) => {
  const [data, setData] = useState([]);
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
        let res = await apiService.getchart_DriverEfficiency(params);

        if (typeof res === "string") {
          try {
            res = JSON.parse(res);
          } catch {
            throw new Error("Invalid JSON returned from API");
          }
        }

        if (!Array.isArray(res)) throw new Error("Unexpected API response");

        const mapped = res.map((item, idx) => {
          const trips = Number(item.triptype ?? idx + 1);
          return {
            triptype: `${trips} Trip${trips > 1 ? "s" : ""}/Day`,
            avgTrips: Number(item.AvgDrivertrip) || 0,
          };
        });

        if (mapped.length === 0) throw new Error("No data available");

        if (mounted) {
          setData(mapped);
          setRetryCount(0);
          setError(null);
        }
      } catch (err) {
        console.error("DriverEfficiencyRadar fetch error:", err);
        setError(err.message || String(err));

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying DriverEfficiency... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          if (mounted) setData([]);
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
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(10, ...data.map((d) => d.avgTrips)) * 1.1;
    const indicators = data.map((d) => ({
      name: d.triptype,
      max: maxValue,
    }));
    const values = data.map((d) => d.avgTrips);

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
          let result = `<div style="font-weight: 600; margin-bottom: 8px;">Driver Trip Distribution</div>`;
          data.forEach((item, idx) => {
            result += `<div style="margin: 4px 0;">${item.triptype}: <strong>${params.value[idx].toFixed(2)} avg trips</strong></div>`;
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
          fontSize: 11,
        },
        splitArea: {
          areaStyle: {
            color: ["rgba(54, 162, 235, 0.02)", "rgba(54, 162, 235, 0.05)"],
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
          name: "Avg Trips/Driver",
          type: "radar",
          data: [
            {
              value: values,
              name: "Avg Trips/Driver",
              symbol: "circle",
              symbolSize: 8,
              lineStyle: {
                color: "rgba(54, 162, 235, 1)",
                width: 2,
              },
              itemStyle: {
                color: "rgba(54, 162, 235, 1)",
                borderColor: "#fff",
                borderWidth: 2,
              },
              areaStyle: {
                color: "rgba(54, 162, 235, 0.2)",
              },
            },
          ],
        },
      ],
    };
  }, [data]);

  if (error && retryCount >= maxRetries) {
    return (
      <div className="cardx border-0 p-3 h-100">
        <h6>Driver Trip Distribution (Average Trips per Driver)</h6>
        <hr />
        <div
          style={{
            padding: "2rem",
            background: "#fff3cd",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #ffc107",
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
      <h6>Driver Trip Distribution (Average Trips per Driver)</h6>
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
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 10,
              marginTop: 10,
            }}
          >
            {data.map((d, i) => (
              <div
                key={i}
                style={{
                  background: "#f5f5f5",
                  padding: "4px 8px",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#333",
                }}
              >
                {d.triptype} — {d.avgTrips.toFixed(2)}
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

export default DriverEfficiencyRadar;