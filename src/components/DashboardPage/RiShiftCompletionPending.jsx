import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { apiService } from "../../services/api";
import { BiExpand } from "react-icons/bi";
import { FiCheckCircle } from "react-icons/fi";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import React from "react";
import EChartsBase, { ANIMATION_CONFIG } from "./EChartsBase";

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
          completed: values[4],
          pending: values[0] - values[4],
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

  const getChartOption = useCallback(
    (isFullscreen = false) => {
      if (!chartData || isAllZero) return null;

      const { labels, values, colors, total } = chartData;

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
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          borderColor: "#e2e8f0",
          borderWidth: 1,
          textStyle: {
            color: "#334155",
            fontSize: 13,
          },
          padding: [12, 16],
          extraCssText:
            "box-shadow: 0 10px 40px rgba(0,0,0,0.12); border-radius: 12px;",
          formatter: (params) => {
            const param = params[0];
            const idx = param.dataIndex;
            const percentage =
              total > 0 ? ((values[idx] / total) * 100).toFixed(1) : 0;
            return `
              <div style="font-weight: 700; margin-bottom: 8px; color: #1e293b; font-size: 14px;">${labels[idx]}</div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background-color:${colors[idx]};box-shadow: 0 2px 4px ${colors[idx]}40;"></span>
                <span style="color: #64748b;">Count:</span>
                <strong style="color: #1e293b; font-size: 15px;">${values[idx].toLocaleString()}</strong>
                <span style="color: #94a3b8;">(${percentage}%)</span>
              </div>
            `;
          },
        },
        grid: {
          top: isFullscreen ? 30 : 20,
          right: isFullscreen ? 100 : 80,
          bottom: isFullscreen ? 30 : 20,
          left: isFullscreen ? 160 : 130,
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
            fontSize: isFullscreen ? 13 : 12,
            fontWeight: 500,
            margin: isFullscreen ? 16 : 12,
          },
        },
        series: [
          {
            type: "bar",
            data: percentages.map((val, idx) => ({
              value: val,
              itemStyle: {
                color: colors[idx],
                borderRadius: [0, 6, 6, 0],
              },
            })),
            barWidth: isFullscreen ? 18 : 14,
            label: {
              show: true,
              position: "right",
              formatter: (param) => values[param.dataIndex].toLocaleString(),
              color: "#374151",
              fontSize: isFullscreen ? 13 : 12,
              fontWeight: 600,
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 12,
                shadowColor: "rgba(0, 0, 0, 0.2)",
              },
            },
            showBackground: true,
            backgroundStyle: {
              color: "#f3f4f6",
              borderRadius: [0, 6, 6, 0],
            },
          },
        ],
      };
    },
    [chartData, isAllZero]
  );

  const chartOption = useMemo(() => getChartOption(false), [getChartOption]);
  const fullscreenChartOption = useMemo(
    () => getChartOption(true),
    [getChartOption]
  );

  const showOverlay = loading;

  if (error && retryCount >= maxRetries) {
    return (
      <>
        <style>{routeCompletionStyles}</style>
        <div className="rc-wrapper">
          <div className="rc-header">
            <div className="rc-title">
              <div className="rc-icon">
                <FiCheckCircle />
              </div>
              <h6>Route Completion</h6>
            </div>
          </div>
          <div className="rc-error">
            <div className="rc-error-content">
              <div className="rc-error-icon">
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
              <button className="rc-retry-btn" onClick={handleRetry}>
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
      <style>{routeCompletionStyles}</style>

      <div className="rc-wrapper">
        {/* Loading Overlay */}
        <div className={`rc-overlay ${showOverlay ? "visible" : ""}`}>
          <div className="rc-loader">
            <div className="rc-spinner" />
            <span className="rc-loader-text">Loading...</span>
          </div>
        </div>

        {/* Header */}
        <div className="rc-header">
          <div className="rc-header-left">
            <div className="rc-title">
              <div className="rc-icon">
                <FiCheckCircle />
              </div>
              <h6>Route Completion</h6>
            </div>
          </div>

          <div className="rc-header-right">
            {chartData && (
              <div className="rc-stats-badges">
                <div className="rc-stat-badge completed">
                  <span className="badge-dot" />
                  <span className="badge-label">Completed:</span>
                  <span className="badge-value">
                    {chartData.completed.toLocaleString()}
                  </span>
                </div>
                <div className="rc-stat-badge pending">
                  <span className="badge-dot" />
                  <span className="badge-label">Pending:</span>
                  <span className="badge-value">
                    {chartData.pending.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            <Tooltip
              target="#expand-rc"
              content="Expand Chart"
              position="top"
            />
            <button
              id="expand-rc"
              className="rc-icon-btn"
              onClick={handleDialogShow}
              aria-label="Expand chart to fullscreen"
            >
              <BiExpand />
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="rc-chart-container">
          {!loading && chartOption && (
            <EChartsBase
              option={chartOption}
              height="100%"
              loading={loading}
              style={{ minHeight: "280px" }}
            />
          )}
          {!loading && !chartOption && !error && !isAllZero && (
            <div className="rc-empty-state">
              <div className="rc-empty-icon">
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
              <p>Try adjusting your filters to see route data</p>
            </div>
          )}
          {!loading && isAllZero && (
            <div className="rc-empty-state">
              <div className="rc-empty-icon zero">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12h8" />
                </svg>
              </div>
              <h4>All Values Are Zero</h4>
              <p>No route activity recorded for this period</p>
            </div>
          )}
        </div>

        {/* Legend Bar */}
        {chartData && !loading && !isAllZero && (
          <div className="rc-legend-bar">
            <div className="rc-legend-item">
              <span
                className="rc-legend-dot"
                style={{ background: "#10b981" }}
              />
              <span>Completed</span>
            </div>
            <div className="rc-legend-item">
              <span
                className="rc-legend-dot"
                style={{ background: "#f59e0b" }}
              />
              <span>In Progress</span>
            </div>
            <div className="rc-legend-item">
              <span
                className="rc-legend-dot"
                style={{ background: "#1f2937" }}
              />
              <span>Not Started</span>
            </div>
            <div className="rc-legend-info">
              {chartData.total.toLocaleString()} total routes
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
        className="rc-fullscreen-dialog"
        style={{ width: "92vw", maxWidth: "1400px" }}
        contentStyle={{ padding: 0, overflow: "hidden" }}
        modal
        draggable={false}
        resizable={false}
      >
        <div className="rc-dialog-wrapper">
          {/* Dialog Header */}
          <div className="rc-dialog-header">
            <div className="rc-dialog-title">
              <div className="rc-icon large">
                <FiCheckCircle />
              </div>
              <div className="rc-dialog-title-text">
                <h5>Route Completion</h5>
                <p>Overview of route allocation and completion status</p>
              </div>
            </div>
            <div className="rc-dialog-controls">
              {chartData && (
                <div className="rc-dialog-stats">
                  <div className="rc-dialog-stat">
                    <span className="stat-label">Total Routes</span>
                    <span className="stat-value">
                      {chartData.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="rc-dialog-stat">
                    <span className="stat-label">Completed</span>
                    <span className="stat-value completed">
                      {chartData.completed.toLocaleString()}
                    </span>
                  </div>
                  <div className="rc-dialog-stat">
                    <span className="stat-label">Pending</span>
                    <span className="stat-value pending">
                      {chartData.pending.toLocaleString()}
                    </span>
                  </div>
                  <div className="rc-dialog-stat">
                    <span className="stat-label">Rate</span>
                    <span className="stat-value rate">
                      {chartData.total > 0
                        ? (
                            (chartData.completed / chartData.total) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              )}
              <button
                className="rc-dialog-close"
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
          <div className="rc-dialog-chart">
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

const routeCompletionStyles = `
/* ===== ROUTE COMPLETION STYLES ===== */
.rc-wrapper {
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
.rc-overlay {
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

.rc-overlay.visible {
  opacity: 1;
  visibility: visible;
}

.rc-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.rc-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #e2e8f0;
  border-top-color: #10b981;
  border-radius: 50%;
  animation: rcSpin 0.8s linear infinite;
}

@keyframes rcSpin {
  to { transform: rotate(360deg); }
}

.rc-loader-text {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #64748b;
}

/* Header - Redesigned for better space management */
.rc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  background: white;
  flex-shrink: 0;
  min-height: 3.25rem;
  gap: 0.5rem;
  overflow: visible;
}

.rc-header-left {
  display: flex;
  align-items: center;
  min-width: 0;
  flex-shrink: 1;
}

.rc-header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.rc-title {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;
}

.rc-icon {
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 0.5rem;
  color: white;
  box-shadow: 0 3px 10px rgba(16, 185, 129, 0.3);
  flex-shrink: 0;
}

.rc-icon svg {
  width: 1rem;
  height: 1rem;
}

.rc-icon.large {
  width: 2.75rem;
  height: 2.75rem;
  min-width: 2.75rem;
  border-radius: 0.625rem;
}

.rc-icon.large svg {
  width: 1.375rem;
  height: 1.375rem;
}

.rc-title h6 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Stats Badges - Compact version */
.rc-stats-badges {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.rc-stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  white-space: nowrap;
}

.rc-stat-badge .badge-dot {
  width: 0.375rem;
  height: 0.375rem;
  min-width: 0.375rem;
  border-radius: 50%;
}

.rc-stat-badge .badge-label {
  display: none;
}

.rc-stat-badge .badge-value {
  font-weight: 700;
}

.rc-stat-badge.completed {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.rc-stat-badge.completed .badge-dot {
  background: #10b981;
}

.rc-stat-badge.pending {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.rc-stat-badge.pending .badge-dot {
  background: #f59e0b;
}

/* Icon Button - Always visible */
.rc-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  color: #64748b;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.rc-icon-btn:hover {
  background: #f8fafc;
  border-color: #10b981;
  color: #10b981;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
}

.rc-icon-btn:active {
  transform: scale(0.95);
}

.rc-icon-btn svg {
  width: 1rem;
  height: 1rem;
}

/* Chart Container */
.rc-chart-container {
  flex: 1;
  min-height: 0;
  padding: 0.5rem 0.75rem;
  position: relative;
}

/* Empty State */
.rc-empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

.rc-empty-icon {
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 1rem;
  margin-bottom: 1rem;
  color: #94a3b8;
}

.rc-empty-icon.zero {
  background: #fef3c7;
  color: #d97706;
}

.rc-empty-icon svg {
  width: 2rem;
  height: 2rem;
}

.rc-empty-state h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
}

.rc-empty-state p {
  margin: 0;
  font-size: 0.875rem;
  color: #94a3b8;
}

/* Legend Bar */
.rc-legend-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.rc-legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
}

.rc-legend-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.rc-legend-info {
  font-size: 0.625rem;
  color: #94a3b8;
  padding-left: 0.625rem;
  border-left: 1px solid #e2e8f0;
  white-space: nowrap;
}

/* Error State */
.rc-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.rc-error-content {
  text-align: center;
  padding: 2rem;
}

.rc-error-icon {
  color: #ef4444;
  margin-bottom: 1rem;
}

.rc-error-content h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #991b1b;
}

.rc-error-content p {
  margin: 0 0 1.25rem;
  font-size: 0.8125rem;
  color: #b91c1c;
}

.rc-retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 0.625rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.rc-retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

/* ===== FULLSCREEN DIALOG ===== */
.rc-fullscreen-dialog .p-dialog-header {
  display: none !important;
}

.rc-fullscreen-dialog .p-dialog-content {
  border-radius: 1rem !important;
  padding: 0 !important;
}

.rc-dialog-wrapper {
  display: flex;
  flex-direction: column;
  height: 80vh;
  background: white;
  border-radius: 1rem;
  overflow: hidden;
}

/* Dialog Header */
.rc-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-bottom: 1px solid #a7f3d0;
  flex-shrink: 0;
  gap: 1rem;
}

.rc-dialog-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.rc-dialog-title-text h5 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.rc-dialog-title-text p {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: #64748b;
  white-space: nowrap;
}

.rc-dialog-controls {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-shrink: 0;
}

/* Dialog Stats */
.rc-dialog-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.rc-dialog-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 1rem;
  background: white;
  border-radius: 0.625rem;
  border: 1px solid #e2e8f0;
  min-width: 5rem;
}

.rc-dialog-stat .stat-label {
  font-size: 0.6875rem;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
  white-space: nowrap;
}

.rc-dialog-stat .stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
}

.rc-dialog-stat .stat-value.completed {
  color: #059669;
}

.rc-dialog-stat .stat-value.pending {
  color: #d97706;
}

.rc-dialog-stat .stat-value.rate {
  color: #6366f1;
}

/* Dialog Close Button */
.rc-dialog-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  min-width: 2.5rem;
  border-radius: 0.625rem;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.rc-dialog-close:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #ef4444;
}

/* Dialog Chart */
.rc-dialog-chart {
  flex: 1;
  padding: 1rem 1.5rem 1.5rem;
  min-height: 0;
}

/* ===== RESPONSIVE BREAKPOINTS ===== */

/* Large screens - show labels */
@media (min-width: 1400px) {
  .rc-stat-badge .badge-label {
    display: inline;
  }
  
  .rc-stat-badge {
    padding: 0.375rem 0.625rem;
    gap: 0.375rem;
    font-size: 0.75rem;
  }
  
  .rc-stat-badge .badge-dot {
    width: 0.5rem;
    height: 0.5rem;
    min-width: 0.5rem;
  }
  
  .rc-header {
    padding: 0.875rem 1.125rem;
  }
  
  .rc-icon {
    width: 2.25rem;
    height: 2.25rem;
    min-width: 2.25rem;
  }
  
  .rc-icon svg {
    width: 1.125rem;
    height: 1.125rem;
  }
  
  .rc-title h6 {
    font-size: 0.9375rem;
  }
  
  .rc-icon-btn {
    width: 2.25rem;
    height: 2.25rem;
    min-width: 2.25rem;
  }
  
  .rc-icon-btn svg {
    width: 1.125rem;
    height: 1.125rem;
  }
}

/* Hide stats badges below 1200px to ensure expand button is always visible */
@media (max-width: 1199px) {
  .rc-stats-badges {
    display: none;
  }
  
  .rc-dialog-stats {
    display: none;
  }
}

/* Tablet and below */
@media (max-width: 991px) {
  .rc-header {
    padding: 0.625rem 0.875rem;
  }
  
  .rc-title h6 {
    font-size: 0.8125rem;
  }
}

/* Mobile */
@media (max-width: 767px) {
  .rc-header {
    padding: 0.625rem 0.75rem;
  }
  
  .rc-title h6 {
    font-size: 0.8125rem;
  }
  
  .rc-icon {
    width: 1.75rem;
    height: 1.75rem;
    min-width: 1.75rem;
    border-radius: 0.375rem;
  }
  
  .rc-icon svg {
    width: 0.875rem;
    height: 0.875rem;
  }
  
  .rc-icon-btn {
    width: 1.75rem;
    height: 1.75rem;
    min-width: 1.75rem;
    border-radius: 0.375rem;
  }
  
  .rc-icon-btn svg {
    width: 0.875rem;
    height: 0.875rem;
  }
  
  .rc-legend-bar {
    gap: 0.5rem;
    padding: 0.375rem 0.5rem;
  }
  
  .rc-legend-info {
    flex: 0 0 100%;
    text-align: center;
    padding: 0.375rem 0 0;
    border-left: none;
    border-top: 1px solid #e2e8f0;
  }
  
  .rc-dialog-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 1rem;
    gap: 1rem;
  }
  
  .rc-dialog-title-text p {
    display: none;
  }
  
  .rc-dialog-controls {
    width: 100%;
    justify-content: flex-end;
  }
  
  .rc-dialog-close {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
  }
}

/* Small mobile */
@media (max-width: 575px) {
  .rc-title {
    gap: 0.5rem;
  }
}

/* ===== ANIMATIONS ===== */
@keyframes rcFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.rc-wrapper {
  animation: rcFadeIn 0.4s ease-out;
}

.rc-stat-badge {
  animation: rcFadeIn 0.3s ease-out backwards;
}

.rc-stat-badge:nth-child(1) { animation-delay: 0.1s; }
.rc-stat-badge:nth-child(2) { animation-delay: 0.15s; }

.rc-dialog-stat {
  animation: rcFadeIn 0.3s ease-out backwards;
}

.rc-dialog-stat:nth-child(1) { animation-delay: 0.05s; }
.rc-dialog-stat:nth-child(2) { animation-delay: 0.1s; }
.rc-dialog-stat:nth-child(3) { animation-delay: 0.15s; }
.rc-dialog-stat:nth-child(4) { animation-delay: 0.2s; }
`;

export default memo(RiShiftCompletionPending);