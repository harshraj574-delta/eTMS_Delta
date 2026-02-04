import React, { useEffect, useState, useMemo } from "react";
import { apiService } from "../../../services/api";
import Loader from "../../common/Loader";
import * as echarts from "echarts";
import EChartsBase, {
  TOOLTIP_CONFIG,
  LEGEND_CONFIG,
  GRID_CONFIG,
  X_AXIS_CONFIG,
  Y_AXIS_CONFIG,
  ANIMATION_CONFIG,
} from "../EChartsBase";

const RouteBreakDuty = ({ filter = {} }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = {
          sDate: filter.sDate,
          eDate: filter.eDate,
          locationid: filter.locationid || "",
          facilityid: filter.facilityid || "",
          vendorid: filter.vendorid || "",
          triptype: filter.triptype || "",
        };
        const result = await apiService.getchart_monthlyRoutedetails(params);
        let arr = result;
        if (typeof arr === "string") {
          try {
            arr = JSON.parse(arr);
          } catch (e) {
            arr = [];
          }
        }

        const chartData = (Array.isArray(arr) ? arr : []).map((item) => ({
          month: item.MonthName || item.month || item.Month || "",
          routes: Number(
            item.completecount ?? item.routes ?? item.Routes ?? 0
          ),
          breakdowns: Number(
            item.breakdowncount ?? item.breakdowns ?? item.Breakdowns ?? 0
          ),
          dutyHours: Number(
            item.dutyhourcount ?? item.dutyHours ?? item.DutyHours ?? 0
          ),
        }));

        if (chartData.length === 0) throw new Error("No data available");

        setData(chartData);
        setRetryCount(0);
        setError(null);
      } catch (err) {
        console.error("RouteBreakDuty Error:", err);
        setError(err?.message || "Error fetching data");

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying RouteBreakDuty... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          setData([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter, retryCount]);

  // Calculate totals
  const totals = useMemo(() => {
    return {
      routes: data.reduce((a, b) => a + b.routes, 0),
      breakdowns: data.reduce((a, b) => a + b.breakdowns, 0),
      dutyHours: data.reduce((a, b) => a + b.dutyHours, 0),
    };
  }, [data]);

  // Generate ECharts option
  const chartOption = useMemo(() => {
    if (!data || data.length === 0) return null;

    const months = data.map((item) => item.month);
    const routes = data.map((item) => item.routes);
    const breakdowns = data.map((item) => item.breakdowns);
    const dutyHours = data.map((item) => item.dutyHours);

    return {
      ...ANIMATION_CONFIG,
      tooltip: {
        ...TOOLTIP_CONFIG,
        trigger: "axis",
        axisPointer: {
          type: "cross",
          crossStyle: {
            color: "#999",
          },
        },
        formatter: (params) => {
          let result = `<div style="font-weight: 600; margin-bottom: 8px;">${params[0].axisValue}</div>`;
          params.forEach((param) => {
            const marker = `<span style="display:inline-block;margin-right:4px;border-radius:50%;width:10px;height:10px;background-color:${param.color};"></span>`;
            let unit = "";
            if (param.seriesName.includes("Duty")) unit = " hrs";
            result += `<div style="margin: 4px 0;">${marker}${param.seriesName}: <strong>${param.value}${unit}</strong></div>`;
          });
          return result;
        },
      },
      legend: {
        ...LEGEND_CONFIG,
        data: [
          `Routes Completed (${totals.routes})`,
          `Breakdowns (${totals.breakdowns})`,
          `Duty Hours (${totals.dutyHours})`,
        ],
        bottom: 10,
      },
      grid: {
        ...GRID_CONFIG,
        top: 40,
        bottom: 80,
        left: 60,
        right: 60,
      },
      xAxis: {
        ...X_AXIS_CONFIG,
        data: months,
        axisLabel: {
          ...X_AXIS_CONFIG.axisLabel,
          rotate: months.length > 6 ? 30 : 0,
        },
      },
      yAxis: [
        {
          ...Y_AXIS_CONFIG,
          name: "Routes / Duty Hours",
          nameLocation: "center",
          nameGap: 45,
          nameTextStyle: {
            color: "#6b7280",
            fontSize: 12,
          },
        },
        {
          ...Y_AXIS_CONFIG,
          name: "Breakdowns",
          nameLocation: "center",
          nameGap: 45,
          nameTextStyle: {
            color: "#6b7280",
            fontSize: 12,
          },
          position: "right",
          splitLine: {
            show: false,
          },
        },
      ],
      series: [
        {
          name: `Routes Completed (${totals.routes})`,
          type: "line",
          data: routes,
          smooth: true,
          symbol: "circle",
          symbolSize: 8,
          yAxisIndex: 0,
          lineStyle: {
            width: 3,
            color: "#3b82f6",
          },
          itemStyle: {
            color: "#3b82f6",
            borderWidth: 2,
            borderColor: "#fff",
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(59, 130, 246, 0.25)" },
              { offset: 1, color: "rgba(59, 130, 246, 0.02)" },
            ]),
          },
          emphasis: {
            focus: "series",
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(59, 130, 246, 0.5)",
            },
          },
        },
        {
          name: `Breakdowns (${totals.breakdowns})`,
          type: "line",
          data: breakdowns,
          smooth: true,
          symbol: "circle",
          symbolSize: 8,
          yAxisIndex: 1,
          lineStyle: {
            width: 3,
            color: "#ef4444",
          },
          itemStyle: {
            color: "#ef4444",
            borderWidth: 2,
            borderColor: "#fff",
          },
          emphasis: {
            focus: "series",
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(239, 68, 68, 0.5)",
            },
          },
        },
        {
          name: `Duty Hours (${totals.dutyHours})`,
          type: "line",
          data: dutyHours,
          smooth: true,
          symbol: "circle",
          symbolSize: 8,
          yAxisIndex: 0,
          lineStyle: {
            width: 3,
            color: "#10b981",
          },
          itemStyle: {
            color: "#10b981",
            borderWidth: 2,
            borderColor: "#fff",
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(16, 185, 129, 0.2)" },
              { offset: 1, color: "rgba(16, 185, 129, 0.02)" },
            ]),
          },
          emphasis: {
            focus: "series",
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(16, 185, 129, 0.5)",
            },
          },
        },
      ],
    };
  }, [data, totals]);

  if (error && retryCount >= maxRetries) {
    return (
      <div className="cardx border-0 p-3">
        <h6>Routes vs Breakdowns vs Duty Hours</h6>
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
      <h6>Routes vs Breakdowns vs Duty Hours</h6>
      <hr />
      {!loading && chartOption && (
        <EChartsBase
          option={chartOption}
          height="320px"
          loading={loading}
        />
      )}
      {!loading && !chartOption && (
        <div className="text-center text-muted py-5">
          <p>No data available.</p>
        </div>
      )}
    </div>
  );
};

export default RouteBreakDuty;