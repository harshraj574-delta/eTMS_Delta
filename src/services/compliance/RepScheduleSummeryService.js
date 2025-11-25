import { api } from "../axios/api";

class RepScheduleSummeryService {
    async SelectFacility(params) {
        try {
            const response = await api.post('/SelectFacility', {
                Userid: params.Userid
            });
            return response.data;
        } catch (error) {
            console.error('Error in SelectFacility:', error);
            throw error;
        }
    }
    async RepScheduleMISSummery(params) {
        try {
            const response = await api.post('/RepScheduleMISSummery', {
                sDate: params.sDate,
                eDate: params.eDate,
                facilityid: params.facilityid,
            })
            return response.data;
        } catch (error) {
            console.error('Error in RepScheduleMISSummery:', error);
            throw error;
        }
    }
    async RepVendorWiseBill_parent(params) {
        try {
            const response = await api.post('/RepVendorWiseBill_parent', {
                sDate: params.sDate,
                eDate: params.eDate,
                facilityid: params.facilityid,
                triptype: params.triptype,
                vendorIDs: params.vendorIDs,
            })
            return response.data;
        } catch (error) {
            console.error('Error in RepVendorWiseBill_parent');
            throw error;
        }
    }
    async RepVendorWiseBill_child(params) {
        try {
            const response = await api.post('/RepVendorWiseBill_child', {
                sDate: params.sDate,
                eDate: params.eDate,
                facilityid: params.facilityid,
                vendorid: params.vendorid,
            })
            return response.data;
        } catch (error) {
            console.error('Error in RepVendorWiseBill_child');
            throw error;
        }
    }
}
export default new RepScheduleSummeryService();