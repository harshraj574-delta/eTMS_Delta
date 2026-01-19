import { api } from "../axios/api";

class ReplyFeedbackService {
    async SelectFacility(params) {
        try {
            const response = await api.post("/SelectFacility", {
                Userid: params.Userid,
            });
            console.log("SelectFacility Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in SelectFacility");
            throw error;
        }
    }
    async sprFeedBackDetails(params) {
        try {
            const response = await api.post("/sprFeedBackDetails", {
                sDate: params.sDate,
                eDate: params.eDate,
                StatusID: params.StatusID,
                FacilityID: params.FacilityID,
            });
            console.log("sprFeedBackDetails Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in sprFeedBackDetails");
            throw error;
        }
    }
    async sprSelectFeedbackbyId(params) {
        try {
            const response = await api.post("/sprSelectFeedbackbyId", {
                id: params.id,
            });
            console.log("sprSelectFeedbackbyId Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in sprSelectFeedbackbyId");
            throw error;
        }
    }
    async GetComplaintType(params){
        try {
            const response = await api.post("/GetComplaintType", {
                ComplaintCategoryID: params.ComplaintCategoryID,
            });
            console.log("GetComplaintType Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in GetComplaintType");
            throw error;
        }
    }
    async sprInsertReply(params){
        try {
            const response = await api.post("/sprInsertReply", {
                TicktNo: params.TicktNo,
                Descp: params.Descp,
                ActionId: params.ActionId,
                StatusId :params.StatusId
            });
            console.log("sprInsertReply Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in sprInsertReply");
            throw error;
        }
    }
    async sprSelectReply(params){
        try {
            const response = await api.post("/sprSelectReply", {
                ticketno: params.ticketno,
            });
            console.log("sprSelectReply Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in sprSelectReply");
            throw error;
        }
    }
}
export default new ReplyFeedbackService();
