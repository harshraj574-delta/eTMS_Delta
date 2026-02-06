// RiDropSafeChart.jsx
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { apiService } from "../../services/api";
import { BiExpand } from "react-icons/bi";
import { MdSecurity } from "react-icons/md";
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

const RiDropSafeChart = ({ filter }) => {
  const [chartData, setChartData] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const maxRetries = 3;

  useEffect(() => {
    const fetchChartData = async () => {
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

        const res = await apiService.GetDropSafe_shiftwise(params);
        const apiData = typeof res === "string" ? JSON.parse(res) : res || [];

        if (!apiData || apiData.length === 0) {
          setChartData(null);
          setRetryCount(0);
          return;
        }

        const convertShiftTimeToLabel = (shiftTime) => {
          const hour = shiftTime.slice(0, 2);
          const minute = shiftTime.slice(2);
          return `${hour}:${minute}`;
        };

        const labels = apiData.map((item) =>
          convertShiftTimeToLabel(item.shiftTime)
        );
        const femaleCounts = apiData.map((item) =>
          Number(item.femalecount || 0)
        );
        const dsyCounts = apiData.map((item) => Number(item.dsycount || 0));

        const totalFemale = femaleCounts.reduce((a, b) => a + b, 0);
        const totalDsy = dsyCounts.reduce((a, b) => a + b, 0);

        setChartData({
          labels,
          femaleCounts,
          dsyCounts,
          totalFemale,
          totalDsy,
          totalCount: totalFemale + totalDsy,
          shiftCount: labels.length,
        });

        setRetryCount(0);
        setError(null);
      } catch (err) {
        console.error("Drop Safe Chart Error:", err);
        setError(err?.message || "Failed to load chart data");

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying DropSafe... Attempt ${retryCount + 1}/${maxRetries}`
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

    if (
      filter &&
      filter.sDate &&
      filter.eDate &&
      filter.locationid !== undefined &&
      filter.locationid !== null
    ) {
      fetchChartData();
    } else {
      setChartData(null);
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

      const { labels, femaleCounts, dsyCounts, totalFemale, totalDsy } =
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
            `Women Employees (${totalFemale.toLocaleString()})`,
            `DSY Count (${totalDsy.toLocaleString()})`,
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
          name: "Count",
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
            name: `Women Employees (${totalFemale.toLocaleString()})`,
            type: "bar",
            data: femaleCounts,
            barWidth: isFullscreen ? "40%" : "35%",
            barGap: "10%",
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#a78bfa" },
                { offset: 1, color: "#7c3aed" },
              ]),
              borderRadius: [4, 4, 0, 0],
              shadowColor: "rgba(124, 58, 237, 0.2)",
              shadowBlur: 8,
              shadowOffsetY: 4,
            },
            emphasis: {
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#c4b5fd" },
                  { offset: 1, color: "#6d28d9" },
                ]),
                shadowBlur: 16,
                shadowColor: "rgba(124, 58, 237, 0.4)",
              },
            },
          },
          {
            name: `DSY Count (${totalDsy.toLocaleString()})`,
            type: "bar",
            data: dsyCounts,
            barWidth: isFullscreen ? "40%" : "35%",
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#34d399" },
                { offset: 1, color: "#059669" },
              ]),
              borderRadius: [4, 4, 0, 0],
              shadowColor: "rgba(5, 150, 105, 0.2)",
              shadowBlur: 8,
              shadowOffsetY: 4,
            },
            emphasis: {
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#6ee7b7" },
                  { offset: 1, color: "#047857" },
                ]),
                shadowBlur: 16,
                shadowColor: "rgba(5, 150, 105, 0.4)",
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
        <style>{dropSafeStyles}</style>
        <div className="dropsafe-chart-wrapper">
          <div className="dropsafe-chart-header">
            <div className="dropsafe-chart-title">
              <div className="dropsafe-chart-icon">
                <MdSecurity />
              </div>
              <h6>Women Employee vs DSY Count</h6>
            </div>
          </div>
          <div className="dropsafe-error">
            <div className="dropsafe-error-content">
              <div className="dropsafe-error-icon">
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
              <button className="dropsafe-retry-btn" onClick={handleRetry}>
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
      <style>{dropSafeStyles}</style>

      <div className="dropsafe-chart-wrapper">
        {/* Loading Overlay */}
        <div className={`dropsafe-overlay ${showOverlay ? "visible" : ""}`}>
          <div className="dropsafe-loader">
            <div className="dropsafe-spinner" />
            <span className="dropsafe-loader-text">Loading chart data...</span>
          </div>
        </div>

        {/* Header */}
        <div className="dropsafe-chart-header">
          <div className="dropsafe-chart-title">
            <div className="dropsafe-chart-icon">
              <MdSecurity />
            </div>
            <h6>Women Employee vs DSY Count</h6>
          </div>
          <div className="dropsafe-chart-controls">
            {chartData && (
              <div className="dropsafe-stats-badges">
                <div className="dropsafe-stat-badge women">
                  <span className="badge-dot" />
                  <span>Women: {chartData.totalFemale.toLocaleString()}</span>
                </div>
                <div className="dropsafe-stat-badge dsy">
                  <span className="badge-dot" />
                  <span>DSY: {chartData.totalDsy.toLocaleString()}</span>
                </div>
              </div>
            )}
            <Tooltip
              target="#expand-dropsafe"
              content="Expand Chart"
              position="top"
            />
            <button
              id="expand-dropsafe"
              className="dropsafe-icon-btn"
              onClick={handleDialogShow}
              aria-label="Expand chart to fullscreen"
            >
              <BiExpand />
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="dropsafe-chart-container">
          {!loading && chartOption && (
            <EChartsBase
              option={chartOption}
              height="100%"
              loading={loading}
              style={{ minHeight: "280px" }}
            />
          )}
          {!loading && !chartOption && !error && (
            <div className="dropsafe-empty-state">
              <div className="dropsafe-empty-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h4>No Records Found</h4>
              <p>Try adjusting your filters to see data</p>
            </div>
          )}
        </div>

        {/* Legend Info */}
        {chartData && !loading && (
          <div className="dropsafe-legend-bar">
            <div className="dropsafe-legend-item">
              <span
                className="dropsafe-legend-dot"
                style={{ background: "#7c3aed" }}
              />
              <span>Women Employees</span>
            </div>
            <div className="dropsafe-legend-item">
              <span
                className="dropsafe-legend-dot"
                style={{ background: "#059669" }}
              />
              <span>DSY Count</span>
            </div>
            <div className="dropsafe-legend-info">
              {chartData.shiftCount} shifts •{" "}
              {chartData.totalCount.toLocaleString()} total
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
        className="dropsafe-fullscreen-dialog"
        style={{ width: "92vw", maxWidth: "1400px" }}
        contentStyle={{ padding: 0, overflow: "hidden" }}
        modal
        draggable={false}
        resizable={false}
      >
        <div className="dropsafe-dialog-wrapper">
          {/* Dialog Header */}
          <div className="dropsafe-dialog-header">
            <div className="dropsafe-dialog-title">
              <div className="dropsafe-chart-icon large">
                <MdSecurity />
              </div>
              <div>
                <h5>Women Employee vs DSY Count</h5>
                <p>Shift-wise distribution of women employees and DSY</p>
              </div>
            </div>
            <div className="dropsafe-dialog-controls">
              {chartData && (
                <div className="dropsafe-dialog-stats">
                  <div className="dropsafe-dialog-stat">
                    <span className="stat-label">Women Employees</span>
                    <span className="stat-value women">
                      {chartData.totalFemale.toLocaleString()}
                    </span>
                  </div>
                  <div className="dropsafe-dialog-stat">
                    <span className="stat-label">DSY Count</span>
                    <span className="stat-value dsy">
                      {chartData.totalDsy.toLocaleString()}
                    </span>
                  </div>
                  <div className="dropsafe-dialog-stat">
                    <span className="stat-label">Total</span>
                    <span className="stat-value">
                      {chartData.totalCount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              <button
                className="dropsafe-dialog-close"
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
          <div className="dropsafe-dialog-chart">
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
const dropSafeStyles = `
/* ===== DROPSAFE CHART STYLES ===== */
.dropsafe-chart-wrapper {
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
.dropsafe-overlay {
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

.dropsafe-overlay.visible {
  opacity: 1;
  visibility: visible;
}

.dropsafe-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.dropsafe-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #059669;
  border-radius: 50%;
  animation: dropsafeSpin 0.8s linear infinite;
}

@keyframes dropsafeSpin {
  to { transform: rotate(360deg); }
}

.dropsafe-loader-text {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

/* Header */
.dropsafe-chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
  background: white;
  flex-shrink: 0;
  min-height: 56px;
}

.dropsafe-chart-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dropsafe-chart-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 10px;
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.dropsafe-chart-icon svg {
  width: 18px;
  height: 18px;
}

.dropsafe-chart-icon.large {
  width: 44px;
  height: 44px;
}

.dropsafe-chart-icon.large svg {
  width: 22px;
  height: 22px;
}

.dropsafe-chart-title h6 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.01em;
}

.dropsafe-chart-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Stats Badges */
.dropsafe-stats-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dropsafe-stat-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.dropsafe-stat-badge .badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dropsafe-stat-badge.women {
  background: rgba(124, 58, 237, 0.1);
  color: #6d28d9;
}

.dropsafe-stat-badge.women .badge-dot {
  background: #7c3aed;
}

.dropsafe-stat-badge.dsy {
  background: rgba(5, 150, 105, 0.1);
  color: #047857;
}

.dropsafe-stat-badge.dsy .badge-dot {
  background: #059669;
}

/* Icon Button */
.dropsafe-icon-btn {
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

.dropsafe-icon-btn:hover {
  background: #f8fafc;
  border-color: #10b981;
  color: #10b981;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
}

.dropsafe-icon-btn:active {
  transform: scale(0.95);
}

.dropsafe-icon-btn svg {
  width: 18px;
  height: 18px;
}

/* Chart Container */
.dropsafe-chart-container {
  flex: 1;
  min-height: 0;
  padding: 8px 12px;
  position: relative;
}

/* Empty State */
.dropsafe-empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
}

.dropsafe-empty-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-radius: 16px;
  margin-bottom: 16px;
  color: #059669;
}

.dropsafe-empty-icon svg {
  width: 32px;
  height: 32px;
}

.dropsafe-empty-state h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #334155;
}

.dropsafe-empty-state p {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
}

/* Legend Bar */
.dropsafe-legend-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 10px 16px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.dropsafe-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.dropsafe-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dropsafe-legend-info {
  font-size: 11px;
  color: #94a3b8;
  padding-left: 12px;
  border-left: 1px solid #e2e8f0;
}

/* Error State */
.dropsafe-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.dropsafe-error-content {
  text-align: center;
  padding: 32px;
}

.dropsafe-error-icon {
  color: #ef4444;
  margin-bottom: 16px;
}

.dropsafe-error-content h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #991b1b;
}

.dropsafe-error-content p {
  margin: 0 0 20px;
  font-size: 13px;
  color: #b91c1c;
}

.dropsafe-retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.dropsafe-retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

/* ===== FULLSCREEN DIALOG ===== */
.dropsafe-fullscreen-dialog .p-dialog-header {
  display: none !important;
}

.dropsafe-fullscreen-dialog .p-dialog-content {
  border-radius: 16px !important;
  padding: 0 !important;
}

.dropsafe-dialog-wrapper {
  display: flex;
  flex-direction: column;
  height: 80vh;
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

/* Dialog Header */
.dropsafe-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-bottom: 1px solid #a7f3d0;
  flex-shrink: 0;
}

.dropsafe-dialog-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dropsafe-dialog-title h5 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
}

