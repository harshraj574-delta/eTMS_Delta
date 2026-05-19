import React, { useEffect, useState, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { Tooltip } from "primereact/tooltip";
import { Checkbox } from "primereact/checkbox";
import { FileUpload } from "primereact/fileupload";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Column } from 'primereact/column';
import { CustomDataTable } from "./common/CustomDataTable";
import TableToolbar from "./common/TableToolbar";
import MasterSidebar from "./Master/MasterSidebar";
import calendarIcon from "../assets/calendar.png";
import VehicleMasterService from "../services/compliance/VehicleMasterService";
import sessionManager from "../utils/SessionManager.js";
import { toastService } from "../services/toastService.js";
import ReportButton from "./common/ReportButton";
import Loader from "./common/Loader";
import CustomPaginator from "./common/CustomPaginator";
import { ToastContainer } from "react-toastify";

const VEHICLE_DOCS_STORAGE_KEY = "vehicle_docs";
const VEHICLE_STATUS_KEY = "vehicle_status_data";
const VEHICLE_CAB_TYPE_KEY = "vehicle_cab_type_data";
const VEHICLE_MAKE_KEY = "vehicle_make_data";
const VEHICLE_FACILITY_MAPPING_KEY = "vehicle_facility_mapping_data";
const VEHICLE_ATTRITE_REASON_KEY = "vehicle_attrite_reason_data";
const VEHICLE_SPEED_LOCK_KEY = "vehicle_speed_lock_data";
const VEHICLE_BS_EMISSION_KEY = "vehicle_bs_emission_data";
const CLOUDINARY_UPLOAD_URL =
  "https://api.cloudinary.com/v1_1/dnzzrvbdz/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "hqudzekg";

