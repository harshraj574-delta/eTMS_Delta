import React, { useState, useEffect, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import MasterSidebar from "./Master/MasterSidebar";
import Loader from "./common/Loader";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { MultiSelect } from "primereact/multiselect";
import { Checkbox } from "primereact/checkbox";
import { CustomDataTable } from "./common/CustomDataTable";
import { Column } from "primereact/column";
import CustomPaginator from "./common/CustomPaginator";
import TabSwitcher from "./common/TabSwitcher";
import TableToolbar from "./common/TableToolbar";
import ReportButton from "./common/ReportButton";
import ReplicationExceptionService from "../services/compliance/ReplicationExceptionService";
import { toastService } from "../services/toastService";
import { ToastContainer } from "react-toastify";
import noReportImage from "../assets/no_report.png";
import calendarIcon from "../assets/calendar.png";
import "./common/CustomDataTable.css";
import AutoAllocationService from "../services/compliance/AutoAllocationService";
import ManageRouteService from "../services/compliance/ManageRouteService";


const ReplicationException = () => {
  // Form state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [tripType, setTripType] = useState("P");
  const [shifts, setShifts] = useState([]);
  const [selectedShifts, setSelectedShifts] = useState([]);

  // Data state
  const [deleteExceptionData, setDeleteExceptionData] = useState([]);
  const [addExceptionData, setAddExceptionData] = useState([]);
  const [activeTab, setActiveTab] = useState("delete");

  // Selection state
  const [selectedDeleteRows, setSelectedDeleteRows] = useState([]);
  const [selectedAddRows, setSelectedAddRows] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isRouteFinalized, setIsRouteFinalized] = useState(false);
  const [routeFinalizedMessage, setRouteFinalizedMessage] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");

  // Pagination state for delete table
  const [deleteFirst, setDeleteFirst] = useState(0);
  const [deleteRows, setDeleteRows] = useState(20);

  // Pagination state for add table
  const [addFirst, setAddFirst] = useState(0);
  const [addRows, setAddRows] = useState(20);

  // Align feature state
  const [showAlignSidebar, setShowAlignSidebar] = useState(false);
  const [alignRoutes, setAlignRoutes] = useState([]);
  const [alignLoading, setAlignLoading] = useState(false);
  const [alignRouteSearch, setAlignRouteSearch] = useState("");
  const [expandedRouteIds, setExpandedRouteIds] = useState({});
  const [routeEmployees, setRouteEmployees] = useState({});
  const [routeEmpLoading, setRouteEmpLoading] = useState({});
  const [editingEmpData, setEditingEmpData] = useState({});
  const [cutEmployee, setCutEmployee] = useState(null);

  const deleteTableRef = useRef(null);
  const addTableRef = useRef(null);

  const UserID = sessionStorage.getItem("ID");

  const tripTypes = [
    { label: "Pick", value: "P" },
    { label: "Drop", value: "D" },
  ];

  const tabs = [
    {
      label: "Delete Exception",
      value: "delete",
      count: deleteExceptionData.length,
    },
    { label: "Add Exception", value: "add", count: addExceptionData.length },
  ];

  // Fetch facilities on mount
  useEffect(() => {
    fetchFacilities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch shifts when facility or trip type changes
  useEffect(() => {
    if (selectedFacility) {
      fetchShifts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFacility, tripType]);

  const fetchFacilities = async () => {
    try {
      const response = await ReplicationExceptionService.SelectFacility({
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
    } catch (err) {
      console.error("Error fetching facilities:", err);
      toastService.error("Error fetching facilities");
    }
  };

  const fetchShifts = async () => {
    try {
      const response = await ReplicationExceptionService.GetShiftByFacilityType(
        {
          facid: selectedFacility,
          type: tripType,
        }
      );
      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      const formattedData = Array.isArray(parsedResponse)
        ? parsedResponse.map((item) => ({
            label: item.shiftTime,
            value: item.shiftTime,
          }))
        : [];
      setShifts(formattedData);
      setSelectedShifts([]);
    } catch (err) {
      console.error("Error fetching shifts:", err);
      toastService.error("Error fetching shifts");
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const getShiftString = () => {
    return selectedShifts.join(",");
  };

  const handleSubmit = async () => {
    if (!selectedFacility) {
      toastService.error("Please select a facility");
      return;
    }

    if (selectedShifts.length === 0) {
      toastService.error("Please select at least one shift");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setSelectedDeleteRows([]);
    setSelectedAddRows([]);

    try {
      const formattedDate = formatDate(selectedDate);
      const shiftString = getShiftString();

      // Check if route is finalized
      const finalizedResponse =
        await ReplicationExceptionService.GetIsRouteFinalized({
          sDate: formattedDate,
          FacilityID: selectedFacility,
          TripType: tripType,
          Shifts: shiftString,
          UserID: UserID,
        });

      const finalizedResult =
        typeof finalizedResponse === "string"
          ? JSON.parse(finalizedResponse)
          : finalizedResponse;

      if (
        finalizedResult &&
        finalizedResult[0] &&
        finalizedResult[0].result === true
      ) {
        setIsRouteFinalized(true);
        setRouteFinalizedMessage(
          `Route has been finalized for ${shiftString} shift.`
        );
      } else {
        setIsRouteFinalized(false);
        setRouteFinalizedMessage("");
      }

      // Fetch delete exception data
      const deleteResponse =
        await ReplicationExceptionService.GetDeleteException({
          sDate: formattedDate,
          eDate: formattedDate,
          FacilityID: selectedFacility,
          TripType: tripType,
          Shifttimes: shiftString,
        });

      const deleteData =
        typeof deleteResponse === "string"
          ? JSON.parse(deleteResponse)
          : deleteResponse;
      setDeleteExceptionData(Array.isArray(deleteData) ? deleteData : []);

      // Fetch add exception data
      const addResponse = await ReplicationExceptionService.GetAddException({
        sDate: formattedDate,
        eDate: formattedDate,
        FacilityID: selectedFacility,
        TripType: tripType,
        Shifttimes: shiftString,
      });

      const addData =
        typeof addResponse === "string" ? JSON.parse(addResponse) : addResponse;
      setAddExceptionData(Array.isArray(addData) ? addData : []);

      setLoading(false);

      if (
        (Array.isArray(deleteData) && deleteData.length > 0) ||
        (Array.isArray(addData) && addData.length > 0)
      ) {
        toastService.success("Exception data fetched successfully");
      } else {
        toastService.warn("No exception data found");
      }
    } catch (err) {
      console.error("Error fetching exception data:", err);
      setLoading(false);
      toastService.error("Error fetching exception data");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedDeleteRows.length === 0) {
      toastService.error("Select at least one employee for deletion");
      return;
    }

    const empIdList = selectedDeleteRows.map((row) => row.EmpId).join(",");

    try {
      setLoading(true);
      await ReplicationExceptionService.SprDeleteExceptionEmp({
        sDate: formatDate(selectedDate),
        FacilityID: selectedFacility,
        TripType: tripType,
        Shifttimes: getShiftString(),
        empid: empIdList,
        userid: UserID,
      });

      toastService.success("Selected employees deleted successfully!");
      setSelectedDeleteRows([]);
      handleSubmit(); // Refresh data
    } catch (err) {
      console.error("Error deleting employees:", err);
      setLoading(false);
      toastService.error("Error deleting employees");
    }
  };

  const handleAutoAllocation = async () => {
    if (addExceptionData.length === 0) {
      toastService.error("No exception employees to allocate");
      return;
    }

    try {
      setLoading(true);

      // Helper to format date as YYYY-MM-DD for API
      const formatApiDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };

      // Step 1: Get existing routes with space from sp_getrouteforAdhoc
      const routesResponse = await ReplicationExceptionService.sp_getrouteforAdhoc({
        sDate: formatDate(selectedDate),
        FacilityID: selectedFacility,
        Shifttimes: getShiftString(),
        TripType: tripType,
      });

      const existingRoutes =
        typeof routesResponse === "string"
          ? JSON.parse(routesResponse)
          : routesResponse;

      // If no existing routes, generate fresh routes for all employees
      if (!existingRoutes || existingRoutes.length === 0) {
        console.log("[AutoAllocation] No existing routes, generating fresh routes for all employees");
        
        // Get input JSON for all exception employees
        const empCodes = addExceptionData.map(e => e.empCode).join(",");
        const inputJsonResponse = await ReplicationExceptionService.GetInputJsonAutoAllocation({
          facilityid: selectedFacility,
          empcode: empCodes,
          sDate: formatDate(selectedDate),
          triptype: tripType,
          shifttime: getShiftString().split(",")[0]
        });

        const inputJson = typeof inputJsonResponse === "string"
          ? JSON.parse(inputJsonResponse) : inputJsonResponse;

        // Generate routes using routing engine
        const generatedRoutes = await AutoAllocationService.callGenerateApi(inputJson);

        // Save new routes
        await ManageRouteService.save_routesMapBasedNew({
          facilityid: selectedFacility,
          sDate: formatApiDate(selectedDate),
          triptype: tripType,
          shifttime: getShiftString(),
          jsonstring: JSON.stringify(generatedRoutes),
          updatedBy: UserID,
          IsNewAdded: true
        });

        toastService.success(`New routes generated for ${addExceptionData.length} employee(s).`);
        handleSubmit();
        return;
      }

      console.log("[AutoAllocation] Existing routes fetched:", existingRoutes.length, "employees");

      // Extract facility coordinates from the first record (same for all)
      const facilityGeo = existingRoutes.length > 0 
        ? { 
            geoX: existingRoutes[0].FacilitygeoX, 
            geoY: existingRoutes[0].FacilitygeoY 
          }
        : { geoX: 77.0871, geoY: 28.4624 }; // Fallback to NCR if no routes

      console.log("[AutoAllocation] Using facility coordinates:", facilityGeo);

      // Step 2: Allocate exception employees to existing routes (with actual facility geo for direction matching)
      const {
        allocatedRoutes,
        allocatedEmployees,
        unallocatedEmployees,
        allocationDetails,
      } = AutoAllocationService.allocateEmployeesToRoutes(
        existingRoutes,
        addExceptionData,
        facilityGeo,  // Pass actual facility coordinates for sector/direction calculations
        tripType
      );

      console.log("[AutoAllocation] Allocation results:", {
        allocated: allocatedEmployees.length,
        unallocated: unallocatedEmployees.length,
        details: allocationDetails,
      });

      // Track if any routes were modified
      let allocatedToExisting = false;

      // Step 3: Handle allocated employees (recalculate existing routes)
      const recalculateJson = AutoAllocationService.buildRecalculateJson(
        allocatedRoutes,
        facilityGeo,
        getShiftString().split(",")[0],
        existingRoutes[0]?.locationName || "ncr",
        tripType
      );

      if (recalculateJson && recalculateJson.routes.length > 0) {
        console.log("[AutoAllocation] Recalculating routes for allocated employees");
        
        const recalculateResult = await AutoAllocationService.callRecalculateApi(
          recalculateJson
        );

        // Save the recalculated routes
        await ReplicationExceptionService.Save_AutoAllocationRoute({
          facilityid: selectedFacility,
          sDate: formatApiDate(selectedDate),
          triptype: tripType,
          shifttime: getShiftString(),
          jsonstring: JSON.stringify(recalculateResult),
          updatedBy: UserID,
          IsNewAdded: true
        });

        allocatedToExisting = true;
        console.log("[AutoAllocation] Allocated employees saved to existing routes");
      }

      // Step 4: Handle unallocated employees (generate new routes)
      if (unallocatedEmployees.length > 0) {
        console.log("[AutoAllocation] Generating new routes for", unallocatedEmployees.length, "unallocated employees");
        
        // Get employee codes for unallocated employees
        const empCodes = unallocatedEmployees.map(e => e.empCode).join(",");
        
        // Call GetInputJsonAutoAllocation API
        const inputJsonResponse = await ReplicationExceptionService.GetInputJsonAutoAllocation({
          facilityid: selectedFacility,
          empcode: empCodes,
          sDate: formatDate(selectedDate),
          triptype: tripType,
          shifttime: getShiftString().split(",")[0]
        });

        const inputJson = typeof inputJsonResponse === "string"
          ? JSON.parse(inputJsonResponse) : inputJsonResponse;

        console.log("[AutoAllocation] Input JSON for generate API:", inputJson);

        // Generate routes using routing engine
        const generatedRoutes = await AutoAllocationService.callGenerateApi(inputJson);

        console.log("[AutoAllocation] Generated routes:", generatedRoutes);

        // Save new routes
        await ManageRouteService.save_routesMapBasedNew({
          facilityid: selectedFacility,
          sDate: formatApiDate(selectedDate),
          triptype: tripType,
          shifttime: getShiftString(),
          jsonstring: JSON.stringify(generatedRoutes),
          updatedBy: UserID,
          IsNewAdded: true
        });

        console.log("[AutoAllocation] New routes saved for unallocated employees");
      }

      // Build success message
      let successMessage = "";
      if (allocatedToExisting && unallocatedEmployees.length > 0) {
        successMessage = `Auto allocation complete! ${allocatedEmployees.length} employee(s) added to existing routes. ${unallocatedEmployees.length} employee(s) got new routes.`;
      } else if (allocatedToExisting) {
        successMessage = `Auto allocation complete! All ${allocatedEmployees.length} employee(s) added to existing routes.`;
      } else if (unallocatedEmployees.length > 0) {
        successMessage = `Auto allocation complete! ${unallocatedEmployees.length} employee(s) got new routes.`;
      } else {
        successMessage = "No employees were allocated. Please check employee coordinates.";
      }

      toastService.success(successMessage);

      // Refresh data to show updated state
      handleSubmit();
    } catch (err) {
      console.error("[AutoAllocation] Error in auto allocation:", err);
      setLoading(false);
      toastService.error("Error in auto allocation: " + (err.message || "Unknown error"));
    }
  };

  const handleMakeNewRoute = async () => {
    if (selectedAddRows.length === 0) {
      toastService.error("Select at least one employee to make a new route");
      return;
    }

    const empIdList = selectedAddRows.map((row) => row.id).join(",");
    const shiftList = selectedAddRows.map((row) => row.shift).join(",");

    try {
      setLoading(true);
      const response =
        await ReplicationExceptionService.MakeRouteReplicateException({
          sDate: formatDate(selectedDate),
          FacilityID: selectedFacility,
          TripType: tripType,
          Shifttimes: shiftList,
          userid: UserID,
          empid: empIdList,
        });

      const result =
        typeof response === "string" ? JSON.parse(response) : response;
      const newRouteId =
        result && result[0] && result[0].NewRouteID
          ? result[0].NewRouteID
          : "generated";

      toastService.success(`New route ${newRouteId} created successfully!`);
      setSelectedAddRows([]);
      handleSubmit(); // Refresh data
    } catch (err) {
      console.error("Error creating new route:", err);
      setLoading(false);
      toastService.error("Error creating new route");
    }
  };

  const handleAlign = async () => {
    if (selectedAddRows.length === 0) {
      toastService.error("Select at least one employee to align");
      return;
    }
    setShowAlignSidebar(true);
    setAlignLoading(true);
    setExpandedRouteIds({});
    setRouteEmployees({});
    setCutEmployee(null);
    setAlignRouteSearch("");
    try {
      const response = await ReplicationExceptionService.GetRoutesByOrder({
        sDate: formatDate(selectedDate),
        eDate: formatDate(selectedDate),
        FacilityID: selectedFacility,
        TripType: tripType,
        Shifttimes: getShiftString(),
        OrderBy: "RouteID",
        Direction: "ASC",
        Routeid: "",
        occ_seater: "",
      });
      const data = typeof response === "string" ? JSON.parse(response) : response;
      setAlignRoutes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading routes for align:", err);
      toastService.error("Error loading routes");
    } finally {
      setAlignLoading(false);
    }
  };

  const loadRouteEmployees = async (routeId) => {
    setRouteEmpLoading((prev) => ({ ...prev, [routeId]: true }));
    try {
      const response = await ReplicationExceptionService.GetRoutesDetailsnew({
        Routeid: routeId,
        isAdd: 0,
      });
      const data = typeof response === "string" ? JSON.parse(response) : response;
      const emps = Array.isArray(data) ? data : [];
      setRouteEmployees((prev) => ({ ...prev, [routeId]: emps }));
      const editing = {};
      emps.forEach((e) => {
        const empId = e.id || e.empID || e.empId || e.EmpId || e.EmployeeID;
        editing[empId] = {
          stopNo: String(e.stopNo ?? e.StopNo ?? ""),
          ETAhh: e.ETAhh || e.etahh || "00",
          ETAmm: e.ETAmm || e.etamm || "00",
        };
      });
      setEditingEmpData((prev) => ({ ...prev, [routeId]: editing }));
    } catch (err) {
      console.error("Error loading route employees:", err);
      toastService.error("Error loading route employees");
      setRouteEmployees((prev) => ({ ...prev, [routeId]: [] }));
    } finally {
      setRouteEmpLoading((prev) => ({ ...prev, [routeId]: false }));
    }
  };

  const toggleRouteExpand = async (routeId) => {
    const isExpanded = expandedRouteIds[routeId];
    setExpandedRouteIds((prev) => ({ ...prev, [routeId]: !isExpanded }));
    if (!isExpanded && routeEmployees[routeId] === undefined) {
      await loadRouteEmployees(routeId);
    }
  };

  const handleAssignToRoute = async (routeId) => {
    const empIds = selectedAddRows.map((r) => r.id).join(",");
    try {
      setAlignLoading(true);
      await ReplicationExceptionService.AddEmpToRoute({
        empId: empIds,
        routeId: routeId,
        stopNo: 1,
        isDelete: 0,
        IsNewAdded: 1,
        updatedby: UserID,
      });
      toastService.success("Employees assigned to route successfully!");
      setShowAlignSidebar(false);
      setSelectedAddRows([]);
      handleSubmit();
    } catch (err) {
      console.error("Error assigning to route:", err);
      toastService.error("Error assigning employees to route");
    } finally {
      setAlignLoading(false);
    }
  };

  const handleSaveStopETA = async (routeId, emp) => {
    const empId = emp.id || emp.empID || emp.empId || emp.EmpId || emp.EmployeeID;
    const data = editingEmpData[routeId]?.[empId] || {};
    try {
      await ReplicationExceptionService.UpdateRoute({
        RouteID: routeId,
        EmployeeID: empId,
        Shiftdate: formatDate(selectedDate),
        StopNo: data.stopNo || "0",
        ETAhh: data.ETAhh || "00",
        ETAmm: data.ETAmm || "00",
        userid: UserID,
      });
      toastService.success("Stop/ETA updated!");
      setRouteEmployees((prev) => { const u = { ...prev }; delete u[routeId]; return u; });
      await loadRouteEmployees(routeId);
    } catch (err) {
      console.error("Error updating stop/ETA:", err);
      toastService.error("Error updating stop/ETA");
    }
  };

  const handleCutEmp = (emp, fromRouteId) => {
    const empId = emp.id || emp.empID || emp.empId || emp.EmpId || emp.EmployeeID;
    const empName = emp.empName || emp.EmpName || String(empId);
    setCutEmployee({ emp, empId, empName, fromRouteId });
    toastService.info(`"${empName}" marked to move. Click "Paste Here" on the destination route.`);
  };

  const handlePasteEmp = async (toRouteId) => {
    if (!cutEmployee) return;
    const fromRouteId = cutEmployee.fromRouteId;
    try {
      setAlignLoading(true);
      await ReplicationExceptionService.UpdateCutPaste({
        OldRouteid: fromRouteId,
        oldemployeeid: cutEmployee.empId,
        newrouteid: toRouteId,
        stopno: 0,
        userid: UserID,
      });
      toastService.success(`${cutEmployee.empName} moved successfully!`);
      setCutEmployee(null);
      setRouteEmployees((prev) => { const u = { ...prev }; delete u[fromRouteId]; delete u[toRouteId]; return u; });
      if (expandedRouteIds[fromRouteId]) await loadRouteEmployees(fromRouteId);
      if (expandedRouteIds[toRouteId]) await loadRouteEmployees(toRouteId);
    } catch (err) {
      console.error("Error moving employee:", err);
      toastService.error("Error moving employee");
    } finally {
      setAlignLoading(false);
    }
  };

  const exportDeleteToExcel = () => {
    if (deleteExceptionData.length === 0) {
      toastService.error("No data to export");
      return;
    }
    exportToCSV(
      deleteExceptionData,
      `Delete_Exception_${formatDate(selectedDate)}`
    );
  };

  const exportAddToExcel = () => {
    if (addExceptionData.length === 0) {
      toastService.error("No data to export");
      return;
    }
    exportToCSV(addExceptionData, `Add_Exception_${formatDate(selectedDate)}`);
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

  // Delete table checkbox body template
  const deleteCheckboxBodyTemplate = (rowData) => {
    const isChecked = selectedDeleteRows.some((row) => row.EmpId === rowData.EmpId);
    return (
      <Checkbox
        checked={isChecked}
        onChange={() => {
          setSelectedDeleteRows((prev) => {
            const exists = prev.some((row) => row.EmpId === rowData.EmpId);
            if (exists) {
              return prev.filter((row) => row.EmpId !== rowData.EmpId);
            } else {
              return [...prev, rowData];
            }
          });
        }}
      />
    );
  };

  // Delete table checkbox header template
  const deleteCheckboxHeaderTemplate = () => {
    const allSelected =
      deleteExceptionData.length > 0 &&
      selectedDeleteRows.length === deleteExceptionData.length;
    return (
      <Checkbox
        checked={allSelected}
        onChange={() => {
          setSelectedDeleteRows((prev) => {
            if (prev.length === deleteExceptionData.length) {
              return [];
            } else {
              return [...deleteExceptionData];
            }
          });
        }}
      />
    );
  };

  // Add table checkbox body template
  const addCheckboxBodyTemplate = (rowData) => {
    const isChecked = selectedAddRows.some((row) => row.empCode === rowData.empCode);
    return (
      <Checkbox
        checked={isChecked}
        onChange={() => {
          setSelectedAddRows((prev) => {
            const exists = prev.some((row) => row.empCode === rowData.empCode);
            if (exists) {
              return prev.filter((row) => row.empCode !== rowData.empCode);
            } else {
              return [...prev, rowData];
            }
          });
        }}
      />
    );
  };

  // Add table checkbox header template
  const addCheckboxHeaderTemplate = () => {
    const allSelected =
      addExceptionData.length > 0 &&
      selectedAddRows.length === addExceptionData.length;
    return (
      <Checkbox
        checked={allSelected}
        onChange={() => {
          setSelectedAddRows((prev) => {
            if (prev.length === addExceptionData.length) {
              return [];
            } else {
              return [...addExceptionData];
            }
          });
        }}
      />
    );
  };

  // Pagination handlers
  const onDeletePageChange = (event) => {
    setDeleteFirst(event.first);
    setDeleteRows(event.rows);
  };

  const onAddPageChange = (event) => {
    setAddFirst(event.first);
    setAddRows(event.rows);
  };

  // Get filtered data based on global search
  const getFilteredDeleteData = () => {
    if (!globalFilter || globalFilter.trim() === "") {
      return deleteExceptionData;
    }
    const searchLower = globalFilter.toLowerCase();
    return deleteExceptionData.filter((item) => {
      return Object.values(item).some(
        (val) =>
          val !== null &&
          val !== undefined &&
          String(val).toLowerCase().includes(searchLower)
      );
    });
  };

  const getFilteredAddData = () => {
    if (!globalFilter || globalFilter.trim() === "") {
      return addExceptionData;
    }
    const searchLower = globalFilter.toLowerCase();
    return addExceptionData.filter((item) => {
      return Object.values(item).some(
        (val) =>
          val !== null &&
          val !== undefined &&
          String(val).toLowerCase().includes(searchLower)
      );
    });
  };

  // Get paginated data
  const getPaginatedDeleteData = () => {
    const filtered = getFilteredDeleteData();
    return filtered.slice(deleteFirst, deleteFirst + deleteRows);
  };

  const getPaginatedAddData = () => {
    const filtered = getFilteredAddData();
    return filtered.slice(addFirst, addFirst + addRows);
  };

  // Refresh data handler
  const handleRefresh = () => {
    if (hasSearched) {
      handleSubmit();
    }
  };

  return (
    <>
      <Loader isVisible={loading} fullScreen={true} />
      <Header pageTitle="Routing Exception" showNewButton={false} />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Replication Exception</h6>
          </div>
        </div>


        {/* Form Section */}
        <div className="row">
          <div className="col-12">
            <div className="card_tb p-3">
              <div className="row g-2">
                {/* Date */}
                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <label htmlFor="shiftDate" className="form-label">
                    Date <span className="text-danger">*</span>
                  </label>
                  <div className="custom-calendar-wrapper">
                    <img
                      src={calendarIcon}
                      alt="calendar"
                      className="custom-calendar-icon"
                    />
                    <Calendar
                      id="shiftDate"
                      className="w-100 custom-calendar-input"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.value)}
                      dateFormat="mm/dd/yy"
                    />
                  </div>
                </div>

                {/* Facility */}
                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <label htmlFor="facility" className="form-label">
                    Facility Name <span className="text-danger">*</span>
                  </label>
                  <Dropdown
                    id="facility"
                    placeholder="Select Facility"
                    value={selectedFacility}
                    options={facilities}
                    onChange={(e) => setSelectedFacility(e.value)}
                    className="w-100"
                    filter
                  />
                </div>

                {/* Trip Type */}
                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <label htmlFor="tripType" className="form-label">
                    Trip Type <span className="text-danger">*</span>
                  </label>
                  <Dropdown
                    id="tripType"
                    value={tripType}
                    options={tripTypes}
                    onChange={(e) => setTripType(e.value)}
                    className="w-100"
                  />
                </div>

                {/* Shift */}
                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <label htmlFor="shift" className="form-label">
                    Shift <span className="text-danger">*</span>
                  </label>
                  <MultiSelect
                    id="shift"
                    placeholder="Select Shift"
                    value={selectedShifts}
                    options={shifts}
                    onChange={(e) => setSelectedShifts(e.value)}
                    className="w-100"
                    display="chip"
                    disabled={!selectedFacility}
                    filter
                    filterPlaceholder="Search shift"
                  />
                </div>

                {/* Submit Button */}
                <div className="col-12 col-sm-6 col-md-4 col-lg-2 d-flex align-items-end">
                  <style>
                    {`
                      .run-report-btn {
                        background-color: #1C1D20 !important;
                        border-color: #1C1D20 !important;
                        transition: background-color 0.3s, border-color 0.3s;
                      }
                      .run-report-btn:hover {
                        background-color: #0d6efd !important;
                        border-color: #0d6efd !important;
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
                      /* Fix MultiSelect styling */
                      .p-multiselect {
                        display: flex;
                        align-items: center;
                      }
                      .p-multiselect .p-multiselect-label {
                        display: flex;
                        align-items: center;
                        padding: 0.5rem 0.75rem;
                        min-height: 38px;
                      }
                      .p-multiselect .p-multiselect-label.p-placeholder {
                        color: #6c757d;
                      }
                      .p-multiselect-token {
                        display: inline-flex;
                        align-items: center;
                        padding: 0.25rem 0.5rem;
                        margin-right: 0.25rem;
                        background-color: #e9ecef;
                        border-radius: 4px;
                        font-size: 0.875rem;
                      }
                      /* Responsive TabSwitcher */
                      .replication-tab-container {
                        width: 100%;
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: none;
                        -ms-overflow-style: none;
                      }
                      .replication-tab-container::-webkit-scrollbar {
                        display: none;
                      }
                      @media (max-width: 576px) {
                        .replication-tab-container .tab-switcher-container {
                          width: 100%;
                          margin-top: 0.5rem;
                        }
                        .replication-tab-container .tab-switcher {
                          width: 100%;
                          display: flex;
                          flex-wrap: nowrap;
                        }
                        .replication-tab-container .tab-item {
                          flex: 1;
                          min-width: auto;
                          width: auto;
                          padding: 6px 12px;
                          font-size: 0.75rem;
                        }
                      }
                    `}
                  </style>
                  <Button
                    label="Submit"
                    className="btn btn-primary w-100 run-report-btn"
                    onClick={handleSubmit}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Route Finalized Warning */}
        {isRouteFinalized && (
          <div className="row mt-3">
            <div className="col-12">
              <div className="alert alert-warning mb-0">
                {routeFinalizedMessage}
              </div>
            </div>
          </div>
        )}

        {/* No Data Placeholder */}
        {!hasSearched && (
          <div className="row mt-3">
            <div className="col-12">
              <div className="card_tb">
                <div
                  className="d-flex flex-column align-items-center justify-content-center p-5"
                  style={{ minHeight: "50vh" }}
                >
                  <img
                    src={noReportImage}
                    alt="No Data"
                    style={{
                      maxWidth: "100px",
                      opacity: 0.5,
                      marginBottom: "1rem",
                    }}
                  />
                  <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                    Please select above parameters and click Submit to view
                    exception data
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Switcher with Action Buttons - Same Row */}
        {hasSearched && (
          <div className="row mt-4">
            <div className="col-12">
              <style>
                {`
                  .tab-button-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                  }
                  .tab-button-row .action-buttons .report-button {
                    padding: 0.5rem 1rem !important;
                    font-size: 0.875rem !important;
                    height: auto !important;
                    white-space: nowrap !important;
                  }
                  @media (max-width: 768px) {
                    .tab-button-row {
                      flex-direction: column;
                      align-items: flex-start;
                      gap: 0.75rem;
                    }
                    .tab-button-row .action-buttons {
                      width: 100%;
                      justify-content: flex-start;
                    }
                  }
                `}
              </style>
              <div className="tab-button-row">
                {/* TabSwitcher on the left */}
                <div className="replication-tab-container">
                  <TabSwitcher
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />
                </div>
                
                {/* Action Buttons on the right */}
                <div className="d-flex gap-2 align-items-center action-buttons">
                  {activeTab === "delete" && (
                    <ReportButton
                      label="Delete Selected"
                      icon="pi pi-trash"
                      onClick={handleDeleteSelected}
                      disabled={selectedDeleteRows.length === 0 || loading}
                      fullWidth={false}
                    />
                  )}
                  {activeTab === "add" && (
                    <>
                      <ReportButton
                        label="Auto Allocation"
                        icon="pi pi-sync"
                        onClick={handleAutoAllocation}
                        disabled={addExceptionData.length === 0 || loading}
                        fullWidth={false}
                      />
                      <ReportButton
                        label="Align"
                        icon="pi pi-sitemap"
                        onClick={handleAlign}
                        disabled={selectedAddRows.length === 0 || loading}
                        fullWidth={false}
                      />
                      <ReportButton
                        label="New Route"
                        icon="pi pi-plus"
                        onClick={handleMakeNewRoute}
                        disabled={selectedAddRows.length === 0 || loading}
                        fullWidth={false}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table Section */}
        {hasSearched && (
          <div className="row">
            <div className="col-12">
              <div className="card_tb p-3 mt-3">
                {/* Delete Exception Tab */}
                {activeTab === "delete" && (
                  <div>
                    <TableToolbar
                      search={globalFilter}
                      onSearch={(e) => setGlobalFilter(e.target.value)}
                      onRefresh={handleRefresh}
                      onExport={exportDeleteToExcel}
                      showFilter={false}
                      showSearch={true}
                      showRefresh={true}
                      showExport={true}
                    />

                    <div className="table-responsive">
                      <CustomDataTable
                        key={`delete-${selectedDeleteRows.map(r => r.EmpId).join(',')}`}
                        ref={deleteTableRef}
                        value={getPaginatedDeleteData()}
                        size="small"
                        loading={loading}
                        emptyMessage="No Record Found!"
                        stripedRows
                        tableStyle={{ minWidth: "50rem" }}
                      >
                        <Column
                          header={deleteCheckboxHeaderTemplate}
                          body={deleteCheckboxBodyTemplate}
                          style={{ width: "3rem" }}
                        />
                        <Column
                          field="RouteId"
                          header="Route ID"
                          sortable
                          style={{ width: "10%" }}
                        />
                        <Column
                          field="shifttime"
                          header="Shift"
                          sortable
                          style={{ width: "8%" }}
                        />
                        <Column
                          field="empCode"
                          header="Employee ID"
                          sortable
                          style={{ width: "10%" }}
                        />
                        <Column
                          field="empName"
                          header="Employee Name"
                          sortable
                          style={{ width: "12%" }}
                        />
                        <Column
                          field="processName"
                          header="Process"
                          sortable
                          style={{ width: "10%" }}
                        />
                        <Column
                          field="mobile"
                          header="Mobile"
                          sortable
                          style={{ width: "10%" }}
                        />
                        <Column
                          field="stopNo"
                          header="Stop No"
                          sortable
                          style={{ width: "5%" }}
                        />
                        <Column
                          field="address"
                          header="Location"
                          sortable
                          style={{ width: "22%" }}
                        />
                        <Column
                          field="Reason"
                          header="Reason"
                          sortable
                          style={{ width: "10%" }}
                        />
                      </CustomDataTable>
                    </div>

                    <CustomPaginator
                      first={deleteFirst}
                      rows={deleteRows}
                      totalRecords={getFilteredDeleteData().length}
                      onPageChange={onDeletePageChange}
                      rowsPerPageOptions={[10, 20, 50]}
                    />
                  </div>
                )}

                {/* Add Exception Tab */}
                {activeTab === "add" && (
                  <div>
                    <TableToolbar
                      search={globalFilter}
                      onSearch={(e) => setGlobalFilter(e.target.value)}
                      onRefresh={handleRefresh}
                      onExport={exportAddToExcel}
                      showFilter={false}
                      showSearch={true}
                      showRefresh={true}
                      showExport={true}
                    />

                    <div className="table-responsive">
                      <CustomDataTable
                        key={`add-${selectedAddRows.map(r => r.empCode).join(',')}`}
                        ref={addTableRef}
                        value={getPaginatedAddData()}
                        size="small"
                        loading={loading}
                        emptyMessage="No Record Found!"
                        stripedRows
                        tableStyle={{ minWidth: "50rem" }}
                      >
                        <Column
                          header={addCheckboxHeaderTemplate}
                          body={addCheckboxBodyTemplate}
                          style={{ width: "3rem" }}
                        />
                        <Column
                          field="adhocid"
                          header="Request ID"
                          sortable
                          style={{ width: "8%" }}
                        />
                        <Column
                          field="empCode"
                          header="Employee ID"
                          sortable
                          style={{ width: "10%" }}
                        />
                        <Column
                          field="empName"
                          header="Employee Name"
                          sortable
                          style={{ width: "15%" }}
                        />
                        <Column
                          field="processName"
                          header="Process"
                          sortable
                          style={{ width: "12%" }}
                        />
                        <Column
                          field="mobile"
                          header="Mobile"
                          sortable
                          style={{ width: "10%" }}
                        />
                        <Column
                          field="Location"
                          header="Location"
                          sortable
                          style={{ width: "22%" }}
                        />
                        <Column
                          field="shift"
                          header="Shift"
                          sortable
                          style={{ width: "8%" }}
                        />
                        <Column
                          field="stype"
                          header="Type"
                          sortable
                          style={{ width: "8%" }}
                        />
                      </CustomDataTable>
                    </div>

                    <CustomPaginator
                      first={addFirst}
                      rows={addRows}
                      totalRecords={getFilteredAddData().length}
                      onPageChange={onAddPageChange}
                      rowsPerPageOptions={[10, 20, 50]}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Align Sidebar */}
      <MasterSidebar
        show={showAlignSidebar}
        onClose={() => { setShowAlignSidebar(false); setCutEmployee(null); }}
        title="Align Employees to Route"
        width="78%"
        id="alignSidebar"
        headerBgColor="bg-dark"
        headerTextColor="text-white"
        footerButtons={[
          {
            label: "Close",
            className: "btn btn-outline-secondary",
            onClick: () => { setShowAlignSidebar(false); setCutEmployee(null); },
          },
        ]}
      >
        <style>{`
          .align-sidebar-body { background: #f8fafc; min-height: 100%; }
          .align-top-bar {
            background: #fff;
            border-bottom: 1px solid #e2e8f0;
            padding: 16px 20px;
            position: sticky;
            top: 0;
            z-index: 10;
          }
          .align-emp-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            color: #1e40af;
            border-radius: 20px;
            padding: 4px 12px;
            font-size: 0.78rem;
            font-weight: 500;
          }
          .align-emp-chip .chip-code {
            font-weight: 700;
            color: #1d4ed8;
          }
          .align-move-banner {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #fffbeb;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 10px 14px;
            margin-top: 12px;
          }
          .align-search-wrap {
            position: relative;
            margin-top: 12px;
          }
          .align-search-wrap .search-icon {
            position: absolute;
            left: 11px;
            top: 50%;
            transform: translateY(-50%);
            color: #94a3b8;
            font-size: 0.85rem;
          }
          .align-search-wrap input {
            padding-left: 34px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            height: 38px;
            font-size: 0.85rem;
            width: 100%;
            outline: none;
            transition: border-color 0.2s;
            background: #fff;
          }
          .align-search-wrap input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
          .align-routes-list { padding: 16px 20px; }
          .align-route-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            margin-bottom: 10px;
            overflow: hidden;
            transition: box-shadow 0.2s;
          }
          .align-route-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
          .align-route-card.expanded { border-color: #93c5fd; box-shadow: 0 0 0 2px rgba(59,130,246,0.12); }
          .align-route-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            cursor: pointer;
            user-select: none;
          }
          .align-route-accent {
            width: 4px;
            align-self: stretch;
            border-radius: 4px 0 0 4px;
            background: #3b82f6;
            flex-shrink: 0;
            margin: -12px -16px -12px -16px;
            margin-right: 0;
            position: relative;
            left: -16px;
          }
          .align-route-accent.expanded-accent { background: #1d4ed8; }
          .align-expand-btn {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            cursor: pointer;
            transition: background 0.15s;
          }
          .align-expand-btn:hover { background: #e0f2fe; border-color: #93c5fd; }
          .align-route-info { flex: 1; min-width: 0; }
          .align-route-id {
            font-size: 0.9rem;
            font-weight: 700;
            color: #1e293b;
            letter-spacing: -0.01em;
          }
          .align-route-meta {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 4px;
            flex-wrap: wrap;
          }
          .align-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            border-radius: 5px;
            padding: 2px 8px;
            font-size: 0.72rem;
            font-weight: 600;
            white-space: nowrap;
          }
          .badge-stops { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
          .badge-shift { background: #ecfdf5; color: #166534; border: 1px solid #bbf7d0; }
          .badge-zone  { background: #faf5ff; color: #6b21a8; border: 1px solid #e9d5ff; }
          .align-route-location {
            font-size: 0.775rem;
            color: #64748b;
            margin-top: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .align-route-actions { display: flex; gap: 8px; flex-shrink: 0; align-items: center; }
          .btn-assign {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 7px;
            font-size: 0.8rem;
            font-weight: 600;
            background: #1C1D20;
            color: #fff;
            border: none;
            cursor: pointer;
            transition: background 0.2s;
            white-space: nowrap;
          }
          .btn-assign:hover:not(:disabled) { background: #2563eb; }
          .btn-assign:disabled { opacity: 0.5; cursor: not-allowed; }
          .btn-paste {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 7px;
            font-size: 0.8rem;
            font-weight: 600;
            background: #fffbeb;
            color: #92400e;
            border: 1.5px solid #f59e0b;
            cursor: pointer;
            transition: background 0.2s;
            white-space: nowrap;
          }
          .btn-paste:hover:not(:disabled) { background: #fef3c7; }
          .btn-paste:disabled { opacity: 0.5; cursor: not-allowed; }
          .align-emp-table-wrap {
            border-top: 1px solid #e2e8f0;
            background: #f8fafc;
          }
          .align-emp-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.8rem;
          }
          .align-emp-table thead tr {
            background: #f1f5f9;
            border-bottom: 1px solid #e2e8f0;
          }
          .align-emp-table thead th {
            padding: 8px 14px;
            text-align: left;
            font-size: 0.72rem;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .align-emp-table thead th.center { text-align: center; }
          .align-emp-table tbody tr {
            border-bottom: 1px solid #f1f5f9;
            transition: background 0.1s;
          }
          .align-emp-table tbody tr:hover { background: #f0f9ff; }
          .align-emp-table tbody tr.cut-row { background: #fefce8; opacity: 0.65; }
          .align-emp-table tbody td { padding: 10px 14px; color: #1e293b; vertical-align: middle; }
          .align-emp-table tbody td.center { text-align: center; }
          .emp-name-primary { font-weight: 600; font-size: 0.83rem; color: #0f172a; }
          .emp-name-secondary { font-size: 0.72rem; color: #94a3b8; margin-top: 1px; }
          .align-stop-input {
            width: 56px;
            text-align: center;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 5px 4px;
            font-size: 0.8rem;
            background: #fff;
            outline: none;
            transition: border-color 0.2s;
          }
          .align-stop-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.12); }
          .align-eta-wrap { display: flex; align-items: center; gap: 4px; justify-content: center; }
          .align-eta-input {
            width: 40px;
            text-align: center;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 5px 3px;
            font-size: 0.8rem;
            background: #fff;
            outline: none;
            transition: border-color 0.2s;
          }
          .align-eta-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.12); }
          .align-eta-sep { color: #94a3b8; font-weight: 700; font-size: 1rem; line-height: 1; }
          .btn-row-save {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 11px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
            background: #f0fdf4;
            color: #15803d;
            border: 1px solid #86efac;
            cursor: pointer;
            transition: background 0.15s;
            white-space: nowrap;
          }
          .btn-row-save:hover:not(:disabled) { background: #dcfce7; border-color: #4ade80; }
          .btn-row-save:disabled { opacity: 0.45; cursor: not-allowed; }
          .btn-row-move {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 11px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
            background: #fffbeb;
            color: #b45309;
            border: 1px solid #fcd34d;
            cursor: pointer;
            transition: background 0.15s;
            white-space: nowrap;
          }
          .btn-row-move:hover:not(:disabled) { background: #fef3c7; border-color: #f59e0b; }
          .btn-row-move:disabled { opacity: 0.45; cursor: not-allowed; }
        `}</style>

        <div className="align-sidebar-body">
          {/* Top sticky bar: selected employees + search */}
          <div className="align-top-bar">
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "10px" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Aligning
              </span>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e40af" }}>
                {selectedAddRows.length} employee{selectedAddRows.length !== 1 ? "s" : ""}
              </span>
              <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>— select a route below to assign</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {selectedAddRows.map((r) => (
                <span key={r.empCode} className="align-emp-chip">
                  <span className="chip-code">{r.empCode}</span>
                  <span style={{ color: "#475569" }}>{r.empName}</span>
                </span>
              ))}
            </div>

            {/* Cut/move banner */}
            {cutEmployee && (
              <div className="align-move-banner">
                <i className="pi pi-arrow-right-arrow-left" style={{ color: "#d97706", fontSize: "0.9rem", flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: "0.82rem", color: "#78350f" }}>
                  Moving <strong style={{ color: "#92400e" }}>{cutEmployee.empName}</strong> from{" "}
                  <strong style={{ color: "#92400e" }}>Route {cutEmployee.fromRouteId}</strong>
                  <span style={{ color: "#a16207" }}> — click <strong>Paste Here</strong> on the destination route</span>
                </div>
                <button
                  onClick={() => setCutEmployee(null)}
                  style={{ background: "none", border: "1px solid #d97706", borderRadius: "6px", color: "#92400e", padding: "3px 10px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Search */}
            <div className="align-search-wrap">
              <i className="pi pi-search search-icon" />
              <input
                type="text"
                placeholder="Search by route ID, address, zone or vendor..."
                value={alignRouteSearch}
                onChange={(e) => setAlignRouteSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Route list */}
          <div className="align-routes-list">
            {alignLoading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: "12px" }}>
                <i className="pi pi-spin pi-spinner" style={{ fontSize: "1.8rem", color: "#3b82f6" }} />
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Loading routes...</span>
              </div>
            )}

            {!alignLoading && alignRoutes.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: "0.85rem" }}>
                <i className="pi pi-inbox" style={{ fontSize: "2rem", display: "block", marginBottom: "10px", color: "#cbd5e1" }} />
                No routes found for the selected date, facility and shift.
              </div>
            )}

            {!alignLoading && alignRoutes
              .filter((route) => {
                if (!alignRouteSearch.trim()) return true;
                const q = alignRouteSearch.toLowerCase();
                return (
                  String(route.RouteId || route.RouteID || "").toLowerCase().includes(q) ||
                  String(route.Address || route.address || "").toLowerCase().includes(q) ||
                  String(route.Zone || route.zone || "").toLowerCase().includes(q) ||
                  String(route.Colony || route.colony || "").toLowerCase().includes(q) ||
                  String(route.vendorName || "").toLowerCase().includes(q)
                );
              })
              .map((route) => {
                const routeId = route.RouteId || route.RouteID;
                const isExpanded = !!expandedRouteIds[routeId];
                const emps = routeEmployees[routeId];
                const empsLoading = routeEmpLoading[routeId];
                const location = [route.Address || route.address, route.Colony || route.colony].filter(Boolean).join(", ");
                return (
                  <div key={routeId} className={`align-route-card${isExpanded ? " expanded" : ""}`}>
                    {/* Route header */}
                    <div className="align-route-header" onClick={() => toggleRouteExpand(routeId)}>
                      {/* Left accent bar */}
                      <div className={`align-route-accent${isExpanded ? " expanded-accent" : ""}`} />

                      {/* Expand icon */}
                      <div className="align-expand-btn">
                        <i
                          className={`pi ${isExpanded ? "pi-chevron-down" : "pi-chevron-right"}`}
                          style={{ fontSize: "0.7rem", color: "#64748b" }}
                        />
                      </div>

                      {/* Route info */}
                      <div className="align-route-info">
                        <div className="align-route-id">Route {routeId}</div>
                        <div className="align-route-meta">
                          <span className="align-badge badge-stops">
                            <i className="pi pi-map-marker" style={{ fontSize: "0.65rem" }} />
                            {route.totalStop || 0} stops
                          </span>
                          {route.shiftTime && (
                            <span className="align-badge badge-shift">
                              <i className="pi pi-clock" style={{ fontSize: "0.65rem" }} />
                              {route.shiftTime}
                            </span>
                          )}
                          {(route.Zone || route.zone) && (
                            <span className="align-badge badge-zone">{route.Zone || route.zone}</span>
                          )}
                        </div>
                        {location && <div className="align-route-location">{location}{route.vendorName ? ` · ${route.vendorName}` : ""}</div>}
                      </div>

                      {/* Action buttons */}
                      <div className="align-route-actions" onClick={(e) => e.stopPropagation()}>
                        {cutEmployee && (
                          <button className="btn-paste" onClick={() => handlePasteEmp(routeId)} disabled={alignLoading}>
                            <i className="pi pi-download" style={{ fontSize: "0.75rem" }} />
                            Paste Here
                          </button>
                        )}
                        <button className="btn-assign" onClick={() => handleAssignToRoute(routeId)} disabled={alignLoading}>
                          <i className="pi pi-check-circle" style={{ fontSize: "0.75rem" }} />
                          Assign Here
                        </button>
                      </div>
                    </div>

                    {/* Expanded employee table */}
                    {isExpanded && (
                      <div className="align-emp-table-wrap">
                        {empsLoading && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "16px 20px", color: "#64748b", fontSize: "0.82rem" }}>
                            <i className="pi pi-spin pi-spinner" />
                            Loading employees in this route...
                          </div>
                        )}
                        {!empsLoading && emps && emps.length === 0 && (
                          <div style={{ padding: "16px 20px", color: "#94a3b8", fontSize: "0.82rem", textAlign: "center" }}>
                            No employees currently assigned to this route.
                          </div>
                        )}
                        {!empsLoading && emps && emps.length > 0 && (
                          <div className="table-responsive">
                            <table className="align-emp-table">
                              <thead>
                                <tr>
                                  <th>Employee</th>
                                  <th>Location</th>
                                  <th className="center" style={{ width: "80px" }}>Stop #</th>
                                  <th className="center" style={{ width: "130px" }}>ETA (HH : MM)</th>
                                  <th className="center" style={{ width: "160px" }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {emps.map((emp, idx) => {
                                  const empId = emp.id || emp.empID || emp.empId || emp.EmpId || emp.EmployeeID;
                                  const editing = editingEmpData[routeId]?.[empId] || {};
                                  const isCut = cutEmployee?.empId === empId && cutEmployee?.fromRouteId === routeId;
                                  const gender = emp.gender || emp.Gender || "";
                                  return (
                                    <tr key={empId || idx} className={isCut ? "cut-row" : ""}>
                                      <td>
                                        <div className="emp-name-primary">{emp.empName || emp.EmpName}</div>
                                        <div className="emp-name-secondary">
                                          {emp.empCode || emp.EmpCode}
                                          {gender && <> · <span>{gender === "M" ? "Male" : gender === "F" ? "Female" : gender}</span></>}
                                        </div>
                                      </td>
                                      <td style={{ maxWidth: "180px" }}>
                                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#475569", fontSize: "0.8rem" }}>
                                          {emp.address || emp.Address || "—"}
                                        </div>
                                      </td>
                                      <td className="center">
                                        <input
                                          className="align-stop-input"
                                          type="number"
                                          min="0"
                                          value={editing.stopNo ?? ""}
                                          onChange={(e) =>
                                            setEditingEmpData((prev) => ({
                                              ...prev,
                                              [routeId]: { ...prev[routeId], [empId]: { ...editing, stopNo: e.target.value } },
                                            }))
                                          }
                                        />
                                      </td>
                                      <td className="center">
                                        <div className="align-eta-wrap">
                                          <input
                                            className="align-eta-input"
                                            type="text"
                                            maxLength={2}
                                            placeholder="HH"
                                            value={editing.ETAhh ?? "00"}
                                            onChange={(e) =>
                                              setEditingEmpData((prev) => ({
                                                ...prev,
                                                [routeId]: { ...prev[routeId], [empId]: { ...editing, ETAhh: e.target.value } },
                                              }))
                                            }
                                          />
                                          <span className="align-eta-sep">:</span>
                                          <input
                                            className="align-eta-input"
                                            type="text"
                                            maxLength={2}
                                            placeholder="MM"
                                            value={editing.ETAmm ?? "00"}
                                            onChange={(e) =>
                                              setEditingEmpData((prev) => ({
                                                ...prev,
                                                [routeId]: { ...prev[routeId], [empId]: { ...editing, ETAmm: e.target.value } },
                                              }))
                                            }
                                          />
                                        </div>
                                      </td>
                                      <td className="center">
                                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                          <button
                                            className="btn-row-save"
                                            onClick={() => handleSaveStopETA(routeId, emp)}
                                            disabled={isCut}
                                          >
                                            <i className="pi pi-save" style={{ fontSize: "0.72rem" }} />
                                            Save
                                          </button>
                                          <button
                                            className="btn-row-move"
                                            onClick={() => handleCutEmp(emp, routeId)}
                                            disabled={isCut}
                                          >
                                            <i className="pi pi-arrow-right-arrow-left" style={{ fontSize: "0.72rem" }} />
                                            Move
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </MasterSidebar>
    </>
  );
};

export default ReplicationException;
