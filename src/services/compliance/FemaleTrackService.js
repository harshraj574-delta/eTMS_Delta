import { api } from "../axios/api";

class FemaleTrackService {
  async SelectFacility(params) {
        try {
            const response = await api.post("/SelectFacility", {
                Userid: params.Userid
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
                type: params.type
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching shift data:", error);
            throw error;
        }
    }

   async GetFemaleData_ForRHS(params) {
        try {
            const response = await api.post("/GetFemaleData_ForRHS", {
                sDate: params.sDate,
                eDate: params.eDate,
                FacilityID: params.FacilityID,
                Shifttimes: params.Shifttimes,
                TripType: params.TripType,
                DutyManager: params.DutyManager
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching female data:", error);
            throw error;
        }
    }

    async UpdateFemaleTrackRHS(params) {
        try {
            const response = await api.post("/UpdateFemaleTrackRHS", {
                Routeid: params.Routeid,
                EmpID: params.EmpID,
                Tracked: params.Tracked,
                Remark: params.Remark,
                UpdatedBy: params.UpdatedBy,
                action: params.action,
                Remark1: params.Remark1,
                Remark2: params.Remark2,
                Remark3: params.Remark3
            })
            return response.data;
        } catch (error) {
            console.error("Error updating female track data:", error);
            throw error;
        }
    }
}

export default new FemaleTrackService();