import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

/**
 * Fit the viewport to the drawn routes. Refits only when the set of drawn routes
 * changes (not when their data refetches after an edit, which would yank the view
 * away from what the user is editing), and only once loading has settled (`ready`)
 * so a large Show All doesn't re-fit once per arriving route.
 */
export default function FitMapToRoutes({ routes, ready = true }) {
  const map = useMap();
  const fitKey = routes.map((r) => r.routeid).join(",");
  const routesRef = useRef(routes);
  routesRef.current = routes;

  useEffect(() => {
    const current = routesRef.current;
    if (!ready || !current.length) return;
    let bounds = [];
    current.forEach((route) => {
      if (route.path) bounds = bounds.concat(route.path);
      route.stops.forEach((stop) => {
        if (!isNaN(stop.lat) && !isNaN(stop.lng)) bounds.push([stop.lat, stop.lng]);
      });
    });
    if (bounds.length) {
      const basePadding = 40;
      const paddingMultiplier = Math.min(1 + (current.length * 0.05), 2);
      const padding = Math.floor(basePadding * paddingMultiplier);

      const maxZoom = current.length > 10 ? 12 :
                     current.length > 5 ? 11 :
                     current.length > 1 ? 12 : 13;

      map.fitBounds(bounds, {
        padding: [padding, padding],
        maxZoom: maxZoom
      });
    }
  }, [fitKey, ready, map]);
  return null;
}
