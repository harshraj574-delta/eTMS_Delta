import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { OverlayPanel } from 'primereact/overlaypanel';
import './TableToolbar.css';

import crossIcon from '../../assets/cross.png';
import { useDebounce } from '../../hooks/useDebounce';

const TableToolbar = ({
  search,
  onSearch,
  onRefresh,
  onExport,
  activeFilterCount = 0,
  activeFilters = [],
  filters = null,
  setFilters = null,
  children,
  overlayRef,
  filterButtonRef,
  showFilter = true,
  showSearch = true,
  showRefresh = true,
  showExport = true,
  className = ""
}) => {
  const [localSearch, setLocalSearch] = useState(search || "");
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    // Only call onSearch when debounced value changes and it is a controlled input
    if (onSearch && debouncedSearch !== search) {
       // emulate an event object for the parent
       onSearch({ target: { value: debouncedSearch } });
    }
  }, [debouncedSearch]);

  useEffect(() => {
    // Sync external search changes (like clears) to local state
    if (search !== localSearch && search !== debouncedSearch) {
       setLocalSearch(search || "");
    }
  }, [search]);


  // Senior Dev Implementation: Defensive cleanup to prevent PrimeReact "hideOverlaysOnDocumentScrolling" crash
  // This occurs when navigating away while an overlay context is active.
  React.useEffect(() => {
    return () => {
      // Check if ref and current exist before attempting cleanup
      if (overlayRef && overlayRef.current) {
        try {
          // Force hide triggers internal PrimeReact listener removal
          // Checking specific internal method availability for extra safety
          if (typeof overlayRef.current.hide === 'function') {
             overlayRef.current.hide();
          }
        } catch (error) {
          // swalllow error during unmount to prevent breaking navigation
          console.warn('Safely handled OverlayPanel cleanup error:', error);
        }
      }
    };
  }, [overlayRef]); // Dependency ensures we track the correct ref instance

  const effectiveActiveFilters = React.useMemo(() => {
    if (activeFilters && activeFilters.length > 0) return activeFilters;
    if (!filters || !setFilters) return [];

    const computed = [];
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        value.forEach((val) => {
          computed.push({
            label: val,
            onRemove: () => {
              const newVal = value.filter((v) => v !== val);
              setFilters((prev) => ({
                ...prev,
                [key]: newVal.length > 0 ? newVal : null,
              }));
            },
          });
        });
      }
    });
    return computed;
  }, [activeFilters, filters, setFilters]);

  // Make sure overlay is fully visible (not under header / off-screen)
  const handleOverlayShow = () => {
    if (!overlayRef.current || !overlayRef.current.overlay) return;
    const overlayEl = overlayRef.current.overlay;

    const rect = overlayEl.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;

    const HEADER_SAFE_TOP = 80; // px below top bar
    const MARGIN = 8;

    let top = rect.top;
    let left = rect.left;

    if (top < HEADER_SAFE_TOP) {
      top = HEADER_SAFE_TOP;
    }

    const overflowRight = rect.right - window.innerWidth;
    if (overflowRight > 0) {
      left = left - overflowRight - MARGIN;
    }

    overlayEl.style.top = `${top + scrollY}px`;
    overlayEl.style.left = `${left + scrollX}px`;
  };

  return (
    <>
      <div className={`d-flex flex-column flex-md-row justify-content-between align-items-center mb-3 gap-2 ${className}`}>
        <div className="d-flex align-items-center gap-2 flex-wrap">
{showFilter && (
            <>
              {/* Show chips if effectiveActiveFilters has items */}
              {effectiveActiveFilters.length > 0 ? (
                <>
                  {effectiveActiveFilters.map((filter, idx) => (
                    <div key={idx} className="ota-filter-chip">
                      {/* <i className="pi pi-filter ota-filter-chip-icon" /> */}
                      <span>{filter.label}</span>
                      <img 
                        src={crossIcon}
                        alt="Remove"
                        className="ota-filter-chip-remove" 
                        onClick={(e) => {
                          e.stopPropagation();
                          filter.onRemove && filter.onRemove(filter);
                        }} 
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    icon="pi pi-plus"
                    label="Filter"
                    ref={filterButtonRef}
                    onClick={(e) => overlayRef.current && overlayRef.current.toggle(e)}
                    className="ota-filter-trigger"
                  />
                </>
              ) : (
                <>
                  {/* Default/Legacy view */}
                  <Button
                    type="button"
                    icon="pi pi-filter"
                    label="Filter"
                    ref={filterButtonRef}
                    onClick={(e) => overlayRef.current && overlayRef.current.toggle(e)}
                    className="ota-filter-trigger"
                  />
                  {activeFilterCount > 0 && (
                    <span
                      className="badge "
                      style={{ fontSize: "0.7rem", borderRadius: "999px" , backgroundColor: "#E9E8FC"}}
                    >
                      {activeFilterCount} active
                    </span>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
          {showSearch && (
            <div style={{ position: "relative" }}>
              <InputText
                placeholder="Search"
                className="p-inputtext-sm"
                style={{ paddingRight: "2.5rem", width: "250px" }}
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
              <i
                className="pi pi-search"
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#6c757d",
                }}
              />
            </div>
          )}
          
          <div className="d-flex align-items-center">
            {showRefresh && (
              <Button
                icon="pi pi-sync"
                rounded
                text
                severity="secondary"
                aria-label="Refresh"
                onClick={onRefresh}
                tooltip="Refresh"
                tooltipOptions={{ position: "top" }}
                className="p-0 mr-1"
                style={{ width: "2rem", height: "2rem", backgroundColor: "#f1f5f9", color: "#64748b" }}
              />
            )}
            {showExport && (
              <Button
                icon="pi pi-download"
                rounded
                text
                severity="secondary"
                aria-label="Export"
                onClick={onExport}
                tooltip="Export"
                tooltipOptions={{ position: "top" }}
                className="p-0 mr-1"
                style={{ width: "2rem", height: "2rem" }}
              />
            )}
            <Button
              icon="pi pi-ellipsis-h"
              rounded
              text
              severity="secondary"
              aria-label="More"
              className="p-0"
              style={{ width: "2rem", height: "2rem" }}
            />
          </div>
        </div>
      </div>

      {showFilter && (
        <OverlayPanel
          ref={overlayRef}
          showCloseIcon
          closeOnEscape
          dismissable
          appendTo={document.body}
          onShow={handleOverlayShow}
          className="ota-filter-overlay"
          style={{
            width: "320px",
            maxWidth: "95vw",
          }}
        >
          {children}
        </OverlayPanel>
      )}
    </>
  );
};

export default TableToolbar;
