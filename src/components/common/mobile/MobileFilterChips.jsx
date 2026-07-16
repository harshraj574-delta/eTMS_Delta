import React from 'react';
import '../../css/mobile.css';

/**
 * MobileFilterChips
 *
 * Horizontally scrollable row of applied-filter chips so the user can see
 * the current criteria without opening the filter sheet.
 *
 * @param {Array<{icon?: string, label: string}>} chips - Applied filters
 * @param {Function} onClick - Usually re-opens the filter sheet
 */
const MobileFilterChips = ({ chips = [], onClick }) => {
    const visible = chips.filter((c) => c && c.label);
    if (visible.length === 0) return null;

    return (
        <div
            className="mob-chips"
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            aria-label="Applied filters"
        >
            {visible.map((chip, i) => (
                <span key={i} className="mob-chip">
                    {chip.icon && <i className={chip.icon} />}
                    {chip.label}
                </span>
            ))}
        </div>
    );
};

export default MobileFilterChips;
