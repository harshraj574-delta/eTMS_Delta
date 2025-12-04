import React, { useState, useEffect } from 'react';
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import MasterSidebar from "./Master/MasterSidebar";
import Loader from "./common/Loader";
import FeedbackMasterService from '../services/compliance/FeedbackMasterService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import sessionManager from '../utils/SessionManager';

import { IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';

const FeedbackMaster = () => {
  const [complaintTypes, setComplaintTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newComplaintName, setNewComplaintName] = useState('');
  const [newSeverity, setNewSeverity] = useState(null);
  const [newCategoryId, setNewCategoryId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  const [showAddComplaintSidebar, setShowAddComplaintSidebar] = useState(false);
  const [showEditComplaintSidebar, setShowEditComplaintSidebar] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);

  const facilityId = sessionManager.getUserSession().FacilityID;

  const severityOptions = [
    { label: 'SEV 1', value: 1 },
    { label: 'SEV 2', value: 2 },
    { label: 'SEV 3', value: 3 },
  ];

  const categoryOptions = categories.map((cat) => ({
    label: cat.Category,
    value: cat.id,
  }));

  useEffect(() => {
    fetchCategories();
  }, []);

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
      toast.error('Error fetching categories');
      console.error(error);
      setCategoriesLoaded(true);
    }
  };

  const fetchComplaintTypes = async (categoryId = '') => {
    try {
      setLoading(true);
      const data = await FeedbackMasterService.GetComplaintType(categoryId);
      setComplaintTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Error fetching complaint types');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (e) => {
    const categoryId = e.value?.value || e.value;
    setSelectedCategory(categoryId);
    fetchComplaintTypes(categoryId);
  };

  const handleAddComplaint = async (e) => {
    e.preventDefault();
    if (!newComplaintName.trim()) {
      toast.warn('Please enter complaint name');
      return;
    }
    if (newSeverity === null) {
      toast.warn('Please select severity');
      return;
    }
    if (!newCategoryId) {
      toast.warn('Please select category');
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
      setNewComplaintName('');
      setNewSeverity(null);
      setNewCategoryId(null);
      setShowAddComplaintSidebar(false);
      toast.success('Complaint type added successfully');
    } catch (error) {
      toast.error('Error adding complaint type');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateComplaint = async (e) => {
    e.preventDefault();
    if (!editingComplaint.CompName.trim()) {
      toast.warn('Please enter complaint name');
      return;
    }
    if (editingComplaint.severity === null) {
      toast.warn('Please select severity');
      return;
    }
    if (!editingComplaint.categoryId) {
      toast.warn('Please select category');
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
      toast.success('Complaint type updated successfully');
    } catch (error) {
      toast.error('Error updating complaint type');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const actionBodyTemplate = (rowData) => (
    <div className="process-action-buttons d-flex gap-1 justify-content-start flex-wrap">
      <IconButton
        sx={{ color: '#1976d2' }}
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
    setNewComplaintName('');
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
        <div className="row g-2 g-sm-3">
          <div className="col-12">
            <div className="card_tb">
              <div className="card-body p-2 p-sm-3">
                {categoriesLoaded && (
                  <div className="mb-3">
                    <label className="form-label">Category</label>
                    <Dropdown
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                      options={categoryOptions}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Category"
                      className="w-100 mb-2"
                      style={{ maxWidth: '300px' }}
                    />
                  </div>
                )}

                <DataTable
                  value={complaintTypes}
                  loading={loading}
                  paginator
                  rows={10}
                  rowsPerPageOptions={[5, 10, 20]}
                  dataKey="Id"
                  className="p-datatable-gridlines process-datatable"
                  emptyMessage="No complaint types found"
                  rowClassName={() => 'process-row'}
                  responsiveLayout="scroll"
                  globalFilterFields={['CompName', 'Category']}
                >
                  <Column
                    field="Category"
                    header="Category"
                    sortable
                    filter
                    className="col-process-name"
                  />
                  <Column
                    field="CompName"
                    header="Complaint Name"
                    sortable
                    filter
                    className="col-process-name"
                  />
                  <Column
                    field="severity"
                    header="Severity"
                    sortable
                    style={{ width: '100px', textAlign: 'center' }}
                  />
                  <Column
                    header="Action"
                    body={actionBodyTemplate}
                    className="col-action"
                  />
                </DataTable>
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
        footerButtons={[
          {
            label: "Cancel",
            className: "btn btn-outline-secondary btn-sm",
            onClick: () => setShowAddComplaintSidebar(false)
          },
          {
            label: "Save",
            type: "submit",
            className: "btn btn-success btn-sm",
            onClick: handleAddComplaint
          }
        ]}
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
        footerButtons={[
          {
            label: "Cancel",
            className: "btn btn-outline-secondary btn-sm",
            onClick: () => setShowEditComplaintSidebar(false)
          },
          {
            label: "Update",
            type: "submit",
            className: "btn btn-success btn-sm",
            onClick: handleUpdateComplaint
          }
        ]}
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
          // border: none !important;
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
          justify-content: center;
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

        /* Dropdown Height Reduction - Main Page */
        .card_tb .p-dropdown {
          padding: 0.35rem 0.5rem !important;
          font-size: 0.9rem !important;
          height: 36px !important;
          width: 100% !important;
          display: flex !important;
          align-items: center !important;
        }

        .card_tb .p-dropdown .p-dropdown-label {
          padding: 0.25rem 0 !important;
          display: flex !important;
          align-items: center !important;
        }

        .card_tb .p-dropdown .p-dropdown-trigger {
          width: 2rem !important;
          padding-right: 0.4rem !important;
        }

        .card_tb .p-dropdown .p-dropdown-trigger .pi {
          font-size: 0.75rem !important;
        }

        /* Dropdown in Offcanvas/Dialog */
        .offcanvas-body .p-dropdown,
        .p-dialog .p-dropdown {
          padding: 0.5rem 0.75rem !important;
          font-size: 0.95rem !important;
          height: 40px !important;
          width: 100% !important;
          display: flex !important;
          align-items: center !important;
        }

        .offcanvas-body .p-dropdown .p-dropdown-label,
        .p-dialog .p-dropdown .p-dropdown-label {
          padding: 0.3rem 0 !important;
          display: flex !important;
          align-items: center !important;
        }

        .offcanvas-body .p-dropdown .p-dropdown-trigger,
        .p-dialog .p-dropdown .p-dropdown-trigger {
          width: 2.5rem !important;
          padding-right: 0.5rem !important;
        }

        .offcanvas-body .p-dropdown .p-dropdown-trigger .pi,
        .p-dialog .p-dropdown .p-dropdown-trigger .pi {
          font-size: 0.9rem !important;
        }

        @media (max-width: 768px) {
          .card_tb .p-dropdown {
            padding: 0.3rem 0.45rem !important;
            height: 34px !important;
            font-size: 0.85rem !important;
          }

          .card_tb .p-dropdown .p-dropdown-trigger {
            width: 1.8rem !important;
          }

          .offcanvas-body .p-dropdown,
          .p-dialog .p-dropdown {
            padding: 0.45rem 0.65rem !important;
            height: 38px !important;
            font-size: 0.9rem !important;
          }
        }

        @media (max-width: 576px) {
          .card_tb .p-dropdown {
            padding: 0.25rem 0.4rem !important;
            height: 32px !important;
            font-size: 0.8rem !important;
          }

          .card_tb .p-dropdown .p-dropdown-trigger {
            width: 1.6rem !important;
            padding-right: 0.3rem !important;
          }

          .offcanvas-body .p-dropdown,
          .p-dialog .p-dropdown {
            padding: 0.4rem 0.6rem !important;
            height: 36px !important;
            font-size: 0.85rem !important;
          }

          .offcanvas-body .p-dropdown .p-dropdown-trigger,
          .p-dialog .p-dropdown .p-dropdown-trigger {
            width: 2rem !important;
            padding-right: 0.4rem !important;
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

        /* Paginator Dropdown - Compact Style */
        .p-paginator .p-dropdown {
          padding: 0.25rem 0.4rem !important;
          font-size: 0.8rem !important;
          height: 28px !important;
          width: auto !important;
          max-width: 70px !important;
          min-width: 50px !important;
          display: flex !important;
          align-items: center !important;
          border-radius: 3px !important;
        }

        .p-paginator .p-dropdown .p-dropdown-label {
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          height: 100% !important;
          font-size: 0.8rem !important;
          white-space: nowrap !important;
        }

        .p-paginator .p-dropdown .p-dropdown-trigger {
          width: 1.5rem !important;
          padding-right: 0.2rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex-shrink: 0 !important;
        }

        .p-paginator .p-dropdown .p-dropdown-trigger .pi {
          font-size: 0.65rem !important;
        }

        .p-paginator .p-dropdown .p-dropdown-items {
          max-height: 150px !important;
          min-width: 50px !important;
        }

        @media (max-width: 768px) {
          .p-paginator .p-dropdown {
            padding: 0.2rem 0.35rem !important;
            height: 26px !important;
            font-size: 0.75rem !important;
            max-width: 65px !important;
          }

          .p-paginator .p-dropdown .p-dropdown-trigger {
            width: 1.4rem !important;
            padding-right: 0.15rem !important;
          }
        }

        @media (max-width: 576px) {
          .p-paginator .p-dropdown {
            padding: 0.15rem 0.3rem !important;
            height: 24px !important;
            font-size: 0.7rem !important;
            max-width: 60px !important;
          }

          .p-paginator .p-dropdown .p-dropdown-trigger {
            width: 1.3rem !important;
            padding-right: 0.1rem !important;
          }

          .p-paginator .p-dropdown .p-dropdown-trigger .pi {
            font-size: 0.6rem !important;
          }
        }

        .offcanvas-body {
          overflow: visible !important;
        }

        .p-dropdown-panel {
          z-index: 1200 !important;
          position: absolute !important;
        }

        .offcanvas {
          overflow: visible !important;
        }

        .p-dropdown-panel {
          z-index: 9999 !important;
        }

        /* When used inside offcanvas or dialog modals */
        .p-dialog .p-dropdown-panel,
        .offcanvas-body .p-dropdown,
        .p-dialog .p-dropdown {
          padding: 0.5rem 0.75rem !important;
          font-size: 0.95rem !important;
          height: 40px !important;
          width: 100% !important;
          display: flex !important;
          align-items: center !important;
        }

        .offcanvas-body .p-dropdown .p-dropdown-label,
        .p-dialog .p-dropdown .p-dropdown-label {
          padding: 0.3rem 0 !important;
          display: flex !important;
          align-items: center !important;
        }

        .offcanvas-body .p-dropdown .p-dropdown-trigger,
        .p-dialog .p-dropdown .p-dropdown-trigger {
          width: 2.5rem !important;
          padding-right: 0.5rem !important;
        }

        .offcanvas-body .p-dropdown .p-dropdown-trigger .pi,
        .p-dialog .p-dropdown .p-dropdown-trigger .pi {
          font-size: 0.9rem !important;
        }

        @media (max-width: 768px) {
          .card_tb .p-dropdown {
            padding: 0.3rem 0.45rem !important;
            height: 34px !important;
            font-size: 0.85rem !important;
          }

          .card_tb .p-dropdown .p-dropdown-trigger {
            width: 1.8rem !important;
          }

          .offcanvas-body .p-dropdown,
          .p-dialog .p-dropdown {
            padding: 0.45rem 0.65rem !important;
            height: 38px !important;
            font-size: 0.9rem !important;
          }
        }

        @media (max-width: 576px) {
          .card_tb .p-dropdown {
            padding: 0.25rem 0.4rem !important;
            height: 32px !important;
            font-size: 0.8rem !important;
          }

          .card_tb .p-dropdown .p-dropdown-trigger {
            width: 1.6rem !important;
            padding-right: 0.3rem !important;
          }

          .offcanvas-body .p-dropdown,
          .p-dialog .p-dropdown {
            padding: 0.4rem 0.6rem !important;
            height: 36px !important;
            font-size: 0.85rem !important;
          }

          .offcanvas-body .p-dropdown .p-dropdown-trigger,
          .p-dialog .p-dropdown .p-dropdown-trigger {
            width: 2rem !important;
            padding-right: 0.4rem !important;
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

        /* Paginator Dropdown - Compact Style */
        .p-paginator .p-dropdown {
          padding: 0.25rem 0.4rem !important;
          font-size: 0.8rem !important;
          height: 28px !important;
          width: auto !important;
          max-width: 70px !important;
          min-width: 50px !important;
          display: flex !important;
          align-items: center !important;
          border-radius: 3px !important;
        }

        .p-paginator .p-dropdown .p-dropdown-label {
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          height: 100% !important;
          font-size: 0.8rem !important;
          white-space: nowrap !important;
        }

        .p-paginator .p-dropdown .p-dropdown-trigger {
          width: 1.5rem !important;
          padding-right: 0.2rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex-shrink: 0 !important;
        }

        .p-paginator .p-dropdown .p-dropdown-trigger .pi {
          font-size: 0.65rem !important;
        }

        .p-paginator .p-dropdown .p-dropdown-items {
          max-height: 150px !important;
          min-width: 50px !important;
        }

        @media (max-width: 768px) {
          .p-paginator .p-dropdown {
            padding: 0.2rem 0.35rem !important;
            height: 26px !important;
            font-size: 0.75rem !important;
            max-width: 65px !important;
          }

          .p-paginator .p-dropdown .p-dropdown-trigger {
            width: 1.4rem !important;
            padding-right: 0.15rem !important;
          }
        }

        @media (max-width: 576px) {
          .p-paginator .p-dropdown {
            padding: 0.15rem 0.3rem !important;
            height: 24px !important;
            font-size: 0.7rem !important;
            max-width: 60px !important;
          }

          .p-paginator .p-dropdown .p-dropdown-trigger {
            width: 1.3rem !important;
            padding-right: 0.1rem !important;
          }

          .p-paginator .p-dropdown .p-dropdown-trigger .pi {
            font-size: 0.6rem !important;
          }
        }

        .offcanvas-body {
          overflow: visible !important;
        }

        .p-dropdown-panel {
          z-index: 1200 !important;
          position: absolute !important;
        }

        .offcanvas {
          overflow: visible !important;
        }

        .p-dropdown-panel {
          z-index: 9999 !important;
        }

        /* When used inside offcanvas or dialog modals */
        .p-dialog .p-dropdown-panel,
        .offcanvas .p-dropdown-panel {
          z-index: 11000 !important;
          position: fixed !important;
        }


      `}</style>
    </div>
  );
};

export default FeedbackMaster;