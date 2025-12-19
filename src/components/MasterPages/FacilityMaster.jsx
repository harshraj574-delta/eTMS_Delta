import TableToolbar from "../common/TableToolbar";
import { OverlayPanel } from "primereact/overlaypanel";
import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../Master/SidebarMenu";
import MasterSidebar from "../Master/MasterSidebar";
import Header from "../Master/Header";
import LocationMapComponent from "../LocationMapComponent.jsx";
import { apiService } from "../../services/api";
import sessionManager from "../../utils/SessionManager.js";
import { toastService } from "../../services/toastService";
import { DataTable } from "primereact/datatable";
import { MultiSelect } from "primereact/multiselect";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import "../common/CustomDataTable.css";
import PlaceIcon from '@mui/icons-material/Place';
import { Button } from "primereact/button";
import { ToastContainer } from 'react-toastify';


const FacilityMaster = () => {
  // Data
  const [facilityData, setFacilityData] = useState([]);
  const [filteredData, setFilteredData] = useState([]); // Filtered data for display
  const [location, setLocationData] = useState([]);
  const [facilityContactData, setFacilityContactData] = useState([]);
  const [facContactLocation, setfacContactLocation] = useState([]);
  const [loading, setLoading] = useState(true);

  // Table
  const [expandedRows, setExpandedRows] = useState([]);
  
  // Toolbar State
  const [globalFilter, setGlobalFilter] = useState("");
  const op = useRef(null);
  const filterButtonRef = useRef(null);

  const [filters, setFilters] = useState({
    facilityName: null,
    locationName: null,
  });

  // Offcanvas flags (controlled via React state)
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showViewMap, setShowViewMap] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);

  // Map context: "add" | "edit" | "view"
  const [mapContext, setMapContext] = useState(null);

  // Add form
  const [newFacility, setNewFacility] = useState("");
  const [geoX, setGeoX] = useState(""); // longitude
  const [geoY, setGeoY] = useState(""); // latitude

  // Edit form
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [editGeoX, setEditGeoX] = useState(""); // longitude
  const [editGeoY, setEditGeoY] = useState(""); // latitude

  // Map shared values
  const [mapLatitude, setMapLatitude] = useState(""); // latitude
  const [mapLongitude, setMapLongitude] = useState(""); // longitude

  // Effects: fetch data
  useEffect(() => {
    fetchFacilityData();
    bindFacilityContactList();
    bindLocationList();
    bindFacilityContactLevelList();
  }, []);

  // Filter effect
  useEffect(() => {
    let result = [...facilityData];

    // Apply advanced filters
    Object.keys(filters).forEach((key) => {
      const val = filters[key];
      if (Array.isArray(val) && val.length > 0) {
        result = result.filter((item) => val.includes(item[key]));
      }
    });

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
  }, [facilityData, globalFilter, filters]);

  const getUniqueValues = (field) => {
    const values = facilityData.map((item) => item[field]).filter(Boolean);
    return [...new Set(values)].map((val) => ({ label: val, value: val }));
  };

  const clearAdvancedFilters = () => {
    setFilters({
      facilityName: null,
      locationName: null,
    });
    if (op.current) op.current.hide();
    toastService.info("Filters cleared");
  };

  const bindFacilityContactLevelList = async () => {
    try {
      const response = await apiService.GetFacility({ locationid: 0 });
      setfacContactLocation(response);
    } catch (error) {
      console.error("Error fetching contact levels:", error);
    }
  };

  const bindLocationList = async () => {
    try {
      const response = await apiService.SelectLocation({ Userid: 0 });
      setLocationData(response);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const bindFacilityContactList = async () => {
    try {
      const response = await apiService.GetLevelDetail({ locationid: 0 });
      setFacilityContactData(response);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const fetchFacilityData = async () => {
    try {
      setLoading(true);
      if (sessionManager.getUserSession().ISadmin === "Y") {
        const response = await apiService.SelectAllFacility({});
        setFacilityData(response);
        setFilteredData(response); // Initialize filtered data
      } else {
        const response = await apiService.SelectFacility({
          Userid: sessionManager.getUserSession().Userid,
        });
        setFacilityData(response);
        setFilteredData(response); // Initialize filtered data
      }
    } catch (error) {
      console.error("Error fetching facilities:", error);
      setFacilityData([]);
      setFilteredData([]);
      toastService.error("Error fetching facilities");
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (filteredData.length === 0) {
      toastService.error("No data to export");
      return;
    }
    const fileName = `facility_master_${new Date().toISOString().slice(0, 10)}`;
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
    const activeFilterCount = Object.values(filters).filter(
      (f) => Array.isArray(f) && f.length > 0
    ).length;

    return (
      <TableToolbar
        search={globalFilter}
        onSearch={(e) => setGlobalFilter(e.target.value)}
        onRefresh={() => fetchFacilityData()}
        onExport={exportExcel}
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
                  Refine facility list
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
            <label className="ota-filter-label">Facility Name</label>
            <MultiSelect
              value={filters.facilityName}
              options={getUniqueValues("facilityName")}
              onChange={(e) =>
                setFilters({ ...filters, facilityName: e.value })
              }
              placeholder="Select facilities"
              maxSelectedLabels={2}
              className="w-100 p-inputtext-sm"
              display="chip"
              filter
              showClear
            />
          </div>

          <div className="ota-filter-field">
            <label className="ota-filter-label">Location</label>
            <MultiSelect
              value={filters.locationName}
              options={getUniqueValues("locationName")}
              onChange={(e) =>
                setFilters({ ...filters, locationName: e.value })
              }
              placeholder="Select locations"
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

  // Map callbacks
  const handleMapCoordinatesChange = (lat, lng) => {
    const latStr = Number(lat).toFixed(7);
    const lngStr = Number(lng).toFixed(7);
    setMapLatitude(latStr);
    setMapLongitude(lngStr);
  };

  // Open Map from Add
  // Close Map and restore parent
  const handleMapClose = () => {
    setShowMap(false);
    if (mapContext === "add") {
      setShowAdd(true);
    } else if (mapContext === "edit") {
      setShowEdit(true);
    }
  };

  const openMapForAdd = () => {
    setMapContext("add");
    setMapLatitude(geoY || "28.4624669");
    setMapLongitude(geoX || "77.0847776");
    setShowAdd(false);
    setShowMap(true);
  };

  // Open Map from Edit
  const openMapForEdit = () => {
    setMapContext("edit");
    setMapLatitude(editGeoY || "28.4624669");
    setMapLongitude(editGeoX || "77.0847776");
    setShowEdit(false);
    setShowMap(true);
  };

  // Save from Map offcanvas
  const saveMapCoords = () => {
    if (!mapLatitude || !mapLongitude) {
      toastService.warn("Please set coordinates on map");
      return;
    }
    if (mapContext === "add") {
      setGeoY(mapLatitude);
      setGeoX(mapLongitude);
      setShowMap(false);
      setShowAdd(true);
    } else if (mapContext === "edit") {
      setEditGeoY(mapLatitude);
      setEditGeoX(mapLongitude);
      setShowMap(false);
      setShowEdit(true);
    } else {
      setShowMap(false);
    }
    toastService.success("Coordinates saved");
  };

  // Add
  const handleNewButtonClick = () => {
    setShowAdd(true);
    setGeoX("");
    setGeoY("");
    setMapLatitude("");
    setMapLongitude("");
  };

  const handleSaveFacility = async () => {
    const nameEl = document.getElementById("txtfacilityName");
    const locEl = document.getElementById("ddlLocation");

    if (!nameEl.value.trim()) {
      toastService.warn("Please Enter Facility Name");
      return;
    }
    if (locEl.value === "0") {
      toastService.warn("Please Select Location");
      return;
    }

    const selectedLocationText =
      locEl.options[locEl.selectedIndex]?.text || "";

    try {
      setLoading(true);
      const apiresponse = await apiService.InsertFacility({
        facility: nameEl.value.trim(),
        geoX: parseFloat(geoX) || 0,
        geoY: parseFloat(geoY) || 0,
        tptEmail: document.getElementById("txtHelpdeskemail").value.trim(),
        tptContactNo: document.getElementById("txtContactNo").value.trim(),
        locationId: locEl.value,
        locationName: selectedLocationText,
        ShiftInchargeMail: document
          .getElementById("txtTeamLeademail")
          .value.trim(),
        SiteLeadMail: document.getElementById("txtManageremail").value.trim(),
        CityLeadMail: document.getElementById("txtSiteLeadEmail").value.trim(),
      });

      if (apiresponse[0].result === 1) {
        toastService.success("Data Saved Successfully");
        nameEl.value = "";
        document.getElementById("txtContactNo").value = "";
        locEl.value = "0";
        document.getElementById("txtHelpdeskemail").value = "";
        document.getElementById("txtTeamLeademail").value = "";
        document.getElementById("txtManageremail").value = "";
        document.getElementById("txtSiteLeadEmail").value = "";
        setNewFacility("");
        setGeoX("");
        setGeoY("");
        setMapLatitude("");
        setMapLongitude("");
        setShowAdd(false);
        await fetchFacilityData();
      } else {
        toastService.warn("Facility Name Already Exists");
      }
    } catch (error) {
      console.error("Error saving facility:", error);
      toastService.error("Error saving facility");
    } finally {
      setLoading(false);
    }
  };

  // Edit
  const openEdit = (
    facilityName,
    facilityId,
    tptContactNo,
    locationId,
    tptEmail,
    ShiftInchargeMail,
    SiteLeadMail,
    LocLeadMail,
    geoXValue,
    geoYValue
  ) => {
    setSelectedFacility({
      facilityName,
      Id: facilityId,
      tptContactNo,
      locationId,
      tptEmail,
      ShiftInchargeMail,
      SiteLeadMail,
      LocLeadMail,
    });
    setEditGeoX(geoXValue || "");
    setEditGeoY(geoYValue || "");
    setShowEdit(true);
  };

  const handleEditFacility = async () => {
    if (!selectedFacility || !selectedFacility.facilityName?.trim()) {
      toastService.warn("Please Enter Valid Facility Name");
      return;
    }

    const locEl = document.getElementById("ddleditLocation");
    if (locEl.value === "0") {
      toastService.warn("Please Select Location");
      return;
    }
    const selectedLocationText =
      locEl.options[locEl.selectedIndex]?.text || "";

    try {
      setLoading(true);
      const response = await apiService.UpdateFacility({
        facility: selectedFacility.facilityName,
        geoX: parseFloat(editGeoX) || 0,
        geoY: parseFloat(editGeoY) || 0,
        tptEmail: selectedFacility.tptEmail,
        tptContactNo: selectedFacility.tptContactNo,
        Id: selectedFacility.Id,
        locationId: selectedFacility.locationId,
        locationName: selectedLocationText,
        ShiftInchargeMail: selectedFacility.ShiftInchargeMail,
        SiteLeadMail: selectedFacility.SiteLeadMail,
        CityLeadMail: selectedFacility.LocLeadMail,
      });

      if (response[0].result === 1) {
        toastService.success("Facility Updated Successfully");
        setShowEdit(false);
        await fetchFacilityData();
      } else {
        toastService.warn("Facility Name Already Exists");
      }
    } catch (error) {
      console.error("Error updating facility:", error);
      toastService.error("Error updating facility");
    } finally {
      setLoading(false);
    }
  };

  // Facility contacts
  const handleContactSave = async () => {
    try {
      setLoading(true);
      const locEl = document.getElementById("ddlContactLocation");
      const levelEl = document.getElementById("ddlLevel");
      const nameEl = document.getElementById("txtContactName");
      if (locEl.value === "0") {
        toastService.warn("Please Select Location");
        return;
      }
      if (levelEl.value === "0") {
        toastService.warn("Please Select Level");
        return;
      }
      if (!nameEl.value.trim()) {
        toastService.warn("Please Enter Contact Name");
        return;
      }

      const response = await apiService.AddLevelDetails({
        ContactName: nameEl.value.trim(),
        ContactNo: document.getElementById("txtLevelContactNo").value.trim(),
        Email: document.getElementById("txtContactEmail").value.trim(),
        LocationId: locEl.value,
        Level: levelEl.value,
      });

      if (response[0].result === 1) {
        toastService.success("Data Saved Successfully");
      } else {
        toastService.success("Data Updated Successfully");
      }

      await bindFacilityContactList();

      nameEl.value = "";
      locEl.value = "0";
      document.getElementById("txtContactEmail").value = "";
      document.getElementById("txtLevelContactNo").value = "";
      levelEl.value = "0";
    } catch (error) {
      console.error("Error updating contact details:", error);
      toastService.error("Error updating facility Contact details");
    } finally {
      setLoading(false);
    }
  };

  // Responsive widths
  const getOffcanvasWidth = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 576) return "95%";
      if (window.innerWidth < 768) return "85%";
      if (window.innerWidth < 1024) return "60%";
      return "40%";
    }
    return "40%";
  };

  const getMapOffcanvasWidth = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 576) return "100%";
      if (window.innerWidth < 768) return "90%";
      if (window.innerWidth < 1024) return "70%";
      return "50%";
    }
    return "50%";
  };

  const [offcanvasWidth, setOffcanvasWidth] = useState(getOffcanvasWidth());
  const [mapOffcanvasWidth, setMapOffcanvasWidth] =
    useState(getMapOffcanvasWidth());

  useEffect(() => {
    const handleResize = () => {
      setOffcanvasWidth(getOffcanvasWidth());
      setMapOffcanvasWidth(getMapOffcanvasWidth());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Styled, reusable block for Map + Coordinates (Add/Edit)
  const MapPickerRow = ({ mode }) => {
    const isEdit = mode === "edit";
    const latVal = isEdit ? editGeoY : geoY;
    const lngVal = isEdit ? editGeoX : geoX;
    const setLat = isEdit ? setEditGeoY : setGeoY;
    const setLng = isEdit ? setEditGeoX : setGeoX;
    const openMap = isEdit ? openMapForEdit : openMapForAdd;
    const heading = isEdit ? "Update location" : "Set location";

    return (
      <div className="map-block bg-light p-3 rounded-3 border">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <label className="form-label mb-0 fw-bold text-secondary">{heading}</label>
          <Button 
            label="Open Map" 
            icon="pi pi-map" 
            className="p-button-outlined p-button-secondary p-button-sm py-1 px-3"
            style={{ fontSize: '0.85rem' }}
            loading={loading} 
            onClick={openMap} 
          />
        </div>

        <div className="row g-2">
          <div className="col-12 col-sm-6">
            <label className="form-label form-label-xs text-muted mb-1">
              Latitude
            </label>
            <div className="input-group input-group-sm coord-input">
              <span className="input-group-text bg-white border-end-0">
                <i className="pi pi-compass text-muted" style={{ fontSize: '0.8rem' }}></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                id={isEdit ? "txtEditGeoY" : "txtGeoY"}
                placeholder="e.g. 28.4624669"
                value={latVal}
                onChange={(e) => setLat(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-sm-6">
            <label className="form-label form-label-xs text-muted mb-1">
              Longitude
            </label>
            <div className="input-group input-group-sm coord-input">
              <span className="input-group-text bg-white border-end-0">
                <i className="pi pi-compass text-muted" style={{ fontSize: '0.8rem' }}></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                id={isEdit ? "txtEditGeoX" : "txtGeoX"}
                placeholder="e.g. 77.0847776"
                value={lngVal}
                onChange={(e) => setLng(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid p-0">
      <Header
        pageTitle={"Facility Master"}
        showNewButton={true}
        onNewButtonClick={handleNewButtonClick}
      />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Facility Master</h6>
          </div>

          <div className="col-12">
            <div className="card_tb">
              <div className="p-3 pb-0">
                {renderToolbar()}
              </div>
              <div className="table-responsive">
                <table className="table table-sm mb-0 custom-html-table" id="tbFacility">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "40px" }}></th>
                      <th className="text-left" style={{ minWidth: "90px" }}>
                        Facility Name
                      </th>
                      <th className="text-left" style={{ minWidth: "80px" }}>
                        Geo Code
                      </th>
                      <th className="text-left" style={{ minWidth: "70px" }}>
                        Location
                      </th>
                      <th
                        className="text-left d-none d-md-table-cell"
                        style={{ minWidth: "100px" }}
                      >
                        Helpdesk Contact No
                      </th>
                      <th
                        className="text-left d-none d-lg-table-cell"
                        style={{ minWidth: "120px" }}
                      >
                        Helpdesk Email
                      </th>
                      <th
                        className="text-left d-none d-xl-table-cell"
                        style={{ minWidth: "120px" }}
                      >
                        Team Lead Email
                      </th>
                      <th
                        className="text-left d-none d-xl-table-cell"
                        style={{ minWidth: "120px" }}
                      >
                        Manager Email
                      </th>
                      <th
                        className="text-left d-none d-xl-table-cell"
                        style={{ minWidth: "120px" }}
                      >
                        Site Lead Email
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((facility, index) => (
                      <React.Fragment key={index}>
                        <tr>
                          <td>
                            <a
                              href="#!"
                              onClick={(e) => {
                                e.preventDefault();
                                const next = [...expandedRows];
                                const rowIndex = next.indexOf(index);
                                if (rowIndex > -1) next.splice(rowIndex, 1);
                                else next.push(index);
                                setExpandedRows(next);
                              }}
                            >
                              {expandedRows.includes(index) ? (
                                <span
                                  className="material-icons"
                                  style={{ fontSize: "20px" }}
                                >
                                  remove_circle
                                </span>
                              ) : (
                                <span
                                  className="material-icons"
                                  style={{ fontSize: "20px" }}
                                >
                                  add_circle
                                </span>
                              )}
                            </a>
                          </td>
                          <td className="text-left">
                            <a
                              href="#!"
                              className="btn-text text-decoration-none"
                              onClick={() =>
                                openEdit(
                                  facility.facilityName,
                                  facility.Id,
                                  facility.tptContactNo,
                                  facility.locationId,
                                  facility.tptEmail,
                                  facility.ShiftInchargeMail,
                                  facility.SiteLeadMail,
                                  facility.LocLeadMail,
                                  facility.geoX,
                                  facility.geoY
                                )
                              }
                            >
                              {facility.facilityName}
                            </a>
                          </td>

                          <td className="text-left">
                            <a
                              href="#!"
                              onClick={() => {
                                setMapContext("view");
                                setMapLatitude(
                                  facility.geoY || "28.4624669"
                                );
                                setMapLongitude(
                                  facility.geoX || "77.0847776"
                                );
                                setShowViewMap(true);
                              }}
                            >{`${facility.geoX} : ${facility.geoY}`}</a>
                          </td>

                          <td className="text-left">
                            <span>{facility.locationName}</span>
                          </td>
                          <td className="text-left d-none d-md-table-cell">
                            {facility.tptContactNo}
                          </td>
                          <td className="text-left d-none d-lg-table-cell">
                            {facility.tptEmail}
                          </td>
                          <td className="text-left d-none d-xl-table-cell">
                            {facility.ShiftInchargeMail}
                          </td>
                          <td className="text-left d-none d-xl-table-cell">
                            {facility.SiteLeadMail}
                          </td>
                          <td className="text-left d-none d-xl-table-cell">
                            {facility.LocLeadMail}
                          </td>
                        </tr>

                        {expandedRows.includes(index) && (
                          <tr>
                            <td colSpan="9" className="leftStrip p-2">
                              <div className="expanded-content">
                                <div className="table-responsive">
                                  <DataTable
                                    value={facilityContactData}
                                    loading={loading}
                                    responsiveLayout="scroll"
                                    size="small"
                                  >
                                    <Column
                                      field="locationName"
                                      header="Location"
                                    ></Column>
                                    <Column
                                      field="Level"
                                      header="Level"
                                    ></Column>
                                    <Column
                                      field="ContactName"
                                      header="Name"
                                    ></Column>
                                    <Column
                                      field="ContactNo"
                                      header="Contact No"
                                    ></Column>
                                    <Column
                                      field="Email"
                                      header="Email"
                                    ></Column>
                                  </DataTable>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Contacts quick area */}
        <div className="row mt-3">
          <div className="col-12">
            <div className="card_tb">
              <div className="d-flex flex-column flex-md-row p-2 p-md-3 align-items-start align-md-items-center gap-2">
                <InputText placeholder="Search Any Value" />
                <a href="#!" className="ms-auto" onClick={() => setShowAddContact(true)}>
                  <span className="material-icons">add_circle</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offcanvas: Add New Facility */}
      <MasterSidebar
        show={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add New Facility"
        width={offcanvasWidth}
        backdropOpacity={0.5}
        headerBgColor = "bg-secondary"
        backdropBlur="10px"
        footer={
          <div className="offcanvas-footer">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-success mx-3"
              onClick={handleSaveFacility}
            >
              Save
            </button>
          </div>
        }
      >
        <div className="p-3">
          <div className="row g-2">
          <div className="col-12 col-sm-6 mb-2">
            <label htmlFor="facilityName" className="form-label">
              Facility Name <span>*</span>
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              id="txtfacilityName"
              value={newFacility}
              onChange={(e) => setNewFacility(e.target.value)}
              placeholder="Enter facility name"
            />
          </div>

          <div className="col-12 col-sm-6 mb-2">
            <label htmlFor="ContactNo" className="form-label">
              Contact No
            </label>
            <input
              type="number"
              className="form-control form-control-sm"
              id="txtContactNo"
              placeholder="Enter Contact No"
            />
          </div>

          <div className="col-12 col-sm-6 mb-2">
            <label htmlFor="Location" className="form-label">
              Location <span>*</span>
            </label>
            <select className="form-control form-control-sm" id="ddlLocation">
              <option value="0">Select Location</option>
              {location.map((loc, index) => (
                <option key={index} value={loc.Id}>
                  {loc.locationName}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-sm-6 mb-2">
            <label htmlFor="HelpdeskEmail" className="form-label">
              Helpdesk Email
            </label>
            <input
              type="email"
              className="form-control form-control-sm"
              id="txtHelpdeskemail"
              placeholder="Enter Help desk Email"
            />
          </div>

          <div className="col-12 col-sm-6 mb-2">
            <label htmlFor="TeamLeadEmail" className="form-label">
              Team Lead Email
            </label>
            <input
              type="email"
              className="form-control form-control-sm"
              id="txtTeamLeademail"
              placeholder="Enter Team Lead Email"
            />
          </div>

          <div className="col-12 col-sm-6 mb-2">
            <label htmlFor="ManagerEmail" className="form-label">
              Manager Email
            </label>
            <input
              type="email"
              className="form-control form-control-sm"
              id="txtManageremail"
              placeholder="Enter Manager Email"
            />
          </div>

          <div className="col-12 col-sm-6 mb-2">
            <label htmlFor="SiteLeadEmail" className="form-label">
              Site Lead Email
            </label>
            <input
              type="email"
              className="form-control form-control-sm"
              id="txtSiteLeadEmail"
              placeholder="Enter Site Lead Email"
            />
          </div>

          <div className="col-12 mb-2">
            <MapPickerRow mode="add" />
          </div>
          </div>
        </div>
      </MasterSidebar>

      {/* Offcanvas: Edit Facility */}
      <MasterSidebar
        show={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Facility"
        width={offcanvasWidth}
        backdropOpacity={0.7}
        backdropBlur="50px"
        footer={
          <div className="offcanvas-footer">
            <button
              className="btn btn-outline-secondary "
              onClick={() => setShowEdit(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-success mx-3"
              onClick={handleEditFacility}
            >
              Save
            </button>
          </div>
        }
      >
        <div className="p-3">
          {selectedFacility && (
          <div className="row g-2">
            <div className="col-12 col-sm-6 mb-2">
              <label
                htmlFor="editFacilityName"
                className="form-label"
              >
                Facility Name <span>*</span>
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                id="editFacilityName"
                value={selectedFacility.facilityName}
                onChange={(e) =>
                  setSelectedFacility({
                    ...selectedFacility,
                    facilityName: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-12 col-sm-6 mb-2">
              <label htmlFor="ContactNo" className="form-label">
                Contact No
              </label>
              <input
                type="number"
                className="form-control form-control-sm"
                id="txteditContactNo"
                value={selectedFacility.tptContactNo}
                onChange={(e) =>
                  setSelectedFacility({
                    ...selectedFacility,
                    tptContactNo: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-12 col-sm-6 mb-2">
              <label htmlFor="Location" className="form-label">
                Location <span>*</span>
              </label>
              <select
                className="form-control form-control-sm"
                id="ddleditLocation"
                value={selectedFacility.locationId}
                onChange={(e) =>
                  setSelectedFacility({
                    ...selectedFacility,
                    locationId: e.target.value,
                  })
                }
              >
                <option value="0">Select Location</option>
                {location.map((loc, index) => (
                  <option key={index} value={loc.Id}>
                    {loc.locationName}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-sm-6 mb-2">
              <label
                htmlFor="HelpdeskEmail"
                className="form-label"
              >
                Helpdesk Email
              </label>
              <input
                type="email"
                className="form-control form-control-sm"
                id="txteditHelpdeskemail"
                value={selectedFacility.tptEmail}
                onChange={(e) =>
                  setSelectedFacility({
                    ...selectedFacility,
                    tptEmail: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-12 col-sm-6 mb-2">
              <label
                htmlFor="TeamLeadEmail"
                className="form-label"
              >
                Team Lead Email
              </label>
              <input
                type="email"
                className="form-control form-control-sm"
                id="txteditTeamLeademail"
                value={selectedFacility.ShiftInchargeMail}
                onChange={(e) =>
                  setSelectedFacility({
                    ...selectedFacility,
                    ShiftInchargeMail: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-12 col-sm-6 mb-2">
              <label
                htmlFor="ManagerEmail"
                className="form-label"
              >
                Manager Email
              </label>
              <input
                type="email"
                className="form-control form-control-sm"
                id="txteditManageremail"
                value={selectedFacility.SiteLeadMail}
                onChange={(e) =>
                  setSelectedFacility({
                    ...selectedFacility,
                    SiteLeadMail: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-12 col-sm-6 mb-2">
              <label
                htmlFor="SiteLeadEmail"
                className="form-label"
              >
                Site Lead Email
              </label>
              <input
                type="email"
                className="form-control form-control-sm"
                id="txteditSiteLeadEmail"
                value={selectedFacility.LocLeadMail}
                onChange={(e) =>
                  setSelectedFacility({
                    ...selectedFacility,
                    LocLeadMail: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-12 mb-2">
              <MapPickerRow mode="edit" />
            </div>
          </div>
          )}
        </div>
      </MasterSidebar>

      {/* Offcanvas: Facility Map Selector (Add/Edit) */}
      <MasterSidebar
        show={showMap}
        onClose={handleMapClose}
        title={
          mapContext === "add"
            ? "Set Location"
            : mapContext === "edit"
            ? "Update Location"
            : "Location Map"
        }
        width={mapOffcanvasWidth}
        backdrop={false}
        backdropOpacity={0.7}
        backdropBlur="50px"
        bodyStyle={{ padding: 0 }}
        footer={
          <div className="row g-2 w-100 bg-white p-2 m-0 align-items-end">
            <div className="col-6 col-md">
              <label className="form-label mb-1 small fw-bold text-secondary">Latitude</label>
              <input
                type="text"
                className="form-control"
                placeholder="Latitude"
                id="txtMapLatitude"
                value={mapLatitude}
                onChange={(e) => setMapLatitude(e.target.value)}
              />
            </div>

            <div className="col-6 col-md">
              <label className="form-label mb-1 small fw-bold text-secondary">Longitude</label>
              <input
                type="text"
                className="form-control"
                placeholder="Longitude"
                id="txtMapLongitude"
                value={mapLongitude}
                onChange={(e) => setMapLongitude(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-auto">
              <button 
                className="btn btn-primary w-100 d-flex justify-content-center align-items-center gap-1" 
                onClick={saveMapCoords} 
                style={{ height: '38px' }}
              >
                <PlaceIcon fontSize="small" />
                Save
              </button>
            </div>
          </div>
        }
      >
        {showMap && (
          <LocationMapComponent
            key={`${mapContext}-${mapLatitude}-${mapLongitude}`}
            latitude={mapLatitude}
            longitude={mapLongitude}
            onCoordinatesChange={handleMapCoordinatesChange}
          />
        )}
      </MasterSidebar>

      {/* Offcanvas: View Location Map */}
      <MasterSidebar
        show={showViewMap}
        onClose={() => setShowViewMap(false)}
        title="Location Map"
        width={mapOffcanvasWidth}
        backdrop={false}
        backdropOpacity={0.7}
        backdropBlur="50px"
        bodyStyle={{ padding: 0 }}
        footer={
          <div className="row g-2 w-100 bg-white p-2 m-0 align-items-end">
            <div className="col-6 col-md">
              <label className="form-label mb-1 small fw-bold text-secondary">Latitude</label>
              <input
                type="text"
                className="form-control"
                placeholder="Latitude"
                id="txtViewLatitude"
                value={mapLatitude}
                readOnly
              />
            </div>

            <div className="col-6 col-md">
              <label className="form-label mb-1 small fw-bold text-secondary">Longitude</label>
              <input
                type="text"
                className="form-control"
                placeholder="Longitude"
                id="txtViewLongitude"
                value={mapLongitude}
                readOnly
              />
            </div>
          </div>
        }
      >
        {showViewMap && (
          <LocationMapComponent
            key={`view-${mapLatitude}-${mapLongitude}`}
            latitude={mapLatitude}
            longitude={mapLongitude}
            onCoordinatesChange={handleMapCoordinatesChange}
          />
        )}
      </MasterSidebar>

      {/* Offcanvas: Add New Contact Level */}
      <MasterSidebar
        show={showAddContact}
        onClose={() => setShowAddContact(false)}
        title="Add New Contact Level"
        width={offcanvasWidth}
        backdropOpacity={0.7}
        backdropBlur="50px"
        footer={
          <div className="offcanvas-footer">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setShowAddContact(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-success mx-3"
              onClick={() => {
                handleContactSave();
                setShowAddContact(false);
              }}
            >
              Save
            </button>
          </div>
        }
      >
        <div className="p-3">
          <div className="mb-3">
          <label htmlFor="Location" className="form-label">
            Location <span>*</span>
          </label>
          <select className="form-control" id="ddlContactLocation">
            <option value="0">Select Location</option>
            {facContactLocation.map((loc, index) => (
              <option key={index} value={loc.Id}>
                {loc.FullName}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label htmlFor="Level" className="form-label">
            Level <span>*</span>
          </label>
          <select className="form-control" id="ddlLevel">
            <option value="0">Select Level</option>
            <option value="level 1">level 1</option>
            <option value="level 2">level 2</option>
            <option value="level 3">level 3</option>
            <option value="level 4">level 4</option>
            <option value="level 5">level 5</option>
            <option value="level 6">level 6</option>
            <option value="level 7">level 7</option>
            <option value="level 8">level 8</option>
            <option value="level 9">level 9</option>
            <option value="level 10">level 10</option>
          </select>
        </div>
        <div className="mb-3">
          <label htmlFor="ContactName" className="form-label">
            Name <span>*</span>
          </label>
          <input
            type="text"
            className="form-control"
            id="txtContactName"
            placeholder="Enter Contact Name"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="ContactNo" className="form-label">
            Contact No
          </label>
          <input
            type="number"
            className="form-control"
            id="txtLevelContactNo"
            placeholder="Enter Contact No"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="ContactEmail" className="form-label">
            Email <span>*</span>
          </label>
          <input
            type="email"
            className="form-control"
            id="txtContactEmail"
            placeholder="Enter Email"
          />
          </div>
        </div>
      </MasterSidebar>

    </div>
  );
};

export default FacilityMaster;