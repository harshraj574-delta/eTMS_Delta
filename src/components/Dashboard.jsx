import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Master/SidebarMenu";
import "bootstrap/dist/css/bootstrap.min.css";
import "../components/css/style.css";
import { TabMenu } from "primereact/tabmenu";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { Image } from "primereact/image";
import Header from "./Master/Header";
import { BiExpand, BiCalendar } from "react-icons/bi";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";

import RiStats from "./DashboardPage/RiStats";
import RiShiftEmployeeOccupancy from "./DashboardPage/RiShiftEmployeeOccupancy";
import RiNormalAdhoc from "./DashboardPage/RiNormalAdhoc";
import RiShiftCompletionPending from "./DashboardPage/RiShiftCompletionPending";
import RiPickDrop from "./DashboardPage/RiPickDrop";
import RiDropSafeChart from "./DashboardPage/RiDropSafeChart";
import VpStats from "./DashboardPage/VpStats";
import VpVehicleDistribution from "./DashboardPage/VpVehicleDistribution";
import LeafletHeatMap from "./DashboardPage/LeafletHeatMap";

import DriverFragmentation from "./DashboardPage/VendorPerformance/DriverFragmentation";
import VehicleFragmentation from "./DashboardPage/VendorPerformance/VehicleFragmentation";
import FleetEfficiency from "./DashboardPage/VendorPerformance/FleetEfficiency";
import DriverEfficiency from "./DashboardPage/VendorPerformance/DriverEfficiency";
import RouteBreakDuty from "./DashboardPage/VendorPerformance/RouteBreakDuty";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import sessionManager from "../utils/SessionManager";
import driverMasterService from "../services/compliance/DriverMasterService";
import { apiService } from "../services/api";

