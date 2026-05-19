import React, { useState, useRef, useEffect, useCallback } from "react";
import { Dropdown } from "primereact/dropdown";
import { BiCalendar, BiFilter, BiX } from "react-icons/bi";

import RiStats from "./DashboardPage/RiStats";
import RiShiftEmployeeOccupancy from "./DashboardPage/RiShiftEmployeeOccupancy";
import RiNormalAdhoc from "./DashboardPage/RiNormalAdhoc";
import RiShiftCompletionPending from "./DashboardPage/RiShiftCompletionPending";
import RiPickDrop from "./DashboardPage/RiPickDrop";
import RiDropSafeChart from "./DashboardPage/RiDropSafeChart";
import VpStats from "./DashboardPage/VpStats";
import VpVehicleDistribution from "./DashboardPage/VpVehicleDistribution";
import FleetEfficiency from "./DashboardPage/VendorPerformance/FleetEfficiency";
import DriverEfficiency from "./DashboardPage/VendorPerformance/DriverEfficiency";
import RouteBreakDuty from "./DashboardPage/VendorPerformance/RouteBreakDuty";
import VehicleFragmentation from "./DashboardPage/VendorPerformance/VehicleFragmentation";
import DriverFragmentation from "./DashboardPage/VendorPerformance/DriverFragmentation";
import LeafletHeatMap from "./DashboardPage/LeafletHeatMap";

const TABS = [
  { label: "Routing Insights" },
  { label: "Vendor Performance" },
  { label: "Facility Insights" },
];

const GOOGLE_MAP_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d28069.195720471515!2d77.01584120702411!3d28.42983216765682!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d190d4d1ab7f9%3A0x9edd43ec9fba1ce9!2sAccenture%20DDC7x!5e0!3m2!1sen!2sin!4v1748521289659!5m2!1sen!2sin";

/* Simple white card wrapper. No overflow:hidden so chart tooltips aren't clipped.
   display:flex + flex-direction:column so cardx-body { flex:1 } fills the space. */
const ChartCard = ({ children, minHeight = 320 }) => (
  <div
    style={{
      background: "white",
      borderRadius: "14px",
      border: "1px solid var(--slate-200, #e2e8f0)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      marginBottom: "12px",
      minHeight,
      display: "flex",
      flexDirection: "column",
    }}
  >
    {children}
  </div>
);

