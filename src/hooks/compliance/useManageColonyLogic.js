import { useState, useCallback, useEffect } from "react";
import { toastService } from "../../services/toastService";
import sessionManager from "../../utils/SessionManager";
import {
  useFacilitiesQuery,
  useRouteSeqQuery,
  useCitiesQuery,
  useZonesQuery,
  useDeleteColonyMutation,
  useMoveColonyMutation,
  useUpdateColonyMutation,
  useSaveColonyMutation,
  useSplitRouteClusterMutation,
} from "./useManageColonyQueries";

/**
 * useManageColonyLogic
 *
 * Controller hook for ManageColony — separates business logic from UI.
 * Manages:
 *   1. Facility selection + auto-select
 *   2. Route sequence data (via TanStack Query)
 *   3. Cut/Paste (Move Colony) state machine
 *   4. Delete with confirmation
 *   5. Edit sidebar state
 */
const useManageColonyLogic = () => {
  const session = sessionManager.getUserSession();
  const UserId = session.ID;
  const userLocationId = session.locationId;

  // --- Filter State ---
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);

  // --- Expanded rows ---
  const [expandedRows, setExpandedRows] = useState({});

  // --- Cut/Paste State Machine ---
  const [cutItem, setCutItem] = useState(null); // { Id, RouteID, rowData }

  // --- Edit Sidebar State ---
  const [editSidebarOpen, setEditSidebarOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // --- Add Sidebar State ---
  const [addSidebarOpen, setAddSidebarOpen] = useState(false);
  const [addingTargetPos, setAddingTargetPos] = useState(null); // The row item to insert after
  const [addingItem, setAddingItem] = useState({
    ZoneName: "",
    City: "",
    Colony: "",
    SubColony: "",
    Metro: "False", // Default dropdown value
    travelTime: "",
    travelKm: ""
  });

  // --- Delete Confirmation ---
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  // --- Multi-selection for floating panel ---
  const [selectedItems, setSelectedItems] = useState(new Map()); // Map<Id, rowData>

  // --- Split Confirmation ---
  const [splitDialogVisible, setSplitDialogVisible] = useState(false);
  const [pendingSplitItems, setPendingSplitItems] = useState([]);

  // --- Move Mode ---
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [showMoveConfirmDialog, setShowMoveConfirmDialog] = useState(false);
  const [pendingMoveOperation, setPendingMoveOperation] = useState(null); // { items, targetItem }

  // --- Pagination ---
  const [first, setFirst] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // --- Data Fetching ---
  const { data: facilities = [], isLoading: isFacilitiesLoading } =
    useFacilitiesQuery(UserId);

  const {
    data: routeSeqData = [],
    isLoading: isRouteSeqLoading,
    isFetching: isRouteSeqFetching,
  } = useRouteSeqQuery(selectedFacility, isSearchEnabled);

  // --- Cities and Zones for edit form ---
  const { data: cities = [] } = useCitiesQuery(
    userLocationId,
    selectedFacility,
  );
  const { data: zones = [] } = useZonesQuery(userLocationId, selectedFacility);

  // --- Mutations ---
  const deleteColonyMutation = useDeleteColonyMutation();
  const moveColonyMutation = useMoveColonyMutation();
  const updateColonyMutation = useUpdateColonyMutation();
  const saveColonyMutation = useSaveColonyMutation();
  const splitClusterMutation = useSplitRouteClusterMutation();

  // --- Auto-select facility on load ---
  useEffect(() => {
    if (facilities.length > 0 && selectedFacility === null) {
      const defaultFacility = facilities.find(
        (fac) =>
          fac.Id == userLocationId ||
          fac.Id?.toString() === userLocationId?.toString(),
      );
      const facilityId = defaultFacility
        ? defaultFacility.Id
        : facilities[0].Id;
      setSelectedFacility(facilityId);
      setIsSearchEnabled(true);
      setHasSearched(true);
    }
  }, [facilities, selectedFacility, userLocationId]);

  // --- Deactivate Move Mode when selection clears ---
  useEffect(() => {
    if (selectedItems.size === 0 && isMoveMode) {
      setIsMoveMode(false);
    }
  }, [selectedItems.size, isMoveMode]);

  // --- Actions ---
  const handleFacilityChange = useCallback((facilityId) => {
    setSelectedFacility(facilityId);
    setExpandedRows({});
    setCutItem(null);
    setIsSearchEnabled(true);
    setHasSearched(true);
    setFirst(0);
  }, []);

  const handleToggleRow = useCallback((rowData) => {
    const rowId = rowData.RouteID;
    setExpandedRows((prev) => {
      const next = { ...prev };
      if (next[rowId]) {
        delete next[rowId];
      } else {
        next[rowId] = true;
      }
      return next;
    });
  }, []);

  const onPageChange = useCallback((event) => {
    setFirst(event.first);
    setRowsPerPage(event.rows);
  }, []);

  // --- Cut / Paste ---
  // --- Selection (floating panel) ---
  const handleItemSelection = useCallback((rowData) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      if (next.has(rowData.Id)) {
        next.delete(rowData.Id);
      } else {
        next.set(rowData.Id, { ...rowData });
      }
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedItems(new Map());
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    const entries = Array.from(selectedItems.entries());
    if (entries.length === 0) return;
    try {
      for (const [id] of entries) {
        await deleteColonyMutation.mutateAsync({ ID: id, UserID: UserId });
      }
      toastService.success(
        `${entries.length} ${entries.length === 1 ? "colony" : "colonies"} deleted successfully!`,
      );
      setSelectedItems(new Map());
    } catch (error) {
      console.error("Error deleting selected colonies:", error);
      toastService.error("Failed to delete selected colonies.");
    }
  }, [selectedItems, deleteColonyMutation, UserId]);

  // --- Drag & Drop reorder (replaces cut/paste buttons) ---
  const handleDragReorder = useCallback(
    async (sourceRow, targetRow) => {
      if (!sourceRow || !targetRow || sourceRow.Id === targetRow.Id) return;
      try {
        await moveColonyMutation.mutateAsync({
          prvID: sourceRow.Id,
          newID: targetRow.Id,
          UserID: UserId,
        });
        toastService.success("Colony reordered successfully!");
      } catch (error) {
        console.error("Error reordering colony:", error);
        toastService.error("Failed to reorder colony.");
      }
    },
    [moveColonyMutation, UserId],
  );

  const handleCut = useCallback((item) => {
    setCutItem(item);
    toastService.info(
      `Colony "${item.Colony || item.SubColony || "Row"}" selected. Now click Paste on the target position.`,
    );
  }, []);

  const handlePaste = useCallback(
    async (targetItem) => {
      if (!cutItem) {
        toastService.warn("Please cut a colony first.");
        return;
      }
      try {
        await moveColonyMutation.mutateAsync({
          prvID: cutItem.Id,
          newID: targetItem.Id,
          UserID: UserId,
        });
        toastService.success("Colony moved successfully!");
        setCutItem(null);
      } catch (error) {
        console.error("Error moving colony:", error);
        toastService.error("Failed to move colony.");
      }
    },
    [cutItem, moveColonyMutation, UserId],
  );

  const handleCancelCut = useCallback(() => {
    setCutItem(null);
    toastService.info("Move cancelled.");
  }, []);

  // --- Delete ---
  const handleDeleteClick = useCallback((item) => {
    setDeletingItem(item);
    setDeleteDialogVisible(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingItem) return;
    try {
      await deleteColonyMutation.mutateAsync({
        ID: deletingItem.Id,
        UserID: UserId,
      });
      // Remove the deleted item from the floating panel selection
      setSelectedItems((prev) => {
        const next = new Map(prev);
        next.delete(deletingItem.Id);
        return next;
      });
      toastService.success("Colony deleted successfully!");
    } catch (error) {
      console.error("Error deleting colony:", error);
      toastService.error("Failed to delete colony.");
    } finally {
      setDeleteDialogVisible(false);
      setDeletingItem(null);
    }
  }, [deletingItem, deleteColonyMutation, UserId]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogVisible(false);
    setDeletingItem(null);
  }, []);

  // --- Edit Sidebar ---
  const handleEditClick = useCallback((item) => {
    const isMetroTrue = item.Metro === "Yes" || item.Metro === true || item.Metro === "True";
    setEditingItem({ ...item, Metro: isMetroTrue ? "True" : "False" });
    setEditSidebarOpen(true);
  }, []);

  const handleEditSave = useCallback(async () => {
    if (!editingItem) return;
    try {
      await updateColonyMutation.mutateAsync({
        ID: editingItem.Id,
        zoneName: editingItem.ZoneName,
        Bus: false,
        Metro: editingItem.Metro === "True" || editingItem.Metro === true,
        travelTime: parseInt(editingItem.travelTime) || 0,
        travelKm: parseFloat(editingItem.travelKm) || 0,
        userID: UserId,
        FacilityId: selectedFacility,
        Toll: 0,
        colony: editingItem.Colony,
        SubColony: editingItem.SubColony,
      });
      toastService.success("Colony updated successfully!");
      setEditSidebarOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Error updating colony:", error);
      toastService.error("Failed to update colony.");
    }
  }, [editingItem, updateColonyMutation, UserId, selectedFacility]);

  const handleEditCancel = useCallback(() => {
    setEditSidebarOpen(false);
    setEditingItem(null);
  }, []);

  const handleEditFieldChange = useCallback((field, value) => {
    setEditingItem((prev) => (prev ? { ...prev, [field]: value } : null));
  }, []);

  // --- Add Sidebar ---
  const handleAddClick = useCallback((targetItem) => {
    setAddingTargetPos(targetItem);
    // Reset form to defaults, optionally inheriting Zone/City from targetItem for convenience
    setAddingItem({
      ZoneName: targetItem?.ZoneName || (zones.length > 0 ? zones[0].zoneName || zones[0].ZoneName : ""),
      City: targetItem?.City || (cities.length > 0 ? cities[0].City || cities[0].city : ""),
      Colony: "",
      SubColony: "",
      Metro: "False",
      travelTime: "",
      travelKm: ""
    });
    setAddSidebarOpen(true);
  }, [zones, cities]);

  const handleAddSave = useCallback(async () => {
    if (!addingTargetPos) return;
    try {
      await saveColonyMutation.mutateAsync({
        ID: addingTargetPos.Id, // Insert relative to this sequence ID
        city: addingItem.City,
        zoneName: addingItem.ZoneName,
        Bus: false,
        Metro: addingItem.Metro === "True" || addingItem.Metro === true,
        travelTime: parseInt(addingItem.travelTime) || 0,
        travelKm: parseFloat(addingItem.travelKm) || 0,
        userID: UserId,
        FacilityId: selectedFacility,
        Toll: 0,
        colony: addingItem.Colony,
        SubColony: addingItem.SubColony,
      });
      toastService.success("New colony added successfully!");
      setAddSidebarOpen(false);
      setAddingTargetPos(null);
    } catch (error) {
      console.error("Error saving new colony:", error);
      toastService.error("Failed to add colony.");
    }
  }, [addingItem, addingTargetPos, saveColonyMutation, UserId, selectedFacility]);

  const handleAddCancel = useCallback(() => {
    setAddSidebarOpen(false);
    setAddingTargetPos(null);
  }, []);

  const handleAddFieldChange = useCallback((field, value) => {
    setAddingItem((prev) => ({ ...prev, [field]: value }));
  }, []);

  // --- Split Route ---
  const handleSplitClick = useCallback(() => {
    if (selectedItems.size === 0) {
      toastService.warn("Please select at least one colony to split.");
      return;
    }
    setPendingSplitItems(Array.from(selectedItems.values()));
    setSplitDialogVisible(true);
  }, [selectedItems]);

  const handleSplitConfirm = useCallback(async () => {
    if (pendingSplitItems.length === 0) return;
    try {
      const pointsID = pendingSplitItems.map((item) => item.Id).join(",");
      const response = await splitClusterMutation.mutateAsync({
        PointsID: pointsID,
        UserID: UserId,
      });
      // API returns the new route number
      const parsed = typeof response === 'string' ? JSON.parse(response) : response;
      const newRouteNo = Array.isArray(parsed) && parsed.length > 0
        ? parsed[0].Routeno || parsed[0].routeno
        : null;
      if (newRouteNo) {
        toastService.success(`New Route Created with Number ${newRouteNo}.`);
      } else {
        toastService.success("Route split successfully!");
      }
      setSelectedItems(new Map());
    } catch (error) {
      console.error("Error splitting route cluster:", error);
      toastService.error("Failed to split route cluster.");
    } finally {
      setSplitDialogVisible(false);
      setPendingSplitItems([]);
    }
  }, [pendingSplitItems, splitClusterMutation, UserId]);

  const handleSplitCancel = useCallback(() => {
    setSplitDialogVisible(false);
    setPendingSplitItems([]);
  }, []);

  // --- Move Mode ---
  const handleToggleMoveMode = useCallback(() => {
    setIsMoveMode((prev) => {
      const next = !prev;
      if (next) {
        toastService.info("Move mode active — click any colony to move selected items there.");
      } else {
        toastService.info("Move mode deactivated.");
      }
      return next;
    });
  }, []);

  const handleMoveTarget = useCallback(
    (targetItem) => {
      if (!isMoveMode || selectedItems.size === 0) return;
      // Don't allow moving onto a selected item
      if (selectedItems.has(targetItem.Id)) {
        toastService.warn("Cannot move to a selected colony. Choose a different target.");
        return;
      }
      setPendingMoveOperation({
        items: Array.from(selectedItems.values()),
        targetItem,
      });
      setShowMoveConfirmDialog(true);
    },
    [isMoveMode, selectedItems],
  );

  const handleMoveConfirm = useCallback(async () => {
    if (!pendingMoveOperation) return;
    const { items, targetItem } = pendingMoveOperation;
    try {
      for (const item of items) {
        await moveColonyMutation.mutateAsync({
          prvID: item.Id,
          newID: targetItem.Id,
          UserID: UserId,
        });
      }
      toastService.success(
        `${items.length} ${items.length === 1 ? "colony" : "colonies"} moved successfully!`,
      );
      setSelectedItems(new Map());
      setIsMoveMode(false);
    } catch (error) {
      console.error("Error moving colonies:", error);
      toastService.error("Failed to move colonies.");
    } finally {
      setShowMoveConfirmDialog(false);
      setPendingMoveOperation(null);
    }
  }, [pendingMoveOperation, moveColonyMutation, UserId]);

  const handleMoveCancel = useCallback(() => {
    setShowMoveConfirmDialog(false);
    setPendingMoveOperation(null);
  }, []);

  // --- Computed ---
  const isLoading =
    isFacilitiesLoading ||
    isRouteSeqLoading ||
    isRouteSeqFetching ||
    deleteColonyMutation.isPending ||
    moveColonyMutation.isPending ||
    updateColonyMutation.isPending ||
    saveColonyMutation.isPending ||
    splitClusterMutation.isPending;

  return {
    data: {
      facilities,
      routeSeqData,
      cities,
      zones,
      isLoading,
    },
    state: {
      selectedFacility,
      hasSearched,
      expandedRows,
      cutItem,
      editSidebarOpen,
      editingItem,
      addSidebarOpen,
      addingTargetPos,
      addingItem,
      deleteDialogVisible,
      deletingItem,
      splitDialogVisible,
      pendingSplitItems,
      isMoveMode,
      showMoveConfirmDialog,
      pendingMoveOperation,
      first,
      rowsPerPage,
      userLocationId,
      selectedItems,
    },
    actions: {
      handleFacilityChange,
      handleToggleRow,
      onPageChange,
      // Cut/Paste (legacy, kept for compatibility)
      handleCut,
      handlePaste,
      handleCancelCut,
      // Drag & Drop reorder
      handleDragReorder,
      // Delete
      handleDeleteClick,
      handleDeleteConfirm,
      handleDeleteCancel,
      // Multi-selection (floating panel)
      handleItemSelection,
      handleClearSelection,
      handleDeleteSelected,
      // Edit Sidebar
      handleEditClick,
      handleEditSave,
      handleEditCancel,
      handleEditFieldChange,
      // Add Sidebar
      handleAddClick,
      handleAddSave,
      handleAddCancel,
      handleAddFieldChange,
      // Split Route
      handleSplitClick,
      handleSplitConfirm,
      handleSplitCancel,
      // Move Mode
      handleToggleMoveMode,
      handleMoveTarget,
      handleMoveConfirm,
      handleMoveCancel,
    },
  };
};

export default useManageColonyLogic;
