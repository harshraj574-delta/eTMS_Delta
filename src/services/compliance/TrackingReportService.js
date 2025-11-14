import { api } from "../axios/api";

class TrackingReportService {
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

    async SprTrackingReport(params) {
        try {
            const response = await api.post("/SprTrackingReport", {
                sDate: params.sDate,
                eDate: params.eDate,
                facilityId: params.facilityId,
                tripType: params.tripType,
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching SPR Tracking report:", error);
            throw error;
        }
    }
}
export default new TrackingReportService();