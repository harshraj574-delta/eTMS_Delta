import React, { useMemo, useEffect, useState } from 'react';
import Loader from "./common/Loader";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { DataTable } from 'primereact/datatable';
import { Column } from "primereact/column";
import ManageMenuService from '../services/compliance/ManageMenuService';
import sessionManager from "../utils/SessionManager";
import { Sidebar as PrimeSidebar } from 'primereact/sidebar';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { toastService } from '../services/toastService';
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
    // expansion state for submenus
    const [expandedMenuId, setExpandedMenuId] = useState(null);
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

            //console.log("InsertMenu Params:", params);

            const resp = await ManageMenuService.InsertMenu(params);
            //console.log("InsertMenu Response:", resp);

            // ---------------------------
            // 🔥 UNIVERSAL SAFE PARSING
            // ---------------------------
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

            // Ensure array → object
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

            console.log("Final Parsed Result =", result);

            // ---------------------------
            // ❗ CHECK result VALUE
            // ---------------------------
            if (String(result) === "0") {
                toastService.warn("This menu already exists.");
                return; // stop process
            }

            if (String(result) === "1") {
                toastService.success("The menu has been saved successfully.");

                // refresh list from server
                await fetchMenuData();

                // clear inputs and close sidebar
                setNewText("");
                setNewDescription("");
                setShowNewSidebar(false);
                return;
            }

            // If result is something else (not 0 or 1)
            toastService.warn("Unexpected response from the server.");

        } catch (err) {
            console.error("Error saving menu:", err);
            toastService.error("Unable to save the menu. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Similar update for handleUpdateSave
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

            // ---------------------------
            // 🔥 UNIVERSAL SAFE PARSING
            // ---------------------------
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

            // Ensure array → object
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

            console.log("Final Parsed Result =", result);

            // ---------------------------
            // ❗ CHECK result VALUE
            // ---------------------------
            if (String(result) === "0") {
                toastService.warn("This menu already exists");
                return; // stop process
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

            // If result is something else (not 0 or 1)
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

    // const handleUpdateSave = async () => {
    //     if (!editText || editText.trim() === "") {
    //         toastService.warn("Please enter Menu Text");
    //         return;
    //     }

    //     const params = {
    //         MenuID: editingRow?.MenuID || editingRow?.menuid,
    //         Text: editText,
    //         Description: editDescription,
    //         ParentID: null,
    //         NavigateUrl: ""
    //     };

    //     try {
    //         setLoading(true);
    //         const resp = await ManageMenuService.UpdateMenu(params);
    //         await fetchMenuData();
    //         setEditText("");
    //         setEditDescription("");
    //         setEditingRow(null);
    //         setShowEditSidebar(false);
    //         toastService.success("Menu updated");
    //     } catch (err) {
    //         console.error("Error updating menu:", err);
    //         toastService.error("Failed to update menu");
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    const extractMenuId = (row) => {
        if (!row) return null;
        return String(row?.MenuID ?? row?.menuid ?? row?.id ?? "");
    };

    const handleExpanderClick = async (e, rowData) => {
        e.stopPropagation();
        const menuId = extractMenuId(rowData);
        if (!menuId) return;

        if (expandedMenuId === menuId) {
            setExpandedMenuId(null);
            return;
        }

        setExpandedMenuId(menuId);

        // fetch submenu data if not cached
        if (subMenuData[menuId]) return;

        try {
            setLoading(true);
            const resp = await ManageMenuService.SelectSubMenu({ menuid: menuId });
            const parsed = typeof resp === "string" ? JSON.parse(resp) : resp;
            const childArr = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
            setSubMenuData(prev => ({ ...prev, [menuId]: childArr }));
        } catch (err) {
            console.error("Error fetching submenu data:", err);
            toastService.error("Could not load submenu data");
        } finally {
            setLoading(false);
        }
    };

    // new: delete single submenu row
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

            // refresh only this parent's submenu list
            try {
                const resp = await ManageMenuService.SelectSubMenu({ menuid: parentMenuId });
                const parsed = typeof resp === "string" ? JSON.parse(resp) : resp;
                const childArr = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
                setSubMenuData(prev => ({ ...prev, [parentMenuId]: childArr }));
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
    // new: handle edit submenu
    const handleEditSubMenu = async (rowData) => {
        setEditingSubMenu(rowData);

        setEditSubMenuText(rowData?.TEXT || '');
        setEditSubMenuDescription(rowData?.DESCRIPTION || '');
        setEditSubMenuNavigateUrl(rowData?.NAVIGATEURL || '');

        // Load parent menu list
        try {
            const resp = await ManageMenuService.SelectMainMenu({ IsAdmin: "Y" });
            const parsed = typeof resp === "string" ? JSON.parse(resp) : resp;
            const arr = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
            setParentMenuList(arr);

            // Pre-select parent
            const parentId = rowData?.PARENTID ?? rowData?.parentid ?? null;
            setSelectedParent(parentId);
        } catch (err) {
            console.error("Error loading parent menus:", err);
            toastService.error("Could not fetch parent menus");
        }

        setShowEditSubMenuSidebar(true);
    };

    const subMenuRowExpansionTemplate = (parentRow) => {
        const menuId = extractMenuId(parentRow);
        const submenus = subMenuData[menuId] || [];

        return (
            <div className="p-2">
                <div style={{ marginBottom: 12 }}>
                    <Button
                        icon="pi pi-plus"
                        label="Add SubMenu"
                        className="p-button-sm p-button-success"
                        onClick={() => handleAddSubMenu(menuId)}
                    />
                </div>
                <DataTable
                    value={submenus}
                    size="small"
                    tableStyle={{ minWidth: "60rem" }}
                    emptyMessage="No submenus found"
                    stripedRows
                >
                    <Column field="TEXT" header="SubMenu Text" />
                    <Column field="DESCRIPTION" header="Description" />
                    <Column field="mtext" header="Parent Menu" />
                    <Column field="NAVIGATEURL" header="Navigate URL" />
                    <Column
                        header="Actions"
                        body={(rowData) => (
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span
                                    className="material-icons"
                                    title="Edit"
                                    style={{ fontSize: 20, cursor: 'pointer', color: '#1976d2' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // reuse parent edit handler or add submenu edit logic
                                        handleEditSubMenu(rowData);
                                    }}
                                >
                                    edit
                                </span>

                                <span
                                    className="material-icons"
                                    title="Delete"
                                    style={{ fontSize: 20, cursor: 'pointer', color: '#d32f2f' }}
                                    onClick={(e) => handleDeleteSubmenu(e, rowData, menuId)}
                                >
                                    delete
                                </span>
                            </div>
                        )}
                    />
                </DataTable>
            </div>
        );
    };
    // new: handle add submenu
    const handleAddSubMenu = async (parentMenuId) => {
        // Load parent menu list for dropdown
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

        // Clear form and set for new submenu
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

        // Validate that a parent is selected (empty string or null means none)
        if (selectedParent === null || selectedParent === "") {
            toastService.warn("Please select a parent menu.");
            return;
        }

        // convert selectedParent to number if numeric, otherwise keep string
        const normalizedParent = isNaN(selectedParent) ? selectedParent : Number(selectedParent);

        const isUpdate = !!editingSubMenu;
        const submenuId =
            editingSubMenu?.MENUID ??
            editingSubMenu?.MenuID ??
            editingSubMenu?.menuid ??
            editingSubMenu?.ID ??
            editingSubMenu?.id;

        // ensure ParentID passed explicitly (use number if numeric)
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

            // debug payload to confirm ParentID
            //console.log("Insert/Update SubMenu payload:", params);

            let apiResponse;

            if (isUpdate) {
                apiResponse = await ManageMenuService.UpdateMenu(params);
            } else {
                apiResponse = await ManageMenuService.InsertMenu(params);
            }

            // ---------------------------
            // 🔥 UNIVERSAL SAFE PARSING
            // ---------------------------
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

            // refresh submenu list for the selected parent (use normalizedParent)
            try {
                const resp = await ManageMenuService.SelectSubMenu({ menuid: normalizedParent });
                let parsedChild = typeof resp === "string" ? JSON.parse(resp) : resp;
                const childArr = Array.isArray(parsedChild) ? parsedChild : parsedChild ? [parsedChild] : [];
                setSubMenuData(prev => ({ ...prev, [String(normalizedParent)]: childArr }));
            } catch (refreshErr) {
                console.error("Error refreshing submenu list:", refreshErr);
            }

            // reset form
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
            <Header mainTitle="Super Admin" pageTitle={"Manage Menu"}
                showNewButton={true} onNewButtonClick={() => setShowNewSidebar(true)} />
            <Sidebar />
            {/* Add Menu Sidebar */}
            <PrimeSidebar visible={showNewSidebar} showCloseIcon={false}
                dismissable={false}
                position="right"
                style={{ width: "360px" }}>
                <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
                    <h6 className="sidebarTitle">Add Menu</h6>
                    <Button
                        icon="pi pi-times"
                        className="p-button-rounded p-button-text"
                        onClick={() => {
                            setShowNewSidebar(false);
                        }}
                    />
                </div>
                <div className="sidebarBody">
                    <div className="row">

                    </div>

                    <div className="offcanvas-body px-4">
                        <div className="col-11 mb-3">
                            <label className="form-label">Menu Text:</label>
                            <InputText value={newText} className='form-control' onChange={(e) => setNewText(e.target.value)} />
                        </div>
                        <div className="col-11 mb-3">
                            <label className="form-label"> Description:</label>
                            <InputText value={newDescription} className='form-control' onChange={(e) => setNewDescription(e.target.value)} />
                        </div>
                    </div>
                </div>
                <div className="sidebar-fixed-bottom position-absolute pe-3">
                    <div className="d-flex gap-3 justify-content-end">
                        <Button label="Cancel" className="btn btn-outline-secondary" onClick={() => setShowNewSidebar(false)} />
                        <Button label="Save" className="btn btn-success" onClick={handleSave} />
                    </div>
                </div>
            </PrimeSidebar>
            {/* Edit Menu Sidebar */}
            <PrimeSidebar visible={showEditSidebar} showCloseIcon={false}
                dismissable={false}
                position="right"
                onHide={() => setShowEditSidebar(false)}
                style={{ width: "360px" }}>
                <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
                    <h6 className="sidebarTitle">Edit Menu</h6>
                    <Button
                        icon="pi pi-times"
                        className="p-button-rounded p-button-text"
                        onClick={() => {
                            setShowEditSidebar(false);
                        }}
                    />
                </div>
                <div className="sidebarBody">
                    <div className="offcanvas-body px-4">
                        <div className="col-11 mb-3">
                            <label className="form-label">Menu Text:</label>
                            <InputText
                                value={editText}
                                className='form-control'
                                onChange={(e) => setEditText(e.target.value)}
                                placeholder="Enter menu text"
                            />
                        </div>
                        <div className="col-11 mb-3">
                            <label className="form-label">Description:</label>
                            <InputText
                                value={editDescription}
                                className='form-control'
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Enter description"
                            />
                        </div>
                    </div>
                </div>
                <div className="sidebar-fixed-bottom position-absolute pe-3" style={{ bottom: 16, right: 16 }}>
                    <div className="d-flex gap-3 justify-content-end">
                        <Button label="Cancel" className="btn btn-outline-secondary" onClick={() => setShowEditSidebar(false)} />
                        <Button label="Update" className="btn btn-success" onClick={handleUpdateSave} />
                    </div>
                </div>
            </PrimeSidebar>
            {/* Edit SubMenu Sidebar */}
            <PrimeSidebar visible={showEditSubMenuSidebar} showCloseIcon={false}
                dismissable={false}
                position="right"
                onHide={() => setShowEditSubMenuSidebar(false)}
                style={{ width: "360px" }}>
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
                                className='form-control'
                                onChange={(e) => setEditSubMenuText(e.target.value)}
                                placeholder="Enter submenu text"
                            />
                        </div>
                        <div className="col-11 mb-3">
                            <label className="form-label">Description:</label>
                            <InputText
                                value={editSubMenuDescription}
                                className='form-control'
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
                                className='form-control'
                                onChange={(e) => setEditSubMenuNavigateUrl(e.target.value)}
                                placeholder="Enter navigate URL"
                            />
                        </div>
                    </div>
                </div>
                <div className="sidebar-fixed-bottom position-absolute pe-3" style={{ bottom: 16, right: 16 }}>
                    <div className="d-flex gap-3 justify-content-end">
                        <Button label="Cancel" className="btn btn-outline-secondary" onClick={() => setShowEditSubMenuSidebar(false)} />
                        <Button label={editingSubMenu ? "Update" : "Save"} className="btn btn-success" onClick={handleUpdateSubMenuSave} />
                    </div>
                </div>
            </PrimeSidebar>
            <div className="middle">

                <div className="row">
                    <div className="col-12">
                        <div className="card_tb">
                            <DataTable
                                value={data}
                                paginator
                                rows={100}
                                tableStyle={{ minWidth: "10rem" }}
                                size="small"
                                loading={loading}
                                emptyMessage={error ? `Error: ${error}` : "No records found"}
                                stripedRows
                                rowsPerPageOptions={[50, 100, 200, 300]}
                                className="p-datatable-gridlines process-datatable"
                                expandedRows={expandedMenuId ? { [expandedMenuId]: true } : null}
                                rowExpansionTemplate={subMenuRowExpansionTemplate}
                                dataKey="MenuID"
                            >
                                <Column
                                    expander
                                    body={(rowData) => {
                                        const id = extractMenuId(rowData);
                                        const isExpanded = expandedMenuId === id;
                                        return (
                                            <span
                                                className="material-icons"
                                                style={{
                                                    fontSize: "20px",
                                                    cursor: "pointer",
                                                    color: isExpanded ? "red" : "blue",
                                                }}
                                                onClick={(e) => handleExpanderClick(e, rowData)}
                                            >
                                                {isExpanded ? "remove_circle" : "add_circle"}
                                            </span>
                                        );
                                    }}
                                    style={{ width: "3rem" }}
                                />
                                <Column field="Text" header="Menu Text" />
                                <Column field="Description" header="Menu Description" />
                                <Column
                                    header="Actions"
                                    body={(rowData) => (
                                        <span
                                            className="material-icons"
                                            title="Edit"
                                            style={{ fontSize: 20, cursor: 'pointer', color: '#1976d2' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(rowData);
                                            }}
                                        >
                                            edit
                                        </span>
                                    )}
                                />
                            </DataTable>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default ManageMenu;