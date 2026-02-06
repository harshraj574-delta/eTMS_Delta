import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import { apiService } from "../../../services/api.js";
import { BiExpand, BiRadar } from "react-icons/bi";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import EChartsBase, { ANIMATION_CONFIG } from "../EChartsBase";

const DriverEfficiencyRadar = ({ filter = {} }) => {
  const [data, setData] = useState([]);
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

    const fetchData = async () => {
      if (!mounted) return;
      if (!isTransitioning) {
        setLoading(true);
      }
      setError(null);

      try {
        const params = {
          sDate,
          eDate,
          locationid,
          facilityid,
          vendorid,
          triptype,
        };
        let res = await apiService.getchart_DriverEfficiency(params);

        if (typeof res === "string") {
          try {
            res = JSON.parse(res);
          } catch {
            throw new Error("Invalid JSON returned from API");
          }
        }

        if (!Array.isArray(res)) throw new Error("Unexpected API response");

        const mapped = res.map((item, idx) => {
          const trips = Number(item.triptype ?? idx + 1);
          return {
            triptype: `${trips} Trip${trips > 1 ? "s" : ""}/Day`,
            avgTrips: Number(item.AvgDrivertrip) || 0,
          };
        });

        if (mapped.length === 0) throw new Error("No data available");

        if (mounted) {
          setData(mapped);
          setRetryCount(0);
          setError(null);
        }
      } catch (err) {
        console.error("DriverEfficiencyRadar fetch error:", err);
        setError(err.message || String(err));

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying DriverEfficiency... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          if (mounted) setData([]);
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
    if (!data || data.length === 0) {
      return { totalCategories: 0, avgOverall: 0, maxTrips: 0, minTrips: 0 };
    }
    const values = data.map((d) => d.avgTrips);
    return {
      totalCategories: data.length,
      avgOverall: values.reduce((a, b) => a + b, 0) / values.length,
      maxTrips: Math.max(...values),
      minTrips: Math.min(...values),
    };
  }, [data]);

  // Generate ECharts option for radar chart
  const getChartOption = useCallback(
    (isFullscreen = false) => {
      if (!data || data.length === 0) return null;

      const maxValue = Math.max(10, ...data.map((d) => d.avgTrips)) * 1.1;
      const indicators = data.map((d) => ({
        name: d.triptype,
        max: maxValue,
      }));
      const values = data.map((d) => d.avgTrips);

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
            let result = `<div style="font-weight: 700; margin-bottom: 10px; color: #1e293b; font-size: 14px;">Driver Trip Distribution</div>`;
            data.forEach((item, idx) => {
              const marker = `<span style="display:inline-block;margin-right:8px;border-radius:4px;width:10px;height:10px;background:rgba(14, 165, 233, 1);box-shadow: 0 2px 4px rgba(14, 165, 233, 0.4);"></span>`;
              result += `<div style="margin: 8px 0; display: flex; align-items: center; justify-content: space-between; gap: 24px;">
                <span style="display: flex; align-items: center;">${marker}<span style="color: #64748b;">${item.triptype}</span></span>
                <strong style="color: #1e293b; font-size: 14px;">${params.value[idx].toFixed(2)} avg</strong>
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
                "rgba(14, 165, 233, 0.02)",
                "rgba(14, 165, 233, 0.04)",
                "rgba(14, 165, 233, 0.06)",
                "rgba(14, 165, 233, 0.08)",
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
            name: "Avg Trips/Driver",
            type: "radar",
            data: [
              {
                value: values,
                name: "Avg Trips/Driver",
                symbol: "circle",
                symbolSize: isFullscreen ? 10 : 8,
                lineStyle: {
                  color: "rgba(14, 165, 233, 1)",
                  width: isFullscreen ? 3 : 2,
                  shadowColor: "rgba(14, 165, 233, 0.3)",
                  shadowBlur: 8,
                },
                itemStyle: {
                  color: "rgba(14, 165, 233, 1)",
                  borderColor: "#fff",
                  borderWidth: 2,
                  shadowColor: "rgba(14, 165, 233, 0.5)",
                  shadowBlur: 6,
                },
                areaStyle: {
                  color: {
                    type: "radial",
                    x: 0.5,
                    y: 0.5,
                    r: 0.5,
                    colorStops: [
                      { offset: 0, color: "rgba(14, 165, 233, 0.4)" },
                      { offset: 1, color: "rgba(14, 165, 233, 0.1)" },
                    ],
                  },
                },
              },
            ],
          },
        ],
      };
    },
    [data]
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
        <style>{driverRadarStyles}</style>
        <div className="driver-chart-wrapper">
          <div className="driver-chart-header">
            <div className="driver-chart-title">
              <div className="driver-chart-icon">
                <BiRadar />
              </div>
              <h6>Driver Trip Distribution</h6>
            </div>
          </div>
          <div className="driver-error">
            <div className="driver-error-content">
              <div className="driver-error-icon">
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
              <button className="driver-retry-btn" onClick={handleRetry}>
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
      <style>{driverRadarStyles}</style>

      <div className="driver-chart-wrapper">
        {/* Loading Overlay */}
        <div className={`driver-overlay ${showOverlay ? "visible" : ""}`}>
          <div className="driver-loader">
            <div className="driver-spinner" />
            <span className="driver-loader-text">Loading chart data...</span>
          </div>
        </div>

        {/* Header */}
        <div className="driver-chart-header">
          <div className="driver-chart-title">
            <div className="driver-chart-icon">
              <BiRadar />
            </div>
            <h6>Driver Trip Distribution</h6>
          </div>
          <div className="driver-chart-controls">
            {data.length > 0 && (
              <div className="driver-stats-badges">
                <div className="driver-stat-badge avg">
                  <span className="badge-label">Avg:</span>
                  <span className="badge-value">
                    {stats.avgOverall.toFixed(2)}
                  </span>
                </div>
                <div className="driver-stat-badge max">
                  <span className="badge-label">Max:</span>
                  <span className="badge-value">
                    {stats.maxTrips.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            <Tooltip
              target="#expand-driver"
              content="Expand Chart"
              position="top"
            />
            <button
              id="expand-driver"
              className="driver-icon-btn"
              onClick={handleDialogShow}
              aria-label="Expand chart to fullscreen"
            >
              <BiExpand />
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="driver-chart-container">
          {!loading && chartOption && (
            <EChartsBase
              option={chartOption}
              height="100%"
              loading={loading}
              style={{ minHeight: "240px" }}
            />
          )}
          {!loading && !chartOption && !error && (
            <div className="driver-empty-state">
              <div className="driver-empty-icon">
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
              <p>Try adjusting your filters to see driver efficiency data</p>
            </div>
          )}
        </div>

        {/* Stats Tags */}
        {!loading && data.length > 0 && (
          <div className="driver-tags-container">
            {data.map((d, i) => (
              <div key={i} className="driver-tag">
                <span className="tag-label">{d.triptype}</span>
                <span className="tag-value">{d.avgTrips.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Legend Bar */}
        {data.length > 0 && !loading && (
          <div className="driver-legend-bar">
            <div className="driver-legend-item">
              <span
                className="driver-legend-dot"
                style={{ background: "#0ea5e9" }}
              />
              <span>Avg Trips per Driver</span>
            </div>
            <div className="driver-legend-info">
              {stats.totalCategories} categories • Radar analysis
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
        className="driver-fullscreen-dialog"
        style={{ width: "92vw", maxWidth: "1000px" }}
        contentStyle={{ padding: 0, overflow: "hidden" }}
        modal
        draggable={false}
        resizable={false}
      >
        <div className="driver-dialog-wrapper">
          {/* Dialog Header */}
          <div className="driver-dialog-header">
            <div className="driver-dialog-title">
              <div className="driver-chart-icon large">
                <BiRadar />
              </div>
              <div>
                <h5>Driver Trip Distribution</h5>
                <p>Average trips per driver across different trip categories</p>
              </div>
            </div>
            <div className="driver-dialog-controls">
              {data.length > 0 && (
                <div className="driver-dialog-stats">
                  <div className="driver-dialog-stat">
                    <span className="stat-label">Categories</span>
                    <span className="stat-value">{stats.totalCategories}</span>
                  </div>
                  <div className="driver-dialog-stat">
                    <span className="stat-label">Avg Overall</span>
                    <span className="stat-value avg">
                      {stats.avgOverall.toFixed(2)}
                    </span>
                  </div>
                  <div className="driver-dialog-stat">
                    <span className="stat-label">Max Trips</span>
                    <span className="stat-value max">
                      {stats.maxTrips.toFixed(2)}
                    </span>
                  </div>
                  <div className="driver-dialog-stat">
                    <span className="stat-label">Min Trips</span>
                    <span className="stat-value min">
                      {stats.minTrips.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              <button
                className="driver-dialog-close"
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
          <div className="driver-dialog-chart">
            {fullscreenChartOption && (
              <EChartsBase
                option={fullscreenChartOption}
                height="calc(70vh - 180px)"
                loading={loading}
              />
            )}

            {/* Dialog Tags Grid */}
            <div className="driver-dialog-tags-grid">
              {data.map((d, i) => (
                <div key={i} className="driver-dialog-tag-card">
                  <div className="tag-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="tag-content">
                    <span className="tag-number">{d.avgTrips.toFixed(2)}</span>
                    <span className="tag-name">{d.triptype}</span>
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
const driverRadarStyles = `
/* ===== DRIVER RADAR CHART STYLES ===== */
.driver-chart-wrapper {
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
.driver-overlay {
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

.driver-overlay.visible {
  opacity: 1;
  visibility: visible;
}

.driver-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.driver-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #0ea5e9;
  border-radius: 50%;
  animation: driverSpin 0.8s linear infinite;
}

@keyframes driverSpin {
  to { transform: rotate(360deg); }
}

.driver-loader-text {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

/* Header */
.driver-chart-header {
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

.driver-chart-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.driver-chart-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  border-radius: 10px;
  color: white;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
  flex-shrink: 0;
}

.driver-chart-icon svg {
  width: 18px;
  height: 18px;
}

.driver-chart-icon.large {
  width: 44px;
  height: 44px;
}

.driver-chart-icon.large svg {
  width: 22px;
  height: 22px;
}

.driver-chart-title h6 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.driver-chart-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* Stats Badges - Fixed Horizontal Layout */
.driver-stats-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: nowrap;
}

.driver-stat-badge {
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

.driver-stat-badge .badge-label {
  color: inherit;
  opacity: 0.8;
}

.driver-stat-badge .badge-value {
  font-weight: 700;
}

.driver-stat-badge.avg {
  background: rgba(14, 165, 233, 0.1);
  color: #0284c7;
}

.driver-stat-badge.max {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

/* Icon Button */
.driver-icon-btn {
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

.driver-icon-btn:hover {
  background: #f8fafc;
  border-color: #0ea5e9;
  color: #0ea5e9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
}

.driver-icon-btn:active {
  transform: scale(0.95);
}

.driver-icon-btn svg {
  width: 18px;
  height: 18px;
}

/* Chart Container */
.driver-chart-container {
  flex: 1;
  min-height: 0;
  padding: 8px 12px;
  position: relative;
}

/* Tags Container */
.driver-tags-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px 12px;
}

.driver-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 20px;
  font-size: 12px;
  transition: all 0.2s ease;
}

.driver-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
}

.driver-tag .tag-label {
  color: #64748b;
  font-weight: 500;
}

.driver-tag .tag-value {
  color: #0284c7;
  font-weight: 700;
}

/* Empty State */
.driver-empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
}

.driver-empty-icon {
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

.driver-empty-icon svg {
  width: 32px;
  height: 32px;
}

.driver-empty-state h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #334155;
}

.driver-empty-state p {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
}

/* Legend Bar */
.driver-legend-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 10px 16px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.driver-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.driver-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.driver-legend-info {
  font-size: 11px;
  color: #94a3b8;
  padding-left: 12px;
  border-left: 1px solid #e2e8f0;
}

/* Error State */
.driver-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.driver-error-content {
  text-align: center;
  padding: 32px;
}

.driver-error-icon {
  color: #ef4444;
  margin-bottom: 16px;
}

.driver-error-content h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #991b1b;
}

.driver-error-content p {
  margin: 0 0 20px;
  font-size: 13px;
  color: #b91c1c;
}

.driver-retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.driver-retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4);
}

/* ===== FULLSCREEN DIALOG ===== */
.driver-fullscreen-dialog .p-dialog-header {
  display: none !important;
}

.driver-fullscreen-dialog .p-dialog-content {
  border-radius: 16px !important;
  padding: 0 !important;
}

.driver-dialog-wrapper {
  display: flex;
  flex-direction: column;
  height: 80vh;
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

/* Dialog Header */
.driver-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-bottom: 1px solid #bae6fd;
  flex-shrink: 0;
  gap: 16px;
}

.driver-dialog-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.driver-dialog-title h5 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
}

.driver-dialog-title p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.driver-dialog-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Dialog Stats */
.driver-dialog-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.driver-dialog-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 14px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  min-width: 80px;
}

