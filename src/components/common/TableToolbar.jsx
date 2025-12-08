import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { OverlayPanel } from 'primereact/overlaypanel';
import './TableToolbar.css';
import btnsSet from '../../assets/btns-set.png';

const TableToolbar = ({
  search,
  onSearch,
  onRefresh,
  onExport,
  activeFilterCount = 0,
  children,
  overlayRef,
  filterButtonRef,
  showFilter = true,
  showSearch = true,
  showRefresh = true,
  showExport = true,
  className = ""
}) => {

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
        <div className="d-flex align-items-center gap-2">
          {showFilter && (
            <>
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
                  className="badge bg-primary"
                  style={{ fontSize: "0.7rem", borderRadius: "999px" }}
                >
                  {activeFilterCount} active
                </span>
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
                value={search}
                onChange={onSearch}
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
                rounded
                text
                severity="secondary"
                aria-label="Refresh"
                onClick={onRefresh}
                tooltip="Refresh"
                tooltipOptions={{ position: "top" }}
                className="p-0 mr-1"
                style={{ width: "2rem", height: "2rem" }}
              >
                <img src={btnsSet} alt="Refresh" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </Button>
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
