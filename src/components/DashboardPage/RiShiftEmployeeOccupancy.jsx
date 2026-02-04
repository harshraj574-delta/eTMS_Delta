import { useState, useEffect, useMemo } from "react";
import { apiService } from "../../services/api";
import { BiExpand } from "react-icons/bi";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import Loader from "../common/Loader";
import React from "react";
import * as echarts from "echarts";
import EChartsBase, {
  CHART_COLORS,
  TOOLTIP_CONFIG,
  LEGEND_CONFIG,
  GRID_CONFIG,
  X_AXIS_CONFIG,
  Y_AXIS_CONFIG,
  ANIMATION_CONFIG,
} from "./EChartsBase";

const RiShiftEmployeeOccupancy = ({ filter }) => {
  const [chartData, setChartData] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const padded = timeStr.padStart(4, "0");
    return `${padded.slice(0, 2)}:${padded.slice(2)}`;
  };

  useEffect(() => {
    const fetchOccupancyData = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = {
          sDate: filter.sDate,
          eDate: filter.eDate,
          locationid: filter.locationid || "",
          facilityid: filter.facilityid,
          vendorid: filter.vendorid || "",
          triptype: filter.triptype || "",
        };

        const response = await apiService.GetEmpOccupancy(params);

        let data = [];
        if (Array.isArray(response)) data = response;
        else if (Array.isArray(response?.data)) data = response.data;
        else if (typeof response === "string") {
          try {
            const parsed = JSON.parse(response);
            if (Array.isArray(parsed)) data = parsed;
          } catch {
            throw new Error("Invalid JSON response");
          }
        }
        if (!Array.isArray(data) || data.length === 0)
          throw new Error("No data available");

        const sortedData = data
          .filter((item) => item.shiftTime)
          .sort(
            (a, b) =>
              Number(a.shiftTime.padStart(4, "0")) -
              Number(b.shiftTime.padStart(4, "0"))
          );

        const labels = sortedData.map((item) => formatTime(item.shiftTime));
        const occupancyData = sortedData.map((item) =>
          Number(item.AvgOccupancyPer || 0)
        );
        const employeeData = sortedData.map((item) =>
          Number(item.totalemplyee || item.totalemployee || 0)
        );

        const totalOccupancy = occupancyData.reduce((a, b) => a + b, 0);
        const totalEmployees = employeeData.reduce((a, b) => a + b, 0);

        setChartData({
          labels,
          occupancyData,
          employeeData,
          totalOccupancy: totalOccupancy.toFixed(1),
          totalEmployees,
        });

        setRetryCount(0);
        setError(null);
      } catch (error) {
        console.error("Error fetching occupancy data:", error);
        setError(error?.message || "Failed to load chart data");

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying Occupancy... Attempt ${retryCount + 1}/${maxRetries}`
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

    if (filter?.sDate && filter?.eDate) {
      fetchOccupancyData();
    }
  }, [filter, retryCount]);

  // Generate ECharts option
  const chartOption = useMemo(() => {
    if (!chartData) return null;

    const { labels, occupancyData, employeeData, totalOccupancy, totalEmployees } = chartData;

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
            const unit = param.seriesIndex === 0 ? "%" : "";
            result += `<div style="margin: 4px 0;">${marker}${param.seriesName}: <strong>${param.value}${unit}</strong></div>`;
          });
          return result;
        },
      },
      legend: {
        ...LEGEND_CONFIG,
        data: [
          `Seat Utilization % (${totalOccupancy})`,
          `Number Of Employees (${totalEmployees})`,
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
        data: labels,
        axisLabel: {
          ...X_AXIS_CONFIG.axisLabel,
          rotate: labels.length > 12 ? 45 : 0,
        },
        name: "Shift Time (24-hour)",
        nameLocation: "center",
        nameGap: 35,
        nameTextStyle: {
          color: "#6b7280",
          fontSize: 12,
        },
      },
      yAxis: [
        {
          ...Y_AXIS_CONFIG,
          name: "Seat Utilization %",
          nameLocation: "center",
          nameGap: 45,
          nameTextStyle: {
            color: "#6b7280",
            fontSize: 12,
          },
          max: Math.max(100, Math.ceil(Math.max(...occupancyData) / 10) * 10),
        },
        {
          ...Y_AXIS_CONFIG,
          name: "Number Of Employees",
          nameLocation: "center",
          nameGap: 45,
          nameTextStyle: {
            color: "#6b7280",
            fontSize: 12,
          },
          position: "right",
          max: Math.max(700, Math.ceil(Math.max(...employeeData) / 100) * 100),
          splitLine: {
            show: false,
          },
        },
      ],
      series: [
        {
          name: `Seat Utilization % (${totalOccupancy})`,
          type: "line",
          data: occupancyData,
          smooth: true,
          symbol: "circle",
          symbolSize: 8,
          yAxisIndex: 0,
          lineStyle: {
            width: 3,
            color: "#63abfd",
          },
          itemStyle: {
            color: "#63abfd",
            borderWidth: 2,
            borderColor: "#fff",
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(99, 171, 253, 0.35)" },
              { offset: 1, color: "rgba(99, 171, 253, 0.05)" },
            ]),
          },
          emphasis: {
            focus: "series",
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(99, 171, 253, 0.5)",
            },
          },
        },
        {
          name: `Number Of Employees (${totalEmployees})`,
          type: "line",
          data: employeeData,
          smooth: true,
          symbol: "circle",
          symbolSize: 8,
          yAxisIndex: 1,
          lineStyle: {
            width: 3,
            color: "#e697ff",
          },
          itemStyle: {
            color: "#e697ff",
            borderWidth: 2,
            borderColor: "#fff",
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(230, 151, 255, 0.35)" },
              { offset: 1, color: "rgba(230, 151, 255, 0.05)" },
            ]),
          },
          emphasis: {
            focus: "series",
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(230, 151, 255, 0.5)",
            },
          },
        },
      ],
    };
  }, [chartData]);

  if (error && retryCount >= maxRetries) {
    return (
      <div className="cardx border-0 p-3 h-100 d-flex flex-column">
        <h6>Seat Utilization vs Employees Count</h6>
        <hr />
        <div
          style={{
            padding: "2rem",
            background: "#fff3cd",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #ffc107",
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
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
    <div className="cardx border-0 p-3 h-100 d-flex flex-column">
      <Loader isVisible={loading} fullScreen={false} />
      <div className="cardx-header">
        <h6 className="mb-0">Seat Utilization vs Employees Count</h6>
        <span
          id="chart-occupancy"
          className="icon-btn"
          onClick={() => setDialogVisible(true)}
        >
          <BiExpand />
        </span>
      </div>
      <div className="chart-container flex-grow-1">
        {!loading && chartOption && (
          <EChartsBase
            option={chartOption}
            height="100%"
            loading={loading}
            style={{ minHeight: "300px" }}
          />
        )}
        {!loading && !chartOption && (
          <div className="text-center text-muted py-5">
            <p style={{ fontSize: "16px", marginBottom: "8px" }}>
              No data available
            </p>
            <p style={{ fontSize: "14px", color: "#999" }}>
              Try adjusting your filters to see data
            </p>
          </div>
        )}
      </div>

      <Dialog
        header={"Seat Utilization vs Employees Count"}
        visible={dialogVisible}
        style={{ width: "90vw", minHeight: "90vh" }}
        onHide={() => setDialogVisible(false)}
      >
        {chartOption && (
          <EChartsBase
            option={chartOption}
            height="75vh"
            loading={loading}
          />
        )}
      </Dialog>
      <Tooltip target="#chart-occupancy" content="Expand" position="left" />
    </div>
  );
};

export default React.memo(RiShiftEmployeeOccupancy);