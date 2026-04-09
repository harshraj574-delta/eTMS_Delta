import React, { useState, useCallback, memo } from 'react';
import CustomPaginator from './CustomPaginator';
import '../css/MobileSchedule.css';

/**
 * MobileScheduleView - Optimized mobile schedule with pagination.
 * 
 * Props:
 * - parsedSchedule: Array of normalized employee data
 * - weekDays: Array of { day, date, fullDate } objects (7 days)
 * - onShiftClick: (employee, dayIndex) => void
 * - onTripClick: (employee, dayIndex) => void
 * - loading: boolean
 */

// TripCarIcon component (mirrors MySchedule.jsx)
const TripCarIcon = ({ title = "Trip Details" }) => {
  return (
    <span
      className="trip-car-icon material-icons"
      aria-hidden="true"
      title={title}
    >
      directions_car
    </span>
  );
};

// Memoized Employee Card Component
const EmployeeCard = memo(({ 
  employee, 
  dayIndex, 
  onShiftClick, 
  onTripClick
}) => {
  const dayData = employee.days[dayIndex];
  const isDisabled = employee.geoCode !== 'Y' || employee.tptReq !== 'Y';
  
  const formatTime = (time) => {
    if (!time || time === 'N/A' || time.trim() === '') return 'N/A';
    // Format HHMM to HH:MM
    if (time.length === 4 && /^\d{4}$/.test(time)) {
      return `${time.slice(0, 2)}:${time.slice(2)}`;
    }
    return time;
  };

  const handleCardClick = useCallback((e) => {
    if (isDisabled) return;
    onShiftClick(employee, dayIndex);
  }, [employee, dayIndex, isDisabled, onShiftClick]);

  const handleTripClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
      e.nativeEvent.stopImmediatePropagation();
    }
    onTripClick(employee, dayIndex);
  }, [employee, dayIndex, onTripClick]);

  return (
    <div 
      className={`mobile-employee-card ${isDisabled ? 'disabled-card' : ''}`}
      onClick={handleCardClick}
    >
      <div className="employee-card-left">
        <p className="employee-name">
          {employee.empName}
          {employee.geoCode !== 'Y' && (
            <span className="material-icons status-icon text-danger" title="No Geocode">
              location_off
            </span>
          )}
          {employee.tptReq !== 'Y' && (
            <span className="material-icons status-icon text-danger" title="No Transport">
              no_transfer
            </span>
          )}
        </p>
        <div className="employee-times">
          <div className="time-item">
            <span className="time-label">Pick</span>
            <span className={`time-value ${!dayData.pickup || dayData.pickup === 'N/A' ? 'na' : ''}`}>
              {formatTime(dayData.pickup) || 'N/A'}
            </span>
          </div>
          <div className="time-item">
            <span className="time-label">Drop</span>
            <span className={`time-value ${!dayData.drop || dayData.drop === 'N/A' ? 'na' : ''}`}>
              {formatTime(dayData.drop) || 'N/A'}
            </span>
          </div>
        </div>
      </div>
      
      {dayData.hasTrip && (dayData.pickup || dayData.drop) && (
        <div className="employee-card-right">
          <button 
            type="button"
            className="trip-icon-btn"
            onClick={handleTripClick}
            title="View Trip Details"
            data-bs-toggle="offcanvas"
            data-bs-target="#trips"
            style={{ background: 'transparent', border: 'none' }}
          >
            <TripCarIcon />
          </button>
        </div>
      )}
    </div>
  );
});

EmployeeCard.displayName = 'EmployeeCard';

const MobileScheduleView = ({
  parsedSchedule = [],
  weekDays = [],
  onShiftClick,
  onTripClick,
  loading = false
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    // Find today's index or default to 0
    const todayStr = new Date().toISOString().split('T')[0];
    const todayIndex = weekDays.findIndex(d => d.fullDate === todayStr);
    return todayIndex >= 0 ? todayIndex : 0;
  });

  // Pagination state
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);

  const todayStr = new Date().toISOString().split('T')[0];

  const handlePrevDay = useCallback(() => {
    setSelectedDayIndex(prev => Math.max(0, prev - 1));
    setFirst(0); // Reset pagination when day changes
  }, []);

  const handleNextDay = useCallback(() => {
    setSelectedDayIndex(prev => Math.min(6, prev + 1));
    setFirst(0); // Reset pagination when day changes
  }, []);

  const handleTodayClick = useCallback(() => {
    const todayIndex = weekDays.findIndex(d => d.fullDate === todayStr);
    if (todayIndex >= 0) {
      setSelectedDayIndex(todayIndex);
      setFirst(0); // Reset pagination when jumping to today
    }
  }, [weekDays, todayStr]);

  const onPageChange = useCallback((e) => {
    setFirst(e.first);
    setRows(e.rows);
  }, []);

  const currentDay = weekDays[selectedDayIndex] || {};
  const isToday = currentDay.fullDate === todayStr;
  const isTodayInRange = weekDays.some(d => d.fullDate === todayStr);

  // Get paginated employees
  const paginatedEmployees = parsedSchedule.slice(first, first + rows);
  const totalRecords = parsedSchedule.length;

  return (
    <div className="mobile-schedule-container">
      {/* Day Selector */}
      <div className="mobile-day-selector">
        <div className="mobile-day-selector-row">
          <button 
            className="day-nav-btn"
            onClick={handlePrevDay}
            disabled={selectedDayIndex === 0}
          >
            <span className="material-icons">chevron_left</span>
          </button>
          
          <div className={`day-info ${isToday ? 'is-today' : ''}`}>
            <p className="day-name">{currentDay.day || 'Day'}</p>
            <p className="day-date">{currentDay.date || 'Date'}</p>
            {isToday && <span className="today-indicator">Today</span>}
          </div>
          
          <button 
            className="day-nav-btn"
            onClick={handleNextDay}
            disabled={selectedDayIndex === 6}
          >
            <span className="material-icons">chevron_right</span>
          </button>
        </div>
        
        {!isToday && isTodayInRange && (
          <div className="today-btn-row">
            <button 
              className="today-btn"
              onClick={handleTodayClick}
            >
              Today
            </button>
          </div>
        )}
      </div>

      {/* Employee List */}
      <div className="mobile-employee-list">
        <div className="mobile-employee-list-inner">
          {loading ? (
            <div className="mobile-loading">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span>Loading schedule...</span>
            </div>
          ) : parsedSchedule.length === 0 ? (
            <div className="mobile-empty-state">
              <span className="material-icons">event_busy</span>
              <p>No employees found for this schedule</p>
            </div>
          ) : (
            <>
              {paginatedEmployees.map((employee) => (
                <EmployeeCard
                  key={employee.employeeId}
                  employee={employee}
                  dayIndex={selectedDayIndex}
                  onShiftClick={onShiftClick}
                  onTripClick={onTripClick}
                />
              ))}
              
              {/* Pagination */}
              <CustomPaginator
                first={first}
                rows={rows}
                totalRecords={totalRecords}
                onPageChange={onPageChange}
                rowsPerPageOptions={[10, 20, 50]}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(MobileScheduleView);
