import { use } from "react";
import { api } from "../axios/api";
import { Route } from "react-router-dom";

class ManageRouteService {
  async SelectBaseFacility(params) {
    try {
      const response = await api.post("/SelectBaseFacility", {
        userid: params.userid,
      });
      return response.data; // Return the actual data from the response
    } catch (error) {
      console.error("Error in SelectBaseFacility:", error);
      throw error;
    }
  }

  async GetShiftByFacilityType(params) {
    try {
      const response = await api.post("/GetShiftByFacilityType", {
        facid: params.facid,
        type: params.type,
      });
      return response.data; // Return the actual data from the response
    } catch (error) {
      console.error("Error in GetShiftByFacilityType:", error);
      throw error;
    }
  }

  // FIXED: Wrapped this method in a try...catch block for proper error handling
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
      });
      return response.data;
    } catch (error) {
      console.error("Error in GetRoutesByOrder:", error);
      throw error;
    }
  }

  async GetRoutesDetailsnew(params) {
    try {
      const response = await api.post("/GetRoutesDetailsnew", {
        RouteID: params.RouteID,
        isAdd: params.isAdd,
      });
      return response.data;
    } catch (error) {
      console.error("Error in GetRoutesDetailsnew:", error);
      throw error;
    }
  }

  async sp_validateEmpRoster(params) {
    try {
      const response = await api.post("/sp_validateEmpRoster", {
        facilityid: params.facilityid,
        sDate: params.sDate,
        triptype: params.triptype,
        shifttime: params.shifttime,
      });
      return response.data;
    } catch (error) {
      console.error("Error in sp_validateEmpRoster:", error);
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
      });
      return response.data;
    } catch (error) {
      console.error("Error in GetRoutesStatistics:", error);
      throw error;
    }
  }

  async GetRouteInputJson(params) {
    try {
      const response = await api.post("/GetRouteInputJson", {
        facilityid: params.facilityid,
        sDate: params.sDate,
        triptype: params.triptype,
        shifttime: params.shifttime,
        locationID: params.locationID,
        updatedBy: params.updatedBy,
      });
      return response.data;
    } catch (err) {
      console.log("Error in GetRouteInputJson", err);
      throw err;
    }
  }

  async save_routesMapBasedNew(params) {
    try {
      const response = await api.post("/save_routesMapBasedNew", {
        facilityid: params.facilityid,
        sDate: params.sDate,
        triptype: params.triptype,
        shifttime: params.shifttime,
        jsonstring: params.jsonstring,
        updatedBy: params.updatedBy,
      });
      return response.data;
    } catch (err) {
      console.log("Error in save_routesMapBasedNew", err);
      throw err;
    }
  }

  async Get_RouteGeometry(params) {
    try {
      const response = await api.post("/Get_RouteGeometry", {
        RouteID: params.RouteID,
      });
      return response.data;
    } catch (err) {
      console.log("this is error in Get_RouteGeometry", err);
      throw err;
    }
  }

  async GetRoutesExportExcel(params) {
    try {
      const response = await api.post("/GetRoutesExportExcel", {
        sDate: params.sDate,
        eDate: params.eDate,
        facilityid: params.facilityid,
        triptype: params.triptype,
        shifttimes: params.shifttimes,
      });
      return response.data;
    } catch (err) {
      console.log("this is error in GetRoutesExportExcel", err);
      throw err;
    }
  }

  async AutoVendorAllocationNew(params) {
    try {
      const response = await api.post("/AutoVendorAllocationNew", {
        facid: params.facid,
        sDate: params.sDate,
        uname: params.uname,
        triptype: params.triptype,
        shifttime: params.shifttime,
      });
      return response.data;
    } catch (err) {
      console.log("Error in AutoVendorAllocationNew", err);
      throw err;
    }
  }

  async WBS_GetBulkRouteData(params) {
    try {
      const response = await api.post("/WBS_GetBulkRouteData", {
        sDate: params.sDate,
        eDate: params.eDate,
        facilityid: params.facilityid,
        triptype: params.triptype,
        shifttimes: params.shifttimes,
      });
      return response.data;
    } catch (error) {
      console.error("Error in WBS_GetBulkRouteData:", error);
      throw error;
    }
  }

  async getvehtypeCountVendorwise(params) {
    try {
      const response = await api.post("/getvehtypeCountVendorwise", {
        sdate: params.sdate,
        edate: params.edate,
        triptype: params.triptype,
        facilityid: params.facilityid,
        shifttime: params.shifttime,
      });
      return response.data;
    } catch (error) {
      console.error("Error in getvehtypeCountVendorwise:", error);
      throw error;
    }
  }

  async UpdateCutPaste(params) {
    try {
      const response = await api.post("/UpdateCutPaste", {
        OldRouteid: params.OldRouteid,
        oldemployeeid: params.oldemployeeid,
        newrouteid: params.newrouteid,
        stopno: params.stopno,
        userid: params.userid,
      });
      console.log("UpdateCutPaste response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in UpdateCutPaste:", error);
      throw error;
    }
  }

  async MergeRoute(params) {
    try {
      const response = await api.post("/MergeRoute", {
        RouteIDs: params.RouteIDs,
        userid: params.userid,
      });
      console.log("MergeRoute response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in MergeRoute:", error);
      throw error;
    }
  }

  async SplitRoute(params) {
    try {
      const response = await api.post("/SplitRoute", {
        RouteIDs: params.RouteIDs,
        empIDs: params.empIDs,
      });
      console.log("SplitRoute response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in SplitRoute:", error);
      throw error;
    }
  }

  async DeleteEmployeeFromRoute(params) {
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
      console.log("DeleteEmployeeFromRoute response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in DeleteEmployeeFromRoute:", error);
      throw error;
    }
  }

  async EmpSearch(params) {
    try {
      const response = await api.post("/EmpSearch", {
        locationid: params.locationid,
        empidname: params.empidname,
        IsAdmin: params.IsAdmin,
      });
      console.log("EmpSearch response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in EmpSearch:", error);
      throw error;
    }
  }

  async AddEmpToRoute(params) {
    try {
      const response = await api.post("/AddEmpToRoute", {
        empId: params.empId,
        stopNo: params.stopNo,
        routeId: params.routeId,
        isDelete: params.isDelete,
        IsNewAdded: params.IsNewAdded,
        updatedby: params.updatedby,
      });
      console.log("AddEmpToRoute response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in AddEmpToRoute:", error);
      throw error;
    }
  }

  async GetInputJsonRecalculate(params) {
    try {
      const response = await api.post("/GetInputJsonRecalculate", {
        shiftdate: params.shiftdate,
        shifttime: params.shifttime,
        facilityid: params.facilityid,
        triptype: params.triptype,
      });
      console.log("GetInputJsonRecalculate response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in GetInputJsonRecalculate:", error);
      throw error;
    }
  }

  async updateRouteMapbased(params) {
    try {
      const response = await api.post("/updateRouteMapbased", {
        facilityid: params.facilityid,
        sDate: params.sDate,
        triptype: params.triptype,
        shifttime: params.shifttime,
        jsonstring: params.jsonstring,
        updatedBy: params.updatedBy,
      });
      console.log("updateRouteMapbased response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in updateRouteMapbased:", error);
      throw error;
    }
  }

  async getInputJsonByrouteids(params) {
    try{
      const response = await api.post("/getInputJsonByrouteids", {
        routeids: params.routeids,
      });
      console.log("getInputJsonByrouteids response:", response.data);
      return response.data;

    }
    catch(error){
      console.error("Error in getInputJsonByrouteids:", error);
      throw error;
    }
}
  async GetIsRouteFinalized(params){
    try{
      const response = await api.post("/GetIsRouteFinalized", {
        sDate: params.sDate,
        FacilityID: params.FacilityID,
        TripType: params.TripType,
        Shifts: params.Shifts,
        userid: params.userid,
      });
      console.log("GetIsRouteFinalized response:", response.data);
      return response.data;
    } catch(error){
      console.error("Error in GetIsRouteFinalized:", error);
      throw error;
    }
  }

  async BlockTransport(params){
    try{
      const response = await api.post("/BlockTransport", {
        RouteIDs: params.RouteIDs,
        userid: params.userid
      });
      console.log("BlockTransport response:", response.data);
      return response.data;
    } catch(error){
      console.error("Error in BlockTransport:", error);
      throw error;
    }
}
}

export default new ManageRouteService();
