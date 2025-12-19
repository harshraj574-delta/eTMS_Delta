import React, { useEffect, useState } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import RouteDeletionService from "../services/compliance/RouteDeletionService";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Calendar } from "primereact/calendar";
import calendarIcon from "../assets/calendar.png";
import { toastService } from "../services/toastService";
import { ToastContainer } from "react-toastify";
import ReportButton from "./common/ReportButton";
const RouteDeletion = () => {
  const UserId = sessionStorage.getItem("ID");
  const [facility, setFacility] = useState([]);
  const [selFacility, setSelFacility] = useState(null);
  const [date, setDate] = useState(new Date());

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };
  const TypeOptions = [
    { label: "Both", value: "B" },
    { label: "Pick", value: "P" },
    { label: "Drop", value: "D" }
  ];
  const [type, setType] = useState("");
  const [shiftOptions, setShiftOptions] = useState([]);
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelectedShifts([]);
    if (selFacility && type) {
      fetchShifts(selFacility, type);
    } else {
      setShiftOptions([]);
      setSelectedShifts([]);
    }
  }, [selFacility, type]);
  useEffect(() => {
    fetchFacilities();
  }, []);
  const fetchShifts = async (facid, type) => {
    try {
      const response = await RouteDeletionService.GetShiftByFacilityType({
        facid,
        type,
      });
      const parsedResponse = typeof response === 'string' ? JSON.parse(response) : response;
      const formatted = parsedResponse.map(item => ({
        name: item.shiftTime,
        value: item.shiftTime,
      }));
      setShiftOptions(formatted);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      setShiftOptions([]);
    }
  };
  const handleDeleteRoutes = async () => {
    setIsSubmitting(true);

    try {
      // Agar backend ko shift ka value chahiye (ID), to value bheje:
      const shiftValues = selectedShifts;
      const params = {
        sDate: formatDate(date),
        FacilityID: selFacility,
        TripType: type,
        Shifttimes: shiftValues,
        RouteID: "",
        EmpID: 0,
        uname: UserId,
      };
      const response = await RouteDeletionService.DeleteRoutes(params);
      // Response check karein
      if (response === 1) {
        toastService.success("Routes deleted successfully");
        // Optional: koi aur logic
      } else if (response === -1) {
        toastService.error("No routes found");
      }
      console.log("DeleteRoutes response:", response);
    } catch (error) {
      toastService.error("Error deleting routes");
      console.error("Error deleting routes:", error);
    }
    finally { setIsSubmitting(false); }
  };
  const handleSearchClick = () => {
    const today = new Date().toISOString().split("T")[0];
    const selectedDateStr = formatDate(date);

    if (selectedDateStr < today) {
      toastService.error("Date must be greater than the current date");
      return;
    }
    if (!selFacility) {
      toastService.warn("Please select Facility");
      return;
    }
    if (selectedShifts.length === 0) {
      toastService.warn("Please select Shifts");
      return;
    }
    confirmDialog({
      message: "Are you sure? You want to Delete the Routes.",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: () => {
        handleDeleteRoutes();
        toastService.success("Routes deleted successfully");
        // Logic after confirmation (e.g., delete action)
        console.log("User confirmed deletion");
      },
      reject: () => {
        toastService.error("Routes deletion failed");
        // Optional: Logic on cancel
        console.log("User canceled deletion");
      },
    });
  };
  const fetchFacilities = async () => {
    try {
      const response = await RouteDeletionService.SelectFacility({ Userid: UserId });
      //console.log("Fetched Facilities:", response);
      const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
      const formattedData = parsedData.map(item => ({
        name: item.facilityName,
        value: item.Id
      }));
      //console.log("Fetched Facilities:", formattedData);
      setFacility(formattedData);
    } catch (error) {
      console.error("Error fetching facilities:", error);
    }
  };
  return (

    <div>
      {isSubmitting && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(255,255,255,0.7)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="spinner-border text-primary"
            style={{ width: 60, height: 60, fontSize: 32 }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      <Header pageTitle="Route Deletion" showNewButton={false} />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />
      <ConfirmDialog />
      <div className="middle">
        <div className="card_tb p-3">
          <div className="row">
            <div className="field col-2 mb-3">
              <label>Date</label>
              <div className="custom-calendar-wrapper">
                <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                <Calendar
                  id="date"
                  className="w-100 custom-calendar-input"
                  value={date}
                  onChange={(e) => setDate(e.value)}
                  dateFormat="mm/dd/yy"
                />
              </div>
            </div>
            <div className="field col-2 mb-3">
              <label>Facility Name</label>
              <Dropdown placeholder="Select Facility" optionLabel="name"
                value={selFacility} options={facility}
                onChange={(e) => setSelFacility(e.value)}
                className="w-100"
              />
            </div>
            <div className="field col-2 mb-3">
              <label>Type</label>
              <Dropdown placeholder="Select Type"
                value={type} options={TypeOptions} onChange={(e) => setType(e.value)}
                className="w-100"
              />
            </div>
            <div className="field col-2 mb-3">
              <label>Shift</label>
              <Dropdown placeholder="Select Shift"
                value={selectedShifts}
                options={shiftOptions}
                optionLabel="name"
                optionValue="value"
                onChange={e => setSelectedShifts(e.value)}
                className="w-100"
                filter
              />
            </div>
            <div className="field col-2 mb-3 no-label">
              <ReportButton
                label="Submit"
                onClick={handleSearchClick}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>
      <style>
        {`
          .custom-calendar-wrapper {
            position: relative;
            width: 100%;
          }
          .custom-calendar-icon {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            width: 22px;
            height: 22px;
            z-index: 2;
            pointer-events: none;
          }
          .custom-calendar-input .p-inputtext {
            padding-left: 35px !important;
          }
        `}
      </style>
    </div >
  );
}


export default RouteDeletion;
