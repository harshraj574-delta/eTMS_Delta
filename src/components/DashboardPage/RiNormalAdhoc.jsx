import { useState, useEffect, useMemo } from "react";
import { apiService } from "../../services/api";
import { BiExpand } from "react-icons/bi";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import Loader from "../common/Loader";
import React from "react";
import * as echarts from "echarts";
import EChartsBase, {
  TOOLTIP_CONFIG,
  LEGEND_CONFIG,
  GRID_CONFIG,
  X_AXIS_CONFIG,
  Y_AXIS_CONFIG,
  ANIMATION_CONFIG,
} from "./EChartsBase";

const RiNormalAdhoc = ({ filter }) => {
  const [chartData, setChartData] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    const fetchNormalAdhoc = async () => {
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

        const res = await apiService.GetNormalAdhoc_shiftwise(params);
        const responseData = JSON.parse(res) || [];

        if (!responseData.length) {
          setChartData(null);
          setRetryCount(0);
          return;
        }

        const convertShiftTimeToLabel = (shiftTime) => {
          const hour = shiftTime.slice(0, 2);
          const minute = shiftTime.slice(2);
          return `${hour}:${minute}`;
        };

        const labels = responseData.map((item) =>
          convertShiftTimeToLabel(item.shiftTime)
        );
        const normalTrips = responseData.map((item) => item.NornalTripCount || 0);
        const adhocTrips = responseData.map((item) => item.AdhocTripcount || 0);

        const totalNormal = normalTrips.reduce((a, b) => a + b, 0);
        const totalAdhoc = adhocTrips.reduce((a, b) => a + b, 0);

        setChartData({
          labels,
          normalTrips,
          adhocTrips,
          totalNormal,
          totalAdhoc,
        });

        setRetryCount(0);
        setError(null);
      } catch (error) {
        console.error("Error fetching Normal vs Adhoc chart data:", error);
        setError(error?.message || "Failed to load chart data");

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying NormalAdhoc... Attempt ${retryCount + 1}/${maxRetries}`
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
      fetchNormalAdhoc();
    }
  }, [filter, retryCount]);

  // Generate ECharts option
  const chartOption = useMemo(() => {
    if (!chartData) return null;

    const { labels, normalTrips, adhocTrips, totalNormal, totalAdhoc } = chartData;

    return {
      ...ANIMATION_CONFIG,
      tooltip: {
        ...TOOLTIP_CONFIG,
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        formatter: (params) => {
          let result = `<div style="font-weight: 600; margin-bottom: 8px;">${params[0].axisValue}</div>`;
          let total = 0;
          params.forEach((param) => {
            const marker = `<span style="display:inline-block;margin-right:4px;border-radius:4px;width:10px;height:10px;background-color:${param.color};"></span>`;
            result += `<div style="margin: 4px 0;">${marker}${param.seriesName}: <strong>${param.value}</strong></div>`;
            total += param.value;
          });
          result += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-weight: 600;">Total: ${total}</div>`;
          return result;
        },
      },
      legend: {
        ...LEGEND_CONFIG,
        data: [
          `Normal Trips (${totalNormal})`,
          `Adhoc Trips (${totalAdhoc})`,
        ],
        bottom: 10,
      },
      grid: {
        ...GRID_CONFIG,
        top: 30,
        bottom: 80,
        left: 50,
        right: 20,
      },
      xAxis: {
        ...X_AXIS_CONFIG,
        data: labels,
        axisLabel: {
          ...X_AXIS_CONFIG.axisLabel,
          rotate: labels.length > 12 ? 45 : 0,
        },
      },
      yAxis: {
        ...Y_AXIS_CONFIG,
        name: "Number of Trips",
        nameLocation: "center",
        nameGap: 40,
        nameTextStyle: {
          color: "#6b7280",
          fontSize: 12,
        },
      },
      series: [
        {
          name: `Normal Trips (${totalNormal})`,
          type: "bar",
          stack: "trips",
          data: normalTrips,
          barWidth: "50%",
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#93c5fd" },
              { offset: 1, color: "#5c92ff" },
            ]),
            borderRadius: [0, 0, 0, 0],
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(92, 146, 255, 0.3)",
            },
          },
        },
        {
          name: `Adhoc Trips (${totalAdhoc})`,
          type: "bar",
          stack: "trips",
          data: adhocTrips,
          barWidth: "50%",
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#fcd34d" },
              { offset: 1, color: "#e3a008" },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(227, 160, 8, 0.3)",
            },
          },
        },
      ],
    };
  }, [chartData]);

  if (error && retryCount >= maxRetries) {
    return (
      <div className="cardx border-0 p-3 h-100">
        <h6>Normal vs Adhoc Trips</h6>
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
      <div className="d-flex justify-content-between align-items-center">
        <h6>Normal vs Adhoc Trips</h6>
        <span
          id="adhoc"
          style={{ cursor: "pointer" }}
          onClick={() => setDialogVisible(true)}
        >
          <BiExpand />
        </span>
      </div>
      <hr />
      {!loading && chartOption && (
        <EChartsBase
          option={chartOption}
          height="50vh"
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

      <Dialog
        header={"Normal vs Adhoc Trips"}
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
      <Tooltip target="#adhoc" content="Expand Chart" position="left" />
    </div>
  );
};

export default React.memo(RiNormalAdhoc);