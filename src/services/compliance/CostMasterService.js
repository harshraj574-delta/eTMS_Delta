import { api } from "../axios/api";

class CostMasterService {
  async SelectFacility(params) {
    try {
      const response = await api.post("/SelectFacility", {
        Userid: params.Userid,
      });
      // console.log("SelectFacility response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in SelectFacility:", error);
      throw error;
    }
  }
  async GetVendorByFac(params) {
    try {
      const response = await api.post("/GetVendorByFac", {
        facilityid: params.facilityid,
      });
      //console.log("GetVendorByFac response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in GetVendorByFac:", error);
      throw error;
    }
  }
  async SelectZoneByFac(params) {
    try {
      const response = await api.post("/SelectZoneByFac", {
        facilityid: params.facilityid,
      });
      //console.log("SelectZoneByFac response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in SelectZoneByFac:", error);
      throw error;
    }
  }
  async GetCost(params) {
    try {
      const response = await api.post("/GetCost", {
        vendorid: params.vendorid,
        vehicletype: params.vehicletype,
        facilityid: params.facilityid,
        routetype: params.routetype,
        vehicleStatus: params.vehicleStatus,
        zone: params.zone,
        fueltype: params.fueltype,
      });
      //console.log("GetCost response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in GetCost:", error);
      throw error;
    }
  }
  async AddNewCost(params) {
    try {
      const response = await api.post("/AddNewCost", {
        effectiveDate: params.effectiveDate,
        newrate: params.newrate,
        vehicleTypeID: params.vehicleTypeID,
        facilityid: params.facilityid,
        userid: params.userid,
        routetype: params.routetype,
        NonAcCost: params.NonAcCost,
        vehicleStatus: params.vehicleStatus,
        fuelrate: params.fuelrate,
        guardCost: params.guardCost,
        zone: params.zone,
        vendorid: params.vendorid,
        fueltype: params.fueltype,
      });
     // console.log("AddNewCost response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in AddNewCost:", error);
      throw error;
    }
  }
  async sprUpdateCost(params) {
    try {
      const response = await api.post("/sprUpdateCost", {
        id: params.id,
        Cost: params.Cost,
        NonAcCost: params.NonAcCost,
        UpdatedBy: params.UpdatedBy,
        guardcost: params.guardcost,
        fuelrate: params.fuelrate,
      });
      //console.log("sprUpdateCost response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in sprUpdateCost:", error);
      throw error;
    }
  }
}
export default new CostMasterService();
