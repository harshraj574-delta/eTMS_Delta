import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import DummyTripSheetEntryDesktop from "./DummyTripSheetEntryDesktop";
import DummyTripSheetEntryMobile from "./DummyTripSheetEntryMobile";
import useIsMobile from "./common/useIsMobile";
import { useDummyTripSheetEntryLogic } from "../hooks/compliance/useDummyTripSheetEntryLogic";
import { toastService } from "../services/toastService";
import sessionManager from "../utils/SessionManager";

const DummyTripSheetEntry = () => {
    const isMobile = useIsMobile();
    const facilityId = sessionManager.getUserSession()?.FacilityID || 1;
    const [shiftDate, setShiftDate] = useState(new Date());
    const [tripId, setTripId] = useState("");
    const [searchRouteId, setSearchRouteId] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchAttemptCount, setSearchAttemptCount] = useState(0);
    const handledSearchAttemptRef = useRef(0);
    
    // Calculate Route ID Prefix based on Date and Facility
    const routePrefix = React.useMemo(() => {
        if (!shiftDate) return "";
        const dt1 = new Date("01/01/2010");
        const dt1Utc = Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate());
        const dt2Utc = Date.UTC(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate());
        const diffTime = Math.abs(dt2Utc - dt1Utc);
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        let daysStr = String(days).padStart(4, '0');
        let facStr = String(facilityId).padStart(2, '0'); // Pad facility ID (e.g., 1 -> 01)
        return `${facStr}${daysStr}R`;
    }, [shiftDate, facilityId]);

    const formatRouteId = (prefix, id) => {
        if (!prefix || !id) return "";
        let idStr = String(id).padStart(5, '0');
        return `${prefix}${idStr}`;
    };

    const draftRouteId = useMemo(
        () => formatRouteId(routePrefix, tripId.trim()),
        [routePrefix, tripId]
    );

    const { data, isLoading, actions, errors } = useDummyTripSheetEntryLogic(searchRouteId);

    const handleSearch = useCallback(() => {
        if (!shiftDate) {
            toastService.warn("Please select a Shift Date");
            return;
        }
        if (!tripId.trim()) {
            toastService.warn("Please enter a Trip Id");
            return;
        }
        if (searchRouteId === draftRouteId) {
            actions.refetchAll();
        } else {
            setSearchRouteId(draftRouteId);
        }
        setSearchAttemptCount((currentCount) => currentCount + 1);
        setIsSidebarOpen(false);
    }, [actions, draftRouteId, searchRouteId, shiftDate, tripId]);

    useEffect(() => {
        if (!searchRouteId || !searchAttemptCount || isLoading) {
            return;
        }

        if (handledSearchAttemptRef.current === searchAttemptCount) {
            return;
        }

        if (!Array.isArray(data?.routeInfo)) {
            return;
        }

        handledSearchAttemptRef.current = searchAttemptCount;

        if (data.routeInfo.length > 0) {
            return;
        }

        toastService.warn("No Record Found!!!");
    }, [data?.employees, data?.routeInfo, isLoading, searchAttemptCount, searchRouteId]);

    const commonProps = {
        shiftDate,
        setShiftDate,
        tripId,
        setTripId,
        handleSearch,
        data,
        isLoading,
        actions,
        searchRouteId,
        isSidebarOpen,
        setIsSidebarOpen,
        routePrefix
    };

    if (isMobile) {
        return <DummyTripSheetEntryMobile {...commonProps} />;
    }

    return <DummyTripSheetEntryDesktop {...commonProps} />;
};

export default DummyTripSheetEntry;
