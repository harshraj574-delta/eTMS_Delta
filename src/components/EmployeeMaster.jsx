import React, { useState, useEffect, useMemo } from "react";
import EmployeeMasterService from "../services/compliance/EmployeeMasterService";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import TableToolbar from "./common/TableToolbar";
import sessionManager from "../utils/SessionManager";
import { InputText } from "primereact/inputtext";
import { set } from "lodash";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { toastService } from "../services/toastService";
import { Sidebar as PrimeSidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import MasterSidebar from "./Master/MasterSidebar";
import ReportButton from "./common/ReportButton";
import { CustomDataTable } from "./common/CustomDataTable";
import ResponsiveDataTable from "./common/ResponsiveDataTable";
import CustomPaginator from "./common/CustomPaginator";
const EmployeeMaster = () => {
    const [loading, setLoading] = useState(false);
    const UserId = sessionManager.getUserSession().ID;
    const locationId = sessionManager.getUserSession().locationId;
    const ISadmin = sessionManager.getUserSession().ISadmin;
    const [searchText, setSearchText] = useState("");
    const [rows, setRows] = useState([]);
    const [first, setFirst] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [hasSearched, setHasSearched] = useState(false);

    const onPageChange = (event) => {
        setFirst(event.first);
        setRowsPerPage(event.rows);
    };
    const [showSidebar, setShowSidebar] = useState(false);
    const [gender, setGender] = useState(null);
    const genderOptions = useMemo(() => [
        { value: "Male", label: "Male" },
        { value: "Female", label: "Female" },
    ], []);
    const transportRequiredOptions = useMemo(() => [
        { value: "1", label: "Pickup" },
        { value: "2", label: "Drop" },
        { value: "3", label: "Both" },
    ], []);
    const [transportRequired, setTransportRequired] = useState(null);
    const today = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const [date, setDate] = useState("");
    const [firstDoseDate, setFirstDoseDate] = useState("");
    const [secondDoseDate, setSecondDoseDate] = useState("");
    const [address, setAddress] = useState("");
    // const [nmtRequired, setNmtRequired] = useState(false);
    const [isNMT, setIsNMT] = useState(false);
    const [oobRequired, setOobRequired] = useState(false);
    const [medicalRequired, setMedicalRequired] = useState(false);
    const [pwdRequired, setPwdRequired] = useState(false);
    const [tptRequired, setTptRequired] = useState(false);
    const [attrited, setAttrited] = useState(false);
    const [guardRequired, setGuardRequired] = useState(false);
    const [facility, setFacility] = useState(null);
    const [facilityOptions, setFacilityOptions] = useState([]);
    const [processOptions, setProcessOptions] = useState([]);
    const [process, setProcess] = useState(null);
    const [subProcess, setSubProcess] = useState(null);
    const [subProcessOptions, setSubProcessOptions] = useState([]);
    const [managerOptions, setManagerOptions] = useState([]);
    const [manager, setManager] = useState(null);
    const medicalCaseOptions = useMemo(() => [
        { value: "0", label: "No" },
        { value: "1", label: "Family Way" },
        { value: "2", label: "Special Category" },
    ], []);
    const [medicalCase, setMedicalCase] = useState(null);
    const vaccineNameOptions = useMemo(() => [
        { value: "0", label: "None" },
        { value: "1", label: "Covaxin" },
        { value: "2", label: "Covishield" },
        { value: "3", label: "Sputnik" },
    ], []);
    const [vaccineName, setVaccineName] = useState(null);
    const [city, setCity] = useState(null);
    const [cityOptions, setCityOptions] = useState([]);
    const [area, setArea] = useState(null);
    const [areaOptions, setAreaOptions] = useState([]);
    const [landmark, setLandmark] = useState(null);
    const [landmarkOptions, setLandmarkOptions] = useState([]);
    const [employeeId, setEmployeeId] = useState("");
    const [empName, setEmpName] = useState("");
    const [userName, setUserName] = useState("");
    const [phone, setPhone] = useState("");
    const [designation, setDesignation] = useState("");
    const [projectCode, setProjectCode] = useState("");
    const [emergencyNo, setEmergencyNo] = useState("");
    const [emergencyName, setEmergencyName] = useState("");
    const [pincode, setPincode] = useState("");
    const [pincode2, setPincode2] = useState("");
    const [coscenter, setCoscenter] = useState("");
    const [medicalRemark, setMedicalRemark] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);
    const [showEditSidebar, setShowEditSidebar] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null); 4
    const [geoCodeId, setGeoCodeId] = useState("");
    // validation
    const [mobile, setMobile] = useState("");
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState({
        mobile: "",
        email: "",
    });

    const handleMobileChange = (value) => {
        const onlyDigits = value.replace(/\D/g, "").slice(0, 10);
        setMobile(onlyDigits);

        //     let msg = "";
        //     if (!onlyDigits) {
        //         msg = "Mobile is required.";
        //     } else if (onlyDigits.length !== 10) {
        //         msg = "Enter 10 digit mobile no.";
        //     }
        //     setErrors((prev) => ({ ...prev, mobile: msg }));
    };

    const handleEmailChange = (value) => {
        setEmail(value);

        // let msg = "";
        // if (!value.trim()) {
        //     msg = "Email is required.";
        // } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        //     msg = "Enter valid email address.";
        // }
        // setErrors((prev) => ({ ...prev, email: msg }));
    };
    const handleNewClick = () => {
        setShowSidebar(true);
    };
    const handleSearch = async () => {
        setLoading(true);
        setHasSearched(false);
        if (!searchText) {
            toastService.warn("Please enter an employee ID or name.");
            setLoading(false);
            return;
        }
        try {
            const response = await EmployeeMasterService.EmpSearch({
                locationid: locationId,
                empidname: searchText.trim(),
                IsAdmin: ISadmin,
            });
            //console.log("Search Response:", response);
            let data = [];
            if (Array.isArray(response)) {
                data = response;
            } else if (response && typeof response === "string") {
                try {
                    const parsed = JSON.parse(response);
                    data = Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                    console.error("Error parsing response:", e);
                }
            } else if (response && Array.isArray(response.data)) {
                data = response.data;
            }
            setRows(data);
            setHasSearched(true);
            if (!data || data.length === 0) {
                toastService.warn("No records found.");
            } else {
                toastService.success("Search completed successfully.");
            }
            //toastService.success("Search completed successfully.");
            //setLoading(false);
        } catch (error) {
            console.error("Error during search:", error);
            setRows([]);
            setHasSearched(true);
        } finally {
            setLoading(false);
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };
    const fetchSelectFacility = async () => {
        try {
            const response = await EmployeeMasterService.SelectFacility({
                Userid: UserId,
            });
            const parsedResponse = typeof response === "string" ? JSON.parse(response) : response;
            const formattedData = parsedResponse.map((item) => ({
                label: item.facility || item.facilityName,
                value: item.Id,
            }));
            setFacilityOptions(formattedData);
            //console.log("Facility Response:", response);
            // Process and set facility options here
        } catch (error) {
            console.error("Error fetching facilities:", error);
        }
    };
    useEffect(() => {
        fetchSelectFacility();
    }, []);
    const fetchGetProcessByFacility = async (facilityId) => {
        if (!facilityId) return;
        try {
            const response = await EmployeeMasterService.GetProcessByFacility({
                facilityid: facilityId,
            });
            const parsed =
                typeof response === "string" ? JSON.parse(response) : response;

            const formatted = (parsed || []).map((item) => ({
                label: item.processName || item.ProcessName,
                value: item.Id || item.processId,
            }));
            setProcessOptions(formatted);
            //console.log("Process Response:", response);
        } catch (error) {
            console.error("Error fetching processes:", error);
            setProcessOptions([]);
        }
    };
    const fetchGetSubProcess = async (processId) => {
        if (!processId) return;
        try {
            const response = await EmployeeMasterService.GetSubProcess({
                processid: processId,
            });
            const parsed =
                typeof response === "string" ? JSON.parse(response) : response;
            const formatted = (parsed || []).map((item) => ({
                label: item.subProcessName || item.SubProcessName,
                value: item.Id || item.subProcessId,
            }));
            setSubProcessOptions(formatted);
            //console.log("SubProcess Response:", response);
        } catch (error) {
            console.error("Error fetching subprocesses:", error);
            setSubProcessOptions([]);
        }
    };
    const fetchGetManagerList = async () => {
        try {
            const response = await EmployeeMasterService.GetManagerList({
                locationid: locationId,
                empidname: "",
                IsAdmin: ISadmin,
            });
            const parsedResponse = typeof response === "string" ? JSON.parse(response) : response;
            const formattedData = parsedResponse.map((item) => ({
                label: item.empName || item.empName,
                value: item.empId || item.Id,
            }));
            setManagerOptions(formattedData);
            //console.log("Manager Response:", response);
        } catch (error) {
            console.error("Error fetching managers:", error);
            setManagerOptions([]);
        }
    };
    useEffect(() => {
        fetchGetManagerList();
    }, []);
    const fetchGetGeoCityByRS = async () => {
        try {
            const response = await EmployeeMasterService.GetGeoCityByRS({
                locationid: locationId,
            });
            const parsedResponse = typeof response === "string" ? JSON.parse(response) : response;
            const formattedData = parsedResponse.map((item) => ({
                label: item.cityName || item.City,
                value: item.cityName || item.City,
            }));
            setCityOptions(formattedData);
            //console.log("City Response:", response);
        } catch (error) {
            console.error("Error fetching cities:", error);
            setCityOptions([]);
        }
    };
    useEffect(() => {
        fetchGetGeoCityByRS();
    }, []);
    const fetchGetGeoCityColonyRS = async (cityName) => {
        if (!cityName) return;
        try {
            const response = await EmployeeMasterService.GetGeoCityColonyRS({
                locationid: locationId,
                city: cityName,
            });
            const parsedResponse = typeof response === "string" ? JSON.parse(response) : response;
            const formattedData = parsedResponse.map((item) => ({
                label: item.colony || item.ColonyName,
                value: item.colony || item.Colony,
            }));
            setAreaOptions(formattedData);
            //console.log("Area Response:", response);
        } catch (error) {
            console.error("Error fetching areas:", error);
            setAreaOptions([]);
        }
    };
    const fetchGetSubColonyRs = async (areaName) => {
        if (!areaName) return;
        try {
            const response = await EmployeeMasterService.GetSubColonyRs({
                locationid: locationId,
                colony: areaName,
            });
            const parsedResponse = typeof response === "string" ? JSON.parse(response) : response;
            const formattedData = parsedResponse.map((item) => ({
                label: item.subColony || item.Subcolony,
                value: item.id || item.Id || item.subColony || item.Subcolony,
            }));
            setLandmarkOptions(formattedData);
            //console.log("SubColony Response:", response);
        } catch (error) {
            console.error("Error fetching sub colonies:", error);
            setLandmarkOptions([]);
        }
    };
    const fetchGenerateTmpId = async () => {
        try {
            const response = await EmployeeMasterService.GenerateTmpId({});
            //console.log("GenerateTmpId Response:", response);
            const data =
                typeof response === "string" ? JSON.parse(response) : response;
            //console.log("GenerateTmpId parsed:", data);
            const first = Array.isArray(data) ? data[0] : data;
            const tmpId =
                first?.TmpEmpId ||
                first?.tmpEmpId ||
                first?.EmpId ||
                "";
            setEmployeeId(tmpId);
        } catch (error) {
            console.error("Error fetching GenerateTmpId:", error);
        }
    };
    // useEffect(() => {
    //     if (showSidebar) {
    //         fetchGenerateTmpId();
    //     }
    // }, [showSidebar]);
    useEffect(() => {
        if (showSidebar && !isEditMode) {
            fetchGenerateTmpId();  // Only for NEW employee
        }
    }, [showSidebar, isEditMode]);

    const handleSaveEmployee = async () => {
        if (!empName.trim()) {
            toastService.warn("Employee Name is required");
            return;
        }
        if (!mobile || mobile.length !== 10) {
            toastService.warn("Enter valid 10 digit mobile number");
            return;
        }

        // Email validation
        if (!email?.trim()) {
            toastService.warn("Email is required");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            toastService.warn("Enter valid email (e.g., abc@12gmail.com)"); return;
        }

        if (!facility && facility !== 0) {
            toastService.warn("Facility is required");
            return;
        }
        if (!process && process !== 0) {
            toastService.warn("Process is required");
            return;
        }
        if (!subProcess && subProcess !== 0) {
            toastService.warn("Sub Process is required");
            return;
        }
        if (!city && city !== 0) {
            toastService.warn("City is required");
            return;
        }
        if (!area && area !== 0) {
            toastService.warn("Area is required");
            return;
        }
        if (!landmark && landmark !== 0) {
            toastService.warn("Landmark is required");
            return;
        }
        const employeeData = {
            id: 0,
            empCode: employeeId || "",
            empName: empName.trim(),
            userName: userName.trim() || "",
            designation: designation.trim() || "",
            Gender: gender || "",
            mobile: mobile,
            phone: phone.trim() || "",
            email: email.trim(),
            attrited: attrited ? "Y" : "N",
            tptReq: tptRequired ? "Y" : "N",
            managerId: manager ? String(manager) : "",
            facilityId: facility ? parseInt(facility) : 0,
            processId: process ? parseInt(process) : 0,
            subProcessId: subProcess ? parseInt(subProcess) : 0,
            nodalId: 0,
            address: address.trim() || "",
            pincode: pincode.trim() || "",
            geoCodeId: geoCodeId ? parseInt(geoCodeId) : 0,
            updatedBy: UserId ? parseInt(UserId) : 0,
            specialCase: medicalCase || "",
            coscenter: coscenter.trim() || "",
            pincode2: pincode2.trim() || "",
            EmergencyNo: emergencyNo.trim() || "",
            EmegencyName: emergencyName.trim() || "",
            MedicalRemark: medicalRemark.trim() || "",
            MedicalExpiryDate: date || "1900-01-01",
            GuardReq: guardRequired ? 1 : 0,
            Tptfor: transportRequired ? parseInt(transportRequired) : 0,
            IsNMT: isNMT ? 1 : 0,
            IsOOB: oobRequired ? 1 : 0,
            IsPWD: pwdRequired ? 1 : 0,

        };
        //console.log("Employee payload sending:", employeeData);
        setLoading(true);
        try {
            const response = await EmployeeMasterService.InsertEmployee(employeeData);
            if (response && (response.status === 200 || response.status === 201)) {
                const responseData = response.data;

                if (responseData && typeof responseData === "object" && (responseData.error || responseData.Error)) {
                    throw new Error(responseData.error || responseData.Error);
                }
                toastService.success("Employee saved successfully!");
                setShowSidebar(false);
                resetForm();
            } else {
                const res = typeof response === "string" ? JSON.parse(response) : response;
                if (res && (res.error || res.Error)) {
                    throw new Error(res.error || res.Error);
                }
                toastService.success("Employee saved successfully!");
                setShowSidebar(false);
                resetForm();
            }
        } catch (error) {
            console.error("Error saving employee:", error);
            console.error("Error response:", error.response);
            console.error("Error data:", error.response?.data);
            let errorMessage = "Failed to save employee. Please try again.";
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }
            toastService.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    const resetForm = () => {
        setEmployeeId("");
        setEmpName("");
        setUserName("");
        setGender(null);
        setMobile("");
        setPhone("");
        setEmail("");
        setFacility(null);
        setProcess(null);
        setSubProcess(null);
        setManager(null);
        setMedicalCase(null);
        setDate(today());
        setFirstDoseDate(today());
        setSecondDoseDate(today());
        setProjectCode("");
        setEmergencyNo("");
        setEmergencyName("");
        setTransportRequired(null);
        setVaccineName(null);
        setPincode("");
        setPincode2("");
        setCity(null);
        setArea(null);
        setLandmark(null);
        setAddress("");
        setTptRequired(false);
        setAttrited(false);
        setGuardRequired(false);
        setCoscenter("");
        setMedicalRemark("");
        setGeoCodeId(null);
        setErrors({ mobile: "", email: "" });
    };
    const empCodeTemplate = (rowData) => {
        //console.log("Rendering empCode for:", rowData?.empCode);
        return (
            <span
                style={{ color: '#0d6efd', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => handleEditClick(rowData)}
            >
                {rowData?.empCode || "N/A"}
            </span>
        );
    };
    const handleEditClick = async (rowData) => {
        //console.log("RowData clicked:", rowData);
        setIsEditMode(true);
        setLoading(true);
        try {
            const response = await EmployeeMasterService.GetEmployee({
                Userid: rowData.id
            });
            console.log("RAW API Response:", response);
            let data = [];
            if (Array.isArray(response)) {
                data = response;
            } else if (response && typeof response === "string") {
                try {
                    const parsed = JSON.parse(response);
                    data = Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                    console.error("JSON parse error:", e);
                    data = [];
                }
            } else if (response && Array.isArray(response.data)) {
                data = response.data;
            } else {
                data = response || [];
            }
            //console.log("Parsed data:", data);
            if (!data || data.length === 0) {
                throw new Error("No employee data found");
            }
            const emp = data[0];
            //console.log("Employee object:", emp);
            if (!emp || !emp.empCode) {
                throw new Error("Invalid employee data");
            }
            await bindEmployeeFromApi(emp);
            setShowSidebar(true);
        } catch (err) {
            console.error("Full error:", err);
            toastService.error(`Failed to load: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // const bindEmployeeFromApi = async (emp) => {
    //     if (!emp) {
    //         console.error("No employee data passed to bindEmployeeFromApi");
    //         return;
    //     }

    //     console.log("Binding employee:", emp);

    //     setEmployeeId(emp.empCode || emp.EmpCode || "");
    //     setEmpName(emp.empName || emp.EmpName || "");
    //     setUserName(emp.userName || emp.UserName || "");
    //     setMobile(emp.mobile || emp.Mobile || "");
    //     setPhone(emp.phone || emp.Phone || "");
    //     setEmail(emp.email || emp.Email || "");
    //     setDesignation(emp.designation || emp.Designation || "");
    //     setAddress(emp.address || emp.Address || "");
    //     setPincode(emp.pincode || emp.Pincode || "");
    //     setPincode2(emp.pincode2 || emp.Pincode2 || "");
    //     setCoscenter(emp.coscenter || emp.Costcenter || emp.Coscenter || "");
    //     setMedicalRemark(emp.MedicalRemark || emp.medicalRemark || "");
    //     setProjectCode(emp.projectCode || emp.ProjectCode || "");
    //     setEmergencyNo(emp.EmergencyNo || emp.emergencyNo || "");
    //     setEmergencyName(emp.EmegencyName || emp.EmergencyName || emp.emergencyName || "");

    //     // ✅ CHECKBOXES (Safe boolean conversion)
    //     setTptRequired(emp.tptReq === "Y" || emp.tptReq === true);
    //     setAttrited(emp.attrited === "Y" || emp.attrited === true);
    //     setGuardRequired(emp.GuardReq === 1 || emp.guardRequired === true);

    //     // ✅ DROPDOWNS (Safe values)
    //     setGender(emp.Gender || emp.gender || null);
    //     setMedicalCase(emp.specialCase || emp.SpecialCase || "0");
    //     setTransportRequired(emp.Tptfor ? String(emp.Tptfor) : null);
    //     setVaccineName(emp.vaccineName || emp.VaccineName || "0");
    //     setDate(emp.MedicalExpiryDate || today());

    //     // ✅ CASCADING (Only if values exist)
    //     if (emp.facilityId || emp.FacilityId) {
    //         const facilityId = emp.facilityId || emp.FacilityId;
    //         setFacility(facilityId);
    //         setTimeout(() => fetchGetProcessByFacility(facilityId), 100);
    //     }

    //     if (emp.processId || emp.ProcessId) {
    //         const processId = emp.processId || emp.ProcessId;
    //         setProcess(processId);
    //         setTimeout(() => fetchGetSubProcess(processId), 300);
    //     }

    //     if (emp.subProcessId || emp.SubProcessId) {
    //         setSubProcess(emp.subProcessId || emp.SubProcessId);
    //     }

    //     if (emp.managerId || emp.ManagerId) {
    //         setManager(String(emp.managerId || emp.ManagerId));
    //     }

    //     setErrors({ mobile: "", email: "" });
    //     setSelectedEmployee(emp);
    // };
    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === "" || dateStr === "1900-01-01T00:00:00") {
            return;
        }
        try {
            if (dateStr.includes('/')) {
                const [month, day, year] = dateStr.split('/');
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
            return dateStr;
        } catch {
            return;
        }
    };
    const bindEmployeeFromApi = async (emp) => {
        if (!emp) {
            toastService.error("No employee data passed to bindEmployeeFromApi");
            console.error("No employee data passed to bindEmployeeFromApi");
            return;
        }

        //console.log("Binding employee:", emp);
        setEmployeeId(emp.empCode || "");
        setEmpName(emp.empName || "");
        setUserName(emp.userName || "");
        setMobile(emp.mobile || "");
        setPhone(emp.phone || "");
        setEmail(emp.email || "");
        setDesignation(emp.designation || "");
        setAddress(emp.address || "");
        setPincode(emp.pincode || "");
        setPincode2(emp.Pincode2 || emp.pincode2 || "");
        setCoscenter(emp.Costcenter || emp.coscenter || "");
        setMedicalRemark(emp.MedicalRemark || "");
        setProjectCode("");
        setEmergencyNo(emp.EmergencyContact || "");
        setEmergencyName(emp.EmergencyName || "");
        setTptRequired(emp.tptReq === "Y");
        setAttrited(emp.attrited === "Y");
        setGuardRequired(emp.GuardReq === 1);
        setGender(emp.Gender || null);
        setMedicalCase(emp.SpecialCase || "0");
        setTransportRequired(emp.Tptfor ? String(emp.Tptfor) : null);
        setVaccineName(emp.VaccineName || "0");
        const formattedDate = formatDate(emp.MedicalExpiryDate);
        //console.log("Formatted Date:", emp.MedicalExpiryDate, "→", formattedDate);
        setDate(formattedDate);
        if (emp.facilityId) {
            setFacility(emp.facilityId);
            await new Promise(resolve => setTimeout(resolve, 50));
            await fetchGetProcessByFacility(emp.facilityId);
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        if (emp.processId) {
            setProcess(emp.processId);
            await new Promise(resolve => setTimeout(resolve, 50));
            await fetchGetSubProcess(emp.processId);
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        if (emp.subProcessId) {
            setSubProcess(emp.subProcessId);
        }
        if (emp.managerId) {
            setManager(String(emp.managerId));
        }

        // Handle City, Area, Landmark cascading
        if (emp.City) {
            const cityValue = emp.City.trim();
            //console.log("Setting City:", cityValue);

            // Fetch and set city options
            await fetchGetGeoCityByRS();
            await new Promise(resolve => setTimeout(resolve, 100));
            setCity(cityValue);
            await new Promise(resolve => setTimeout(resolve, 50));

            if (emp.Colony) {
                const areaValue = emp.Colony.trim();
                //console.log("Setting Area:", areaValue);

                // Fetch area options based on selected city
                await fetchGetGeoCityColonyRS(cityValue);
                await new Promise(resolve => setTimeout(resolve, 100));
                setArea(areaValue);
                await new Promise(resolve => setTimeout(resolve, 50));

                // Fetch landmark options based on selected area
                if (emp.geoCodeId) {
                    // console.log("Setting GeoCodeId:", emp.geoCodeId);
                    await fetchGetSubColonyRs(areaValue);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    setGeoCodeId(parseInt(emp.geoCodeId));
                    setLandmark(String(emp.geoCodeId));
                }
            }
        }
        setErrors({ mobile: "", email: "" });
        setSelectedEmployee(emp);
    };
    const handleUpdateEmployee = async () => {
        if (!empName?.trim()) {
            toastService.warn("Employee Name is required");
            return;
        }
        if (!facility || facility == 0) {
            toastService.warn("Facility is required");
            return;
        }
        setLoading(true);
        try {
            const updateData = {
                id: selectedEmployee?.id,
                empCode: employeeId,
                empName: empName.trim(),
                userName: userName?.trim() || "",
                designation: designation?.trim() || "",
                Gender: gender || "",
                mobile: mobile || "",
                phone: phone?.trim() || "",
                email: email?.trim() || "",
                attrited: attrited ? "Y" : "N",
                tptReq: tptRequired ? "Y" : "N",
                managerId: manager ? String(manager) : "0",
                facilityId: facility ? parseInt(facility) : 0,
                processId: process ? parseInt(process) : 0,
                subProcessId: subProcess ? parseInt(subProcess) : 0,
                nodalId: 0,
                address: address?.trim() || "",
                pincode: pincode?.trim() || "",
                geoCodeId: geoCodeId ? parseInt(geoCodeId) : 0,
                updatedBy: parseInt(UserId) || 0,
                address2: "",
                geocodeid2: 0,
                lastworkingday: "",
                specialCase: medicalCase || "0",
                pincode2: pincode2?.trim() || "",
                coscenter: coscenter?.trim() || "",
                EmergencyNo: emergencyNo?.trim() || "",
                EmegencyName: emergencyName?.trim() || "",
                MedicalRemark: medicalRemark?.trim() || "",
                MedicalExpiryDate: date || "1900-01-01",
                FacEnable: 0,
                GuardReq: guardRequired ? 1 : 0,
                Tptfor: transportRequired ? parseInt(transportRequired) : 0,
                VaccineName: vaccineName || "0",
                FirstDoseDate: firstDoseDate || "",
                SecondDoesDate: secondDoseDate || "",
                IsNMT: isNMT ? 1 : 0,
                IsOOB: oobRequired ? 1 : 0,
                IsPWD: pwdRequired ? 1 : 0,
            };
            //console.log("Update payload:", updateData);
            const response = await EmployeeMasterService.UpdateEmployee(updateData);
            let resData;
            if (typeof response === 'string') {
                resData = JSON.parse(response);
            } else {
                resData = response;
            }
            if (resData?.error || resData?.Error) {
                throw new Error(resData.error || resData.Error);
            }
            toastService.success("Employee updated successfully!");
            setShowSidebar(false);
            setIsEditMode(false);
            //resetForm();
            await handleSearch();
        } catch (error) {
            console.error("Update error:", error);
            let errorMsg = "Failed to update employee.";
            if (error.response?.data?.message) errorMsg = error.response.data.message;
            else if (error.response?.data?.error) errorMsg = error.response.data.error;
            else if (error.message) errorMsg = error.message;
            toastService.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid p-0">
            <Loader isVisible={loading} fullScreen={true} />
            <Header pageTitle={"Employee Master"} mainTitle={"Transport"} showNewButton={true} onNewButtonClick={handleNewClick} />
            <Sidebar />
            <div className="middle">
                <div className="card_tb p-3 mb-3">
                    <div className="row align-items-end">
                        <div className="col-md-6 col-lg-4 mb-3">
                            <label className="form-label">
                                Enter Employee ID or Name:
                            </label>
                            <InputText
                                type="text"
                                className="form-control"
                                placeholder="Enter Employee ID or Name"
                                value={searchText}
                                onKeyDown={handleKeyDown}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                        <div className="col-md-2 col-lg-2 mb-3 d-flex align-items-end">
                            <ReportButton label="Search" onClick={handleSearch} />
                        </div>
                    </div>
                </div>
                {hasSearched && (
                    <>
                        <div className="card_tb p-3">
                            <TableToolbar showExport={false} showFilter={false} />
                            <ResponsiveDataTable
                                value={rows.slice(first, first + rowsPerPage)}
                                loading={loading}
                                emptyMessage="No records found"
                                rowClassName={(data, props) => props.rowIndex % 2 !== 0 ? "ota-row-odd" : ""}
                            >
                                <Column header="Employee Id" mobile={{ subtitle: true }} body={empCodeTemplate} />
                                <Column field="empName" header="Employee Name" mobile={{ primary: true }} />
                                <Column field="processName" header="Process" />
                                <Column field="facilityName" header="Facility" />
                                <Column field="email" header="Email" mobile={{ hidden: true }} />
                                <Column field="TptReq" header="TptReq" mobile={{ hidden: true }} />
                                <Column field="Attrited" header="Active" mobile={{ badge: true }} body={(r) => r.Attrited === "N" ? "Active" : "Inactive"} />
                            </ResponsiveDataTable>
                            <CustomPaginator
                                first={first}
                                rows={rowsPerPage}
                                totalRecords={rows.length}
                                onPageChange={onPageChange}
                                rowsPerPageOptions={[10, 20, 50]}
                            />
                        </div>
                    </>
                )}
            </div>
            <MasterSidebar
                show={showSidebar}
                onClose={() => {
                    setShowSidebar(false);
                    setIsEditMode(false);
                    resetForm();
                }}
                title={isEditMode ? `Edit Employee - ${employeeId}` : "Add New Employee"}
                width="70%"
                className="sidebar-responsive"
                backdropOpacity={0.5}
                backdropBlur="10px"
                headerBgColor="bg-secondary"
                headerTextColor="text-white"
                id="AddEmployeeSidebar"
                footer={
                    <div className="offcanvas-footer">
                        <Button
                            label="Cancel"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => {
                                setShowSidebar(false);
                                setIsEditMode(false);
                                resetForm();
                            }}
                        />
                        <Button
                            label={isEditMode ? "Update" : "Save"}
                            className="btn btn-success btn-sm ms-3"
                            onClick={isEditMode ? handleUpdateEmployee : handleSaveEmployee}
                            loading={loading}
                        />
                    </div>
                }
            >
                <div className="p-3">
                    <div className="row g-2">
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>Employee Id:</label>
                            <InputText type="text" readOnly value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="form-control" placeholder="Enter Employee Id" />
                        </div>
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>Employee Name:</label>
                            <InputText type="text" value={empName} onChange={(e) => setEmpName(e.target.value)} className="form-control" placeholder="Enter Employee Name" />
                        </div>
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>User Name:</label>
                            <InputText type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="form-control" placeholder="Enter User Name" />
                        </div>
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>Gender:</label>
                            <Dropdown
                                value={gender}
                                onChange={(e) => setGender(e.value)}
                                options={genderOptions}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select Gender"
                                className="w-100"
                                appendTo={document.body}
                            />
                        </div>
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label className="form-label">Mobile:</label>
                            <InputText
                                type="text"
                                className={`form-control ${errors.mobile ? "is-invalid" : ""}`}
                                placeholder="Enter Mobile No."
                                value={mobile}
                                onChange={(e) => handleMobileChange(e.target.value)}
                            />
                            {errors.mobile && <small className="text-danger">{errors.mobile}</small>}
                        </div>
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>Phone:</label>
                            <InputText type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="form-control" placeholder="Enter Phone No." />
                        </div>
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label className="form-label">Email:</label>
                            <InputText
                                type="text"
                                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                                placeholder="Enter Email Id"
                                value={email}
                                onChange={(e) => handleEmailChange(e.target.value)}
                            />
                            {errors.email && <small className="text-danger">{errors.email}</small>}
                        </div>
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>Facility:</label>
                            <Dropdown
                                value={facility}
                                onChange={(e) => {
                                    const val = e.value;
                                    setFacility(val);
                                    setProcess(null);
                                    setProcessOptions([]);
                                    fetchGetProcessByFacility(val);
                                }}
                                //onChange={(e) => setFacility(e.value)}
                                options={facilityOptions}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select Facility"
                                className="w-100"
                                appendTo={document.body}
                            />
                        </div>
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>Process:</label>
                            <Dropdown
                                value={process}
                                options={processOptions}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select Process"
                                className="w-100"
                                onChange={(e) => {
                                    const val = e.value;
                                    setProcess(val);
                                    fetchGetSubProcess(val);
                                }}
                                appendTo={document.body}
                            />
                        </div>
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>SubProcess:</label>
                            <Dropdown
                                value={subProcess}
                                onChange={(e) => setSubProcess(e.value)}
                                options={subProcessOptions}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select SubProcess"
                                className="w-100"
                                appendTo={document.body}
                            />
                        </div>
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>Manager:</label>
                            <Dropdown
                                value={manager}
                                onChange={(e) => {
                                    const selectedValue = e.value;
                                    //console.log("Manager dropdown selected:", selectedValue, typeof selectedValue);
                                    setManager(selectedValue);
                                }}
                                options={managerOptions}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select Manager"
                                className="w-100"
                                appendTo={document.body}
                            />
                        </div>
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>Medical Case:</label>
                            <Dropdown
                                value={medicalCase}
                                onChange={(e) => setMedicalCase(e.value)}
                                options={medicalCaseOptions}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select Medical Case"
                                className="w-100"
                                appendTo={document.body}
                            />
                        </div>
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>Medical Remark:</label>
                            <InputText type="text" value={medicalRemark} onChange={(e) => setMedicalRemark(e.target.value)} className="form-control" placeholder="Enter Medical Remark" />
                        </div>
                        {medicalCase && medicalCase !== "0" && (
                            <div className="field col-12 col-sm-6 col-md-3 mb-2">
                                <label>Medical Expiry Date:</label>
                                <input type="date" className="form-control" value={date}
                                    onChange={(e) => setDate(e.target.value)} />
                            </div>
                        )}
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>Cost Center:</label>
                            <InputText type="text" value={coscenter} onChange={(e) => setCoscenter(e.target.value)} className="form-control" placeholder="Enter Cost Center" />
                        </div>
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>Project Code:</label>
                            <InputText type="text" value={projectCode} onChange={(e) => setProjectCode(e.target.value)} className="form-control" placeholder="Enter Project Code" />
                        </div>
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>Emergency Contact No:</label>
                            <InputText type="text" value={emergencyNo} onChange={(e) => setEmergencyNo(e.target.value)} className="form-control" placeholder="Enter Emergency Contact No" />
                        </div>
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>Emergency Name:</label>
                            <InputText type="text" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} className="form-control" placeholder="Enter Emergency Name" />
                        </div>
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>Transport required for :</label>
                            <Dropdown
                                value={transportRequired}
                                onChange={(e) => setTransportRequired(e.value)}
                                options={transportRequiredOptions}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select Transport Required"
                                className="w-100"
                                appendTo={document.body}
                            />
                        </div>
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>Vaccine Name:</label>
                            <Dropdown
                                value={vaccineName}
                                onChange={(e) => setVaccineName(e.value)}
                                options={vaccineNameOptions}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select Vaccine Name"
                                className="w-100"
                                appendTo={document.body}
                            />
                        </div>
                        {vaccineName && vaccineName !== "0" && (
                            <div className="field col-12 col-sm-6 col-md-3 mb-2">
                                <label>First Dose:</label>
                                <input type="date" className="form-control" value={firstDoseDate}
                                    onChange={(e) => setFirstDoseDate(e.target.value)} />
                            </div>
                        )}
                        {vaccineName && vaccineName !== "0" && (
                            <div className="field col-12 col-sm-6 col-md-3 mb-2">
                                <label>Second Dose:</label>
                                <input type="date" className="form-control" value={secondDoseDate}
                                    onChange={(e) => setSecondDoseDate(e.target.value)} />
                            </div>
                        )}
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>Pincode:</label>
                            <InputText type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} className="form-control" placeholder="Enter Pincode" />
                        </div>
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>City:</label>
                            <Dropdown
                                value={city}
                                //onChange={(e) => setCity(e.value)}
                                options={cityOptions}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select City"
                                className="w-100"
                                onChange={(e) => {
                                    const val = e.value;
                                    setCity(val);
                                    setArea(null);
                                    setAreaOptions([]);
                                    fetchGetGeoCityColonyRS(val);
                                }}
                                appendTo={document.body}
                            />
                        </div>
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>Area:</label>
                            <Dropdown
                                value={area}
                                //onChange={(e) => setArea(e.value)}
                                options={areaOptions}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select Area"
                                className="w-100"
                                onChange={(e) => {
                                    const val = e.value;
                                    setArea(val);
                                    setGeoCodeId(0);
                                    setLandmark(null);
                                    setLandmarkOptions([]);
                                    fetchGetSubColonyRs(val);
                                }}
                                appendTo={document.body}
                            />
                        </div>
                        <div className="field col-12 col-sm-6 col-md-3 mb-2">
                            <label>Landmark:</label>
                            <Dropdown
                                value={geoCodeId}
                                onChange={(e) => {
                                    setGeoCodeId(e.value);
                                    setLandmark(String(e.value));
                                }}
                                options={landmarkOptions}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select Landmark"
                                className="w-100"
                                appendTo={document.body}
                            />
                        </div>
                        <div className="field col-12 mb-2">
                            <label htmlFor="address">Address:</label>
                            <InputTextarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="w-100" />
                        </div>
                        {/* Checkboxes Section */}
                        <div className="col-12 mb-3">
                            <div className="row g-2 p-2 bg-light rounded border">
                                <div className="col-4 col-sm-4 col-md-2 d-flex align-items-center gap-2">
                                    <Checkbox inputId="oobReq" checked={oobRequired} onChange={(e) => setOobRequired(e.checked)} />
                                    <label htmlFor="oobReq" className="form-label mb-0">OOB</label>
                                </div>
                                <div className="col-4 col-sm-4 col-md-2 d-flex align-items-center gap-2">
                                    <Checkbox inputId="medicalReq" checked={isNMT} onChange={(e) => setIsNMT(e.checked)} />
                                    <label htmlFor="medicalReq" className="form-label mb-0">IsNMT</label>
                                </div>
                                <div className="col-4 col-sm-4 col-md-2 d-flex align-items-center gap-2">
                                    <Checkbox inputId="pwdReq" checked={pwdRequired} onChange={(e) => setPwdRequired(e.checked)} />
                                    <label htmlFor="pwdReq" className="form-label mb-0">PWD</label>
                                </div>
                                <div className="col-4 col-sm-4 col-md-2 d-flex align-items-center gap-2">
                                    <Checkbox inputId="tptReq" checked={tptRequired} onChange={(e) => setTptRequired(e.checked)} />
                                    <label htmlFor="tptReq" className="form-label mb-0">Tpt Required</label>
                                </div>
                                <div className="col-4 col-sm-4 col-md-2 d-flex align-items-center gap-2">
                                    <Checkbox inputId="attrited" checked={attrited} onChange={(e) => setAttrited(e.checked)} />
                                    <label htmlFor="attrited" className="form-label mb-0">Attrited</label>
                                </div>
                                <div className="col-4 col-sm-4 col-md-2 d-flex align-items-center gap-2">
                                    <Checkbox inputId="guardRequired" checked={guardRequired} onChange={(e) => setGuardRequired(e.checked)} />
                                    <label htmlFor="guardRequired" className="form-label mb-0">Escort</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </MasterSidebar>
        </div >
    );
};

export default EmployeeMaster;