.dropsafe-dialog-title p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.dropsafe-dialog-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Dialog Stats */
.dropsafe-dialog-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dropsafe-dialog-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  min-width: 100px;
}

.dropsafe-dialog-stat .stat-label {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.dropsafe-dialog-stat .stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.dropsafe-dialog-stat .stat-value.women {
  color: #6d28d9;
}

.dropsafe-dialog-stat .stat-value.dsy {
  color: #047857;
}

/* Dialog Close Button */
.dropsafe-dialog-close {
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

.dropsafe-dialog-close:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #ef4444;
}

/* Dialog Chart */
.dropsafe-dialog-chart {
  flex: 1;
  padding: 16px 24px 24px;
  min-height: 0;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 991px) {
  .dropsafe-stats-badges {
    display: none;
  }
  
  .dropsafe-dialog-stats {
    display: none;
  }
}

@media (max-width: 767px) {
  .dropsafe-chart-header {
    padding: 12px 14px;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .dropsafe-chart-title h6 {
    font-size: 0.875rem;
  }
  
  .dropsafe-chart-icon {
    width: 32px;
    height: 32px;
  }
  
  .dropsafe-chart-icon svg {
    width: 16px;
    height: 16px;
  }
  
  .dropsafe-legend-bar {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .dropsafe-legend-info {
    flex: 0 0 100%;
    text-align: center;
    padding: 8px 0 0;
    border-left: none;
    border-top: 1px solid #e2e8f0;
  }
  
  .dropsafe-dialog-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .dropsafe-dialog-controls {
    width: 100%;
    justify-content: flex-end;
  }
  
  .dropsafe-dialog-close {
    position: absolute;
    top: 12px;
    right: 12px;
  }
}

@media (max-width: 575px) {
  .dropsafe-chart-title {
    flex: 1 1 100%;
  }
  
  .dropsafe-chart-controls {
    flex: 1 1 100%;
    justify-content: flex-end;
  }
}

/* ===== ANIMATIONS ===== */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.dropsafe-chart-wrapper {
  animation: fadeIn 0.4s ease-out;
}

.dropsafe-stat-badge {
  animation: fadeIn 0.3s ease-out backwards;
}

.dropsafe-stat-badge:nth-child(1) { animation-delay: 0.1s; }
.dropsafe-stat-badge:nth-child(2) { animation-delay: 0.15s; }

.dropsafe-dialog-stat {
  animation: fadeIn 0.3s ease-out backwards;
}

.dropsafe-dialog-stat:nth-child(1) { animation-delay: 0.05s; }
.dropsafe-dialog-stat:nth-child(2) { animation-delay: 0.1s; }
.dropsafe-dialog-stat:nth-child(3) { animation-delay: 0.15s; }
`;

export default memo(RiDropSafeChart);