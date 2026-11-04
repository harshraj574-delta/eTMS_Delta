import { useState, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Rows only move vertically and stay inside the list.
const restrictToVerticalAxis = ({ transform }) => ({ ...transform, x: 0 });

const StopRowContent = ({ stop, number, color, dragHandle, actions, badge }) => (
    <>
        {dragHandle}
        <span className="re-stop-no" style={{ background: color }}>{number}</span>
        <span className="re-stop-text">
            <strong>{stop.empName || stop.empCode}</strong>
            <small>{stop.empCode} · {stop.gender || '—'} · ETA {stop.eta || '—'}</small>
        </span>
        {badge}
        {actions}
    </>
);

const SortableStopRow = ({ stop, number, color, isSelected, isMoved, disabled, onSelect, onRemove }) => {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
        useSortable({ id: stop.key, disabled });

    const style = { transform: CSS.Transform.toString(transform), transition };
    const className = [
        isSelected && 'is-selected',
        isMoved && 'is-moved',
        isDragging && 'is-drag-source',
    ].filter(Boolean).join(' ');

    return (
        <li ref={setNodeRef} style={style} className={className}>
            <StopRowContent
                stop={stop}
                number={number}
                color={color}
                badge={isMoved && <span className="re-badge re-badge-warn">Pending</span>}
                dragHandle={
                    <button
                        type="button"
                        ref={setActivatorNodeRef}
                        className="re-drag-handle"
                        disabled={disabled}
                        aria-label={`Reorder ${stop.empName || stop.empCode}, stop ${number}. Press space to pick up.`}
                        {...attributes}
                        {...listeners}
                    >
                        <i className="pi pi-bars" />
                    </button>
                }
                actions={
                    <span className="re-stop-actions">
                        <button
                            type="button"
                            className="re-icon-btn"
                            onClick={(e) => onSelect(stop, e)}
                            aria-pressed={isSelected}
                            aria-label={`Select ${stop.empName} on the map`}
                            title="Select on map (Ctrl+click to add)"
                        >
                            <i className="pi pi-map-marker" />
                        </button>
                        <button
                            type="button"
                            className="re-icon-btn re-danger"
                            disabled={disabled}
                            onClick={() => onRemove(stop)}
                            aria-label={`Remove ${stop.empName}`}
                            title="Remove from route"
                        >
                            <i className="pi pi-minus-circle" />
                        </button>
                    </span>
                }
            />
        </li>
    );
};

/**
 * Drag-to-reorder stop list. Calls onReorder(stop, finalPosition) once per drop;
 * the parent turns that into a REORDER command and confirms it.
 * `stops` must already be in display order (the pending preview, if any).
 */
const SortableStopList = ({ stops, color, selectedStopKeys, movedKeys, disabled, onReorder, onSelect, onRemove }) => {
    const [activeKey, setActiveKey] = useState(null);
    const [overIndex, setOverIndex] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const keys = useMemo(() => stops.map((s) => s.key), [stops]);
    // Numbers follow the order the drop would produce, so rows renumber live while dragging.
    const projected = useMemo(
        () => (activeKey && overIndex != null ? arrayMove(keys, keys.indexOf(activeKey), overIndex) : keys),
        [keys, activeKey, overIndex]
    );
    const nameOf = (key) => {
        const s = stops.find((x) => x.key === key);
        return s ? s.empName || s.empCode : 'employee';
    };

    const announcements = {
        onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}, stop ${keys.indexOf(active.id) + 1} of ${keys.length}.`,
        onDragOver: ({ active, over }) =>
            over ? `${nameOf(active.id)} will move to stop ${keys.indexOf(over.id) + 1}.` : undefined,
        onDragEnd: ({ active, over }) =>
            over ? `${nameOf(active.id)} dropped at stop ${keys.indexOf(over.id) + 1}. Confirm to apply.` : 'Cancelled.',
        onDragCancel: ({ active }) => `Reorder of ${nameOf(active.id)} cancelled.`,
    };

    const reset = () => {
        setActiveKey(null);
        setOverIndex(null);
    };

    const handleDragEnd = ({ active, over }) => {
        reset();
        if (!over || active.id === over.id) return;
        const stop = stops.find((s) => s.key === active.id);
        onReorder(stop, keys.indexOf(over.id) + 1);
    };

    const activeStop = activeKey ? stops.find((s) => s.key === activeKey) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            accessibility={{
                announcements,
                screenReaderInstructions: {
                    draggable: 'Press space to pick up a stop, arrow keys to move it, space to drop, escape to cancel.',
                },
            }}
            onDragStart={({ active }) => {
                setActiveKey(active.id);
                setOverIndex(keys.indexOf(active.id));
            }}
            onDragOver={({ over }) => setOverIndex(over ? keys.indexOf(over.id) : null)}
            onDragEnd={handleDragEnd}
            onDragCancel={reset}
        >
            <SortableContext items={keys} strategy={verticalListSortingStrategy}>
                <ol className="re-stop-list">
                    {stops.map((stop) => (
                        <SortableStopRow
                            key={stop.key}
                            stop={stop}
                            number={projected.indexOf(stop.key) + 1}
                            color={color}
                            isSelected={selectedStopKeys.has(stop.key)}
                            isMoved={movedKeys.has(stop.key)}
                            disabled={disabled}
                            onSelect={onSelect}
                            onRemove={onRemove}
                        />
                    ))}
                </ol>
            </SortableContext>
            <DragOverlay dropAnimation={{ duration: 160 }}>
                {activeStop && (
                    <div className="re-stop-overlay">
                        <StopRowContent
                            stop={activeStop}
                            number={(overIndex ?? keys.indexOf(activeKey)) + 1}
                            color={color}
                            dragHandle={<span className="re-drag-handle"><i className="pi pi-bars" /></span>}
                            badge={<span className="re-overlay-target">→ Stop {(overIndex ?? 0) + 1}</span>}
                        />
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
};

export default SortableStopList;
