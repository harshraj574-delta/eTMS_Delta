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
import { Sidebar as PrimeSidebar } from "primereact/sidebar"; // Renamed to avoid conflict with your Sidebar component
import VehicleMasterService from "../services/compliance/VehicleMasterService";
import sessionManager from "../utils/SessionManager.js";
import { toastService } from "../services/toastService.js";
import { update } from "lodash";
import { tooltip } from "leaflet";

const VehicleMaster = () => {
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
    const [editAttrited, setEditAttrited] = useState();
    const [showTable, setShowTable] = useState(false);
    const [facilityAdd, setFacilityAdd] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [editFacility, setEditFacility] = useState(null);
    const [editselectedFacility, setEditSelectedFacility] = useState(null);
    const [selectedVendorAdd, setSelectedVendorAdd] = useState(null);
    const [vendorAdd, setVendorAdd] = useState([]);
    const [editVendor, setEditVendor] = useState([]);
    const [selectedEditVendor, setSelectedEditVendor] = useState(null);
    const [vehicleType, setVehicleType] = useState([]);
    const [editVehicleType, setEditVehicleType] = useState([]);

    const [selectedVehicleType, setSelectedVehicleType] = useState(null);
    const [selectedEditVehicleType, setSelectedEditVehicleType] = useState(null);
    // Fuel type options array
    const [fuelType, setFuelType] = useState([]);
    const [editFuelType, setEditFuelType] = useState([]);
   
    const [documentDetails, setDocumentDetails] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date)) return "";
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`; // <-- space separator
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
    //const [editVehicle, setEditVehicle] = useState(false);
    useEffect(() => {
        fetchFacility();
        fetchFuelMaster();
        fetchFuelMasterEdit();
        fetchFacilityAdd();
        fetchFacilityEdit();
        fetchDocumentDetails();
        //fetchVendorsByFacilityAdd();
    }, []);

    // useEffect(() => {
    //     if (facility.length > 0) {
    //         const userFacilityId = sessionManager.getUserSession().FacilityID;
    //         const defaultFacility = facility.find(f => f.value === userFacilityId) || facility[0];
    //         setSelectedCity(defaultFacility.value);
    //     }
    // // }, [facility]);

    useEffect(() => {
        if (selectedCity) {
            fetchVendorsByFacility();
        }
        if (selectedFacility) {
            fetchVendorsByFacilityAdd();
        }
        // if (editselectedFacility) {
        //     fetchVendorsByFacilityEdit();
        // }
        if (selectedVendorAdd) {
            fetchSelectVehicleType();
        }
        // if (selectedEditVendor) {
        //     fetchSelectVehicleTypeEdit();
        // }
    }, [selectedCity, selectedFacility, selectedVendorAdd]);

    // useEffect(() => {
    //     if (vendor.length > 0) {
    //         const userVendorId = sessionManager.getUserSession().VendorID;
    //         const defaultVendor = vendor.find(v => v.value === userVendorId) || vendor[0];
    //         setSelectedVendor(defaultVendor.value);
    //     }
    // }, [vendor]);
    const fetchFuelMaster = async () => {
        try {
            const response = await VehicleMasterService.sp_getfuelmaster();
            const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
            const formattedData = parsedData.map(item => ({
                name: item.fueltype,
                value: item.Id
            }));
            // console.log("Fuel Data:", formattedData);
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
            // console.log("Facility Data:", formattedData);
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
            //console.log("Vendor Data:", formattedData);
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
        const response = await VehicleMasterService.SelectVehicleType({
            vendorid: selectedEditVendor,
        });
        const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
        const formattedData = parsedData.map(item => ({
            name: item.vehicle,
            value: item.Id
        }));
        console.log("Vehicle Type Data:", formattedData);
        setEditVehicleType(formattedData);
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
            // console.log("Facility Data:", formattedData);
            setFacilityAdd(formattedData);
        } catch (error) {
            console.error("Error while fetching facility data:", error);
            toastService.error("Failed to load facility data.");
        }
    }
    const fetchFacilityEdit = async () => {
        const response = await VehicleMasterService.SelectFacility({
            Userid: userID,
        })
        const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
        const formattedData = parsedData.map(item => ({
            name: item.facilityName,
            value: item.Id
        }));
        setEditFacility(formattedData);
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
            console.log("Vendor Data:", formattedData);
            setVendorAdd(formattedData);
        } catch (error) {
            console.error("Error while fetching vendor data:", error);
            toastService.error("Failed to load vendor data.");
        }
    }
    const fetchVendorsByFacilityEdit = async () => {
        const response = await VehicleMasterService.GetVendorByFacility({
            facilityid: editselectedFacility
        });
        const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
        const formattedData = parsedData.map(item => ({
            name: item.vendorName,
            value: item.Id
        }));
        setEditVendor(formattedData);
    }
    const VehiclesDetailsData = async () => {
        setIsSubmitting(true);
        try {
            const response = await VehicleMasterService.SPR_VehiclesDetails({
                facilityid: selectedCity,
                vendorid: selectedVendor,
                search: ""
            });
            const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
            //console.log("Vehicle Details Data:", parsedData);
            setVehicleDetails(parsedData);
            setShowTable(true); // Show table on submitF
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

    // Open sidebar with employee data
    const openEditSidebar = () => {
        setUpdateVehicle(true); // Open sidebar
    };
    // State initialization (already present)
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
            console.log("FuleType before save:", vehicleFormData.FuleType); // Debug
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
                AttritedDate: formatDateAdd(vehicleFormData.AttritedDate), // ✅ Add this
                Attrited: isAttrited ? 1 : 0, // ✅ Use checkbox state
                Emergency_Contact: vehicleFormData.Emergency_Contact ? 1 : 0,
                Wireless_Set: vehicleFormData.Wireless_Set ? 1 : 0,
                FireExtinguisher: vehicleFormData.FireExtinguisher ? 1 : 0,
                Spare_Tyre: vehicleFormData.Spare_Tyre ? 1 : 0,
                Medical_Kit: vehicleFormData.Medical_Kit ? 1 : 0,
                Umbrella: vehicleFormData.Umbrella ? 1 : 0,
                Torch: vehicleFormData.Torch ? 1 : 0,
                Documents: vehicleFormData.Documents ? 1 : 0,
                ChasisNo: vehicleFormData.ChasisNo, // ✅ Added
                ModalNo: vehicleFormData.ModalNo,     // ✅ Added
                UpdatedBy: userID,
                FuleType: vehicleFormData.FuleType,
            });

            console.log("Add/Update Vehicle Response:", response);
            toastService.success("The vehicle has been added successfully.");
            setAddVehicle(false);
            setVehicleFormData(initialFormData);
            await VehiclesDetailsData();
        } catch (error) {
            console.error("Error while adding vehicle:", error);
            toastService.error("Failed to add vehicle.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // const InsertAddVehicle = async () => {
    //     setIsSubmitting(true);

    //     try {
    //         const response = await VehicleMasterService.SPR_AddUpdateVehicle({
    //             ...vehicleFormData,
    //             VehicleRegDate: formatDateAdd(vehicleFormData.VehicleRegDate),
    //             PermitExpiryDate: formatDateAdd(vehicleFormData.PermitExpiryDate),
    //             InsuranceExpiryDate: formatDateAdd(vehicleFormData.InsuranceExpiryDate),
    //             FitnessExpiryDate: formatDateAdd(vehicleFormData.FitnessExpiryDate),
    //             TaxExpiryDate: formatDateAdd(vehicleFormData.TaxExpiryDate),
    //             PUCExpiryDate: formatDateAdd(vehicleFormData.PUCExpiryDate),
    //             FCValidDate: formatDateAdd(vehicleFormData.FCValidDate),
    //             PermitIssueDate: formatDateAdd(vehicleFormData.PermitIssueDate),
    //             EmissionExpiryDate: formatDateAdd(vehicleFormData.EmissionExpiryDate),
    //             CabInductionDate: formatDateAdd(vehicleFormData.CabInductionDate),
    //             CabExpiryDate: formatDateAdd(vehicleFormData.CabExpiryDate),
    //             Attrited: vehicleFormData.Attrited,
    //             UpdatedBy: userID,
    //         });
    //         console.log("Add/Update Vehicle Response:", response);
    //         toastService.success("Vehicle has been added successfully.");
    //         // if (response[0].result) {
    //         //     setAddVehicle(false);
    //         //     setVehicleFormData({
    //         //         VehicleId: null,
    //         //         VehicleNo: "",
    //         //         VehicleRegNo: "",
    //         //         FacilityId: null,
    //         //         VendorId: null,
    //         //         VehicleTypeId: null,
    //         //         VehicleRegDate: null,
    //         //         PermitExpiryDate: null,
    //         //         InsuranceExpiryDate: null,
    //         //         FitnessExpiryDate: null,
    //         //         TaxExpiryDate: null,
    //         //         PUCExpiryDate: null,
    //         //         ChassisNo: "",
    //         //         ModelNo: "",
    //         //         FCValidDate: null,
    //         //         InsuranceNo: "",
    //         //         InsuranceCompanyName: "",
    //         //         PermitNo: "",
    //         //         PermitIssueDate: null,
    //         //         EmissionExpiryDate: null,
    //         //         CabInductionDate: null,
    //         //         CabExpiryDate: null,
    //         //         FuelType: "",
    //         //         Warning_1: "",
    //         //         Warning_2: "",
    //         //         FinalWarning: "",
    //         //         Remark: "",
    //         //         BillingType: "",
    //         //         Attrited: isAttrited,
    //         //         Emergency_Contact: false,
    //         //         Wireless_Set: false,
    //         //         FireExtinguisher: false,
    //         //         Spare_Tyre: false,
    //         //         Medical_Kit: false,
    //         //         Umbrella: false,
    //         //         Torch: false,
    //         //         Documents: false,
    //         //         UpdatedBy: userID,
    //         //     });
    //         // 2. Agar file selected hai aur vehicle insert ho gaya
    //         // if (selectedFile && response[0]?.VehicleId) {
    //         //     await VehicleMasterService.SPR_AddUpdateVehicleDocument({
    //         //         FacilityId: vehicleFormData.FacilityId,
    //         //         VehicleId: response[0].VehicleId, // API se aaya VehicleId
    //         //         VehicleNo: vehicleFormData.VehicleNo,
    //         //         DocumentId: vehicleFormData.DocumentType, // ya jo bhi aapka document id hai
    //         //         DocumentName: "", // yahan document name de sakte hain
    //         //         UpdatedBy: userID,
    //         //         File: selectedFile,
    //         //     });
    //         // }

    //         // if (response[0].result) {
    //         //     setAddVehicle(false);
    //         //     setVehicleFormData({ ...initialFormData }); // initialFormData me aapka blank object ho
    //         //setSelectedFile(null);
    //         await VehiclesDetailsData();
    //         //}
    //         //}
    //     } catch (error) {
    //         console.error("Error in adding vehicle:", error);
    //     } finally {
    //         setIsSubmitting(false);
    //     }
    // }
    // Upload handler
    // Upload handler
    const handleUpload = async () => {
        if (!selectedFile) {
            toastService.warn("Please select a file to upload.");
            return;
        }

        // Convert file to base64
        const toBase64 = (file) =>
            new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result.split(",")[1]); // strip metadata
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
    // Edit form state
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

    // 2. useEffect: fetch vendors when facility changes
    useEffect(() => {
        if (editselectedFacility) {
            fetchVendorsByFacilityEdit(editselectedFacility);
        }
    }, [editselectedFacility]);

    // 3. useEffect: fetch vehicle types when vendor changes
    useEffect(() => {
        if (selectedEditVendor) {
            fetchSelectVehicleTypeEdit(selectedEditVendor);
        }
    }, [selectedEditVendor]);

    // 4. useEffect: set selected vendor when vendor list loads
    useEffect(() => {
        if (editVendor.length > 0 && editVehicleFormData.VendorId) {
            setSelectedEditVendor(editVehicleFormData.VendorId);
        }
    }, [editVendor, editVehicleFormData.VendorId]);

    // 5. useEffect: set selected vehicle type when vehicle type list loads
    useEffect(() => {
        if (editVehicleType.length > 0 && editVehicleFormData.VehicleTypeId) {
            setSelectedEditVehicleType(editVehicleFormData.VehicleTypeId);
        }
    }, [editVehicleType, editVehicleFormData.VehicleTypeId]);
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
            <Header pageTitle="Vehicle Master" showNewButton={true} onNewButtonClick={setAddVehicle} />
            <Sidebar />
            <div className="middle">
                <div className="row">
                    <div className="col-12">
                        <h6 className="pageTitle">Vehicle Master</h6>
                    </div>
                    {/* Search Box */}
                    <div className="col-12">
                        <div className="card_tb p-3">
                            <div className="row">
                                <div className="col-2">
                                    <label htmlFor="">Facility</label>
                                    <Dropdown value={selectedCity} onChange={(e) => setSelectedCity(e.value)} options={facility} optionLabel="name"
                                        placeholder="Select Facility" className="w-100" />
                                </div>
                                <div className="col-2">
                                    <label htmlFor="">Vendor</label>
                                    <Dropdown value={selectedVendor}
                                        onChange={(e) => {
                                            setSelectedVendor(e.value);
                                            setSelectedVendorAdd(e.value);
                                        }}
                                        options={vendor} optionLabel="name"
                                        placeholder="Select Vendor" className="w-100" filter />
                                </div>

                                <div className="col-2">
                                    <Button label="Submit" className="btn btn-primary no-label" onClick={VehiclesDetailsData} />
                                </div>
                                <div className="col-2 offset-4 d-none">
                                    <label htmlFor="">Search Any</label>
                                    <InputText placeholder="Search Any Value" className="w-100" />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Table Start */}
                    {showTable && (
                        < div className="col-12">
                            <div className="card_tb">
                                <DataTable value={[...vehicleDetails]} paginator rows={50} emptyMessage="No Records Found"
                                    rowsPerPageOptions={[50, 100, 150, 200]}>
                                    <Column sortable field="Id" header="ID" body={(rowData) => (
                                        <a href="#" className="id-link"
                                            onClick={async (e) => {
                                                e.preventDefault();

                                                setEditVehicleFormData({
                                                    ...rowData,
                                                    VehicleRegDate: rowData.VehicleRegDate ? new Date(rowData.VehicleRegDate) : null,
                                                    PermitExpiryDate: rowData.PermitExpiryDate ? new Date(rowData.PermitExpiryDate) : null,
                                                    InsuranceExpiryDate: rowData.InsuranceExpiryDate ? new Date(rowData.InsuranceExpiryDate) : null,
                                                    FitnessExpiryDate: rowData.FitnessExpiryDate ? new Date(rowData.FitnessExpiryDate) : null,
                                                    TaxExpiryDate: rowData.TaxExpiryDate ? new Date(rowData.TaxExpiryDate) : null,
                                                    PUCExpiryDate: rowData.PUCExpiryDate ? new Date(rowData.PUCExpiryDate) : null,
                                                    FCValidDate: rowData.FCValidDate ? new Date(rowData.FCValidDate) : null,
                                                    PermitIssueDate: rowData.PermitIssueDate ? new Date(rowData.PermitIssueDate) : null,
                                                    EmissionExpiryDate: rowData.EmissionExpiryDate ? new Date(rowData.EmissionExpiryDate) : null,
                                                    CabInductionDate: rowData.CabInductionDate ? new Date(rowData.CabInductionDate) : null,
                                                    CabExpiryDate: rowData.CabExpiryDate ? new Date(rowData.CabExpiryDate) : null,
                                                    AttritedDate: rowData.AttritedDate ? new Date(rowData.AttritedDate) : null,
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
                                                setEditSelectedFacility(rowData.FacilityId); // triggers vendor fetch
                                                setSelectedEditVendor(rowData.VendorId);     // triggers vehicle type fetch
                                                setSelectedEditVehicleType(rowData.VehicleTypeId);
                                                setUpdateVehicle(true);
                                            }}
                                        >
                                            {rowData.Id}
                                            <Tooltip target=".id-link" content="Click to Edit Details" />
                                        </a>
                                    )}></Column>
                                    <Column field="VehicleNo" header="Vehicle No."></Column>
                                    <Column field="VehicleRegDate" header="Vehicle Reg.Date" body={rowData => formatDate(rowData.VehicleRegDate)}></Column>
                                    <Column field="VehicleRegNo" header="Vehicle Reg. No."></Column>
                                    <Column field="VehicleType" header="Vehicle Type"></Column>
                                    <Column field="FacilityName" header="Facility Name"></Column>
                                    <Column field="VendorName" header="Vendor Name"></Column>
                                    <Column field="FuleType" header="Fuel Type"></Column>
                                    {/* <Column field="fatherName" header="Modal No."></Column>
                                <Column field="contactNo" header="Reg. Date"></Column> */}
                                    <Column field="PermitExpiryDate" header="Permit Expiry Date" body={rowData => formatDate(rowData.PermitExpiryDate)}></Column>
                                    <Column field="InsuranceExpiryDate" header="Insurance Expiry Date" body={rowData => formatDate(rowData.InsuranceExpiryDate)}></Column>
                                    <Column field="FitnessExpiryDate" header="Fitness Expiry Date" body={rowData => formatDate(rowData.FitnessExpiryDate)}></Column>
                                    <Column field="TaxExpiryDate" header="Tax Expiry Date" body={rowData => formatDate(rowData.TaxExpiryDate)}></Column>
                                    <Column field="PUCExpiryDate" header="PUC Expiry Date" body={rowData => formatDate(rowData.PUCExpiryDate)}></Column>
                                    <Column field="Attrited" header="Attrited"></Column>
                                    {/* <Column field="licenceExpDate" header="Cab Induction"></Column> */}
                                    {/* <Column field="action" header="Action" className="text-center"></Column> */}
                                </DataTable>
                            </div>
                        </div>
                    )}

                    {/* Add Vehicle Master */}
                    <PrimeSidebar visible={addVehicle} position="right" onHide={() => setAddVehicle(false)} showCloseIcon={false} dismissable={false} style={{ width: '50%' }}>
                        <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
                            <h6 className="sidebarTitle">Add Vehicle Master</h6>
                            <span className="d-flex align-items-center">
                                {isAttrited && <p className="text-warning mb-0 me-2">Attrited</p>}
                                <Button icon="pi pi-times" className="p-button-rounded p-button-text" onClick={() => setAddVehicle(false)} />
                            </span>
                        </div>
                        <div className="sidebarBody">
                            <div className="row">
                                <div className="col-12 mb-3">
                                    <div className="bg-light-blue w-100 d-flex justify-content-between align-items-center">
                                        <h6 className="sidebarSubTitle">Vehical Details</h6>
                                        <div className="d-flex justify-content-between me-3">
                                            <Checkbox inputId="AadharVerification" checked={isAttrited} onChange={(e) => setIsAttrited(e.target.checked)} />
                                            {/* <Checkbox
                                                inputId="Attrited"
                                                checked={vehicleFormData.Attrited === 1} // true if 1
                                                onChange={(e) =>
                                                    setVehicleFormData({
                                                        ...vehicleFormData,
                                                        Attrited: e.checked ? 1 : 0,  // 1 if checked, 0 if unchecked
                                                    })
                                                }
                                            /> */}
                                            <label htmlFor="AadharVerification" className="ms-2">Attrited</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Vehicle No.<span>*</span></label>
                                    <InputText className="form-control" name="" placeholder="Vehical Number" value={vehicleFormData.VehicleNo} onChange={(e) => setVehicleFormData({ ...vehicleFormData, VehicleNo: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Registration No. <span>*</span></label>
                                    <InputText className="form-control" name="" placeholder="Vehicle Registration" value={vehicleFormData.VehicleRegNo} onChange={(e) => setVehicleFormData({ ...vehicleFormData, VehicleRegNo: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Registration Date</label>
                                    <Calendar className="w-100" name="" placeholder="Vehicle Registration Date" value={vehicleFormData.VehicleRegDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, VehicleRegDate: e.value })} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Facility</label>
                                    <Dropdown optionLabel="name" placeholder="Select Facility Name" className="w-100" value={vehicleFormData.FacilityId} onChange={(e) => {
                                        setVehicleFormData({ ...vehicleFormData, FacilityId: e.value });
                                        setSelectedFacility(e.value);
                                        fetchVendorsByFacilityAdd(e.value);
                                    }} options={facilityAdd} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Vendor</label>
                                    <Dropdown optionLabel="name" placeholder="Select Vendor Name" className="w-100" filter
                                        value={vehicleFormData.VendorId}
                                        onChange={(e) => {
                                            setSelectedVendorAdd(e.value);
                                            setVehicleFormData({ ...vehicleFormData, VendorId: e.value });
                                            fetchSelectVehicleType(e.value); // <-- vendor id pass karo
                                        }} options={vendorAdd} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Vehicle Type</label>
                                    <Dropdown optionLabel="name" placeholder="Select Vehicle Type" className="w-100" filter
                                        value={vehicleFormData.VehicleTypeId}
                                        onChange={(e) => {
                                            setSelectedVehicleType(e.value);
                                            setVehicleFormData({ ...vehicleFormData, VehicleTypeId: e.value });
                                        }}
                                        options={vehicleType} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Permit Expiry Date</label>
                                    <Calendar className="w-100" name="" placeholder="Permit Expiry Date" value={vehicleFormData.PermitExpiryDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, PermitExpiryDate: e.value })} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Insurance Expiry</label>
                                    <Calendar className="w-100" name="" placeholder="Insurance Expiry Date" value={vehicleFormData.InsuranceExpiryDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, InsuranceExpiryDate: e.value })} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Fitness Expiry </label>
                                    <Calendar className="w-100" name="" placeholder="Fitness Expiry Date" value={vehicleFormData.FitnessExpiryDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, FitnessExpiryDate: e.value })} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Tax Expiry </label>
                                    <Calendar className="w-100" name="" placeholder="Tax Expiry Date" value={vehicleFormData.TaxExpiryDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, TaxExpiryDate: e.value })} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>PUC Expiry </label>
                                    <Calendar className="w-100" name="" placeholder="PUC Expiry Date" value={vehicleFormData.PUCExpiryDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, PUCExpiryDate: e.value })} appendTo="self" />
                                </div>
                                {/* <div className="field col-4 mb-3">
                                    <label>Emission Expiry Date</label>
                                    <Calendar className="w-100" name="" placeholder="Emission Expiry Date" />
                                </div> */}
                                <div className="field col-4 mb-3">
                                    <label>Cab Induction</label>
                                    <Calendar className="w-100" name="" placeholder="Cab Induction Date" value={vehicleFormData.CabInductionDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, CabInductionDate: e.value })} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Cab Expiry</label>
                                    <Calendar className="w-100" name="" placeholder="Cab Expiry Date" value={vehicleFormData.CabExpiryDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, CabExpiryDate: e.value })} appendTo="self" />

                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Chassis No.</label>
                                    <InputText className="form-control" name="" placeholder="Chassis Number" value={vehicleFormData.ChasisNo} onChange={(e) => setVehicleFormData({ ...vehicleFormData, ChasisNo: e.target.value })} />


                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Model No.</label>
                                    <InputText className="form-control" name="" placeholder="Model Number" value={vehicleFormData.ModalNo} onChange={(e) => setVehicleFormData({ ...vehicleFormData, ModalNo: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Insurance No.</label>
                                    <InputText className="form-control" name="" placeholder="Insurance Number" value={vehicleFormData.InsuranceNo} onChange={(e) => setVehicleFormData({ ...vehicleFormData, InsuranceNo: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Insurance Company </label>
                                    <InputText className="form-control" name="" placeholder="Insurance Company Name" value={vehicleFormData.InsuranceCompanyName} onChange={(e) => setVehicleFormData({ ...vehicleFormData, InsuranceCompanyName: e.target.value })} />
                                </div>
                                <div className="field col-4">
                                    <label className="d-block">Fuel Type</label>
                                    <Dropdown optionLabel="name" placeholder="Select Fuel Type" className="w-100"
                                        value={vehicleFormData.FuleType}
                                        onChange={(e) => setVehicleFormData({ ...vehicleFormData, FuleType: e.value })}
                                        options={fuelType} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Warning-1</label>
                                    <InputText className="form-control" name="" placeholder="Warning-1" value={vehicleFormData.Warning_1} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Warning_1: e.target.value })} />

                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Warning-2</label>
                                    <InputText className="form-control" name="" placeholder="Warning-2" value={vehicleFormData.Warning_2} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Warning_2: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Final Warning</label>
                                    <InputText className="form-control" name="" placeholder="Final Warning" value={vehicleFormData.FinalWarning} onChange={(e) => setVehicleFormData({ ...vehicleFormData, FinalWarning: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Attrited Date</label>
                                    <Calendar className="w-100" name="" placeholder="Attrited Date" value={vehicleFormData.AttritedDate} onChange={(e) => setVehicleFormData({ ...vehicleFormData, AttritedDate: e.value })} appendTo="self" />
                                </div>
                                {/* <div className="field col-3 d-flex align-items-center">
                                    <div className="d-flex mt-3">
                                        <Checkbox inputId="AadharVerification" className="" name="" />
                                        <label htmlFor="AadharVerification" className="ms-2">Attrited</label>
                                    </div>
                                </div> */}
                                <div className="field col-8 mb-3">
                                    <label>Remark</label>
                                    <InputText className="form-control" name="" placeholder="Remark" value={vehicleFormData.Remark} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Remark: e.target.value })} />

                                </div>
                                <div className="col-12 mb-3">
                                    <h6 className="sidebarSubTitle">Document Details</h6>
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Document Type</label>
                                    <Dropdown optionLabel="name" placeholder="Select Document Type" className="w-100" filter options={documentDetails} value={vehicleFormData.DocumentType} onChange={(e) => setVehicleFormData({ ...vehicleFormData, DocumentType: e.value })} />
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
                                {/* <div className="field col-4 mb-3">
                                    <label>Upload Date</label>
                                    <button className="btn btn-primary">Choose Date</button>
                                </div> */}
                                <div className="col-12 mb-3">
                                    <h6 className="sidebarSubTitle">Other Details</h6>
                                </div>
                                <div className="field col-12 d-flex flex-wrap justify-content-start align-items-center gap-4" style={{ whiteSpace: "nowrap" }}>
                                    <div className="d-flex">
                                        <Checkbox inputId="AadharVerification" className="" name="" checked={vehicleFormData.Emergency_Contact} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Emergency_Contact: e.checked })} />
                                        <label htmlFor="AadharVerification" className="ms-2" >Emergency Contact Detail Danglers</label>
                                    </div>

                                    <div className="d-flex">
                                        <Checkbox inputId="AadharVerification" className="" name="" checked={vehicleFormData.Wireless_Set} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Wireless_Set: e.checked })} />
                                        <label htmlFor="AadharVerification" className="ms-2">Wireless Set</label>
                                    </div>

                                    <div className="d-flex">
                                        <Checkbox inputId="AadharVerification" className="" name="" checked={vehicleFormData.FireExtinguisher} onChange={(e) => setVehicleFormData({ ...vehicleFormData, FireExtinguisher: e.checked })} />
                                        <label htmlFor="AadharVerification" className="ms-2">Fire Extinguisher</label>
                                    </div>
                                    {/*  */}
                                    <div className="d-flex">
                                        <Checkbox inputId="AadharVerification" className="" name="" checked={vehicleFormData.Spare_Tyre} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Spare_Tyre: e.checked })} />
                                        <label htmlFor="AadharVerification" className="ms-2">Spare Tyre</label>
                                    </div>
                                    <div className="d-flex">
                                        <Checkbox inputId="AadharVerification" className="" name="" checked={vehicleFormData.Medical_Kit} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Medical_Kit: e.checked })} />
                                        <label htmlFor="AadharVerification" className="ms-2">Medical Kit</label>
                                    </div>
                                    <div className="d-flex">
                                        <Checkbox inputId="AadharVerification" className="" name="" checked={vehicleFormData.Umbrella} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Umbrella: e.checked })} />
                                        <label htmlFor="AadharVerification" className="ms-2">Umbrella</label>
                                    </div>
                                    <div className="d-flex">
                                        <Checkbox inputId="AadharVerification" className="" name="" checked={vehicleFormData.Torch} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Torch: e.checked })} />
                                        <label htmlFor="AadharVerification" className="ms-2">Torch</label>
                                    </div>
                                    <div className="d-flex">
                                        <Checkbox inputId="AadharVerification" className="" name="" checked={vehicleFormData.Documents} onChange={(e) => setVehicleFormData({ ...vehicleFormData, Documents: e.checked })} />
                                        <label htmlFor="AadharVerification" className="ms-2">Documents</label>
                                    </div>
                                </div>

                                {/* Fixed button container at bottom of sidebar */}
                                <div className="sidebar-fixed-bottom">
                                    <div className="d-flex gap-3 justify-content-end">
                                        <Button label="Cancel" className="btn btn-outline-secondary" onClick={() => { setAddVehicle(false); setVehicleFormData(initialFormData); }} />
                                        <Button label="Save Changes" className="btn btn-success" onClick={InsertAddVehicle} />
                                    </div>
                                </div>

                            </div>
                        </div>
                    </PrimeSidebar>

                    {/* Edit Vehicle Master */}
                    <PrimeSidebar visible={updateVehicle} position="right" onHide={() => setUpdateVehicle(false)} showCloseIcon={false} dismissable={false} style={{ width: '50%' }}>
                        <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
                            <h6 className="sidebarTitle">Edit Vehicle Master</h6>
                            <span className="d-flex align-items-center">
                                {editAttrited && <p className="text-warning mb-0 me-2">Attrited</p>}
                                <Button icon="pi pi-times" className="p-button-rounded p-button-text" onClick={() => setUpdateVehicle(false)} />
                            </span>
                        </div>
                        <div className="sidebarBody">
                            <div className="row">
                                <div className="col-12 mb-3">
                                    <div className="bg-light-blue w-100 d-flex justify-content-between align-items-center">
                                        <h6 className="sidebarSubTitle">Vehical Details</h6>
                                        <div className="d-flex justify-content-between me-3">
                                            <Checkbox inputId="AadharVerification" className="" name="" checked={editAttrited} onChange={(e) => setEditAttrited(e.checked)} />
                                            <label htmlFor="AadharVerification" className="ms-2">Attrited</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Vehicle No.  </label>
                                    <InputText className="form-control" name="" placeholder="Vehical Number"
                                        value={editVehicleFormData.VehicleNo}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, VehicleNo: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Registration No. </label>
                                    <InputText className="form-control" name="" placeholder="Vehicle Registration"
                                        value={editVehicleFormData.VehicleRegNo}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, VehicleRegNo: e.target.value })} />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Registration Date</label>
                                    <Calendar className="w-100" name="" placeholder="Vehicle Registration Date"
                                        value={editVehicleFormData.VehicleRegDate}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, VehicleRegDate: e.value })} appendTo="self" />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Facility</label>
                                    <Dropdown optionLabel="name" placeholder="Select Facility Name" className="w-100" options={editFacility}
                                        value={editVehicleFormData.FacilityId}
                                        onChange={(e) => {
                                            setEditVehicleFormData({ ...editVehicleFormData, FacilityId: e.value });
                                            //setSelectedEditVendor(null);
                                            setEditSelectedFacility(e.value);
                                            setSelectedEditVendor(null);
                                            setSelectedEditVehicleType(null);
                                            //fetchVendorsByFacilityEdit(e.value);
                                        }}
                                        filter
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Vendor</label>
                                    <Dropdown optionLabel="name" optionValue="value" placeholder="Select Vendor Name" className="w-100" filter
                                        options={editVendor} value={editVehicleFormData.VendorId}
                                        onChange={(e) => {
                                            setEditVehicleFormData({ ...editVehicleFormData, VendorId: e.value });
                                            setSelectedEditVendor(e.value);
                                            setSelectedEditVehicleType(null);
                                            //fetchSelectVehicleTypeEdit(e.value);
                                        }}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Vehicle Type</label>
                                    <Dropdown optionLabel="name" optionValue="value" placeholder="Select Vehicle Type" className="w-100" filter
                                        value={editVehicleFormData.VehicleTypeId}
                                        onChange={(e) => {
                                            //setSelectedEditVehicleType(e.value);
                                            setEditVehicleFormData({ ...editVehicleFormData, VehicleTypeId: e.value })
                                            setSelectedEditVehicleType(e.value);

                                        }}
                                        options={editVehicleType}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Permit Expiry Date</label>
                                    <Calendar className="w-100" name="" placeholder="Permit Expiry Date"
                                        value={editVehicleFormData.PermitExpiryDate}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, PermitExpiryDate: e.value })}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Insurance Expiry</label>
                                    <Calendar className="w-100" name="" placeholder="Insurance Expiry Date"
                                        value={editVehicleFormData.InsuranceExpiryDate}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, InsuranceExpiryDate: e.value })}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Fitness Expiry </label>
                                    <Calendar className="w-100" name="" placeholder="Fitness Expiry Date"
                                        value={editVehicleFormData.FitnessExpiryDate}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, FitnessExpiryDate: e.value })}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Tax Expiry </label>
                                    <Calendar className="w-100" name="" placeholder="Tax Expiry Date"
                                        value={editVehicleFormData.TaxExpiryDate}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, TaxExpiryDate: e.value })}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>PUC Expiry </label>
                                    <Calendar className="w-100" name="" placeholder="PUC Expiry Date"
                                        value={editVehicleFormData.PUCExpiryDate}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, PUCExpiryDate: e.value })}
                                        appendTo="self"
                                    />
                                </div>
                                {/* <div className="field col-4 mb-3">
                                    <label>Emission Expiry Date</label>
                                    <Calendar className="w-100" name="" placeholder="Emission Expiry Date" />
                                </div> */}
                                <div className="field col-4 mb-3">
                                    <label>Cab Induction</label>
                                    <Calendar className="w-100" name="" placeholder="Cab Induction Date"
                                        value={editVehicleFormData.CabInductionDate}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, CabInductionDate: e.value })}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Cab Expiry</label>
                                    <Calendar className="w-100" name="" placeholder="Cab Expiry Date"
                                        value={editVehicleFormData.CabExpiryDate}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, CabExpiryDate: e.value })}
                                        appendTo="self"
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Chassis No. </label>
                                    <InputText className="form-control" name="" placeholder="Chassis Number"
                                        value={editVehicleFormData.ChasisNo}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, ChasisNo: e.value })}
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Model No.  </label>
                                    <InputText className="form-control" name="" placeholder="Modal Number"
                                        value={editVehicleFormData.ModalNo}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, ModalNo: e.value })}
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Insurance No. </label>
                                    <InputText className="form-control" name="" placeholder="Insurance Number"
                                        value={editVehicleFormData.InsuranceNo}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, InsuranceNo: e.value })}
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Insurance Company  </label>
                                    <InputText className="form-control" name="" placeholder="Insurance Company Name"
                                        value={editVehicleFormData.InsuranceCompanyName}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, InsuranceCompanyName: e.value })}
                                    />
                                </div>
                                <div className="field col-4">
                                    <label className="d-block">Fuel Type</label>
                                    <Dropdown optionLabel="name" placeholder="Select Fuel Type" className="w-100" filter
                                        value={editVehicleFormData.FuleType}
                                        options={editFuelType}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, FuleType: e.value })}
                                        appendTo="self"
                                    />
                                    {/* <div className=" d-flex align-items-center gap-4 mt-3">
                                        <div className="d-flex">
                                            <Checkbox inputId="AadharVerification" className="" name="" />
                                            <label htmlFor="AadharVerification" className="ms-2">Petrol</label>
                                        </div>
                                        <div className="d-flex">
                                            <Checkbox inputId="AadharVerification" className="" name="" />
                                            <label htmlFor="AadharVerification" className="ms-2">Electric</label>
                                        </div>
                                        <div className="d-flex">
                                            <Checkbox inputId="AadharVerification" className="" name="" />
                                            <label htmlFor="AadharVerification" className="ms-2">Diesel</label>
                                        </div>
                                        <div className="d-flex">
                                            <Checkbox inputId="AadharVerification" className="" name="" />
                                            <label htmlFor="AadharVerification" className="ms-2">CNG</label>
                                        </div>
                                    </div> */}
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Warning-1</label>
                                    <InputText className="form-control" name="" placeholder="Warning-1"
                                        value={editVehicleFormData.Warning_1}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Warning_1: e.value })}
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Warning-2  </label>
                                    <InputText className="form-control" name="" placeholder="Warning-2"
                                        value={editVehicleFormData.Warning_2}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Warning_2: e.value })}
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Final Warning  </label>
                                    <InputText className="form-control" name="" placeholder="Final Warning"
                                        value={editVehicleFormData.FinalWarning}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, FinalWarning: e.value })}
                                    />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Attrited Date</label>
                                    <Calendar className="w-100" name="" placeholder="Attrited Date"
                                        value={editVehicleFormData.AttritedDate}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, AttritedDate: e.value })}
                                        appendTo="self"
                                    />
                                </div>
                                {/* <div className="field col-3 d-flex align-items-center">
                                    <div className="d-flex mt-3">
                                        <Checkbox inputId="AadharVerification" className="" name="" />
                                        <label htmlFor="AadharVerification" className="ms-2">Attrited</label>
                                    </div>
                                </div> */}
                                <div className="field col-8 mb-3">
                                    <label>Remark</label>
                                    <InputText className="form-control" name="" placeholder="Remark"
                                        value={editVehicleFormData.Remark}
                                        onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Remark: e.value })}
                                    />
                                </div>
                                <div className="col-12 mb-3">
                                    <h6 className="sidebarSubTitle">Document Details</h6>
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Document Type</label>
                                    <Dropdown optionLabel="name" placeholder="Select Document Type" className="w-100" filter />
                                </div>
                                <div className="field col-4 mb-3">
                                    <label>Choose File</label>
                                    <FileUpload mode="basic" name="demo[]" url="/api/upload" accept="image/*" className="w-100" />
                                </div>
                                <div className="col-12 mb-3">
                                    <h6 className="sidebarSubTitle">Other Details</h6>
                                </div>
                                <div className="field col-12 d-flex flex-wrap justify-content-start align-items-center gap-4" style={{ whiteSpace: "nowrap" }}>
                                    <div className="d-flex">
                                        <Checkbox inputId="AadharVerification" className="" name=""
                                            checked={editVehicleFormData.Emergency_Contact}
                                            onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Emergency_Contact: e.checked })}
                                        />
                                        <label htmlFor="AadharVerification" className="ms-2">Emergency Contact Detail Danglers</label>
                                    </div>

                                    <div className="d-flex">
                                        <Checkbox inputId="AadharVerification" className="" name=""
                                            checked={editVehicleFormData.Wireless_Set}
                                            onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Wireless_Set: e.checked })}
                                        />
                                        <label htmlFor="AadharVerification" className="ms-2">Wireless Set</label>
                                    </div>

                                    <div className="d-flex">
                                        <Checkbox inputId="AadharVerification" className="" name=""
                                            checked={editVehicleFormData.FireExtinguisher}
                                            onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, FireExtinguisher: e.checked })}
                                        />
                                        <label htmlFor="AadharVerification" className="ms-2">Fire Extinguisher</label>
                                    </div>
                                    {/*  */}
                                    <div className="d-flex">
                                        <Checkbox inputId="AadharVerification" className="" name=""
                                            checked={editVehicleFormData.Spare_Tyre}
                                            onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Spare_Tyre: e.checked })}
                                        />
                                        <label htmlFor="AadharVerification" className="ms-2">Spare Tyre</label>
                                    </div>
                                    <div className="d-flex">
                                        <Checkbox inputId="AadharVerification" className="" name=""
                                            checked={editVehicleFormData.Medical_Kit}
                                            onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Medical_Kit: e.checked })}
                                        />
                                        <label htmlFor="AadharVerification" className="ms-2">Medical Kit</label>
                                    </div>
                                    <div className="d-flex">
                                        <Checkbox inputId="AadharVerification" className="" name=""
                                            checked={editVehicleFormData.Umbrella}
                                            onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Umbrella: e.checked })}
                                        />
                                        <label htmlFor="AadharVerification" className="ms-2">Umbrella</label>
                                    </div>
                                    <div className="d-flex">
                                        <Checkbox inputId="AadharVerification" className="" name=""
                                            checked={editVehicleFormData.Torch}
                                            onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Torch: e.checked })}
                                        />
                                        <label htmlFor="AadharVerification" className="ms-2">Torch</label>
                                    </div>
                                    <div className="d-flex">
                                        <Checkbox inputId="AadharVerification" className="" name=""
                                            checked={editVehicleFormData.Documents}
                                            onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, Documents: e.checked })}
                                        />
                                        <label htmlFor="AadharVerification" className="ms-2">Documents</label>
                                    </div>
                                </div>

                                {/* Fixed button container at bottom of sidebar */}
                                <div className="sidebar-fixed-bottom">
                                    <div className="d-flex gap-3 justify-content-end">
                                        <Button label="Cancel" className="btn btn-outline-secondary" onClick={() => setUpdateVehicle(false)} />
                                        <Button label="Update Data" className="btn btn-success" />
                                    </div>
                                </div>

                            </div>
                        </div>
                    </PrimeSidebar>

                </div >
            </div >
        </>
    )
}

export default VehicleMaster;