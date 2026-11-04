/* Non-blocking "Loading routes 34/79" pill shown while visible routes stream in. */
export default function LoadProgress({ loaded, total }) {
  if (total === 0 || loaded >= total) return null;
  const pct = Math.round((loaded / total) * 100);
  return (
    <div className="rm-load-progress" role="status" aria-live="polite">
      <i className="pi pi-spin pi-spinner" aria-hidden="true" />
      <span>
        Loading routes {loaded}/{total}
      </span>
      <span className="rm-load-bar" aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}
