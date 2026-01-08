import React, { useState, useEffect, useRef, useMemo } from "react";
import Sidebar from "./Master/SidebarMenu";
import Header from "./Master/Header";
import Notifications from "./Master/Notifications";
import sessionManager from "../utils/SessionManager.js";
import { apiService } from "../services/api";
import { toastService } from "../services/toastService.js";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { Offcanvas } from "bootstrap";
import { ToastContainer } from "react-toastify";
// PrimeReact paginator
import { Paginator } from "primereact/paginator";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { set } from "lodash";
import TableToolbar from "./common/TableToolbar.jsx";
import Loader from "./common/Loader.jsx";
import { Calendar } from "primereact/calendar";
import CustomPaginator from "./common/CustomPaginator";
import calendarIcon from "../assets/calendar.png";
import TripTypeBadge from "./common/TripTypeBadge";
const formatDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr || timeStr === 'null' || timeStr.trim().toUpperCase() === 'N/A') {
    console.warn(`Skipping time parsing for 'N/A' or null`);
    return null;
  }
  try {
    if (!/^\d{4}$/.test(timeStr.trim())) {
      console.error(`Unrecognized time format: '${timeStr}'`);
      return null;
    }
    const formattedTime = `${timeStr.slice(0, 2)}:${timeStr.slice(2)}`;
    const combined = `${dateStr.slice(0, 10)}T${formattedTime}`;
    const parsed = new Date(combined);
    if (isNaN(parsed.getTime())) {
      console.error(`Invalid ISO format: '${combined}'`);
      return null;
    }
    return parsed;
  } catch (error) {
    console.error(`Error parsing datetime from '${dateStr}' and '${timeStr}':`, error);
    return null;
  }
};




const addDay = (dateString, days) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  date.setDate(date.getDate() + days + 1);
  return date.toISOString().split("T")[0];
};
const generateWeekDays = (fromDate) => {
  const days = [];
  // Convert fromDate string to Date object
  const startDate = new Date(fromDate);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Start directly from fromDate instead of calculating start of week
  const startOfWeek = new Date(startDate);

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startOfWeek);
    currentDate.setDate(startOfWeek.getDate() + i);

    days.push({
      day: dayNames[currentDate.getDay()],
      date: `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]}`,
      fullDate: currentDate.toISOString().split("T")[0],
    });
  }
  return days;
};



