import { api } from "../axios/api";

class ProcessMasterService {
  async getProcess(facilityId) {
    try {
      const response = await api.post('/GetProcess', {
        locationid: facilityId,
        empid: 0
      });
      
      // Parse if response is a string
      let data = response.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching process data:', error);
      throw error;
    }
  }

  async GetProcessNew(locationid){
    try{
      const response = await api.post('/GetProcessNew', {
        locationid: locationid
      });
      
      let data = response.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching process data:', error);
      throw error;
    }
  }

  async addProcess(processName, facilityId) {
    try {
      const response = await api.post('/AddProcess', {
        ProcessName: processName,
        facilityId: facilityId
      });
      
      let data = response.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
      return data;
    } catch (error) {
      console.error('Error adding process data:', error);
      throw error;
    }
  }

  async getSubProcess(processId) {
    try {
      const response = await api.post('/GetSubProcess', {
        processid: processId
      });
      
      let data = response.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching subprocess data:', error);
      throw error;
    }
  }

  async updateProcess(processId, processName) {
    try {
      const response = await api.post('/UpdateProcess', {
        ID: processId,
        ProcessName: processName
      });
      
      let data = response.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating process data:', error);
      throw error;
    }
  }

  async addSubProcess(processId, subProcessName) {
    try {
      const response = await api.post('/InsertSubProcess', {
        ProcessID: processId,
        SubProcessName: subProcessName
      });
      
      let data = response.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
      return data;
    } catch (error) {
      console.error('Error inserting subprocess data:', error);
      throw error;
    }
  }

  async updateSubProcess(processId, subProcessName, subProcessId) {
    try {
      const response = await api.post('/UpdateSubProcess', {
        ProcessId: processId,
        ID: subProcessId,
        SubProcessName: subProcessName
      });
      
      let data = response.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating subprocess data:', error);
      throw error;
    }
  }

  async selectFacility(userId) {
    try {
      const response = await api.post('/SelectFacility', {
        UserId: userId
      });
      
      let data = response.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
      return data;
    } catch (error) {
      console.error('Error selecting facility:', error);
      throw error;
    }
  }
}

export default new ProcessMasterService();