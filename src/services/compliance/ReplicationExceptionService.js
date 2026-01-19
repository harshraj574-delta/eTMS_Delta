import { api } from "../axios/api";

class ReplicationExceptionService {
     async SelectFacility(params) {
        try {
            const response = await api.post("/SelectFacility", {
                Userid: params.Userid,
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching facility data:", error);
            throw error;
        }

    }
    async GetShiftByFacilityType(params) {
        try {
            const response = await api.post("/GetShiftByFacilityType", {
                facid: params.facid,
                type: params.type,
            })
            return response.data;
        } catch (error) {
            console.error("Error in GetShiftByFacilityType:", error);
            throw error;
        }
    }
    async GetIsRouteFinalized(params){
        try {
            const response = await api.post("/GetIsRouteFinalized", {
                sDate: params.sDate,
                FacilityID: params.FacilityID,
                TripType: params.TripType,
                Shifts: params.Shifts,
                UserID: params.UserID
            })
            return response.data;
        } catch (error) {
            console.error("Error in GetIsRouteFinalized:", error);
            throw error;
        }
    }
    async GetDeleteException(params){
        try {
            const response = await api.post("/GetDeleteException", {
                sDate: params.sDate,
                eDate: params.eDate,
                FacilityID: params.FacilityID,
                TripType: params.TripType,
                Shifttimes: params.Shifttimes
            })
            return response.data;
        } catch (error) {
            console.error("Error in GetDeleteException:", error);
            throw error;
        }
    }
    async GetAddException(params){
        try {
            const response = await api.post("/GetAddException", {
                sDate: params.sDate,
                eDate: params.eDate,
                FacilityID: params.FacilityID,
                TripType: params.TripType,
                Shifttimes: params.Shifttimes
            })
            return response.data;
        } catch (error) {
            console.error("Error in GetAddException:", error);
            throw error;
        }
    }
    async SprDeleteExceptionEmp(params){
        try {
            const response = await api.post("/SprDeleteExceptionEmp", {
                sDate: params.sDate,
                FacilityID: params.FacilityID,
                TripType: params.TripType,
                Shifttimes: params.Shifttimes,
                empid: params.empid,
                userid: params.userid
            })
            return response.data;
        } catch (error) {
            console.error("Error in SprDeleteExceptionEmp:", error);
            throw error;
        }
    }
    async DeleteException(params){
        try {
            const response = await api.post("/DeleteExceptionEmp", {
                sDate: params.sDate,
                FacilityID: params.FacilityID,
                TripType: params.TripType,
                Shifttimes: params.Shifttimes,
                userid: params.userid
            })
            return response.data;
        } catch (error) {
            console.error("Error in DeleteExceptionEmp:", error);
            throw error;
        }
    }
    async MakeRouteReplicateException(params){
        try {
            const response = await api.post("/MakeRouteReplicateException", {
                sDate: params.sDate,
                FacilityID: params.FacilityID,
                TripType: params.TripType,
                Shifttimes: params.Shifttimes,
                userid: params.userid,
                empid: params.empid
            })
            return response.data;
        } catch (error) {
            console.error("Error in MakeRouteReplicateException:", error);
            throw error;
        }
    }
    async MakeNewRoute(params){
        try {
            const response = await api.post("/MakeNewRoute", {
                routeid: params.routeid,
                userid: params.userid,
                empids: params.empids
            })
            return response.data;
        } catch (error) {
            console.error("Error in MakeNewRoute:", error);
            throw error;
        }
    }
    async GetRoutesByOrder(params){
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
                occ_seater: params.occ_seater
            })
            return response.data;
        } catch (error) {
            console.error("Error in GetRoutesByOrder:", error);
            throw error;
        }
    }
    async GetRoutesDetailsnew(params){
        try {
            const response = await api.post("/GetRoutesDetailsnew", {
                RouteID: params.Routeid,
                isAdd: params.isAdd
            })
            return response.data;
        } catch (error) {
            console.error("Error in GetRoutesDetailsnew:", error);
            throw error;
        }
    }
    async AddEmpToRoute(params){
        try {
            const response = await api.post("/AddEmpToRoute", {
                empId: params.empId,
                routeId: params.routeId,
                stopNo: params.stopNo,
                isDelete: params.isDelete,
                IsNewAdded: params.IsNewAdded,
                updatedby: params.updatedby
            })
            return response.data;
        } catch (error) {
            console.error("Error in AddEmpToRoute:", error);
            throw error;
        }
    }
    async UpdateRoute(params){
        try{
            const response = await api.post("/UpdateRoute", {
                RouteID: params.RouteID,
                EmployeeID: params.EmployeeID,
                Shiftdate: params.Shiftdate,
                StopNo: params.StopNo,
                ETAhh: params.ETAhh,
                ETAmm: params.ETAmm,
                userid: params.userid
            })
            return response.data;
        }catch(error){
            console.error("Error in UpdateRoute:", error);
            throw error;
        }
    }
    async UpdateCutPaste(params){
        try{
            const response = await api.post("/UpdateCutPaste", {
                OldRouteid: params.OldRouteid,
                oldemployeeid: params.oldemployeeid,
                newrouteid: params.newrouteid,
                stopno: params.stopno,
                userid: params.userid
            })
            return response.data;
        }catch(error){
            console.error("Error in UpdateCutPaste:", error);
            throw error;
        }
    }
    async AutoAdhocAllocation(params){
        try{
            const response = await api.post("/AutoAdhocAllocation", {
                sDate: params.sDate,
                FacilityID: params.FacilityID,
                Shifttimes: params.Shifttimes,
                TripType: params.TripType,
                statustype: params.statustype
            })
            return response.data;
        }catch(error){
            console.error("Error in AutoAdhocAllocation:", error);
            throw error;
        }
    }
    async IsTripB2B(params){
        try{
            const response  = await api.post("/IsTripB2B", {
                routeids: params.routeids
            })
            return response.data;
        }catch(error){
            console.error("Error in IsTripB2B:", error);
            throw error;
        }
    }
  
}

export default new ReplicationExceptionService();

