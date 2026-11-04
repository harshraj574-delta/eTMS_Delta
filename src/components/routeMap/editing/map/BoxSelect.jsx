import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Shift+drag draws a selection rectangle; onSelect(bounds, { additive }) fires on release
 * (Ctrl/Cmd held = add to the selection). Leaflet's own Shift+drag box zoom is disabled
 * while this is mounted. Move/up are tracked on the document so the box keeps working
 * when the pointer passes over overlays (sidebar, inspector) or leaves the map.
 */
const BoxSelect = ({ onSelect }) => {
    const map = useMap();

    useEffect(() => {
        map.boxZoom.disable();
        const container = map.getContainer();
        let start = null;
        let rect = null;

        const toLatLng = (e) => map.containerPointToLatLng(map.mouseEventToContainerPoint(e));

        const onMouseMove = (e) => {
            rect?.setBounds(L.latLngBounds(start, toLatLng(e)));
        };

        const onMouseUp = (e) => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            const bounds = rect.getBounds();
            rect.remove();
            rect = null;
            start = null;
            map.dragging.enable();
            container.style.cursor = '';
            // Ignore a plain shift-click (no real rectangle drawn).
            const sw = map.latLngToContainerPoint(bounds.getSouthWest());
            const ne = map.latLngToContainerPoint(bounds.getNorthEast());
            if (Math.abs(sw.x - ne.x) < 5 && Math.abs(sw.y - ne.y) < 5) return;
            onSelect(bounds, { additive: e.ctrlKey || e.metaKey });
        };

        const onMouseDown = (e) => {
            if (!e.shiftKey || e.button !== 0) return;
            // Markers keep their own shift+click (toggle selection).
            if (e.target.closest?.('.leaflet-marker-icon')) return;
            e.preventDefault(); // no text selection
            e.stopPropagation(); // no map pan
            start = toLatLng(e);
            map.dragging.disable();
            rect = L.rectangle(L.latLngBounds(start, start), {
                color: '#2563eb',
                weight: 1.5,
                dashArray: '4 4',
                fillOpacity: 0.08,
                interactive: false,
            }).addTo(map);
            container.style.cursor = 'crosshair';
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        container.addEventListener('mousedown', onMouseDown, true);

        return () => {
            container.removeEventListener('mousedown', onMouseDown, true);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            rect?.remove();
            map.dragging?.enable();
            map.boxZoom?.enable();
            container.style.cursor = '';
        };
    }, [map, onSelect]);

    return null;
};

export default BoxSelect;
