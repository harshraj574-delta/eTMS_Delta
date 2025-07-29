import { api } from "../axios/api";

class AdhocmanagementService {
  async SelectEmpAdhocRequest(params) {
    try {
      const response = await api.post("/SelectEmpAdhocRequest", params);
      return response.data; // Return the actual data from the response
    } catch (error) {
      console.error("Error in SelectEmpAdhocRequest:", error);
      throw error;
    }
  }
  async EmpSearchManager(params) {
    try {
      const response = await api.post("/EmpSearchManager", {
        empidname: params.empidname,
        locationid: params.locationid,
        managerID: params.managerID,
      });
      //console.log("EmpSearchManager response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in EmpSearchManager:", error);
      throw error;
    }
  }
  async GetBackupMgrId(params) {
    try {
      const response = await api.post("/GetBackupMgrId", {
        backupmgrid: params.backupmgrid,
      });
      // console.log("GetBackupMgrId response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in GetBackupMgrId:", error);
      throw error;
    }
  }
  async SelectFacilityByGroup(params) {
    try {
      const response = await api.post("/SelectFacilityByGroup", params);
      // console.log("SelectFacilityByGroup response:", response.data); // Log the response data
      let data = response.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error("Error parsing response:", e);
        }
      }
      return data; // Return the actual data from the response
    } catch (error) {
      console.error("Error in SelectFacilityByGroup:", error);
      throw error;
    }
  }
  async DeleteAdhoc(params) {
    try {
      const response = await api.post("/DeleteAdhoc", {
        // Changed endpoint name to match backend
        id: params.id.toString(), // Convert to string as per API requirement
        userid: parseInt(params.userid), // Ensure it's an integer
      });
      // console.log("DeleteAdhoc response:", response.data); // Log the response data
      return response.data; // Return the actual data from the response
    } catch (error) {
      console.error("Error in DeleteAdhoc:", error);
      throw error;
    }
  }
  async getpickshiftAdhoc(params) {
    try {
      const response = await api.post("/getpickshiftAdhoc", {
        facilityid: params.facilityid,
        sDate: params.sDate,
        type: params.type,
        processid: params.processid,
      });
      // console.log("getpickshiftAdhoc raw response:", response);
      // console.log("getpickshiftAdhoc data:", response.data); // Log the response data
      return response.data; // Return the actual data from the response
    } catch (error) {
      console.error("Error in getpickshiftAdhoc:", error);
      throw error;
    }
  }
  async getdropshiftadhoc(params) {
    try {
      const response = await api.post("/getdropshiftadhoc", {
        facilityid: params.facilityid,
        sDate: params.sDate,
        type: params.type,
        processid: params.processid,
      });
      // console.log("getdropshiftadhoc raw response:", response);
      // console.log("getdropshiftadhoc data:", response.data); // Log the response data
      return response.data; // Return the actual data from the response
    } catch (error) {
      console.error("Error in getdropshiftadhoc:", error);
      throw error;
    }
  }
  async GetAdhocReason(params) {
    try {
      const response = await api.post("/GetAdhocReason", {
        facilityid: params.facilityid,
        triptype: params.triptype,
      });
      // console.log("GetAdhocReason response:", response.data); // Log the response data
      return response.data; // Return the actual data from the response
    } catch (error) {
      console.error("Error in GetAdhocReason:", error);
      throw error;
    }
  }
  async AddAdhocRequest(params) {
    try {
      const response = await api.post("/AddAdhocRequest", {
        Empids: params.Empids,
        FacilityID: params.FacilityID,
        shift: params.shift,
        tripType: params.tripType,
        Raisedby: params.Raisedby,
        adhocdate: params.adhocdate,
        adflag: params.adflag,
        reasonid: params.reasonid,
        AdhocType: params.AdhocType,
      });
      // console.log("AddAdhocRequest response:", response.data); // Log the response data
      return response.data; // Return the actual data from the response
    } catch (error) {
      console.error("Error in AddAdhocRequest:", error);
      throw error;
    }
  }
  async getTotalAdhocCount(params) {
    try {
      const response = await api.post("/getTotalAdhocCount", {
        empid: params.empid,
        sdate: params.sdate,
        edate: params.edate,
      });
      // console.log("getTotalAdhocCount response:", response.data); // Log the response data
      return response.data; // Return the actual data from the response
    } catch (error) {
      console.error("Error in getTotalAdhocCount:", error);
      throw error;
    }
  }
  async getAdhocRequestCount(params) {
    try {
      const response = await api.post("/getAdhocRequestCount", {
        empid: params.empid,
        sdate: params.sdate,
        edate: params.edate,
      });
      // console.log("getAdhocRequestCount response:", response.data); // Log the response data
      return response.data; // Return the actual data from the response
    } catch (error) {
      console.error("Error in getAdhocRequestCount:", error);
      throw error;
    }
  }
}
export default new AdhocmanagementService();
