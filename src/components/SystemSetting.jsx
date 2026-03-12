import React, { useState, useEffect, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import MasterSidebar from "./Master/MasterSidebar";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { CustomDataTable } from "./common/CustomDataTable";
import CustomPaginator from "./common/CustomPaginator";
import { Column } from "primereact/column";
import CostMasterService from "../services/compliance/CostMasterService";
import SystemSettingService from "../services/compliance/SystemSettingService";
import { toastService } from "../services/toastService";
import sessionManager from "../utils/SessionManager.js";
import TableToolbar from "./common/TableToolbar";
import { MultiSelect } from "primereact/multiselect";
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';

const SystemSetting = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(1);
  const [facilities, setFacilities] = useState([]);
  
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
  const UserID = sessionManager.getUserSession().ID;
  const [loading, setLoading] = useState(true);
  const [configData, setConfigData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Filter State
  const [globalFilter, setGlobalFilter] = useState("");
  const [filters, setFilters] = useState({
    configName: null,
    description: null,
    CreatedBy: null
  });

  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(50);

  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  const op = useRef(null);
  const filterButtonRef = useRef(null);

  useEffect(() => {
    let result = [...configData];

    // Apply Advanced Filters
    if (filters.configName && filters.configName.length > 0) {
      result = result.filter((item) => filters.configName.includes(item.configName));
    }
    if (filters.description && filters.description.length > 0) {
      result = result.filter((item) => filters.description.includes(item.description));
    }
    if (filters.CreatedBy && filters.CreatedBy.length > 0) {
      result = result.filter((item) => filters.CreatedBy.includes(item.CreatedBy));
    }

    // Apply Global Filter
    if (globalFilter && globalFilter.trim() !== "") {
      const searchLower = globalFilter.toLowerCase();
      result = result.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchLower)
        )
      );
    }

    setFilteredData(result);
  }, [configData, filters, globalFilter]);

  const getUniqueValues = (field) => {
    const values = configData.map((item) => item[field]).filter(Boolean);
    return [...new Set(values)].map((val) => ({ label: val, value: val }));
  };

  const clearAdvancedFilters = () => {
    setFilters({
      configName: null,
      description: null,
      CreatedBy: null
    });
    if (op.current) op.current.hide();
    toastService.info("Filters cleared");
  };

  // Date formatting function
  const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
  };

  useEffect(() => {
    fetchFacilities();
    fetchConfigData();
  }, []);

  useEffect(() => {
    if (selectedFacility) {
      fetchConfigData();
    }
  }, [selectedFacility]);



  const actionBodyTemplate = (rowData) => (
    <div className="d-flex gap-1 justify-content-start">
      <IconButton
        sx={{ color: '#1976d2' }}
        size="small"
        className="action-btn"
        onClick={() => {
          setEditRow(rowData);
          setSidebarVisible(true);
        }}
        title="Edit"
      >
        <EditIcon fontSize="small" />
      </IconButton>
    </div>
  );

  // Fetch Facilities
  const fetchFacilities = async () => {
    try {
      const response = await CostMasterService.SelectFacility({
        Userid: UserID,
      });
      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      const formattedData = Array.isArray(parsedResponse)
        ? parsedResponse.map((item) => ({
            label: item.facility || item.facilityName,
            value: item.Id,
          }))
        : [];
      setFacilities(formattedData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      setLoading(false);
    }
  };

  // Fetch Configuration Data
  const fetchConfigData = async () => {
    try {
      setIsSubmitting(true);
      const response = await SystemSettingService.GetConfiguration({
        facilityid: selectedFacility,
      });
      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      setConfigData(parsedResponse);
      setFilteredData(parsedResponse);
      setFirst(0); // Reset pagination on data load
    } catch (error) {
      console.error("Error fetching configuration data:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Save
  const handleSave = async () => {
    setIsSubmitting(true);
    if (!editRow) {
      console.error("No row selected for editing.");
      setIsSubmitting(false);
      return;
    }

    const regexPattern = "^[1-9]+[0-9]*$";
    const regex = new RegExp(regexPattern);
    if (!regex.test(editRow.configValue)) {
      toastService.error("Please enter numeric value.");
      setIsSubmitting(false);
      return;
    }

    try {
      await SystemSettingService.AddSetting({
        configname: editRow.configName,
        configvalue: editRow.configValue,
        description: editRow.description,
        id: editRow.id,
        userid: UserID,
      });

      setSidebarVisible(false);
      toastService.success("Settings saved successfully.");
      fetchConfigData();
    } catch (error) {
      console.error("Error saving settings:", error);
      toastService.error("An error occurred while saving. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Loader isVisible={isSubmitting} fullScreen={true} />
      <Header
        pageTitle="System Setting"
        showNewButton={false}
        onNewButtonClick={() => {}}
      />
      <Sidebar />
      <div className="middle">
        <div className="card_tb p-3">
          <div className="row">
            <div className="col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
              <label htmlFor="facility" className="form-label">Facility</label>
              <Dropdown
                id="facility"
                placeholder="Select Facility"
                value={selectedFacility}
                options={facilities}
                onChange={(e) => {
                  setSelectedFacility(e.value);
                }}
                className="w-100"
                defaultValue={1}
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-12 p-3">
            <div className="card_tb">
              <div className="p-3">
                <TableToolbar
                  search={globalFilter}
                  onSearch={(e) => setGlobalFilter(e.target.value)}
                  onRefresh={() => fetchConfigData()}
                  showFilter={true}
                  activeFilterCount={
                    Object.values(filters).filter((f) => Array.isArray(f) && f.length > 0)
                      .length
                  }
                  overlayRef={op}
                  filterButtonRef={filterButtonRef}
                  filters={filters}
                  setFilters={setFilters}
                >
                  <div className="ota-filter-header">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <span className="ota-filter-icon">
                          <i className="pi pi-filter" />
                        </span>
                        <div>
                          <div className="ota-filter-title">Advanced filters</div>
                          <div className="ota-filter-subtitle">
                            Refine settings list
                          </div>
                        </div>
                      </div>
                      {Object.values(filters).filter(
                        (f) => Array.isArray(f) && f.length > 0
                      ).length > 0 && (
                          <span
                            className="badge bg-primary"
                            style={{ fontSize: "0.7rem", borderRadius: "999px" }}
                          >
                            {Object.values(filters).filter(
                              (f) => Array.isArray(f) && f.length > 0
                            ).length}
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="ota-filter-body">
                    <div className="ota-filter-field">
                      <label className="ota-filter-label">Parameter Name</label>
                      <MultiSelect
                        value={filters.configName}
                        options={getUniqueValues("configName")}
                        onChange={(e) =>
                          setFilters({ ...filters, configName: e.value })
                        }
                        placeholder="Select Parameter"
                        maxSelectedLabels={2}
                        className="w-100 p-inputtext-sm"
                        display="chip"
                        filter
                        showClear
                      />
                    </div>
                    <div className="ota-filter-field">
                      <label className="ota-filter-label">Description</label>
                      <MultiSelect
                        value={filters.description}
                        options={getUniqueValues("description")}
                        onChange={(e) =>
                          setFilters({ ...filters, description: e.value })
                        }
                        placeholder="Select Description"
                        maxSelectedLabels={2}
                        className="w-100 p-inputtext-sm"
                        display="chip"
                        filter
                        showClear
                      />
                    </div>
                    <div className="ota-filter-field">
                      <label className="ota-filter-label">Created By</label>
                      <MultiSelect
                        value={filters.CreatedBy}
                        options={getUniqueValues("CreatedBy")}
                        onChange={(e) =>
                          setFilters({ ...filters, CreatedBy: e.value })
                        }
                        placeholder="Select User"
                        maxSelectedLabels={2}
                        className="w-100 p-inputtext-sm"
                        display="chip"
                        filter
                        showClear
                      />
                    </div>
                  </div>

                  <div className="ota-filter-footer">
                    <Button
                      label="Clear all filters"
                      icon="pi pi-filter-slash"
                      className="p-button-outlined p-button-secondary w-100"
                      onClick={clearAdvancedFilters}
                      size="small"
                    />
                  </div>
                </TableToolbar>
                <div className="table-responsive">
                  <CustomDataTable
                    value={filteredData.slice(first, first + rows)}
                    className="p-datatable-sm"
                    responsiveLayout="scroll"
                  >
                    <Column field="configName" header="Parameter Name" />
                    <Column field="facilityName" header="Facility" />
                    <Column field="configValue" header="Configuration Value" />
                    <Column field="description" header="Description" />
                    <Column field="CreatedBy" header="Created By" />
                    <Column
                      field="ChangedDate"
                      header="Changed On"
                      body={({ ChangedDate }) => formatDateTime(ChangedDate)}
                    />
                    <Column
                      header="Actions"
                      body={actionBodyTemplate}
                      style={{ minWidth: "120px" }}
                    />
                  </CustomDataTable>
                  <CustomPaginator
                    first={first}
                    rows={rows}
                    totalRecords={filteredData.length}
                    onPageChange={onPageChange}
                    rowsPerPageOptions={[50, 100, 150, 200]}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PrimeSidebar for Edit */}
      {/* MasterSidebar for Edit */}
      <MasterSidebar
        show={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        title={
          <div className="d-flex flex-column">
            <span>{editRow ? editRow.configName : "Edit Setting"}</span>
            {editRow && (
              <small className="d-block text-white opacity-75 fw-normal" style={{ fontSize: '0.75rem' }}>
                {`Last updated by: ${
                  editRow.CreatedBy ? editRow.CreatedBy : "NA"
                } | on: ${
                  editRow.ChangedDate ? formatDateTime(editRow.ChangedDate) : "NA"
                }`}
              </small>
            )}
          </div>
        }
        width={offcanvasWidth}
        headerBgColor="bg-secondary"
        headerTextColor="text-white"
        footer={
          <div className="offcanvas-footer">
            <Button
              label="Cancel"
              className="btn btn-outline-secondary"
              onClick={() => setSidebarVisible(false)}
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
          {editRow ? (
            <div className="row">
              <div className="col-12">
                <div className="field mb-3">
                  <label htmlFor="parameterName" className="form-label">Parameter Name</label>
                  <InputText
                    id="parameterName"
                    value={editRow ? editRow.configName : ""}
                    className="w-100"
                    disabled
                  />
                </div>
              </div>
              <div className="col-12">
                <div className="field mb-3">
                  <label htmlFor="facility" className="form-label">Facility Name</label>
                  <InputText
                    id="facility"
                    value={editRow ? editRow.facilityName : ""}
                    className="w-100"
                    disabled
                  />
                </div>
              </div>
              <div className="col-12">
                <div className="field mb-3">
                  <label htmlFor="configValue" className="form-label">Configuration Value</label>
                  <InputText
                    id="configValue"
                    value={editRow ? editRow.configValue : ""}
                    className="w-100"
                    onChange={(e) => {
                      setEditRow((prev) => ({
                        ...prev,
                        configValue: e.target.value,
                      }));
                    }}
                  />
                </div>
              </div>
              <div className="col-12">
                <div className="field mb-3">
                  <label htmlFor="description" className="form-label">Description</label>
                  <InputText
                    id="description"
                    value={editRow ? editRow.description : ""}
                    className="w-100"
                    onChange={(e) => {
                      setEditRow((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }));
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-danger">No row selected for editing.</div>
          )}
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
          padding-bottom: 5.5rem !important; /* Make space for footer */
        }

        .form-label {
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default SystemSetting;