import React, { useMemo, useEffect, useState } from 'react';
import Loader from "./common/Loader";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import ManageMenuService from '../services/compliance/ManageMenuService';
import sessionManager from "../utils/SessionManager";
import { Sidebar as PrimeSidebar } from 'primereact/sidebar';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { toastService } from '../services/toastService';
import { ToastContainer } from 'react-toastify';

const ManageMenu = () => {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
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
    
    // Expansion state using index array (like OTAReport/RepScheduleSummery)
    const [expandedRows, setExpandedRows] = useState([]);
    const [subMenuData, setSubMenuData] = useState({});
    const [showEditSubMenuSidebar, setShowEditSubMenuSidebar] = useState(false);
    const [parentMenuList, setParentMenuList] = useState([]);
    const [selectedParent, setSelectedParent] = useState(null);

    useEffect(() => {
        fetchMenuData();
    }, []);

    const fetchMenuData = async () => {
        try {
            setLoading(true);
            const isAdmin = "Y";
            const response = await ManageMenuService.SelectMainMenu({ IsAdmin: isAdmin });
            const parsed = typeof response === "string" ? JSON.parse(response) : response;
            const arr = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
            setData(arr);
        } catch (err) {
            console.error("Error fetching menu data:", err);
            toastService.error("Failed to load the menu data. Please try again.");
        } finally {
            setLoading(false);
        }
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
            const resp = await ManageMenuService.InsertMenu(params);

            let parsed;
            if (typeof resp === "string") {
                try {
                    parsed = JSON.parse(resp);
                } catch {
                    parsed = resp;
                }
            } else {
                parsed = resp;
            }

            if (Array.isArray(parsed) && parsed.length > 0) {
                parsed = parsed[0];
            }

            const result =
                parsed?.result ??
                parsed?.Result ??
                parsed?.RESULT ??
                parsed?.status ??
                parsed?.Status ??
                null;

            if (String(result) === "0") {
                toastService.warn("This menu already exists.");
                return;
            }

            if (String(result) === "1") {
                toastService.success("The menu has been saved successfully.");
                await fetchMenuData();
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
            const resp = await ManageMenuService.UpdateMenu(params);

            let parsed;
            if (typeof resp === "string") {
                try {
                    parsed = JSON.parse(resp);
                } catch {
                    parsed = resp;
                }
            } else {
                parsed = resp;
            }

            if (Array.isArray(parsed) && parsed.length > 0) {
                parsed = parsed[0];
            }

            const result =
                parsed?.result ??
                parsed?.Result ??
                parsed?.RESULT ??
                parsed?.status ??
                parsed?.Status ??
                null;

            if (String(result) === "0") {
                toastService.warn("This menu already exists");
                return;
            }

            if (String(result) === "1") {
                toastService.success("The menu has been updated successfully");
                await fetchMenuData();
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

    // Toggle row expansion (like OTAReport/RepScheduleSummery)
    const toggleRowExpansion = async (index, rowData) => {
        const newExpandedRows = [...expandedRows];
        const rowIndex = newExpandedRows.indexOf(index);

        if (rowIndex > -1) {
            // Collapse
            newExpandedRows.splice(rowIndex, 1);
            setExpandedRows(newExpandedRows);
            return;
        }

        // Expand
        const menuId = extractMenuId(rowData);

        // Fetch submenu data if not cached
        if (menuId && !subMenuData[menuId]) {
            try {
                setLoading(true);
                const resp = await ManageMenuService.SelectSubMenu({ menuid: menuId });
                const parsed = typeof resp === "string" ? JSON.parse(resp) : resp;
                const childArr = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
                setSubMenuData((prev) => ({ ...prev, [menuId]: childArr }));
            } catch (err) {
                console.error("Error fetching submenu data:", err);
                toastService.error("Could not load submenu data");
                setLoading(false);
                return;
            } finally {
                setLoading(false);
            }
        }

        newExpandedRows.push(index);
        setExpandedRows(newExpandedRows);
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
            await ManageMenuService.DeleteMenu({ menuid: submenuId });
            toastService.success("Submenu deleted successfully");

            try {
                const resp = await ManageMenuService.SelectSubMenu({ menuid: parentMenuId });
                const parsed = typeof resp === "string" ? JSON.parse(resp) : resp;
                const childArr = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
                setSubMenuData((prev) => ({ ...prev, [parentMenuId]: childArr }));
            } catch (refreshErr) {
                console.error("Error refreshing submenu after delete:", refreshErr);
            }
        } catch (err) {
            console.error("Error deleting submenu:", err);
            toastService.error("Submenu deletion failed");
        } finally {
            setLoading(false);
        }
    };

    const handleEditSubMenu = async (rowData) => {
        setEditingSubMenu(rowData);
        setEditSubMenuText(rowData?.TEXT || '');
        setEditSubMenuDescription(rowData?.DESCRIPTION || '');
        setEditSubMenuNavigateUrl(rowData?.NAVIGATEURL || '');

        try {
            const resp = await ManageMenuService.SelectMainMenu({ IsAdmin: "Y" });
            const parsed = typeof resp === "string" ? JSON.parse(resp) : resp;
            const arr = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
            setParentMenuList(arr);

            const parentId = rowData?.PARENTID ?? rowData?.parentid ?? null;
            setSelectedParent(parentId);
        } catch (err) {
            console.error("Error loading parent menus:", err);
            toastService.error("Could not fetch parent menus");
        }

        setShowEditSubMenuSidebar(true);
    };

    const handleAddSubMenu = async (parentMenuId) => {
        try {
            const resp = await ManageMenuService.SelectMainMenu({ IsAdmin: "Y" });
            const parsed = typeof resp === "string" ? JSON.parse(resp) : resp;
            const arr = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
            setParentMenuList(arr);
            setSelectedParent(parentMenuId);
        } catch (err) {
            console.error("Error loading parent menus:", err);
            toastService.error("Unable to load parent menus. Please try again.");
            return;
        }

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

            let apiResponse;
            if (isUpdate) {
                apiResponse = await ManageMenuService.UpdateMenu(params);
            } else {
                apiResponse = await ManageMenuService.InsertMenu(params);
            }

            let parsed;
            if (typeof apiResponse === "string") {
                try {
                    parsed = JSON.parse(apiResponse);
                } catch {
                    parsed = apiResponse;
                }
            } else {
                parsed = apiResponse;
            }

            if (Array.isArray(parsed) && parsed.length > 0) {
                parsed = parsed[0];
            }

            const result =
                parsed?.result ??
                parsed?.Result ??
                parsed?.RESULT ??
                parsed?.status ??
                parsed?.Status ??
                null;

            if (String(result) === "0") {
                toastService.warn("This submenu item already exists.");
                return;
            }

            toastService.success(isUpdate ? "Submenu item updated successfully." : "Submenu item added successfully.");

            try {
                const resp = await ManageMenuService.SelectSubMenu({ menuid: normalizedParent });
                let parsedChild = typeof resp === "string" ? JSON.parse(resp) : resp;
                const childArr = Array.isArray(parsedChild) ? parsedChild : parsedChild ? [parsedChild] : [];
                setSubMenuData((prev) => ({ ...prev, [String(normalizedParent)]: childArr }));
            } catch (refreshErr) {
                console.error("Error refreshing submenu list:", refreshErr);
            }

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

    return (
        <div>
            <Loader isVisible={loading} fullScreen={true} />
            <Header
                mainTitle="Super Admin"
                pageTitle={"Manage Menu"}
                showNewButton={true}
                onNewButtonClick={() => setShowNewSidebar(true)}
            />
            <Sidebar />
            <ToastContainer position="top-right" autoClose={3000} />

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
                        background-color: #f8f9fa !important;
                        font-weight: 600;
                        border: 1px solid #dee2e6;
                        padding: 0.5rem;
                        font-size: 0.875rem;
                        text-align: center;
                        vertical-align: middle;
                    }
                    .menu-table tbody td {
                        padding: 0.5rem;
                        border: 1px solid #dee2e6;
                        font-size: 0.875rem;
                        text-align: center;
                        vertical-align: middle;
                    }
                    .menu-table .table-light th {
                        background-color: #f8f9fa !important;
                    }
                    .nested-menu-table thead th {
                        background-color: #f8f9fa !important;
                        font-weight: 600;
                        border: 1px solid #dee2e6;
                        padding: 0.5rem;
                        font-size: 0.8125rem;
                        text-align: center;
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
            <PrimeSidebar
                visible={showNewSidebar}
                showCloseIcon={false}
                dismissable={false}
                position="right"
                style={{ width: "360px" }}
            >
                <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
                    <h6 className="sidebarTitle">Add Menu</h6>
                    <Button
                        icon="pi pi-times"
                        className="p-button-rounded p-button-text"
                        onClick={() => setShowNewSidebar(false)}
                    />
                </div>
                <div className="sidebarBody">
                    <div className="offcanvas-body px-4">
                        <div className="col-11 mb-3">
                            <label className="form-label">Menu Text:</label>
                            <InputText
                                value={newText}
                                className="form-control"
                                onChange={(e) => setNewText(e.target.value)}
                            />
                        </div>
                        <div className="col-11 mb-3">
                            <label className="form-label">Description:</label>
                            <InputText
                                value={newDescription}
                                className="form-control"
                                onChange={(e) => setNewDescription(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="sidebar-fixed-bottom position-absolute pe-3">
                    <div className="d-flex gap-3 justify-content-end">
                        <Button
                            label="Cancel"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowNewSidebar(false)}
                        />
                        <Button
                            label="Save"
                            className="btn btn-success"
                            onClick={handleSave}
                        />
                    </div>
                </div>
            </PrimeSidebar>

            {/* Edit Menu Sidebar */}
            <PrimeSidebar
                visible={showEditSidebar}
                showCloseIcon={false}
                dismissable={false}
                position="right"
                onHide={() => setShowEditSidebar(false)}
                style={{ width: "360px" }}
            >
                <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
                    <h6 className="sidebarTitle">Edit Menu</h6>
                    <Button
                        icon="pi pi-times"
                        className="p-button-rounded p-button-text"
                        onClick={() => setShowEditSidebar(false)}
                    />
                </div>
                <div className="sidebarBody">
                    <div className="offcanvas-body px-4">
                        <div className="col-11 mb-3">
                            <label className="form-label">Menu Text:</label>
                            <InputText
                                value={editText}
                                className="form-control"
                                onChange={(e) => setEditText(e.target.value)}
                                placeholder="Enter menu text"
                            />
                        </div>
                        <div className="col-11 mb-3">
                            <label className="form-label">Description:</label>
                            <InputText
                                value={editDescription}
                                className="form-control"
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Enter description"
                            />
                        </div>
                    </div>
                </div>
                <div className="sidebar-fixed-bottom position-absolute pe-3" style={{ bottom: 16, right: 16 }}>
                    <div className="d-flex gap-3 justify-content-end">
                        <Button
                            label="Cancel"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowEditSidebar(false)}
                        />
                        <Button
                            label="Update"
                            className="btn btn-success"
                            onClick={handleUpdateSave}
                        />
                    </div>
                </div>
            </PrimeSidebar>

            {/* Edit SubMenu Sidebar */}
            <PrimeSidebar
                visible={showEditSubMenuSidebar}
                showCloseIcon={false}
                dismissable={false}
                position="right"
                onHide={() => setShowEditSubMenuSidebar(false)}
                style={{ width: "360px" }}
            >
                <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
                    <h6 className="sidebarTitle">{editingSubMenu ? 'Edit' : 'Add'} SubMenu</h6>
                    <Button
                        icon="pi pi-times"
                        className="p-button-rounded p-button-text"
                        onClick={() => setShowEditSubMenuSidebar(false)}
                    />
                </div>
                <div className="sidebarBody">
                    <div className="offcanvas-body px-4">
                        <div className="col-11 mb-3">
                            <label className="form-label">SubMenu Text:</label>
                            <InputText
                                value={editSubMenuText}
                                className="form-control"
                                onChange={(e) => setEditSubMenuText(e.target.value)}
                                placeholder="Enter submenu text"
                            />
                        </div>
                        <div className="col-11 mb-3">
                            <label className="form-label">Description:</label>
                            <InputText
                                value={editSubMenuDescription}
                                className="form-control"
                                onChange={(e) => setEditSubMenuDescription(e.target.value)}
                                placeholder="Enter description"
                            />
                        </div>
                        <div className="col-11 mb-3">
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
                        <div className="col-11 mb-3">
                            <label className="form-label">Navigate URL:</label>
                            <InputText
                                value={editSubMenuNavigateUrl}
                                className="form-control"
                                onChange={(e) => setEditSubMenuNavigateUrl(e.target.value)}
                                placeholder="Enter navigate URL"
                            />
                        </div>
                    </div>
                </div>
                <div className="sidebar-fixed-bottom position-absolute pe-3" style={{ bottom: 16, right: 16 }}>
                    <div className="d-flex gap-3 justify-content-end">
                        <Button
                            label="Cancel"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowEditSubMenuSidebar(false)}
                        />
                        <Button
                            label={editingSubMenu ? "Update" : "Save"}
                            className="btn btn-success"
                            onClick={handleUpdateSubMenuSave}
                        />
                    </div>
                </div>
            </PrimeSidebar>

            <div className="middle">
                <div className="row">
                    <div className="col-12">
                        <div className="card_tb">
                            <div className="p-3">
                                <div className="table-responsive">
                                    <table className="table table-sm mb-0 menu-table">
                                        <thead className="table-light">
                                            <tr>
                                                <th style={{ width: "40px" }}></th>
                                                <th style={{ textAlign: "left" }}>Menu Text</th>
                                                <th style={{ textAlign: "left" }}>Menu Description</th>
                                                <th style={{ width: "100px" }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="text-center p-4">
                                                        {error ? `Error: ${error}` : "No records found"}
                                                    </td>
                                                </tr>
                                            ) : (
                                                data.map((row, index) => {
                                                    const menuId = extractMenuId(row);
                                                    const isExpanded = expandedRows.includes(index);
                                                    const childData = subMenuData[menuId] || [];

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
                                                                            toggleRowExpansion(index, row);
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
                                                                        <div className="expanded-content">
                                                                            <div style={{ marginBottom: 12 }}>
                                                                                <Button
                                                                                    className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
                                                                                    onClick={() => handleAddSubMenu(menuId)}
                                                                                >
                                                                                    <span className="material-icons me-1" style={{ fontSize: "18px" }}>
                                                                                        add_circle
                                                                                    </span>
                                                                                    New SubMenu
                                                                                </Button>
                                                                            </div>
                                                                            {childData.length === 0 ? (
                                                                                <p className="text-center text-muted m-3">
                                                                                    No submenus found
                                                                                </p>
                                                                            ) : (
                                                                                <div className="table-responsive">
                                                                                    <table className="table table-sm table-bordered mb-0 nested-menu-table">
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
                                                                                                                handleEditSubMenu(childRow);
                                                                                                            }}
                                                                                                        >
                                                                                                            edit
                                                                                                        </span>
                                                                                                        <span
                                                                                                            className="material-icons action-icon delete"
                                                                                                            title="Delete"
                                                                                                            onClick={(e) => handleDeleteSubmenu(e, childRow, menuId)}
                                                                                                        >
                                                                                                            delete
                                                                                                        </span>
                                                                                                    </td>
                                                                                                </tr>
                                                                                            ))}
                                                                                        </tbody>
                                                                                    </table>
                                                                                </div>
                                                                            )}
                                                                        </div>
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