const MySchedule = () => {
  const navigate = useNavigate();
  const facID = sessionManager.getUserSession().FacilityID;
  const empid = sessionManager.getUserSession().ID;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedShiftDate, setSelectedShiftDate] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [shiftLockStatus, setShiftLockStatus] = useState({
    loginFacilityDisabled: true,
    loginTimeDisabled: false,
    loginTimeVisible: false,
    loginTimeLabel: "",
    logoutFacilityDisabled: true,
    logoutTimeDisabled: false,
    logoutTimeVisible: false,
    logoutTimeLabel: "",
    saveButtonVisible: true,
    tptForMessage: "",
    tptForType: 0,
  });
  const [processes, setProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState("");
  const [mgrscheduledata, setMgrscheduledata] = useState([]);
  const [weekDays, setWeekDays] = useState([]);
  const [loginfacility, setloginfacility] = useState([]);
  const [loginFacilities, setLoginFacilities] = useState([]); // State to hold login facilities
  const [logoutFacilities, setLogoutFacilities] = useState([]); // State to hold logout facilities
  const [selectedloginfacility, setSelectedloginfacility] = useState("");
  const [selectedlogoutfacility, setSelectedlogoutfacility] = useState("");
  const [mgrassociate, setMgrassociate] = useState([]);
  const [LoginNewShiftPickup, setLoginNewShiftPickup] = useState([]);
  const [LoginNewShiftDrop, setLoginNewShiftDrop] = useState([]);
  const [LoginWeekEndShiftPickup, setLoginWeekEndShiftPickup] = useState([]);
  const [LoginWeekEndShiftDrop, setLoginWeekEndShiftDrop] = useState([]);
  const [isEmployeeShiftOpen, setIsEmployeeShiftOpen] = useState(false); // State for offcanvas visibility
  const [employeeSchedule, setEmployeeSchedule] = useState([]); // State to hold employee schedule data
  const [availableShiftTimes, setAvailableShiftTimes] = useState([]);
  const [routeDetails, setRouteDetails] = useState([]);

  // Add a new state to store the selected time
  const [selectedShiftTime, setSelectedShiftTime] = useState("");
  //const [selectedLogoutTime, setSelectedLogoutTime] = useState("");
  //const [selectedEmployee, setSelectedEmployee] = useState(null); // State for selected employee details
  // Make sure to add this state variable at the top of your component
  const [availableLogoutShiftTimes, setAvailableLogoutShiftTimes] = useState(
    []
  );
  const [selectedLogoutShiftTime, setSelectedLogoutShiftTime] = useState("");
  // Add these state variables at the top of your component
  const [employeeTrips, setEmployeeTrips] = useState([]);
  const [isTripsModalOpen, setIsTripsModalOpen] = useState(false);
  const [selectedEmployeeForTrips, setSelectedEmployeeForTrips] =
    useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null); // State to track the selected route ID

  //const defaultWeekendDays = { sat: false, sun: false }; // Default weekend days
  const [weekendDays, setWeekendDays] = useState({
    sat: true,
    sun: true,
  });

  // Initialize lockDetails with default values
  const [lockDetails, setLockDetailsState] = useState({
    AdhocMaxDay: "",
    DayNames: "",
    DelayBuffer: "",
    DelayBufferDrop: "",
    LockHrs: "",
    Lockpickhrs: "",
    dropLockDateTime: "",
    lockDiffDays: 0,
    lockEDate: "",
    lockSDate: "",
    lockdrophrs: "",
    lockweekenddrop: "",
    lockweekendpick: "",
    lockweekenddrophrs: "",
    pickLockDateTime: "",
  });
  const addMonth = (dateString, months) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split("T")[0];
  };
  // const addMonth = (dateString, months) => {
  // if (!dateString) return "";
  // const date = new Date(dateString);
  // date.setMonth(date.getMonth() + months);
  // return date.toISOString().split("T")[0];
  // };
  const todayStr = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(todayStr);
  // const [toDate, setToDate] = useState(
  //   addDay(lockDetails?.lockSDate, lockDetails?.lockDiffDays - 2) || ""
  // );
  const [toDate, setToDate] = useState(addMonth(todayStr, 1));
  // PrimeReact pagination state for manager associates table
  const [mgrFirst, setMgrFirst] = useState(0);
  const [mgrRows, setMgrRows] = useState(50);

  const onMgrPageChange = (e) => {
    setMgrFirst(e.first);
    setMgrRows(e.rows);
  };

  // PrimeReact pagination state for schedule table
  const [schedFirst, setSchedFirst] = useState(0);
  const [schedRows, setSchedRows] = useState(50);

  const [mainFromDate, setMainFromDate] = useState(todayStr); // State for main page From Date
  // Search/filter for schedule table (connected to top TableToolbar)
  const [scheduleFilter, setScheduleFilter] = useState("");
  // Filtered schedule computed from mgrscheduledata + search text
  const filteredSchedule = useMemo(() => {
    if (!scheduleFilter || scheduleFilter.trim() === "")
      return mgrscheduledata;
    const q = scheduleFilter.toLowerCase();
    return mgrscheduledata.filter((row) => {
      // match on employee name, empCode or any SETime fields
      if ((row.EmpName || "").toString().toLowerCase().includes(q)) return true;
      if ((row.EmployeeID || "").toString().toLowerCase().includes(q)) return true;
      for (let i = 0; i < 7; i++) {
        const val = row[`SETime${i}`];
        if (val && val.toString().toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [mgrscheduledata, scheduleFilter]);

  const schedTotal = filteredSchedule.length;
  const displayedSchedule = filteredSchedule.slice(schedFirst, schedFirst + schedRows);
  const onSchedPageChange = (e) => {
    setSchedFirst(e.first);
    setSchedRows(e.rows);
  };
  const [globalFilter, setGlobalFilter] = useState("");
  //const op = useRef(null);
  //const filterButtonRef = useRef(null);
  const filteredData = useMemo(() => {
    if (!globalFilter || globalFilter.trim() === "") {
      return mgrassociate;
    }
    const searchLower = globalFilter.toLowerCase();
    return mgrassociate.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchLower)
      )
    );
  }, [mgrassociate, globalFilter]);
  const mgrTotal = filteredData.length;
  const displayedMgrAssociate = filteredData.slice(mgrFirst, mgrFirst + mgrRows);
  // RESET PAGINATION WHEN SEARCH CHANGES
  useEffect(() => {
    setMgrFirst(0);
  }, [globalFilter]);


  // Reset schedule paginator when search changes
  useEffect(() => {
    setSchedFirst(0);
  }, [scheduleFilter]);
  // Fetch data on component mount
  useEffect(() => {
    fetchMgrSchedule(mainFromDate);
    fetchScheduleDetails();
    // const fromDate = document.getElementById("fromDate").value; // Replaced by mainFromDate state
    const days = generateWeekDays(mainFromDate);
    setWeekDays(days);
    fetchLockDetails();
    fetchFacilityDetails();
    // console.log("MySchedule component mounted",empid, facID);
    // setFromDate(lockDetails?.lockSDate || "");
    // setToDate(
    //   addDay(lockDetails?.lockSDate, lockDetails?.lockDiffDays - 2) || ""
    // );
    // const offcanvasElement = document.getElementById("Employee_Shift");
    // if (offcanvasElement) {
    //   offcanvasElement.addEventListener("hidden.bs.offcanvas", resetFormValues);
    //   return () => {
    //     offcanvasElement.removeEventListener(
    //       "hidden.bs.offcanvas",
    //       resetFormValues
    //    );
    // };
  }, [lockDetails?.lockSDate, lockDetails?.lockDiffDays]);

  const handleCancelTrip = async (trip) => {
    try {
      const params = {
        routeid: trip.routeid,
        EmployeeId: trip.empCode,
        updatedby: sessionManager.getUserSession().ID,
        shiftdate: trip.shiftdate,
        triptype: trip.triptype,
        Reason: "", // You can make this dynamic if needed
      };
      // console.log("Cancel params", params);
      const response = await apiService.CancelTrip(params);

      if (response) {
        toastService.success("Trip cancelled successfully.");
        // Refresh the trips data
        fetchMgrSchedule();
        fetchScheduleDetails();
        if (selectedEmployeeForTrips) {
          fetchEmployeeTrips(selectedEmployeeForTrips);
        }
        //fetchEmployeeTrips(selectedEmployeeForTrips);
      }
    } catch (error) {
      console.error("Error cancelling trip:", error);
      toastService.error("Failed to cancel the trip: " + error.message);
    }
  };

  const fetchMgrAssociate = async () => {
    setLoading(true);
    try {
      const response = await apiService.GetMgrAssociate({
        mgrId: empid,
        ProcessId: document.getElementById("ddlProcess").value,
      });
      // console.log("Mgr Associate", response);
      setMgrassociate(response);
    } catch (error) {
      console.error("Error fetching manager associates:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleRefresh = async () => {
    setLoading(true);
    //setIsSubmitting(true);
    try {
      await fetchMgrAssociate();
      toastService.success("Table refreshed successfully");
    } catch (error) {
      toastService.error("Failed to refresh table");
      console.error("Error fetching manager associates:", error);
    } finally {
      setLoading(false);
      // setIsSubmitting(false);
    }
  }

  const fetchLockDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.GetLockDetails({
        facID: facID,
      });

      if (response && response[0]) {
        setLockDetailsState({
          AdhocMaxDay: response[0].AdhocMaxDay || "",
          DayNames: response[0].DayNames || "",
          DelayBuffer: response[0].DelayBuffer || "",
          DelayBufferDrop: response[0].DelayBufferDrop || "",
          LockHrs: response[0].LockHrs || "",
          Lockpickhrs: response[0].Lockpickhrs || "",
          dropLockDateTime: response[0].dropLockDateTime || "",
          lockDiffDays: response[0].lockDiffDays || 0,
          lockEDate: response[0].lockEDate || "",
          lockSDate: response[0].lockSDate
            ? addDay(response[0].lockSDate, 1)
            : "",
          lockdrophrs: response[0].lockdrophrs || "",
          lockweekenddrop: response[0].lockweekenddrop || "",
          lockweekendpick: response[0].lockweekendpick || "",
          lockweekenddrophrs: response[0].lockweekenddrophrs || "",
          pickLockDateTime: response[0].pickLockDateTime || "",
        });
      }
    } catch (error) {
      console.error("Error fetching lock details:", error);
    } finally {
      setLoading(false);
    }
  };

  // const fetchFacilityDetails = async () => {
  //   try {
  //     setLoading(true);

  //     let empid = 0;

  //     if (
  //       !sessionManager.isBackupManager() &&
  //       sessionManager.getUserSession().ManagerId === "0"
  //     ) {
  //       empid = empid;
  //     } else {
  //       empid = -1;
  //     }

  //     const response = await apiService.SelectFacilityByGroup({
  //       empid: empid,
  //     });

  //     // console.log("Facility Details", response);
  //     if (response) {
  //       setLoginFacilities(response); // Set login facilities
  //       setLogoutFacilities(response); // Set logout facilities
  //       setloginfacility(response);
  //       setSelectedloginfacility(response[0]?.Id || ""); // Set default value for login facility
  //       setSelectedlogoutfacility(response[0]?.Id || ""); // Set default value for logout facility
  //       // console.log("loginfacility", response);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching facility details:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };


   const fetchFacilityDetails = async () => {
    try {
      setLoading(true);
 
      let empid = 0;
 
      if (
        !sessionManager.isBackupManager() &&
        sessionManager.getUserSession().ManagerId === "0"
      ) {
        empid = sessionManager.getUserSession().ID; // Use user's ID when employee
      } else {
        empid = -1;
      }
 
      const response = await apiService.SelectFacilityByGroup({
        empid: empid,
      });
 
      console.log("Facility Details", response);
      if (response) {
        setLoginFacilities(response); // Set login facilities
        setLogoutFacilities(response); // Set logout facilities
        setloginfacility(response);
       
        // Find the facility matching the user's facility ID, similar to C# logic
        const userFacility = response.find(fac => fac.Id == facID);
        const defaultFacilityId = userFacility ? userFacility.Id : (response[0]?.Id || "");
       
        setSelectedloginfacility(defaultFacilityId); // Set default value for login facility
        setSelectedlogoutfacility(defaultFacilityId); // Set default value for logout facility
        // console.log("loginfacility", response);
      }
    } catch (error) {
      console.error("Error fetching facility details:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMgrSchedule = async (sdateOverride) => {
    try {
      //setIsSubmitting(true);
      setLoading(true);
      let mgrid = empid;
      if (document.getElementById("ddlManager").value !== "") {
        mgrid = document.getElementById("ddlManager").value;
      }
      const mgrscheduledata = await apiService.GetMgrSchedule({
        mgrid: mgrid,
        sdate: sdateOverride || mainFromDate,
      });
      setMgrscheduledata(mgrscheduledata);
    } catch (error) {
      console.error("Error fetching manager schedule:", error);
    } finally {
      setLoading(false);
      //setIsSubmitting(false);
    }
  };
  const handleRefreshSchedule = async () => {
    setLoading(true);
    try {
      await fetchMgrSchedule();
      toastService.success("Schedule table refreshed successfully");
    } catch (error) {
      toastService.error("Failed to refresh table");
      console.error("Refresh Error:", error);
    }
    finally {
      setLoading(false);
    }
  }
  const fetchScheduleDetails = async () => {
    try {
      setLoading(true);
      const params = {
        backupmgrid: empid,
      };

      const managerResponse = await apiService.GetBackupMgrId(params);

      //console.log("managerResponse",managerResponse);
      if (managerResponse) {
        setManagers(managerResponse);
      }

      const ProjectResponse = await apiService.GetSpocAssignedProcess({
        empid: empid,
        type: "M",
      });

      if (ProjectResponse) {
        setProcesses(ProjectResponse);
      }
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllShiftData = async (processId, facilityId) => {
    try {
      const [pickupWeekday, dropWeekday, pickupWeekend, dropWeekend] =
        await Promise.all([
          apiService.GetShiftsbyDays({
            facilityid: facilityId,
            type: "P",
            weekday: 0,
            ProcessId: processId,
          }),
          apiService.GetShiftsbyDays({
            facilityid: facilityId,
            type: "D",
            weekday: 0,
            ProcessId: processId,
          }),
          apiService.GetShiftsbyDays({
            facilityid: facilityId,
            type: "P",
            weekday: 1,
            ProcessId: processId,
          }),
          apiService.GetShiftsbyDays({
            facilityid: facilityId,
            type: "D",
            weekday: 1,
            ProcessId: processId,
          }),
        ]);

      setLoginNewShiftPickup(pickupWeekday);
      setLoginNewShiftDrop(dropWeekday);
      setLoginWeekEndShiftPickup(pickupWeekend);
      setLoginWeekEndShiftDrop(dropWeekend);
    } catch (error) {
      console.error("Error fetching shift data:", error);
    }
  };

  const handleProcessChange = async (e) => {
    const newProcessId = e.target.value;
    setSelectedProcess(newProcessId);

    const facilityId = document.getElementById("ddlNewLoginFacility").value;

    await Promise.all([
      fetchAllShiftData(newProcessId, facilityId),
      fetchMgrAssociate(),
    ]);
  };

  const handleManagerChange = (e) => {
    setSelectedManager(e.target.value);
    fetchMgrSchedule();
  };

  // Add pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Show 7 employees per page

  // Calculate pagination indexes
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = mgrscheduledata.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(mgrscheduledata.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Add this function to handle date changes
  const handleFromDateChange = (e) => {
    //   setFromDate(e.target.value);
    // setToDate(addMonth(newFromDate, 1)); // 1 month आगे set करें
    const newFromDate = e.target.value;
    setFromDate(newFromDate);
    setToDate(addMonth(newFromDate, 1)); // 
    // You can add validation or additional logic here if needed
  };

  const onchangedFromDate = (newDate) => {
    setMainFromDate(newDate);
    fetchMgrSchedule(newDate);
    const days = generateWeekDays(newDate);
    setWeekDays(days);
  };

  // Add these handler functions
  const handleToDateChange = (e) => {
    // Add any validation logic here if needed
    setToDate(e.target.value);

    // console.log("To date changed:", e.target.value);
  };


  const handleLoginFacilityChange = (e) => {
    const facilityId = e.target.value;
    const processId = selectedProcess;
    setSelectedloginfacility(facilityId);
    fetchAllShiftData(processId, facilityId);
  };



  const handleLogoutFacilityChange = (e) => {
    const facilityId = e.target.value;
    const processId = selectedProcess;
    setSelectedlogoutfacility(facilityId);
    fetchAllShiftData(processId, facilityId);
  };

  const handleUpdateEmpSchedule = async () => {
    setLoading(true); // Loader ON
    try {
      // Employee schedule se values le lo
      const empSchedule = employeeSchedule && employeeSchedule[0];
      if (!empSchedule) {
        toastService.error("No employee schedule found!");
        setLoading(false); // Loader OFF
        return;
      }

      // Ensure time is in "HHmm" format (only digits, 4 chars)
      const formatTime = (time) => {
        if (!time) return "";
        // If already 4 digits, return as is
        if (/^\d{4}$/.test(time)) return time;
        // If in "HH:mm" format, remove colon
        if (/^\d{2}:\d{2}$/.test(time)) return time.replace(":", "");
        // If in "YYYY-MM-DD HH:mm" or "MM/DD/YYYY HH:mm", extract only HH:mm
        const match = time.match(/(\d{2}):(\d{2})$/);
        if (match) return match[1] + match[2];
        // If in "HHmm" somewhere in string, extract it
        const digits = time.match(/\d{4}/);
        if (digits) return digits[0];
        return "";
      };

      const params = {
        empID: selectedEmployeeId,
        StartDate: selectedShiftDate,
        StartTime: formatTime(selectedShiftTime), // Fix here
        EndTime: formatTime(selectedLogoutShiftTime), // Fix here
        pickFacilityID: selectedloginfacility,
        dropFacilityID: selectedlogoutfacility,
        userName: sessionManager.getUserSession().ID,
        pickadflag: "1",
        dropadflag: "1",
        remark: "",
      };

      let response = await apiService.UpdateEmpSchedule(params);
      // console.log("Update response:", response);

      if (typeof response === "string") {
        try {
          response = JSON.parse(response);
        } catch (e) {
          toastService.error("Invalid response from server.");
          setLoading(false); // Loader OFF
          return;
        }
      }
      if (response && !Array.isArray(response)) {
        response = [response];
      }

      if (response) {
        toastService.success("Schedule updated successfully!");
        // Properly close the Bootstrap Offcanvas using JS API

        setIsEmployeeShiftOpen(false);
        // ---- Force table to reload from today's date ----
        const today = new Date().toISOString().split("T")[0];
        const fromDateInput = document.getElementById("fromDate");
        if (fromDateInput) {
          fromDateInput.value = today;
        }
        setFromDate(today); // update state if needed
        const days = generateWeekDays(today);
        setWeekDays(days);

        await fetchMgrSchedule();
      } else {
        toastService.error(response[0]?.res2 || "Update failed!");
      }
    } catch (error) {
      toastService.error("Error updating schedule: " + error);
    } finally {
      setLoading(false); // Loader OFF
    }
  };
  const handleEmployeeShiftClick = async (employee, day) => {
    try {
      // 1. Get sel
      setSelectedEmployeeId(employee.empCode);
      const selectedDate = weekDays[day]?.fullDate;
      setSelectedShiftDate(selectedDate); // <-- Add this
      const fromDateInput = document.getElementById("fromDate");
      if (fromDateInput && selectedDate) {
        fromDateInput.value = selectedDate;
      }

      // 2. Get shift times
      const seTimeData = employee[`SETime${day}`];
      const [timeInfo] = seTimeData.split("!");
      const [loginTime, logoutTime] = timeInfo.split("<BR>").map((time) => {
        const match = time.match(/\d{4}$/);
        return match ? match[0] : time.trim();
      });
      // console.log("Clicked Employee:", employee.EmployeeID);
      // console.log("Day Index:", day);
      // console.log("Raw SETime Data:", seTimeData);
      // console.log("Extracted Login Time:", loginTime);
      // console.log("Extracted Logout Time:", logoutTime);
      // 3. Get schedule and lock details
      // 3. Get schedule and lock details
      let scheduleData = await fetchEmployeeSchedule(employee.EmployeeID, selectedDate);
      let schedule = (scheduleData && scheduleData[0]) || {};
      const lockPickTime = new Date(lockDetails.pickLockDateTime);
      const lockDropTime = new Date(lockDetails.dropLockDateTime);

      // 4. Compose DateTime for comparison

      const sanitizeTime = (time) => {
        const match = time?.match(/\d{4}/);
        return match ? match[0] : null;
      };

      const loginTimeSanitized = sanitizeTime(loginTime);
      const logoutTimeSanitized = sanitizeTime(logoutTime);

      const loginDateTime = formatDateTime(schedule.startDate, loginTimeSanitized);
      const logoutDateTime = formatDateTime(schedule.endDate, logoutTimeSanitized);


      // ✅ Now safe to get day names
      const isWeekend = (dayName) => ["Saturday", "Sunday"].includes(dayName);


      const loginDayName = loginDateTime ? loginDateTime.toLocaleString("en-US", { weekday: "long" }) : "N/A";
      const logoutDayName = logoutDateTime ? logoutDateTime.toLocaleString("en-US", { weekday: "long" }) : "N/A";



      // ✅ Safe to adjust lock time if weekend
      if (isWeekend(loginDayName) && lockDetails.lockweekendpick) {
        lockPickTime.setMinutes(lockPickTime.getMinutes() + Number(lockDetails.lockweekendpick));
      }
      if (isWeekend(logoutDayName) && lockDetails.lockweekenddrop) {
        lockDropTime.setMinutes(lockDropTime.getMinutes() + Number(lockDetails.lockweekenddrop));
      }
      // // 5. Lock logic (C# mapping)
      let loginFacilityDisabled = true;
      let logoutFacilityDisabled = true;
      let loginTimeVisible = true;
      let loginTimeLabel = "";
      let loginTimeDisabled = false;
      let logoutTimeVisible = true;
      let logoutTimeLabel = "";
      let logoutTimeDisabled = false;
      let saveButtonVisible = true;
      let tptForMessage = "";
      let tptForType = 0;

      // console.log("loginDateTime: ", loginDateTime);
      // // console.log("lockPickTime: ", lockPickTime);
      // console.log("loginTime: ", loginTime);
      // // console.log(typeof loginTime);
      // console.log("logoutDateTime: ", logoutDateTime);
      // // console.log("lockDropTime: ", lockDropTime);
      // console.log("logoutTime: ", logoutTime);
      // console.log(typeof logoutTime);
      // if (loginDateTime <= lockPickTime && loginTime) {
      //   loginTimeVisible = false;
      //   loginTimeLabel = loginTime === "" ? "Locked" : loginTime;
      //   loginTimeDisabled = true;
      // }
      // else {
      //   loginTimeVisible = true;
      //   loginTimeDisabled = false;
      // }

      // if (logoutDateTime <= lockDropTime && logoutTime) {
      //   logoutTimeVisible = false;
      //   logoutTimeLabel = logoutTime === "" ? "Locked" : logoutTime;
      //   logoutTimeDisabled = true;
      //   saveButtonVisible = false;
      // }
      // else {
      //   logoutTimeVisible = true;
      //   logoutTimeDisabled = false;
      //   saveButtonVisible = true;
      // }
      // Shift logic (with time check)
      const todayStr = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

      if (selectedDate < todayStr) {
        // ✅ Backdated: force locked
        loginTimeVisible = false;
        loginTimeLabel = loginTime === "" ? "Locked" : loginTime;
        loginTimeDisabled = true;

        logoutTimeVisible = false;
        logoutTimeLabel = logoutTime === "" ? "Locked" : logoutTime;
        logoutTimeDisabled = true;

        saveButtonVisible = false;
      } else {
        // ✅ Today or future: apply C#-style lock logic

        if (loginTime && loginDateTime && loginDateTime <= lockPickTime) {
          loginTimeVisible = false;
          loginTimeLabel = loginTime === "" ? "Locked" : loginTime;
          loginTimeDisabled = true;
        } else {
          loginTimeVisible = true;
          loginTimeLabel = "";
          loginTimeDisabled = false;
        }

        if (logoutTime && logoutDateTime && logoutDateTime <= lockDropTime) {
          logoutTimeVisible = false;
          logoutTimeLabel = logoutTime === "" ? "Locked" : logoutTime;
          logoutTimeDisabled = true;
          saveButtonVisible = false;
        } else {
          logoutTimeVisible = true;
          logoutTimeLabel = "";
          logoutTimeDisabled = false;
          saveButtonVisible = true;
        }
      }
      if (schedule.TPTFor === 1) {
        tptForType = 1;
        tptForMessage = "You are not allowed to update drop shift.";
        logoutTimeVisible = false;
        logoutTimeDisabled = true;
        loginFacilityDisabled = false;
        loginTimeDisabled = false;
      } else if (schedule.TPTFor === 2) {
        tptForType = 2;
        tptForMessage = "You are not allowed to update pickup shift.";
        loginTimeVisible = false;
        loginTimeDisabled = true;
        logoutFacilityDisabled = false;
        logoutTimeDisabled = false;
      } else {
        tptForType = 0;
        tptForMessage = "";
        loginFacilityDisabled = false;
        loginTimeDisabled = false;
        logoutFacilityDisabled = false;
        logoutTimeDisabled = false;
      }

      setShiftLockStatus({
        loginFacilityDisabled,
        loginTimeVisible,
        loginTimeLabel,
        loginTimeDisabled,
        logoutFacilityDisabled,
        logoutTimeVisible,
        logoutTimeLabel,
        logoutTimeDisabled,
        saveButtonVisible,
        tptForMessage,
        tptForType,
      });

      // 8. Set facility dropdowns (matches: ddlInFacility.SelectedIndex, ddlOutFacility.SelectedIndex)
      let loginFacilityId =
        schedule.pickFacilityID || employee.pickFacilityID || "";
      let logoutFacilityId =
        schedule.dropFacilityID || employee.dropFacilityID || "";

      // If not found, try to extract from SETime data
      if ((!loginFacilityId || !logoutFacilityId) && seTimeData.includes("!")) {
        const facilityInfo = seTimeData.split("!")[1];
        if (facilityInfo) {
          const facilityParts = facilityInfo.split("|");
          if (facilityParts.length >= 2) {
            loginFacilityId = facilityParts[0] || loginFacilityId;
            logoutFacilityId = facilityParts[1] || logoutFacilityId;
          }
        }
      }

      setSelectedloginfacility(loginFacilityId);
      setSelectedlogoutfacility(logoutFacilityId);

      // 9. Open the offcanvas/modal
      setIsEmployeeShiftOpen(true);

      // 10. Set the login/logout time values
      setSelectedShiftTime(loginTime);
      setSelectedLogoutShiftTime(logoutTime);

      // 11. Fetch available shift times for dropdowns
      if (loginFacilityId) {
        await fetchPickShiftTimes(employee.EmployeeID, loginFacilityId, selectedDate);
      }
      if (logoutFacilityId) {
        await fetchDropShiftTimes(employee.EmployeeID, logoutFacilityId, selectedDate);
      }

      // 12. Set dropdown values after a short delay (to ensure options are loaded)
      setTimeout(() => {
        const loginDropdown = document.getElementById("loginShiftDropdown");
        if (loginDropdown) {
          const existingOptions = Array.from(loginDropdown.options);
          const matchingOption = existingOptions.find((opt) =>
            opt.text.includes(loginTime)
          );
          if (matchingOption) {
            loginDropdown.value = matchingOption.value;
          } else {
            setSelectedShiftTime(loginTime);
          }
        }
        const logoutDropdown = document.getElementById("logoutShiftDropdown");
        if (logoutDropdown) {
          const existingOptions = Array.from(logoutDropdown.options);
          const matchingOption = existingOptions.find((opt) =>
            opt.text.includes(logoutTime)
          );
          if (matchingOption) {
            logoutDropdown.value = matchingOption.value;
          } else {
            setSelectedLogoutShiftTime(logoutTime);
          }
        }
      }, 300);

      // 13. Show the offcanvas if not already visible
      const offcanvasElement = document.getElementById("Employee_Shift");
      if (offcanvasElement && !offcanvasElement.classList.contains("show")) {
        const offcanvasInstance = new window.bootstrap.Offcanvas(
          offcanvasElement
        );
        offcanvasInstance.show();
      }
    } catch (error) {
      console.error("Error handling employee shift click:", error);
    }
  };
  // const handleEmployeeShiftClick = async (employee, day) => {
  //   try {
  //     // Get the selected date from weekDays array using the day index
  //     const selectedDate = weekDays[day]?.fullDate;

  //     // Set the fromDate input value to the selected date
  //     const fromDateInput = document.getElementById("fromDate");
  //     if (fromDateInput && selectedDate) {
  //       fromDateInput.value = selectedDate;
  //     }
  //     const seTimeData = employee[`SETime${day}`];
  //     const [timeInfo] = seTimeData.split("!");
  //     const [loginTime, logoutTime] = timeInfo.split("<BR>").map((time) => {
  //       const match = time.match(/\d{4}$/);
  //       return match ? match[0] : time.trim();
  //     });
  //     console.log("Parsed times:", { loginTime, logoutTime });
  //     // Extract exactly the same values that are displayed in the table cell
  //     // const loginTimeDisplay = employee[`SETime${day}`]
  //     //   .split("!")[0]
  //     //   .split("<BR>")[0].trim();
  //     // const logoutTimeDisplay = employee[`SETime${day}`]
  //     //   .split("!")[0]
  //     //   .split("<BR>")[1].trim();

  //     // console.log("Using exact displayed values:", {
  //     //   loginTimeDisplay,
  //     //   logoutTimeDisplay,
  //     // });
  //     console.log(`SETime for day ${day}:`, employee[`SETime${day}`]);
  //     const schedule = (employeeSchedule && employeeSchedule[0]) || {};
  //     const lockPickTime = new Date(lockDetails.pickLockDateTime);
  //     const lockDropTime = new Date(lockDetails.dropLockDateTime);

  //     const loginDateTime = new Date(
  //       `${schedule.startDate}T${(loginTime || "00:00").replace(
  //         /(\d{2})(\d{2})/,
  //         "$1:$2"
  //       )}`
  //     );
  //     const logoutDateTime = new Date(
  //       `${schedule.endDate}T${(logoutTime || "00:00").replace(
  //         /(\d{2})(\d{2})/,
  //         "$1:$2"
  //       )}`
  //     );

  //     // --- LOCK LOGIC START ---
  //     // Always disable facility dropdowns as per C# logic
  //     let loginFacilityDisabled = true;
  //     let logoutFacilityDisabled = true;

  //     // Default: show and enable both time dropdowns
  //     let loginTimeVisible = true;
  //     let loginTimeLabel = "";
  //     let loginTimeDisabled = false;
  //     let logoutTimeVisible = true;
  //     let logoutTimeLabel = "";
  //     let logoutTimeDisabled = false;
  //     let saveButtonVisible = true;
  //     let tptForMessage = "";
  //     let tptForType = 0;

  //     // Lock logic for login
  //     if (loginDateTime <= lockPickTime && loginTime) {
  //       loginTimeVisible = false;
  //       loginTimeLabel = loginTime === "" ? "Locked" : loginTime;
  //       loginTimeDisabled = true;
  //     } else {
  //       loginTimeVisible = true;
  //       loginTimeDisabled = false;
  //     }

  //     // Lock logic for logout
  //     if (logoutDateTime <= lockDropTime && logoutTime) {
  //       logoutTimeVisible = false;
  //       logoutTimeLabel = logoutTime === "" ? "Locked" : logoutTime;
  //       logoutTimeDisabled = true;
  //       saveButtonVisible = false;
  //     } else {
  //       logoutTimeVisible = true;
  //       logoutTimeDisabled = false;
  //       saveButtonVisible = true;
  //     }

  //     // TPTFor logic (overrides above)
  //     if (schedule.TPTFor === 1) {
  //       tptForType = 1;
  //       tptForMessage = "You are not allowed to update drop shift.";
  //       logoutTimeVisible = false;
  //       logoutTimeDisabled = true;
  //     } else if (schedule.TPTFor === 2) {
  //       tptForType = 2;
  //       tptForMessage = "You are not allowed to update pickup shift.";
  //       loginTimeVisible = false;
  //       loginTimeDisabled = true;
  //     } else {
  //       tptForType = 0;
  //       tptForMessage = "";
  //     }

  //     setShiftLockStatus({
  //       loginFacilityDisabled,
  //       loginTimeVisible,
  //       loginTimeLabel,
  //       loginTimeDisabled,
  //       logoutFacilityDisabled,
  //       logoutTimeVisible,
  //       logoutTimeLabel,
  //       logoutTimeDisabled,
  //       saveButtonVisible,
  //       tptForMessage,
  //       tptForType,
  //     });
  //     // --- LOCK LOGIC END ---

  //     // Check if the employee has facility information
  //     let loginFacilityId = null;
  //     let logoutFacilityId = null;

  //     // Try to extract facility information from the employee object
  //     if (employee.pickFacilityID) {
  //       loginFacilityId = employee.pickFacilityID;
  //     }
  //     if (employee.dropFacilityID) {
  //       logoutFacilityId = employee.dropFacilityID;
  //     }

  //     // If we don't have facility IDs directly, try to extract from SETime data
  //     if (!loginFacilityId || !logoutFacilityId) {
  //       const fullTimeData = employee[`SETime${day}`].split("!");
  //       if (fullTimeData.length > 1) {
  //         const facilityInfo = fullTimeData[1];
  //         console.log("Extracted facility info:", facilityInfo);
  //         const facilityParts = facilityInfo.split("|");
  //         if (facilityParts.length >= 2) {
  //           loginFacilityId = facilityParts[0] || loginFacilityId;
  //           logoutFacilityId = facilityParts[1] || logoutFacilityId;
  //         }
  //       }
  //     }

  //     // Fetch employee schedule data to get facility information if not available
  //     if (!loginFacilityId || !logoutFacilityId) {
  //       const scheduleData = await fetchEmployeeSchedule(employee.EmployeeID);
  //       if (scheduleData && scheduleData.length > 0) {
  //         loginFacilityId = scheduleData[0].pickFacilityID || loginFacilityId;
  //         logoutFacilityId = scheduleData[0].dropFacilityID || logoutFacilityId;
  //       }
  //     }

  //     console.log("Facility IDs:", { loginFacilityId, logoutFacilityId });

  //     // Set the facility values if we have them
  //     if (loginFacilityId) {
  //       setSelectedloginfacility(loginFacilityId);
  //     }
  //     if (logoutFacilityId) {
  //       setSelectedlogoutfacility(logoutFacilityId);
  //     }

  //     // Open the offcanvas
  //     setIsEmployeeShiftOpen(true);

  //     // Set the login time value
  //     setSelectedShiftTime(loginTime);
  //     setSelectedLogoutShiftTime(logoutTime);

  //     if (loginFacilityId) {
  //       await fetchPickShiftTimes(employee.EmployeeID, loginFacilityId);
  //     }

  //     if (logoutFacilityId) {
  //       await fetchDropShiftTimes(employee.EmployeeID, logoutFacilityId);
  //     }
  //     // After a short delay to ensure the modal is ready
  //     setTimeout(() => {
  //       // Handle login time dropdown
  //       const loginDropdown = document.getElementById("loginShiftDropdown");
  //       if (loginDropdown) {
  //         const existingOptions = Array.from(loginDropdown.options);
  //         const matchingOption = existingOptions.find((opt) =>
  //           opt.text.includes(loginTime)
  //         );

  //         if (matchingOption) {
  //           // If time exists in API data, select it
  //           loginDropdown.value = matchingOption.value;
  //         } else {
  //           // If time doesn't exist in API data, just show the time
  //           setSelectedShiftTime(loginTime);
  //         }
  //       }

  //       // Handle logout time dropdown
  //       const logoutDropdown = document.getElementById("logoutShiftDropdown");
  //       if (logoutDropdown) {
  //         const existingOptions = Array.from(logoutDropdown.options);
  //         const matchingOption = existingOptions.find((opt) =>
  //           opt.text.includes(logoutTime)
  //         );

  //         if (matchingOption) {
  //           // If time exists in API data, select it
  //           logoutDropdown.value = matchingOption.value;
  //         } else {
  //           // If time doesn't exist in API data, just show the time
  //           setSelectedLogoutShiftTime(logoutTime);
  //         }
  //       }

  //       // Highlight the selected facility options in the dropdowns
  //       if (loginFacilityId) {
  //         const loginFacilityDropdown = document.querySelector(
  //           'select[value="' + selectedloginfacility + '"]'
  //         );
  //         if (loginFacilityDropdown) {
  //           loginFacilityDropdown.value = loginFacilityId;
  //         }
  //       }

  //       if (logoutFacilityId) {
  //         const logoutFacilityDropdown = document.querySelector(
  //           'select[value="' + selectedlogoutfacility + '"]'
  //         );
  //         if (logoutFacilityDropdown) {
  //           logoutFacilityDropdown.value = logoutFacilityId;
  //         }
  //       }
  //     }, 300);

  //     // Make sure the offcanvas is fully visible
  //     const offcanvasElement = document.getElementById("Employee_Shift");
  //     if (offcanvasElement && !offcanvasElement.classList.contains("show")) {
  //       const offcanvasInstance = new bootstrap.Offcanvas(offcanvasElement);
  //       offcanvasInstance.show();
  //     }
  //   } catch (error) {
  //     console.error("Error handling employee shift click:", error);
  //   }
  // };
  const fetchEmployeeSchedule = async (employeeId, shiftDate = null) => {
    try {
      const fromDate = shiftDate || mainFromDate;

      // Call the API service
      const response = await apiService.GetOneEmployeeSchedule({
        empid: employeeId,
        sdate: fromDate,
      });

      // console.log("Fetched Employee Schedule Response:", response);

      // Check if response exists and parse it if needed
      let scheduleData = response;

      // If response is a string (JSON), parse it
      if (typeof response === "string") {
        try {
          scheduleData = JSON.parse(response);
        } catch (e) {
          console.error("Error parsing response:", e);
        }
      }

      // Ensure we have an array to work with
      if (!Array.isArray(scheduleData)) {
        scheduleData = scheduleData ? [scheduleData] : [];
      }

      if (scheduleData.length > 0) {
        // Map the response data to match the exact API structure
        const formattedSchedule = scheduleData.map((schedule) => ({
          employeeID: schedule.employeeID || "",
          empCode: schedule.empCode || "",
          empName: schedule.empName || "",
          startDate: schedule.startDate || "",
          startTime: schedule.startTime || "",
          pickFacilityID: schedule.pickFacilityID || 0,
          endDate: schedule.endDate || "",
          endTime: schedule.endTime || "",
          dropFacilityID: schedule.dropFacilityID || 0,
          dropadflag: schedule.dropadflag || 0,
          pickadflag: schedule.pickadflag || 0,
          lastUpdatedBy: schedule.lastUpdatedBy,
          lastUpdatedAt: schedule.lastUpdatedAt,
          LastUpdate: schedule.LastUpdate,
          TPTFor: schedule.TPTFor || 0,
          Gender: schedule.Gender || "",
        }));

        setEmployeeSchedule(formattedSchedule);
        setSelectedEmployeeId(formattedSchedule[0].empCode);

        // Log the formatted data
        // console.log("Formatted Employee Schedule:", formattedSchedule);

        // Return the formatted data for immediate use if needed
        return formattedSchedule;
      } else {
        setEmployeeSchedule([]);
        // console.log("No schedule data found");
        return [];
      }
    } catch (error) {
      console.error("Error fetching employee schedule:", error);
      setEmployeeSchedule([]);
      return [];
    }
  };
  // ... existing code ...
  const handleLoginFacilityChangeInModal = async (e) => {
    const newFacilityId = e.target.value;
    setSelectedloginfacility(newFacilityId);

    // If we have an employee schedule, fetch the shift times for the selected employee with the new facility
    if (employeeSchedule && employeeSchedule.length > 0) {
      await fetchPickShiftTimes(employeeSchedule[0].employeeID, null, selectedShiftDate);
    }
  };
  // ... existing code ...
  const fetchPickShiftTimes = async (employeeId, facilityId = null, shiftDate = null) => {
    try {
      const fromDate = shiftDate || mainFromDate;
      // Get the pickFacilityID from the employee schedule if available
      const pickFacilityID =
        facilityId ||
        (employeeSchedule && employeeSchedule.length > 0
          ? employeeSchedule[0].pickFacilityID
          : selectedloginfacility);

      const response = await apiService.GetPickShiftTime({
        facilityid: pickFacilityID,
        sdate: fromDate,
        empid: employeeId,
        processid: "0", // Using "0" as the default process ID
      });

      // console.log("Available Shift Times`:", response);

      // Parse the JSON string if response is a string
      let parsedResponse = response;
      if (typeof response === "string") {
        try {
          parsedResponse = JSON.parse(response);
        } catch (e) {
          console.error("Error parsing shift times JSON:", e);
          parsedResponse = [];
        }
      }

      // Ensure we have an array to work with
      const shiftTimesArray = Array.isArray(parsedResponse)
        ? parsedResponse
        : [];
      setAvailableShiftTimes(shiftTimesArray);

      return shiftTimesArray;
    } catch (error) {
      console.error("Error fetching shift times:", error);
      setAvailableShiftTimes([]);
      return [];
    }
  };
  // Add a new function to fetch logout shift times
  const fetchDropShiftTimes = async (employeeId, facilityId = null, shiftDate = null) => {
    try {
      const fromDate = shiftDate || mainFromDate;
      // Use the provided facilityId or fall back to the selected one
      const dropFacilityID =
        facilityId ||
        (employeeSchedule && employeeSchedule.length > 0
          ? employeeSchedule[0].dropFacilityID
          : selectedlogoutfacility);

      // Get the process ID from the employee schedule if available
      const processId =
        employeeSchedule &&
          employeeSchedule.length > 0 &&
          employeeSchedule[0].processId
          ? employeeSchedule[0].processId
          : selectedProcess || "0";

      const response = await apiService.GetDropShiftTime({
        facilityid: dropFacilityID,
        sdate: fromDate,
        callfrom: "A", // or whatever value is appropriate for your API
        empid: employeeId,
        processid: processId,
      });

      // console.log("Available Logout Shift Times:", response);

      // Parse the JSON string if response is a string
      let parsedResponse = response;
      if (typeof response === "string") {
        try {
          parsedResponse = JSON.parse(response);
        } catch (e) {
          console.error("Error parsing logout shift times JSON:", e);
          parsedResponse = [];
        }
      }

      // Ensure we have an array to work with
      const shiftTimesArray = Array.isArray(parsedResponse)
        ? parsedResponse
        : [];

      // Store the logout shift times in state
      setAvailableLogoutShiftTimes(shiftTimesArray);
      return shiftTimesArray;
    } catch (error) {
      console.error("Error fetching logout shift times:", error);
      setAvailableLogoutShiftTimes([]);
      return [];
    }
  };
  // Update the handleLogoutFacilityChangeInModal function to fetch logout shift times
  const handleLogoutFacilityChangeInModal = async (e) => {
    const newFacilityId = e.target.value;
    setSelectedlogoutfacility(newFacilityId);

    // If we have an employee schedule, fetch the logout shift times for the selected employee with the new facility
    if (employeeSchedule && employeeSchedule.length > 0) {
      await fetchDropShiftTimes(employeeSchedule[0].employeeID, newFacilityId, selectedShiftDate);
    }
  };
  // Add this function to fetch employee trips
  const fetchEmployeeTrips = async (employeeId, startDate) => {
    try {
      // Format the date as needed by the API (YYYY-MM-DD)
      let formattedDate = startDate;
      if (
        startDate &&
        typeof startDate === "string" &&
        !startDate.includes("-")
      ) {
        // If date is not in YYYY-MM-DD format, convert it
        const dateParts = startDate.split("/");
        if (dateParts.length === 3) {
          formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        }
      }

      // console.log(
      //   "Fetching trips for employee:",
      //   employeeId,
      //   "date:",
      //   formattedDate
      // );

      const response = await apiService.GetMyTrips({
        empid: employeeId,
        sDate: formattedDate,
        eDate: formattedDate, // Using same date for start and end to get trips for a specific day
      });

      // console.log("Employee Trips API Response:", response);

      // Parse the response if it's a string
      let tripsData = response;
      if (typeof response === "string") {
        try {
          tripsData = JSON.parse(response);
        } catch (e) {
          console.error("Error parsing trips data:", e);
          tripsData = [];
        }
      }

      // Ensure we have an array
      const tripsArray = Array.isArray(tripsData) ? tripsData : [];

      // Update state with the trips data
      setEmployeeTrips(tripsArray);

      return tripsArray;
    } catch (error) {
      console.error("Error fetching employee trips:", error);
      setEmployeeTrips([]);
      return [];
    }
  };
  // Add a function to handle trip icon click
  const handleTripIconClick = async (employee, day) => {
    try {
      // Get the date for the selected day from weekDays array
      const selectedDate = weekDays[day]?.fullDate;
      // console.log("Selected date for trips:", selectedDate);

      // Set the selected employee
      setSelectedEmployeeForTrips({
        id: employee.EmployeeID,
        name: employee.EmpName,
        code: employee.EmpCode || "",
        date: selectedDate,
      });

      // Fetch trips for the selected employee and date
      await fetchEmployeeTrips(employee.EmployeeID, selectedDate);

      // Open the trips modal
      setIsTripsModalOpen(true);

      // Ensure the modal is shown
      const tripsModal = document.getElementById("trips");
      if (tripsModal && !tripsModal.classList.contains("show")) {
        const bsModal = new bootstrap.Offcanvas(tripsModal);
        bsModal.show();
      }
    } catch (error) {
      console.error("Error handling trip icon click:", error);
    }
  };
  const fetchRoutesDetails = async (routeId) => {
    //setLoading(true);
    setError(null);

    const params = {
      empid: 0, // Static empid as per your requirement
      sDate: mainFromDate, // Current date in YYYY-MM-DD format
      triptype: "", // Empty string as per your requirement
      routeid: routeId, // Dynamic routeid based on user selection
    };
    console.log("Fetching route details with params:", params); // Log parameters

    try {
      let data = await apiService.GetMyRoutesDetails(params);
      data = JSON.parse(data);
      // console.log("Fetched GetMyRoutesDetails :", data);
      // Check if the response contains the expected data
      if (data && Array.isArray(data)) {
        // console.log("this is data", data);
        setRouteDetails(data); // Set the state with the correct property
      } else {
        setRouteDetails([]); // Set to empty array if no details found
      }
    } catch (err) {
      setError(err);
      console.error("Error fetching route details:", err);
    } finally {
      setLoading(false);
    }
  };
  // const resetFormValues = () => {
  //   // Reset process name to first option
  //   const processDropdown = document.getElementById("ddlProcess");
  //   if (processDropdown) {
  //     processDropdown.value = processes[0]?.ProcessId || "";
  //     setSelectedProcess(processes[0]?.ProcessId || "");
  //   }

  //   // Reset dates to default
  //   const fromDateInput = document.getElementById("fromDate");
  //   const toDateInput = document.getElementById("toDate");
  //   if (fromDateInput && toDateInput) {
  //     fromDateInput.value =
  //       lockDetails.lockSDate || new Date().toISOString().split("T")[0];
  //     toDateInput.value =
  //       addDay(lockDetails.lockSDate, lockDetails.lockDiffDays - 2) ||
  //       new Date().toISOString().split("T")[0];
  //   }

  //   // Reset weekly off to default
  //   setWeekendDays({
  //     sat: true,
  //     sun: true,
  //   });

  //   // Reset login and logout shifts to first options
  //   const loginShiftDropdown = document.getElementById("ddlNewLoginShift");
  //   const logoutShiftDropdown = document.getElementById("ddlNewLogoutShift");
  //   if (loginShiftDropdown && loginShiftDropdown.options.length > 0) {
  //     loginShiftDropdown.value = loginShiftDropdown.options[0].value;
  //     setSelectedShiftTime(loginShiftDropdown.options[0].value);
  //   }
  //   if (logoutShiftDropdown && logoutShiftDropdown.options.length > 0) {
  //     logoutShiftDropdown.value = logoutShiftDropdown.options[0].value;
  //     setSelectedLogoutShiftTime(logoutShiftDropdown.options[0].value);
  //   }
  // };
  const resetFormValues = () => {
    // Reset process dropdown and state
    const processDropdown = document.getElementById("ddlProcess");
    if (processDropdown) {
      processDropdown.value = processes[0]?.ProcessId || "";
      setSelectedProcess(processes[0]?.ProcessId || "");
    }

    // Reset date states and inputs
    // const defaultFromDate =
    //   lockDetails.lockSDate || new Date().toISOString().split("T")[0];
    // const defaultToDate =
    //   addDay(lockDetails.lockSDate, lockDetails.lockDiffDays - 2) ||
    //   new Date().toISOString().split("T")[0];
    // setFromDate(defaultFromDate);
    // setToDate(defaultToDate);

    // const fromDateInput = document.getElementById("txtNewfromDate");
    // const toDateInput = document.getElementById("txtNewtoDate");
    // if (fromDateInput) fromDateInput.value = defaultFromDate;
    // if (toDateInput) toDateInput.value = defaultToDate;
    // const defaultFromDate = new Date().toISOString().split("T")[0];
    // const defaultToDate = addMonth(defaultFromDate, 1);

    // setFromDate(defaultFromDate);
    // setToDate(defaultToDate);

    // const fromDateInput = document.getElementById("txtNewfromDate");
    // const toDateInput = document.getElementById("txtNewtoDate");
    // if (fromDateInput) fromDateInput.value = defaultFromDate;
    // if (toDateInput) toDateInput.value = defaultToDate;
    const defaultFromDate = new Date().toISOString().split("T")[0];
    const defaultToDate = addMonth(defaultFromDate, 1);

    setFromDate(defaultFromDate);
    setToDate(defaultToDate);

    const fromDateInput = document.getElementById("txtNewfromDate");
    const toDateInput = document.getElementById("txtNewtoDate");
    if (fromDateInput) fromDateInput.value = defaultFromDate;
    if (toDateInput) toDateInput.value = defaultToDate;
    // Reset weekend days
    setWeekendDays({ sat: true, sun: true });

    // Reset login/logout facility
    setSelectedloginfacility(loginfacility[0]?.Id || "");
    setSelectedlogoutfacility(loginfacility[0]?.Id || "");

    // Reset login/logout shift dropdowns and state
    const loginShiftDropdown = document.getElementById("ddlNewLoginShift");
    const logoutShiftDropdown = document.getElementById("ddlNewLogoutShift");
    if (loginShiftDropdown && loginShiftDropdown.options.length > 0) {
      loginShiftDropdown.value = loginShiftDropdown.options[0].value;
      setSelectedShiftTime(loginShiftDropdown.options[0].value);
    } else {
      setSelectedShiftTime("");
    }
    if (logoutShiftDropdown && logoutShiftDropdown.options.length > 0) {
      logoutShiftDropdown.value = logoutShiftDropdown.options[0].value;
      setSelectedLogoutShiftTime(logoutShiftDropdown.options[0].value);
    } else {
      setSelectedLogoutShiftTime("");
    }

    // Reset all checkboxes in mgrassociate
    setMgrassociate((prev) =>
      prev.map((item) => ({
        ...item,
        isChecked: false,
      }))
    );
  };
  // Loader ke liye
  useEffect(() => {
    if (isSubmitting) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSubmitting]);

  // Offcanvas ke liye
  useEffect(() => {
    const offcanvas = document.getElementById("raise_Feedback");
    function handleOffcanvasHidden() {
      if (!isSubmitting) {
        document.body.style.overflow = "";
      }
    }
    if (offcanvas) {
      offcanvas.addEventListener("hidden.bs.offcanvas", handleOffcanvasHidden);
    }
    return () => {
      if (offcanvas) {
        offcanvas.removeEventListener(
          "hidden.bs.offcanvas",
          handleOffcanvasHidden
        );
      }
    };
  }, [isSubmitting]);

  const handleSubmit = async () => {

    setLoading(true); // Loader ON
    // Use fromDate and toDate from state (already in YYYY-MM-DD format)
    const selectedEmployees = mgrassociate
      .filter((emp) => emp.isChecked)
      .map((emp) => emp.EmployeeID);
    // Check if any employees are selected
    if (selectedEmployees.length === 0) {
      toastService.error(
        "Please select at least one employee and complete all required fields before saving."
      );
      setLoading(false); // Loader OFF
      return; // Exit the function if no employees are selected
    }

    const params = {
      empID: selectedEmployees, // Assuming you have the employee ID from the session
      fromDate: fromDate,
      toDate: toDate,
      facilityIn: selectedloginfacility,
      facilityOut: selectedlogoutfacility,
      logIn: document.getElementById("ddlNewLoginShift").value,
      logOut: document.getElementById("ddlNewLogoutShift").value,
      WeeklyOff: weekendDays.sat || weekendDays.sun ? "7,1" : "0", // Example logic for weekly off
      userID: sessionManager.getUserSession().ID, // Assuming you have the user ID from the session
      weekendlogin: weekendDays.sat ? "0" : "0",
      weekendlogout: weekendDays.sun ? "0" : "0",
      pickadflag: "1", // Replace with actual logic if needed
      dropadflag: "1", // Replace with actual logic if needed
    };

    try {
      const response = await apiService.InsertNewSchedule(params);
      // console.log("Schedule saved successfully:", response);
      // //alert("Record saved successfully!"); // Alert for successful save
      // toastService.success("Record Saved successfully!"); // Show success toast
      // const offcanvasElement = document.getElementById("Employee_Shift");
      // offcanvasElement.classList.remove("show"); // Hide the offcanvas
      //   // Reset form values after offcanvas is hidden
      //   resetFormValues();

      // // Refresh the main table data
      // await fetchMgrSchedule(); // Call the function to refresh the main table data
      if (
        response &&
        Array.isArray(response) &&
        response.length > 0 &&
        response[0].res2.includes(
          "Roster insert failed, due to difference between login and logout time is less than 9 hours."
        )
      ) {
        // console.log(
        //   "Roster insert failed: Login and logout time ",
        //   response[0].res2
        // );

        toastService.error(
          "Roster insertion failed: login and logout time must differ by at least 9 hours."
        );
      } else {
        toastService.success("Record saved!");
        resetFormValues();
        const offcanvasElement = document.getElementById("raise_Feedback");
        offcanvasElement.classList.remove("show");
        // --- Close the offcanvas modal ---
        // const offcanvasElement = document.getElementById("Employee_Shift");
        // if (offcanvasElement) {
        //   offcanvasElement.addEventListener("hidden.bs.offcanvas", resetFormValues);
        //   return () => {
        //     offcanvasElement.removeEventListener(
        //       "hidden.bs.offcanvas",
        //       resetFormValues
        //     );
        //   }
        await fetchMgrSchedule();
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      //alert("Error saving schedule. Please try again."); // Alert for error
      toastService.error(
        "Failed to save the schedule. Please try again later."
      ); // Show error toast
    } finally {
      setLoading(false); // Loader OFF
    }
  };
  const handleReplicateClick = () => {
    navigate("/ReplicateSchedule");
  };
  const handleNewButtonClick = () => {
    const userFacilityId = sessionManager.getUserSession().FacilityID;
    setSelectedloginfacility(userFacilityId);
    setSelectedlogoutfacility(userFacilityId);
    const offcanvasElement = document.getElementById("raise_Feedback");
    if (offcanvasElement) {
      const offcanvas = new Offcanvas(offcanvasElement);
      offcanvas.show();
    }
    // optional: resetFormValues();
  };
  // Function to refresh trip data

  return (
    <div className="container-fluid p-0">
      {isSubmitting && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(255,255,255,0.7)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="spinner-border text-primary"
            style={{ width: 60, height: 60, fontSize: 32 }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      <Loader isVisible={loading} fullScreen={true} />
      <Header pageTitle="My Schedule" showNewButton={true} onNewButtonClick={handleNewButtonClick} />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Middle Section */}
      <div className="middle">
        <div className="row mt-3">
          <div className="col-12">
            <style>{`
              .replicate-btn {
                background-color: transparent !important;
                color: #0BAA60 !important; 
                border: 1px solid #0BAA60 !important;
                font-weight: 500;
                transition: all 0.3s ease;
              }
              .replicate-btn:hover, .replicate-btn:focus, .replicate-btn:active {
                background-color: rgba(11, 170, 96, 0.1) !important;
                color: #0BAA60 !important;
                border-color: #0BAA60 !important;
                box-shadow: none !important;
              }
            `}</style>
            <button
              type="button"
              className="btn replicate-btn"
              onClick={handleReplicateClick}
            >
              Replicate Schedule
            </button>
            {/* <button type="button" className="btn btn-light">
                  Roster Bulk Upload
                </button> */}
          </div>
        </div>
        {/* Schedule Table */}
        <div className="row">
          <div className="col-12">
            <div className="card_tb p-3">
              <div className="row mb-3">
                <div className="col-2">
                  {/* <div className="col-1"> */}
                  <label className="form-label">Manager</label>
                  {/* </div>
                  <div className="col-2"> */}
                  <select
                    className="form-select"
                    id="ddlManager"
                    value={selectedManager}
                    onChange={handleManagerChange}
                  >
                    {managers.map((manager) => (
                      <option key={manager.MgrId} value={manager.MgrId}>
                        {manager.ManagerName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-2">
                  <label className="form-label">From Date</label>
                  {/* </div>
                  <div className="col-2"> */}
                  <style>
                    {`
                      .custom-calendar-wrapper {
                        position: relative;
                        width: 100%;
                      }
                      .custom-calendar-icon {
                        position: absolute;
                        left: 10px;
                        top: 50%;
                        transform: translateY(-50%);
                        width: 22px;
                        height: 22px;
                        z-index: 2;
                        pointer-events: none;
                      }
                      .custom-calendar-input .p-inputtext {
                        padding-left: 35px !important;
                      }
                    `}
                  </style>
                  <div className="custom-calendar-wrapper">
                    <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                    <Calendar
                      id="fromDate"
                      className="w-100 custom-calendar-input"
                      value={mainFromDate ? new Date(mainFromDate) : null}
                      onChange={(e) => {
                        const val = e.value ? e.value.toISOString().split("T")[0] : "";
                        onchangedFromDate(val);
                      }}
                      dateFormat="mm/dd/yy"
                    />
                  </div>
                </div>
                {/* --- RIGHT SIDE TOOLBAR --- */}
                <div className="col-8 d-flex justify-content-end align-items-end">
                  <TableToolbar
                    search={scheduleFilter}
                    onSearch={(e) => setScheduleFilter(e.target.value)}
                    showExport={false}
                    //overlayRef={op}
                    showFilter={false}
                    //filterButtonRef={false}
                    onRefresh={() => handleRefreshSchedule()}
                    className="mb-0"
                  >
                    <div className="p-4 text-center">
                      <i
                        className="pi pi-info-circle text-muted mb-3 d-block"
                        style={{ fontSize: "2rem" }}
                      />
                      <p className="m-0 text-muted" style={{ fontSize: "0.875rem" }}>
                        No advanced filters available.
                      </p>
                    </div>
                  </TableToolbar>
                </div>
              </div>
              {/* </div> */}
              <div className="table-responsive">
                <table className="table table-sm mb-0 custom-html-table" id="mgrschedule">
                  <thead className="table-light">
                    <tr>
                      <th>Schedule</th>
                      {weekDays.map((day, index) => (
                        <th key={index}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '78px', height: '19px' }}>
                            <span className="badge text-bg-dark" style={{
                              width: '42px',
                              height: '19px',
                              borderRadius: '10px',
                              paddingLeft: '10px',
                              paddingRight: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              fontWeight: 800,
                              fontSize: '13px',
                              lineHeight: '19px',
                              letterSpacing: '-0.03em'
                            }}>
                              {day.day}
                            </span>
                            <span style={{
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              fontSize: '13px',
                              fontWeight: 600,
                              color: '#111827'
                            }}>
                              {day.date}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="arrows">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="text-center">
                          <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      displayedSchedule.map((employee, index) => (
                        <tr
                          key={employee.EmployeeID || index}
                          className={`${index % 2 !== 0 ? "ota-row-odd" : ""} ota-row-hover ${employee.geoCode !== "Y" || employee.tptReq !== "Y" ? "disabled-row"
                            : ""
                            }`}
                        >
                          <td>
                            <span className="text-muted">
                              {employee.EmpName}
                            </span>
                            {employee.geoCode !== "Y" && (
                              <span
                                className="material-icons md-18 text-danger mx-2"
                                title="NoGeocode"
                              >
                                location_off
                              </span>
                            )}
                            {employee.tptReq !== "Y" && (
                              <span
                                className="material-icons md-18 text-danger"
                                title="NoTransport"
                              >
                                no_transfer
                              </span>
                            )}
                          </td>
                          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                            <td key={day} id={employee.EmployeeID}>
                              {employee.geoCode !== "Y" ||
                                employee.tptReq !== "Y" ? (
                                 // Read-only view for disabled rows
                                <div className="d-flex align-items-center gap-2">
                                  <span>
                                    {
                                      employee[`SETime${day}`]
                                        .split("!")[0]
                                        .split("<BR>")[0]
                                    }
                                    <br />
                                    {
                                      employee[`SETime${day}`]
                                        .split("!")[0]
                                        .split("<BR>")[1]
                                    }
                                  </span>
                                  {(() => {
                                    const timeString =
                                      employee[`SETime${day}`]?.split("!")[0];
                                    const [pickupTime, dropTime] =
                                      timeString?.split("<BR>") || [];
                                    const showIcon =
                                      employee[`SETime${day}`]?.split(
                                        "!"
                                      )[1] === "true";

                                    const extractTime = (str) => {
                                      if (!str) return null;
                                      const timeMatch = str.match(/\d{4}/);
                                      return timeMatch ? timeMatch[0] : null;
                                    };

                                    const pickupTimeValue =
                                      extractTime(pickupTime);
                                    const dropTimeValue = extractTime(dropTime);

                                    return (pickupTimeValue || dropTimeValue) &&
                                      showIcon ? (
                                      <a
                                        href="#!"
                                        className=""
                                        data-bs-toggle="offcanvas"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleTripIconClick(employee, day);
                                        }}
                                        data-bs-target="#trips"
                                      >
                                        <img
                                          src="images/icons/car.png"
                                          alt=""
                                        />
                                      </a>
                                    ) : null;
                                  })()}
                                </div>
                              ) : (
                                // Interactive view for enabled rows
                                <div className="d-flex align-items-center gap-2">
                                  <a
                                    href="#!"
                                    // data-bs-toggle="offcanvas"
                                    // data-bs-target="#Employee_Shift"
                                    onClick={() =>
                                      handleEmployeeShiftClick(employee, day)
                                    }
                                  >
                                    {
                                      employee[`SETime${day}`]
                                        .split("!")[0]
                                        .split("<BR>")[0]
                                    }
                                    <br />
                                    {
                                      employee[`SETime${day}`]
                                        .split("!")[0]
                                        .split("<BR>")[1]
                                    }
                                  </a>
                                  {(() => {
                                    const timeString =
                                      employee[`SETime${day}`]?.split("!")[0];
                                    const [pickupTime, dropTime] =
                                      timeString?.split("<BR>") || [];
                                    const showIcon =
                                      employee[`SETime${day}`]?.split(
                                        "!"
                                      )[1] === "true";

                                    const extractTime = (str) => {
                                      if (!str) return null;
                                      const timeMatch = str.match(/\d{4}/);
                                      return timeMatch ? timeMatch[0] : null;
                                    };

                                    const pickupTimeValue =
                                      extractTime(pickupTime);
                                    const dropTimeValue = extractTime(dropTime);

                                    return (pickupTimeValue || dropTimeValue) &&
                                      showIcon ? (
                                      <a
                                        href="#!"
                                        className=""
                                        data-bs-toggle="offcanvas"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleTripIconClick(employee, day);
                                        }}
                                        data-bs-target="#trips"
                                      >
                                        <img
                                          src="images/icons/car.png"
                                          alt=""
                                        />
                                      </a>
                                    ) : null;
                                  })()}
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {/* Pagination controls */}
                {/* PrimeReact paginator for schedule table */}
                {/* Reusable Custom Paginator */}
                <CustomPaginator
                  first={schedFirst}
                  rows={schedRows}
                  totalRecords={schedTotal}
                  onPageChange={onSchedPageChange}
                  rowsPerPageOptions={[10, 20, 50]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Sidebar */}
      <Notifications />
      {/* Profile Sidebar */}
      <div
        className="offcanvas offcanvas-end"
        tabIndex="-1"
        id="profileSidebar"
        aria-labelledby="offcanvasRightLabel"
      >
        <div className="offcanvas-body position-relative p-0">
          <button
            type="button"
            className="btn-close text-reset btn-close-fixed"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
          <div className="d-flex justify-content-start align-items-start p-3">
            <img src="images/ali.png" className="me-3" alt="" />
            <div>
              <h5 className="subtitle_sm">John Doe</h5>
              <ul className="personal_info">
                <li>
                  <span className="material-icons">email</span> john@example.com
                </li>
                <li>
                  <span className="material-icons">call</span> 9627552410
                </li>
              </ul>
              <button className="btn btn-outline-secondary pi_btn">
                View Profile
              </button>
              <button className="btn btn-outline-danger pi_btn">Logout</button>
            </div>
          </div>
          {/* Add more profile sidebar content */}
        </div>
      </div>

      {/* <!-- Employee Shift Detail --> */}
      <div
        class={`offcanvas offcanvas-end ${isEmployeeShiftOpen ? "show" : ""}`}
        tabindex="-1"
        id="Employee_Shift"
        aria-labelledby="offcanvasRightLabel"
        data-bs-backdrop="static"
      >
        <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <h5 className="subtitle fw-normal">
            Update Schedule -{" "}
            {employeeSchedule && employeeSchedule.length > 0
              ? `${employeeSchedule[0].empCode} ${employeeSchedule[0].empName} `
              : "Loading..."}
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
            onClick={() => setIsEmployeeShiftOpen(false)}
          ></button>
        </div>
        <div class="offcanvas-body px-4">
          <div class="row">
            <div class="col-12 mb-3">
              <ul class="offcanvas_list">
                {employeeSchedule && employeeSchedule.length > 0 && (
                  <>
                    <li>
                      <small>Employee ID</small> {employeeSchedule[0].empCode}
                    </li>
                    <li>
                      <small>Name</small> {employeeSchedule[0].empName}
                    </li>
                    <li>
                      <small>Shift Date</small>{" "}
                      {employeeSchedule[0].startDate
                        ? new Date(
                          employeeSchedule[0].startDate
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                        : "N/A"}
                    </li>
                    <li>
                      <small>Gender</small> {employeeSchedule[0].Gender}
                    </li>
                  </>
                )}
              </ul>
            </div>
            <div className="col-12 mb-3">
              <div className="card form_card border-0">
                <div className="card-header">Facility</div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label">Select Log-In Facility</label>
                      <select
                        className="form-select"
                        value={selectedloginfacility}
                        onChange={handleLoginFacilityChangeInModal}
                        disabled={shiftLockStatus.loginFacilityDisabled}
                      >
                        {loginFacilities.map((facility) => (
                          <option key={facility.Id} value={facility.Id}>
                            {facility.facilityName || facility.Name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label">Select Log-Out Facility</label>
                      <select
                        className="form-select"
                        value={selectedlogoutfacility}
                        onChange={(e) => setSelectedlogoutfacility(e.target.value)}
                        disabled={shiftLockStatus.logoutFacilityDisabled}
                      >
                        {logoutFacilities.map((facility) => (
                          <option key={facility.Id} value={facility.Id}>
                            {facility.facilityName || facility.Name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 mb-3">
              <div className="card form_card border-0">
                <div className="card-header">Shift</div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-6">
                      <label className="form-label">Login Shift Time</label>
                      {(shiftLockStatus.loginTimeVisible && shiftLockStatus.tptForType !== 2) ? (
                        <select
                          className="form-select"
                          id="loginShiftDropdown"
                          value={selectedShiftTime}
                          onChange={(e) => setSelectedShiftTime(e.target.value)}
                          disabled={shiftLockStatus.loginTimeDisabled}
                        >
                          <option value="N/A">N/A</option>
                          {Array.isArray(availableShiftTimes) &&
                            availableShiftTimes.map((shift) => (
                              <option
                                key={shift.shiftTime}
                                value={shift.ShiftValue || shift.shiftTime}
                              >
                                {shift.shiftTime}
                              </option>
                            ))}
                          {selectedShiftTime &&
                            !availableShiftTimes.some(
                              (shift) => (shift.ShiftValue || shift.shiftTime) === selectedShiftTime
                            ) && (
                              <option value={selectedShiftTime} disabled>
                                {selectedShiftTime}
                              </option>
                            )}
                        </select>
                      ) : (
                        <div
                          className="form-control-plaintext bg-light border rounded py-2 px-3"
                          style={{ minHeight: "38px" }}
                        >
                          {shiftLockStatus.loginTimeLabel || selectedShiftTime || "Locked"}
                        </div>
                      )}
                    </div>

                    <div className="col-6">
                      <label className="form-label">Logout Shift Time</label>

                      {(shiftLockStatus.logoutTimeVisible && shiftLockStatus.tptForType !== 1) ? (

                        <select
                          className="form-select"
                          id="logoutShiftDropdown"
                          value={selectedLogoutShiftTime}
                          onChange={(e) => setSelectedLogoutShiftTime(e.target.value)}
                          disabled={shiftLockStatus.logoutTimeDisabled}
                        >
                          <option value="N/A">N/A</option>
                          {Array.isArray(availableLogoutShiftTimes) &&
                            availableLogoutShiftTimes.map((shift) => (
                              <option
                                key={shift.shiftTime}
                                value={shift.ShiftValue || shift.shiftTime}
                              >
                                {shift.shiftTime}
                              </option>
                            ))}
                          {selectedLogoutShiftTime &&
                            !availableLogoutShiftTimes.some(
                              (shift) => (shift.ShiftValue || shift.shiftTime) === selectedLogoutShiftTime
                            ) && (
                              <option value={selectedLogoutShiftTime} disabled>{selectedLogoutShiftTime} </option>
                            )}
                        </select>
                      ) : (
                        <div
                          className="form-control-plaintext bg-light border rounded py-2 px-3"
                          style={{ minHeight: "38px" }}
                        >
                          {shiftLockStatus.logoutTimeLabel || selectedLogoutShiftTime || "Locked"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {shiftLockStatus.tptForMessage && (
              <div className="col-12">
                <span className="text-danger">
                  {shiftLockStatus.tptForMessage}
                </span>
              </div>
            )}
            <div class="col-12">
              <div
                className="alert  alert-light offcanvas_alert"
                role="alert"
                style={{ marginTop: "30px" }}
              >
                {employeeSchedule && employeeSchedule.length > 0 && (
                  <>
                    <small>
                      * Login. Last Updated By -{" "}
                      {employeeSchedule[0].lastUpdatedBy || "N/A"}| At -{" "}
                      {employeeSchedule[0].lastUpdatedAt
                        ? new Date(
                          employeeSchedule[0].lastUpdatedAt
                        ).toLocaleString()
                        : "N/A"}
                    </small>
                    <small>
                      * Logout. Last Updated By -{" "}
                      {employeeSchedule[0].lastUpdatedBy || "N/A"} | At -{" "}
                      {employeeSchedule[0].lastUpdatedAt
                        ? new Date(
                          employeeSchedule[0].lastUpdatedAt
                        ).toLocaleString()
                        : "N/A"}
                    </small>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div class="offcanvas-footer">
          <button
            class="btn btn-outline-secondary"
            data-bs-dismiss="offcanvas"
            onClick={() => setIsEmployeeShiftOpen(false)}
          >
            Cancel
          </button>
          {shiftLockStatus.saveButtonVisible && (
            <button
              class="btn btn-success mx-3"
              onClick={handleUpdateEmpSchedule}
            >
              Submit
            </button>
          )}
        </div>
      </div>
      {/* {<!-- Employee Shift Detail  -->} */}
      {/* <!-- Trips Detail --> */}
      <div
        className={`offcanvas offcanvas-end ${isTripsModalOpen ? "show" : ""}`}
        tabindex="-1"
        id="trips"
        aria-labelledby="offcanvasRightLabel"
        data-bs-backdrop="false"
      >
        <div class="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <h5 class="subtitle fw-normal">
            Employee Trip Details -{" "}
            {selectedEmployeeForTrips
              ? `${selectedEmployeeForTrips.name.replace(/-/g, " ")}`
              : "Select Employee"}
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
            onClick={() => {
              setIsTripsModalOpen(false);
              setSelectedRouteId(null); // Reset the selected route ID to hide the collapsible section
            }}
          ></button>
        </div>
        <div class="offcanvas-body p-2">
          <div class="row">
            <div className="col-12">
              <table class="table trip_tb">
                <thead class="table-dark">
                  <tr>
                    <th>Trip ID</th>
                    <th>Trip Date</th>
                    <th>Trip Type</th>
                    <th>Shift</th>
                    <th>Facility</th>
                    <th style={{ display: "none" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeTrips.length > 0 ? (
                    employeeTrips.map((trip, index) => (
                      <React.Fragment key={index}>
                        <tr>
                          <td>
                            {trip.routeid &&
                              (trip.routeid.includes("Trip Not Generated") ||
                                trip.routeid.includes("Not Finalized")) ? (
                              <span>{trip.routeid.replace(/<br>/g, "-")}</span> // Display as read-only
                            ) : (
                              <a
                                href="#"
                                onClick={() => {
                                  setSelectedRouteId(trip.routeid);
                                  fetchRoutesDetails(trip.routeid); // Fetch route details on click
                                }}
                                data-bs-toggle="collapse"
                                data-bs-target={`#collapseExample-${trip.id}`} // Unique target for each trip
                              >
                                {trip.routeid && trip.routeid.includes("<br>")
                                  ? trip.routeid
                                    .replace(/<br>/g, "-")
                                    .split("<br>")[0]
                                  : trip.routeid}
                              </a>
                            )}
                          </td>
                          <td>
                            {trip.shiftdate
                              ? new Date(trip.shiftdate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "2-digit",
                                  day: "2-digit",
                                  year: "numeric",
                                }
                              )
                              : "N/A"}
                          </td>
                          <td>
                            <TripTypeBadge type={trip.triptype || "N/A"} />
                          </td>
                          <td>{trip.shifttime || "N/A"}</td>
                          <td>{trip.facility || "N/A"}</td>
                          <td style={{ display: "none" }}>
                            {" "}
                            {trip.enableds === "TRUE" && (
                              <img
                                src="images/icons/close.png"
                                alt="Cancel Trip"
                                onClick={() => handleCancelTrip(trip)}
                              />
                            )}
                          </td>
                        </tr>
                        {selectedRouteId === trip.routeid && (
                          <tr
                            className="collapse show"
                            id={`collapseExample-${trip.id}`}
                          >
                            <td colSpan="6" className="p-2 bg-secondary">
                              <table className="table trip_tb mb-0">
                                <thead className="table-dark">
                                  <tr>
                                    <th>Employee Detail</th>
                                    <th>G</th>
                                    <th>Location</th>
                                    <th>S No.</th>
                                    <th>ETA</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Array.isArray(routeDetails) &&
                                    routeDetails.length > 0 ? (
                                    routeDetails.map((detail, index) => (
                                      <tr key={index}>
                                        <td>{detail.empName || "N/A"}</td>
                                        <td>
                                          <span
                                            className={`badge ${detail.Gender === "M"
                                              ? "bg-primary-subtle"
                                              : "bg-danger-subtle"
                                              } rounded-pill text-dark`}
                                          >
                                            {detail.Gender || "N/A"}
                                          </span>
                                        </td>
                                        <td>{detail.address || "N/A"}</td>
                                        <td>{detail.stopNo || "N/A"}</td>
                                        <td>
                                          {detail.ETAhh !== null &&
                                            detail.ETAmm !== null
                                            ? `${detail.ETAhh}:${detail.ETAmm}`
                                            : "N/A"}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="5" className="text-center">
                                        No route details available.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center">
                        No trips available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* <!-- <div class="offcanvas-footer">
        <button class="btn btn-outline-secondary" data-bs-dismiss="offcanvas">Cancel</button>
        <button class="btn btn-success mx-3">Submit</button>
      </div> --> */}
      </div>
      {/* <!-- Trips Detail  --> */}

      {/* New Schedule Modal */}
      <div
        className="offcanvas offcanvas-end offcanvas_long"
        tabIndex="-1"
        id="raise_Feedback"
        aria-labelledby="offcanvasRightLabel"
        data-bs-backdrop="false"
      >
        <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <h5 className="subtitle fw-bold">New Schedule</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
            onClick={resetFormValues}
          ></button>
        </div>
        <div className="offcanvas-body">
          {/* Cut Off Timings */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-warning">
                <div className="card-body d-flex justify-content-start align-items-center cutoff p-0">
                  <div className="overline_textB">Cut Off Timings </div>
                  <div>
                    <small className="fw-bold fs-11 me-2">Weekday</small>
                    <small className="fs-11">Pick </small>
                    <span className="overline_textB text-danger me-4">
                      {lockDetails?.Lockpickhrs || "0"} Hrs
                    </span>
                    <small className="fs-11">Drop </small>
                    <span className="overline_textB text-danger">
                      {lockDetails?.lockdrophrs || "0"} Mins
                    </span>
                  </div>
                  <div className="ms-5">
                    <small className="fw-bold fs-11 me-2">Weekend</small>
                    <small className="fs-11">Pick </small>
                    <span className="overline_textB text-danger me-4">
                      {lockDetails?.lockweekendpick || "0"} Hrs
                    </span>
                    <small className="fs-11">Drop </small>
                    <span className="overline_textB text-danger">
                      {lockDetails?.lockweekenddrophrs || "0"} Mins
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Form */}
          <div className="row mb-4">
            <div className="col">
              <label className="form-label">Process Name</label>
              <select
                id="ddlProcess"
                className="form-select"
                value={selectedProcess}
                onChange={handleProcessChange}
              >
                <option value="0">Select Process</option>
                {processes.map((process) => (
                  <option key={process.id} value={process.id}>
                    {process.processName}
                  </option>
                ))}
              </select>
            </div>
            <div className="col">
              <label className="form-label">From</label>
              <div className="custom-calendar-wrapper">
                <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                <Calendar
                  id="txtNewfromDate"
                  className="w-100 custom-calendar-input"
                  value={fromDate ? new Date(fromDate) : null}
                  onChange={(e) => {
                    const date = e.value;
                    const val = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : "";
                    handleFromDateChange({ target: { value: val } });
                  }}
                  dateFormat="mm/dd/yy"
                  appendTo={document.body}
                  panelStyle={{ zIndex: '99999 !important' }}
                />
              </div>
            </div>
            <div className="col">
              <label className="form-label">To</label>
              <div className="custom-calendar-wrapper">
                <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                <Calendar
                  id="txtNewtoDate"
                  className="w-100 custom-calendar-input"
                  value={toDate ? new Date(toDate) : null}
                  onChange={(e) => {
                    const date = e.value;
                    const val = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : "";
                    handleToDateChange({ target: { value: val } });
                  }}
                  dateFormat="mm/dd/yy"
                  appendTo={document.body}
                  panelStyle={{ zIndex: '99999 !important' }}
                />
              </div>
            </div>
            <div className="col">
              <label className="form-label">Login Facility</label>
              <select
                className="form-select"
                value={selectedloginfacility}
                onChange={handleLoginFacilityChange}
                id="ddlNewLoginFacility"

              >
                {loginfacility.map((loginfacility) => (
                  <option key={loginfacility.Id} value={loginfacility.Id}>
                    {loginfacility.facilityName}
                  </option>
                ))}
              </select>
            </div>
            <div className="col">
              <label className="form-label">Logout Facility</label>
              <select
                className="form-select"
                value={selectedlogoutfacility}
                onChange={handleLogoutFacilityChange}
                id="ddlNewLogoutFacility"
              >
                {loginfacility.map((loginfacility) => (
                  <option key={loginfacility.Id} value={loginfacility.Id}>
                    {loginfacility.facilityName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="row mb-4">
            <div className="col-12">
              <div className="form-check form-check-inline ps-0">
                <button
                  type="button"
                  className="btn btn-light rounded-pill px-3"
                >
                  Weekly Off
                </button>
              </div>
              <div className="form-check form-check-inline me-5">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="Mon"
                  value="Mon"
                />
                <label className="form-check-label" htmlFor="Mon">
                  Mon
                </label>
              </div>
              <div className="form-check form-check-inline me-5">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="Tue"
                  value="Tue"
                />
                <label className="form-check-label" htmlFor="Tue">
                  Tue
                </label>
              </div>
              <div className="form-check form-check-inline me-5">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="Wed"
                  value="Wed"
                />
                <label className="form-check-label" htmlFor="Wed">
                  Wed
                </label>
              </div>
              <div className="form-check form-check-inline me-5">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="Thu"
                  value="Thu"
                />
                <label className="form-check-label" htmlFor="Thu">
                  Thu
                </label>
              </div>
              <div className="form-check form-check-inline me-5">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="Fri"
                  value="Fri"
                />
                <label className="form-check-label" htmlFor="Fri">
                  Fri
                </label>
              </div>
              <div className="form-check form-check-inline me-5">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="Sat"
                  value="Sat"
                  checked={weekendDays.sat}
                  onChange={(e) =>
                    setWeekendDays((prev) => ({
                      ...prev,
                      sat: e.target.checked,
                    }))
                  }
                />
                <label className="form-check-label" htmlFor="Sat">
                  Sat
                </label>
              </div>
              <div className="form-check form-check-inline me-5">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="Sun"
                  value="Sun"
                  checked={weekendDays.sun}
                  onChange={(e) =>
                    setWeekendDays((prev) => ({
                      ...prev,
                      sun: e.target.checked,
                    }))
                  }
                />
                <label className="form-check-label" htmlFor="Sun">
                  Sun
                </label>
              </div>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-4">
              <div className="card form_card border-0">
                <div className="card-header">Weekdays</div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-6">
                      <label className="form-label">Login Shift</label>
                      <select
                        className="form-select"
                        defaultValue="0"
                        id="ddlNewLoginShift"
                      >
                        <option value="0">Select</option>
                        <option value="N/A">N/A</option>
                        {LoginNewShiftPickup.map((loginnewshiftpickup) => (
                          <option
                            key={loginnewshiftpickup.shiftTime}
                            value={loginnewshiftpickup.shiftTime}
                          >
                            {loginnewshiftpickup.shiftTime}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label">Logout Shift</label>
                      <select
                        className="form-select"
                        defaultValue="0"
                        id="ddlNewLogoutShift"
                      >
                        <option value="0">Select</option>
                        <option value="N/A">N/A</option>
                        {LoginNewShiftDrop.map((loginnewshiftdrop) => (
                          <option
                            key={loginnewshiftdrop.shiftTime}
                            value={loginnewshiftdrop.shiftTime}
                          >
                            {loginnewshiftdrop.shiftTime}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-4">
              <div className="card form_card border-0">
                <div className="card-header">Weekends</div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-6">
                      <label className="form-label">Login Shift</label>
                      <select
                        className="form-select"
                        defaultValue={weekendDays.sat ? "N/A" : "0"}
                        id="ddlNewLoginWeekEndShift"
                        disabled={weekendDays.sat && weekendDays.sun}
                      >
                        <option value="0">Select</option>
                        <option value="N/A">N/A</option>
                        {LoginWeekEndShiftPickup.map(
                          (loginweekendshiftpickup) => (
                            <option
                              key={loginweekendshiftpickup.shiftTime}
                              value={loginweekendshiftpickup.shiftTime}
                            >
                              {loginweekendshiftpickup.shiftTime}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label">Logout Shift</label>
                      <select
                        className="form-select"
                        defaultValue={weekendDays.sun ? "N/A" : "0"}
                        id="ddlNewLogoutWeekEndShift"
                        disabled={weekendDays.sat && weekendDays.sun}
                      >
                        <option value="0">Select</option>
                        <option value="N/A">N/A</option>
                        {LoginWeekEndShiftDrop.map((loginweekendshiftdrop) => (
                          <option
                            key={loginweekendshiftdrop.shiftTime}
                            value={loginweekendshiftdrop.shiftTime}
                          >
                            {loginweekendshiftdrop.shiftTime}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* <!-- Table start --> */}
          {selectedProcess &&
            selectedProcess !== "0" &&
            mgrassociate.length > 0 && (
              <>
                <TableToolbar
                  search={globalFilter}
                  onSearch={(e) => setGlobalFilter(e.target.value)}
                  showExport={false}
                  // overlayRef={op}
                  onRefresh={() => handleRefresh()}
                  showFilter={false}
                //filterButtonRef={filterButtonRef}
                >
                  <div className="p-4 text-center">
                    <i
                      className="pi pi-info-circle text-muted mb-3 d-block"
                      style={{ fontSize: "2rem" }}
                    />
                    <p
                      className="m-0 text-muted"
                      style={{ fontSize: "0.875rem" }}
                    >
                      No advanced filters available.
                    </p>
                  </div>
                </TableToolbar>
                <table
                  className="tb_raiseAdhoc table table-borderless table-hover"
                  id="tblMgrAssociate"
                >
                  <thead>
                    <tr>
                      <th width="4%">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="flexCheckDefault"
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setMgrassociate((prev) =>
                              prev.map((item) => ({
                                ...item,
                                isChecked: isChecked, // Add isChecked property to each item
                              }))
                            );
                          }}
                        />
                      </th>
                      <th>Employee</th>
                      <th>Gender</th>
                      <th>Process</th>
                      <th>Manager</th>
                      <th>Facility</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedMgrAssociate.map((assoc) => (
                      <tr key={assoc.EmployeeID}>
                        <td>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={assoc.isChecked || false} // Use isChecked property
                            onChange={() => {
                              setMgrassociate((prev) =>
                                prev.map((item) =>
                                  item.EmployeeID === assoc.EmployeeID
                                    ? { ...item, isChecked: !item.isChecked }
                                    : item
                                )
                              );
                            }}
                          />
                        </td>
                        <td>
                          {assoc.EmpName}
                          {assoc.geoCode !== "Y" && (
                            <span className="material-icons md-18 text-danger mx-2">
                              location_off
                            </span>
                          )}
                          {assoc.tptReq !== "Y" && (
                            <span className="material-icons md-18 text-danger">
                              no_transfer
                            </span>
                          )}
                        </td>
                        <td>{assoc.Gender}</td>
                        <td>{assoc.processName}</td>
                        <td>{assoc.Manager}</td>
                        <td>{assoc.facility}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="d-flex justify-content-end mt-2">
                  <Paginator
                    first={mgrFirst}
                    rows={mgrRows}
                    totalRecords={mgrTotal}
                    //template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                    rowsPerPageOptions={[50, 150, 250, 350, 450]}
                    onPageChange={onMgrPageChange}
                  />
                </div>
              </>
            )}
        </div>


        {/* Add more form fields */}
        <div className="offcanvas-footer">
          <button
            className="btn btn-outline-secondary"
            data-bs-dismiss="offcanvas"
            onClick={resetFormValues}
          >
            Cancel
          </button>
          <button
            className="btn btn-success mx-3"
            id="SubmitSchedule"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default MySchedule;
