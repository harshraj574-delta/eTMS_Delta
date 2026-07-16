import React, { useMemo, useCallback } from "react";
import { useDraggable } from "@dnd-kit/core";
import { InputText } from "primereact/inputtext";
import SwipeToDeleteBackground from "../SwipeToDeleteBackground";

// One employee row inside a route expansion: dnd-kit draggable with
// swipe-to-delete. Renders DIVs (not TRs) so it can live outside a table.
const DraggableEmployeeRow = React.memo(
  ({
    employee,
    routeId,
    index,
    isSelected,
    onSelectionChange,
    selectedCount,
    activeId,
    selectedEmployees,
    isDragInProgress,
    selectedAction,
    onDeleteEmployee,
    isEditable,
  }) => {
    const employeeKey = `${routeId}-${employee.id || employee.empID}`;

    const { attributes, listeners, setNodeRef, transform, isDragging } =
      useDraggable({
        id: `employee-${routeId}-${employee.id || employee.empID}-${index}`,
        data: {
          employee: {
            ...employee,
            id: employee.id || employee.empID || employee.empId,
          },
          sourceRouteId: routeId,
          type: "employee",
          isMultiSelect: isSelected && selectedCount > 1,
          selectedCount: isSelected ? selectedCount : 1,
        },
        disabled: !isEditable || selectedAction === 'split',
      });

    const shouldAppearDragged =
      isDragging ||
      (isDragInProgress && isSelected && selectedEmployees.size > 1);

    const swipeTranslateX = transform ? transform.x : 0;

    // Only the swipe transform is dynamic; colors/borders live in ManageRoute.css
    const foregroundStyle = useMemo(
      () => ({
        transform: `translateX(${swipeTranslateX}px)`,
        transition: isDragging ? "none" : undefined,
      }),
      [swipeTranslateX, isDragging]
    );

    const rowClassName = [
      "draggable-row",
      "mr-emp-row",
      shouldAppearDragged ? "dragging-multi mr-emp-row--ghost" : "",
      isSelected ? "selected" : "",
      isSelected
        ? selectedAction === "split"
          ? "mr-emp-row--split"
          : "mr-emp-row--selected"
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    const foregroundClassName = [
      "row d-flex align-items-center justify-content-start py-2",
      "mr-emp-row-fg",
      employee.isNewAdded
        ? "mr-emp-row-fg--new"
        : isSelected
          ? selectedAction === "split"
            ? "mr-emp-row-fg--split"
            : "mr-emp-row-fg--selected"
          : "",
    ]
      .filter(Boolean)
      .join(" ");

    const handleCheckboxChange = useCallback(
      (e) => {
        e.stopPropagation();
        onSelectionChange(employeeKey, routeId);
      },
      [onSelectionChange, employeeKey, routeId]
    );

    return (
      <div className={rowClassName}>
        <SwipeToDeleteBackground
          isActive={isDragging}
          swipeProgress={swipeTranslateX}
        />
        <div
          ref={setNodeRef}
          style={foregroundStyle}
          className={foregroundClassName}
        >
          {/* Column 1: Actions - Always show checkbox */}
          <div className="col-1">
            <div className="d-flex align-items-center">
              {/* Always show checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleCheckboxChange}
                className={`form-check-input me-2 ${isEditable ? "mr-checkbox" : "mr-checkbox--disabled"}`}
                onClick={(e) => e.stopPropagation()}
                disabled={!isEditable}
              />

              {/* Show drag handle only when not in split mode */}
              {selectedAction !== 'split' && (
                <span
                  className={`material-icons drag-handle mr-drag-handle ${isEditable ? "" : "mr-drag-handle--disabled"}`}
                  {...attributes}
                  {...listeners}
                >
                  drag_indicator
                </span>
              )}

              {/* Icons */}
              <div className="d-flex gap-1">
                {employee.isPWD && (
                  <img
                    src="images/icons/pwd.png"
                    alt="PWD"
                    className="mr-icon-img-16"
                    title="PWD"
                  />
                )}
                {employee.isOOB && (
                  <img
                    src="images/icons/oob.png"
                    alt="OOB"
                    className="mr-icon-img-16"
                    title="OOB"
                  />
                )}
                {employee.isNMT && (
                  <img
                    src="images/icons/non-motorable.png"
                    alt="NMT"
                    className="mr-icon-img-16"
                    title="Non Motorable"
                  />
                )}
                {employee.isMedical && (
                  <img
                    src="images/icons/medical.png"
                    alt="Medical"
                    className="mr-icon-img-16"
                    title="Medical Required"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Employee */}
          <div className="col-2">
            {`${employee.empCode} - ${employee.empName}`}
            {employee.isNewAdded && (
              <span
                className="badge ms-2 mr-badge-new"
                data-pr-tooltip="Added via Replication Exception"
                data-pr-position="top"
              >
                NEW
              </span>
            )}
          </div>

          {/* Column 3: Gender */}
          <div className="col-1">
            <span className="me-2">
              {employee.Gender === "M" ? (
                <span className="badge bg-primary-subtle rounded-pill text-dark">
                  M
                </span>
              ) : employee.Gender === "F" ? (
                <span className="badge bg-danger-subtle rounded-pill text-dark">
                  F
                </span>
              ) : null}
            </span>
          </div>

          {/* Column 4 & 5: Address & Location */}
          <div className="col-2">
            <span
              data-pr-tooltip={employee.address || ""}
              data-pr-position="top"
              className="mr-ellipsis">
              {employee.address || ""}
            </span>
          </div>
          <div className="col-2">
            <span
              data-pr-tooltip={employee.Location || ""}
              data-pr-position="top"
              className="mr-ellipsis">
              {employee.Location || ""}
            </span>
          </div>

          {/* Column 6 & 7: Shift & Trip */}
          <div className="col-1">{employee.Shift}</div>
          <div className="col-1">{employee.tripType}</div>

          {/* Column 8: Stop */}
          <div className="col-1">
            <InputText
              value={employee.stopNo} className="w-100"
              readOnly
            />
          </div>

          {/* Column 9: ETA */}
          <div className="col-1">
            <InputText
              value={`${employee.ETAhh || "00"}:${employee.ETAmm || "00"}`}
              className="mr-eta-input"
              readOnly
            />
          </div>
        </div>
      </div>
    );
  }
);

export default DraggableEmployeeRow;
