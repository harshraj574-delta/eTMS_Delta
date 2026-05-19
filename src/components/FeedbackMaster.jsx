import React, { useState, useEffect, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import MasterSidebar from "./Master/MasterSidebar";
import Loader from "./common/Loader";
import TabSwitcher from "./common/TabSwitcher";
import TableToolbar from "./common/TableToolbar";
import FeedbackMasterService from "../services/compliance/FeedbackMasterService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import sessionManager from "../utils/SessionManager";

import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

import { CustomDataTable } from "./common/CustomDataTable";
import ResponsiveDataTable from "./common/ResponsiveDataTable";
import CustomPaginator from "./common/CustomPaginator";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { MultiSelect } from "primereact/multiselect";

const FeedbackMaster = () => {
  const [complaintTypes, setComplaintTypes] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newComplaintName, setNewComplaintName] = useState("");
  const [newSeverity, setNewSeverity] = useState(null);
  const [newCategoryId, setNewCategoryId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  // Toolbar State
  const [globalFilter, setGlobalFilter] = useState("");
  const [filters, setFilters] = useState({
    complaintName: null,
    severity: null,
  });
  const op = useRef(null);
  const filterButtonRef = useRef(null);

  const [showAddComplaintSidebar, setShowAddComplaintSidebar] = useState(false);
  const [showEditComplaintSidebar, setShowEditComplaintSidebar] =
    useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);

  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);

  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  const facilityId = sessionManager.getUserSession().FacilityID;

  const severityOptions = [
    { label: "SEV 1", value: 1 },
    { label: "SEV 2", value: 2 },
    { label: "SEV 3", value: 3 },
  ];

  const categoryOptions = categories.map((cat) => ({
    label: cat.Category,
    value: cat.id,
  }));

  // Tab options for TabSwitcher
  const categoryTabs = categories.map((cat) => ({
    label: cat.Category,
    value: cat.id,
  }));

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter effect
  useEffect(() => {
    let result = [...complaintTypes];

    if (filters.complaintName && filters.complaintName.length > 0) {
      result = result.filter((item) =>
        filters.complaintName.includes(item.CompName)
      );
    }

    if (filters.severity && filters.severity.length > 0) {
      result = result.filter((item) =>
        filters.severity.includes(item.severity)
      );
    }

    if (globalFilter && globalFilter.trim() !== "") {
      const lowerFilter = globalFilter.toLowerCase();
      result = result.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(lowerFilter)
        )
      );
    }
    setFilteredData(result);
  }, [complaintTypes, globalFilter, filters]);

  const clearAdvancedFilters = () => {
    setFilters({ complaintName: null, severity: null });
    if (op.current) op.current.hide();
    toast.info("Filters cleared");
  };

  const getUniqueValues = (field) => {
    const values = complaintTypes.map((item) => item[field]).filter(Boolean);
    return [...new Set(values)].map((val) => ({
      label: String(val),
      value: val,
    }));
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoaded(false);
      const data = await FeedbackMasterService.GetComplaintCategory(facilityId);
      const categoryArray = Array.isArray(data) ? data : [];
      setCategories(categoryArray);
      setCategoriesLoaded(true);
      if (categoryArray.length > 0) {
        const firstCategoryId = categoryArray[0].id;
        setSelectedCategory(firstCategoryId);
        fetchComplaintTypes(firstCategoryId);
      }
    } catch (error) {
      toast.error("Error fetching categories");
      console.error(error);
      setCategoriesLoaded(true);
    }
  };

  const fetchComplaintTypes = async (categoryId = "") => {
    try {
      setLoading(true);
      const data = await FeedbackMasterService.GetComplaintType(categoryId);
      const complaintData = Array.isArray(data) ? data : [];
      setComplaintTypes(complaintData);
      setFilteredData(complaintData);
      setFirst(0); // Reset pagination on new search
    } catch (error) {
      toast.error("Error fetching complaint types");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryTabChange = (categoryId) => {
    setSelectedCategory(categoryId);
    fetchComplaintTypes(categoryId);
  };

  const exportExcel = () => {
    if (filteredData.length === 0) {
      toast.error("No data to export");
      return;
    }
    const fileName = `feedback_master_${new Date().toISOString().slice(0, 10)}`;
    exportToCSV(filteredData, fileName);
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

  const renderToolbar = () => {
    return (
      <TableToolbar
        search={globalFilter}
        onSearch={(e) => setGlobalFilter(e.target.value)}
        onRefresh={() => fetchComplaintTypes(selectedCategory)}
        onExport={exportExcel}
        showFilter={true}
        activeFilterCount={
          (filters.complaintName && filters.complaintName.length > 0 ? 1 : 0) +
          (filters.severity && filters.severity.length > 0 ? 1 : 0)
        }
        overlayRef={op}
        filterButtonRef={filterButtonRef}
        filters={filters}
        setFilters={setFilters}
      >
        <div className="p-3">
          <div className="row g-3">
            <div className="col-12">
              <label className="fw-bold mb-1">Complaint Name</label>
              <MultiSelect
                value={filters.complaintName}
                options={getUniqueValues("CompName")}
                onChange={(e) =>
                  setFilters({ ...filters, complaintName: e.value })
                }
                placeholder="Select Complaint"
                className="w-100"
                display="chip"
              />
            </div>
            <div className="col-12">
              <label className="fw-bold mb-1">Severity</label>
              <MultiSelect
                value={filters.severity}
                options={getUniqueValues("severity")}
                onChange={(e) =>
                  setFilters({ ...filters, severity: e.value })
                }
                placeholder="Select Severity"
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

  const handleAddComplaint = async (e) => {
    e.preventDefault();
    if (!newComplaintName.trim()) {
      toast.warn("Please enter complaint name");
      return;
    }
    if (newSeverity === null) {
      toast.warn("Please select severity");
      return;
    }
    if (!newCategoryId) {
      toast.warn("Please select category");
      return;
    }
    try {
      setLoading(true);
      await FeedbackMasterService.InsertComplaintType(
        newComplaintName,
        newSeverity,
        newCategoryId
      );
      await fetchComplaintTypes(selectedCategory);
      setNewComplaintName("");
      setNewSeverity(null);
      setNewCategoryId(null);
      setShowAddComplaintSidebar(false);
      toast.success("Complaint type added successfully");
    } catch (error) {
      toast.error("Error adding complaint type");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateComplaint = async (e) => {
    e.preventDefault();
    if (!editingComplaint.CompName.trim()) {
      toast.warn("Please enter complaint name");
      return;
    }
    if (editingComplaint.severity === null) {
      toast.warn("Please select severity");
      return;
    }
    if (!editingComplaint.categoryId) {
      toast.warn("Please select category");
      return;
    }
    try {
      setLoading(true);
      await FeedbackMasterService.UpdateComplaintType(
        editingComplaint.Id,
        editingComplaint.CompName,
        editingComplaint.severity,
        editingComplaint.categoryId
      );
      await fetchComplaintTypes(selectedCategory);
      setEditingComplaint(null);
      setShowEditComplaintSidebar(false);
      toast.success("Complaint type updated successfully");
    } catch (error) {
      toast.error("Error updating complaint type");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const actionBodyTemplate = (rowData) => (
    <div className="process-action-buttons d-flex gap-1 justify-content-start flex-wrap">
      <IconButton
        sx={{ color: "#1976d2" }}
        size="small"
        className="action-btn"
        onClick={() => {
          setEditingComplaint({
            Id: rowData.Id,
            CompName: rowData.CompName,
            severity: rowData.severity,
            categoryId: rowData.C_Type,
          });
          setShowEditComplaintSidebar(true);
        }}
        title="Edit"
      >
        <EditIcon fontSize="small" />
      </IconButton>
    </div>
  );

  const handleNewButtonClick = () => {
    setNewComplaintName("");
    setNewSeverity(null);
    setNewCategoryId(null);
    setShowAddComplaintSidebar(true);
  };

  return (
    <div>
      <Loader isVisible={loading} fullScreen={true} />
      <Header
        pageTitle="Feedback Master"
        showNewButton={true}
        onNewButtonClick={handleNewButtonClick}
      />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="middle">
        <div className="row">
          <div className="col-12">
            {/* Tab Switcher - positioned above the card */}
            {categoriesLoaded && categoryTabs.length > 0 && (
              <TabSwitcher
                tabs={categoryTabs}
                activeTab={selectedCategory}
                onTabChange={handleCategoryTabChange}
                size="medium"
                variant="minimal"
              />
            )}
            <div className="card_tb">
              <div className="p-3 pb-0">
                {renderToolbar()}
              </div>
              <div className="table-responsive">
                <ResponsiveDataTable
                  value={filteredData.slice(first, first + rows)}
                  loading={loading}
                  dataKey="Id"
                  emptyMessage="No complaint types found"
                  globalFilterFields={["CompName", "Category"]}
                >
                  <Column field="Category" header="Category" mobile={{ subtitle: true }} sortable />
                  <Column field="CompName" header="Complaint Name" mobile={{ primary: true }} sortable />
                  <Column field="severity" header="Severity" mobile={{ badge: true }} sortable style={{ width: "100px", textAlign: "center" }} />
                  <Column header="Action" mobile={{ action: true }} body={actionBodyTemplate} />
                </ResponsiveDataTable>
                <CustomPaginator
                  first={first}
                  rows={rows}
                  totalRecords={filteredData.length}
                  onPageChange={onPageChange}
                  rowsPerPageOptions={[5, 10, 20]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Complaint Sidebar */}
      <MasterSidebar
        show={showAddComplaintSidebar}
        onClose={() => setShowAddComplaintSidebar(false)}
        title="Add New Complaint Type"
        width="35%"
        className="sidebar-responsive"
        id="addComplaintSidebar"
        backdropOpacity={0.5}
        backdropBlur="10px"
        headerBgColor="bg-secondary"
        headerTextColor="text-white"
        footer={
          <div className="offcanvas-footer">
            <Button
              label="Cancel"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowAddComplaintSidebar(false)}
            />
            <Button
              label="Save"
              className="btn btn-success btn-sm ms-3"
              onClick={handleAddComplaint}
            />
          </div>
        }
      >
        {categoriesLoaded && (
          <div className="p-3 p-sm-4">
            <div className="mb-3">
              <label className="form-label">
                Category <span className="text-danger">*</span>
              </label>
              <Dropdown
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.value)}
                options={categoryOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Select Category"
                className="w-100"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="complaintName" className="form-label">
                Complaint Name <span className="text-danger">*</span>
              </label>
              <InputText
                id="complaintName"
                value={newComplaintName}
                onChange={(e) => setNewComplaintName(e.target.value)}
                placeholder="Enter complaint name"
                className="w-100"
                required
              />
            </div>
            <div className="mb-6">
              <label className="form-label">
                Severity <span className="text-danger">*</span>
              </label>
              <Dropdown
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.value)}
                options={severityOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Select Severity"
                className="w-100"
              />
            </div>
          </div>
        )}
      </MasterSidebar>

      {/* Edit Complaint Sidebar */}
      <MasterSidebar
        show={showEditComplaintSidebar}
        onClose={() => setShowEditComplaintSidebar(false)}
        title="Edit Complaint Type"
        width="35%"
        className="sidebar-responsive"
        id="editComplaintSidebar"
        backdropOpacity={0.5}
        backdropBlur="10px"
        headerBgColor="bg-secondary"
        headerTextColor="text-white"
        footer={
          <div className="offcanvas-footer">
            <Button
              label="Cancel"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowEditComplaintSidebar(false)}
            />
            <Button
              label="Update"
              className="btn btn-success btn-sm ms-3"
              onClick={handleUpdateComplaint}
            />
          </div>
        }
      >
        {editingComplaint && categoriesLoaded && (
          <div className="p-3 p-sm-4">
            <div className="mb-3">
              <label className="form-label">
                Category <span className="text-danger">*</span>
              </label>
              <Dropdown
                value={editingComplaint.categoryId}
                onChange={(e) =>
                  setEditingComplaint({
                    ...editingComplaint,
                    categoryId: e.value,
                  })
                }
                options={categoryOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Select Category"
                className="w-100"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">
                Complaint Name <span className="text-danger">*</span>
              </label>
              <InputText
                value={editingComplaint.CompName}
                onChange={(e) =>
                  setEditingComplaint({
                    ...editingComplaint,
                    CompName: e.target.value,
                  })
                }
                placeholder="Enter complaint name"
                className="w-100"
                required
              />
            </div>
            <div className="mb-6">
              <label className="form-label">
                Severity <span className="text-danger">*</span>
              </label>
              <Dropdown
                value={editingComplaint.severity}
                onChange={(e) =>
                  setEditingComplaint({
                    ...editingComplaint,
                    severity: e.value,
                  })
                }
                options={severityOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Select Severity"
                className="w-100"
              />
            </div>
          </div>
        )}
      </MasterSidebar>

      <style>{`
        .sidebar-responsive .offcanvas-body {
          overflow: visible !important;
        }

        .p-dropdown-panel {
          z-index: 1100 !important;
        }

        .offcanvas.show {
          z-index: 1045 !important;
        }

        .p-dropdown-panel {
          z-index: 99999 !important;
        }

        .sidebar-responsive {
          width: 35% !important;
        }

        @media (max-width: 992px) {
          .sidebar-responsive {
            width: 45% !important;
          }
        }

        @media (max-width: 768px) {
          .sidebar-responsive {
            width: 60% !important;
          }
        }

        @media (max-width: 576px) {
          .sidebar-responsive {
            width: 85% !important;
          }

          .offcanvas-header {
            padding: 1rem !important;
          }

          .offcanvas-header h5 {
            font-size: 1rem !important;
          }
        }

        .card-header {
          border-bottom: 1px solid #e5e7eb !important;
          background-color: #f9fafb !important;
          padding: 0.85rem 1rem !important;
        }

        .card-body {
          border: none !important;
          padding: 0.65rem !important;
        }

        @media (max-width: 576px) {
          .card_tb {
            margin-bottom: 0.5rem;
          }
        }

        /* Process Row Styling - MEDIUM COMPACT */
        /* Removed to match FacilityMaster styling */

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
          gap: 0.75rem;
          height: auto;
        }

        .offcanvas-footer .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          min-width: 85px;
          height: 38px;
          padding: 0.4rem 0.75rem !important;
          font-size: 0.85rem !important;
          vertical-align: middle;
          line-height: 1;
          transition: all 0.3s ease !important;
        }

        .offcanvas-footer .btn-outline-secondary {
          border: 1px solid #d1d5db !important;
          color: #4b5563 !important;
          background-color: white !important;
        }

        .offcanvas-footer .btn-outline-secondary:hover {
          background-color: #1f2937 !important;
          border-color: #1f2937 !important;
          color: white !important;
        }

        .offcanvas-footer .btn-outline-secondary:active,
        .offcanvas-footer .btn-outline-secondary:focus {
          background-color: #111827 !important;
          border-color: #111827 !important;
          color: white !important;
          box-shadow: none !important;
        }

        .offcanvas-footer .btn-success {
          background-color: #22c55e !important;
          border-color: #22c55e !important;
          color: white !important;
        }

        .offcanvas-footer .btn-success:hover {
          background-color: #16a34a !important;
          border-color: #16a34a !important;
          color: white !important;
        }

        .offcanvas-footer .btn-success:active,
        .offcanvas-footer .btn-success:focus {
          background-color: #15803d !important;
          border-color: #15803d !important;
          color: white !important;
          box-shadow: none !important;
        }

        @media (max-width: 576px) {
          .offcanvas-footer {
            padding: 0.75rem;
            gap: 0.5rem;
            flex-wrap: wrap;
          }

          .offcanvas-footer .btn {
            flex: 1;
            min-width: auto;
            height: 36px;
            font-size: 0.8rem !important;
            padding: 0.35rem 0.6rem !important;
          }
        }

        .offcanvas-body {
          padding-bottom: 5.5rem;
        }

        .form-label {
          font-size: 0.95rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          display: block;
          color: #374151;
        }

        @media (max-width: 576px) {
          .form-label {
            font-size: 0.9rem;
          }

          .mb-3 {
            margin-bottom: 1rem !important;
          }
        }

        .btn-sm {
          padding: 0.4rem 0.75rem !important;
          font-size: 0.85rem !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 38px;
        }

        @media (max-width: 576px) {
          .btn-sm {
            padding: 0.35rem 0.6rem !important;
            height: 36px;
          }
        }

        .p-dropdown-panel {
          z-index: 9999 !important;
        }

        .p-dialog .p-dropdown-panel,
        .offcanvas .p-dropdown-panel {
          z-index: 99999 !important;
        }

        .offcanvas-body .p-dropdown,
        .p-dialog .p-dropdown {
          padding: 0.5rem 0.75rem !important;
          font-size: 0.95rem !important;
          height: 40px !important;
          width: 100% !important;
          display: flex !important;
          align-items: center !important;
        }
      `}</style>
    </div>
  );
};

export default FeedbackMaster;