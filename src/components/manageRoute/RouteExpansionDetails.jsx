import React from "react";
import { useRouteDetailsQuery } from "./hooks/useManageRouteQueries";
import { CrossPageDropZone, DropZoneIndicator } from "./DropZones";
import DraggableEmployeeRow from "./DraggableEmployeeRow";

// Expanded view of one route: fetches its employees from the cache/API
// and renders draggable rows interleaved with drop zones.
const RouteExpansionDetails = React.memo(({
  routeId,
  isEditable,
  crossPageDropMode,
  selectedEmployees,
  selectedAction,
  activeId,
  hoveredDropZone,
  onCrossPageDrop,
  onEmployeeSelection,
  onDeleteEmployee,
  onAddEmployee,
}) => {
  const { data: employees = [], isLoading, isError } = useRouteDetailsQuery(routeId);

  // Memoize empty check to prevent flickering
  const hasEmployees = employees && employees.length > 0;

  if (isLoading) {
      return (
        <div className="bg-custom">
          <div className="p-4 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading route details...</p>
          </div>
        </div>
      );
  }

  if (isError) {
      return (
        <div className="bg-custom p-3">
          <div className="alert alert-danger">Failed to load route details.</div>
        </div>
      );
  }

  return (
        <div className="bg-custom">
          {!isEditable && (
            <div className="alert alert-warning text-center small p-2 mb-0">
              This route is finalized and is now view-only. All operations are disabled.
            </div>
          )}
          <div className="p-0">
            {/* Flexbox Header - Replaces <thead> */}
            <div className="row mr-exp-header">
              <div className="col-1">Select/Actions</div>
              <div className="col-2">Employee</div>
              <div className="col-1"></div>
              <div className="col-2">Address</div>
              <div className="col-2">Location</div>
              <div className="col-1">Shift</div>
              <div className="col-1">Trip</div>
              <div className="col-1">Stop</div>
              <div className="col-1">ETA</div>
            </div>

            {/* Body Container - Replaces <tbody> */}
            <div>
              {!hasEmployees ? (
                <>
                  <div>
                    {isEditable && (
                      <CrossPageDropZone
                        routeId={routeId}
                        position={1}
                        isActive={crossPageDropMode}
                        onDrop={onCrossPageDrop}
                        selectedEmployees={selectedEmployees}
                      />
                    )}
                    {isEditable && selectedAction !== 'split' && (
                      <DropZoneIndicator
                        routeId={routeId}
                        position={1}
                        isOver={
                          activeId &&
                          hoveredDropZone ===
                          `dropzone-${routeId}-1`
                        }
                      />
                    )}
                  </div>
                  <div className="text-center p-4 mr-text-dim">
                    No employees in this route.
                    {isEditable && crossPageDropMode ? (
                      <span className="text-primary">
                        {" "}
                        Click above to drop employees here.
                      </span>
                    ) : isEditable && selectedAction === 'split' ? (
                      <span>
                        {" "}
                        Select another route with employees to split.
                      </span>
                    ) : isEditable ? (
                      <span>
                        {" "}
                        Drag employees from other routes to add them here.
                      </span>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    {isEditable && (
                      <CrossPageDropZone
                        routeId={routeId}
                        position={1}
                        isActive={crossPageDropMode}
                        onDrop={onCrossPageDrop}
                        selectedEmployees={selectedEmployees}
                      />
                    )}
                    {isEditable && selectedAction !== 'split' && (
                      <DropZoneIndicator
                        routeId={routeId}
                        position={1}
                        isOver={
                          activeId &&
                          hoveredDropZone ===
                          `dropzone-${routeId}-1`
                        }
                      />
                    )}
                  </div>

                  {employees.map((employee, index) => {
                    const employeeKey = `${routeId}-${employee.id || employee.empID}`;
                    const isSelected = selectedEmployees.has(employeeKey);

                    return (
                      <React.Fragment key={employeeKey}>
                        <DraggableEmployeeRow
                          employee={employee}
                          routeId={routeId}
                          index={index}
                          isSelected={isSelected}
                          onSelectionChange={onEmployeeSelection}
                          selectedCount={selectedEmployees.size}
                          activeId={activeId}
                          selectedEmployees={selectedEmployees}
                          isDragInProgress={!!activeId}
                          selectedAction={selectedAction}
                          isEditable={isEditable}
                          onDeleteEmployee={onDeleteEmployee}
                        />
                        {isEditable && selectedAction !== 'split' && (
                          <div>
                            <CrossPageDropZone
                              routeId={routeId}
                              position={index + 2}
                              isActive={crossPageDropMode}
                              onDrop={onCrossPageDrop}
                              selectedEmployees={selectedEmployees}
                            />
                            <DropZoneIndicator
                              routeId={routeId}
                              position={index + 2}
                              isOver={
                                activeId &&
                                hoveredDropZone ===
                                `dropzone-${routeId}-${index + 2}`
                              }
                            />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer with Add Employee Button */}
            <div className="d-flex justify-content-between align-items-center p-3 border-top mr-exp-footer">
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success d-flex align-items-center gap-1 mr-btn-pill-sm"
                  onClick={() => onAddEmployee(routeId)}
                  disabled={!isEditable}
                >
                  <i className="material-icons mr-icon-16">
                    person_add
                  </i>
                  Add Employee
                </button>
              </div>

              <div className="text-muted mr-fs-12">
                <i className="material-icons me-1 mr-icon-14">
                  info
                </i>
                {employees.length} employee{employees.length !== 1 ? "s" : ""}{" "}
                in this route
              </div>
            </div>
          </div>
        </div>
  );
});

export default RouteExpansionDetails;
