import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { Paginator } from "primereact/paginator";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import TableToolbar from "./common/TableToolbar.jsx";
import Loader from "./common/Loader.jsx";
import { Calendar } from "primereact/calendar";
import CustomPaginator from "./common/CustomPaginator";
import calendarIcon from "../assets/calendar.png";
import TripTypeBadge from "./common/TripTypeBadge";
import useIsMobile from "./common/useIsMobile";
import MobileScheduleView from "./common/MobileScheduleView";
import "./css/MobileSchedule.css";

const TripCarIcon = ({ title = "Trip Details" }) => {
  return (
    <span
      className="trip-car-icon material-icons"
      aria-hidden="true"
      title={title}
    >
      directions_car
    </span>
  );
};

const formatDateTime = (dateStr, timeStr) => {
  if (
    !dateStr ||
    !timeStr ||
    timeStr === "null" ||
    timeStr.trim().toUpperCase() === "N/A"
  ) {
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
    console.error(
      `Error parsing datetime from '${dateStr}' and '${timeStr}':`,
      error
    );
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

  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState("");
  const [mgrscheduledata, setMgrscheduledata] = useState([]);
  const [weekDays, setWeekDays] = useState([]);

  const [loginfacility, setloginfacility] = useState([]);
  const [loginFacilities, setLoginFacilities] = useState([]);
  const [logoutFacilities, setLogoutFacilities] = useState([]);
  const [selectedloginfacility, setSelectedloginfacility] = useState("");
  const [selectedlogoutfacility, setSelectedlogoutfacility] = useState("");

  const [mgrassociate, setMgrassociate] = useState([]);
  const [LoginNewShiftPickup, setLoginNewShiftPickup] = useState([]);
  const [LoginNewShiftDrop, setLoginNewShiftDrop] = useState([]);
  const [LoginWeekEndShiftPickup, setLoginWeekEndShiftPickup] = useState([]);
  const [LoginWeekEndShiftDrop, setLoginWeekEndShiftDrop] = useState([]);

  const [isEmployeeShiftOpen, setIsEmployeeShiftOpen] = useState(false);
  const [employeeSchedule, setEmployeeSchedule] = useState([]);
  const [availableShiftTimes, setAvailableShiftTimes] = useState([]);
  const [availableLogoutShiftTimes, setAvailableLogoutShiftTimes] = useState(
    []
  );

  const [weekendLoginShift, setWeekendLoginShift] = useState("0");
  const [weekendLogoutShift, setWeekendLogoutShift] = useState("0");
  const [selectedShiftTime, setSelectedShiftTime] = useState("");
  const [selectedLogoutShiftTime, setSelectedLogoutShiftTime] = useState("");

  const [employeeTrips, setEmployeeTrips] = useState([]);
  const [isTripsModalOpen, setIsTripsModalOpen] = useState(false);
  const [selectedEmployeeForTrips, setSelectedEmployeeForTrips] =
    useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [routeDetails, setRouteDetails] = useState([]);
  const [error, setError] = useState(null);

  const [weekendDays, setWeekendDays] = useState({
    sat: true,
    sun: true,
  });

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

  const todayStr = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(addMonth(todayStr, 1));

  const [mgrFirst, setMgrFirst] = useState(0);
  const [mgrRows, setMgrRows] = useState(50);

  const onMgrPageChange = (e) => {
    setMgrFirst(e.first);
    setMgrRows(e.rows);
  };

  const [schedFirst, setSchedFirst] = useState(0);
  const [schedRows, setSchedRows] = useState(50);

  const [mainFromDate, setMainFromDate] = useState(todayStr);
  const [scheduleFilter, setScheduleFilter] = useState("");

  const filteredSchedule = useMemo(() => {
    if (!scheduleFilter || scheduleFilter.trim() === "") return mgrscheduledata;
    const q = scheduleFilter.toLowerCase();
    return mgrscheduledata.filter((row) => {
      if ((row.EmpName || "").toString().toLowerCase().includes(q)) return true;
      if ((row.EmployeeID || "").toString().toLowerCase().includes(q))
        return true;
      for (let i = 0; i < 7; i++) {
        const val = row[`SETime${i}`];
        if (val && val.toString().toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [mgrscheduledata, scheduleFilter]);

  const schedTotal = filteredSchedule.length;
  const displayedSchedule = filteredSchedule.slice(
    schedFirst,
    schedFirst + schedRows
  );

  const onSchedPageChange = (e) => {
    setSchedFirst(e.first);
    setSchedRows(e.rows);
  };

  const [globalFilter, setGlobalFilter] = useState("");

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

  const isMobile = useIsMobile(768);

  const extractTimeFromString = useCallback((str) => {
    if (!str) return "";
    const timeMatch = str.match(/\d{4}/);
    return timeMatch ? timeMatch[0] : "";
  }, []);

  const parsedSchedule = useMemo(() => {
    return mgrscheduledata.map((employee) => ({
      employeeId: employee.EmployeeID,
      empCode: employee.empCode || employee.EmpCode,
      empName: employee.EmpName,
      geoCode: employee.geoCode,
      tptReq: employee.tptReq,
      _original: employee,
      days: [0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
        const seTime = employee[`SETime${dayIndex}`] || "";
        const parts = seTime.split("!");
        const timeInfo = parts[0] || "";
        const hasTrip = parts[1] === "true";
        const timeParts = timeInfo.split("<BR>");
        const pickup = extractTimeFromString(timeParts[0]);
        const drop = extractTimeFromString(timeParts[1]);
        return {
          pickup,
          drop,
          hasTrip,
          rawPickup: timeParts[0] || "",
          rawDrop: timeParts[1] || "",
        };
      }),
    }));
  }, [mgrscheduledata, extractTimeFromString]);

  const mgrTotal = filteredData.length;
  const displayedMgrAssociate = filteredData.slice(
    mgrFirst,
    mgrFirst + mgrRows
  );

  useEffect(() => {
    setMgrFirst(0);
  }, [globalFilter]);

  useEffect(() => {
    setSchedFirst(0);
  }, [scheduleFilter]);

  useEffect(() => {
    fetchMgrSchedule(mainFromDate);
    fetchScheduleDetails();
    const days = generateWeekDays(mainFromDate);
    setWeekDays(days);
    fetchLockDetails();
    fetchFacilityDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockDetails?.lockSDate, lockDetails?.lockDiffDays]);

  const handleCancelTrip = async (trip) => {
    try {
      const params = {
        routeid: trip.routeid,
        EmployeeId: trip.empCode,
        updatedby: sessionManager.getUserSession().ID,
        shiftdate: trip.shiftdate,
        triptype: trip.triptype,
        Reason: "",
      };
      const response = await apiService.CancelTrip(params);

      if (response) {
        toastService.success("Trip cancelled successfully.");
        fetchMgrSchedule();
        fetchScheduleDetails();
        if (selectedEmployeeForTrips) {
          fetchEmployeeTrips(selectedEmployeeForTrips);
        }
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
      setMgrassociate(response);
    } catch (error) {
      console.error("Error fetching manager associates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetchMgrAssociate();
      toastService.success("Table refreshed successfully");
    } catch (error) {
      toastService.error("Failed to refresh table");
      console.error("Error fetching manager associates:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const fetchFacilityDetails = async () => {
    try {
      setLoading(true);

      let scopedEmpId = 0;

      if (
        !sessionManager.isBackupManager() &&
        sessionManager.getUserSession().ManagerId === "0"
      ) {
        scopedEmpId = sessionManager.getUserSession().ID;
      } else {
        scopedEmpId = -1;
      }

      const response = await apiService.SelectFacilityByGroup({
        empid: scopedEmpId,
      });

      if (response) {
        setLoginFacilities(response);
        setLogoutFacilities(response);
        setloginfacility(response);

        const userFacility = response.find((fac) => fac.Id == facID);
        const defaultFacilityId = userFacility
          ? userFacility.Id
          : response[0]?.Id || "";

        setSelectedloginfacility(defaultFacilityId);
        setSelectedlogoutfacility(defaultFacilityId);
      }
    } catch (error) {
      console.error("Error fetching facility details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMgrSchedule = async (sdateOverride) => {
    try {
      setLoading(true);
      let mgrid = selectedManager || empid;
      const data = await apiService.GetMgrSchedule({
        mgrid: mgrid,
        sdate: sdateOverride || mainFromDate,
      });
      setMgrscheduledata(data);
    } catch (error) {
      console.error("Error fetching manager schedule:", error);
    } finally {
      setLoading(false);
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
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleDetails = async () => {
    try {
      setLoading(true);
      const params = {
        backupmgrid: empid,
      };

      const managerResponse = await apiService.GetBackupMgrId(params);
      if (managerResponse) {
        setManagers(managerResponse);
      }

      const projectResponse = await apiService.GetSpocAssignedProcess({
        empid: empid,
        type: "M",
      });

      if (projectResponse) {
        setProcesses(projectResponse);
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

  const handleFromDateChange = (e) => {
    const newFromDate = e.target.value;
    setFromDate(newFromDate);
    setToDate(addMonth(newFromDate, 1));
  };

  const onchangedFromDate = (newDate) => {
    setMainFromDate(newDate);
    fetchMgrSchedule(newDate);
    const days = generateWeekDays(newDate);
    setWeekDays(days);
  };

  const handleToDateChange = (e) => {
    setToDate(e.target.value);
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

  const fetchEmployeeSchedule = async (employeeId, shiftDate = null) => {
    try {
      const fromDateValue = shiftDate || mainFromDate;

      const response = await apiService.GetOneEmployeeSchedule({
        empid: employeeId,
        sdate: fromDateValue,
      });

      let scheduleData = response;
      if (typeof response === "string") {
        try {
          scheduleData = JSON.parse(response);
        } catch (e) {
          console.error("Error parsing response:", e);
        }
      }

      if (!Array.isArray(scheduleData)) {
        scheduleData = scheduleData ? [scheduleData] : [];
      }

      if (scheduleData.length > 0) {
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
        return formattedSchedule;
      }

      setEmployeeSchedule([]);
      return [];
    } catch (error) {
      console.error("Error fetching employee schedule:", error);
      setEmployeeSchedule([]);
      return [];
    }
  };

  const fetchPickShiftTimes = async (
    employeeId,
    facilityId = null,
    shiftDate = null
  ) => {
    try {
      const fromDateValue = shiftDate || mainFromDate;

      const pickFacilityID =
        facilityId ||
        (employeeSchedule && employeeSchedule.length > 0
          ? employeeSchedule[0].pickFacilityID
          : selectedloginfacility);

      const response = await apiService.GetPickShiftTime({
        facilityid: pickFacilityID,
        sdate: fromDateValue,
        empid: employeeId,
        processid: "0",
      });

      let parsedResponse = response;
      if (typeof response === "string") {
        try {
          parsedResponse = JSON.parse(response);
        } catch (e) {
          console.error("Error parsing shift times JSON:", e);
          parsedResponse = [];
        }
      }

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

  const fetchDropShiftTimes = async (
    employeeId,
    facilityId = null,
    shiftDate = null
  ) => {
    try {
      const fromDateValue = shiftDate || mainFromDate;

      const dropFacilityID =
        facilityId ||
        (employeeSchedule && employeeSchedule.length > 0
          ? employeeSchedule[0].dropFacilityID
          : selectedlogoutfacility);

      const processId =
        employeeSchedule &&
        employeeSchedule.length > 0 &&
        employeeSchedule[0].processId
          ? employeeSchedule[0].processId
          : selectedProcess || "0";

      const response = await apiService.GetDropShiftTime({
        facilityid: dropFacilityID,
        sdate: fromDateValue,
        callfrom: "A",
        empid: employeeId,
        processid: processId,
      });

      let parsedResponse = response;
      if (typeof response === "string") {
        try {
          parsedResponse = JSON.parse(response);
        } catch (e) {
          console.error("Error parsing logout shift times JSON:", e);
          parsedResponse = [];
        }
      }

      const shiftTimesArray = Array.isArray(parsedResponse)
        ? parsedResponse
        : [];

      setAvailableLogoutShiftTimes(shiftTimesArray);
      return shiftTimesArray;
    } catch (error) {
      console.error("Error fetching logout shift times:", error);
      setAvailableLogoutShiftTimes([]);
      return [];
    }
  };

  const handleLoginFacilityChangeInModal = async (e) => {
    const newFacilityId = e.target.value;
    setSelectedloginfacility(newFacilityId);

    if (employeeSchedule && employeeSchedule.length > 0) {
      await fetchPickShiftTimes(
        employeeSchedule[0].employeeID,
        newFacilityId,
        selectedShiftDate
      );
    }
  };

  const handleLogoutFacilityChangeInModal = async (e) => {
    const newFacilityId = e.target.value;
    setSelectedlogoutfacility(newFacilityId);

    if (employeeSchedule && employeeSchedule.length > 0) {
      await fetchDropShiftTimes(
        employeeSchedule[0].employeeID,
        newFacilityId,
        selectedShiftDate
      );
    }
  };

  const handleUpdateEmpSchedule = async () => {
    setLoading(true);
    try {
      const empSchedule = employeeSchedule && employeeSchedule[0];
      if (!empSchedule) {
        toastService.error("No employee schedule found!");
        return;
      }

      const formatTime = (time) => {
        if (!time) return "";
        if (/^\d{4}$/.test(time)) return time;
        if (/^\d{2}:\d{2}$/.test(time)) return time.replace(":", "");
        const match = time.match(/(\d{2}):(\d{2})$/);
        if (match) return match[1] + match[2];
        const digits = time.match(/\d{4}/);
        if (digits) return digits[0];
        return "";
      };

      const params = {
        empID: selectedEmployeeId,
        StartDate: selectedShiftDate,
        StartTime: formatTime(selectedShiftTime),
        EndTime: formatTime(selectedLogoutShiftTime),
        pickFacilityID: selectedloginfacility,
        dropFacilityID: selectedlogoutfacility,
        userName: sessionManager.getUserSession().ID,
        pickadflag: "1",
        dropadflag: "1",
        remark: "",
      };

      let response = await apiService.UpdateEmpSchedule(params);

      if (typeof response === "string") {
        try {
          response = JSON.parse(response);
        } catch (e) {
          toastService.error("Invalid response from server.");
          return;
        }
      }
      if (response && !Array.isArray(response)) {
        response = [response];
      }

      if (response) {
        toastService.success("Schedule updated successfully!");
        setIsEmployeeShiftOpen(false);

        const today = new Date().toISOString().split("T")[0];
        const fromDateInput = document.getElementById("fromDate");
        if (fromDateInput) {
          fromDateInput.value = today;
        }
        setFromDate(today);
        const days = generateWeekDays(today);
        setWeekDays(days);

        await fetchMgrSchedule();
      } else {
        toastService.error(response[0]?.res2 || "Update failed!");
      }
    } catch (error) {
      toastService.error("Error updating schedule: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeShiftClick = async (employee, day) => {
    try {
      setSelectedEmployeeId(employee.empCode);

      const selectedDate = weekDays[day]?.fullDate;
      setSelectedShiftDate(selectedDate);

      const fromDateInput = document.getElementById("fromDate");
      if (fromDateInput && selectedDate) {
        fromDateInput.value = selectedDate;
      }

      const seTimeData = employee[`SETime${day}`];
      const [timeInfo] = seTimeData.split("!");
      const [loginTime, logoutTime] = timeInfo.split("<BR>").map((time) => {
        const match = time.match(/\d{4}$/);
        return match ? match[0] : time.trim();
      });

      let scheduleData = await fetchEmployeeSchedule(
        employee.EmployeeID,
        selectedDate
      );
      let schedule = (scheduleData && scheduleData[0]) || {};

      const lockPickTime = new Date(lockDetails.pickLockDateTime);
      const lockDropTime = new Date(lockDetails.dropLockDateTime);

      const sanitizeTime = (time) => {
        const match = time?.match(/\d{4}/);
        return match ? match[0] : null;
      };

      const loginTimeSanitized = sanitizeTime(loginTime);
      const logoutTimeSanitized = sanitizeTime(logoutTime);

      const loginDateTime = formatDateTime(
        schedule.startDate,
        loginTimeSanitized
      );
      const logoutDateTime = formatDateTime(
        schedule.endDate,
        logoutTimeSanitized
      );

      const isWeekend = (dayName) => ["Saturday", "Sunday"].includes(dayName);

      const loginDayName = loginDateTime
        ? loginDateTime.toLocaleString("en-US", { weekday: "long" })
        : "N/A";
      const logoutDayName = logoutDateTime
        ? logoutDateTime.toLocaleString("en-US", { weekday: "long" })
        : "N/A";

      if (isWeekend(loginDayName) && lockDetails.lockweekendpick) {
        lockPickTime.setMinutes(
          lockPickTime.getMinutes() + Number(lockDetails.lockweekendpick)
        );
      }
      if (isWeekend(logoutDayName) && lockDetails.lockweekenddrop) {
        lockDropTime.setMinutes(
          lockDropTime.getMinutes() + Number(lockDetails.lockweekenddrop)
        );
      }

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

      const todayStrLocal = new Date().toISOString().split("T")[0];

      if (selectedDate < todayStrLocal) {
        loginTimeVisible = false;
        loginTimeLabel = loginTime === "" ? "Locked" : loginTime;
        loginTimeDisabled = true;

        logoutTimeVisible = false;
        logoutTimeLabel = logoutTime === "" ? "Locked" : logoutTime;
        logoutTimeDisabled = true;

        saveButtonVisible = false;
      } else {
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

      let loginFacilityId =
        schedule.pickFacilityID || employee.pickFacilityID || "";
      let logoutFacilityId =
        schedule.dropFacilityID || employee.dropFacilityID || "";

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

      setIsEmployeeShiftOpen(true);

      setSelectedShiftTime(loginTime);
      setSelectedLogoutShiftTime(logoutTime);

      if (loginFacilityId) {
        await fetchPickShiftTimes(
          employee.EmployeeID,
          loginFacilityId,
          selectedDate
        );
      }
      if (logoutFacilityId) {
        await fetchDropShiftTimes(
          employee.EmployeeID,
          logoutFacilityId,
          selectedDate
        );
      }

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

  const fetchEmployeeTrips = async (employeeId, startDate) => {
    try {
      let formattedDate = startDate;
      if (startDate && typeof startDate === "string" && !startDate.includes("-")) {
        const dateParts = startDate.split("/");
        if (dateParts.length === 3) {
          formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        }
      }

      const response = await apiService.GetMyTrips({
        empid: employeeId,
        sDate: formattedDate,
        eDate: formattedDate,
      });

      let tripsData = response;
      if (typeof response === "string") {
        try {
          tripsData = JSON.parse(response);
        } catch (e) {
          console.error("Error parsing trips data:", e);
          tripsData = [];
        }
      }

      const tripsArray = Array.isArray(tripsData) ? tripsData : [];
      setEmployeeTrips(tripsArray);
      return tripsArray;
    } catch (error) {
      console.error("Error fetching employee trips:", error);
      setEmployeeTrips([]);
      return [];
    }
  };

  const handleTripIconClick = async (employee, day) => {
    try {
      const selectedDate = weekDays[day]?.fullDate;

      setSelectedEmployeeForTrips({
        id: employee.EmployeeID,
        name: employee.EmpName,
        code: employee.EmpCode || "",
        date: selectedDate,
      });

      await fetchEmployeeTrips(employee.EmployeeID, selectedDate);

      setIsTripsModalOpen(true);

      const tripsModal = document.getElementById("trips");
      if (tripsModal && !tripsModal.classList.contains("show")) {
        const bsModal = new window.bootstrap.Offcanvas(tripsModal);
        bsModal.show();
      }
    } catch (error) {
      console.error("Error handling trip icon click:", error);
    }
  };

  const fetchRoutesDetails = async (routeId) => {
    setError(null);

    const params = {
      empid: 0,
      sDate: mainFromDate,
      triptype: "",
      routeid: routeId,
    };

    try {
      let data = await apiService.GetMyRoutesDetails(params);
      data = JSON.parse(data);

      if (data && Array.isArray(data)) {
        setRouteDetails(data);
      } else {
        setRouteDetails([]);
      }
    } catch (err) {
      setError(err);
      console.error("Error fetching route details:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetFormValues = () => {
    const processDropdown = document.getElementById("ddlProcess");
    if (processDropdown) {
      processDropdown.value = processes[0]?.ProcessId || "";
      setSelectedProcess(processes[0]?.ProcessId || "");
    }

    const defaultFromDate = new Date().toISOString().split("T")[0];
    const defaultToDate = addMonth(defaultFromDate, 1);

    setFromDate(defaultFromDate);
    setToDate(defaultToDate);

    const fromDateInput = document.getElementById("txtNewfromDate");
    const toDateInput = document.getElementById("txtNewtoDate");
    if (fromDateInput) fromDateInput.value = defaultFromDate;
    if (toDateInput) toDateInput.value = defaultToDate;

    setWeekendDays({ sat: true, sun: true });

    setSelectedloginfacility(loginfacility[0]?.Id || "");
    setSelectedlogoutfacility(loginfacility[0]?.Id || "");

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

    setMgrassociate((prev) =>
      prev.map((item) => ({
        ...item,
        isChecked: false,
      }))
    );
  };

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
    setLoading(true);

    const selectedEmployees = mgrassociate
      .filter((emp) => emp.isChecked)
      .map((emp) => emp.EmployeeID);

    if (selectedEmployees.length === 0) {
      toastService.error(
        "Please select at least one employee and complete all required fields before saving."
      );
      setLoading(false);
      return;
    }

    const params = {
      empID: selectedEmployees,
      fromDate: fromDate,
      toDate: toDate,
      facilityIn: selectedloginfacility,
      facilityOut: selectedlogoutfacility,
      logIn: document.getElementById("ddlNewLoginShift").value,
      logOut: document.getElementById("ddlNewLogoutShift").value,
      WeeklyOff: weekendDays.sat || weekendDays.sun ? "7,1" : "0",
      userID: sessionManager.getUserSession().ID,
      weekendlogin: weekendDays.sat ? "N/A" : weekendLoginShift,
      weekendlogout: weekendDays.sun ? "N/A" : weekendLogoutShift,
      pickadflag: "1",
      dropadflag: "1",
    };

    try {
      const response = await apiService.InsertNewSchedule(params);

      if (
        response &&
        Array.isArray(response) &&
        response.length > 0 &&
        response[0].res2?.includes(
          "Roster insert failed, due to difference between login and logout time is less than 9 hours."
        )
      ) {
        toastService.error(
          "Roster insertion failed: login and logout time must differ by at least 9 hours."
        );
      } else {
        toastService.success("Record saved!");
        resetFormValues();
        const offcanvasElement = document.getElementById("raise_Feedback");
        if (offcanvasElement) {
          const offcanvasInstance = Offcanvas.getOrCreateInstance(
            offcanvasElement
          );
          offcanvasInstance.hide();
        }
        await fetchMgrSchedule();
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      toastService.error(
        "Failed to save the schedule. Please try again later."
      );
    } finally {
      setLoading(false);
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
  };

  return (
    <div className="container-fluid p-0">
      <style>{`
        .trip-car-icon {
          font-size: 20px;
          line-height: 1;
          color: #2563eb;
          background: rgba(37, 99, 235, 0.12);
          border-radius: 10px;
          padding: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
        }
        .trip-car-icon:hover {
          background: rgba(37, 99, 235, 0.18);
        }
      `}</style>

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
      <Header
        pageTitle="My Schedule"
        showNewButton={true}
        onNewButtonClick={handleNewButtonClick}
      />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />

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
          </div>
        </div>

        {isMobile ? (
          <div className="row">
            <div className="col-12">
              <div className="card_tb p-0">
                <MobileScheduleView
                  parsedSchedule={parsedSchedule}
                  weekDays={weekDays}
                  onShiftClick={(employee, dayIndex) => {
                    handleEmployeeShiftClick(
                      employee._original || employee,
                      dayIndex
                    );
                  }}
                  onTripClick={(employee, dayIndex) => {
                    handleTripIconClick(employee._original || employee, dayIndex);
                  }}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="row">
            <div className="col-12">
              <div className="card_tb p-3">
                <style>
                  {`
                    .schedule-filter-bar {
                      display: flex;
                      flex-wrap: wrap;
                      gap: 16px;
                      align-items: flex-end;
                    }
                    .schedule-filter-bar .filter-item {
                      min-width: 160px;
                      display: flex;
                      flex-direction: column;
                    }
                    .schedule-filter-bar .filter-item .form-label {
                      margin-bottom: 4px;
                      font-size: 13px;
                    }
                    .schedule-filter-bar .filter-item.manager-select {
                      flex: 0 0 auto;
                      min-width: 180px;
                      max-width: 220px;
                    }
                    .schedule-filter-bar .filter-item.date-select {
                      flex: 0 0 auto;
                      min-width: 160px;
                      max-width: 200px;
                    }
                    .schedule-filter-bar .toolbar-wrapper {
                      flex: 1;
                      display: flex;
                      justify-content: flex-end;
                      align-items: flex-end;
                      min-width: 200px;
                    }
                    .schedule-filter-bar .toolbar-wrapper > div {
                      margin-bottom: 0 !important;
                    }
                    .schedule-filter-bar .toolbar-wrapper .mb-3 {
                      margin-bottom: 0 !important;
                    }
                    @media (max-width: 768px) {
                      .schedule-filter-bar {
                        flex-direction: column;
                        align-items: stretch;
                      }
                      .schedule-filter-bar .filter-item.manager-select,
                      .schedule-filter-bar .filter-item.date-select {
                        max-width: 100%;
                        min-width: 100%;
                      }
                      .schedule-filter-bar .toolbar-wrapper {
                        justify-content: flex-start;
                        min-width: 100%;
                      }
                    }
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

                <div className="schedule-filter-bar mb-3">
                  <div className="filter-item manager-select">
                    <label className="form-label">Manager</label>
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

                  <div className="filter-item date-select">
                    <label className="form-label">From Date</label>
                    <div className="custom-calendar-wrapper">
                      <img
                        src={calendarIcon}
                        alt="calendar"
                        className="custom-calendar-icon"
                      />
                      <Calendar
                        id="fromDate"
                        className="w-100 custom-calendar-input"
                        value={mainFromDate ? new Date(mainFromDate) : null}
                        onChange={(e) => {
                          const val = e.value
                            ? e.value.toISOString().split("T")[0]
                            : "";
                          onchangedFromDate(val);
                        }}
                        dateFormat="mm/dd/yy"
                      />
                    </div>
                  </div>

                  <div className="toolbar-wrapper">
                    <TableToolbar
                      search={scheduleFilter}
                      onSearch={(e) => setScheduleFilter(e.target.value)}
                      showExport={false}
                      showFilter={false}
                      onRefresh={() => handleRefreshSchedule()}
                      className="mb-0"
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
                  </div>
                </div>

                <div className="table-responsive">
                  <table
                    className="table table-sm mb-0 custom-html-table"
                    id="mgrschedule"
                  >
                    <thead className="table-light">
                      <tr>
                        <th>Employee</th>
                        {weekDays.map((day, index) => (
                          <th key={index}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                width: "78px",
                                height: "19px",
                              }}
                            >
                              <span
                                className="badge text-bg-dark"
                                style={{
                                  width: "42px",
                                  height: "19px",
                                  borderRadius: "10px",
                                  paddingLeft: "10px",
                                  paddingRight: "10px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontFamily:
                                    "'Plus Jakarta Sans', sans-serif",
                                  fontWeight: 800,
                                  fontSize: "13px",
                                  lineHeight: "19px",
                                  letterSpacing: "-0.03em",
                                }}
                              >
                                {day.day}
                              </span>
                              <span
                                style={{
                                  fontFamily:
                                    "'Plus Jakarta Sans', sans-serif",
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  color: "#111827",
                                }}
                              >
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
                              <span className="visually-hidden">
                                Loading...
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        displayedSchedule.map((employee, index) => (
                          <tr
                            key={employee.EmployeeID || index}
                            className={`${
                              index % 2 !== 0 ? "ota-row-odd" : ""
                            } ota-row-hover ${
                              employee.geoCode !== "Y" ||
                              employee.tptReq !== "Y"
                                ? "disabled-row"
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
                                        employee[`SETime${day}`]?.split("!")[1] ===
                                        "true";

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
                                          data-bs-toggle="offcanvas"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            handleTripIconClick(employee, day);
                                          }}
                                          data-bs-target="#trips"
                                        >
                                          <TripCarIcon />
                                        </a>
                                      ) : null;
                                    })()}
                                  </div>
                                ) : (
                                  <div className="d-flex align-items-center gap-2">
                                    <a
                                      href="#!"
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
                                        employee[`SETime${day}`]?.split("!")[1] ===
                                        "true";

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
                                          data-bs-toggle="offcanvas"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            handleTripIconClick(employee, day);
                                          }}
                                          data-bs-target="#trips"
                                        >
                                          <TripCarIcon />
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
        )}
      </div>

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
                        value={weekendDays.sat ? "N/A" : weekendLoginShift}
                        id="ddlNewLoginWeekEndShift"
                        disabled={weekendDays.sat && weekendDays.sun}
                        onChange={(e) =>
                          setWeekendLoginShift(e.target.value)
                        }
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
                        value={weekendDays.sun ? "N/A" : weekendLogoutShift}
                        id="ddlNewLogoutWeekEndShift"
                        disabled={weekendDays.sat && weekendDays.sun}
                        onChange={(e) => setWeekendLogoutShift(e.target.value)}
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
                          checked={mgrassociate.length > 0 && mgrassociate.every((item) => item.isChecked)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setMgrassociate((prev) =>
                              prev.map((item) => ({
                                ...item,
                                isChecked: isChecked,
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
