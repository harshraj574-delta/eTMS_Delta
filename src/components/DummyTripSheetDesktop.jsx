import React, { useEffect, useMemo, useState } from 'react';
import Header from './Master/Header';
import Sidebar from './Master/SidebarMenu';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';

import PdfViewerModal from './common/PdfViewerModal';
import TripSheetPdfDocument from './TripSheetPdfDocument';
import TabSwitcher from './common/TabSwitcher';
import ReportButton from './common/ReportButton';
import { CustomDataTable } from './common/CustomDataTable';
import CustomPaginator from './common/CustomPaginator';
import calendarIcon from '../assets/calendar.png';
import './DummyTripSheet.css';

const DummyTripSheetDesktop = ({
    facilities = [],
    cabTypes = [],
    shifts = [],

    actionType,
    setActionType,
    startDate,
    setStartDate,
    selectedFacility,
    setSelectedFacility,
    tripType,
    setTripType,
    selectedShift,
    setSelectedShift,
    selectedCabType,
    setSelectedCabType,
    noOfSheets,
    setNoOfSheets,
    searchQuery,
    setSearchQuery,
    routeIdQuery,
    setRouteIdQuery,

    searchedEmployees = [],
    addedEmployees = [],

    isPdfModalVisible,
    setIsPdfModalVisible,
    pdfData,

    actions,
    isDataLoading
}) => {
    const isBlank = actionType === 'Blank';

    const [searchFirst, setSearchFirst] = useState(0);
    const [searchRows, setSearchRows] = useState(10);

    const [addedFirst, setAddedFirst] = useState(0);
    const [addedRows, setAddedRows] = useState(10);

    useEffect(() => {
        setSearchFirst(0);
    }, [searchedEmployees]);

    useEffect(() => {
        setAddedFirst(0);
    }, [addedEmployees]);

    const facilityOptions = facilities.map((f) => ({
        label: f.facilityName,
        value: f.Id
    }));

    const cabTypeOptions = cabTypes.map((c) => ({
        label: c.CabType,
        value: c.CabType
    }));

    const shiftOptions = [
        { label: 'Blank', value: '' },
        ...shifts.map((s) => ({
            label: s.shiftTime,
            value: s.shiftTime
        }))
    ];

    const tripTypeOptions = [
        { label: 'Pick', value: 'P' },
        { label: 'Drop', value: 'D' },
        { label: 'None', value: '' }
    ];

    const pagedSearchedEmployees = useMemo(() => {
        return searchedEmployees.slice(searchFirst, searchFirst + searchRows);
    }, [searchedEmployees, searchFirst, searchRows]);

    const pagedAddedEmployees = useMemo(() => {
        return addedEmployees.slice(addedFirst, addedFirst + addedRows);
    }, [addedEmployees, addedFirst, addedRows]);

    const addActionBodyTemplate = (rowData) => {
        return (
            <Button
                label="ADD"
                className="p-button-text p-button-sm fw-bold"
                onClick={() => actions.handleAddEmployee(rowData)}
            />
        );
    };

    return (
        <div className="container-fluid p-0">
            <Header pageTitle="Spot Hire Request" />
            <Sidebar />

            <div className="middle">
                <div className="row mb-3">
                    <div className="col-12">
                        <TabSwitcher
                            tabs={[
                                { label: 'Blank Sheet', value: 'Blank' },
                                {
                                    label: 'With Employee',
                                    value: 'NonBlank'
                                }
                            ]}
                            activeTab={actionType}
                            onTabChange={(tab) => setActionType(tab)}
                        />
                    </div>
                </div>

                <div className="card_tb p-3 mb-4">
                    <div className="row g-2 align-items-start">
                        <div className="col-12 col-md-4 col-lg">
                            <label className="form-label">
                                Date <span className="text-danger">*</span>
                            </label>
                            <div className="custom-calendar-wrapper">
                                <img
                                    src={calendarIcon}
                                    alt="calendar"
                                    className="custom-calendar-icon"
                                />
                                <Calendar
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.value)}
                                    dateFormat="mm/dd/yy"
                                    className="w-100 custom-calendar-input"
                                />
                            </div>
                        </div>

                        <div className="col-12 col-md-4 col-lg">
                            <label className="form-label">
                                Facility <span className="text-danger">*</span>
                            </label>
                            <Dropdown
                                value={selectedFacility}
                                options={facilityOptions}
                                optionLabel="label"
                                optionValue="value"
                                onChange={(e) =>
                                    setSelectedFacility(e.value)
                                }
                                placeholder="-Select-"
                                className="w-100"
                            />
                        </div>

                        <div className="col-12 col-md-4 col-lg">
                            <label className="form-label">
                                Trip Type <span className="text-danger">*</span>
                            </label>
                            <Dropdown
                                value={tripType}
                                options={tripTypeOptions}
                                optionLabel="label"
                                optionValue="value"
                                onChange={(e) => setTripType(e.value)}
                                placeholder="-Select-"
                                className="w-100"
                            />
                        </div>

                        <div className="col-12 col-md-4 col-lg">
                            <label className="form-label">
                                Shift <span className="text-danger">*</span>
                            </label>
                            <Dropdown
                                value={selectedShift}
                                options={shiftOptions}
                                optionLabel="label"
                                optionValue="value"
                                onChange={(e) => setSelectedShift(e.value)}
                                placeholder="-Select-"
                                className="w-100"
                            />
                        </div>

                        <div className="col-12 col-md-4 col-lg">
                            <label className="form-label">
                                Cab Type <span className="text-danger">*</span>
                            </label>
                            <Dropdown
                                value={selectedCabType}
                                options={cabTypeOptions}
                                optionLabel="label"
                                optionValue="value"
                                onChange={(e) =>
                                    setSelectedCabType(e.value)
                                }
                                placeholder="-Select-"
                                className="w-100"
                            />
                        </div>

                        {isBlank && (
                            <div className="col-12 col-md-4 col-lg">
                                <label className="form-label">
                                    No of Sheets:{' '}
                                    <span className="text-danger">*</span>
                                </label>
                                <InputText
                                    value={noOfSheets}
                                    onChange={(e) =>
                                        setNoOfSheets(e.target.value)
                                    }
                                    className="w-100"
                                />
                            </div>
                        )}

                        {isBlank && (
                            <div className="col-12 col-md-12 col-lg">
                                <label className="form-label d-none d-lg-block">
                                    &nbsp;
                                </label>
                                <ReportButton
                                    label={
                                        isDataLoading
                                            ? 'Generating...'
                                            : 'Generate'
                                    }
                                    onClick={actions.handleGenerate}
                                    disabled={isDataLoading}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {!isBlank && (
                    <div className="card_tb p-3 mb-4 mt-3">
                        <div className="row g-4 align-items-center">
                            <div className="col-12 col-md-5">
                                <label className="form-label mb-1 fw-bold fs-13">
                                    Search Employee Name / ID:
                                </label>
                                <div
                                    className="d-flex gap-2"
                                    style={{ maxWidth: '100%' }}
                                >
                                    <InputText
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                actions.handleSearchEmployee();
                                            }
                                        }}
                                        placeholder="Search Name or ID"
                                        className="w-100"
                                    />
                                    <div style={{ minWidth: '120px' }}>
                                        <ReportButton
                                            label="Search"
                                            icon="pi pi-search"
                                            onClick={
                                                actions.handleSearchEmployee
                                            }
                                            fullWidth={true}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="col-12 col-md-2 text-center text-muted fw-bold">
                                OR
                            </div>

                            <div className="col-12 col-md-5">
                                <label className="form-label mb-1 fw-bold fs-13">
                                    Search Route ID:
                                </label>
                                <div
                                    className="d-flex gap-2"
                                    style={{ maxWidth: '100%' }}
                                >
                                    <InputText
                                        value={routeIdQuery}
                                        onChange={(e) =>
                                            setRouteIdQuery(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                actions.handleSearchRouteId();
                                            }
                                        }}
                                        placeholder="Search Route ID"
                                        className="w-100"
                                    />
                                    <div style={{ minWidth: '120px' }}>
                                        <ReportButton
                                            label="Search"
                                            icon="pi pi-search"
                                            onClick={
                                                actions.handleSearchRouteId
                                            }
                                            fullWidth={true}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!isBlank && searchedEmployees.length > 0 && (
                    <div className="card_tb p-0 mb-4 overflow-hidden border">
                        <div className="p-3 pb-0">
                            <CustomDataTable
                                value={pagedSearchedEmployees}
                                className="dummy-trip-custom-table"
                                responsiveLayout="scroll"
                                dataKey="Id"
                                emptyMessage="No Record Found"
                            >
                                <Column
                                    body={addActionBodyTemplate}
                                    header="Action"
                                    style={{ width: '100px' }}
                                />
                                <Column
                                    field="empCode"
                                    header="Employee Id"
                                />
                                <Column
                                    field="empName"
                                    header="Employee Name"
                                />
                                <Column
                                    field="processName"
                                    header="Process"
                                />
                                <Column
                                    field="facilityName"
                                    header="Facility"
                                />
                                <Column
                                    field="PrimaryLocation"
                                    header="Location"
                                />
                            </CustomDataTable>

                            <CustomPaginator
                                first={searchFirst}
                                rows={searchRows}
                                totalRecords={searchedEmployees.length}
                                onPageChange={(e) => {
                                    setSearchFirst(e.first);
                                    setSearchRows(e.rows);
                                }}
                                rowsPerPageOptions={[5, 10, 25, 50]}
                            />
                        </div>
                    </div>
                )}

                {!isBlank && addedEmployees.length > 0 && (
                    <div className="card_tb p-0 mb-4 overflow-hidden border">
                        <div className="bg-light p-3 border-bottom d-flex align-items-center justify-content-between">
                            <ReportButton
                                label={
                                    isDataLoading
                                        ? 'Generating...'
                                        : 'Generate Dummy Trip Sheet'
                                }
                                icon={
                                    isDataLoading
                                        ? 'pi pi-spin pi-spinner'
                                        : 'pi pi-file-pdf'
                                }
                                onClick={actions.handleGenerateEmpDummy}
                                disabled={isDataLoading}
                                fullWidth={false}
                            />
                        </div>

                        <div className="p-3 pb-0">
                            <CustomDataTable
                                value={pagedAddedEmployees}
                                className="dummy-trip-custom-table"
                                responsiveLayout="scroll"
                                dataKey="ID"
                                emptyMessage="No employees added yet."
                            >
                                <Column
                                    field="empCode"
                                    header="Employee Id"
                                />
                                <Column
                                    field="empName"
                                    header="Employee Name"
                                />
                                <Column field="Gender" header="Gender" />
                                <Column field="Address" header="Address" />
                            </CustomDataTable>

                            <CustomPaginator
                                first={addedFirst}
                                rows={addedRows}
                                totalRecords={addedEmployees.length}
                                onPageChange={(e) => {
                                    setAddedFirst(e.first);
                                    setAddedRows(e.rows);
                                }}
                                rowsPerPageOptions={[5, 10, 25, 50]}
                            />
                        </div>
                    </div>
                )}
            </div>

            <PdfViewerModal
                visible={isPdfModalVisible}
                onHide={() => setIsPdfModalVisible(false)}
                document={<TripSheetPdfDocument data={pdfData} />}
                fileName={`DummyTripSheet_${
                    pdfData?.date?.toISOString().split('T')[0]
                }_${pdfData?.transId || ''}.pdf`}
                // title={`Trip Sheet Preview - ${
                //     pdfData?.transId || 'New Document'
                // }`}
            />
        </div>
    );
};

export default DummyTripSheetDesktop;