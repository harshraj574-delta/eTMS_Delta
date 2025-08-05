import { api } from "../axios/api";
class EmpDumpService {
    async GetEmpDump(params) {
        try {
            const response = await api.post("/GetEmpDump", {
                facilityid: params.facilityid,
                attrited: params.attrited,
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching Emp Dump:", error);
            throw error;
        }
    }
    async GetAllEmployeeDump(){
        try {
            const response = await api.post("/GetAllEmployeeDump", {
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching all employee dump:", error);
            throw error;
        }
    }
}
export default new EmpDumpService();
