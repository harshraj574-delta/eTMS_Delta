import { api } from "../axios/api";

class PrintDummyTripsheetService {
    async GenerateDummySheets(params){
        try{
            const response = await api.post('/GenerateDummySheets', {
                sDate: params.sDate,
                FacilityID: params.FacilityID,
                TripType: params.TripType,
                Shift: params.Shift,
                Action: params.Action,
                NoOfSheets: params.NoOfSheets,
                GeneratedBy: params.GeneratedBy,
                CabType: params.CabType,
                EmpIDs: params.EmpIDs,
                transactionid: params.transactionid
            });
            return response.data;
        }catch(error){
            console.error('Error generating dummy sheets:', error);
            throw error;
        }
    }

    async GetDummyRoutesDetails(params){
        try{
            const response = await api.post('/GetDummyRoutesDetails', {
                routeids: params.routeids
            });
            return response.data;
        }catch(error){
            console.error('Error fetching dummy routes details:', error);
            throw error;
        }
    }

    async GetDummyRouteDetails(params){
        try{
            const response = await api.post('/GetDummyRouteDetails', {
                routeids: params.routeids
            });
            return response.data;
        }catch(error){
            console.error('Error fetching dummy route details:', error);
            throw error;
        }
    }

    async AllocateSpecialRequest(params){
        try{
            const response = await api.post('/AllocateSpecialRequest', {
                sDate: params.sDate,
                FacilityID: params.FacilityID,
                userid: params.userid,
                spid: params.spid
            });
            return response.data;
        }catch(error){
            console.error('Error allocating special request:', error);
            throw error;
        }
    }

    async SelectDummyTripSheetById(params){
        try{
            const response = await api.post('/SelectDummyTripSheetById', {
                routeids: params.routeids
            });
            return response.data;
        }catch(error){
            console.error('Error fetching dummy trip sheet by id:', error);
            throw error;
        }
    }
}

export default new PrintDummyTripsheetService();