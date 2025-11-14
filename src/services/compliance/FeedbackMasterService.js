import { api } from "../axios/api";

class FeedbackMasterService {
  async GetComplaintCategory(facilityId) {
    try {
      const response = await api.post('/GetComplaintCategory', {
        facID: facilityId,
      });
      let data = response.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      return data;
    } catch (error) {
      console.error('Error fetching complaint categories:', error);
      throw error;
    }
  }

  async GetComplaintType(categoryId) {
    try {
      const response = await api.post('/GetComplaintType', {
        ComplaintCategoryID: categoryId,
      });
      let data = response.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      return data;
    } catch (error) {
      console.error('Error fetching complaint types:', error);
      throw error;
    }
  }

  async UpdateComplaintType(Id, CompName, sev, CategoryId) {
    try {
      const response = await api.post('/UpdateComplaintType', {
        Id: Id,
        CompName: CompName,
        sev: sev,
        CategoryId: CategoryId,
      });
      let data = response.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      return data;
    } catch (error) {
      console.error('Error updating complaint type:', error);
      throw error;
    }
  }

  async InsertComplaintType(CompName, sev, CategoryId) {
    try {
      const response = await api.post('/InsertComplaintType', {
        CompName: CompName,
        sev: sev,
        CategoryId: CategoryId,
      });
      let data = response.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      return data;
    } catch (error) {
      console.error('Error inserting complaint type:', error);
      throw error;
    }
  }
}

export default new FeedbackMasterService();