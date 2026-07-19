import { api } from "../axios/api";
import parseMaybeJson from "../parseMaybeJson";
class ViewMyRoutesService {
    async GetEmployeeForAdhoc(params) {
        try {
            const response = await api.post("/getemployeeforadhoc", {
                mgrid: params.mgrid,
            });
            return parseMaybeJson(response.data);
            // console.log("SelectBaseFacility response:", response.data); // Log the response data
        } catch (error) {
            console.error("Error in getemployeeforadhoc:", error);
            throw error;
        }
    }

    async GetMyTrips(params) {
        try {
            const response = await api.post("/GetMyTrips", {
                empid: params.empid,
                sDate: params.sDate,
                eDate: params.eDate
            });
            // console.log("GetShiftByFacilityType response:", response.data); // Log the response data
            return parseMaybeJson(response.data);
        } catch (error) {
            console.error("Error in GetMyTrips:", error);
            throw error;
        }
    }

    async GetMyRoutesDetails(params) {
        try {
            const response = await api.post("/GetMyRoutesDetails", {
                empid: params.empid,
                sDate: params.sDate,
                triptype: params.triptype,
                routeid: params.routeid
            });
            // console.log("GetShiftByFacilityType response:", response.data); // Log the response data
            return parseMaybeJson(response.data);
        } catch (error) {
            console.error("Error in GetMyRoutesDetails:", error);
            throw error;
        }
    }

    async SPRCancelationReason() {
        try {
            const response = await api.post("/SPRCancelationReason", {});
            // console.log("GetShiftByFacilityType response:", response.data); // Log the response data
            return parseMaybeJson(response.data);
        } catch (error) {
            console.error("Error in SPRCancelationReason:", error);
            throw error;
        }
    }

    async CancelTrip(params) {
        try {
            const response = await api.post("/CancelTrip", {
                routeid: params.routeid,
                EmployeeId: params.EmployeeId,
                updatedby: params.updatedby,
                shiftdate: params.shiftdate,
                triptype: params.triptype,
                Reason: params.Reason,
            });
            // console.log("GetShiftByFacilityType response:", response.data); // Log the response data
            return parseMaybeJson(response.data);
        } catch (error) {
            console.error("Error in CancelTrip:", error);
            throw error;
        }
    }

} 

export default new ViewMyRoutesService();