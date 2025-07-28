import { useState, useEffect } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Sidebar as PrimeSidebar } from "primereact/sidebar";
import { BiRightArrowAlt } from "react-icons/bi";
import apiService from "../services/compliance/AdminScheduleService";
import { get, set } from "lodash";
import { InputTextarea } from "primereact/inputtextarea";
import { useMemo } from "react";
import { start } from "react-scan/dist/index";
// Helper to get 7 days from selectedDate
// const month = date.toLocaleString("default", { month: "long" });
const getWeekDays = (startDate) => {
  const days = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const day = dayNames[date.getDay()];
    const dayNum = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("default", { month: "long" }); // <-- fixed here
    days.push({
      label: (
        <>
          {day}
          <br />
          {dayNum}-{month}
        </>
      ),
      dateObj: date,
    });
  }
  return days;
};

const AdminSchedule = () => {
  const UserID = sessionStorage.getItem("ID");
  const LocationId = sessionStorage.getItem("locationId");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [checkedDays, setCheckedDays] = useState(Array(7).fill(false));
  const [noChangeChecked, setNoChangeChecked] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [adminSchedule, setAdminSchedule] = useState([]);
  const [employeeIds, setEmployeeIds] = useState("");
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);


  const fetchAdminSchedule = async () => {
    try {
      const response = await apiService.GetAdminSchedule({
        EmpIds: employeeIds, // Use the employeeIds state
        StartDate: selectedDate,
        locationid: LocationId,
      });
      console.log("Admin Schedule Data:", response);
      let parsedData = [];
      if (typeof response === 'string') {
        parsedData = JSON.parse(response);
      } else {
        parsedData = response;
      }
      setAdminSchedule(parsedData);
    } catch (error) {
      console.error("Error fetching admin schedule:", error);
    }
  };

  // useEffect(() => {
  //   fetchAdminSchedule();
  // }, []);

  const handleUpdateVendor = () => {
    if (!employeeIds) {
      console.error("Employee IDs are required");
      return;
    }
    try {
      const empIdsArray = employeeIds.split(",").map(id => id.trim());
      if (empIdsArray.length === 0) {
        console.error("No valid Employee IDs provided");
        return;
      }
      fetchAdminSchedule();
    } catch (error) {
      console.error("Error processing Employee IDs:", error);
    }
  };

  return (
    <>
      <style>{`
        .first_tb tr td,
        .first_tb tr th {
          width: 12.5%;
        }
      `}</style>

      <Header
        pageTitle="Admin Schedule"
        showNewButton={false}
        onNewButtonClick={() => setAddNewCost(false)}
      />
      <Sidebar />
      <div className="middle">
        <div className="card_tb p-3">
          <div className="row">
            <div className="field col-2 mb-3">
              <label>From Date</label>
              <Calendar
                className="w-100"
                name="shiftDate"
                placeholder="From Date"
                dateFormat="dd-mm-yy"
                value={selectedDate}
              onChange={(e) => setSelectedDate(e.value)}
              />
            </div>
            {/* <div className="field col-2 mb-3">
              <label>Employee ID's</label>
              <InputText
                className="form-control"
                name=""
                placeholder="Enter Employee ID's"
              />
            </div>
             */}
            <div className="field col-6 mb-3">
              <label>Employee ID's</label>
              <InputTextarea
                value={employeeIds}
                onChange={(e) => setEmployeeIds(e.target.value)}
                rows={1}
                cols={30}
                className="w-100"
              />
            </div>
            <div className="field col-2 mb-3 no-label">
              <Button
                label="Search"
                className="btn btn-dark"
                onClick={() => handleUpdateVendor()}
              />
            </div>
          </div>
        </div>

        {/* card_tb border-bottom-0 first_tb */}
        <div className="card_tb1">
          {/* table table-sm m-0 */}
          <table className="table">
            <thead>
              <tr>
                <th className="d-flex justify-content-between align-items-center">
                  <span>Apply Schedule</span>
                  <span>
                    Days <BiRightArrowAlt />
                  </span>
                </th>
                {weekDays.map((d, idx) => (
                  <th key={idx} style={{ whiteSpace: "nowrap" }}>{d.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-end">
                  Weekly Off <BiRightArrowAlt />
                </td>
                {[...Array(7)].map((_, idx) => (
                  <td key={idx}>
                    <Checkbox
                      inputId={`checkbox-${idx}`}
                      checked={checkedDays[idx]}
                      onChange={(e) => {
                        const updated = [...checkedDays];
                        updated[idx] = e.checked;
                        setCheckedDays(updated);
                      }}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td
                  colSpan={1}
                  className="bg-grey p-0"
                  style={{ width: "50%" }}
                >
                  <table
                    className="w-100"
                    style={{ tableLayout: "fixed", minWidth: "400px" }}
                  >
                    <colgroup>
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "35%" }} />
                      <col style={{ width: "35%" }} />
                      <col style={{ width: "15%" }} />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td className="text-center">IN</td>
                        <td>
                          <Dropdown
                            optionLabel="name"
                            placeholder="Facility"
                            className="w-100"
                            filter
                          />
                        </td>
                        <td>
                          <Dropdown
                            optionLabel="name"
                            placeholder="Time"
                            className="w-100"
                            filter
                          />
                        </td>
                        <td></td>
                      </tr>
                      <tr>
                        <td className="text-center">OUT</td>
                        <td>
                          <Dropdown
                            optionLabel="name"
                            placeholder="Facility"
                            className="w-100"
                            filter
                          />
                        </td>
                        <td>
                          <Dropdown
                            optionLabel="name"
                            placeholder="Time"
                            className="w-100"
                            filter
                          />
                        </td>
                        <td className="text-end">
                          <Button label="Set All" className="btn btn-sm btn-dark" />
                        </td>
                      </tr>

                    </tbody>
                  </table>
                </td>
                {/* <td></td> */}
                {[...Array(7)].map((_, idx) => (
                  <td key={idx} style={{}}>
                    <Dropdown
                      optionLabel="name"
                      placeholder="Facility"
                      className="w-100 mb-2"
                      filter
                    />
                    <Dropdown
                      optionLabel="name"
                      placeholder="Time"
                      className="w-100"
                      filter
                    />
                  </td>
                ))}
                {/* <td></td> */}
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="8" className="text-end">
                  <div className="d-flex justify-content-end align-items-center">
                    <div className="d-flex align-items-center">
                      <Checkbox
                        inputId="ingredient1"
                        name="pizza"
                        value="Cheese"
                        checked={noChangeChecked}
                        onChange={(e) => setNoChangeChecked(e.checked)}
                      />
                      <label htmlFor="ingredient1" className="ms-2">
                        Check For No Change Exception
                      </label>
                    </div>

                    <Button
                      label="Save Schedule"
                      className="btn btn-primary ms-3"
                    />
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="card_tb border-bottom-0">
          <table className="table table-sm m-0">
            <thead>
              <tr>
                <th>
                  <Checkbox inputId="" />
                </th>
                <th>EmpName</th>
                {weekDays.map((d, idx) => (
                  <th key={idx} style={{ whiteSpace: "nowrap" }}>{d.label}</th>
                ))}
              </tr>
            </thead>
            {/* <tbody>
              <tr>
                <td>
                  <Checkbox inputId="" />
                </td>
                <td>{adminSchedule.EmpName}</td>
                {[...Array(7)].map((_, idx) => (
                  <td key={idx}>
                    <a
                      href="#!"
                      onClick={() => setSidebarVisible(true)}
                      className="d-block"
                    >
                      BLR 0900
                    </a>
                    <a href="#!" onClick={() => setSidebarVisible(true)}>
                      BLR 1900
                    </a>
                  </td>
                ))}
              </tr>
            </tbody> */}
            <tbody>
              {adminSchedule.map((emp, rowIdx) => (
                <tr key={rowIdx}>
                  <td>
                    <Checkbox inputId="" />
                  </td>
                  <td>{emp.EmpName}</td>
                  {weekDays.map((_, idx) => {
                    const key = `SETime${idx}`;
                    let cell = emp[key] || "";
                    // Remove unwanted HTML and trailing chars
                    cell = cell.replace(/<BR>/gi, "||").replace(/! \|/g, "").trim();
                    // Split by "||" for IN/OUT
                    const lines = cell.split("||").map(l => l.trim()).filter(Boolean);
                    return (
                      <td key={idx}>
                        {lines.map((line, i) =>
                          line ? (
                            <a
                              href="#!"
                              key={i}
                              onClick={() => setSidebarVisible(true)}
                              className="d-block"
                            >
                              {line}
                            </a>
                          ) : null
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PrimeSidebar
        visible={sidebarVisible}
        onHide={() => setSidebarVisible(false)}
        position="right"
        style={{ width: "30%", backdropFilter: "blur(8px)" }}
        showCloseIcon={false}
        dismissable={false}
      >
        <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
          <h6 className="sidebarTitle">
            TMP123-Anurag Singh{" "}
            <small className="d-block">Thursday, July 10, 2025</small>
          </h6>
          <span
            className="material-icons me-3"
            style={{ cursor: "pointer" }}
            onClick={() => setSidebarVisible(false)}
          >
            close
          </span>
        </div>
        <div className="sidebarBody p-3">
          <div className="row">
            <div className="col-12">
              <ul class="offcanvas_list mb-3">
                <li>
                  <small>Employee ID</small> TMP123
                </li>
                <li>
                  <small>Name</small> Anurag Singh
                </li>
                <li>
                  <small>Shift Date</small> Monday, July 14, 2025
                </li>
              </ul>
            </div>
            <div className="field col-12">
              <label htmlFor="">Select Log-In</label>
            </div>
            <div className="field col-6 mb-3">
              <Dropdown
                optionLabel="name"
                placeholder="Select Facility"
                className="w-100"
                filter
              />
            </div>
            <div className="field col-6 mb-3">
              <Dropdown
                optionLabel="name"
                placeholder="Select Time"
                className="w-100"
                filter
              />
            </div>
            <div className="field col-12">
              <label htmlFor="">Select Log-Out</label>
            </div>
            <div className="field col-6 mb-3">
              <Dropdown
                optionLabel="name"
                placeholder="Select Facility"
                className="w-100"
                filter
              />
            </div>
            <div className="field col-6 mb-3">
              <Dropdown
                optionLabel="name"
                placeholder="Select Time"
                className="w-100"
                filter
              />
            </div>
          </div>
          <p className="mt-3">
            <small>
              * Login, Last Updated By - Anurag Singh (TMP123) | At - Jul 10
              2025 4:29PM
            </small>
          </p>
          <p className="mt-2">
            <small>
              * Logout, Last Updated By - Anurag Singh (TMP123) | At - Jul 10
              2025 4:29PM
            </small>
          </p>
        </div>
        <div className="sidebar-fixed-bottom position-absolute pe-3">
          <div className="d-flex gap-3 justify-content-end">
            <Button
              label="Cancel"
              className="btn btn-outline-secondary"
              onClick={() => {
                setSidebarVisible(false);
              }}
            />
            <Button label="Save" className="btn btn-success" />
          </div>
        </div>
      </PrimeSidebar>
    </>
  );
};

export default AdminSchedule;
