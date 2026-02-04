import React, { useEffect, useState, useMemo } from "react";
import { apiService } from "../../../services/api";
import Loader from "../../common/Loader";
import * as echarts from "echarts";
import EChartsBase, {
  ANIMATION_CONFIG,
} from "../EChartsBase";

const FleetEfficiency = ({ filter = {} }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([
    { name: "Operational Vehicle", value: 0, color: "#6366f1" },
    { name: "Not Deployed", value: 0, color: "#f59e0b" },
    { name: "Breakdown", value: 0, color: "#ef4444" },
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
              name: "Operational",
              value: operational,
              color: "#6366f1",
            },
            {
              name: "Not Deployed",
              value: notDeployed,
              color: "#f59e0b",
            },
            { name: "Breakdown", value: breakdown, color: "#ef4444" },
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
              { name: "Operational", value: 0, color: "#6366f1" },
              { name: "Not Deployed", value: 0, color: "#f59e0b" },
              { name: "Breakdown", value: 0, color: "#ef4444" },
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

  // Generate ECharts option for gauge chart
  const chartOption = useMemo(() => {
    const percent = effPercent ?? 0;

    return {
      ...ANIMATION_CONFIG,
      series: [
        {
          type: "gauge",
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          radius: "100%",
          center: ["50%", "70%"],
          splitNumber: 5,
          axisLine: {
            lineStyle: {
              width: 20,
              color: [
                [0.25, "#ef4444"],
                [0.5, "#f59e0b"],
                [0.75, "#10b981"],
                [1, "#6366f1"],
              ],
            },
          },
          pointer: {
            icon: "path://M12.8,0.7l12,40.1H0.7L12.8,0.7z",
            length: "60%",
            width: 10,
            offsetCenter: [0, "-5%"],
            itemStyle: {
              color: "#374151",
            },
          },
          axisTick: {
            length: 8,
            lineStyle: {
              color: "auto",
              width: 2,
            },
          },
          splitLine: {
            length: 15,
            lineStyle: {
              color: "auto",
              width: 3,
            },
          },
          axisLabel: {
            color: "#6b7280",
            fontSize: 11,
            distance: -40,
            formatter: (value) => `${value}`,
          },
          title: {
            offsetCenter: [0, "20%"],
            fontSize: 14,
            color: "#6b7280",
          },
          detail: {
            fontSize: 28,
            offsetCenter: [0, "40%"],
            valueAnimation: true,
            formatter: (value) => `${value.toFixed(1)}%`,
            color: "#1f2937",
            fontWeight: "bold",
          },
          data: [
            {
              value: percent,
              name: "Fleet Efficiency",
            },
          ],
        },
      ],
    };
  }, [effPercent]);

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
            <EChartsBase
              option={chartOption}
              height="200px"
              loading={loading}
            />

            <div className="d-flex justify-content-center gap-3 mt-2">
              {chartData.map((item, index) => (
                <div key={index} className="d-flex flex-column align-items-center">
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: item.color,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {item.value}
                  </div>
                  <small className="text-muted mt-2" style={{ fontSize: 11 }}>
                    {item.name}
                  </small>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FleetEfficiency;