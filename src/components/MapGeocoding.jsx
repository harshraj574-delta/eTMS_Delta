// MapGeocoding.jsx
import React, { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { ToastContainer } from "react-toastify";
import PlaceIcon from "@mui/icons-material/Place";

import MapGeocodingService from "../services/compliance/MapGeocodingService";
import sessionManager from "../utils/SessionManager";
import { toastService } from "../services/toastService";

import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import MasterSidebar from "./Master/MasterSidebar";
import LocationMapComponent from "./LocationMapComponent";
import TableToolbar from "./common/TableToolbar";
import AnimatedCounter from "./common/AnimatedCounter";
import { CustomDataTable } from "./common/CustomDataTable";
import CustomPaginator from "./common/CustomPaginator";
import ReportButton from "./common/ReportButton";
import Loader from "./common/Loader";
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';

const MapGeocoding = () => {
  // Session & User Info
  const session = sessionManager.getUserSession();
  const locationId = session.locationId || 0;
  const userId = session.ID || 0;
  const facilityId = session.FacilityID || 0;

  // --- State: Summary Counts ---
  const [totalEmployeeCount, setTotalEmployeeCount] = useState(0);
  const [notGeocodedCount, setNotGeocodedCount] = useState(0);
  const [notGeocodedData, setNotGeocodedData] = useState([]);
  const [changeAddressCount, setChangeAddressCount] = useState(0);
  const [changeAddressData, setChangeAddressData] = useState([]);

  // --- State: Employee Search & Grid ---
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeList, setEmployeeList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState(""); // For TableToolbar search

  // Pagination state
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(50);

  // Operation type: 1 = Normal Geocode, 2 = Address Change Request
  const [addrType, setAddrType] = useState(1);
  const [filterFacId, setFilterFacId] = useState(0);

  // --- State: Geocoding Form (Sidebar) ---
  const [showGeocodeSidebar, setShowGeocodeSidebar] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [geoDetails, setGeoDetails] = useState({
    empCode: "",
    empName: "",
    address: "",
    City: "",
    Colony: "",
    Landmark: "",
    subColony: "",
    geoX: "0",
    geoY: "0",
    changeId: 0,
    id: 0,
  });

  // Dropdowns data
  const [cityList, setCityList] = useState([]);
  const [colonyList, setColonyList] = useState([]);

  // --- State: Map (Sidebar) ---
  const [showMapSidebar, setShowMapSidebar] = useState(false);
  const [mapLatitude, setMapLatitude] = useState("");
  const [mapLongitude, setMapLongitude] = useState("");

  // Facility Center (Default for map if emp has no coords)
  const [facilityGeo, setFacilityGeo] = useState({
    lat: "28.6139",
    lng: "77.2090",
  });

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
      return "60%";
    }
    return "60%";
  };

  const [offcanvasWidth, setOffcanvasWidth] = useState(getOffcanvasWidth());
  const [mapOffcanvasWidth, setMapOffcanvasWidth] = useState(getMapOffcanvasWidth());

  useEffect(() => {
    const handleResize = () => {
      setOffcanvasWidth(getOffcanvasWidth());
      setMapOffcanvasWidth(getMapOffcanvasWidth());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Effects ---

  useEffect(() => {
    console.log("Session Data:", {
      locationId,
      userId,
      facilityId,
      isAdmin: session.ISadmin,
    });

    if (locationId && locationId > 0) {
      loadSummaryData();
      loadFacilityGeo();
    } else {
      console.error("Invalid session: locationId is missing");
      toastService.error("Session error. Please login again.");
      setSummaryLoading(false);
    }
  }, []);

  // Reset pagination when globalFilter changes
  useEffect(() => {
    setFirst(0);
  }, [globalFilter]);

  // Debug effect
  useEffect(() => {
    console.log("Summary Data:", {
      notGeocodedCount,
      notGeocodedData,
      changeAddressCount,
      changeAddressData,
    });
  }, [
    notGeocodedCount,
    notGeocodedData,
    changeAddressCount,
    changeAddressData,
  ]);

  // --- Loaders ---

  const loadSummaryData = async () => {
    setSummaryLoading(true);
    try {
      console.log("Loading summary data for locationId:", locationId);

      // 0. Total Employee Count
      const empCountList = await MapGeocodingService.GetEmpCount({
        locationid: locationId,
      });

      console.log("Total Employee Count Raw Response:", empCountList);

      const empCountArray = Array.isArray(empCountList) ? empCountList : [];
      const totalEmpCount = empCountArray.reduce(
        (acc, curr) => acc + (curr.count || curr.Count || 0),
        0
      );
      setTotalEmployeeCount(totalEmpCount);

      console.log("Processed Total Employee Count:", totalEmpCount);

      // 1. Not GeoCoded Counts
      const notGeocodedList =
        await MapGeocodingService.GetNotGeoCodedCount({
          locationid: locationId,
        });

      console.log("Not Geocoded Raw Response:", notGeocodedList);

      const notGeocodedArray = Array.isArray(notGeocodedList)
        ? notGeocodedList
        : [];
      setNotGeocodedData(notGeocodedArray);

      
      const totalNotGeo = notGeocodedArray.reduce(
        (acc, curr) => acc + (curr.count || curr.Count || 0),
        0
      );
      setNotGeocodedCount(totalNotGeo);

      console.log("Processed Not Geocoded:", {
        array: notGeocodedArray,
        total: totalNotGeo,
      });


      const changeList =
        await MapGeocodingService.GetNonGeocodedChangeCount({
          locationid: locationId,
        });

      console.log("Change Address Raw Response:", changeList);

      const changeArray = Array.isArray(changeList) ? changeList : [];
      setChangeAddressData(changeArray);

      // Calculate total - handle case-insensitive field names
      const totalChange = changeArray.reduce(
        (acc, curr) => acc + (curr.count || curr.Count || 0),
        0
      );
      setChangeAddressCount(totalChange);

      console.log("Processed Change Address:", {
        array: changeArray,
        total: totalChange,
      });
    } catch (error) {
      console.error("Error loading summary:", error);
      toastService.error("Failed to load summary counts.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadFacilityGeo = async () => {
    try {
      console.log("Loading facility geo for facilityId:", facilityId);
      const res = await MapGeocodingService.GetFacilityGeo({
        facilityid: facilityId,
      });
      console.log("Facility Geo Response:", res);

      if (res && Array.isArray(res) && res.length > 0) {
        setFacilityGeo({
          lat: res[0].geoY ? res[0].geoY.toString() : "28.6139",
          lng: res[0].geoX ? res[0].geoX.toString() : "77.2090",
        });
      }
    } catch (error) {
      console.error("Error loading facility geo:", error);
    }
  };

  // --- Handlers: Search & Grids ---

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toastService.warn("Please enter Employee ID or Name");
      return;
    }
    setAddrType(1);
    setFilterFacId(0);
    fetchEmployees(searchQuery, 0, 1);
  };

  const fetchEmployees = async (searchText, facId, type) => {
    setLoading(true);
    try {
      console.log("Fetching employees:", { searchText, facId, type });

      let data = [];
      if (facId <= 0) {
        // Manual Search
        data = await MapGeocodingService.EmpSearch({
          locationid: locationId,
          empidname: searchText,
          IsAdmin: session.ISadmin || "N",
        });
      } else {
        // Filter by Facility
        if (type === 1) {
          data = await MapGeocodingService.GetEmployeeByFacility({
            facilityid: facId,
          });
        } else {
          data =
            await MapGeocodingService.GetEmployeeByFacilityChangeAddress({
              facilityid: facId,
            });
        }
      }

      console.log("Employee Search Response:", data);

      const employeeArray = Array.isArray(data) ? data : [];
      setEmployeeList(employeeArray);

      if (employeeArray.length === 0) {
        toastService.info("No records found.");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toastService.error("Error fetching employees.");
      setEmployeeList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSummaryClick = (facId, type) => {
    console.log("Summary clicked:", { facId, type });
    setFilterFacId(facId);
    setAddrType(type);
    setSearchQuery("");
    fetchEmployees("", facId, type);
  };

  // --- Handlers: Geocoding Form ---

  const openGeocodeForm = async (employee) => {
    console.log("Opening geocode form for employee:", employee);
    setSelectedEmployee(employee);
    setShowGeocodeSidebar(true);
    setSidebarLoading(true);

    try {
      // 1. Fetch Cities
      const cities = await MapGeocodingService.GetGeoCity({
        locationid: locationId,
        IsAdmin: session.ISadmin || "N",
      });

      console.log("Cities Response:", cities);

      const citiesArray = Array.isArray(cities) ? cities : [];
      const cityOpts = citiesArray.map((c) => ({
        label: c.city || c.City,
        value: c.city || c.City,
      }));
      setCityList(cityOpts);
      setColonyList([]);

      // 2. Fetch Employee Geo Details
      let details = null;
      let currentGeo = {};

      if (addrType === 2) {
        // Address Change Request
        const changeId = employee.ChangeID || employee.changeID;
        console.log("Fetching change address details:", {
          empId: employee.Id || employee.id,
          changeId,
        });

        const res = await MapGeocodingService.GetChangeAddressEmpGeo({
          empid: employee.Id || employee.id,
          id: changeId,
        });

        console.log("Change Address Details Response:", res);

        details =
          res && Array.isArray(res) && res.length > 0 ? res[0] : null;
        if (details) details.changeId = changeId;
      } else {
        // Standard Geocode
        console.log("Fetching standard geo details:", {
          empId: employee.Id || employee.id,
        });

        const res = await MapGeocodingService.GetEmpGeoDetails({
          empid: employee.Id || employee.id,
          no: 1,
        });

        console.log("Standard Geo Details Response:", res);

        details =
          res && Array.isArray(res) && res.length > 0 ? res[0] : null;
      }

      if (details) {
        const cityVal = details.City || details.city || "";

        // If city exists, fetch colonies immediately
        if (cityVal) {
          await handleCityChange({ value: cityVal }, true);
        }

        currentGeo = {
          empCode: details.empCode || "",
          empName: details.empName || "",
          address: details.Address || details.address || "",
          City: cityVal,
          Colony: details.Colony || details.colony || "",
          Landmark: details.Landmark || details.landmark || "",
          subColony: details.SubColony || details.subColony || details.subcolony || "",
          geoX: details.geoX ? details.geoX.toString() : "0",
          geoY: details.geoY ? details.geoY.toString() : "0",
          changeId: details.changeId || 0,
          id: employee.Id || employee.id,
        };
      } else {
        // No details found, use employee basic info
        currentGeo = {
          empCode: employee.empCode || "",
          empName: employee.empName || "",
          address: employee.address || "",
          City: "",
          Colony: "",
          Landmark: "",
          subColony: "",
          geoX: "0",
          geoY: "0",
          changeId: 0,
          id: employee.Id || employee.id,
        };
      }

      // If no coordinates, use Facility Geo
      if (
        currentGeo.geoX === "0" ||
        currentGeo.geoY === "0" ||
        !currentGeo.geoX
      ) {
        currentGeo.geoX = facilityGeo.lng;
        currentGeo.geoY = facilityGeo.lat;
      }

      console.log("Final Geo Details:", currentGeo);

      setGeoDetails(currentGeo);
      setMapLatitude(currentGeo.geoY);
      setMapLongitude(currentGeo.geoX);
    } catch (error) {
      console.error("Error opening form:", error);
      toastService.error("Error loading employee details.");
    } finally {
      setSidebarLoading(false);
    }
  };

  const handleCityChange = async (e, isInitialLoad = false) => {
    const selectedCity = e.value;
    console.log("City changed:", selectedCity);

    if (!isInitialLoad) {
      setGeoDetails((prev) => ({
        ...prev,
        City: selectedCity,
        Colony: "",
      }));
    }

    try {
      const colonies = await MapGeocodingService.GetGeoCityColony({
        city: selectedCity,
      });

      console.log("Colonies Response:", colonies);

      const coloniesArray = Array.isArray(colonies) ? colonies : [];
      const colonyOpts = coloniesArray.map((c) => ({
        label: c.colony || c.Colony,
        value: c.colony || c.Colony,
      }));
      setColonyList(colonyOpts);
    } catch (error) {
      console.error("Error loading colonies:", error);
      setColonyList([]);
    }
  };

  const handleSaveGeocode = async () => {
    console.log("Saving geocode:", geoDetails);

    // Validation
    if (!geoDetails.City || geoDetails.City === "0") {
      toastService.warn("Please Select City");
      return;
    }
    if (!geoDetails.Colony || geoDetails.Colony === "0") {
      toastService.warn("Please Select Colony");
      return;
    }
    if (!geoDetails.subColony || !geoDetails.subColony.trim()) {
      toastService.warn("Please Enter SubColony");
      return;
    }
    if (!geoDetails.Landmark || !geoDetails.Landmark.trim()) {
      toastService.warn("Please Enter Landmark");
      return;
    }

    try {
      const params = {
        City: geoDetails.City.trim(),
        Colony: geoDetails.Colony.trim(),
        Landmark: geoDetails.Landmark.trim(),
        subcolony: geoDetails.subColony.trim(),
        geoX: geoDetails.geoX.toString().trim(),
        geoY: geoDetails.geoY.toString().trim(),
        locationid: locationId,
        id: geoDetails.id,
      };

      if (addrType === 2) {
        // Address Change
        params.Addresschange = geoDetails.changeId;
        await MapGeocodingService.SaveAddressChangeMapGeocode(params);
      } else {
        // Standard Save
        params.EmpID = geoDetails.id;
        params.addtype = 1;
        await MapGeocodingService.SaveMapGeocode(params);
      }

      toastService.success("Geocode Saved Successfully");
      setShowGeocodeSidebar(false);

      // Refresh Grids
      loadSummaryData();
      if (searchQuery) {
        handleSearch();
      } else if (filterFacId > 0) {
        fetchEmployees("", filterFacId, addrType);
      } else {
        setEmployeeList([]);
      }
    } catch (error) {
      console.error("Save Error:", error);
      toastService.error("Error saving geocode data.");
    }
  };

  // --- Handlers: Map ---

  const openMap = () => {
    setMapLatitude(geoDetails.geoY || facilityGeo.lat);
    setMapLongitude(geoDetails.geoX || facilityGeo.lng);
    setShowMapSidebar(true);
  };

  const handleMapCoordinatesChange = async (lat, lng) => {
    const latStr = Number(lat).toFixed(6);
    const lngStr = Number(lng).toFixed(6);
    setMapLatitude(latStr);
    setMapLongitude(lngStr);

    // Perform reverse geocoding to get landmark and subcolony
    try {
      const geocoder = new window.google.maps.Geocoder();
      const latLng = { lat, lng };

      geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === "OK" && results && results.length > 0) {
          const address = results[0];
          console.log("Reverse Geocoding Result:", address);

          // Extract components
          let landmark = "";
          let subColony = "";

          // Get formatted address or route as landmark
          const route = address.address_components.find((c) =>
            c.types.includes("route")
          );
          const premise = address.address_components.find((c) =>
            c.types.includes("premise")
          );
          const poi = address.address_components.find((c) =>
            c.types.includes("point_of_interest")
          );

          if (poi) {
            landmark = poi.long_name;
          } else if (premise) {
            landmark = premise.long_name;
          } else if (route) {
            landmark = route.long_name;
          } else {
            // Fallback to first part of formatted address
            const parts = address.formatted_address.split(",");
            landmark = parts[0] || "";
          }

          // Get sublocality as subColony
          const sublocality = address.address_components.find(
            (c) =>
              c.types.includes("sublocality") ||
              c.types.includes("sublocality_level_1") ||
              c.types.includes("sublocality_level_2")
          );
          const neighborhood = address.address_components.find((c) =>
            c.types.includes("neighborhood")
          );

          if (sublocality) {
            subColony = sublocality.long_name;
          } else if (neighborhood) {
            subColony = neighborhood.long_name;
          }

          console.log("Extracted:", { landmark, subColony });

          // Update geoDetails with reverse geocoded information
          setGeoDetails((prev) => ({
            ...prev,
            Landmark: landmark || prev.Landmark,
            subColony: subColony || prev.subColony,
          }));
        }
      });
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
  };

  const saveMapCoords = () => {
    setGeoDetails((prev) => ({
      ...prev,
      geoY: mapLatitude,
      geoX: mapLongitude,
    }));
    setShowMapSidebar(false);
    toastService.info("Coordinates updated from map.");
  };

  // --- Renderers ---

  // --- Template: Image (Geocode Status Icon) ---
  const imageBodyTemplate = (rowData) => {
    const isGeocoded =
      rowData.geoCode === "Y" ||
      rowData.geoCode === "y" ||
      rowData.GeoCode === "Y" ||
      rowData.GeoCode === "y";
    return (
      <div className="d-flex align-items-center">
        <i
          className={`pi ${
            isGeocoded ? "pi-check-circle text-success" : "pi-times-circle text-danger"
          }`}
          style={{ fontSize: "1.2rem" }}
          title={isGeocoded ? "Geo-coded" : "Not Geo-coded"}
        ></i>
      </div>
    );
  };

    // --- Template: Action Button ---
  const actionBodyTemplate = (rowData) => {
    const disabled = loading;

    // Check for specific disable conditions (example from old code)
    if (filterFacId > 0 && addrType === 2) {
      if (
        rowData.AddressType !== "Primary" &&
        rowData.addressType !== "Primary"
      ) {
        // Could disable if needed based on logic
      }
    }

    return (
      <div className="d-flex gap-1 justify-content-start">
        <IconButton
          sx={{ color: '#1976d2' }}
          size="small"
          className="action-btn"
          disabled={disabled}
          onClick={() => openGeocodeForm(rowData)}
          title="Edit Geocode"
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </div>
    );
  };

  // --- Map Picker Component ---
  const MapPickerRow = () => {
    return (
      <div className="map-block bg-light p-3 rounded-3 border mt-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <label className="form-label mb-0 fw-bold text-secondary">
            Set Location
          </label>
          <Button
            label="Open Map"
            icon="pi pi-map"
            className="p-button-outlined p-button-secondary p-button-sm py-1 px-3"
            style={{ fontSize: "0.85rem" }}
            type="button"
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
                <PlaceIcon
                  style={{ fontSize: "0.8rem", color: "#6c757d" }}
                />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                readOnly
                value={geoDetails.geoY}
              />
            </div>
          </div>
          <div className="col-12 col-sm-6">
            <label className="form-label form-label-xs text-muted mb-1">
              Longitude
            </label>
            <div className="input-group input-group-sm coord-input">
              <span className="input-group-text bg-white border-end-0">
                <PlaceIcon
                  style={{ fontSize: "0.8rem", color: "#6c757d" }}
                />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                readOnly
                value={geoDetails.geoX}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid p-0">
      <Header pageTitle="Map Geocoding" />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="middle">
        <div className="row">
          {/* <div className="col-12">
            <h6 className="pageTitle">Map Geocoding</h6>
            <div className="text-muted small mb-3">
              Geo Code Employee address by defining pointing X-Y co-ordinates.
            </div>
          </div> */}
        </div>

        {/* KPI Cards Section */}
        <div className="row mt-3">
          {/* Total Employees KPI */}
          <div className="col">
            <div className="cardNew p-4 bg-white">
              <h3
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  fontWeight: 700,
                  fontSize: "31px",
                  lineHeight: "40px",
                  letterSpacing: "-0.03em",
                }}
                className="text-dark"
              >
                {summaryLoading ? (
                  <i className="pi pi-spin pi-spinner"></i>
                ) : (
                  <AnimatedCounter value={totalEmployeeCount} />
                )}
              </h3>
              <span
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  fontWeight: 700,
                  fontSize: "16px",
                  lineHeight: "28px",
                  letterSpacing: "-0.02em",
                  verticalAlign: "middle",
                  color: "#545557",
                }}
              >
                Total Employees
              </span>
            </div>
          </div>

          {/* Facility Not Geocoded KPIs */}
          {summaryLoading ? (
            <div className="col">
              <div className="cardNew p-4 bg-white text-center">
                <i className="pi pi-spin pi-spinner"></i> Loading...
              </div>
            </div>
          ) : (
            notGeocodedData.map((item, idx) => (
              <div className="col" key={idx}>
                <div
                  className="cardNew p-4 bg-white"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSummaryClick(item.Id || item.id, 1)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 4px 6px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "Plus Jakarta Sans",
                      fontWeight: 700,
                      fontSize: "31px",
                      lineHeight: "40px",
                      letterSpacing: "-0.03em",
                    }}
                    className="text-warning"
                  >
                    <AnimatedCounter value={item.count || item.Count} />
                  </h3>
                  <span
                    style={{
                      fontFamily: "Plus Jakarta Sans",
                      fontWeight: 700,
                      fontSize: "16px",
                      lineHeight: "28px",
                      letterSpacing: "-0.02em",
                      verticalAlign: "middle",
                      color: "#545557",
                    }}
                  >
                    Not Geocoded in {item.facilityName}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>


        {/* Search Section */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="card_tb p-3">
              <label className="fw-bold mb-2">Search Employee</label>
              <div className="d-flex gap-2" style={{ maxWidth: "500px" }}>
                <InputText
                  placeholder="Enter Employee ID or Name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  className="w-100"
                />
                <div style={{ minWidth: "120px" }}>
                  <ReportButton
                    label="Search"
                    icon="pi pi-search"
                    onClick={handleSearch}
                    fullWidth={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Grid */}
        <div className="row">
          <div className="col-12">
            <div className="card_tb p-3 mt-3">
              <TableToolbar
                search={globalFilter}
                onSearch={(e) => setGlobalFilter(e.target.value)}
                showExport={false}
              />
              {loading ? (
                <Loader isVisible={true} fullScreen={false} />
              ) : (() => {
                // Filter employee list based on globalFilter
                const filteredEmployees = employeeList.filter((employee) => {
                  if (!globalFilter || globalFilter.trim() === "") return true;
                  
                  const searchLower = globalFilter.toLowerCase();
                  return (
                    (employee.empCode && employee.empCode.toLowerCase().includes(searchLower)) ||
                    (employee.empName && employee.empName.toLowerCase().includes(searchLower)) ||
                    (employee.facilityName && employee.facilityName.toLowerCase().includes(searchLower))
                  );
                });

                return filteredEmployees.length > 0 ? (
                  <>
                    <CustomDataTable
                      value={filteredEmployees.slice(first, first + rows)}
                      loading={loading}
                      emptyMessage="No employees found."
                      className="p-datatable-sm"
                    >
                      <Column
                        body={actionBodyTemplate}
                        header="Action"
                        style={{ width: "100px" }}
                      ></Column>
                      <Column 
                        field="empCode" 
                        header="Employee ID"
                        style={{ width: "150px" }}
                      ></Column>
                      <Column
                        header="GC"
                        body={imageBodyTemplate}
                        style={{ width: "100px" }}
                      ></Column>
                      <Column 
                        field="empName" 
                        header="Employee Name"
                        style={{ width: "200px" }}
                      ></Column>
                      <Column 
                        field="facilityName" 
                        header="Facility"
                        style={{ width: "150px" }}
                      ></Column>
                    </CustomDataTable>
                    <CustomPaginator
                      first={first}
                      rows={rows}
                      totalRecords={filteredEmployees.length}
                      onPageChange={(e) => {
                        setFirst(e.first);
                        setRows(e.rows);
                      }}
                      rowsPerPageOptions={[10, 25, 50, 100]}
                    />
                  </>
                ) : (
                  <div className="text-center p-3 text-muted">
                    No employees found.
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar: Geocode Form */}
      <MasterSidebar
        show={showGeocodeSidebar}
        onClose={() => setShowGeocodeSidebar(false)}
        title="Geocode Employee"
        width={offcanvasWidth}
        headerBgColor="bg-primary text-white"
        backdropOpacity={0.7}
        backdropBlur="50px"
        footer={
          <div className="offcanvas-footer">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setShowGeocodeSidebar(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-success mx-3"
              onClick={handleSaveGeocode}
            >
              Save Geocode
            </button>
          </div>
        }
      >
        <div className="p-3">
          {sidebarLoading ? (
            <Loader isVisible={true} fullScreen={false} />
          ) : (
            <>
              {/* Read Only Details */}
              <div className="card bg-light mb-3 p-3 border-0">
                <div className="row g-2">
                  <div className="col-6">
                    <small className="text-muted d-block">Employee ID</small>
                    <strong>{geoDetails.empCode}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Employee Name</small>
                    <strong>{geoDetails.empName}</strong>
                  </div>
                  <div className="col-12 mt-2">
                    <small className="text-muted d-block">Current Address</small>
                    <span>{geoDetails.address}</span>
                  </div>
                </div>
              </div>

          <div className="form-group mb-3">
            <label className="form-label">City *</label>
            <Dropdown
              value={geoDetails.City}
              options={cityList}
              onChange={handleCityChange}
              placeholder="Select City"
              className="w-100"
              filter
              appendTo={() => document.body}
            />
          </div>

          <div className="form-group mb-3">
            <label className="form-label">Colony *</label>
            <Dropdown
              value={geoDetails.Colony}
              options={colonyList}
              onChange={(e) =>
                setGeoDetails({ ...geoDetails, Colony: e.value })
              }
              placeholder="Select Colony"
              className="w-100"
              filter
              appendTo={() => document.body}
            />
          </div>

          <div className="form-group mb-3">
            <label className="form-label">SubColony *</label>
            <InputText
              value={geoDetails.subColony}
              onChange={(e) =>
                setGeoDetails({ ...geoDetails, subColony: e.target.value })
              }
              className="w-100"
            />
          </div>

          <div className="form-group mb-3">
            <label className="form-label">Landmark *</label>
            <InputText
              value={geoDetails.Landmark}
              onChange={(e) =>
                setGeoDetails({ ...geoDetails, Landmark: e.target.value })
              }
              className="w-100"
            />
          </div>

          <MapPickerRow />
            </>
          )}
        </div>
      </MasterSidebar>

      {/* Sidebar: Map */}
      <MasterSidebar
        show={showMapSidebar}
        onClose={() => setShowMapSidebar(false)}
        title="Set Location"
        width={mapOffcanvasWidth}
        backdrop={false}
        bodyClassName="map-body"
        bodyStyle={{ padding: 0 }}
        footer={
          <div className="row g-2 w-100 bg-white p-2 m-0 align-items-end">
            <div className="col">
              <label className="small fw-bold">Lat</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={mapLatitude}
                readOnly
              />
            </div>
            <div className="col">
              <label className="small fw-bold">Lng</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={mapLongitude}
                readOnly
              />
            </div>
            <div className="col-auto">
              <Button
                label="Confirm Location"
                icon="pi pi-check"
                onClick={saveMapCoords}
              />
            </div>
          </div>
        }
      >
        {showMapSidebar && (
          <div style={{ height: '100%', width: '100%', display: 'flex', flex: 1 }}>
            <LocationMapComponent
              latitude={mapLatitude}
              longitude={mapLongitude}
              onCoordinatesChange={handleMapCoordinatesChange}
            />
          </div>
        )}
      </MasterSidebar>
    </div>
  );
};

export default MapGeocoding;