import React, { useCallback } from "react";
import { useDroppable } from "@dnd-kit/core";

// Cross-page drop target. Hover appearance is pure CSS (.mr-cross-drop:hover);
// only rendered while cross-page drop mode is active.
export const CrossPageDropZone = React.memo(
  ({ routeId, position, isActive, onDrop, selectedEmployees }) => {
    const handleClick = useCallback(() => {
      if (isActive) {
        onDrop(routeId, position);
      }
    }, [isActive, onDrop, routeId, position]);

    if (!isActive) return null;

    return (
      <div
        className="cross-page-drop-zone mr-cross-drop"
        onClick={handleClick}
      >
        <div className="mr-drop-content">
          <i className="material-icons me-2 mr-icon-18">arrow_downward</i>
          Drop {selectedEmployees?.size || 0} employee(s) here
        </div>
      </div>
    );
  }
);

// dnd-kit droppable indicator between employee rows; expands while a
// drag hovers over it (isOver comes from the DnD hook, styling is CSS).
export const DropZoneIndicator = React.memo(({ routeId, position, isOver }) => {
  const { setNodeRef } = useDroppable({
    id: `dropzone-${routeId}-${position}`,
    data: {
      targetRouteId: routeId,
      targetPosition: position,
      type: "position",
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`drop-zone mr-drop-indicator ${isOver ? "drop-zone-active mr-drop-indicator--over" : ""}`}
    >
      <div className="mr-drop-content">
        <i className="material-icons me-2 mr-icon-18">move_to_inbox</i>
        Drop here
      </div>
    </div>
  );
});
