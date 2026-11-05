import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-leaflet";

const OPENFREEMAP_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';

/**
 * Vector base map from OpenFreeMap (free, no API key) rendered by MapLibre GL
 * under Leaflet, with a raster OSM fallback. `style` is an OpenFreeMap style
 * name: "liberty" (default, full colour) or "positron" (light grey, for
 * overlays such as heatmaps). Calls onTilesLoaded once the first render
 * settles (or after a 3s safety timeout).
 */
export default function MapLibreLayer({ onTilesLoaded, style = "liberty" }) {
  const map = useMap();
  const layerRef = useRef(null);
  const glMapRef = useRef(null);
  const tilesLoadedRef = useRef(false);
  const onTilesLoadedRef = useRef(onTilesLoaded);
  const checkIntervalRef = useRef(null);

  useEffect(() => {
    onTilesLoadedRef.current = onTilesLoaded;
  }, [onTilesLoaded]);

  useEffect(() => {
    if (layerRef.current) return;
    if (!map) return;

    if (!window.maplibregl) {
      window.maplibregl = maplibregl;
    }

    try {
      const maplibreLayer = L.maplibreGL({
        style: `https://tiles.openfreemap.org/styles/${style}`,
        attribution: OPENFREEMAP_ATTRIBUTION,
        interactive: false,
        maplibreOptions: {
          maxTileCacheSize: 300,
          fadeDuration: 300,
          crossSourceCollisions: false,
          optimizeForTerrain: false,
          refreshExpiredTiles: false,
          preserveDrawingBuffer: true,
          trackResize: true,
          antialias: true,
        }
      });

      maplibreLayer.addTo(map);
      layerRef.current = maplibreLayer;

      // Force tiles loaded after 3 seconds as a safety net
      const safetyTimeout = setTimeout(() => {
        if (!tilesLoadedRef.current) {
          console.warn('MapLibre layer load timed out - forcing ready state');
          tilesLoadedRef.current = true;
          if (onTilesLoadedRef.current) {
            onTilesLoadedRef.current();
          }
        }
      }, 3000);

      const checkMapReady = () => {
        if (maplibreLayer.getMaplibreMap) {
          const glMap = maplibreLayer.getMaplibreMap();
          
          if (glMap) {
            glMapRef.current = glMap;
            
            // If map is already loaded, trigger callback
            if (glMap.loaded()) {
               if (!tilesLoadedRef.current) {
                  tilesLoadedRef.current = true;
                  if (onTilesLoadedRef.current) {
                    onTilesLoadedRef.current();
                  }
               }
            }

            glMap.on('load', () => {
               // Map loaded
            });

            glMap.on('idle', () => {
              if (!tilesLoadedRef.current) {
                tilesLoadedRef.current = true;
                if (onTilesLoadedRef.current) {
                  onTilesLoadedRef.current();
                }
              }
            });

            // Clear the interval once we found the map
            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
              checkIntervalRef.current = null;
            }
          }
        }
      };

      // Check immediately and then periodically
      checkMapReady();
      checkIntervalRef.current = setInterval(checkMapReady, 100);

      return () => {
        clearTimeout(safetyTimeout);
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }

        // Destroy the GL map FIRST so its async resize/zoom events can no longer
        // trigger the Leaflet _handleZoom handler (which calls this._map.getZoom()
        // and crashes when this._map is already null during Leaflet teardown).
        if (glMapRef.current) {
          try { glMapRef.current.remove(); } catch { /* suppress */ }
          glMapRef.current = null;
        }

        if (layerRef.current && map) {
          try {
            map.removeLayer(layerRef.current);
          } catch { /* suppress — GL map already gone */ }
          layerRef.current = null;
        }
      };

    } catch (err) {
      console.error('Failed to initialize MapLibre GL layer:', err);
      const fallbackLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '© OpenStreetMap' }
      );
      fallbackLayer.addTo(map);
      layerRef.current = fallbackLayer;

      if (onTilesLoadedRef.current && !tilesLoadedRef.current) {
        tilesLoadedRef.current = true;
        setTimeout(() => onTilesLoadedRef.current(), 1000);
      }
      return () => {
         if (layerRef.current && map) {
            try {
               map.removeLayer(layerRef.current);
            } catch { /* layer already removed */ }
            layerRef.current = null;
         }
      }
    }
  }, [map, style]);

  return null;
}
