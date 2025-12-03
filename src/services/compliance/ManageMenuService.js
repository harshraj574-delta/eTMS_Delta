import { api } from "../axios/api";

class ManageMenuService {
    async SelectMainMenu(params) {
        try {
            const response = await api.post('/SelectMainMenu', {
                IsAdmin: params.IsAdmin
            });
            return response.data;
        } catch (error) {
            console.error('Error in SelectMainMenu:', error);
            throw error;
        }
    }
    async UpdateMenu(params) {
        try {
            const response = await api.post('/UpdateMenu', {
                Text: params.Text,
                Description: params.Description,
                ParentID: params.ParentID,
                NavigateUrl: params.NavigateUrl,
                MenuID: params.MenuID,
            });
            return response.data;
        } catch (error) {
            console.error('Error in UpdateMenu:', error);
            throw error;
        }
    }
    async SelectSubMenu(params) {
        try {
            const response = await api.post('/SelectSubMenu', {
                menuid: params.menuid
            });
            return response.data;
        } catch (error) {
            console.error('Error in SelectSubMenu:', error);
            throw error;
        }
    }
    async InsertMenu(params) {
        try{
            const response = await api.post('/InsertMenu', {
                Text: params.Text,
                Description: params.Description,
                ParentID: params.ParentID,
                NavigateUrl: params.NavigateUrl,
            });
            return response.data;
        }catch(error){
            console.error('Error in InsertMenu:', error);
            throw error;
        }
    }
    // async InsertMenu(params) {
    //     try {
    //         const payload = {
    //             Text: params.Text,
    //             Description: params.Description,
    //             ParentID: params.ParentID === null ? null : params.ParentsID,
    //             NavigateUrl: params.NavigateUrl,
    //         };

    //         console.log("InsertMenu Payload:", payload);

    //         const response = await api.post('/InsertMenu', payload);
    //         return response.data;

    //     } catch (error) {
    //         console.error('Error in InsertMenu:', error);
    //         throw error;
    //     }
    // }
    async DeleteMenu(params) {
        try {
            const response = await api.post('/DeleteMenu', {
                menuid: params.menuid,
            });
            return response.data;
        } catch (error) {
            console.error('Error in DeleteMenu:', error);
            throw error;
        }
    }
}
export default new ManageMenuService();