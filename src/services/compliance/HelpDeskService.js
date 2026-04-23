import { api } from "../axios/api";
class HelpDeskService {
    async EmpSearch(params) {
        try {
            const response = await api.post("/EmpSearch", {
                locationid: params.locationid,
                empidname: params.empidname,
                IsAdmin: params.IsAdmin,
            });
            //console.log("EmpSearch Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in Employee Search");
            throw error;
        }
    }
    async GetHelpDeskEmployeeDetail(params) {
        try {
            const response = await api.post("/GetHelpDeskEmployeeDetail", {
                sDate: params.sDate,
                empid: params.empid,
            });
            //console.log("GetHelpDeskEmployeeDetail Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in GetHelpDeskEmployeeDetail");
            throw error;
        }
    }
    async GetEmployeeDetails(params) {
        try {
            const response = await api.post("/GetEmployeeDetails", {
                empid: params.empid,
            });
            // console.log("GetEmployeeDetails Response:", response.data);
            return response.data;
        }
        catch (error) {
            console.log("Error in GetEmployeeDetails");
            throw error;
        }
    }
    async GetEmployee(params) {
        try {
            const response = await api.post("/GetEmployee", {
                Userid: params.Userid,
            });
            return response.data;
        } catch (error) {
            console.log("Error in GetEmployee");
            throw error;
        }
    }
    async GetIncidentMaster() {
        try {
            const response = await api.post("/GetIncidentMaster", {});
            // console.log("GetIncidentMaster Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in GetIncidentMaster");
            throw error;
        }
    }
    async GetRoutesHelpDesk(params) {
        try {
            const response = await api.post("/GetRoutesHelpDesk", {
                sDate: params.sDate,
                eDate: params.eDate,
                FacilityID: params.FacilityID,
                TripType: params.TripType,
                Shifttimes: params.Shifttimes,
                OrderBy: params.OrderBy,
                Direction: params.Direction,
                TripStatus: params.TripStatus,
            });
            //console.log("GetRoutesHelpDesk Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in GetRoutesHelpDesk");
            throw error;
        }
    }
    async GetRoutesDetailsnew(params) {
        try {
            const response = await api.post("/GetRoutesDetailsnew", {
                RouteID: params.RouteID,
                isAdd: params.isAdd,
            });
            //console.log("GetRoutesDetailsnew Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in GetRoutesDetailsnew");
            throw error;
        }
    }
    async GetRouteSummary(params) {
        try {
            const response = await api.post("/GetRouteSummary", {
                routeids: params.routeids,
            });
            // console.log("GetRouteSummary Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in GetRouteSummary");
            throw error;
        }
    }
    async SelectFacility(params) {
        try {
            const response = await api.post("/SelectFacility", {
                Userid: params.Userid,
            });
            // console.log("SelectFacility Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in SelectFacility");
            throw error;
        }
    }
    async GetShiftByFacilityType(params) {
        try {
            const response = await api.post("/GetShiftByFacilityType", {
                facid: params.facid,
                type: params.type,
            });
            //console.log("GetShiftByFacilityType Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in GetShiftByFacilityType");
            throw error;
        }
    }
    async sprUpdateVehicleRemark(params) {
        try {
            const response = await api.post("/sprUpdateVehicleRemark", {
                RouteID: params.RouteID,
                VehicleNo: params.VehicleNo,
                Remark: params.Remark,
                Driver: params.Driver,
                DriverContact: params.DriverContact,
                DelayReason: params.DelayReason,
                UpdateBy: params.UpdateBy,
            });
            // console.log("sprUpdateVehicleRemark Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in sprUpdateVehicleRemark");
            throw error;
        }
    }
    async UpdateTrackingStatus(params) {
        try {
            const response = await api.post("/UpdateTrackingStatus", {
                RouteID: params.RouteID,
                EmployeeID: params.EmployeeID,
                ActTripStartDate: params.ActTripStartDate,
                TrackingAction: params.TrackingAction,
                ActETAhh: params.ActETAhh,
                ActETAmm: params.ActETAmm,
                TrackingRemark: params.TrackingRemark,
                UpdateBy: params.UpdateBy,
            });
            // console.log("UpdateTrackingStatus Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in UpdateTrackingStatus");
            throw error;
        }
    }
    async GetEmpScheduleLog(params) {
        try {
            const response = await api.post("/GetEmpScheduleLog", {
                sDate: params.sDate,
                empid: params.empid,
            });
            //console.log("GetEmpScheduleLog Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in GetEmpScheduleLog");
            throw error;
        }
    }
    async IsTripB2B(params) {
        try {
            const response = await api.post("/IsTripB2B", {
                routeids: params.routeids,
            });
            //console.log("IsTripB2B Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in IsTripB2B");
            throw error;
        }
    }
    async DeleteRoutes(params) {
        try {
            const response = await api.post("/DeleteRoutes", {
                sDate: params.sDate,
                FacilityID: params.FacilityID,
                TripType: params.TripType,
                Shifttimes: params.Shifttimes,
                RouteID: params.RouteID,
                EmpID: params.EmpID,
                uname: params.uname,
            });
            // console.log("DeleteRoutes Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in DeleteRoutes");
            throw error;
        }
    }
    async GetRouteCountHelpDesk(params) {
        try {
            const response = await api.post("/GetRouteCountHelpDesk", {
                sDate: params.sDate,
                eDate: params.eDate,
                FacilityID:params.FacilityID,
                TripType:params.TripType,
                Shifttimes:params.Shifttimes,
            });
            return response.data;
        } catch (error) {
            console.log("Error in GetRouteCountHelpDesk");
            throw error;
        }
    }
}
export default new HelpDeskService();