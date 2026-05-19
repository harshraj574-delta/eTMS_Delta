import React, { useState, useEffect } from "react";
import Sidebar from "./Master/SidebarMenu";
import Header from "./Master/Header";
import { CustomDataTable } from "./common/CustomDataTable";
import ResponsiveDataTable from "./common/ResponsiveDataTable";
import { Column } from "primereact/column";
import Loader from "./common/Loader";
import { ToastContainer } from "react-toastify";
import { toastService } from "../services/toastService";
import EmployeeRecordSwappingService from "../services/compliance/EmployeeRecordSwappingService";
import sessionManager from "../utils/SessionManager";

const userSession = sessionManager.getUserSession();

const isAdmin = userSession?.IsAdmin || "1";
const locationid = sessionStorage.getItem("locationId");

const parseResponse = (data) => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") return data.data ?? [];
  return [];
};

const getTodayStr = () => {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
};

// ── Sub-components ───────────────────────────────────────────────────────────

const DetailRow = ({ label1, value1, label2, value2 }) => (
  <tr>
    <td style={styles.labelCell}>{label1} :</td>
    <td style={styles.valueCell}>{value1 || "-"}</td>
    <td style={styles.labelCell}>{label2} :</td>
    <td style={styles.valueCell}>{value2 || "-"}</td>
  </tr>
);

