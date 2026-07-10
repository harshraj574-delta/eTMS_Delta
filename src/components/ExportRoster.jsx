import React, { useState, useEffect } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import Loader from "./common/Loader";
import ReportButton from "./common/ReportButton";
import sessionManager from "../utils/SessionManager";
import ExportRosterService from "../services/compliance/ExportRosterService";
import { toastService } from "../services/toastService";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import calendarIcon from "../assets/calendar.png";
import noReportImage from "../assets/no_report.png";

const TRIP_TYPE_OPTIONS = [
  { label: "Pick", value: "P" },
  { label: "Drop", value: "D" },
];

const STATUS_OPTIONS = [
  { label: "Active", value: "Y" },
  { label: "Both", value: "B" },
];

const ExportRoster = () => {
  const userId = sessionManager.getUserSession().ID;
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [tripType, setTripType] = useState("P");
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [status, setStatus] = useState("Y");

  const [facilities, setFacilities] = useState([]);
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    fetchFacilities();
  }, []);

  useEffect(() => {
    if (selectedFacility) {
      fetchShifts(selectedFacility.Id, tripType);
    } else {
      setShifts([]);
      setSelectedShifts([]);
    }
  }, [selectedFacility, tripType]);

  const fetchFacilities = async () => {
    try {
      const response = await ExportRosterService.SelectFacility({ Userid: userId });
      const data = typeof response === "string" ? JSON.parse(response) : response;
      const list = Array.isArray(data) ? data : [];
      setFacilities(list);
      const userFacilityId = sessionManager.getUserSession().FacilityID;
      const defaultFacility = list.find((f) => f.Id === userFacilityId) || list[0];
      if (defaultFacility) setSelectedFacility(defaultFacility);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      toastService.error("Failed to load facilities.");
    }
  };

  const fetchShifts = async (facilityId, type) => {
    try {
      const response = await ExportRosterService.GetShiftByFacilityType({ facid: facilityId, type });
      const data = typeof response === "string" ? JSON.parse(response) : response;
      const formatted = Array.isArray(data)
        ? data.map((item) => ({ label: item.shiftTime, value: item.shiftTime }))
        : [];
      setShifts(formatted);
      setSelectedShifts([]);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      setShifts([]);
      setSelectedShifts([]);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${mm}/${dd}/${d.getFullYear()}`;
  };

  const handleExport = async () => {
    if (!startDate) { toastService.warn("Please select a start date."); return; }
    if (!endDate) { toastService.warn("Please select an end date."); return; }
    const startDay = new Date(startDate); startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(endDate); endDay.setHours(0, 0, 0, 0);
    if (startDay > endDay) { toastService.warn("Start date cannot be after end date."); return; }
    if (!selectedFacility) { toastService.warn("Please select a facility."); return; }
    if (!selectedShifts.length) { toastService.warn("Please select at least one shift."); return; }

    try {
      setLoading(true);
      const response = await ExportRosterService.ExportRoster({
        sDate: formatDate(startDate),
        eDate: formatDate(endDate),
        FacilityID: selectedFacility.Id,
        rType: tripType,
        ShiftTimes: selectedShifts.join(","),
        isActive: status,
      });

      const data = typeof response === "string" ? JSON.parse(response) : response;

      if (!Array.isArray(data) || data.length === 0) {
        toastService.warn("No data found for the selected criteria.");
        return;
      }

      const rows = data.map((item) => ({
        "Employee ID": item.empCode ?? "",
        "Shift Date": item.startdate ?? "",
        "Shift": item.starttime ?? "",
        "Gender": item.Gender ?? "",
        "Employee Name": item.empName ?? "",
        "Address": item.address ?? "",
        "Zone": item.ZoneName ?? "",
        "City": item.city ?? "",
        "Area": item.colony ?? "",
        "Landmark": item.PickupPoint ?? "",
        "Mobile": item.mobile ?? "",
        "Email": item.email ?? "",
        "Facility": item.facility ?? "",
        "Project": item.processName ?? "",
        "Request Type": item.requestType ?? "",
        "Updated By": item.UpdatedBy ?? "",
        "Updated Time": item.UpdatedTime ?? "",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Roster");
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([buffer], { type: "application/octet-stream" }), "ExportRoster.xlsx");
      toastService.success(`Exported ${data.length} records successfully.`);
    } catch (error) {
      console.error("Error exporting roster:", error);
      toastService.error("Failed to export roster data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Loader isVisible={loading} fullScreen={true} />
      <Header pageTitle="Export Roster" />
      <Sidebar />
      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Export Roster</h6>
          </div>

          <div className="col-12">
            <div className="card_tb p-3">
              <div className="row g-3 align-items-end">

                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <label className="form-label">
                    Start Date <span className="text-danger">*</span>
                  </label>
                  <div className="custom-calendar-wrapper">
                    <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                    <Calendar
                      value={startDate}
                      onChange={(e) => setStartDate(e.value)}
                      dateFormat="dd/mm/yy"
                      placeholder="Start Date"
                      className="w-100 custom-calendar-input"
                    />
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <label className="form-label">
                    End Date <span className="text-danger">*</span>
                  </label>
                  <div className="custom-calendar-wrapper">
                    <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                    <Calendar
                      value={endDate}
                      onChange={(e) => setEndDate(e.value)}
                      dateFormat="dd/mm/yy"
                      placeholder="End Date"
                      className="w-100 custom-calendar-input"
                    />
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <label className="form-label">
                    Facility <span className="text-danger">*</span>
                  </label>
                  <Dropdown
                    value={selectedFacility}
                    onChange={(e) => setSelectedFacility(e.value)}
                    options={facilities}
                    optionLabel="facilityName"
                    placeholder="Select Facility"
                    className="w-100"
                    filter
                  />
                </div>

                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <label className="form-label">Trip Type</label>
                  <Dropdown
                    value={tripType}
                    onChange={(e) => setTripType(e.value)}
                    options={TRIP_TYPE_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    className="w-100"
                  />
                </div>

                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <label className="form-label">
                    Shift <span className="text-danger">*</span>
                  </label>
                  <MultiSelect
                    value={selectedShifts}
                    onChange={(e) => setSelectedShifts(e.value)}
                    options={shifts}
                    optionLabel="label"
                    optionValue="value"
                    placeholder={selectedFacility ? "Select Shifts" : "Select facility first"}
                    className="w-100"
                    display="chip"
                    disabled={!selectedFacility || shifts.length === 0}
                    appendTo={document.body}
                    showSelectAll
                    filter
                    filterPlaceholder="Search shift..."
                  />
                </div>

                <div className="col-12 col-sm-6 col-md-4 col-lg-1">
                  <label className="form-label">Status</label>
                  <Dropdown
                    value={status}
                    onChange={(e) => setStatus(e.value)}
                    options={STATUS_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    className="w-100"
                  />
                </div>

                <div className="col-12 col-sm-6 col-md-4 col-lg-1 no-label-prime">
                  <ReportButton
                    label="Export"
                    onClick={handleExport}
                    disabled={loading}
                  />
                </div>

              </div>
            </div>
          </div>

          <div className="col-12 mt-3">
            <div className="card_tb">
              <div
                className="d-flex flex-column align-items-center justify-content-center p-5"
                style={{ minHeight: "60vh" }}
              >
                <img
                  src={noReportImage}
                  alt="No Report Selected"
                  style={{ maxWidth: "100px", opacity: 0.5, marginBottom: "1rem" }}
                />
                <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                  Please select above parameters to export roster data
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default ExportRoster;
