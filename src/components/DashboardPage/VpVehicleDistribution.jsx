// VpVehicleDistribution.jsx
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { apiService } from "../../services/api";
import { BiExpand } from "react-icons/bi";
import { MdDirectionsCar } from "react-icons/md";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import React from "react";
import * as echarts from "echarts";
import EChartsBase, { ANIMATION_CONFIG } from "./EChartsBase";

const VpVehicleDistribution = ({ filter }) => {
  const [data, setData] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
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

        if (vehicleTypeData.length === 0 && billingTypeData.length === 0) {
          setData(null);
          setRetryCount(0);
          return;
        }

        const totalVehicles = vehicleTypeData.reduce(
          (sum, item) => sum + item.value,
          0
        );
        const totalBilling = billingTypeData.reduce(
          (sum, item) => sum + item.value,
          0
        );

        setData({
          vehicleTypeData,
          billingTypeData,
          totalVehicles,
          totalBilling,
          vehicleTypeCount: vehicleTypeData.length,
          billingTypeCount: billingTypeData.length,
        });
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
      } finally {
        setLoading(false);
        setIsTransitioning(false);
      }
    };

    fetchData();
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

  // Generate ECharts option for nested donut chart
  const getChartOption = useCallback(
    (isFullscreen = false) => {
      if (!data) return null;

      const { vehicleTypeData, billingTypeData } = data;

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
            const percent = params.percent ? params.percent.toFixed(1) : "0";
            return `
              <div style="font-weight: 700; margin-bottom: 10px; color: #1e293b; font-size: 14px;">${params.seriesName}</div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${params.color};box-shadow: 0 2px 4px ${params.color}40;"></span>
                <span style="color: #64748b;">${params.name}:</span>
                <strong style="color: #1e293b; font-size: 14px;">${params.value.toLocaleString()}</strong>
                <span style="color: #94a3b8; font-size: 12px;">(${percent}%)</span>
              </div>
            `;
          },
        },
        legend: {
          type: "scroll",
          orient: "horizontal",
          bottom: isFullscreen ? 20 : 10,
          left: "center",
          icon: "circle",
          itemWidth: 10,
          itemHeight: 10,
          itemGap: isFullscreen ? 20 : 15,
          textStyle: {
            color: "#64748b",
            fontSize: isFullscreen ? 12 : 11,
            fontWeight: 500,
          },
          pageIconColor: "#6366f1",
          pageIconInactiveColor: "#cbd5e1",
          pageTextStyle: {
            color: "#64748b",
          },
          data: [
            ...vehicleTypeData.map((item) => item.name),
            ...billingTypeData.map((item) => item.name),
          ],
        },
        series: [
          {
            name: "Vehicle Type",
            type: "pie",
            radius: isFullscreen ? ["45%", "65%"] : ["50%", "70%"],
            center: ["50%", isFullscreen ? "42%" : "45%"],
            avoidLabelOverlap: true,
            label: {
              show: true,
              position: "outside",
              formatter: "{b}: {c}",
              fontSize: isFullscreen ? 12 : 11,
              color: "#374151",
              fontWeight: 500,
            },
            labelLine: {
              show: true,
              length: isFullscreen ? 15 : 10,
              length2: isFullscreen ? 12 : 8,
              lineStyle: {
                color: "#cbd5e1",
              },
            },
            emphasis: {
              label: {
                show: true,
                fontSize: isFullscreen ? 14 : 13,
                fontWeight: "bold",
              },
              itemStyle: {
                shadowBlur: 20,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.25)",
              },
              scale: true,
              scaleSize: 10,
            },
            data: vehicleTypeData.map((item) => ({
              value: item.value,
              name: item.name,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: item.color },
                  {
                    offset: 1,
                    color: adjustColor(item.color, -20),
                  },
                ]),
              },
            })),
          },
          {
            name: "Billing Type",
            type: "pie",
            radius: isFullscreen ? ["18%", "35%"] : ["20%", "40%"],
            center: ["50%", isFullscreen ? "42%" : "45%"],
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
                fontSize: isFullscreen ? 13 : 12,
                fontWeight: "bold",
                position: "center",
              },
              itemStyle: {
                shadowBlur: 15,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.2)",
              },
            },
            data: billingTypeData.map((item) => ({
              value: item.value,
              name: item.name,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: item.color },
                  {
                    offset: 1,
                    color: adjustColor(item.color, -20),
                  },
                ]),
              },
            })),
          },
        ],
      };
    },
    [data]
  );

  // Helper function to adjust color brightness
  function adjustColor(color, amount) {
    const hex = color.replace("#", "");
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }

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
        <style>{vehicleDistStyles}</style>
        <div className="vehicledist-chart-wrapper">
          <div className="vehicledist-chart-header">
            <div className="vehicledist-chart-title">
              <div className="vehicledist-chart-icon">
                <MdDirectionsCar />
              </div>
              <h6>Vehicle Distribution</h6>
            </div>
          </div>
          <div className="vehicledist-error">
            <div className="vehicledist-error-content">
              <div className="vehicledist-error-icon">
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
              <button className="vehicledist-retry-btn" onClick={handleRetry}>
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
      <style>{vehicleDistStyles}</style>

      <div className="vehicledist-chart-wrapper">
        {/* Loading Overlay */}
        <div className={`vehicledist-overlay ${showOverlay ? "visible" : ""}`}>
          <div className="vehicledist-loader">
            <div className="vehicledist-spinner" />
            <span className="vehicledist-loader-text">
              Loading chart data...
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="vehicledist-chart-header">
          <div className="vehicledist-chart-title">
            <div className="vehicledist-chart-icon">
              <MdDirectionsCar />
            </div>
            <h6>Vehicle Distribution</h6>
          </div>
          <div className="vehicledist-chart-controls">
            {data && (
              <div className="vehicledist-stats-badges">
                <div className="vehicledist-stat-badge vehicle">
                  <span className="badge-dot" />
                  <span>
                    Types: {data.vehicleTypeCount} (
                    {data.totalVehicles.toLocaleString()})
                  </span>
                </div>
                <div className="vehicledist-stat-badge billing">
                  <span className="badge-dot" />
                  <span>Billing: {data.billingTypeCount}</span>
                </div>
              </div>
            )}
            <Tooltip
              target="#expand-vehicledist"
              content="Expand Chart"
              position="top"
            />
            <button
              id="expand-vehicledist"
              className="vehicledist-icon-btn"
              onClick={handleDialogShow}
              aria-label="Expand chart to fullscreen"
            >
              <BiExpand />
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="vehicledist-chart-container">
          {!loading && chartOption && (
            <EChartsBase
              option={chartOption}
              height="100%"
              loading={loading}
              style={{ minHeight: "280px" }}
            />
          )}
          {!loading && !chartOption && !error && (
            <div className="vehicledist-empty-state">
              <div className="vehicledist-empty-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
              </div>
              <h4>No Data Available</h4>
              <p>Try adjusting your filters to see vehicle data</p>
            </div>
          )}
        </div>

        {/* Legend Info */}
        {data && !loading && (
          <div className="vehicledist-legend-bar">
            <div className="vehicledist-legend-section">
              <span className="vehicledist-legend-label">Outer Ring:</span>
              <span>Vehicle Types</span>
            </div>
            <div className="vehicledist-legend-divider" />
            <div className="vehicledist-legend-section">
              <span className="vehicledist-legend-label">Inner Ring:</span>
              <span>Billing Types</span>
            </div>
            <div className="vehicledist-legend-info">
              {data.totalVehicles.toLocaleString()} total vehicles
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
        className="vehicledist-fullscreen-dialog"
        style={{ width: "92vw", maxWidth: "1400px" }}
        contentStyle={{ padding: 0, overflow: "hidden" }}
        modal
        draggable={false}
        resizable={false}
      >
        <div className="vehicledist-dialog-wrapper">
          {/* Dialog Header */}
          <div className="vehicledist-dialog-header">
            <div className="vehicledist-dialog-title">
              <div className="vehicledist-chart-icon large">
                <MdDirectionsCar />
              </div>
              <div>
                <h5>Vehicle Distribution</h5>
                <p>Distribution by vehicle type and billing type</p>
              </div>
            </div>
            <div className="vehicledist-dialog-controls">
              {data && (
                <div className="vehicledist-dialog-stats">
                  <div className="vehicledist-dialog-stat">
                    <span className="stat-label">Vehicle Types</span>
                    <span className="stat-value vehicle">
                      {data.vehicleTypeCount}
                    </span>
                  </div>
                  <div className="vehicledist-dialog-stat">
                    <span className="stat-label">Billing Types</span>
                    <span className="stat-value billing">
                      {data.billingTypeCount}
                    </span>
                  </div>
                  <div className="vehicledist-dialog-stat">
                    <span className="stat-label">Total Vehicles</span>
                    <span className="stat-value">
                      {data.totalVehicles.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              <button
                className="vehicledist-dialog-close"
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
          <div className="vehicledist-dialog-chart">
            {fullscreenChartOption && (
              <EChartsBase
                option={fullscreenChartOption}
                height="calc(80vh - 140px)"
                loading={loading}
              />
            )}
          </div>

          {/* Dialog Legend */}
          <div className="vehicledist-dialog-legend">
            <div className="vehicledist-dialog-legend-item">
              <div className="legend-ring outer" />
              <span>Outer Ring: Vehicle Types</span>
            </div>
            <div className="vehicledist-dialog-legend-item">
              <div className="legend-ring inner" />
              <span>Inner Ring: Billing Types</span>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
};

// Component Styles
const vehicleDistStyles = `
/* ===== VEHICLEDIST CHART STYLES ===== */
.vehicledist-chart-wrapper {
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
.vehicledist-overlay {
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

.vehicledist-overlay.visible {
  opacity: 1;
  visibility: visible;
}

.vehicledist-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.vehicledist-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: vehicledistSpin 0.8s linear infinite;
}

@keyframes vehicledistSpin {
  to { transform: rotate(360deg); }
}

.vehicledist-loader-text {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

/* Header */
.vehicledist-chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
  background: white;
  flex-shrink: 0;
  min-height: 56px;
}

.vehicledist-chart-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.vehicledist-chart-icon {
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

.vehicledist-chart-icon svg {
  width: 18px;
  height: 18px;
}

.vehicledist-chart-icon.large {
  width: 44px;
  height: 44px;
}

.vehicledist-chart-icon.large svg {
  width: 22px;
  height: 22px;
}

.vehicledist-chart-title h6 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.01em;
}

.vehicledist-chart-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Stats Badges */
.vehicledist-stats-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.vehicledist-stat-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.vehicledist-stat-badge .badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.vehicledist-stat-badge.vehicle {
  background: rgba(99, 102, 241, 0.1);
  color: #4f46e5;
}

.vehicledist-stat-badge.vehicle .badge-dot {
  background: #6366f1;
}

.vehicledist-stat-badge.billing {
  background: rgba(236, 72, 153, 0.1);
  color: #db2777;
}

.vehicledist-stat-badge.billing .badge-dot {
  background: #ec4899;
}

/* Icon Button */
.vehicledist-icon-btn {
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

.vehicledist-icon-btn:hover {
  background: #f8fafc;
  border-color: #6366f1;
  color: #6366f1;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.vehicledist-icon-btn:active {
  transform: scale(0.95);
}

.vehicledist-icon-btn svg {
  width: 18px;
  height: 18px;
}

/* Chart Container */
.vehicledist-chart-container {
  flex: 1;
  min-height: 0;
  padding: 8px 12px;
  position: relative;
}

/* Empty State */
.vehicledist-empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
}

.vehicledist-empty-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border-radius: 16px;
  margin-bottom: 16px;
  color: #6366f1;
}

.vehicledist-empty-icon svg {
  width: 32px;
  height: 32px;
}

.vehicledist-empty-state h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #334155;
}

.vehicledist-empty-state p {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
}

/* Legend Bar */
.vehicledist-legend-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 10px 16px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.vehicledist-legend-section {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}

.vehicledist-legend-label {
  font-weight: 600;
  color: #475569;
}

.vehicledist-legend-divider {
  width: 1px;
  height: 16px;
  background: #e2e8f0;
}

.vehicledist-legend-info {
  font-size: 11px;
  color: #94a3b8;
  padding-left: 12px;
  border-left: 1px solid #e2e8f0;
}

/* Error State */
.vehicledist-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.vehicledist-error-content {
  text-align: center;
  padding: 32px;
}

.vehicledist-error-icon {
  color: #ef4444;
  margin-bottom: 16px;
}

.vehicledist-error-content h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #991b1b;
}

.vehicledist-error-content p {
  margin: 0 0 20px;
  font-size: 13px;
  color: #b91c1c;
}

.vehicledist-retry-btn {
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

.vehicledist-retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

/* ===== FULLSCREEN DIALOG ===== */
.vehicledist-fullscreen-dialog .p-dialog-header {
  display: none !important;
}

.vehicledist-fullscreen-dialog .p-dialog-content {
  border-radius: 16px !important;
  padding: 0 !important;
}

.vehicledist-dialog-wrapper {
  display: flex;
  flex-direction: column;
  height: 80vh;
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

/* Dialog Header */
.vehicledist-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border-bottom: 1px solid #c7d2fe;
  flex-shrink: 0;
}

.vehicledist-dialog-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.vehicledist-dialog-title h5 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
}

.vehicledist-dialog-title p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.vehicledist-dialog-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Dialog Stats */
.vehicledist-dialog-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.vehicledist-dialog-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  min-width: 100px;
}

.vehicledist-dialog-stat .stat-label {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.vehicledist-dialog-stat .stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.vehicledist-dialog-stat .stat-value.vehicle {
  color: #4f46e5;
}

.vehicledist-dialog-stat .stat-value.billing {
  color: #db2777;
}

/* Dialog Close Button */
.vehicledist-dialog-close {
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

.vehicledist-dialog-close:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #ef4444;
}

/* Dialog Chart */
.vehicledist-dialog-chart {
  flex: 1;
  padding: 16px 24px;
  min-height: 0;
}

/* Dialog Legend */
.vehicledist-dialog-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 16px 24px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.vehicledist-dialog-legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

.legend-ring {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  position: relative;
}

.legend-ring.outer {
  background: conic-gradient(
    #6366f1 0deg 90deg,
    #ec4899 90deg 180deg,
    #14b8a6 180deg 270deg,
    #f59e0b 270deg 360deg
  );
}

.legend-ring.outer::after {
  content: '';
  position: absolute;
  inset: 6px;
  background: white;
  border-radius: 50%;
}

.legend-ring.inner {
  width: 20px;
  height: 20px;
  background: conic-gradient(
    #8b5cf6 0deg 120deg,
    #06b6d4 120deg 240deg,
    #f97316 240deg 360deg
  );
}

.legend-ring.inner::after {
  content: '';
  position: absolute;
  inset: 5px;
  background: white;
  border-radius: 50%;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 991px) {
  .vehicledist-stats-badges {
    display: none;
  }
  
  .vehicledist-dialog-stats {
    display: none;
  }
}

@media (max-width: 767px) {
  .vehicledist-chart-header {
    padding: 12px 14px;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .vehicledist-chart-title h6 {
    font-size: 0.875rem;
  }
  
  .vehicledist-chart-icon {
    width: 32px;
    height: 32px;
  }
  
  .vehicledist-chart-icon svg {
    width: 16px;
    height: 16px;
  }
  
  .vehicledist-legend-bar {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .vehicledist-legend-info {
    flex: 0 0 100%;
    text-align: center;
    padding: 8px 0 0;
    border-left: none;
    border-top: 1px solid #e2e8f0;
  }
  
  .vehicledist-dialog-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .vehicledist-dialog-controls {
    width: 100%;
    justify-content: flex-end;
  }
  
  .vehicledist-dialog-close {
    position: absolute;
    top: 12px;
    right: 12px;
  }
  
  .vehicledist-dialog-legend {
    flex-direction: column;
    gap: 12px;
  }
}

@media (max-width: 575px) {
  .vehicledist-chart-title {
    flex: 1 1 100%;
  }
  
  .vehicledist-chart-controls {
    flex: 1 1 100%;
    justify-content: flex-end;
  }
  
  .vehicledist-legend-section {
    flex-direction: column;
    gap: 2px;
  }
  
  .vehicledist-legend-divider {
    width: 40px;
    height: 1px;
  }
}

/* ===== ANIMATIONS ===== */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.vehicledist-chart-wrapper {
  animation: fadeIn 0.4s ease-out;
}

.vehicledist-stat-badge {
  animation: fadeIn 0.3s ease-out backwards;
}

.vehicledist-stat-badge:nth-child(1) { animation-delay: 0.1s; }
.vehicledist-stat-badge:nth-child(2) { animation-delay: 0.15s; }

.vehicledist-dialog-stat {
  animation: fadeIn 0.3s ease-out backwards;
}

.vehicledist-dialog-stat:nth-child(1) { animation-delay: 0.05s; }
.vehicledist-dialog-stat:nth-child(2) { animation-delay: 0.1s; }
.vehicledist-dialog-stat:nth-child(3) { animation-delay: 0.15s; }

.vehicledist-dialog-legend-item {
  animation: fadeIn 0.3s ease-out backwards;
}

.vehicledist-dialog-legend-item:nth-child(1) { animation-delay: 0.2s; }
.vehicledist-dialog-legend-item:nth-child(2) { animation-delay: 0.25s; }
`;

export default memo(VpVehicleDistribution);