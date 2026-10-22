import axios from "axios";

const sosApi = axios.create({
  baseURL: "/api/api/v1",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

export const sosService = {
  checkSOS: async () => {
    const response = await sosApi.post("/WBS_checkSOS", { flag1: "", flag2: "", flag3: "" });
    const data = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
    return Array.isArray(data) ? data.filter((item) => item.msg !== null) : [];
  },

  updateSOS: async ({ sosid, remark, actionby }) => {
    const response = await sosApi.post("/WBS_UpdateSOS", {
      flag1: "",
      flag2: "",
      sosid,
      remark: remark || "",
      actionby: actionby || 0,
    });
    return response.data;
  },
};
