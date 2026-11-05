/* Shown while any route on the shift was edited after its last recalculation. */
export default function RecalcBanner({ count, canRecalculate, isRecalculating, onRecalculate }) {
  if (count <= 0) return null;
  return (
    <div className="re-recalc-banner" role="status">
      <i className="pi pi-exclamation-triangle" />
      <span>
        {count} route{count === 1 ? "" : "s"} changed since the last recalculation. Lines and ETAs may be out of
        date.
      </span>
      {canRecalculate && (
        <button type="button" className="re-btn re-btn-primary" disabled={isRecalculating} onClick={onRecalculate}>
          <i className="pi pi-refresh" /> Recalculate
        </button>
      )}
    </div>
  );
}
