import { MultiSelect } from "primereact/multiselect";
import ToggleSwitch from "./ToggleSwitch";
import RouteCard from "./RouteCard";

/** Left panel: shift totals, location filter, view/edit switches and the route list. */
export default function RouteSidebar({ data, colorFor, access, edit, onToggleMerge, onEditStops }) {
  const { totals, locationFilter, visibility, displayRoutes } = data;

  return (
    <div className="sidebar-react">
      <div className="summary-stats">
        <div className="stat-item">
          <div className="stat-label">Routes</div>
          <div className="stat-value">{totals.routes}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Distance</div>
          <div className="stat-value">{totals.distanceKm.toFixed(1)} km</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Employees</div>
          <div className="stat-value">{totals.employees}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Avg Occupancy</div>
          <div className="stat-value">{totals.avgOccupancy}</div>
        </div>
      </div>

      <div className="location-filter-container">
        <label className="location-filter-label">Filter by Location:</label>
        <MultiSelect
          value={locationFilter.value}
          options={locationFilter.options}
          onChange={(e) => locationFilter.onChange(e.value)}
          optionLabel="label"
          placeholder="Select Locations"
          display="chip"
          maxSelectedLabels={2}
          filter
          filterPlaceholder="Search locations..."
          filterBy="label"
          showSelectAll={true}
          selectAllLabel="Select All"
          emptyFilterMessage="No locations found"
        />
      </div>

      <div className="sidebar-switch-row">
        <span className="switch-label">Show All Routes</span>
        <ToggleSwitch checked={visibility.showAll} onChange={visibility.setAll} label="Show all routes" />
      </div>

      <div className="sidebar-switch-row">
        <span className="switch-label">Edit Mode</span>
        {access.canEdit ? (
          <ToggleSwitch checked={edit.isEditMode} onChange={edit.toggleEditMode} label="Edit mode" />
        ) : (
          <span className="re-badge re-badge-lock">View only</span>
        )}
      </div>
      {!access.canEdit && <p className="re-edit-disabled">{access.reason}</p>}
      {edit.isEditMode && (
        <p className="re-edit-hint">
          Drag a stop onto a route line to move it. Click to select, <kbd>Ctrl</kbd>+click to add,{" "}
          <kbd>Shift</kbd>+drag to box-select. Only visible routes can be edited.
        </p>
      )}

      <div id="route-buttons">
        {displayRoutes.map((route) => (
          <RouteCard
            key={route.routeid}
            route={route}
            color={colorFor(route.routeid)}
            isActive={visibility.isVisible(route.routeid)}
            isEditMode={edit.isEditMode}
            isStale={edit.staleRouteIds.has(route.routeid)}
            isMergeSelected={edit.mergeRouteIds.includes(route.routeid)}
            onToggle={() => visibility.toggle(route.routeid)}
            onToggleMerge={() => onToggleMerge(route.routeid)}
            onEditStops={() => onEditStops(route.routeid)}
          />
        ))}
      </div>
    </div>
  );
}
