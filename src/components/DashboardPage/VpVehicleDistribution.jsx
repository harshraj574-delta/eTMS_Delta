import { useState, useEffect, useMemo } from "react";
import { apiService } from "../../services/api";
import Loader from "../common/Loader";
import React from "react";
import * as echarts from "echarts";
import EChartsBase, {
  CHART_COLORS,
  ANIMATION_CONFIG,
} from "./EChartsBase";

const VpVehicleDistribution = ({ filter }) => {
  const [data, setData] = useState(null);
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
          facilityid: filter?.facilityid || "",
          vendorid: filter?.vendorid || "",
          triptype: filter?.triptype || "",
        };

        const result = await apiService.getchart_vehDist(params);
        const colorMap = [
          "#6366f1",
          "#ec4899",
          "#14b8a6",
          "#f59e0b",
          "#8b5cf6",
          "#06b6d4",
          "#f97316",
          "#84cc16",
          "#ef4444",
          "#3b82f6",
        ];

        let arr = result;
        if (typeof arr === "string") {
          try {
            arr = JSON.parse(arr);
          } catch (e) {
            throw new Error("Failed to parse API response");
          }
        }

        const vehicleTypeMap = {};
        (Array.isArray(arr) ? arr : []).forEach((item) => {
          const vt = item.Vehicletype;
          const val = Number(item.totalvehicle);
          if (!vehicleTypeMap[vt]) vehicleTypeMap[vt] = 0;
          vehicleTypeMap[vt] += isNaN(val) ? 0 : val;
        });

        const vehicleTypeData = Object.entries(vehicleTypeMap).map(
          ([name, value], idx) => ({
            name,
            value,
            color: colorMap[idx % colorMap.length],
          })
        );

        const billingTypeMap = {};
        (Array.isArray(arr) ? arr : []).forEach((item) => {
          const bt = item.BillingType;
          const val = Number(item.totalvehicle);
          if (!billingTypeMap[bt]) billingTypeMap[bt] = 0;
          billingTypeMap[bt] += isNaN(val) ? 0 : val;
        });

        const billingTypeData = Object.entries(billingTypeMap).map(
          ([name, value], idx) => ({
            name,
            value,
            color: colorMap[(idx + 3) % colorMap.length],
          })
        );

        if (vehicleTypeData.length === 0 || billingTypeData.length === 0) {
          throw new Error("No data available");
        }

        setData({ vehicleTypeData, billingTypeData });
        setRetryCount(0);
        setError(null);
      } catch (err) {
        console.error("VehicleDistribution Error:", err);
        setError(err?.message || "Failed to load chart data");

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying VehicleDistribution... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          setData(null);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [filter, retryCount]);

  // Generate ECharts option for nested donut chart
  const chartOption = useMemo(() => {
    if (!data) return null;

    const { vehicleTypeData, billingTypeData } = data;

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
          const percent = params.percent ? params.percent.toFixed(1) : "0";
          return `
            <div style="font-weight: 600; margin-bottom: 6px;">${params.seriesName}</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${params.color};"></span>
              <span>${params.name}: <strong>${params.value}</strong> (${percent}%)</span>
            </div>
          `;
        },
      },
      legend: {
        type: "scroll",
        orient: "horizontal",
        bottom: 10,
        left: "center",
        icon: "circle",
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 15,
        textStyle: {
          color: "#6b7280",
          fontSize: 11,
        },
        data: billingTypeData.map((item) => item.name),
      },
      series: [
        {
          name: "Vehicle Type",
          type: "pie",
          radius: ["50%", "70%"],
          center: ["50%", "45%"],
          avoidLabelOverlap: true,
          label: {
            show: true,
            position: "outside",
            formatter: "{b}: {c}",
            fontSize: 11,
            color: "#374151",
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 8,
            lineStyle: {
              color: "#d1d5db",
            },
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 13,
              fontWeight: "bold",
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.2)",
            },
          },
          data: vehicleTypeData.map((item) => ({
            value: item.value,
            name: item.name,
            itemStyle: {
              color: item.color,
            },
          })),
        },
        {
          name: "Billing Type",
          type: "pie",
          radius: ["20%", "40%"],
          center: ["50%", "45%"],
          avoidLabelOverlap: true,
          label: {
            show: false,
          },
          labelLine: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: "bold",
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.2)",
            },
          },
          data: billingTypeData.map((item) => ({
            value: item.value,
            name: item.name,
            itemStyle: {
              color: item.color,
            },
          })),
        },
      ],
    };
  }, [data]);

  if (error && retryCount >= maxRetries) {
    return (
      <div className="cardx border-0 p-3">
        <h6>Vehicle Distribution</h6>
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
            ⚠️ {error}
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
      <h6>Vehicle Distribution</h6>
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
          <p style={{ fontSize: "16px", marginBottom: "8px" }}>
            No data available
          </p>
          <p style={{ fontSize: "14px", color: "#999" }}>
            Try adjusting your filters to see data
          </p>
        </div>
      )}
    </div>
  );
};

export default React.memo(VpVehicleDistribution);