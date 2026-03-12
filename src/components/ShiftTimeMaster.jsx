import React, { useEffect, useState, useMemo, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { CustomDataTable } from "./common/CustomDataTable";
import CustomPaginator from "./common/CustomPaginator";
import { Column } from "primereact/column";
import ShiftTimeMasterService from "../services/compliance/ShiftTimeMaster";
import sessionManager from "../utils/SessionManager";
import { toastService } from "../services/toastService";
// import { Sidebar as PrimeSidebar } from "primereact/sidebar"; // Removed
import MasterSidebar from "./Master/MasterSidebar";
import { Checkbox } from "primereact/checkbox";
import { MultiSelect } from "primereact/multiselect";
import { Dialog } from "primereact/dialog";
import TableToolbar from "./common/TableToolbar";

const userID = sessionManager.getUserSession().ID;

const ShiftTimeMaster = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [tripType] = useState([
    { label: "Pick", value: 0 },
    { label: "Drop", value: 1 },
  ]);
  const [selectedTypeOptions] = useState([
    { label: "Both", value: "Both" },
    { label: "Standard", value: "Standard" },
    { label: "Adhoc", value: "Adhoc" },
  ]);
  const [selectedNewType, setSelectedNewType] = useState("Standard");
  const [tripTypeValue, setTripTypeValue] = useState(0);
  const [weekDayValue, setWeekDayValue] = useState(0);
  const [weekDay] = useState([
    { label: "Weekday", value: 0 },
    { label: "Weekend", value: 1 },
    { label: "Both", value: 2 },
  ]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(1);
  const [facilities, setFacilities] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(0);
  const [processes, setProcesses] = useState([]);
  const [shiftData, setShiftData] = useState([]);
  const [processNew, setProcessNew] = useState([]);
  const [selectedProcessNew, setSelectedProcessNew] = useState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checked, setChecked] = useState(false);
  const [checkedItemsDrop, setCheckedItemsDrop] = useState({});
  const [checkedDrop, setCheckedDrop] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const [first, setFirst] = useState(0);
  const [pageRows, setPageRows] = useState(50);

  const onPageChange = (event) => {
    setFirst(event.first);
    setPageRows(event.rows);
  };

  // Responsive Sidebar Width
  const getOffcanvasWidth = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 576) return "95%";
      if (window.innerWidth < 768) return "85%";
      if (window.innerWidth < 1024) return "60%";
      return "50%";
    }
    return "50%";
  };

  const [offcanvasWidth, setOffcanvasWidth] = useState(getOffcanvasWidth());

  useEffect(() => {
    const handleResize = () => {
      setOffcanvasWidth(getOffcanvasWidth());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Advanced Filters
  const op = useRef(null);
  const filterButtonRef = useRef(null);
  const [filters, setFilters] = useState({
    Day: null,
    // Status (Active) is boolean/bit, we might need to map it for friendly filtering or just use Day for now.
    // Let's add 'Active' mapped to 'Status' if we want.
    // For now, let's just do 'Day'.
  });

  const getUniqueValues = (field) => {
    const values = shiftData.map((item) => item[field]).filter(Boolean);
    return [...new Set(values)].map((val) => ({ label: val, value: val }));
  };

  const filteredShiftData = useMemo(() => {
    let result = [...shiftData];

    // Apply advanced filters
    Object.keys(filters).forEach((key) => {
      const val = filters[key];
      if (Array.isArray(val) && val.length > 0) {
        result = result.filter((item) => val.includes(item[key]));
      }
    });

    if (!globalFilter) return result;
    
    return result.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(globalFilter.toLowerCase())
      )
    );
  }, [shiftData, globalFilter, filters]);

  const clearAdvancedFilters = () => {
    setFilters({
      Day: null,
    });
    if (op.current) op.current.hide();
    toastService.info("Filters cleared");
  };

  const timesDrop = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const time = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      timesDrop.push(time);
    }
  }

  const rowsDrop = [];
  for (let i = 0; i < timesDrop.length; i += 3) {
    rowsDrop.push(timesDrop.slice(i, i + 3));
  }

  const toggleCheckboxDrop = (time) => {
    setCheckedItemsDrop((prev) => ({
      ...prev,
      [time]: !prev[time],
    }));
  };

  const [checkedItems, setCheckedItems] = useState({});

  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const time = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      times.push(time);
    }
  }

  const rows = [];
  for (let i = 0; i < times.length; i += 3) {
    rows.push(times.slice(i, i + 3));
  }

  const toggleCheckbox = (time) => {
    setCheckedItems((prev) => ({
      ...prev,
      [time]: !prev[time],
    }));
  };

  const statusBodyTemplate = (rowData) => {
    const isActive =
      rowData.Active === "Active" ||
      rowData.Active === true ||
      rowData.Active === 1;

    return (
      <Button
        label={isActive ? "Active" : "Deactive"}
        className={
          isActive
            ? "btn btn-outline-success btn-sm"
            : "btn btn-outline-danger btn-sm"
        }
        onClick={() => openStatusDialog(rowData)}
      />
    );
  };

  const openStatusDialog = (shift) => {
    setSelectedShift(shift);
    setShowStatusDialog(true);
  };

  const closeStatusDialog = () => {
    setShowStatusDialog(false);
    setSelectedShift(null);
  };

  const confirmStatusChange = async () => {
    if (!selectedShift) return;
    setIsLoading(true);
    try {
      const currentStatus =
        selectedShift.Active === "Active" ||
        selectedShift.Active === true ||
        selectedShift.Active === 1;
      const newStatus = currentStatus ? 1 : 0;
      const response = await ShiftTimeMasterService.UpdateShiftStatus({
        shiftid: selectedShift.Id,
        status: newStatus,
      });

      let parsedResponse = response;
      if (typeof response === "string") {
        parsedResponse = JSON.parse(response);
      }

      if (
        Array.isArray(parsedResponse) &&
        parsedResponse.length > 0 &&
        parsedResponse[0].RESULT === 1
      ) {
        toastService.success("Shift status updated successfully!");
        fetchShiftData();
      } else {
        toastService.error("Failed to update shift status");
      }
    } catch (error) {
      console.error("Error updating shift status:", error);
      toastService.error("An error occurred while updating shift status");
    } finally {
      setIsLoading(false);
      closeStatusDialog();
    }
  };

  const deleteBodyTemplate = (rowData) => (
    <Button
      className="btn btn-sm btn-outline-danger"
      onClick={() => {
        alert(`Deleted shift for ${rowData.facilityName}`);
      }}
    >
      Delete
    </Button>
  );

  useEffect(() => {
    if (selectedFacility && selectedProcess !== undefined) {
      fetchShiftData();
    }
  }, [selectedFacility, selectedProcess, tripTypeValue, weekDayValue]);

  const fetchShiftData = async () => {
    setIsSubmitting(true);
    try {
      const formattedTripType = tripTypeValue === 0 ? "P" : "D";
      const formattedWeekday = weekDayValue.toString();
      const response = await ShiftTimeMasterService.GetSelectedShiftTime({
        facilityid: selectedFacility,
        processid: selectedProcess,
        triptype: formattedTripType,
        weekday: formattedWeekday,
      });
      let parsedData = [];
      if (typeof response === "string") {
        try {
          parsedData = JSON.parse(response);
        } catch (e) {
          parsedData = [];
        }
      } else {
        parsedData = response;
      }
      const validateData = Array.isArray(parsedData)
        ? parsedData
        : parsedData
        ? [parsedData]
        : [];
      setShiftData(validateData);
      setFirst(0); // Reset pagination on data fetch
    } catch (error) {
      console.error("Failed to fetch shift data:", error);
      setShiftData([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchFacilities = async () => {
    try {
      const response = await ShiftTimeMasterService.SelectFacility({
        userid: userID,
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
    } catch (error) {
      console.error("Failed to fetch facilities:", error);
    }
  };

  const fetchGetProcess = async (facilityId) => {
    try {
      const response = await ShiftTimeMasterService.GetProcess({
        locationid: facilityId,
        empid: 0,
      });

      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;

      const formattedData = Array.isArray(parsedResponse)
        ? parsedResponse.map((item) => ({
            label: item.processName,
            value: item.Id,
          }))
        : [];

      setProcesses(formattedData);
      setProcessNew(formattedData);
    } catch (error) {
      console.error("Failed to fetch processes:", error);
    }
  };

  useEffect(() => {
    fetchFacilities();
    if (selectedFacility) {
      fetchGetProcess(selectedFacility);
    }
  }, [selectedFacility]);

  const handleNewButtonClick = () => {
    setSidebarVisible(true);
    setSelectedProcessNew([]);
    setCheckedItems({});
    setCheckedItemsDrop({});
    setChecked(false);
    setCheckedDrop(false);
  };

  const insertShiftTime = async () => {
    setIsSubmitting(true);
    try {
      if (!selectedProcessNew || selectedProcessNew.length === 0) {
        toastService.error("Please select at least one process.");
        setIsSubmitting(false);
        return;
      }

      const hasDrop = timesDrop.some((time) => checkedItemsDrop[time]);
      const hasPick = times.some((time) => checkedItems[time]);

      if (!hasDrop && !hasPick) {
        toastService.error(
          "Please select at least one pick or drop time."
        );
        setIsSubmitting(false);
        return;
      }

      const selectedDropTimes = Object.keys(checkedItemsDrop).filter(
        (key) => checkedItemsDrop[key]
      );
      const selectedPickTimes = Object.keys(checkedItems).filter(
        (key) => checkedItems[key]
      );
      const processIds = Array.isArray(selectedProcessNew)
        ? selectedProcessNew.map((p) =>
            typeof p === "object" ? p.value : p
          )
        : [];

      const dropTimesStr = selectedDropTimes.join(",");
      const pickTimesStr = selectedPickTimes.join(",");
      const processIdsStr = processIds.join(",");

      const response = await ShiftTimeMasterService.UpdateShiftTimeGrid({
        FacilityId: selectedFacility,
        DropTimes: dropTimesStr,
        PickTimes: pickTimesStr,
        Day: weekDayValue.toString(),
        ProcessIds: processIdsStr,
        ZoneNames: null,
        WeekEndType: weekDayValue,
        Buffer: 0,
        UpdatedBy: Number(userID),
        ShiftType: selectedNewType,
      });

      let parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;

      if (
        Array.isArray(parsedResponse) &&
        parsedResponse.length === 1
      ) {
        const firstItem = parsedResponse[0];
        if (
          typeof firstItem === "string" &&
          firstItem.toLowerCase().includes("shift time already exist")
        ) {
          toastService.warn(firstItem);
          setIsSubmitting(false);
          return;
        }
      }

      if (
        (parsedResponse && parsedResponse.RESULT === 1) ||
        (Array.isArray(parsedResponse) &&
          parsedResponse.length > 0 &&
          typeof parsedResponse[0] !== "string")
      ) {
        setSidebarVisible(false);
        await fetchShiftData();
        toastService.success("Shift Time Updated Successfully");
      } else {
        toastService.error("Error Updating Shift Time");
      }
    } catch (error) {
      console.error("Error Updating Shift Time:", error);
      toastService.error("Error Updating Shift Time");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderToolbar = () => {
    const activeFilterCount = Object.values(filters).filter(
      (f) => Array.isArray(f) && f.length > 0
    ).length;

    return (
      <TableToolbar
        search={globalFilter}
        onSearch={(e) => setGlobalFilter(e.target.value)}
        onRefresh={fetchShiftData}
        showExport={false}
        showFilter={true}
        filters={filters}
        setFilters={setFilters}
        overlayRef={op}
        filterButtonRef={filterButtonRef}
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
                  Refine shift list
                </div>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <span
                className="badge bg-primary"
                style={{ fontSize: "0.7rem", borderRadius: "999px" }}
              >
                {activeFilterCount}
              </span>
            )}
          </div>
        </div>

        <div className="ota-filter-body">
          <div className="ota-filter-field">
            <label className="ota-filter-label">Day Type</label>
            <MultiSelect
              value={filters.Day}
              options={getUniqueValues("Day")}
              onChange={(e) =>
                setFilters({ ...filters, Day: e.value })
              }
              placeholder="Select Day Type"
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
    );
  };

  return (
    <div>
      <Loader isVisible={isSubmitting} fullScreen={true} />
      <Header
        pageTitle="Shift Time Master"
        showNewButton={true}
        onNewButtonClick={handleNewButtonClick}
      />
      <Sidebar />
      <div className="middle">
        <div className="card_tb p-3">
          <div className="row">
            <div className="field col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
              <label className="form-label">Facility <span className="text-danger">*</span></label>
              <Dropdown
                id="facility"
                placeholder="Select Facility"
                className="w-100"
                filter
                options={facilities}
                value={selectedFacility}
                onChange={(e) => {
                  setSelectedFacility(e.value);
                  setSelectedProcess(0);
                  fetchGetProcess(e.value);
                  setShiftData([]);
                }}
              />
            </div>
            <div className="field col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
              <label className="form-label">Process <span className="text-danger">*</span></label>
              <Dropdown
                id="process"
                placeholder="Select Process"
                className="w-100"
                filter
                options={processes}
                value={selectedProcess}
                onChange={(e) => setSelectedProcess(e.value)}
              />
            </div>
            <div className="field col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
              <label className="form-label">Trip Type <span className="text-danger">*</span></label>
              <Dropdown
                placeholder="Select"
                className="w-100"
                value={tripTypeValue}
                options={tripType}
                onChange={(e) => setTripTypeValue(e.value)}
              />
            </div>
            <div className="field col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
              <label className="form-label">Day Type <span className="text-danger">*</span></label>
              <Dropdown
                placeholder="Select"
                className="w-100"
                value={weekDayValue}
                options={weekDay}
                onChange={(e) => setWeekDayValue(e.value)}
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-12 p-3">
            <div className="card_tb">
              <div className="p-3 pb-0">
                {renderToolbar()}
              </div>
              <CustomDataTable
                value={filteredShiftData.slice(first, first + pageRows)}
                responsiveLayout="scroll"
                selection={selectedRows}
                onSelectionChange={(e) => setSelectedRows(e.value)}
              >
                <Column field="shiftTime" header="Shift" />
                <Column field="Type" header="Trip Type" />
                <Column field="facilityName" header="Facility" />
                <Column field="Day" header="Day Type" />
                <Column
                  field="Active"
                  header="Status"
                  body={statusBodyTemplate}
                />
              </CustomDataTable>
              <CustomPaginator
                first={first}
                rows={pageRows}
                totalRecords={filteredShiftData.length}
                onPageChange={onPageChange}
                rowsPerPageOptions={[50, 100, 150, 200]}
              />
            </div>
          </div>
        </div>

        <MasterSidebar
          show={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          title="Add New Shift Time"
          width={offcanvasWidth}
          footer={
            <div className="offcanvas-footer">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setSidebarVisible(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-success mx-3"
                onClick={insertShiftTime}
              >
                Save
              </button>
            </div>
          }
        >
        <div className="p-3">
          <div className="row">
            <div className="col-3 mb-3">
              <label>Process</label>
              <MultiSelect
                value={selectedProcessNew}
                onChange={(e) => setSelectedProcessNew(e.value)}
                options={processNew}
                optionLabel="label"
                placeholder="Select Process"
                maxSelectedLabels={3}
                className="w-100"
              />
            </div>
            <div className="col-3 mb-3">
              <label>Type</label>
              <Dropdown
                options={selectedTypeOptions}
                value={selectedNewType}
                onChange={(e) => setSelectedNewType(e.value)}
                placeholder="Select Shift Time"
                className="w-100"
              />
            </div>
            <div className="col-6"></div>
            <div className="col-6">
              <table className="table table-striped table-hover">
                <thead>
                  <tr className="table-dark">
                    <th colSpan={3}>
                      <Checkbox
                        onChange={(e) => {
                          setChecked(e.checked);
                          const newCheckedItems = {};
                          times.forEach((time) => {
                            newCheckedItems[time] = e.checked;
                          });
                          setCheckedItems(newCheckedItems);
                        }}
                        checked={checked}
                        className="me-2"
                      />
                      Shift Time Pick
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index}>
                      {row.map((time) => (
                        <td key={time}>
                          <Checkbox
                            onChange={() => toggleCheckbox(time)}
                            checked={!!checkedItems[time]}
                            className="me-2"
                          />
                          {time}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="col-6">
              <table className="table table-striped table-hover">
                <thead>
                  <tr className="table-dark">
                    <th colSpan={3}>
                      <Checkbox
                        onChange={(e) => {
                          setCheckedDrop(e.checked);
                          const newCheckedItems = {};
                          timesDrop.forEach((time) => {
                            newCheckedItems[time] = e.checked;
                          });
                          setCheckedItemsDrop(newCheckedItems);
                        }}
                        checked={checkedDrop}
                        className="me-2"
                      />
                      Shift Time Drop
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index}>
                      {row.map((time) => (
                        <td key={time}>
                          <Checkbox
                            onChange={() => toggleCheckboxDrop(time)}
                            checked={!!checkedItemsDrop[time]}
                            className="me-2"
                          />
                          {time}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </MasterSidebar>
        <Dialog
          visible={showStatusDialog}
          onHide={closeStatusDialog}
          header="Confirmation"
          modal
          footer={
            <>
              <Button
                label="Cancel"
                onClick={closeStatusDialog}
                className="btn btn-outline-dark"
              />
              <Button
                label="OK"
                onClick={confirmStatusChange}
                disabled={isLoading}
                className="btn btn-primary ms-3"
              />
            </>
          }
        >
          <p>
            Are you sure you want to{" "}
            {selectedShift &&
            (selectedShift.Active === "Active" ||
              selectedShift.Active === true ||
              selectedShift.Active === 1)
              ? "Deactivate"
              : "Activate"}{" "}
            the shift for {selectedShift?.shiftTime}?
          </p>
        </Dialog>
      </div>
    </div>
  );
};

export default ShiftTimeMaster;