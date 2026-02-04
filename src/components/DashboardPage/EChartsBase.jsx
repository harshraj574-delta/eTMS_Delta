import React, { useRef, useEffect, useCallback, memo } from "react";
import * as echarts from "echarts";

/**
 * Reusable ECharts wrapper component with auto-resize, loading states, and theme support.
 * 
 * @param {Object} option - ECharts option configuration object
 * @param {string} height - Chart height (default: "400px")
 * @param {boolean} loading - Show loading spinner
 * @param {boolean} notMerge - Don't merge with previous option (default: true)
 * @param {Function} onChartReady - Callback when chart instance is ready
 * @param {string} theme - ECharts theme name (default: null for default theme)
 * @param {Object} style - Additional inline styles
 * @param {string} className - Additional CSS classes
 */
const EChartsBase = memo(({
  option,
  height = "400px",
  loading = false,
  notMerge = true,
  onChartReady,
  theme = null,
  style = {},
  className = "",
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Initialize chart
  const initChart = useCallback(() => {
    if (!chartRef.current) return;

    // Dispose existing instance
    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    // Create new instance
    chartInstance.current = echarts.init(chartRef.current, theme, {
      renderer: "canvas",
    });

    // Notify parent if callback provided
    if (onChartReady) {
      onChartReady(chartInstance.current);
    }
  }, [theme, onChartReady]);

  // Handle resize
  const handleResize = useCallback(() => {
    if (chartInstance.current) {
      chartInstance.current.resize({
        animation: {
          duration: 300,
          easing: "cubicOut",
        },
      });
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initChart();

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [initChart, handleResize]);

  // Update chart options
  useEffect(() => {
    if (chartInstance.current && option) {
      chartInstance.current.setOption(option, notMerge);
    }
  }, [option, notMerge]);

  // Handle loading state
  useEffect(() => {
    if (chartInstance.current) {
      if (loading) {
        chartInstance.current.showLoading("default", {
          text: "Loading...",
          color: "#6366f1",
          textColor: "#333",
          maskColor: "rgba(255, 255, 255, 0.8)",
          zlevel: 0,
          fontSize: 14,
          showSpinner: true,
          spinnerRadius: 12,
          lineWidth: 3,
        });
      } else {
        chartInstance.current.hideLoading();
      }
    }
  }, [loading]);

  // Re-initialize on theme change
  useEffect(() => {
    if (chartRef.current && chartInstance.current) {
      const currentOption = chartInstance.current.getOption();
      chartInstance.current.dispose();
      chartInstance.current = echarts.init(chartRef.current, theme, {
        renderer: "canvas",
      });
      if (currentOption && option) {
        chartInstance.current.setOption(option, notMerge);
      }
    }
  }, [theme]);

  return (
    <div
      ref={chartRef}
      className={`echarts-container ${className}`}
      style={{
        width: "100%",
        height,
        minHeight: "200px",
        ...style,
      }}
    />
  );
});

EChartsBase.displayName = "EChartsBase";

// Common ECharts color palettes for consistent styling across dashboard
export const CHART_COLORS = {
  primary: ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"],
  success: ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0"],
  warning: ["#f59e0b", "#fbbf24", "#fcd34d", "#fde68a"],
  danger: ["#ef4444", "#f87171", "#fca5a5", "#fecaca"],
  info: ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"],
  
  // Extended palette for multi-series charts
  extended: [
    "#6366f1", // indigo
    "#ec4899", // pink
    "#14b8a6", // teal
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#06b6d4", // cyan
    "#f97316", // orange
    "#84cc16", // lime
    "#ef4444", // red
    "#3b82f6", // blue
  ],

  // Gradient generators
  gradients: {
    primary: (chart) => new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: "rgba(99, 102, 241, 0.4)" },
      { offset: 1, color: "rgba(99, 102, 241, 0.05)" },
    ]),
    pink: (chart) => new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: "rgba(236, 72, 153, 0.4)" },
      { offset: 1, color: "rgba(236, 72, 153, 0.05)" },
    ]),
    teal: (chart) => new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: "rgba(20, 184, 166, 0.4)" },
      { offset: 1, color: "rgba(20, 184, 166, 0.05)" },
    ]),
  },
};

// Common tooltip configuration
export const TOOLTIP_CONFIG = {
  trigger: "axis",
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  borderColor: "#e5e7eb",
  borderWidth: 1,
  textStyle: {
    color: "#374151",
    fontSize: 13,
  },
  padding: [10, 14],
  extraCssText: "box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); border-radius: 8px;",
  axisPointer: {
    type: "shadow",
    shadowStyle: {
      color: "rgba(99, 102, 241, 0.08)",
    },
  },
};

// Common legend configuration
export const LEGEND_CONFIG = {
  bottom: 0,
  left: "center",
  icon: "circle",
  itemWidth: 10,
  itemHeight: 10,
  itemGap: 20,
  textStyle: {
    color: "#6b7280",
    fontSize: 12,
    padding: [0, 0, 0, 4],
  },
};

// Common grid configuration
export const GRID_CONFIG = {
  top: 50,
  right: 20,
  bottom: 60,
  left: 50,
  containLabel: true,
};

// Common axis configurations
export const X_AXIS_CONFIG = {
  type: "category",
  axisLine: {
    lineStyle: {
      color: "#e5e7eb",
    },
  },
  axisTick: {
    show: false,
  },
  axisLabel: {
    color: "#6b7280",
    fontSize: 11,
  },
};

export const Y_AXIS_CONFIG = {
  type: "value",
  axisLine: {
    show: false,
  },
  axisTick: {
    show: false,
  },
  axisLabel: {
    color: "#6b7280",
    fontSize: 11,
  },
  splitLine: {
    lineStyle: {
      color: "#f3f4f6",
      type: "dashed",
    },
  },
};

// Animation configuration
export const ANIMATION_CONFIG = {
  animation: true,
  animationDuration: 800,
  animationEasing: "cubicOut",
  animationDelay: (idx) => idx * 50,
};

export default EChartsBase;
