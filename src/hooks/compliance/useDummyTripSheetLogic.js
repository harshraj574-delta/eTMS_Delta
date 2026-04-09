import { useState, useMemo, useEffect } from 'react';
import { toastService } from '../../services/toastService';
import sessionManager from '../../utils/SessionManager';
import {
    useFacilitiesQuery,
    useCabTypesQuery,
    useShiftsQuery,
    useEmpSearchMutation,
    useGetEmployeeMutation,
    useGetEmpByRouteMutation,
    useGetRoutesDummyMatchMutation,
    useGetTransactionIdMutation,
    useGenerateDummySheetsMutation,
    useGetDummyRoutesDetailsMutation
} from './useDummyTripSheetQueries';

export const useDummyTripSheetLogic = () => {
    // Session Data
    const userSession = sessionManager.getUserSession();
    const userId = userSession?.ID || sessionStorage.getItem('ID') || '1'; // Defaulting to 1 to prevent null queries during manual test jumps if session manager format differs

    // Filter Controls
    const [actionType, setActionType] = useState('Blank'); // 'Blank' or 'NonBlank'
    const [startDate, setStartDate] = useState(new Date());
    const [selectedFacility, setSelectedFacility] = useState(0);
    const [tripType, setTripType] = useState(null); // changed to null for validation
    const [selectedShift, setSelectedShift] = useState(0);
    const [selectedCabType, setSelectedCabType] = useState('0');
    
    // Generation Controls
    const [noOfSheets, setNoOfSheets] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [routeIdQuery, setRouteIdQuery] = useState('');

    // State for employee datatables
    const [searchedEmployees, setSearchedEmployees] = useState([]); // List of employees matching search
    const [addedEmployees, setAddedEmployees] = useState([]);     // Employees strictly added for the dummy sheet

    // Validation state
    // (Removed errors object in favor of toast notifications)

    // 1. Queries
    const { data: facilities = [], isLoading: loadingFacilities } = useFacilitiesQuery(userId);
    const { data: cabTypes = [], isLoading: loadingCabTypes } = useCabTypesQuery(selectedFacility, selectedFacility !== 0);
    
    // Determine the 'weekday' flag as per ASPX logic
    const weekdayFlag = useMemo(() => {
        if(!startDate) return 0;
        const day = startDate.getDay();
        return (day === 0 || day === 6) ? 1 : 0; // 0=Sunday, 6=Saturday -> flag 1
    }, [startDate]);

    const { data: shifts = [], isLoading: loadingShifts } = useShiftsQuery(
        selectedFacility, 0, tripType, weekdayFlag, selectedFacility !== 0
    );

    // Removed CabType auto-selection to enforce manual selection as per requirement

    // Cleanup logic on actionType switch
    useEffect(() => {
        if (actionType === 'Blank') {
            setSearchQuery('');
            setRouteIdQuery('');
            setSearchedEmployees([]);
            setAddedEmployees([]);
        } else {
            setNoOfSheets('');
            setAddedEmployees([]);
        }
    }, [actionType]);

    // 2. Mutations
    const searchEmpMutation = useEmpSearchMutation();
    const getEmpMutation = useGetEmployeeMutation();
    const getEmpRouteMutation = useGetEmpByRouteMutation();
    const dummyMatchMutation = useGetRoutesDummyMatchMutation();
    const transIdMutation = useGetTransactionIdMutation();
    const generateSheetsMutation = useGenerateDummySheetsMutation();
    const getDummyRouteDetailsMutation = useGetDummyRoutesDetailsMutation();

    // 3. Handlers
    
    // Search by Name or ID
    const handleSearchEmployee = async () => {
        if (!searchQuery.trim()) {
            toastService.warn("Please enter Employee Name or ID to search.");
            return;
        }
        const userLocation = sessionManager.getUserSession()?.locationId || 0;
        
        try {
            const response = await searchEmpMutation.mutateAsync({
                locationid: userLocation,
                empidname: searchQuery,
                IsAdmin: 'N'
            });
            const data = Array.isArray(response) ? response : (response?.data || []);
            
            if (data.length === 0) {
                toastService.warn("No Record Found!!!");
                setSearchedEmployees([]);
            } else {
                setSearchedEmployees(data);
            }
        } catch (e) {
            toastService.error("Error searching employee.");
        }
    };

    // Search By Route ID wrapper
    const constructRouteId = () => {
        let routeno = '';
        const dt1 = new Date(2010, 0, 1);
        const dt2 = startDate || new Date();
        const diffTime = Math.abs(dt2 - dt1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const daysStr = String(diffDays).padStart(4, '0');
        const facIdStr = String(selectedFacility).padStart(2, '0');
        
        routeno = `${facIdStr}${daysStr}R`;
        
        let count = routeIdQuery.trim().length;
        let txtInput = routeIdQuery.trim();
        
        if (txtInput.toUpperCase().endsWith("S")) {
            count = count - 1;
        }
        for (let i = 1; i <= 4 - count; i++) {
            routeno += "0";
        }
        routeno += txtInput;
        return routeno;
    };

    const handleSearchRouteId = async () => {
        if (!routeIdQuery.trim()) {
            toastService.warn("Please enter Route ID to search.");
            return;
        }
        
        try {
            const finalRouteId = routeIdQuery.length > 3 ? routeIdQuery : constructRouteId();
            
            const response = await getEmpRouteMutation.mutateAsync(finalRouteId);
            const data = Array.isArray(response) ? response : (response?.data || []);

            if (data.length === 0) {
                toastService.warn("No Record Found!");
                setSearchedEmployees([]);
            } else {
                setSearchedEmployees(data);
            }
        } catch (e) {
            toastService.error("Error searching route.");
        }
    };

    // Adding an Employee to the active "Dummy Sheet" array
    // const handleAddEmployee = async (empData) => {
    //     const _id = empData.Id || empData.employeeId;
        
    //     const isExists = addedEmployees.some(emp => emp.ID === _id);
    //     if (isExists) {
    //         toastService.warn("Employee already exists.");
    //         return;
    //     }

    //     try {
    //         const response = await getEmpMutation.mutateAsync(_id);
    //         const data = Array.isArray(response) ? response : (response?.data || []);
            
    //         if (data && data.length > 0) {
    //             const result = data[0];
    //             const newEmp = {
    //                 stopNo: addedEmployees.length + 1,
    //                 ID: _id,
    //                 empCode: result.empCode,
    //                 empName: result.empName,
    //                 Gender: result.Gender || empData.Gender,
    //                 Address: result.address || empData.Address || empData.address || "Adhoc Pickup",
    //                 ETA: '' // Add default blank ETA like c#
    //             };
    //             setAddedEmployees(prev => [...prev, newEmp]);
    //             // clear search grid visually matching original behaviour
    //             setSearchedEmployees([]);
    //             setSearchQuery('');
    //         }
    //     } catch (e) {
    //         toastService.error("Failed to add employee.");
    //     }
    // };

    const handleAddEmployee = async (empData) => {
    const empId =
        empData?.Id ??
        empData?.ID ??
        empData?.id ??
        empData?.employeeId;

    if (!empId) {
        console.error("Employee ID missing in row data:", empData);
        toastService.error("Could not identify selected employee.");
        return;
    }

    const isExists = addedEmployees.some(
        (emp) => String(emp.ID) === String(empId)
    );

    if (isExists) {
        toastService.warn("Employee already exists.");
        return;
    }

    try {
        const response = await getEmpMutation.mutateAsync(empId);
        const result = Array.isArray(response) ? response[0] : response;

        if (!result) {
            console.error("GetEmployee returned empty:", response);
            toastService.warn("Employee details not found.");
            return;
        }

        const newEmp = {
            stopNo: addedEmployees.length + 1,
            ID: empId,
            empCode: result.empCode,
            empName: result.empName,
            Gender: result.Gender || empData.Gender || "",
            Address:
                result.address ||
                result.Address ||
                empData.Address ||
                empData.address ||
                "Adhoc Pickup",
            ETA: ""
        };

        setAddedEmployees((prev) => [...prev, newEmp]);
        setSearchedEmployees([]);
        setSearchQuery("");
    } catch (e) {
        console.error("handleAddEmployee error:", e);
        toastService.error("Failed to add employee.");
    }
};

    const handleBulkAddEmployees = async (selectedEmps) => {
        if (!selectedEmps || selectedEmps.length === 0) {
            toastService.warn("Select at least one employee to add.");
            return;
        }

        let newEmps = [...addedEmployees];
        let someExists = false;
        
        for (const emp of selectedEmps) {
            const _id = emp.Id || emp.employeeId;
            if (newEmps.some(e => e.ID === _id)) {
                someExists = true;
                continue;
            }
            
            try {
                const response = await getEmpMutation.mutateAsync(_id);
                const data = Array.isArray(response) ? response : (response?.data || []);
                if (data && data.length > 0) {
                    const result = data[0];
                    newEmps.push({
                        stopNo: newEmps.length + 1,
                        ID: _id,
                        empCode: result.empCode,
                        empName: result.empName,
                        Gender: result.Gender || emp.Gender,
                        Address: result.address || "Adhoc PickUp",
                        ETA: ''
                    });
                }
            } catch (e) {
                console.error("Failed to fetch bulk employee", e);
            }
        }

        setAddedEmployees(newEmps);
        setSearchedEmployees([]);
        
        if(someExists) {
            toastService.warn("Some employees were already added.");
        }
    };

    // Validation for generation
    const validateGeneration = () => {
        if (!startDate) {
            toastService.error('Start Date Required');
            return false;
        }
        if (selectedFacility === 0 || selectedFacility === "0" || !selectedFacility) {
            toastService.error('Please select Facility');
            return false;
        }
        if (tripType === null || tripType === undefined) {
            toastService.error('Please select Trip Type');
            return false;
        }
        if (selectedShift === 0 || selectedShift === "0" || selectedShift === null || selectedShift === undefined) {
            toastService.error('Please select ShiftTime');
            return false;
        }
        if (selectedCabType === 0 || selectedCabType === "0" || !selectedCabType) {
            toastService.error('Please select Cab Type');
            return false;
        }
        
        if (actionType === 'Blank') {
            if (!noOfSheets) {
                toastService.error('Enter No of Sheets');
                return false;
            } else if (isNaN(noOfSheets) || parseInt(noOfSheets) < 1 || parseInt(noOfSheets) > 100) {
                toastService.error('The value must be from 1 to 100!');
                return false;
            }
        }

        return true;
    };

    const [pdfData, setPdfData] = useState(null);
    const [isPdfModalVisible, setIsPdfModalVisible] = useState(false);

    // The core generation function (opening the manual PDF viewer popup)
    const handleGenerate = async () => {
        if (!validateGeneration()) return;
        
        // Blank Sheet Flow
        if (actionType === 'Blank') {
            try {
                const transId = await transIdMutation.mutateAsync();
                const formatForApi = `${startDate.getFullYear()}-${String(startDate.getMonth()+1).padStart(2,'0')}-${String(startDate.getDate()).padStart(2,'0')}`;
                
                // 1. Generate Dummy Sheets from DB
                const generationResponse = await generateSheetsMutation.mutateAsync({
                    sDate: formatForApi,
                    FacilityID: selectedFacility,
                    TripType: tripType,
                    Shift: selectedShift,
                    Action: actionType,
                    NoOfSheets: parseInt(noOfSheets),
                    GeneratedBy: userId,
                    CabType: selectedCabType,
                    EmpIDs: "",
                    transactionid: transId
                });

                const routeData = Array.isArray(generationResponse) ? generationResponse : (generationResponse?.data || []);
                
                if (routeData.length === 0) {
                     toastService.warn("Dummy sheet count reached to Maximum limit (1000) for selected date and facility, or no routes available.");
                     return;
                }

                // 2. We don't need to fetch employees for entirely Blank, but for consistency with NonBlank and the ASPX code structure:
                const sheetsResponses = routeData.map(route => ({
                    RouteID: route.RouteID,
                    facilityName: route.facilityName || facilities.find(f => f.Id == selectedFacility)?.facilityName,
                    workingDate: route.workingDate || formatForApi,
                    shiftDate: route.shiftDate || formatForApi,
                    Shift: route.Shift || selectedShift,
                    CabType: route.CabType || selectedCabType,
                    TripType: route.TripType || tripType,
                    employees: []
                }));

                setPdfData(sheetsResponses);
                setIsPdfModalVisible(true);
            } catch (e) {
                console.error(e);
                toastService.error("Generation failed");
            }
        }
    };

    // The Generate button for NonBlank logic inside the grid footer
    const handleGenerateEmpDummy = async () => {
        if (!validateGeneration()) return;
        if (addedEmployees.length === 0) {
            toastService.warn("No employees added to generate sheet");
            return;
        }

        try {
            // Check dummy match
            const formatForApi = `${startDate.getFullYear()}-${String(startDate.getMonth()+1).padStart(2,'0')}-${String(startDate.getDate()).padStart(2,'0')}`;

            const matchRes = await dummyMatchMutation.mutateAsync({
                RouteID: routeIdQuery || '',
                DummyRouteId: '',
                ShiftDate: formatForApi,
                Shift: selectedShift,
                TripType: tripType,
                FacId: selectedFacility
            });

            if (routeIdQuery && matchRes === 0) {
               toastService.warn("Entered trip details is not matching with dummy trip details.");
               return;
            }

            const transId = await transIdMutation.mutateAsync();
            const empIdsCsv = addedEmployees.map(e => e.ID).join(',');

            // 1. Generate NonBlank dummy sheet
            const generationResponse = await generateSheetsMutation.mutateAsync({
                sDate: formatForApi,
                FacilityID: selectedFacility,
                TripType: tripType,
                Shift: selectedShift,
                Action: actionType,
                NoOfSheets: 1,
                GeneratedBy: userId,
                CabType: selectedCabType,
                EmpIDs: empIdsCsv,
                transactionid: transId
            });

            const routeData = Array.isArray(generationResponse) ? generationResponse : (generationResponse?.data || []);

            if (routeData.length === 0) {
                 toastService.warn("No route data generated.");
                 return;
            }

            // 2. Fetch details for each route
            const sheetsResponses = [];
            for(let route of routeData) {
                const finalRouteId = String(route.RouteID || '').replace(/\*/g, '');
                
                const empsRes = await getDummyRouteDetailsMutation.mutateAsync(finalRouteId);
                const emps = Array.isArray(empsRes) ? empsRes : (empsRes?.data || []);

                sheetsResponses.push({
                    RouteID: route.RouteID,
                    facilityName: route.facilityName || facilities.find(f => f.Id == selectedFacility)?.facilityName,
                    workingDate: route.workingDate || formatForApi,
                    shiftDate: route.shiftDate || formatForApi,
                    Shift: route.Shift || selectedShift,
                    CabType: route.CabType || selectedCabType,
                    TripType: route.TripType || tripType,
                    employees: emps
                });
            }

            setPdfData(sheetsResponses);
            setIsPdfModalVisible(true);
            
            // Clean up state
            setAddedEmployees([]);
        } catch (error) {
            console.error(error);
            toastService.error("Generation failed");
        }
    };

    return {
        // Options Data
        facilities,
        cabTypes,
        shifts,
        
        // Form Fields
        actionType, setActionType,
        startDate, setStartDate,
        selectedFacility, setSelectedFacility,
        tripType, setTripType,
        selectedShift, setSelectedShift,
        selectedCabType, setSelectedCabType,
        noOfSheets, setNoOfSheets,
        searchQuery, setSearchQuery,
        routeIdQuery, setRouteIdQuery,
        
        // Data grids
        searchedEmployees, setSearchedEmployees,
        addedEmployees, setAddedEmployees,
        
        // Meta
        isPdfModalVisible, setIsPdfModalVisible,
        pdfData,

        // Actions
        actions: {
            handleSearchEmployee,
            handleSearchRouteId,
            handleAddEmployee,
            handleBulkAddEmployees,
            handleGenerate,
            handleGenerateEmpDummy
        },
        
        // Loading States
        isDataLoading: loadingFacilities || loadingCabTypes || loadingShifts || 
                       searchEmpMutation.isPending || dummyMatchMutation.isPending || 
                       transIdMutation.isPending
    };
};