const VehicleMaster = () => {
    // ========== ALL STATE DECLARATIONS FIRST ==========
    const [selectedCity, setSelectedCity] = useState(null);
    const [updateVehicle, setUpdateVehicle] = useState(false);
    const [addVehicle, setAddVehicle] = useState(false);
    const [facility, setFacility] = useState([]);
    const locationid = localStorage.getItem("locationid");
    const [vendor, setVendor] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [vehicleDetails, setVehicleDetails] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const userID = sessionManager.getUserSession().ID;
    const [isAttrited, setIsAttrited] = useState(false);
    const [editAttrited, setEditAttrited] = useState(false);
    const [attriteReason, setAttriteReason] = useState("");
    const [editAttriteReason, setEditAttriteReason] = useState("");
    const [vehicleCabType, setVehicleCabType] = useState(null);
    const [editVehicleCabType, setEditVehicleCabType] = useState(null);
    const [speedLock, setSpeedLock] = useState(null);
    const [editSpeedLock, setEditSpeedLock] = useState(null);
    const [bsEmission, setBsEmission] = useState(null);
    const [editBsEmission, setEditBsEmission] = useState(null);
    const [vehicleMake, setVehicleMake] = useState("");
    const [editVehicleMake, setEditVehicleMake] = useState("");
    const [facilityMapping, setFacilityMapping] = useState([]);
    const [editFacilityMapping, setEditFacilityMapping] = useState([]);
    const [showTable, setShowTable] = useState(false);
    const [facilityAdd, setFacilityAdd] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [editFacility, setEditFacility] = useState([]);
    const [editselectedFacility, setEditSelectedFacility] = useState(null);
    const [selectedVendorAdd, setSelectedVendorAdd] = useState(null);
    const [vendorAdd, setVendorAdd] = useState([]);
    const [editVendor, setEditVendor] = useState([]);
    const [selectedEditVendor, setSelectedEditVendor] = useState(null);
    const [vehicleType, setVehicleType] = useState([]);
    const [editVehicleType, setEditVehicleType] = useState([]);
    const [selectedVehicleType, setSelectedVehicleType] = useState(null);
    const [selectedEditVehicleType, setSelectedEditVehicleType] = useState(null);
    const [fuelType, setFuelType] = useState([]);
    const [editFuelType, setEditFuelType] = useState([]);
    const [documentDetails, setDocumentDetails] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [vehicleDocs, setVehicleDocs] = useState({});
    const [uploadingDocIds, setUploadingDocIds] = useState({});
    const [uploadProgressByDoc, setUploadProgressByDoc] = useState({});
    const [activeSidebarTab, setActiveSidebarTab] = useState("details");
    const [vehicleStatus, setVehicleStatus] = useState(null);
    const [editVehicleStatus, setEditVehicleStatus] = useState(null);

    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(50);
    const [globalFilter, setGlobalFilter] = useState("");
    const [filteredVehicleData, setFilteredVehicleData] = useState([]);
    const op = useRef(null);
    const filterButtonRef = useRef(null);

    const onPageChange = (event) => {
        setFirst(event.first);
        setRows(event.rows);
    };

    // Initial form data
    const initialFormData = {
        VehicleId: "",
        VehicleNo: "",
        VehicleRegNo: "",
        FacilityId: 0,
        VendorId: 0,
        VehicleTypeId: 0,
        VehicleRegDate: "",
        PermitExpiryDate: "",
        InsuranceExpiryDate: "",
        FitnessExpiryDate: "",
        TaxExpiryDate: "",
        PUCExpiryDate: "",
        ChasisNo: "",
        ModalNo: "",
        FCValidDate: "",
        InsuranceNo: "",
        InsuranceCompanyName: "",
        PermitNo: "",
        PermitIssueDate: "",
        EmissionExpiryDate: "",
        CabInductionDate: "",
        CabExpiryDate: "",
        FuleType: 1,
        Warning_1: "",
        Warning_2: "",
        FinalWarning: "",
        Remark: "",
        BillingType: 0,
        Emergency_Contact: 0,
        Wireless_Set: 0,
        FireExtinguisher: 0,
        Spare_Tyre: 0,
        Medical_Kit: 0,
        Umbrella: 0,
        Torch: 0,
        Documents: 0,
    };

    const [vehicleFormData, setVehicleFormData] = useState(initialFormData);

    const initialEditFormData = {
        VehicleId: "",
        VehicleNo: "",
        VehicleRegNo: "",
        FacilityId: "",
        VendorId: "",
        VehicleTypeId: "",
        VehicleRegDate: "",
        PermitExpiryDate: "",
        InsuranceExpiryDate: "",
        FitnessExpiryDate: "",
        TaxExpiryDate: "",
        PUCExpiryDate: "",
        ChasisNo: "",
        ModalNo: "",
        FCValidDate: "",
        InsuranceNo: "",
        InsuranceCompanyName: "",
        PermitNo: "",
        PermitIssueDate: "",
        EmissionExpiryDate: "",
        CabInductionDate: "",
        CabExpiryDate: "",
        FuleType: "",
        Warning_1: "",
        Warning_2: "",
        FinalWarning: "",
        Remark: "",
        BillingType: 0,
        Emergency_Contact: 0,
        Wireless_Set: 0,
        FireExtinguisher: 0,
        Spare_Tyre: 0,
        Medical_Kit: 0,
        Umbrella: 0,
        Torch: 0,
        Documents: 0,
        DocumentType: 0,
        AttritedDate: "",
        Attrited: 0,
    };

    const [editVehicleFormData, setEditVehicleFormData] = useState(initialEditFormData);

    // ========== FILTER + EXPORT ==========
    useEffect(() => {
        if (!globalFilter || globalFilter.trim() === "") {
            setFilteredVehicleData(vehicleDetails);
        } else {
            const lower = globalFilter.toLowerCase();
            setFilteredVehicleData(
                vehicleDetails.filter(item =>
                    Object.values(item).some(val =>
                        String(val ?? "").toLowerCase().includes(lower)
                    )
                )
            );
        }
        setFirst(0);
    }, [vehicleDetails, globalFilter]);

    const exportToCSV = (data, filename) => {
        if (!data || data.length === 0) return;
        const exportFields = ["VehicleNo", "VehicleRegNo", "VehicleType", "FacilityName", "VendorName", "FuleType",
            "PermitExpiryDate", "InsuranceExpiryDate", "FitnessExpiryDate", "TaxExpiryDate", "PUCExpiryDate", "Attrited"];
        const headers = exportFields;
        const csvContent = [
            headers.join(","),
            ...data.map(row =>
                headers.map(h => {
                    const v = row[h];
                    if (v === null || v === undefined) return "";
                    const s = String(v);
                    return s.includes(",") || s.includes('"') || s.includes("\n")
                        ? `"${s.replace(/"/g, '""')}"` : s;
                }).join(",")
            ),
        ].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `${filename}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportExcel = () => {
        if (filteredVehicleData.length === 0) {
            toastService.error("No data to export");
            return;
        }
        exportToCSV(filteredVehicleData, `vehicle_master_${new Date().toISOString().slice(0, 10)}`);
    };

    // ========== HELPER FUNCTIONS ==========
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date)) return "";
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const getExpiryBadge = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        if (isNaN(date)) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

        let badge = null;
        if (diffDays <= 0) {
            badge = { label: "Expired", bg: "#FEE2E2", color: "#B91C1C", dot: "#EF4444" };
        } else if (diffDays <= 7) {
            badge = { label: `${diffDays}d left`, bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" };
        } else if (diffDays <= 15) {
            badge = { label: `${diffDays}d left`, bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" };
        }
        return badge;
    };

    const expiryDateBody = (dateStr) => {
        const formatted = formatDate(dateStr);
        const badge = getExpiryBadge(dateStr);
        const style = badge ? { color: badge.color, fontWeight: 600 } : { color: "#374151" };
        if (!badge) return <span style={style}>{formatted || "—"}</span>;
        const cls = badge.dot === "#EF4444" ? "expiry-tip-expired" : badge.dot === "#F59E0B" ? "expiry-tip-warning" : "expiry-tip-info";
        return (
            <span className={cls} data-pr-tooltip={badge.label} data-pr-position="top" style={style}>
                {formatted || "—"}
            </span>
        );
    };

    const formatDateAdd = (date) => {
        if (!date) return null;
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            console.error("The provided date is invalid for formatDate:", date);
            return null;
        }
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // ========== ATTRITE REASON LOCALSTORAGE HELPERS ==========
    const loadAttriteReason = (vehicleId) => {
        try {
            const data = JSON.parse(localStorage.getItem(VEHICLE_ATTRITE_REASON_KEY) || "{}");
            return data[String(vehicleId)] || "";
        } catch { return ""; }
    };

    const saveAttriteReason = (vehicleId, reason) => {
        try {
            const data = JSON.parse(localStorage.getItem(VEHICLE_ATTRITE_REASON_KEY) || "{}");
            data[String(vehicleId)] = reason;
            localStorage.setItem(VEHICLE_ATTRITE_REASON_KEY, JSON.stringify(data));
        } catch (err) { console.error("Failed to save attrite reason:", err); }
    };

    const cabTypeOptions = [
        { label: "Cab", value: "cab" },
        { label: "Shuttle", value: "shuttle" },
        { label: "QRT", value: "qrt" },
    ];

    const loadCabType = (vehicleId) => {
        try {
            const data = JSON.parse(localStorage.getItem(VEHICLE_CAB_TYPE_KEY) || "{}");
            return data[String(vehicleId)] || null;
        } catch { return null; }
    };

    const saveCabType = (vehicleId, type) => {
        try {
            const data = JSON.parse(localStorage.getItem(VEHICLE_CAB_TYPE_KEY) || "{}");
            data[String(vehicleId)] = type;
            localStorage.setItem(VEHICLE_CAB_TYPE_KEY, JSON.stringify(data));
        } catch (err) { console.error("Failed to save cab type:", err); }
    };

    const loadSpeedLock = (vehicleId) => {
        try {
            const data = JSON.parse(localStorage.getItem(VEHICLE_SPEED_LOCK_KEY) || "{}");
            const val = data[String(vehicleId)];
            return val !== undefined ? val : null;
        } catch { return null; }
    };

    const saveSpeedLock = (vehicleId, value) => {
        try {
            const data = JSON.parse(localStorage.getItem(VEHICLE_SPEED_LOCK_KEY) || "{}");
            data[String(vehicleId)] = value;
            localStorage.setItem(VEHICLE_SPEED_LOCK_KEY, JSON.stringify(data));
        } catch (err) { console.error("Failed to save speed lock:", err); }
    };

    const bsEmissionOptions = [
        { label: "BS-III", value: "BS-III" },
        { label: "BS-IV",  value: "BS-IV"  },
        { label: "BS-VI",  value: "BS-VI"  },
    ];

    const loadBsEmission = (vehicleId) => {
        try {
            const data = JSON.parse(localStorage.getItem(VEHICLE_BS_EMISSION_KEY) || "{}");
            return data[String(vehicleId)] || null;
        } catch { return null; }
    };

    const saveBsEmission = (vehicleId, value) => {
        try {
            const data = JSON.parse(localStorage.getItem(VEHICLE_BS_EMISSION_KEY) || "{}");
            data[String(vehicleId)] = value;
            localStorage.setItem(VEHICLE_BS_EMISSION_KEY, JSON.stringify(data));
        } catch (err) { console.error("Failed to save BS emission:", err); }
    };

    const loadVehicleMake = (vehicleId) => {
        try {
            const data = JSON.parse(localStorage.getItem(VEHICLE_MAKE_KEY) || "{}");
            return data[String(vehicleId)] || "";
        } catch { return ""; }
    };

    const saveVehicleMake = (vehicleId, make) => {
        try {
            const data = JSON.parse(localStorage.getItem(VEHICLE_MAKE_KEY) || "{}");
            data[String(vehicleId)] = make;
            localStorage.setItem(VEHICLE_MAKE_KEY, JSON.stringify(data));
        } catch (err) { console.error("Failed to save vehicle make:", err); }
    };

    const loadFacilityMapping = (vehicleId) => {
        try {
            const data = JSON.parse(localStorage.getItem(VEHICLE_FACILITY_MAPPING_KEY) || "{}");
            return data[String(vehicleId)] || [];
        } catch { return []; }
    };

    const saveFacilityMapping = (vehicleId, mapping) => {
        try {
            const data = JSON.parse(localStorage.getItem(VEHICLE_FACILITY_MAPPING_KEY) || "{}");
            data[String(vehicleId)] = mapping;
            localStorage.setItem(VEHICLE_FACILITY_MAPPING_KEY, JSON.stringify(data));
        } catch (err) { console.error("Failed to save facility mapping:", err); }
    };

    const statusOptions = [
        { label: "Active", value: "Active" },
        { label: "Bench", value: "Bench" },
        { label: "Terminated", value: "Terminated" },
    ];

    const loadVehicleStatus = (vehicleId) => {
        try {
            const data = JSON.parse(localStorage.getItem(VEHICLE_STATUS_KEY) || "{}");
            return data[String(vehicleId)] || null;
        } catch { return null; }
    };

    const saveVehicleStatus = (vehicleId, status) => {
        try {
            const data = JSON.parse(localStorage.getItem(VEHICLE_STATUS_KEY) || "{}");
            data[String(vehicleId)] = status;
            localStorage.setItem(VEHICLE_STATUS_KEY, JSON.stringify(data));
        } catch (err) { console.error("Failed to save vehicle status:", err); }
    };

    // ========== FETCH FUNCTIONS ==========
    const fetchFuelMaster = async () => {
        try {
            const response = await VehicleMasterService.sp_getfuelmaster();
            const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
            const formattedData = parsedData.map(item => ({
                name: item.fueltype,
                value: item.Id
            }));
            setFuelType(formattedData);
        } catch (error) {
            console.error("Error while fetching fuel data:", error);
            toastService.error("Failed to load fuel data.");
        }
    }

    const fetchFuelMasterEdit = async () => {
        try {
            const response = await VehicleMasterService.sp_getfuelmaster();
            const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
            const formattedData = parsedData.map(item => ({
                name: item.fueltype,
                value: item.Id
            }));
            setEditFuelType(formattedData);
        } catch (error) {
            console.error("Error while fetching fuel data:", error);
            toastService.error("Failed to load fuel data.");
        }
    }

    const fetchFacility = async () => {
        try {
            const response = await VehicleMasterService.SelectFacility({
                Userid: userID,
            })
            const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
            const formattedData = parsedData.map(item => ({
                name: item.facilityName,
                value: item.Id
            }));
            setFacility(formattedData);
        } catch (error) {
            console.error("Error while fetching facility data:", error);
            toastService.error("Failed to load facility data.");
        }
    }

    const fetchVendorsByFacility = async () => {
        try {
            const response = await VehicleMasterService.GetVendorByFacility({
                facilityid: selectedCity
            });
            const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
            const formattedData = parsedData.map(item => ({
                name: item.vendorName,
                value: item.Id
            }));
            setVendor(formattedData);
        } catch (error) {
            console.error("Error while fetching vendor data:", error);
            toastService.error("Failed to load vendor data.");
        }
    }

    const fetchSelectVehicleType = async () => {
        try {
            const response = await VehicleMasterService.SelectVehicleType({
                vendorid: selectedVendorAdd,
            });
            const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
            const formattedData = parsedData.map(item => ({
                name: item.vehicle,
                value: item.Id
            }));
            console.log("Vehicle Type Data:", formattedData);
            setVehicleType(formattedData);
        } catch (error) {
            console.error("Error while fetching vehicle type data:", error);
            toastService.error("Failed to load vehicle type data.");
        }
    }

    const fetchSelectVehicleTypeEdit = async () => {
        try {
            const response = await VehicleMasterService.SelectVehicleType({
                vendorid: selectedEditVendor,
            });
            const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
            const formattedData = parsedData.map(item => ({
                name: item.vehicle,
                value: item.Id
            }));
            console.log("Edit Vehicle Type Data:", formattedData);
            setEditVehicleType(formattedData);
        } catch (error) {
            console.error("Error while fetching vehicle type data:", error);
            toastService.error("Failed to load vehicle type data.");
        }
    }

    const fetchFacilityAdd = async () => {
        try {
            const response = await VehicleMasterService.SelectFacility({
                Userid: userID,
            })
            const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
            const formattedData = parsedData.map(item => ({
                name: item.facilityName,
                value: item.Id
            }));
            setFacilityAdd(formattedData);
        } catch (error) {
            console.error("Error while fetching facility data:", error);
            toastService.error("Failed to load facility data.");
        }
    }

    const fetchFacilityEdit = async () => {
        try {
            const response = await VehicleMasterService.SelectFacility({
                Userid: userID,
            })
            const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
            const formattedData = parsedData.map(item => ({
                name: item.facilityName,
                value: item.Id
            }));
            setEditFacility(formattedData);
        } catch (error) {
            console.error("Error while fetching facility data:", error);
            toastService.error("Failed to load facility data.");
        }
    }

    const fetchVendorsByFacilityAdd = async () => {
        try {
            const response = await VehicleMasterService.GetVendorByFacility({
                facilityid: selectedFacility
            });
            const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
            const formattedData = parsedData.map(item => ({
                name: item.vendorName,
                value: item.Id
            }));
            console.log("Vendor Data Add:", formattedData);
            setVendorAdd(formattedData);
        } catch (error) {
            console.error("Error while fetching vendor data:", error);
            toastService.error("Failed to load vendor data.");
        }
    }

    const fetchVendorsByFacilityEdit = async () => {
        try {
            const response = await VehicleMasterService.GetVendorByFacility({
                facilityid: editselectedFacility
            });
            const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
            const formattedData = parsedData.map(item => ({
                name: item.vendorName,
                value: item.Id
            }));
            console.log("Edit Vendor Data:", formattedData);
            setEditVendor(formattedData);
        } catch (error) {
            console.error("Error while fetching vendor data:", error);
            toastService.error("Failed to load vendor data.");
        }
    }

    const VehiclesDetailsData = async () => {
        // Validate dropdowns before calling API
        if (!selectedCity) {
            toastService.error("Please select Facility");
            return;
        }
        if (!selectedVendor) {
            toastService.error("Please select Vendor");
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await VehicleMasterService.SPR_VehiclesDetails({
                facilityid: selectedCity,
                vendorid: selectedVendor,
                search: ""
            });
            const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
            setVehicleDetails(parsedData);
            setFirst(0); // Reset pagination on data fetch
            setShowTable(true);
        } catch (error) {
            console.error("Error while fetching vehicle details:", error);
            toastService.error("Failed to load vehicle details.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const fetchDocumentDetails = async () => {
        try {
            const response = await VehicleMasterService.SPR_DocumentDetails({
                type: "V"
            });
            const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
            const formattedData = parsedData.map(item => ({
                name: item.DocumentType,
                value: item.Id
            }));
            console.log("Document Details Data:", formattedData);
            setDocumentDetails(formattedData);
        } catch (error) {
            console.error("Error while fetching document details:", error);
            toastService.error("Failed to fetch document details.");
        }
    }

    // ========== USE EFFECTS (NOW ALL STATES ARE DEFINED) ==========
    // Initial fetch on component mount
    useEffect(() => {
        fetchFacility();
        fetchFuelMaster();
        fetchFuelMasterEdit();
        fetchFacilityAdd();
        fetchFacilityEdit();
        fetchDocumentDetails();
    }, []);

    // Fetch vendors when facility changes (Search section)
    useEffect(() => {
        if (selectedCity) {
            fetchVendorsByFacility();
        }
    }, [selectedCity]);

    // Fetch vendors when facility changes (Add section)
    useEffect(() => {
        if (selectedFacility) {
            fetchVendorsByFacilityAdd();
        }
    }, [selectedFacility]);

    // Fetch vehicle types when vendor changes (Add section)
    useEffect(() => {
        if (selectedVendorAdd) {
            fetchSelectVehicleType();
        }
    }, [selectedVendorAdd]);

    // Fetch vendors when facility changes (Edit section)
    useEffect(() => {
        if (editselectedFacility && editselectedFacility !== 0) {
            fetchVendorsByFacilityEdit();
        }
    }, [editselectedFacility]);

    // Fetch vehicle types when vendor changes (Edit section)
    useEffect(() => {
        if (selectedEditVendor && selectedEditVendor !== 0) {
            fetchSelectVehicleTypeEdit();
        }
    }, [selectedEditVendor]);

    // Auto-trigger vendor fetch when form facility is set
    useEffect(() => {
        if (editVehicleFormData.FacilityId && editVehicleFormData.FacilityId !== 0 && updateVehicle) {
            setEditSelectedFacility(editVehicleFormData.FacilityId);
        }
    }, [editVehicleFormData.FacilityId, updateVehicle]);

    // Auto-trigger vehicle type fetch when form vendor is set
    useEffect(() => {
        if (editVehicleFormData.VendorId && editVehicleFormData.VendorId !== 0 && updateVehicle) {
            setSelectedEditVendor(editVehicleFormData.VendorId);
        }
    }, [editVehicleFormData.VendorId, updateVehicle]);

    // Set selected vehicle type when form data changes
    useEffect(() => {
        if (editVehicleFormData.VehicleTypeId && editVehicleFormData.VehicleTypeId !== 0 && updateVehicle) {
            setSelectedEditVehicleType(editVehicleFormData.VehicleTypeId);
        }
    }, [editVehicleFormData.VehicleTypeId, updateVehicle]);

    // ========== CLOUDINARY DOCUMENT UPLOAD ==========
    const getVehicleDocKeys = (vehicleData) => [
        vehicleData.VehicleId, vehicleData.Id, vehicleData.VehicleNo
    ].filter(Boolean).map(String);

    const loadVehicleDocs = (vehicleData) => {
        try {
            const stored = JSON.parse(localStorage.getItem(VEHICLE_DOCS_STORAGE_KEY) || "{}");
            const keys = getVehicleDocKeys(vehicleData);
            for (const key of keys) {
                if (stored[key]) { setVehicleDocs(stored[key]); return; }
            }
            setVehicleDocs({});
        } catch { setVehicleDocs({}); }
    };

    const saveVehicleDocs = (vehicleData, docs) => {
        try {
            const stored = JSON.parse(localStorage.getItem(VEHICLE_DOCS_STORAGE_KEY) || "{}");
            const keys = getVehicleDocKeys(vehicleData);
            keys.forEach(key => { stored[key] = docs; });
            localStorage.setItem(VEHICLE_DOCS_STORAGE_KEY, JSON.stringify(stored));
        } catch (err) { console.error("Failed to save vehicle docs:", err); }
    };

    const uploadToCloudinary = (file, vehicleId, docTypeId, onProgress) =>
        new Promise((resolve, reject) => {
            const uploadFormData = new FormData();
            uploadFormData.append("file", file);
            uploadFormData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
            uploadFormData.append("asset_folder", `vehicles/${vehicleId}/${docTypeId}`);
            const xhr = new XMLHttpRequest();
            xhr.open("POST", CLOUDINARY_UPLOAD_URL);
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
            };
            xhr.onload = () => {
                try {
                    const data = JSON.parse(xhr.responseText);
                    if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) { resolve(data.secure_url); return; }
                    reject(new Error(data.error?.message || "Upload failed"));
                } catch (error) { reject(error); }
            };
            xhr.onerror = () => reject(new Error("Upload failed"));
            xhr.send(uploadFormData);
        });

    const handleVehicleDocUpload = async (file, docTypeId, vehicleData) => {
        if (!file) return;
        const vehicleKeys = getVehicleDocKeys(vehicleData);
        const vehicleKey = vehicleKeys[0];
        if (!vehicleKey) { toastService.warn("Please enter the vehicle number before uploading documents."); return; }
        try {
            setUploadingDocIds((prev) => ({ ...prev, [docTypeId]: true }));
            setUploadProgressByDoc((prev) => ({ ...prev, [docTypeId]: 0 }));
            const url = await uploadToCloudinary(file, vehicleKey, docTypeId, (progress) => {
                setUploadProgressByDoc((prev) => ({ ...prev, [docTypeId]: progress }));
            });
            const updated = { ...vehicleDocs, [docTypeId]: url };
            setVehicleDocs(updated);
            saveVehicleDocs(vehicleData, updated);
            toastService.success("Document uploaded successfully.");
        } catch (error) {
            console.error("An error occurred during file upload:", error);
            toastService.error("Failed to upload the document.");
        } finally {
            setUploadingDocIds((prev) => ({ ...prev, [docTypeId]: false }));
            setUploadProgressByDoc((prev) => ({ ...prev, [docTypeId]: 0 }));
        }
    };

    const resetVehicleDocsState = () => {
        setVehicleDocs({}); setUploadingDocIds({}); setUploadProgressByDoc({}); setActiveSidebarTab("details");
    };

    const uploadedDocCount = documentDetails.filter((d) => vehicleDocs[d.value]).length;

    const renderSidebarTabs = () => (
        <div className="doc-tabs-bar">
            <button type="button" className={`doc-tab-btn ${activeSidebarTab === "details" ? "active" : ""}`} onClick={() => setActiveSidebarTab("details")}>
                <i className="pi pi-car" style={{ fontSize: "13px" }} /> Details
            </button>
            <button type="button" className={`doc-tab-btn ${activeSidebarTab === "documents" ? "active" : ""}`} onClick={() => setActiveSidebarTab("documents")}>
                <i className="pi pi-file" style={{ fontSize: "13px" }} /> Documents
                <span className="doc-tab-count">{uploadedDocCount}/{documentDetails.length}</span>
            </button>
        </div>
    );

    const renderVehicleDocumentCards = (vehicleData) => (
        <div className="doc-tab-panel">
            <div className="doc-tab-summary mb-3">
                <span className="fw-semibold">Uploaded:</span>{" "}
                <span style={{ color: "#6366f1", fontWeight: 700 }}>{uploadedDocCount}</span>
                <span className="text-muted"> / {documentDetails.length} documents</span>
            </div>
            <div className="row g-3">
                {documentDetails.map((doc) => {
                    const url = vehicleDocs[doc.value];
                    const isUploading = Boolean(uploadingDocIds[doc.value]);
                    const progress = uploadProgressByDoc[doc.value] || 0;
                    return (
                        <div className="col-12 col-md-6" key={`vehicle-doc-${doc.value}`}>
                            <div className="doc-upload-card">
                                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                                    <div className="fw-semibold" style={{ fontSize: "14px" }}>{doc.name}</div>
                                    <span className={`doc-status-badge ${isUploading ? "uploading" : url ? "uploaded" : "pending"}`}>
                                        {isUploading ? "Uploading..." : url ? "Uploaded" : "Pending"}
                                    </span>
                                </div>
                                <div className="small text-muted mb-2">PDF only</div>
                                <input type="file" accept="application/pdf" className="form-control form-control-sm mb-2" disabled={isUploading}
                                    onChange={(e) => { handleVehicleDocUpload(e.target.files?.[0], doc.value, vehicleData); e.target.value = ""; }} />
                                {isUploading && (
                                    <div className="mb-2">
                                        <div className="doc-progress-track"><div className="doc-progress-fill" style={{ width: `${progress}%` }} /></div>
                                        <div className="small mt-1" style={{ color: "#6366f1", fontWeight: 600, fontSize: "12px" }}>Uploading {progress}%</div>
                                    </div>
                                )}
                                <div className="d-flex gap-2 flex-wrap">
                                    {url ? (
                                        <>
                                            <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm rounded-pill px-3">Preview</a>
                                            <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={() => { window.open(url.replace('/upload/', '/upload/fl_attachment/'), '_blank'); }}>Download</button>
                                        </>
                                    ) : (
                                        <>
                                            <button type="button" className="btn btn-outline-primary btn-sm rounded-pill px-3" disabled>Preview</button>
                                            <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill px-3" disabled>Download</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const InsertAddVehicle = async () => {
        setActiveSidebarTab("details");
        setIsSubmitting(true);
        if (!vehicleFormData.VehicleNo || !vehicleFormData.VehicleNo.toString().trim()) {
            toastService.warn("Please enter the vehicle number.");
            setIsSubmitting(false);
            return;
        }
        if (!vehicleFormData.VehicleRegNo || !vehicleFormData.VehicleRegNo.toString().trim()) {
            toastService.warn("Please enter the vehicle registration number.");
            setIsSubmitting(false);
            return;
        }
        if (!vehicleFormData.FacilityId) {
            toastService.warn("Please select a facility.");
            setIsSubmitting(false);
            return;
        }
        if (!vehicleFormData.VendorId) {
            toastService.warn("Please select a vendor.");
            setIsSubmitting(false);
            return;
        }
        if (!vehicleFormData.VehicleTypeId) {
            toastService.warn("Please select a vehicle type.");
            setIsSubmitting(false);
            return;
        }
        try {
            const response = await VehicleMasterService.SPR_AddUpdateVehicle({
                ...vehicleFormData,
                VehicleRegDate: formatDateAdd(vehicleFormData.VehicleRegDate),
                PermitExpiryDate: formatDateAdd(vehicleFormData.PermitExpiryDate),
                InsuranceExpiryDate: formatDateAdd(vehicleFormData.InsuranceExpiryDate),
                FitnessExpiryDate: formatDateAdd(vehicleFormData.FitnessExpiryDate),
                TaxExpiryDate: formatDateAdd(vehicleFormData.TaxExpiryDate),
                PUCExpiryDate: formatDateAdd(vehicleFormData.PUCExpiryDate),
                FCValidDate: formatDateAdd(vehicleFormData.FCValidDate),
                PermitIssueDate: formatDateAdd(vehicleFormData.PermitIssueDate),
                EmissionExpiryDate: formatDateAdd(vehicleFormData.EmissionExpiryDate),
                CabInductionDate: formatDateAdd(vehicleFormData.CabInductionDate),
                CabExpiryDate: formatDateAdd(vehicleFormData.CabExpiryDate),
                AttritedDate: formatDateAdd(vehicleFormData.AttritedDate),
                Attrited: isAttrited ? 1 : 0,
                Emergency_Contact: vehicleFormData.Emergency_Contact ? 1 : 0,
                Wireless_Set: vehicleFormData.Wireless_Set ? 1 : 0,
                FireExtinguisher: vehicleFormData.FireExtinguisher ? 1 : 0,
                Spare_Tyre: vehicleFormData.Spare_Tyre ? 1 : 0,
                Medical_Kit: vehicleFormData.Medical_Kit ? 1 : 0,
                Umbrella: vehicleFormData.Umbrella ? 1 : 0,
                Torch: vehicleFormData.Torch ? 1 : 0,
                Documents: vehicleFormData.Documents ? 1 : 0,
                ChasisNo: vehicleFormData.ChasisNo,
                ModalNo: vehicleFormData.ModalNo,
                UpdatedBy: userID,
                FuleType: vehicleFormData.FuleType,
            });

            console.log("Add/Update Vehicle Response:", response);
            toastService.success("The vehicle has been added successfully.");
            if (vehicleFormData.VehicleNo) saveCabType(vehicleFormData.VehicleNo, vehicleCabType);
            if (vehicleFormData.VehicleNo) saveSpeedLock(vehicleFormData.VehicleNo, speedLock);
            if (vehicleFormData.VehicleNo) saveBsEmission(vehicleFormData.VehicleNo, bsEmission);
            if (vehicleFormData.VehicleNo) saveAttriteReason(vehicleFormData.VehicleNo, attriteReason);
            if (vehicleFormData.VehicleNo) saveVehicleMake(vehicleFormData.VehicleNo, vehicleMake);
            if (vehicleFormData.VehicleNo) saveFacilityMapping(vehicleFormData.VehicleNo, facilityMapping);
            if (vehicleFormData.VehicleNo) saveVehicleStatus(vehicleFormData.VehicleNo, vehicleStatus);
            setAddVehicle(false);
            setVehicleFormData(initialFormData);
            setIsAttrited(false);
            setAttriteReason("");
            setVehicleCabType(null);
            setSpeedLock(null);
            setBsEmission(null);
            setVehicleMake("");
            setFacilityMapping([]);
            setVehicleStatus(null);
            resetVehicleDocsState();
            await VehiclesDetailsData();
        } catch (error) {
            console.error("Error while adding vehicle:", error);
            toastService.error("Failed to add vehicle.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const UpdateVehicle = async () => {
        setIsSubmitting(true);
        if (!editVehicleFormData.VehicleNo || !editVehicleFormData.VehicleNo.toString().trim()) {
            toastService.warn("Please enter the vehicle number.");
            setActiveSidebarTab("details");
            setIsSubmitting(false);
            return;
        }
        if (!editVehicleFormData.VehicleRegNo || !editVehicleFormData.VehicleRegNo.toString().trim()) {
            toastService.warn("Please enter the vehicle registration number.");
            setActiveSidebarTab("details");
            setIsSubmitting(false);
            return;
        }
        if (!editVehicleFormData.FacilityId) {
            toastService.warn("Please select a facility.");
            setActiveSidebarTab("details");
            setIsSubmitting(false);
            return;
        }
        if (!editVehicleFormData.VendorId) {
            toastService.warn("Please select a vendor.");
            setActiveSidebarTab("details");
            setIsSubmitting(false);
            return;
        }
        if (!editVehicleFormData.VehicleTypeId) {
            toastService.warn("Please select a vehicle type.");
            setActiveSidebarTab("details");
            setIsSubmitting(false);
            return;
        }
        try {
            const response = await VehicleMasterService.SPR_AddUpdateVehicle({
                ...editVehicleFormData,
                VehicleRegDate: formatDateAdd(editVehicleFormData.VehicleRegDate),
                PermitExpiryDate: formatDateAdd(editVehicleFormData.PermitExpiryDate),
                InsuranceExpiryDate: formatDateAdd(editVehicleFormData.InsuranceExpiryDate),
                FitnessExpiryDate: formatDateAdd(editVehicleFormData.FitnessExpiryDate),
                TaxExpiryDate: formatDateAdd(editVehicleFormData.TaxExpiryDate),
                PUCExpiryDate: formatDateAdd(editVehicleFormData.PUCExpiryDate),
                FCValidDate: formatDateAdd(editVehicleFormData.FCValidDate),
                PermitIssueDate: formatDateAdd(editVehicleFormData.PermitIssueDate),
                EmissionExpiryDate: formatDateAdd(editVehicleFormData.EmissionExpiryDate),
                CabInductionDate: formatDateAdd(editVehicleFormData.CabInductionDate),
                CabExpiryDate: formatDateAdd(editVehicleFormData.CabExpiryDate),
                AttritedDate: formatDateAdd(editVehicleFormData.AttritedDate),
                Attrited: editAttrited ? 1 : 0,
                Emergency_Contact: editVehicleFormData.Emergency_Contact ? 1 : 0,
                Wireless_Set: editVehicleFormData.Wireless_Set ? 1 : 0,
                FireExtinguisher: editVehicleFormData.FireExtinguisher ? 1 : 0,
                Spare_Tyre: editVehicleFormData.Spare_Tyre ? 1 : 0,
                Medical_Kit: editVehicleFormData.Medical_Kit ? 1 : 0,
                Umbrella: editVehicleFormData.Umbrella ? 1 : 0,
                Torch: editVehicleFormData.Torch ? 1 : 0,
                Documents: editVehicleFormData.Documents ? 1 : 0,
                UpdatedBy: userID,
            });

            console.log("Update Vehicle Response:", response);
            toastService.success("Vehicle has been updated successfully.");
            const shuttleKey = editVehicleFormData.Id || editVehicleFormData.VehicleId;
            if (shuttleKey) saveCabType(shuttleKey, editVehicleCabType);
            if (shuttleKey) saveSpeedLock(shuttleKey, editSpeedLock);
            if (shuttleKey) saveBsEmission(shuttleKey, editBsEmission);
            if (shuttleKey) saveAttriteReason(shuttleKey, editAttriteReason);
            if (shuttleKey) saveVehicleMake(shuttleKey, editVehicleMake);
            if (shuttleKey) saveFacilityMapping(shuttleKey, editFacilityMapping);
            if (shuttleKey) saveVehicleStatus(shuttleKey, editVehicleStatus);
            setUpdateVehicle(false);
            setEditVehicleFormData(initialEditFormData);
            setEditAttrited(false);
            setEditAttriteReason("");
            setEditVehicleCabType(null);
            setEditSpeedLock(null);
            setEditBsEmission(null);
            setEditVehicleMake("");
            setEditFacilityMapping([]);
            setEditVehicleStatus(null);
            resetVehicleDocsState();
            await VehiclesDetailsData();
        } catch (error) {
            console.error("Error while updating vehicle:", error);
            toastService.error("Failed to update vehicle.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Put these above the return(...) in your component
const fetchVendorsByFacilityEditDirect = async (facilityId) => {
  try {
    console.log(
      "fetchVendorsByFacilityEditDirect called with facilityId:",
      facilityId
    );
    if (!facilityId) {
      console.warn("No facilityId passed");
      setEditVendor([]);
      return [];
    }
    const response = await VehicleMasterService.GetVendorByFacility({
      facilityid: facilityId,
    });
    const parsedData =
      typeof response === "string" ? JSON.parse(response) : response;
    const formattedData = Array.isArray(parsedData)
      ? parsedData.map((item) => ({ name: item.vendorName, value: item.Id }))
      : [];
    console.log("Direct Edit Vendor Data:", formattedData);
    setEditVendor(formattedData);
    return formattedData; // ✅ Return the data
  } catch (error) {
    console.error("Error while fetching vendor data:", error);
    toastService.error("Failed to load vendor data.");
    setEditVendor([]);
    return [];
  }
};

const fetchSelectVehicleTypeEditDirect = async (vendorId) => {
  try {
    console.log(
      "fetchSelectVehicleTypeEditDirect called with vendorId:",
      vendorId
    );
    if (!vendorId) {
      console.warn("No vendorId passed");
      setEditVehicleType([]);
      return [];
    }
    const response = await VehicleMasterService.SelectVehicleType({
      vendorid: vendorId,
    });
    const parsedData =
      typeof response === "string" ? JSON.parse(response) : response;
    const formattedData = Array.isArray(parsedData)
      ? parsedData.map((item) => ({ name: item.vehicle, value: item.Id }))
      : [];
    console.log("Direct Edit Vehicle Type Data:", formattedData);
    setEditVehicleType(formattedData);
    return formattedData; // ✅ Return the data
  } catch (error) {
    console.error("Error while fetching vehicle type data:", error);
    toastService.error("Failed to load vehicle type data.");
    setEditVehicleType([]);
    return [];
  }
};



    // ========== JSX RETURN ==========
    return (
        <>
            <style>{`
                .custom-calendar-wrapper { position: relative; width: 100%; }
                .custom-calendar-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; z-index: 1; pointer-events: none; }
                .custom-calendar-input .p-inputtext { padding-left: 35px !important; }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
            <Loader isVisible={isSubmitting} fullScreen={true} />
            <Header pageTitle="Vehicle Master" showNewButton={true} onNewButtonClick={() => {
                setVehicleFormData(initialFormData);
                setIsAttrited(false);
                setAttriteReason("");
                setVehicleCabType(null);
                setSpeedLock(null);
                setBsEmission(null);
                setVehicleMake("");
                setFacilityMapping([]);
                setSelectedFacility(null);
                setSelectedVendorAdd(null);
                setSelectedVehicleType(null);
                resetVehicleDocsState();
                setVehicleStatus(null);
                setAddVehicle(true);
            }} />
            <Sidebar />
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="middle">
                <div className="row">
                    <div className="col-12">
                        <h6 className="pageTitle">Vehicle Master</h6>
                    </div>
                    {/* Search Box */}
                    <div className="col-12">
                        <div className="card_tb p-3">
                            <div className="row">
                                <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-3">
                                    <label htmlFor="" className="form-label">
                                        Facility <span className="text-danger">*</span>
                                    </label>
                                    <Dropdown value={selectedCity} onChange={(e) => setSelectedCity(e.value)} options={facility} optionLabel="name" optionValue="value"
                                        placeholder="Select Facility" className="w-100" />
                                </div>
                                <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-3">
                                    <label htmlFor="" className="form-label">
                                        Vendor <span className="text-danger">*</span>
                                    </label>
                                    <Dropdown value={selectedVendor}
                                        onChange={(e) => {
                                            setSelectedVendor(e.value);
                                        }}
                                        options={vendor} optionLabel="name" optionValue="value"
                                        placeholder="Select Vendor" className="w-100" filter />
                                </div>

                                <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-3 no-label">
                                    <ReportButton
                                        label="Submit"
                                        onClick={VehiclesDetailsData}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="col-12 col-md-12 col-lg-3 ms-auto mb-3 d-none">
                                    <label htmlFor="">Search Any</label>
                                    <InputText placeholder="Search Any Value" className="w-100" />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Table Start */}
                    {showTable && (
                        <>
                        <div className="col-12 d-flex align-items-center gap-2 mt-3 mb-2">
                            <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500 }}>Expiry Status:</span>
                            {[
                                { dot: "#EF4444", bg: "#FEE2E2", color: "#B91C1C", label: "Expired" },
                                { dot: "#F59E0B", bg: "#FEF3C7", color: "#92400E", label: "≤ 7 days" },
                                { dot: "#3B82F6", bg: "#DBEAFE", color: "#1E40AF", label: "≤ 15 days" },
                            ].map(({ dot, bg, color, label }) => (
                                <span key={label} style={{
                                    display: "inline-flex", alignItems: "center", gap: "5px",
                                    background: bg, color, fontSize: "11px", fontWeight: 600,
                                    padding: "3px 10px", borderRadius: "20px",
                                }}>
                                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, display: "inline-block" }}></span>
                                    {label}
                                </span>
                            ))}
                        </div>
                        <div className="col-12">
                            <div className="card_tb p-3">
                                <TableToolbar
                                    search={globalFilter}
                                    onSearch={(e) => setGlobalFilter(e.target.value)}
                                    onRefresh={() => setGlobalFilter("")}
                                    onExport={exportExcel}
                                    showFilter={false}
                                    overlayRef={op}
                                    filterButtonRef={filterButtonRef}
                                />
                                <CustomDataTable value={filteredVehicleData.slice(first, first + rows)} emptyMessage="No Records Found">
                                    <Tooltip target=".id-link" content="Click to Edit Details" />
                                    <Column sortable field="Id" header="ID" body={(rowData) => (
                                        <a href="#" className="id-link"
                                        onClick={async (e) => {
  e.preventDefault();
  console.log("ID clicked:", rowData.Id, rowData);

  // 1️⃣ Derive FacilityId
  const facilityObj = editFacility.find(
    (f) =>
      f.name?.trim().toLowerCase() ===
      rowData.FacilityName?.trim().toLowerCase()
  );
  const facilityId = facilityObj ? facilityObj.value : null;
  console.log("Derived FacilityId:", facilityId);

  // 2️⃣ Fetch vendors
  const vendorsData = await fetchVendorsByFacilityEditDirect(facilityId);
  
  // 🔍 DEBUG: Log all vendor names
  console.log("All vendor names from API:", vendorsData.map(v => v.name));
  console.log("VendorName from row:", rowData.VendorName);
  console.log(
    "Normalized row vendor:",
    rowData.VendorName?.trim().toLowerCase()
  );

  // 3️⃣ Find VendorId with better debugging
  const vendorObj = vendorsData.find((v) => {
    const apiName = v.name?.trim().toLowerCase();
    const rowName = rowData.VendorName?.trim().toLowerCase();
    const match = apiName === rowName;
    console.log(`Comparing: "${apiName}" === "${rowName}" -> ${match}`);
    return match;
  });

  const vendorId = vendorObj ? vendorObj.value : null;
  console.log("Derived VendorId:", vendorId, "vendorObj:", vendorObj);

  // 4️⃣ Fetch vehicle types
  if (vendorId) {
    const vehicleTypesData = await fetchSelectVehicleTypeEditDirect(
      vendorId
    );

    // 🔍 DEBUG: Log vehicle type names
console.log("All vehicle types from API:", vehicleTypesData.map(v => v.name));
console.log("VehicleType from row:", rowData.VehicleType);

// 5️⃣ Find VehicleTypeId with fuzzy matching
const vehicleTypeObj = vehicleTypesData.find((vt) => {
  const apiName = vt.name?.trim().toLowerCase();
  const rowName = rowData.VehicleType?.trim().toLowerCase();
  
  // ✅ Check if row name starts with or contains API name
  const match =
    rowName === apiName ||
    rowName.startsWith(apiName) ||
    rowName.includes(apiName);
  
  console.log(
    `Comparing: "${apiName}" in "${rowName}" -> ${match}`
  );
  return match;
});

const vehicleTypeId = vehicleTypeObj ? vehicleTypeObj.value : null;
console.log("Derived VehicleTypeId:", vehicleTypeId, "vehicleTypeObj:", vehicleTypeObj);    

    // 6️⃣ Update form
    setEditVehicleFormData({
      ...rowData,
      FacilityId: facilityId,
      VendorId: vendorId,
      VehicleTypeId: vehicleTypeId,
      VehicleRegDate: rowData.VehicleRegDate
        ? new Date(rowData.VehicleRegDate)
        : null,
      PermitExpiryDate: rowData.PermitExpiryDate
        ? new Date(rowData.PermitExpiryDate)
        : null,
      InsuranceExpiryDate: rowData.InsuranceExpiryDate
        ? new Date(rowData.InsuranceExpiryDate)
        : null,
      FitnessExpiryDate: rowData.FitnessExpiryDate
        ? new Date(rowData.FitnessExpiryDate)
        : null,
      TaxExpiryDate: rowData.TaxExpiryDate
        ? new Date(rowData.TaxExpiryDate)
        : null,
      PUCExpiryDate: rowData.PUCExpiryDate
        ? new Date(rowData.PUCExpiryDate)
        : null,
      CabInductionDate: rowData.CabInductionDate
        ? new Date(rowData.CabInductionDate)
        : null,
      CabExpiryDate: rowData.CabExpiryDate
        ? new Date(rowData.CabExpiryDate)
        : null,
      AttritedDate: rowData.AttritedDate
        ? new Date(rowData.AttritedDate)
        : null,
      Emergency_Contact: rowData.Emergency_Contact === "Yes",
      Wireless_Set: rowData.Wireless_Set === "Yes",
      FireExtinguisher: rowData.FireExtinguisher === "Yes",
      Spare_Tyre: rowData.Spare_Tyre === "Yes",
      Medical_Kit: rowData.Medical_Kit === "Yes",
      Umbrella: rowData.Umbrella === "Yes",
      Torch: rowData.Torch === "Yes",
      Documents: rowData.Documents === "Yes",
    });

    setEditAttrited(rowData.Attrited === "Yes");
    setEditAttriteReason(loadAttriteReason(rowData.Id));
    setEditVehicleCabType(loadCabType(rowData.Id));
    setEditSpeedLock(loadSpeedLock(rowData.Id));
    setEditBsEmission(loadBsEmission(rowData.Id));
    setEditVehicleMake(loadVehicleMake(rowData.Id));
    setEditFacilityMapping(loadFacilityMapping(rowData.Id));
    setEditVehicleStatus(loadVehicleStatus(rowData.Id));
    loadVehicleDocs(rowData);
    setActiveSidebarTab("details");
    setUpdateVehicle(true);
  }
}}



                                        >
                                            {rowData.Id}
                                        </a>
                                    )}></Column>
                                    <Column field="VehicleNo" header="Vehicle No."></Column>
                                    <Column field="VehicleRegDate" header="Vehicle Reg.Date" body={rowData => formatDate(rowData.VehicleRegDate)}></Column>
                                    <Column field="VehicleRegNo" header="Vehicle Reg. No."></Column>
                                    <Column field="VehicleType" header="Vehicle Type"></Column>
                                    <Column field="FacilityName" header="Facility Name"></Column>
                                    <Column field="VendorName" header="Vendor Name"></Column>
                                    <Column field="FuleType" header="Fuel Type"></Column>
                                    <Column field="PermitExpiryDate" header="Permit Expiry" body={rowData => expiryDateBody(rowData.PermitExpiryDate)}></Column>
                                    <Column field="InsuranceExpiryDate" header="Insurance Expiry" body={rowData => expiryDateBody(rowData.InsuranceExpiryDate)}></Column>
                                    <Column field="FitnessExpiryDate" header="Fitness Expiry" body={rowData => expiryDateBody(rowData.FitnessExpiryDate)}></Column>
                                    <Column field="TaxExpiryDate" header="Tax Expiry" body={rowData => expiryDateBody(rowData.TaxExpiryDate)}></Column>
                                    <Column field="PUCExpiryDate" header="PUC Expiry" body={rowData => expiryDateBody(rowData.PUCExpiryDate)}></Column>
                                    <Column field="Attrited" header="Attrited"></Column>
                                </CustomDataTable>
                                <style>{`
                                    .expiry-tooltip-expired .p-tooltip-text { background: #FEE2E2 !important; color: #B91C1C !important; font-weight: 600 !important; border: 1px solid #EF4444 !important; border-radius: 6px !important; }
                                    .expiry-tooltip-expired.p-tooltip-top .p-tooltip-arrow { border-top-color: #FEE2E2 !important; }
                                    .expiry-tooltip-warning .p-tooltip-text { background: #FEF3C7 !important; color: #92400E !important; font-weight: 600 !important; border: 1px solid #F59E0B !important; border-radius: 6px !important; }
                                    .expiry-tooltip-warning.p-tooltip-top .p-tooltip-arrow { border-top-color: #FEF3C7 !important; }
                                    .expiry-tooltip-info .p-tooltip-text { background: #DBEAFE !important; color: #1E40AF !important; font-weight: 600 !important; border: 1px solid #3B82F6 !important; border-radius: 6px !important; }
                                    .expiry-tooltip-info.p-tooltip-top .p-tooltip-arrow { border-top-color: #DBEAFE !important; }
                                `}</style>
                                <Tooltip target=".expiry-tip-expired" className="expiry-tooltip-expired" />
                                <Tooltip target=".expiry-tip-warning" className="expiry-tooltip-warning" />
                                <Tooltip target=".expiry-tip-info" className="expiry-tooltip-info" />
                                <CustomPaginator
                                    first={first}
                                    rows={rows}
                                    totalRecords={filteredVehicleData.length}
                                    onPageChange={onPageChange}
                                    rowsPerPageOptions={[50, 100, 150, 200]}
                                />
                            </div>
                        </div>
                        </>
                    )}
                </div>
            </div>

            {/* Add Vehicle Master */}
            <MasterSidebar
                show={addVehicle}
                onClose={() => setAddVehicle(false)}
                title={
                    <div className="w-100 d-flex justify-content-between align-items-center pe-4 gap-3">
                        <span style={{ whiteSpace: "nowrap" }}>Add Vehicle Master</span>
                        {isAttrited && (
                            <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ animation: "slideDown 0.2s ease", maxWidth: 360 }}>
                                <span className="text-warning fs-6" style={{ whiteSpace: "nowrap" }}>Attrited</span>
                                <input
                                    type="text"
                                    placeholder="Attrite reason..."
                                    value={attriteReason}
                                    onChange={(e) => setAttriteReason(e.target.value)}
                                    style={{ flex: 1, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", fontSize: "0.82rem", borderRadius: "0.375rem", padding: "0.25rem 0.5rem", outline: "none" }}
                                />
                            </div>
                        )}
                    </div>
                }
                width="50%"
                footerButtons={[
                    {
                        label: "Cancel",
                        className: "btn btn-outline-secondary",
                        onClick: () => {
                            setAddVehicle(false);
                            setVehicleFormData(initialFormData);
                            setIsAttrited(false);
                        }
                    },
                    {
                        label: "Save Changes",
                        className: "btn btn-success",
                        onClick: InsertAddVehicle,
                        loading: isSubmitting
                    }
                ]}
            >
                <div className="p-3 bg-white">
                    {renderSidebarTabs()}
                    {activeSidebarTab === "details" && (
                    <div className="row">
                                <div className="col-12 mb-3">
                                    <div className="bg-light-blue w-100 d-flex justify-content-between align-items-center">
                                        <h6 className="sidebarSubTitle">Vehicle Details</h6>
                                        <div className="d-flex align-items-center gap-3 me-3">
                                            <Checkbox inputId="AttriteAdd" checked={isAttrited} onChange={(e) => setIsAttrited(e.target.checked)} />
                                            <label htmlFor="AttriteAdd" className="ms-2">Attrited</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Vehicle No.<span style={{ color: "red" }}>*</span></label>
                                    <InputText className="form-control" placeholder="Vehicle Number" value={vehicleFormData.VehicleNo} onChange={(e) => setVehicleFormData({ ...vehicleFormData, VehicleNo: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Registration No.<span style={{ color: "red" }}>*</span></label>
                                    <InputText className="form-control" placeholder="Vehicle Registration" value={vehicleFormData.VehicleRegNo} onChange={(e) => setVehicleFormData({ ...vehicleFormData, VehicleRegNo: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Registration Date</label>
                                    <div className="custom-calendar-wrapper">
                                        <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                        <Calendar className="w-100 custom-calendar-input" placeholder="Vehicle Registration Date" value={vehicleFormData.VehicleRegDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, VehicleRegDate: e.value })} appendTo="self" />
                                    </div>
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Facility<span style={{ color: "red" }}>*</span></label>
                                    <Dropdown optionLabel="name" optionValue="value" placeholder="Select Facility Name" className="w-100" value={vehicleFormData.FacilityId || ""} onChange={(e) => {
                                        setVehicleFormData({ ...vehicleFormData, FacilityId: e.value, VendorId: 0, VehicleTypeId: 0 });
                                        setSelectedFacility(e.value);
                                        setSelectedVendorAdd(null);
                                        setSelectedVehicleType(null);
                                        setFacilityMapping([]);
                                    }} options={facilityAdd} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Vendor<span style={{ color: "red" }}>*</span></label>
                                    <Dropdown optionLabel="name" optionValue="value" placeholder="Select Vendor Name" className="w-100" filter
                                        value={vehicleFormData.VendorId || ""}
                                        onChange={(e) => {
                                            setSelectedVendorAdd(e.value);
                                            setVehicleFormData({ ...vehicleFormData, VendorId: e.value, VehicleTypeId: 0 });
                                            setSelectedVehicleType(null);
                                        }} options={vendorAdd} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Vehicle Type<span style={{ color: "red" }}>*</span></label>
                                    <Dropdown optionLabel="name" optionValue="value" placeholder="Select Vehicle Type" className="w-100" filter
                                        value={vehicleFormData.VehicleTypeId || ""}
                                        onChange={(e) => {
                                            setSelectedVehicleType(e.value);
                                            setVehicleFormData({ ...vehicleFormData, VehicleTypeId: e.value });
                                        }}
                                        options={vehicleType} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Vehicle Make</label>
                                    <InputText className="form-control" placeholder="e.g. Toyota, Maruti" value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Type</label>
                                    <Dropdown
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Select Type"
                                        className="w-100"
                                        value={vehicleCabType}
                                        onChange={(e) => setVehicleCabType(e.value)}
                                        options={cabTypeOptions}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Status</label>
                                    <Dropdown
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Select Status"
                                        className="w-100"
                                        value={vehicleStatus}
                                        onChange={(e) => setVehicleStatus(e.value)}
                                        options={statusOptions}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Model No.</label>
                                    <InputText className="form-control" placeholder="Model Number" value={vehicleFormData.ModalNo} onChange={(e) => setVehicleFormData({ ...vehicleFormData, ModalNo: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label className="d-block">Fuel Type</label>
                                    <Dropdown optionLabel="name" optionValue="value" placeholder="Select Fuel Type" className="w-100"
                                        value={vehicleFormData.FuleType || ""}
                                        onChange={(e) => setVehicleFormData({ ...vehicleFormData, FuleType: e.value })}
                                        options={fuelType} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label className="d-block">Facility Mapping</label>
                                    <MultiSelect
                                        optionLabel="name"
                                        optionValue="value"
                                        placeholder={vehicleFormData.FacilityId ? "Select Facilities" : "Select Facility first"}
                                        className="w-100"
                                        value={facilityMapping}
                                        onChange={(e) => setFacilityMapping(e.value)}
                                        options={facilityAdd.filter(f => f.value !== vehicleFormData.FacilityId)}
                                        disabled={!vehicleFormData.FacilityId}
                                        display="chip"
                                        appendTo={document.body}
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>BS Emission Standard</label>
                                    <Dropdown
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Select BS Standard"
                                        className="w-100"
                                        value={bsEmission}
                                        onChange={(e) => setBsEmission(e.value)}
                                        options={bsEmissionOptions}
                                        appendTo="self"
                                        showClear
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Insurance No.</label>
                                    <InputText className="form-control" placeholder="Insurance Number" value={vehicleFormData.InsuranceNo} onChange={(e) => setVehicleFormData({ ...vehicleFormData, InsuranceNo: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Insurance Company</label>
                                    <InputText className="form-control" placeholder="Insurance Company Name" value={vehicleFormData.InsuranceCompanyName} onChange={(e) => setVehicleFormData({ ...vehicleFormData, InsuranceCompanyName: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Insurance Expiry</label>
                                    <div className="custom-calendar-wrapper">
                                        <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                        <Calendar className="w-100 custom-calendar-input" placeholder="Insurance Expiry Date" value={vehicleFormData.InsuranceExpiryDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, InsuranceExpiryDate: e.value })} appendTo="self" />
                                    </div>
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Permit Expiry Date</label>
                                    <div className="custom-calendar-wrapper">
                                        <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                        <Calendar className="w-100 custom-calendar-input" placeholder="Permit Expiry Date" value={vehicleFormData.PermitExpiryDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, PermitExpiryDate: e.value })} appendTo="self" />
                                    </div>
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Fitness Expiry</label>
                                    <div className="custom-calendar-wrapper">
                                        <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                        <Calendar className="w-100 custom-calendar-input" placeholder="Fitness Expiry Date" value={vehicleFormData.FitnessExpiryDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, FitnessExpiryDate: e.value })} appendTo="self" />
                                    </div>
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Tax Expiry</label>
                                    <div className="custom-calendar-wrapper">
                                        <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                        <Calendar className="w-100 custom-calendar-input" placeholder="Tax Expiry Date" value={vehicleFormData.TaxExpiryDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, TaxExpiryDate: e.value })} appendTo="self" />
                                    </div>
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>PUC Expiry</label>
                                    <div className="custom-calendar-wrapper">
                                        <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                        <Calendar className="w-100 custom-calendar-input" placeholder="PUC Expiry Date" value={vehicleFormData.PUCExpiryDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, PUCExpiryDate: e.value })} appendTo="self" />
                                    </div>
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Cab Induction</label>
                                    <div className="custom-calendar-wrapper">
                                        <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                        <Calendar className="w-100 custom-calendar-input" placeholder="Cab Induction Date" value={vehicleFormData.CabInductionDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, CabInductionDate: e.value })} appendTo="self" />
                                    </div>
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Cab Expiry</label>
                                    <div className="custom-calendar-wrapper">
                                        <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                        <Calendar className="w-100 custom-calendar-input" placeholder="Cab Expiry Date" value={vehicleFormData.CabExpiryDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, CabExpiryDate: e.value })} appendTo="self" />
                                    </div>
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Chassis No.</label>
                                    <InputText className="form-control" placeholder="Chassis Number" value={vehicleFormData.ChasisNo} onChange={(e) => setVehicleFormData({ ...vehicleFormData, ChasisNo: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Warning-1</label>
                                    <InputText className="form-control" placeholder="Warning-1" value={vehicleFormData.Warning_1} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Warning_1: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Warning-2</label>
                                    <InputText className="form-control" placeholder="Warning-2" value={vehicleFormData.Warning_2} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Warning_2: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Final Warning</label>
                                    <InputText className="form-control" placeholder="Final Warning" value={vehicleFormData.FinalWarning} onChange={(e) => setVehicleFormData({ ...vehicleFormData, FinalWarning: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Attrited Date</label>
                                    <div className="custom-calendar-wrapper">
                                        <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                        <Calendar className="w-100 custom-calendar-input" placeholder="Attrited Date" value={vehicleFormData.AttritedDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, AttritedDate: e.value })} appendTo="self" />
                                    </div>
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Speed Lock (km/h)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="e.g. 80"
                                        value={speedLock ?? ""}
                                        min={0}
                                        max={200}
                                        onChange={(e) => setSpeedLock(e.target.value === "" ? null : Number(e.target.value))}
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Remark</label>
                                    <InputText className="form-control" placeholder="Remark" value={vehicleFormData.Remark} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Remark: e.target.value })} />
                                </div>

                                <div className="col-12 mb-3">
                                    <h6 className="sidebarSubTitle">Other Details</h6>
                                </div>
                                <div className="field col-12 d-flex flex-wrap justify-content-start align-items-center gap-4" style={{ whiteSpace: "nowrap" }}>
                                    <div className="d-flex">
                                        <Checkbox inputId="EmergencyContactAdd" checked={vehicleFormData.Emergency_Contact} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Emergency_Contact: e.checked })} />
                                        <label htmlFor="EmergencyContactAdd" className="ms-2">Emergency Contact Detail Danglers</label>
                                    </div>

                                    <div className="d-flex">
                                        <Checkbox inputId="WirelessSetAdd" checked={vehicleFormData.Wireless_Set} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Wireless_Set: e.checked })} />
                                        <label htmlFor="WirelessSetAdd" className="ms-2">Wireless Set</label>
                                    </div>

                                    <div className="d-flex">
                                        <Checkbox inputId="FireExtinguisherAdd" checked={vehicleFormData.FireExtinguisher} onChange={(e) => setVehicleFormData({ ...vehicleFormData, FireExtinguisher: e.checked })} />
                                        <label htmlFor="FireExtinguisherAdd" className="ms-2">Fire Extinguisher</label>
                                    </div>

                                    <div className="d-flex">
                                        <Checkbox inputId="SpareTyreAdd" checked={vehicleFormData.Spare_Tyre} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Spare_Tyre: e.checked })} />
                                        <label htmlFor="SpareTyreAdd" className="ms-2">Spare Tyre</label>
                                    </div>
                                    <div className="d-flex">
                                        <Checkbox inputId="MedicalKitAdd" checked={vehicleFormData.Medical_Kit} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Medical_Kit: e.checked })} />
                                        <label htmlFor="MedicalKitAdd" className="ms-2">Medical Kit</label>
                                    </div>
                                    <div className="d-flex">
                                        <Checkbox inputId="UmbrellaAdd" checked={vehicleFormData.Umbrella} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Umbrella: e.checked })} />
                                        <label htmlFor="UmbrellaAdd" className="ms-2">Umbrella</label>
                                    </div>
                                    <div className="d-flex">
                                        <Checkbox inputId="TorchAdd" checked={vehicleFormData.Torch} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Torch: e.checked })} />
                                        <label htmlFor="TorchAdd" className="ms-2">Torch</label>
                                    </div>
                                    <div className="d-flex">
                                        <Checkbox inputId="DocumentsAdd" checked={vehicleFormData.Documents} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Documents: e.checked })} />
                                        <label htmlFor="DocumentsAdd" className="ms-2">Documents</label>
                                    </div>
                                </div>

                            </div>
                    )}
                    {activeSidebarTab === "documents" && renderVehicleDocumentCards(vehicleFormData)}
                        </div>
            </MasterSidebar>

            {/* Edit Vehicle Master */}
            <MasterSidebar
                show={updateVehicle}
                onClose={() => setUpdateVehicle(false)}
                title={
                    <div className="w-100 d-flex justify-content-between align-items-center pe-4 gap-3">
                        <span style={{ whiteSpace: "nowrap" }}>Edit Vehicle Master</span>
                        {editAttrited && (
                            <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ animation: "slideDown 0.2s ease", maxWidth: 360 }}>
                                <span className="text-warning fs-6" style={{ whiteSpace: "nowrap" }}>Attrited</span>
                                <input
                                    type="text"
                                    placeholder="Attrite reason..."
                                    value={editAttriteReason}
                                    onChange={(e) => setEditAttriteReason(e.target.value)}
                                    style={{ flex: 1, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", fontSize: "0.82rem", borderRadius: "0.375rem", padding: "0.25rem 0.5rem", outline: "none" }}
                                />
                            </div>
                        )}
                    </div>
                }
                width="50%"
                footerButtons={[
                    {
                        label: "Cancel",
                        className: "btn btn-outline-secondary",
                        onClick: () => setUpdateVehicle(false)
                    },
                    {
                        label: "Update Data",
                        className: "btn btn-success",
                        onClick: UpdateVehicle,
                        loading: isSubmitting
                    }
                ]}
            >
                <div className="p-3 bg-white">
                    {renderSidebarTabs()}
                    {activeSidebarTab === "details" && (
                    <div className="row">
                                <div className="col-12 mb-3">
                                    <div className="bg-light-blue w-100 d-flex justify-content-between align-items-center">
                                        <h6 className="sidebarSubTitle">Vehicle Details</h6>
                                        <div className="d-flex align-items-center gap-3 me-3">
                                            <Checkbox inputId="AttriteEdit" checked={editAttrited} onChange={(e) => setEditAttrited(e.checked)} />
                                            <label htmlFor="AttriteEdit" className="ms-2">Attrited</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Vehicle No.</label>
                                    <InputText className="form-control" placeholder="Vehicle Number"
                                        value={editVehicleFormData.VehicleNo}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, VehicleNo: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Registration No.</label>
                                    <InputText className="form-control" placeholder="Vehicle Registration"
                                        value={editVehicleFormData.VehicleRegNo}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, VehicleRegNo: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Registration Date</label>
                                    <div className="custom-calendar-wrapper">
                                        <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                        <Calendar className="w-100 custom-calendar-input" placeholder="Vehicle Registration Date"
                                            value={editVehicleFormData.VehicleRegDate}
                                            onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, VehicleRegDate: e.value })} appendTo="self" />
                                    </div>
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Facility</label>
                                    <Dropdown 
                                        optionLabel="name" 
                                        optionValue="value" 
                                        placeholder="Select Facility Name" 
                                        className="w-100" 
                                        options={editFacility}
                                        value={editVehicleFormData.FacilityId || ""}
                                        onChange={(e) => {
                                            setEditVehicleFormData({ 
                                                ...editVehicleFormData, 
                                                FacilityId: e.value,
                                                VendorId: 0,
                                                VehicleTypeId: 0
                                            });
                                            setEditSelectedFacility(e.value);
                                            setSelectedEditVendor(null);
                                            setSelectedEditVehicleType(null);
                                            setEditFacilityMapping([]);
                                        }}
                                        filter
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Vendor</label>
                                    <Dropdown 
                                        optionLabel="name" 
                                        optionValue="value" 
                                        placeholder="Select Vendor Name" 
                                        className="w-100" 
                                        filter
                                        options={editVendor} 
                                        value={editVehicleFormData.VendorId || ""}
                                        onChange={(e) => {
                                            setEditVehicleFormData({ 
                                                ...editVehicleFormData, 
                                                VendorId: e.value,
                                                VehicleTypeId: 0
                                            });
                                            setSelectedEditVendor(e.value);
                                            setSelectedEditVehicleType(null);
                                        }}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Vehicle Type</label>
                                    <Dropdown
                                        optionLabel="name"
                                        optionValue="value"
                                        placeholder="Select Vehicle Type"
                                        className="w-100"
                                        filter
                                        value={editVehicleFormData.VehicleTypeId || ""}
                                        onChange={(e) => {
                                            setEditVehicleFormData({
                                                ...editVehicleFormData,
                                                VehicleTypeId: e.value
                                            })
                                            setSelectedEditVehicleType(e.value);
                                        }}
                                        options={editVehicleType}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Vehicle Make</label>
                                    <InputText className="form-control" placeholder="e.g. Toyota, Maruti" value={editVehicleMake} onChange={(e) => setEditVehicleMake(e.target.value)} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Type</label>
                                    <Dropdown
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Select Type"
                                        className="w-100"
                                        value={editVehicleCabType}
                                        onChange={(e) => setEditVehicleCabType(e.value)}
                                        options={cabTypeOptions}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Status</label>
                                    <Dropdown
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Select Status"
                                        className="w-100"
                                        value={editVehicleStatus}
                                        onChange={(e) => setEditVehicleStatus(e.value)}
                                        options={statusOptions}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Model No.</label>
                                    <InputText className="form-control" placeholder="Model Number"
                                        value={editVehicleFormData.ModalNo}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, ModalNo: e.target.value })}
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label className="d-block">Fuel Type</label>
                                    <Dropdown
                                        optionLabel="name"
                                        optionValue="value"
                                        placeholder="Select Fuel Type"
                                        className="w-100"
                                        filter
                                        value={editVehicleFormData.FuleType || ""}
                                        options={editFuelType}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, FuleType: e.value })}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label className="d-block">Facility Mapping</label>
                                    <MultiSelect
                                        optionLabel="name"
                                        optionValue="value"
                                        placeholder={editVehicleFormData.FacilityId ? "Select Facilities" : "Select Facility first"}
                                        className="w-100"
                                        value={editFacilityMapping}
                                        onChange={(e) => setEditFacilityMapping(e.value)}
                                        options={editFacility.filter(f => f.value !== editVehicleFormData.FacilityId)}
                                        disabled={!editVehicleFormData.FacilityId}
                                        display="chip"
                                        appendTo={document.body}
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>BS Emission Standard</label>
                                    <Dropdown
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Select BS Standard"
                                        className="w-100"
                                        value={editBsEmission}
                                        onChange={(e) => setEditBsEmission(e.value)}
                                        options={bsEmissionOptions}
                                        appendTo="self"
                                        showClear
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Insurance No.</label>
                                    <InputText className="form-control" placeholder="Insurance Number"
                                        value={editVehicleFormData.InsuranceNo}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, InsuranceNo: e.target.value })}
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Insurance Company</label>
                                    <InputText className="form-control" placeholder="Insurance Company Name"
                                        value={editVehicleFormData.InsuranceCompanyName}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, InsuranceCompanyName: e.target.value })}
                                    />
                                </div>
                                {[
                                    { label: "Insurance Expiry", field: "InsuranceExpiryDate", placeholder: "Insurance Expiry Date" },
                                    { label: "Permit Expiry Date", field: "PermitExpiryDate", placeholder: "Permit Expiry Date" },
                                    { label: "Fitness Expiry", field: "FitnessExpiryDate", placeholder: "Fitness Expiry Date" },
                                    { label: "Tax Expiry", field: "TaxExpiryDate", placeholder: "Tax Expiry Date" },
                                    { label: "PUC Expiry", field: "PUCExpiryDate", placeholder: "PUC Expiry Date" },
                                    { label: "Cab Expiry", field: "CabExpiryDate", placeholder: "Cab Expiry Date" },
                                ].map(({ label, field, placeholder }) => {
                                    const status = getExpiryBadge(editVehicleFormData[field]);
                                    return (
                                        <div key={field} className="field col-4 mb-3">
                                            <label style={status ? { color: status.color, fontWeight: 600 } : {}}>
                                                {label}
                                            </label>
                                            <div className="custom-calendar-wrapper" style={status ? { border: `1.5px solid ${status.dot}`, borderRadius: "6px" } : {}}>
                                                <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                                <Calendar
                                                    className="w-100 custom-calendar-input"
                                                    placeholder={placeholder}
                                                    value={editVehicleFormData[field]}
                                                    onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, [field]: e.value })}
                                                    appendTo="self"
                                                />
                                            </div>
                                            {status && (
                                                <small style={{ color: status.color, fontWeight: 600, fontSize: "11px", marginTop: "3px", display: "block" }}>
                                                    ● {status.label}
                                                </small>
                                            )}
                                        </div>
                                    );
                                })}
                                <div className="field col-4 mb-3">
                                    <label>Cab Induction</label>
                                    <div className="custom-calendar-wrapper">
                                        <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                        <Calendar className="w-100 custom-calendar-input" placeholder="Cab Induction Date"
                                            value={editVehicleFormData.CabInductionDate}
                                            onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, CabInductionDate: e.value })}
                                            appendTo="self"
                                        />
                                    </div>
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Chassis No.</label>
                                    <InputText className="form-control" placeholder="Chassis Number"
                                        value={editVehicleFormData.ChasisNo}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, ChasisNo: e.target.value })}
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Warning-1</label>
                                    <InputText className="form-control" placeholder="Warning-1"
                                        value={editVehicleFormData.Warning_1}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Warning_1: e.target.value })}
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Warning-2</label>
                                    <InputText className="form-control" placeholder="Warning-2"
                                        value={editVehicleFormData.Warning_2}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Warning_2: e.target.value })}
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Final Warning</label>
                                    <InputText className="form-control" placeholder="Final Warning"
                                        value={editVehicleFormData.FinalWarning}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, FinalWarning: e.target.value })}
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Attrited Date</label>
                                    <div className="custom-calendar-wrapper">
                                        <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                        <Calendar className="w-100 custom-calendar-input" placeholder="Attrited Date"
                                            value={editVehicleFormData.AttritedDate}
                                            onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, AttritedDate: e.value })}
                                            appendTo="self"
                                        />
                                    </div>
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Speed Lock (km/h)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="e.g. 80"
                                        value={editSpeedLock ?? ""}
                                        min={0}
                                        max={200}
                                        onChange={(e) => setEditSpeedLock(e.target.value === "" ? null : Number(e.target.value))}
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Remark</label>
                                    <InputText className="form-control" placeholder="Remark"
                                        value={editVehicleFormData.Remark}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Remark: e.target.value })}
                                    />
                                </div>

                                <div className="col-12 mb-3">
                                    <h6 className="sidebarSubTitle">Other Details</h6>
                                </div>
                                <div className="field col-12 d-flex flex-wrap justify-content-start align-items-center gap-4" style={{ whiteSpace: "nowrap" }}>
                                    <div className="d-flex">
                                        <Checkbox 
                                            inputId="EmergencyContactEdit" 
                                            checked={editVehicleFormData.Emergency_Contact}
                                            onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Emergency_Contact: e.checked })}
                                        />
                                        <label htmlFor="EmergencyContactEdit" className="ms-2">Emergency Contact Detail Danglers</label>
                                    </div>

                                    <div className="d-flex">
                                        <Checkbox 
                                            inputId="WirelessSetEdit" 
                                            checked={editVehicleFormData.Wireless_Set}
                                            onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Wireless_Set: e.checked })}
                                        />
                                        <label htmlFor="WirelessSetEdit" className="ms-2">Wireless Set</label>
                                    </div>

                                    <div className="d-flex">
                                        <Checkbox 
                                            inputId="FireExtinguisherEdit" 
                                            checked={editVehicleFormData.FireExtinguisher}
                                            onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, FireExtinguisher: e.checked })}
                                        />
                                        <label htmlFor="FireExtinguisherEdit" className="ms-2">Fire Extinguisher</label>
                                    </div>

                                    <div className="d-flex">
                                        <Checkbox 
                                            inputId="SpareTyreEdit" 
                                            checked={editVehicleFormData.Spare_Tyre}
                                            onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Spare_Tyre: e.checked })}
                                        />
                                        <label htmlFor="SpareTyreEdit" className="ms-2">Spare Tyre</label>
                                    </div>
                                    <div className="d-flex">
                                        <Checkbox 
                                            inputId="MedicalKitEdit" 
                                            checked={editVehicleFormData.Medical_Kit}
                                            onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Medical_Kit: e.checked })}
                                        />
                                        <label htmlFor="MedicalKitEdit" className="ms-2">Medical Kit</label>
                                    </div>
                                    <div className="d-flex">
                                        <Checkbox 
                                            inputId="UmbrellaEdit" 
                                            checked={editVehicleFormData.Umbrella}
                                            onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Umbrella: e.checked })}
                                        />
                                        <label htmlFor="UmbrellaEdit" className="ms-2">Umbrella</label>
                                    </div>
                                    <div className="d-flex">
                                        <Checkbox 
                                            inputId="TorchEdit" 
                                            checked={editVehicleFormData.Torch}
                                            onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Torch: e.checked })}
                                        />
                                        <label htmlFor="TorchEdit" className="ms-2">Torch</label>
                                    </div>
                                    <div className="d-flex">
                                        <Checkbox 
                                            inputId="DocumentsEdit" 
                                            checked={editVehicleFormData.Documents}
                                            onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Documents: e.checked })}
                                        />
                                        <label htmlFor="DocumentsEdit" className="ms-2">Documents</label>
                                    </div>
                                </div>

                            </div>
                    )}
                    {activeSidebarTab === "documents" && renderVehicleDocumentCards(editVehicleFormData)}
                        </div>
            </MasterSidebar>
        </>
    )
}

export default VehicleMaster;