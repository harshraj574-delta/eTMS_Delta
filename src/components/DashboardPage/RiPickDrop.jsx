// RiPickDrop.jsx
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { apiService } from "../../services/api";
import { BiExpand, BiTransfer } from "react-icons/bi";
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

const RiPickDrop = ({ filter }) => {
  const [chartData, setChartData] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const maxRetries = 3;

  useEffect(() => {
    const fetchAndPrepareChart = async () => {
      if (!isTransitioning) {
        setLoading(true);
      }
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

        const res = await apiService.GetPickDropcount_shiftwise(params);
        const data = JSON.parse(res) || [];

        const formatShiftTime = (shiftTime) => {
          if (!shiftTime) return "";
          const hour = shiftTime.slice(0, 2);
          const minute = shiftTime.slice(2);
          return `${hour}:${minute}`;
        };

        const labels = data.map((entry) => formatShiftTime(entry.shiftTime));
        const pickupCounts = data.map((entry) => entry.totalpickup || 0);
        const dropCounts = data.map((entry) => entry.totaldrop || 0);

        const totalPick = pickupCounts.reduce((a, b) => a + b, 0);
        const totalDrop = dropCounts.reduce((a, b) => a + b, 0);

        setChartData({
          labels,
          pickupCounts,
          dropCounts,
          totalPick,
          totalDrop,
          totalTrips: totalPick + totalDrop,
          shiftCount: labels.length,
        });

        setRetryCount(0);
        setError(null);
      } catch (err) {
        console.error("PickDrop Error:", err);
        setError(err?.message || "Failed to load chart data");

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying PickDrop... Attempt ${retryCount + 1}/${maxRetries}`
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

    fetchAndPrepareChart();
  }, [filter, retryCount]);

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

      const { labels, pickupCounts, dropCounts, totalPick, totalDrop } =
        chartData;

      return {
        ...ANIMATION_CONFIG,
        tooltip: {
          ...TOOLTIP_CONFIG,
          trigger: "axis",
          axisPointer: {
            type: "shadow",
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
            let total = 0;
            params.forEach((param) => {
              const marker = `<span style="display:inline-block;margin-right:8px;border-radius:4px;width:10px;height:10px;background:${param.color};box-shadow: 0 2px 4px ${param.color}40;"></span>`;
              result += `<div style="margin: 8px 0; display: flex; align-items: center; justify-content: space-between; gap: 24px;">
                <span style="display: flex; align-items: center;">${marker}<span style="color: #64748b;">${param.seriesName.split(" (")[0]}</span></span>
                <strong style="color: #1e293b; font-size: 14px;">${param.value.toLocaleString()}</strong>
              </div>`;
              total += param.value;
            });
            result += `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-weight: 700; color: #1e293b; display: flex; justify-content: space-between;">
              <span>Total</span><span>${total.toLocaleString()}</span>
            </div>`;
            return result;
          },
        },
        legend: {
          ...LEGEND_CONFIG,
          data: [
            `Pick Trips (${totalPick.toLocaleString()})`,
            `Drop Trips (${totalDrop.toLocaleString()})`,
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
          top: isFullscreen ? 50 : 40,
          bottom: isFullscreen ? 90 : 70,
          left: isFullscreen ? 70 : 55,
          right: isFullscreen ? 30 : 20,
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
          name: "Shift Time",
          nameLocation: "center",
          nameGap: isFullscreen ? 45 : 38,
          nameTextStyle: {
            color: "#94a3b8",
            fontSize: isFullscreen ? 13 : 12,
            fontWeight: 600,
          },
        },
        yAxis: {
          ...Y_AXIS_CONFIG,
          name: "Number of Trips",
          nameLocation: "center",
          nameGap: isFullscreen ? 50 : 42,
          nameTextStyle: {
            color: "#94a3b8",
            fontSize: isFullscreen ? 13 : 12,
            fontWeight: 600,
          },
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
        series: [
          {
            name: `Pick Trips (${totalPick.toLocaleString()})`,
            type: "bar",
            data: pickupCounts,
            barWidth: isFullscreen ? "40%" : "35%",
            barGap: "10%",
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#60a5fa" },
                { offset: 1, color: "#3b82f6" },
              ]),
              borderRadius: [4, 4, 0, 0],
              shadowColor: "rgba(59, 130, 246, 0.2)",
              shadowBlur: 8,
              shadowOffsetY: 4,
            },
            emphasis: {
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#93c5fd" },
                  { offset: 1, color: "#2563eb" },
                ]),
                shadowBlur: 16,
                shadowColor: "rgba(59, 130, 246, 0.4)",
              },
            },
          },
          {
            name: `Drop Trips (${totalDrop.toLocaleString()})`,
            type: "bar",
            data: dropCounts,
            barWidth: isFullscreen ? "40%" : "35%",
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#fca5a5" },
                { offset: 1, color: "#ef4444" },
              ]),
              borderRadius: [4, 4, 0, 0],
              shadowColor: "rgba(239, 68, 68, 0.2)",
              shadowBlur: 8,
              shadowOffsetY: 4,
            },
            emphasis: {
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#fecaca" },
                  { offset: 1, color: "#dc2626" },
                ]),
                shadowBlur: 16,
                shadowColor: "rgba(239, 68, 68, 0.4)",
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
        <style>{pickDropStyles}</style>
        <div className="pickdrop-chart-wrapper">
          <div className="pickdrop-chart-header">
            <div className="pickdrop-chart-title">
              <div className="pickdrop-chart-icon">
                <BiTransfer />
              </div>
              <h6>Pick/Drop Trips</h6>
            </div>
          </div>
          <div className="pickdrop-error">
            <div className="pickdrop-error-content">
              <div className="pickdrop-error-icon">
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
              <button className="pickdrop-retry-btn" onClick={handleRetry}>
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
      <style>{pickDropStyles}</style>

      <div className="pickdrop-chart-wrapper">
        {/* Loading Overlay */}
        <div className={`pickdrop-overlay ${showOverlay ? "visible" : ""}`}>
          <div className="pickdrop-loader">
            <div className="pickdrop-spinner" />
            <span className="pickdrop-loader-text">Loading chart data...</span>
          </div>
        </div>

        {/* Header */}
        <div className="pickdrop-chart-header">
          <div className="pickdrop-chart-title">
            <div className="pickdrop-chart-icon">
              <BiTransfer />
            </div>
            <h6>Pick/Drop Trips</h6>
          </div>
          <div className="pickdrop-chart-controls">
            {chartData && (
              <div className="pickdrop-stats-badges">
                <div className="pickdrop-stat-badge pick">
                  <span className="badge-dot" />
                  <span>Pick: {chartData.totalPick.toLocaleString()}</span>
                </div>
                <div className="pickdrop-stat-badge drop">
                  <span className="badge-dot" />
                  <span>Drop: {chartData.totalDrop.toLocaleString()}</span>
                </div>
              </div>
            )}
            <Tooltip
              target="#expand-pickdrop"
              content="Expand Chart"
              position="top"
            />
            <button
              id="expand-pickdrop"
              className="pickdrop-icon-btn"
              onClick={handleDialogShow}
              aria-label="Expand chart to fullscreen"
            >
              <BiExpand />
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="pickdrop-chart-container">
          {!loading && chartOption && (
            <EChartsBase
              option={chartOption}
              height="100%"
              loading={loading}
              style={{ minHeight: "280px" }}
            />
          )}
          {!loading && !chartOption && !error && (
            <div className="pickdrop-empty-state">
              <div className="pickdrop-empty-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M3 3v18h18" />
                  <rect x="7" y="10" width="3" height="8" rx="1" />
                  <rect x="14" y="6" width="3" height="12" rx="1" />
                </svg>
              </div>
              <h4>No Data Available</h4>
              <p>Try adjusting your filters to see trip data</p>
            </div>
          )}
        </div>

        {/* Legend Info */}
        {chartData && !loading && (
          <div className="pickdrop-legend-bar">
            <div className="pickdrop-legend-item">
              <span
                className="pickdrop-legend-dot"
                style={{ background: "#3b82f6" }}
              />
              <span>Pick Trips</span>
            </div>
            <div className="pickdrop-legend-item">
              <span
                className="pickdrop-legend-dot"
                style={{ background: "#ef4444" }}
              />
              <span>Drop Trips</span>
            </div>
            <div className="pickdrop-legend-info">
              {chartData.shiftCount} shifts •{" "}
              {chartData.totalTrips.toLocaleString()} total trips
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
        className="pickdrop-fullscreen-dialog"
        style={{ width: "92vw", maxWidth: "1400px" }}
        contentStyle={{ padding: 0, overflow: "hidden" }}
        modal
        draggable={false}
        resizable={false}
      >
        <div className="pickdrop-dialog-wrapper">
          {/* Dialog Header */}
          <div className="pickdrop-dialog-header">
            <div className="pickdrop-dialog-title">
              <div className="pickdrop-chart-icon large">
                <BiTransfer />
              </div>
              <div>
                <h5>Pick/Drop Trips</h5>
                <p>Shift-wise distribution of pick and drop trips</p>
              </div>
            </div>
            <div className="pickdrop-dialog-controls">
              {chartData && (
                <div className="pickdrop-dialog-stats">
                  <div className="pickdrop-dialog-stat">
                    <span className="stat-label">Pick Trips</span>
                    <span className="stat-value pick">
                      {chartData.totalPick.toLocaleString()}
                    </span>
                  </div>
                  <div className="pickdrop-dialog-stat">
                    <span className="stat-label">Drop Trips</span>
                    <span className="stat-value drop">
                      {chartData.totalDrop.toLocaleString()}
                    </span>
                  </div>
                  <div className="pickdrop-dialog-stat">
                    <span className="stat-label">Total Trips</span>
                    <span className="stat-value">
                      {chartData.totalTrips.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              <button
                className="pickdrop-dialog-close"
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
          <div className="pickdrop-dialog-chart">
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
const pickDropStyles = `
/* ===== PICKDROP CHART STYLES ===== */
.pickdrop-chart-wrapper {
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
.pickdrop-overlay {
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

.pickdrop-overlay.visible {
  opacity: 1;
  visibility: visible;
}

.pickdrop-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.pickdrop-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: pickdropSpin 0.8s linear infinite;
}

@keyframes pickdropSpin {
  to { transform: rotate(360deg); }
}

.pickdrop-loader-text {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

/* Header */
.pickdrop-chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
  background: white;
  flex-shrink: 0;
  min-height: 56px;
}

.pickdrop-chart-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pickdrop-chart-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 10px;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.pickdrop-chart-icon svg {
  width: 18px;
  height: 18px;
}

.pickdrop-chart-icon.large {
  width: 44px;
  height: 44px;
}

.pickdrop-chart-icon.large svg {
  width: 22px;
  height: 22px;
}

.pickdrop-chart-title h6 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.01em;
}

.pickdrop-chart-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Stats Badges */
.pickdrop-stats-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pickdrop-stat-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.pickdrop-stat-badge .badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.pickdrop-stat-badge.pick {
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
}

.pickdrop-stat-badge.pick .badge-dot {
  background: #3b82f6;
}

.pickdrop-stat-badge.drop {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.pickdrop-stat-badge.drop .badge-dot {
  background: #ef4444;
}

/* Icon Button */
.pickdrop-icon-btn {
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

.pickdrop-icon-btn:hover {
  background: #f8fafc;
  border-color: #3b82f6;
  color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.pickdrop-icon-btn:active {
  transform: scale(0.95);
}

.pickdrop-icon-btn svg {
  width: 18px;
  height: 18px;
}

/* Chart Container */
.pickdrop-chart-container {
  flex: 1;
  min-height: 0;
  padding: 8px 12px;
  position: relative;
}

/* Empty State */
.pickdrop-empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
}

.pickdrop-empty-icon {
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

.pickdrop-empty-icon svg {
  width: 32px;
  height: 32px;
}

.pickdrop-empty-state h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #334155;
}

.pickdrop-empty-state p {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
}

/* Legend Bar */
.pickdrop-legend-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 10px 16px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.pickdrop-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.pickdrop-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pickdrop-legend-info {
  font-size: 11px;
  color: #94a3b8;
  padding-left: 12px;
  border-left: 1px solid #e2e8f0;
}

/* Error State */
.pickdrop-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.pickdrop-error-content {
  text-align: center;
  padding: 32px;
}

.pickdrop-error-icon {
  color: #ef4444;
  margin-bottom: 16px;
}

.pickdrop-error-content h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #991b1b;
}

.pickdrop-error-content p {
  margin: 0 0 20px;
  font-size: 13px;
  color: #b91c1c;
}

.pickdrop-retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.pickdrop-retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

/* ===== FULLSCREEN DIALOG ===== */
.pickdrop-fullscreen-dialog .p-dialog-header {
  display: none !important;
}

.pickdrop-fullscreen-dialog .p-dialog-content {
  border-radius: 16px !important;
  padding: 0 !important;
}

.pickdrop-dialog-wrapper {
  display: flex;
  flex-direction: column;
  height: 80vh;
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

/* Dialog Header */
.pickdrop-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-bottom: 1px solid #bae6fd;
  flex-shrink: 0;
}

.pickdrop-dialog-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pickdrop-dialog-title h5 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
}

.pickdrop-dialog-title p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.pickdrop-dialog-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Dialog Stats */
.pickdrop-dialog-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pickdrop-dialog-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  min-width: 100px;
}

.pickdrop-dialog-stat .stat-label {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.pickdrop-dialog-stat .stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.pickdrop-dialog-stat .stat-value.pick {
  color: #1d4ed8;
}

.pickdrop-dialog-stat .stat-value.drop {
  color: #dc2626;
}

/* Dialog Close Button */
.pickdrop-dialog-close {
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

.pickdrop-dialog-close:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #ef4444;
}

/* Dialog Chart */
.pickdrop-dialog-chart {
  flex: 1;
  padding: 16px 24px 24px;
  min-height: 0;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 991px) {
  .pickdrop-stats-badges {
    display: none;
  }
  
  .pickdrop-dialog-stats {
    display: none;
  }
}

@media (max-width: 767px) {
  .pickdrop-chart-header {
    padding: 12px 14px;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .pickdrop-chart-title h6 {
    font-size: 0.875rem;
  }
  
  .pickdrop-chart-icon {
    width: 32px;
    height: 32px;
  }
  
  .pickdrop-chart-icon svg {
    width: 16px;
    height: 16px;
  }
  
  .pickdrop-legend-bar {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .pickdrop-legend-info {
    flex: 0 0 100%;
    text-align: center;
    padding: 8px 0 0;
    border-left: none;
    border-top: 1px solid #e2e8f0;
  }
  
  .pickdrop-dialog-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .pickdrop-dialog-controls {
    width: 100%;
    justify-content: flex-end;
  }
  
  .pickdrop-dialog-close {
    position: absolute;
    top: 12px;
    right: 12px;
  }
}

@media (max-width: 575px) {
  .pickdrop-chart-title {
    flex: 1 1 100%;
  }
  
  .pickdrop-chart-controls {
    flex: 1 1 100%;
    justify-content: flex-end;
  }
}

/* ===== ANIMATIONS ===== */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.pickdrop-chart-wrapper {
  animation: fadeIn 0.4s ease-out;
}

.pickdrop-stat-badge {
  animation: fadeIn 0.3s ease-out backwards;
}

.pickdrop-stat-badge:nth-child(1) { animation-delay: 0.1s; }
.pickdrop-stat-badge:nth-child(2) { animation-delay: 0.15s; }

.pickdrop-dialog-stat {
  animation: fadeIn 0.3s ease-out backwards;
}

.pickdrop-dialog-stat:nth-child(1) { animation-delay: 0.05s; }
.pickdrop-dialog-stat:nth-child(2) { animation-delay: 0.1s; }
.pickdrop-dialog-stat:nth-child(3) { animation-delay: 0.15s; }
`;

export default memo(RiPickDrop);