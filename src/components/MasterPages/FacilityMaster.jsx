import React, { useState, useEffect } from "react";
import Sidebar from "../Master/SidebarMenu";
import Notifications from "../Master/Notifications";
// import "bootstrap/dist/css/bootstrap.min.css";
// import "bootstrap/dist/js/bootstrap.bundle.min.js";
// import "../css/style.css";
import Header from "../Master/Header";
import { apiService } from "../../services/api";
import sessionManager from "../../utils/SessionManager.js";
import { toastService } from '../../services/toastService';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from "primereact/inputtext";
import { TreeTable } from 'primereact/treetable';
import { Sidebar as PrimeSidebar } from "primereact/sidebar"; // Renamed to avoid conflict with your Sidebar component
import { Button } from "primereact/button";

const FacilityMaster = () => {
    const [addFacility, setAddFacility] = useState(false);
    const [facilityData, setFacilityData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const [newFacility, setNewFacility] = useState("");
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [location, setLocationData] = useState([]);
    const [facilityContactData, setFacilityContactData] = useState([]);
    const [facContactLocation, setfacContactLocation] = useState([]);
    const [expandedRows, setExpandedRows] = useState([]);

    const countryBodyTemplate = (rowData) => {
        return (
            <div className="flex align-items-center gap-2">
                <img alt={rowData.country.name} src="https://primefaces.org/cdn/primereact/images/flag/flag_placeholder.png" className={`flag flag-${rowData.country.code}`} style={{ width: '24px' }} />
                <span>{rowData.country.name}</span>
            </div>
        );
    };

    const headerTemplate = (data) => {
        return (
            <React.Fragment>
                <img alt={rowData.facilityName} src={`https://primefaces.org/cdn/primereact/images/avatar/${data.representative.image}`} width="32" style={{ verticalAlign: 'middle' }} className="ms-2" />
                <span className="vertical-align-middle ml-2 font-bold line-height-3">{rowData.facilityName}</span>
            </React.Fragment>
        );
    };

    useEffect(() => {
        fetchFacilityData();
        BindFacilityContactList();
        BindLocationList();
        BindFacilityContactLevelList();
    }, []);

    const BindFacilityContactLevelList = async () => {
        try {
            const response = await apiService.GetFacility({
                locationid: 0,
            });

            setfacContactLocation(response);
        }
        catch (error) {
            console.error("Error fetching locationlist:", error);
        }
    };

    const BindLocationList = async () => {
        try {
            const response = await apiService.SelectLocation({
                Userid: 0,
            });

            setLocationData(response);
        }
        catch (error) {
            console.error("Error fetching locationlist:", error);
        }
    };

    const BindFacilityContactList = async () => {
        try {
            const response = await apiService.GetLevelDetail({
                locationid: 0,//sessionManager.getUserSession().locationId,
            });
            setFacilityContactData(response);
        }
        catch (error) {
            console.error("Error fetching locationlist:", error);
        }
    };



    const fetchFacilityData = async () => {
        try {
            setLoading(true);
            console.log(sessionManager.getUserSession());

            if (sessionManager.getUserSession().ISadmin === "Y") {
                const response = await apiService.SelectAllFacility({
                });
                console.log(response);
                setFacilityData(response);
            }
            else {
                const response = await apiService.SelectFacility({
                    Userid: sessionManager.getUserSession().Userid,
                });
                console.log(response);
                setFacilityData(response);
            }


        } catch (error) {
            console.error("Error fetching facilities:", error);
            setFacilityData([]);
            toastService.error("Error fetching facilities");
        } finally {
            setLoading(false);
        }
    };

    const handleNewFacility = () => {
        setShowOffcanvas(true);
    };

    const handleSaveFacility = async () => {
        if (document.getElementById('txtfacilityName').value.trim() === '') {
            toastService.warn('Please Enter Facility Name');
            return;
        }
        else if (document.getElementById('ddlLocation').value === '0') {
            toastService.warn('Please Select Location');
            return;
        }

        const locationSelect = document.getElementById('ddlLocation');
        const selectedLocationText = locationSelect.options[locationSelect.selectedIndex].text;

        try {
            setLoading(true);
            const apiresponse = await apiService.InsertFacility({
                facility: document.getElementById('txtfacilityName').value.trim(),
                geoX: 0,
                geoY: 0,
                tptEmail: document.getElementById('txtHelpdeskemail').value.trim(),
                tptContactNo: document.getElementById('txtContactNo').value.trim(),
                locationId: locationSelect.value,
                locationName: selectedLocationText,
                ShiftInchargeMail: document.getElementById('txtTeamLeademail').value.trim(),
                SiteLeadMail: document.getElementById('txtManageremail').value.trim(),
                CityLeadMail: document.getElementById('txtSiteLeadEmail').value.trim(),
            });

            if (apiresponse[0].result === 1) {
                toastService.success('Data Saved Successfully');
                // Clear all form fields
                document.getElementById('txtfacilityName').value = '';
                document.getElementById('txtContactNo').value = '';
                document.getElementById('ddlLocation').value = '0';
                document.getElementById('txtHelpdeskemail').value = '';
                document.getElementById('txtTeamLeademail').value = '';
                document.getElementById('txtManageremail').value = '';
                document.getElementById('txtSiteLeadEmail').value = '';
                setNewFacility('');
                setShowOffcanvas(false);

                const offcanvasElement = document.getElementById('raise_Feedback');
                const closeButton = offcanvasElement.querySelector('[data-bs-dismiss="offcanvas"]');
                if (closeButton) {
                    closeButton.click();
                }

                await fetchFacilityData();
            } else {
                toastService.warn('Facility Name Already Exists');
            }
        } catch (error) {
            console.error("Error saving facility:", error);
            toastService.error("Error saving facility");
        } finally {
            setLoading(false);
        }
    };

    const fetchFacilityForEdit = async (facilityName, facilityId, tptContactNo, locationId, tptEmail, ShiftInchargeMail, SiteLeadMail, LocLeadMail) => {
        try {
            setSelectedFacility({
                facilityName: facilityName,
                Id: facilityId,
                tptContactNo: tptContactNo,
                locationId: locationId,
                tptEmail: tptEmail,
                ShiftInchargeMail: ShiftInchargeMail,
                SiteLeadMail: SiteLeadMail,
                LocLeadMail: LocLeadMail
            });
        } catch (error) {
            console.error("Error setting facility for edit:", error);
            toastService.error("Error loading facility for edit");
        }
    };

    const handleEditFacility = async () => {
        if (!selectedFacility || !selectedFacility.facilityName.trim()) {
            toastService.warn('Please Enter Valid Facility Name');
            return;
        }
        else if (document.getElementById('ddleditLocation').value === '0') {
            toastService.warn('Please Select Location');
            return;
        }

        try {
            setLoading(true);
            const locationSelect = document.getElementById('ddleditLocation');
            const selectedLocationText = locationSelect.options[locationSelect.selectedIndex].text;

            const response = await apiService.UpdateFacility({
                facility: selectedFacility.facilityName,
                geoX: 0,
                geoY: 0,
                tptEmail: selectedFacility.tptEmail,
                tptContactNo: selectedFacility.tptContactNo,
                Id: selectedFacility.Id,
                locationId: selectedFacility.locationId,
                locationName: selectedLocationText,
                ShiftInchargeMail: selectedFacility.ShiftInchargeMail,
                SiteLeadMail: selectedFacility.SiteLeadMail,
                CityLeadMail: selectedFacility.LocLeadMail,
            });

            if (response[0].result === 1) {
                toastService.success('Facility Updated Successfully');
                // Close the offcanvas using data-bs-dismiss
                const offcanvasElement = document.getElementById('FacilityEdit');
                const closeButton = offcanvasElement.querySelector('[data-bs-dismiss="offcanvas"]');
                if (closeButton) {
                    closeButton.click();
                }
                await fetchFacilityData();
            } else {
                toastService.warn('Facility Name Already Exists');
            }
        } catch (error) {
            console.error("Error updating facility:", error);
            toastService.error("Error updating facility");
        } finally {
            setLoading(false);
        }
    };

    const handleContactSave = async () => {
        try {
            setLoading(true);
            if (document.getElementById('ddlContactLocation').value === '0') {
                toastService.warn('Please Select Location');
                return;
            }
            else if (document.getElementById('ddlLevel').value === '0') {
                toastService.warn('Please Select Level');
                return;
            }
            else if (document.getElementById('txtContactName').value.trim() === '') {
                toastService.warn('Please Enter Contact Name');
                return;
            }

            const response = await apiService.AddLevelDetails({
                ContactName: document.getElementById('txtContactName').value.trim(),
                ContactNo: document.getElementById('txtLevelContactNo').value.trim(),
                Email: document.getElementById('txtContactEmail').value.trim(),
                LocationId: document.getElementById('ddlContactLocation').value,
                Level: document.getElementById('ddlLevel').value,
            });

            if (response[0].result === 1) {
                toastService.success('Data Saved Successfully');

            } else {
                toastService.success('Data Updated Successfully');
            }

            // Close the offcanvas using data-bs-dismiss
            const offcanvasElement = document.getElementById('AddFacilityContact');
            const closeButton = offcanvasElement.querySelector('[data-bs-dismiss="offcanvas"]');
            if (closeButton) {
                closeButton.click();
            }
            await BindFacilityContactList();
            document.getElementById('txtContactName').value = '';
            document.getElementById('ddlContactLocation').value = '0';
            document.getElementById('txtContactEmail').value = '';
            document.getElementById('txtLevelContactNo').value = '';
            document.getElementById('ddlLevel').value = '0';
        }
        catch (error) {
            console.error("Error updating facility Contact details:", error);
            toastService.error("Error updating facility Contact details");
        }
        finally {
            setLoading(false);
        }

        // Open sidebar with employee data
        const openEditSidebar = (guardData) => {
            setAddFacility(guardData); // Set the selected guard data
            setVisibleLeft(true); // Open sidebar
            console.log("Selected Guard Details -->", guardData);
        };
    };

    const handleNewButtonClick = () => {
        setShowOffcanvas(true);
    };
    return (
        <div className="container-fluid p-0">
            <Header pageTitle={"Facility Master"} showNewButton={true} onNewButtonClick={handleNewButtonClick} />
            <Sidebar />

            <div className="middle">
                <div className="row">
                    <div className="col-12">
                        <h6 className="pageTitle">Facility Master</h6>
                    </div>
                    <div className="col-12">

                    </div>
                    <div className="col-lg-12">
                        <div className="card_tb text-center">
                            {/* <DataTable value={facilityData} loading={loading}>
                                <Column field="facilityName" header="Facility Name" body={(rowData) => (
                                    <a
                                        href="#!"
                                        className="btn-text text-decoration-none"
                                        data-bs-toggle="offcanvas"
                                        data-bs-target="#FacilityEdit"
                                        aria-controls="offcanvasRight"
                                        onClick={() =>
                                            fetchFacilityForEdit(facility.facilityName, facility.Id, facility.tptContactNo, facility.locationId, facility.tptEmail, facility.ShiftInchargeMail, facility.SiteLeadMail, facility.LocLeadMail)
                                        }
                                    >
                                        {rowData.facilityName}
                                    </a>
                                )}
                                ></Column>
                                <Column field="tptContactNo" header="Helpdesk Contact No"></Column>
                                <Column field="locationName" header="Location"></Column>
                                <Column field="tptEmail" header="Helpdesk Email"></Column>
                                <Column field="ShiftInchargeMail" header="Team Lead Email [SEV1]"></Column>
                                <Column field="SiteLeadMail" header="Manager Email [SEV2]"></Column>
                                <Column field="LocLeadMail" header="Site Lead Email [SEV3]"></Column>
                            </DataTable> */}
                            <div className="table-responsive">
                                <table className="table mb-0" id="tbFacility">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="text-center" style={{ minWidth: '100px' }}>Facility Name</th>
                                            <th className="text-center" style={{ minWidth: '100px' }}>Geo Code</th>
                                            <th className="text-center" style={{ minWidth: '100px' }}>Location</th>
                                            <th className="text-center" style={{ minWidth: '100px' }}>Helpdesk Contact No</th>
                                            <th className="text-center" style={{ minWidth: '150px' }}>Helpdesk Email</th>
                                            <th className="text-center" style={{ minWidth: '150px' }}>Team Lead Email [SEV1]</th>
                                            <th className="text-center" style={{ minWidth: '150px' }}>Manager Email [SEV2]</th>
                                            <th className="text-center" style={{ minWidth: '150px' }}>Site Lead Email [SEV3]</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {facilityData.map((facility, index) => (
                                            <React.Fragment key={index}>
                                                <tr>
                                                    <td className="text-center">
                                                        <a
                                                            href="#!"
                                                            className="btn-text text-decoration-none"
                                                            data-bs-toggle="offcanvas"
                                                            data-bs-target="#FacilityEdit"
                                                            aria-controls="offcanvasRight"
                                                            onClick={() =>
                                                                fetchFacilityForEdit(facility.facilityName, facility.Id, facility.tptContactNo, facility.locationId, facility.tptEmail, facility.ShiftInchargeMail, facility.SiteLeadMail, facility.LocLeadMail)
                                                            }
                                                        >
                                                            {facility.facilityName}
                                                        </a>
                                                    </td>
                                                    <td className="text-center"> <a href="#!"
                                                        data-bs-toggle="offcanvas"
                                                        data-bs-target="#LocationMap"
                                                        aria-controls="offcanvasRight">{`${facility.geoX} : ${facility.geoY}`}</a> </td>
                                                    <td className="text-center">{facility.locationName}</td>
                                                    <td className="text-center">{facility.tptContactNo}</td>
                                                    <td className="text-center">{facility.tptEmail}</td>
                                                    <td className="text-center">{facility.ShiftInchargeMail}</td>
                                                    <td className="text-center">{facility.SiteLeadMail}</td>
                                                    <td className="text-center">{facility.LocLeadMail}</td>
                                                    <td>
                                                        <a
                                                            href="#!"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                const newExpandedRows = [...expandedRows];
                                                                const rowIndex = newExpandedRows.indexOf(index);
                                                                if (rowIndex > -1) {
                                                                    newExpandedRows.splice(rowIndex, 1);
                                                                } else {
                                                                    newExpandedRows.push(index);
                                                                }
                                                                setExpandedRows(newExpandedRows);
                                                            }}
                                                        >
                                                            {expandedRows.includes(index) ? <span className="material-icons">remove_circle</span> : <span className="material-icons">add_circle</span>}
                                                        </a>
                                                    </td>
                                                </tr>

                                                {expandedRows.includes(index) && (
                                                    <tr>
                                                        <td colSpan="9" className="leftStrip">
                                                            <div className="expanded-content">
                                                                <div className="table-responsive">
                                                                    <DataTable value={facilityContactData} loading={loading}>
                                                                        <Column field="locationName" header="Location" body={(rowData) => (
                                                                            <a
                                                                                href="#!"
                                                                                className="btn-text text-decoration-none"
                                                                                data-bs-toggle="offcanvas"
                                                                                data-bs-target="#editSubLevel"
                                                                                aria-controls="offcanvasRight"
                                                                                onClick={() => {
                                                                                    // Set values to form fields when clicked
                                                                                    setTimeout(() => {
                                                                                        document.getElementById('ddlManagerLocation').value = rowData.locationName || '';
                                                                                        document.getElementById('ddlManagerLevel').value = rowData.Level || '';
                                                                                        document.getElementById('txtManagerName').value = rowData.ContactName || '';
                                                                                        document.getElementById('txtManagerContactNo').value = rowData.ContactNo || '';
                                                                                        document.getElementById('txtManagerEmail').value = rowData.Email || '';
                                                                                    }, 100);
                                                                                }}
                                                                            >
                                                                                {rowData.locationName}
                                                                            </a>
                                                                        )}></Column>
                                                                        <Column field="Level" header="Level"></Column>
                                                                        <Column field="ContactName" header="Name"></Column>
                                                                        <Column field="ContactNo" header="Contact No"></Column>
                                                                        <Column field="Email" header="Email"></Column>
                                                                    </DataTable>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-lg-12">
                        <div className="card_tb">
                            <div className="d-flex p-3 align-items-center">
                                <InputText placeholder="Search Any Value" />

                                <a href="#!" className="ms-auto me-2" data-bs-toggle="offcanvas" data-bs-target="#AddFacilityContact" aria-controls="offcanvasRight">
                                    <span className="material-icons">add_circle</span>
                                </a>
                            </div>
                            <div className="table-responsive">
                                <DataTable value={facilityContactData} loading={loading} style={{ display: "none" }}>
                                    <Column field="locationName" header="Location"></Column>
                                    <Column field="Level" header="Level"></Column>
                                    <Column field="ContactName" header="Name"></Column>
                                    <Column field="ContactNo" header="Contact No"></Column>
                                    <Column field="Email" header="Email"></Column>
                                </DataTable>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Add New Facility */}
            <PrimeSidebar visible={addFacility} position="right" onHide={() => setAddFacility(false)} showCloseIcon={false} dismissable={false} style={{ width: '40%' }}>
                <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
                    <h6 className="sidebarTitle">Add Facility</h6>
                    <Button icon="pi pi-times" className="p-button-rounded p-button-text" onClick={() => setAddFacility(false)} />
                </div>
                <div className="sidebarBody">
                    1
                </div>
            </PrimeSidebar>

            {/* Offcanvas Component */}
            <div
                tabIndex="-1"
                className={`offcanvas offcanvas-end${showOffcanvas ? ' show' : ''}`}
                id="raise_Feedback"
                aria-labelledby="offcanvasRightLabel" style={{ width: '40%' }}>
                <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
                    <h5 className="subtitle fw-normal">Add New Facility</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowOffcanvas(false)} data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>
                <div className="offcanvas-body">
                    <div className="row">
                        <div className="col-6 mb-3">
                            <label htmlFor="facilityName" className="form-label">Facility Name <span>*</span></label>
                            <input
                                type="text"
                                className="form-control"
                                id="txtfacilityName"
                                value={newFacility}
                                onChange={(e) => setNewFacility(e.target.value)}
                                placeholder="Enter facility name"
                            />
                        </div>
                        <div className="col-6 mb-3">
                            <label htmlFor="ContactNo" className="form-label">Contact No</label>
                            <input
                                type="number"
                                className="form-control"
                                id="txtContactNo"
                                placeholder="Enter Contact No"
                            />
                        </div>
                        <div className="col-6 mb-3">
                            <label htmlFor="Location" className="form-label">Location <span>*</span></label>
                            <select
                                className="form-control"
                                id="ddlLocation"
                                placeholder="Enter Location"
                            >
                                <option value="0">Select Location</option>
                                {location.map((loc, index) => (
                                    <option key={index} value={loc.Id}>{loc.locationName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-6 mb-3">
                            <label htmlFor="HelpdeskEmail" className="form-label">Add New Location</label>
                            <input
                                type="email"
                                className="form-control"
                                id="txtHelpdeskemail"
                                placeholder="Enter Help desk Email"
                            />
                        </div>
                        <div className="col-6 mb-3">
                            <label htmlFor="HelpdeskEmail" className="form-label">Helpdesk Email</label>
                            <input
                                type="email"
                                className="form-control"
                                id="txtHelpdeskemail"
                                placeholder="Enter Help desk Email"
                            />
                        </div>
                        <div className="col-6 mb-3">
                            <label htmlFor="TeamLeadEmail" className="form-label">Team Lead Email</label>
                            <input
                                type="email"
                                className="form-control"
                                id="txtTeamLeademail"
                                placeholder="Enter Team Lead Email"
                            />
                        </div>
                        <div className="col-6 mb-3">
                            <label htmlFor="ManagerEmail" className="form-label">Manager Email</label>
                            <input
                                type="email"
                                className="form-control"
                                id="txtManageremail"
                                placeholder="Enter Manager Email"
                            />
                        </div>
                        <div className="col-6 mb-3">
                            <label htmlFor="SiteLeadEmail" className="form-label">Site Lead Email</label>
                            <input
                                type="email"
                                className="form-control"
                                id="txtSiteLeadEmail"
                                placeholder="Enter Site Lead Email"
                            />
                        </div>
                        <div className="col-6 mb-3">
                            <label className="form-label">Location geoX</label>
                            <input type="text" className="form-control" placeholder="Location geoX" />
                        </div>
                        <div className="col-6 mb-3">
                            <label className="form-label">Location geoY</label>
                            <input type="text" className="form-control" placeholder="Location geoY" />
                        </div>
                    </div>
                </div>
                <div className="offcanvas-footer">
                    <button className="btn btn-outline-secondary" data-bs-dismiss="offcanvas" aria-label="Close" onClick={() => setShowOffcanvas(false)}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-success mx-3"
                        onClick={handleSaveFacility}>
                        Save
                    </button>
                </div>
            </div>

            {/* Edit Facility Offcanvas */}
            <div
                className="offcanvas offcanvas-end"
                tabIndex="-1"
                id="FacilityEdit"
                aria-labelledby="offcanvasRightLabel"
                style={{ width: '40%' }}
            >
                <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
                    <h5 className="subtitle fw-normal">Edit Facility</h5>
                    <button
                        type="button"
                        className="btn-close btn-close-white"
                        data-bs-dismiss="offcanvas"
                        aria-label="Close"
                        data-bs-show="true"
                    ></button>
                </div>
                <div className="offcanvas-body">
                    {selectedFacility && (
                        <div className="row">
                            <div className="col-6 mb-3">
                                <label htmlFor="editFacilityName" className="form-label">Facility Name <span>*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="editFacilityName"
                                    value={selectedFacility.facilityName}
                                    onChange={(e) => setSelectedFacility({ ...selectedFacility, facilityName: e.target.value })}
                                />
                            </div>
                            <div className="col-6 mb-3">
                                <label htmlFor="ContactNo" className="form-label">Contact No</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="txteditContactNo"
                                    value={selectedFacility.tptContactNo}
                                    onChange={(e) => setSelectedFacility({ ...selectedFacility, tptContactNo: e.target.value })}
                                />
                            </div>
                            <div className="col-6 mb-3">
                                <label htmlFor="Location" className="form-label">Location <span>*</span></label>
                                <select
                                    className="form-control"
                                    id="ddleditLocation"
                                    value={selectedFacility.locationId}
                                    onChange={(e) => setSelectedFacility({
                                        ...selectedFacility,
                                        locationId: e.target.value
                                    })}
                                >
                                    <option value="0">Select Location</option>
                                    {location.map((loc, index) => (
                                        <option key={index} value={loc.Id}>{loc.locationName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-6 mb-3">
                                <label htmlFor="HelpdeskEmail" className="form-label">Helpdesk Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="txteditHelpdeskemail"
                                    placeholder="Enter Help desk Email"
                                    value={selectedFacility.tptEmail}
                                    onChange={(e) => setSelectedFacility({ ...selectedFacility, tptEmail: e.target.value })}
                                />
                            </div>
                            <div className="col-6 mb-3">
                                <label htmlFor="TeamLeadEmail" className="form-label">Team Lead Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="txteditTeamLeademail"
                                    placeholder="Enter Team Lead Email"
                                    value={selectedFacility.ShiftInchargeMail}
                                    onChange={(e) => setSelectedFacility({ ...selectedFacility, ShiftInchargeMail: e.target.value })}
                                />
                            </div>
                            <div className="col-6 mb-3">
                                <label htmlFor="ManagerEmail" className="form-label">Manager Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="txteditManageremail"
                                    placeholder="Enter Manager Email"
                                    value={selectedFacility.SiteLeadMail}
                                    onChange={(e) => setSelectedFacility({ ...selectedFacility, SiteLeadMail: e.target.value })}
                                />
                            </div>
                            <div className="col-6 mb-3">
                                <label htmlFor="SiteLeadEmail" className="form-label">Site Lead Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="txteditSiteLeadEmail"
                                    placeholder="Enter Site Lead Email"
                                    value={selectedFacility.LocLeadMail}
                                    onChange={(e) => setSelectedFacility({ ...selectedFacility, LocLeadMail: e.target.value })}
                                />
                            </div>
                            <div className="col-6 mb-3">
                                <label className="form-label">Location geoX</label>
                                <input type="text" className="form-control" value="285.00325" />
                            </div>
                            <div className="col-6 mb-3">
                                <label className="form-label">Location geoY</label>
                                <input type="text" className="form-control" value="582.00325" />
                            </div>
                        </div>
                    )}
                </div>
                <div className="offcanvas-footer">
                    <button className="btn btn-outline-secondary" data-bs-dismiss="offcanvas">
                        Cancel
                    </button>
                    <button
                        className="btn btn-success mx-3"
                        onClick={handleEditFacility}>
                        Save
                    </button>
                </div>
            </div>




            {/* Offcanvas Component for Facility Contact Level*/}
            <div
                tabIndex="-1"
                className="offcanvas offcanvas-end"
                id="AddFacilityContact"
                aria-labelledby="offcanvasRightLabel">
                <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
                    <h5 className="subtitle fw-normal">Add New Contact Level</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowOffcanvas(false)} data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>
                <div className="offcanvas-body">
                    <div className="mb-3">
                        <label htmlFor="Location" className="form-label">Location <span>*</span></label>
                        <select
                            className="form-control"
                            id="ddlContactLocation"
                            placeholder="Enter Location"
                        >
                            <option value="0">Select Location</option>
                            {facContactLocation.map((loc, index) => (
                                <option key={index} value={loc.Id}>{loc.FullName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="Level" className="form-label">Level <span>*</span></label>
                        <select
                            className="form-control"
                            id="ddlLevel"
                            placeholder="Enter Location"
                        >
                            <option value="0">Select Level</option>
                            <option value="level 1">level 1</option>
                            <option value="level 2">level 2</option>
                            <option value="level 3">level 3</option>
                            <option value="level 4">level 4</option>
                            <option value="level 5">level 5</option>
                            <option value="level 6">level 6</option>
                            <option value="level 7">level 7</option>
                            <option value="level 8">level 8</option>
                            <option value="level 9">level 9</option>
                            <option value="level 10">level 10</option>
                        </select>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="ContactName" className="form-label">Name <span>*</span></label>
                        <input
                            type="text"
                            className="form-control"
                            id="txtContactName"
                            placeholder="Enter Contact Name"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="ContactNo" className="form-label">Contact No</label>
                        <input
                            type="number"
                            className="form-control"
                            id="txtLevelContactNo"
                            placeholder="Enter Contact No"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="ContactEmail" className="form-label">Email <span>*</span></label>
                        <input
                            type="email"
                            className="form-control"
                            id="txtContactEmail"
                            placeholder="Enter Email"
                        />
                    </div>

                </div>
                <div className="offcanvas-footer">
                    <button className="btn btn-outline-secondary" data-bs-dismiss="offcanvas">
                        Cancel
                    </button>
                    <button
                        className="btn btn-success mx-3"
                        onClick={handleContactSave}>
                        Save
                    </button>
                </div>
            </div>

            {/* Location Map */}
            <div
                className="offcanvas offcanvas-end"
                tabIndex="-1"
                id="LocationMap"
                aria-labelledby="offcanvasRightLabel"
                style={{ width: '50%' }}
            >
                <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
                    <h5 className="subtitle fw-normal">Location Map</h5>
                    <button
                        type="button"
                        className="btn-close btn-close-white"
                        data-bs-dismiss="offcanvas"
                        aria-label="Close"
                        data-bs-show="true"
                    ></button>
                </div>
                <div className="offcanvas-body">
                    <iframe
                        id="facilityMapIframe"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3507.566981326748!2d77.08477762601186!3d28.462466941782356!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d18db2555f1df%3A0xccacb888e56ca6c4!2sSupermart-1%2C%20DLF%20Phase%20IV%2C%20Gurugram%2C%20Haryana%20122022!5e0!3m2!1sen!2sin!4v1745579796798!5m2!1sen!2sin"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Facility Location Map"
                    ></iframe>
                </div>
                <div className="offcanvas-footer">
                    <div className="d-flex align-items-center p-3 w-100">
                        <InputText
                            type="text"
                            className="form-control me-2"
                            placeholder="Latitude"
                            id="txtLatitude"
                            defaultValue="28.4624669"
                        />
                        <InputText
                            type="text"
                            className="form-control me-2"
                            placeholder="Longitude"
                            id="txtLongitude"
                            defaultValue="77.0847776"
                        />
                        <button className="btn btn-primary d-flex align-items-center py-2">
                            <i className="pi pi-map-marker me-1"></i>
                            <span>Update</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Manager Offcanvas */}
            <div
                className="offcanvas offcanvas-end"
                tabIndex="-1"
                id="editSubLevel"
                aria-labelledby="offcanvasRightLabel"
                style={{ width: '30%' }}
            >
                <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
                    <h5 className="subtitle fw-normal">GGN</h5>
                    <button
                        type="button"
                        className="btn-close btn-close-white"
                        data-bs-dismiss="offcanvas"
                        aria-label="Close"
                        data-bs-show="true"
                    ></button>
                </div>
                <div className="offcanvas-body">
                    <div className="mb-3">
                        <label htmlFor="Location" className="form-label">Location <span>*</span></label>
                        <input
                            type="text"
                            className="form-control"
                            id="ddlManagerLocation"
                            placeholder="Enter Location"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="Level" className="form-label">Level <span>*</span></label>
                        <input
                            type="text"
                            className="form-control"
                            id="ddlManagerLevel"
                            placeholder="Enter Level"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="ManagerName" className="form-label">Name <span>*</span></label>
                        <input
                            type="text"
                            className="form-control"
                            id="txtManagerName"
                            placeholder="Enter Manager Name"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="ManagerContactNo" className="form-label">Contact No</label>
                        <input
                            type="text"
                            className="form-control"
                            id="txtManagerContactNo"
                            placeholder="Enter Contact No"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="ManagerEmail" className="form-label">Email <span>*</span></label>
                        <input
                            type="email"
                            className="form-control"
                            id="txtManagerEmail"
                            placeholder="Enter Email"
                        />
                    </div>
                </div>
                <div className="offcanvas-footer">
                    <button className="btn btn-outline-secondary" data-bs-dismiss="offcanvas">
                        Cancel
                    </button>
                    <button
                        className="btn btn-success mx-3"
                        onClick={() => {
                            // Handle manager save logic here
                            const locationName = document.getElementById('ddlManagerLocation').value;
                            const level = document.getElementById('ddlManagerLevel').value;
                            const name = document.getElementById('txtManagerName').value;
                            const contactNo = document.getElementById('txtManagerContactNo').value;
                            const email = document.getElementById('txtManagerEmail').value;
                            const contactId = document.getElementById('editSubLevel').getAttribute('data-contact-id') || '0';

                            // Find the location ID based on location name
                            const locationObj = facContactLocation.find(loc => loc.FullName === locationName);
                            const locationId = locationObj ? locationObj.Id : 0;

                            // Validate inputs
                            if (!name.trim()) {
                                toastService.warn('Please Enter Contact Name');
                                return;
                            }

                            // Call API to update the contact level
                            apiService.AddLevelDetails({
                                Id: contactId,
                                ContactName: name,
                                ContactNo: contactNo,
                                Email: email,
                                LocationId: locationId,
                                Level: level,
                            }).then(response => {
                                if (response && response.length > 0 && response[0].result === 1) {
                                    toastService.success('Data Updated Successfully');
                                    // Close the offcanvas
                                    const offcanvasElement = document.getElementById('editSubLevel');
                                    const closeButton = offcanvasElement.querySelector('[data-bs-dismiss="offcanvas"]');
                                    if (closeButton) {
                                        closeButton.click();
                                    }
                                    // Refresh the contact list
                                    BindFacilityContactList();
                                } else {
                                    toastService.error('Failed to update contact details');
                                }
                            }).catch(error => {
                                console.error("Error updating contact details:", error);
                                toastService.error("Error updating contact details");
                            });
                        }}>
                        Save
                    </button>
                </div>
            </div>


            {/* Backdrop */}
            {showOffcanvas && (
                <div
                    className="offcanvas-backdrop show"
                    onClick={() => setShowOffcanvas(false)}
                ></div>
            )}
        </div>
    );
};

export default FacilityMaster;