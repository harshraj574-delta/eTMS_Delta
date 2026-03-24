import React, { useEffect, useState } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { Tooltip } from "primereact/tooltip";
import { Checkbox } from "primereact/checkbox";
import { FileUpload } from "primereact/fileupload";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import MasterSidebar from "./Master/MasterSidebar";
import VehicleMasterService from "../services/compliance/VehicleMasterService";
import sessionManager from "../utils/SessionManager.js";
import { toastService } from "../services/toastService.js";
import ReportButton from "./common/ReportButton";
import Loader from "./common/Loader";
import CustomPaginator from "./common/CustomPaginator";
import { ToastContainer } from "react-toastify";

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

    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(50);

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

    // ========== OTHER FUNCTIONS ==========
    const handleUpload = async () => {
        if (!selectedFile) {
            toastService.warn("Please select a file to upload.");
            return;
        }

        const toBase64 = (file) =>
            new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result.split(",")[1]);
                reader.onerror = (error) => reject(error);
            });

        const base64File = await toBase64(selectedFile);

        const payload = {
            FacilityId: vehicleFormData.FacilityId || 0,
            VehicleId: vehicleFormData.VehicleId || 0,
            VehicleNo: vehicleFormData.VehicleNo || "",
            DocumentId: vehicleFormData.DocumentType || 0,
            DocumentName: selectedFile.name,
            UpdatedBy: userID,
            File: {
                ContentLength: selectedFile.size,
                ContentType: selectedFile.type,
                FileName: selectedFile.name,
                InputStream: base64File
            }
        };

        try {
            const response = await VehicleMasterService.SPR_AddUpdateVehicleDocument(payload);

            if (Array.isArray(response) && response.length > 0 && response[0].RESULT === 0) {
                toastService.success("File uploaded successfully.");
                setSelectedFile(null);
            } else {
                const errorMessage = typeof response === 'string' ? response : "File upload failed.";
                toastService.error(errorMessage);
            }
        } catch (error) {
            console.error("An error occurred during file upload:", error);
            toastService.error("Failed to upload the file!");
        }
    };

    const InsertAddVehicle = async () => {
        setIsSubmitting(true);
        if (!vehicleFormData.VehicleNo) {
            toastService.warn("Please enter the vehicle number.");
            setIsSubmitting(false);
            return;
        }
        if (!vehicleFormData.VehicleRegNo) {
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
            setAddVehicle(false);
            setVehicleFormData(initialFormData);
            setIsAttrited(false);
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
            setUpdateVehicle(false);
            setEditVehicleFormData(initialEditFormData);
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
            <Loader isVisible={isSubmitting} fullScreen={true} />
            <Header pageTitle="Vehicle Master" showNewButton={true} onNewButtonClick={() => {
                setVehicleFormData(initialFormData);
                setIsAttrited(false);
                setSelectedFacility(null);
                setSelectedVendorAdd(null);
                setSelectedVehicleType(null);
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
                        <div className="col-12">
                            <div className="card_tb">
                                <DataTable value={[...vehicleDetails].slice(first, first + rows)} emptyMessage="No Records Found">
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
                                    <Column field="PermitExpiryDate" header="Permit Expiry Date" body={rowData => formatDate(rowData.PermitExpiryDate)}></Column>
                                    <Column field="InsuranceExpiryDate" header="Insurance Expiry Date" body={rowData => formatDate(rowData.InsuranceExpiryDate)}></Column>
                                    <Column field="FitnessExpiryDate" header="Fitness Expiry Date" body={rowData => formatDate(rowData.FitnessExpiryDate)}></Column>
                                    <Column field="TaxExpiryDate" header="Tax Expiry Date" body={rowData => formatDate(rowData.TaxExpiryDate)}></Column>
                                    <Column field="PUCExpiryDate" header="PUC Expiry Date" body={rowData => formatDate(rowData.PUCExpiryDate)}></Column>
                                    <Column field="Attrited" header="Attrited"></Column>
                                </DataTable>
                                <CustomPaginator
                                    first={first}
                                    rows={rows}
                                    totalRecords={vehicleDetails.length}
                                    onPageChange={onPageChange}
                                    rowsPerPageOptions={[50, 100, 150, 200]}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Vehicle Master */}
            <MasterSidebar
                show={addVehicle}
                onClose={() => setAddVehicle(false)}
                title={
                    <div className="w-100 d-flex justify-content-between align-items-center pe-4">
                        <span>Add Vehicle Master</span>
                        {isAttrited && <span className="text-warning fs-6">Attrited</span>}
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
                    <div className="row">
                                <div className="col-12 mb-3">
                                    <div className="bg-light-blue w-100 d-flex justify-content-between align-items-center">
                                        <h6 className="sidebarSubTitle">Vehicle Details</h6>
                                        <div className="d-flex justify-content-between me-3">
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
                                    <Calendar className="w-100" placeholder="Vehicle Registration Date" value={vehicleFormData.VehicleRegDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, VehicleRegDate: e.value })} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Facility<span style={{ color: "red" }}>*</span></label>
                                    <Dropdown optionLabel="name" optionValue="value" placeholder="Select Facility Name" className="w-100" value={vehicleFormData.FacilityId || ""} onChange={(e) => {
                                        setVehicleFormData({ ...vehicleFormData, FacilityId: e.value, VendorId: 0, VehicleTypeId: 0 });
                                        setSelectedFacility(e.value);
                                        setSelectedVendorAdd(null);
                                        setSelectedVehicleType(null);
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
                                    <label>Permit Expiry Date</label>
                                    <Calendar className="w-100" placeholder="Permit Expiry Date" value={vehicleFormData.PermitExpiryDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, PermitExpiryDate: e.value })} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Insurance Expiry</label>
                                    <Calendar className="w-100" placeholder="Insurance Expiry Date" value={vehicleFormData.InsuranceExpiryDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, InsuranceExpiryDate: e.value })} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Fitness Expiry</label>
                                    <Calendar className="w-100" placeholder="Fitness Expiry Date" value={vehicleFormData.FitnessExpiryDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, FitnessExpiryDate: e.value })} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Tax Expiry</label>
                                    <Calendar className="w-100" placeholder="Tax Expiry Date" value={vehicleFormData.TaxExpiryDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, TaxExpiryDate: e.value })} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>PUC Expiry</label>
                                    <Calendar className="w-100" placeholder="PUC Expiry Date" value={vehicleFormData.PUCExpiryDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, PUCExpiryDate: e.value })} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Cab Induction</label>
                                    <Calendar className="w-100" placeholder="Cab Induction Date" value={vehicleFormData.CabInductionDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, CabInductionDate: e.value })} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Cab Expiry</label>
                                    <Calendar className="w-100" placeholder="Cab Expiry Date" value={vehicleFormData.CabExpiryDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, CabExpiryDate: e.value })} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Chassis No.</label>
                                    <InputText className="form-control" placeholder="Chassis Number" value={vehicleFormData.ChasisNo} onChange={(e) => setVehicleFormData({ ...vehicleFormData, ChasisNo: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Model No.</label>
                                    <InputText className="form-control" placeholder="Model Number" value={vehicleFormData.ModalNo} onChange={(e) => setVehicleFormData({ ...vehicleFormData, ModalNo: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Insurance No.</label>
                                    <InputText className="form-control" placeholder="Insurance Number" value={vehicleFormData.InsuranceNo} onChange={(e) => setVehicleFormData({ ...vehicleFormData, InsuranceNo: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Insurance Company</label>
                                    <InputText className="form-control" placeholder="Insurance Company Name" value={vehicleFormData.InsuranceCompanyName} onChange={(e) => setVehicleFormData({ ...vehicleFormData, InsuranceCompanyName: e.target.value })} />
                                </div>
                                <div className="field col-4">
                                    <label className="d-block">Fuel Type</label>
                                    <Dropdown optionLabel="name" optionValue="value" placeholder="Select Fuel Type" className="w-100"
                                        value={vehicleFormData.FuleType || ""}
                                        onChange={(e) => setVehicleFormData({ ...vehicleFormData, FuleType: e.value })}
                                        options={fuelType} appendTo="self" />
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
                                    <Calendar className="w-100" placeholder="Attrited Date" value={vehicleFormData.AttritedDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, AttritedDate: e.value })} appendTo="self" />
                                </div>
                                <div className="field col-8 mb-3">
                                    <label>Remark</label>
                                    <InputText className="form-control" placeholder="Remark" value={vehicleFormData.Remark} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Remark: e.target.value })} />
                                </div>
                                <div className="col-12 mb-3">
                                    <h6 className="sidebarSubTitle">Document Details</h6>
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Document Type</label>
                                    <Dropdown optionLabel="name" optionValue="value" placeholder="Select Document Type" className="w-100" filter options={documentDetails} value={vehicleFormData.DocumentType || ""} onChange={(e) => setVehicleFormData({ ...vehicleFormData, DocumentType: e.value })} />
                                </div>
                                <div className="field col-8 mb-3">
                                    <label>Choose File</label>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'start' }}>
                                        <FileUpload mode="basic"
                                            name="file[]"
                                            accept="image/*"
                                            className=""
                                            multiple
                                            customUpload
                                            uploadHandler={(e) => {
                                                if (e.files && e.files.length > 0) {
                                                    setSelectedFile(e.files[0]);
                                                }
                                            }}
                                            chooseLabel={selectedFile ? selectedFile.name : "Choose File"} />

                                        <button className="btn btn-dark ms-2" onClick={handleUpload}>Upload File</button>
                                    </div>
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
                        </div>
            </MasterSidebar>

            {/* Edit Vehicle Master */}
            <MasterSidebar
                show={updateVehicle}
                onClose={() => setUpdateVehicle(false)}
                title={
                    <div className="w-100 d-flex justify-content-between align-items-center pe-4">
                        <span>Edit Vehicle Master</span>
                        {editAttrited && <span className="text-warning fs-6">Attrited</span>}
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
                    <div className="row">
                                <div className="col-12 mb-3">
                                    <div className="bg-light-blue w-100 d-flex justify-content-between align-items-center">
                                        <h6 className="sidebarSubTitle">Vehicle Details</h6>
                                        <div className="d-flex justify-content-between me-3">
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
                                    <Calendar className="w-100" placeholder="Vehicle Registration Date"
                                        value={editVehicleFormData.VehicleRegDate}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, VehicleRegDate: e.value })} appendTo="self" />
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
                                    <label>Permit Expiry Date</label>
                                    <Calendar className="w-100" placeholder="Permit Expiry Date"
                                        value={editVehicleFormData.PermitExpiryDate}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, PermitExpiryDate: e.value })}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Insurance Expiry</label>
                                    <Calendar className="w-100" placeholder="Insurance Expiry Date"
                                        value={editVehicleFormData.InsuranceExpiryDate}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, InsuranceExpiryDate: e.value })}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Fitness Expiry</label>
                                    <Calendar className="w-100" placeholder="Fitness Expiry Date"
                                        value={editVehicleFormData.FitnessExpiryDate}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, FitnessExpiryDate: e.value })}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Tax Expiry</label>
                                    <Calendar className="w-100" placeholder="Tax Expiry Date"
                                        value={editVehicleFormData.TaxExpiryDate}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, TaxExpiryDate: e.value })}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>PUC Expiry</label>
                                    <Calendar className="w-100" placeholder="PUC Expiry Date"
                                        value={editVehicleFormData.PUCExpiryDate}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, PUCExpiryDate: e.value })}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Cab Induction</label>
                                    <Calendar className="w-100" placeholder="Cab Induction Date"
                                        value={editVehicleFormData.CabInductionDate}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, CabInductionDate: e.value })}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Cab Expiry</label>
                                    <Calendar className="w-100" placeholder="Cab Expiry Date"
                                        value={editVehicleFormData.CabExpiryDate}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, CabExpiryDate: e.value })}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Chassis No.</label>
                                    <InputText className="form-control" placeholder="Chassis Number"
                                        value={editVehicleFormData.ChasisNo}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, ChasisNo: e.target.value })}
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
                                <div className="field col-4">
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
                                    <Calendar className="w-100" placeholder="Attrited Date"
                                        value={editVehicleFormData.AttritedDate}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, AttritedDate: e.value })}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-8 mb-3">
                                    <label>Remark</label>
                                    <InputText className="form-control" placeholder="Remark"
                                        value={editVehicleFormData.Remark}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Remark: e.target.value })}
                                    />
                                </div>
                                <div className="col-12 mb-3">
                                    <h6 className="sidebarSubTitle">Document Details</h6>
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Document Type</label>
                                    <Dropdown 
                                        optionLabel="name" 
                                        optionValue="value" 
                                        placeholder="Select Document Type" 
                                        className="w-100" 
                                        filter 
                                        options={documentDetails} 
                                        value={editVehicleFormData.DocumentType || ""} 
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, DocumentType: e.value })} 
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Choose File</label>
                                    <FileUpload mode="basic" name="demo[]" accept="image/*" className="w-100" />
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
                        </div>
            </MasterSidebar>
        </>
    )
}

export default VehicleMaster;