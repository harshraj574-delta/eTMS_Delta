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
import { ToastContainer } from "react-toastify";
import { Dropdown } from "primereact/dropdown";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
import Calendar from "react-calendar";
import calendarIcon from "../assets/calendar.png";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import ReportButton from "./common/ReportButton";
const EmployeeMaster = () => {
    const [loading, setLoading] = useState(false);
    const UserId = sessionManager.getUserSession().ID;
    const locationId = sessionManager.getUserSession().locationId;
    const ISadmin = sessionManager.getUserSession().ISadmin;
    const [searchText, setSearchText] = useState("");
    const [rows, setRows] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [gender, setGender] = useState(null);
    const genderOptions = useMemo(() => [
        { value: "M", label: "Male" },
        { value: "F", label: "Female" },
    ], []);
    const transportRequiredOptions = useMemo(() => [
        { value: "P", label: "Pickup" },
        { value: "D", label: "Drop" },
        { value: "B", label: "Both" },
    ], []);
    const [transportRequired, setTransportRequired] = useState(null);
    const today = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };
    const [date, setDate] = useState(today());
    const [firstDoseDate, setFirstDoseDate] = useState(today());
    const [secondDoseDate, setSecondDoseDate] = useState(today());
    const [address, setAddress] = useState("");
    const [tptRequired, setTptRequired] = useState(false);

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
            console.log("Search Response:", response);
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
    return (
        <div className="container-fluid p-0">
            <ToastContainer position="top-right" autoClose={3000} />
            <Loader isVisible={loading} fullScreen={true} />
            <Header pageTitle={"Employee Master"} mainTitle={"Transport"} showNewButton={true} onNewButtonClick={handleNewClick} />
            <Sidebar />
            <div className="middle">
                <div className="row">
                    <div className="col-12 col-lg-8">
                        <div className="card_tb p-3 mb-3">
                            <div className="row g-2">
                                <div className="col-12 col-sm-6 col-md-3 col-lg-5">
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
                                <div className="col-12 col-sm-6 col-md-3 col-lg-3 d-flex align-items-end">
                                    <ReportButton 
                                        label="Search" 
                                        onClick={handleSearch}
                                        icon="pi"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {hasSearched && (
                    <>
                        <div className="card_tb p-3">
                            <TableToolbar showExport={false} showFilter={false} />
                            <DataTable value={rows} paginator rows={20} emptyMessage="No records found">
                                <Column field="empCode" header="Employee Id" />
                                <Column field="empName" header="Employee Name" />
                                <Column field="processName" header="Process" />
                                <Column field="facilityName" header="Facility" />
                                <Column field="email" header="Email" />
                                <Column field="TptReq" header="TptReq" />
                                <Column field="Attrited" header="Active" />
                            </DataTable>
                        </div>
                    </>
                )}
            </div>
            <PrimeSidebar
                visible={showSidebar}
                position="right"
                onHide={() => setShowSidebar(false)}
                showCloseIcon={false}
                dismissable={false}
                style={{ width: "70%", backdropFilter: "blur(8px)" }}
            >
                <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
                    <h6 className="sidebarTitle">Add Employee</h6>
                    <Button
                        icon="pi pi-times"
                        className="p-button-rounded p-button-text"
                        onClick={() => setShowSidebar(false)}
                    />
                </div>
                <div className="sidebarBody">
                    <div className="row">
                        <div className="field col-3 mb-3">
                            <label>Employee Id:</label>
                            <InputText type="text" className="form-control" placeholder="Enter Employee Id" />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Employee Name:</label>
                            <InputText type="text" className="form-control" placeholder="Enter Employee Name" />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>User Name:</label>
                            <InputText type="text" className="form-control" placeholder="Enter User Name" />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Gender:</label>
                            <Dropdown
                                value={gender}
                                onChange={(e) => setGender(e.value)}
                                options={genderOptions}
                                optionLabel="label"
                                placeholder="Select Gender"
                                className="w-100"
                            />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Mobile:</label>
                            <InputText type="text" className="form-control" placeholder="Enter Mobile No." />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Phone:</label>
                            <InputText type="text" className="form-control" placeholder="Enter Phone No." />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Email:</label>
                            <InputText type="text" className="form-control" placeholder="Enter Email Id" />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Facility:</label>
                            <Dropdown
                                // value={facility}
                                // onChange={(e) => setFacility(e.value)}
                                // options={facilityOptions}
                                optionLabel="label"
                                placeholder="Select Facility"
                                className="w-100"
                            />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Process:</label>
                            <Dropdown
                                // value={process}
                                // onChange={(e) => setProcess(e.value)}
                                // options={processOptions}
                                optionLabel="label"
                                placeholder="Select Process"
                                className="w-100"
                            />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>SubProcess:</label>
                            <Dropdown
                                // value={subProcess}
                                // onChange={(e) => setSubProcess(e.value)}
                                // options={subProcessOptions}
                                optionLabel="label"
                                placeholder="Select SubProcess"
                                className="w-100"
                            />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Manager:</label>
                            <Dropdown
                                // value={manager}
                                // onChange={(e) => setManager(e.value)}
                                // options={managerOptions}
                                optionLabel="label"
                                placeholder="Select Manager"
                                className="w-100"
                            />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Medical Case:</label>
                            <Dropdown
                                // value={medicalCase}
                                // onChange={(e) => setMedicalCase(e.value)}
                                // options={medicalCaseOptions}
                                optionLabel="label"
                                placeholder="Select Medical Case"
                                className="w-100"
                            />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Medical Expiry Date:</label>
                            <input type="date" className="form-control" value={date}
                                onChange={(e) => setDate(e.target.value)} />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Project Code:</label>
                            <InputText type="text" className="form-control" placeholder="Enter Project Code" />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Emergency Contact No:</label>
                            <InputText type="text" className="form-control" placeholder="Enter Emergency Contact No" />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Emergency Name:</label>
                            <InputText type="text" className="form-control" placeholder="Enter Emergency Name" />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Transport required for :</label>
                            <Dropdown
                                value={transportRequired}
                                onChange={(e) => setTransportRequired(e.value)}
                                options={transportRequiredOptions}
                                optionLabel="label"
                                placeholder="Select Transport Required"
                                className="w-100"
                            />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Vaccine Name:</label>
                            <Dropdown
                                // value={vaccineName}
                                // onChange={(e) => setVaccineName(e.value)}
                                // options={vaccineNameOptions}
                                optionLabel="label"
                                placeholder="Select Vaccine Name"
                                className="w-100"
                            />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>First Dose:</label>
                            <input type="date" className="form-control" value={firstDoseDate}
                                onChange={(e) => setFirstDoseDate(e.target.value)} />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Second Dose:</label>
                            <input type="date" className="form-control" value={secondDoseDate}
                                onChange={(e) => setSecondDoseDate(e.target.value)} />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Pincode:</label>
                            <InputText type="text" className="form-control" placeholder="Enter Pincode" />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>City:</label>
                            <Dropdown
                                // value={city}
                                // onChange={(e) => setCity(e.value)}
                                // options={cityOptions}
                                optionLabel="label"
                                placeholder="Select City"
                                className="w-100"
                            />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Area:</label>
                            <Dropdown
                                // value={area}
                                // onChange={(e) => setArea(e.value)}
                                // options={areaOptions}
                                optionLabel="label"
                                placeholder="Select Area"
                                className="w-100"
                            />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Landmark:</label>
                            <Dropdown
                                // value={landmark}
                                // onChange={(e) => setLandmark(e.value)}
                                // options={landmarkOptions}
                                optionLabel="label"
                                placeholder="Select Landmark"
                                className="w-100"
                            />
                        </div>
                        <div className="field col-3 mb-3">
                            <label htmlFor="username">Address:</label>
                            <InputTextarea id="username" value={address} onChange={(e) => setAddress(e.target.value)} rows={5} cols={39} />
                        </div>
                        <div className="field col-3 mb-3 d-flex flex-column justify-content-center">
                            <div className="d-flex align-items-center gap-2">
                                <label htmlFor="tptReq" className="form-label mb-0">
                                    Tpt Required:
                                </label>
                                <Checkbox
                                    inputId="tptReq"
                                    checked={tptRequired}
                                    onChange={(e) => setTptRequired(e.checked)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="position-absolute bottom-0 end-0 p-3 w-100">
                        <div className="d-flex justify-content-end gap-2">
                            <Button
                                label="Cancel"
                                className="btn btn-outline-secondary"
                                onClick={() => setShowSidebar(false)}
                            />
                            <Button
                                label="Save"
                                className="btn btn-success"
                                onClick={() => {
                                    // save logic
                                    setShowSidebar(false);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </PrimeSidebar >
        </div >
    );
};

export default EmployeeMaster;