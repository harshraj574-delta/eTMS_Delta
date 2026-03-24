// DummyTripSheetDesktop.jsx
import React from 'react';
import Header from './Master/Header';
import Sidebar from './Master/SidebarMenu';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { RadioButton } from 'primereact/radiobutton';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import PdfViewerModal from './common/PdfViewerModal';
import TripSheetPdfDocument from './TripSheetPdfDocument';
import TabSwitcher from './common/TabSwitcher';
import ReportButton from './common/ReportButton';
import calendarIcon from '../assets/calendar.png';
import './DummyTripSheet.css'; // Optional CSS for refined margins relative to existing design

const DummyTripSheetDesktop = ({
    facilities, cabTypes, shifts,
    
    actionType, setActionType,
    startDate, setStartDate,
    selectedFacility, setSelectedFacility,
    tripType, setTripType,
    selectedShift, setSelectedShift,
    selectedCabType, setSelectedCabType,
    noOfSheets, setNoOfSheets,
    searchQuery, setSearchQuery,
    routeIdQuery, setRouteIdQuery,
    
    searchedEmployees, setSearchedEmployees,
    addedEmployees, setAddedEmployees,
    
    isPdfModalVisible, setIsPdfModalVisible,
    pdfData,

    actions,
    isDataLoading
}) => {
    
    const isBlank = actionType === 'Blank';

    // Facilities dropdown list (mapping to PrimeReact expected format)
    const facilityOptions = facilities.map(f => ({ label: f.facilityName, value: f.Id }));
    
    const cabTypeOptions = cabTypes.map(c => ({ label: c.CabType, value: c.CabType }));
    const shiftOptions = shifts.map(s => ({ label: s.shiftTime, value: s.shiftTime }));
    const tripTypeOptions = [
        { label: 'Pick', value: 'P' },
        { label: 'Drop', value: 'D' },
        { label: 'None', value: '' }
    ];

    return (
        <div className="container-fluid p-0">
            <Header pageTitle="Spot Hire Request" />
            <Sidebar />

            <div className="middle">
                {/* Mode Switcher */}
                <div className="row mb-3">
                    <div className="col-12">
                        <TabSwitcher
                            tabs={[
                                { label: "Blank Sheet", value: "Blank" },
                                { label: "With Employee", value: "NonBlank" }
                            ]}
                            activeTab={actionType}
                            onTabChange={(tab) => setActionType(tab)}
                        />
                    </div>
                </div>

                {/* Primary Card */}
                <div className="card_tb p-3 mb-4">
                    <div className="row g-2 align-items-start">
                        <div className="col-12 col-md-4 col-lg">
                            <label className="form-label">Date <span className="text-danger">*</span></label>
                            <div className="custom-calendar-wrapper">
                                <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                <Calendar value={startDate} onChange={(e) => setStartDate(e.value)} dateFormat="mm/dd/yy" className="w-100 custom-calendar-input" />
                            </div>
                        </div>
                        
                        <div className="col-12 col-md-4 col-lg">
                            <label className="form-label">Facility <span className="text-danger">*</span></label>
                            <Dropdown value={selectedFacility} options={facilityOptions} onChange={(e) => setSelectedFacility(e.value)} placeholder="-Select-" className="w-100" />
                        </div>

                        <div className="col-12 col-md-4 col-lg">
                            <label className="form-label">Trip Type <span className="text-danger">*</span></label>
                            <Dropdown value={tripType} options={tripTypeOptions} onChange={(e) => setTripType(e.value)} placeholder="-Select-" className="w-100" />
                        </div>

                        <div className="col-12 col-md-4 col-lg">
                            <label className="form-label">Shift <span className="text-danger">*</span></label>
                            <Dropdown value={selectedShift} options={shiftOptions} onChange={(e) => setSelectedShift(e.value)} placeholder="-Select-" className="w-100" />
                        </div>

                        <div className="col-12 col-md-4 col-lg">
                            <label className="form-label">Cab Type <span className="text-danger">*</span></label>
                            <Dropdown value={selectedCabType} options={cabTypeOptions} onChange={(e) => setSelectedCabType(e.value)} placeholder="-Select-" className="w-100" />
                        </div>

                        {isBlank && (
                            <div className="col-12 col-md-4 col-lg">
                                <label className="form-label">No of Sheets: <span className="text-danger">*</span></label>
                                <InputText value={noOfSheets} onChange={(e) => setNoOfSheets(e.target.value)} className="w-100" />
                            </div>
                        )}

                        {isBlank && (
                            <div className="col-12 col-md-12 col-lg">
                                <label className="form-label d-none d-lg-block">&nbsp;</label>
                                <ReportButton label={isDataLoading ? "Generating..." : "Generate"} onClick={actions.handleGenerate} disabled={isDataLoading} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Non-Blank specific UI */}
                {!isBlank && (
                    <div className="card_tb p-3 mb-4 mt-3">
                        <div className="row g-4 align-items-center">
                            <div className="col-12 col-md-5">
                                <label className="form-label mb-1 fw-bold fs-13">Search Employee Name / ID:</label>
                                <div className="p-inputgroup">
                                    <InputText value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Name or ID" />
                                    <Button icon="pi pi-search" onClick={actions.handleSearchEmployee} />
                                </div>
                            </div>
                            <div className="col-12 col-md-2 text-center text-muted fw-bold">
                                OR
                            </div>
                            <div className="col-12 col-md-5">
                                <label className="form-label mb-1 fw-bold fs-13">Search Route ID:</label>
                                <div className="p-inputgroup">
                                    <InputText value={routeIdQuery} onChange={(e) => setRouteIdQuery(e.target.value)} placeholder="Search Route ID" />
                                    <Button icon="pi pi-search" onClick={actions.handleSearchRouteId} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!isBlank && searchedEmployees.length > 0 && (
                    <div className="card_tb p-0 mb-4 overflow-hidden border">
                         <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-bold">Search Results</h6>
                         </div>
                        <DataTable value={searchedEmployees} className="p-datatable-sm" responsiveLayout="scroll" paginator rows={10} dataKey="Id">
                            <Column body={(rowData) => (
                                <Button label="ADD" className="p-button-text p-button-sm fw-bold" onClick={() => actions.handleAddEmployee(rowData)} />
                            )} header="Action" style={{ width: '80px' }} />
                            <Column field="empCode" header="Employee Id" />
                            <Column field="empName" header="Employee Name" />
                            <Column field="processName" header="Process" />
                            <Column field="facilityName" header="Facility" />
                            <Column field="PrimaryLocation" header="Location" />
                        </DataTable>
                    </div>
                )}

                {/* Added Employees Grid */}
                {!isBlank && addedEmployees.length > 0 && (
                    <div className="card_tb p-0 mb-4 overflow-hidden border">
                        <div className="bg-light p-3 border-bottom d-flex align-items-center justify-content-between">
                            <h6 className="mb-0 fw-bold">List of to be Added Employees</h6>
                            <ReportButton label={isDataLoading ? "Generating..." : "Generate Dummy Trip Sheet"} icon={isDataLoading ? "pi pi-spin pi-spinner" : "pi pi-file-pdf"} onClick={actions.handleGenerateEmpDummy} disabled={isDataLoading} fullWidth={false} />
                        </div>
                        <DataTable value={addedEmployees} className="p-datatable-sm" responsiveLayout="scroll">
                            <Column field="empCode" header="Employee Id" />
                            <Column field="empName" header="Employee Name" />
                            <Column field="Gender" header="Gender" />
                            <Column field="Address" header="Address" />
                        </DataTable>
                    </div>
                )}
            </div>

            {/* Inline PDF Viewer Modal */}
            <PdfViewerModal
                visible={isPdfModalVisible} 
                onHide={() => setIsPdfModalVisible(false)}
                document={<TripSheetPdfDocument data={pdfData} />}
                fileName={`DummyTripSheet_${pdfData?.date?.toISOString().split('T')[0]}_${pdfData?.transId || ''}.pdf`}
                title={`Trip Sheet Preview - ${pdfData?.transId || 'New Document'}`}
            />
        </div>
    );
};

export default DummyTripSheetDesktop;
