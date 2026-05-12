import { api } from "../axios/api";

class EmployeeRecordSwappingService {
  async GetDuplicateEmpDetail(params) {
    try {
      const response = await api.post("/GetDuplicateEmpDetail", params);
      return response.data; // Return the actual data from the response
    } catch (error) {
      console.error("Error in GetDuplicateEmpDetail:", error);
      throw error;
    }
  }
  async GetDuplicateEmpData() {
    try {
      const response = await api.post("/GetDuplicateEmpData");
      return response.data;
    } catch (error) {
      console.error("Error in GetDuplicateEmpData:", error);
      throw error;
    }
  }
  async GetHelpDeskEmployeeDetail(params) {
    try {
      const response = await api.post("/GetHelpDeskEmployeeDetail", params);
      return response.data;
    } catch (error) {
      console.error("Error in GetHelpDeskEmployeeDetail:", error);
      throw error;
    }
  }
  async GetEmployeeDetails(params) {
    try {
      const response = await api.post("/GetEmployeeDetails", params);
      // console.log("SelectFacilityByGroup response:", response.data); // Log the response data
      let data = response.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error("Error in parsing response:", e);
        }
      }
      return data; // Return the actual data from the response
    } catch (error) {
      console.error("Error in GetEmployeeDetails:", error);
      throw error;
    }
  }
  async UpdateDuplicateEmp(params) {
    try {
      const response = await api.post("/UpdateDuplicateEmp", {params});
      // console.log("DeleteAdhoc response:", response.data); // Log the response data
      return response.data; // Return the actual data from the response
    } catch (error) {
      console.error("Error in UpdateDuplicateEmp:", error);
      throw error;
    }
  }  

  async EmpSearch(params) {
        try {
            const response = await api.post("/EmpSearch", {
                locationid: params.locationid,
                empidname: params.empidname,
                IsAdmin: params.IsAdmin,
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching EmpSearch data:", error);
            throw error;
        }

    }
}
export default new EmployeeRecordSwappingService();
