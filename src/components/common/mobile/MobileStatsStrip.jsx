import React from 'react';
import '../../css/mobile.css';

/**
 * MobileStatsStrip
 *
 * Compact tiles for page-level numbers (the mobile counterpart of the
 * desktop stats cards).
 *
 * @param {Array<{label: string, value: string|number, tone?: 'primary'|'success'|'warning'|'danger'}>} stats
 */
const MobileStatsStrip = ({ stats = [] }) => {
    const visible = stats.filter((s) => s && s.label);
    if (visible.length === 0) return null;

    return (
        <div className="mob-stats mb-2">
            {visible.map((s, i) => (
                <div key={i} className={`mob-stat ${s.tone ? `mob-stat--${s.tone}` : ''}`}>
                    <div className="mob-stat-value">{s.value ?? 0}</div>
                    <div className="mob-stat-label">{s.label}</div>
                </div>
            ))}
        </div>
    );
};

export default MobileStatsStrip;
