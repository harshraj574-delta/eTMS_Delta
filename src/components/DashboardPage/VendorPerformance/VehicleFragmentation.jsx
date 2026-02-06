import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { apiService } from "../../../services/api.js";
import { BiExpand } from "react-icons/bi";
import { PiCarProfileLight } from "react-icons/pi";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import EChartsBase, { ANIMATION_CONFIG } from "../EChartsBase";

const VehicleFragmentation = ({ filter = {} }) => {
  const [vehicleData, setVehicleData] = useState([]);
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

        let data = await apiService.getchart_VehFrag(params);

        if (typeof data === "string") {
          try {
            data = JSON.parse(data);
          } catch (parseErr) {
            throw new Error("Invalid JSON returned from API");
          }
        }

        if (!Array.isArray(data))
          throw new Error("API did not return an array");

        const mapped = data.map((item) => ({
          name: item.Vehicletype,
          value: Number(item.totalroute) || 0,
          routePer:
            item.routePer !== undefined ? Number(item.routePer) : undefined,
        }));

        if (mapped.length === 0) throw new Error("No data available");

        if (mounted) {
          setVehicleData(mapped);
          setRetryCount(0);
          setError(null);
        }
      } catch (err) {
        console.error("VehicleFragmentation fetch error:", err);
        setError(err.message || String(err));

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying VehicleFragmentation... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          if (mounted) setVehicleData([]);
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
    if (!vehicleData || vehicleData.length === 0) {
      return { totalTypes: 0, totalRoutes: 0, maxRoutes: 0, minRoutes: 0 };
    }
    const values = vehicleData.map((d) => d.value);
    return {
      totalTypes: vehicleData.length,
      totalRoutes: values.reduce((a, b) => a + b, 0),
      maxRoutes: Math.max(...values),
      minRoutes: Math.min(...values),
    };
  }, [vehicleData]);

  // Color palette for radar
  const radarColor = "#3b82f6";

  // Generate ECharts option for radar chart
  const getChartOption = useCallback(
    (isFullscreen = false) => {
      if (!vehicleData || vehicleData.length === 0) return null;

      const maxValue = Math.max(100, ...vehicleData.map((d) => d.value));
      const indicators = vehicleData.map((d) => ({
        name: d.name,
        max: maxValue,
      }));
      const values = vehicleData.map((d) => d.value);

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
            let result = `<div style="font-weight: 700; margin-bottom: 10px; color: #1e293b; font-size: 14px;">Vehicle Distribution</div>`;
            vehicleData.forEach((item, idx) => {
              const percent =
                item.routePer !== undefined ? ` (${item.routePer}%)` : "";
              const marker = `<span style="display:inline-block;margin-right:8px;border-radius:4px;width:10px;height:10px;background:${radarColor};box-shadow: 0 2px 4px rgba(59, 130, 246, 0.4);"></span>`;
              result += `<div style="margin: 8px 0; display: flex; align-items: center; justify-content: space-between; gap: 24px;">
                <span style="display: flex; align-items: center;">${marker}<span style="color: #64748b;">${item.name}</span></span>
                <strong style="color: #1e293b; font-size: 14px;">${params.value[idx]} routes${percent}</strong>
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
            fontSize: isFullscreen ? 13 : 10,
            fontWeight: 500,
          },
          splitArea: {
            areaStyle: {
              color: [
                "rgba(59, 130, 246, 0.02)",
                "rgba(59, 130, 246, 0.04)",
                "rgba(59, 130, 246, 0.06)",
                "rgba(59, 130, 246, 0.08)",
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
            name: "Vehicle Types",
            type: "radar",
            data: [
              {
                value: values,
                name: "Routes by Vehicle",
                symbol: "circle",
                symbolSize: isFullscreen ? 10 : 6,
                lineStyle: {
                  color: radarColor,
                  width: isFullscreen ? 3 : 2,
                  shadowColor: "rgba(59, 130, 246, 0.3)",
                  shadowBlur: 8,
                },
                itemStyle: {
                  color: radarColor,
                  borderColor: "#fff",
                  borderWidth: 2,
                  shadowColor: "rgba(59, 130, 246, 0.5)",
                  shadowBlur: 6,
                },
                areaStyle: {
                  color: {
                    type: "radial",
                    x: 0.5,
                    y: 0.5,
                    r: 0.5,
                    colorStops: [
                      { offset: 0, color: "rgba(59, 130, 246, 0.4)" },
                      { offset: 1, color: "rgba(59, 130, 246, 0.1)" },
                    ],
                  },
                },
              },
            ],
          },
        ],
      };
    },
    [vehicleData]
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
        <style>{vehicleFragStyles}</style>
        <div className="vf-chart-wrapper">
          <div className="vf-chart-header">
            <div className="vf-chart-title">
              <div className="vf-chart-icon">
                <PiCarProfileLight />
              </div>
              <h6>Vehicle Fragmentation</h6>
            </div>
          </div>
          <div className="vf-error">
            <div className="vf-error-content">
              <div className="vf-error-icon">
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
              <button className="vf-retry-btn" onClick={handleRetry}>
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
      <style>{vehicleFragStyles}</style>

      <div className="vf-chart-wrapper">
        {/* Loading Overlay */}
        <div className={`vf-overlay ${showOverlay ? "visible" : ""}`}>
          <div className="vf-loader">
            <div className="vf-spinner" />
            <span className="vf-loader-text">Loading chart data...</span>
          </div>
        </div>

        {/* Header */}
        <div className="vf-chart-header">
          <div className="vf-chart-title">
            <div className="vf-chart-icon">
              <PiCarProfileLight />
            </div>
            <h6>Vehicle Fragmentation</h6>
          </div>
          <div className="vf-chart-controls">
            {vehicleData.length > 0 && (
              <div className="vf-stats-badges">
                <div className="vf-stat-badge total">
                  <span className="badge-label">Total:</span>
                  <span className="badge-value">
                    {stats.totalRoutes.toLocaleString()}
                  </span>
                </div>
                <div className="vf-stat-badge types">
                  <span className="badge-label">Types:</span>
                  <span className="badge-value">{stats.totalTypes}</span>
                </div>
              </div>
            )}
            <Tooltip
              target="#expand-vehicle-frag"
              content="Expand Chart"
              position="top"
            />
            <button
              id="expand-vehicle-frag"
              className="vf-icon-btn"
              onClick={handleDialogShow}
              aria-label="Expand chart to fullscreen"
            >
              <BiExpand />
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="vf-chart-container">
          {!loading && chartOption && (
            <EChartsBase
              option={chartOption}
              height="100%"
              loading={loading}
              style={{ minHeight: "240px" }}
            />
          )}
          {!loading && !chartOption && !error && (
            <div className="vf-empty-state">
              <div className="vf-empty-icon">
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
              <p>Try adjusting your filters to see vehicle data</p>
            </div>
          )}
        </div>

        {/* Stats Tags */}
        {!loading && vehicleData.length > 0 && (
          <div className="vf-tags-container">
            {vehicleData.map((d, i) => (
              <div key={i} className="vf-tag">
                <span className="vf-tag-color" />
                <span className="tag-label">{d.name}</span>
                <span className="tag-separator">—</span>
                <span className="tag-value">
                  {Number(d.value || 0).toLocaleString()} routes
                </span>
                {d.routePer !== undefined && (
                  <>
                    <span className="tag-separator">—</span>
                    <span className="tag-percent">{d.routePer}%</span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Legend Bar */}
        {vehicleData.length > 0 && !loading && (
          <div className="vf-legend-bar">
            <div className="vf-legend-item">
              <span
                className="vf-legend-dot"
                style={{ background: radarColor }}
              />
              <span>Routes by Vehicle Type</span>
            </div>
            <div className="vf-legend-info">
              {stats.totalTypes} types • {stats.totalRoutes.toLocaleString()}{" "}
              total routes
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
        className="vf-fullscreen-dialog"
        style={{ width: "92vw", maxWidth: "1000px" }}
        contentStyle={{ padding: 0, overflow: "hidden" }}
        modal
        draggable={false}
        resizable={false}
      >
        <div className="vf-dialog-wrapper">
          {/* Dialog Header */}
          <div className="vf-dialog-header">
            <div className="vf-dialog-title">
              <div className="vf-chart-icon large">
                <PiCarProfileLight />
              </div>
              <div>
                <h5>Vehicle Fragmentation</h5>
                <p>Distribution of routes across vehicle types</p>
              </div>
            </div>
            <div className="vf-dialog-controls">
              {vehicleData.length > 0 && (
                <div className="vf-dialog-stats">
                  <div className="vf-dialog-stat">
                    <span className="stat-label">Types</span>
                    <span className="stat-value">{stats.totalTypes}</span>
                  </div>
                  <div className="vf-dialog-stat">
                    <span className="stat-label">Total Routes</span>
                    <span className="stat-value total">
                      {stats.totalRoutes.toLocaleString()}
                    </span>
                  </div>
                  <div className="vf-dialog-stat">
                    <span className="stat-label">Max Routes</span>
                    <span className="stat-value max">
                      {stats.maxRoutes.toLocaleString()}
                    </span>
                  </div>
                  <div className="vf-dialog-stat">
                    <span className="stat-label">Min Routes</span>
                    <span className="stat-value min">
                      {stats.minRoutes.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              <button
                className="vf-dialog-close"
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
          <div className="vf-dialog-chart">
            {fullscreenChartOption && (
              <EChartsBase
                option={fullscreenChartOption}
                height="calc(70vh - 180px)"
                loading={loading}
              />
            )}

            {/* Dialog Tags Grid */}
            <div className="vf-dialog-tags-grid">
              {vehicleData.map((d, i) => (
                <div key={i} className="vf-dialog-tag-card">
                  <div className="tag-icon">
                    <PiCarProfileLight />
                  </div>
                  <div className="tag-content">
                    <span className="tag-number">
                      {Number(d.value || 0).toLocaleString()}
                    </span>
                    <span className="tag-name">{d.name}</span>
                    {d.routePer !== undefined && (
                      <span className="tag-percent">{d.routePer}%</span>
                    )}
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
const vehicleFragStyles = `
/* ===== VEHICLE FRAGMENTATION CHART STYLES ===== */
.vf-chart-wrapper {
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
.vf-overlay {
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

.vf-overlay.visible {
  opacity: 1;
  visibility: visible;
}

.vf-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.vf-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: vfSpin 0.8s linear infinite;
}

@keyframes vfSpin {
  to { transform: rotate(360deg); }
}

.vf-loader-text {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

/* Header */
.vf-chart-header {
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

.vf-chart-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.vf-chart-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 10px;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  flex-shrink: 0;
}

.vf-chart-icon svg {
  width: 18px;
  height: 18px;
}

.vf-chart-icon.large {
  width: 44px;
  height: 44px;
}

.vf-chart-icon.large svg {
  width: 22px;
  height: 22px;
}

.vf-chart-title h6 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.vf-chart-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* Stats Badges - Horizontal Layout */
.vf-stats-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.vf-stat-badge {
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

.vf-stat-badge .badge-label {
  color: inherit;
  opacity: 0.8;
}

.vf-stat-badge .badge-value {
  font-weight: 700;
}

.vf-stat-badge.total {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
}

.vf-stat-badge.types {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

/* Icon Button */
.vf-icon-btn {
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

.vf-icon-btn:hover {
  background: #f8fafc;
  border-color: #3b82f6;
  color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.vf-icon-btn:active {
  transform: scale(0.95);
}

.vf-icon-btn svg {
  width: 18px;
  height: 18px;
}

/* Chart Container */
.vf-chart-container {
  flex: 1;
  min-height: 0;
  padding: 8px 12px;
  position: relative;
}

/* Tags Container */
.vf-tags-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px 12px;
}

.vf-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #bfdbfe;
  border-radius: 20px;
  font-size: 12px;
  transition: all 0.2s ease;
}

.vf-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.vf-tag-color {
  width: 8px;
  height: 8px;
  background: #3b82f6;
  border-radius: 2px;
  flex-shrink: 0;
}

.vf-tag .tag-label {
  color: #64748b;
  font-weight: 500;
}

.vf-tag .tag-separator {
  color: #cbd5e1;
}

.vf-tag .tag-value {
  color: #2563eb;
  font-weight: 700;
}

.vf-tag .tag-percent {
  color: #059669;
  font-weight: 600;
}

/* Empty State */
.vf-empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
}

.vf-empty-icon {
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

.vf-empty-icon svg {
  width: 32px;
  height: 32px;
}

.vf-empty-state h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #334155;
}

.vf-empty-state p {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
}

/* Legend Bar */
.vf-legend-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 10px 16px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.vf-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.vf-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.vf-legend-info {
  font-size: 11px;
  color: #94a3b8;
  padding-left: 12px;
  border-left: 1px solid #e2e8f0;
}

/* Error State */
.vf-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.vf-error-content {
  text-align: center;
  padding: 32px;
}

.vf-error-icon {
  color: #ef4444;
  margin-bottom: 16px;
}

.vf-error-content h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #991b1b;
}

.vf-error-content p {
  margin: 0 0 20px;
  font-size: 13px;
  color: #b91c1c;
}

.vf-retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.vf-retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

/* ===== FULLSCREEN DIALOG ===== */
.vf-fullscreen-dialog .p-dialog-header {
  display: none !important;
}

.vf-fullscreen-dialog .p-dialog-content {
  border-radius: 16px !important;
  padding: 0 !important;
}

.vf-dialog-wrapper {
  display: flex;
  flex-direction: column;
  height: 80vh;
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

/* Dialog Header */
.vf-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-bottom: 1px solid #bfdbfe;
  flex-shrink: 0;
  gap: 16px;
}

.vf-dialog-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.vf-dialog-title h5 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
}

.vf-dialog-title p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.vf-dialog-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Dialog Stats */
.vf-dialog-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.vf-dialog-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 14px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  min-width: 80px;
}

.vf-dialog-stat .stat-label {
  font-size: 10px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.vf-dialog-stat .stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.vf-dialog-stat .stat-value.total {
  color: #2563eb;
}

.vf-dialog-stat .stat-value.max {
  color: #059669;
}

.vf-dialog-stat .stat-value.min {
  color: #f59e0b;
}

/* Dialog Close Button */
.vf-dialog-close {
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

.vf-dialog-close:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #ef4444;
}

/* Dialog Chart */
.vf-dialog-chart {
  flex: 1;
  padding: 16px 24px 24px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* Dialog Tags Grid */
.vf-dialog-tags-grid {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 20px 0;
  margin-top: auto;
}

.vf-dialog-tag-card {
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

.vf-dialog-tag-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: #bfdbfe;
}

.vf-dialog-tag-card .tag-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 10px;
  color: #3b82f6;
  flex-shrink: 0;
}

.vf-dialog-tag-card .tag-icon svg {
  width: 20px;
  height: 20px;
}

.vf-dialog-tag-card .tag-content {
  display: flex;
  flex-direction: column;
}

.vf-dialog-tag-card .tag-number {
  font-size: 20px;
  font-weight: 700;
  color: #2563eb;
  line-height: 1;
}

.vf-dialog-tag-card .tag-name {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  margin-top: 4px;
}

.vf-dialog-tag-card .tag-percent {
  font-size: 11px;
  font-weight: 600;
  color: #059669;
  margin-top: 2px;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 991px) {
  .vf-stats-badges {
    display: none;
  }
  
  .vf-dialog-stats {
    display: none;
  }
  
  .vf-dialog-tags-grid {
    gap: 12px;
  }
  
  .vf-dialog-tag-card {
    padding: 12px 16px;
    min-width: 140px;
  }
}

@media (max-width: 767px) {
  .vf-chart-header {
    padding: 12px 14px;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .vf-chart-title h6 {
    font-size: 0.875rem;
  }
  
  .vf-chart-icon {
    width: 32px;
    height: 32px;
  }
  
  .vf-chart-icon svg {
    width: 16px;
    height: 16px;
  }
  
  .vf-tags-container {
    gap: 6px;
    padding: 6px 12px 10px;
  }
  
  .vf-tag {
    padding: 4px 10px;
    font-size: 11px;
  }
  
  .vf-legend-bar {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .vf-legend-info {
    flex: 0 0 100%;
    text-align: center;
    padding: 8px 0 0;
    border-left: none;
    border-top: 1px solid #e2e8f0;
  }
  
  .vf-dialog-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .vf-dialog-controls {
    width: 100%;
    justify-content: flex-end;
  }
  
  .vf-dialog-close {
    position: absolute;
    top: 12px;
    right: 12px;
  }
  
  .vf-dialog-tags-grid {
    flex-direction: column;
    align-items: stretch;
  }
  
  .vf-dialog-tag-card {
    min-width: unset;
  }
}

@media (max-width: 575px) {
  .vf-chart-title {
    flex: 1 1 100%;
  }
  
  .vf-chart-controls {
    flex: 1 1 100%;
    justify-content: flex-end;
  }
  
  .vf-chart-title h6 {
    font-size: 0.8125rem;
  }
  
  .vf-tag {
    padding: 3px 8px;
    font-size: 10px;
    gap: 4px;
  }
}

/* ===== ANIMATIONS ===== */
@keyframes vfFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.vf-chart-wrapper {
  animation: vfFadeIn 0.4s ease-out;
}

.vf-stat-badge {
  animation: vfFadeIn 0.3s ease-out backwards;
}

.vf-stat-badge:nth-child(1) { animation-delay: 0.1s; }
.vf-stat-badge:nth-child(2) { animation-delay: 0.15s; }

.vf-tag {
  animation: vfFadeIn 0.3s ease-out backwards;
}

.vf-tag:nth-child(1) { animation-delay: 0.05s; }
.vf-tag:nth-child(2) { animation-delay: 0.1s; }
.vf-tag:nth-child(3) { animation-delay: 0.15s; }
.vf-tag:nth-child(4) { animation-delay: 0.2s; }
.vf-tag:nth-child(5) { animation-delay: 0.25s; }

.vf-dialog-stat {
  animation: vfFadeIn 0.3s ease-out backwards;
}

.vf-dialog-stat:nth-child(1) { animation-delay: 0.05s; }
.vf-dialog-stat:nth-child(2) { animation-delay: 0.1s; }
.vf-dialog-stat:nth-child(3) { animation-delay: 0.15s; }
.vf-dialog-stat:nth-child(4) { animation-delay: 0.2s; }

.vf-dialog-tag-card {
  animation: vfFadeIn 0.4s ease-out backwards;
}

.vf-dialog-tag-card:nth-child(1) { animation-delay: 0.1s; }
.vf-dialog-tag-card:nth-child(2) { animation-delay: 0.15s; }
.vf-dialog-tag-card:nth-child(3) { animation-delay: 0.2s; }
.vf-dialog-tag-card:nth-child(4) { animation-delay: 0.25s; }
.vf-dialog-tag-card:nth-child(5) { animation-delay: 0.3s; }
`;

export default memo(VehicleFragmentation);