import React, { useState, useEffect } from "react";
import Sidebar from "../Master/SidebarMenu";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/style.css";
import Header from "../Master/Header";
import { apiService } from "../../services/api";
import sessionManager from "../../utils/SessionManager.js";
import { toastService } from '../../services/toastService';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from 'primereact/button';
import { Sidebar as PrimeSidebar } from 'primereact/sidebar';

const Location = () => {
  const [locationData, setLocationData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newLocation, setNewLocation] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [editLocation, setEditLocation] = useState(false);
  const [addLocation, setAddLocation] = useState(false);

  useEffect(() => {
    fetchLocationData();
  }, []);

  const fetchLocationData = async () => {
    try {
      setLoading(true);
      const locationData = await apiService.SelectLocation({
        Userid: sessionManager.getUserSession().Userid,
      });
     // console.log("Location Data:", locationData); // Add this line to log the location data t
      setLocationData(locationData);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toastService.error("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocation = async () => {
    const locationName = newLocation.trim();
    if (!locationName) {
      toastService.warn('Please Enter Valid Location Name!!');
      return;
    }

    try {
      setLoading(true);
      const apiresponse = await apiService.InsertLocation({
        locationname: locationName,
      });

      if (apiresponse[0].result === 1) {
        toastService.success('Data Saved Successfully!!');
        setAddLocation(false); // Close the sidebar after successful insertion
        setNewLocation('');
        await fetchLocationData();
      } else {
        toastService.warn('Location Name Already Exists!!');
      }
    } catch (error) {
      console.error("Error saving location:", error);
      toastService.error("Failed to save location");
    } finally {
      setLoading(false);
    }
  };

  const handleEditLocation = async () => {
    if (!selectedLocation || !selectedLocation.locationName.trim()) {
      toastService.warn('Please Enter Valid Location Name!!');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.UpdateLocation({
        locationname: selectedLocation.locationName.trim(),
        id: selectedLocation.Id,
      });

      if (response[0].result === 1) {
        toastService.success('Location Updated Successfully!!');
        await fetchLocationData();
      } else {
        toastService.warn('Location Name Already Exists!!');
      }
    } catch (error) {
      console.error("Error updating location:", error);
      toastService.error("Error updating location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0">
      <Header pageTitle="Location" showNewButton={true} onNewButtonClick={setAddLocation} />
      <Sidebar />

      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Location</h6>
          </div>
          <div className="col-lg-12">
            <div className="card_tb">
              {/* <table className="table" id="tbLocation">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Location Name</th>
                  </tr>
                </thead>
                <tbody>
                  {locationData.map((location) => (
                    <tr key={location.Id}>
                      <td>{location.Id}</td>
                      <td>
                        <a
                          href="#!"
                          className="btn-text"
                          data-bs-toggle="offcanvas"
                          data-bs-target="#LocationEdit"
                          aria-controls="offcanvasRight"
                          onClick={() => setSelectedLocation({
                            locationName: location.locationName,
                            Id: location.Id
                          })}
                        >
                          <span className="ms-3">{location.locationName}</span>
                        </a>
                      </td>
                      
                    </tr>
                  ))}
                </tbody>
              </table> */}

              <DataTable value={locationData}> 
                  <Column field="Id" header="ID"></Column>
                  <Column header="Location Name" body={(location) => (
                    <a
                      href="#!"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedLocation({
                          locationName: location.locationName,
                          Id: location.Id
                        });
                        setEditLocation(true);
                      }}
                    >
                      <span className="ms-3">{location.locationName}</span>
                    </a>
                  )}></Column>
                </DataTable>
            </div>
          </div>
        </div>
      </div>

      {/* Add Location Sidebar */}
      <PrimeSidebar
                visible={addLocation}
                position="right"
                onHide={() => setAddLocation(false)}
                width="50%"
                showCloseIcon={false}
                dismissable={false}
                style={{
                    width: '25%',
                }}
            >
                <div className="d-flex justify-content-between align-items-center sidebarTitle p-0">
                    <h6 className="sidebarTitle">Add New Location</h6>
                    <Button icon="pi pi-times" className="p-button-rounded p-button-text" onClick={() => setAddLocation(false)} />
                </div>
                <div className="sidebarBody">
                  <div className="row">
                      <div className="col-12 mb-3">
                      <div className="mb-3">
            <label htmlFor="locationName" className="form-label">Location Name</label>
            <input
              type="text"
              className="form-control"
              id="locationName"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Enter location name"
            />
          </div>
                      </div>
                  </div>
                  {/* Fixed button container at bottom of sidebar */}
                  <div className="sidebar-fixed-bottom position-absolute pe-3">
                                    <div className="d-flex gap-3 justify-content-end me-3">
                                        <Button label="Cancel" className="btn btn-outline-secondary" onClick={() => setAddLocation(false)} />
                                      <Button label="Update" className="btn btn-success" onClick={() => {
                                        handleSaveLocation();
                                        //setAddLocation(false);
                                      }} />
                                    </div>
                                </div>
                </div>
            </PrimeSidebar>

      {/* Add Location Offcanvas */}
      {/* <div
        tabIndex="-1"
        className="offcanvas offcanvas-end"
        id="raise_Feedback"
        aria-labelledby="offcanvasRightLabel">
        <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <h5 className="subtitle fw-normal">Add New Location</h5>
          <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          
        </div>
        <div className="offcanvas-footer">
          <button className="btn btn-outline-secondary" data-bs-dismiss="offcanvas">
            Cancel
          </button>
          <button
            className="btn btn-success mx-3"
            onClick={handleSaveLocation}
            data-bs-dismiss="offcanvas">
            Save
          </button>
        </div>
      </div> */}


      {/* Edit Location Sidebar */}
      <PrimeSidebar
                visible={editLocation}
                position="right"
                onHide={() => setEditLocation(false)}
                width="50%"
                showCloseIcon={false}
                dismissable={false}
                style={{
                    width: '25%',
                }}
            >
              <div className="d-flex justify-content-between align-items-center sidebarTitle p-0">
                    <h6 className="sidebarTitle">{selectedLocation?.locationName || 'Edit Location'}</h6>
                    <Button icon="pi pi-times" className="p-button-rounded p-button-text" onClick={() => setEditLocation(false)} />
                </div>
                <div className="sidebarBody">
                {selectedLocation && (
            <div className="mb-3">
              <label htmlFor="editLocationName" className="form-label">Location Name</label>
              <input
                type="text"
                className="form-control"
                id="editLocationName"
                value={selectedLocation.locationName}
                onChange={(e) => setSelectedLocation({ ...selectedLocation, locationName: e.target.value })}
              />
            </div>
            
          )}
          {/* Fixed button container at bottom of sidebar */}
          <div className="sidebar-fixed-bottom position-absolute pe-3">
                                    <div className="d-flex gap-3 justify-content-end me-3">
                                        <Button label="Cancel" className="btn btn-outline-secondary" onClick={() => setEditLocation(false)} />
                                      <Button label="Update" className="btn btn-success" onClick={() => {
                                        handleEditLocation();
                                        setEditLocation(false);
                                      }} />
                                    </div>
                                </div>
                </div>

            </PrimeSidebar>

      {/* Edit Location Offcanvas */}
      {/* <div
        className="offcanvas offcanvas-end"
        tabIndex="-1"
        id="LocationEdit"
        aria-labelledby="offcanvasRightLabel"
      >
        <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <h5 className="subtitle fw-normal">Edit Location</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body">
          
        </div>
        <div className="offcanvas-footer">
          <button className="btn btn-outline-secondary" data-bs-dismiss="offcanvas">
            Cancel
          </button>
          <button
            className="btn btn-success mx-3"
            onClick={handleEditLocation}
            data-bs-dismiss="offcanvas">
            Save
          </button>
        </div>
      </div> */}
    </div>
  );
};

export default Location;