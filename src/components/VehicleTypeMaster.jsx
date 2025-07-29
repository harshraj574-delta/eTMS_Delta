import React, { useState,useEffect } from 'react';
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
    const[facilityList,setfacilityList]= useState([]);
    const [EditVendorScheme, setEditVendorScheme] = useState(null);
    const [vehicleType, setVehicleType] = useState(false);


       // Update the useEffect to properly initialize newVendor
       useEffect(() => {
        BindFacilityDDL();
        const currentFacilityId = sessionManager.getUserSession().FacilityID;
        setSelectedfacility(currentFacilityId);
        BindVendorDropdownlist(currentFacilityId);
        BindVehicleTypeList(0,currentFacilityId);
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
       const BindFacilityDDL = async ()=>{
        try {
        const response = await apiService.SelectFacility({
            Userid: sessionManager.getUserSession().ID,
        });
        //console.log("FacilityData",response);
        setfacilityList(response);

       // setfacilityListNew(response);
        }
        catch (error) {
        console.error("Error fetching locationlist:", error);
        }
   };

const BindVendorDropdownlist= async(facilityid) =>{
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

const handleVendorChange = (e) => {
    setSelectedVendor(e.value);
    BindVehicleTypeList(e.value,selectedFacility);
};

const BindVehicleTypeList= async(vendorid,facilityid) =>{
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
    }}

    // Bind GridView
    const handleVehicleType = (rowData) => {
        setSelectedVehicletype(rowData);
    };

const handleSaveVehicleType = async () => {
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

        // Prepare request payload
        const vehicleTypeData = {
            vehicle: selectedVehicletype.vehicle.trim(),
            occupancy: selectedVehicletype.occupancy || 0,
            vendorId: selectedVehicletype.vendorId,
            scheme: selectedVehicletype.vendorType, // Changed from scheme to vendorType
            createdBy: sessionManager.getUserSession().ID,
            facilityId: selectedFacility,
            createdAt: new Date()
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
};


    const handleUpdateVehicleType = async () => {
        try {        
            if (!selectedVehicletype) {
                toastService.warn('Please select a vehicle type to update.');
                return;
            }
            else if(selectedVehicletype.vehicle==""){
                toastService.warn('Please enter vehicle type');
                return;
            }    
            else if(selectedVehicletype.vendorId==""){
                toastService.warn('Please select vendor');
                return;
            }    

            const response = await apiService.UpdateVehicleType({
                Id: selectedVehicletype.Id,
                vehicle: selectedVehicletype.vehicle,
                occupancy: selectedVehicletype.occupancy,
                vendorId: selectedVehicletype.vendorId,
                scheme: selectedVehicletype.scheme,
                updatedBy: sessionManager.getUserSession().ID,
                cost_ac:'',
                cost_nonac:'',
                updatedAt: new Date(),
            });

         //  console.log("UpdateVehicleType",response);
    
            if(response[0].result == 1) {
                toastService.success('Vehicle type updated successfully.');
                // Refresh the grid data
                BindVehicleTypeList(selectedVendor, selectedFacility);
                setVisibleLeft(false);
                // You might want to add a success toast notification here
            }
            else if(response[0].result == 0) {
                toastService.warn('Vehicle type already exists.');
            }
        } catch (error) {
            toastService.error("Error updating vehicle type:", error);
            // You might want to add an error toast notification here
        }
    };

    return (
        <>
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
                                        onChange={(e) => {
                                            setSelectedfacility(e.value);
                                            BindVendorDropdownlist(e.value);
                                            BindVehicleTypeList(0,e.value);
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
                            <DataTable value={VehicleTypeList} paginator rows={10}
                                rowsPerPageOptions={[5, 10, 25, 50]}>
                                    <Column sortable field="vendorName" header="Vendor"></Column>
                                <Column sortable field="Id" header="Vehicle" body={(rowData) => (
                                    <a href="#" onClick={(e) => {
                                        e.preventDefault();
                                        setVisibleLeft(true);
                                        handleVehicleType(rowData);
                                    }}>
                                        {rowData.vehicle}
                                    </a>
                                )}></Column>
                                {/* <Column field="" header="Vehicle Type"></Column>
                                <Column field="" header="Fuel Type"></Column> */}
                                <Column sortable field="occupancy" header="Occupancy"></Column>
                                
                                <Column  sortable field="vendorType" header="Scheme"></Column>
                                {/* <Column field="updatedBy" header="Updated By"></Column> */}
                                <Column sortable field="updatedAt" header="Last Updated"></Column>
                            </DataTable>
                        </div>
                    </div>

                   {/* Prime Sidebar */}
                   <PrimeSidebar visible={visibleLeft} position="right" onHide={() => setVisibleLeft(false)} showCloseIcon={false} dismissable={false} style={{width:'25%'}}>
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
                                    <label>Vendor  <span>*</span></label>
                                    <Dropdown 
                                        placeholder="Vendor" 
                                        className="w-100"
                                        filter
                                        value={selectedVehicletype?.vendorId}
                                        options={VendorList}
                                        optionLabel="vendorName"
                                        optionValue="Id"
                                        onChange={(e) => setSelectedVehicletype({...selectedVehicletype, vendorId: e.value},BindEditVendorScheme(e.value))}
                                    />

                               

                                </div>
                                <div className="field col-12 mb-3">
                                    <label>Vehicle <span>*</span></label>
                                    <InputText 
                                        className="form-control" 
                                        placeholder="Vehicle" 
                                        value={selectedVehicletype?.vehicle || ''}
                                        onChange={(e) => setSelectedVehicletype({...selectedVehicletype, vehicle: e.target.value})}
                                    />
                                </div>
                                <div className="field col-12 mb-3">
                                <label>Occupancy</label>
                                    <InputNumber 
                                        className="w-100"
                                        placeholder="Occupancy" 
                                        value={selectedVehicletype?.occupancy || null}
                                        onValueChange={(e) => setSelectedVehicletype({...selectedVehicletype, occupancy: e.value})}
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
                                        onChange={(e) => setSelectedVehicletype({...selectedVehicletype, vendorType: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Fixed button container at bottom of sidebar */}
                        <div className="sidebar-fixed-bottom position-absolute pe-3">
                                    <div className="d-flex gap-3 justify-content-end">
                                        <Button label="Cancel" className="btn btn-outline-secondary" onClick={() => setVisibleLeft(false)} />
                                        <Button label="Update" className="btn btn-success" onClick={()=>handleUpdateVehicleType()} />
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
    style={{width:'25%'}}
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
                        if(e.value) {
                            BindEditVendorScheme(e.value);
                        }
                    }}
                />
            </div>
            <div className="field col-12 mb-3">
                <label>Vehicle <span className="text-danger">*</span></label>
                <InputText 
                    className="form-control" 
                    placeholder="Enter Vehicle Type"
                    value={selectedVehicletype?.vehicle || ''}
                    onChange={(e) => setSelectedVehicletype(prev => ({
                        ...(prev || {}),
                        vehicle: e.target.value
                    }))}
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