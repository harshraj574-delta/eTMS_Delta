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
import { get, set } from "lodash";
import { InputTextarea } from "primereact/inputtextarea";
import { useMemo } from "react";
import { start } from "react-scan/dist/index";
import ShiftTimeMasterService from "../services/compliance/ShiftTimeMaster";
import AdminScheduleService from "../services/compliance/AdminScheduleService";
import { toastService } from "../services/toastService";
import { apiService } from "../services/api";
import calendarIcon from "../assets/calendar.png";

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
    const month = date.toLocaleString("default", { month: "short" }); // <-- fixed here
    days.push({
      label: (
        <>
          {day},
          
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [shiftOptions, setShiftOptions] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [shiftOutOptions, setShiftOutOptions] = useState([]);
  const [selectedOutShift, setSelectedOutShift] = useState(null);
  const [selectedInFacility, setSelectedInFacility] = useState();
  const [selectedOutFacility, setSelectedOutFacility] = useState();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState();
  // const [dayWiseSchedule, setDayWiseSchedule] = useState(
  //   [...Array(7)].map(() => ({
  //     inFacility: null,
  //     inTime: null,
  //     outFacility: null,
  //     outTime: null,
  //   }))
  // );
  const [dayWiseSchedule, setDayWiseSchedule] = useState(
    [...Array(7)].map(() => ({
      inFacility: null,
      inTime: null,
      inTimeOptions: [],
      outFacility: null,
      outTime: null,
      outTimeOptions: []
    }))
  );
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [cachedEmployeeIds, setCachedEmployeeIds] = useState("");
  const [employeeScheduleA, setEmployeeScheduleA] = useState([]);
  const [selectedEmployeeSchedule, setSelectedEmployeeSchedule] = useState(null);
  const paginatedSchedule = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return adminSchedule.slice(start, end);
  }, [adminSchedule, currentPage, rowsPerPage]);
  const fetchAdminSchedule = async (empIds) => {
    try {
      const formattedDate = selectedDate?.toISOString().split("T")[0]; // yyyy-mm-dd

      const response = await AdminScheduleService.GetAdminSchedule({
        EmpIds: empIds, // Use the employeeIds state
        StartDate: formattedDate,
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
  const fetchFacilities = async () => {
    try {
      const response = await ShiftTimeMasterService.SelectFacility({
        userid: UserID,
      });
      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      const formattedData = Array.isArray(parsedResponse)
        ? parsedResponse.map((item) => ({
          label: item.facility || item.facilityName,
          value: item.Id,
        }))
        : [];
      setFacilities(formattedData);
      // Auto-select based on LocationId
      // const defaultFacility = formattedData.find((f) => f.value === LocationId);
      // if (defaultFacility) {
      //   setSelectedFacility(defaultFacility.value); // Only set the value (Id)
      // }
    } catch (error) {
      console.error("Failed to fetch facilities:", error);
    }
  };

  // useEffect(() => {
  //   fetchAdminSchedule();
  // }, []);

  const handleUpdateVendor = async () => {
    setIsSubmitting(true); // Show loader

    const effectiveDate = selectedDate || new Date();
    if (!employeeIds) {
      console.error("Employee IDs are required");
      setIsSubmitting(false);
      return;
    }

    try {
      // Clean up Employee IDs by removing line breaks, extra spaces, and duplicate commas
      const cleanedEmpIds = employeeIds
        .replace(/[\n\r\s]+/g, ",")  // Replace newlines, carriage returns, and spaces with commas
        .replace(/,+/g, ",")         // Replace multiple commas with one
        .replace(/^,|,$/g, "");      // Trim leading and trailing commas

      const empIdsArray = cleanedEmpIds.split(",").map(id => id.trim());

      if (empIdsArray.length === 0) {
        console.error("No valid Employee IDs provided");
        setIsSubmitting(false);
        return;
      }

      setEmployeeIds(cleanedEmpIds); // Optional: update the textarea value to cleaned string
      //setSelectedDate(effectiveDate);
      setCachedEmployeeIds(cleanedEmpIds); // ✅ save for reuse on refresh

      await fetchFacilities();        // Fetch facilities first
      await fetchAdminSchedule(cleanedEmpIds);     // Then fetch schedule
      setHasSearched(true);
    } catch (error) {
      console.error("Error processing Employee IDs:", error);
    } finally {
      setIsSubmitting(false); // Hide loader
    }
  };

  const fetchShiftTime = async (facilityId) => {
    try {
      const response = await AdminScheduleService.GetShiftForAdmin({
        facilityId: facilityId,
        type: "P",
        weekday: 2,
        ProcessId: 0,
      });
      let parsedData = [];
      if (typeof response === 'string') {
        parsedData = JSON.parse(response);
      } else {
        parsedData = response;
      }
      setShiftOptions(parsedData);
    } catch (error) {
      console.error("Error fetching shift times:", error);
      setShiftOptions([]);
    }
  };
  const fetchShiftTimeO = async (facilityId) => {
    try {
      const response = await AdminScheduleService.GetShiftForAdmin({
        facilityId: facilityId,
        type: "D",
        weekday: 2,
        ProcessId: 0,
      });
      let parsedData = [];
      if (typeof response === 'string') {
        parsedData = JSON.parse(response);
      } else {
        parsedData = response;
      }
      setShiftOutOptions(parsedData);
    } catch (error) {
      console.error("Error fetching shift times:", error);
      setShiftOutOptions([]);
    }
  };
  const handleFacilityChange = async (e) => {
    const selectedFacility = e.value;
    setSelectedInFacility(selectedFacility);
    setSelectedShift(null); // reset shift
    if (selectedFacility) {
      await fetchShiftTime(selectedFacility);
    }
  };
  const handleOutFacilityChange = async (e) => {
    const selectedFacility = e.value;
    setSelectedOutFacility(selectedFacility);
    setSelectedOutShift(null); // reset shift
    if (selectedFacility) {
      await fetchShiftTimeO(selectedFacility);
    }
  };
  const fetchDayWiseShift = async (facilityId, dayIndex, isOut = false) => {
    try {
      const response = await AdminScheduleService.GetShiftForAdmin({
        facilityId,
        type: isOut ? "D" : "P",
        weekday: dayIndex + 1, // weekday 1-based
        ProcessId: 0
      });
      console.log("Day Wise Shift Data:", response);
      const parsed = typeof response === "string" ? JSON.parse(response) : response;

      const updated = [...dayWiseSchedule];
      if (isOut) {
        updated[dayIndex].outTimeOptions = parsed;
        updated[dayIndex].outTime = null;
      } else {
        updated[dayIndex].inTimeOptions = parsed;
        updated[dayIndex].inTime = null;
      }

      setDayWiseSchedule(updated);
    } catch (error) {
      console.error("Error fetching shift:", error);
    }
  };
  const handleSaveSchedule = async () => {
    setIsSubmitting(true);
    if (selectedEmployees.length === 0) {
      setIsSubmitting(false);
      toastService.warn("Please select at least one employee.");
      return;
    }

    const empIdsStr = selectedEmployees.join(",");
    const INDIAN_ZONE = "(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi";

    const now = new Date();
    const localTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const formattedDateTime = localTime.toISOString();

    const promises = [];

    for (let i = 0; i < 7; i++) {
      const sDateObj = new Date(selectedDate);
      sDateObj.setDate(sDateObj.getDate() + i);
      const sDateFormatted = `${sDateObj.getMonth() + 1}/${sDateObj.getDate()}/${sDateObj.getFullYear()} 12:00:00 AM`;

      const inShift = dayWiseSchedule[i]?.inTime;
      const outShift = dayWiseSchedule[i]?.outTime;
      const pickFacility = dayWiseSchedule[i]?.inFacility;
      const dropFacility = dayWiseSchedule[i]?.outFacility;

      if (inShift && outShift && pickFacility && dropFacility) {
        const params = {
          EmpIds: empIdsStr,
          StartDate: sDateFormatted,
          StartTime: inShift.shiftTime,
          EndDate: sDateFormatted,
          EndTime: outShift.shiftTime,
          userName: UserID,
          updationTime: formattedDateTime,
          LeaveCode: noChangeChecked.toString(),
          updationTimeDrop: formattedDateTime,
          updationTime: formattedDateTime,
          LeaveCode: INDIAN_ZONE,
          pickFacilityID: pickFacility.toString(),  // ✅ string format
          dropFacilityID: dropFacility.toString(),  // ✅ string format
          pickadflag: 1,
          dropadflag: 1,
        };
        console.log("params", params);
        promises.push(AdminScheduleService.InsertScheduleAdmin(params));
      }
    }

    if (promises.length === 0) {
      setIsSubmitting(false);
      toastService.warn("No schedule data filled.");
      return;
    }

    try {
      await Promise.all(promises);
      toastService.success("Schedule saved successfully.");
      await fetchAdminSchedule(cachedEmployeeIds); // ✅ use original employee IDs
      setHasSearched(true);
      // ✅ Reset fields after save
      setDayWiseSchedule([...Array(7)].map(() => ({
        inFacility: null,
        inTime: null,
        inTimeOptions: [],
        outFacility: null,
        outTime: null,
        outTimeOptions: [],
      })));

      setSelectedInFacility(null);
      setSelectedOutFacility(null);
      setSelectedShift(null);
      setSelectedOutShift(null);
      setCheckedDays(Array(7).fill(false));
      setNoChangeChecked(false); // checkbox reset
    } catch (error) {
      console.error("Insert error:", error);
      toastService.error("Failed to save schedule.");
    }
    finally {
      setIsSubmitting(false);
    }
  };
  const handleSetAllSchedule = () => {
    const updatedSchedule = [...dayWiseSchedule];
    for (let i = 0; i < 7; i++) {
      if (checkedDays[i]) continue; // skip weekly off

      updatedSchedule[i] = {
        ...updatedSchedule[i],
        inFacility: selectedInFacility || null,
        inTime: selectedShift || null,
        inTimeOptions: shiftOptions || [],
        outFacility: selectedOutFacility || null,
        outTime: selectedOutShift || null,
        outTimeOptions: shiftOutOptions || [],
      };
    }
    setDayWiseSchedule(updatedSchedule);
  };
  useEffect(() => {
    fetchEmployeeSchedule();
  }, []);
  const fetchEmployeeSchedule = async (employeeId) => {
    try {
      const fromDate = document.getElementById("fromDate").value;

      // Call the API service
      const response = await apiService.GetOneEmployeeSchedule({
        empid: employeeId,
        sdate: fromDate,
      });

      console.log("Fetched Employee Schedule Response:", response);

      // Check if response exists and parse it if needed
      let scheduleData = response;

      // If response is a string (JSON), parse it
      if (typeof response === "string") {
        try {
          scheduleData = JSON.parse(response);
        } catch (e) {
          console.error("Error parsing response:", e);
        }
      }

      // Ensure we have an array to work with
      if (!Array.isArray(scheduleData)) {
        scheduleData = scheduleData ? [scheduleData] : [];
      }

      if (scheduleData.length > 0) {
        // Map the response data to match the exact API structure
        const formattedSchedule = scheduleData.map((schedule) => ({
          employeeID: schedule.employeeID || "",
          empCode: schedule.empCode || "",
          empName: schedule.empName || "",
          startDate: schedule.startDate || "",
          startTime: schedule.startTime || "",
          pickFacilityID: schedule.pickFacilityID || 0,
          endDate: schedule.endDate || "",
          endTime: schedule.endTime || "",
          dropFacilityID: schedule.dropFacilityID || 0,
          dropadflag: schedule.dropadflag || 0,
          pickadflag: schedule.pickadflag || 0,
          lastUpdatedBy: schedule.lastUpdatedBy,
          lastUpdatedAt: schedule.lastUpdatedAt,
          LastUpdate: schedule.LastUpdate,
          TPTFor: schedule.TPTFor || 0,
          Gender: schedule.Gender || "",
        }));

        setEmployeeScheduleA(formattedSchedule);
        setSelectedEmployeeId(formattedSchedule[0].empCode);

        // Log the formatted data
        console.log("Formatted Employee Schedule:", formattedSchedule);

        // Return the formatted data for immediate use if needed
        return formattedSchedule;
      } else {
        setEmployeeScheduleA([]);
        console.log("No schedule data found");
        return [];
      }
    } catch (error) {
      console.error("Error fetching employee schedule:", error);
      setEmployeeScheduleA([]);
      return [];
    }
  };
  return (
    <>
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
      <style>{`
        .first_tb tr td,
        .first_tb tr th {
          width: 12.5%;
        }
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
              <div className="custom-calendar-wrapper">
                <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                <Calendar
                  className="w-100 custom-calendar-input"
                  name="shiftDate"
                  placeholder="From Date"
                  dateFormat="dd-mm-yy" // UI display format
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.value) setSelectedDate(e.value);
                  }}
                  toggleMask
                  // feedback={false}
                />
              </div>
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
                className="btn btn-primary"
                onClick={() => handleUpdateVendor()}
              />
            </div>
          </div>
        </div>

        {/* card_tb border-bottom-0 first_tb */}
        {hasSearched && (
          <div className="card_tb1">
            {/* table table-sm m-0 */}
            <table className="table mb-0">
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

                          if (e.checked) {
                            const scheduleCopy = [...dayWiseSchedule];
                            scheduleCopy[idx] = {
                              inFacility: null,
                              inTime: null,
                              inTimeOptions: [],
                              outFacility: null,
                              outTime: null,
                              outTimeOptions: [],
                            };
                            setDayWiseSchedule(scheduleCopy);
                          }
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
                              id="facility"
                              placeholder="Select"
                              value={selectedInFacility}
                              options={facilities}
                              onChange={handleFacilityChange}
                              optionLabel="label"
                              className="w-100"
                            />
                          </td>
                          <td>
                            <Dropdown
                              value={selectedShift}
                              options={shiftOptions}
                              onChange={(e) => setSelectedShift(e.value)}
                              placeholder="Select"
                              className="w-100"
                              optionLabel="shiftTime"
                              filter
                            />
                          </td>
                          <td></td>
                        </tr>
                        <tr>
                          <td className="text-center">OUT</td>
                          <td>
                            <Dropdown
                              id="facility"
                              options={facilities}
                              value={selectedOutFacility}
                              onChange={handleOutFacilityChange}
                              placeholder="Select"
                              className="w-100"
                            />
                          </td>
                          <td>
                            <Dropdown
                              optionLabel="shiftTime"
                              options={shiftOutOptions}
                              value={selectedOutShift}
                              onChange={(e) => setSelectedOutShift(e.value)}
                              placeholder="Select"
                              className="w-100"
                              filter
                            />
                          </td>
                          <td className="text-end">
                            <Button label="Set All" className="btn btn-sm btn-dark" onClick={handleSetAllSchedule} />
                          </td>
                        </tr>

                      </tbody>
                    </table>
                  </td>
                  {/* <td></td> */}
                  {[...Array(7)].map((_, idx) => (
                    <td key={idx}>
                      {checkedDays[idx] ? (
                        <div className="text-center text-muted" style={{ fontSize: "0.9rem" }}>
                          <p className="mb-2">IN: N/A</p>
                          <p>OUT: N/A</p>
                        </div>
                      ) : (
                        <>
                          <div className="mb-2">
                            <Dropdown
                              options={facilities}
                              value={dayWiseSchedule[idx].inFacility}
                              onChange={async (e) => {
                                const updated = [...dayWiseSchedule];
                                updated[idx].inFacility = e.value;
                                updated[idx].inTime = null;
                                setDayWiseSchedule(updated);
                                await fetchDayWiseShift(e.value, idx, false);
                              }}
                              placeholder="Select"
                              className="w-100"
                              optionLabel="label"
                            />
                            <Dropdown
                              value={dayWiseSchedule[idx].inTime}
                              options={dayWiseSchedule[idx].inTimeOptions}
                              onChange={(e) => {
                                const updated = [...dayWiseSchedule];
                                updated[idx].inTime = e.value;
                                setDayWiseSchedule(updated);
                              }}
                              placeholder="Select"
                              className="w-100 mt-1"
                              optionLabel="shiftTime"
                              filter
                            />
                          </div>
                          <div>
                            <Dropdown
                              options={facilities}
                              value={dayWiseSchedule[idx].outFacility}
                              onChange={async (e) => {
                                const updated = [...dayWiseSchedule];
                                updated[idx].outFacility = e.value;
                                updated[idx].outTime = null;
                                setDayWiseSchedule(updated);
                                await fetchDayWiseShift(e.value, idx, true);
                              }}
                              placeholder="Select"
                              className="w-100 mt-2"
                              optionLabel="label"
                            />
                            <Dropdown
                              value={dayWiseSchedule[idx].outTime}
                              options={dayWiseSchedule[idx].outTimeOptions}
                              onChange={(e) => {
                                const updated = [...dayWiseSchedule];
                                updated[idx].outTime = e.value;
                                setDayWiseSchedule(updated);
                              }}
                              placeholder="Select"
                              className="w-100 mt-1"
                              optionLabel="shiftTime"
                              filter
                            />
                          </div>
                        </>
                      )}
                    </td>
                  ))}

                  {/* <td></td> */}
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="8" className="text-end">
                    <div className="d-flex justify-content-end align-items-center">
                      <div className="">
                        <Checkbox
                          inputId="ingredient1"
                          name="pizza"
                          value="Cheese"
                          checked={noChangeChecked}
                          onChange={(e) => setNoChangeChecked(e.checked)}
                        />
                        <label htmlFor="ingredient1" className="ms-2 mb-0">
                          Check For No Change Exception
                        </label>
                      </div>

                      <Button
                        label="Save Schedule"
                        className="btn btn-primary ms-3"
                        onClick={handleSaveSchedule}
                      />
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {hasSearched && (
          <div className="card_tb border-bottom-0">
            <table className="table table-sm m-0">
              <thead>

                <tr>
                  <th>
                    <Checkbox
                      inputId="selectAll"
                      checked={selectAll}
                      onChange={(e) => {
                        const checked = e.checked;
                        setSelectAll(checked);

                        if (checked) {
                          // ✅ Select all employees
                          const allIds = adminSchedule.map(emp => emp.EmployeeID);
                          setSelectedEmployees(allIds);
                        } else {
                          // ❌ Deselect all
                          setSelectedEmployees([]);
                        }
                      }}
                    />
                  </th>
                  <th></th>
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
                      <Checkbox
                        inputId={`emp-${rowIdx}`}
                        checked={selectedEmployees.includes(emp.EmployeeID)}
                        onChange={(e) => {
                          const checked = e.checked;

                          if (checked) {
                            setSelectedEmployees((prev) => [...prev, emp.EmployeeID]);
                          } else {
                            setSelectedEmployees((prev) => prev.filter(id => id !== emp.EmployeeID));
                          }

                          setSelectAll(false); // Always uncheck "Select All" if user changes individual
                        }}
                      />
                    </td>
                    <td>
                      <span
                        className={`material-icons md-18 me-1 ${emp.geoCode === "Y" ? "text-success" : "text-danger"
                          }`}
                        title={emp.geoCode === "Y" ? "Geocoded" : "No Geocode"}
                      >
                        {emp.geoCode === "Y" ? "location_on" : "location_off"}
                      </span>

                      <span
                        className={`material-icons md-18 me-1 ${emp.tptReq === "Y" ? "text-success" : "text-danger"
                          }`}
                        title={emp.tptReq === "Y" ? "Transport Required" : "No Transport"}
                      >
                        {emp.tptReq === "Y" ? "directions_bus" : "no_transfer"}
                      </span>
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
                                {line.length === 0 ? "N/A" : line}
                              </a>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="d-flex justify-content-between align-items-center mt-3 px-2">
              <div>
                {adminSchedule.length > 0
                  ? `Showing ${adminSchedule.length} of ${adminSchedule.length} entries`
                  : "No records found"}
              </div>
            </div>
          </div>
        )}

      </div>
      {/* <PrimeSidebar
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
                  <small>Employee ID</small> {selectedEmployeeSchedule?.empCode}
                </li>
                <li>
                  <small>Name</small> {selectedEmployeeSchedule?.empName}
                </li>
                <li>
                  <small>Shift Date</small>{" "}
                  {selectedEmployeeSchedule?.startDate
                    ? new Date(selectedEmployeeSchedule.startDate).toLocaleDateString("en-GB", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                    : ""}
                </li>
              </ul>
            </div>
            <div className="field col-12">
              <label htmlFor="">Select Log-In</label>
            </div>
            <div className="field col-6 mb-3">
              <Dropdown
                optionLabel="label"
                value={selectedEmployeeSchedule?.pickFacilityID || null}
                options={facilities}
                placeholder="Select Facility"
                className="w-100"
                disabled
              />
            </div>
            <div className="field col-6 mb-3">
              <Dropdown
                optionLabel="shiftTime"
                value={selectedEmployeeSchedule?.startTime || null}
                options={[{ shiftTime: selectedEmployeeSchedule?.startTime }]}
                placeholder="Select Time"
                className="w-100"
                disabled
              />
            </div>
            <div className="field col-12">
              <label htmlFor="">Select Log-Out</label>
            </div>
            <div className="field col-6 mb-3">
              <Dropdown
                optionLabel="label"
                value={selectedEmployeeSchedule?.dropFacilityID || null}
                options={facilities}
                placeholder="Select Facility"
                className="w-100"
                disabled
              />
            </div>
            <div className="field col-6 mb-3">
              <Dropdown
                optionLabel="shiftTime"
                value={selectedEmployeeSchedule?.endTime || null}
                options={[{ shiftTime: selectedEmployeeSchedule?.endTime }]}
                placeholder="Select Time"
                className="w-100"
                disabled
              />
            </div>
          </div>
          <p className="mt-3">
            <small>
              * Login, Last Updated By - {selectedEmployeeSchedule?.lastUpdatedBy} ({selectedEmployeeSchedule?.empCode}) |
              At - {selectedEmployeeSchedule?.lastUpdatedAt}
            </small>
          </p>
          <p className="mt-2">
            <small>
              * Logout, Last Updated By - {selectedEmployeeSchedule?.lastUpdatedBy} ({selectedEmployeeSchedule?.empCode}) |
              At - {selectedEmployeeSchedule?.lastUpdatedAt}
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
      </PrimeSidebar> */}
    </>
  );
};

export default AdminSchedule;
