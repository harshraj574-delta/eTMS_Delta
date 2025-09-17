import { api } from "../axios/api";

class VehicleMasterService {
    async SelectFacility(params) {
        try {
            const response = await api.post("/SelectFacility", {
                Userid: params.Userid,
            });
            return response.data; // Return the actual data from the response
        } catch (error) {
            console.error("Error in GetFacility:", error);
            throw error;
        }
    }
    async GetVendorByFacility(params) {
        try {
            const response = await api.post("/GetVendorByFacility", {
                facilityid: params.facilityid,
            })
            return response.data;
        }
        catch (error) {
            console.error("Error in GetVendorByFacility:", error);
            throw error;
        }
    }
    async SelectVehicleType(params) {
        try {
            const response = await api.post("/SelectVehicleType", {
                vendorid: params.vendorid,
            })
            return response.data;
        } catch (error) {
            console.error("Error in SelectVehicleType:", error);
            throw error;
        }
    }
    async SPR_VehiclesDetails(params) {
        try {
            const response = await api.post("/SPR_VehiclesDetails", {
                facilityid: params.facilityid,
                vendorid: params.vendorid,
                search: params.search,
            })
            return response.data;
        } catch (error) {
            console.error("Error in SPR_VehiclesDetails:", error);
            throw error;
        }
    }
    async SPR_AddUpdateVehicle(params) {
        try {
            const response = await api.post("/SPR_AddUpdateVehicle", {
                VehicleId: params.VehicleId,
                VehicleNo: params.VehicleNo,
                VehicleRegNo: params.VehicleRegNo,
                FacilityId: params.FacilityId,
                VendorId: params.VendorId,
                VehicleTypeId: params.VehicleTypeId,
                VehicleRegDate: params.VehicleRegDate,
                PermitExpiryDate: params.PermitExpiryDate,
                InsuranceExpiryDate: params.InsuranceExpiryDate,
                FitnessExpiryDate: params.FitnessExpiryDate,
                TaxExpiryDate: params.TaxExpiryDate,
                PUCExpiryDate: params.PUCExpiryDate,
                ChasisNo: params.ChasisNo,
                ModalNo: params.ModalNo,
                FCValidDate: params.FCValidDate,
                InsuranceNo: params.InsuranceNo,
                InsuranceCompanyName: params.InsuranceCompanyName,
                PermitNo: params.PermitNo,
                PermitIssueDate: params.PermitIssueDate,
                EmissionExpiryDate: params.EmissionExpiryDate,
                CabInductionDate: params.CabInductionDate,
                CabExpiryDate: params.CabExpiryDate,
                FuleType: params.FuleType,
                Warning_1: params.Warning_1,
                Warning_2: params.Warning_2,
                FinalWarning: params.FinalWarning,
                Remark: params.Remark,
                BillingType: params.BillingType,
                Attrited: params.Attrited,
                Emergency_Contact: params.Emergency_Contact,
                Wireless_Set: params.Wireless_Set,
                FireExtinguisher: params.FireExtinguisher,
                Spare_Tyre: params.Spare_Tyre,
                Medical_Kit: params.Medical_Kit,
                Umbrella: params.Umbrella,
                Torch: params.Torch,
                Documents: params.Documents,
                UpdatedBy: params.UpdatedBy,
            })
            return response.data;
        } catch (error) {
            console.error("Error in SPR_AddUpdateVehicle:", error);
            throw error;
        }
    }
    async SPR_DocumentDetails(params) {
        try {
            const response = await api.post("/SPR_DocumentDetails", {
                type: params.type,
            })
            return response.data;
        } catch (error) {
            console.error("Error in SPR_DocumentDetails:", error);
            throw error;
        }
    }
    async SPR_AddUpdateVehicleDocument(params) {
        try {
            // If params.File is a plain object (already contains base64)
            if (params.File && !(params.File instanceof File) && !(params.File instanceof Blob)) {
                // Send as JSON
                const response = await api.post("/SPR_AddUpdateVehicleDocument", params, {
                    headers: { "Content-Type": "application/json" }
                });
                console.log("Response from SPR_AddUpdateVehicleDocument (JSON):", response);
                return response.data;
            }

            // Otherwise, default to multipart (old behavior)
            const formData = new FormData();
            formData.append("FacilityId", params.FacilityId ?? 0);
            formData.append("VehicleId", params.VehicleId ?? 0);
            formData.append("VehicleNo", params.VehicleNo ?? "");
            formData.append("DocumentId", params.DocumentId ?? 0);
            formData.append("DocumentName", params.DocumentName || (params.File ? params.File.name : ""));
            formData.append("UpdatedBy", params.UpdatedBy ?? 0);

            if (params.File instanceof File || params.File instanceof Blob) {
                formData.append("File", params.File);
            }

            const response = await api.post("/SPR_AddUpdateVehicleDocument", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            return JSON.parse(response.data);
        } catch (error) {
            console.error("Error in SPR_AddUpdateVehicleDocument:", error);
            throw error;
        }
    }

}
export default new VehicleMasterService();