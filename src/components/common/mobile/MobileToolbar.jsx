import React from 'react';
import { Button } from 'primereact/button';
import '../../css/mobile.css';

/**
 * MobileToolbar
 *
 * Standard in-page header row for mobile list pages:
 * title + subtitle on the left, an optional Filters trigger on the right.
 *
 * @param {string} title - Page title
 * @param {string} subtitle - Optional context line (e.g. selected date)
 * @param {Function} onFilterClick - Opens the page's filter sheet
 * @param {number} filterCount - Number of ACTIVE filters (never the result count)
 * @param {ReactNode} rightContent - Optional extra actions before the Filters button
 */
const MobileToolbar = ({ title, subtitle, onFilterClick, filterCount = 0, rightContent }) => (
    <div className="card_tb p-3 mb-2 shadow-sm mob-toolbar">
        <div className="d-flex justify-content-between align-items-center">
            <div className="overflow-hidden">
                <h6 className="mob-toolbar-title text-truncate">{title}</h6>
                {subtitle && <small className="mob-toolbar-sub">{subtitle}</small>}
            </div>
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
                {rightContent}
                {onFilterClick && (
                    <Button
                        className="p-button-outlined p-button-sm d-flex align-items-center gap-2 mob-filter-btn"
                        onClick={onFilterClick}
                    >
                        <i className="pi pi-filter" />
                        <span>Filters</span>
                        {filterCount > 0 && (
                            <span className="mob-filter-btn-badge">{filterCount}</span>
                        )}
                    </Button>
                )}
            </div>
        </div>
    </div>
);

export default MobileToolbar;
