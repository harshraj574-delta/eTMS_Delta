import { api } from "../axios/api";

class ComplianceCheckService {

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

    async GetCompCheckOther(params) {
    try {
      const response = await api.post("/GetCompCheckOther", {
        CabId: params.CabId,
        SelDate: params.SelDate,
        FacilityID: params.FacilityID,
        VendorID: params.VendorID,
        TripType: params.TripType,
        ShiftTime: params.ShiftTime
        });
        //console.log("GetCompCheckOther response:", response.data);
        return response.data;
    } catch (error) {
      console.error("Error in GetCompCheckOther:", error);
      throw error;
    }
}

    async UpdateCompCheckMain(params) {
    try {
        const response = await api.post("/UpdateCompCheckMain", {
            SelDate: params.SelDate,
            CabId: params.CabId,
            UpdatedBy: params.UpdatedBy,
            IsOther: params.IsOther,
            OtherRemark: params.OtherRemark,
            OtherPenalty: params.OtherPenalty,
            FacilityID: params.FacilityID,
            VendorID: params.VendorID,
            TripType: params.TripType,
            ShiftTime: params.ShiftTime
        });
        //console.log("UpdateCompCheckMain response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error in UpdateCompCheckMain:", error);
        throw error;
    }

}
    // the sp sprSendVendorPenalty is what this new api 
     async SendVendorPenalty(params) {
    try {
        const response = await api.post("/SendVendorPenalty", {
            Id: params.Id
        });
        //console.log("SendVendorPenalty response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error in SendVendorPenalty:", error);
        throw error;
    }
}

 async SelectVehicleByVendor(params) {
    try {
        const response = await api.post("/SelectVehicleByVendor", {
            FacilityId: params.FacilityId,
            VendorId: params.VendorId
        });
        //console.log("SelectVehicleByVendor response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error in SelectVehicleByVendor:", error);
        throw error;
    }
}

 async GetCompCheckData(params) {
    try {
        const response = await api.post("/GetCompCheckData", {
            CabId: params.CabId,
            SelDate: params.SelDate,
            FacilityID: params.FacilityID,
            VendorID: params.VendorID,
            ShiftTime: params.ShiftTime,
            TripType: params.TripType
        });
        //console.log("GetCompCheckData response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error in GetCompCheckData:", error);
        throw error;
    }
}
  async UpdateCompCheckDetail(params) {
    try {
        const response = await api.post("/UpdateCompCheckDetail", {
            RefID: params.RefID,
            HeadID: params.HeadID,
            Status: params.Status,
            Remark: params.Remark
        });
        //console.log("UpdateCompCheckDetail response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error in UpdateCompCheckDetail:", error);
        throw error;
    }
  }
}

export default ComplianceCheckService;
