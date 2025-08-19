import { api } from "../axios/api";

class VendorAllocationService {
    async GetShiftByFacilityType(params) {
        try {
            const response = await api.post("/GetShiftByFacilityType", {
                facid: params.facid,
                type: params.type,
            });
            //console.log("GetShiftByFacilityType response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error in GetShiftByFacilityType:", error);
            throw error;
        }
    }
    async GetRoutesByOrder(params) {
        try {
            const response = await api.post("/GetRoutesByOrder", {
                sDate: params.sDate,
                eDate: params.eDate,
                FacilityID: params.FacilityID,
                TripType: params.TripType,
                Shifttimes: params.Shifttimes,
                OrderBy: params.OrderBy,
                Direction: params.Direction,
                Routeid: params.Routeid,
                occ_seater: params.occ_seater,
            })
            //console.log("GetRoutesByOrder Response", response);
            return response.data;
        } catch (error) {
            console.error("Error in GetRoutesByOrder:", error);
            throw error;
        }
    }
    async GetRoutesStatistics(params) {
        try {
            const response = await api.post("/GetRoutesStatistics", {
                sdate: params.sdate,
                edate: params.edate,
                triptype: params.triptype,
                facilityid: params.facilityid,
                shifttime: params.shifttime,
            })
            //console.log("GetRoutesStatistics Response", response);
            return response.data;
        } catch (error) {
            console.error("Error in GetRoutesStatistics:", error);
            throw error;
        }
    }
    async GetAssignedVendorCount(params) {
        try {
            const response = await api.post("/GetAssignedVendorCount", {
                sDate: params.sdate,
                eDate: params.edate,
                facilityid: params.facilityid,
                triptype: params.triptype,
                shifttimes: params.shifttimes,

            })
            //console.log("GetAssignedVendorCount Response", response);
            return response.data;
        } catch (error) {
            console.error("Error in GetAssignedVendorCount:", error);
            throw error;
        }
    }
    async SelectVehicleType(params) {
        try {
            const response = await api.post("/SelectVehicleType", {
                vendorid: params.vendorid,
            })
            //console.log("SelectVehicleType Response", response);
            return response.data;
        } catch (error) {
            console.error("Error in SelectVehicleType:", error);
            throw error;
        }
    }
    async GetVehicleByType(params) {
        try {
            const response = await api.post("/GetVehicleByType", {
                vehicletypeid: params.vehicletypeid,
            })
            //console.log("GetVehicleByType Response", response);
            return response.data;
        } catch (error) {
            console.error("Error in GetVehicleByType:", error);
            throw error;
        }
    }
    async AssignStickerToRoutes(params) {
        try {
            const response = await api.post("/AssignStickerToRoutes", {
                RouteID: params.RouteID,
                VendorID: params.VendorID,
                vehicletype: params.vehicletype,
                vehicleID: params.vehicleID,
                vehicleno: params.vehicleno,
                drivername: params.drivername,
                driverContact: params.driverContact,
                actTotalstops: params.actTotalstops,
                actStarttime: params.actStarttime,
                actEndtime: params.actEndtime,
                routeno: params.routeno,
                isActual: params.isActual,
                delayreason: params.delayreason,
                userid: params.userid,
                GuardID: params.GuardID,
                Isadmin: params.Isadmin,
                DriverId: params.DriverId,
            })
            //console.log("AssignStickerToRoutes Response", response);
            return response.data;
        } catch (error) {
            console.error("Error in AssignStickerToRoutes:", error);
            throw error;
        }
    }

}

export const vendorAllocationService = new VendorAllocationService();