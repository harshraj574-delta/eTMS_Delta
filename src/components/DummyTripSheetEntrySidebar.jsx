import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { toastService } from "../services/toastService";
import sessionManager from "../utils/SessionManager";
import DummyTripSheetEntryService from "../services/compliance/DummyTripSheetEntryService";
import Loader from "./common/Loader";
import {
    useVendorByFacility,
    useVehicleType,
    useVehicleByVendorType,
    useDriverDetails,
    useGuardDetails,
    usePenaltyType,
    useIncidentMaster,
    useShiftByFacilityType,
    useZoneByFac,
    useTollMaster,
    useTollidbyroute
} from "../hooks/compliance/useDummyTripSheetEntryLogic";

const getFirstDefinedValue = (source, keys, fallback = "") => {
    if (!source) return fallback;

    for (const key of keys) {
        const value = source[key];
        if (value !== undefined && value !== null && value !== "") {
            return value;
        }
    }

    return fallback;
};

const toOptionValue = (value, fallback = "") =>
    value === undefined || value === null || value === "" ? fallback : String(value);

const padTwoDigits = (value) => String(value).padStart(2, "0");

const normalizeTimeValue = (value, fallback = "") => {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    const normalized = String(value).trim();
    return normalized === "0" ? fallback : padTwoDigits(normalized);
};

const parseDateValue = (value) => {
    if (!value) return null;
    const parsedDate = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const formatDateForApi = (dateValue) => {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";

    return `${padTwoDigits(date.getMonth() + 1)}/${padTwoDigits(date.getDate())}/${date.getFullYear()}`;
};

const formatDateTimeForApi = (dateValue, hourValue, minuteValue) => {
    const formattedDate = formatDateForApi(dateValue);
    if (!formattedDate || !hourValue || !minuteValue) return "";
    return `${formattedDate} ${hourValue}:${minuteValue}:00`;
};

const buildSelectOptions = (data, labelKeys, valueKeys) => {
    if (!data) return [];

    const normalizedData = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.Data)
                ? data.Data
                : Array.isArray(data.result)
                    ? data.result
                    : Array.isArray(data.Result)
                        ? data.Result
                        : Object.values(data).filter((item) => item && typeof item === "object");

    return normalizedData
        .map((item) => {
            const label = String(getFirstDefinedValue(item, labelKeys, "")).trim();
            const value = toOptionValue(getFirstDefinedValue(item, valueKeys, label));

            if (!label && !value) {
                return null;
            }

            return {
                label: label || value,
                value
            };
        })
        .filter(Boolean);
};

