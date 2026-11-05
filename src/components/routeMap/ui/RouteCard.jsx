import { VehicleIcon, GuardIcon, SwappedIcon, PWDIcon, MedicalIcon, NonMotorableIcon } from "./RouteBadges";

const formatKm = (v) => (v && !isNaN(parseFloat(v)) ? `${parseFloat(v).toFixed(1)} km` : "—");
const formatInt = (v, suffix = "") => (v !== undefined && !isNaN(parseInt(v, 10)) ? `${parseInt(v, 10)}${suffix}` : "—");

/**
 * One route in the sidebar. Clicking toggles it on the map; in edit mode it
 * also offers merge selection and "Edit stops" (or a lock for finalized routes).
 */
export default function RouteCard({
  route,
  color,
  isActive,
  isEditMode,
  isStale,
  isMergeSelected,
  onToggle,
  onToggleMerge,
  onEditStops,
}) {
  return (
    <div className="route-item">
      <div
        className={`route-summary${isActive ? " active" : ""}`}
        data-routeid={route.routeid}
        style={{ borderLeft: `6px solid ${color}` }}
        role="button"
        tabIndex={0}
        aria-pressed={isActive}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="route-name">
          <span>Route {route.routeid}</span>
          <div className="route-icons-container">
            {route.varvehicleType && <VehicleIcon type={route.varvehicleType} isActive={isActive} />}
            {route.PlannedGuard == 1 && <GuardIcon isActive={isActive} />}
            {(route.swapped === true || route.swapped === "true") && <SwappedIcon isActive={isActive} />}
            {route.isPWD && <PWDIcon isActive={isActive} />}
            {route.isMedical && <MedicalIcon isActive={isActive} />}
            {route.isNMT && <NonMotorableIcon isActive={isActive} />}
          </div>
        </div>
        <div className="route-stats">
          <div className="stat-item">
            <div className="stat-label">Distance</div>
            <div className="stat-value">{formatKm(route.totaldist)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Occupancy</div>
            <div className="stat-value">{formatInt(route.totalStop)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Duration</div>
            <div className="stat-value">{formatInt(route.duration, " min")}</div>
          </div>
        </div>
        {isEditMode && (
          // Controls inside the card must not toggle visibility.
          <div className="re-card-tools" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            {route.isLocked ? (
              <span className="re-badge re-badge-lock"><i className="pi pi-lock" /> Finalized</span>
            ) : (
              <>
                <label>
                  <input type="checkbox" checked={isMergeSelected} onChange={onToggleMerge} />
                  Merge
                </label>
                <button type="button" className="re-btn re-btn-sm" onClick={onEditStops}>
                  <i className="pi pi-pencil" /> Edit stops
                </button>
              </>
            )}
            {isStale && <span className="re-badge re-badge-warn">Recalc</span>}
          </div>
        )}
      </div>
    </div>
  );
}
