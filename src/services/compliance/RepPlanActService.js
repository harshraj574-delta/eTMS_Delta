import {api} from "../axios/api";
class RepPlanActService {
  async SelectFacility(params) {
    try {
      const response = await api.post('/SelectFacility', {
        Userid: params.Userid
      });

      return response.data;
    } catch (error) {
        console.error('Error in SelectFacility:', error);
        throw error;
    }
  }
  async RptPlanAct(params) {
    try {
      const response = await api.post('/RptPlanAct', {
        sDate: params.sDate,
        eDate: params.eDate,
        facilityid: params.facilityid,
        triptype: params.triptype
      });
      return response.data;
    } catch (error) {
        console.error('Error in RptPlanAct:', error);
        throw error;
    }
  }
  async RptPlanActShiftWise(params) {
    try {
      const response = await api.post('/RptPlanActShiftWise', {
        sDate: params.sDate,
        eDate: params.eDate,
        facilityid: params.facilityid,
        triptype: params.triptype
      });
      return response.data;
    } catch (error) {
        console.error('Error in RptPlanActShiftWise:', error);
        throw error;
    }
  } 
  async RptPlanActDetailed(params) {
    try {
      const response = await api.post('/RptPlanActDetailed', {
        sDate: params.sDate,
        facilityid: params.facilityid,
        triptype: params.triptype,
        shift: params.shift
      });
      return response.data;
    } catch (error) {
        console.error('Error in RptPlanActDetailed:', error);
        throw error;
    }
  }
}
export default new RepPlanActService();