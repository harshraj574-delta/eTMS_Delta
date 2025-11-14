import { api } from "../axios/api";

class RepFeedbackReportService {
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

    async RepFeedBackDetails(params) {
        try {
            const response = await api.post("/RepFeedBackDetails", {
                sDate: params.sDate,
                eDate: params.eDate,
                facilityId: params.facilityId,
                statusID: params.statusID,
            })
            return response.data;
        }
        catch (error) {
            console.error("Error fetching Rep Feedback details:", error);
            throw error;
        }
    }

    async RepSelectReply(params) {
        try {
            const response = await api.post("/RepSelectReply", {
                TicketNo: params.TicketNo,
            })
            return response.data;
        }
        catch (error) {
            console.error("Error fetching Rep Select Reply:", error);
            throw error;
        }
    }
}
export default new RepFeedbackReportService();