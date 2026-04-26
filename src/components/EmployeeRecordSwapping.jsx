import React, { useState } from "react";
import Sidebar from "./Master/SidebarMenu";
import Header from "./Master/Header";
import { CustomDataTable } from "./common/CustomDataTable";
import { Column } from "primereact/column";

// ── Hardcoded data ──────────────────────────────────────────────────────────

const COMMON_RECORDS = [
  { id: 1, commonValue: "9711699937", occurance: 2, commonField: "Mobile" },
];

const SHIFT_ROWS = [
  "Apr 23, 2026",
  "Apr 24, 2026",
  "Apr 25, 2026",
  "Apr 26, 2026",
  "Apr 27, 2026",
  "Apr 28, 2026",
  "Apr 29, 2026",
].map((date) => ({
  shiftDate: date,
  shiftTime: "N/A – N/A",
  pickupRouteId: "N/A",
  pickupStatus: "N/A",
  dropRouteId: "N/A",
  dropStatus: "N/A",
}));

const EMPLOYEES = [
  {
    name: "Anil Sharma",
    employeeId: "delta",
    department: "43484-Data Engineering (DBA)",
    facility: "BLR-WTC",
    mobile: "9711699937",
    otherNumber: "01123462288",
    address: "lajpat nagar",
    location: "ARABIC COLLEGE",
    email: "dkumar@cyberdelta.com",
    reportingManager: "delta-Anil Sharma",
    managerMobile: "9711699937",
    isGeoCoded: "Y",
    transportRequired: "Y",
    attried: "N",
    shifts: SHIFT_ROWS,
  },
  {
    name: "TmpThirteen",
    employeeId: "TMP0014",
    department: "43484-Data Engineering (DBA)",
    facility: "BLR-WTC",
    mobile: "9711699937",
    otherNumber: "",
    address: "",
    location: "ASHOK NAGAR",
    email: "9711699937",
    reportingManager: "delta-Anil Sharma",
    managerMobile: "9711699937",
    isGeoCoded: "Y",
    transportRequired: "Y",
    attried: "N",
    shifts: SHIFT_ROWS,
  },
];

// ── Sub-components ───────────────────────────────────────────────────────────

const DetailRow = ({ label1, value1, label2, value2 }) => (
  <tr>
    <td style={styles.labelCell}>{label1} :</td>
    <td style={styles.valueCell}>{value1}</td>
    <td style={styles.labelCell}>{label2} :</td>
    <td style={styles.valueCell}>{value2}</td>
  </tr>
);

