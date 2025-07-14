import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Master/SidebarMenu";
import Notifications from "./Master/Notifications";
import "bootstrap/dist/css/bootstrap.min.css";
import "../components/css/style.css";
import { TabMenu } from "primereact/tabmenu";
import { Chart } from "primereact/chart";
import { Dropdown } from "primereact/dropdown";
import { Image } from "primereact/image";
import { Button } from "primereact/button";
import Header from "./Master/Header";
import { BiExpand } from "react-icons/bi";
import { MeterGroup } from "primereact/metergroup";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";

import { get } from "lodash";
import RiStats from "./DashboardPage/DashboardPage/RiStats";
import RiNormalAdhoc from "./DashboardPage/DashboardPage/RiNormalAdhoc";
import RiShiftCompletionPending from "./DashboardPage/DashboardPage/RiShiftCompletionPending";
import RiPickDrop from "./DashboardPage/DashboardPage/RiPickDrop";

import sessionManager from "../utils/SessionManager";
import driverMasterService from "../services/compliance/DriverMasterService";
import RiDropSafeChart from "./DashboardPage/DashboardPage/RiDropSafeChart";
import { apiService } from "../services/api";
import VpStats from "./DashboardPage/DashboardPage/VpStats";
import LeafletHeatMap from "./DashboardPage//DashboardPage/LeafletHeatMap";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { data } from "react-router-dom";

