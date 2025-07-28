import React, { useEffect, useState, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { MultiSelect } from "primereact/multiselect";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import ManageRouteService from "../services/compliance/ManageRouteService";
import { toastService } from "../services/toastService";
import OffcanvasRouteDetails from "./OffcanvasRouteDetails";
import { Sidebar as PrimeSidebar } from "primereact/sidebar";
import { ProgressBar } from "primereact/progressbar";
import { Dialog } from "primereact/dialog";
import { point, Point } from "leaflet";
import axios from "axios"; // Import axios here

import { OverlayPanel } from "primereact/overlaypanel";

import { Tooltip } from "primereact/tooltip";

import * as XLSX from "xlsx";
import { set } from "lodash";

const AddressColumnTemplate = (rowData) => {
  const maxLength = 40;
  const fullText = rowData.Address || "";
  const trimmedText =
    fullText.length > maxLength
      ? fullText.slice(0, maxLength) + "..."
      : fullText;

  return (
    <span
      data-pr-tooltip={fullText}
      data-pr-position="top"
      style={{
        cursor: "pointer",
        display: "inline-block",
        maxWidth: 200,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        verticalAlign: "middle",
      }}
    >
      {trimmedText}
    </span>
  );
};

const addressColumnTemplate = (rowData) => {
  const maxLength = 40;
  const fullText = rowData.address || "";
  const trimmedText =
    fullText.length > maxLength
      ? fullText.slice(0, maxLength) + "..."
      : fullText;

  return (
    <span
      data-pr-tooltip={fullText}
      data-pr-position="top"
      style={{
        cursor: "pointer",
        display: "inline-block",
        maxWidth: 200,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        verticalAlign: "middle",
      }}
    >
      {trimmedText}
    </span>
  );
};

// const AddressColumnTemplate = (rowData) => {
//   const maxLength = 20;
//   const fullText = rowData.Address; // Make sure the key matches the field name
//   const op = useRef(null);
//   const trimmedText =
//     fullText.length > maxLength
//       ? fullText.slice(0, maxLength) + "..."
//       : fullText;

//   return (
//     <>
//       <div className="d-flex justify-content-between">
//         <span>{trimmedText}</span>
//         {fullText.length > maxLength && (
//           <>
//             <span
//               onClick={(e) => op.current.toggle(e)}
//               className="pointer pe-3"
//             >
//               <i className="pi pi-eye" style={{ fontSize: "20px" }}></i>
//             </span>
//             <OverlayPanel ref={op} className="fullAddress" closeOnEscape>
//               {fullText}
//             </OverlayPanel>
//           </>
//         )}
//       </div>
//     </>
//   );
// };

const ManageRoute = () => {
  // First, add a state for sorting
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState(1);
  const [expandedRows, setExpandedRows] = useState(null);
  const toast = useRef(null);
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedTripType, setSelectedTripType] = useState("P");
  const [shifts, setShifts] = useState([]);
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [routeDetails, setRouteDetails] = useState({});
  const userID = sessionStorage.getItem("ID");
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(false);
  const [statsDetails, setStatsDetails] = useState(null);
  const [viewMap, setViewMap] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showGenerateRouteDialog, setShowGenerateRouteDialog] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [showAutoVendorAllocationDialog, setShowAutoVendorAllocationDialog] =
    useState(false);
  const [vendorAllocated, setVendorAllocated] = useState(false);
  const [vendorSummary, setVendorSummary] = useState([]);
  const [isFinalizing, setIsFinalizing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
  const tripTypeOptions = [
    { label: "Pick", value: "P" },
    { label: "Drop", value: "D" },
  ];
  const [routeStats, setRouteStats] = useState({
    TotalEmps: 0,
    TotalRoutes: 0,
    AvgOccupancy: 0,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Add state for progress dialog
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [progressStatus, setProgressStatus] = useState({
    step: 0,
    totalSteps: 4,
    message: "",
    progress: 0,
    isError: false,
    errorMessage: "",
  });
  const [shiftDate, setShiftDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  // Define queryParams in the component scope so it's available for the link
  // It will re-calculate whenever its dependencies change
  const queryParams = new URLSearchParams({
    sDate: shiftDate,
    FacilityID: selectedFacility,
    TripType: selectedTripType,
    Shifttimes: selectedShifts || "",
    Direction: "ASC", // As per your example
    Routeid: "", // As per your example
  }).toString();

  // Handle RouteID click to open the offcanvas
  const handleRouteClick = (routeId) => {
    setSelectedRouteId(routeId);
    setShowOffcanvas(true);
  };

  // Route ID column template with click functionality
  const routeIdTemplate = (rowData) => {
    return (
      <span
        className="cursor-pointer text-primary"
        onClick={() => handleRouteClick(rowData.RouteID)}
        style={{ cursor: "pointer", color: "#4285F4", fontWeight: "bold" }}
      >
        {rowData.RouteID}
      </span>
    );
  };

  useEffect(() => {
    fetchFacilities();
    // Only fetch shifts if facility is selected
    if (selectedFacility && selectedTripType) {
      fetchShifts();
    }
  }, [selectedFacility, selectedTripType]);
  const handleFileUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const fileExtension = file.name.split(".").pop().toLowerCase();
      if (!["xlsx", "xls", "csv"].includes(fileExtension)) {
        toastService.warn("Please upload only Excel or CSV files.");
        return;
      }

      setSelectedFile(file); // Store the selected file
      toastService.success("The file was selected successfully.");
    } catch (error) {
      console.error("Error selecting file:", error);
      toastService.error("There was an error during file selection.");
      setSelectedFile(null);
    }
  };
  // button
  const handleFinalizeRoute = async () => {
    setIsSubmitting(true);
    setIsFinalizing(true);
    try {
      // Step 1: Call WBS_GetBulkRouteData API
      const params = {
        sDate: shiftDate,
        eDate: shiftDate,
        facilityid: selectedFacility,
        triptype: selectedTripType,
        shifttimes: selectedShifts,
      };

      const bulkRouteData = await ManageRouteService.WBS_GetBulkRouteData(
        params
      );

      // Step 2: Push data to the UpdateTripsheetDetail API
      if (bulkRouteData && bulkRouteData.length > 0) {
        // Assuming bulkRouteData is already in the format expected by UpdateTripsheetDetail
        await pushDataToUpdateTripsheetDetail(bulkRouteData);
        console.log("Bulk route data pushed successfully:", bulkRouteData);
        toastService.success(
          "Route finalization and data push completed successfully."
        );
      } else {
        toastService.warn("No route data available to finalize.");
      }
    } catch (error) {
      console.error("Error finalizing routes:", error);
      toastService.error(
        "Finalization and data push failed. Please try again."
      );
    } finally {
      setIsFinalizing(false);
      setIsSubmitting(false);
    }
  };

  // filepath: c:\Users\Admin\Downloads\New eTMS\etms (1)\src\components\ManageRoute.jsx
  const pushDataToUpdateTripsheetDetail = async (data) => {
    try {
      const pushUrl = "/etmsApi/UpdateTripsheetDetail"; // Corrected URL
      const response = await axios.post(pushUrl, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 201) {
        console.log("Data pushed successfully:", response.data);
        //toastService.success("Data pushed successfully!");
      } else {
        console.error(
          "Failed to push data:",
          response.status,
          response.statusText
        );
        toastService.error(
          `Failed to push data. Status:  ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error pushing data to UpdateTripsheetDetail:", error);
      toastService.error("Data push failed.");
    }
  };

  const handleAutoVendorAllocation = async () => {
    setShowAutoVendorAllocationDialog(true);
  };

  const confirmAutoVendorAllocation = async () => {
      setIsSubmitting(true);
    try {
      setShowAutoVendorAllocationDialog(false);
      setIsLoading(true);
      const params = {
        facid: selectedFacility,
        sDate: shiftDate,
        uname: userID,
        triptype: selectedTripType,
        shifttime: selectedShifts,
      };

      const response = await ManageRouteService.AutoVendorAllocationNew(params);
      toastService.success("Vendor allocation process completed successfully.");
      setVendorAllocated(true);
      await handleSubmit(); // Refresh the routes after allocation
      console.log("Vendor allocation response:", response);
    } catch (error) {
      console.error("Error during auto vendor allocation:", error);
      toastService.error("Vendor allocation process failed to complete.");
      setVendorAllocated(false); // Ensure it's false in case of error
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };
  const handleSaveFile = async () => {
    try {
      if (!selectedFile) {
        toastService.warn("Please select a file first");
        return;
      }

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("facilityId", selectedFacility);
      formData.append("tripType", selectedTripType);
      formData.append("shiftDate", shiftDate);

      // Here you would make your API call to save the file
      // const response = await ManageRouteService.uploadRouteFile(formData);

      toastService.success("File uploaded successfully");
      setSelectedFile(null); // Clear the selected file after successful upload
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toastService.error("An error occurred during file upload.");
    }
  };

  const fetchFacilities = async () => {
    try {
      const response = await ManageRouteService.SelectBaseFacility({
        userid: userID,
      });
      //console.log("Facility Data Manage Route", response);

      // Parse response if it's a string
      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;

      // Ensure we have an array and map it correctly
      const formattedData = Array.isArray(parsedResponse)
        ? parsedResponse.map((item) => ({
            label: item.facility || item.facilityName, // Using facility or facilityName from your API response
            value: item.Id, // Using Id from your API response
          }))
        : [];

      // console.log("Formatted Data:", formattedData);
      setFacilities(formattedData);
    } catch (error) {
      console.error("Failed to fetch facilities:", error);
      toastService.error("An error occurred while loading facilities.");
      // toast.current.show({
      //     severity: "error",
      //     summary: "Error",
      //     detail: "Failed to load facilities",
      //     life: 3000,
      // });
    }
  };
  const fetchShifts = async () => {
    try {
      if (selectedFacility && selectedTripType) {
        const response = await ManageRouteService.GetShiftByFacilityType({
          facid: selectedFacility,
          type: selectedTripType,
        });
        //console.log("Shifts Response:", response);

        // Parse response if it's a string
        const parsedResponse =
          typeof response === "string" ? JSON.parse(response) : response;

        // Format the shift data according to the API structure
        const formattedShifts = Array.isArray(parsedResponse)
          ? parsedResponse.map((shift) => ({
              label: shift.shiftTime || shift.ShiftTime, // Handle both cases
              value: shift.shiftTime || shift.ShiftTime, // Using shiftTime as value too
            }))
          : [];

        //console.log("Formatted Shifts:", formattedShifts);
        setShifts(formattedShifts);
      }
    } catch (error) {
      console.error("Failed to fetch shifts:", error);
      toastService.error("An error occurred while loading shifts.");
      // toast.current.show({
      //     severity: "error",
      //     summary: "Error",
      //     detail: "Failed to load shifts",
      //     life: 3000,
      // });
    }
  };
  const overlayStyles = `
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(4px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        .loader {
            width: 48px;
            height: 48px;
            border: 5px solid #3b82f6;
            border-bottom-color: transparent;
            border-radius: 50%;
            animation: rotation 1s linear infinite;
        }
        @keyframes rotation {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
  const durationTemplate = (rowData) => {
    const minutes = parseInt(rowData.duration);
    if (isNaN(minutes)) return "";

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    // Format to ensure two digits with leading zeros
    const formattedHours = hours.toString().padStart(2, "0");
    const formattedMinutes = remainingMinutes.toString().padStart(2, "0");

    return `${formattedHours}:${formattedMinutes}`;
  };
  const handleExportExcel = async (e) => {
    e.preventDefault();
    try {
      const response = await ManageRouteService.GetRoutesExportExcel({
        sDate: shiftDate,
        eDate: shiftDate,
        facilityid: selectedFacility,
        triptype: selectedTripType,
        shifttimes: selectedShifts,
      });

      // Parse the JSON response
      const data = JSON.parse(response);

      // Process data to handle HTML formatting
      const processedData = data.map((row) => {
        // Create a temporary div to parse HTML content
        const div = document.createElement("div");
        div.innerHTML = row.mobile;

        // Extract text content and check for HTML formatting
        const mobileText = div.textContent || div.innerText;
        const hasRedColor = div.querySelector('font[color="Red"]') !== null;

        return {
          ...row,
          mobile: mobileText, // Store clean mobile number
        };
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(processedData);

      // Get the column headers and make them bold
      const headers = Object.keys(processedData[0]);
      const range = XLSX.utils.decode_range(worksheet["!ref"]);

      // Style all headers bold
      headers.forEach((header, index) => {
        const headerCell = XLSX.utils.encode_cell({ r: 0, c: index });
        worksheet[headerCell].s = {
          font: { bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: "E0E0E0" } },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };
      });

      // Style data rows
      for (let row = range.s.r + 1; row <= range.e.r; row++) {
        const gender =
          worksheet[
            XLSX.utils.encode_cell({ r: row, c: headers.indexOf("Gender") })
          ]?.v;

        headers.forEach((header, col) => {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (!worksheet[cellRef]) {
            worksheet[cellRef] = { v: "" };
          }

          // Base style for all cells
          const baseStyle = {
            alignment: {
              horizontal: "left",
              vertical: "center",
              wrapText: true,
            },
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" },
            },
          };

          if (gender === "Female") {
            if (header === "mobile") {
              // Special style for female mobile numbers
              worksheet[cellRef].s = {
                ...baseStyle,
                font: { color: { rgb: "FF0000" }, bold: true },
                fill: { fgColor: { rgb: "FFB6C1" } },
              };
            } else {
              // Style for other cells in female rows
              worksheet[cellRef].s = {
                ...baseStyle,
                fill: { fgColor: { rgb: "FFC0CB" } },
              };
            }
          } else {
            worksheet[cellRef].s = baseStyle;
          }
        });
      }

      // Set column widths based on content
      const columnWidths = headers.map((header) => {
        const maxLength = Math.max(
          header.length,
          ...processedData.map((row) => String(row[header] || "").length)
        );
        return { wch: maxLength + 2 };
      });
      worksheet["!cols"] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Routes");

      // Generate Excel file with styles
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
        cellStyles: true,
      });

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Routes_${shiftDate}.xlsx`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toastService.success("Download of Excel file completed successfully.");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toastService.error("Excel export failed. Please try again.");
    }
  };
  const handleGenerateRoute = async () => {
    try {
      setShowGenerateRouteDialog(false); // Close the confirmation dialog
      setShowProgressDialog(true);
      setProgressStatus({
        step: 1,
        totalSteps: 4,
        message: "Fetching route input data...",
        progress: 25,
        isError: false,
        errorMessage: "",
      });
      // Step 1: Get Route Input JSON
      const routeInputResponse = await ManageRouteService.GetRouteInputJson({
        facilityid: selectedFacility,
        sDate: shiftDate,
        triptype: selectedTripType,
        shifttime: selectedShifts,
        locationID: "",
        updatedBy: userID,
      });
      // Parse the response if it's a string
      let routeInputData;
      try {
        routeInputData =
          typeof routeInputResponse === "string"
            ? JSON.parse(routeInputResponse)
            : routeInputResponse;
        console.log("Parsed Route Input Data:", routeInputData);
      } catch (parseError) {
        console.error("Error parsing route input JSON:", parseError);
        throw new Error("Invalid route input data format");
      }
      setProgressStatus((prev) => ({
        ...prev,
        step: 2,
        message: "Route generation in Progress",
        progress: 50,
      }));
      // Step 2: Call local OSRM server for route generation
     const osrmResponse = await fetch(
        "https://ftqbvxxmpm.ap-south-1.awsapprunner.com/api/route-generation/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Origin: "http://localhost:5173",
          },
          mode: "cors",
          credentials: "omit",
          body: JSON.stringify(routeInputData),
        }
      );
      if (!osrmResponse.ok) {
        throw new Error(
          `Failed to generate route from OSRM server: ${osrmResponse.status} ${osrmResponse.statusText}`
        );
      }
      const generatedRouteJson = await osrmResponse.json();
      setProgressStatus((prev) => ({
        ...prev,
        step: 3,
        message: "Saving generated route...",
        progress: 75,
      }));
      // Step 3: Save the generated route
      const saveResponse = await ManageRouteService.save_routesMapBasedNew({
        facilityid: selectedFacility,
        sDate: shiftDate,
        triptype: selectedTripType,
        shifttime: selectedShifts,
        jsonstring: JSON.stringify(generatedRouteJson),
        updatedBy: 0,
      });
      setProgressStatus((prev) => ({
        ...prev,
        step: 4,
        message: "Finalizing route generation...",
        progress: 100,
      }));
      // Step 4: Fetch and display the newly generated routes
      const response = await ManageRouteService.GetRoutesByOrder({
        sDate: shiftDate,
        eDate: shiftDate,
        FacilityID: selectedFacility,
        TripType: selectedTripType,
        Shifttimes: selectedShifts,
        OrderBy: "Routeno",
        Direction: "ASC",
        Routeid: "",
        occ_seater: -2,
      });

      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      setTableData(parsedResponse || []);
      // --- VENDOR SUMMARY API CALL (always ensure array) ---
      const params = {
        sdate: shiftDate,
        edate: shiftDate,
        triptype: selectedTripType,
        facilityid: selectedFacility,
        shifttime: selectedShifts,
      };
      let vendorData = await ManageRouteService.getvehtypeCountVendorwise(
        params
      );
      if (typeof vendorData === "string") {
        try {
          vendorData = JSON.parse(vendorData);
        } catch {
          vendorData = [];
        }
      }
      if (!Array.isArray(vendorData)) {
        vendorData = [];
      }
      setVendorSummary(vendorData);
      // Fetch updated stats
      const statsResponse = await ManageRouteService.GetRoutesStatistics({
        sdate: shiftDate,
        edate: shiftDate,
        triptype: selectedTripType,
        facilityid: selectedFacility,
        shifttime: selectedShifts,
      });

      const parsedStatsResponse =
        typeof statsResponse === "string"
          ? JSON.parse(statsResponse)
          : statsResponse;
      setStatsDetails(parsedStatsResponse);
      if (parsedStatsResponse && parsedStatsResponse.length > 0) {
        setRouteStats({
          TotalEmps: parsedStatsResponse[0].TotalEmps || 0,
          TotalRoutes: parsedStatsResponse[0].TotalRoutes || 0,
          AvgOccupancy: parsedStatsResponse[0].AvgOccupancy || 0,
        });
      } else {
        setRouteStats({ TotalEmps: 0, TotalRoutes: 0, AvgOccupancy: 0 });
      }
      // Show success message and close progress dialog after a delay
      setProgressStatus((prev) => ({
        ...prev,
        message: "Routes generated successfully!",
        progress: 100,
      }));
      setShowButtons(true);
      setTimeout(() => {
        setShowProgressDialog(false);
        toastService.success(
          "Route generation and save completed successfully."
        );
      }, 2000);
    } catch (error) {
      console.error("Error in route generation:", error);
      setVendorSummary([]);
      setProgressStatus((prev) => ({
        ...prev,
        isError: true,
        errorMessage:
          error.message || "Route generation failed. Please try again.",
      }));
      toastService.error(
        error.message || "Route generation failed. Please try again."
      );
    } finally {
      setShowProgressDialog(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setVendorSummary([]); // Clear previous vendor summary
      setTableData([]); // Clear previous table data
      setStatsDetails([]); // Clear previous stats
      setRouteStats({
        TotalEmps: 0,
        TotalRoutes: 0,
        AvgOccupancy: 0,
      });
      setShowButtons(false);
      if (!selectedFacility) {
        toastService.warn("Please select a facility.");
        return;
      }
      if (selectedShifts.length === 0) {
        toastService.warn("Please select at least one shift.");
        return;
      }
      const validateResponse = await ManageRouteService.sp_validateEmpRoster({
        facilityid: selectedFacility,
        sDate: shiftDate,
        triptype: selectedTripType,
        shifttime: selectedShifts,
      });
      let parsedValidateResponse;
      if (typeof validateResponse === "string") {
        if (validateResponse.includes("[") && validateResponse.includes("]")) {
          const parsedArray = JSON.parse(validateResponse);
          parsedValidateResponse = parsedArray[0]?.Result;
        } else {
          parsedValidateResponse = parseInt(validateResponse);
        }
      } else if (Array.isArray(validateResponse)) {
        parsedValidateResponse = validateResponse[0]?.Result;
      } else {
        parsedValidateResponse = validateResponse;
      }

      if (parsedValidateResponse === 1) {
        const response = await ManageRouteService.GetRoutesByOrder({
          sDate: shiftDate,
          eDate: shiftDate,
          FacilityID: selectedFacility,
          TripType: selectedTripType,
          Shifttimes: selectedShifts,
          OrderBy: sortField || "Routeno", // Use sortField if available
          Direction: sortOrder === 1 ? "ASC" : "DESC",
          Routeid: "",
          occ_seater: -2,
        });
        console.log("Routes Response:", response);
        const parsedResponse =
          typeof response === "string" ? JSON.parse(response) : response;
        setTableData(parsedResponse || []);
        toastService.success("Route data loaded successfully.");
        // Call the vendor summary API
        const params = {
          sdate: shiftDate,
          edate: shiftDate,
          triptype: selectedTripType,
          facilityid: selectedFacility,
          shifttime: selectedShifts,
        };
        let vendorData = await ManageRouteService.getvehtypeCountVendorwise(
          params
        );
        if (typeof vendorData === "string") {
          try {
            vendorData = JSON.parse(vendorData);
          } catch {
            vendorData = [];
          }
        }
        console.log("Vendor Summary Data:", vendorData);
        setVendorSummary(vendorData);
        // Fetch route statistics
        const statsResponse = await ManageRouteService.GetRoutesStatistics({
          sdate: shiftDate,
          edate: shiftDate,
          triptype: selectedTripType,
          facilityid: selectedFacility,
          shifttime: selectedShifts,
        });

        const parsedStatsResponse =
          typeof statsResponse === "string"
            ? JSON.parse(statsResponse)
            : statsResponse;
        setStatsDetails(parsedStatsResponse);
        if (parsedStatsResponse && parsedStatsResponse.length > 0) {
          setRouteStats({
            TotalEmps: parsedStatsResponse[0].TotalEmps || 0,
            TotalRoutes: parsedStatsResponse[0].TotalRoutes || 0,
            AvgOccupancy: parsedStatsResponse[0].AvgOccupancy || 0,
          });
        } else {
          setRouteStats({
            TotalEmps: 0,
            TotalRoutes: 0,
            AvgOccupancy: 0,
          });
        }
        setShowButtons(true);
      } else if (parsedValidateResponse === 2) {
        setTableData([]);
        setRouteStats({
          TotalEmps: 0,
          TotalRoutes: 0,
          AvgOccupancy: 0,
        });
        toastService.error("The Roster is not available.");
        setShowButtons(false);
      } else if (parsedValidateResponse === 0) {
        setShowGenerateRouteDialog(true);
        setShowButtons(false);
      } else {
        console.error(
          "Unexpected validation response:",
          parsedValidateResponse
        );
        toastService.error("Invalid response from server");
      }
    } catch (error) {
      console.error("Failed to process request:", error);
      setIsLoading(false);
      setVendorSummary([]);
      setTableData([]);
      setRouteStats({
        TotalEmps: 0,
        TotalRoutes: 0,
        AvgOccupancy: 0,
      });
      toastService.error("Failed to process request");
      setShowButtons(false);
    }
  };
  // const stopEditor = (options) => {
  //     return (
  //         <InputText
  //             type="text"
  //             value={options.value}
  //             onChange={(e) =>
  //                 options.editorCallback(e.target.
  //                     value.slice(0, 2))}
  //             style={{ width: '50px' }}
  //             maxLength={2}
  //         />
  //     );
  // };
  // Update the rowExpansionTemplate function
  const rowExpansionTemplate = (rowData) => {
    // Fetch details if not already loaded
    if (!routeDetails[rowData.RouteID]) {
      ManageRouteService.GetRoutesDetailsnew({
        RouteID: rowData.RouteID,
        isAdd: 0,
      })
        .then((response) => {
          const parsedResponse =
            typeof response === "string" ? JSON.parse(response) : response;
          setRouteDetails((prev) => ({
            ...prev,
            [rowData.RouteID]: parsedResponse,
          }));
        })
        .catch((error) => {
          console.error("Error fetching route details:", error);
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "Failed to load route details",
            life: 3000,
          });
        });
    }

    return (
      <div className="bg-custom">
        <div className="p-0">
          <DataTable
            value={routeDetails[rowData.RouteID] || []}
            emptyMessage="No Record Found."
            editMode="cell"
          >
            <coloumn
              field=""
              header=""
              body={(rowData) => (
                <div className="d-flex gap-2">
                  {rowData.isPWD && (
                    <img
                      src="images/icons/pwd.png"
                      alt="Edit"
                      style={{
                        cursor: "pointer",
                        width: "20px",
                        height: "20px",
                      }}
                      title="PWD"
                    />
                  )}
                  {rowData.isOOB && (
                    <img
                      src="images/icons/oob.png"
                      alt="OOB"
                      style={{
                        cursor: "pointer",
                        width: "20px",
                        height: "20px",
                      }}
                      title="OOB"
                    />
                  )}
                  {rowData.isNMT && (
                    <img
                      src="images/icons/non-motorable.png"
                      alt="NMT"
                      style={{
                        cursor: "pointer",
                        width: "20px",
                        height: "20px",
                      }}
                      title="Non Motorable"
                    />
                  )}
                  {rowData.isMedical && (
                    <img
                      src="images/icons/medical.png"
                      alt="Delete"
                      style={{
                        cursor: "pointer",
                        width: "20px",
                        height: "20px",
                      }}
                      title="Medical Required"
                    />
                  )}
                  {/* <img
                                        src="images/icons/swap.png"
                                        alt="Swap"
                                        style={{ cursor: 'pointer', width: '20px', height: '20px' }}
                                        title="Swap"
                                    /> */}
                </div>
              )}
            ></coloumn>
            <Column
              field="empCode"
              header="Employee"
              body={(rowData) => `${rowData.empCode} - ${rowData.empName}`}
            />
            <Column
              field="Gender"
              header=""
              body={(rowData) => {
                if (rowData.Gender === "M") {
                  return (
                    <span className="badge bg-primary-subtle rounded-pill text-dark">
                      M
                    </span>
                  );
                } else if (rowData.Gender === "F") {
                  return (
                    <span className="badge bg-danger-subtle rounded-pill text-dark">
                      F
                    </span>
                  );
                }
              }}
            />
            <Column
              field="address"
              header="Address"
              body={addressColumnTemplate}
            />
            {/* <Column field="Colony" header="Colony" /> */}
            <Column
              field="Location"
              header="Location"
              body={addressColumnTemplate}
            />
            {/* <Column field="landmark" header="Nodal Point" /> */}
            <Column field="Shift" header="Shift" />
            <Column field="tripType" header="" />
            <Column
              field="stopNo"
              header="Stop"
              body={(rowData) => (
                <InputText value={rowData.stopNo} style={{ width: "50px" }} />
              )}
              editor={(options) => (
                <InputText
                  value={options.value}
                  onChange={(e) =>
                    options.editorCallback(e.target.value.slice(0, 2))
                  }
                  style={{ width: "50px" }}
                  maxLength={2}
                />
              )}
              style={{ width: "180px" }}
            />
            <Column
              field=""
              header="ETA"
              body={(rowData) => (
                <InputText
                  value={`${rowData.ETAhh || "00"}:${rowData.ETAmm || "00"}`}
                  style={{ width: "85px" }}
                />
              )}
              style={{ width: "180px" }}
            />
          </DataTable>
          <Tooltip target="[data-pr-tooltip]" />
        </div>
      </div>
    );
  };

  // const onRowExpand = (event) => {
  //   toast.current.show({
  //     severity: 'info',
  //     summary: 'Route Expanded',
  //     detail: `Route ${event.data.RouteID}`,
  //     life: 3000
  //   });
  // };

  // const onRowCollapse = (event) => {
  //   toast.current.show({
  //     severity: 'success',
  //     summary: 'Route Collapsed',
  //     detail: `Route ${event.data.RouteID}`,
  //     life: 3000
  //   });
  // };

  const expandAll = () => {
    let _expandedRows = {};

    // Use 'data' instead of 'products'
    data.forEach((p) => (_expandedRows[`${p.id}`] = true));

    setExpandedRows(_expandedRows);
  };

  const collapseAll = () => {
    setExpandedRows(null);
  };

  const allowExpansion = (rowData) => {
    return rowData.details && rowData.details.length > 0;
  };

  // const rowExpansionTemplate1 = (rowData) => {
  //     return (
  //         <div className="bg-custom">
  //             <div className="p-0">
  //                 {/* <h6 className="m-3 pageTitle">Details for Route {rowData.RouteID}</h6> */}
  //                 <DataTable value={rowData.details}>
  //                     <Column field="Employee" header="Employee" />
  //                     <Column field="Address" header="Address" />
  //                     <Column field="Location" header="Location" />
  //                     <Column field="NodalPoint" header="Nodal Point" />
  //                     <Column field="Shift" header="Shift" />
  //                     <Column field="Stop" header="Stop" />
  //                     <Column field="ETA" header="ETA" />
  //                 </DataTable>
  //             </div>
  //         </div>
  //     );
  // };

  // Add state for shift date

  // const header = (
  //     <div className="flex flex-wrap justify-content-end gap-2">
  //         <Button icon="pi pi-plus" label="Expand All" onClick={expandAll} text />
  //         <Button icon="pi pi-minus" label="Collapse All" onClick={collapseAll} text />
  //     </div>
  // );

  return (
    <>
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
      {/* <style>{overlayStyles}</style> */}
      {/* Add the loading overlay */}
      {/* {isLoading && (
                <div className="loading-overlay">
                    <div className="loader"></div>
                </div>
            )} */}
      <Header
        mainTitle="Transport"
        pageTitle="Manage Route"
        showNewButton={false}
      />
      <Sidebar />
      <div className="middle">
        <div className="row">
          {/* <div className="col-12">
                        <h6 className="pageTitle">Route Editing Window</h6>
                    </div> */}
        </div>

        <div className="row">
          <div className="col-8">
            <div className="card_tb p-3">
              <div className="row">
                {/* <div className="col-2">
                  <label htmlFor="">Shift Date</label>
                  <InputText
                    type="date"
                    className="w-100"
                    placeholder="Trips for the Day"
                  />
                </div> */}
                <div className="col">
                  <label htmlFor="">Shift Date</label>
                  <InputText
                    type="date"
                    className="w-100"
                    placeholder="Trips for the Day"
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                  />
                </div>
                <div className="col">
                  <label htmlFor="">Facility Name</label>
                  <Dropdown
                    id="facility"
                    placeholder="Select Facility"
                    className="w-100"
                    filter
                    value={selectedFacility || null}
                    onChange={(e) => setSelectedFacility(e.value)}
                    options={facilities}
                    optionLabel="label"
                    optionValue="value"
                  />
                </div>
                <div className="col">
                  <label htmlFor="tripType">Trip Type</label>
                  <Dropdown
                    id="tripType"
                    value={selectedTripType || "P"}
                    options={tripTypeOptions}
                    onChange={(e) => setSelectedTripType(e.value)}
                    placeholder="Select Trip Type"
                    className="w-100"
                    filter
                  />
                </div>
                <div className="col">
                  <label htmlFor="shift">Shift</label>
                  <Dropdown
                    filter
                    id="shift"
                    value={selectedShifts || []}
                    options={shifts}
                    onChange={(e) => setSelectedShifts(e.value)}
                    optionLabel="label"
                    placeholder="Select Shifts"
                    maxSelectedLabels={3}
                    className="w-full md:w-20rem w-100"
                  />
                </div>
                <div className="col no-label">
                  <Button
                    // icon={isLoading ? "pi pi-spinner pi-spin" : "pi pi-check"}
                    className="btn btn-primary"
                    label={isLoading ? "Loading..." : "Submit"}
                    onClick={handleSubmit}
                    disabled={isLoading}
                  />
                </div>
                <div className="col-2 no-label" style={{ display: "none" }}>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                  />
                  <div className="d-flex align-items-center gap-2">
                    <Button
                      className="btn btn-primary"
                      label="Upload"
                      onClick={() => fileInputRef.current.click()}
                    />
                    {selectedFile && (
                      <>
                        <span className="mx-2">{selectedFile.name}</span>
                        <Button
                          className="btn btn-success"
                          label="Save"
                          onClick={handleSaveFile}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-4">
            <div className="card_tb">
              <div className="cardNew1 w-100">
                <ul className="d-flex justify-content-between">
                  <li>
                    <h3>
                      <strong>{routeStats.TotalEmps}</strong>
                    </h3>
                    <span className="subtitle_sm text-danger">Employees</span>
                    {/* <span className="overline_text text-warning">Employee</span> */}
                  </li>
                  <li>
                    <div>
                      <h3>
                        <strong>{routeStats.AvgOccupancy}</strong>
                      </h3>
                      <span
                        className="subtitle_sm text-warning"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        Avg. Occupancy
                      </span>
                    </div>
                  </li>
                  <li className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3>
                        <strong>{routeStats.TotalRoutes}</strong>
                      </h3>
                      <span className="subtitle_sm text-success">
                        Routes <br />
                        {/* <span className="d-flex">Avg. <span className="text-dark fw-bold">{routeStats.AvgOccupancy}</span></span> */}
                      </span>
                    </div>
                    <div>
                      {/* MODIFIED LINK HERE */}
                      <a
                        href={`/RouteMap?${queryParams}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className=""
                        data-pr-tooltip="View All Routes"
                        data-pr-position="left"
                      >
                        <Tooltip target="[data-pr-tooltip]" />
                        {/* <span className="material-icons text-danger mt-2 d-block">room</span> */}
                        <img src="/images/icons/fold_map.png" alt="Map" />
                      </a>
                      <a
                        className="subtitle_sm text-primary d-block"
                        style={{ marginTop: "8px", cursor: "pointer" }}
                        onClick={() => setShowDetailsSidebar(true)}
                        data-pr-tooltip="View Route Statistics"
                        data-pr-position="left"
                      >
                        <img src="/images/icons/analysis.png" alt="Map" />
                      </a>
                      <Tooltip target="[data-pr-tooltip]" />
                      {/* <strong>{routeStats.AvgOccupancy}</strong> */}
                      {/* <Button
                                                icon="pi pi-info-circle"
                                                className="subtitle_sm text-primary"
                                                onClick={() => setShowDetailsSidebar(true)}
                                                style={{
                                                    padding: '0',
                                                    textDecoration: 'underline',
                                                    color: '#2196F3',
                                                    marginTop: '8px',
                                                    cursor: 'pointer'
                                                }}
                                                label="Details"
                                            /> */}
                    </div>
                  </li>
                </ul>
                {/* <span className="overline_text text-success d-block border-top text-center py-1"> Avg.</span> */}
              </div>
            </div>
          </div>
        </div>
        {showButtons && (
          <div className="row mt-3">
            <div className="col-12">
              <button
                type="button"
                className="btn btn-outline-secondary me-3"
                id="VendorAllocation"
                onClick={handleAutoVendorAllocation}
                disabled={isLoading}
              >
                {isLoading ? "Allocating..." : "Auto Vendor Allocation"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                id="FinalizeRoute"
                onClick={handleFinalizeRoute}
                disabled={isFinalizing}
              >
                {isFinalizing ? "Finalizing..." : "Finalize Route"}
              </button>
            </div>
          </div>
        )}
        {/* {showButtons && (
          <div className="row mt-3">
            <div className="col-12">
              <button
                type="button"
                className="btn btn-outline-secondary me-3"
                id="VendorAllocation"
                onClick={handleAutoVendorAllocation}
                disabled={isLoading || vendorAllocated}
              >
                {isLoading ? "Allocating..." : "Auto Vendor Allocation"}
              </button>
              {vendorAllocated && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  id="FinalizeRoute"
                  onClick={handleFinalizeRoute}
                  disabled={isFinalizing}
                >
                  {isFinalizing ? "Finalizing..." : "Finalize Route"}
                </button>
              )}
            </div>
          </div>
        )} */}
        {/* {showButtons && (
          <div className="row mt-3">
            <div className="col-12">
              <img
                src={
                  isLoading
                    ? "/images/icons/map.png"
                    : "/images/icons/allocation.png"
                } // Replace with your image paths
                alt={isLoading ? "Allocating..." : "Auto Vendor Allocation"}
                style={{
                  width: "30px", // Adjust size as needed
                  height: "auto",
                  cursor: "pointer",
                  marginRight: "10px",
                  opacity: isLoading ? 0.5 : 1, // Optional: reduce opacity when loading
                }}
                onClick={handleAutoVendorAllocation}
                disabled={isLoading}
                title="Auto Vendor Allocation"
              />
              <img
                src={
                  isFinalizing
                    ? "/images/icons/allocation.png"
                    : "/images/icons/map.png"
                } // Replace with your image paths
                alt={isFinalizing ? "Finalizing..." : "Finalize Route"}
                style={{
                  width: "30px", // Adjust size as needed
                  height: "auto",
                  cursor: "pointer",
                  opacity: isFinalizing ? 0.5 : 1, // Optional: reduce opacity when finalizing
                }}
                onClick={handleFinalizeRoute}
                disabled={isFinalizing}
                title="Finalize Route"
              />
            </div>
          </div>
        )} */}

        {/* Table */}
        <div className="row">
          <div className="col-12">
            <div className="card_tb">
              <div className="row">
                <div className="col-12 text-end d-flex justify-content-end">
                  {/* <a href="#!" className="me-3 mt-3 d-block text-dark"><span className="material-icons">
                                        refresh
                                    </span></a> */}
                  <a
                    href="#!"
                    className="me-3 mt-3 d-block text-dark mb-1"
                    onClick={handleExportExcel}
                    // title="Export to Excel"
                    data-pr-tooltip="Export to Excel"
                    data-pr-position="left"
                  >
                    {/* <span class="material-icons">arrow_downward</span> */}
                    <img src="images/icons/download.png" alt="" />
                  </a>
                  <Tooltip target="[data-pr-tooltip]" />
                </div>
              </div>
              <Toast ref={toast} />
              <DataTable
                value={tableData}
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
                rowExpansionTemplate={rowExpansionTemplate}
                dataKey="RouteID"
                onRowExpand={(e) =>
                  console.log("Expanded RouteID:", e.data.RouteID)
                }
                emptyMessage="No Record Found."
                paginator
                rows={50}
                rowsPerPageOptions={[50,100,150,200,250]}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={(e) => {
                  setSortField(e.sortField);
                  setSortOrder(e.sortOrder);
                  handleSubmit(); // Trigger API call with new sorting
                }}
                // rowClassName={(data) => ({
                //   'bg-fleet-exhausted': data.afterFleetExhaustion === true
                // })}
              >
                <Column expander style={{ width: "3rem" }} />
                <column
                  field=""
                  header=""
                  body={(rowData) => (
                    <div className="d-flex gap-2">
                      {rowData.isPWDRoute === true && (
                        <img
                          src="images/icons/pwd.png"
                          alt="PWD"
                          style={{
                            cursor: "pointer",
                            width: "20px",
                            height: "20px",
                          }}
                          title="PWD"
                        />
                      )}
                      {rowData.isOOBRoute === true && (
                        <img
                          src="images/icons/oob.png"
                          alt="OOB"
                          style={{
                            cursor: "pointer",
                            width: "20px",
                            height: "20px",
                          }}
                          title="OOB"
                        />
                      )}
                      {rowData.isNMTRoute === true && (
                        <img
                          src="images/icons/non-motorable.png"
                          alt="NMT"
                          style={{
                            cursor: "pointer",
                            width: "20px",
                            height: "20px",
                          }}
                          title="Non Motorable"
                        />
                      )}
                      {rowData.PlannedGuard === 1 && (
                        <img
                          src="images/icons/add_guard.png"
                          alt="Guard"
                          style={{
                            cursor: "pointer",
                            width: "20px",
                            height: "20px",
                          }}
                          title="Guard Required"
                        />
                      )}
                      {rowData.isMedicalRoute === true && (
                        <img
                          src="images/icons/medical.png"
                          alt="Medical"
                          style={{
                            cursor: "pointer",
                            width: "20px",
                            height: "20px",
                          }}
                          title="Medical Required"
                        />
                      )}
                      {rowData.swapped === true && (
                        <img
                          src="images/icons/swap.png"
                          alt="Swap"
                          style={{
                            cursor: "pointer",
                            width: "20px",
                            height: "20px",
                          }}
                          title="Swap"
                        />
                      )}
                      {rowData.afterFleetExhaustion === true && (
                        <img
                          src="images/icons/transport.png"
                          alt="Fleet Exhausted"
                          style={{
                            cursor: "pointer",
                            width: "20px",
                            height: "20px",
                          }}
                          title="Created after fleet exhausted"
                        />
                      )}
                    </div>
                  )}
                ></column>
                <Column
                  field="RouteID"
                  header="Route ID"
                  body={routeIdTemplate}
                  sortable
                />
                <Column field="shiftTime" header="Shift" />
                <Column
                  field="Address"
                  header="Address"
                  body={AddressColumnTemplate}
                  sortable
                />
                <Column
                  field="Location"
                  header="Location"
                  sortable
                  body={AddressColumnTemplate}
                />
                <Column field="totaldist" header="Total Dist.(Km)" sortable />
                <Column
                  field="farthestEmployeeDistance"
                  header="Farthest Employee Dist.(Km)"
                  sortable
                />
                <Column
                  field="duration"
                  header="Total Time(HH:MM)"
                  body={durationTemplate}
                  sortable
                />

                {/* <Column field="ZONE" header="Zone" /> */}
                <Column field="totalStop" header="Stops" sortable />
                <Column field="vendorname" header="Vendor" sortable />
                <coloumn
                  fields=""
                  header="Vehicle"
                  body={(rowData) => (
                    <div className="d-flex gap-2">
                      {rowData.varvehicleType === "s" && (
                        <img
                          src="images/icons/letter-s.png"
                          alt="Map"
                          style={{
                            cursor: "pointer",
                            width: "20px",
                            height: "20px",
                          }}
                          title="Small"
                        />
                      )}
                      {rowData.varvehicleType === "m" && (
                        <img
                          src="images/icons/letter-m.png"
                          alt="Map"
                          style={{
                            cursor: "pointer",
                            width: "20px",
                            height: "20px",
                          }}
                          title="Medium"
                        />
                      )}
                      {rowData.varvehicleType === "l" && (
                        <img
                          src="images/icons/letter-l.png"
                          alt="Map"
                          style={{
                            cursor: "pointer",
                            width: "20px",
                            height: "20px",
                          }}
                          title="Large"
                        />
                      )}
                    </div>
                  )}
                ></coloumn>
                {/* <Column field="stickerno2" header="Parking" />
                                <Column field="routeno" header="RouteNo" /> */}
              </DataTable>
              <Tooltip target="[data-pr-tooltip]" />
            </div>
          </div>
        </div>
      </div>
      <OffcanvasRouteDetails
        show={showOffcanvas}
        onClose={() => setShowOffcanvas(false)}
        routeId={selectedRouteId}
      />
      <Dialog
        visible={showProgressDialog}
        onHide={() => {}}
        closable={false}
        draggable={false}
        resizable={false}
        header={
          <div className="d-flex justify-content-between align-items-center">
            <span>OPTIMAR Routing Engine</span>
            <img src="/images/logo.svg" alt="" />
          </div>
        }
        style={{ width: "550px" }}
        // className="route-progress-dialog"
        className="p-2 rounded-5 bg-white"
      >
        <div className="p-4">
          <h3 className="text-center mb-4">
            {progressStatus.isError
              ? "Route Generation Failed"
              : "Generating Routes"}
          </h3>

          <div className="mb-4">
            <ProgressBar
              value={progressStatus.progress}
              showValue={false}
              className={progressStatus.isError ? "p-progressbar-error" : ""}
            />
          </div>

          <div className="text-center">
            <p className="mb-2">{progressStatus.message}</p>
            {progressStatus.isError && (
              <p className="text-danger">{progressStatus.errorMessage}</p>
            )}
          </div>

          <div className="mt-4 text-center">
            <div className="flex justify-content-center gap-2">
              {progressStatus.step > 0 && (
                <div
                  className={`step-indicator ${
                    progressStatus.step >= 1 ? "active" : ""
                  }`}
                >
                  {/* <i className="pi pi-database"></i>
                  <span></span> */}
                </div>
              )}
              {progressStatus.step > 1 && (
                <div
                  className={`step-indicator ${
                    progressStatus.step >= 2 ? "active" : ""
                  }`}
                >
                  {/* <i className="pi pi-map"></i>
                  <span></span> */}
                </div>
              )}
              {progressStatus.step > 2 && (
                <div
                  className={`step-indicator ${
                    progressStatus.step >= 3 ? "active" : ""
                  }`}
                >
                  {/* <i className="pi pi-save"></i>
                  <span>Save</span> */}
                </div>
              )}
              {progressStatus.step > 3 && (
                <div
                  className={`step-indicator ${
                    progressStatus.step >= 4 ? "active" : ""
                  }`}
                >
                  {/* <i className="pi pi-check"></i> */}
                  {/* <span>Complete</span> */}
                </div>
              )}
            </div>
          </div>
        </div>
      </Dialog>

      {/* <div className="card flex justify-center" >
                <Dialog header="Header"
                    style={{ width: '50vw' }} >
                    <p className="m-0">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                        consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                        Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                </Dialog>
            </div> */}
      <Dialog
        visible={showGenerateRouteDialog}
        onHide={() => setShowGenerateRouteDialog(false)}
        header="Are you sure ?"
        footer={
          <div>
            <Button
              label="No"
              //   icon="pi pi-times"
              onClick={() => setShowGenerateRouteDialog(false)}
              className="btn btn-outline-dark"
            />
            <Button
              label="Yes"
              //   icon="pi pi-check"
              onClick={handleGenerateRoute}
              className="btn btn-primary ms-3"
            />
          </div>
        }
      >
        <p className="lead mb-3">
          This will generate Routes for
          <strong className="text-purple fw-bold"> &nbsp;{shiftDate}</strong>
        </p>
        {/* <p className="lead">Are you sure you want to proceed?</p> */}
      </Dialog>
      {/* Add this PrimeSidebar component */}
      <PrimeSidebar
        visible={showDetailsSidebar}
        position="right"
        width="50%"
        onHide={() => setShowDetailsSidebar(false)}
        showCloseIcon={false}
        dismissable={false}
        style={{ width: "30%", backdropFilter: "blur(8px)" }}
      >
        <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
          <h6 className="sidebarTitle">Route Statistics</h6>
          {/* <Button
                        icon="pi pi-times"
                        className=""
                        onClick={() => setShowDetailsSidebar(false)}
                    /> */}
          <span
            className="material-icons me-3"
            style={{ cursor: "pointer" }}
            onClick={() => setShowDetailsSidebar(false)}
          >
            close
          </span>
        </div>
        <div className="sidebarBody p-3">
          <div className="statistics-container">
            <div className="row">
              <div className="col-6">
                <ol className="list-group shadow">
                  <li className="list-group-item d-flex justify-content-between align-items-center fw-bold text-dark bg-tb-head">
                    Vehicles
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="ms-2 me-auto">
                      <div className="fw">
                        <img
                          src="images/icons/letter-s.png"
                          className="img20"
                        />{" "}
                        Small
                      </div>
                    </div>
                    <span className="fw-bold">
                      {statsDetails?.[0]?.smallVehicleCount || 0}
                    </span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="ms-2 me-auto">
                      <div className="fw">
                        <img
                          src="images/icons/letter-m.png"
                          className="img20"
                        />{" "}
                        Medium
                      </div>{" "}
                    </div>
                    <span className="fw-bold">
                      {(statsDetails?.[0]?.mediumVehicleCount || 0) -
                        (statsDetails?.[0]?.FleetExhaustionCount || 0)}
                    </span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="ms-2 me-auto">
                      <div className="fw">
                        <img
                          src="images/icons/letter-l.png"
                          className="img20"
                        />{" "}
                        Large
                      </div>{" "}
                    </div>
                    <span className="fw-bold">
                      {statsDetails?.[0]?.largeVehicleCount || 0}
                    </span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="ms-2 me-auto">
                      <div className="fw">
                        <img
                          src="images/icons/transport.png"
                          className="img20"
                        />{" "}
                        Unrouted
                      </div>
                    </div>
                    <span className="fw-bold">
                      {statsDetails?.[0]?.FleetExhaustionCount || 0}
                    </span>
                  </li>
                </ol>

                <ol className="list-group shadow mt-4">
                  <li className="list-group-item d-flex justify-content-between align-items-center fw-bold text-dark bg-tb-head">
                    Employees
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="ms-2 me-auto">
                      <div className="fw">
                        <span className="badge bg-danger-subtle rounded-pill text-dark me-2">
                          F
                        </span>{" "}
                        Female
                      </div>
                    </div>
                    <span className="fw-bold">
                      {statsDetails?.[0]?.femalecount || 0}
                    </span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="ms-2 me-auto">
                      <div className="fw">
                        <span className="badge bg-primary-subtle rounded-pill text-dark me-2">
                          M
                        </span>{" "}
                        Male
                      </div>{" "}
                    </div>
                    <span className="fw-bold">
                      {statsDetails?.[0]?.malecount || 0}
                    </span>
                  </li>
                </ol>
              </div>
              <div className="col-6">
                <ol className="list-group shadow">
                  <li className="list-group-item d-flex justify-content-between align-items-center fw-bold text-dark bg-tb-head">
                    Route Types
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="ms-2 me-auto">
                      <div className="fw">
                        <img
                          src="images/icons/add_guard.png"
                          className="img20"
                        />{" "}
                        Escort
                      </div>
                    </div>
                    <span className="fw-bold">
                      {statsDetails?.[0]?.guardCount || 0}
                    </span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="ms-2 me-auto">
                      <div className="fw">
                        <img src="images/icons/swap.png" className="img20" />{" "}
                        Swapped
                      </div>
                    </div>
                    <span className="fw-bold">
                      {statsDetails?.[0]?.swappedCount || 0}
                    </span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="ms-2 me-auto">
                      <div className="fw">
                        <img src="images/icons/medical.png" className="img20" />{" "}
                        Medical
                      </div>
                    </div>
                    <span className="fw-bold">
                      {statsDetails?.[0]?.MedicalCount || 0}
                    </span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="ms-2 me-auto">
                      <div className="fw">
                        <img src="images/icons/pwd.png" className="img20" /> PWD
                      </div>
                    </div>
                    <span className="fw-bold">
                      {statsDetails?.[0]?.PWDCount || 0}
                    </span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="ms-2 me-auto">
                      <div className="fw">
                        <img
                          src="images/icons/non-motorable.png"
                          className="img20"
                        />{" "}
                        NMT
                      </div>{" "}
                    </div>
                    <span className="fw-bold">
                      {statsDetails?.[0]?.NMTCount || 0}
                    </span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="ms-2 me-auto">
                      <div className="fw">
                        <img src="images/icons/oob.png" className="img20" /> OOB
                      </div>{" "}
                    </div>
                    <span className="fw-bold">
                      {statsDetails?.[0]?.OOBCount || 0}
                    </span>
                  </li>
                </ol>
              </div>
              <div
                class="cobl-12"
                style={{ maxHeight: "220px", overflowY: "auto" }}
              >
                <table class="table table-bordered mt-4 shadow">
                  <thead>
                    <tr>
                      <th colSpan="5" class="text-center">
                        Vendor Summary
                      </th>
                    </tr>
                    <tr>
                      <th>Name</th>
                      <th>S</th>
                      <th>M</th>
                      <th>L</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorSummary.length === 0 ? (
                      <tr>
                        <td className="text-center">-</td>
                        <td className="text-center">0</td>
                        <td className="text-center">0</td>
                        <td className="text-center">0</td>
                        <td className="text-center">0</td>
                      </tr>
                    ) : (
                      vendorSummary.map((vendor, index) => (
                        <tr key={index}>
                          <td>{vendor.vendorname}</td>
                          <td>{vendor.smallvehiclecount}</td>
                          <td>{vendor.mediumvehiclecount}</td>
                          <td>{vendor.largevehiclecount}</td>
                          <td>{vendor.totaltrip}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </PrimeSidebar>

      {/* ... existing code ... */}
      <Dialog
        visible={showAutoVendorAllocationDialog}
        onHide={() => setShowAutoVendorAllocationDialog(false)}
        header="Confirmation"
        modal
        footer={
          <>
            <Button
              label="Cancel"
              onClick={() => setShowAutoVendorAllocationDialog(false)}
              className="btn btn-outline-dark"
            />
            <Button
              label="OK"
              onClick={confirmAutoVendorAllocation}
              disabled={isLoading}
              className="btn btn-primary ms-3"
            />
          </>
        }
      >
        <p>Are you sure you want to automatically allocate the vendor?</p>
      </Dialog>
    </>
  );
};

export default ManageRoute;
