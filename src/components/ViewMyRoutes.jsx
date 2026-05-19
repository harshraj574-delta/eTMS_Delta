import React, { useEffect, useState } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import ResponsiveDataTable from "./common/ResponsiveDataTable";
import TripTypeBadge from "./common/TripTypeBadge";
import ViewMyRoutesService from "../services/compliance/ViewMyRoutesService";
const userID = sessionStorage.getItem("ID");

const ViewMyRoutes = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date().toISOString().split("T")[0];
    return today;
  });

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [tripData, setTripData] = useState([]);
  const [tripDetails, setTripDetails] = useState([]);
  const [cancelationReason, setCancelationReason] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      console.log("userID: ", userID);
      try {
        const response = await ViewMyRoutesService.GetEmployeeForAdhoc({
          mgrid: userID,
        }); // replace with your actual endpoint

        // Parse response if it's a string
        const parsedResponse =
          typeof response === "string" ? JSON.parse(response) : response;

        const formattedData = Array.isArray(parsedResponse)
          ? parsedResponse.map((item) => ({
              id: item.EmployeeID, // Using facility or facilityName from your API response
              name: item.EmployeeName, // Using Id from your API response
            }))
          : [];

        setEmployees(formattedData);

        // ✅ Preselect employee matching userID
        const defaultSelected = formattedData.find(
          (emp) => emp.EmployeeID == userID
        );
        if (defaultSelected) {
          setSelectedEmployee(defaultSelected.EmployeeID); // if Dropdown uses optionValue="id"
        }

        console.log("Fetched employees:", parsedResponse);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchEmployees();
  }, []);

  const fetchTripData = async (employeeId) => {
    try {
      const response = await ViewMyRoutesService.GetMyTrips({
        empid: employeeId,
        sDate: selectedDate,
        eDate: "", // include date if needed
      });

      const parsedData =
        typeof response === "string" ? JSON.parse(response) : response;

      // Format or validate data as needed
      setTripData(parsedData);
      console.log("Fetched trips:", parsedData);
    } catch (error) {
      console.error("Error fetching trip data:", error);
      setTripData([]); // fallback to empty
    }
  };

  const fetchTripDetails = async (routeId) => {
    try {
      const response = await ViewMyRoutesService.GetMyRoutesDetails({
        empid: selectedEmployee,
        sDate: selectedDate,
        triptype: "",
        routeid: routeId, // include date if needed
      });

      const parsedData =
        typeof response === "string" ? JSON.parse(response) : response;

      // Format or validate data as needed
      setTripDetails(parsedData);
      console.log("Fetched trips details:", parsedData);
    } catch (error) {
      console.error("Error fetching trip details:", error);
      setTripDetails([]); // fallback to empty
    }
  };

  useEffect(() => {
    const fetchCancelationReason = async () => {
      try {
        const response = await ViewMyRoutesService.SPRCancelationReason({});

        const parsedData =
          typeof response === "string" ? JSON.parse(response) : response;

        // Format or validate data as needed
        setCancelationReason(parsedData);
        console.log("Fetched reasons:", parsedData);
      } catch (error) {
        console.error("Error fetching reasons:", error);
        setCancelationReason([]); // fallback to empty
      }
    };
    fetchCancelationReason();
  }, []);

  return (
    <>
      <Header pageTitle="Manage Employee" showNewButton={false} />
      <Sidebar />
      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">View My Routes</h6>
          </div>
        </div>
        <div className="row">
          {/* Search Box */}
          <div className="col-12">
            <div className="card_tb p-3">
              <div className="row">
                <div className="col-2">
                  <label htmlFor="">Trips for the Day</label>
                  <InputText
                    type="date"
                    className="w-100"
                    placeholder="Trips for the Day"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <div className="col-2">
                  <label htmlFor="">Employee Name </label>
                  <Dropdown
                    placeholder="Select Employee"
                    className="w-100"
                    filter
                    value={selectedEmployee}
                    options={employees}
                    onChange={(e) => {
                      setSelectedEmployee(e.value);
                      fetchTripData(e.value);
                    }}
                    optionLabel="name"
                    optionValue="id"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <div className="card_tb">
              {/* <DataTable value={[
                { tripId: '023838R0016', tripDate: 'Jul 05, 24', tripType: 'PickUp', shift: '18:30', facility: 'Noida' },
                { tripId: '023838R0016', tripDate: 'Jul 05, 24', tripType: 'Drop', shift: '18:30', facility: 'Noida' },
                { tripId: 'Trip Not Generated', tripDate: 'Jul 05, 24', tripType: 'PickUp', shift: '18:30', facility: 'Noida' }
              ]} paginator rows={10} emptyMessage="No data available">
                <Column field="tripId" header="Trip ID" />
                <Column field="tripDate" header="Trip Date" />
                <Column field="tripType" header="Trip Type" body={(rowData) => (
                    <span className={`badge ${rowData.tripType === 'Drop' ? 'text-bg-danger' : 'text-bg-primary'} rounded-pill text-uppercase`}>
                        {rowData.tripType}
                    </span>
                )} />
                <Column field="shift" header="Shift" />
                <Column field="facility" header="Facility" />
                <Column field="action" header="Action" body={(rowData) => (
                //   <Button icon="pi pi-trash" className="p-button-danger" />
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(rowData)}>Delete</button>
                )} />
              </DataTable> */}
              <ResponsiveDataTable
                value={tripData}
                paginator
                rows={10}
                emptyMessage="No data available"
              >
                <Column
                  header="Trip ID"
                  mobile={{ primary: true }}
                  body={(rowData) => {
                    const cleanTripId = rowData.routeid
                      ? rowData.routeid.replace(/<br\s*\/?>/gi, " - ")
                      : "";
                    const fetchId = rowData.routeid?.includes("<br>")
                      ? rowData.routeid.split("<br>")[0].trim()
                      : rowData.routeid;
                    return (
                      <a
                        href="#!"
                        className="btn-text"
                        data-bs-toggle="offcanvas"
                        data-bs-target="#routeDetails"
                        aria-controls="offcanvasRight"
                        onClick={() => fetchTripDetails(fetchId)}
                      >
                        <span>{cleanTripId}</span>
                      </a>
                    );
                  }}
                />
                <Column
                  field="shiftdate"
                  header="Trip Date"
                  mobile={{ subtitle: true }}
                  body={(rowData) =>
                    rowData.shiftdate
                      ? new Date(rowData.shiftdate).toLocaleDateString("en-US", {
                          month: "2-digit",
                          day: "2-digit",
                          year: "numeric",
                        })
                      : "N/A"
                  }
                />
                <Column
                  field="triptype"
                  header="Trip Type"
                  mobile={{ badge: true }}
                  body={(rowData) => <TripTypeBadge type={rowData.triptype} />}
                />
                <Column field="shifttime" header="Shift" />
                <Column field="facility" header="Facility" />
                <Column
                  field="action"
                  header="Action"
                  mobile={{ hidden: true }}
                  style={{ display: "none" }}
                  body={(rowData) => (
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(rowData)}
                    >
                      Delete
                    </button>
                  )}
                />
              </ResponsiveDataTable>
            </div>
          </div>
        </div>
      </div>

      {/* <!-- Raise Feedback Rightbar  --> */}
      {/* <!-- Ticket Number Rightbar  --> */}
      <div
        className="offcanvas offcanvas-end"
        tabIndex="-1"
        id="routeDetails"
        aria-labelledby="offcanvasRightLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title subtitle_sm">
            <small className="overline_text d-block text-secondary"></small>
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body">
          <DataTable value={tripDetails} emptyMessage="No data available">
            <Column
              header="Employee Detail"
              body={(rowData) => <span className="">{rowData.empName}</span>}
            />
            <Column
              header="Gender"
              body={(rowData) => <span>{rowData.Gender}</span>}
            />

            <Column
              header="Location"
              body={(rowData) => <span>{rowData.Location}</span>}
            />
            <Column field="stopNo" header="S No." />
            <Column
              header="ETA"
              body={(rowData) => (
                <span>
                  {rowData.ETAhh}:{rowData.ETAmm}
                </span>
              )}
            />
          </DataTable>
        </div>
      </div>
    </>
  );
};

export default ViewMyRoutes;
