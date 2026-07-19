import React, { useEffect, useState } from "react";
import Header from "../Master/Header";
import Sidebar from "../Master/SidebarMenu";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import ResponsiveDataTable from "../common/ResponsiveDataTable";
import TripTypeBadge from "../common/TripTypeBadge";
import sessionManager from "../../utils/SessionManager";
import {
  useAdhocEmployeesQuery,
  useMyTripsQuery,
  useTripDetailsQuery,
} from "./hooks/useViewMyRoutesQueries";

const ViewMyRoutes = () => {
  const userID = sessionManager.getUserSession().ID;

  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);

  // Data (declarative: trips refetch when employee OR date changes)
  const { data: employees = [] } = useAdhocEmployeesQuery(userID);
  const { data: tripData = [], isLoading: tripsLoading } = useMyTripsQuery(
    selectedEmployee,
    selectedDate
  );
  const { data: tripDetails = [] } = useTripDetailsQuery({
    empId: selectedEmployee,
    date: selectedDate,
    routeId: selectedRouteId,
  });

  // Preselect the logged-in user once the employee list loads
  useEffect(() => {
    if (!selectedEmployee && employees.length > 0) {
      const self = employees.find((emp) => String(emp.id) === String(userID));
      if (self) setSelectedEmployee(self.id);
    }
  }, [employees, selectedEmployee, userID]);

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
                    onChange={(e) => setSelectedEmployee(e.value)}
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
              <ResponsiveDataTable
                value={tripData}
                loading={tripsLoading}
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
                        onClick={() => setSelectedRouteId(fetchId)}
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
              </ResponsiveDataTable>
            </div>
          </div>
        </div>
      </div>

      {/* Route details offcanvas */}
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
