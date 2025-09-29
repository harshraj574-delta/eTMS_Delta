import React, { useState, useEffect } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";

import { FileUpload } from "primereact/fileupload";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from "primereact/paginator";
import { Sidebar as PrimeSidebar } from "primereact/sidebar"; // Renamed to avoid conflict with your Sidebar component
import { Checkbox } from "primereact/checkbox";
import { Badge } from "primereact/badge";

import sessionManager from "../utils/SessionManager";
import { apiService } from "../services/api";
import driverMasterService from "../services/compliance/DriverMasterService";



const DriverMaster = () => {
    // Add this CSS class to your component or in your CSS file
    const customSortStyle = {
        '.p-sortable-column:not(.p-highlight) .p-sortable-column-icon': {
            opacity: 0
        },
        '.p-sortable-column:hover .p-sortable-column-icon': {
            opacity: 1
        }
    };

    const [visibleLeft, setVisibleLeft] = useState(false);
    const [driverDetails, setDriverDetails] = useState([]);
    const [addDriverMaster, setAddDriverMaster] = useState(false);
    const [loading, setLoading] = useState(false);
    const localtionId = sessionManager.getUserSession().locationId;
    const userId = sessionManager.getUserSession().ID;
    // Lookup states
    const [facilities, setFacilities] = useState([]);
    const [venders, setVenders] = useState([]);

    // Selectted Values
    const [selFacility, setSelFacility] = useState(null);
    const [selVendor, setSelVendor] = useState(null);
    const [search, setSearch] = useState("");

    // Sort Table
    const [sortField, setSortField] = useState('');
    const [sortOrder, setSortOrder] = useState(null);

    const onSort = (e) => {
        setSortField(e.sortField);
        setSortOrder(e.sortOrder);
    };

    useEffect(() => {
        fetchFacilities();
    }, []);

    useEffect(() => {
        if (selFacility) {
            fetchVenders(selFacility?.Id);
        }

    }, [selFacility]);


    const fetchFacilities = () => {
        driverMasterService.getFacilitiesByUserId(userId).then((res) => {
            const data = JSON.parse(res.data) || [];
            console.log("Facilities", data);
            setFacilities(data);
        }).catch((err) => {
            console.log("Error", err)
        })
    }

    const fetchVenders = (id) => {
        driverMasterService.getVenders({ facilityid: id }).then((res) => {
            const data = JSON.parse(res.data) || [];
            //console.log("Venders", data);

            setVenders(data);
        }).catch((err) => {
            console.log("Error", err)
        })
    }



    // Fetch driver details from API
    const fetchDriverDetails = async () => {
        const params = {
            facilityid: selFacility?.id || 1,
            vendorid: selVendor?.id || 1,
            Search: search || "",
        }
        // Approach 1 with async/await
        try {
            const response = await driverMasterService.getDriverMasterDetails(params);
            const respData = JSON.parse(response.data);
            setDriverDetails(respData);
        } catch (error) {
            console.log("Error", error)
        }

        // Approach 2 with .then and .catch

        // driverMasterService.getDriverMasterDetails(params).then((res) => {
        //     try {
        //         const respData = JSON.parse(res.data);
        //         setDriverDetails(respData);
        //     } catch (error) {
        //         console.log("Error data parsing", error)
        //     }
        // }).catch((err) => {
        //     console.log("Error", err)
        // })
    }


    // Open sidebar with employee data
    const openEditSidebar = () => {
        setVisibleLeft(true); // Open sidebar
    };

    // Licence Exp. Date
    const LicenceExp = (rowData) => (
        <Badge value={rowData.LicenceExpDate} severity={rowData.LicenceExpDate === "N" ? "badgee badge_success" : "badgee badge_danger"} />
    );



    return (
        <>
            <Header pageTitle="Driver Master" showNewButton={true} onNewButtonClick={setAddDriverMaster} />
            <Sidebar />
            <div className="middle">
                <div className="row">
                    <div className="col-12">
                        <h6 className="pageTitle">Driver Master</h6>
                    </div>
                    {/* Search Box */}
                    <div className="col-12">
                        <div className="card_tb p-3">
                            <div className="row">
                                <div className="col-2">
                                    <label htmlFor="">Facility</label>
                                    <Dropdown value={selFacility} onChange={(e) => setSelFacility(e.value)} options={facilities} optionLabel="facilityName"
                                        placeholder="Select Facility" className="w-100" filter />
                                </div>
                                <div className="col-2">
                                    <label htmlFor="">Vendor</label>
                                    <Dropdown value={selVendor} onChange={(e) => setSelVendor(e.value)} options={venders} optionLabel="vendorName"
                                        placeholder="Select Vendor" className="w-100" filter />
                                </div>
                                <div className="col-2">
                                    <Button label="Submit" className="btn btn-primary no-label-prime" onClick={fetchDriverDetails} />
                                </div>
                                <div className="col-2 offset-4">
                                    <label htmlFor="" className="d-block">Search Any</label>
                                    <InputText value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Any Value" className="w-100" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Start */}
                    <div className="col-12">
                        <div className="card_tb">
                            <DataTable value={driverDetails}
                                scrollable
                                sortField={sortField}
                                sortOrder={sortOrder}
                                onSort={onSort}
                                sortMode="single"
                                removableSort
                                paginator
                                rows={50}
                                rowsPerPageOptions={[50, 100, 150, 200]} pt={customSortStyle}>
                                <Column field="Id" header="ID" body={(rowData) => (
                                    <a href="#" onClick={(e) => { e.preventDefault(); setVisibleLeft(true); }}>
                                        {rowData.Id}
                                    </a>
                                )}></Column>

                                <Column field="DriverName" header="Name" body={(rowData) => rowData.DriverName.toLowerCase()}></Column>
                                <Column field="FacilityName" header="Facility"></Column>
                                <Column field="VendorName" header="Vendor" ></Column>
                                {/* <Column field="FatherName" header="Father's Name"></Column> */}
                                <Column field="ContactNo" header="Contact No."></Column>
                                {/* <Column field="DateOfBirth" header="DOB"></Column> */}
                                {/* <Column field="BloodGroup" header="Blood Group"></Column> */}
                                <Column field="VehicleNo" header="Vehicle No."></Column>
                                <Column field="VehicleRegNo" header="Vehicle Reg. No."></Column>
                                <Column field="LicenceNo" header="Licence No."></Column>
                                <Column field="LicenceExpDate" header="Licence Exp. Date" body={LicenceExp}></Column>
                                {/* <Column field="BadgeNo" header="Badge No."></Column>
                                <Column field="BadgeExpDatee" header="Badge Exp. Date"></Column> */}
                                {/* <Column field="action" header="Action" className="text-center"></Column> */}
                            </DataTable>
                        </div>
                    </div>

                    {/* Edit Driver Master */}
                    <PrimeSidebar visible={visibleLeft} position="right" onHide={() => setVisibleLeft(false)} width="50%" showCloseIcon={false} dismissable={false} style={{ width: '70%', backdropFilter: 'blur(8px)' }}>
                        <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
                            <h6 className="sidebarTitle">Edit Driver Details</h6>
                            <Button icon="pi pi-times" className="p-button-rounded p-button-text" onClick={() => setVisibleLeft(false)} />
                        </div>
                        <div className="sidebarBody">
                            <div className="row">
                                <div className="col-12 mb-3">
                                    <h6 className="sidebarSubTitle">Personal Details</h6>
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Driver ID</label>
                                    <InputText className="form-control" name="" placeholder="Driver Id" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Driver Name</label>
                                    <InputText className="form-control" name="" placeholder="Driver Name" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Date of Birth</label>
                                    <Calendar className="w-100" name="" placeholder="Date of Birth" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Contact Number</label>
                                    <InputText className="form-control" name="" placeholder="Contact Number" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Blood Group</label>
                                    <InputText className="form-control" name="" placeholder="Blood Group" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Qualification</label>
                                    <InputText className="form-control" name="" placeholder="Qualification" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Marital Status</label>
                                    <InputText className="form-control" name="" placeholder="Marital Status" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Father’s Name</label>
                                    <InputText className="form-control" name="" placeholder="Father’s Name" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Mother's Name</label>
                                    <InputText className="form-control" name="" placeholder="Mother's Name" />
                                </div>

                                <div className="field col-6 mb-3">
                                    <label>Present Address</label>
                                    <InputText className="form-control" name="" placeholder="Present Address" />
                                </div>
                                <div className="field col-6 mb-3">
                                    <label>Permanent Address</label>
                                    <InputText className="form-control" name="" placeholder="Permanent Address" />
                                </div>
                                <div className="col-12 mb-3">
                                    <h6 className="sidebarSubTitle">Vehicle Details</h6>
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Vehicle Number</label>
                                    <Dropdown optionLabel="name" placeholder="Select Vehicle Number" className="w-100" filter />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Licence Number</label>
                                    <InputText className="form-control" name="" placeholder="Licence Number" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Licence Expiry Date</label>
                                    <Calendar className="w-100" name="" placeholder="Licence Expiry Date" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Badge Number</label>
                                    <InputText className="form-control" name="" placeholder="Badge Number" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Badge Expiry Date</label>
                                    <Calendar className="w-100" name="" placeholder="Badge Expiry Date" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Driver Status</label>
                                    <Dropdown optionLabel="name" placeholder="Select Driver Status" className="w-100" filter />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Attrited Date</label>
                                    <Calendar className="w-100" name="" placeholder="Attrited Date" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Facility Name</label>
                                    <Dropdown optionLabel="name" placeholder="Select Facility Name" className="w-100" filter />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Vendor Name</label>
                                    <Dropdown optionLabel="name" placeholder="Select Vendor Name" className="w-100" filter />
                                </div>
                                {/* <div className="field col-3 mb-3">
                                    <label>Warning-1</label>
                                    <InputText className="form-control" name="" placeholder="Warning-1" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Warning-2</label>
                                    <InputText className="form-control" name="" placeholder="Warning-2" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Final Warning</label>
                                    <InputText className="form-control" name="" placeholder="Final Warning" />
                                </div> */}
                                <div className="field col-3 d-flex align-items-center">
                                    <div className="d-flex mt-3">
                                        <Checkbox inputId="AadharVerification" className="" name="" />
                                        <label htmlFor="AadharVerification" className="ms-2">Aadhar Verification</label>
                                    </div>
                                </div>
                                <div className="field col-3 d-flex align-items-center">
                                    <div className="d-flex mt-3">
                                        <Checkbox inputId="PVStatus" className="" name="" />
                                        <label htmlFor="PVStatus" className="ms-2">PV Status</label>
                                    </div>
                                </div>
                                <div className="field col-12 mb-3">
                                    <label>Remark</label>
                                    <InputText className="form-control" name="" placeholder="Remark" />
                                </div>
                                <div className="col-12 mb-3">
                                    <h6 className="sidebarSubTitle">Document Details</h6>
                                </div>
                                <div className="field col-3 mb-3">
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
                                <div className="field col-12 d-flex align-items-center gap-4">
                                    <div className="d-flex mt-3">
                                        <Checkbox inputId="AadharVerification" className="" name="" />
                                        <label htmlFor="AadharVerification" className="ms-2">Medical Fitness Certificate</label>
                                    </div>

                                    <div className="d-flex mt-3">
                                        <Checkbox inputId="AadharVerification" className="" name="" />
                                        <label htmlFor="AadharVerification" className="ms-2">Driver Information Display Dangler</label>
                                    </div>

                                    <div className="d-flex mt-3">
                                        <Checkbox inputId="AadharVerification" className="" name="" />
                                        <label htmlFor="AadharVerification" className="ms-2">Induction Form</label>
                                    </div>
                                </div>



                            </div>
                            {/* Fixed button container at bottom of sidebar */}
                            <div className="sidebar-fixed-bottom">
                                <div className="d-flex gap-3 justify-content-end">
                                    <Button label="Cancel" className="btn btn-outline-secondary" onClick={() => setVisibleLeft(false)} />
                                    <Button label="Save Changes" className="btn btn-success" />
                                </div>
                            </div>
                        </div>
                    </PrimeSidebar>

                    {/* Add Driver Master */}
                    <PrimeSidebar visible={addDriverMaster} position="right" onHide={() => setAddDriverMaster(false)} showCloseIcon={false} dismissable={false} style={{ width: '70%' }}>
                        <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
                            <h6 className="sidebarTitle">Add Driver Details</h6>
                            <Button icon="pi pi-times" className="p-button-rounded p-button-text" onClick={() => setAddDriverMaster(false)} />
                        </div>
                        <div className="sidebarBody">
                            <div className="row">
                                <div className="col-12 mb-3">
                                    <h6 className="sidebarSubTitle">Personal Details</h6>
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Driver ID</label>
                                    <InputText className="form-control" name="" placeholder="Driver Id" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Driver Name</label>
                                    <InputText className="form-control" name="" placeholder="Driver Name" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Date of Birth</label>
                                    <Calendar className="w-100" name="" placeholder="Date of Birth" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Contact Number</label>
                                    <InputText className="form-control" name="" placeholder="Contact Number" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Blood Group</label>
                                    <InputText className="form-control" name="" placeholder="Blood Group" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Qualification</label>
                                    <InputText className="form-control" name="" placeholder="Qualification" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Marital Status</label>
                                    <InputText className="form-control" name="" placeholder="Marital Status" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Father’s Name</label>
                                    <InputText className="form-control" name="" placeholder="Father’s Name" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Mother's Name</label>
                                    <InputText className="form-control" name="" placeholder="Mother's Name" />
                                </div>

                                <div className="field col-6 mb-3">
                                    <label>Present Address</label>
                                    <InputText className="form-control" name="" placeholder="Present Address" />
                                </div>
                                <div className="field col-6 mb-3">
                                    <label>Permanent Address</label>
                                    <InputText className="form-control" name="" placeholder="Permanent Address" />
                                </div>
                                <div className="col-12 mb-3">
                                    <h6 className="sidebarSubTitle">Vehicle Details</h6>
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Vehicle Number</label>
                                    <Dropdown optionLabel="name" placeholder="Select Vehicle Number" className="w-100" filter />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Licence Number</label>
                                    <InputText className="form-control" name="" placeholder="Licence Number" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Licence Expiry Date</label>
                                    <Calendar className="w-100" name="" placeholder="Licence Expiry Date" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Badge Number</label>
                                    <InputText className="form-control" name="" placeholder="Badge Number" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Badge Expiry Date</label>
                                    <Calendar className="w-100" name="" placeholder="Badge Expiry Date" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Driver Status</label>
                                    <Dropdown optionLabel="name" placeholder="Select Driver Status" className="w-100" filter />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Attrited Date</label>
                                    <Calendar className="w-100" name="" placeholder="Attrited Date" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Facility Name</label>
                                    <Dropdown optionLabel="name" placeholder="Select Facility Name" className="w-100" filter />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Vendor Name</label>
                                    <Dropdown optionLabel="name" placeholder="Select Vendor Name" className="w-100" filter />
                                </div>
                                {/* <div className="field col-3 mb-3">
                                    <label>Warning-1</label>
                                    <InputText className="form-control" name="" placeholder="Warning-1" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Warning-2</label>
                                    <InputText className="form-control" name="" placeholder="Warning-2" />
                                </div>
                                <div className="field col-3 mb-3">
                                    <label>Final Warning</label>
                                    <InputText className="form-control" name="" placeholder="Final Warning" />
                                </div> */}
                                <div className="field col-3 d-flex align-items-center">
                                    <div className="d-flex mt-3">
                                        <Checkbox inputId="AadharVerification" className="" name="" />
                                        <label htmlFor="AadharVerification" className="ms-2">Aadhar Verification</label>
                                    </div>
                                </div>
                                <div className="field col-3 d-flex align-items-center">
                                    <div className="d-flex mt-3">
                                        <Checkbox inputId="PVStatus" className="" name="" />
                                        <label htmlFor="PVStatus" className="ms-2">PV Status</label>
                                    </div>
                                </div>
                                <div className="field col-12 mb-3">
                                    <label>Remark</label>
                                    <InputText className="form-control" name="" placeholder="Remark" />
                                </div>
                                <div className="col-12 mb-3">
                                    <h6 className="sidebarSubTitle">Document Details</h6>
                                </div>
                                <div className="field col-3 mb-3">
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
                                <div className="field col-12 d-flex align-items-center gap-4">
                                    <div className="d-flex mt-3">
                                        <Checkbox inputId="AadharVerification" className="" name="" />
                                        <label htmlFor="AadharVerification" className="ms-2">Medical Fitness Certificate</label>
                                    </div>

                                    <div className="d-flex mt-3">
                                        <Checkbox inputId="AadharVerification" className="" name="" />
                                        <label htmlFor="AadharVerification" className="ms-2">Driver Information Display Dangler</label>
                                    </div>

                                    <div className="d-flex mt-3">
                                        <Checkbox inputId="AadharVerification" className="" name="" />
                                        <label htmlFor="AadharVerification" className="ms-2">Induction Form</label>
                                    </div>
                                </div>



                            </div>
                            {/* Fixed button container at bottom of sidebar */}
                            <div className="sidebar-fixed-bottom">
                                <div className="d-flex gap-3 justify-content-end">
                                    <Button label="Cancel" className="btn btn-outline-secondary" onClick={() => setVisibleLeft(false)} />
                                    <Button label="Save Changes" className="btn btn-success" />
                                </div>
                            </div>
                        </div>
                    </PrimeSidebar>
                </div>
            </div>
        </>
    )
}

export default DriverMaster;