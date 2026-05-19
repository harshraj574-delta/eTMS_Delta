import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense } from "react";
import Sidebar from "./Master/SidebarMenu";
import Header from "./Master/Header";
import { apiService } from "../services/api";

import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import ResponsiveDataTable from "./common/ResponsiveDataTable";
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { RadioButton } from 'primereact/radiobutton';
import { FilterMatchMode } from "primereact/api";
import { Sidebar as PrimeSidebar } from "primereact/sidebar";
import sessionManager from "../utils/SessionManager";
import { Landmark } from "lucide-react";

// Move constants to a separate file
const CONSTANTS = {
    ROWS_PER_PAGE: 10,
    PAGE_OPTIONS: [5, 10, 25, 50],
    MEDICAL_CASE_OPTIONS: [
        { label: 'No', value: '0' },
        { label: 'Family Way', value: '1' },
        { label: 'Special Category', value: '2' },
    ]
};

function ManageEmployee() {
    const [selectedEmployee, setSelectedEmployee] = useState({});
    const [addEmployee, setAddEmployee] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [managers, setManagers] = useState([]);
    const [visibleLeft, setVisibleLeft] = useState(false);
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });
    const [loading, setLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const dt = useRef(null);
    const [processes, setProcesses] = useState([]);
    const [subProcesses, setSubProcesses] = useState([]);
    const [locations, setLocations] = useState(null);
    const [facilitys, setFacilitys] = useState(null);
    const [allFacilitys, setAllFacilitys] = useState(null);
    // Add the missing renderTime state
    const [renderTime, setRenderTime] = useState(0);
    const renderStartTime = useRef(null);
    
    useEffect(() => {
        // Start timing when component mounts
        renderStartTime.current = performance.now();
        
        // Load data
        getEmployeeData();
        getManagersList();
        GetProcessByFacility();
        
        // Measure render time when component is mounted
        const endTime = performance.now();
        setRenderTime(endTime - renderStartTime.current);
    }, []);

    // Get ProcessBy Facility
    const GetProcessByFacility = async () => {
        try {
            setLoading(true);
            const facilityid = sessionManager.getUserSession().FacilityID;
            const response = await apiService.GetProcessByFacility({
                facilityid: facilityid.toString()
            });

            if (Array.isArray(response)) {
                const formattedProcesses = response.map(process => ({
                    label: process.ProcessName || process.processName,
                    value: process.Id
                }));
                setProcesses(formattedProcesses);
            } else {
                setProcesses([]);
            }
        } catch (error) {
            console.error("Error fetching process data:", error);
            setProcesses([]);
        } finally {
            setLoading(false);
        }
    };

    // Get Sub Process
    const GetSubProcess = async (processId) => {
        try {
            setLoading(true);
            const response = await apiService.GetSubProcess({
                processid: processId,
            });

            if (Array.isArray(response)) {
                const formattedSubProcesses = response.map(subprocess => ({
                    label: subprocess.subProcessName,
                    value: subprocess.Id
                }));
                setSubProcesses(formattedSubProcesses);
            } else {
                setSubProcesses([]);
            }
        } catch (error) {
            console.error("Error fetching subprocess data:", error);
            setSubProcesses([]);
        } finally {
            setLoading(false);
        }
    };

    // Get Geo City By RS
    const locationid = async (id) => {
        try {
            setLoading(true);
            const response = await apiService.locationid({
                locationid: id
            });

            if (Array.isArray(response)) {
                const formattedCities = response.map(locations => ({
                    label: locations.City,
                    value: locations.City
                }));
                setLocations(formattedCities);
            } else {
                setLocations([]);
            }
        } catch (error) {
            console.error("Error fetching location data:", error);
        } finally {
            setLoading(false);
        }
    };

    // selectFacility
    const selectFacility = async (id) => {
        try {
            setLoading(true);
            const response = await apiService.selectFacility({
                Userid: id
            });

            if (Array.isArray(response)) {
                const formattedFacility = response.map(facility => ({
                    label: facility.facilityName,
                    value: facility.Id
                }));
                setFacilitys(formattedFacility);
            } else {
                setFacilitys([]);
            }
        } catch (error) {
            console.error("Error fetching facility data:", error);
            setFacilitys([]);
        } finally {
            setLoading(false);
        }
    };

    // selectFacility
    const selectAllFacility = async (id) => {
        try {
            setLoading(true);
            const response = await apiService.selectAllFacility({
                Userid: id
            });

            if (Array.isArray(response)) {
                const formattedAllFacility = response.map(allFacility => ({
                    label: allFacility.facilityName,
                    value: allFacility.Id
                }));
                setAllFacilitys(formattedAllFacility);
            } else {
                setAllFacilitys([]);
            }
        } catch (error) {
            console.error("Error fetching facility data:", error);
            setAllFacilitys([]);
        } finally {
            setLoading(false);
        }
    };

    // Add this function to fetch managers
    const getManagersList = async () => {
        try {
            const response = await apiService.GetManagerList({
                locationid: "",
                empidname: "",
                IsAdmin: ""
            });

            if (Array.isArray(response)) {
                const formattedManagers = response.map(manager => ({
                    label: manager.empName || manager.EmpName || manager.userName || manager.UserName || manager.id,
                    value: manager.id || manager.Id || manager.empId || manager.EmpId
                }));
                setManagers(formattedManagers);
            } else if (typeof response === 'string') {
                try {
                    const parsedData = JSON.parse(response);
                    if (Array.isArray(parsedData)) {
                        const formattedManagers = parsedData.map(manager => ({
                            label: manager.empName || manager.EmpName || manager.userName || manager.UserName || manager.id,
                            value: manager.id || manager.Id || manager.empId || manager.EmpId
                        }));
                        setManagers(formattedManagers);
                    }
                } catch (e) {
                    console.error("Error parsing managers data:", e);
                    setManagers([]);
                }
            } else {
                setManagers([]);
            }
        } catch (error) {
            console.error("Error fetching managers:", error);
            setManagers([]);
        }
    };
    
    // Get Employee Data
    const getEmployeeData = async () => {
        try {
            setLoading(true);
            const facilityid = sessionManager.getUserSession().FacilityID;
            const response = await apiService.GetEmployeeList({
                facilityid: facilityid
            });
            if (Array.isArray(response)) {
                setEmployees(response);
            } else {
                console.error("Unexpected response format:", response);
            }
        } catch (error) {
            console.error("Error fetching employee data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Add this function to handle search
    const handleEmpSearch = async () => {
        try {
            setLoading(true);
            const response = await apiService.EmpSearch({
                locationid: sessionManager.getUserSession().locationId,
                empidname: searchKeyword,
                IsAdmin: sessionManager.getUserSession().ISadmin,
            });

            if (Array.isArray(response)) {
                setEmployees(response);
            } else if (response && typeof response === 'string') {
                try {
                    const parsedResponse = JSON.parse(response);
                    if (Array.isArray(parsedResponse)) {
                        setEmployees(parsedResponse);
                    } else {
                        setEmployees([]);
                    }
                } catch (e) {
                    console.error("Error parsing response:", e);
                    setEmployees([]);
                }
            } else {
                setEmployees([]);
            }
        } catch (error) {
            console.error("Error searching employees:", error);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEmployee = async (e) => {
        if(e) e.preventDefault();
        try {
            setLoading(true);
            const employeeData = {
              id: selectedEmployee.id || "",
              empCode: selectedEmployee.empCode || "",
              empName: selectedEmployee.empName || "",
              userName: selectedEmployee.userName || "",
              designation: selectedEmployee.designation || "",
              Gender: selectedEmployee.Gender || "",
              mobile: selectedEmployee.mobile || "",
              phone: selectedEmployee.phone || "",
              email: selectedEmployee.email || "",
              attrited: selectedEmployee.attrited || "",
              tptReq: selectedEmployee.tptReq || "",
              managerId: selectedEmployee.managerId || "",
              facilityId: selectedEmployee.facilityId || "",
              processId: selectedEmployee.processId || "",
              subProcessId: selectedEmployee.subProcessId || "",
              nodalId: selectedEmployee.nodalId || "",
              address: selectedEmployee.address || "",
              pincode: selectedEmployee.pincode || "",
              geoCodeId: selectedEmployee.geoCodeId || "",
              updatedBy: selectedEmployee.updatedBy || "",
              address2: selectedEmployee.address2 || "",
              geocodeid2: selectedEmployee.geocodeid2 || "",
              lastworkingday: selectedEmployee.lastworkingday || "",
              specialCase: selectedEmployee.specialCase || "",
              pincode2: selectedEmployee.pincode2 || "",
              coscenter: selectedEmployee.coscenter || "",
              EmergencyNo: selectedEmployee.EmergencyNo || "",
              EmegencyName: selectedEmployee.EmegencyName || "",
              MedicalRemark: selectedEmployee.MedicalRemark || "",
              MedicalExpiryDate: selectedEmployee.MedicalExpiryDate || "",
              FacEnable: selectedEmployee.FacEnable || "",
              GuardReq: selectedEmployee.GuardReq || "",
              Tptfor: selectedEmployee.Tptfor || "",
              VaccineName: selectedEmployee.VaccineName || "",
              FirstDoseDate: selectedEmployee.FirstDoseDate || "",
              SecondDoesDate: selectedEmployee.SecondDoesDate || "",
            };

            const response = await apiService.UpdateEmployee(employeeData);

            if(response){
               // alert("Employee Updated Successfully");
                getEmployeeData();
                setVisibleLeft(false);
            }
        }catch(error){
            console.error("Error updating employee:", error);
            alert("Error updating employee");
        }finally{
            setLoading(false);
        };
    }

    // Open sidebar with employee data
    const openEditSidebar = (employee) => {
        setSelectedEmployee(employee);
        setVisibleLeft(true);

        if (employee.processId) {
            GetSubProcess(employee.processId);
        }
        if (employee.id) {
            locationid(employee.id);
        }
        if (sessionManager.getUserSession().ISadmin === 'Y') {
            if (employee.id) {
                selectAllFacility(employee.id);
            }
        }
        else {
            if (employee.id) {
                selectFacility(employee.id);
            }
        }
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSelectedEmployee((prev) => ({ ...prev, [name]: value }));
    };

    // Status Badge
    const StatusData = (rowData) => (
        <Badge value={rowData.attrited === "N" ? "Active" : "Inactive"} severity={rowData.attrited === "N" ? "badgee badge_success" : "badgee badge_danger"} />
    );
    
    // Memoize the StatusData function
    const memoizedStatusData = useCallback(StatusData, []);

    // Add this function for Excel export
    const exportExcel = () => {
        if (dt.current) {
            const fileName = `employee_list_${new Date().toISOString().slice(0,10)}`;
            dt.current.exportCSV({ fileName });
        }
    };

    const paginatorLeft = <Button type="button" icon="pi pi-refresh" text onClick={() => getEmployeeData()} />;
    const paginatorRight = <Button type="button" icon="pi pi-download" text onClick={exportExcel} />;

    // Memoize expensive computations and callbacks
    const memoizedProcesses = useMemo(() => 
        processes.map(process => ({
            label: process.ProcessName,
            value: process.Id
        })), [processes]);

    return (
        <>
            <Header pageTitle="Manage Employee" showNewButton={true} onNewButtonClick={setAddEmployee} />
            <Sidebar />
            <div className="middle">
                <div className="row">
                    <div className="col-12">
                        <h6 className="pageTitle">Manage Emplyoee</h6>
                        {renderTime > 0 && (
                            <div className="performance-info" style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                                Page render time: {renderTime.toFixed(2)}ms
                            </div>
                        )}
                        <div className="card_tb">
                            <div className="row mb-3">
                                <div className="col-3">
                                    <div className="p-inputgroup m-3 mb-0">
                                        <InputText
                                            placeholder="Keyword Search"
                                            value={searchKeyword}
                                            onChange={(e) => setSearchKeyword(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleEmpSearch()}
                                            className="w-100"
                                        />
                                        <span className="p-inputgroup-addon" onClick={handleEmpSearch} style={{ cursor: "pointer" }}>
                                            <i className="pi pi-search"></i>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <ResponsiveDataTable
                                ref={dt}
                                value={employees}
                                loading={loading}
                                paginator
                                rows={10}
                                rowsPerPageOptions={[5, 10, 25, 50]}
                                filters={filters}
                                stripedRows
                                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} employees"
                                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                paginatorLeft={paginatorLeft}
                                paginatorRight={paginatorRight}
                                rowClassName={(rowData) => {
                                    return rowData[0]?.status === "Y" ? "bg-danger-subtle" : "";
                                }}
                                removableSort
                                onRowClick={({ data }) => openEditSidebar(data)}
                            >
                                <Column sortable field="empName" header="Employee Name" mobile={{ primary: true }} />
                                <Column sortable field="empCode" header="Employee ID" mobile={{ subtitle: true }} body={(rowData) => (
                                    <a href="#" onClick={(e) => {
                                        e.preventDefault();
                                        openEditSidebar(rowData);
                                    }}>
                                        {rowData.empCode}
                                    </a>
                                )} />
                                <Column sortable field="ProcessName" header="Process" />
                                <Column sortable field="facilityName" header="Facility" />
                                <Column sortable field="email" header="Email" mobile={{ hidden: true }} />
                                <Column sortable field="tptReq" header="TptReq" mobile={{ hidden: true }} />
                                <Column sortable header="Status" mobile={{ badge: true }} body={memoizedStatusData} />
                            </ResponsiveDataTable>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Employee Sidebar */}
            <PrimeSidebar 
                visible={visibleLeft} 
                position="right" 
                onHide={() => setVisibleLeft(false)} 
                width="50%" 
                showCloseIcon={false} 
                dismissable={false} 
                style={{
                    width:'50%',
                }}
            >
                <div className="d-flex justify-content-between align-items-center sidebarTitle p-0">
                    <h6 className="sidebarTitle">{selectedEmployee?.empName || ''} - {selectedEmployee?.empCode || ''}</h6>
                    <span className="d-flex align-items-center">
                    <p className="text-warning">{selectedEmployee && selectedEmployee.attrited === "Y" ? "Attrited" : ""}</p>
                    <Button icon="pi pi-times" className="p-button-rounded p-button-text ms-3" onClick={() => setVisibleLeft(false)} />
                    </span>
                </div>
                {selectedEmployee && (
                    <form className="sidebarBody">
                    <div className="row" style={{marginBottom:'66px'}}>
                            <div className="col-12 mb-3">
                                <div className="bg-light-blue w-100 d-flex justify-content-between align-items-center">
                                <h6 className="sidebarSubTitle">Personal Details</h6>
                                <div className="d-flex justify-content-between">                                
                                <Checkbox checked={selectedEmployee.attrited === "Y"}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: "attrited",
                                            value: e.target.checked ? "Y" : "N"
                                        }
                                    })}></Checkbox>
                                    <label className="mx-2">Attrited</label>
                            </div>
                                </div>
                            </div>
                            <div className="field col-4 mb-3">
                                <label>Employee Code</label>
                                <InputText className="form-control" name="empid" value={selectedEmployee.empCode || ""} onChange={handleInputChange} />
                        </div>
                            <div className="field col-4 mb-3">
                            <label>Employee Name <span>*</span></label>
                            <InputText className="form-control" name="empName" value={selectedEmployee.empName || ""} onChange={handleInputChange} />
                        </div>
                            <div className="field col-4 mb-3">
                            <label>User Name</label>
                            <InputText className="form-control" name="userName" value={selectedEmployee.userName || ""} onChange={handleInputChange} />
                        </div>
                            
                            <div className="field col-4 mb-3">
                            <label>Mobile</label>
                            <InputText className="form-control" name="tptReq" value={selectedEmployee.mobile || ""} onChange={handleInputChange} />
                        </div>
                            <div className="field col-4 mb-3">
                            <label>Phone</label>
                            <InputText className="form-control" name="attrited" value={selectedEmployee.phone || ""} onChange={handleInputChange} />
                        </div>
                            <div className="field col-4 mb-3">
                                <label>Email</label>
                                <InputText className="form-control" name="email" value={selectedEmployee.email || ""} onChange={handleInputChange} />
                            </div>
                            <div className="field col-4 mb-3">
                            <label>Gender</label>
                                <div className="d-flex gap-3">
                                    <div className="d-flex align-items-center gap-2">
                                    <RadioButton
                                        inputId="genderMale"
                                        name="Gender"
                                        value="Male"
                                        onChange={handleInputChange}
                                        checked={selectedEmployee.Gender === "Male"}
                                    />
                                        <label htmlFor="ingredient1" className="ml-2">Male</label>
                                </div>
                                    <div className="d-flex align-items-center gap-2">
                                    <RadioButton
                                        inputId="genderFemale"
                                        name="Gender"
                                        value="Female"
                                        onChange={handleInputChange}
                                        checked={selectedEmployee.Gender === "Female"}
                                    />
                                        <label htmlFor="ingredient2" className="ml-2">Female</label>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 my-3">
                                <h6 className="sidebarSubTitle">Official Details</h6>
                            </div>

                            <div className="field col-4 mb-3">
                                <label className="d-block">Facility <span>*</span></label>
                                <Dropdown
                                    name="facilities"
                                    value={selectedEmployee.id || ""}
                                    onChange={handleInputChange}
                                    options={facilitys}
                                    placeholder="Select Facility"
                                    className="w-full md:w-14rem w-100"
                                    emptyMessage="No Facility available"
                                    filter
                                />
                            </div>
                            <div className="field col-4 mb-3">
                                <label className="d-block">Process <span>*</span></label>
                                <Dropdown
                                    name="ProcessName"
                                    value={selectedEmployee.processId || ""}
                                    onChange={handleInputChange}
                                    options={memoizedProcesses}
                                    placeholder="Select a Process"
                                    className="w-full md:w-14rem w-100"
                                    emptyMessage="No Process available"
                                    filter
                                />
                            </div>
                            <div className="field col-4 mb-3">
                                <label>Sub Process</label>
                                <Dropdown
                                    name="subProcessName"
                                    value={selectedEmployee.subProcessId || ""}
                                    onChange={handleInputChange}
                                    options={subProcesses}
                                    placeholder="Select a Sub Process"
                                    className="w-full md:w-14rem w-100"
                                    emptyMessage="No Sub Process available"
                                    filter
                                />
                            </div>
                            <div className="field col-4 mb-3">
                                <label className="d-block">Manager</label>
                                <Dropdown
                                    name="managerId"
                                    value={selectedEmployee.managerId || ""}
                                    onChange={handleInputChange}
                                    options={managers}
                                    filter
                                    placeholder="Select a Manager"
                                    className="w-full md:w-14rem w-100"
                                    emptyMessage="No managers available"
                                />
                            </div>
                            <div className="field col-4 mb-3">
                                <label className="d-block">Medical Case</label>
                                <Dropdown
                                    name="MedicalCase"
                                    className="w-full md:w-14rem w-100"
                                    placeholder="Select Medical Case"
                                    options={CONSTANTS.MEDICAL_CASE_OPTIONS}
                                />
                            </div>
                            <div className="field col-4 mb-3">
                                <label>Medical Expiry Date</label>
                                <Calendar
                                    name="MedicalExpiryDate"
                                    value={selectedEmployee.MedicalExpiryDate ? new Date(selectedEmployee.MedicalExpiryDate) : null}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: "MedicalExpiryDate",
                                            value: e.value
                                        }
                                    })}
                                    className="w-100"
                                    dateFormat="dd/mm/yy"
                                />
                            </div>
                            <div className="field col-4 mb-3">
                                <label>Project Code</label>
                                <InputText className="form-control" name="MedicalCaseDetails" value={selectedEmployee.ProcessName || ""} onChange={handleInputChange} />
                            </div>
                            <div className="field col-4 mb-3">
                                <label>Emergency Contact No</label>
                                <InputText className="form-control" name="EmergencyContact" value={selectedEmployee.EmergencyContact || ""} onChange={handleInputChange} />
                            </div>
                            <div className="field col-4 mb-3">
                                <label>Emergency Name</label>
                                <InputText className="form-control" name="EmergencyName" value={selectedEmployee.EmergencyName || ""} onChange={handleInputChange} />
                            </div>
                            <div className="field col-4 mb-3 d-flex align-items-center">
                                <Checkbox checked={selectedEmployee.tptReq === "Y"}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: "tptReq",
                                            value: e.target.checked ? "Y" : "N"
                                        }
                                    })} className="me-2"></Checkbox>
                                    <label>Transport Required</label>
                            </div>
                            
                            <div className="col-12 my-3">
                                <h6 className="sidebarSubTitle">Edit Address Details</h6>
                            </div>
                            <div className="field col-12 mb-3">
                                <label>Address</label>
                                <InputText className="form-control" name="TransportType" value={selectedEmployee.address || ""} onChange={handleInputChange} />
                            </div>
                            <div className="field col-4 mb-3">
                                <label>Pincode</label>
                                <InputText className="form-control" name="TransportNumber" value={selectedEmployee.pincode || ""} onChange={handleInputChange} />
                            </div>
                            <div className="field col-4 mb-3">
                                <label>City</label>
                                <Dropdown
                                    name="subProcessName"
                                    value={selectedEmployee.City || ""}
                                    onChange={handleInputChange}
                                    options={locations}
                                    placeholder="Select City"
                                    className="w-full md:w-14rem w-100"
                                    emptyMessage="No Sub Process available"
                                    filter
                                />
                            </div>
                            <div className="field col-4 mb-3">
                                <label>Area</label>
                                <InputText className="form-control" name="TransportContact" value={selectedEmployee.Colony || ""} onChange={handleInputChange} />
                            </div>
                            <div className="field col-4 mb-3">
                                <label>Landmark</label>
                                <InputText className="form-control" name="TransportName" value={selectedEmployee.Landmark || ""} onChange={handleInputChange} />
                            </div>
                        </div>
                        {/* Fixed button container at bottom of sidebar */}
                        <div className="sidebar-fixed-bottom position-absolute pe-3">
                            <div className="d-flex gap-3 justify-content-end me-3">
                                <Button label="Cancel" className="btn btn-outline-secondary" onClick={() => setVisibleLeft(false)} />
                                <Button label="Update" className="btn btn-success" onClick={handleUpdateEmployee}/>
                            </div>
                        </div>
                    </form>
                )}
            </PrimeSidebar>

            {/* Add Employee Sidebar */}
            <PrimeSidebar
                visible={addEmployee}
                position="right"
                onHide={() => setAddEmployee(false)}
                showCloseIcon={false}
                dismissable={false}
                style={{
                    width: '50%',
                }}
            >
                <div className="d-flex justify-content-between align-items-center sidebarTitle p-0">
                    <h6 className="sidebarTitle">Add Employee</h6>
                    <Button icon="pi pi-times" className="p-button-rounded p-button-text" onClick={() => setAddEmployee(false)} />
                </div>
                <div className="sidebarBody">
                    <div className="row">
                        <div className="col-12 mb-3"> 1</div>
                    </div>
                </div> 
                {/* Fixed button container at bottom of sidebar */}
                <div className="sidebar-fixed-bottom position-absolute pe-3">
                    <div className="d-flex gap-3 justify-content-end me-3">
                        <Button label="Cancel" className="btn btn-outline-secondary" onClick={() => setAddEmployee(false)} />
                        <Button label="Update" className="btn btn-success" onClick={() => setAddEmployee(false)} />
                    </div>
                </div>              
            </PrimeSidebar>
        </>
    );
}

export default ManageEmployee;
