// mapgeocodingService.js
import { api } from "../axios/api";

class MapGeocodingService {

  _parseResponse(response) {
    try {
      // If response.data is a string, parse it
      if (typeof response.data === "string") {
        return JSON.parse(response.data);
      }
      // If already parsed, return as is
      return response.data;
    } catch (error) {
      console.error("Error parsing response:", error, response.data);
      return [];
    }
  }

  async GetEmpCount(params) {
    try {
      const response = await api.post("/GetEmpCount", {
        locationid: params.locationid,
      });
      return this._parseResponse(response);
    } catch (error) {
      console.error("Error fetching employee count:", error);
      throw error;
    }
  }

  async GetNotGeoCodedCount(params) {
    try {
      const response = await api.post("/GetNotGeoCodedCount", {
        locationid: params.locationid,
      });
      return this._parseResponse(response);
    } catch (error) {
      console.error("Error fetching not geocoded count:", error);
      throw error;
    }
  }

  async GetNonGeocodedChangeCount(params) {
    try {
      const response = await api.post("/GetNonGeocodedChangeCount", {
        locationid: params.locationid,
      });
      return this._parseResponse(response);
    } catch (error) {
      console.error("Error fetching non geocoded change count:", error);
      throw error;
    }
  }

  async EmpSearch(params) {
    try {
      const response = await api.post("/EmpSearch", {
        locationid: params.locationid,
        empidname: params.empidname,
        IsAdmin: params.IsAdmin,
      });
      return this._parseResponse(response);
    } catch (error) {
      console.error("Error fetching employee search:", error);
      throw error;
    }
  }

  async GetEmployeeByFacility(params) {
    try {
      const response = await api.post("/GetEmployeeByFacility", {
        facilityid: params.facilityid,
      });
      return this._parseResponse(response);
    } catch (error) {
      console.error("Error fetching employee by facility:", error);
      throw error;
    }
  }

  async GetEmployeeByFacilityChangeAddress(params) {
    try {
      const response = await api.post("/GetEmployeeByFacilityChangeAddress", {
        facilityid: params.facilityid,
      });
      return this._parseResponse(response);
    } catch (error) {
      console.error(
        "Error fetching employee by facility change address:",
        error
      );
      throw error;
    }
  }

  async GetGeoCity(params) {
    try {
      const response = await api.post("/GetGeoCity", {
        locationid: params.locationid,
        IsAdmin: params.IsAdmin,
      });
      return this._parseResponse(response);
    } catch (error) {
      console.error("Error fetching geo city:", error);
      throw error;
    }
  }

  async GetGeoCityColony(params) {
    try {
      const response = await api.post("/GetGeoCityColony", {
        city: params.city,
      });
      return this._parseResponse(response);
    } catch (error) {
      console.error("Error fetching geo city colony:", error);
      throw error;
    }
  }

  async GetEmpGeoDetails(params) {
    try {
      const response = await api.post("/GetEmpGeoDetails", {
        empid: params.empid,
        no: params.no,
      });
      return this._parseResponse(response);
    } catch (error) {
      console.error("Error fetching employee geo details:", error);
      throw error;
    }
  }

  async GetChangeAddressEmpGeo(params) {
    try {
      const response = await api.post("/GetChangeAddressEmpGeo", {
        empid: params.empid,
        id: params.id,
      });
      return this._parseResponse(response);
    } catch (error) {
      console.error(
        "Error fetching change address employee geo details:",
        error
      );
      throw error;
    }
  }

  async GetFacilityGeo(params) {
    try {
      const response = await api.post("/GetFacilityGeo", {
        facilityid: params.facilityid,
      });
      return this._parseResponse(response);
    } catch (error) {
      console.error("Error fetching facility geo details:", error);
      throw error;
    }
  }

  async SaveMapGeocode(params) {
    try {
      const response = await api.post("/SaveMapGeocode", {
        EmpID: params.EmpID,
        Landmark: params.Landmark,
        City: params.City,
        Colony: params.Colony,
        geoX: params.geoX,
        geoY: params.geoY,
        subcolony: params.subcolony,
        id: params.id,
        locationid: params.locationid,
        addtype: params.addtype,
      });
      return this._parseResponse(response);
    } catch (error) {
      console.error("Error saving map geocode:", error);
      throw error;
    }
  }

  async SaveAddressChangeMapGeocode(params) {
    try {
      const response = await api.post("/SaveAddressChangeMapGeocode", {
        Addresschange: params.Addresschange,
        Landmark: params.Landmark,
        City: params.City,
        Colony: params.Colony,
        geoX: params.geoX,
        geoY: params.geoY,
        subcolony: params.subcolony,
        id: params.id,
        locationid: params.locationid,
      });
      return this._parseResponse(response);
    } catch (error) {
      console.error("Error saving address change map geocode:", error);
      throw error;
    }
  }
}

export default new MapGeocodingService();