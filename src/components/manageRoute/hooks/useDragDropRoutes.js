import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    closestCenter,
    useSensor,
    useSensors,
    PointerSensor,
    MouseSensor,
    TouchSensor,
    pointerWithin,
} from '@dnd-kit/core';
import { throttle } from 'lodash';
import { toastService } from '../../../services/toastService';
import { manageRouteKeys } from './useManageRouteQueries';

const AUTO_EXPAND_DELAY = 800;

/**
 * Drag-and-drop mechanics for the Manage Route table.
 *
 * Owns: dnd-kit sensors/collision detection, the active drag state,
 * drop-zone hover tracking, and hover-to-auto-expand of route rows.
 *
 * Server-affecting outcomes are delegated to the view:
 *  - onRequestDelete(employee, routeId): swipe-to-delete crossed the threshold
 *  - onRequestMove(pendingDragOperation): a drop needs user confirmation
 */
const useDragDropRoutes = ({
    selectedEmployees,
    selectedAction,
    selectionStartRoute,
    setSelectedEmployees,
    setSelectionStartRoute,
    expandedRows,
    setExpandedRows,
    swipeDeleteThreshold,
    onRequestDelete,
    onRequestMove,
}) => {
    const queryClient = useQueryClient();

    const [activeId, setActiveId] = useState(null);
    const [draggedEmployee, setDraggedEmployee] = useState(null);
    const [hoveredDropZone, setHoveredDropZone] = useState(null);
    const [autoExpandTimer, setAutoExpandTimer] = useState(null);
    const [hoveredRouteId, setHoveredRouteId] = useState(null);

    // Optimized sensors configuration
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3,
            },
        }),
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 3,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 100,
                tolerance: 5,
            },
        })
    );

    const customCollisionDetection = useCallback((args) => {
        const pointerIntersections = pointerWithin(args);

        if (pointerIntersections.length > 0) {
            return pointerIntersections;
        }

        return closestCenter(args);
    }, []);

    const throttledHandleDragOver = useMemo(
        () =>
            throttle((event) => {
                const { over } = event;
                if (
                    over &&
                    over.data.current &&
                    over.data.current.type === 'position'
                ) {
                    setHoveredDropZone(over.id);
                } else {
                    setHoveredDropZone(null);
                }
            }, 16),
        []
    );

    const handleDragStart = useCallback(
        (event) => {
            setActiveId(event.active.id);
            const activeData = event.active.data.current;

            if (activeData && activeData.type === 'employee') {
                setDraggedEmployee(activeData.employee);

                const employeeKey = `${activeData.sourceRouteId}-${activeData.employee.id}`;

                if (selectedAction === 'multiSelect') {
                    if (!selectedEmployees.has(employeeKey)) {
                        setSelectedEmployees((prev) => {
                            const newSelection = new Set(prev);
                            newSelection.add(employeeKey);
                            return newSelection;
                        });
                        if (!selectionStartRoute) {
                            setSelectionStartRoute(activeData.sourceRouteId);
                        }
                    }
                } else {
                    setSelectedEmployees(new Set([employeeKey]));
                    setSelectionStartRoute(activeData.sourceRouteId);
                }
            }
        },
        [selectedEmployees, selectedAction, selectionStartRoute, setSelectedEmployees, setSelectionStartRoute]
    );

    const handleDragEnd = useCallback(
        async (event) => {
            const { active, over, delta } = event;

            if (autoExpandTimer) {
                clearTimeout(autoExpandTimer);
                setAutoExpandTimer(null);
            }
            setHoveredRouteId(null);
            setActiveId(null);
            setDraggedEmployee(null);
            setHoveredDropZone(null);

            const activeData = active.data.current;

            // Swipe to delete logic
            if (
                delta.x > swipeDeleteThreshold &&
                activeData.type === 'employee' &&
                selectedAction !== 'split'
            ) {
                onRequestDelete(activeData.employee, activeData.sourceRouteId);
                return;
            }

            if (!over) {
                return;
            }

            const overData = over.data.current;

            if (
                activeData &&
                overData &&
                activeData.type === 'employee' &&
                overData.type === 'position'
            ) {
                const employeesToMove =
                    selectedEmployees.size > 0
                        ? Array.from(selectedEmployees)
                        : [`${activeData.sourceRouteId}-${activeData.employee.id}`];

                const targetRouteId = overData.targetRouteId;
                const targetPosition = overData.targetPosition;
                const sourceRoutes = [
                    ...new Set(employeesToMove.map((key) => key.split('-')[0])),
                ];

                let shouldShowConfirmation = false;
                let isSameRouteReorder = false;

                if (sourceRoutes.some((routeId) => routeId !== targetRouteId)) {
                    shouldShowConfirmation = true;
                } else if (
                    sourceRoutes.length === 1 &&
                    sourceRoutes[0] === targetRouteId
                ) {
                    const routeEmployees = queryClient.getQueryData(manageRouteKeys.routeDetails(targetRouteId)) || [];
                    const currentPositions = employeesToMove.map((employeeKey) => {
                        const [, employeeId] = employeeKey.split('-');
                        const employeeIndex = routeEmployees.findIndex(
                            (emp) => String(emp.id || emp.empID || emp.empId) === employeeId
                        );
                        return employeeIndex + 1;
                    });

                    const isSingleEmployee = employeesToMove.length === 1;
                    const isSamePosition =
                        isSingleEmployee && currentPositions[0] === targetPosition;
                    const isNoOp = isSingleEmployee && isSamePosition;

                    if (!isNoOp) {
                        shouldShowConfirmation = true;
                        isSameRouteReorder = true;
                    }
                }

                if (shouldShowConfirmation) {
                    onRequestMove({
                        employeeKeys: employeesToMove,
                        targetRouteId: targetRouteId,
                        targetPosition: targetPosition,
                        activeData,
                        overData,
                        isCrossPageDrop: false,
                        isSameRouteReorder: isSameRouteReorder,
                    });
                }
            }
        },
        [selectedEmployees, autoExpandTimer, queryClient, selectedAction, swipeDeleteThreshold, onRequestDelete, onRequestMove]
    );

    // Auto-expand a collapsed route row while dragging over it
    const handleRouteRowEnter = useCallback(
        (event) => {
            if (!activeId) return;

            const routeId = event.data.RouteID;
            setHoveredRouteId(routeId);

            if (autoExpandTimer) {
                clearTimeout(autoExpandTimer);
            }

            if (expandedRows && expandedRows[routeId]) {
                return;
            }

            const timer = setTimeout(() => {
                setExpandedRows((prev) => ({
                    ...prev,
                    [routeId]: true,
                }));

                toastService.info(`Route ${routeId} expanded for dropping`);
            }, AUTO_EXPAND_DELAY);

            setAutoExpandTimer(timer);
        },
        [activeId, expandedRows, autoExpandTimer, setExpandedRows]
    );

    const handleRouteRowLeave = useCallback(() => {
        if (autoExpandTimer) {
            clearTimeout(autoExpandTimer);
            setAutoExpandTimer(null);
        }
        setHoveredRouteId(null);
    }, [autoExpandTimer]);

    useEffect(() => {
        return () => {
            if (autoExpandTimer) {
                clearTimeout(autoExpandTimer);
            }
        };
    }, [autoExpandTimer]);

    return {
        activeId,
        draggedEmployee,
        hoveredDropZone,
        hoveredRouteId,
        sensors,
        customCollisionDetection,
        throttledHandleDragOver,
        handleDragStart,
        handleDragEnd,
        handleRouteRowEnter,
        handleRouteRowLeave,
    };
};

export default useDragDropRoutes;
