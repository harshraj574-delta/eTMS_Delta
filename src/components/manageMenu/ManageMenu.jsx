import React, { useMemo, useEffect, useState, useRef } from 'react';
import Loader from "../common/Loader";
import Header from "../Master/Header";
import Sidebar from "../Master/SidebarMenu";
import sessionManager from "../../utils/SessionManager";
import { useQueryClient } from "@tanstack/react-query";
import {
    useMainMenuQuery,
    useSubMenusQuery,
    extractMenuResult,
    manageMenuKeys,
    useInsertMenuMutation,
    useUpdateMenuMutation,
    useDeleteMenuMutation,
} from "./hooks/useManageMenuQueries";

// Expanded submenu table — a live query observer, so mutation invalidation
// refreshes it automatically after add/edit/delete.
const SubMenuSection = ({ menuId, onAddSubMenu, onEditSubMenu, onDeleteSubmenu, trashIcon }) => {
    const { data: childData = [], isLoading } = useSubMenusQuery(menuId);

    return (
        <div className="expanded-content">
            <div className="d-flex justify-content-start mb-3 mt-2 ms-3">
                <Button
                    className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
                    onClick={() => onAddSubMenu(menuId)}
                >
                    <span className="material-icons me-1" style={{ fontSize: "18px" }}>
                        add_circle
                    </span>
                    New SubMenu
                </Button>
            </div>
            {isLoading ? (
                <p className="text-center text-muted m-3">Loading submenus...</p>
            ) : childData.length === 0 ? (
                <p className="text-center text-muted m-3">
                    No submenus found
                </p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-sm table-bordered mb-0 nested-menu-table custom-html-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left" }}>SubMenu Text</th>
                                <th style={{ textAlign: "left" }}>Description</th>
                                <th>Parent Menu</th>
                                <th style={{ textAlign: "left" }}>Navigate URL</th>
                                <th style={{ width: "100px" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {childData.map((childRow, cIdx) => (
                                <tr
                                    key={cIdx}
                                    className={`${
                                        cIdx % 2 !== 0 ? "ota-row-odd" : ""
                                    } ota-row-hover`}
                                >
                                    <td style={{ textAlign: "left" }}>
                                        {childRow.TEXT}
                                    </td>
                                    <td style={{ textAlign: "left" }}>
                                        {childRow.DESCRIPTION}
                                    </td>
                                    <td>
                                        {childRow.mtext}
                                    </td>
                                    <td style={{ textAlign: "left" }}>
                                        {childRow.NAVIGATEURL}
                                    </td>
                                    <td>
                                        <span
                                            className="material-icons action-icon edit"
                                            title="Edit"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditSubMenu(childRow);
                                            }}
                                        >
                                            edit
                                        </span>
                                        <img
                                            src={trashIcon}
                                            alt="Delete"
                                            className="action-icon delete"
                                            title="Delete"
                                            style={{ width: '22px', height: '22px' }}
                                            onClick={(e) => onDeleteSubmenu(e, childRow, menuId)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
import MasterSidebar from "../Master/MasterSidebar";
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { toastService } from '../../services/toastService';
import TableToolbar from "../common/TableToolbar";
import { MultiSelect } from "primereact/multiselect";
import { OverlayPanel } from "primereact/overlaypanel";
import "../common/CustomDataTable.css";
import trashIcon from "../../assets/trash-can-outline.png";

const ManageMenu = () => {
    const queryClient = useQueryClient();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filteredData, setFilteredData] = useState([]);

    // ── Server state ─────────────────────────────────────────────────────────
    const {
        data = [],
        isLoading: menuLoading,
        refetch: refetchMenus,
    } = useMainMenuQuery("Y");
    const insertMenuMutation = useInsertMenuMutation();
    const updateMenuMutation = useUpdateMenuMutation();
    const deleteMenuMutation = useDeleteMenuMutation();
    const [globalFilter, setGlobalFilter] = useState("");
    const [filters, setFilters] = useState({
        menuText: null
    });
    const [showNewSidebar, setShowNewSidebar] = useState(false);
    const [showEditSidebar, setShowEditSidebar] = useState(false);
    const [newText, setNewText] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [editingRow, setEditingRow] = useState(null);
    const [editText, setEditText] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editingSubMenu, setEditingSubMenu] = useState(null);
    const [editSubMenuText, setEditSubMenuText] = useState('');
    const [editSubMenuDescription, setEditSubMenuDescription] = useState('');
    const [editSubMenuNavigateUrl, setEditSubMenuNavigateUrl] = useState('');
    
    // Toolbar refs
    const op = useRef(null);
    const filterButtonRef = useRef(null);

    // Expansion state using index array (like OTAReport/RepScheduleSummery)
    const [expandedRows, setExpandedRows] = useState([]);
    const [showEditSubMenuSidebar, setShowEditSubMenuSidebar] = useState(false);
    // The parent-menu dropdown shows the same list as the table
    const parentMenuList = data;
    const [selectedParent, setSelectedParent] = useState(null);

    // Responsive Sidebar Width
    const getOffcanvasWidth = () => {
        if (typeof window !== "undefined") {
            if (window.innerWidth < 576) return "95%";
            if (window.innerWidth < 768) return "85%";
            if (window.innerWidth < 1024) return "60%";
            return "35%";
        }
        return "35%";
    };

    const [offcanvasWidth, setOffcanvasWidth] = useState(getOffcanvasWidth());

    useEffect(() => {
        const handleResize = () => {
            setOffcanvasWidth(getOffcanvasWidth());
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Filter logic
    useEffect(() => {
        applyFiltersAndSearch();
    }, [data, globalFilter, filters]);

    const applyFiltersAndSearch = () => {
        if (!data) {
            setFilteredData([]);
            return;
        }
        
        let filtered = [...data];

        // Apply advanced filters
        if (filters.menuText && filters.menuText.length > 0) {
            filtered = filtered.filter(item => filters.menuText.includes(item.Text));
        }

        // Apply global search
        if (globalFilter && globalFilter.trim() !== "") {
            const lowerQuery = globalFilter.toLowerCase();
            filtered = filtered.filter(item => {
                const textMatch = item.Text && String(item.Text).toLowerCase().includes(lowerQuery);
                const descMatch = item.Description && String(item.Description).toLowerCase().includes(lowerQuery);
                return textMatch || descMatch;
            });
        }
        setFilteredData(filtered);
    };

    const clearAdvancedFilters = () => {
        setFilters({ menuText: null });
        if (op.current) op.current.hide();
        toastService.info("Filters cleared");
    };
    
    const getUniqueValues = (field) => {
        const values = data.map((item) => item[field]).filter(Boolean);
        return [...new Set(values)].map((val) => ({ label: val, value: val }));
    };

    const handleSave = async () => {
        if (!newText || newText.trim() === "") {
            toastService.warn("Please enter the menu text.");
            return;
        }

        const params = {
            Text: newText,
            Description: newDescription,
            ParentID: null,
            NavigateUrl: ""
        };

        try {
            setLoading(true);
            const resp = await insertMenuMutation.mutateAsync(params);
            const result = extractMenuResult(resp);

            if (result === "0") {
                toastService.warn("This menu already exists.");
                return;
            }

            if (result === "1") {
                toastService.success("The menu has been saved successfully.");
                await refetchMenus();
                setNewText("");
                setNewDescription("");
                setShowNewSidebar(false);
                return;
            }

            toastService.warn("Unexpected response from the server.");
        } catch (err) {
            console.error("Error saving menu:", err);
            toastService.error("Unable to save the menu. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSave = async () => {
        if (!editText || editText.trim() === "") {
            toastService.warn("Please enter the menu text");
            return;
        }

        const params = {
            MenuID: editingRow?.MenuID || editingRow?.menuid,
            Text: editText,
            Description: editDescription,
            ParentID: null,
            NavigateUrl: ""
        };

        try {
            setLoading(true);
            const resp = await updateMenuMutation.mutateAsync(params);
            const result = extractMenuResult(resp);

            if (result === "0") {
                toastService.warn("This menu already exists");
                return;
            }

            if (result === "1") {
                toastService.success("The menu has been updated successfully");
                await refetchMenus();
                setEditText("");
                setEditDescription("");
                setEditingRow(null);
                setShowEditSidebar(false);
                return;
            }

            toastService.warn("The server returned an unexpected response. Please try again.");
        } catch (err) {
            console.error("Error updating menu:", err);
            toastService.error("Unable to update the menu. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (rowData) => {
        setEditingRow(rowData);
        setEditText(rowData?.Text || '');
        setEditDescription(rowData?.Description || '');
        setShowEditSidebar(true);
    };

    const extractMenuId = (row) => {
        if (!row) return null;
        return String(row?.MenuID ?? row?.menuid ?? row?.id ?? "");
    };

    // Toggle row expansion — data loads via useSubMenusQuery in SubMenuSection
    const toggleRowExpansion = (index) => {
        setExpandedRows((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
    };

    const handleDeleteSubmenu = async (e, rowData, parentMenuId) => {
        e.stopPropagation();
        const submenuId = rowData?.MenuID ?? rowData?.menuid ?? rowData?.ID ?? rowData?.MENUID;
        if (!submenuId) {
            toastService.error("Could not identify the submenu ID");
            return;
        }
        const ok = window.confirm("Are you sure you want to delete this submenu?");
        if (!ok) return;

        try {
            setLoading(true);
            await deleteMenuMutation.mutateAsync({ menuid: submenuId });
            // The expanded submenu query refetches via the mutation's invalidation
            toastService.success("Submenu deleted successfully");
        } catch (err) {
            console.error("Error deleting submenu:", err);
            toastService.error("Submenu deletion failed");
        } finally {
            setLoading(false);
        }
    };

    // Parent-menu options come from the cached main-menu query (same data
    // as the table) — no refetch needed to open the submenu editors.
    const handleEditSubMenu = (rowData) => {
        setEditingSubMenu(rowData);
        setEditSubMenuText(rowData?.TEXT || '');
        setEditSubMenuDescription(rowData?.DESCRIPTION || '');
        setEditSubMenuNavigateUrl(rowData?.NAVIGATEURL || '');
        setSelectedParent(rowData?.PARENTID ?? rowData?.parentid ?? null);
        setShowEditSubMenuSidebar(true);
    };

    const handleAddSubMenu = (parentMenuId) => {
        setSelectedParent(parentMenuId);
        setEditingSubMenu(null);
        setEditSubMenuText('');
        setEditSubMenuDescription('');
        setEditSubMenuNavigateUrl('');
        setShowEditSubMenuSidebar(true);
    };

    const handleUpdateSubMenuSave = async () => {
        if (!editSubMenuText || editSubMenuText.trim() === "") {
            toastService.warn("Please enter the submenu text.");
            return;
        }

        if (selectedParent === null || selectedParent === "") {
            toastService.warn("Please select a parent menu.");
            return;
        }

        const normalizedParent = isNaN(selectedParent) ? selectedParent : Number(selectedParent);

        const isUpdate = !!editingSubMenu;
        const submenuId =
            editingSubMenu?.MENUID ??
            editingSubMenu?.MenuID ??
            editingSubMenu?.menuid ??
            editingSubMenu?.ID ??
            editingSubMenu?.id;

        const params = {
            Text: editSubMenuText,
            Description: editSubMenuDescription,
            ParentID: normalizedParent,
            NavigateUrl: editSubMenuNavigateUrl
        };

        if (isUpdate) {
            params.MenuID = submenuId;
        }

        try {
            setLoading(true);

            const apiResponse = isUpdate
                ? await updateMenuMutation.mutateAsync(params)
                : await insertMenuMutation.mutateAsync(params);
            const result = extractMenuResult(apiResponse);

            if (result === "0") {
                toastService.warn("This submenu item already exists.");
                return;
            }

            // Expanded submenu tables refetch via the mutation's invalidation
            toastService.success(isUpdate ? "Submenu item updated successfully." : "Submenu item added successfully.");

            setEditSubMenuText("");
            setEditSubMenuDescription("");
            setEditSubMenuNavigateUrl("");
            setEditingSubMenu(null);
            setSelectedParent("");
            setShowEditSubMenuSidebar(false);
        } catch (err) {
            console.error("Error:", err);
            toastService.error(isUpdate ? "Failed to update the submenu item. Please try again." : "Failed to add the submenu item. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = (data, filename) => {
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(","),
            ...data.map((row) =>
                headers
                    .map((header) => {
                        const value = row[header];
                        if (value === null || value === undefined) return "";
                        const stringValue = String(value);
                        if (
                            stringValue.includes(",") ||
                            stringValue.includes('"') ||
                            stringValue.includes("\n")
                        ) {
                            return `"${stringValue.replace(/"/g, '""')}"`;
                        }
                        return stringValue;
                    })
                    .join(",")
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportExcel = () => {
        if (filteredData.length === 0) {
            toastService.warn("No data to export");
            return;
        }
        const fileName = `manage_menu_${new Date().toISOString().slice(0, 10)}`;
        exportToCSV(filteredData, fileName);
    };

    const renderToolbar = () => {
        return (
            <TableToolbar
                search={globalFilter}
                onSearch={(e) => setGlobalFilter(e.target.value)}
                onRefresh={() =>
                    // Refreshes the main table AND any expanded submenu tables
                    queryClient.invalidateQueries({ queryKey: manageMenuKeys.all })
                }
                onExport={exportExcel}
                showFilter={true}
                activeFilterCount={
                    filters.menuText && filters.menuText.length > 0 ? 1 : 0
                }
                overlayRef={op}
                filterButtonRef={filterButtonRef}
                filters={filters}
                setFilters={setFilters}
            >
                <div className="p-3">
                    <div className="row g-3">
                        <div className="col-12">
                            <label className="fw-bold mb-1">Menu Text</label>
                            <MultiSelect
                                value={filters.menuText}
                                options={getUniqueValues("Text")}
                                onChange={(e) =>
                                    setFilters({ ...filters, menuText: e.value })
                                }
                                placeholder="Select Menu Text"
                                className="w-100"
                                display="chip"
                            />
                        </div>
                        <div className="col-12 d-flex justify-content-end mt-3">
                            <Button
                                label="Clear all filters"
                                icon="pi pi-filter-slash"
                                className="p-button-outlined p-button-secondary w-100"
                                onClick={clearAdvancedFilters}
                                size="small"
                            />
                        </div>
                    </div>
                </div>
            </TableToolbar>
        );
    };

    return (
        <div>
            <Loader isVisible={loading || menuLoading} fullScreen={true} />
            <Header
                mainTitle="Super Admin"
                pageTitle={"Manage Menu"}
                showNewButton={true}
                onNewButtonClick={() => setShowNewSidebar(true)}
            />
            <Sidebar />

            <style>
                {`
                    .ota-row-odd > * {
                        background-color: #fafafa !important;
                    }
                    .ota-row-hover:hover > * {
                        background-color: #e9ecef !important;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    }
                    .menu-table thead th {
                        background-color: #f9f9fb !important;
                        font-weight: 800;
                        border: 0;
                        border-bottom: 1px solid #dee2e6;
                        padding: 12px 5px;
                        font-size: 13px;
                        text-align: center;
                        vertical-align: middle;
                        color: #545557;
                    }
                    .menu-table tbody td {
                        padding: 0.5rem;
                        border: 0;
                        border-bottom: 1px solid #dee2e6;
                        font-size: 0.875rem;
                        text-align: center;
                        vertical-align: middle;
                    }
                    .menu-table .table-light th {
                        background-color: #f9f9fb !important;
                    }
                    .nested-menu-table thead th {
                        background-color: #f9f9fb !important;
                        font-weight: 800;
                        border: 1px solid #dee2e6;
                        padding: 12px 5px;
                        font-size: 13px;
                        text-align: center;
                        color: #545557;
                    }
                    .nested-menu-table tbody td {
                        padding: 0.5rem;
                        border: 1px solid #dee2e6;
                        font-size: 0.8125rem;
                        text-align: center;
                    }
                    .expansion-icon {
                        color: #0d6efd;
                        font-size: 20px;
                        vertical-align: middle;
                        cursor: pointer;
                    }
                    .expansion-icon:hover {
                        color: #0a58ca;
                    }
                    .action-icon {
                        font-size: 20px;
                        cursor: pointer;
                        margin: 0 4px;
                    }
                    .action-icon.edit {
                        color: #1976d2;
                    }
                    .action-icon.edit:hover {
                        color: #1565c0;
                    }
                    .action-icon.delete {
                        color: #d32f2f;
                    }
                    .action-icon.delete:hover {
                        color: #c62828;
                    }
                `}
            </style>

            {/* Add Menu Sidebar */}
            <MasterSidebar
                show={showNewSidebar}
                onClose={() => setShowNewSidebar(false)}
                title="Add Menu"
                width={offcanvasWidth}
                footer={
                    <div className="offcanvas-footer">
                        <Button
                            label="Cancel"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowNewSidebar(false)}
                        />
                        <Button
                            label="Save"
                            className="btn btn-success ms-3"
                            onClick={handleSave}
                        />
                    </div>
                }
            >
                <div className="p-3">
                    <div className="mb-3">
                        <label className="form-label">Menu Text:</label>
                        <InputText
                            value={newText}
                            className="form-control"
                            onChange={(e) => setNewText(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Description:</label>
                        <InputText
                            value={newDescription}
                            className="form-control"
                            onChange={(e) => setNewDescription(e.target.value)}
                        />
                    </div>
                </div>
            </MasterSidebar>

            {/* Edit Menu Sidebar */}
            <MasterSidebar
                show={showEditSidebar}
                onClose={() => setShowEditSidebar(false)}
                title="Edit Menu"
                width={offcanvasWidth}
                footer={
                    <div className="offcanvas-footer">
                        <Button
                            label="Cancel"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowEditSidebar(false)}
                        />
                        <Button
                            label="Update"
                            className="btn btn-success ms-3"
                            onClick={handleUpdateSave}
                        />
                    </div>
                }
            >
                <div className="p-3">
                    <div className="mb-3">
                        <label className="form-label">Menu Text:</label>
                        <InputText
                            value={editText}
                            className="form-control"
                            onChange={(e) => setEditText(e.target.value)}
                            placeholder="Enter menu text"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Description:</label>
                        <InputText
                            value={editDescription}
                            className="form-control"
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Enter description"
                        />
                    </div>
                </div>
            </MasterSidebar>

            {/* Edit SubMenu Sidebar */}
            <MasterSidebar
                show={showEditSubMenuSidebar}
                onClose={() => setShowEditSubMenuSidebar(false)}
                title={`${editingSubMenu ? 'Edit' : 'Add'} SubMenu`}
                width={offcanvasWidth}
                footer={
                    <div className="offcanvas-footer">
                        <Button
                            label="Cancel"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowEditSubMenuSidebar(false)}
                        />
                        <Button
                            label={editingSubMenu ? "Update" : "Save"}
                            className="btn btn-success ms-3"
                            onClick={handleUpdateSubMenuSave}
                        />
                    </div>
                }
            >
                <div className="p-3">
                    <div className="mb-3">
                        <label className="form-label">SubMenu Text:</label>
                        <InputText
                            value={editSubMenuText}
                            className="form-control"
                            onChange={(e) => setEditSubMenuText(e.target.value)}
                            placeholder="Enter submenu text"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Description:</label>
                        <InputText
                            value={editSubMenuDescription}
                            className="form-control"
                            onChange={(e) => setEditSubMenuDescription(e.target.value)}
                            placeholder="Enter description"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Parent Menu:</label>
                        <select
                            className="form-select"
                            value={selectedParent || ""}
                            onChange={(e) => setSelectedParent(e.target.value)}
                        >
                            <option value="">Select Parent Menu</option>
                            {parentMenuList.map((item) => (
                                <option key={item.MenuID} value={item.MenuID}>
                                    {item.Text}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Navigate URL:</label>
                        <InputText
                            value={editSubMenuNavigateUrl}
                            className="form-control"
                            onChange={(e) => setEditSubMenuNavigateUrl(e.target.value)}
                            placeholder="Enter navigate URL"
                        />
                    </div>
                </div>
            </MasterSidebar>

            <style>{`
                .offcanvas-footer {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 1rem;
                    background-color: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    height: auto;
                }
                .offcanvas-body {
                    padding-bottom: 5.5rem !important;
                }
                .form-label {
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                }
            `}</style>

            <div className="middle">
                <div className="row">
                    <div className="col-12">
                        <div className="card_tb">
                            <div className="p-3">
                                {renderToolbar()}
                                <div className="table-responsive">
                                    <table className="table table-sm mb-0 menu-table custom-html-table">
                                        <thead className="table-light">
                                            <tr>
                                                <th style={{ width: "40px" }}></th>
                                                <th style={{ textAlign: "left" }}>Menu Text</th>
                                                <th style={{ textAlign: "left" }}>Menu Description</th>
                                                <th style={{ width: "100px" }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredData.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="text-center p-4">
                                                        {error ? `Error: ${error}` : "No records found"}
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredData.map((row, index) => {
                                                    const menuId = extractMenuId(row);
                                                    const isExpanded = expandedRows.includes(index);

                                                    return (
                                                        <React.Fragment key={index}>
                                                            <tr
                                                                className={`${
                                                                    index % 2 !== 0 ? "ota-row-odd" : ""
                                                                } ota-row-hover`}
                                                            >
                                                                <td>
                                                                    <a
                                                                        href="#!"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            toggleRowExpansion(index);
                                                                        }}
                                                                    >
                                                                        {isExpanded ? (
                                                                            <span className="material-icons expansion-icon">
                                                                                remove_circle
                                                                            </span>
                                                                        ) : (
                                                                            <span className="material-icons expansion-icon">
                                                                                add_circle
                                                                            </span>
                                                                        )}
                                                                    </a>
                                                                </td>
                                                                <td style={{ textAlign: "left" }}>
                                                                    {row.Text}
                                                                </td>
                                                                <td style={{ textAlign: "left" }}>
                                                                    {row.Description}
                                                                </td>
                                                                <td>
                                                                    <span
                                                                        className="material-icons action-icon edit"
                                                                        title="Edit"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleEdit(row);
                                                                        }}
                                                                    >
                                                                        edit
                                                                    </span>
                                                                </td>
                                                            </tr>

                                                            {isExpanded && (
                                                                <tr>
                                                                    <td colSpan={4} className="leftStrip p-2">
                                                                        <SubMenuSection
                                                                            menuId={menuId}
                                                                            onAddSubMenu={handleAddSubMenu}
                                                                            onEditSubMenu={handleEditSubMenu}
                                                                            onDeleteSubmenu={handleDeleteSubmenu}
                                                                            trashIcon={trashIcon}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageMenu;