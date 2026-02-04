import { useState, useEffect, useMemo } from "react";
import { apiService } from "../../services/api";
import { BiExpand } from "react-icons/bi";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import Loader from "../common/Loader";
import React from "react";
import EChartsBase, {
  ANIMATION_CONFIG,
} from "./EChartsBase";

const RiShiftCompletionPending = ({ filter }) => {
  const [chartData, setChartData] = useState(null);
  const [isAllZero, setIsAllZero] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await apiService.getShiftCompletePending({
          sDate: filter.sDate,
          eDate: filter.eDate,
          locationid: filter.locationid || "",
          facilityid: filter.facilityid || "",
          vendorid: filter.vendorid || "",
          triptype: filter.triptype || "",
        });

        let responseData = [];

        if (typeof res === "string") {
          try {
            responseData = JSON.parse(res);
          } catch (err) {
            console.error("Invalid JSON from API", err);
            throw err;
          }
        } else {
          responseData = res;
        }

        const data = responseData[0] || {};

        const values = [
          Number(data?.TotalRoutes ?? 0),
          Number(data?.Allocated ?? 0),
          Number(data?.Accepted ?? 0),
          Number(data?.VehicleStart ?? 0),
          Number(data?.VehicleEnd ?? 0),
          Number(data?.VehicleNoStart ?? 0),
        ];

        const labels = [
          "Total Routes",
          "Allocated",
          "Accepted by Drivers",
          "Started",
          "Trip Completed",
          "Vehicle Not Started",
        ];

        const colors = [
          "#6b7280",
          "#6366f1",
          "#10b981",
          "#ec4899",
          "#f59e0b",
          "#1f2937",
        ];

        const total = values[0];
        setIsAllZero(values.every((v) => v === 0));

        setChartData({
          labels,
          values,
          colors,
          total,
        });

        setRetryCount(0);
        setError(null);
      } catch (error) {
        console.error("Error fetching shift data", error);
        setError(error?.message || "Failed to load chart data");

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying ShiftCompletion... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          setChartData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [filter, retryCount]);

  // Generate ECharts option for horizontal bar chart
  const chartOption = useMemo(() => {
    if (!chartData || isAllZero) return null;

    const { labels, values, colors, total } = chartData;

    // Create percentage values for visualization but show absolute in tooltip
    const percentages = values.map((v) =>
      total > 0 ? Math.min((v / total) * 100, 100) : 0
    );

    return {
      ...ANIMATION_CONFIG,
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
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
          const param = params[0];
          const idx = param.dataIndex;
          const percentage = total > 0 ? ((values[idx] / total) * 100).toFixed(1) : 0;
          return `
            <div style="font-weight: 600; margin-bottom: 6px;">${labels[idx]}</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background-color:${colors[idx]};"></span>
              <span><strong>${values[idx]}</strong> (${percentage}%)</span>
            </div>
          `;
        },
      },
      grid: {
        top: 20,
        right: 80,
        bottom: 20,
        left: 130,
        containLabel: false,
      },
      xAxis: {
        type: "value",
        max: 100,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: "category",
        data: labels,
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#374151",
          fontSize: 12,
          fontWeight: 500,
          margin: 12,
        },
      },
      series: [
        {
          type: "bar",
          data: percentages.map((val, idx) => ({
            value: val,
            itemStyle: {
              color: colors[idx],
              borderRadius: [0, 4, 4, 0],
            },
          })),
          barWidth: 12,
          label: {
            show: true,
            position: "right",
            formatter: (param) => values[param.dataIndex],
            color: "#374151",
            fontSize: 12,
            fontWeight: 600,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 8,
              shadowColor: "rgba(0, 0, 0, 0.15)",
            },
          },
          // Background bars
          showBackground: true,
          backgroundStyle: {
            color: "#f3f4f6",
            borderRadius: [0, 4, 4, 0],
          },
        },
      ],
    };
  }, [chartData, isAllZero]);

  if (error && retryCount >= maxRetries) {
    return (
      <div className="cardx border-0 p-3">
        <h6>Route Completion</h6>
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
      <div className="d-flex justify-content-between align-items-center border-0">
        <h6>Route Completion</h6>
        <span
          id="routeCompletion"
          style={{ cursor: "pointer" }}
          onClick={() => setDialogVisible(true)}
        >
          <BiExpand />
        </span>
      </div>
      <hr />

      <div className="py-3">
        {!loading && chartOption && (
          <EChartsBase
            option={chartOption}
            height="280px"
            loading={loading}
          />
        )}
        {!loading && !chartOption && !isAllZero && (
          <div className="text-center text-muted py-5">
            <p>No data available</p>
          </div>
        )}
        {!loading && isAllZero && (
          <p className="text-muted mt-2 text-sm text-center py-4">
            Note: All values are currently zero for this period.
          </p>
        )}
      </div>

      <Dialog
        header={"Route Completion"}
        visible={dialogVisible}
        style={{ width: "90vw", minHeight: "90vh" }}
        onHide={() => setDialogVisible(false)}
      >
        {chartOption && (
          <EChartsBase
            option={chartOption}
            height="70vh"
            loading={loading}
          />
        )}
      </Dialog>
      <Tooltip target="#routeCompletion" content="Expand" position="top" />
    </div>
  );
};

export default React.memo(RiShiftCompletionPending);