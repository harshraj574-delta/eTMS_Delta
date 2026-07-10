import React, { useState, useEffect, useRef } from 'react';
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import ProcessMasterService from '../services/compliance/ProcessMasterService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import sessionManager from '../utils/SessionManager';
import TableToolbar from "./common/TableToolbar";
import { MultiSelect } from "primereact/multiselect";
import { OverlayPanel } from "primereact/overlaypanel";
import { CustomDataTable } from "./common/CustomDataTable";
import ResponsiveDataTable from "./common/ResponsiveDataTable";
import CustomPaginator from "./common/CustomPaginator";
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import MasterSidebar from "./Master/MasterSidebar";

const ProcessMaster = () => {
  const [processes, setProcesses] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [subProcesses, setSubProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [newProcessName, setNewProcessName] = useState('');
  const [newSubProcessName, setNewSubProcessName] = useState('');
  const [editingProcess, setEditingProcess] = useState(null);
  const [editingSubProcess, setEditingSubProcess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Pagination State for Main Table
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);

  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  // Pagination State for Sub-Processes Table
  const [subFirst, setSubFirst] = useState(0);
  const [subRows, setSubRows] = useState(10);

  const onSubPageChange = (event) => {
    setSubFirst(event.first);
    setSubRows(event.rows);
  };

  // Toolbar State
  const [globalFilter, setGlobalFilter] = useState("");
  const [filters, setFilters] = useState({
    processName: null
  });
  const op = useRef(null);
  const filterButtonRef = useRef(null);

  const [showAddProcessSidebar, setShowAddProcessSidebar] = useState(false);
  const [showEditProcessSidebar, setShowEditProcessSidebar] = useState(false);
  const [showSubProcessesSidebar, setShowSubProcessesSidebar] = useState(false);
  const [showAddSubProcessSidebar, setShowAddSubProcessSidebar] = useState(false);
  const [showEditSubProcessSidebar, setShowEditSubProcessSidebar] = useState(false);

  const facilityId = sessionManager.getUserSession().FacilityID;

  useEffect(() => {
    fetchProcesses();
  }, []);

  // Filter effect
  useEffect(() => {
    let result = [...processes];

    // Apply advanced filters
    if (filters.processName && filters.processName.length > 0) {
      result = result.filter(item => filters.processName.includes(item.processName));
    }

    // Apply global search
    if (globalFilter && globalFilter.trim() !== "") {
      const lowerFilter = globalFilter.toLowerCase();
      result = result.filter(item => 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(lowerFilter)
        )
      );
    }
    setFilteredData(result);
  }, [processes, globalFilter, filters]);

  const clearAdvancedFilters = () => {
    setFilters({ processName: null });
    if (op.current) op.current.hide();
    toast.info("Filters cleared");
  };

  const getUniqueValues = (field) => {
    const values = processes.map((item) => item[field]).filter(Boolean);
    return [...new Set(values)].map((val) => ({ label: val, value: val }));
  };

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      const data = await ProcessMasterService.GetProcessNew(facilityId);
      const procesData = Array.isArray(data) ? data : [];
      setProcesses(procesData);
      setFilteredData(procesData);
      setFirst(0); // Reset pagination on fetch
    } catch (error) {
      toast.error('Error fetching processes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (filteredData.length === 0) {
      toast.error("No data to export");
      return;
    }
    const fileName = `process_master_${new Date().toISOString().slice(0, 10)}`;
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
        onRefresh={() => fetchProcesses()}
        onExport={exportExcel}
        showFilter={true}
        activeFilterCount={
          filters.processName && filters.processName.length > 0 ? 1 : 0
        }
        overlayRef={op}
        filterButtonRef={filterButtonRef}
        filters={filters}
        setFilters={setFilters}
      >
        <div className="p-3">
          <div className="row g-3">
            <div className="col-12">
              <label className="fw-bold mb-1">Process Name</label>
              <MultiSelect
                value={filters.processName}
                options={getUniqueValues("processName")}
                onChange={(e) =>
                  setFilters({ ...filters, processName: e.value })
                }
                placeholder="Select Process"
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

  const fetchSubProcesses = async (processId, processName) => {
    try {
      setLoading(true);
      const data = await ProcessMasterService.getSubProcess(processId);
      setSubProcesses(Array.isArray(data) ? data : []);
      setSelectedProcess({ id: processId, name: processName });
      setSubFirst(0); // Reset pagination on fetch
      setShowSubProcessesSidebar(true);
    } catch (error) {
      toast.error('Error fetching sub-processes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProcess = async (e) => {
    e.preventDefault();
    if (!newProcessName.trim()) {
      toast.warn('Please enter process name');
      return;
    }
    try {
      setLoading(true);
      await ProcessMasterService.addProcess(newProcessName, facilityId);
      await fetchProcesses();
      setNewProcessName('');
      setShowAddProcessSidebar(false);
      toast.success('Process added successfully');
    } catch (error) {
      toast.error('Error adding process');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProcess = async (e) => {
    e.preventDefault();
    if (!editingProcess.processName.trim()) {
      toast.warn('Please enter process name');
      return;
    }
    try {
      setLoading(true);
      await ProcessMasterService.updateProcess(
        editingProcess.Id,
        editingProcess.processName
      );
      await fetchProcesses();
      setEditingProcess(null);
      setShowEditProcessSidebar(false);
      toast.success('Process updated successfully');
    } catch (error) {
      toast.error('Error updating process');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubProcess = async (e) => {
    e.preventDefault();
    if (!newSubProcessName.trim()) {
      toast.warn('Please enter sub-process name');
      return;
    }
    try {
      setLoading(true);
      await ProcessMasterService.addSubProcess(
        selectedProcess.id,
        newSubProcessName
      );
      await fetchSubProcesses(selectedProcess.id, selectedProcess.name);
      setNewSubProcessName('');
      setShowAddSubProcessSidebar(false);
      toast.success('Sub-process added successfully');
    } catch (error) {
      toast.error('Error adding sub-process');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubProcess = async (e) => {
    e.preventDefault();
    if (!editingSubProcess.subProcessName.trim()) {
      toast.warn('Please enter sub-process name');
      return;
    }
    try {
      setLoading(true);
      await ProcessMasterService.updateSubProcess(
        selectedProcess.id,
        editingSubProcess.subProcessName,
        editingSubProcess.Id
      );
      await fetchSubProcesses(selectedProcess.id, selectedProcess.name);
      setEditingSubProcess(null);
      setShowEditSubProcessSidebar(false);
      toast.success('Sub-process updated successfully');
    } catch (error) {
      toast.error('Error updating sub-process');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const processNameBodyTemplate = (rowData) => {
    return (
      <a
        href="#!"
        onClick={(e) => {
          e.preventDefault();
          fetchSubProcesses(rowData.Id, rowData.processName);
        }}
        style={{
          textDecoration: 'none',
          color: '#3377FF',
          fontWeight: 500,
          cursor: 'pointer'
        }}
        className="text-primary hover-text-primary"
      >
        {rowData.processName}
      </a>
    );
  };

  const processActionBodyTemplate = (rowData) => (
    <div className="process-action-buttons d-flex gap-1 justify-content-start flex-wrap">
      <IconButton
        sx={{ color: '#1976d2' }}
        size="small"
        className="action-btn"
        onClick={() => {
          setEditingProcess(rowData);
          setShowEditProcessSidebar(true);
        }}
        title="Edit"
      >
        <EditIcon fontSize="small" />
      </IconButton>
    </div>
  );

  const subProcessActionBodyTemplate = (rowData) => (
    <div className="d-flex gap-1 justify-content-start">
      <IconButton
        sx={{ color: '#1976d2' }}
        size="small"
        className="action-btn"
        onClick={() => {
          setEditingSubProcess(rowData);
          setShowEditSubProcessSidebar(true);
        }}
        title="Edit"
      >
        <EditIcon fontSize="small" />
      </IconButton>
    </div>
  );

  const handleNewButtonClick = () => {
    setNewProcessName('');
    setShowAddProcessSidebar(true);
  };

  // Close all sidebars
  const closeAllSidebars = () => {
    setShowAddProcessSidebar(false);
    setShowEditProcessSidebar(false);
    setShowSubProcessesSidebar(false);
    setShowAddSubProcessSidebar(false);
    setShowEditSubProcessSidebar(false);
  };

  const anySidebarOpen = 
    showAddProcessSidebar || 
    showEditProcessSidebar || 
    showSubProcessesSidebar || 
    showAddSubProcessSidebar || 
    showEditSubProcessSidebar;

  return (
    <div>
      <Loader isVisible={loading} fullScreen={true} />


      <Header
        pageTitle="Process Master"
        showNewButton={true}
        onNewButtonClick={handleNewButtonClick}
      />
      <Sidebar />

      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Process Master</h6>
          </div>
          <div className="col-12">
            <div className="card_tb">
              <div className="p-3 pb-0">
                {renderToolbar()}
              </div>
              <ResponsiveDataTable
                  value={filteredData.slice(first, first + rows)}
                  loading={loading}
                  dataKey="Id"
                  className="p-datatable-sm"
                  emptyMessage="No processes found"
                  responsiveLayout="scroll"
                  globalFilterFields={['processName']}
                >
                  <Column
                    field="processName"
                    header="Process Name"
                    body={processNameBodyTemplate}
                    sortable
                    mobile={{ primary: true }}
                    className="col-process-name"
                  />
                  <Column
                    header="Total Emp."
                    mobile={{ subtitle: true }}
                    body={(rowData) => (
                      <div className="d-flex flex-column align-items-start">
                        <span>{rowData.totalemployee}</span>
                        <div className="d-flex gap-1 mt-1">
                          <span
                            className="badge text-dark d-flex align-items-center justify-content-center"
                            style={{
                              backgroundColor: "#EBE7FF",
                              borderRadius: "7px",
                              fontWeight: "normal",
                              minWidth: "28px",
                              height: "15.18px",
                              fontSize: "10px",
                              padding: "0 2px"
                            }}
                          >
                            {rowData.malecount}M
                          </span>
                          <span
                            className="badge text-dark d-flex align-items-center justify-content-center"
                            style={{
                              backgroundColor: "#FAE3E3",
                              borderRadius: "7px",
                              fontWeight: "normal",
                              minWidth: "28px",
                              height: "15.18px",
                              fontSize: "10px",
                              padding: "0 2px"
                            }}
                          >
                            {rowData.femalecount}F
                          </span>
                        </div>
                      </div>
                    )}
                    className="col-total-emp"
                  />
                  <Column
                    field="transportEmpcount"
                    header="Transport Opted Emp."
                    sortable
                    mobile={{ hidden: true }}
                    className="col-transport-opted"
                  />
                  <Column
                    header="Action"
                    body={processActionBodyTemplate}
                    mobile={{ action: true }}
                    className="col-action"
                  />
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

      {/* Add Process Sidebar */}
      <MasterSidebar
        title="Add New Process"
        show={showAddProcessSidebar}
        onClose={() => setShowAddProcessSidebar(false)}
        className="sidebar-responsive"
        footer={
          <div className="offcanvas-footer">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowAddProcessSidebar(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-success btn-sm" form="addProcessForm">
              Save
            </button>
          </div>
        }
      >
        <form id="addProcessForm" onSubmit={handleAddProcess}>
          <div className="p-3 p-sm-4">
            <div className="mb-3">
              <label htmlFor="processName" className="form-label">
                Process Name <span className="text-danger">*</span>
              </label>
              <InputText
                id="processName"
                value={newProcessName}
                onChange={(e) => setNewProcessName(e.target.value)}
                placeholder="Enter process name"
                className="w-100"
                required
              />
            </div>
          </div>
        </form>
      </MasterSidebar>

      {/* Edit Process Sidebar */}
      <MasterSidebar
        title="Edit Process"
        show={showEditProcessSidebar}
        onClose={() => setShowEditProcessSidebar(false)}
        className="sidebar-responsive"
        footer={
          <div className="offcanvas-footer">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowEditProcessSidebar(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-success btn-sm" form="editProcessForm">
              Update
            </button>
          </div>
        }
      >
        {editingProcess && (
          <form id="editProcessForm" onSubmit={handleUpdateProcess}>
            <div className="p-3 p-sm-4">
              <div className="mb-3">
                <label htmlFor="editProcessName" className="form-label">
                  Process Name <span className="text-danger">*</span>
                </label>
                <InputText
                  id="editProcessName"
                  value={editingProcess.processName}
                  onChange={(e) =>
                    setEditingProcess({
                      ...editingProcess,
                      processName: e.target.value,
                    })
                  }
                  placeholder="Enter process name"
                  className="w-100"
                  required
                />
              </div>
            </div>
          </form>
        )}
      </MasterSidebar>

      {/* Sub-Processes Sidebar */}
      <MasterSidebar
        title={selectedProcess?.name}
        show={showSubProcessesSidebar}
        onClose={() => setShowSubProcessesSidebar(false)}
        className="sidebar-responsive"
        bodyClassName="p-2 p-sm-3"
      >
          <button
            className="btn btn-primary mb-3 w-100 w-sm-auto d-flex align-items-center justify-content-center gap-2"
            onClick={() => {
              setNewSubProcessName('');
              setShowAddSubProcessSidebar(true);
            }}
          >
            <i className="pi pi-plus"></i>
            <span>Add New Sub-Process</span>
          </button>
          <ResponsiveDataTable
              value={subProcesses.slice(subFirst, subFirst + subRows)}
              loading={loading}
              dataKey="Id"
              className="p-datatable-gridlines process-datatable"
              emptyMessage="No sub-processes found"
              rowClassName={() => 'process-row'}
              responsiveLayout="scroll"
              globalFilterFields={['subProcessName']}
            >
              <Column
                field="subProcessName"
                header="Sub-Process Name"
                sortable
                filter
                mobile={{ primary: true }}
                className="col-process-name"
              />
              <Column
                header="Action"
                body={subProcessActionBodyTemplate}
                mobile={{ action: true }}
                className="col-action"
              />
            </ResponsiveDataTable>
            <CustomPaginator
              first={subFirst}
              rows={subRows}
              totalRecords={subProcesses.length}
              onPageChange={onSubPageChange}
              rowsPerPageOptions={[5, 10, 20]}
            />
      </MasterSidebar>

      {/* Add Sub-Process Sidebar */}
      <MasterSidebar
        title="Add New Sub-Process"
        show={showAddSubProcessSidebar}
        onClose={() => setShowAddSubProcessSidebar(false)}
        className="sidebar-responsive"
        footer={
          <div className="offcanvas-footer">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                setShowAddSubProcessSidebar(false);
                setNewSubProcessName('');
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-success btn-sm" form="addSubProcessForm">
              Save
            </button>
          </div>
        }
      >
        <form id="addSubProcessForm" onSubmit={handleAddSubProcess}>
          <div className="p-3 p-sm-4">
            <div className="mb-3">
              <label className="form-label">Parent Process</label>
              <InputText
                value={selectedProcess?.name || ''}
                disabled
                className="w-100"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="subProcessName" className="form-label">
                Sub-Process Name <span className="text-danger">*</span>
              </label>
              <InputText
                id="subProcessName"
                value={newSubProcessName}
                onChange={(e) => setNewSubProcessName(e.target.value)}
                placeholder="Enter sub-process name"
                className="w-100"
                required
              />
            </div>
          </div>
        </form>
      </MasterSidebar>

      {/* Edit Sub-Process Sidebar */}
      <MasterSidebar
        title="Edit Sub-Process"
        show={showEditSubProcessSidebar}
        onClose={() => setShowEditSubProcessSidebar(false)}
        className="sidebar-responsive"
        footer={
          <div className="offcanvas-footer">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowEditSubProcessSidebar(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-success btn-sm" form="editSubProcessForm">
              Update
            </button>
          </div>
        }
      >
        {editingSubProcess && (
          <form id="editSubProcessForm" onSubmit={handleUpdateSubProcess}>
            <div className="p-3 p-sm-4">
              <div className="mb-3">
                <label className="form-label">Parent Process</label>
                <InputText
                  value={selectedProcess?.name || ''}
                  disabled
                  className="w-100"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="editSubProcessName" className="form-label">
                  Sub-Process Name <span className="text-danger">*</span>
                </label>
                <InputText
                  id="editSubProcessName"
                  value={editingSubProcess.subProcessName}
                  onChange={(e) =>
                    setEditingSubProcess({
                      ...editingSubProcess,
                      subProcessName: e.target.value,
                    })
                  }
                  placeholder="Enter sub-process name"
                  className="w-100"
                  required
                />
              </div>
            </div>
          </form>
        )}
      </MasterSidebar>


      <style>{`
        /* Fix dropdown overflow in offcanvas */
        .sidebar-responsive .offcanvas-body {
          overflow: visible !important;
        }

        .p-dropdown-panel {
          z-index: 1100 !important;
        }

        /* Ensure dropdown panel appears above offcanvas */
        .offcanvas.show {
          z-index: 1045 !important;
        }

        .p-dropdown-panel {
          z-index: 1100 !important;
          position: fixed !important;
        }

        /* Responsive Sidebar */
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

        /* Card Styling */
        // .card_tb {
        //   border: none !important;
        //   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
        //   margin-bottom: 1rem;
        // }

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
        /* Process Row Styling - MEDIUM COMPACT */
        /* Removed to match FacilityMaster styling */
        }

        .action-btn .pi {
          font-size: 0.75rem !important;
        }

        @media (max-width: 768px) {
          .action-btn {
            padding: 0.25rem !important;
            width: 30px !important;
            height: 30px !important;
          }

          .action-btn .pi {
            font-size: 0.7rem !important;
          }
        }

        @media (max-width: 576px) {
          .action-btn {
            padding: 0.2rem !important;
            width: 28px !important;
            height: 28px !important;
          }

          .action-btn .pi {
            font-size: 0.65rem !important;
          }
        }

        /* DataTable Responsive */
        .process-datatable .p-datatable-thead > tr > th {
          padding: 0.6rem 0.6rem !important;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .process-datatable .p-datatable-thead > tr > th:first-child {
          padding-left: 0.85rem !important;
        }

        @media (max-width: 768px) {
          .process-datatable .p-datatable-thead > tr > th {
            padding: 0.5rem 0.5rem !important;
            font-size: 0.8rem;
          }
        }

        @media (max-width: 576px) {
          .process-datatable .p-datatable-thead > tr > th {
            padding: 0.4rem 0.4rem !important;
            font-size: 0.75rem;
          }

          .col-process-name {
            width: 60% !important;
          }

          .col-action {
            width: 40% !important;
          }
        }

        /* Offcanvas Footer */
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

        /* Cancel Button Styling */
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

        /* Save Button Styling */
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

        /* Form Styling */
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

        /* Button Sizing */
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

          .gap-2 {
            gap: 0.75rem !important;
          }

          .d-flex {
            flex-direction: column;
          }

          .d-flex.flex-wrap {
            flex-direction: row;
            flex-wrap: wrap;
          }

          .justify-content-end {
            justify-content: flex-start;
          }
        }

        /* Primary Button */
        .btn-primary {
          background-color: #6366f1 !important;
          border-color: #6366f1 !important;
          color: white !important;
        }

        .btn-primary:hover {
          background-color: #4f46e5 !important;
          border-color: #4f46e5 !important;
          color: white !important;
        }

        .btn-primary:active,
        .btn-primary:focus {
          background-color: #4338ca !important;
          border-color: #4338ca !important;
          color: white !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
};

export default ProcessMaster;