.driver-dialog-stat .stat-label {
  font-size: 10px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.driver-dialog-stat .stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.driver-dialog-stat .stat-value.avg {
  color: #0284c7;
}

.driver-dialog-stat .stat-value.max {
  color: #059669;
}

.driver-dialog-stat .stat-value.min {
  color: #f59e0b;
}

/* Dialog Close Button */
.driver-dialog-close {
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

.driver-dialog-close:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #ef4444;
}

/* Dialog Chart */
.driver-dialog-chart {
  flex: 1;
  padding: 16px 24px 24px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* Dialog Tags Grid */
.driver-dialog-tags-grid {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 20px 0;
  margin-top: auto;
}

.driver-dialog-tag-card {
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

.driver-dialog-tag-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: #bae6fd;
}

.driver-dialog-tag-card .tag-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(14, 165, 233, 0.1);
  border-radius: 10px;
  color: #0ea5e9;
  flex-shrink: 0;
}

.driver-dialog-tag-card .tag-icon svg {
  width: 20px;
  height: 20px;
}

.driver-dialog-tag-card .tag-content {
  display: flex;
  flex-direction: column;
}

.driver-dialog-tag-card .tag-number {
  font-size: 20px;
  font-weight: 700;
  color: #0284c7;
  line-height: 1;
}

.driver-dialog-tag-card .tag-name {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  margin-top: 4px;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 991px) {
  .driver-stats-badges {
    display: none;
  }
  
  .driver-dialog-stats {
    display: none;
  }
  
  .driver-dialog-tags-grid {
    gap: 12px;
  }
  
  .driver-dialog-tag-card {
    padding: 12px 16px;
    min-width: 140px;
  }
}

@media (max-width: 767px) {
  .driver-chart-header {
    padding: 12px 14px;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .driver-chart-title h6 {
    font-size: 0.875rem;
  }
  
  .driver-chart-icon {
    width: 32px;
    height: 32px;
  }
  
  .driver-chart-icon svg {
    width: 16px;
    height: 16px;
  }
  
  .driver-tags-container {
    gap: 6px;
    padding: 6px 12px 10px;
  }
  
  .driver-tag {
    padding: 4px 10px;
    font-size: 11px;
  }
  
  .driver-legend-bar {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .driver-legend-info {
    flex: 0 0 100%;
    text-align: center;
    padding: 8px 0 0;
    border-left: none;
    border-top: 1px solid #e2e8f0;
  }
  
  .driver-dialog-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .driver-dialog-controls {
    width: 100%;
    justify-content: flex-end;
  }
  
  .driver-dialog-close {
    position: absolute;
    top: 12px;
    right: 12px;
  }
  
  .driver-dialog-tags-grid {
    flex-direction: column;
    align-items: stretch;
  }
  
  .driver-dialog-tag-card {
    min-width: unset;
  }
}

@media (max-width: 575px) {
  .driver-chart-title {
    flex: 1 1 100%;
  }
  
  .driver-chart-controls {
    flex: 1 1 100%;
    justify-content: flex-end;
  }
  
  .driver-chart-title h6 {
    font-size: 0.8125rem;
  }
  
  .driver-tag {
    padding: 3px 8px;
    font-size: 10px;
    gap: 6px;
  }
}

/* ===== ANIMATIONS ===== */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.driver-chart-wrapper {
  animation: fadeIn 0.4s ease-out;
}

.driver-stat-badge {
  animation: fadeIn 0.3s ease-out backwards;
}

.driver-stat-badge:nth-child(1) { animation-delay: 0.1s; }
.driver-stat-badge:nth-child(2) { animation-delay: 0.15s; }

.driver-tag {
  animation: fadeIn 0.3s ease-out backwards;
}

.driver-tag:nth-child(1) { animation-delay: 0.05s; }
.driver-tag:nth-child(2) { animation-delay: 0.1s; }
.driver-tag:nth-child(3) { animation-delay: 0.15s; }
.driver-tag:nth-child(4) { animation-delay: 0.2s; }
.driver-tag:nth-child(5) { animation-delay: 0.25s; }
.driver-tag:nth-child(6) { animation-delay: 0.3s; }

.driver-dialog-stat {
  animation: fadeIn 0.3s ease-out backwards;
}

.driver-dialog-stat:nth-child(1) { animation-delay: 0.05s; }
.driver-dialog-stat:nth-child(2) { animation-delay: 0.1s; }
.driver-dialog-stat:nth-child(3) { animation-delay: 0.15s; }
.driver-dialog-stat:nth-child(4) { animation-delay: 0.2s; }

.driver-dialog-tag-card {
  animation: fadeIn 0.4s ease-out backwards;
}

.driver-dialog-tag-card:nth-child(1) { animation-delay: 0.1s; }
.driver-dialog-tag-card:nth-child(2) { animation-delay: 0.15s; }
.driver-dialog-tag-card:nth-child(3) { animation-delay: 0.2s; }
.driver-dialog-tag-card:nth-child(4) { animation-delay: 0.25s; }
.driver-dialog-tag-card:nth-child(5) { animation-delay: 0.3s; }
.driver-dialog-tag-card:nth-child(6) { animation-delay: 0.35s; }
`;

export default memo(DriverEfficiencyRadar);