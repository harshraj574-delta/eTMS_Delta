// RiNormalAdhoc.jsx
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { apiService } from "../../services/api";
import { BiExpand } from "react-icons/bi";
import { MdCompareArrows } from "react-icons/md";
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

const RiNormalAdhoc = ({ filter }) => {
  const [chartData, setChartData] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const maxRetries = 3;

  useEffect(() => {
    const fetchNormalAdhoc = async () => {
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
        const normalTrips = responseData.map(
          (item) => item.NornalTripCount || 0
        );
        const adhocTrips = responseData.map((item) => item.AdhocTripcount || 0);

        const totalNormal = normalTrips.reduce((a, b) => a + b, 0);
        const totalAdhoc = adhocTrips.reduce((a, b) => a + b, 0);

        setChartData({
          labels,
          normalTrips,
          adhocTrips,
          totalNormal,
          totalAdhoc,
          totalTrips: totalNormal + totalAdhoc,
          shiftCount: labels.length,
        });

        setRetryCount(0);
        setError(null);
      } catch (err) {
        console.error("Error fetching Normal vs Adhoc chart data:", err);
        setError(err?.message || "Failed to load chart data");

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
        setIsTransitioning(false);
      }
    };

    if (filter?.sDate && filter?.eDate) {
      fetchNormalAdhoc();
    }
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

      const { labels, normalTrips, adhocTrips, totalNormal, totalAdhoc } =
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
            `Normal Trips (${totalNormal.toLocaleString()})`,
            `Adhoc Trips (${totalAdhoc.toLocaleString()})`,
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
          top: isFullscreen ? "15%" : "20%",
          bottom: isFullscreen ? "15%" : "20%",
          left: isFullscreen ? "5%" : "8%",
          right: isFullscreen ? "5%" : "5%",
          containLabel: true,
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
            name: `Normal Trips (${totalNormal.toLocaleString()})`,
            type: "bar",
            stack: "trips",
            data: normalTrips,
            barWidth: isFullscreen ? "50%" : "45%",
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#60a5fa" },
                { offset: 1, color: "#3b82f6" },
              ]),
              borderRadius: [0, 0, 0, 0],
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
            name: `Adhoc Trips (${totalAdhoc.toLocaleString()})`,
            type: "bar",
            stack: "trips",
            data: adhocTrips,
            barWidth: isFullscreen ? "50%" : "45%",
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#fcd34d" },
                { offset: 1, color: "#f59e0b" },
              ]),
              borderRadius: [4, 4, 0, 0],
              shadowColor: "rgba(245, 158, 11, 0.2)",
              shadowBlur: 8,
              shadowOffsetY: 4,
            },
            emphasis: {
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#fde68a" },
                  { offset: 1, color: "#d97706" },
                ]),
                shadowBlur: 16,
                shadowColor: "rgba(245, 158, 11, 0.4)",
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
        <style>{normalAdhocStyles}</style>
        <div className="normaladhoc-chart-wrapper">
          <div className="normaladhoc-chart-header">
            <div className="normaladhoc-chart-title">
              <div className="normaladhoc-chart-icon">
                <MdCompareArrows />
              </div>
              <h6>Normal vs Adhoc Trips</h6>
            </div>
          </div>
          <div className="normaladhoc-error">
            <div className="normaladhoc-error-content">
              <div className="normaladhoc-error-icon">
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
              <button className="normaladhoc-retry-btn" onClick={handleRetry}>
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
      <style>{normalAdhocStyles}</style>

      <div className="normaladhoc-chart-wrapper">
        {/* Loading Overlay */}
        <div className={`normaladhoc-overlay ${showOverlay ? "visible" : ""}`}>
          <div className="normaladhoc-loader">
            <div className="normaladhoc-spinner" />
            <span className="normaladhoc-loader-text">
              Loading chart data...
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="normaladhoc-chart-header">
          <div className="normaladhoc-chart-title">
            <div className="normaladhoc-chart-icon">
              <MdCompareArrows />
            </div>
            <h6>Normal vs Adhoc Trips</h6>
          </div>
          <div className="normaladhoc-chart-controls">
            {chartData && (
              <div className="normaladhoc-stats-badges">
                <div className="normaladhoc-stat-badge normal">
                  <span className="badge-dot" />
                  <span>Normal: {chartData.totalNormal.toLocaleString()}</span>
                </div>
                <div className="normaladhoc-stat-badge adhoc">
                  <span className="badge-dot" />
                  <span>Adhoc: {chartData.totalAdhoc.toLocaleString()}</span>
                </div>
              </div>
            )}
            <Tooltip
              target="#expand-normaladhoc"
              content="Expand Chart"
              position="top"
            />
            <button
              id="expand-normaladhoc"
              className="normaladhoc-icon-btn"
              onClick={handleDialogShow}
              aria-label="Expand chart to fullscreen"
            >
              <BiExpand />
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="normaladhoc-chart-container">
          {!loading && chartOption && (
            <EChartsBase
              option={chartOption}
              height="100%"
              loading={loading}
              style={{ minHeight: "280px" }}
            />
          )}
          {!loading && !chartOption && !error && (
            <div className="normaladhoc-empty-state">
              <div className="normaladhoc-empty-icon">
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
          <div className="normaladhoc-legend-bar">
            <div className="normaladhoc-legend-item">
              <span
                className="normaladhoc-legend-dot"
                style={{ background: "#3b82f6" }}
              />
              <span>Normal Trips</span>
            </div>
            <div className="normaladhoc-legend-item">
              <span
                className="normaladhoc-legend-dot"
                style={{ background: "#f59e0b" }}
              />
              <span>Adhoc Trips</span>
            </div>
            <div className="normaladhoc-legend-info">
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
        className="normaladhoc-fullscreen-dialog"
        style={{ width: "92vw", maxWidth: "1400px" }}
        contentStyle={{ padding: 0, overflow: "hidden" }}
        modal
        draggable={false}
        resizable={false}
      >
        <div className="normaladhoc-dialog-wrapper">
          {/* Dialog Header */}
          <div className="normaladhoc-dialog-header">
            <div className="normaladhoc-dialog-title">
              <div className="normaladhoc-chart-icon large">
                <MdCompareArrows />
              </div>
              <div>
                <h5>Normal vs Adhoc Trips</h5>
                <p>Shift-wise distribution of normal and adhoc trips</p>
              </div>
            </div>
            <div className="normaladhoc-dialog-controls">
              {chartData && (
                <div className="normaladhoc-dialog-stats">
                  <div className="normaladhoc-dialog-stat">
                    <span className="stat-label">Normal Trips</span>
                    <span className="stat-value normal">
                      {chartData.totalNormal.toLocaleString()}
                    </span>
                  </div>
                  <div className="normaladhoc-dialog-stat">
                    <span className="stat-label">Adhoc Trips</span>
                    <span className="stat-value adhoc">
                      {chartData.totalAdhoc.toLocaleString()}
                    </span>
                  </div>
                  <div className="normaladhoc-dialog-stat">
                    <span className="stat-label">Total Trips</span>
                    <span className="stat-value">
                      {chartData.totalTrips.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              <button
                className="normaladhoc-dialog-close"
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
          <div className="normaladhoc-dialog-chart">
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
const normalAdhocStyles = `
/* ===== NORMALADHOC CHART STYLES ===== */
.normaladhoc-chart-wrapper {
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
.normaladhoc-overlay {
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

.normaladhoc-overlay.visible {
  opacity: 1;
  visibility: visible;
}

.normaladhoc-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.normaladhoc-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: normaladhocSpin 0.8s linear infinite;
}

@keyframes normaladhocSpin {
  to { transform: rotate(360deg); }
}

.normaladhoc-loader-text {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

/* Header */
.normaladhoc-chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
  background: white;
  flex-shrink: 0;
  min-height: 56px;
}

.normaladhoc-chart-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.normaladhoc-chart-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  border-radius: 10px;
  color: white;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.normaladhoc-chart-icon svg {
  width: 18px;
  height: 18px;
}

.normaladhoc-chart-icon.large {
  width: 44px;
  height: 44px;
}

.normaladhoc-chart-icon.large svg {
  width: 22px;
  height: 22px;
}

.normaladhoc-chart-title h6 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.01em;
}

.normaladhoc-chart-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Stats Badges */
.normaladhoc-stats-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.normaladhoc-stat-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.normaladhoc-stat-badge .badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.normaladhoc-stat-badge.normal {
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
}

.normaladhoc-stat-badge.normal .badge-dot {
  background: #3b82f6;
}

.normaladhoc-stat-badge.adhoc {
  background: rgba(245, 158, 11, 0.1);
  color: #b45309;
}

.normaladhoc-stat-badge.adhoc .badge-dot {
  background: #f59e0b;
}

/* Icon Button */
.normaladhoc-icon-btn {
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

.normaladhoc-icon-btn:hover {
  background: #f8fafc;
  border-color: #8b5cf6;
  color: #8b5cf6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
}

.normaladhoc-icon-btn:active {
  transform: scale(0.95);
}

.normaladhoc-icon-btn svg {
  width: 18px;
  height: 18px;
}

/* Chart Container */
.normaladhoc-chart-container {
  flex: 1;
  min-height: 0;
  padding: 8px 12px;
  position: relative;
}

/* Empty State */
.normaladhoc-empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
}

.normaladhoc-empty-icon {
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

.normaladhoc-empty-icon svg {
  width: 32px;
  height: 32px;
}

.normaladhoc-empty-state h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #334155;
}

.normaladhoc-empty-state p {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
}

/* Legend Bar */
.normaladhoc-legend-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 10px 16px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.normaladhoc-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.normaladhoc-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.normaladhoc-legend-info {
  font-size: 11px;
  color: #94a3b8;
  padding-left: 12px;
  border-left: 1px solid #e2e8f0;
}

/* Error State */
.normaladhoc-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.normaladhoc-error-content {
  text-align: center;
  padding: 32px;
}

.normaladhoc-error-icon {
  color: #ef4444;
  margin-bottom: 16px;
}

.normaladhoc-error-content h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #991b1b;
}

.normaladhoc-error-content p {
  margin: 0 0 20px;
  font-size: 13px;
  color: #b91c1c;
}

.normaladhoc-retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.normaladhoc-retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

/* ===== FULLSCREEN DIALOG ===== */
.normaladhoc-fullscreen-dialog .p-dialog-header {
  display: none !important;
}

.normaladhoc-fullscreen-dialog .p-dialog-content {
  border-radius: 16px !important;
  padding: 0 !important;
}

.normaladhoc-dialog-wrapper {
  display: flex;
  flex-direction: column;
  height: 80vh;
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

/* Dialog Header */
.normaladhoc-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border-bottom: 1px solid #ddd6fe;
  flex-shrink: 0;
}

.normaladhoc-dialog-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.normaladhoc-dialog-title h5 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
}

.normaladhoc-dialog-title p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.normaladhoc-dialog-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Dialog Stats */
.normaladhoc-dialog-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.normaladhoc-dialog-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  min-width: 100px;
}

.normaladhoc-dialog-stat .stat-label {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.normaladhoc-dialog-stat .stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.normaladhoc-dialog-stat .stat-value.normal {
  color: #1d4ed8;
}

.normaladhoc-dialog-stat .stat-value.adhoc {
  color: #b45309;
}

/* Dialog Close Button */
.normaladhoc-dialog-close {
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

.normaladhoc-dialog-close:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #ef4444;
}

/* Dialog Chart */
.normaladhoc-dialog-chart {
  flex: 1;
  padding: 16px 24px 24px;
  min-height: 0;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 991px) {
  .normaladhoc-stats-badges {
    display: none;
  }
  
  .normaladhoc-dialog-stats {
    display: none;
  }
}

@media (max-width: 767px) {
  .normaladhoc-chart-header {
    padding: 12px 14px;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .normaladhoc-chart-title h6 {
    font-size: 0.875rem;
  }
  
  .normaladhoc-chart-icon {
    width: 32px;
    height: 32px;
  }
  
  .normaladhoc-chart-icon svg {
    width: 16px;
    height: 16px;
  }
  
  .normaladhoc-legend-bar {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .normaladhoc-legend-info {
    flex: 0 0 100%;
    text-align: center;
    padding: 8px 0 0;
    border-left: none;
    border-top: 1px solid #e2e8f0;
  }
  
  .normaladhoc-dialog-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .normaladhoc-dialog-controls {
    width: 100%;
    justify-content: flex-end;
  }
  
  .normaladhoc-dialog-close {
    position: absolute;
    top: 12px;
    right: 12px;
  }
}

@media (max-width: 575px) {
  .normaladhoc-chart-title {
    flex: 1 1 100%;
  }
  
  .normaladhoc-chart-controls {
    flex: 1 1 100%;
    justify-content: flex-end;
  }
}

/* ===== ANIMATIONS ===== */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.normaladhoc-chart-wrapper {
  animation: fadeIn 0.4s ease-out;
}

.normaladhoc-stat-badge {
  animation: fadeIn 0.3s ease-out backwards;
}

.normaladhoc-stat-badge:nth-child(1) { animation-delay: 0.1s; }
.normaladhoc-stat-badge:nth-child(2) { animation-delay: 0.15s; }

.normaladhoc-dialog-stat {
  animation: fadeIn 0.3s ease-out backwards;
}

.normaladhoc-dialog-stat:nth-child(1) { animation-delay: 0.05s; }
.normaladhoc-dialog-stat:nth-child(2) { animation-delay: 0.1s; }
.normaladhoc-dialog-stat:nth-child(3) { animation-delay: 0.15s; }
`;

export default memo(RiNormalAdhoc);