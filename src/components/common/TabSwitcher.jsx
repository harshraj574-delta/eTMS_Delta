import React from "react";
import PropTypes from "prop-types";
import "./TabSwitcher.css";

const TabSwitcher = ({
  tabs,
  activeTab,
  onTabChange,
  className = "",
  size = "medium",
  variant = "contained",
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case "outlined":
        return "tab-switcher-outlined";
      case "minimal":
        return "tab-switcher-minimal";
      default:
        return "";
    }
  };

  return (
    <div className={`tab-switcher-container ${className}`}>
      <div
        className={`tab-switcher tab-switcher-${size} ${getVariantClass()}`}
        role="tablist"
        aria-label="Tab navigation"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              className={`tab-item ${isActive ? "active" : ""}`}
              onClick={() => onTabChange(tab.value)}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.value}`}
              tabIndex={isActive ? 0 : -1}
            >
              <span className="tab-label">{tab.label}</span>
              {tab.count !== undefined && (
                <span className="tab-count">{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

TabSwitcher.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      count: PropTypes.number,
    })
  ).isRequired,
  activeTab: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  onTabChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  size: PropTypes.oneOf(["small", "medium", "large"]),
  variant: PropTypes.oneOf(["contained", "outlined", "minimal"]),
};

export default TabSwitcher;