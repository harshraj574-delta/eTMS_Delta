import React, { useState, useEffect } from 'react';
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import sessionManager from "../utils/SessionManager.js";
import { apiService } from "../services/api";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Sidebar as PrimeSidebar } from "primereact/sidebar"; // Renamed to avoid conflict with your Sidebar component
import { Col } from 'react-bootstrap';
import { toastService } from "../services/toastService";
import { InputNumber } from 'primereact/inputnumber';

const VehicleTypeMaster = () => {
    const [selectedVendor, setSelectedVendor] = useState(0);
    const [VendorList, setVendorList] = useState([]);
    const [visibleLeft, setVisibleLeft] = useState(false);
    const [selectedActive, setSelectedActive] = useState(null);
    const [VehicleTypeList, setVehicleTypeList] = useState([]);
    const [selectedVehicletype, setSelectedVehicletype] = useState(null);
    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const [selectedFacility, setSelectedfacility] = useState(null);
    // const [selectedFacilityAdd, setSelectedfacilityAdd] = useState(null);
    const [facilityList, setfacilityList] = useState([]);
    const [EditVendorScheme, setEditVendorScheme] = useState(null);
    const [vehicleType, setVehicleType] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // const userFacilityId = sessionManager.getUserSession().FacilityID;
    // const userFacility = facilityList.find(f => f.Id === userFacilityId);
    // Update the useEffect to properly initialize newVendor
    useEffect(() => {
        BindFacilityDDL();
        //BindFacilityDDLAdd();
        const currentFacilityId = sessionManager.getUserSession().FacilityID;
        setSelectedfacility(currentFacilityId);
        BindVendorDropdownlist(currentFacilityId);
        BindVehicleTypeList(0, currentFacilityId);
    }, []);

    // Open sidebar with employee data
    const openEditSidebar = () => {
        setVisibleLeft(true); // Open sidebar
    };

    //Bind Edit Vendor Scheme on Vendor Change
    const BindEditVendorScheme = async (vendorId) => {
        try {
            const response = await apiService.GetSelectedVendor({
                vendorid: vendorId,
            });
            // Update the selectedVehicletype with the new scheme
            setSelectedVehicletype(prev => ({
                ...prev,
                vendorType: response[0].vendorType
            }));
        } catch (error) {
            console.error("Error fetching Scheme:", error);
        }
    };
    //Bind facility dropdown List from API
    const BindFacilityDDL = async () => {

        try {
            const response = await apiService.SelectFacility({
                Userid: sessionManager.getUserSession().ID,
            });
            //console.log("FacilityData",response);
            setfacilityList(response);
            const userFacilityId = sessionManager.getUserSession().FacilityID;
            if (response && response.some(f => f.Id === userFacilityId)) {
                setSelectedfacility(userFacilityId);
                //BindVendorGrid(userFacilityId);
            } else if (response && response.length > 0) {
                setSelectedfacility(response[0].Id);
                //BindVendorGrid(response[0].Id);
            }
            // setfacilityListNew(response);
        }
        catch (error) {
            console.error("Error fetching locationlist:", error);
        }
    };
    // const BindFacilityDDLAdd = async () => {

    //     try {
    //         const response = await apiService.SelectFacility({
    //             Userid: sessionManager.getUserSession().ID,
    //         });
    //         //console.log("FacilityData",response);
    //         setfacilityListAdd(response);
    //         // const userFacilityId = sessionManager.getUserSession().FacilityID;
    //         // if (response && response.some(f => f.Id === userFacilityId)) {
    //         //     setSelectedfacility(userFacilityId);
    //         //     //BindVendorGrid(userFacilityId);
    //         // } else if (response && response.length > 0) {
    //         //     setSelectedfacility(response[0].Id);
    //         //     //BindVendorGrid(response[0].Id);

    //         // }
    //         // setfacilityListNew(response);
    //     }
    //     catch (error) {
    //         console.error("Error fetching locationlist:", error);
    //     }
    // };

    const BindVendorDropdownlist = async (facilityid) => {
        try {
            const response = await apiService.GetVendorByFacility({
                facilityid: facilityid,
            })
            //console.log("VendorData",selectedFacility);
            setVendorList(response);
        }
        catch (error) {
            console.error("Error fetching locationlist:", error);
        }
    };

    const handleVendorChange = async (e) => {
        setSelectedVendor(e.value);
        setIsSubmitting(true);
        await BindVehicleTypeList(e.value, selectedFacility);
        setIsSubmitting(false);
    };

    const BindVehicleTypeList = async (vendorid, facilityid) => {
        try {
            const response = await apiService.SelectVehicleTypeFacility({
                vendorid: vendorid,
                facilityid: facilityid,
            })
            //console.log("VehicleTypeData",response);
            setVehicleTypeList(response);
        }
        catch (error) {
            console.error("Error fetching locationlist:", error);
        }
    }

    // Bind GridView
    const handleVehicleType = (rowData) => {
        setSelectedVehicletype(rowData);
    };

    const handleSaveVehicleType = async () => {
        setIsSubmitting(true);
        try {
            // Validate vehicle type object exists
            if (!selectedVehicletype) {
                toastService.warn('Please select a vehicle type to update.');
                return;
            }

            // Validate required fields
            if (!selectedVehicletype.vehicle?.trim()) {
                toastService.warn('Please enter vehicle type');
                return;
            }

            if (!selectedVehicletype.vendorId) {
                toastService.warn('Please select vendor');
                return;
            }
            //const userFacilityId = sessionManager.getUserSession().FacilityID;

            // Prepare request payload
            const vehicleTypeData = {
                vehicle: selectedVehicletype.vehicle.trim(),
                cost_ac: selectedVehicletype.cost_ac || '',
                cost_nonac: selectedVehicletype.cost_nonac || '',
                occupancy: selectedVehicletype.occupancy || '',
                vendorId: selectedVehicletype.vendorId,
                updatedBy: sessionManager.getUserSession().ID,
                scheme: selectedVehicletype.vendorType, // Changed from scheme to vendorType
               // facilityId: userFacilityId, // <-- Always user's facility

            };

            // Call API to insert vehicle type - using the correct method name
            const response = await apiService.InsertVehicleType(vehicleTypeData);

            // Handle API response
            if (!response || !response[0]) {
                throw new Error('Invalid API response');
            }

            switch (response[0].result) {
                case 1:
                    toastService.success('Vehicle type saved successfully.');
                    await BindVehicleTypeList(selectedVendor, selectedFacility);
                    setVehicleType(false);
                    setSelectedVehicletype(null); // Reset form after successful save
                    break;
                case 0:
                    toastService.warn('Vehicle type already exists.');
                    break;
                default:
                    throw new Error('Unknown response code');
            }

        } catch (error) {
            console.error('Error in handleSaveVehicleType:', error);
            toastService.error('Error saving vehicle type: ' + (error.message || 'Unknown error'));
        }
        finally {
            setIsSubmitting(false);
        }

    };


    const handleUpdateVehicleType = async () => {
        setIsSubmitting(true);
        try {
            if (!selectedVehicletype) {
                toastService.warn('Please select a vehicle type to update.');
                setIsSubmitting(false);
                return;
            }
            else if (selectedVehicletype.vehicle == "") {
                toastService.warn('Please enter vehicle type');
                setIsSubmitting(false);
                return;
            }
            else if (selectedVehicletype.vendorId == "") {
                toastService.warn('Please select vendor');
                setIsSubmitting(false);
                return;
            }

            const response = await apiService.UpdateVehicleType({
                Id: selectedVehicletype.Id,
                vehicle: selectedVehicletype.vehicle,
                occupancy: selectedVehicletype.occupancy,
                vendorId: selectedVehicletype.vendorId,
                scheme: selectedVehicletype.scheme,
                updatedBy: sessionManager.getUserSession().ID,
                cost_ac: selectedVehicletype.cost_ac || '',
                cost_nonac: selectedVehicletype.cost_nonac || '',
                updatedAt: new Date(),
            });

            //  console.log("UpdateVehicleType",response);

            if (response[0].result == 1) {
                toastService.success('Vehicle type updated successfully.');
                // Refresh the grid data
                BindVehicleTypeList(selectedVendor, selectedFacility);
                setVisibleLeft(false);
                // You might want to add a success toast notification here
            }
            else if (response[0].result == 0) {
                toastService.warn('Vehicle type already exists.');
            }
        } catch (error) {
            toastService.error("Error updating vehicle type:", error);
            // You might want to add an error toast notification here
        }
        finally {
            setIsSubmitting(false);
        }
    };

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
            <Header pageTitle="Vehicle Master" showNewButton={true} onNewButtonClick={setVehicleType} />
            <Sidebar />
            <div className="middle">
                <div className="row">
                    <div className="col-12">
                        <h6 className="pageTitle">Vehicle Type Master</h6>
                    </div>
                    {/* <div className="col-12">
                        <h6 className="pageTitle">Manage Vehicle Type <small>Allows to View, Edit and Add New Vehicle Type.</small></h6>
                    </div> */}
                    {/* Search Box */}
                    <div className="col-12">
                        <div className="card_tb p-3">
                            <div className="row">
                                <div className="col-2">
                                    <label htmlFor="">Facility</label>
                                    <Dropdown
                                        value={selectedFacility}
                                        onChange={async (e) => {
                                            setSelectedfacility(e.value);
                                            setIsSubmitting(true);
                                            await BindVendorDropdownlist(e.value);
                                            await BindVehicleTypeList(0, e.value);
                                            setIsSubmitting(false);
                                        }}
                                        options={facilityList}
                                        optionLabel="facilityName"
                                        optionValue="Id"
                                        placeholder="Select Facility"
                                        className="w-100"
                                        filter
                                        id="ddlfacility"
                                    />
                                </div>
                                <div className="col-2">
                                    <label htmlFor="">Vendor </label>
                                    <Dropdown
                                        value={selectedVendor}
                                        placeholder="All Vendor"
                                        className="w-100"
                                        options={[
                                            { Id: 0, vendorName: 'All' },
                                            ...VendorList
                                        ]}
                                        optionLabel="vendorName"
                                        optionValue="Id"
                                        filter
                                        id="ddlvendor"
                                        onChange={(e) => {
                                            setSelectedVendor(e.value);
                                            handleVendorChange(e);
                                        }}
                                    />
                                </div>
                                {/* <div className="col-2 offset-6">
                                    <label htmlFor="" className="d-block">Search Any</label>
                                    <InputText placeholder="Search Any Value" className="w-100" />
                                </div> */}
                            </div>
                        </div>
                    </div>
                    {/* Table Start */}
                    <div className="col-12">
                        <div className="card_tb">
                            <DataTable value={VehicleTypeList} paginator rows={50}
                                rowsPerPageOptions={[50, 100, 150, 200, 250]} emptyMessage="No Vehicle Type Found">
                                <Column sortable field="Id" header="Vehicle" body={(rowData) => (
                                    <a href="#" onClick={(e) => {
                                        e.preventDefault();
                                        setVisibleLeft(true);
                                        handleVehicleType(rowData);
                                    }}>
                                        {rowData.vehicle}
                                    </a>
                                )}></Column>
                                <Column sortable field="vendorName" header="Vendor"></Column>
                                <Column field="cost_ac" header="Cost AC"></Column>
                                <Column field="cost_nonac" header="Cost Non AC"></Column>
                                <Column sortable field="occupancy" header="Occupancy"></Column>
                                <Column sortable field="vendorType" header="Scheme"></Column>
                                {/* <Column field="updatedBy" header="Updated By"></Column> */}
                                <Column sortable field="updatedAt" header="Last Updated"></Column>
                            </DataTable>
                        </div>
                    </div>

                    {/* Prime Sidebar */}
                    <PrimeSidebar visible={visibleLeft} position="right" onHide={() => setVisibleLeft(false)} showCloseIcon={false} dismissable={false} style={{ width: '25%' }}>
                        <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
                            <h6 className="sidebarTitle">{selectedVehicletype?.vehicle}</h6>
                            <Button icon="pi pi-times" className="p-button-rounded p-button-text" onClick={() => setVisibleLeft(false)} />
                        </div>

                        <div className="sidebarBody">
                            <div className="row">
                                {/* <div className="col-12 mb-3">
                                    <h6 className="sidebarSubTitle">Vehicle Details</h6>
                                </div> */}
                                <div className="field col-12 mb-3">
                                    <label>Vehicle <span>*</span></label>
                                    <InputText
                                        className="form-control"
                                        placeholder="Vehicle"
                                        value={selectedVehicletype?.vehicle || ''}
                                        onChange={(e) => setSelectedVehicletype({ ...selectedVehicletype, vehicle: e.target.value })}
                                    />
                                </div>
                                <div className="field col-12 mb-3">
                                    <label>Vendor  <span>*</span></label>
                                    <Dropdown
                                        placeholder="Vendor"
                                        className="w-100"
                                        filter
                                        value={selectedVehicletype?.vendorId}
                                        options={VendorList}
                                        optionLabel="vendorName"
                                        optionValue="Id"
                                        onChange={(e) => setSelectedVehicletype({ ...selectedVehicletype, vendorId: e.value }, BindEditVendorScheme(e.value))}
                                    />
                                </div>
                                <div className="field col-12 mb-3">
                                    <label>Cost AC</label>
                                    <InputText
                                        className="form-control"
                                        placeholder="Cost AC"
                                        value={selectedVehicletype?.cost_ac || ''}
                                        onChange={e => setSelectedVehicletype(prev => ({
                                            ...(prev || {}),
                                            cost_ac: e.target.value
                                        }))}
                                    />
                                </div>
                                <div className="field col-12 mb-3">
                                    <label>Cost Non AC</label>
                                    <InputText
                                        className="form-control"
                                        placeholder="Cost Non AC"
                                        value={selectedVehicletype?.cost_nonac || ''}
                                        onChange={e => setSelectedVehicletype(prev => ({
                                            ...(prev || {}),
                                            cost_nonac: e.target.value
                                        }))}
                                    />
                                </div>

                                <div className="field col-12 mb-3">
                                    <label>Occupancy</label>
                                    <InputNumber
                                        className="w-100"
                                        placeholder="Occupancy"
                                        value={selectedVehicletype?.occupancy || null}
                                        onValueChange={(e) => setSelectedVehicletype({ ...selectedVehicletype, occupancy: e.value })}
                                        min={0}
                                        max={100}
                                        useGrouping={false}
                                    />
                                </div>

                                <div className="field col-12 mb-3">
                                    <label>Scheme</label>
                                    <InputText disabled={true}
                                        className="form-control"
                                        placeholder="Scheme"
                                        value={selectedVehicletype?.vendorType || ''}
                                        onChange={(e) => setSelectedVehicletype({ ...selectedVehicletype, vendorType: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Fixed button container at bottom of sidebar */}
                        <div className="sidebar-fixed-bottom position-absolute pe-3">
                            <div className="d-flex gap-3 justify-content-end">
                                <Button label="Cancel" className="btn btn-outline-secondary" onClick={() => setVisibleLeft(false)} />
                                <Button label="Update" className="btn btn-success" onClick={() => handleUpdateVehicleType()} />
                            </div>
                        </div>
                    </PrimeSidebar>

                    <PrimeSidebar
                        visible={vehicleType}
                        position="right"
                        onHide={() => {
                            setVehicleType(false);
                            setSelectedVehicletype(null); // Reset form on close
                        }}
                        showCloseIcon={false}
                        dismissable={false}
                        style={{ width: '25%' }}
                    >
                        <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
                            <h6 className="sidebarTitle">Add Vehicle Type</h6>
                            <Button
                                icon="pi pi-times"
                                className="p-button-rounded p-button-text"
                                onClick={() => {
                                    setVehicleType(false);
                                    setSelectedVehicletype(null); // Reset form on close
                                }}
                            />
                        </div>

                        <div className="sidebarBody">
                            <div className="row">
                                <div className="field col-12 mb-3">
                                    <label>Facility<span className="text-danger">*</span></label>

                                    <Dropdown
                                        value={selectedFacility}
                                        options={facilityList}
                                        optionLabel="facilityName"
                                        optionValue="Id"
                                        placeholder="Select Facility"
                                        className="w-100"
                                        disabled={true}
                                        id="ddlfacilityAdd"
                                    />
                                </div>
                                <div className="field col-12 mb-3">
                                    <label>Vehicle </label>
                                    <InputText
                                        className="form-control"
                                        placeholder="Enter Vehicle Name"
                                        value={selectedVehicletype?.vehicle || ''}
                                        onChange={(e) => setSelectedVehicletype(prev => ({
                                            ...(prev || {}),
                                            vehicle: e.target.value
                                        }))}
                                    />
                                </div>
                                <div className="field col-12 mb-3">
                                    <label>Cost_Ac</label>
                                    <InputText
                                        className="form-control"
                                        value={selectedVehicletype?.cost_ac || ''}
                                        onChange={(e) => setSelectedVehicletype(prev => ({
                                            ...(prev || {}),
                                            cost_ac: e.target.value
                                        }))}
                                    />
                                </div>
                                <div className="field col-12 mb-3">
                                    <label>Cost Non_Ac</label>
                                    <InputText
                                        className="form-control"
                                        value={selectedVehicletype?.cost_nonac || ''}
                                        onChange={(e) => setSelectedVehicletype(prev => ({
                                            ...(prev || {}),
                                            cost_nonac: e.target.value
                                        }))}
                                    />
                                </div>
                                <div className="field col-12 mb-3">
                                    <label>Vendor <span className="text-danger">*</span></label>
                                    <Dropdown
                                        placeholder="Select Vendor"
                                        className="w-100"
                                        filter
                                        value={selectedVehicletype?.vendorId || ''}
                                        options={VendorList}
                                        optionLabel="vendorName"
                                        optionValue="Id"
                                        onChange={(e) => {
                                            setSelectedVehicletype(prev => ({
                                                ...(prev || {}),
                                                vendorId: e.value,
                                                vendorType: '', // Reset scheme when vendor changes
                                            }));
                                            if (e.value) {
                                                BindEditVendorScheme(e.value);
                                            }
                                        }}
                                    />
                                </div>

                                <div className="field col-12 mb-3">
                                    <label>Occupancy</label>
                                    <InputNumber
                                        className="w-100"
                                        placeholder="Enter Occupancy"
                                        value={selectedVehicletype?.occupancy || null}
                                        onValueChange={(e) => setSelectedVehicletype(prev => ({
                                            ...(prev || {}),
                                            occupancy: e.value
                                        }))}
                                        min={0}
                                        max={100}
                                        useGrouping={false}
                                    />
                                </div>

                                <div className="field col-12 mb-3">
                                    <label>Scheme</label>
                                    <InputText
                                        className="form-control"
                                        placeholder="Scheme"
                                        disabled={true}
                                        value={selectedVehicletype?.vendorType || ''}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="sidebar-fixed-bottom position-absolute pe-3">
                            <div className="d-flex gap-3 justify-content-end">
                                <Button
                                    label="Cancel"
                                    className="btn btn-outline-secondary"
                                    onClick={() => {
                                        setVehicleType(false);
                                        setSelectedVehicletype(null);
                                    }}
                                />
                                <Button
                                    label="Save"
                                    className="btn btn-success"
                                    onClick={handleSaveVehicleType}
                                    disabled={!selectedVehicletype?.vendorId || !selectedVehicletype?.vehicle}
                                />
                            </div>
                        </div>
                    </PrimeSidebar>


                    {/* Offcanvas Component */}
                    {/* <div 
                            tabIndex="-1" 
                            className="offcanvas offcanvas-end"
                            id="raise_Feedback"
                            aria-labelledby="offcanvasRightLabel">
                            <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
                            <h5 className="subtitle fw-normal">Add New Vehicle Type</h5>          
                            <button type="button" className="btn-close btn-close-white" onClick={() => setShowOffcanvas(false)} data-bs-dismiss="offcanvas" aria-label="Close"></button>
                            </div>
                            <div className="offcanvas-body">
                             
                </div>
                
            </div>            */}
                </div>
            </div>
        </>
    )
}

export default VehicleTypeMaster;