const DummyTripSheetEntrySidebar = ({ routeInfo, employee, actions, searchRouteId, onClose, onSidebarConfigChange }) => {
    const userSession = sessionManager.getUserSession();
    const facilityId = userSession?.FacilityID || 1;
    const userId = userSession?.ID || 1;

    // Employee edit state
    const [empStatus, setEmpStatus] = useState("B");
    const [empRemark, setEmpRemark] = useState("");

    // Route edit state
    const [tripType, setTripType] = useState("P");
    const [shiftTime, setShiftTime] = useState("");
    const [employeeCount, setEmployeeCount] = useState("");
    const [vendor, setVendor] = useState("");
    const [vehicleType, setVehicleType] = useState("");
    const [vehicleNo, setVehicleNo] = useState("");
    const [adhocVehicleNo, setAdhocVehicleNo] = useState("");
    const [startDate, setStartDate] = useState(null);
    const [startHour, setStartHour] = useState("");
    const [startMinute, setStartMinute] = useState("");
    const [endDate, setEndDate] = useState(null);
    const [endHour, setEndHour] = useState("");
    const [endMinute, setEndMinute] = useState("");
    const [delayReason, setDelayReason] = useState("");
    const [penalty, setPenalty] = useState("");
    const [zone, setZone] = useState("");
    const [guard, setGuard] = useState("");
    const [driver, setDriver] = useState("");
    const [remarks, setRemarks] = useState("");
    const [tripRemark, setTripRemark] = useState("");
    const [selectedTollIds, setSelectedTollIds] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const lastSidebarConfigRef = useRef(null);

    const resolveEmployeeId = (selectedEmployee) =>
        selectedEmployee?.employeeId ??
        selectedEmployee?.employeeid ??
        selectedEmployee?.EmployeeID ??
        selectedEmployee?.EmployeeId ??
        selectedEmployee?.id ??
        selectedEmployee?.Id ??
        selectedEmployee?.empId ??
        selectedEmployee?.empid ??
        selectedEmployee?.EmpId ??
        selectedEmployee?.empID ??
        selectedEmployee?.ID;

    const routeFacilityId = getFirstDefinedValue(
        routeInfo,
        ["FacilityID", "facilityId", "facilityID"],
        facilityId
    );

    const routeContext = [
        getFirstDefinedValue(routeInfo, ["Facility", "facility", "facilityName"], ""),
        getFirstDefinedValue(routeInfo, ["CabType", "cabType"], "")
    ]
        .filter(Boolean)
        .join(" - ");

    const hourOptions = useMemo(
        () => Array.from({ length: 24 }, (_, index) => ({
            label: padTwoDigits(index),
            value: padTwoDigits(index)
        })),
        []
    );

    const minuteOptions = useMemo(
        () => Array.from({ length: 60 }, (_, index) => ({
            label: padTwoDigits(index),
            value: padTwoDigits(index)
        })),
        []
    );

    const tripTypeOptions = useMemo(
        () => [
            { label: "Pick", value: "P" },
            { label: "Drop", value: "D" }
        ],
        []
    );

    useEffect(() => {
        if (employee) {
            setEmpStatus(employee.trackingStatus || "B");
            setEmpRemark(employee.trackingRemark || "");
        }
    }, [employee]);

    useEffect(() => {
        if (!routeInfo) return;

        const initialTripType = String(
            getFirstDefinedValue(routeInfo, ["tripType", "triptype"], "P")
        ).trim().toUpperCase();
        const initialStartDate = parseDateValue(
            getFirstDefinedValue(routeInfo, ["actVehicleStartTime", "vehicleStartTime"], "")
        );
        const initialEndDate = parseDateValue(
            getFirstDefinedValue(routeInfo, ["actVehicleEndTime", "vehicleEndTime"], "")
        );

        setTripType(initialTripType === "D" ? "D" : "P");
        setShiftTime(toOptionValue(getFirstDefinedValue(routeInfo, ["shiftTime", "ShiftTime"], "")));
        setEmployeeCount(String(getFirstDefinedValue(routeInfo, ["TotalStop", "totalStop"], "")));
        setVendor(toOptionValue(getFirstDefinedValue(routeInfo, ["vendorId", "VendorID", "vendorID"], "")));
        setVehicleType(
            toOptionValue(
                getFirstDefinedValue(routeInfo, ["vehicleType", "vehicleTypeId", "vehicleTypeID"], "")
            )
        );
        setVehicleNo(toOptionValue(getFirstDefinedValue(routeInfo, ["vehicleId", "VehicleId"], "")));
        setAdhocVehicleNo(
            String(getFirstDefinedValue(routeInfo, ["VehicleNumber", "vehicleNo", "VehicleNo"], ""))
        );
        setStartDate(initialStartDate);
        setStartHour(
            normalizeTimeValue(
                getFirstDefinedValue(
                    routeInfo,
                    ["sHH", "startHH"],
                    initialStartDate ? initialStartDate.getHours() : ""
                )
            )
        );
        setStartMinute(
            normalizeTimeValue(
                getFirstDefinedValue(
                    routeInfo,
                    ["sMM", "startMM"],
                    initialStartDate ? initialStartDate.getMinutes() : ""
                )
            )
        );
        setEndDate(initialEndDate);
        setEndHour(
            normalizeTimeValue(
                getFirstDefinedValue(
                    routeInfo,
                    ["eHH", "endHH"],
                    initialEndDate ? initialEndDate.getHours() : ""
                )
            )
        );
        setEndMinute(
            normalizeTimeValue(
                getFirstDefinedValue(
                    routeInfo,
                    ["eMM", "endMM"],
                    initialEndDate ? initialEndDate.getMinutes() : ""
                )
            )
        );
        setDelayReason(toOptionValue(getFirstDefinedValue(routeInfo, ["DelayID", "delayReason", "delayId"], "")));
        setPenalty(toOptionValue(getFirstDefinedValue(routeInfo, ["PenaltyID", "penaltyId", "PenaltyType"], "")));
        setZone(toOptionValue(getFirstDefinedValue(routeInfo, ["ZoneID", "zoneId", "zoneID"], "")));
        setGuard(toOptionValue(getFirstDefinedValue(routeInfo, ["GuardID", "guardId", "guardID"], "")));
        setDriver(toOptionValue(getFirstDefinedValue(routeInfo, ["driver", "driverId", "DriverID"], "")));
        setRemarks(String(getFirstDefinedValue(routeInfo, ["remark", "remarks"], "")));
        setTripRemark(toOptionValue(getFirstDefinedValue(routeInfo, ["TripRemark", "tripRemark"], "")));
    }, [routeInfo]);

    const { data: vendors } = useVendorByFacility(routeFacilityId);
    const { data: shiftTimes } = useShiftByFacilityType(routeFacilityId, tripType, {
        enabled: !!routeFacilityId && !!tripType
    });
    const { data: zones } = useZoneByFac(routeFacilityId, { enabled: !!routeFacilityId });
    const { data: vehicleTypes } = useVehicleType(vendor, { enabled: !!vendor });
    const { data: vehicles } = useVehicleByVendorType(vendor, vehicleType, {
        enabled: !!vendor && !!vehicleType
    });
    const { data: drivers } = useDriverDetails(routeFacilityId, "ALL", {
        enabled: !!routeFacilityId
    });
    const { data: guards } = useGuardDetails(routeFacilityId, "", {
        enabled: !!routeFacilityId
    });
    const { data: penalties } = usePenaltyType(vendor, { enabled: !!vendor });
    const { data: incidents } = useIncidentMaster();
    const { data: tollMaster } = useTollMaster(searchRouteId, userId, "N", {
        enabled: !!searchRouteId
    });
    const { data: selectedTolls } = useTollidbyroute(searchRouteId, {
        enabled: !!searchRouteId
    });

    useEffect(() => {
        if (!selectedTolls) return;

        const tollIds = (Array.isArray(selectedTolls) ? selectedTolls : [])
            .map((item) => toOptionValue(getFirstDefinedValue(item, ["tollid", "TollID", "id"], "")))
            .filter(Boolean);

        setSelectedTollIds(tollIds);
    }, [selectedTolls]);

    const vendorOptions = useMemo(
        () => buildSelectOptions(vendors, ["vendorName", "VendorName", "name"], ["Id", "id", "ID"]),
        [vendors]
    );
    const shiftOptions = useMemo(
        () => buildSelectOptions(shiftTimes, ["ShiftTime", "shiftTime"], ["ShiftTime", "shiftTime"]),
        [shiftTimes]
    );
    const vehicleTypeOptions = useMemo(
        () => buildSelectOptions(vehicleTypes, ["vehicle", "vehicleType"], ["Id", "id", "ID"]),
        [vehicleTypes]
    );
    const vehicleOptions = useMemo(() => {
        const mappedOptions = buildSelectOptions(
            vehicles,
            ["vehicleNo", "VehicleNo"],
            ["Id", "id", "ID"]
        );

        return [
            { label: "Adhoc", value: "-1" },
            ...mappedOptions
        ];
    }, [vehicles]);
    const delayOptions = useMemo(
        () => buildSelectOptions(incidents, ["Incident_type", "IncidentRemark", "remark"], ["id", "Id", "ID"]),
        [incidents]
    );
    const penaltyOptions = useMemo(
        () => buildSelectOptions(penalties, ["HeadName", "remark", "Incident_type"], ["ID", "Id", "id"]),
        [penalties]
    );
    const zoneOptions = useMemo(
        () => buildSelectOptions(zones, ["zone", "Zone"], ["id", "Id", "ID"]),
        [zones]
    );
    const guardOptions = useMemo(
        () => buildSelectOptions(guards, ["IDnName", "Name", "empName"], ["ID", "Id", "id"]),
        [guards]
    );
    const driverOptions = useMemo(
        () => buildSelectOptions(drivers, ["Name", "empName", "IDnName"], ["id", "Id", "ID"]),
        [drivers]
    );
    const tollOptions = useMemo(
        () => buildSelectOptions(tollMaster, ["tollname", "TollName", "name"], ["id", "Id", "ID"]),
        [tollMaster]
    );

    useEffect(() => {
        if (!vehicleNo || vehicleNo === "-1") return;

        const selectedVehicleOption = vehicleOptions.find((option) => option.value === vehicleNo);
        if (selectedVehicleOption?.label) {
            setAdhocVehicleNo((currentValue) => currentValue || selectedVehicleOption.label);
        }
    }, [vehicleNo, vehicleOptions]);

    const handleSaveEmployeeInfo = useCallback(async () => {
        const employeeId = resolveEmployeeId(employee);

        if (!employeeId) {
            toastService.error("Employee details could not be resolved. Please reload the route and try again.");
            return;
        }

        setIsSaving(true);
        try {
            await actions.saveEmpDetInfo({
                routeId: searchRouteId,
                empid: employeeId,
                empCode: employee.empCode || "",
                stopNo: employee.stopNo,
                UserID: userId,
                trackingStatus: empStatus,
                trackingRemark: empRemark.trim(),
                triptype: routeInfo?.tripType || routeInfo?.triptype || "",
                shifttime: routeInfo?.shiftTime || routeInfo?.ShiftTime || ""
            });
            toastService.success("Employee details saved successfully");
            onClose();
        } catch (error) {
            toastService.error("Error saving employee details");
        } finally {
            setIsSaving(false);
        }
    }, [actions, employee, empRemark, empStatus, onClose, routeInfo, searchRouteId, userId]);

    const handleSaveRouteInfo = useCallback(async () => {
        if (!shiftTime || !vendor || !vehicleType || !vehicleNo || !startDate || !endDate || !startHour || !startMinute || !endHour || !endMinute || !zone) {
            toastService.warn("Please fill the required trip details before saving.");
            return;
        }

        const resolvedVehicleNumber =
            vehicleNo === "-1"
                ? adhocVehicleNo.trim()
                : adhocVehicleNo.trim() ||
                  vehicleOptions.find((option) => option.value === vehicleNo)?.label ||
                  String(getFirstDefinedValue(routeInfo, ["VehicleNumber", "vehicleNo", "VehicleNo"], ""));

        if (!resolvedVehicleNumber) {
            toastService.warn("Please enter Vehicle No.");
            return;
        }

        const vehicleStartTime = formatDateTimeForApi(startDate, startHour, startMinute);
        const vehicleEndTime = formatDateTimeForApi(endDate, endHour, endMinute);

        if (!vehicleStartTime || !vehicleEndTime) {
            toastService.warn("Please enter valid start and end times.");
            return;
        }

        setIsSaving(true);
        try {
            await DummyTripSheetEntryService.AddtolltoRoute({
                routeid: searchRouteId,
                tollid: selectedTollIds.length > 0 ? selectedTollIds.join(",") : "0"
            });

            await actions.saveRouteInfo({
                routeId: searchRouteId,
                triptype: tripType,
                shifttime: shiftTime,
                vehicleId: vehicleNo,
                vendorId: vendor,
                vehicleType: vehicleType,
                actStartKm: 0,
                actEndKm: 0,
                approvedKm: 0,
                vehicleStartTime,
                vehicleEndTime,
                guard: 0,
                vehicleNo: resolvedVehicleNumber,
                driver: driver || "0",
                remark: remarks.trim(),
                delayReason: delayReason || "0",
                updatedBy: userId,
                PenaltyType: penalty || "0",
                PenaltyAmount: "0",
                tollRate: 0,
                intersateTax: 0,
                ZoneID: zone,
                RouteNo: getFirstDefinedValue(routeInfo, ["RouteNo", "routeNo"], ""),
                totalStop: employeeCount || "0",
                tripRemark: tripRemark || "0",
                guardid: guard || "0",
                AcTrip: 0,
                GarageKM: 0
            });

            toastService.success("Route details saved successfully");
            onClose();
        } catch (error) {
            toastService.error("Error saving route details");
        } finally {
            setIsSaving(false);
        }
    }, [
        actions,
        adhocVehicleNo,
        delayReason,
        driver,
        employeeCount,
        endDate,
        endHour,
        endMinute,
        guard,
        onClose,
        penalty,
        remarks,
        routeInfo,
        searchRouteId,
        selectedTollIds,
        shiftTime,
        startDate,
        startHour,
        startMinute,
        tripRemark,
        tripType,
        userId,
        vehicleNo,
        vehicleOptions,
        vehicleType,
        vendor,
        zone
    ]);

    const statusOptions = [
        { label: "Boarded", value: "B" },
        { label: "Cancelled", value: "C" },
        { label: "No Show", value: "N" }
    ];

    useEffect(() => {
        if (!onSidebarConfigChange) return;

        const nextConfig = {
            isSaving,
            saveLabel: employee ? (isSaving ? "Saving..." : "Save Status") : (isSaving ? "Updating..." : "Update"),
            onSave: employee ? handleSaveEmployeeInfo : handleSaveRouteInfo
        };

        const previousConfig = lastSidebarConfigRef.current;
        if (
            previousConfig &&
            previousConfig.isSaving === nextConfig.isSaving &&
            previousConfig.saveLabel === nextConfig.saveLabel &&
            previousConfig.onSave === nextConfig.onSave
        ) {
            return;
        }

        lastSidebarConfigRef.current = nextConfig;
        onSidebarConfigChange(nextConfig);
    }, [employee, handleSaveEmployeeInfo, handleSaveRouteInfo, isSaving, onSidebarConfigChange]);

    useEffect(() => {
        if (!onSidebarConfigChange) return;
        return () => {
            lastSidebarConfigRef.current = null;
            onSidebarConfigChange(null);
        };
    }, [onSidebarConfigChange]);

    if (employee) {
        return (
            <div className="p-3 d-flex flex-column h-100">
                <Loader isVisible={isSaving} fullScreen={true} />
                <div className="mb-4">
                    <label className="form-label">Tracking Status</label>
                    <Dropdown
                        value={empStatus}
                        onChange={(e) => setEmpStatus(e.value)}
                        options={statusOptions}
                        className="w-100"
                        placeholder="Select Status"
                    />
                </div>
                <div className="mb-4">
                    <label className="form-label">Tracking Remark</label>
                    <InputText
                        value={empRemark}
                        onChange={(e) => setEmpRemark(e.target.value)}
                        className="w-100"
                        placeholder="Enter tracking remark"
                        maxLength={100}
                    />
                    <small className="text-muted d-block mt-1">Max 100 characters.</small>
                </div>

                {!onSidebarConfigChange && (
                    <div className="mt-auto d-flex gap-2">
                        <Button label="Cancel" className="p-button-outlined p-button-secondary w-50" onClick={onClose} disabled={isSaving} />
                        <Button label={isSaving ? "Saving..." : "Save Status"} className="p-button-success w-50" onClick={handleSaveEmployeeInfo} disabled={isSaving} />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-3 d-flex flex-column h-100 dummy-trip-sidebar-content dummy-trip-route-form">
            <Loader isVisible={isSaving} fullScreen={true} />
            <div className="row g-3 dummy-trip-route-grid">
                <div className="col-12 col-xl-6">
                    <label className="form-label d-block">Trip Type</label>
                    <Dropdown
                        value={tripType}
                        onChange={(e) => setTripType(e.value)}
                        options={tripTypeOptions}
                        className="w-100"
                        placeholder="Select Trip Type"
                    />
                </div>

                <div className="col-12 col-xl-6">
                    <label className="form-label">Shift Time</label>
                    <Dropdown
                        value={shiftTime}
                        onChange={(e) => setShiftTime(e.value)}
                        options={shiftOptions}
                        className="w-100"
                        placeholder="Select Shift Time"
                    />
                </div>

                {routeContext && (
                    <div className="col-12 col-xl-6">
                        <label className="form-label">Route Context</label>
                        <InputText value={routeContext} readOnly className="w-100" />
                    </div>
                )}

                <div className="col-12 col-xl-6">
                    <label className="form-label">Employee Count</label>
                    <InputText
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(e.target.value.replace(/\D/g, ""))}
                        className="w-100"
                        maxLength={2}
                        placeholder="Enter employee count"
                    />
                </div>

                <div className="col-12 col-xl-6">
                    <label className="form-label">Vendor</label>
                    <Dropdown
                        value={vendor}
                        onChange={(e) => {
                            setVendor(e.value);
                            setVehicleType("");
                            setVehicleNo("");
                            setAdhocVehicleNo("");
                        }}
                        options={vendorOptions}
                        className="w-100"
                        placeholder="Select Vendor"
                        filter
                    />
                </div>

                <div className="col-12 col-xl-6">
                    <label className="form-label">Vehicle Type</label>
                    <Dropdown
                        value={vehicleType}
                        onChange={(e) => {
                            setVehicleType(e.value);
                            setVehicleNo("");
                            setAdhocVehicleNo("");
                        }}
                        options={vehicleTypeOptions}
                        className="w-100"
                        placeholder="Select Vehicle Type"
                        disabled={!vendor}
                    />
                </div>

                <div className="col-12 col-xl-6">
                    <label className="form-label">Vehicle No</label>
                    <Dropdown
                        value={vehicleNo}
                        onChange={(e) => {
                            setVehicleNo(e.value);
                            const selectedVehicle = vehicleOptions.find((option) => option.value === e.value);
                            if (selectedVehicle?.value !== "-1") {
                                setAdhocVehicleNo(selectedVehicle?.label || "");
                            }
                        }}
                        options={vehicleOptions}
                        className="w-100"
                        placeholder="Select Vehicle No"
                        disabled={!vehicleType}
                        filter
                    />
                </div>

                <div className="col-12 col-xl-6">
                    <label className="form-label">Vehicle No Text</label>
                    <InputText
                        value={adhocVehicleNo}
                        onChange={(e) => setAdhocVehicleNo(e.target.value)}
                        className="w-100"
                        placeholder="Enter vehicle no"
                    />
                </div>

                <div className="col-12 col-xl-6">
                    <label className="form-label">Start Time</label>
                    <div className="dummy-trip-time-group">
                        <Calendar
                            value={startDate}
                            onChange={(e) => setStartDate(e.value)}
                            className="w-100"
                            dateFormat="mm/dd/yy"
                            placeholder="Start Date"
                            showIcon
                        />
                        <Dropdown
                            value={startHour}
                            onChange={(e) => setStartHour(e.value)}
                            options={hourOptions}
                            placeholder="HH"
                            className="dummy-trip-time-select"
                        />
                        <Dropdown
                            value={startMinute}
                            onChange={(e) => setStartMinute(e.value)}
                            options={minuteOptions}
                            placeholder="MM"
                            className="dummy-trip-time-select"
                        />
                    </div>
                </div>

                <div className="col-12 col-xl-6">
                    <label className="form-label">End Time</label>
                    <div className="dummy-trip-time-group">
                        <Calendar
                            value={endDate}
                            onChange={(e) => setEndDate(e.value)}
                            className="w-100"
                            dateFormat="mm/dd/yy"
                            placeholder="End Date"
                            showIcon
                        />
                        <Dropdown
                            value={endHour}
                            onChange={(e) => setEndHour(e.value)}
                            options={hourOptions}
                            placeholder="HH"
                            className="dummy-trip-time-select"
                        />
                        <Dropdown
                            value={endMinute}
                            onChange={(e) => setEndMinute(e.value)}
                            options={minuteOptions}
                            placeholder="MM"
                            className="dummy-trip-time-select"
                        />
                    </div>
                </div>

                <div className="col-12 col-xl-6">
                    <label className="form-label">Delay Reason</label>
                    <Dropdown
                        value={delayReason}
                        onChange={(e) => setDelayReason(e.value)}
                        options={delayOptions}
                        className="w-100"
                        placeholder="Select Delay Reason"
                        filter
                    />
                </div>

                <div className="col-12 col-xl-6">
                    <label className="form-label">Penalty Type</label>
                    <Dropdown
                        value={penalty}
                        onChange={(e) => setPenalty(e.value)}
                        options={penaltyOptions}
                        className="w-100"
                        placeholder="Select Penalty Type"
                        filter
                    />
                </div>

                <div className="col-12 col-xl-6">
                    <label className="form-label">Zone</label>
                    <Dropdown
                        value={zone}
                        onChange={(e) => setZone(e.value)}
                        options={zoneOptions}
                        className="w-100"
                        placeholder="Select Zone"
                        filter
                    />
                </div>

                <div className="col-12 col-xl-6">
                    <label className="form-label">Toll</label>
                    <MultiSelect
                        value={selectedTollIds}
                        onChange={(e) => setSelectedTollIds(e.value)}
                        options={tollOptions}
                        className="w-100"
                        placeholder="Select Toll"
                        filter
                        display="chip"
                        maxSelectedLabels={2}
                    />
                </div>

                <div className="col-12 col-xl-6">
                    <label className="form-label">Guard</label>
                    <Dropdown
                        value={guard}
                        onChange={(e) => setGuard(e.value)}
                        options={guardOptions}
                        className="w-100"
                        placeholder="Select Guard"
                        filter
                    />
                </div>

                <div className="col-12 col-xl-6">
                    <label className="form-label">Driver</label>
                    <Dropdown
                        value={driver}
                        onChange={(e) => setDriver(e.value)}
                        options={driverOptions}
                        className="w-100"
                        placeholder="Select Driver"
                        filter
                    />
                </div>

                <div className="col-12">
                    <label className="form-label">Remarks</label>
                    <InputTextarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        rows={3}
                        className="w-100"
                        placeholder="Enter remarks"
                        maxLength={100}
                    />
                    <small className="text-muted d-block mt-1">Max 100 characters.</small>
                </div>
            </div>

            {!onSidebarConfigChange && (
                <div className="mt-4 d-flex gap-2 pb-3">
                    <Button label="Cancel" className="p-button-outlined p-button-secondary w-50" onClick={onClose} disabled={isSaving} />
                    <Button label={isSaving ? "Updating..." : "Update"} className="p-button-primary w-50" onClick={handleSaveRouteInfo} disabled={isSaving} />
                </div>
            )}
        </div>
    );
};

export default DummyTripSheetEntrySidebar;
