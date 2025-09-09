import { api } from "../axios/api";
class ManageRouteService {
  async SelectBaseFacility(params) {
    try {
      const response = await api.post("/SelectBaseFacility", {
        userid: params.userid,
      });
      return response.data; // Return the actual data from the response
      // console.log("SelectBaseFacility response:", response.data); // Log the response data
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
      // console.log("GetShiftByFacilityType response:", response.data); // Log the response data
      return response.data; // Return the actual data from the response
    } catch (error) {
      console.error("Error in GetShiftByFacilityType:", error);
      throw error;
    }
  }
  async GetRoutesByOrder(params) {
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
    //console.log("GetRoutesByOrder response:", response.data);
    return response.data;
  }
  catch(error) {
    console.error("Error in GetRoutesByOrder:", error);
    throw error;
  }
  async GetRoutesDetailsnew(params) {
    try {
      const response = await api.post("/GetRoutesDetailsnew", {
        RouteID: params.RouteID,
        isAdd: params.isAdd,
      });
      //console.log("GetRoutesDetailsnew response:", response.data);
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
      //console.log("sp_validateEmpRoster response:", response.data);
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
      //console.log("GetRoutesStatistics response:", response.data);
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
      //console.log(" GetRouteInputJson", response.data);
      return response.data;
    } catch (err) {
      console.log("Error in GetRouteInputJson", err);
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
      //console.log("save_routesMapBasedNew", response.data);
      return response.data;
    } catch (err) {
      console.log("Error in save_routesMapBasedNew", err);
    }
  }
  async Get_RouteGeometry(params) {
    try {
      const response = await api.post("/Get_RouteGeometry", {
        RouteID: params.RouteID,
      });
      //console.log("this is data for geometry", response.data);
      return response.data;
    } catch (err) {
      console.log("this is error in Get_RouteGeometry", err);
      throw err;
    }
  }
  // New Aditya 25 may
  async GetRoutesExportExcel(params) {
    try {
      const response = await api.post("/GetRoutesExportExcel", {
        sDate: params.sDate,
        eDate: params.eDate,
        facilityid: params.facilityid,
        triptype: params.triptype,
        shifttimes: params.shifttimes,
      });
     // console.log("GetRoutesExportExcel response:", response.data);
      return response.data; // Return the actual data from the response
    } catch (err) {
      console.log("this is error in Get_RouteGeometry", err);
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
      //console.log("AutoVendorAllocationNew response:", response.data);
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
      //console.log("WBS_GetBulkRouteData response:", response.data);
      return response.data; // Return the actual data from the response
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
     // console.log("getvehtypeCountVendorwise response:", response.data);
      return response.data; // Return the actual data from the response
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
      })
      confirm.log("UpdateCutPaste response:", response.data);
      return response.data; // Return the actual data from the response
    } catch (error) {
      console.error("Error in UpdateCutPaste:", error);
      throw error;
    }
  }
}

export default new ManageRouteService();
