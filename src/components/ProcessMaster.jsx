import React, { useState, useEffect } from 'react';
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import ProcessMasterService from '../services/compliance/ProcessMasterService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import sessionManager from '../utils/SessionManager';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';

const ProcessMaster = () => {
  const [processes, setProcesses] = useState([]);
  const [subProcesses, setSubProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [newProcessName, setNewProcessName] = useState('');
  const [newSubProcessName, setNewSubProcessName] = useState('');
  const [editingProcess, setEditingProcess] = useState(null);
  const [editingSubProcess, setEditingSubProcess] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showAddProcessSidebar, setShowAddProcessSidebar] = useState(false);
  const [showEditProcessSidebar, setShowEditProcessSidebar] = useState(false);
  const [showSubProcessesSidebar, setShowSubProcessesSidebar] = useState(false);
  const [showAddSubProcessSidebar, setShowAddSubProcessSidebar] = useState(false);
  const [showEditSubProcessSidebar, setShowEditSubProcessSidebar] = useState(false);

  const facilityId = sessionManager.getUserSession().FacilityID;

  useEffect(() => {
    fetchProcesses();
  }, []);

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      const data = await ProcessMasterService.getProcess(facilityId);
      setProcesses(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Error fetching processes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubProcesses = async (processId, processName) => {
    try {
      setLoading(true);
      const data = await ProcessMasterService.getSubProcess(processId);
      setSubProcesses(Array.isArray(data) ? data : []);
      setSelectedProcess({ id: processId, name: processName });
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

  const processActionBodyTemplate = (rowData) => (
    <div className="process-action-buttons d-flex gap-1 justify-content-start flex-wrap">
      <Button
        icon="pi pi-eye"
        className="p-button-rounded p-button-info p-button-sm action-btn"
        onClick={() => fetchSubProcesses(rowData.Id, rowData.processName)}
        tooltip="View Sub-Processes"
        tooltipPosition="top"
      />
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
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="middle">
        <div className="row g-2 g-sm-3">
          <div className="col-12">
            <div className="card_tb">
              <div className="card-body p-2 p-sm-3">
                <DataTable
                  value={processes}
                  loading={loading}
                  paginator
                  rows={10}
                  rowsPerPageOptions={[5, 10, 20]}
                  dataKey="Id"
                  className="p-datatable-gridlines process-datatable"
                  emptyMessage="No processes found"
                  rowClassName={() => 'process-row'}
                  responsiveLayout="scroll"
                  globalFilterFields={['processName']}
                >
                  <Column
                    field="processName"
                    header="Process Name"
                    sortable
                    filter
                    className="col-process-name"
                  />
                  <Column
                    header="Action"
                    body={processActionBodyTemplate}
                    className="col-action"
                  />
                </DataTable>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Process Sidebar */}
      <div
        className={`offcanvas offcanvas-end sidebar-responsive${showAddProcessSidebar ? ' show' : ''}`}
        tabIndex="-1"
        id="addProcessSidebar"
        data-bs-backdrop="static"
        data-bs-scroll="true"
      >
        <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <h5 className="subtitle fw-normal mb-0">Add New Process</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => setShowAddProcessSidebar(false)}
          ></button>
        </div>
        <form onSubmit={handleAddProcess}>
          <div className="offcanvas-body p-3 p-sm-4">
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
          <div className="offcanvas-footer">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowAddProcessSidebar(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-success btn-sm">
              Save
            </button>
          </div>
        </form>
      </div>

      {/* Edit Process Sidebar */}
      <div
        className={`offcanvas offcanvas-end sidebar-responsive${showEditProcessSidebar ? ' show' : ''}`}
        tabIndex="-1"
        id="editProcessSidebar"
        data-bs-backdrop="static"
        data-bs-scroll="true"
      >
        <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <h5 className="subtitle fw-normal mb-0">Edit Process</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => setShowEditProcessSidebar(false)}
          ></button>
        </div>
        {editingProcess && (
          <form onSubmit={handleUpdateProcess}>
            <div className="offcanvas-body p-3 p-sm-4">
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
            <div className="offcanvas-footer">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setShowEditProcessSidebar(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-success btn-sm">
                Update
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Sub-Processes Sidebar */}
      <div
        className={`offcanvas offcanvas-end sidebar-responsive${showSubProcessesSidebar ? ' show' : ''}`}
        tabIndex="-1"
        id="subProcessesSidebar"
        data-bs-backdrop="static"
        data-bs-scroll="true"
      >
        <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <div>
            <h5 className="subtitle fw-normal mb-1">
              {selectedProcess?.name}
            </h5>
          </div>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => setShowSubProcessesSidebar(false)}
          ></button>
        </div>
        <div className="offcanvas-body p-2 p-sm-3">
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
          <div className="table-responsive">
            <DataTable
              value={subProcesses}
              loading={loading}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 20]}
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
                className="col-process-name"
              />
              <Column
                header="Action"
                body={subProcessActionBodyTemplate}
                className="col-action"
              />
            </DataTable>
          </div>
        </div>
      </div>

      {/* Add Sub-Process Sidebar */}
      <div
        className={`offcanvas offcanvas-end sidebar-responsive${showAddSubProcessSidebar ? ' show' : ''}`}
        tabIndex="-1"
        id="addSubProcessSidebar"
        data-bs-backdrop="static"
        data-bs-scroll="true"
      >
        <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <h5 className="subtitle fw-normal mb-0">Add New Sub-Process</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => setShowAddSubProcessSidebar(false)}
          ></button>
        </div>
        <form onSubmit={handleAddSubProcess}>
          <div className="offcanvas-body p-3 p-sm-4">
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
            <button type="submit" className="btn btn-success btn-sm">
              Save
            </button>
          </div>
        </form>
      </div>

      {/* Edit Sub-Process Sidebar */}
      <div
        className={`offcanvas offcanvas-end sidebar-responsive${showEditSubProcessSidebar ? ' show' : ''}`}
        tabIndex="-1"
        id="editSubProcessSidebar"
        data-bs-backdrop="static"
        data-bs-scroll="true"
      >
        <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <h5 className="subtitle fw-normal mb-0">Edit Sub-Process</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => setShowEditSubProcessSidebar(false)}
          ></button>
        </div>
        {editingSubProcess && (
          <form onSubmit={handleUpdateSubProcess}>
            <div className="offcanvas-body p-3 p-sm-4">
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
            <div className="offcanvas-footer">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setShowEditSubProcessSidebar(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-success btn-sm">
                Update
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Single Backdrop for all sidebars */}
      {anySidebarOpen && (
        <div className="offcanvas-backdrop show" onClick={closeAllSidebars}></div>
      )}

      <style>{`
        /* Offcanvas Transition - KEY FIX */
        .offcanvas {
          visibility: hidden;
          transform: translateX(100%);
          transition: transform 0.3s ease-in-out, visibility 0.3s ease-in-out;
        }

        .offcanvas.show {
          visibility: visible;
          transform: translateX(0);
        }

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
          border: none !important;
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
        .card_tb {
          border: none !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
          margin-bottom: 1rem;
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

        /* DataTable Border Cleanup */
        .process-datatable {
          border: none !important;
          font-size: 0.925rem;
        }

        .process-datatable .p-datatable {
          border: none !important;
        }

        .process-datatable .p-datatable-wrapper {
          border: none !important;
        }

        /* Grid Lines Only */
        .p-datatable-gridlines .p-datatable-tbody > tr > td {
          border-right: 1px solid #f3f4f6 !important;
          border-bottom: 1px solid #f3f4f6 !important;
        }

        .p-datatable-gridlines .p-datatable-thead > tr > th {
          border-right: 1px solid #f3f4f6 !important;
          border-bottom: 1px solid #e5e7eb !important;
        }

        /* Last Column No Right Border */
        .p-datatable-tbody > tr > td:last-child,
        .p-datatable-thead > tr > th:last-child {
          border-right: none !important;
        }

        /* Process Row Styling - MEDIUM COMPACT */
        .process-row {
          height: 2.5rem !important;
        }

        .process-row .p-datatable-cell {
          padding: 0.4rem 0.6rem !important;
          font-size: 0.85rem;
          line-height: 1.3;
        }

        .process-row .p-datatable-cell:first-child {
          padding-left: 0.85rem !important;
        }

        @media (max-width: 768px) {
          .process-row {
            height: 2.25rem !important;
          }

          .process-row .p-datatable-cell {
            padding: 0.35rem 0.5rem !important;
            font-size: 0.8rem;
          }
        }

        @media (max-width: 576px) {
          .process-row {
            height: 2rem !important;
          }

          .process-row .p-datatable-cell {
            padding: 0.3rem 0.4rem !important;
            font-size: 0.75rem;
          }
        }

        /* Action Buttons - MEDIUM SIZE */
        .process-action-buttons {
          gap: 0.2rem !important;
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }

        .action-btn {
          padding: 0.3rem !important;
          min-width: auto !important;
          width: 32px !important;
          height: 32px !important;
          display: flex;
          align-items: center;
          justify-content: center;
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
            font-size: 0.8rem !important;
            height: 36px;
          }
        }

        /* Typography Responsive */
        .card-title {
          font-size: 1.15rem;
        }

        @media (max-width: 768px) {
          .card-title {
            font-size: 1.05rem;
          }
        }

        @media (max-width: 576px) {
          .card-title {
            font-size: 0.95rem;
          }
        }

        /* Pagination Responsive */
        .p-paginator {
          flex-wrap: wrap;
          padding: 0.6rem !important;
          gap: 0.3rem;
        }

        .p-paginator .p-paginator-left-content,
        .p-paginator .p-paginator-right-content {
          font-size: 0.85rem;
        }

        @media (max-width: 576px) {
          .p-paginator {
            gap: 0.2rem !important;
            padding: 0.45rem !important;
            gap: 0.2rem !important;
          }

          .p-paginator-left-content,
          .p-paginator-right-content {
            font-size: 0.8rem !important;
          }
        }

        /* Input Responsive */
        .p-inputtext {
          padding: 0.5rem 0.75rem !important;
          font-size: 1rem;
          width: 100%;
        }

        @media (max-width: 576px) {
          .p-inputtext {
            padding: 0.4rem 0.6rem !important;
            font-size: 0.95rem;
          }
        }

        /* Tooltip Responsive */
        @media (max-width: 576px) {
          .p-tooltip {
            display: none !important;
          }
        }

        /* Flexbox Utilities */
        @media (max-width: 576px) {
          .gap-1 {
            gap: 0.5rem !important;
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

        /* Backdrop */
        .offcanvas-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1040;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.5);
        }

        .offcanvas-backdrop.show {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default ProcessMaster;