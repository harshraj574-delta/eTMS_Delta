import { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import React from "react";
const RiStats = ({ filter }) => { 
  // console.log("-----", JSON.stringify(filter));
  const [statsData, setStatsData] = useState({});
  const [cancelData, setCancelData] = useState([]);

  const [selectedTripType, setSelectedTripType] = useState("");

  // Fetch Route Count Stats
  useEffect(() => {
    const fetchRouteCount = async () => {
      try {
        const obj = {
          sDate: filter.sDate, // selectedPeriod
          eDate: filter.eDate, // selectedPeriod
          locationid: filter.locationid || "", // selCity
          facilityid: filter?.facilityid || "", // selFacility
          vendorid: filter?.vendorid || "", // selVendor
          triptype: filter?.triptype || "", // selectedTripType
        };
        const res = await apiService.Getchart_RouteCount(obj);
        //console.log("Route Count Data", res);
        let data = [];
        if (Array.isArray(res)) {
          data = res;
        } else if (typeof res === "string") {
          try {
            data = JSON.parse(res);
          } catch (e) {
            data = [];
          }
        }
        if (Array.isArray(data) && data.length > 0) {
          setStatsData(data[0]);
        } else {
          setStatsData({});
        }
      } catch (err) {
        console.error("Route Count Error", err);
        setStatsData({});
      }
    };
    fetchRouteCount();
  }, [filter]);

  // Fetch Cancel Reallocation
  useEffect(() => {
    const fetchCancelData = async () => {
      try {
        const credentials = {
          sDate: filter.sDate, // selectedPeriod
          eDate: filter.eDate, // selectedPeriod
          locationid: filter.locationid || "", // selCity
          facilityid: filter?.facilityid || "", // selFacility
          vendorid: filter?.vendorid || "", // selVendor
          triptype: filter?.triptype || "", // selectedTripType
        };

        const response = await apiService.getchart_CancelReallocation(
          credentials
        );

        let parsed = [];

        // Handle stringified JSON response
        if (typeof response === "string") {
          try {
            parsed = JSON.parse(response);
            //console.log("Parsed string response:", parsed);
          } catch (e) {
            console.error("Failed to parse string response:", e);
            setCancelData(null);
            return;
          }
        } else {
          parsed = response;
        }

        if (Array.isArray(parsed) && parsed.length > 0) {
          setCancelData(parsed[0]);
        } else {
          setCancelData(null);
        }
      } catch (error) {
        console.error("API Error:", error);
        setCancelData(null);
      }
    };

    fetchCancelData();
  }, [filter]);

  // Safely extract and format values for display
  //console.log("thjis ", cancelData);
  const cancellationPer = cancelData?.CancellationPer ?? 0;
  const reallocationPer = cancelData?.reallocationPer ?? 0;
  // Determine if OTD or OTA should show N/A
  const isPick = filter?.triptype?.toLowerCase() === "pick";
  const isDrop = filter?.triptype?.toLowerCase() === "drop";

  return (
    <div className="row d-flex align-items-stretch">
      <div className="col-lg-12 col-xl-7 d-flex">
        <div className="cardNew w-100 h-100" style={{  alignItems: 'center', display: 'flex', justifyContent: 'center' }}>
          <ul className="py-2">
            <li>
              <h3>
                <strong>{statsData.totalroute ?? 0}</strong>
                <span className="subtitle_sm">Routes</span>
              </h3>
              <span
                className={`overline_text d-flex align-items-center ${
                  statsData.routediffStatus === "down"
                    ? "text-danger"
                    : "text-success"
                }`}
              >
                {statsData.routediffStatus === "down" ? (
                  <FiTrendingDown className="me-1" />
                ) : (
                  <FiTrendingUp className="me-1" />
                )}
                {statsData.RouteDiffPer ?? 0} %
              </span>

              <span className="overline_text text-warning">
                {statsData.totalemployee ?? 0} Employees
              </span>
              <div className="d-flex justify-content-between align-items-center">
                <span className="badge bg-primary-subtle rounded-pill text-dark my-2 me-2">
                  {statsData.malecount ?? 0} Male
                </span>
                <span className="badge bg-danger-subtle rounded-pill text-dark">
                  {statsData.femalecount ?? 0} Female
                </span>
                
              </div>
            </li>
            <li>
              <h3>
                <strong>
                  {statsData.AvgOccupancy ?? 0}{" "}
                  {/* <small className="fs-6 text-muted">%</small> */}
                </strong>
              </h3>
              <span className="subtitle_sm">Avg. Vehicle Occupancy</span>
              {/* <span className="overline_text d-flex text-success align-items-center">
                <FiTrendingUp className="me-1" /> 85%
              </span> */}
              <span
                className={`overline_text d-flex align-items-center ${
                  statsData.AvgOccupancyDiffStatus === "down"
                    ? "text-danger"
                    : "text-success"
                }`}
              >
                {statsData.AvgOccupancyDiffStatus === "down" ? (
                  <FiTrendingDown className="me-1" />
                ) : (
                  <FiTrendingUp className="me-1" />
                )}
                {statsData.AvgOccupancyDiff ?? 0} %
              </span>

            </li>
            <li>
              <h3>
                <strong>
                  {statsData.SeatUtilizePer || 0}{" "}
                  <small className="fs-6 text-muted">%</small>
                </strong>
              </h3>
              <span className="subtitle_sm">Seat Utilization</span>
            </li>

            <li>
              <h3>
                <strong>{statsData.guardCount ?? 0}</strong>
              </h3>
              <span className="subtitle_sm">Guards Deployed</span>

              <span
                className={`overline_text d-flex align-items-center ${
                  statsData.gaurddiffstatus === "down"
                    ? "text-danger"
                    : "text-success"
                }`}
              >
                {statsData.gaurddiffstatus === "down" ? (
                  <FiTrendingDown className="me-1" />
                ) : (
                  <FiTrendingUp className="me-1" />
                )}
                {statsData.guarddiffper ?? 0} %
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div className="col-lg-12 col-xl-5 d-flex mt-3 mt-xl-0" style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
        <div className="cardNew w-100  p-0 mb-3">
          <ul className="mb-2 last_stats">
            {/* ---------- OTD ---------- */}
            <li>
              <h3>
                <strong>
                  {isDrop
                    ? "N/A"
                    : isPick
                    ? statsData?.OTD > 0
                      ? statsData.OTD
                      : "N/A"
                    : statsData?.OTD != null
                    ? statsData.OTD
                    : "0"}
                  <small className="fs-6 text-muted">%</small>
                </strong>
              </h3>
              <span
                className={`overline_text d-flex align-items-center ${
                  statsData.OTDDiffStatus === "down"
                    ? "text-danger"
                    : "text-success"
                }`}
              >
                {isDrop ? (
                  "N/A"
                ) : isPick ? (
                  statsData?.OTDDiff > 0 ? (
                    <>
                      {statsData.OTDDiffStatus === "down" ? (
                        <FiTrendingDown className="me-1" />
                      ) : (
                        <FiTrendingUp className="me-1" />
                      )}
                      {statsData.OTDDiff} %
                    </>
                  ) : (
                    "N/A"
                  )
                ) : statsData?.OTDDiff != null ? (
                  <>
                    {statsData.OTDDiffStatus === "down" ? (
                      <FiTrendingDown className="me-1" />
                    ) : (
                      <FiTrendingUp className="me-1" />
                    )}
                    {statsData.OTDDiff} %
                  </>
                ) : (
                  "0 %"
                )}
              </span>
              <span className="subtitle_sm">OTD</span>
            </li>

            {/* ---------- OTA ---------- */}
            <li>
              <h3>
                <strong>
                  {isPick
                    ? "N/A"
                    : isDrop
                    ? statsData?.OTA > 0
                      ? statsData.OTA
                      : "N/A"
                    : statsData?.OTA != null
                    ? statsData.OTA
                    : "0"}
                  <small className="fs-6 text-muted">%</small>
                </strong>
              </h3>
              <span
                className={`overline_text d-flex align-items-center ${
                  statsData.OTADiffStatus === "down"
                    ? "text-danger"
                    : "text-success"
                }`}
              >
                {isPick ? (
                  "N/A"
                ) : isDrop ? (
                  statsData?.OTADiff > 0 ? (
                    <>
                      {statsData.OTADiffStatus === "down" ? (
                        <FiTrendingDown className="me-1" />
                      ) : (
                        <FiTrendingUp className="me-1" />
                      )}
                      {statsData.OTADiff} %
                    </>
                  ) : (
                    "N/A"
                  )
                ) : statsData?.OTADiff != null ? (
                  <>
                    {statsData.OTADiffStatus === "down" ? (
                      <FiTrendingDown className="me-1" />
                    ) : (
                      <FiTrendingUp className="me-1" />
                    )}
                    {statsData.OTADiff} %
                  </>
                ) : (
                  "0 %"
                )}
              </span>
              <span className="subtitle_sm">OTA</span>
            </li>
            <li>
              <h3>
                <strong>{statsData.totalcompleted ?? 0}</strong>
              </h3>
              {/* <span className="overline_text d-flex text-success align-items-center">
                <FiTrendingUp className="me-1" /> 85%
              </span> */}
              <span
                className={`overline_text d-flex align-items-center ${
                  statsData.completedPerDiffStatus === "down"
                    ? "text-danger"
                    : "text-success"
                }`}
              >
                {statsData.completedPerDiffStatus === "down" ? (
                  <FiTrendingDown className="me-1" />
                ) : (
                  <FiTrendingUp className="me-1" />
                )}
                {statsData.completedPerDiff ?? 0} %
              </span>
              <span className="subtitle_sm">Completed</span>
            </li>
          </ul>
        </div>
        <div className="cardNew w-100  p-0">
          <ul className="last_stats">
            <li>
              <h3>
                <strong>{statsData.AvgTripHour || 0}</strong>
              </h3>
              <span className="subtitle_sm text-primary">Avg Trip Time</span>
            </li>

            <li>
              <h3>
                {/* <strong>{statsData.totalAdhocTrip ?? 0}</strong> */}
                <strong>{statsData.SingleEmpTrips || 0}</strong>
              </h3>
              {/* <span className="overline_text d-flex text-success align-items-center">
                <FiTrendingUp className="me-1" /> 85%
              </span> */}
              <span
                className={`overline_text d-flex align-items-center ${
                  statsData.SingleEmpTripPerDiffStatus === "down"
                    ? "text-danger"
                    : "text-success"
                }`}
              >
                {statsData.SingleEmpTripPerDiffStatus === "down" ? (
                  <FiTrendingDown className="me-1" />
                ) : (
                  <FiTrendingUp className="me-1" />
                )}
                {statsData.SingleEmpTripPerDiff ?? 0} %
              </span>
              <span className="subtitle_sm text-warning">
                Single Emp. Trips
              </span>
            </li>
            <li>
              <h3>
                <strong>{statsData.totalnoshow ?? 0}</strong>
              </h3>
              {/* <span className="overline_text d-flex text-success align-items-center">
                <FiTrendingUp className="me-1" /> 85%
              </span> */}
              {/* <span
                className={`overline_text d-flex align-items-center ${
                  statsData.noshowPerDiffStatus === "down"
                    ? "text-danger"
                    : "text-success"
                }`}
              >
                {statsData.noshowPerDiffStatus === "down" ? (
                  <FiTrendingDown className="me-1" />
                ) : (
                  <FiTrendingUp className="me-1" />
                )}
                {statsData.noshowPerDiff ?? 0} %
              </span> */}
              <span className="subtitle_sm text-danger">No Shows</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default React.memo(RiStats);
