import { useMemo, useState } from "react";
import { MapContainer, ZoomControl } from "react-leaflet";
import { useQueryClient } from "@tanstack/react-query";
import "leaflet/dist/leaflet.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import Loader from "../common/Loader";
import AppConfirmDialog from "../common/AppConfirmDialog";
import { manageRouteKeys } from "../manageRoute/hooks/useManageRouteQueries";
import useRouteMapData from "./hooks/useRouteMapData";
import useStableRouteColors from "./hooks/useStableRouteColors";
import MapLibreLayer from "./map/MapLibreLayer";
import FitMapToRoutes from "./map/FitMapToRoutes";
import RouteLayers from "./map/RouteLayers";
import RouteSidebar from "./ui/RouteSidebar";
import RecalcBanner from "./ui/RecalcBanner";
import LoadProgress from "./ui/LoadProgress";
import RecalculatingScreen from "./ui/RecalculatingScreen";
import MapErrorToast from "./ui/MapErrorToast";
import { getRouteEditAccess } from "./editing/permissions";
import { useRouteEditListener } from "./editing/sync";
import useRouteMapEditor from "./editing/hooks/useRouteMapEditor";
import BoxSelect from "./editing/map/BoxSelect";
import RouteInspector from "./editing/ui/RouteInspector";
import SelectionActionBar from "./editing/ui/SelectionActionBar";
import "./routeMap.css";
import "./editing/ui/routeEditing.css";

const readUrlParams = () => Object.fromEntries(new URLSearchParams(window.location.search));

/**
 * /RouteMap?sDate=&FacilityID=&TripType=&Shifttimes=&Direction=
 * Shift route map with an optional edit mode (see ./editing).
 */
export default function RouteMap() {
  const queryClient = useQueryClient();
  const params = useMemo(readUrlParams, []);
  const access = useMemo(() => getRouteEditAccess(), []);
  const [mapTilesLoaded, setMapTilesLoaded] = useState(false);

  const data = useRouteMapData(params);
  const colorFor = useStableRouteColors(data.allRouteIds);
  const { edit, inspector, actions, map, sidebar, confirmVariant } = useRouteMapEditor({
    data,
    userId: access.userId,
  });

  // Routes edited in another tab (Manage Route) -> refetch here.
  useRouteEditListener(() => {
    queryClient.invalidateQueries({ queryKey: manageRouteKeys.all });
  });

  const { loaded, total } = data.loadProgress;
  const isLoadingRoutes = loaded < total;
  // Block the screen only until the first routes can be drawn; after that
  // (e.g. Show All on a large shift) routes stream in behind a progress pill.
  const showLoader = data.isLoadingRoutes || (total > 0 && loaded === 0) || (data.isReady && !mapTilesLoaded);
  const pendingRecalcCount = Math.max(data.pendingRecalcCount, edit.staleRouteIds.size);

  return (
    <div className="rm-root">
      <Loader isVisible={showLoader} fullScreen={true} />
      <RecalculatingScreen visible={edit.isRecalculating} />
      {data.error && <MapErrorToast message={data.error} />}

      {data.isReady && (
        <>
          <RouteSidebar
            data={data}
            colorFor={colorFor}
            access={access}
            edit={edit}
            onToggleMerge={sidebar.onToggleMerge}
            onEditStops={sidebar.onEditStops}
          />

          <div className="rm-top-stack">
            <LoadProgress loaded={loaded} total={total} />
            <RecalcBanner
              count={pendingRecalcCount}
              canRecalculate={access.canEdit}
              isRecalculating={edit.isRecalculating}
              onRecalculate={() => edit.recalculate(data.allRouteIds)}
            />
          </div>

          {inspector && (
            <RouteInspector
              route={inspector.route}
              preview={inspector.preview}
              color={colorFor(inspector.route.routeId)}
              isStale={edit.staleRouteIds.has(inspector.route.routeId)}
              selectedStopKeys={edit.selectedStopKeys}
              disabled={edit.isSubmitting}
              onClose={inspector.close}
              onSelectStop={inspector.onSelectStop}
              onReorder={inspector.onReorder}
              onRemove={inspector.onRemove}
              onAdd={inspector.onAdd}
            />
          )}

          {edit.isEditMode && (
            <SelectionActionBar
              selectedStops={edit.selectedStops}
              mergeRouteIds={edit.mergeRouteIds}
              editableRoutes={actions.editableRoutes}
              disabled={edit.isSubmitting}
              avoidRight={!!inspector}
              onMove={actions.move}
              onSplit={actions.split}
              onRemove={actions.remove}
              onMerge={actions.merge}
              onClear={edit.clearSelection}
            />
          )}

          <AppConfirmDialog
            visible={!!edit.pending}
            onHide={edit.cancel}
            title="Confirm route change"
            variant={confirmVariant}
            message={edit.pending?.message}
            detail="Route lines and ETAs update after you recalculate."
            confirmLabel={edit.isSubmitting ? "Saving…" : "Apply change"}
            onConfirm={edit.confirm}
            isLoading={edit.isSubmitting}
          >
            {edit.pending?.warnings.length > 0 && (
              <ul className="re-confirm-warnings">
                {edit.pending.warnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
            )}
          </AppConfirmDialog>

          <MapContainer
            center={[22.5937, 78.9629]}
            zoom={6}
            className="rm-map"
            zoomControl={false}
            zoomSnap={0.25}
            zoomDelta={0.5}
            wheelPxPerZoomLevel={120}
          >
            <FitMapToRoutes routes={data.routesForMap} ready={!isLoadingRoutes} />
            <MapLibreLayer onTilesLoaded={() => setMapTilesLoaded(true)} />
            <ZoomControl position="topright" />
            {edit.isEditMode && <BoxSelect onSelect={map.onBoxSelect} />}
            <RouteLayers
              routes={data.routesForMap}
              colorFor={colorFor}
              tripType={data.shift.tripType}
              isEditMode={edit.isEditMode}
              selectedStopKeys={edit.selectedStopKeys}
              staleRouteIds={edit.staleRouteIds}
              onSelectStops={edit.selectStops}
              onClearSelection={edit.clearSelection}
              onMoveRequest={map.onMapMove}
            />
          </MapContainer>
        </>
      )}
    </div>
  );
}
