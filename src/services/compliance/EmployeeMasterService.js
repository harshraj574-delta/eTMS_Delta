import { api } from "../axios/api";

class EmployeeMasterService {
    async GetEmployee(params) {
        try {
            const response = await api.post("/GetEmployee", {
                Userid: params.Userid,
            });
            // console.log("GetEmployeeList response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error in GetEmployeeList:", error);
            throw error;
        }
    }
    async GetProcessByFacility(params) {
        try {
            const response = await api.post("/GetProcessByFacility", {
                facilityid: params.facilityid,
            });
            // console.log("GetProcessByFacility response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error in GetProcessByFacility:", error);
            throw error;
        }
    }
    async GetManagerList(params) {
        try {
            const response = await api.post("/GetManagerList", {
                locationid: params.locationid,
                empidname: params.empidname,
                IsAdmin: params.IsAdmin,
            });
            // console.log("GetManagerList response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error in GetManagerList:", error);
            throw error;
        }
    }
    async GetSubProcess(params) {
        try {
            const response = await api.post("/GetSubProcess", {
                processid: params.processid,
            });
            // console.log("GetSubProcess response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error in GetSubProcess:", error);
            throw error;
        }
    }
    async GetEmpGeoCodeDetails(params) {
        try {
            const response = await api.post("/GetEmpGeoCodeDetails", {
                empid: params.empid,
            });
            // console.log("GetEmpGeoCodeDetails response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error in GetEmpGeoCodeDetails:", error);
            throw error;
        }
    }
    async GetGeoCityByRS(params) {
        try {
            const response = await api.post("/GetGeoCityByRS", {
                locationid: params.locationid,
            });
            // console.log("GetGeoCityByRS response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error in GetGeoCityByRS:", error);
            throw error;
        }
    }
    async GetGeoCityColonyRS(params) {
        try {
            const response = await api.post("/GetGeoCityColonyRS", {
                locationid: params.locationid,
                city: params.city,
            });
            // console.log("GetGeoCityColonyRS response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error in GetGeoCityColonyRS:", error);
            throw error;
        }
    }
    async EmpSearch(params) {
        try {
            const response = await api.post("/EmpSearch", {
                locationid: params.locationid,
                empidname: params.empidname,
                IsAdmin: params.IsAdmin,
            });
            // console.log("EmpSearch response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error in EmpSearch:", error);
            throw error;
        }
    }
    async GetSubColonyRs(params) {
        try {
            const response = await api.post("/GetSubColonyRs", {
                locationid: params.locationid,
                colony: params.colony,
            });
            // console.log("GetSubColonyRs response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error in GetSubColonyRs:", error);
            throw error;
        }
    }
    async SelectAllFacilitys() {
        try {
            const response = await api.post("/SelectAllFacilitys");
            // console.log("SelectAllFacilitys response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error in SelectAllFacilitys:", error);
            throw error;
        }
    }
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
    async updateEmpGeoCode(params) {
        try {
            const response = await api.post("/updateEmpGeoCode", {
                address: params.address,
                pincode: params.pincode,
                geocodeid: params.geocodeid,
                id: params.id,
                updatedby: params.updatedby,
                no: params.no,
            });
            return response.data;
        } catch (error) {
            console.error("Error in updateEmpGeoCode:", error);
            throw error;
        }
    }
    async AddEmpAuditLog(params) {
        try {
            const response = await api.post("/AddEmpAuditLog", {
                employeeID: params.employeeID,
                ColumnName: params.ColumnName,
                updatedBy: params.updatedBy,
            });
            return response.data;
        } catch (error) {
            console.error("Error in AddEmpAuditLog:", error);
            throw error;
        }
    }
    async GenerateTmpId() {
        try {
            const response = await api.post("/GenerateTmpId");
            return response.data;
        } catch (error) {
            console.error("Error in GenerateTmpId:", error);
            throw error;
        }
    }
    async UpdateEmployee(params) {
        try {
            const response = await api.post("/UpdateEmployee", {
                id: params.id,
                empCode: params.empCode,
                empName: params.empName,
                userName: params.userName,
                designation: params.designation,
                Gender: params.Gender,
                mobile: params.mobile,
                phone: params.phone,
                email: params.email,
                attrited: params.attrited,
                tptReq: params.tptReq,
                managerId: params.managerId,
                facilityId: params.facilityId,
                processId: params.processId,
                subProcessId: params.subProcessId,
                nodalId: params.nodalId,
                address: params.address,
                pincode: params.pincode,
                geoCodeId: params.geoCodeId,
                updatedBy: params.updatedBy,
                address2: params.address2,
                geocodeid2: params.geocodeid2,
                lastworkingday: params.lastworkingday,
                specialCase: params.specialCase,
                pincode2: params.pincode2,
                coscenter: params.coscenter,
                EmergencyNo: params.EmergencyNo,
                EmegencyName: params.EmegencyName,
                MedicalRemark: params.MedicalRemark,
                MedicalExpiryDate: params.MedicalExpiryDate,
                FacEnable: params.FacEnable,
                GuardReq: params.GuardReq,
                Tptfor: params.Tptfor,
                VaccineName: params.VaccineName,
                FirstDoseDate: params.FirstDoseDate,
                SecondDoesDate: params.SecondDoesDate
            });
            return response.data;
        } catch (error) {
            console.error("Error in UpdateEmployee:", error);
            throw error;
        }
    }
    async InsertEmployee(params) {
        try {
            const response = await api.post("/InsertEmployee", {
                id: params.id,
                empCode: params.empCode,
                empName: params.empName,
                userName: params.userName,
                designation: params.designation,
                Gender: params.Gender,
                mobile: params.mobile,
                phone: params.phone,
                email: params.email,
                attrited: params.attrited,
                tptReq: params.tptReq,
                managerId: params.managerId,
                facilityId: params.facilityId,
                processId: params.processId,
                subProcessId: params.subProcessId,
                nodalId: params.nodalId,
                address: params.address,
                pincode: params.pincode,
                geoCodeId: params.geoCodeId,
                updatedBy: params.updatedBy,
                specialCase: params.specialCase,
                coscenter: params.coscenter,
                pincode2: params.pincode2,
                EmergencyNo: params.EmergencyNo,
                EmegencyName: params.EmegencyName,
                MedicalRemark: params.MedicalRemark,
                MedicalExpiryDate: params.MedicalExpiryDate,
                GuardReq: params.GuardReq,
                Tptfor: params.Tptfor,
            });
            return response.data;
        } catch (error) {
            console.error("Error in InsertEmployee:", error);
            throw error;
        }
    }
    async CheckLocationGeocode(params) {
        try {
            const response = await api.post("/CheckLocationGeocode", {
                facid: params.facid,
                ID1: params.ID1,
                ID2: params.ID2,
            });
            return response.data;
        } catch (error) {
            console.error("Error in CheckLocationGeocode:", error);
            throw error;
        }
    }
    async GetEmpLog(params) {
        try {
            const response = await api.post("/GetEmpLog", {
                LogType: params.LogType,
                employeeid: params.employeeid,
            });
            // console.log("GetEmpLog response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error in GetEmpLog:", error);
            throw error;
        }
    }
    async GetManagerbyFacilityId(params) {
        try {
            const response = await api.post("/GetManagerbyFacilityId", {
                facilityid: params.facilityid,
            });
            // console.log("GetManagerbyFacilityId response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error in GetManagerbyFacilityId:", error);
            throw error;
        }
    }
}
export default new EmployeeMasterService();