const Dashboard = () => {
  const userId = sessionManager.getUserSession().ID;
  const locationid = sessionManager.getUserSession().LocationId;

  // States
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedPeriod1, setSelectedPeriod1] = useState("last_7_days");
  const [pendingPeriod1, setPendingPeriod1] = useState("last_7_days");

  const today = new Date();
  const [pendingDateFrom, setPendingDateFrom] = useState(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
  );
  const [pendingDateTo, setPendingDateTo] = useState(today);

  const [visibleCalendar, setVisibleCalendar] = useState(false);
  const calendarRef = useRef(null);

  const [selectedTripType, setSelectedTripType] = useState("");
  const [type, setType] = useState(1); // 1: Employees, 2: Routes
  const [checked, setChecked] = useState(false); // false: Employees, true: Routes
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // default option so dropdown shows "All Cities" on first render
  const defaultCityOption = {
    name: "All Cities",
    value: { Id: "all", locationName: "All Cities" },
  };

  // default option so dropdown shows "All Cities" on first render
  const defaultFacilityOption = {
    name: "All Facility",
    value: { Id: "allFacility", locationName: "All Facility" },
  };

  // const userLocationName = sessionStorage.getItem("LocationName");
  // const userFacilityName = sessionStorage.getItem("FacilityName");

  const [cities, setCities] = useState([]);
  // store the nested `value` as selCity so it matches Dropdown when using optionValue
  const [selCity, setSelCity] = useState(null);

  const [selFacility, setSelFacility] = useState(null);

  // Facility state
  const [facilities, setFacilities] = useState([]);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  //const [selFacility, setSelFacility] = useState(null);

  const [venders, setVenders] = useState([]);
  const [selVendor, setSelVendor] = useState(null);

  const [filter, setFilter] = useState({
    sDate: null,
    eDate: null,
    locationid: null, // undefined for "All Cities"
    facilityid: null,
    vendorid: null,
    triptype: "",
    type: 1,
  });
  // useEffect(() => {
  //   if (!selCity || !selFacility || !selVendor) return;

  //   setFilter({
  //     sDate: pendingDateFrom.toISOString().split("T")[0],
  //     eDate: pendingDateTo.toISOString().split("T")[0],
  //     locationid: selCity?.Id,
  //     facilityid: selFacility,
  //     vendorid: selVendor?.Id === "all" ? undefined : selVendor?.Id,
  //     triptype: selectedTripType,
  //     type,
  //   });
  // }, [
  //   selCity,
  //   selFacility,
  //   selVendor,
  //   selectedTripType,
  //   pendingDateFrom,
  //   pendingDateTo,
  //   type,
  // ]);

  // Date periods options
  const periodOptions1 = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 days", value: "last_7_days" },
    { label: "Last 30 days", value: "last_30_days" },
    { label: "Last 90 days", value: "last_90_days" },
    { label: "Last 12 months", value: "last_12_months" },
    { label: "Custom", value: "custom" },
  ];

  const tripTypeOptions = [
    { label: "Both", value: "" },
    { label: "Pick", value: "P" },
    { label: "Drop", value: "D" },
  ];

  const tabItems = [
    { label: "Routing Insights" },
    { label: "Vendor Performance" },
    { label: "Facility Insights" },
  ];

  // Sync switch with type state
  useEffect(() => {
    setChecked(type === 2);
  }, [type, filter]);

  // Scroll effect to toggle filter fix
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 200);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close calendar on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setVisibleCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch cities and all vendors on mount
  useEffect(() => {
    fetchAllCities();
    // fetchVenders(""); // Bind all vendors on initial load
  }, []);

  // Ensure default city selection always after cities load
  // useEffect(() => {
  //   if (cities.length && !selCity) {
  //     // Set default to "All Cities" nested value
  //     setSelCity(userLocationName);
  //   }
  // }, [cities, selCity]);

  // Fetch facilities when cities are loaded
  // useEffect(() => {
  //   if (cities.length > 0 && facilities.length === 0) {
  //     fetchFacilities();
  //   }
  // }, [cities]);

  // Fetch vendors when facility changes
  // useEffect(() => {
  //   // If no facility or city is selected, or if either is 'all' or empty, fetch all vendors
  //   if (
  //     !selFacility ||
  //     selFacility === "" ||
  //     selFacility === "allFacility" ||
  //     selFacility?.Id === "allFacility" ||
  //     !selCity ||
  //     selCity === "" ||
  //     selCity === "all" ||
  //     selCity?.Id === "all"
  //   ) {
  //     //fetchVenders("");
  //   } else {
  //     //fetchVenders(selFacility.Id || selFacility);
  //   }
  // }, [selFacility, selCity]);
  useEffect(() => {
    if (!selCity || !selFacility || !selVendor) return;

    setFilter({
      sDate: pendingDateFrom ? formatDateLocal(pendingDateFrom) : null,
      eDate: pendingDateTo ? formatDateLocal(pendingDateTo) : null,
      locationid: selCity?.Id === "all" ? undefined : selCity?.Id,
      facilityid:
        selFacility === "allFacility" || selFacility?.Id === "allFacility"
          ? undefined
          : selFacility,
      vendorid: selVendor?.Id === "all" ? undefined : selVendor?.Id,
      triptype: selectedTripType,
      type,
    });
  }, [
    selCity,
    selFacility,
    selVendor,
    selectedTripType,
    pendingDateFrom,
    pendingDateTo,
    type,
  ]);
  // Ensure selVendor is always the actual object from venders array (not a new object)
  useEffect(() => {
    if (venders && venders.length > 0) {
      const allVendorObj = venders.find((v) => v.Id === "all");
      if (allVendorObj) setSelVendor(allVendorObj);
    }
  }, [venders]);

  // Sync pendingPeriod1 when calendar opens
  useEffect(() => {
    if (visibleCalendar) {
      setPendingPeriod1(selectedPeriod1);
    }
  }, [visibleCalendar, selectedPeriod1]);

  // Update date range when pendingPeriod1 changes and not custom
  useEffect(() => {
    if (pendingPeriod1 === "custom") return;

    const now = new Date();
    let from = now;
    let to = now;
    switch (pendingPeriod1) {
      case "today":
        from = to = now;
        break;
      case "yesterday":
        from = to = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 1
        );
        break;
      case "last_7_days":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        break;
      case "last_30_days":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
        break;
      case "last_90_days":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89);
        break;
      case "last_12_months":
        from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        break;
    }

    setPendingDateFrom(from);
    setPendingDateTo(to);
  }, [pendingPeriod1]);

  // Helper: Format date as local yyyy-mm-dd avoiding timezone problems
  const formatDateLocal = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Update filter when selections change
  useEffect(() => {
    const period = selectedPeriod1;

    let sDate = null,
      eDate = null;

    const now = new Date();

    switch (period) {
      case "today":
        sDate = eDate = now;
        break;
      case "yesterday":
        sDate = eDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 1
        );
        break;
      case "last_7_days":
        sDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        eDate = now;
        break;
      case "last_30_days":
        sDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
        eDate = now;
        break;
      case "last_90_days":
        sDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89);
        eDate = now;
        break;
      case "last_12_months":
        sDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        eDate = now;
        break;
      case "custom":
        sDate = pendingDateFrom;
        eDate = pendingDateTo;
        break;
      default:
        sDate = pendingDateFrom;
        eDate = pendingDateTo;
    }

    setFilter({
      sDate: sDate ? formatDateLocal(sDate) : null,
      eDate: eDate ? formatDateLocal(eDate) : null,
      locationid: selCity?.Id === "all" ? undefined : selCity?.Id || "",
      facilityid:
        selFacility === "allFacility" || selFacility?.Id === "allFacility"
          ? undefined
          : selFacility || undefined,
      vendorid:
        selVendor?.Id === "all" ? undefined : selVendor?.Id || undefined,
      triptype: selectedTripType || "",
      type,
    });
  }, [
    selectedPeriod1,
    pendingDateFrom,
    pendingDateTo,
    selCity,
    selFacility,
    selVendor,
    selectedTripType,
    type,
  ]);

  // Fetch data functions
  // const fetchAllCities = async () => {
  //   try {
  //     const response = await apiService.sp_getAllLocation();
  //     let rawList = [];

  //     if (typeof response === "string") rawList = JSON.parse(response);
  //     else if (response?.data)
  //       rawList = Array.isArray(response.data) ? response.data : [];
  //     else if (Array.isArray(response)) rawList = response;

  //     const formatted = [
  //       ...rawList.map((city) => ({
  //         name: city.locationName || city.name || "Unknown",
  //         value: city,
  //       })),
  //     ];

  //     setCities(formatted);

  //     // Set default to All Cities option - ensure it's the first item
  //     const allCitiesOption = formatted.find((city) => city.name === userLocationName );
  //     // store nested value for consistency with Dropdown optionValue
  //     setSelCity(allCitiesOption.value);

  //     // Immediately fetch facilities for all cities
  //     fetchFacilitiesByCity(allCitiesOption.value);
  //   } catch (err) {
  //     console.error("Error fetching cities:", err);
  //     setCities([ ]);
  //     setSelCity('');
  //   }
  // };

  //   const fetchAllCities = async () => {
  //   try {
  //     const response = await apiService.sp_getAllLocation();
  //     let rawList = [];

  //     if (typeof response === "string") rawList = JSON.parse(response);
  //     else if (response?.data)
  //       rawList = Array.isArray(response.data) ? response.data : [];
  //     else if (Array.isArray(response)) rawList = response;

  //     // format for Dropdown
  //     const formatted = rawList.map((city) => ({
  //       name: city.locationName || city.name || "Unknown",
  //       value: { Id: city.Id, locationName: city.locationName || city.name },
  //     }));

  //     setCities(formatted);

  //     // find logged-in user's city
  //     const userCity = formatted.find(
  //       (c) =>
  //         c.value.locationName?.toLowerCase() ===
  //         userLocationName?.toLowerCase()
  //     );

  //     if (userCity) {
  //       setSelCity(userCity.value);
  //       fetchFacilitiesByCity(userCity.value.Id); // fetch facilities of that city
  //     } else {
  //       setSelCity(null);
  //     }
  //   } catch (err) {
  //     console.error("Error fetching cities:", err);
  //     setCities([]);
  //     setSelCity(null);
  //   }
  // };
  const fetchAllCities = async () => {
    try {
      const res = await apiService.sp_getAllLocation();
      const rawList = typeof res === "string" ? JSON.parse(res) : res || [];

      const formatted = rawList.map((city) => ({
        name: city.locationName || city.name || "Unknown",
        value: { Id: city.Id, locationName: city.locationName || city.name },
      }));

      setCities(formatted);

      // Default: first city from API
      const defaultCity = formatted[0]?.value || null;
      setSelCity(defaultCity);

      // Fetch facilities for that city
      if (defaultCity?.Id) fetchFacilitiesByCity(defaultCity.Id);
    } catch (err) {
      console.error("Error fetching cities:", err);
      setCities([]);
      setSelCity(null);
    }
  };

  // const fetchFacilitiesByCity = (cityId) => {
  //   apiService
  //     .Getchart_Facility({ cityId })
  //     .then((res) => {
  //       const data = JSON.parse(res.data) || [];
  //       setFacilities(data);
  //       setFilteredFacilities(data);

  //       // find logged-in user's facility
  //       const userFaci = data.find(
  //         (f) =>
  //           f.facilityName?.toLowerCase() === userFacilityName?.toLowerCase()
  //       );
  //       if (userFaci) {
  //         setSelFacility(userFaci.Id);
  //       } else {
  //         setSelFacility(null);
  //       }
  //     })
  //     .catch(() => {
  //       setFacilities([]);
  //       setFilteredFacilities([]);
  //       setSelFacility(null);
  //     });
  // };
  const fetchFacilitiesByCity = async (cityId) => {
    try {
      const res = await apiService.Getchart_Facility({ locationid: cityId });
      const data = typeof res === "string" ? JSON.parse(res) : res || [];

      setFacilities(data);
      setFilteredFacilities(data);

      // Default: first facility from API
      const defaultFacility = data[0]?.Id || null;
      setSelFacility(defaultFacility);

      // Fetch vendors for this facility
      if (defaultFacility) fetchVendors(defaultFacility);
    } catch (err) {
      console.error("Error fetching facilities:", err);
      setFacilities([]);
      setFilteredFacilities([]);
      setSelFacility(null);
    }
  };

  const fetchFacilities = () => {
    apiService
      .Getchart_Facility(locationid)
      .then((res) => {
        const data = JSON.parse(res.data) || [];
        setFacilities(data);
        // Add 'All Facility' as the first option
        // const allFacilityOption = { Id: "allFacility", facilityName: "All Facility" };
        const facilitiesWithAll = [...data];

        const cityFacilities = facilities.filter(
          (facility) => facility.locationId === userLocationName
        );
        setFilteredFacilities(cityFacilities);

        if (cityFacilities.length > 0) {
          setSelFacility(userFacilityName);
        } else {
          setFilteredFacilities(facilitiesWithAll);

          let cfaci = facilitiesWithAll.find(
            (faci) => faci.facilityName === userFacilityName
          );
          if (cfaci) {
            setSelFacility(cfaci.Id);
          } else {
            setSelFacility("");
          }
        }
      })
      .catch(() => {
        setFacilities([]);
        setFilteredFacilities([]);
        //setSelFacility(userFacilityName);
      });
  };

  // const fetchFacilitiesByCity = (cityId) => {
  //   // if (cityId === "all") {
  //   //   fetchFacilities();
  //   // } else {
  //     driverMasterService
  //       .getFacilities({ cityId })
  //       .then((res) => {
  //         const data = JSON.parse(res.data) || [];
  //         setFacilities(data);
  //         // Add 'All Facility' as the first option
  //         // const allFacilityOption = { Id: "allFacility", facilityName: "All Facility" };
  //         const facilitiesWithAll = [...data];
  //         setFilteredFacilities(facilitiesWithAll);
  //         setSelFacility(userFacilityName || '');
  //       })
  //       .catch(() => {
  //         setFacilities([]);
  //         setFilteredFacilities([]);
  //         setSelFacility(userFacilityName);
  //       });
  //   // }
  // };

  // const fetchVenders = (facilityId) => {
  //   setSelVendor(null); // Reset before fetching
  //   let param = {};
  //   // If facilityId is null, undefined, or empty string, fetch all vendors
  //   if (facilityId && facilityId !== "allFacility" && facilityId !== "") {
  //     param.facilityid = facilityId;
  //   }
  //   driverMasterService
  //     .getVenders(param)
  //     .then((res) => {
  //       const data = JSON.parse(res.data) || [];
  //       const allVendorOption = { vendorName: "All Vendor", Id: "all" };
  //       const vendorList = [allVendorOption, ...data];
  //       setVenders(vendorList);
  //       // Always select All Vendor by default
  //       setSelVendor(allVendorOption);
  //     })
  //     .catch(() => {
  //       setVenders([]);
  //       setSelVendor(null);
  //     });
  // };
  useEffect(() => {
    if (selFacility) {
      fetchVendors(selFacility);
    }
  }, [selFacility]);

  const fetchVendors = async (facilityId) => {
    try {
      const res = await apiService.sp_getVendorByFac({
        facilityid: facilityId,
      });
      const data = typeof res === "string" ? JSON.parse(res) : res || [];

      const allVendorOption = { vendorName: "All Vendor", Id: "all" };
      setVenders([allVendorOption, ...data]);
      setSelVendor(allVendorOption); // always default
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setVenders([]);
      setSelVendor(null);
    }
  };

  // Handlers
  // const handleCityChange = (e) => {
  //   // With optionValue="value", e.value is the nested city object
  //   const selected = e.value;
  //   setSelCity(selected);

  //   // Reset facility when city changes
  //   setSelFacility(userFacilityName);

  //   const cityId = selected?.Id;

  //   // Filter facilities based on selected city
  //   if (cityId === "all") {
  //     setFilteredFacilities(facilities);
  //     if (facilities.length > 0) {
  //       setSelFacility(facilities[0]?.Id);
  //     }
  //   } else {
  //     const cityFacilities = facilities.filter(
  //       (facility) => facility.locationId === cityId
  //     );
  //     setFilteredFacilities(cityFacilities);
  //     if (cityFacilities.length > 0) {
  //       setSelFacility(cityFacilities[0]?.Id);
  //     }
  //   }
  // };
  const handleCityChange = (e) => {
    const selected = e.value;
    setSelCity(selected);
    fetchFacilitiesByCity(selected?.Id);
  };

  const handleFacilityChange = (e) => {
    const facilityId = e.value;
    setSelFacility(facilityId);
    fetchVendors(facilityId);
  };
  const handleChange = (e) => {
    const value = e.target.value;
    setType(value === "2" ? 2 : 1); // Set type based on selection
  };
  const handleVendorChange = (e) => {
    setSelVendor(e.value);
  };
  return (
    <div className="container-fluid p-0" style={{ background: "#f9f9f9" }}>
      <Header pageTitle="Dashboard" />
      <Sidebar />
      <div className="middle">
        <div className="row mb-4">
          <div className="col-12">
            <div
              className={`cardx mt-3 p-3 border-0 ${
                scrolled ? "filterFix shadow" : "hidden"
              }`}
            >
              <div className="row d-flex align-items-center">
                <div className="col-12 col-md-12 col-lg-12 col-xl-4">
                  <TabMenu
                    model={tabItems}
                    activeIndex={activeIndex}
                    onTabChange={(e) => setActiveIndex(e.index)}
                  />
                </div>
                <div className="col-12 col-md-12 col-lg-12 col-xl-8 mt-3 mt-xl-0">
                  <div className="row">
                    <div className="col position-relative">
                      <label>Date</label>
                      <div
                        className="custom-select"
                        onClick={() => setVisibleCalendar((v) => !v)}
                      >
                        <BiCalendar style={{ marginRight: 4 }} />
                        {periodOptions1.find(
                          (opt) => opt.value === selectedPeriod1
                        )?.label || "Custom Calendar"}
                      </div>
                      {visibleCalendar && (
                        <div className="custom-calender" ref={calendarRef}>
                          <div className="row">
                            <div className="col-3">
                              <div className="time-filter">
                                <ul className="time-filter-list">
                                  {periodOptions1.map(({ label, value }) => (
                                    <li
                                      key={value}
                                      className={`time-filter-item ${
                                        pendingPeriod1 === value ? "active" : ""
                                      }`}
                                      onClick={() => setPendingPeriod1(value)}
                                    >
                                      {label}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            <div className="col">
                              <input
                                type="text"
                                className="form-control mb-3 form-control-sm"
                                value={
                                  pendingDateFrom?.toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                  }) || ""
                                }
                                readOnly
                              />
                              <Calendar
                                onChange={(date) => {
                                  setPendingDateFrom(date);
                                  setPendingPeriod1("custom");
                                }}
                                value={pendingDateFrom}
                              />
                            </div>
                            <div className="col">
                              <input
                                type="text"
                                className="form-control mb-3 form-control-sm"
                                value={
                                  pendingDateTo?.toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                  }) || ""
                                }
                                readOnly
                              />
                              <Calendar
                                onChange={(date) => {
                                  setPendingDateTo(date);
                                  setPendingPeriod1("custom");
                                }}
                                value={pendingDateTo}
                              />
                            </div>
                            <div className="col-12 mt-3 text-end">
                              <button
                                className="btn btn-secondary me-2"
                                onClick={() => setVisibleCalendar(false)}
                              >
                                Close
                              </button>
                              <button
                                className="btn btn-primary"
                                onClick={() => {
                                  setSelectedPeriod1(pendingPeriod1);
                                  setVisibleCalendar(false);
                                  setFilter((prev) => ({
                                    ...prev,
                                    sDate: pendingDateFrom
                                      ? formatDateLocal(pendingDateFrom)
                                      : null,
                                    eDate: pendingDateTo
                                      ? formatDateLocal(pendingDateTo)
                                      : null,
                                  }));
                                }}
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="col">
                      <label>City</label>
                      <Dropdown
                        value={selCity}
                        optionLabel="name"
                        optionValue="value"
                        onChange={handleCityChange}
                        options={cities}
                        placeholder="Select City"
                        className="w-100"
                        showClear={false}
                      />
                    </div>

                    <div className="col">
                      <label>Facility</label>
                      <Dropdown
                        value={selFacility}
                        optionLabel="facilityName"
                        optionValue="Id"
                        onChange={handleFacilityChange}
                        options={filteredFacilities}
                        placeholder="Select Facility"
                        className="w-100"
                      />
                    </div>

                    <div className="col">
                      <label>Trip Type</label>
                      <Dropdown
                        value={selectedTripType}
                        options={tripTypeOptions}
                        onChange={(e) => setSelectedTripType(e.value)}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select Trip Type"
                        className="w-100"
                      />
                    </div>

                    <div className="col">
                      <label>Vendor</label>
                      <Dropdown
                        value={selVendor}
                        onChange={handleVendorChange}
                        options={venders}
                        optionLabel="vendorName"
                        placeholder="Select Vendor"
                        className="w-100"
                        filter
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="row">
          <div className="col-12">
            {(() => {
              switch (activeIndex) {
                case 0:
                  return (
                    <>
                      {" "}
                      {/* {console.log("🔍 Routing Insights Filter:", filter)} */}
                      <RiStats filter={filter} />
                      <div className="row mt-4">
                        <div
                          className="col-6 mb-3"
                          // style={{ height: "585px", position: "relative" }}
                        >
                          <div className="cardx border-0 p-3 h-100">
                            <h6 className="d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center">
                                <span className="me-2">
                                  {checked ? "Routes" : "Employees"} Density
                                </span>
                              </div>
                              {/* <div className="d-flex align-items-center">
                                  <span className="me-2" style={{ fontSize: "12px", color: "#666" }}>
                                    Employees
                                  </span>
                                  <InputSwitch 
                                    checked={checked} 
                                    onChange={(e) => {
                                      setChecked(e.value);
                                      setType(e.value ? 2 : 1);
                                    }} 
                                    style={{ transform: "scale(0.8)" }}
                                  />
                                  <span className="ms-2" style={{ fontSize: "12px", color: "#666" }}>
                                    Routes
                                  </span>
                                </div> */}

                              <div className="d-flex align-items-center">
                                <select
                                  className="form-select form-select-map pointer"
                                  value={type}
                                  onChange={handleChange}
                                >
                                  <option value="1">Employees</option>
                                  <option value="2">Routes</option>
                                </select>
                                <div className="ms-3 ">
                                  <Tooltip
                                    target="#expand-route-distribution"
                                    content="Expand Map"
                                    position="top"
                                  />
                                  <span
                                    id="expand-route-distribution"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => setDialogVisible(true)}
                                  >
                                    <BiExpand />
                                  </span>
                                </div>
                              </div>
                            </h6>
                            <hr />
                            {/* {console.log(
                              "Rendering LeafletHeatMap with filter:",
                              filter
                            )} */}
                            <LeafletHeatMap filter={filter} />
                          </div>
                        </div>
                        <div className="col-6 mb-3">

                          {/* {console.log(
                            "Rendering RiShiftEmployeeOccupancy with filter:",
                            filter
                          )} */}
                          <div>
                            
                          </div>
                          <RiShiftEmployeeOccupancy filter={filter} />
                        </div>
                        <div className="col-8">
                          {/* {console.log(
                            "Rendering RiPickDrop with filter:",
                            filter
                          )} */}
                          <RiPickDrop filter={filter} />
                        </div>
                        <div className="col-4 mb-3">
                          {/* {console.log(
                            "Rendering RiShiftCompletionPending with filter:",
                            filter
                          )} */}
                          <RiShiftCompletionPending filter={filter} />
                        </div>
                      </div>
                      <div className="row mt-3 d-flex align-items-stretch">
                        <div className="col-6 mb-3 h-100">
                          <RiDropSafeChart filter={filter} />
                        </div>
                        <div className="col-6 mb-3 h-100">
                          <RiNormalAdhoc filter={filter} />
                        </div>
                      </div>
                      {/* <div className="row d-flex">
                        <div className="col-6">
                          <div className="card h-100">
                            1 <br />
                            2
                          </div>
                        </div>
                        <div className="col-6">
                            <div className="card h-100">1</div>
                          </div>
                      </div> */}
                    </>
                  );
                case 1:
                  return (
                    <>
                      <VpStats filter={filter} />
                      <div className="row mt-4 mb-3">
                        <div className="col-4">
                          <VpVehicleDistribution filter={filter} />
                        </div>
                        <div className="col-8">
                          <RouteBreakDuty filter={filter} />
                          {/* <div className="cardx border-0 p-3">
                            <h6>Routes vs Breakdowns vs Duty Hours</h6>
                            <hr />
                            <Image
                              src="src/assets/chart4.png"
                              alt="Routes vs Breakdowns"
                              className="img-fluid"
                            />
                          </div> */}
                        </div>
                      </div>
                      <div className="row align-items-stretch">
                        <div className="col-4 mb-3">
                          <FleetEfficiency filter={filter} />
                        </div>
                        <div className="col-4 mb-3">
                          <DriverEfficiency filter={filter} />
                        </div>

                        {/* <div className="col-4 mb-3">
                          <TripEfficiency />
                        </div> */}
                        <div className="col-4 mb-3">
                          <VehicleFragmentation filter={filter} />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-4 mb-3">
                          <DriverFragmentation filter={filter} />
                        </div>
                      </div>
                    </>
                  );
                case 2:
                  return (
                    <>
                      <div className="row mb-3">
                        <div className="col-12">
                          <div className="cardx border-0 p-3">
                            <iframe
                              title="Google Map"
                              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d28069.195720471515!2d77.01584120702411!3d28.42983216765682!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d190d4d1ab7f9%3A0x9edd43ec9fba1ce9!2sAccenture%20DDC7x!5e0!3m2!1sen!2sin!4v1748521289659!5m2!1sen!2sin"
                              width="100%"
                              height="450"
                              style={{ border: 0 }}
                              allowFullScreen
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-12">
                          <div className="cardNew w-100 p-2">
                            <ul>
                              <li>
                                <span className="overline_text text-primary">
                                  Average Trips per day 2500
                                </span>
                                <h3>
                                  <strong>1,042</strong>
                                </h3>
                                <span className="subtitle_sm">Total Trips</span>
                              </li>
                              <li>
                                <span className="overline_text text-primary">
                                  1.3 Trips per vehicle
                                </span>
                                <h3>
                                  <strong>784</strong>
                                </h3>
                                <span className="subtitle_sm">
                                  Vehicles Deployed
                                </span>
                              </li>
                              <li>
                                <span className="overline_text text-primary">
                                  0.2% of Total
                                </span>
                                <h3>
                                  <strong>26</strong>
                                </h3>
                                <span className="subtitle_sm">B2B Routes</span>
                              </li>
                              <li>
                                <span className="overline_text text-primary">
                                  Overall Breakdowns 30
                                </span>
                                <h3>
                                  <strong>12</strong>
                                </h3>
                                <span className="subtitle_sm">Breakdowns</span>
                              </li>
                              <li>
                                <span className="overline_text text-primary">
                                  Lowest is 22 Routes for GGN1
                                </span>
                                <h3>
                                  <strong>109</strong>
                                </h3>
                                <span className="subtitle_sm">
                                  Single Employee Routes
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                default:
                  return null;
              }
            })()}
          </div>
        </div>
      </div>

      {/* Heatmap dialog */}
      <Dialog
        header={`${checked ? "Routes" : "Employees"} Density`}
        visible={dialogVisible}
        style={{ width: "90vw", minHeight: "90vh" }}
        onHide={() => setDialogVisible(false)}
      >
        <div
          className="m-0 bg-light"
          style={{ height: "710px", width: "100%", position: "relative" }}
        >
          <LeafletHeatMap
            filter={filter}
            style={{
              height: "710px",
              width: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
            }}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default Dashboard;
