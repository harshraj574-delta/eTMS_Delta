import React from 'react';

/**
 * MobileDataCard — renders one entity record as a touch-friendly card.
 *
 * Usage:
 *   <MobileDataCard
 *     title="Ravi Kumar"
 *     subtitle="EMP001 · GGN Facility"
 *     badges={[{ label: 'Pending', bg: '#fef9c3', color: '#854d0e' }]}
 *     fields={[
 *       { label: 'Shift', value: '0900' },
 *       { label: 'Trip', value: 'Pick Up' },
 *       { label: 'Date',  value: '18 May 2026' },
 *     ]}
 *     actions={<Button icon="pi pi-trash" className="p-button-danger p-button-text p-button-sm" />}
 *     onClick={() => openDetail(row)}
 *     highlight="#f59e0b"
 *   />
 *
 * Props:
 *   title      - string | ReactNode  — bold primary line
 *   subtitle   - string | ReactNode  — dimmed secondary line
 *   badges     - [{ label, bg?, color? }] — small pill tags
 *   fields     - [{ label, value }]       — grid of key-value pairs (null/'' values are skipped)
 *   actions    - ReactNode               — icon buttons anchored to top-right
 *   onClick    - () => void             — tap the card body
 *   highlight  - hex string             — left-border accent color
 *   className  - extra class on the card wrapper
 */
const MobileDataCard = ({
  title,
  subtitle,
  badges = [],
  fields = [],
  actions,
  onClick,
  highlight,
  className = '',
}) => (
  <div
    className={`mobile-data-card${className ? ` ${className}` : ''}`}
    style={highlight ? { borderLeft: `3px solid ${highlight}` } : undefined}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
  >
    {/* ── Header row ── */}
    <div className="mobile-data-card__header">
      <div className="mobile-data-card__title-group">
        {title != null && (
          <div className="mobile-data-card__title">{title}</div>
        )}
        {subtitle != null && (
          <div className="mobile-data-card__subtitle">{subtitle}</div>
        )}
        {badges.length > 0 && (
          <div className="mobile-data-card__badges">
            {badges.map((b, i) => (
              <span
                key={i}
                className="mobile-data-card__badge"
                style={{
                  background: b.bg ?? '#f1f5f9',
                  color: b.color ?? '#475569',
                }}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {actions && (
        <div className="mobile-data-card__actions" onClick={e => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>

    {/* ── Field grid ── */}
    {fields.some(f => f.value != null && f.value !== '') && (
      <div className="mobile-data-card__fields">
        {fields.map((f, i) =>
          f.value != null && f.value !== '' ? (
            <div key={i} className="mobile-data-card__field">
              <span className="mobile-data-card__field-label">{f.label}</span>
              <span className="mobile-data-card__field-value">{f.value}</span>
            </div>
          ) : null
        )}
      </div>
    )}
  </div>
);

export default MobileDataCard;
