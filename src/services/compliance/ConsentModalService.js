import { api } from "../axios/api";


class ConsentModalService {
    async sp_getempdisclaimer(params) {
        try {
            const response = await api.post("/sp_getempdisclaimer", {

            });
            return response.data;
        } catch (error) {
            console.error("Error in sp_getempdisclaimer:", error);
            throw error;
        }
    }

    async InsertUserDisclaimerStatus(params) {
        try {
            const response = await api.post("/InsertUserDisclaimerStatus", {
                Status: params.Status,
                UpdatedBy: params.UpdatedBy
            });
            return response.data;
        } catch (error) {
            console.error("Error in InsertUserDisclaimerStatus:", error);
            throw error;
        }
    }
}

export default new ConsentModalService();