import { api } from "../axios/api";


class OTAReportService {
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

    async GetVendorByFacility(params) {
        try {
            const response = await api.post("/GetVendorByFacility", {
                facilityId: params.facilityId,
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching vendor by facility:", error);
            throw error;
        }
    }

    async RepOTAdetail(params) {
        try {
            const response = await api.post("/RepOTAdetail", {
                sDate: params.sDate,
                eDate: params.eDate,
                facilityId: params.facilityId,
                vendorId: params.vendorId,
                tripType: "P",
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching OTA report details:", error);
            throw error;
        }   
    }

    async RptArrivalShiftWise(params) {
        try {
            const response = await api.post("/RptArrivalShiftWise", {
                sDate: params.sDate,
                eDate: params.eDate,
                facilityId: params.facilityId,
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching Arrival Shift Wise report:", error);
            throw error;
        }
    }

    async RptArrivalVendorWise(params) {
        try {
            const response = await api.post("/RptArrivalVendorWise", {
                sDate: params.sDate,
                eDate: params.eDate,
                facilityId: params.facilityId,
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching Arrival Vendor Wise report:", error);
            throw error;
        }
    }
}

export default new OTAReportService();