const EmployeePanel = ({ emp, actionValue, onActionChange }) => {
  const shifts = emp.shifts || [];
  const empKey = emp.id || emp.empCode || emp.EmpId;

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* Per-employee Select dropdown — centered above the panel */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "6px",
        }}
      >
        <select
          className="form-select form-select-sm"
          style={{ width: "160px" }}
          value={actionValue}
          onChange={(e) => onActionChange(e.target.value)}
        >
          <option value="">Select</option>
          <option value="1">Primary</option>
          <option value="2">Secondary</option>
          <option value="3">Reject</option>
        </select>
      </div>

      <div className="card_tb">
        <div style={styles.panelHeader}>
          Transportation Details of :- &nbsp;
          <strong>{emp.empName || emp.name || "-"}</strong>
        </div>

        <div className="table-responsive">
          <table
            className="table table-bordered mb-0"
            style={styles.detailTable}
          >
            <tbody>
              <DetailRow
                label1="EmployeeID"
                value1={emp.empCode || emp.id}
                label2="Employee Name"
                value2={emp.empName || emp.name}
              />
              <DetailRow
                label1="Department"
                value1={emp.processName || emp.department}
                label2="Facility"
                value2={emp.facilityName || emp.facility}
              />
              <DetailRow
                label1="Mobile Number"
                value1={emp.mobile}
                label2="Other Number"
                value2={emp.phone || emp.otherNumber}
              />
              <DetailRow
                label1="Address"
                value1={emp.address}
                label2="Location"
                value2={emp.Location || emp.location}
              />
              <DetailRow
                label1="Email Id"
                value1={emp.email}
                label2="Reporting Manager"
                value2={emp.ManagerDetail || emp.reportingManager}
              />
              <DetailRow
                label1="Manager Mobile No."
                value1={emp.mgrMobile || emp.managerMobile}
                label2="IsGeoCoded"
                value2={emp.geoCode || emp.isGeoCoded}
              />
              <DetailRow
                label1="Transport Required"
                value1={emp.tptReq || emp.transportRequired}
                label2="Attrited"
                value2={emp.attrited || emp.Attrited}
              />
            </tbody>
          </table>
        </div>

        <div className="table-responsive">
          <table
            className="table table-bordered mb-0"
            style={styles.shiftTable}
          >
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
              {shifts.length > 0 ? (
                shifts.map((row, i) => (
                  <tr key={i} style={{ fontSize: "12px" }}>
                    <td>{row.ShiftDate || row.shiftDate || "-"}</td>
                    <td>{row.Shifts || row.shiftTime || "-"}</td>
                    <td>{row.pickRouteID || row.pickupRouteId || "N/A"}</td>
                    <td>
                      {row.PickTrackingStatus || row.pickupStatus || "N/A"}
                    </td>
                    <td>{row.dropRouteID || row.dropRouteId || "N/A"}</td>
                    <td>{row.DropTrackingStatus || row.dropStatus || "N/A"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      fontSize: "12px",
                      color: "#999",
                      padding: "10px",
                    }}
                  >
                    No shift data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const EmployeeRecordSwapping = () => {
  const session = sessionManager.getUserSession();
  const userId = session.ID;
  const locationId = session.locationId;

  const [view, setView] = useState("list");

  // List-view state
  const [duplicateRecords, setDuplicateRecords] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [comparisonList, setComparisonList] = useState([]);

  // Detail-view state
  const [detailEmployees, setDetailEmployees] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedActions, setSelectedActions] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchDuplicateRecords();
  }, []);

  const fetchDuplicateRecords = async () => {
    setListLoading(true);
    try {
      const res = await EmployeeRecordSwappingService.GetDuplicateEmpData();
      setDuplicateRecords(parseResponse(res));
    } catch (err) {
      console.error("Error fetching duplicate records:", err);
      toastService.error("Failed to fetch duplicate records");
    } finally {
      setListLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toastService.warn("Please enter Employee ID or Name");
      return;
    }
    setSearchLoading(true);
    setHasSearched(true);
    try {
      const res = await EmployeeRecordSwappingService.EmpSearch({
        locationid: locationid,
        empidname: searchValue.trim(),
        IsAdmin: isAdmin,
      });
      setSearchResults(parseResponse(res));
    } catch (err) {
      console.error("EmpSearch error:", err);
      toastService.error("Failed to search employees");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddToCompare = (emp) => {
    const key = emp.id || emp.empCode;
    if (comparisonList.some((e) => (e.id || e.empCode) === key)) {
      toastService.warn("Employee already in comparison list");
      return;
    }
    setComparisonList((prev) => [...prev, emp]);
  };

  const handleRemoveFromCompare = (key) => {
    setComparisonList((prev) =>
      prev.filter((e) => (e.id || e.empCode) !== key),
    );
  };

  const loadShiftsForEmployee = async (empId) => {
    try {
      const res = await EmployeeRecordSwappingService.GetHelpDeskEmployeeDetail(
        {
          empid: empId,
          sDate: getTodayStr(),
        },
      );
      return parseResponse(res);
    } catch {
      return [];
    }
  };

  // Triggered by "Show" link in the duplicate records table
  const handleShow = async (rowData) => {
    setDetailLoading(true);
    console.log("rowData: ", rowData);
    try {
      const res = await EmployeeRecordSwappingService.GetDuplicateEmpDetail({
        CommonValue: rowData.Common_Value || rowData.Common_Value,
        CommonField: rowData.commonField || rowData.CommonField,
        EmpList : "",
      });
      const empList = parseResponse(res);

      const enriched = await Promise.all(
        empList.map(async (emp) => {
          const empId = emp.id || emp.empCode || emp.EmpId || emp.ID;
          const [detailRes, shifts] = await Promise.all([
            EmployeeRecordSwappingService.GetEmployeeDetails({
              empid: empId,
            }).catch(() => null),
            loadShiftsForEmployee(empId),
          ]);
          // const shifts = await loadShiftsForEmployee(empId);
          // return { ...emp, shifts };
          const detail = detailRes ? parseResponse(detailRes) : null;
          const empDetail = Array.isArray(detail) ? detail[0] : detail;
          return { ...emp, ...(empDetail || {}), shifts };
        }),
      );

      setDetailEmployees(enriched);
      setSelectedActions({});
      setView("detail");
    } catch (err) {
      console.error("Error loading duplicate data:", err);
      toastService.error("Failed to load employee details");
    } finally {
      setDetailLoading(false);
    }
  };

  // Triggered by "Show" button in the comparison list
  const handleViewComparison = async () => {
    if (comparisonList.length === 0) return;
    setDetailLoading(true);
    try {
      const enriched = await Promise.all(
        comparisonList.map(async (emp) => {
          const empId = emp.id || emp.empCode;
          const [detailRes, shifts] = await Promise.all([
            EmployeeRecordSwappingService.GetEmployeeDetails({
              empid: empId,
            }).catch(() => null),
            loadShiftsForEmployee(empId),
          ]);
          const detail = detailRes ? parseResponse(detailRes) : null;
          const empDetail = Array.isArray(detail) ? detail[0] : detail;
          return { ...emp, ...(empDetail || {}), shifts };
        }),
      );
      setDetailEmployees(enriched);
      setSelectedActions({});
      setView("detail");
    } catch (err) {
      console.error("Error loading comparison:", err);
      toastService.error("Failed to load comparison details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmit = async () => {
    const selected = Object.entries(selectedActions).filter(([, v]) => v);
    console.log("selected: ", selected);
    if (selected.length === 0) {
      toastService.warn("Please select an action for at least one employee");
      return;
    }
    setSubmitLoading(true);
    try {
      const primaryIds = [];
      const secondaryIds = [];
      const rejectIds = [];

      selected.forEach(([empId, v]) => {
        if (v === "1") primaryIds.push(empId);
        if (v === "2") secondaryIds.push(empId);
        if (v === "3") rejectIds.push(empId);
      });

      await EmployeeRecordSwappingService.UpdateDuplicateEmp({
        PrimaryId: primaryIds.join(","),
        SecondaryId: secondaryIds.join(","),
        RejectId: rejectIds.join(","),
        UserId: userId,
      });

      toastService.success("Records updated successfully");
      setView("list");
      setDetailEmployees([]);
      setSelectedActions({});
      setComparisonList([]);
      fetchDuplicateRecords();
    } catch (err) {
      console.error("Submit error:", err);
      toastService.error("Failed to update records");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleBack = (e) => {
    e.preventDefault();
    setView("list");
    setDetailEmployees([]);
    setSelectedActions({});
  };

  // ── Column templates ─────────────────────────────────────────────────────────

  const showTemplate = (rowData) => (
    <a
      href="#!"
      className="text-decoration-underline"
      style={{ color: "#4a36ec", fontSize: "13px" }}
      onClick={(e) => {
        e.preventDefault();
        handleShow(rowData);
      }}
    >
      Show
    </a>
  );

  const addToCompareTemplate = (rowData) => {
    const key = rowData.id || rowData.empCode;
    const isAdded = comparisonList.some((e) => (e.id || e.empCode) === key);
    return (
      <a
        href="#!"
        className="text-decoration-underline"
        style={{
          color: isAdded ? "#aaa" : "#4a36ec",
          fontSize: "13px",
          pointerEvents: isAdded ? "none" : "auto",
        }}
        onClick={(e) => {
          e.preventDefault();
          if (!isAdded) handleAddToCompare(rowData);
        }}
      >
        {isAdded ? "Added" : "Add To Compare"}
      </a>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="container-fluid p-0">
      <ToastContainer />
      <Header pageTitle="Employee Record Swapping" mainTitle="Compliance" />
      <Sidebar />

      <div
        className="middle"
        style={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}
      >
        <div style={{ padding: "20px" }}>
          {/* Page title */}
          <div className="row mb-3">
            <div className="col-12 text-center">
              <h6
                className="fw-bold mb-1"
                style={{ fontSize: "16px", color: "#1c1d20" }}
              >
                Employee Record Swapping
              </h6>
              <p
                className="mb-0"
                style={{ fontSize: "13px", color: "#999d9e" }}
              >
                Allows User to View and Swap Employee Record.
              </p>
            </div>
          </div>

          {(listLoading || detailLoading) && <Loader fullScreen />}

          {view === "list" ? (
            /* ── LIST VIEW ── */
            <>
              {/* Duplicate records table */}
              <div className="card_tb mb-3">
                <ResponsiveDataTable
                  value={duplicateRecords}
                  emptyMessage="No records found."
                >
                  <Column
                    header="Common Value"
                    mobile={{ primary: true }}
                    body={(r) => r.Common_Value || r.Common_Value}
                  />
                  <Column
                    header="Occurance"
                    mobile={{ subtitle: true }}
                    style={{ width: "110px" }}
                    body={(r) => r.occurance || r.Occurance}
                  />
                  <Column
                    header="Common Field"
                    mobile={{ badge: true }}
                    style={{ width: "130px" }}
                    body={(r) => r.commonField || r.CommonField}
                  />
                  <Column
                    body={showTemplate}
                    header="Action"
                    mobile={{ action: true }}
                    style={{ width: "90px", textAlign: "center" }}
                  />
                </ResponsiveDataTable>
              </div>

              {/* Search section */}
              <div className="card_tb p-3">
                <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                  <label
                    style={{
                      fontSize: "13px",
                      color: "#545557",
                      whiteSpace: "nowrap",
                      fontWeight: "500",
                    }}
                  >
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
                    disabled={searchLoading}
                  >
                    {searchLoading ? "Searching…" : "Search"}
                  </button>
                </div>

                {/* Search results table */}
                {hasSearched && (
                  <div className="mb-3">
                    <ResponsiveDataTable
                      value={searchResults}
                      emptyMessage="No employees found."
                      loading={searchLoading}
                    >
                      <Column
                        header="Employee Id"
                        mobile={{ subtitle: true }}
                        body={(r) => r.empCode || r.id}
                      />
                      <Column field="empName" header="Employee Name" mobile={{ primary: true }} />
                      <Column field="processName" header="Process" />
                      <Column field="facilityName" header="Facility" />
                      <Column field="email" header="E-mail" mobile={{ hidden: true }} />
                      <Column
                        body={addToCompareTemplate}
                        header=""
                        mobile={{ action: true }}
                        style={{ width: "140px", textAlign: "center" }}
                      />
                    </ResponsiveDataTable>
                  </div>
                )}

                {/* Comparison list */}
                {comparisonList.length > 0 && (
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#545557",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Comparison List :
                    </span>
                    {comparisonList.map((emp) => {
                      const key = emp.id || emp.empCode;
                      return (
                        <span
                          key={key}
                          style={{
                            fontSize: "12px",
                            backgroundColor: "#e8f0fe",
                            color: "#3d5afe",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {emp.empCode || emp.id}
                          <button
                            type="button"
                            style={{
                              background: "none",
                              border: "none",
                              color: "#888",
                              cursor: "pointer",
                              padding: "0 0 0 4px",
                              fontSize: "13px",
                              lineHeight: 1,
                            }}
                            onClick={() => handleRemoveFromCompare(key)}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                    <button
                      className="btn btn-primary btn-sm px-3"
                      style={{ fontSize: "12px" }}
                      onClick={handleViewComparison}
                      disabled={detailLoading}
                    >
                      Show
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ── DETAIL VIEW ── */
            <>
              {/* Back link */}
              <div className="d-flex justify-content-end mb-2">
                <a
                  href="#!"
                  onClick={handleBack}
                  style={{
                    color: "#4a36ec",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                  className="text-decoration-underline"
                >
                  Back
                </a>
              </div>

              {/* Employee panels */}
              {detailEmployees.map((emp, i) => {
                const key = emp.id || emp.empCode || String(i);
                return (
                  <EmployeePanel
                    key={key}
                    emp={emp}
                    actionValue={selectedActions[key] || ""}
                    onActionChange={(val) =>
                      setSelectedActions((prev) => ({ ...prev, [key]: val }))
                    }
                  />
                );
              })}

              {/* Submit */}
              <div className="text-center mt-3 mb-4">
                <button
                  className="btn btn-success px-5"
                  onClick={handleSubmit}
                  disabled={submitLoading}
                >
                  {submitLoading ? "Submitting…" : "Submit"}
                </button>
              </div>
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
