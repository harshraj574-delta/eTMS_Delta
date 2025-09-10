
import { useState, useEffect } from "react";
import { apiService } from "../../services/api";


const VpStats = ({ filter }) => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overSpeed, setOverSpeed] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // Route count
        const routeRes = await apiService.get_VProutecount({
          sDate: filter.sDate,
          eDate: filter.eDate,
          locationid: filter?.locationid || 1,
          facilityid: filter?.facilityid || "",
          vendorid: filter?.vendorid || "",
          triptype: filter?.triptype || "",
        });
        let routeData = [];
        if (Array.isArray(routeRes)) {
          routeData = routeRes;
        } else if (typeof routeRes === "string") {
          try {
            routeData = JSON.parse(routeRes);
          } catch {
            routeData = [];
          }
        }
        
        const mainStats = Array.isArray(routeData) && routeData.length > 0 ? routeData[0] : {};

        // Efficiency
        const effPayload = {
          sDate: filter.sDate,
          eDate: filter.eDate,
          locationid: filter?.locationid || 1,
          facilityid: filter?.facilityid || "",
          vendorid: filter?.vendorid || "",
          triptype: filter?.triptype || "",
        };
        const effRes = await apiService.getchart_Efficiency(effPayload);
        let parsed = typeof effRes === "string" ? JSON.parse(effRes) : effRes;
        const effStats = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : (parsed && typeof parsed === "object" ? parsed : {});

        // OverSpeed
        let overSpeedVal = null;
        try {
          const overSpeedRes = await apiService.GetChart_OverSpeedcount({
            sDate: filter.sDate,
            eDate: filter.eDate,
            locationid: filter?.locationid || 1,
            facilityid: filter?.facilityid || "",
            vendorid: filter?.vendorid || "",
            triptype: filter?.triptype || "",
          });
          overSpeedVal = overSpeedRes;
        } catch {
          overSpeedVal = null;
        }

        setStats({ ...mainStats, ...effStats });
        setOverSpeed(overSpeedVal);
      } catch (err) {
        let msg = "API Error";
        if (err) {
          if (typeof err === "string") {
            msg = err;
          } else if (err.message) {
            msg = err.message;
          } else if (typeof err === "object") {
            msg = JSON.stringify(err);
          } else {
            msg = String(err);
          }
        }
        if (err?.response?.data) {
          msg += ": " + JSON.stringify(err.response.data);
        }
        setError(msg);
        setStats({});
        setOverSpeed(null);
      }
      setLoading(false);
    };
    fetchStats();
  }, [filter]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div className="col-12">
      <div className="cardNew w-100 p-2">
        <ul>
          <li>
            <h3>
              <strong>{stats.totalroute || 0}</strong>
            </h3>
            <span className="subtitle_sm">Total Trips</span>
          </li>
          <li>
            <h3>
              <strong>{stats.routeEffPer ?? 0} <small>%</small></strong>
            </h3>
            <span className="subtitle_sm">On Time Performance</span>
          </li>
          <li>
            <h3>
              <strong>{overSpeed?.Overspeedcount ?? 0}</strong>
            </h3>
            <span className="subtitle_sm">Overspeed</span>
          </li>
          <li>
            <h3>
              <strong>{stats.Breakdowncount ?? 0}</strong>
            </h3>
            <span className="subtitle_sm">Breakdown</span>
          </li>
          <li>
            <h3>
              <strong>{stats.DriverRefusalCount ?? 0}</strong>
            </h3>
            <span className="subtitle_sm">Trips Rejected by Drivers</span>
          </li>
          <li>
            <h3>
              <strong>{stats.Breakdowncount ?? 0}</strong>
            </h3>
            <span className="subtitle_sm">Trips Refused by Vendor</span>
          </li>
          <li>
            <h3>
              <strong>{stats.OperationalVehicle ?? 0}</strong>
            </h3>
            <span className="subtitle_sm">Total Vehicle Active</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default VpStats;
