import { api } from "../axios/api";
class BCPMasterService {
    async GetBCPMasterList(params) {
        try {
            const response = await api.post("/GetBCPMasterList", {
                FacilityId: params.FacilityId,
                ProcessId: params.ProcessId,
                FromDate: params.FromDate,
                ToDate: params.ToDate,
                TripType: params.TripType,
            });
            // console.log("GetBCPMasterList Response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error GetBCPMasterList:", error);
            throw error;
        }
    }

    async InsertBCPMaster(params) {
        try {
            const response = await api.post("/InsertBCPMaster", {
                Title: params.Title,
                Description: params.Description,
                FromDate: params.FromDate,
                ToDate: params.ToDate,
                FacilityId: params.FacilityId,
                ProcessId: params.ProcessId,
                TripType: params.TripType,
                Shift: params.Shift,
                BcpPercent: params.BcpPercent,
                CreatedBy: params.CreatedBy,
            });
            // console.log("InsertBCPMaster Response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error InsertBCPMaster:", error);
            throw error;
        }
    }

    async UpdateBCPMaster(params) {
        try {
            const response = await api.post("/UpdateBCPMaster", {
                Id: params.Id,
                Title: params.Title,
                Description: params.Description,
                FromDate: params.FromDate,
                ToDate: params.ToDate,
                FacilityId: params.FacilityId,
                ProcessId: params.ProcessId,
                TripType: params.TripType,
                Shift: params.Shift,
                BcpPercent: params.BcpPercent,
                UpdatedBy: params.UpdatedBy,
            });
            // console.log("UpdateBCPMaster Response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error UpdateBCPMaster:", error);
            throw error;
        }
    }
}
export default new BCPMasterService();