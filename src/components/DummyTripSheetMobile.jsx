import React, { useState } from 'react';
import Header from './Master/Header';
import Sidebar from './Master/SidebarMenu';
import MobileCardList from './common/mobile/MobileCardList';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

import PdfViewerModal from './common/PdfViewerModal';
import TripSheetPdfDocument from './TripSheetPdfDocument';
import TabSwitcher from './common/TabSwitcher';
import ReportButton from './common/ReportButton';
import calendarIcon from '../assets/calendar.png';
import './DummyTripSheet.css';

const DummyTripSheetMobile = ({
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
    isDataLoading,
    errors = {}
}) => {
    const isBlank = actionType === 'Blank';

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

    const [isFilterExpanded, setIsFilterExpanded] = useState(true);

    const renderEmployeeCard = (rowData) => {
        const rowId = rowData?.Id ?? rowData?.employeeId ?? rowData?.ID;

        const alreadyAdded = addedEmployees.some((e) => {
            const addedId = e?.ID ?? e?.Id ?? e?.employeeId;
            return String(addedId) === String(rowId);
        });

        return (
            <div className="bg-white rounded-3 p-3 shadow-sm mb-3 border">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <span className="fw-bold text-dark">
                            {rowData.empName}
                        </span>
                        <div className="text-muted small">{rowData.empCode}</div>
                    </div>

                    {!alreadyAdded && (
                        <Button
                            icon="pi pi-plus"
                            className="p-button-rounded p-button-success p-button-sm p-0"
                            style={{ width: '2rem', height: '2rem' }}
                            onClick={() => actions.handleAddEmployee(rowData)}
                        />
                    )}
                </div>

                <div className="d-flex flex-column gap-1 small text-secondary">
                    <div>
                        <i className="pi pi-briefcase me-2"></i>
                        {rowData.processName || rowData.Gender}
                    </div>
                    <div>
                        <i className="pi pi-map-marker me-2"></i>
                        {rowData.PrimaryLocation || rowData.Address}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container-fluid p-0 bg-light min-vh-100 pb-5">
            <Header mainTitle="Transport" pageTitle="Spot Hire Request" showNewButton={false} />
            <Sidebar />

            <div className="middle">
                <div className="mb-3">
                    <TabSwitcher
                        tabs={[
                            { label: 'Blank Sheet', value: 'Blank' },
                            { label: 'With Employee', value: 'NonBlank' }
                        ]}
                        activeTab={actionType}
                        onTabChange={(tab) => {
                            setActionType(tab);
                            setIsFilterExpanded(true);
                        }}
                    />
                </div>

                <div className="bg-white rounded-3 shadow-sm border mb-3 overflow-hidden">
                    <div
                        className="p-3 d-flex justify-content-between align-items-center bg-light cursor-pointer"
                        onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                    >
                        <h6 className="mb-0 fw-bold fs-15 text-primary">
                            Selection Criteria
                        </h6>
                        <i
                            className={`pi ${
                                isFilterExpanded
                                    ? 'pi-chevron-up'
                                    : 'pi-chevron-down'
                            } text-primary`}
                        ></i>
                    </div>

                    {isFilterExpanded && (
                        <div className="p-3 pt-2">
                            <div className="mb-3">
                                <label className="form-label mb-1 fw-bold fs-13 text-secondary">
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
                                        className={`w-100 custom-calendar-input compact-mobile-calendar ${
                                            errors.startDate ? 'p-invalid' : ''
                                        }`}
                                        showIcon={false}
                                        readOnlyInput
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label mb-1 fw-bold fs-13 text-secondary">
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
                                    className={`w-100 compact-mobile-dropdown ${
                                        errors.selectedFacility
                                            ? 'p-invalid'
                                            : ''
                                    }`}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label mb-1 fw-bold fs-13 text-secondary">
                                    Trip Type <span className="text-danger">*</span>
                                </label>
                                <Dropdown
                                    value={tripType}
                                    options={tripTypeOptions}
                                    optionLabel="label"
                                    optionValue="value"
                                    onChange={(e) => setTripType(e.value)}
                                    placeholder="-Select-"
                                    className={`w-100 compact-mobile-dropdown ${
                                        errors.tripType ? 'p-invalid' : ''
                                    }`}
                                />
                                {errors.tripType && (
                                    <small className="p-error d-block mt-1">
                                        {errors.tripType}
                                    </small>
                                )}
                            </div>

                            <div className="row g-2 mb-3">
                                <div className="col-6">
                                    <label className="form-label mb-1 fw-bold fs-13 text-secondary">
                                        Shift <span className="text-danger">*</span>
                                    </label>
                                    <Dropdown
                                        value={selectedShift}
                                        options={shiftOptions}
                                        optionLabel="label"
                                        optionValue="value"
                                        onChange={(e) =>
                                            setSelectedShift(e.value)
                                        }
                                        placeholder="-Select-"
                                        className={`w-100 compact-mobile-dropdown ${
                                            errors.selectedShift
                                                ? 'p-invalid'
                                                : ''
                                        }`}
                                    />
                                </div>

                                <div className="col-6">
                                    <label className="form-label mb-1 fw-bold fs-13 text-secondary">
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
                                        className={`w-100 compact-mobile-dropdown ${
                                            errors.selectedCabType
                                                ? 'p-invalid'
                                                : ''
                                        }`}
                                    />
                                    {errors.selectedCabType && (
                                        <small className="p-error d-block mt-1">
                                            {errors.selectedCabType}
                                        </small>
                                    )}
                                </div>
                            </div>

                            {isBlank && (
                                <div className="pt-3 border-top mt-1">
                                    <label className="form-label mb-1 fw-bold fs-13 text-secondary">
                                        No of Sheets:{' '}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <InputText
                                        value={noOfSheets}
                                        onChange={(e) =>
                                            setNoOfSheets(e.target.value)
                                        }
                                        type="number"
                                        className={`w-100 mb-3 dummy-mobile-input ${
                                            errors.noOfSheets
                                                ? 'p-invalid'
                                                : ''
                                        }`}
                                    />
                                    {errors.noOfSheets && (
                                        <small className="p-error d-block mb-2">
                                            {errors.noOfSheets}
                                        </small>
                                    )}

                                    <ReportButton
                                        label={
                                            isDataLoading
                                                ? 'Generating...'
                                                : 'Generate Dummy Sheets'
                                        }
                                        onClick={actions.handleGenerate}
                                        disabled={isDataLoading}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {!isBlank && (
                    <div className="bg-white rounded-3 shadow-sm border mb-3 p-3">
                        <label className="form-label mb-1 fw-bold fs-13 text-secondary">
                            Search By Name / ID
                        </label>

                        <div className="d-flex gap-2 align-items-stretch dummy-mobile-search-row mb-3">
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
                                placeholder="Enter Name or ID"
                                className={`w-100 dummy-mobile-input ${
                                    errors.searchQuery ? 'p-invalid' : ''
                                }`}
                            />
                            <div className="dummy-mobile-search-btn-wrap">
                                <ReportButton
                                    label="Search"
                                    icon="pi pi-search"
                                    onClick={actions.handleSearchEmployee}
                                    fullWidth={false}
                                    className="dummy-mobile-search-btn"
                                />
                            </div>
                        </div>

                        <div className="text-center text-muted fw-bold small mb-2">
                            OR
                        </div>

                        <label className="form-label mb-1 fw-bold fs-13 text-secondary">
                            Search Route ID
                        </label>

                        <div className="d-flex gap-2 align-items-stretch dummy-mobile-search-row">
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
                                placeholder="Enter Route ID"
                                className={`w-100 dummy-mobile-input ${
                                    errors.routeIdQuery ? 'p-invalid' : ''
                                }`}
                            />
                            <div className="dummy-mobile-search-btn-wrap">
                                <ReportButton
                                    label="Search"
                                    icon="pi pi-search"
                                    onClick={actions.handleSearchRouteId}
                                    fullWidth={false}
                                    className="dummy-mobile-search-btn"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {!isBlank && searchedEmployees.length > 0 && (
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                            <h6 className="fw-bold mb-0">Search Results</h6>
                            <span className="badge bg-primary rounded-pill">
                                {searchedEmployees.length}
                            </span>
                        </div>

                        <MobileCardList
                            data={searchedEmployees}
                            itemTemplate={renderEmployeeCard}
                            isLoading={isDataLoading}
                        />
                    </div>
                )}

                {!isBlank && addedEmployees.length > 0 && (
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                            <h6 className="fw-bold mb-0 text-success">
                                Added Employees
                            </h6>
                            <span className="badge bg-success rounded-pill">
                                {addedEmployees.length}
                            </span>
                        </div>

                        <div className="bg-success bg-opacity-10 p-2 rounded-3 border border-success border-opacity-25 mb-3">
                            {addedEmployees.map((emp, idx) => (
                                <div
                                    key={idx}
                                    className="d-flex justify-content-between align-items-center bg-white p-2 rounded mb-2 shadow-sm"
                                >
                                    <div className="d-flex flex-column">
                                        <span className="fw-bold fs-14">
                                            {emp.empName}
                                        </span>
                                        <span
                                            className="text-secondary"
                                            style={{ fontSize: '0.75rem' }}
                                        >
                                            {emp.empCode}
                                        </span>
                                    </div>
                                    <span className="badge bg-light text-dark border">
                                        {emp.Gender}
                                    </span>
                                </div>
                            ))}

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
                                className="mt-2"
                                onClick={actions.handleGenerateEmpDummy}
                                disabled={isDataLoading}
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
            />
        </div>
    );
};

export default DummyTripSheetMobile;