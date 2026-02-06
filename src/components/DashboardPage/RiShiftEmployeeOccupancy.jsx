import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { apiService } from "../../services/api";
import { BiExpand, BiLineChart, BiGroup } from "react-icons/bi";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
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

const RiShiftEmployeeOccupancy = ({ filter }) => {
  const [chartData, setChartData] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const maxRetries = 3;

  const formatTime = useCallback((timeStr) => {
    if (!timeStr) return "";
    const padded = timeStr.padStart(4, "0");
    return `${padded.slice(0, 2)}:${padded.slice(2)}`;
  }, []);

  useEffect(() => {
    const fetchOccupancyData = async () => {
      if (!isTransitioning) {
        setLoading(true);
      }
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
        const avgOccupancy =
          occupancyData.length > 0 ? totalOccupancy / occupancyData.length : 0;

        setChartData({
          labels,
          occupancyData,
          employeeData,
          totalOccupancy: totalOccupancy.toFixed(1),
          totalEmployees,
          avgOccupancy: avgOccupancy.toFixed(1),
          shiftCount: labels.length,
        });

        setRetryCount(0);
        setError(null);
      } catch (err) {
        console.error("Error fetching occupancy data:", err);
        setError(err?.message || "Failed to load chart data");

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
        setIsTransitioning(false);
      }
    };

    if (filter?.sDate && filter?.eDate) {
      fetchOccupancyData();
    }
  }, [filter, retryCount, formatTime]);

  const handleRetry = useCallback(() => {
    setRetryCount(0);
    setError(null);
  }, []);

  const handleDialogShow = useCallback(() => {
    setDialogVisible(true);
  }, []);

  const handleDialogHide = useCallback(() => {
    setDialogVisible(false);
  }, []);

  // Generate ECharts option
  const getChartOption = useCallback(
    (isFullscreen = false) => {
      if (!chartData) return null;

      const {
        labels,
        occupancyData,
        employeeData,
        totalOccupancy,
        totalEmployees,
      } = chartData;

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
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          borderColor: "#e2e8f0",
          borderWidth: 1,
          padding: [12, 16],
          textStyle: {
            color: "#334155",
            fontSize: 13,
          },
          extraCssText:
            "box-shadow: 0 10px 40px rgba(0,0,0,0.12); border-radius: 12px;",
          formatter: (params) => {
            let result = `<div style="font-weight: 700; margin-bottom: 10px; color: #1e293b; font-size: 14px;">${params[0].axisValue}</div>`;
            params.forEach((param) => {
              const marker = `<span style="display:inline-block;margin-right:8px;border-radius:50%;width:10px;height:10px;background:${param.color};box-shadow: 0 2px 4px ${param.color}40;"></span>`;
              const unit = param.seriesIndex === 0 ? "%" : "";
              const label =
                param.seriesIndex === 0
                  ? "Seat Utilization"
                  : "Employee Count";
              result += `<div style="margin: 8px 0; display: flex; align-items: center; justify-content: space-between; gap: 24px;">
                <span style="display: flex; align-items: center;">${marker}<span style="color: #64748b;">${label}</span></span>
                <strong style="color: #1e293b; font-size: 14px;">${param.value.toLocaleString()}${unit}</strong>
              </div>`;
            });
            return result;
          },
        },
        legend: {
          ...LEGEND_CONFIG,
          data: [
            `Seat Utilization % (${totalOccupancy})`,
            `Number Of Employees (${totalEmployees.toLocaleString()})`,
          ],
          bottom: isFullscreen ? 20 : 12,
          itemGap: isFullscreen ? 32 : 24,
          textStyle: {
            fontSize: isFullscreen ? 13 : 12,
            color: "#64748b",
            fontWeight: 500,
          },
          icon: "roundRect",
          itemWidth: 16,
          itemHeight: 8,
        },
        grid: {
          ...GRID_CONFIG,
          top: isFullscreen ? 60 : 50,
          bottom: isFullscreen ? 100 : 80,
          left: isFullscreen ? 80 : 65,
          right: isFullscreen ? 80 : 65,
          containLabel: false,
        },
        xAxis: {
          ...X_AXIS_CONFIG,
          data: labels,
          axisLabel: {
            ...X_AXIS_CONFIG.axisLabel,
            rotate: labels.length > 12 ? 45 : 0,
            fontSize: isFullscreen ? 12 : 11,
            color: "#64748b",
            fontWeight: 500,
          },
          axisLine: {
            lineStyle: {
              color: "#e2e8f0",
            },
          },
          axisTick: {
            show: false,
          },
          name: "Shift Time (24-hour)",
          nameLocation: "center",
          nameGap: isFullscreen ? 45 : 38,
          nameTextStyle: {
            color: "#94a3b8",
            fontSize: isFullscreen ? 13 : 12,
            fontWeight: 600,
          },
        },
        yAxis: [
          {
            ...Y_AXIS_CONFIG,
            name: "Seat Utilization %",
            nameLocation: "center",
            nameGap: isFullscreen ? 55 : 48,
            nameTextStyle: {
              color: "#94a3b8",
              fontSize: isFullscreen ? 13 : 12,
              fontWeight: 600,
            },
            max: Math.max(100, Math.ceil(Math.max(...occupancyData) / 10) * 10),
            axisLabel: {
              fontSize: isFullscreen ? 12 : 11,
              color: "#64748b",
              fontWeight: 500,
            },
            splitLine: {
              lineStyle: {
                color: "#f1f5f9",
                type: "dashed",
              },
            },
            axisLine: {
              show: false,
            },
            axisTick: {
              show: false,
            },
          },
          {
            ...Y_AXIS_CONFIG,
            name: "Employee Count",
            nameLocation: "center",
            nameGap: isFullscreen ? 55 : 48,
            nameTextStyle: {
              color: "#94a3b8",
              fontSize: isFullscreen ? 13 : 12,
              fontWeight: 600,
            },
            position: "right",
            max: Math.max(
              700,
              Math.ceil(Math.max(...employeeData) / 100) * 100
            ),
            axisLabel: {
              fontSize: isFullscreen ? 12 : 11,
              color: "#64748b",
              fontWeight: 500,
            },
            splitLine: {
              show: false,
            },
            axisLine: {
              show: false,
            },
            axisTick: {
              show: false,
            },
          },
        ],
        series: [
          {
            name: `Seat Utilization % (${totalOccupancy})`,
            type: "line",
            data: occupancyData,
            smooth: 0.4,
            symbol: "circle",
            symbolSize: isFullscreen ? 10 : 8,
            yAxisIndex: 0,
            lineStyle: {
              width: isFullscreen ? 3.5 : 3,
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: "#6366f1" },
                { offset: 1, color: "#818cf8" },
              ]),
              cap: "round",
              join: "round",
            },
            itemStyle: {
              color: "#6366f1",
              borderWidth: 3,
              borderColor: "#fff",
              shadowBlur: 8,
              shadowColor: "rgba(99, 102, 241, 0.3)",
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(99, 102, 241, 0.25)" },
                { offset: 0.5, color: "rgba(99, 102, 241, 0.1)" },
                { offset: 1, color: "rgba(99, 102, 241, 0.02)" },
              ]),
            },
            emphasis: {
              focus: "series",
              itemStyle: {
                shadowBlur: 16,
                shadowColor: "rgba(99, 102, 241, 0.5)",
                borderWidth: 4,
              },
              lineStyle: {
                width: isFullscreen ? 4 : 3.5,
              },
            },
          },
          {
            name: `Number Of Employees (${totalEmployees.toLocaleString()})`,
            type: "line",
            data: employeeData,
            smooth: 0.4,
            symbol: "circle",
            symbolSize: isFullscreen ? 10 : 8,
            yAxisIndex: 1,
            lineStyle: {
              width: isFullscreen ? 3.5 : 3,
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: "#a855f7" },
                { offset: 1, color: "#c084fc" },
              ]),
              cap: "round",
              join: "round",
            },
            itemStyle: {
              color: "#a855f7",
              borderWidth: 3,
              borderColor: "#fff",
              shadowBlur: 8,
              shadowColor: "rgba(168, 85, 247, 0.3)",
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(168, 85, 247, 0.25)" },
                { offset: 0.5, color: "rgba(168, 85, 247, 0.1)" },
                { offset: 1, color: "rgba(168, 85, 247, 0.02)" },
              ]),
            },
            emphasis: {
              focus: "series",
              itemStyle: {
                shadowBlur: 16,
                shadowColor: "rgba(168, 85, 247, 0.5)",
                borderWidth: 4,
              },
              lineStyle: {
                width: isFullscreen ? 4 : 3.5,
              },
            },
          },
        ],
      };
    },
    [chartData]
  );

  const chartOption = useMemo(() => getChartOption(false), [getChartOption]);
  const fullscreenChartOption = useMemo(
    () => getChartOption(true),
    [getChartOption]
  );

  const showOverlay = loading || isTransitioning;

  // Error state
  if (error && retryCount >= maxRetries) {
    return (
      <>
        <style>{componentStyles}</style>
        <div className="occupancy-chart-wrapper">
          <div className="occupancy-chart-header">
            <div className="occupancy-chart-title">
              <div className="occupancy-chart-icon">
                <BiLineChart />
              </div>
              <h6>Seat Utilization vs Employees Count</h6>
            </div>
          </div>
          <div className="occupancy-error">
            <div className="occupancy-error-content">
              <div className="occupancy-error-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h4>Unable to Load Chart Data</h4>
              <p>{error}</p>
              <button className="occupancy-retry-btn" onClick={handleRetry}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{componentStyles}</style>

      <div className="occupancy-chart-wrapper">
        {/* Loading Overlay */}
        <div className={`occupancy-overlay ${showOverlay ? "visible" : ""}`}>
          <div className="occupancy-loader">
            <div className="occupancy-spinner" />
            <span className="occupancy-loader-text">Loading chart data...</span>
          </div>
        </div>

        {/* Header */}
        <div className="occupancy-chart-header">
          <div className="occupancy-chart-title">
            <div className="occupancy-chart-icon">
              <BiLineChart />
            </div>
            <h6>Seat Utilization vs Employees Count</h6>
          </div>
          <div className="occupancy-chart-controls">
            {chartData && (
              <div className="occupancy-stats-badges">
                <div className="occupancy-stat-badge utilization">
                  <BiLineChart />
                  <span>Avg: {chartData.avgOccupancy}%</span>
                </div>
                <div className="occupancy-stat-badge employees">
                  <BiGroup />
                  <span>{chartData.totalEmployees.toLocaleString()}</span>
                </div>
              </div>
            )}
            <Tooltip
              target="#expand-occupancy"
              content="Expand Chart"
              position="top"
            />
            <button
              id="expand-occupancy"
              className="occupancy-icon-btn"
              onClick={handleDialogShow}
              aria-label="Expand chart to fullscreen"
            >
              <BiExpand />
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="occupancy-chart-container">
          {!loading && chartOption && (
            <EChartsBase
              option={chartOption}
              height="100%"
              loading={loading}
              style={{ minHeight: "280px" }}
            />
          )}
          {!loading && !chartOption && !error && (
            <div className="occupancy-empty-state">
              <div className="occupancy-empty-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M3 3v18h18" />
                  <path d="M18 9l-5 5-4-4-3 3" />
                </svg>
              </div>
              <h4>No Data Available</h4>
              <p>Try adjusting your filters to see data</p>
            </div>
          )}
        </div>

        {/* Legend Info */}
        {chartData && !loading && (
          <div className="occupancy-legend-bar">
            <div className="occupancy-legend-item">
              <span
                className="occupancy-legend-dot"
                style={{ background: "#6366f1" }}
              />
              <span>Seat Utilization %</span>
            </div>
            <div className="occupancy-legend-item">
              <span
                className="occupancy-legend-dot"
                style={{ background: "#a855f7" }}
              />
              <span>Employee Count</span>
            </div>
            <div className="occupancy-legend-info">
              {chartData.shiftCount} shifts analyzed
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Dialog */}
      <Dialog
        visible={dialogVisible}
        onHide={handleDialogHide}
        header={null}
        closable={false}
        className="occupancy-fullscreen-dialog"
        style={{ width: "92vw", maxWidth: "1400px" }}
        contentStyle={{ padding: 0, overflow: "hidden" }}
        modal
        draggable={false}
        resizable={false}
      >
        <div className="occupancy-dialog-wrapper">
          {/* Dialog Header */}
          <div className="occupancy-dialog-header">
            <div className="occupancy-dialog-title">
              <div className="occupancy-chart-icon large">
                <BiLineChart />
              </div>
              <div>
                <h5>Seat Utilization vs Employees Count</h5>
                <p>Shift-wise analysis of seat occupancy and employee distribution</p>
              </div>
            </div>
            <div className="occupancy-dialog-controls">
              {chartData && (
                <div className="occupancy-dialog-stats">
                  <div className="occupancy-dialog-stat">
                    <span className="stat-label">Avg Utilization</span>
                    <span className="stat-value utilization">
                      {chartData.avgOccupancy}%
                    </span>
                  </div>
                  <div className="occupancy-dialog-stat">
                    <span className="stat-label">Total Employees</span>
                    <span className="stat-value employees">
                      {chartData.totalEmployees.toLocaleString()}
                    </span>
                  </div>
                  <div className="occupancy-dialog-stat">
                    <span className="stat-label">Shifts</span>
                    <span className="stat-value">{chartData.shiftCount}</span>
                  </div>
                </div>
              )}
              <button
                className="occupancy-dialog-close"
                onClick={handleDialogHide}
                aria-label="Close dialog"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Dialog Chart */}
          <div className="occupancy-dialog-chart">
            {fullscreenChartOption && (
              <EChartsBase
                option={fullscreenChartOption}
                height="calc(80vh - 140px)"
                loading={loading}
              />
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
};

// Component Styles
const componentStyles = `
/* ===== OCCUPANCY CHART STYLES ===== */
.occupancy-chart-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: white;
  border-radius: inherit;
  overflow: hidden;
}

/* Loading Overlay */
.occupancy-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.occupancy-overlay.visible {
  opacity: 1;
  visibility: visible;
}

.occupancy-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.occupancy-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: occupancySpin 0.8s linear infinite;
}

@keyframes occupancySpin {
  to { transform: rotate(360deg); }
}

.occupancy-loader-text {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

/* Header */
.occupancy-chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
  background: white;
  flex-shrink: 0;
  min-height: 56px;
}

.occupancy-chart-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.occupancy-chart-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border-radius: 10px;
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.occupancy-chart-icon svg {
  width: 18px;
  height: 18px;
}

.occupancy-chart-icon.large {
  width: 44px;
  height: 44px;
}

.occupancy-chart-icon.large svg {
  width: 22px;
  height: 22px;
}

.occupancy-chart-title h6 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.01em;
}

.occupancy-chart-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Stats Badges */
.occupancy-stats-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.occupancy-stat-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.occupancy-stat-badge.utilization {
  background: rgba(99, 102, 241, 0.1);
  color: #4f46e5;
}

.occupancy-stat-badge.employees {
  background: rgba(168, 85, 247, 0.1);
  color: #9333ea;
}

.occupancy-stat-badge svg {
  width: 14px;
  height: 14px;
}

/* Icon Button */
.occupancy-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  color: #64748b;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.occupancy-icon-btn:hover {
  background: #f8fafc;
  border-color: #6366f1;
  color: #6366f1;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.occupancy-icon-btn:active {
  transform: scale(0.95);
}

.occupancy-icon-btn svg {
  width: 18px;
  height: 18px;
}

/* Chart Container */
.occupancy-chart-container {
  flex: 1;
  min-height: 0;
  padding: 8px 12px;
  position: relative;
}

/* Empty State */
.occupancy-empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
}

.occupancy-empty-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 16px;
  margin-bottom: 16px;
  color: #94a3b8;
}

.occupancy-empty-icon svg {
  width: 32px;
  height: 32px;
}

.occupancy-empty-state h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #334155;
}

.occupancy-empty-state p {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
}

/* Legend Bar */
.occupancy-legend-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 10px 16px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.occupancy-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.occupancy-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.occupancy-legend-info {
  font-size: 11px;
  color: #94a3b8;
  padding-left: 12px;
  border-left: 1px solid #e2e8f0;
}

/* Error State */
.occupancy-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.occupancy-error-content {
  text-align: center;
  padding: 32px;
}

.occupancy-error-icon {
  color: #ef4444;
  margin-bottom: 16px;
}

.occupancy-error-content h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #991b1b;
}

.occupancy-error-content p {
  margin: 0 0 20px;
  font-size: 13px;
  color: #b91c1c;
}

.occupancy-retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.occupancy-retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

/* ===== FULLSCREEN DIALOG ===== */
.occupancy-fullscreen-dialog .p-dialog-header {
  display: none !important;
}

.occupancy-fullscreen-dialog .p-dialog-content {
  border-radius: 16px !important;
  padding: 0 !important;
}

.occupancy-dialog-wrapper {
  display: flex;
  flex-direction: column;
  height: 80vh;
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

/* Dialog Header */
.occupancy-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #fafbff 0%, #f8fafc 100%);
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.occupancy-dialog-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.occupancy-dialog-title h5 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
}

.occupancy-dialog-title p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.occupancy-dialog-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Dialog Stats */
.occupancy-dialog-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.occupancy-dialog-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  min-width: 100px;
}

.occupancy-dialog-stat .stat-label {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.occupancy-dialog-stat .stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.occupancy-dialog-stat .stat-value.utilization {
  color: #4f46e5;
}

.occupancy-dialog-stat .stat-value.employees {
  color: #9333ea;
}

/* Dialog Close Button */
.occupancy-dialog-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.occupancy-dialog-close:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #ef4444;
}

/* Dialog Chart */
.occupancy-dialog-chart {
  flex: 1;
  padding: 16px 24px 24px;
  min-height: 0;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 991px) {
  .occupancy-stats-badges {
    display: none;
  }
  
  .occupancy-dialog-stats {
    display: none;
  }
}

@media (max-width: 767px) {
  .occupancy-chart-header {
    padding: 12px 14px;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .occupancy-chart-title h6 {
    font-size: 0.875rem;
  }
  
  .occupancy-chart-icon {
    width: 32px;
    height: 32px;
  }
  
  .occupancy-chart-icon svg {
    width: 16px;
    height: 16px;
  }
  
  .occupancy-legend-bar {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .occupancy-legend-info {
    flex: 0 0 100%;
    text-align: center;
    padding: 8px 0 0;
    border-left: none;
    border-top: 1px solid #e2e8f0;
  }
  
  .occupancy-dialog-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .occupancy-dialog-controls {
    width: 100%;
    justify-content: flex-end;
  }
  
  .occupancy-dialog-close {
    position: absolute;
    top: 12px;
    right: 12px;
  }
}

@media (max-width: 575px) {
  .occupancy-chart-title {
    flex: 1 1 100%;
  }
  
  .occupancy-chart-controls {
    flex: 1 1 100%;
    justify-content: flex-end;
  }
}

/* ===== ANIMATIONS ===== */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.occupancy-chart-wrapper {
  animation: fadeIn 0.4s ease-out;
}

.occupancy-stat-badge {
  animation: fadeIn 0.3s ease-out backwards;
}

.occupancy-stat-badge:nth-child(1) { animation-delay: 0.1s; }
.occupancy-stat-badge:nth-child(2) { animation-delay: 0.15s; }

.occupancy-dialog-stat {
  animation: fadeIn 0.3s ease-out backwards;
}

.occupancy-dialog-stat:nth-child(1) { animation-delay: 0.05s; }
.occupancy-dialog-stat:nth-child(2) { animation-delay: 0.1s; }
.occupancy-dialog-stat:nth-child(3) { animation-delay: 0.15s; }
`;

export default memo(RiShiftEmployeeOccupancy);