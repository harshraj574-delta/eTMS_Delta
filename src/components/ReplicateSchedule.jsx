import React, { useState, useEffect, use } from "react";
import SidebarMenu from "./Master/SidebarMenu";
import Header from "./Master/Header";

import { Dropdown } from "primereact/dropdown";
import { apiService } from "../services/api";
import sessionManager from "../utils/SessionManager";
import { toastService } from "../services/toastService";
import { result } from "lodash";
import { CustomDataTable } from "./common/CustomDataTable";
import CustomPaginator from "./common/CustomPaginator";
import { Column } from "primereact/column";
// const addDay = (dateString, days) => {
//   if (!dateString) return "";
//   const date = new Date(dateString);
//   date.setDate(date.getDate() + days + 1);
//   return date.toISOString().split("T")[0];
// };
const generateWeekDays = (fromDate) => {
  const days = [];
  // Convert fromDate string to Date object
  const startDate = new Date(fromDate);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Start directly from fromDate instead of calculating start of week
  const startOfWeek = new Date(startDate);

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startOfWeek);
    currentDate.setDate(startOfWeek.getDate() + i);

    days.push({
      day: dayNames[currentDate.getDay()],
      date: `${currentDate.getDate()} -${monthNames[currentDate.getMonth()]}`,
      fullDate: currentDate.toISOString().split("T")[0],
    });
  }

  return days;
};
const ReplicateSchedule = () => {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 4);
    return today.toISOString().split('T')[0];
  }); const weekDays = generateWeekDays(fromDate);
  const [mgrscheduledata, setMgrscheduledata] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const [selectAll, setSelectAll] = useState(false);
  const [fromStartDate, setFromStartDate] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    const diff = monday.getDate() - monday.getDay() + (monday.getDay() === 0 ? -6 : 1);
    monday.setDate(diff);
    return monday;
  });
  const [fromEndDate, setFromEndDate] = useState(() => {
    const endDate = new Date(fromStartDate);
    endDate.setDate(endDate.getDate() + 6);
    return endDate;
  });
  const [toStartDate, setToStartDate] = useState(() => {
    const nextMonday = new Date(fromStartDate);
    nextMonday.setDate(nextMonday.getDate() + 7);
    return nextMonday;
  });

  const [toEndDate, setToEndDate] = useState(() => {
    const nextSunday = new Date(toStartDate);
    nextSunday.setDate(nextSunday.getDate() + 6);
    return nextSunday;
  });
  const [isDefaultWeek, setIsDefaultWeek] = useState(true);
  const [isToDefaultWeek, setIsToDefaultWeek] = useState(true);
  // const [message, setMessage] = useState('');
  const [lockPickTime, setLockPickTime] = useState(null);
  const [maxDays, setMaxDays] = useState(0);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const empid = sessionManager.getUserSession().ID;

  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  const checkboxHeaderTemplate = () => (
    <input
      type="checkbox"
      className="form-check-input"
      checked={selectAll}
      onChange={handleSelectAll}
    />
  );

  const checkboxBodyTemplate = (employee) => (
    <div className="d-flex align-items-center">
      <input
        type="checkbox"
        className="form-check-input m-0 me-2"
        checked={employee.isChecked || false}
        onChange={() => handleSingleCheck(employee.EmployeeID)}
      />
      {employee.geoCode !== "Y" && (
        <span className="material-icons md-18 text-danger mx-1" title="NoGeocode">location_off</span>
      )}
      {employee.tptReq !== "Y" && (
        <span className="material-icons md-18 text-danger mx-1" title="NoTransport">no_transfer</span>
      )}
    </div>
  );

  const dateBodyTemplate = (employee, dayIndex) => {
    if (!employee[`SETime${dayIndex}`]) return null;
    const parts = employee[`SETime${dayIndex}`].split("!")[0].split("<BR>");
    return (
      <>
        {parts[0]}
        {parts.length > 1 && <br />}
        {parts[1] && parts[1]}
      </>
    );
  };
  useEffect(() => {
    fetchManagers();
    fetchMgrSchedule(empid);
    fetchLockDetails();

  }, []);
  const handlePrevWeek = () => {
    setFromStartDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
    setFromEndDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
    setIsDefaultWeek(false);
  };

  const handleNextWeek = () => {
    const defaultMonday = new Date();
    const diff = defaultMonday.getDate() - defaultMonday.getDay() + (defaultMonday.getDay() === 0 ? -6 : 1);
    defaultMonday.setDate(diff);
    defaultMonday.setHours(0, 0, 0, 0);

    const newStartDate = new Date(fromStartDate);
    newStartDate.setDate(newStartDate.getDate() + 7);
    newStartDate.setHours(0, 0, 0, 0);

    // Check if we're back to default week
    if (newStartDate.getTime() === defaultMonday.getTime()) {
      setIsDefaultWeek(true);
    }

    setFromStartDate(newStartDate);
    setFromEndDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };
  const handleToNextWeek = (e) => {
    e.preventDefault();
    const defaultMonday = new Date(fromStartDate);
    defaultMonday.setDate(defaultMonday.getDate() + 7);
    defaultMonday.setHours(0, 0, 0, 0);

    const newStartDate = new Date(toStartDate);
    newStartDate.setDate(newStartDate.getDate() + 7);
    newStartDate.setHours(0, 0, 0, 0);

    setToStartDate(newStartDate);
    setToEndDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
    setIsToDefaultWeek(false);
  };
  const handleToPrevWeek = (e) => {
    e.preventDefault();
    const defaultMonday = new Date(fromStartDate);
    defaultMonday.setDate(defaultMonday.getDate() + 7);
    defaultMonday.setHours(0, 0, 0, 0);

    const newStartDate = new Date(toStartDate);
    newStartDate.setDate(newStartDate.getDate() - 7);
    newStartDate.setHours(0, 0, 0, 0);

    // Check if we're back to default week
    if (newStartDate.getTime() === defaultMonday.getTime()) {
      setIsToDefaultWeek(true);
    }

    setToStartDate(newStartDate);
    setToEndDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };
  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setSelectAll(isChecked);
    setMgrscheduledata(prev =>
      prev.map(item => ({
        ...item,
        isChecked: isChecked
      }))
    );
  };
  const handleSingleCheck = (employeeId) => {
    setMgrscheduledata(prev => {
      const updatedData = prev.map(item =>
        item.EmployeeID === employeeId
          ? { ...item, isChecked: !item.isChecked }
          : item
      );
      const allChecked = updatedData.every(item => item.isChecked);
      setSelectAll(allChecked);
      return updatedData;
    });
  };
  const fetchManagers = async () => {
    try {
      setLoading(true);
      const params = {
        backupmgrid: empid,
      };
      const response = await apiService.GetBackupMgrId(params);
      //console.log("Managers response:", response);
      if (response && response.length > 0) {
        setManagers(response);
        setSelectedManager(empid);
        fetchMgrSchedule(empid);
      }
    } catch (error) {
      console.error("Error fetching managers:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchMgrSchedule = async (managerId) => {
    try {
      setLoading(true);
      //let mgrid = empid;
      // if (document.getElementById("ddlManager").value !== "") {
      //   mgrid = document.getElementById("ddlManager").value;
      // }
      //const today = new Date();
      // const lastWeek = new Date(today);
      // lastWeek.setDate(today.getDate() - 7);
      const mgrscheduledata = await apiService.GetMgrSchedule({
        mgrid: managerId,
        sdate: fromDate,
      });
     // console.log("Managers response Data:", mgrscheduledata);
      setMgrscheduledata(mgrscheduledata);
    } catch (error) {
      console.error("Error fetching manager schedule:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleManagerChange = (e) => {
    // console.log("Selected Manager Value:", e.value);
    // console.log("Selected Manager Event:", e);
    setSelectedManager(e.value);
    fetchMgrSchedule(e.value);
  };
  const fetchLockDetails = async () => {
    try {
      const facilityId = sessionManager.getUserSession().FacilityID;
      const response = await apiService.GetLockDetails({ facID: facilityId });
      if (response && response.length > 0) {
        const lockDetails = response[0];
        setLockPickTime(new Date(lockDetails.pickLockDateTime));
        setMaxDays(parseInt(lockDetails.lockDiffDays));
      }
    } catch (error) {
      console.error('Error fetching lock details:', error);
    }
  };
  const handleReplicate = async () => {
    try {
      //console.log('Button clicked');
      const checkedEmployees = mgrscheduledata
        .filter(item => item.isChecked)
        .map(item => item.EmployeeID)
        .join(',');

     // console.log('Checked employees:', checkedEmployees);
      if (!checkedEmployees) {
        toastService.warn('Please select at least one employee.');
        return;
      }

      const toStartDateObj = new Date(toStartDate);
      const currentDate = new Date();
      const maxAllowedDate = new Date(currentDate);
      maxAllowedDate.setDate(currentDate.getDate() + maxDays);
      let response;
      // Modified condition to check if the date is within allowed range
      if (lockPickTime < toStartDateObj && maxAllowedDate >= toStartDateObj) {
        const params = {
          EmpIds: checkedEmployees,
          FromSDate: fromStartDate.toISOString().split('T')[0],
          FromEDate: fromEndDate.toISOString().split('T')[0],
          ToSDate: toStartDate.toISOString().split('T')[0],
          ToEDate: toEndDate.toISOString().split('T')[0],
          updatedBy: sessionManager.getUserSession().ID
        };

        //console.log('Replication params:', params);
        response = await apiService.ReplicateSchedule(params);
        response = 1;
        //console.log('Replication response:', response);
      } else {
        response = 2;
      }
      if (response <= 0) {
        toastService.error('Replicate Failed.');
      }
      else if (response === 1) {
        toastService.success('Schedule replicated successfully.');
        fetchMgrSchedule(selectedManager || empid);
      } else if (response === 2) {
        toastService.error(`Schedule Replication Failed, as roster for then week starting  ${currentDate.toLocaleDateString()} to ${maxAllowedDate.toLocaleDateString()}. has been locked, as per Transport TAT.`); 
      } 
    } catch (error) {
      console.error('API Error Details:', error.response?.data || error);
      toastService.error('An error occurred during replication. Please check the console for details.');
    }
  };


  return (
    <div className="container-fluid p-0">
      <Header pageTitle="ReplicateSchedule" />
      <SidebarMenu />
      <div className="middle">
        <div className="card_tb p-3">
          <div className="row">
            <div className="col-12 col-md-6 col-lg-4">
              <label htmlFor="">Manager</label>
              <Dropdown
                value={selectedManager}
                onChange={handleManagerChange}
                id="ddlManager"
                options={managers}
                optionLabel="ManagerName"
                optionValue="MgrId"
                placeholder="Select Manager"
                className="w-100"
                disabled={loading}
              />
            </div>
          </div>
        </div>
        <div className="row">
          {/* <div className="col-12">
            <h6 className="pageTitle">Replicate Schedule</h6>
          </div> */}
          <div className="col-12">
            <div className="card_tb p-3">
              <div className="row mb-3">
                <div className="col-12 col-xl-5 mb-4 mb-xl-0">
                  <div className="">
                    <h6 className="fs-16 mb-3 fw-bold titleStrip">From Week</h6>
                    <div className="row align-items-center gx-2">
                      <div className="col-auto">
                        <button
                          className="btn btn-link p-0"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePrevWeek();
                          }}
                          title="Previous Week"
                        >
                          <span className="material-icons">chevron_left</span>
                        </button>
                      </div>
                      <div className="col">
                        <label className="form-label mb-1">Start Date</label>
                        <h6 className="mb-0 fs-14">{fromStartDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}</h6>
                      </div>
                      <div className="col">
                        <label className="form-label mb-1">End Date</label>
                        <h6 className="mb-0 fs-14">{fromEndDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}</h6>
                      </div>
                      <div className="col-auto" style={{ minWidth: '32px' }}>
                        {!isDefaultWeek && (
                          <button
                            className="btn btn-link p-0"
                            onClick={(e) => {
                              e.preventDefault();
                              handleNextWeek();
                            }}
                            title="Next Week"
                          >
                            <span className="material-icons">chevron_right</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-xl-5 mb-4 mb-xl-0">
                  <h6 className="fs-16 mb-3 fw-bold titleStrip">To Week</h6>
                  <div className="">
                    <div className="row align-items-center gx-2">
                      <div className="col-auto" style={{ minWidth: '32px' }}>
                        {!isToDefaultWeek && (
                          <button
                            type="button"
                            className="btn btn-link p-0"
                            onClick={handleToPrevWeek}
                            title="Previous Week"
                          >
                            <span className="material-icons">chevron_left</span>
                          </button>
                        )}
                      </div>
                      <div className="col">
                        <label className="form-label mb-1">Start Date</label>
                        <h6 className="mb-0 fs-14">{toStartDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}</h6>
                      </div>
                      <div className="col">
                        <label className="form-label mb-1">End Date</label>
                        <h6 className="mb-0 fs-14">{toEndDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}</h6>
                      </div>
                      <div className="col-auto">
                        <button
                          type="button"
                          className="btn btn-link p-0"
                          onClick={handleToNextWeek}
                          title="Next Week"
                        >
                          <span className="material-icons">chevron_right</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-xl-2 d-flex align-items-end justify-content-start justify-content-xl-end mt-2 mt-xl-0" style={{ paddingBottom: '0.2rem' }}>
                  <div className="">
                    <button type="button" className="btn btn-primary" onClick={handleReplicate}>
                      <span className="material-icons">swap_horiz</span> Replicate Schedule
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12">
            <div className="card_tb p-3">
              {loading ? (
                <div className="text-center p-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <CustomDataTable value={mgrscheduledata.slice(first, first + rows)}>
                      <Column header={checkboxHeaderTemplate} body={checkboxBodyTemplate} style={{ width: '8%', minWidth: '100px' }} />
                      <Column field="EmpName" header="Employee Name" style={{ width: '15%', minWidth: '150px' }} />
                      {weekDays.map((day, index) => (
                        <Column
                          key={index}
                          header={`${day.day} ${day.date}`}
                          body={(rowData) => dateBodyTemplate(rowData, index)}
                          style={{ width: '11%', minWidth: '110px' }}
                        />
                      ))}
                    </CustomDataTable>
                  </div>
                  {mgrscheduledata.length > 0 && (
                    <CustomPaginator
                      first={first}
                      rows={rows}
                      totalRecords={mgrscheduledata.length}
                      onPageChange={onPageChange}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplicateSchedule;
