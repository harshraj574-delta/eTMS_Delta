import React from 'react';
import { Column } from 'primereact/column';
import { CustomDataTable } from './CustomDataTable';
import useIsMobile from './useIsMobile';

/**
 * ResponsiveDataTable
 *
 * Renders a PrimeReact DataTable on desktop and a mobile card list on small screens.
 * Drop-in replacement for <CustomDataTable> — add a `mobile` config on each Column
 * to control how that column renders on mobile.
 *
 * Column `mobile` config shape:
 *   { primary: true }    — renders as the card title (bold, top-left)
 *   { subtitle: true }   — renders as the dimmed secondary line
 *   { badge: true }      — renders as a pill badge  (optional: { bg, color } for colours)
 *   { action: true }     — renders in the top-right actions slot
 *   { hidden: true }     — never shown on mobile
 *   (no mobile key)      — rendered in the field grid below the header
 *
 * Custom mobile card:
 *   Pass `renderMobileCard={(row, index) => <JSX>}` to override the default card layout
 *   for rows that need bespoke treatment.
 *
 * Usage:
 *   <ResponsiveDataTable
 *     value={rows}
 *     dataKey="id"
 *     loading={loading}
 *     emptyMessage="No records"
 *   >
 *     <Column field="empName"  header="Name"    mobile={{ primary: true }} />
 *     <Column field="empCode"  header="ID"      mobile={{ subtitle: true }} />
 *     <Column field="Status"   header="Status"  mobile={{ badge: true }} body={statusTemplate} />
 *     <Column field="AdhocDate" header="Date" />
 *     <Column header="Action" body={actionTemplate} mobile={{ action: true }} />
 *   </ResponsiveDataTable>
 */
const ResponsiveDataTable = ({
  children,
  value = [],
  renderMobileCard,
  loading = false,
  emptyMessage = 'No data found',
  dataKey,
  highlight,   // (row) => hex — optional per-row accent colour
  onRowClick,
  ...tableProps
}) => {
  const isMobile = useIsMobile();

  // ── Desktop — plain CustomDataTable ────────────────────────────────────────
  if (!isMobile) {
    return (
      <CustomDataTable
        value={value}
        loading={loading}
        emptyMessage={emptyMessage}
        dataKey={dataKey}
        onRowClick={onRowClick}
        {...tableProps}
      >
        {children}
      </CustomDataTable>
    );
  }

  // ── Mobile — card list ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mobile-card-state">
        <i className="pi pi-spin pi-spinner" style={{ fontSize: '1.5rem', color: '#94a3b8' }} />
        <span>Loading…</span>
      </div>
    );
  }

  if (!value.length) {
    return (
      <div className="mobile-card-state">
        <i className="pi pi-inbox" style={{ fontSize: '1.5rem', color: '#cbd5e1' }} />
        <span>{emptyMessage}</span>
      </div>
    );
  }

  // Custom card renderer — full control
  if (renderMobileCard) {
    return (
      <div className="mobile-card-list">
        {value.map((row, index) => renderMobileCard(row, index))}
      </div>
    );
  }

  // ── Auto card renderer from Column mobile config ────────────────────────────
  // Collect Column definitions from children
  const cols = React.Children.toArray(children)
    .filter(child => child?.type === Column || child?.props?.field !== undefined)
    .map(child => child.props);

  const primaryCol   = cols.find(c => c.mobile?.primary);
  const subtitleCol  = cols.find(c => c.mobile?.subtitle);
  const badgeCols    = cols.filter(c => c.mobile?.badge);
  const actionCol    = cols.find(c => c.mobile?.action);
  const fieldCols    = cols.filter(
    c => !c.mobile?.primary && !c.mobile?.subtitle && !c.mobile?.badge &&
         !c.mobile?.action  && !c.mobile?.hidden
  );

  const resolveCell = (col, row) =>
    col.body ? col.body(row, {}) : row[col.field];

  return (
    <div className="mobile-card-list">
      {value.map((row, index) => {
        const key = dataKey ? row[dataKey] : index;
        const accent = highlight ? highlight(row) : undefined;

        const badges = badgeCols.map((c, i) => {
          const val = resolveCell(c, row);
          return { label: val, bg: c.mobile?.bg, color: c.mobile?.color };
        }).filter(b => b.label != null && b.label !== '');

        const fields = fieldCols.map(c => ({
          label: c.header,
          value: resolveCell(c, row),
        }));

        return (
          <div
            key={key}
            className="mobile-data-card"
            style={accent ? { borderLeft: `3px solid ${accent}` } : undefined}
            onClick={onRowClick ? () => onRowClick({ data: row, index }) : undefined}
            role={onRowClick ? 'button' : undefined}
          >
            {/* Header */}
            <div className="mobile-data-card__header">
              <div className="mobile-data-card__title-group">
                {primaryCol && (
                  <div className="mobile-data-card__title">
                    {resolveCell(primaryCol, row)}
                  </div>
                )}
                {subtitleCol && (
                  <div className="mobile-data-card__subtitle">
                    {resolveCell(subtitleCol, row)}
                  </div>
                )}
                {badges.length > 0 && (
                  <div className="mobile-data-card__badges">
                    {badges.map((b, i) => (
                      <span
                        key={i}
                        className="mobile-data-card__badge"
                        style={{ background: b.bg ?? '#f1f5f9', color: b.color ?? '#475569' }}
                      >
                        {b.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {actionCol && (
                <div
                  className="mobile-data-card__actions"
                  onClick={e => e.stopPropagation()}
                >
                  {resolveCell(actionCol, row)}
                </div>
              )}
            </div>

            {/* Field grid */}
            {fields.some(f => f.value != null && f.value !== '') && (
              <div className="mobile-data-card__fields">
                {fields.map((f, fi) =>
                  f.value != null && f.value !== '' ? (
                    <div key={fi} className="mobile-data-card__field">
                      <span className="mobile-data-card__field-label">{f.label}</span>
                      <span className="mobile-data-card__field-value">{f.value}</span>
                    </div>
                  ) : null
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ResponsiveDataTable;
