import React, { useEffect, useState, useMemo } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import { apiService } from "../../../services/api.js";
import Loader from "../../common/Loader";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

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

  const chartData = useMemo(() => {
    const maxValue =
      data.length > 0
        ? Math.max(...data.map((d) => d.avgTrips || 0)) * 1.1
        : 10;

    return {
      labels: data.map((d) => d.triptype),
      datasets: [
        {
          label: "Avg Trips/Driver",
          data: data.map((d) => d.avgTrips),
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 2,
          pointBackgroundColor: "rgba(54, 162, 235, 1)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(54, 162, 235, 1)",
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };
  }, [data]);

  const chartOptions = useMemo(() => {
    const maxValue =
      data.length > 0
        ? Math.max(...data.map((d) => d.avgTrips || 0)) * 1.1
        : 10;

    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: {
            display: true,
            color: "rgba(0, 0, 0, 0.1)",
          },
          grid: {
            color: "rgba(0, 0, 0, 0.1)",
          },
          pointLabels: {
            font: {
              size: 11,
              family: "'Segoe UI', sans-serif",
            },
            color: "#555",
          },
          ticks: {
            backdropColor: "transparent",
            color: "#888",
            font: {
              size: 10,
            },
            stepSize: maxValue / 5,
            maxTicksLimit: 6,
          },
          min: 0,
          max: maxValue,
        },
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: {
              size: 12,
              family: "'Segoe UI', sans-serif",
            },
            padding: 20,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          titleColor: "#333",
          bodyColor: "#333",
          borderColor: "rgba(0, 0, 0, 0.1)",
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            title: function (context) {
              return context[0].label;
            },
            label: function (context) {
              return `Avg: ${context.raw.toFixed(2)} trips per driver`;
            },
          },
        },
      },
      elements: {
        line: {
          tension: 0.1,
        },
      },
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

      {!loading && (
        <>
          <div style={{ height: "260px", position: "relative" }}>
            <Radar data={chartData} options={chartOptions} />
          </div>

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
    </div>
  );
};

export default DriverEfficiencyRadar;