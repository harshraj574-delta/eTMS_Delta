import { api } from "../axios/api";

class EmpAccessRightsService {
    async SelectMainMenu(params) {
        try {
            const response = await api.post('/SelectMainMenu', {
                IsAdmin: params.IsAdmin,
            });
            return response.data;
        } catch (error) {
            console.error('Error in SelectMainMenu:', error);
            throw error;
        }
    }

    async GetUserRights(params) {
        try {
            const response = await api.post('/GetUserRights', {
                empid: params.empid,
                menuid: params.menuid,
            });
            return response.data;
        } catch (error) {
            console.error('Error in GetUserRights:', error);
            throw error;
        }
    }

    async EmpSearch(params) {
        try {
            const response = await api.post('/EmpSearch', {
                locationid: params.locationid,
                empidname: params.empidname,
                IsAdmin: params.IsAdmin,
            });
            return response.data;
        } catch (error) {
            console.error('Error in EmpSearch:', error);
            throw error;
        }
    }

    async SetUserRights(params) {
        try{
            const response = await api.post('/SetUserRights', {
                empid: params.empid,
                submenuid: params.submenuid,
                userid: params.userid,
            });
            return response.data;
        } catch (error) {
            console.error('Error in SetUserRights:', error);
            throw error;
        }
    }

    async GetMenuUsersDetails(params) {
        try {
            const response = await api.post('/GetMenuUsersDetails', {
                locationid: params.locationid,
                parentmenuid: params.parentmenuid,
            });
            return response.data;
        } catch (error) {
            console.error('Error in GetMenuUsersDetails:', error);
            throw error;
        }
    }

    async GetMenuAccessDetails(params) {
        try {
            const response = await api.post('/GetMenuAccessDetails', {
                locationid: params.locationid,
            });
            return response.data;
        } catch (error) {
            console.error('Error in GetMenuAccessDetails:', error);
            throw error;
        }
    }

    async GetUserRightLogEmpWise(params) {
        try {
            const response = await api.post('/GetUserRightLogEmpWise', {
                SDate: params.SDate,
                EDate: params.EDate,
                FacilityId: params.FacilityId,
                Empid: params.Empid
            });
            return response.data;
        } catch (error) {
            console.error('Error in GetUserRightLogEmpWise:', error);
            throw error;
        }
    }

    async CopyAccess(params) {
        try {
            const response = await api.post('/CopyAccess', {
                FromEmpId: params.FromEmpId,
                ToEmpId: params.ToEmpId
            });
            return response.data;
        }
        catch (error) {
            console.error('Error in CopyAccess:', error);
            throw error;
        }
    }
}

export default new EmpAccessRightsService();