const Dashboard = () => {
  const userId = sessionManager.getUserSession().ID;
  // Add this state for selected index
  const [dialogVisible, setDialogVisible] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date()); // sirf ek hi jagah

  const handleCalendarClose = () => console.log("Calendar closed");
  const handleCalendarOpen = () => console.log("Calendar opened");

  const [selected, setSelected] = useState("");
  //const [selectedDate, setSelectedDate] = useState(new Date());

  const handleSelect = (value) => {
    setSelected(value);
    setSelectedPeriod1(value); // Add this line

    // Optionally, set selectedDate based on value
    let date = new Date();
    if (value === "today") {
      date = new Date();
    } else if (value === "yesterday") {
      date = new Date();
      date.setDate(date.getDate() - 1);
    } else if (value === "last_7_days") {
      date = new Date();
      date.setDate(date.getDate() - 7);
    } else if (value === "last_30_days") {
      date = new Date();
      date.setDate(date.getDate() - 30);
    }
    // ...add logic for other options if needed

    setSelectedDate(date);
    // Yahan filter bhi update kar sakte hain agar zarurat ho
  };

  const [visiblex, setVisiblex] = useState(false);
  const calendarRef = useRef(null);
  // Close calendar on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setVisiblex(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const periodOptions1 = [
    { label: "Today", value: "today", type: "day" },
    { label: "Yesterday", value: "yesterday", type: "day" },
    { label: "Last 7 days", value: "last_7_days", type: "week" },
    { label: "Last 30 days", value: "last_30_days", type: "month" },
    { label: "Last 90 days", value: "last_90_days", type: "quarter" },
    { label: "Last 12 months", value: "last_12_months", type: "year" },
    { label: "Custom", value: "custom", type: "custom" }, // Add this
  ];
  const today = new Date();
  const firstDayOfWeek = new Date(today);
  firstDayOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
  const lastDayOfWeek = new Date(today);
  lastDayOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Saturday

  const [selectedPeriod1, setSelectedPeriod1] = useState("last_7_days");
  const [pendingPeriod1, setPendingPeriod1] = useState("last_7_days");
  const [pendingDate, setPendingDate] = useState(selectedDate);
  const [pendingDateFrom, setPendingDateFrom] = useState(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
  );
  const [pendingDateTo, setPendingDateTo] = useState(today);

  // Custom calendar open/close par pendingPeriod1 ko sync karein
  useEffect(() => {
    if (visiblex) {
      setPendingPeriod1(selectedPeriod1);
      setPendingDate(selectedDate);
    }
  }, [visiblex, selectedPeriod1, selectedDate]);

  const periodOptions = [
    { label: "Today", value: "today", type: "day" },
    { label: "This Week", value: "week", type: "week" },
    { label: "This Month", value: "month", type: "month" },
    { label: "This Quater", value: "quarter", type: "quarter" },
    { label: "This Year", value: "year", type: "year" },
  ];
  const [selectedPeriod, setSelectedPeriod] = useState(periodOptions[2].value);
  const tripTypeOptions = [
    { label: "Both", value: "" },
    { label: "Pick", value: "P" },
    { label: "Drop", value: "D" },
  ];
  const [selectedTripType, setSelectedTripType] = useState("");

  //Tab Menu
  const items = [
    { label: "Routing Insights" },
    { label: "Vendor Performance" },
    { label: "Facility Insights" },
  ];
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [hasShadow, setHasShadow] = useState(false);
  const [visible, setVisible] = useState(true); // optional for slide effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Lookup states
  const [facilities, setFacilities] = useState([]);
  const [filterFacilities, setfilterFacilities] = useState([]);

  const [venders, setVenders] = useState([]);

  // Selectted Values
  // const [selCity, setSelCity] = useState(null);
  // const [cities, setCities] = useState([]);

  const [cities, setCities] = useState([]);
  const [selCity, setSelCity] = useState({ name: "All Cities", value: { Id: "all", locationName: "All Cities" } });

  const [selFacility, setSelFacility] = useState(1);
  const [selVendor, setSelVendor] = useState(null);
  const [filter, setFilter] = useState({
    sDate: null, // selectedPeriod
    eDate: null, // selectedPeriod
    locationid: null, // selCity
    facilityid: null, // selFacility
    vendorid: null, // selVendor
    triptype: null, // selectedTripType
  });

  useEffect(() => {
    fetchFacilities();
  }, []);

  // Keep this for vendors only
  useEffect(() => {
    if (selFacility?.Id) {
      fetchVenders(selFacility.Id);
    }
  }, [selFacility]);

  // Component mount par cities pehle fetch karein
  useEffect(() => {
    fetchAllCities(); // Pehle cities load karein
  }, []);

  // Separate function for fetching all cities
  // Separate function for fetching all cities
  const fetchAllCities = async () => {
    try {
      const response = await apiService.sp_getAllLocation();
      console.log("Raw cities response:", JSON.stringify(response, null, 2));

      let rawList = [];
      if (typeof response === "string") {
        rawList = JSON.parse(response);
      } else if (response?.data) {
        rawList = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        rawList = response;
      }

      // Add "All Cities" option at the top
      const formatted = [
        { name: "All Cities", value: { Id: "all", locationName: "All Cities" } },
        ...rawList.map((city) => ({
          name: city.locationName || city.name || "Unknown",
          value: city
        }))
      ];

      setCities(formatted);
      setSelCity(formatted[0]); // Yahi "All Cities" ko default select karta hai
      // If "All Cities" is selected, fetch all facilities
      fetchFacilitiesByCity("all");
    } catch (err) {
      console.error("Error fetching cities:", err);
      setCities([{ name: "All Cities", value: { Id: "all", locationName: "All Cities" } }]);
      setSelCity({ name: "All Cities", value: { Id: "all", locationName: "All Cities" } });
    }
  };

  const changeCity = (e) => {
    console.log("Selected city:", facilities, e.value, e.value.Id);
    setSelCity(e.value); // Always set as object
    // Fetch facilities based on selected city
    if (e.value.Id === "all") {
      // Always fetch all facilities for the user when 'All Cities' is selected
      driverMasterService.getFacilitiesByUserId(userId)
        .then((res) => {
          const data = JSON.parse(res.data) || [];
          setFacilities(data);
          setfilterFacilities(data);
          setSelFacility(data[0] || null);
        })
        .catch((err) => {
          console.log("Error fetching all facilities:", err);
          setFacilities([]);
          setfilterFacilities([]);
          setSelFacility(null);
        });
    } else {
      let filterfacility = facilities.filter(data => {
        return data.locationId === e?.value?.Id;
      });
      console.log("Filtered facilities:", filterfacility);
      setfilterFacilities(filterfacility);
      setSelFacility(filterfacility[0] || null);
    }
  }
  const fetchFacilities = () => {
    driverMasterService
      .getFacilitiesByUserId(userId)
      .then((res) => {
        const data = JSON.parse(res.data) || [];
        //console.log("Facilities", data);
        setFacilities(data);
        setfilterFacilities(data);
        setSelFacility(data[0]);
      })
      .catch((err) => {
        console.log("Error", err);
      });
  };
  const fetchVenders = (id) => {
    driverMasterService
      .getVenders({ facilityid: id })
      .then((res) => {
        const data = JSON.parse(res.data) || [];
        setVenders([{ vendorName: "All Vendor", Id: "all" }, ...data]);
        setSelVendor({ vendorName: "All Vendor", Id: "all" }); // <-- Add this line
      })
      .catch((err) => {
        console.log("Error", err);
      });
  };

  const fetchCitiesByFacility = async (facilityId) => {
    try {
      // Correct parameter format
      const response = await apiService.getCitiesByFacility({
        facilityId: facilityId,
      });
      console.log("Raw API response:", response);

      let rawList = [];
      // Better response handling
      if (typeof response === "string") {
        try {
          rawList = JSON.parse(response);
        } catch (e) {
          console.error("Failed to parse response as JSON:", e);
        }
      } else if (response?.data) {
        // Handle if response is { data: [...] }
        rawList = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        rawList = response;
      }

      console.log("Processed cities list:", rawList);

      if (!rawList || !rawList.length) {
        console.warn("No cities found for facility:", facilityId);
        // Still set All Cities option
        setCities([
          {
            name: "All Cities",
            value: { Id: "all", locationName: "All Cities" },
          },
        ]);
        setSelCity({
          name: "All Cities",
          value: { Id: "all", locationName: "All Cities" },
        });
        return;
      }

      // Format correctly based on actual API response structure
      const formatted = [
        {
          name: "All Cities",
          value: { Id: "all", locationName: "All Cities" },
        },
        ...rawList.map((city) => ({
          name: city.locationName || city.name || "Unknown",
          value: city,
        })),
      ];

      console.log("Formatted cities for dropdown:", formatted);

      setCities(formatted);
      setSelCity(formatted[0]);
    } catch (err) {
      console.error("Error fetching cities by facility:", err);
      setCities([
        {
          name: "All Cities",
          value: { Id: "all", locationName: "All Cities" },
        },
      ]);
      setSelCity({
        name: "All Cities",
        value: { Id: "all", locationName: "All Cities" },
      });
    }
  };

  // New function to fetch facilities by city
  const fetchFacilitiesByCity = (cityId) => {
    // If "all" is selected, fetch all facilities for the user
    if (cityId === "all") {
      driverMasterService
        .getFacilitiesByUserId(userId)
        .then((res) => {
          const data = JSON.parse(res.data) || [];
          setFacilities(data);
          if (data.length > 0) {
            setSelFacility(data[0]);
            // When facility changes, fetch vendors
            fetchVenders(data[0]?.Id);
          }
        })
        .catch((err) => {
          console.log("Error fetching facilities:", err);
        });
    } else {
      // Fetch facilities by city ID
      driverMasterService
        .getFacilitiesByCity({ cityId: cityId }) // <-- Yeh API method exist nahi karta ya properly implement nahi hai
        .then((res) => {
          const data = JSON.parse(res.data) || [];
          setFacilities(data);
          if (data.length > 0) {
            setSelFacility(data[0]);
            // When facility changes, fetch vendors
            fetchVenders(data[0]?.Id);
          }
        })
        .catch((err) => {
          console.log("Error fetching facilities by city:", err);
        });
    }
  };

  useEffect(() => {
    console.log(
      "------rrrrr------",
      selectedPeriod,
      selCity,
      selFacility,
      selectedTripType,
      selVendor,
      selCity
    );

    // yahan par selectedPeriod ko replace kar dein:
    // selectedPeriod1 agar visiblex (custom calendar) open hai, warna selectedPeriod
    const period = selectedPeriod1 || selectedPeriod;

    let sDate = "";
    let eDate = "";

    const today = new Date();

    if (period === "today") {
      sDate = new Date();
      eDate = new Date();
    } else if (period === "week") {
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

      const lastDayOfWeek = new Date(today);
      lastDayOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Saturday

      sDate = firstDayOfWeek;
      eDate = lastDayOfWeek;
    } else if (period === "month") {
      const firstDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

      const lastDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      );

      sDate = firstDayOfMonth;
      eDate = lastDayOfMonth;
    } else if (period === "year") {
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
      const lastDayOfYear = new Date(today.getFullYear(), 11, 31);

      sDate = firstDayOfYear;
      eDate = lastDayOfYear;
    } else if (period === "quarter") {
      const quarter = Math.floor(today.getMonth() / 3);
      const firstMonthOfQuarter = quarter * 3;
      const firstDayOfQuarter = new Date(
        today.getFullYear(),
        firstMonthOfQuarter,
        1
      );
      const lastDayOfQuarter = new Date(
        today.getFullYear(),
        firstMonthOfQuarter + 3,
        0
      );

      sDate = firstDayOfQuarter;
      eDate = lastDayOfQuarter;
    } else if (period === "last_7_days") {
      sDate = new Date();
      sDate.setDate(today.getDate() - 7);
      eDate = today;
    } else if (period === "last_30_days") {
      sDate = new Date();
      sDate.setDate(today.getDate() - 30);
      eDate = today;
    } else if (period === "last_90_days") {
      sDate = new Date();
      sDate.setDate(today.getDate() - 90);
      eDate = today;
    } else if (period === "last_365_days") {
      sDate = new Date();
      sDate.setDate(today.getDate() - 365);
      eDate = today;
    } else if (period === "last_12_months") {
      sDate = new Date(
        today.getFullYear() - 1,
        today.getMonth(),
        today.getDate()
      );
      eDate = today;
    } else {
      sDate = pendingDateFrom;
      eDate = pendingDateTo;
    }

    const formatDate = (date) => date.toISOString().split("T")[0];
    if (period && sDate && eDate) {
      sDate = formatDate(sDate);
      eDate = formatDate(eDate);
    }

    setFilter({
      sDate: sDate,
      eDate: eDate,
      locationid:
        selCity?.value?.Id === "all" ? undefined : selCity?.value?.Id || null,
      facilityid: selFacility?.Id || null,
      vendorid: selVendor?.Id === "all" ? undefined : selVendor?.Id || null,
      triptype: selectedTripType || "",
      type: 1,
    });
  }, [
    selectedPeriod,
    selectedPeriod1,
    selCity,
    selFacility,
    selectedTripType,
    selVendor,
  ]);
  const mapProps = {
    facilityid: filter.facilityid,
    sDate: filter.sDate,
    triptype: filter.triptype,
    type: 1,
  };
  //   const mapProps = {
  //   facilityid: 1,
  //   sDate: "2025-06-29",
  //   triptype: "P",
  //   type: 1
  // };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handlePendingDateChange = (date) => {
    setPendingDate(date);
  };

  useEffect(() => {
    if (pendingPeriod1 === "custom") return; // Don't override manual selection

    const today = new Date();
    let from = today;
    let to = today;

    if (pendingPeriod1 === "today") {
      from = to = today;
    } else if (pendingPeriod1 === "yesterday") {
      from = to = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 1
      );
    } else if (pendingPeriod1 === "last_7_days") {
      from = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 6
      );
      to = today;
    } else if (pendingPeriod1 === "last_30_days") {
      from = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 29
      );
      to = today;
    } else if (pendingPeriod1 === "last_90_days") {
      from = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 89
      );
      to = today;
    } else if (pendingPeriod1 === "last_12_months") {
      from = new Date(
        today.getFullYear() - 1,
        today.getMonth(),
        today.getDate()
      );
      to = today;
    }

    setPendingDateFrom(from);
    setPendingDateTo(to);
  }, [pendingPeriod1]);

  return (
    <div className="container-fluid p-0" style={{ background: "#f9f9f9" }}>
      {/* Header */}
      <Header pageTitle={"Dashboard"} />

      {/* Sidebar */}
      <Sidebar />

      <div className="middle">
        <div className="row mb-4">
          <div className="col-12">
            {/* <div className={`cardx mt-3 p-3 border-0 p-3 ${scrolled ? "filterFix" : ""}`}> */}
            <div
              className={`cardx mt-3 p-3 border-0 ${scrolled ? "filterFix shadow" : "hidden"
                }`}
            >
              <div className="row d-flex align-items-center">
                <div className="col-4 d-none">
                  <TabMenu
                    model={items}
                    activeIndex={activeIndex}
                    onTabChange={(e) => setActiveIndex(e.index)}
                  />
                </div>
                <div className="col-12">
                  <div className="row">
                    <div className="col-2 position-relative">
                      {/* <Dropdown
                        options={periodOptions}
                        optionLabel="label"
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.value)}
                        className="w-100"
                        placeholder="Select Period"
                      /> */}
                      <div
                        className="custom-select"
                        onClick={() => setVisiblex((prev) => !prev)}
                      >
                        📅{" "}
                        {periodOptions1.find(
                          (opt) => opt.value === selectedPeriod1
                        )?.label || "Custom Calendar"}
                      </div>
                      {/* <div className="custom-calender" style={{ display: visible ? 'none' : 'block' }}>
                        1
                      </div> */}
                      {visiblex && (
                        <div className="custom-calender" ref={calendarRef}>
                          <div className="row">
                            <div className="col-3">
                              <div className="time-filter">
                                <ul className="time-filter-list">
                                  {periodOptions1.map((option) => (
                                    <li
                                      key={option.value}
                                      className={`time-filter-item ${pendingPeriod1 === option.value
                                        ? "active"
                                        : ""
                                        }`}
                                      onClick={() =>
                                        setPendingPeriod1(option.value)
                                      }
                                    >
                                      {option.label}
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
                                  pendingDateFrom
                                    ? pendingDateFrom.toLocaleDateString(
                                      "en-GB",
                                      {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                      }
                                    )
                                    : ""
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
                                  pendingDateTo
                                    ? pendingDateTo.toLocaleDateString(
                                      "en-GB",
                                      {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                      }
                                    )
                                    : ""
                                }
                                readOnly
                              />
                              <Calendar
                                onChange={(date) => {
                                  setPendingDateTo(date);
                                  setPendingPeriod1("custom");
                                }}
                                value={pendingDateTo}
                              // activeStartDate={new Date(2025, 7, 1)} // <-- yeh August 2025 dikhata hai
                              />
                            </div>
                            <div className="col-12 mt-3 text-end">
                              <button
                                className="btn btn-secondary me-2"
                                onClick={() => setVisiblex(false)}
                              >
                                Close
                              </button>
                              <button
                                className="btn btn-primary"
                                onClick={() => {
                                  setSelectedPeriod1(pendingPeriod1);
                                  setSelectedDate(pendingDateFrom);
                                  setVisiblex(false);
                                  setFilter((prev) => ({
                                    ...prev,
                                    sDate: pendingDateFrom
                                      ? pendingDateFrom
                                        .toISOString()
                                        .split("T")[0]
                                      : null,
                                    eDate: pendingDateTo
                                      ? pendingDateTo
                                        .toISOString()
                                        .split("T")[0]
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
                      <Dropdown
                        value={selCity || cities[0] || null} // <-- yeh line change karein
                        optionLabel="name"
                        onChange={(e) => {
                          console.log("Selected city:", e.value);
                          changeCity(e); // Only call changeCity, it sets selCity
                        }}
                        options={cities}
                        placeholder="Select City"
                        className="w-100"
                      />
                    </div>
                    <div className="col">
                      <Dropdown
                        value={selFacility || 1}
                        onChange={(e) => {
                          console.log("Selected facility:", e.value);
                          setSelFacility(e.value);
                          // Do NOT call fetchCitiesByFacility here, so city selection is preserved
                          // If you need to update cities, do it based on business logic, but keep selCity unchanged
                        }}
                        options={filterFacilities}
                        optionLabel="facilityName"
                        placeholder="Select Facility"
                        className="w-100"
                      />
                    </div>

                    <div className="col-2">
                      {/* <Dropdown
                        id="tripType"
                        value={selectedTripType || "P"}
                        options={tripTypeOptions}
                        onChange={(e) => setSelectedTripType(e.value)}
                        placeholder="Select Trip Type"
                        className="w-100"
                      /> */}
                      <Dropdown
                        id="tripType"
                        value={selectedTripType}
                        options={tripTypeOptions}
                        onChange={(e) => {
                          console.log("Selected trip type:", e.value);
                          setSelectedTripType(e.value);
                        }}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select Trip Type"
                        className="w-100"
                      />
                    </div>
                    <div className="col-2">
                      <Dropdown
                        value={selVendor}
                        onChange={(e) => setSelVendor(e.value)}
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
        <div className="row">
          <div className="col-12">
            {(() => {
              switch (activeIndex) {
                case 0:
                  return (
                    <div>
                      {/* selectedPeriod */}
                      <RiStats filter={filter} />
                      {/* <VpStats filter={filter} /> */}
                      <div className="row mt-4">
                        {/* <div className="col-4 mb-3 d-none">
                          <div
                            className="cardx border-0 p-3"
                            style={{ height: "40vh", width: "100%" }}
                          >
                            <h6 className="d-flex justify-content-between">
                              Route Distribution
                              <Tooltip
                                target="#expand-route-distribution"
                                content="Expand Map"
                                position="top"
                              />
                              <h6 className="d-flex justify-content-between">
                                <span
                                  id="expand-route-distribution"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => setDialogVisible(true)}
                                >
                                  <BiExpand />
                                </span>
                              </h6>
                            </h6>
                            <hr />
                            <LeafletHeatMap filter={filter} />
                          </div>
                        </div> */}
                        {/* <div className="col-8 mb-3">
                          <RiDropSafeChart filter={filter} />
                        </div> */}
                        {/* <div className="col-4 mb-3">
                          <RiShiftEmployeeOccupancy filter={filter} />
                        </div> */}
                        <div className="col-6 mb-3">
                          <RiNormalAdhoc filter={filter} />
                        </div>
                        <div className="col-6 mb-3">
                          <RiShiftCompletionPending filter={filter} />
                        </div>
                        <div className="col-12">
                          <RiPickDrop filter={filter} />
                        </div>
                      </div>
                    </div>
                  );
                case 1:
                  return (
                    <div>
                      <div className="row">
                        <VpStats filter={filter} />
                      </div>

                      <div className="row mt-4">
                        <div className="col-4">
                          <div className="cardx border-0 p-3">
                            <h6>Trip summary</h6>
                            <hr />
                            <Image
                              src="src/assets/chart1.png"
                              alt="Image"
                              className="img-fluid"
                            />
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="cardx border-0 p-3">
                            <h6>Vehicle Distribution</h6>
                            <hr />
                            <Image
                              src="src/assets/chart1.png"
                              alt="Image"
                              className="img-fluid"
                            />
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="cardx border-0 p-3">
                            <h6>Routes vs Breakdowns vs Duty Hours</h6>
                            <hr />
                            <Image
                              src="src/assets/chart4.png"
                              alt="Image"
                              className="img-fluid"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-4">
                          <div className="cardx">
                            <div className="cardx border-0 p-3">
                              <h6>Fleet Efficiency</h6>
                              <hr />
                              <p>Data Loading...</p>
                            </div>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="cardx">
                            <div className="cardx border-0 p-3">
                              <h6>Driver Efficiency</h6>
                              <hr />
                              <p>Data Loading...</p>
                            </div>
                          </div>
                        </div>
                        <div className="col-4 mb-3">
                          <div className="cardx">
                            <div className="cardx border-0 p-3">
                              <h6>Trip Efficiency</h6>
                              <hr />
                              <p>Data Loading...</p>
                            </div>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="cardx">
                            <div className="cardx border-0 p-3">
                              <h6>Driver Fragmentation</h6>
                              <hr />
                              <p>Data Loading...</p>
                            </div>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="cardx">
                            <div className="cardx border-0 p-3">
                              <h6>Vehicle Fragmentation</h6>
                              <hr />
                              <p>Data Loading...</p>
                            </div>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="cardx">
                            <div className="cardx border-0 p-3">
                              <h6>Trip Analysis</h6>
                              <hr />
                              <p>Data Loading...</p>
                            </div>
                          </div>
                        </div>

                        <div className="col-6 mt-3">
                          <div className="cardx">
                            <div className="cardx border-0 p-3">
                              <h6>Status by Pick Summary</h6>
                              <hr />
                              <p>Data Loading...</p>
                            </div>
                          </div>
                        </div>

                        <div className="col-6 mt-3">
                          <div className="cardx">
                            <div className="cardx border-0 p-3">
                              <h6>Status by Drop Summary</h6>
                              <hr />
                              <p>Data Loading...</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                case 2:
                  return (
                    <div className="row">
                      <div className="col-12 mb-3">
                        <div className="cardx border-0 p-3">
                          <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d28069.195720471515!2d77.01584120702411!3d28.42983216765682!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d190d4d1ab7f9%3A0x9edd43ec9fba1ce9!2sAccenture%20DDC7x!5e0!3m2!1sen!2sin!4v1748521289659!5m2!1sen!2sin"
                            width="100%"
                            height="450"
                            style={{ border: 0 }} // Use an object for styles
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade" // Important for API key restrictions
                            title="Google Map" // Add a title for accessibility
                          ></iframe>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="cardNew w-100 p-2">
                          <ul className="">
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
                  );
                default:
                  return null;
              }
            })()}
          </div>
        </div>
      </div>
      {/* Move Dialog outside card/flex container for proper overlay */}
      <Dialog
        header="Route Distribution"
        visible={dialogVisible}
        style={{ width: "90vw", minHeight: "90vh" }}
        onHide={() => setDialogVisible(false)}
      >
        <div className="m-0" style={{ height: "78vh", width: "100%" }}>
          <LeafletHeatMap filter={filter} />
        </div>
      </Dialog>
    </div >
  );
};
export default Dashboard;

console.log("Available API methods:", Object.keys(driverMasterService));
