import { api } from "../axios/api";

class ScrollingMessagesService {
  async GetAllMessages(params) {
    try {
      const response = await api.post("/getAllMessages", params);
      return response.data; // Return the actual data from the response
    } catch (error) {
      console.error("Error in GetAllMessages:", error);
      throw error;
    }
  }
  async InsertNewMessage(params) {
    try {
      const response = await api.post("/InsertNewMessage", params);
      return response.data;
    } catch (error) {
      console.error("Error in InsertNewMessage:", error);
      throw error;
    }
  }
  async UpdateMessage(params) {
    try {
      const response = await api.post("/UpdateMessage", params);
      return response.data;
    } catch (error) {
      console.error("Error in UpdateMessage:", error);
      throw error;
    }
  }
  async ActivateDeactivateMessage(params) {
    try {
      const response = await api.post("/ActivateDeactivateMessage", params);
      // console.log("SelectFacilityByGroup response:", response.data); // Log the response data
      let data = response.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error("Error parsing response:", e);
        }
      }
      return data; // Return the actual data from the response
    } catch (error) {
      console.error("Error in ActivateDeactivateMessage:", error);
      throw error;
    }
  }
  async GetGeneralMessage(params) {
    try {
      const response = await api.post("/GetGeneralMessage", {
        // Changed endpoint name to match backend
        id: params.id.toString(), // Convert to string as per API requirement
        userid: parseInt(params.userid), // Ensure it's an integer
      });
      // console.log("DeleteAdhoc response:", response.data); // Log the response data
      return response.data; // Return the actual data from the response
    } catch (error) {
      console.error("Error in GetGeneralMessage:", error);
      throw error;
    }
  }  

  async SelectFacility(params) {
        try {
            const response = await api.post("/SelectFacility", {
                Userid: params.Userid,
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching facility data:", error);
            throw error;
        }

    }
}
export default new ScrollingMessagesService();
