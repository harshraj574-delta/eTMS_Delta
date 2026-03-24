import { api } from "../axios/api";

class DummyTripSheetService {
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

    async GetDummyCabTypeData(params){
        try {
            const response = await api.post("/GetDummyCabTypeData", {
                facilityid: params.facilityid,
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching cab type data:", error);
            throw error;
        }
    }

    async GetDummyShiftsbyDays(params){
        try {
            const response = await api.post("/GetDummyShiftsbyDays", {
                facilityID: params.facilityID,
                processID: params.processID,
                type: params.type,
                weekday: params.weekday
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching shifts by days data:", error);
            throw error;
        }
    }

    async EmpSearch(params){
        try {
            const response = await api.post("/EmpSearch", {
                locationid: params.locationid,
                empidname: params.empidname,
                IsAdmin: params.IsAdmin
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching employee data:", error);
            throw error;
        }
    }

    async GetEmployee(params){
        try {
            const response = await api.post("/GetEmployee", {
                Userid: params.Userid
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching employee data:", error);
            throw error;
        }
    }

    async GetEmpByRoute(params){
        try {
            const response = await api.post("/GetEmpByRoute", {
                routeids: params.routeids
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching employee data:", error);
            throw error;
        }
    }

    async getTransactionId() {
    try {
        const response = await api.post(
            "/getTransactionId",
            {}, // no body
            {
                headers: {
                    Accept: "application/json"
                }
            }
        );

        // API returns stringified JSON → parse it
        const parsed = typeof response.data === "string"
            ? JSON.parse(response.data)
            : response.data;

        return parsed?.[0]?.transid || null;

    } catch (error) {
        console.error("Error fetching transaction id:", error);
        throw error;
    }
}

    async GetRoutesDummyMatch(params){
        try {
            const response = await api.post("/GetRoutesDummyMatch", {
                RouteID: params.RouteID,
                DummyRouteId: params.DummyRouteId,
                ShiftDate: params.ShiftDate,
                Shift: params.Shift,
                TripType: params.TripType,
                FacId: params.FacId
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching routes dummy match:", error);
            throw error;
        }
    }
}

export default new DummyTripSheetService();