const DashboardMobile = ({
  filter,
  activeIndex,
  onTabChange,
  cities,
  selCity,
  onCityChange,
  facilities,
  selFacility,
  onFacilityChange,
  venders,
  selVendor,
  onVendorChange,
  tripTypeOptions,
  selectedTripType,
  onTripTypeChange,
  periodOptions,
  selectedPeriod,
  pendingPeriod,
  setPendingPeriod,
  pendingDateFrom,
  pendingDateTo,
  onDateFromChange,
  onDateToChange,
  onCalendarApply,
  type,
  mapTypeOptions,
  onMapTypeChange,
}) => {
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const sheetRef = useRef(null);

  const activeFilterCount = [
    selectedPeriod !== "last_7_days",
    selCity?.Id && selCity?.Id !== "all",
    selFacility && selFacility !== "allFacility",
    selectedTripType !== "",
    selVendor?.Id && selVendor?.Id !== "all",
  ].filter(Boolean).length;

  const openSheet = useCallback(() => setFilterSheetOpen(true), []);
  const closeSheet = useCallback(() => setFilterSheetOpen(false), []);

  const handleApply = useCallback(() => {
    onCalendarApply();
    setFilterSheetOpen(false);
  }, [onCalendarApply]);

  const toDateInputValue = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const y = d.getFullYear();
    const mo = (d.getMonth() + 1).toString().padStart(2, "0");
    const dd = d.getDate().toString().padStart(2, "0");
    return `${y}-${mo}-${dd}`;
  };

  const parseDateInput = (val) => {
    if (!val) return null;
    const [y, m, d] = val.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  useEffect(() => {
    document.body.style.overflow = filterSheetOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [filterSheetOpen]);

  return (
    <>
      <style>{`
        .dmb-topbar {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .dmb-date-pill {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 6px;
          background: white;
          border: 1px solid var(--slate-200, #e2e8f0);
          border-radius: 100px;
          padding: 9px 14px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--slate-700, #334155);
          cursor: pointer;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          white-space: nowrap;
          min-width: 0;
        }
        .dmb-date-pill svg { flex-shrink: 0; color: var(--primary-500, #6366f1); font-size: 16px; }
        .dmb-date-pill span { overflow: hidden; text-overflow: ellipsis; }
        .dmb-filter-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--primary-500, #6366f1);
          border: none;
          border-radius: 100px;
          padding: 9px 16px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: white;
          cursor: pointer;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(99,102,241,0.35);
          position: relative;
        }
        .dmb-filter-btn svg { font-size: 16px; }
        .dmb-badge {
          position: absolute;
          top: -5px; right: -5px;
          background: #ef4444;
          color: white;
          border-radius: 100px;
          font-size: 0.6rem;
          font-weight: 700;
          min-width: 17px; height: 17px;
          display: flex; align-items: center; justify-content: center;
          padding: 0 4px;
          border: 2px solid white;
        }
        .dmb-tabs {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 4px;
          margin-bottom: 14px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .dmb-tabs::-webkit-scrollbar { display: none; }
        .dmb-tab {
          flex-shrink: 0;
          padding: 7px 18px;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          border: 1.5px solid var(--slate-200, #e2e8f0);
          background: white;
          color: var(--slate-600, #475569);
          transition: all 0.16s ease;
          white-space: nowrap;
        }
        .dmb-tab.active {
          background: var(--primary-500, #6366f1);
          border-color: var(--primary-500, #6366f1);
          color: white;
          box-shadow: 0 3px 10px rgba(99,102,241,0.3);
        }
        .dmb-map-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid var(--slate-100, #f1f5f9);
          flex-shrink: 0;
        }
        .dmb-map-card-header strong {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--slate-800, #1e293b);
        }
        .dmb-map-controls .p-dropdown {
          height: 32px !important;
          border-radius: 8px !important;
          min-width: 110px !important;
          border: 1px solid var(--slate-200, #e2e8f0) !important;
        }
        .dmb-map-controls .p-dropdown .p-dropdown-label {
          font-size: 0.75rem !important;
          padding: 6px 8px !important;
        }
        .dmb-map-body {
          height: 280px;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        /* Bottom Sheet */
        .dmb-backdrop {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.5);
          z-index: 9000;
          animation: dmbBdIn 0.2s ease-out;
        }
        @keyframes dmbBdIn { from{opacity:0} to{opacity:1} }
        .dmb-sheet {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background: white;
          border-radius: 20px 20px 0 0;
          z-index: 9001;
          max-height: 88vh;
          display: flex;
          flex-direction: column;
          animation: dmbShUp 0.28s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes dmbShUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        .dmb-handle {
          width: 36px; height: 4px;
          background: var(--slate-300, #cbd5e1);
          border-radius: 100px;
          margin: 10px auto 0;
          flex-shrink: 0;
        }
        .dmb-sheet-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 20px 10px;
          border-bottom: 1px solid var(--slate-100, #f1f5f9);
          flex-shrink: 0;
        }
        .dmb-sheet-head h6 { margin:0; font-size:1rem; font-weight:700; color:var(--slate-800,#1e293b); }
        .dmb-sheet-close {
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--slate-100, #f1f5f9);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--slate-600, #475569); font-size: 18px;
        }
        .dmb-sheet-body {
          flex: 1; overflow-y: auto; padding: 16px 20px;
          -webkit-overflow-scrolling: touch;
        }
        .dmb-group { margin-bottom: 18px; }
        .dmb-group-label {
          display: block;
          font-size: 0.68rem; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--slate-500, #64748b);
          margin-bottom: 8px;
        }
        .dmb-period-pills { display: flex; flex-wrap: wrap; gap: 6px; }
        .dmb-period-pill {
          padding: 6px 13px; border-radius: 100px;
          font-size: 0.78rem; font-weight: 500; cursor: pointer;
          border: 1.5px solid var(--slate-200, #e2e8f0);
          background: white; color: var(--slate-600, #475569);
          transition: all 0.14s;
        }
        .dmb-period-pill.active {
          background: var(--primary-50, #eef2ff);
          border-color: var(--primary-500, #6366f1);
          color: var(--primary-700, #4338ca);
          font-weight: 600;
        }
        .dmb-custom-dates {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 10px; margin-top: 10px;
        }
        .dmb-custom-dates label {
          font-size: 0.7rem; font-weight: 600;
          color: var(--slate-500, #64748b);
          display: block; margin-bottom: 4px;
        }
        .dmb-custom-dates input[type="date"] {
          width: 100%; padding: 9px 10px;
          border: 1.5px solid var(--slate-200, #e2e8f0);
          border-radius: 10px; font-size: 0.8rem;
          color: var(--slate-700, #334155); background: white; outline: none;
        }
        .dmb-custom-dates input[type="date"]:focus {
          border-color: var(--primary-500, #6366f1);
          box-shadow: 0 0 0 3px var(--primary-100, #e0e7ff);
        }
        .dmb-dd-wrap .p-dropdown {
          width: 100% !important; height: 42px !important;
          border-radius: 10px !important;
          border: 1.5px solid var(--slate-200, #e2e8f0) !important;
        }
        .dmb-dd-wrap .p-dropdown:hover { border-color: var(--slate-300, #cbd5e1) !important; }
        .dmb-dd-wrap .p-dropdown.p-focus {
          border-color: var(--primary-500, #6366f1) !important;
          box-shadow: 0 0 0 3px var(--primary-100, #e0e7ff) !important;
        }
        .dmb-dd-wrap .p-dropdown .p-dropdown-label {
          padding: 0.55rem 0.75rem !important; font-size: 0.8125rem !important; font-weight: 500 !important;
        }
        .dmb-sheet-footer {
          display: flex; gap: 10px;
          padding: 14px 20px;
          border-top: 1px solid var(--slate-100, #f1f5f9);
          flex-shrink: 0;
          padding-bottom: max(14px, env(safe-area-inset-bottom));
        }
        .dmb-btn-cancel {
          flex: 1; padding: 13px;
          border: 1.5px solid var(--slate-300, #cbd5e1);
          border-radius: 12px; background: white;
          font-size: 0.875rem; font-weight: 600;
          color: var(--slate-600, #475569); cursor: pointer;
        }
        .dmb-btn-apply {
          flex: 2; padding: 13px; border: none; border-radius: 12px;
          background: linear-gradient(135deg, var(--primary-500,#6366f1) 0%, var(--primary-600,#4f46e5) 100%);
          font-size: 0.875rem; font-weight: 600; color: white; cursor: pointer;
          box-shadow: 0 3px 12px rgba(99,102,241,0.35);
        }
      `}</style>

      {/* Top bar: date pill + filter button */}
      <div className="dmb-topbar">
        <div className="dmb-date-pill" onClick={openSheet}>
          <BiCalendar />
          <span>
            {periodOptions.find((o) => o.value === selectedPeriod)?.label || "Custom"}
          </span>
        </div>
        <button className="dmb-filter-btn" onClick={openSheet}>
          <BiFilter />
          Filters
          {activeFilterCount > 0 && (
            <span className="dmb-badge">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* Horizontally scrollable tab pills */}
      <div className="dmb-tabs">
        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            className={`dmb-tab${activeIndex === i ? " active" : ""}`}
            onClick={() => onTabChange({ index: i })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content — only render when filter is ready */}
      {filter && (
        <>
          {activeIndex === 0 && (
            <>
              <RiStats filter={filter} />

              {/* Map card — custom header, no ChartCard title prop */}
              <ChartCard minHeight={328}>
                <div className="dmb-map-card-header">
                  <strong>{type === 2 ? "Routes" : "Employees"} Density</strong>
                  <div className="dmb-map-controls">
                    <Dropdown
                      value={type}
                      options={mapTypeOptions}
                      onChange={onMapTypeChange}
                      optionLabel="label"
                      optionValue="value"
                    />
                  </div>
                </div>
                <div className="dmb-map-body">
                  <LeafletHeatMap filter={filter} type={type} />
                </div>
              </ChartCard>

              <ChartCard minHeight={340}>
                <RiShiftEmployeeOccupancy filter={filter} />
              </ChartCard>

              <ChartCard minHeight={320}>
                <RiPickDrop filter={filter} />
              </ChartCard>

              <ChartCard minHeight={300}>
                <RiShiftCompletionPending filter={filter} />
              </ChartCard>

              <ChartCard minHeight={300}>
                <RiNormalAdhoc filter={filter} />
              </ChartCard>

              <ChartCard minHeight={300}>
                <RiDropSafeChart filter={filter} />
              </ChartCard>
            </>
          )}

          {activeIndex === 1 && (
            <>
              <VpStats filter={filter} />

              <ChartCard minHeight={300}>
                <VpVehicleDistribution filter={filter} />
              </ChartCard>

              <ChartCard minHeight={300}>
                <RouteBreakDuty filter={filter} />
              </ChartCard>

              <ChartCard minHeight={300}>
                <FleetEfficiency filter={filter} />
              </ChartCard>

              <ChartCard minHeight={300}>
                <DriverEfficiency filter={filter} />
              </ChartCard>

              <ChartCard minHeight={300}>
                <VehicleFragmentation filter={filter} />
              </ChartCard>

              <ChartCard minHeight={300}>
                <DriverFragmentation filter={filter} />
              </ChartCard>
            </>
          )}

          {activeIndex === 2 && (
            <ChartCard minHeight={420}>
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--slate-100, #f1f5f9)",
                  flexShrink: 0,
                }}
              >
                <strong
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "var(--slate-800, #1e293b)",
                  }}
                >
                  Facility Location
                </strong>
              </div>
              <div style={{ flex: 1, minHeight: 360, overflow: "hidden" }}>
                <iframe
                  title="Google Map"
                  src={GOOGLE_MAP_SRC}
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: "block", minHeight: 360 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </ChartCard>
          )}
        </>
      )}

      {/* Filter bottom sheet */}
      {filterSheetOpen && (
        <>
          <div className="dmb-backdrop" onClick={closeSheet} />
          <div className="dmb-sheet" ref={sheetRef}>
            <div className="dmb-handle" />
            <div className="dmb-sheet-head">
              <h6>Filters</h6>
              <button className="dmb-sheet-close" onClick={closeSheet}>
                <BiX />
              </button>
            </div>

            <div className="dmb-sheet-body">
              {/* Date Range */}
              <div className="dmb-group">
                <span className="dmb-group-label">Date Range</span>
                <div className="dmb-period-pills">
                  {periodOptions.map(({ label, value }) => (
                    <button
                      key={value}
                      className={`dmb-period-pill${pendingPeriod === value ? " active" : ""}`}
                      onClick={() => setPendingPeriod(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {pendingPeriod === "custom" && (
                  <div className="dmb-custom-dates">
                    <div>
                      <label>From</label>
                      <input
                        type="date"
                        value={toDateInputValue(pendingDateFrom)}
                        onChange={(e) => onDateFromChange(parseDateInput(e.target.value))}
                      />
                    </div>
                    <div>
                      <label>To</label>
                      <input
                        type="date"
                        value={toDateInputValue(pendingDateTo)}
                        onChange={(e) => onDateToChange(parseDateInput(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* City */}
              <div className="dmb-group">
                <span className="dmb-group-label">City</span>
                <div className="dmb-dd-wrap">
                  <Dropdown
                    value={selCity}
                    optionLabel="name"
                    optionValue="value"
                    onChange={onCityChange}
                    options={cities}
                    placeholder="Select City"
                    showClear={false}
                  />
                </div>
              </div>

              {/* Facility */}
              <div className="dmb-group">
                <span className="dmb-group-label">Facility</span>
                <div className="dmb-dd-wrap">
                  <Dropdown
                    value={selFacility}
                    optionLabel="facilityName"
                    optionValue="Id"
                    onChange={onFacilityChange}
                    options={facilities}
                    placeholder="Select Facility"
                  />
                </div>
              </div>

              {/* Trip Type */}
              <div className="dmb-group">
                <span className="dmb-group-label">Trip Type</span>
                <div className="dmb-dd-wrap">
                  <Dropdown
                    value={selectedTripType}
                    options={tripTypeOptions}
                    onChange={onTripTypeChange}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Type"
                  />
                </div>
              </div>

              {/* Vendor */}
              <div className="dmb-group">
                <span className="dmb-group-label">Vendor</span>
                <div className="dmb-dd-wrap">
                  <Dropdown
                    value={selVendor}
                    onChange={onVendorChange}
                    options={venders}
                    optionLabel="vendorName"
                    placeholder="Select Vendor"
                    filter
                  />
                </div>
              </div>
            </div>

            <div className="dmb-sheet-footer">
              <button className="dmb-btn-cancel" onClick={closeSheet}>
                Cancel
              </button>
              <button className="dmb-btn-apply" onClick={handleApply}>
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default DashboardMobile;
