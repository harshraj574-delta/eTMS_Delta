import { api } from "../axios/api";
class SystemSettingService {
  async GetConfiguration(params) {
    try {
      const response = await api.post("/GetConfiguration", {
        facilityid: params.facilityid,
      });
      //console.log("GetConfiguration response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in GetConfiguration:", error);
      throw error;
    }
  }
  async GetRegex(params) {
    try {
      const response = await api.post("/GetRegex", {
        configname: params.configname,
        facilityid: params.facilityid,
      });
      //console.log("GetRegex response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in GetRegex:", error);
      throw error;
    }
  }
  async AddSetting(params) {
    try {
      const response = await api.post("/AddSetting", {
        configname: params.configname,
        configvalue: params.configvalue,
        description: params.description,
        id: params.id,
        userid: params.userid,
      });
      //console.log("AddSetting response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in AddSetting:", error);
      throw error;
    }
  }
}
export default new SystemSettingService();
