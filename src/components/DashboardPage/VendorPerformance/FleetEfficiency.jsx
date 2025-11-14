import React, { useEffect, useState } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { apiService } from "../../../services/api";
import Loader from "../../common/Loader";

const SAMPLE_PAYLOAD = {
  deployedcount: 202,
  OperationalVehicle: 778,
  NotDeployedcount: 576,
  totalroute: 2661,
  Breakdowncount: 0,
  VehicleEffPer: 25.96,
};

const renderNeedle = (value, cx, cy, outerRadius, color) => {
  const degree = 180 - (Number(value) || 0) * 1.8;
  const radian = (degree * Math.PI) / 180;
  const length = outerRadius - 15;
  const x = cx + length * Math.cos(radian);
  const y = cy - length * Math.sin(radian);

  return (
    <>
      <circle cx={cx} cy={cy} r={5} fill={color} />
      <line
        x1={cx}
        y1={cy}
        x2={x}
        y2={y}
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </>
  );
};

const FleetEfficiency = ({ filter = {} }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([
    { name: "Operational Vehicle", value: 0, color: "#666666" },
    { name: "Not Deployed Count", value: 0, color: "#e6a749" },
    { name: "Breakdown Count", value: 0, color: "#84c1e9" },
  ]);
  const [effPercent, setEffPercent] = useState(null);
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

    const requestWithTimeout = (promise, ms = 8000) => {
      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("Request timed out")),
          ms
        );
      });
      return Promise.race([promise, timeoutPromise]).finally(() =>
        clearTimeout(timeoutId)
      );
    };

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await requestWithTimeout(
          apiService.getchart_Efficiency({
            sDate: sDate || null,
            eDate: eDate || null,
            locationid: locationid || null,
            facilityid: facilityid || null,
            vendorid: vendorid || null,
            triptype: triptype || null,
          }),
          8000
        );

        let payload = res?.data ?? res;
        if (typeof payload === "string") {
          try {
            payload = JSON.parse(payload);
          } catch (_) {}
        }

        const obj = Array.isArray(payload) ? payload[0] : payload || {};

        const operational = Number(
          obj.OperationalVehicle ?? obj.deployedcount ?? 0
        );
        const notDeployed = Number(
          obj.NotDeployedcount ?? obj.NotDeployedCount ?? 0
        );
        const breakdown = Number(obj.Breakdowncount ?? 0);
        const vehicleEffPer =
          obj.VehicleEffPer ?? obj.vehicleEffPer ?? null;

        if (mounted) {
          setChartData([
            {
              name: "Operational Vehicle",
              value: operational,
              color: "#666666",
            },
            {
              name: "Not Deployed Count",
              value: notDeployed,
              color: "#e6a749",
            },
            { name: "Breakdown Count", value: breakdown, color: "#84c1e9" },
          ]);
          setEffPercent(
            vehicleEffPer != null ? Number(vehicleEffPer) : null
          );
          setRetryCount(0);
          setError(null);
        }
      } catch (err) {
        console.error("FleetEfficiency fetch error:", err);
        setError(err?.message || "Failed to load data");

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying FleetEfficiency... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          if (mounted) {
            setChartData([
              {
                name: "Operational Vehicle",
                value: 0,
                color: "#666666",
              },
              {
                name: "Not Deployed Count",
                value: 0,
                color: "#e6a749",
              },
              { name: "Breakdown Count", value: 0, color: "#84c1e9" },
            ]);
            setEffPercent(null);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [sDate, eDate, locationid, facilityid, vendorid, triptype, retryCount]);

  if (error && retryCount >= maxRetries) {
    return (
      <div className="cardx border-0 p-3 h-100">
        <h6>Fleet Efficiency</h6>
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
            minHeight: "250px",
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
      <h6>Fleet Efficiency</h6>
      <hr />

      <div className="text-center">
        {!loading && (
          <>
            <div style={{ width: 300, height: 200, margin: "0 auto" }}>
              <PieChart width={300} height={200}>
                <Pie
                  dataKey="value"
                  startAngle={180}
                  endAngle={0}
                  data={chartData}
                  cx={150}
                  cy={150}
                  innerRadius={50}
                  outerRadius={100}
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                    />
                  ))}
                </Pie>
                {effPercent != null &&
                  renderNeedle(effPercent, 150, 150, 100, "#374151")}
              </PieChart>
            </div>

            <div className="mt-3">
              {effPercent != null && (
                <>
                  <h4 className="fw-bold text-primary">{effPercent}%</h4>
                  <p className="text-muted mb-2">Current Efficiency</p>
                </>
              )}

              <div className="d-flex justify-content-center gap-4 mt-3">
                {chartData.map((item, index) => (
                  <div key={index} className="d-flex flex-column align-items-center">
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: item.color,
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 600,
                      }}
                    >
                      {item.value}
                    </div>
                    <small className="text-muted mt-2">{item.name}</small>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FleetEfficiency;