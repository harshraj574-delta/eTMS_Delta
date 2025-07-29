import { api } from "../axios/api";
class CostMasterPackageService {
  async PackageGetCost(params) {
    try {
      const response = await api.post("/PackageGetCost", {
        facilityid: params.facilityid,
        vendorid: params.vendorid,
        vehicletype: params.vehicletype,
        vehicleStatus: params.vehicleStatus,
        fueltype: params.fueltype,
      });
      // console.log("PackageGetCost response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in PackageGetCost:", error);
      throw error;
    }
  }
  async AddNewPackageCost(params) {
    try {
      const response = await api.post("/AddNewPackageCost", {
        effectiveDate: params.effectiveDate,
        newrate: params.newrate,
        vehicleTypeID: params.vehicleTypeID,
        facilityid: params.facilityid,
        userid: params.userid,
        NonAcCost: params.NonAcCost,
        vehicleStatus: params.vehicleStatus,
        fuelrate: params.fuelrate,
        guardCost: params.guardCost,
        kms: params.kms,
        hrs: params.hrs,
        vendorid: params.vendorid,
        fueltype: params.fueltype,
      });
      // console.log("AddNewPackageCost response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in AddNewPackageCost:", error);
      throw error;
    }
  }
  async sprUpdatePackageCost(params) {
    try {
      const response = await api.post("/sprUpdatePackageCost", {
        Id: params.Id,
        Cost: params.Cost,
        NonAcCost: params.NonAcCost,
        UpdatedBy: params.UpdatedBy,
        guardcost: params.guardcost,
        fuelrate: params.fuelrate,
        kms: params.kms,
        hrs: params.hrs,
      });
      // console.log("sprUpdatePackageCost response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in sprUpdatePackageCost:", error);
    }
    throw error;
  }
}

export default new CostMasterPackageService();
