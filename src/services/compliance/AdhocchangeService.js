import { api } from "../axios/api";
class AdhocchangeService {
    async SelectChangeAdhoc(params) {
        try {
            const response = await api.post("/SelectChangeAdhoc", {
                MgrId: params.MgrId,
            })
            // console.log("Admin Schedule Response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error SelectChangeAdhoc:", error);
            throw error;
        }
    }
    async UpdateAdhocStatus(params) {
        try {
            const response = await api.post("/UpdateAdhocStatus", {
                Id: params.Id,
                Status: params.Status,
                ApprovedBy: params.ApprovedBy,
                CallFrom: params.CallFrom,
            })
            // console.log("Admin Schedule Response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error UpdateAdhocStatus:", error);
            throw error;
        }
    }
    async SelectAdhocById(params) {
        try {
            const response = await api.post("/SelectAdhocById", {
                Id: params.Id,
            })
            // console.log("Admin Schedule Response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error SelectAdhocById:", error);
            throw error;
        }
    }
}

export default new AdhocchangeService();