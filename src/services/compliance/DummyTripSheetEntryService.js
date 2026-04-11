import { api } from "../axios/api";

class DummyTripSheetEntry {
    async GetDummyRouteInfo(params){
        try {
            const response = await api.post("/GetDummyRouteInfo", {
                routeids: params.routeids
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        } catch (error) {
            console.error("Error fetching dummy route info data:", error);
            throw error;
        }
    }

    async SaveDummyRouteInfo(params){
        try {
            const response = await api.post("/SaveDummyRouteInfo", {
                triptype: params.triptype,
                shifttime: params.shifttime,
                vehicleId: params.vehicleId,
                vendorId: params.vendorId,
                vehicleType: params.vehicleType,
                actStartKm: params.actStartKm,
                actEndKm: params.actEndKm,
                approvedKm: params.approvedKm,
                vehicleStartTime: params.vehicleStartTime,
                vehicleEndTime: params.vehicleEndTime,
                guard: params.guard,
                vehicleNo: params.vehicleNo,
                driver: params.driver,
                remark: params.remark,
                routeId: params.routeId,
                delayReason: params.delayReason,
                updatedBy: params.updatedBy,
                PenaltyType: params.PenaltyType,
                PenaltyAmount: params.PenaltyAmount,
                tollRate: params.tollRate,
                intersateTax: params.intersateTax,
                ZoneID: params.ZoneID,
                RouteNo: params.RouteNo,
                totalStop: params.totalStop,
                tripRemark: params.tripRemark,
                guardid: params.guardid,
                AcTrip: params.AcTrip,
                GarageKM: params.GarageKM
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        } catch (error) {
            console.error("Error saving dummy route info data:", error);
            throw error;
        }
    }

    async CancelTripSheet(params){
        try {
            const response = await api.post("/CancelTripSheet", {
                routeids: params.routeids
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        } catch (error) {
            console.error("Error cancelling trip sheet data:", error);
            throw error;
        }
    }
    
    async GetVehicleTagNumbers(params){
        try {
            const response = await api.post("/GetVehicleTagNumbers", {
                facilityid: params.facilityid
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        } catch (error) {
            console.error("Error fetching vehicle tag numbers data:", error);
            throw error;
        }
    }

    async GetVehicleInfoByRouteNo(params){
        try {
            const response = await api.post("/GetVehicleInfoByRouteNo", {
                routeno: params.routeno,
                facilityid: params.facilityid
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        } catch (error) {
            console.error("Error fetching vehicle info by route no data:", error);
            throw error;
        }
    }

    async GetDummyEmpByRoute(params){
        try {
            const response = await api.post("/GetDummyEmpByRoute", {
                routeids: params.routeids
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        } catch (error) {
            console.error("Error fetching dummy emp by route data:", error);
            throw error;
        }
    }

    async EmpSearch(params){
        try{
            const response = await api.post("/EmpSearch", {
                locationid: params.locationid,
                empidname: params.empidname,
                IsAdmin: params.IsAdmin
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        }catch(error){
            console.error("Error fetching employee data:", error);
            throw error;
        }
    }

    async AddEmpToDummyRoute(params){
        try{
            const response = await api.post("/AddEmpToDummyRoute", {
                empid: params.empid,
                stopNo: params.stopNo,
                UserID: params.UserID,
                addresstype: params.addresstype,
                routeId: params.routeId
            })
            const responseData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
            const result =
                Array.isArray(responseData)
                    ? responseData[0]?.result ?? responseData[0]?.Result
                    : responseData?.result ?? responseData?.Result;

            if (result !== undefined && Number(result) === 0) {
                throw new Error("Employee could not be added to the route.");
            }

            return responseData;
        }catch(error){
            console.error("Error adding emp to dummy route data:", error);
            throw error;
        }
    }

    async DeleteEmpFromRoute(params){
        try{
            const response = await api.post("/DeleteEmpFromRoute", {
                routeId: params.routeId,
                empid: params.empid
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        }catch(error){
            console.error("Error deleting emp from route data:", error);
            throw error;
        }
    }

    async SaveDummyRouteDetInfo(params){
        try{
            const response = await api.post("/SaveDummyRouteDetInfo", {
                empid: params.empid,
                stopNo: params.stopNo,
                UserID: params.UserID,
                trackingRemark: params.trackingRemark,
                routeId: params.routeId,
                trackingStatus: params.trackingStatus,
                triptype: params.triptype,
                shifttime: params.shifttime
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        }catch(error){
            console.error("Error saving dummy route det info data:", error);
            throw error;
        }
    }

    async SelectZoneByFac(params){
        try{
            const response = await api.post("/SelectZoneByFac", {
                facilityid: params.facilityid
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        }catch(error){
            console.error("Error selecting zone by fac data:", error);
            throw error;
        }
    }

    async GetGuardDetails(params){
        try{
            const response = await api.post("/GetGuardDetails", {
                FacilityID: params.FacilityID,
                SearchValue: params.SearchValue
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        }catch(error){
            console.error("Error fetching guard details data:", error);
            throw error;
        }
    }

    async GetVendorByFacility(params){
        try{
            const response = await api.post("/GetVendorByFacility", {
                facilityid: params.facilityid
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        }catch(error){
            console.error("Error fetching vendor by facility data:", error);
            throw error;
        }
    }

    async SelectVehicleType(params){
        try{
            const response = await api.post("/SelectVehicleType", {
                vendorid: params.vendorid
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        }catch(error){
            console.error("Error selecting vehicle type data:", error);
            throw error;
        }
    }

    async GetDriverDetails(params){
        try{
            const response = await api.post("/GetDriverDetails", {
                facid: params.facid,
                type: params.type
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        }catch(error){
            console.error("Error fetching driver details data:", error);
            throw error;
        }
    }

    async GetShiftByFacilityType(params){
        try{
            const response = await api.post("/GetShiftByFacilityType", {
                facid: params.facid,
                type: params.type
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        }catch(error){
            console.error("Error fetching shift by facility type data:", error);
            throw error;
        }
    }

    async SelectTollMaster(params){
        try{
            const response = await api.post("/SelectTollMaster", {
                routeid: params.routeid,
                Employeeid: params.Employeeid,
                AllToll: params.AllToll
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        }catch(error){
            console.error("Error selecting toll master data:", error);
            throw error;
        }
    }

    async GetPenaltyType(params){
        try{
            const response = await api.post("/GetPenaltyType", {
                vendorid: params.vendorid
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        }catch(error){
            console.error("Error fetching penalty type data:", error);
            throw error;
        }
    }

    async GetVehicleByVendorType(params){
        try{
            const response = await api.post("/GetVehicleByVendorType", {
                vendorid: params.vendorid,
                vehicletype: params.vehicletype
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        }catch(error){
            console.error("Error fetching vehicle by vendor type data:", error);
            throw error;
        }
    }

    async GetIncidentMaster(params){
        try{
            const response = await api.post("/GetIncidentMaster", {
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        }catch(error){
            console.error("Error fetching incident master data:", error);
            throw error;
        }
    }

    async GetTripRemark(params){
        try{
            const response = await api.post("/GetTripRemark", {
                
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        }catch(error){
            console.error("Error fetching trip remark data:", error);
            throw error;
        }
    }

    async AddtolltoRoute(params){
        try{
            const response = await api.post("/AddtolltoRoute", {
                routeid: params.routeid,
                tollid: params.tollid
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        }catch(error){
            console.error("Error adding toll to route data:", error);
            throw error;
        }
    }

    async SelectTollidbyroute(params){
        try{
            const response = await api.post("/SelectTollidbyroute", {
                routeids: params.routeids
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        }catch(error){
            console.error("Error selecting toll id by route data:", error);
            throw error;
        }
    }

    async GetISAdmin(params){
        try{
            const response = await api.post("/GetISAdmin", {
                userid: params.userid
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        }catch(error){
            console.error("Error fetching is admin data:", error);
            throw error;
        }
    }

    async GetLockDetails(params){
        try{
            const response = await api.post("/GetLockDetails", {
                facID: params.facID
            })
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        }catch(error){
            console.error("Error fetching lock details data:", error);
            throw error;
        }
    }
}

export default new DummyTripSheetEntry();
