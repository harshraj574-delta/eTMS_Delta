import { api } from "../axios/api";

class ManageColonyService {
    async SelectFacility(params) {
        try {
            const response = await api.post("/SelectFacility", {
                Userid: params.Userid,
            });
           //    console.log("SelectFacility Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in SelectFacility");
            throw error;
        }
    }
    async GetRouteSeq(params) {
        try {
            const response = await api.post("/GetRouteSeq", {
                locationid: params.locationid,
                facilityid: params.facilityid,
            });
            console.log("GetRouteSeq Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in GetRouteSeq");
            throw error;
        }
    }
    async GetRouteSeqDetail(params) {
        try {
            const response = await api.post("/GetRouteSeqDetail", {
                routeID: params.routeID,
                locationID: params.locationID,
                facilityid: params.facilityid,
            });
            console.log("GetRouteSeqDetail Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in GetRouteSeqDetail");
            throw error;
        }
    }
    async GetRouteSeqCity(params) {
        try {
            const response = await api.post("/GetRouteSeqCity", {
                locationid: params.locationid,
                facilityid: params.facilityid,
            });
            console.log("GetRouteSeqCity Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in GetRouteSeqCity");
            throw error;
        }
    }
    async GetRouteSeqZone(params) {
        try {
            const response = await api.post("/GetRouteSeqZone", {
                locationid: params.locationid,
                facilityid: params.facilityid,
            });
            console.log("GetRouteSeqZone Response:", response.data);
            return response.data;
        }
        catch (error) {
            console.log("Error in GetRouteSeqZone");
            throw error;
        }
    }
    async DeleteRouteSeqColony(params) {
        try {
            const response = await api.post("/DeleteRouteSeqColony", {
                ID: params.ID,
                UserID: params.UserID,
            });
            console.log("DeleteRouteSeqColony Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in DeleteRouteSeqColony");
            throw error;
        }
    }
    async MoveColony(params) {
        try {
            const response = await api.post("/MoveColony", {

                prvID: params.prvID,
                newID: params.newID,
                UserID: params.UserID,
            });
            console.log("MoveColony Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in MoveColony");
            throw error;
        }
    }
    async UpdateRouteSeqColony(params) {
        try {
            const response = await api.post("/UpdateRouteSeqColony", {
                ID: params.ID,
                zoneName: params.zoneName,
                Bus: params.Bus,
                Metro: params.Metro,
                travelTime: params.travelTime,
                travelKm: params.travelKm,
                userID: params.userID,
                FacilityId: params.FacilityId,
                Toll: params.Toll,
                colony: params.colony,
                SubColony: params.SubColony,
            });
            console.log("UpdateRouteSeqColony Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in UpdateRouteSeqColony");
            throw error;
        }
    }
    async SaveRouteSeqColony(params) {
        try {
            const response = await api.post("/SaveRouteSeqColony", {
                ID: params.ID,
                city: params.city,
                zoneName: params.zoneName,
                Bus: params.Bus,
                Metro: params.Metro,
                travelTime: params.travelTime,
                travelKm: params.travelKm,
                userID: params.userID,
                FacilityId: params.FacilityId,
                Toll: params.Toll,
                colony: params.colony,
                SubColony: params.SubColony,
            });
            console.log("SaveRouteSeqColony Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in SaveRouteSeqColony");
            throw error;
        };
    }
    async SplitRouteCluster(params) {
        try {
            const response = await api.post("/SplitRouteCluster", {
                PointsID: params.PointsID,
                UserID: params.UserID,
            });
            console.log("SplitRouteCluster Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in SplitRouteCluster");
            throw error;
        }
    }
}
export default new ManageColonyService();