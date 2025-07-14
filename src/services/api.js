import axios from "axios";
import { map } from "lodash";

const api = axios.create({
  baseURL: "/api/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const apiService = {
  //Login Validation
  login: async (credentials) => {
    try {
      const response = await api.post("/GetPassword", {
        UserName: credentials.username,
        Password: credentials.password,
      });
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  //Get User Details
  Spr_GetuserId: async (credentials) => {
    try {
      const response = await api.post("/Spr_GetuserId", {
        UserName: credentials.username,
      });
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  //Get User Details
  GetLockDetails: async (params) => {
    try {
      const response = await api.post("/GetLockDetails", {
        facID: params.facID,
      });

      return JSON.parse(response.data);
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  //get menu details
  Spr_GetMenuItem: async (credentials) => {
    try {
      const response = await api.post("/Spr_GetMenuItem", {
        UserName: credentials.userID,
      });

      // Transform the data to ensure all required fields
      const menuItems = response.data.map((item) => ({
        MenuId: item.MenuID,
        MenuName: item.Text,
        MenuURL: item.NavigateUrl || "#",
        ParentId: item.ParentID || 0,
        IconClass: item.Description || "",
        IsActive: true, //Boolean(item.IsActive),
        OrderNo: item.RowNo || 0,
        // Add any other fields your API returns
      }));

      return menuItems;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  GetSpocAssignedProcess: async (params) => {
    try {
      const response = await api.post("/GetSpocAssignedProcess", {
        empid: params.empid,
        type: params.type,
      });
      return JSON.parse(response.data);
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  GetBackupMgrId: async (params) => {
    try {
      const response = await api.post("/GetBackupMgrId", {
        backupmgrid: params.backupmgrid,
      });
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  GetMgrSchedule: async (params) => {
    try {
      const response = await api.post("/GetMgrSchedule", {
        mgrid: params.mgrid,
        sdate: params.sdate,
      });
      return JSON.parse(response.data);
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  SelectFacilityByGroup: async (params) => {
    try {
      const response = await api.post("/SelectFacilityByGroup", {
        empid: params.empid,
      });
      return JSON.parse(response.data);
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  GetShiftsbyDays: async (params) => {
    try {
      const response = await api.post("/GetShiftsbyDays", {
        facilityid: params.facilityid,
        type: params.type,
        weekday: params.weekday,
        ProcessId: params.ProcessId,
      });
      return JSON.parse(response.data);
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  GetMgrAssociate: async (params) => {
    try {
      const response = await api.post("/GetMgrAssociate", {
        mgrId: params.mgrId,
        ProcessId: params.ProcessId,
      });
      return JSON.parse(response.data);
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },
  InsertNewSchedule: async (params) => {
    try {
      const response = await api.post("/InsertNewSchedule", {
        empID: String(params.empID),
        fromDate: String(params.fromDate),
        toDate: String(params.toDate),
        facilityIn: String(params.facilityIn),
        facilityOut: String(params.facilityOut),
        logIn: String(params.logIn),
        logOut: String(params.logOut),
        WeeklyOff: String(params.WeeklyOff),
        userID: String(params.userID),
        weekendlogin: String(params.weekendlogin),
        weekendlogout: String(params.weekendlogout),
        pickadflag: String(params.pickadflag),
        dropadflag: String(params.dropadflag),
      });

      if (response && response.data) {
        console.log("InsertNewSchedule:", response.data);
        return JSON.parse(response.data);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },
  UpdateEmpSchedule: async (params) => {
    try {
      const response = await api.post("/UpdateEmpSchedule", {
        empID: params.empID,
        StartDate: params.StartDate,
        StartTime: params.StartTime,
        EndTime: params.EndTime,
        pickFacilityID: params.pickFacilityID,
        dropFacilityID: params.dropFacilityID,
        userName: params.userName,
        pickadflag: params.pickadflag,
        dropadflag: params.dropadflag,
        remark: params.remark,
      });
      console.log("UpdateEmpSchedule:", response.data);
      return JSON.parse(response.data);
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },
  GetOneEmployeeSchedule: async (params) => {
    try {
      const response = await api.post("/GetOneEmployeeSchedule", {
        empid: params.empid,
        sDate: params.sdate,
      });
      console.log("GetOneEmployeeSchedule:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },
  GetPickShiftTime: async (params) => {
    try {
      const response = await api.post("/GetPickShiftTime", {
        facilityid: params.facilityid,
        sdate: params.sdate,
        empid: params.empid,
        processid: params.processid,
      });
      console.log("GetPickShiftTime", response.data);
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },
  GetDropShiftTime: async (params) => {
    try {
      const response = await api.post("/GetDropShiftTime", {
        facilityid: params.facilityid,
        sdate: params.sdate,
        callfrom: params.callfrom,
        empid: params.empid,
        processid: params.processid,
      });
      console.log("GetDropShiftTime", response.data);
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },
  GetMyTrips: async (params) => {
    try {
      const response = await api.post("/GetMyTrips", {
        empid: params.empid,
        sDate: params.sDate,
        eDate: params.eDate,
      });
      console.log("GetMyTrips Data:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },
  GetMyRoutesDetails: async (params) => {
    try {
      const response = await api.post("/GetMyRoutesDetails", {
        empid: params.empid,
        sDate: params.sDate,
        triptype: params.triptype,
        routeid: params.routeid,
      });
      console.log("GetMyRoutesDetaails List:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Response", error);
      throw error.response?.data || error.message;
    }
  },
  async CancelTrip(params) {
    try {
      const response = await api.post("/CancelTrip", {
        routeid: params.routeid,
        EmployeeId: params.EmployeeId,
        updatedby: params.updatedby,
        shiftdate: params.shiftdate,
        triptype: params.triptype,
        Reason: params.Reason,
      });
      console.log("CancelTrip Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },
  ReplicateSchedule: async (params) => {
    try {
      // Validate required parameters
      if (
        !params.EmpIds ||
        !params.FromSDate ||
        !params.FromEDate ||
        !params.ToSDate ||
        !params.ToEDate ||
        !params.updatedBy
      ) {
        throw new Error("Missing required parameters");
      }

      // Format the request body according to the API requirements
      const requestBody = {
        EmpIds: params.EmpIds,
        FromSDate: params.FromSDate,
        FromEDate: params.FromEDate,
        ToSDate: params.ToSDate,
        ToEDate: params.ToEDate,
        updatedBy: params.updatedBy,
      };

      console.log("ReplicateSchedule request params:", requestBody);

      const response = await api.post("/ReplicateSchedule", requestBody);
      console.log("ReplicateSchedule raw response:", response);

      if (!response.data) {
        throw new Error("No data received from server");
      }

      console.log("ReplicateSchedule data:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in ReplicateSchedule:", error);
      throw error;
    }
  },
  ///Feedback pages

  //Get Feedback Data
  Spr_sprSelectFeedBack: async (credentials) => {
    try {
      const userId = credentials.userId || sessionStorage.getItem("ID");

      // Get date range from credentials or default to 1 year
      const endDate = credentials.endDate
        ? new Date(credentials.endDate)
        : new Date();
      const startDate = credentials.startDate
        ? new Date(credentials.startDate)
        : new Date();

      if (!credentials.startDate) {
        startDate.setFullYear(endDate.getFullYear() - 1);
      }

      // Format dates as required by API (YYYY-MM-DD HH:mm:ss.SSS)
      const sDate = `${startDate.toISOString().split("T")[0]} 00:00:00.000`;
      const eDate = `${endDate.toISOString().split("T")[0]} 00:00:00.000`;

      const response = await api.post("/sprSelectFeedBack", {
        empid: userId,
        sDate: sDate,
        eDate: eDate,
      });

      const formattedData = response.data.map((item) => ({
        TicketNo: item.TicketNo || "",
        TypeName: item.TypeName || "",
        empCode: item.empCode || "",
        empName: item.empName || "",
        Desrp: item.Desrp || "",
        ActionBy: item.ActionBy || "",
        RouteId: item.RouteId || "",
        RaisedDate: item.RaisedDate || "",
        UpdatedAt: item.UpdatedAt || new Date().toISOString(),
        Status: item.Status || "",
        Enableds: item.Enableds || 0,
        ReOpenStatus: item.ReOpenStatus || 0,
        StatusText: item.StatusText || "",
      }));

      console.log("Formatted Response:", formattedData);
      return formattedData;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },
  //Get Feedback Status

  Spr_sprSelectReply: async (credentials) => {
    try {
      const response = await api.post("/sprSelectReply", {
        TicketNo: credentials.ticketNo,
      });

      // Format the response data
      const formattedData = Array.isArray(response.data)
        ? response.data.map((item) => ({
          TicketNo: item.TicketNo || "",
          empCode: item.empCode || "",
          empName: item.empName || "",
          Descp: item.Descp || "",
          UpdatedAt: item.UpdatedAt || new Date().toISOString(),
          Status: item.Status || "",
          StatusId: item.StatusId || 0,
        }))
        : [];

      console.log("Reply Data:", formattedData);
      return formattedData;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },
  //Get Feedback CategoryDropDown Data
  Spr_GetComplaintCategory: async (credentials) => {
    try {
      const response = await api.post("/GetComplaintCategory", {
        facID: credentials.facID,
      });
      const DropDown = Array.isArray(response.data)
        ? response.data.map((item) => ({
          id: item.id || 0,
          Category: item.Category || "",
        }))
        : [];
      console.log("Category DropDown Data:", DropDown);
      return DropDown;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },
  //Get Feedback TypeDropDown Data
  Spr_GetComplaintType: async (credentials) => {
    try {
      const response = await api.post("/GetComplaintType", {
        ComplaintCategoryID: credentials.ComplaintCategoryID,
      });
      const DropDown = Array.isArray(response.data)
        ? response.data.map((item) => ({
          id: item.id || 0,
          Category: item.Category || "",
          CompName: item.CompName || "",
          C_Type: item.C_Type || "",
          severity: item.severity || 0,
        }))
        : [];
      console.log("Type DropDown Data:", DropDown);
      return DropDown;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },
  //Get Feedback Count
  getFeedbackcount: async (credentials) => {
    try {
      const response = await api.post("/getFeedbackcount", {
        empid: credentials.empid,
        sdate: credentials.sdate,
        edate: credentials.edate,
      });
      console.log("Feedback Count Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },
  sprInsertFeedBackDetails: async (credentials) => {
    try {
      const response = await api.post("/sprInsertFeedBackDetails", {
        ticketno: credentials.ticketNo,
        desc: credentials.desc,
        actionid: credentials.actionid,
        statusid: credentials.statusid,
        FeedTypeId: credentials.FeedTypeId,
        RaisedDate: credentials.RaisedDate,
        RaisedById: credentials.RaisedById,
        RouteId: credentials.RouteId,
      });
      console.log("Insert Feedback Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  Spr_sprInsertReopen: async (credentials) => {
    try {
      const response = await api.post("/sprInsertReopen", {
        ticketno: credentials.ticketNo,
        desc: credentials.desc,
        actionid: credentials.actionid,
        statusid: credentials.statusid,
      });
      console.log("Reopen Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },
  //Get EmpGeoCodeDetails MyProfile Page
  GetEmpGeoCodeDetails: async (credentials) => {
    try {
      const response = await api.post("/GetEmpGeoCodeDetails", {
        empid: credentials.empid,
      });
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },
  //Dashboard Stats Api's
  Getchart_RouteCount: async (credentials) => {
    try {
      const response = await api.post("/Getchart_RouteCount", {
        sDate: credentials.sDate,
        eDate: credentials.eDate,
        locationid: credentials.locationid || 0,
        facilityid: credentials.facilityid || 0,
        vendorid: credentials.vendorid || 0,
        triptype: credentials.triptype || "",
      });

      //console.log("Getchart_RouteCount Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  //Dashboard Map Api's
  GetPickDropcount_shiftwise: async (credentials) => {
    try {
      const response = await api.post("/GetPickDropcount_shiftwise", {
        sDate: credentials.sDate,
        eDate: credentials.eDate,
        locationid: credentials.locationid || 0,
        facilityid: credentials.facilityid || 0,
        vendorid: credentials.vendorid || 0,
        triptype: credentials.triptype || "",
      });

      //console.log("GetPickDropcount_shiftwise Response -------->:", response.data);

      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Normal vs Adhoc Trips
  GetNormalAdhoc_shiftwise: async (credentials) => {
    try {
      const response = await api.post("/GetNormalAdhoc_shiftwise", {
        sDate: credentials.sDate,
        eDate: credentials.eDate,
        locationid: credentials.locationid || 0,
        facilityid: credentials.facilityid || 0,
        vendorid: credentials.vendorid || 0,
        triptype: credentials.triptype || "",
      });

      console.log(
        "Get Normal Adhoc Shiftwise Response -------->:",
        response.data
      );

      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Drop Safe Overview
  GetDropSafe_shiftwise: async (credentials) => {
    try {
      const response = await api.post("/GetDropSafe_shiftwise", {
        sDate: credentials.sDate,
        eDate: credentials.eDate,
        locationid: credentials.locationid,
        facilityid: credentials.facilityid,
        vendorid: credentials.vendorid,
        triptype: credentials.triptype,
      });

      //console.log("Drop Safe Overview Response API.JS -------->:", response.data);

      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get Drop Safe Count
  GetDropSafecount: async (credentials) => {
    try {
      const response = await api.post("/GetDropSafecount", {
        sDate: credentials.sDate,
        eDate: credentials.eDate,
        locationid: credentials.locationid || 0,
        facilityid: credentials.facilityid || 0,
        vendorid: credentials.vendorid || 0,
        triptype: credentials.triptype || "",
      });
      //console.log("Get Drop Safe Count API.JS -------->:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  //getchart_ Cancel Reallocation
  getchart_CancelReallocation: async (credentials) => {
    try {
      const response = await api.post("/getchart_CancelReallocation", {
        sDate: credentials.sDate,
        eDate: credentials.eDate,
        locationid: credentials.locationid || 0,
        facilityid: credentials.facilityid || 0,
        vendorid: credentials.vendorid || 0,
        triptype: credentials.triptype || "",
      });

      //console.log("Cancel Reallocation -------->:", response.data);

      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  //Shift Completion Vs Pending
  // getchart_CancelReallocation: async (credentials) => {
  //   try {

  //     const response = await api.post("/getchart_CancelReallocation", {
  //       sDate: credentials.sDate,
  //       eDate: credentials.eDate,
  //       locationid: credentials.locationid || 0,
  //       facilityid: credentials.facilityid || 0,
  //       vendorid: credentials.vendorid || 0,
  //       triptype: credentials.triptype || "",
  //     });

  //     console.log("Shift Completion Vs Pending -------->:", response.data);

  //     return response.data;
  //   } catch (error) {
  //     console.error("API Error:", error);
  //     throw error.response?.data || error.message;
  //   }
  // },

  //Shift Completion Progress
  getShiftCompletePending: async (body) => {
    try {
      const response = await api.post("/getchart_completePending", {
        sDate: body.sDate,
        eDate: body.eDate,
        locationid: body.locationid || 0,
        facilityid: body.facilityid || 0,
        vendorid: body.vendorid || 0,
        triptype: body.triptype || "",
      });
      console.log("Shift Completion Vs Pending -------->:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  sp_getAllLocation: async () => {
    try {
      const response = await api.post("/sp_getAllLocation");
      //console.log("get AllLocation DashBoard ---->", response);
      return response.data;
    } catch (error) {
      console.log("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  //Shift/Employee/Occupancy per Trip
  GetEmpOccupancy: async (body) => {
    try {
      const response = await api.post("/GetEmpOccupancy_shiftwise", {
        sDate: body.sDate,
        eDate: body.eDate,
        locationid: body.locationid || 0,
        facilityid: body.facilityid || 0,
        vendorid: body.vendorid || 0,
        triptype: body.triptype || "",
      });
      console.log(
        "Shift/Employee/Occupancy per Trip -------->:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  getRoutedEmpGeocode: async (params) => {
    try {
      const response = await api.post("/sp_getRoutedEmpGeocode", {
        facilityid: params.facilityid,
        sDate: params.sDate,
        triptype: params.triptype,
        type: params.type,
      });
      console.log("Get Routed Emp Geocode Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Error: map", error);
      throw error.response?.data || error.message;
    }
  },

  get_VProutecount: async (credentials) => {
    try {
      const response = await api.post("/sp_VProutecount", {
        sDate: credentials.sDate,
        eDate: credentials.eDate,
        locationid: credentials.locationid,
        facilityid: credentials.facilityid,
        vendorid: credentials.vendorid,
        triptype: credentials.triptype,
      });

      console.log("VP Route Count -------->:", response.data);

      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },
  GetChart_VUcount: async (credentials) => {
    try {
      const response = await api.post("/GetChart_VUcount", {
        sDate: credentials.sDate,
        eDate: credentials.eDate,
        locationid: credentials.locationid,
        facilityid: credentials.facilityid,
        vendorid: credentials.vendorid,
        triptype: credentials.triptype
      });
      console.log("GetChart_VUcount Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },
  //facility master and location master
  locationid: async (params) => {
    try {
      const response = await api.post("/GetGeoCityByRS", {
        locationid: params.locationid,
      });
      //console.log("locationid--xx-->:", response.data);
      return JSON.parse(response.data);
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  //Select Facility
  // selectFacility: async (params) => {
  //   try {
  //     const response = await api.post("/SelectFacility", {
  //       Userid: params.Userid,
  //     });
  //     return JSON.parse(response.data);
  //   } catch (error) {
  //     console.error("API Error:", error);
  //     throw error.response?.data || error.message;
  //   }
  // },

  //Select All Facility
  // selectAllFacility: async (params) => {
  //   try {
  //     const response = await api.post("/SelectAllFacility", {
  //       Userid: params.Userid,
  //     });
  //     return JSON.parse(response.data);
  //   } catch (error) {
  //     console.error("API Error:", error);
  //     throw error.response?.data || error.message;
  //   }
  // },

  // Deepak Kumar

  SelectLocation: async (params) => {
    try {
      const response = await api.post("/SelectLocation", {
        Userid: params.Userid,
      });
      return JSON.parse(response.data);
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  InsertLocation: async (params) => {
    try {
      const response = await api.post("/InsertLocation", {
        locationname: params.locationname,
      });
      return JSON.parse(response.data);
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  UpdateLocation: async (params) => {
    try {
      const response = await api.post("/UpdateLocation", {
        locationname: params.locationname,
        id: params.id,
      });
      return JSON.parse(response.data);
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  // UpdateLocation: async (params) => {
  //   try {
  //     const response = await api.post("/UpdateLocation", {
  //       locationname: params.locationname,
  //       id:params.id,
  //     });
  //     return JSON.parse(response.data);
  //   } catch (error) {
  //     console.error("API Error:", error);
  //     throw error.response?.data || error.message;
  //   }
  // },

  GetFacility: async (params) => {
    try {
      const response = await api.post("/GetFacility", {
        locationid: params.locationid,
      });
      return JSON.parse(response.data);
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  SelectAllFacility: async (params) => {
    try {
      const response = await api.post("/SelectAllFacility");
      return JSON.parse(response.data);
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  SelectFacility: async (params) => {
    try {
      const response = await api.post("/SelectFacility", {
        Userid: params.Userid,
      });
      return JSON.parse(response.data);
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },


  InsertFacility: async (params) => {
    try {
      const response = await api.post("/InsertFacility", {
        facility: params.facility,
        geoX: params.geoX,
        geoY: params.geoY,
        tptEmail: params.tptEmail,
        tptContactNo: params.tptContactNo,
        locationId: params.locationId,
        locationName: params.locationName,
        ShiftInchargeMail: params.ShiftInchargeMail,
        SiteLeadMail: params.SiteLeadMail,
        CityLeadMail: params.CityLeadMail,
      });
      return JSON.parse(response.data);
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  UpdateFacility: async (params) => {
    try {
      const response = await api.post("/UpdateFacility", {
        facility: params.facility,
        geoX: params.geoX,
        geoY: params.geoY,
        tptEmail: params.tptEmail,
        tptContactNo: params.tptContactNo,
        Id: params.Id,
        locationId: params.locationId,
        locationName: params.locationName,
        ShiftInchargeMail: params.ShiftInchargeMail,
        SiteLeadMail: params.SiteLeadMail,
        CityLeadMail: params.CityLeadMail,
      });
      return JSON.parse(response.data);
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  GetLevelDetail: async (params) => {
    try {
      const response = await api.post("/GetLevelDetail", {
        locationid: params.locationid,
      });
      return JSON.parse(response.data);
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },

  AddLevelDetails: async (params) => {
    try {
      const response = await api.post("/AddLevelDetails", {
        ContactName: params.ContactName,
        ContactNo: params.ContactNo,
        Email: params.Email,
        LocationId: params.LocationId,
        Level: params.Level,
      });
      return JSON.parse(response.data);
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error.message;
    }
  },
  //vendor master
  GetVendorByFacility: async (params) => {
  try {
    const response = await api.post("/GetVendorByFacility", {
      facilityid: params.facilityid,
    });
    return JSON.parse(response.data);
  } catch (error) {
    console.error("API Error:", error);
    throw error.response?.data || error.message;
  }
},
 
UpdateVendor: async (params) => {
  try {
    const response = await api.post("/UpdateVendor", {
      vendorName: params.vendorName,
      vendorStrength: params.vendorStrength,
      vendorContact: params.vendorContact,
      vendorInfo: params.vendorInfo,
      facilityId: params.facilityId,
      vendorType:params.vendorType,
      attrited: params.attrited,
      ID: params.ID,
      EmailId: params.EmailId,
      vendorStrength2: params.vendorStrength2,
      vendorStrength3: params.vendorStrength3,
      Updatedby: params.Updatedby
    });
    return JSON.parse(response.data);
  } catch (error) {
    console.error("API Error:", error);
    throw error.response?.data || error.message;
  }
},
 
InsertVendor: async (params) => {
  try {
    const response = await api.post("/InsertVendor", {
      vendorName: params.vendorName,
      vendorStrength: params.vendorStrength,
      vendorContact: params.vendorContact,
      vendorInfo: params.vendorInfo,
      facilityId: params.facilityId,
      vendorType:params.vendorType,
      attrited: params.attrited,  
      EmailId: params.EmailId,
      vendorStrength2: params.vendorStrength2,
      vendorStrength3: params.vendorStrength3,
      Updatedby: params.Updatedby
    });
    return JSON.parse(response.data);
  } catch (error) {
    console.error("API Error:", error);
    throw error.response?.data || error.message;
  }
},
 
SelectVehicleTypeFacility: async (params) => {
  try {
    const response = await api.post("/SelectVehicleTypeFacility?vendorid="+params.vendorid+"&facilityid="+params.facilityid);
    return JSON.parse(response.data);
  } catch (error) {
    console.error("API Error:", error);
    throw error.response?.data || error.message;
  }
},
 
UpdateVehicleType: async (params) => {
  try {
    const response = await api.post("/UpdateVehicleType", {
      vehicle: params.vehicle,
      cost_ac: params.cost_ac,
      cost_nonac: params.cost_nonac, 
      occupancy: params.occupancy,
      vendorId: params.vendorId,
      updatedBy: params.updatedBy, 
      updatedAt: params.updatedAt,
      scheme: params.scheme,
      Id: params.Id, 
    })  
 
    return JSON.parse(response.data);
  } 
  catch(error){
    console.error("API Error:", error);
    throw error.response?.data || error.message;
  }
},
 
 
GetSelectedVendor: async (params) => {
  try {
    const response = await api.post("/GetSelectedVendor", {
      vendorid: params.vendorid,
    });
    return JSON.parse(response.data);
  } catch (error) {
    console.error("API Error:", error);
    throw error.response?.data || error.message;
  }
},
 
 
sp_getvehicledetails: async (params) => {
  try {
    const response = await api.post("/sp_getvehicledetails", params);
    return JSON.parse(response.data);
  } catch (error) {
    console.error("API Error:", error);
    throw error.response?.data || error.message;
  }
},
 
 
SelectVehicleType: async (param) => {
  try{
    const response = await api.post("/SelectVehicleType",param);
    return JSON.parse(response.data);
  }
  catch (error) {
    console.error("API Error:", error);
    throw error.response?.data || error.message;
  }
},

};
