import { api } from "../axios/api";

class DriverMasterService {
  async getDriverMasterDetails(params) {
    return Promise.resolve(api.post("/SPR_DriverMasterDetails", params));
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

  async addUpdateDriverMaster(data) {
    return Promise.resolve(
      api.post("/SPR_AddUpdateDriverMaster", data)
    );
  }

  async getDocumentDetails(params) {
    return Promise.resolve(
      api.post("/SPR_DocumentDetails", params)
    );
  }
}

export default new DriverMasterService();
