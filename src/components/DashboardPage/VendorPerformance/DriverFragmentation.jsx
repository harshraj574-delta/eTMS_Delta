import React, { useEffect, useState, useMemo } from "react";
import { apiService } from "../../../services/api";
import Loader from "../../common/Loader";
import EChartsBase, {
  ANIMATION_CONFIG,
} from "../EChartsBase";

const DriverFragmentation = ({ filter = {} }) => {
  const [driverData, setDriverData] = useState([]);
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

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await requestWithTimeout(
          apiService.getchart_Efficiency({
            sDate: filter.sDate,
            eDate: filter.eDate,
            locationid: filter.locationid || null,
            facilityid: filter.facilityid || null,
            vendorid: filter.vendorid || null,
            triptype: filter.triptype || null,
          })
        );

        let payload = res?.data ?? res;
        if (typeof payload === "string") {
          try {
            payload = JSON.parse(payload);
          } catch (e) {
            /* ignore */
          }
        }

        const obj = Array.isArray(payload) ? payload[0] : payload || {};

        const formattedData = [
          {
            name: "On-time Count",
            value: Number(
              obj.ontimecount ??
                obj.OnTimeCount ??
                obj.onTimeCount ??
                0
            ),
          },
          {
            name: "BGC Done",
            value: Number(
              obj.BGCDone ?? obj.BGCDoneCount ?? obj.bgcdone ?? 0
            ),
          },
          {
            name: "Driver Refusal",
            value: Number(
              obj.DriverRefusalCount ??
                obj.DriverRefusal ??
                obj.driverRefusalCount ??
                0
            ),
          },
          {
            name: "Drivers 50+ (%)",
            value: Number(
              obj.DriverfifthyAbovePer ??
                obj.DriverFiftyAbovePer ??
                obj.Driver50AbovePer ??
                0
            ),
            isPercent: true,
          },
          {
            name: "Duty Hour >12",
            value: Number(
              obj.dutyhourAboveTwelvecount ??
                obj.DutyHourAbove12Count ??
                obj.dutyHourAbove12Count ??
                0
            ),
          },
        ];

        if (mounted) {
          setDriverData(formattedData);
          setRetryCount(0);
          setError(null);
        }
      } catch (err) {
        console.error("API Error:", err);
        setError(err?.message || "Failed to load data");

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying DriverFragmentation... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          if (mounted) setDriverData([]);
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
    if (!driverData || driverData.length === 0) return null;

    const maxValue = Math.max(100, ...driverData.map((d) => d.value));
    const indicators = driverData.map((d) => ({
      name: d.name,
      max: maxValue,
    }));
    const values = driverData.map((d) => d.value);

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
          indicators.forEach((ind, idx) => {
            const isPercent = driverData[idx]?.isPercent;
            const unit = isPercent ? "%" : "";
            result += `<div style="margin: 4px 0;">${ind.name}: <strong>${params.value[idx]}${unit}</strong></div>`;
          });
          return result;
        },
      },
      radar: {
        indicator: indicators,
        shape: "polygon",
        radius: "65%",
        center: ["50%", "50%"],
        axisName: {
          color: "#6b7280",
          fontSize: 11,
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
          name: "Driver Metrics",
          type: "radar",
          data: [
            {
              value: values,
              name: "Driver Metrics",
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
  }, [driverData]);

  if (error && retryCount >= maxRetries) {
    return (
      <div className="cardx border-0 p-3">
        <h6>Driver Fragmentation</h6>
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
    <div className="cardx border-0 p-3">
      <Loader isVisible={loading} fullScreen={false} />
      <h6>Driver Fragmentation</h6>
      <hr />
      {!loading && chartOption && (
        <>
          <EChartsBase
            option={chartOption}
            height="280px"
            loading={loading}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginTop: 12,
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {driverData.map((d, i) => {
              const isPercent = d.isPercent;
              return (
                <div
                  key={i}
                  style={{
                    flex: "1 1 18%",
                    minWidth: 110,
                    textAlign: "center",
                    padding: "6px 8px",
                    borderRadius: 6,
                    background: "#fafafa",
                    border: "1px solid rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: "#555",
                      marginBottom: 4,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {d.name}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>
                    {isPercent ? `${d.value}%` : d.value}
                  </div>
                </div>
              );
            })}
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

export default DriverFragmentation;