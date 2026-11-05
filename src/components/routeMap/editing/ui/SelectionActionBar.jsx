import { useState, useMemo, useEffect } from 'react';
import { Dropdown } from 'primereact/dropdown';

/**
 * Contextual toolbar shown in edit mode while stops or routes are selected.
 *
 * Layout: [summary + clear] | [primary: move to route/stop] | [secondary: split, remove]
 * It sits in a dock spanning the free map area (between the sidebar and the
 * inspector / zoom controls) and adapts to the dock's width with container
 * queries instead of wrapping (routeEditing.css, "Action dock"):
 *   wide   - one row, all labels
 *   medium - one row, secondary actions icon-only
 *   narrow - two fixed rows (summary + secondary, then move)
 *
 * Stop selection: Move, Split, Remove. Route selection (merge checkboxes): Merge.
 */
const ActionButton = ({ icon, label, title, className = '', ...props }) => (
    <button type="button" className={`re-btn ${className}`} title={title ?? label} aria-label={label} {...props}>
        <i className={`pi ${icon}`} aria-hidden="true" />
        <span className="re-ab-label">{label}</span>
    </button>
);

const Summary = ({ count, noun, detail, onClear }) => (
    <div className="re-ab-summary">
        <span className="re-ab-count" aria-live="polite" title={detail ? `${count} ${noun} · ${detail}` : undefined}>
            <strong>{count}</strong> {noun}
            {detail && <small> · {detail}</small>}
        </span>
        <button type="button" className="re-icon-btn" onClick={onClear} aria-label="Clear selection" title="Clear selection (Esc)">
            <i className="pi pi-times" aria-hidden="true" />
        </button>
    </div>
);

const SelectionActionBar = ({
    selectedStops,
    mergeRouteIds,
    editableRoutes, // [{ routeId, stopCount }]
    onMove,
    onSplit,
    onRemove,
    onMerge,
    onClear,
    disabled,
    avoidRight = false, // true while the inspector panel is open
}) => {
    const [targetRouteId, setTargetRouteId] = useState(null);
    const [position, setPosition] = useState(null);

    const sourceRouteIds = useMemo(
        () => [...new Set(selectedStops.map((s) => s.routeId))],
        [selectedStops]
    );

    const target = editableRoutes.find((r) => r.routeId === targetRouteId);
    const movingFromTarget = selectedStops.filter((s) => s.routeId === targetRouteId).length;
    const maxPosition = target ? target.stopCount - movingFromTarget + 1 : 0;

    useEffect(() => {
        setPosition((p) => (p && p <= maxPosition ? p : maxPosition || null));
    }, [maxPosition]);

    useEffect(() => {
        if (targetRouteId && !editableRoutes.some((r) => r.routeId === targetRouteId)) setTargetRouteId(null);
    }, [editableRoutes, targetRouteId]);

    if (!selectedStops.length && mergeRouteIds.length < 2) return null;

    const dockClass = `re-action-dock${avoidRight ? ' has-inspector' : ''}`;

    if (!selectedStops.length) {
        return (
            <div className={dockClass}>
                <div className="re-action-bar is-compact" role="toolbar" aria-label="Route actions">
                    <Summary count={mergeRouteIds.length} noun="routes selected" onClear={onClear} />
                    <span className="re-ab-divider" aria-hidden="true" />
                    <div className="re-ab-primary">
                        <ActionButton
                            icon="pi-share-alt"
                            label={`Merge into ${mergeRouteIds[0]}`}
                            className="re-btn-primary re-ab-keep-label"
                            disabled={disabled}
                            onClick={onMerge}
                        />
                    </div>
                </div>
            </div>
        );
    }

    const routeOptions = editableRoutes
        .filter((r) => !(sourceRouteIds.length === 1 && r.routeId === sourceRouteIds[0] && selectedStops.length === r.stopCount))
        .map((r) => ({ label: r.routeId, value: r.routeId, stopCount: r.stopCount }));

    const positionOptions = Array.from({ length: maxPosition }, (_, i) => ({ label: `Stop ${i + 1}`, value: i + 1 }));

    const canSplit = sourceRouteIds.length === 1;
    const canRemove = selectedStops.length === 1;

    return (
        <div className={dockClass}>
            <div className="re-action-bar" role="toolbar" aria-label="Selected employees actions">
                <Summary
                    count={selectedStops.length}
                    noun="selected"
                    detail={sourceRouteIds.length > 1 ? `${sourceRouteIds.length} routes` : `Route ${sourceRouteIds[0]}`}
                    onClear={onClear}
                />

                <span className="re-ab-divider" aria-hidden="true" />

                <div className="re-ab-primary" role="group" aria-label="Move selected employees">
                    <Dropdown
                        value={targetRouteId}
                        options={routeOptions}
                        onChange={(e) => setTargetRouteId(e.value)}
                        placeholder="Move to route…"
                        filter={routeOptions.length > 6}
                        className="re-dropdown re-ab-route"
                        appendTo="self"
                        ariaLabel="Target route"
                        itemTemplate={(o) => (
                            <span className="re-ab-option">
                                <span>{o.label}</span>
                                <small>{o.stopCount} {o.stopCount === 1 ? 'stop' : 'stops'}</small>
                            </span>
                        )}
                    />
                    <Dropdown
                        value={position}
                        options={positionOptions}
                        onChange={(e) => setPosition(e.value)}
                        placeholder="Stop"
                        disabled={!targetRouteId}
                        className="re-dropdown re-ab-stop"
                        appendTo="self"
                        ariaLabel="Target stop"
                    />
                    <ActionButton
                        icon="pi-arrow-right"
                        label="Move"
                        className="re-btn-primary re-ab-keep-label"
                        disabled={disabled || !targetRouteId || !position}
                        onClick={() => onMove(targetRouteId, position)}
                    />
                </div>

                <span className="re-ab-divider" aria-hidden="true" />

                <div className="re-ab-secondary" role="group" aria-label="More actions">
                    <ActionButton
                        icon="pi-clone"
                        label="Split"
                        title={canSplit ? 'Split into a new route' : 'Select employees from a single route to split'}
                        disabled={disabled || !canSplit}
                        onClick={onSplit}
                    />
                    <ActionButton
                        icon="pi-minus-circle"
                        label="Remove"
                        title={canRemove ? 'Remove from route' : 'Select one employee to remove'}
                        className="re-btn-danger"
                        disabled={disabled || !canRemove}
                        onClick={onRemove}
                    />
                </div>
            </div>
        </div>
    );
};

export default SelectionActionBar;