const EmployeePanel = ({ emp }) => (
  <div className="card_tb mb-4">
    {/* Panel header */}
    <div style={styles.panelHeader}>
      Transportation Details of :- &nbsp;<strong>{emp.name}</strong>
    </div>

    {/* Details grid */}
    <div className="table-responsive">
      <table className="table table-bordered mb-0" style={styles.detailTable}>
        <tbody>
          <DetailRow label1="EmployeeID" value1={emp.employeeId} label2="Employee Name" value2={emp.employeeName || emp.name} />
          <DetailRow label1="Department" value1={emp.department} label2="Facility" value2={emp.facility} />
          <DetailRow label1="Mobile Number" value1={emp.mobile} label2="Other Number" value2={emp.otherNumber} />
          <DetailRow label1="Address" value1={emp.address} label2="Location" value2={emp.location} />
          <DetailRow label1="Email Id" value1={emp.email} label2="Reporting Manager" value2={emp.reportingManager} />
          <DetailRow label1="Manager Mobile No." value1={emp.managerMobile} label2="IsGeoCoded" value2={emp.isGeoCoded} />
          <DetailRow label1="Transport Required" value1={emp.transportRequired} label2="Attried" value2={emp.attried} />
        </tbody>
      </table>
    </div>

    {/* Shift schedule table */}
    <div className="table-responsive">
      <table className="table table-bordered mb-0" style={styles.shiftTable}>
        <thead>
          <tr style={styles.shiftHeader}>
            <th>ShiftDate</th>
            <th>Shift Time</th>
            <th>Pickup RouteID</th>
            <th>Pickup Tracking Status</th>
            <th>Drop RouteID</th>
            <th>Drop Tracking Status</th>
          </tr>
        </thead>
        <tbody>
          {emp.shifts.map((row, i) => (
            <tr key={i} style={{ fontSize: "12px" }}>
              <td>{row.shiftDate}</td>
              <td>{row.shiftTime}</td>
              <td>{row.pickupRouteId}</td>
              <td>{row.pickupStatus}</td>
              <td>{row.dropRouteId}</td>
              <td>{row.dropStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const EmployeeRecordSwapping = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedAction, setSelectedAction] = useState("");

  const handleShow = (e) => {
    e.preventDefault();
    setShowDetails(true);
  };

  const handleSearch = () => {
    if (searchValue.trim()) setShowDetails(true);
  };

  const handleBack = (e) => {
    e.preventDefault();
    setShowDetails(false);
    setSearchValue("");
    setSelectedAction("");
  };

  const actionTemplate = (rowData) => (
    <a
      href="#!"
      className="text-decoration-underline"
      style={{ color: "#4a36ec", fontSize: "13px" }}
      onClick={handleShow}
    >
      Show
    </a>
  );

  return (
    <div className="container-fluid p-0">
      <Header pageTitle="Employee Record Swapping" mainTitle="Compliance" />
      <Sidebar />

      <div className="middle" style={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
        <div style={{ padding: "20px" }}>

          {/* Page title */}
          <div className="row mb-3">
            <div className="col-12 text-center">
              <h6 className="fw-bold mb-1" style={{ fontSize: "16px", color: "#1c1d20" }}>
                Employee Record Swapping
              </h6>
              <p className="mb-0" style={{ fontSize: "13px", color: "#999d9e" }}>
                Allows User to View and Swap Employee Record.
              </p>
            </div>
          </div>

          {!showDetails ? (
            /* ── Initial view ── */
            <>
              <div className="card_tb mb-3">
                <CustomDataTable
                  value={COMMON_RECORDS}
                  emptyMessage="No records found."
                >
                  <Column field="commonValue" header="Common Value" />
                  <Column field="occurance" header="Occurance" style={{ width: "110px" }} />
                  <Column field="commonField" header="Common Field" style={{ width: "130px" }} />
                  <Column body={actionTemplate} header="Action" style={{ width: "90px", textAlign: "center" }} />
                </CustomDataTable>
              </div>

              {/* Search bar */}
              <div className="card_tb p-3">
                <div className="d-flex align-items-center gap-2">
                  <label style={{ fontSize: "13px", color: "#545557", whiteSpace: "nowrap", fontWeight: "500" }}>
                    Enter Employee ID or Name :
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    style={{ maxWidth: "260px" }}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <button
                    className="btn btn-success btn-sm px-3"
                    style={{ whiteSpace: "nowrap" }}
                    onClick={handleSearch}
                  >
                    Search
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* ── Detail view ── */
            <>
              {/* Toolbar */}
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <label style={{ fontSize: "13px", color: "#545557", fontWeight: "500" }}>Select :</label>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: "160px" }}
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                  >
                    <option value="">-- Select --</option>
                    <option value="swap">Swap Records</option>
                    <option value="merge">Merge Records</option>
                  </select>
                </div>
                <a
                  href="#!"
                  onClick={handleBack}
                  style={{ color: "#4a36ec", fontSize: "13px", fontWeight: "500" }}
                  className="text-decoration-underline"
                >
                  Back
                </a>
              </div>

              {/* Employee panels */}
              {EMPLOYEES.map((emp, i) => (
                <EmployeePanel key={i} emp={emp} />
              ))}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  panelHeader: {
    backgroundColor: "#5b7fa6",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "600",
    padding: "7px 12px",
    borderRadius: "12px 12px 0 0",
  },
  detailTable: {
    fontSize: "12px",
    marginBottom: 0,
    borderColor: "#c9d6e3",
  },
  labelCell: {
    width: "160px",
    fontWeight: "600",
    backgroundColor: "#f0f4f8",
    color: "#374151",
    padding: "5px 10px",
    whiteSpace: "nowrap",
  },
  valueCell: {
    padding: "5px 10px",
    color: "#1c1d20",
    backgroundColor: "#ffffff",
  },
  shiftTable: {
    fontSize: "12px",
    marginBottom: 0,
    borderColor: "#c9d6e3",
  },
  shiftHeader: {
    backgroundColor: "#5b7fa6",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "600",
  },
};

export default EmployeeRecordSwapping;
