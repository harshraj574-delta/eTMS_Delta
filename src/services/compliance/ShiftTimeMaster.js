import { api } from "../axios/api";

class ShiftTimeMasterService {
  async SelectFacility(params) {
    try {
      const response = await api.post("/SelectFacility", {
        userid: params.userid,
      });
      return response.data;
    } catch (error) {
      console.error("Error in SelectFacility:", error);
      throw error;
    }
  }

  async GetProcess(params) {
    try {
      const response = await api.post("/GetProcess", {
        locationid: params.locationid,
        empid: params.empid,
      });
      return response.data;
    } catch (error) {
      console.error("Error in GetProcess:", error);
      throw error;
    }
  }
  async GetSelectedShiftTime(params) {
    try {
      const response = await api.post("/GetSelectedShiftTime", {
        facilityid: params.facilityid,
        triptype: params.triptype,
        processid: params.processid,
        weekday: params.weekday,
      })
      //console.log("GetSelectedShiftTime:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in GetSelectedShiftTime:", error);
      throw error;
    }
  }
  async UpdateShiftStatus(params) {
    try {
      const response = await api.post("/UpdateShiftStatus", {
        shiftid: params.shiftid,
        status: params.status,
      })
      //console.log("UpdateShiftStatus:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in UpdateShiftStatus:", error);
      throw error;
    }
  }
  async UpdateShiftTimeGrid(params) {
    try {
      const response = await api.post("/UpdateShiftTimeGrid", {
        FacilityId: params.FacilityId,
        DropTimes: params.DropTimes,
        PickTimes: params.PickTimes,
        Day: params.Day,
        ProcessIds: params.ProcessIds,
        ZoneNames: params.ZoneNames,
        WeekEndType: params.WeekEndType,
        Buffer: params.Buffer,
        UpdatedBy: params.UpdatedBy,
        ShiftType: params.ShiftType,
      })
      //console.log("UpdateShiftTimeGrid:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in UpdateShiftTimeGrid:", error);
      throw error;
    }
  }
}

export default new ShiftTimeMasterService();
