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
import MasterSidebar from "./Master/MasterSidebar";
import { toastService } from "../services/toastService";
import { InputNumber } from 'primereact/inputnumber';
import CustomPaginator from "./common/CustomPaginator";
import Loader from "./common/Loader";

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

    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(50);

    const onPageChange = (event) => {
        setFirst(event.first);
        setRows(event.rows);
    };

    // const userFacilityId = sessionManager.getUserSession().FacilityID;
    // const userFacility = facilityList.find(f => f.Id === userFacilityId);
    // Update the useEffect to properly initialize newVendor
    useEffect(() => {
        BindFacilityDDL();
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
            setfacilityList(response);

            const userFacilityId = sessionManager.getUserSession().FacilityID;
            let resolvedFacilityId = null;

            if (response && response.some(f => f.Id === userFacilityId)) {
                resolvedFacilityId = userFacilityId;
            } else if (response && response.length > 0) {
                resolvedFacilityId = response[0].Id;
            }

            if (resolvedFacilityId) {
                setSelectedfacility(resolvedFacilityId);
                await BindVendorDropdownlist(resolvedFacilityId);
                await BindVehicleTypeList(0, resolvedFacilityId);
            }
        } catch (error) {
            console.error("Error fetching locationlist:", error);
        }
    };

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
            setFirst(0); // Reset pagination on data fetch
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
            <Loader isVisible={isSubmitting} fullScreen={true} />
            <Header pageTitle="Vehicle Type Master" showNewButton={true} onNewButtonClick={setVehicleType} />
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
                                <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-3">
                                    <label htmlFor="" className="form-label">
                                        Facility <span className="text-danger">*</span>
                                    </label>
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
                                <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-3">
                                    <label htmlFor="" className="form-label">
                                        Vendor <span className="text-danger">*</span>
                                    </label>
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
                            <DataTable value={[...VehicleTypeList].slice(first, first + rows)} emptyMessage="No Vehicle Type Found">
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
                            <CustomPaginator
                                first={first}
                                rows={rows}
                                totalRecords={VehicleTypeList.length}
                                onPageChange={onPageChange}
                                rowsPerPageOptions={[50, 100, 150, 200, 250]}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Vehicle Type Sidebar */}
            <MasterSidebar
                show={visibleLeft}
                onClose={() => setVisibleLeft(false)}
                title={selectedVehicletype?.vehicle || "Edit Vehicle Type"}
                width="25%"
                footerButtons={[
                    {
                        label: "Cancel",
                        className: "btn btn-outline-secondary",
                        onClick: () => setVisibleLeft(false),
                    },
                    {
                        label: "Update",
                        className: "btn btn-success",
                        onClick: handleUpdateVehicleType,
                        loading: isSubmitting,
                    },
                ]}
            >
                <div className="p-3 bg-white">
                    <div className="row">
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
                            <label>Vendor <span>*</span></label>
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
                            />
                        </div>
                    </div>
                </div>
            </MasterSidebar>

            {/* Add Vehicle Type Sidebar */}
            <MasterSidebar
                show={vehicleType}
                onClose={() => {
                    setVehicleType(false);
                    setSelectedVehicletype(null);
                }}
                title="Add Vehicle Type"
                width="25%"
                footerButtons={[
                    {
                        label: "Cancel",
                        className: "btn btn-outline-secondary",
                        onClick: () => {
                            setVehicleType(false);
                            setSelectedVehicletype(null);
                        },
                    },
                    {
                        label: "Save",
                        className: "btn btn-success",
                        onClick: handleSaveVehicleType,
                        loading: isSubmitting,
                        disabled: !selectedVehicletype?.vendorId || !selectedVehicletype?.vehicle,
                    },
                ]}
            >
                <div className="p-3 bg-white">
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
                                        vendorType: '',
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
            </MasterSidebar>
        </>
    )
}

export default VehicleTypeMaster;