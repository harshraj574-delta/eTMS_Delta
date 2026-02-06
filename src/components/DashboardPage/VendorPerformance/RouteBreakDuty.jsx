import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import { apiService } from "../../../services/api";
import { BiExpand, BiLineChart } from "react-icons/bi";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
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
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const maxRetries = 3;

  useEffect(() => {
    const fetchData = async () => {
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
        setIsTransitioning(false);
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
              const marker = `<span style="display:inline-block;margin-right:8px;border-radius:4px;width:10px;height:10px;background:${param.color};box-shadow: 0 2px 4px ${param.color}40;"></span>`;
              let unit = "";
              if (param.seriesName.includes("Duty")) unit = " hrs";
              result += `<div style="margin: 8px 0; display: flex; align-items: center; justify-content: space-between; gap: 24px;">
                <span style="display: flex; align-items: center;">${marker}<span style="color: #64748b;">${param.seriesName.split(" (")[0]}</span></span>
                <strong style="color: #1e293b; font-size: 14px;">${param.value.toLocaleString()}${unit}</strong>
              </div>`;
            });
            return result;
          },
        },
        legend: {
          ...LEGEND_CONFIG,
          data: [
            `Routes Completed (${totals.routes.toLocaleString()})`,
            `Breakdowns (${totals.breakdowns.toLocaleString()})`,
            `Duty Hours (${totals.dutyHours.toLocaleString()})`,
          ],
          bottom: isFullscreen ? 20 : 12,
          itemGap: isFullscreen ? 24 : 16,
          textStyle: {
            fontSize: isFullscreen ? 13 : 11,
            color: "#64748b",
            fontWeight: 500,
          },
          icon: "circle",
          itemWidth: 10,
          itemHeight: 10,
        },
        grid: {
          ...GRID_CONFIG,
          top: isFullscreen ? 50 : 40,
          bottom: isFullscreen ? 100 : 85,
          left: isFullscreen ? 70 : 60,
          right: isFullscreen ? 70 : 60,
          containLabel: false,
        },
        xAxis: {
          ...X_AXIS_CONFIG,
          data: months,
          axisLabel: {
            ...X_AXIS_CONFIG.axisLabel,
            rotate: months.length > 6 ? 30 : 0,
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
        },
        yAxis: [
          {
            ...Y_AXIS_CONFIG,
            name: "Routes / Duty Hours",
            nameLocation: "center",
            nameGap: isFullscreen ? 50 : 45,
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
          {
            ...Y_AXIS_CONFIG,
            name: "Breakdowns",
            nameLocation: "center",
            nameGap: isFullscreen ? 50 : 45,
            nameTextStyle: {
              color: "#94a3b8",
              fontSize: isFullscreen ? 13 : 12,
              fontWeight: 600,
            },
            position: "right",
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
            name: `Routes Completed (${totals.routes.toLocaleString()})`,
            type: "line",
            data: routes,
            smooth: true,
            symbol: "circle",
            symbolSize: isFullscreen ? 10 : 8,
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
            name: `Breakdowns (${totals.breakdowns.toLocaleString()})`,
            type: "line",
            data: breakdowns,
            smooth: true,
            symbol: "circle",
            symbolSize: isFullscreen ? 10 : 8,
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
            name: `Duty Hours (${totals.dutyHours.toLocaleString()})`,
            type: "line",
            data: dutyHours,
            smooth: true,
            symbol: "circle",
            symbolSize: isFullscreen ? 10 : 8,
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
    },
    [data, totals]
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
        <style>{routeBreakDutyStyles}</style>
        <div className="rbd-chart-wrapper">
          <div className="rbd-chart-header">
            <div className="rbd-chart-title">
              <div className="rbd-chart-icon">
                <BiLineChart />
              </div>
              <h6>Routes vs Breakdowns vs Duty Hours</h6>
            </div>
          </div>
          <div className="rbd-error">
            <div className="rbd-error-content">
              <div className="rbd-error-icon">
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
              <button className="rbd-retry-btn" onClick={handleRetry}>
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
      <style>{routeBreakDutyStyles}</style>

      <div className="rbd-chart-wrapper">
        {/* Loading Overlay */}
        <div className={`rbd-overlay ${showOverlay ? "visible" : ""}`}>
          <div className="rbd-loader">
            <div className="rbd-spinner" />
            <span className="rbd-loader-text">Loading chart data...</span>
          </div>
        </div>

        {/* Header */}
        <div className="rbd-chart-header">
          <div className="rbd-chart-title">
            <div className="rbd-chart-icon">
              <BiLineChart />
            </div>
            <h6>Routes vs Breakdowns vs Duty Hours</h6>
          </div>
          <div className="rbd-chart-controls">
            {data.length > 0 && (
              <div className="rbd-stats-badges">
                <div className="rbd-stat-badge routes">
                  <span className="badge-dot" />
                  <span>Routes: {totals.routes.toLocaleString()}</span>
                </div>
                <div className="rbd-stat-badge breakdowns">
                  <span className="badge-dot" />
                  <span>Breakdowns: {totals.breakdowns.toLocaleString()}</span>
                </div>
                <div className="rbd-stat-badge duty">
                  <span className="badge-dot" />
                  <span>Duty: {totals.dutyHours.toLocaleString()}h</span>
                </div>
              </div>
            )}
            <Tooltip
              target="#expand-rbd"
              content="Expand Chart"
              position="top"
            />
            <button
              id="expand-rbd"
              className="rbd-icon-btn"
              onClick={handleDialogShow}
              aria-label="Expand chart to fullscreen"
            >
              <BiExpand />
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="rbd-chart-container">
          {!loading && chartOption && (
            <EChartsBase
              option={chartOption}
              height="100%"
              loading={loading}
              style={{ minHeight: "280px" }}
            />
          )}
          {!loading && !chartOption && !error && (
            <div className="rbd-empty-state">
              <div className="rbd-empty-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M3 3v18h18" />
                  <path d="M7 16l4-4 4 4 5-6" />
                </svg>
              </div>
              <h4>No Data Available</h4>
              <p>Try adjusting your filters to see route data</p>
            </div>
          )}
        </div>

        {/* Legend Info */}
        {data.length > 0 && !loading && (
          <div className="rbd-legend-bar">
            <div className="rbd-legend-item">
              <span
                className="rbd-legend-dot"
                style={{ background: "#3b82f6" }}
              />
              <span>Routes Completed</span>
            </div>
            <div className="rbd-legend-item">
              <span
                className="rbd-legend-dot"
                style={{ background: "#ef4444" }}
              />
              <span>Breakdowns</span>
            </div>
            <div className="rbd-legend-item">
              <span
                className="rbd-legend-dot"
                style={{ background: "#10b981" }}
              />
              <span>Duty Hours</span>
            </div>
            <div className="rbd-legend-info">
              {data.length} months • Multi-axis comparison
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
        className="rbd-fullscreen-dialog"
        style={{ width: "92vw", maxWidth: "1400px" }}
        contentStyle={{ padding: 0, overflow: "hidden" }}
        modal
        draggable={false}
        resizable={false}
      >
        <div className="rbd-dialog-wrapper">
          {/* Dialog Header */}
          <div className="rbd-dialog-header">
            <div className="rbd-dialog-title">
              <div className="rbd-chart-icon large">
                <BiLineChart />
              </div>
              <div>
                <h5>Routes vs Breakdowns vs Duty Hours</h5>
                <p>Monthly comparison of operational metrics</p>
              </div>
            </div>
            <div className="rbd-dialog-controls">
              {data.length > 0 && (
                <div className="rbd-dialog-stats">
                  <div className="rbd-dialog-stat">
                    <span className="stat-label">Routes</span>
                    <span className="stat-value routes">
                      {totals.routes.toLocaleString()}
                    </span>
                  </div>
                  <div className="rbd-dialog-stat">
                    <span className="stat-label">Breakdowns</span>
                    <span className="stat-value breakdowns">
                      {totals.breakdowns.toLocaleString()}
                    </span>
                  </div>
                  <div className="rbd-dialog-stat">
                    <span className="stat-label">Duty Hours</span>
                    <span className="stat-value duty">
                      {totals.dutyHours.toLocaleString()}h
                    </span>
                  </div>
                </div>
              )}
              <button
                className="rbd-dialog-close"
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
          <div className="rbd-dialog-chart">
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
const routeBreakDutyStyles = `
/* ===== ROUTE BREAK DUTY CHART STYLES ===== */
.rbd-chart-wrapper {
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
.rbd-overlay {
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

.rbd-overlay.visible {
  opacity: 1;
  visibility: visible;
}

.rbd-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.rbd-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: rbdSpin 0.8s linear infinite;
}

@keyframes rbdSpin {
  to { transform: rotate(360deg); }
}

.rbd-loader-text {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

/* Header */
.rbd-chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
  background: white;
  flex-shrink: 0;
  min-height: 56px;
}

.rbd-chart-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rbd-chart-icon {
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

.rbd-chart-icon svg {
  width: 18px;
  height: 18px;
}

.rbd-chart-icon.large {
  width: 44px;
  height: 44px;
}

.rbd-chart-icon.large svg {
  width: 22px;
  height: 22px;
}

.rbd-chart-title h6 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.01em;
}

.rbd-chart-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Stats Badges */
.rbd-stats-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rbd-stat-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
}

.rbd-stat-badge .badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.rbd-stat-badge.routes {
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
}

.rbd-stat-badge.routes .badge-dot {
  background: #3b82f6;
}

.rbd-stat-badge.breakdowns {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.rbd-stat-badge.breakdowns .badge-dot {
  background: #ef4444;
}

.rbd-stat-badge.duty {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.rbd-stat-badge.duty .badge-dot {
  background: #10b981;
}

/* Icon Button */
.rbd-icon-btn {
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

.rbd-icon-btn:hover {
  background: #f8fafc;
  border-color: #8b5cf6;
  color: #8b5cf6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
}

.rbd-icon-btn:active {
  transform: scale(0.95);
}

.rbd-icon-btn svg {
  width: 18px;
  height: 18px;
}

/* Chart Container */
.rbd-chart-container {
  flex: 1;
  min-height: 0;
  padding: 8px 12px;
  position: relative;
}

/* Empty State */
.rbd-empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
}

.rbd-empty-icon {
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

.rbd-empty-icon svg {
  width: 32px;
  height: 32px;
}

.rbd-empty-state h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #334155;
}

.rbd-empty-state p {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
}

/* Legend Bar */
.rbd-legend-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 10px 16px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.rbd-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.rbd-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.rbd-legend-info {
  font-size: 11px;
  color: #94a3b8;
  padding-left: 12px;
  border-left: 1px solid #e2e8f0;
}

/* Error State */
.rbd-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.rbd-error-content {
  text-align: center;
  padding: 32px;
}

.rbd-error-icon {
  color: #ef4444;
  margin-bottom: 16px;
}

.rbd-error-content h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #991b1b;
}

.rbd-error-content p {
  margin: 0 0 20px;
  font-size: 13px;
  color: #b91c1c;
}

.rbd-retry-btn {
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

.rbd-retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

/* ===== FULLSCREEN DIALOG ===== */
.rbd-fullscreen-dialog .p-dialog-header {
  display: none !important;
}

.rbd-fullscreen-dialog .p-dialog-content {
  border-radius: 16px !important;
  padding: 0 !important;
}

.rbd-dialog-wrapper {
  display: flex;
  flex-direction: column;
  height: 80vh;
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

/* Dialog Header */
.rbd-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border-bottom: 1px solid #ddd6fe;
  flex-shrink: 0;
}

.rbd-dialog-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.rbd-dialog-title h5 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
}

.rbd-dialog-title p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.rbd-dialog-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Dialog Stats */
.rbd-dialog-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.rbd-dialog-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  min-width: 100px;
}

.rbd-dialog-stat .stat-label {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.rbd-dialog-stat .stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.rbd-dialog-stat .stat-value.routes {
  color: #1d4ed8;
}

.rbd-dialog-stat .stat-value.breakdowns {
  color: #dc2626;
}

.rbd-dialog-stat .stat-value.duty {
  color: #059669;
}

/* Dialog Close Button */
.rbd-dialog-close {
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

.rbd-dialog-close:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #ef4444;
}

/* Dialog Chart */
.rbd-dialog-chart {
  flex: 1;
  padding: 16px 24px 24px;
  min-height: 0;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1199px) {
  .rbd-stats-badges {
    gap: 6px;
  }
  
  .rbd-stat-badge {
    padding: 5px 8px;
    font-size: 10px;
  }
}

@media (max-width: 991px) {
  .rbd-stats-badges {
    display: none;
  }
  
  .rbd-dialog-stats {
    display: none;
  }
}

@media (max-width: 767px) {
  .rbd-chart-header {
    padding: 12px 14px;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .rbd-chart-title h6 {
    font-size: 0.8125rem;
  }
  
  .rbd-chart-icon {
    width: 32px;
    height: 32px;
  }
  
  .rbd-chart-icon svg {
    width: 16px;
    height: 16px;
  }
  
  .rbd-legend-bar {
    gap: 12px;
    padding: 10px 12px;
  }
  
  .rbd-legend-item {
    font-size: 11px;
  }
  
  .rbd-legend-info {
    flex: 0 0 100%;
    text-align: center;
    padding: 8px 0 0;
    border-left: none;
    border-top: 1px solid #e2e8f0;
  }
  
  .rbd-dialog-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .rbd-dialog-controls {
    width: 100%;
    justify-content: flex-end;
  }
  
  .rbd-dialog-close {
    position: absolute;
    top: 12px;
    right: 12px;
  }
}

@media (max-width: 575px) {
  .rbd-chart-title {
    flex: 1 1 100%;
  }
  
  .rbd-chart-controls {
    flex: 1 1 100%;
    justify-content: flex-end;
  }
  
  .rbd-chart-title h6 {
    font-size: 0.75rem;
  }
  
  .rbd-legend-item {
    font-size: 10px;
    gap: 5px;
  }
  
  .rbd-legend-dot {
    width: 8px;
    height: 8px;
  }
}

/* ===== ANIMATIONS ===== */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.rbd-chart-wrapper {
  animation: fadeIn 0.4s ease-out;
}

.rbd-stat-badge {
  animation: fadeIn 0.3s ease-out backwards;
}

.rbd-stat-badge:nth-child(1) { animation-delay: 0.1s; }
.rbd-stat-badge:nth-child(2) { animation-delay: 0.15s; }
.rbd-stat-badge:nth-child(3) { animation-delay: 0.2s; }

.rbd-dialog-stat {
  animation: fadeIn 0.3s ease-out backwards;
}

.rbd-dialog-stat:nth-child(1) { animation-delay: 0.05s; }
.rbd-dialog-stat:nth-child(2) { animation-delay: 0.1s; }
.rbd-dialog-stat:nth-child(3) { animation-delay: 0.15s; }
`;

export default memo(RouteBreakDuty);