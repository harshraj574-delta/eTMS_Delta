import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import { apiService } from "../../../services/api";
import { BiExpand, BiTachometer } from "react-icons/bi";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import EChartsBase, { ANIMATION_CONFIG } from "../EChartsBase";

const FleetEfficiency = ({ filter = {} }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([
    { name: "Operational", value: 0, color: "#6366f1" },
    { name: "Not Deployed", value: 0, color: "#f59e0b" },
    { name: "Breakdown", value: 0, color: "#ef4444" },
  ]);
  const [effPercent, setEffPercent] = useState(null);
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

    const load = async () => {
      if (!isTransitioning) {
        setLoading(true);
      }
      setError(null);

      try {
        const res = await requestWithTimeout(
          apiService.getchart_Efficiency({
            sDate: sDate || null,
            eDate: eDate || null,
            locationid: locationid || null,
            facilityid: facilityid || null,
            vendorid: vendorid || null,
            triptype: triptype || null,
          }),
          8000
        );

        let payload = res?.data ?? res;
        if (typeof payload === "string") {
          try {
            payload = JSON.parse(payload);
          } catch (_) {}
        }

        const obj = Array.isArray(payload) ? payload[0] : payload || {};

        const operational = Number(
          obj.OperationalVehicle ?? obj.deployedcount ?? 0
        );
        const notDeployed = Number(
          obj.NotDeployedcount ?? obj.NotDeployedCount ?? 0
        );
        const breakdown = Number(obj.Breakdowncount ?? 0);
        const vehicleEffPer = obj.VehicleEffPer ?? obj.vehicleEffPer ?? null;

        if (mounted) {
          setChartData([
            { name: "Operational", value: operational, color: "#6366f1" },
            { name: "Not Deployed", value: notDeployed, color: "#f59e0b" },
            { name: "Breakdown", value: breakdown, color: "#ef4444" },
          ]);
          setEffPercent(vehicleEffPer != null ? Number(vehicleEffPer) : null);
          setRetryCount(0);
          setError(null);
        }
      } catch (err) {
        console.error("FleetEfficiency fetch error:", err);
        setError(err?.message || "Failed to load data");

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying FleetEfficiency... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          if (mounted) {
            setChartData([
              { name: "Operational", value: 0, color: "#6366f1" },
              { name: "Not Deployed", value: 0, color: "#f59e0b" },
              { name: "Breakdown", value: 0, color: "#ef4444" },
            ]);
            setEffPercent(null);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setIsTransitioning(false);
        }
      }
    };

    load();
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

  // Calculate totals
  const totals = useMemo(() => {
    return {
      total: chartData.reduce((a, b) => a + b.value, 0),
      operational: chartData.find((d) => d.name === "Operational")?.value || 0,
      notDeployed: chartData.find((d) => d.name === "Not Deployed")?.value || 0,
      breakdown: chartData.find((d) => d.name === "Breakdown")?.value || 0,
    };
  }, [chartData]);

  // Generate ECharts option for gauge chart
  const getChartOption = useCallback(
    (isFullscreen = false) => {
      const percent = effPercent ?? 0;

      return {
        ...ANIMATION_CONFIG,
        series: [
          {
            type: "gauge",
            startAngle: 180,
            endAngle: 0,
            min: 0,
            max: 100,
            radius: isFullscreen ? "90%" : "100%",
            center: ["50%", isFullscreen ? "65%" : "70%"],
            splitNumber: 5,
            axisLine: {
              lineStyle: {
                width: isFullscreen ? 30 : 20,
                color: [
                  [0.25, "#ef4444"],
                  [0.5, "#f59e0b"],
                  [0.75, "#10b981"],
                  [1, "#6366f1"],
                ],
              },
            },
            pointer: {
              icon: "path://M12.8,0.7l12,40.1H0.7L12.8,0.7z",
              length: "60%",
              width: isFullscreen ? 14 : 10,
              offsetCenter: [0, "-5%"],
              itemStyle: {
                color: "#374151",
              },
            },
            axisTick: {
              length: isFullscreen ? 12 : 8,
              lineStyle: {
                color: "auto",
                width: 2,
              },
            },
            splitLine: {
              length: isFullscreen ? 20 : 15,
              lineStyle: {
                color: "auto",
                width: 3,
              },
            },
            axisLabel: {
              color: "#6b7280",
              fontSize: isFullscreen ? 14 : 11,
              distance: isFullscreen ? -55 : -40,
              formatter: (value) => `${value}`,
            },
            title: {
              offsetCenter: [0, "20%"],
              fontSize: isFullscreen ? 16 : 14,
              color: "#6b7280",
            },
            detail: {
              fontSize: isFullscreen ? 40 : 28,
              offsetCenter: [0, "40%"],
              valueAnimation: true,
              formatter: (value) => `${value.toFixed(1)}%`,
              color: "#1f2937",
              fontWeight: "bold",
            },
            data: [
              {
                value: percent,
                name: "Fleet Efficiency",
              },
            ],
          },
        ],
      };
    },
    [effPercent]
  );

  const chartOption = useMemo(() => getChartOption(false), [getChartOption]);
  const fullscreenChartOption = useMemo(
    () => getChartOption(true),
    [getChartOption]
  );

  const showOverlay = loading || isTransitioning;

  // Get efficiency status
  const getEfficiencyStatus = useCallback(() => {
    const percent = effPercent ?? 0;
    if (percent >= 75) return { label: "Excellent", color: "#6366f1" };
    if (percent >= 50) return { label: "Good", color: "#10b981" };
    if (percent >= 25) return { label: "Fair", color: "#f59e0b" };
    return { label: "Poor", color: "#ef4444" };
  }, [effPercent]);

  const efficiencyStatus = getEfficiencyStatus();

  // Error state
  if (error && retryCount >= maxRetries) {
    return (
      <>
        <style>{fleetEfficiencyStyles}</style>
        <div className="fleet-chart-wrapper">
          <div className="fleet-chart-header">
            <div className="fleet-chart-title">
              <div className="fleet-chart-icon">
                <BiTachometer />
              </div>
              <h6>Fleet Efficiency</h6>
            </div>
          </div>
          <div className="fleet-error">
            <div className="fleet-error-content">
              <div className="fleet-error-icon">
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
              <button className="fleet-retry-btn" onClick={handleRetry}>
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
      <style>{fleetEfficiencyStyles}</style>

      <div className="fleet-chart-wrapper">
        {/* Loading Overlay */}
        <div className={`fleet-overlay ${showOverlay ? "visible" : ""}`}>
          <div className="fleet-loader">
            <div className="fleet-spinner" />
            <span className="fleet-loader-text">Loading chart data...</span>
          </div>
        </div>

        {/* Header */}
        <div className="fleet-chart-header">
          <div className="fleet-chart-title">
            <div className="fleet-chart-icon">
              <BiTachometer />
            </div>
            <h6>Fleet Efficiency</h6>
          </div>
          <div className="fleet-chart-controls">
            {effPercent !== null && (
              <div className="fleet-efficiency-badge">
                <span
                  className="efficiency-indicator"
                  style={{ background: efficiencyStatus.color }}
                />
                <span className="efficiency-value">
                  {effPercent.toFixed(1)}%
                </span>
                <span className="efficiency-label">
                  {efficiencyStatus.label}
                </span>
              </div>
            )}
            <Tooltip
              target="#expand-fleet"
              content="Expand Chart"
              position="top"
            />
            <button
              id="expand-fleet"
              className="fleet-icon-btn"
              onClick={handleDialogShow}
              aria-label="Expand chart to fullscreen"
            >
              <BiExpand />
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="fleet-chart-container">
          {!loading && chartOption && (
            <EChartsBase
              option={chartOption}
              height="200px"
              loading={loading}
            />
          )}
          {!loading && !chartOption && !error && (
            <div className="fleet-empty-state">
              <div className="fleet-empty-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h4>No Data Available</h4>
              <p>Try adjusting your filters to see efficiency data</p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {!loading && (
          <div className="fleet-stats-grid">
            {chartData.map((item, index) => (
              <div key={index} className="fleet-stat-card">
                <div
                  className="fleet-stat-value"
                  style={{ background: item.color }}
                >
                  {item.value}
                </div>
                <span className="fleet-stat-label">{item.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Legend Bar */}
        {!loading && (
          <div className="fleet-legend-bar">
            <div className="fleet-legend-item">
              <span
                className="fleet-legend-dot"
                style={{ background: "#6366f1" }}
              />
              <span>Operational</span>
            </div>
            <div className="fleet-legend-item">
              <span
                className="fleet-legend-dot"
                style={{ background: "#f59e0b" }}
              />
              <span>Not Deployed</span>
            </div>
            <div className="fleet-legend-item">
              <span
                className="fleet-legend-dot"
                style={{ background: "#ef4444" }}
              />
              <span>Breakdown</span>
            </div>
            <div className="fleet-legend-info">
              {totals.total} total vehicles
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
        className="fleet-fullscreen-dialog"
        style={{ width: "92vw", maxWidth: "900px" }}
        contentStyle={{ padding: 0, overflow: "hidden" }}
        modal
        draggable={false}
        resizable={false}
      >
        <div className="fleet-dialog-wrapper">
          {/* Dialog Header */}
          <div className="fleet-dialog-header">
            <div className="fleet-dialog-title">
              <div className="fleet-chart-icon large">
                <BiTachometer />
              </div>
              <div>
                <h5>Fleet Efficiency</h5>
                <p>Vehicle deployment and operational status overview</p>
              </div>
            </div>
            <div className="fleet-dialog-controls">
              <div className="fleet-dialog-stats">
                <div className="fleet-dialog-stat">
                  <span className="stat-label">Operational</span>
                  <span className="stat-value operational">
                    {totals.operational}
                  </span>
                </div>
                <div className="fleet-dialog-stat">
                  <span className="stat-label">Not Deployed</span>
                  <span className="stat-value notdeployed">
                    {totals.notDeployed}
                  </span>
                </div>
                <div className="fleet-dialog-stat">
                  <span className="stat-label">Breakdown</span>
                  <span className="stat-value breakdown">
                    {totals.breakdown}
                  </span>
                </div>
                <div className="fleet-dialog-stat highlight">
                  <span className="stat-label">Efficiency</span>
                  <span
                    className="stat-value"
                    style={{ color: efficiencyStatus.color }}
                  >
                    {effPercent?.toFixed(1) ?? 0}%
                  </span>
                </div>
              </div>
              <button
                className="fleet-dialog-close"
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
          <div className="fleet-dialog-chart">
            {fullscreenChartOption && (
              <EChartsBase
                option={fullscreenChartOption}
                height="calc(70vh - 140px)"
                loading={loading}
              />
            )}

            {/* Dialog Stats Cards */}
            <div className="fleet-dialog-stats-grid">
              {chartData.map((item, index) => (
                <div key={index} className="fleet-dialog-stat-card">
                  <div
                    className="stat-icon"
                    style={{ background: `${item.color}20`, color: item.color }}
                  >
                    {item.name === "Operational" && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    )}
                    {item.name === "Not Deployed" && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    )}
                    {item.name === "Breakdown" && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                    )}
                  </div>
                  <div className="stat-content">
                    <span className="stat-number" style={{ color: item.color }}>
                      {item.value}
                    </span>
                    <span className="stat-name">{item.name}</span>
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
const fleetEfficiencyStyles = `
/* ===== FLEET EFFICIENCY CHART STYLES ===== */
.fleet-chart-wrapper {
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
.fleet-overlay {
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

.fleet-overlay.visible {
  opacity: 1;
  visibility: visible;
}

.fleet-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.fleet-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: fleetSpin 0.8s linear infinite;
}

@keyframes fleetSpin {
  to { transform: rotate(360deg); }
}

.fleet-loader-text {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

/* Header */
.fleet-chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
  background: white;
  flex-shrink: 0;
  min-height: 56px;
}

.fleet-chart-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.fleet-chart-icon {
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

.fleet-chart-icon svg {
  width: 18px;
  height: 18px;
}

.fleet-chart-icon.large {
  width: 44px;
  height: 44px;
}

.fleet-chart-icon.large svg {
  width: 22px;
  height: 22px;
}

.fleet-chart-title h6 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.01em;
}

.fleet-chart-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Efficiency Badge */
.fleet-efficiency-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}

.fleet-efficiency-badge .efficiency-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.fleet-efficiency-badge .efficiency-value {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.fleet-efficiency-badge .efficiency-label {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* Icon Button */
.fleet-icon-btn {
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

.fleet-icon-btn:hover {
  background: #f8fafc;
  border-color: #6366f1;
  color: #6366f1;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.fleet-icon-btn:active {
  transform: scale(0.95);
}

.fleet-icon-btn svg {
  width: 18px;
  height: 18px;
}

/* Chart Container */
.fleet-chart-container {
  flex: 1;
  min-height: 0;
  padding: 8px 12px 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Stats Grid */
.fleet-stats-grid {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 12px 16px;
}

.fleet-stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.fleet-stat-value {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: white;
  font-weight: 700;
  font-size: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease;
}

.fleet-stat-card:hover .fleet-stat-value {
  transform: translateY(-2px);
}

.fleet-stat-label {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
  text-align: center;
}

/* Empty State */
.fleet-empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
}

.fleet-empty-icon {
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

.fleet-empty-icon svg {
  width: 32px;
  height: 32px;
}

.fleet-empty-state h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #334155;
}

.fleet-empty-state p {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
}

/* Legend Bar */
.fleet-legend-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 10px 16px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.fleet-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
}

.fleet-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.fleet-legend-info {
  font-size: 11px;
  color: #94a3b8;
  padding-left: 12px;
  border-left: 1px solid #e2e8f0;
}

/* Error State */
.fleet-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.fleet-error-content {
  text-align: center;
  padding: 32px;
}

.fleet-error-icon {
  color: #ef4444;
  margin-bottom: 16px;
}

.fleet-error-content h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #991b1b;
}

.fleet-error-content p {
  margin: 0 0 20px;
  font-size: 13px;
  color: #b91c1c;
}

.fleet-retry-btn {
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

.fleet-retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

/* ===== FULLSCREEN DIALOG ===== */
.fleet-fullscreen-dialog .p-dialog-header {
  display: none !important;
}

.fleet-fullscreen-dialog .p-dialog-content {
  border-radius: 16px !important;
  padding: 0 !important;
}

.fleet-dialog-wrapper {
  display: flex;
  flex-direction: column;
  height: 80vh;
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

/* Dialog Header */
.fleet-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border-bottom: 1px solid #c7d2fe;
  flex-shrink: 0;
}

.fleet-dialog-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.fleet-dialog-title h5 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
}

.fleet-dialog-title p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.fleet-dialog-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Dialog Stats */
.fleet-dialog-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.fleet-dialog-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 14px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  min-width: 80px;
}

.fleet-dialog-stat.highlight {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-color: #c7d2fe;
}

.fleet-dialog-stat .stat-label {
  font-size: 10px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.fleet-dialog-stat .stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.fleet-dialog-stat .stat-value.operational {
  color: #6366f1;
}

.fleet-dialog-stat .stat-value.notdeployed {
  color: #f59e0b;
}

.fleet-dialog-stat .stat-value.breakdown {
  color: #ef4444;
}

/* Dialog Close Button */
.fleet-dialog-close {
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

.fleet-dialog-close:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #ef4444;
}

/* Dialog Chart */
.fleet-dialog-chart {
  flex: 1;
  padding: 16px 24px 24px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* Dialog Stats Grid */
.fleet-dialog-stats-grid {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 20px 0;
  margin-top: auto;
}

.fleet-dialog-stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.fleet-dialog-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.fleet-dialog-stat-card .stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.fleet-dialog-stat-card .stat-icon svg {
  width: 24px;
  height: 24px;
}

.fleet-dialog-stat-card .stat-content {
  display: flex;
  flex-direction: column;
}

.fleet-dialog-stat-card .stat-number {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.fleet-dialog-stat-card .stat-name {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  margin-top: 4px;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 991px) {
  .fleet-efficiency-badge {
    display: none;
  }
  
  .fleet-dialog-stats {
    display: none;
  }
  
  .fleet-dialog-stats-grid {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .fleet-dialog-stat-card {
    padding: 12px 16px;
  }
}

@media (max-width: 767px) {
  .fleet-chart-header {
    padding: 12px 14px;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .fleet-chart-title h6 {
    font-size: 0.875rem;
  }
  
  .fleet-chart-icon {
    width: 32px;
    height: 32px;
  }
  
  .fleet-chart-icon svg {
    width: 16px;
    height: 16px;
  }
  
  .fleet-stats-grid {
    gap: 12px;
    padding: 10px 12px;
  }
  
  .fleet-stat-value {
    width: 38px;
    height: 38px;
    font-size: 13px;
  }
  
  .fleet-legend-bar {
    gap: 10px;
    padding: 8px 12px;
  }
  
  .fleet-legend-info {
    flex: 0 0 100%;
    text-align: center;
    padding: 8px 0 0;
    border-left: none;
    border-top: 1px solid #e2e8f0;
  }
  
  .fleet-dialog-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .fleet-dialog-controls {
    width: 100%;
    justify-content: flex-end;
  }
  
  .fleet-dialog-close {
    position: absolute;
    top: 12px;
    right: 12px;
  }
  
  .fleet-dialog-stats-grid {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 575px) {
  .fleet-chart-title {
    flex: 1 1 100%;
  }
  
  .fleet-chart-controls {
    flex: 1 1 100%;
    justify-content: flex-end;
  }
  
  .fleet-stats-grid {
    gap: 8px;
  }
  
  .fleet-stat-value {
    width: 36px;
    height: 36px;
    font-size: 12px;
    border-radius: 8px;
  }
  
  .fleet-stat-label {
    font-size: 10px;
  }
}

/* ===== ANIMATIONS ===== */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.fleet-chart-wrapper {
  animation: fadeIn 0.4s ease-out;
}

.fleet-stat-card {
  animation: fadeIn 0.3s ease-out backwards;
}

.fleet-stat-card:nth-child(1) { animation-delay: 0.1s; }
.fleet-stat-card:nth-child(2) { animation-delay: 0.15s; }
.fleet-stat-card:nth-child(3) { animation-delay: 0.2s; }

.fleet-dialog-stat {
  animation: fadeIn 0.3s ease-out backwards;
}

.fleet-dialog-stat:nth-child(1) { animation-delay: 0.05s; }
.fleet-dialog-stat:nth-child(2) { animation-delay: 0.1s; }
.fleet-dialog-stat:nth-child(3) { animation-delay: 0.15s; }
.fleet-dialog-stat:nth-child(4) { animation-delay: 0.2s; }

.fleet-dialog-stat-card {
  animation: fadeIn 0.4s ease-out backwards;
}

.fleet-dialog-stat-card:nth-child(1) { animation-delay: 0.1s; }
.fleet-dialog-stat-card:nth-child(2) { animation-delay: 0.15s; }
.fleet-dialog-stat-card:nth-child(3) { animation-delay: 0.2s; }
`;

export default memo(FleetEfficiency);