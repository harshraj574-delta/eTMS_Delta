import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import { apiService } from "../../../services/api";
import { BiExpand } from "react-icons/bi";
import { HiOutlineUserGroup } from "react-icons/hi2";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import EChartsBase, { ANIMATION_CONFIG } from "../EChartsBase";

const DriverFragmentation = ({ filter = {} }) => {
  const [driverData, setDriverData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const maxRetries = 3;

  const {
    sDate = "",
    eDate = "",
    locationid = "",
    facilityid = "",
    vendorid = "",
    triptype = "",
  } = filter;

  useEffect(() => {
    let mounted = true;

    const requestWithTimeout = (promise, ms = 8000) => {
      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("Request timed out")),
          ms
        );
      });
      return Promise.race([promise, timeoutPromise]).finally(() =>
        clearTimeout(timeoutId)
      );
    };

    const fetchData = async () => {
      if (!mounted) return;
      if (!isTransitioning) {
        setLoading(true);
      }
      setError(null);

      try {
        const res = await requestWithTimeout(
          apiService.getchart_Efficiency({
            sDate: filter.sDate,
            eDate: filter.eDate,
            locationid: filter.locationid || null,
            facilityid: filter.facilityid || null,
            vendorid: filter.vendorid || null,
            triptype: filter.triptype || null,
          })
        );

        let payload = res?.data ?? res;
        if (typeof payload === "string") {
          try {
            payload = JSON.parse(payload);
          } catch (e) {
            /* ignore */
          }
        }

        const obj = Array.isArray(payload) ? payload[0] : payload || {};

        const formattedData = [
          {
            name: "On-time Count",
            value: Number(
              obj.ontimecount ?? obj.OnTimeCount ?? obj.onTimeCount ?? 0
            ),
            icon: "clock",
          },
          {
            name: "BGC Done",
            value: Number(
              obj.BGCDone ?? obj.BGCDoneCount ?? obj.bgcdone ?? 0
            ),
            icon: "check",
          },
          {
            name: "Driver Refusal",
            value: Number(
              obj.DriverRefusalCount ??
                obj.DriverRefusal ??
                obj.driverRefusalCount ??
                0
            ),
            icon: "x",
          },
          {
            name: "Drivers 50+ (%)",
            value: Number(
              obj.DriverfifthyAbovePer ??
                obj.DriverFiftyAbovePer ??
                obj.Driver50AbovePer ??
                0
            ),
            isPercent: true,
            icon: "users",
          },
          {
            name: "Duty Hour >12",
            value: Number(
              obj.dutyhourAboveTwelvecount ??
                obj.DutyHourAbove12Count ??
                obj.dutyHourAbove12Count ??
                0
            ),
            icon: "time",
          },
        ];

        if (mounted) {
          setDriverData(formattedData);
          setRetryCount(0);
          setError(null);
        }
      } catch (err) {
        console.error("API Error:", err);
        setError(err?.message || "Failed to load data");

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying DriverFragmentation... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          if (mounted) setDriverData([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setIsTransitioning(false);
        }
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [sDate, eDate, locationid, facilityid, vendorid, triptype, retryCount]);

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

  // Calculate statistics
  const stats = useMemo(() => {
    if (!driverData || driverData.length === 0) {
      return { totalMetrics: 0, totalCount: 0, maxValue: 0, minValue: 0 };
    }
    const values = driverData.filter((d) => !d.isPercent).map((d) => d.value);
    return {
      totalMetrics: driverData.length,
      totalCount: values.reduce((a, b) => a + b, 0),
      maxValue: Math.max(...values),
      minValue: Math.min(...values),
    };
  }, [driverData]);

  // Color palette
  const radarColor = "#8b5cf6";

  // Generate ECharts option for radar chart
  const getChartOption = useCallback(
    (isFullscreen = false) => {
      if (!driverData || driverData.length === 0) return null;

      const maxValue = Math.max(100, ...driverData.map((d) => d.value));
      const indicators = driverData.map((d) => ({
        name: d.name,
        max: maxValue,
      }));
      const values = driverData.map((d) => d.value);

      return {
        ...ANIMATION_CONFIG,
        tooltip: {
          trigger: "item",
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
            if (!params.value) return "";
            let result = `<div style="font-weight: 700; margin-bottom: 10px; color: #1e293b; font-size: 14px;">Driver Metrics</div>`;
            driverData.forEach((item, idx) => {
              const isPercent = item.isPercent;
              const unit = isPercent ? "%" : "";
              const marker = `<span style="display:inline-block;margin-right:8px;border-radius:4px;width:10px;height:10px;background:${radarColor};box-shadow: 0 2px 4px rgba(139, 92, 246, 0.4);"></span>`;
              result += `<div style="margin: 8px 0; display: flex; align-items: center; justify-content: space-between; gap: 24px;">
                <span style="display: flex; align-items: center;">${marker}<span style="color: #64748b;">${item.name}</span></span>
                <strong style="color: #1e293b; font-size: 14px;">${params.value[idx]}${unit}</strong>
              </div>`;
            });
            return result;
          },
        },
        radar: {
          indicator: indicators,
          shape: "polygon",
          radius: isFullscreen ? "70%" : "60%",
          center: ["50%", "50%"],
          axisName: {
            color: "#64748b",
            fontSize: isFullscreen ? 13 : 11,
            fontWeight: 500,
          },
          splitArea: {
            areaStyle: {
              color: [
                "rgba(139, 92, 246, 0.02)",
                "rgba(139, 92, 246, 0.04)",
                "rgba(139, 92, 246, 0.06)",
                "rgba(139, 92, 246, 0.08)",
              ],
            },
          },
          axisLine: {
            lineStyle: {
              color: "#e2e8f0",
            },
          },
          splitLine: {
            lineStyle: {
              color: "#e2e8f0",
            },
          },
        },
        series: [
          {
            name: "Driver Metrics",
            type: "radar",
            data: [
              {
                value: values,
                name: "Driver Metrics",
                symbol: "circle",
                symbolSize: isFullscreen ? 10 : 6,
                lineStyle: {
                  color: radarColor,
                  width: isFullscreen ? 3 : 2,
                  shadowColor: "rgba(139, 92, 246, 0.3)",
                  shadowBlur: 8,
                },
                itemStyle: {
                  color: radarColor,
                  borderColor: "#fff",
                  borderWidth: 2,
                  shadowColor: "rgba(139, 92, 246, 0.5)",
                  shadowBlur: 6,
                },
                areaStyle: {
                  color: {
                    type: "radial",
                    x: 0.5,
                    y: 0.5,
                    r: 0.5,
                    colorStops: [
                      { offset: 0, color: "rgba(139, 92, 246, 0.4)" },
                      { offset: 1, color: "rgba(139, 92, 246, 0.1)" },
                    ],
                  },
                },
              },
            ],
          },
        ],
      };
    },
    [driverData]
  );

  const chartOption = useMemo(() => getChartOption(false), [getChartOption]);
  const fullscreenChartOption = useMemo(
    () => getChartOption(true),
    [getChartOption]
  );

  const showOverlay = loading || isTransitioning;

  // Get icon for metric
  const getMetricIcon = (iconType) => {
    switch (iconType) {
      case "clock":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case "check":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
      case "x":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case "users":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case "time":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
    }
  };

  // Error state
  if (error && retryCount >= maxRetries) {
    return (
      <>
        <style>{driverFragStyles}</style>
        <div className="df-chart-wrapper">
          <div className="df-chart-header">
            <div className="df-chart-title">
              <div className="df-chart-icon">
                <HiOutlineUserGroup />
              </div>
              <h6>Driver Fragmentation</h6>
            </div>
          </div>
          <div className="df-error">
            <div className="df-error-content">
              <div className="df-error-icon">
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
              <button className="df-retry-btn" onClick={handleRetry}>
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
      <style>{driverFragStyles}</style>

      <div className="df-chart-wrapper">
        {/* Loading Overlay */}
        <div className={`df-overlay ${showOverlay ? "visible" : ""}`}>
          <div className="df-loader">
            <div className="df-spinner" />
            <span className="df-loader-text">Loading chart data...</span>
          </div>
        </div>

        {/* Header */}
        <div className="df-chart-header">
          <div className="df-chart-title">
            <div className="df-chart-icon">
              <HiOutlineUserGroup />
            </div>
            <h6>Driver Fragmentation</h6>
          </div>
          <div className="df-chart-controls">
            {driverData.length > 0 && (
              <div className="df-stats-badges">
                <div className="df-stat-badge metrics">
                  <span className="badge-label">Metrics:</span>
                  <span className="badge-value">{stats.totalMetrics}</span>
                </div>
                <div className="df-stat-badge total">
                  <span className="badge-label">Total:</span>
                  <span className="badge-value">
                    {stats.totalCount.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            <Tooltip
              target="#expand-driver-frag"
              content="Expand Chart"
              position="top"
            />
            <button
              id="expand-driver-frag"
              className="df-icon-btn"
              onClick={handleDialogShow}
              aria-label="Expand chart to fullscreen"
            >
              <BiExpand />
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="df-chart-container">
          {!loading && chartOption && (
            <EChartsBase
              option={chartOption}
              height="100%"
              loading={loading}
              style={{ minHeight: "240px" }}
            />
          )}
          {!loading && !chartOption && !error && (
            <div className="df-empty-state">
              <div className="df-empty-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                  <line x1="12" y1="22" x2="12" y2="15.5" />
                  <polyline points="22 8.5 12 15.5 2 8.5" />
                </svg>
              </div>
              <h4>No Data Available</h4>
              <p>Try adjusting your filters to see driver metrics</p>
            </div>
          )}
        </div>

        {/* Stats Tags */}
        {!loading && driverData.length > 0 && (
          <div className="df-tags-container">
            {driverData.map((d, i) => (
              <div key={i} className="df-tag">
                <span className="df-tag-color" />
                <span className="tag-label">{d.name}</span>
                <span className="tag-value">
                  {d.isPercent ? `${d.value}%` : d.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Legend Bar */}
        {driverData.length > 0 && !loading && (
          <div className="df-legend-bar">
            <div className="df-legend-item">
              <span
                className="df-legend-dot"
                style={{ background: radarColor }}
              />
              <span>Driver Metrics</span>
            </div>
            <div className="df-legend-info">
              {stats.totalMetrics} metrics • Radar analysis
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
        className="df-fullscreen-dialog"
        style={{ width: "92vw", maxWidth: "1100px" }}
        contentStyle={{ padding: 0, overflow: "hidden" }}
        modal
        draggable={false}
        resizable={false}
      >
        <div className="df-dialog-wrapper">
          {/* Dialog Header */}
          <div className="df-dialog-header">
            <div className="df-dialog-title">
              <div className="df-chart-icon large">
                <HiOutlineUserGroup />
              </div>
              <div>
                <h5>Driver Fragmentation</h5>
                <p>Comprehensive driver performance and compliance metrics</p>
              </div>
            </div>
            <div className="df-dialog-controls">
              {driverData.length > 0 && (
                <div className="df-dialog-stats">
                  <div className="df-dialog-stat">
                    <span className="stat-label">Metrics</span>
                    <span className="stat-value">{stats.totalMetrics}</span>
                  </div>
                  <div className="df-dialog-stat">
                    <span className="stat-label">Total Count</span>
                    <span className="stat-value total">
                      {stats.totalCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="df-dialog-stat">
                    <span className="stat-label">Max Value</span>
                    <span className="stat-value max">
                      {stats.maxValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="df-dialog-stat">
                    <span className="stat-label">Min Value</span>
                    <span className="stat-value min">
                      {stats.minValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              <button
                className="df-dialog-close"
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
          <div className="df-dialog-chart">
            {fullscreenChartOption && (
              <EChartsBase
                option={fullscreenChartOption}
                height="calc(70vh - 200px)"
                loading={loading}
              />
            )}

            {/* Dialog Tags Grid */}
            <div className="df-dialog-tags-grid">
              {driverData.map((d, i) => (
                <div key={i} className="df-dialog-tag-card">
                  <div className="tag-icon">{getMetricIcon(d.icon)}</div>
                  <div className="tag-content">
                    <span className="tag-number">
                      {d.isPercent ? `${d.value}%` : d.value.toLocaleString()}
                    </span>
                    <span className="tag-name">{d.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
};

// Component Styles
const driverFragStyles = `
/* ===== DRIVER FRAGMENTATION CHART STYLES ===== */
.df-chart-wrapper {
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
.df-overlay {
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

.df-overlay.visible {
  opacity: 1;
  visibility: visible;
}

.df-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.df-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: dfSpin 0.8s linear infinite;
}

@keyframes dfSpin {
  to { transform: rotate(360deg); }
}

.df-loader-text {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

/* Header */
.df-chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
  background: white;
  flex-shrink: 0;
  min-height: 56px;
  gap: 12px;
}

.df-chart-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.df-chart-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border-radius: 10px;
  color: white;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  flex-shrink: 0;
}

.df-chart-icon svg {
  width: 18px;
  height: 18px;
}

.df-chart-icon.large {
  width: 44px;
  height: 44px;
}

.df-chart-icon.large svg {
  width: 22px;
  height: 22px;
}

.df-chart-title h6 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.df-chart-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* Stats Badges - Horizontal Layout */
.df-stats-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: nowrap;
}

.df-stat-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.df-stat-badge .badge-label {
  color: inherit;
  opacity: 0.8;
}

.df-stat-badge .badge-value {
  font-weight: 700;
}

.df-stat-badge.metrics {
  background: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
}

.df-stat-badge.total {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

/* Icon Button */
.df-icon-btn {
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
  flex-shrink: 0;
}

.df-icon-btn:hover {
  background: #f8fafc;
  border-color: #8b5cf6;
  color: #8b5cf6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
}

.df-icon-btn:active {
  transform: scale(0.95);
}

.df-icon-btn svg {
  width: 18px;
  height: 18px;
}

/* Chart Container */
.df-chart-container {
  flex: 1;
  min-height: 0;
  padding: 8px 12px;
  position: relative;
}

/* Tags Container */
.df-tags-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px 12px;
}

.df-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border: 1px solid #ddd6fe;
  border-radius: 20px;
  font-size: 12px;
  transition: all 0.2s ease;
}

.df-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
}

.df-tag-color {
  width: 8px;
  height: 8px;
  background: #8b5cf6;
  border-radius: 2px;
  flex-shrink: 0;
}

.df-tag .tag-label {
  color: #64748b;
  font-weight: 500;
}

.df-tag .tag-value {
  color: #7c3aed;
  font-weight: 700;
}

/* Empty State */
.df-empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
}

.df-empty-icon {
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

.df-empty-icon svg {
  width: 32px;
  height: 32px;
}

.df-empty-state h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #334155;
}

.df-empty-state p {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
}

/* Legend Bar */
.df-legend-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 10px 16px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.df-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.df-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.df-legend-info {
  font-size: 11px;
  color: #94a3b8;
  padding-left: 12px;
  border-left: 1px solid #e2e8f0;
}

/* Error State */
.df-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.df-error-content {
  text-align: center;
  padding: 32px;
}

.df-error-icon {
  color: #ef4444;
  margin-bottom: 16px;
}

.df-error-content h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #991b1b;
}

.df-error-content p {
  margin: 0 0 20px;
  font-size: 13px;
  color: #b91c1c;
}

.df-retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.df-retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

/* ===== FULLSCREEN DIALOG ===== */
.df-fullscreen-dialog .p-dialog-header {
  display: none !important;
}

.df-fullscreen-dialog .p-dialog-content {
  border-radius: 16px !important;
  padding: 0 !important;
}

.df-dialog-wrapper {
  display: flex;
  flex-direction: column;
  height: 80vh;
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

/* Dialog Header */
.df-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border-bottom: 1px solid #ddd6fe;
  flex-shrink: 0;
  gap: 16px;
}

.df-dialog-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.df-dialog-title h5 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
}

.df-dialog-title p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.df-dialog-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Dialog Stats */
.df-dialog-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.df-dialog-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 14px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  min-width: 80px;
}

.df-dialog-stat .stat-label {
  font-size: 10px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.df-dialog-stat .stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.df-dialog-stat .stat-value.total {
  color: #7c3aed;
}

.df-dialog-stat .stat-value.max {
  color: #059669;
}

.df-dialog-stat .stat-value.min {
  color: #f59e0b;
}

/* Dialog Close Button */
.df-dialog-close {
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
  flex-shrink: 0;
}

.df-dialog-close:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #ef4444;
}

/* Dialog Chart */
.df-dialog-chart {
  flex: 1;
  padding: 16px 24px 24px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* Dialog Tags Grid */
.df-dialog-tags-grid {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 20px 0;
  margin-top: auto;
}

.df-dialog-tag-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  min-width: 160px;
}

.df-dialog-tag-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: #ddd6fe;
}

.df-dialog-tag-card .tag-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 10px;
  color: #8b5cf6;
  flex-shrink: 0;
}

.df-dialog-tag-card .tag-icon svg {
  width: 20px;
  height: 20px;
}

.df-dialog-tag-card .tag-content {
  display: flex;
  flex-direction: column;
}

.df-dialog-tag-card .tag-number {
  font-size: 20px;
  font-weight: 700;
  color: #7c3aed;
  line-height: 1;
}

.df-dialog-tag-card .tag-name {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  margin-top: 4px;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 991px) {
  .df-stats-badges {
    display: none;
  }
  
  .df-dialog-stats {
    display: none;
  }
  
  .df-dialog-tags-grid {
    gap: 12px;
  }
  
  .df-dialog-tag-card {
    padding: 12px 16px;
    min-width: 140px;
  }
}

@media (max-width: 767px) {
  .df-chart-header {
    padding: 12px 14px;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .df-chart-title h6 {
    font-size: 0.875rem;
  }
  
  .df-chart-icon {
    width: 32px;
    height: 32px;
  }
  
  .df-chart-icon svg {
    width: 16px;
    height: 16px;
  }
  
  .df-tags-container {
    gap: 6px;
    padding: 6px 12px 10px;
  }
  
  .df-tag {
    padding: 4px 10px;
    font-size: 11px;
  }
  
  .df-legend-bar {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .df-legend-info {
    flex: 0 0 100%;
    text-align: center;
    padding: 8px 0 0;
    border-left: none;
    border-top: 1px solid #e2e8f0;
  }
  
  .df-dialog-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .df-dialog-controls {
    width: 100%;
    justify-content: flex-end;
  }
  
  .df-dialog-close {
    position: absolute;
    top: 12px;
    right: 12px;
  }
  
  .df-dialog-tags-grid {
    flex-direction: column;
    align-items: stretch;
  }
  
  .df-dialog-tag-card {
    min-width: unset;
  }
}

@media (max-width: 575px) {
  .df-chart-title {
    flex: 1 1 100%;
  }
  
  .df-chart-controls {
    flex: 1 1 100%;
    justify-content: flex-end;
  }
  
  .df-chart-title h6 {
    font-size: 0.8125rem;
  }
  
  .df-tag {
    padding: 3px 8px;
    font-size: 10px;
    gap: 6px;
  }
}

/* ===== ANIMATIONS ===== */
@keyframes dfFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.df-chart-wrapper {
  animation: dfFadeIn 0.4s ease-out;
}

.df-stat-badge {
  animation: dfFadeIn 0.3s ease-out backwards;
}

.df-stat-badge:nth-child(1) { animation-delay: 0.1s; }
.df-stat-badge:nth-child(2) { animation-delay: 0.15s; }

.df-tag {
  animation: dfFadeIn 0.3s ease-out backwards;
}

.df-tag:nth-child(1) { animation-delay: 0.05s; }
.df-tag:nth-child(2) { animation-delay: 0.1s; }
.df-tag:nth-child(3) { animation-delay: 0.15s; }
.df-tag:nth-child(4) { animation-delay: 0.2s; }
.df-tag:nth-child(5) { animation-delay: 0.25s; }

.df-dialog-stat {
  animation: dfFadeIn 0.3s ease-out backwards;
}

.df-dialog-stat:nth-child(1) { animation-delay: 0.05s; }
.df-dialog-stat:nth-child(2) { animation-delay: 0.1s; }
.df-dialog-stat:nth-child(3) { animation-delay: 0.15s; }
.df-dialog-stat:nth-child(4) { animation-delay: 0.2s; }

.df-dialog-tag-card {
  animation: dfFadeIn 0.4s ease-out backwards;
}

.df-dialog-tag-card:nth-child(1) { animation-delay: 0.1s; }
.df-dialog-tag-card:nth-child(2) { animation-delay: 0.15s; }
.df-dialog-tag-card:nth-child(3) { animation-delay: 0.2s; }
.df-dialog-tag-card:nth-child(4) { animation-delay: 0.25s; }
.df-dialog-tag-card:nth-child(5) { animation-delay: 0.3s; }
`;

export default memo(DriverFragmentation);