import React, { useState, useEffect } from "react";
import Sidebar from "../Master/SidebarMenu";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/style.css";
import Header from "../Master/Header";
import { apiService } from "../../services/api";
import sessionManager from "../../utils/SessionManager.js";
import { toastService } from '../../services/toastService';
import { CustomDataTable } from "../common/CustomDataTable";
import ResponsiveDataTable from "../common/ResponsiveDataTable";
import CustomPaginator from "../common/CustomPaginator";
import { Column } from "primereact/column";
import { Button } from 'primereact/button';
import MasterSidebar from "../Master/MasterSidebar";
import { ToastContainer } from 'react-toastify';


const Location = () => {
  const [locationData, setLocationData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newLocation, setNewLocation] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [editLocation, setEditLocation] = useState(false);
  const [addLocation, setAddLocation] = useState(false);

  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);

  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  useEffect(() => {
    fetchLocationData();
  }, []);

  const fetchLocationData = async () => {
    try {
      setLoading(true);
      const locationData = await apiService.SelectLocation({
        Userid: sessionManager.getUserSession().Userid,
      });
      setLocationData(locationData);
      setFirst(0); // Reset pagination
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
        setAddLocation(false);
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
        setEditLocation(false);
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
      <Header pageTitle="Location" showNewButton={true} onNewButtonClick={() => setAddLocation(true)} />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Location</h6>
          </div>
          <div className="col-lg-12">
            <div className="card_tb">
              <ResponsiveDataTable value={locationData.slice(first, first + rows)}>
                  <Column field="Id" header="ID" mobile={{ subtitle: true }} />
                  <Column header="Location Name" mobile={{ primary: true }} body={(location) => (
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
                  )} />
                </ResponsiveDataTable>
                <CustomPaginator
                  first={first}
                  rows={rows}
                  totalRecords={locationData.length}
                  onPageChange={onPageChange}
                  rowsPerPageOptions={[5, 10, 25]}
                />
            </div>
          </div>
        </div>
      </div>

      
      <MasterSidebar
        title="Add New Location"
        show={addLocation}
        onClose={() => setAddLocation(false)}
        className="sidebar-responsive"
        footer={
          <div className="offcanvas-footer">
            <Button label="Cancel" className="btn btn-outline-secondary" onClick={() => setAddLocation(false)} />
            <Button label="Save" className="btn btn-success ms-3" onClick={handleSaveLocation} />
          </div>
        }
      >
        <div className="p-3">
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
      </MasterSidebar>

      
      <MasterSidebar
        title={selectedLocation?.locationName || 'Edit Location'}
        show={editLocation}
        onClose={() => setEditLocation(false)}
        className="sidebar-responsive"
        footer={
          <div className="offcanvas-footer">
            <Button label="Cancel" className="btn btn-outline-secondary" onClick={() => setEditLocation(false)} />
            <Button label="Update" className="btn btn-success ms-3" onClick={handleEditLocation} />
          </div>
        }
      >
        <div className="p-3">
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
        </div>
      </MasterSidebar>

      <style>{`
        /* Responsive Sidebar */
        .sidebar-responsive {
          width: 35% !important;
        }

        @media (max-width: 992px) {
          .sidebar-responsive {
            width: 45% !important;
          }
        }

        @media (max-width: 768px) {
          .sidebar-responsive {
            width: 60% !important;
          }
        }

        @media (max-width: 576px) {
          .sidebar-responsive {
            width: 85% !important;
          }
        }

        /* Offcanvas Footer */
        .offcanvas-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 1rem;
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          height: auto;
        }

        .offcanvas-body {
          padding-bottom: 5.5rem;
        }
      `}</style>
    </div>
  );
};

export default Location;