import { api } from "../axios/api";

class GuardMasterService {
    async getGuardMasterDetails(params) {
        return Promise.resolve(api.post("/GetGuardDetails", params));
    }
    async getFacilities(params) {
        return Promise.resolve(api.post("/GetFacility", params));
    }
    async getVenders(params) {
        return Promise.resolve(api.post("/GetVendorByFacility", params));
    }
    async getFacilitiesByUserId(id) {
        return Promise.resolve(api.post("/SelectAllFacility", { Userid: id }));
    }
    async UpdateGuard(params) {
        return Promise.resolve(api.post("/UpdateGuardMaster", params));
    }
    async SaveGuard(params) {
        return Promise.resolve(api.post("/InsertNewGuard", params));
    }

    async GetNewGuardID(params) {
        return Promise.resolve(api.post("/GetTempEmpID", params));
    }
    async SPR_DocumentDetails(params) {
        return Promise.resolve(api.post("/SPR_DocumentDetails", { type: params.type }));
    }
}

export default new GuardMasterService();