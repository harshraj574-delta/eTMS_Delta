import { api } from "../axios/api";

class BcpMasterService {

  async GetBCPMasterList(params) {
    try {
      const response = await api.post("/GetBcpMaster", {
        FacilityId: params.FacilityId,
        ProcessId: params.ProcessId,
        FromDate: params.FromDate,
        ToDate: params.ToDate,
        TripType: params.TripType
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching BCP master data:", error);
      throw error;
    }
    }

    async InsertBCPMaster(params) {
        try {
            const response = await api.post("/InsertBcpMaster", {
                Title: params.Title,
                Description: params.Description,
                FromDate: params.FromDate,
                ToDate: params.ToDate,
                FacilityId: params.FacilityId,
                ProcessId: params.ProcessId,
                TripType: params.TripType,
                Shift: params.Shift,
                BcpPercent: params.BcpPercent,
                CreatedBy: params.CreatedBy
            });
            return response.data;
        } catch (error) {            
            console.error("Error inserting BCP master data:", error);
            throw error;
        }
    }

    async UpdateBCPMaster(params) {
        try {
            const response = await api.post("/UpdateBcpMaster", {
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
                UpdatedBy: params.UpdatedBy
            });
            return response.data;
        } catch (error) {
            console.error("Error updating BCP master data:", error);
            throw error;
        }
    }
}