import { api } from "../axios/api";

class EmpSpocService {
    async EmpSearch(params) {
        try {
            const response = await api.post("/EmpSearch", {
                locationid: params.locationid,
                empidname: params.empidname,
                IsAdmin: params.IsAdmin,
            });
            //console.log("EmpSearch Response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Error in Employee Search");
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

    async GetBackupSpoc(params) {
        try {
            const response = await api.post("/GetBackupSpoc", {
                empid: params.empid
            });
            // console.log("GetBackupSpoc response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error in GetBackupSpoc:", error);
            throw error;
        }
    }

    async GetEmpAssignedSPOC(params) {
        try {
            const response = await api.post("/GetEmpAssignedSPOC", {
                spocid: params.spocid,
                empids: params.empids
            });
            // console.log("GetEmpAssignedSPOC response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error in GetEmpAssignedSPOC:", error);
            throw error;
        }
    }

    async AssignSpoc(params) {
        try {
            const response = await api.post("/AssignSpoc", {
                spocid: params.spocid,
                empid: params.empid
            });
            // console.log("AssignSpoc response:", response.data);
            return response.data;
        }   catch (error) {
            console.error("Error in AssignSpoc:", error);
            throw error;
        }
    }

    async GetEmployeeByProcess(params) {
        try {
            const response = await api.post("/GetEmployeeByProcess", {
                ProcessId: params.ProcessId,
                EmpIds: params.EmpIds,
                LocationId: params.LocationId
            })
            // console.log("GetEmployeeByProcess response:", response.data);
            return response.data;
        }   catch (error) {
            console.error("Error in GetEmployeeByProcess:", error);
            throw error;
        }
    }

    async RemoveSPOC(params) {
        try {            
            const response = await api.post("/RemoveSPOC", {
                SpocID: params.SpocID,
                EmployeeId: params.EmployeeId,
                EmpIds: params.EmpIds
            });
            // console.log("RemoveSPOC response:", response.data);
            return response.data;
        }   catch (error) {
            console.error("Error in RemoveSPOC:", error);
            throw error;
        }
    }

    async AssignBackupSpoc(params) {
        try {
            const response = await api.post("/AssignBackupSpoc", {
                SpocID: params.SpocID,
                BackupSpocId: params.BackupSpocId,
                CreatedBy: params.CreatedBy
            });
            // console.log("AssignBackupSpoc response:", response.data);
            return response.data;
        }   catch (error) {
            console.error("Error in AssignBackupSpoc:", error);
            throw error;
        }
    }

    async RemoveBackupSpoc(params) {
        try {
            const response = await api.post("/RemoveBackupSpoc", {
                SpocId: params.SpocId,
                BackupSpocId: params.BackupSpocId
            });
            // console.log("RemoveBackupSpoc response:", response.data);
                return response.data;
        }   catch (error) {
            console.error("Error in RemoveBackupSpoc:", error);
            throw error;
        }
    }

    async AssignAllSpoc(params) {
        try {
            const response = await api.post("/AssignAllSpoc", {
                ProcessId: params.ProcessId,
                SpocId: params.SpocId,
                LocationId: params.LocationId,
                EmpIDs: params.EmpIDs
            })
            // console.log("AssignAllSpoc response:", response.data);
                return response.data;
        }   catch (error) {
            console.error("Error in AssignAllSpoc:", error);
            throw error;
        }       
    }

    async GetSpocDump(params) {
        try {            
            const response = await api.post("/GetSpocDump", {
                FacId: params.FacId
            });
            // console.log("GetSpocDump response:", response.data);
            return response.data;
        }   catch (error) {
            console.error("Error in GetSpocDump:", error);
            throw error;
        }
    }

    async GetBackupSpocDump(params) {
        try {
            const response = await api.post("/GetBackupSpocDump", {
                FacId: params.FacId
            });
            // console.log("GetBackupSpocDump response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error in GetBackupSpocDump:", error);
            throw error;
        }
    }
}

export default new EmpSpocService();