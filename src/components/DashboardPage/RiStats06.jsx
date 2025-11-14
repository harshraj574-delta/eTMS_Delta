import { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import React from "react";

// Inlined SVGs to replace react-icons/fi
const FiTrendingUp = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

const FiTrendingDown = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
    <polyline points="17 18 23 18 23 12"></polyline>
  </svg>
);

const RiStats = ({ filter }) => {
  const [statsData, setStatsData] = useState({});
  const [cancelData, setCancelData] = useState([]);

  useEffect(() => {
    const fetchRouteCount = async () => {
      try {
        const obj = {
          sDate: filter.sDate,
          eDate: filter.eDate,
          locationid: filter.locationid || "",
          facilityid: filter?.facilityid || "",
          vendorid: filter?.vendorid || "",
          triptype: filter?.triptype || "",
        };
        const res = await apiService.Getchart_RouteCount(obj);
        let data = [];
        if (Array.isArray(res)) data = res;
        else if (typeof res === "string") {
          try {
            data = JSON.parse(res);
          } catch {
            data = [];
          }
        }
        setStatsData(Array.isArray(data) && data.length ? data[0] : {});
      } catch (err) {
        console.error("Route Count Error", err);
        setStatsData({});
      }
    };
    fetchRouteCount();
  }, [filter]);

  useEffect(() => {
    const fetchCancelData = async () => {
      try {
        const credentials = {
          sDate: filter.sDate,
          eDate: filter.eDate,
          locationid: filter.locationid || "",
          facilityid: filter?.facilityid || "",
          vendorid: filter?.vendorid || "",
          triptype: filter?.triptype || "",
        };
        const response = await apiService.getchart_CancelReallocation(
          credentials
        );
        let parsed = typeof response === "string" ? JSON.parse(response) : response;
        setCancelData(Array.isArray(parsed) && parsed.length ? parsed[0] : null);
      } catch (error) {
        console.error("API Error:", error);
        setCancelData(null);
      }
    };
    fetchCancelData();
  }, [filter]);

  const isPick = filter?.triptype?.toLowerCase() === "p";
  const isDrop = filter?.triptype?.toLowerCase() === "d";
  
  const StatCard = ({ 
    title, 
    value, 
    trend, 
    trendStatus, 
    subValue, 
    subValueLabel, 
    badge1, 
    badge2,
    icon,
    color = "primary" 
  }) => (
    <div className="stat-card" data-color={color}>
      <div className="stat-card-header">
        {icon && <div className="stat-card-icon">{icon}</div>}
        <div className="stat-card-title">{title}</div>
      </div>
      
      <div className="stat-card-body">
        <div className="stat-value">{value}</div>
        
        {trend && (
          <div className={`stat-trend stat-trend-${trendStatus}`}>
            {trendStatus === 'down' ? <FiTrendingDown /> : <FiTrendingUp />}
            <span>{trend}%</span>
          </div>
        )}
        
        {subValue && (
          <div className="stat-sub-value">
            {subValueLabel}: <strong>{subValue}</strong>
          </div>
        )}
      </div>
      
      {(badge1 || badge2) && (
        <div className="stat-badges">
          {badge1 && <span className="badge badge-primary">{badge1}</span>}
          {badge2 && <span className="badge badge-danger">{badge2}</span>}
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        .ri-stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          padding: 1.5rem;
          background-color: #f8f9fa;
        }

        .stat-card {
          background: linear-gradient(to right, #ffffff, #fafbfc);
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(229, 231, 235, 0.7);
          position: relative;
          overflow: hidden;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .stat-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(to right, #6366f1, #8b5cf6);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .stat-card[data-color="primary"]::before {
          background: linear-gradient(to right, #6366f1, #8b5cf6);
        }
        
        .stat-card[data-color="success"]::before {
          background: linear-gradient(to right, #10b981, #34d399);
        }
        
        .stat-card[data-color="warning"]::before {
          background: linear-gradient(to right, #f59e0b, #fbbf24);
        }
        
        .stat-card[data-color="danger"]::before {
          background: linear-gradient(to right, #ef4444, #f87171);
        }
        
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        .stat-card:hover::before {
          opacity: 1;
        }

        .stat-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .stat-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .stat-card-title {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .stat-card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 2rem;
          color: #1e293b;
          line-height: 1.2;
          margin-bottom: 0.75rem;
          font-family: "VT323", monospace;
          font-weight: 400;
          font-style: normal;
        }

        .stat-trend {
          display: inline-flex;
          align-items: center;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          width: fit-content;
          margin-bottom: 0.75rem;
        }
        
        .stat-trend svg {
          margin-right: 0.25rem;
          width: 16px;
          height: 16px;
        }
        
        .stat-trend-up {
          background-color: rgba(16, 185, 129, 0.1);
          color: #059669;
        }
        
        .stat-trend-down {
          background-color: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }
        
        .stat-sub-value {
          font-size: 0.875rem;
          color: #475569;
        }

        .stat-badges {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
          flex-wrap: wrap;
        }
        
        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        
        .badge-primary {
          background-color: rgba(99, 102, 241, 0.1);
          color: #4f46e5;
        }
        
        .badge-danger {
          background-color: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }
        
        /* Improved responsiveness for smaller screens */
        @media (max-width: 1200px) {
          .ri-stats-container {
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          }
        }

        @media (max-width: 992px) {
          .ri-stats-container {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
          }
          .stat-card {
            padding: 1.25rem;
          }
        }

        @media (max-width: 768px) {
          .ri-stats-container {
            grid-template-columns: repeat(2, 1fr);
            padding: 1rem;
          }
          .stat-value {
            font-size: 1.5rem;
          }
        }
        
        @media (max-width: 480px) {
          .ri-stats-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="ri-stats-container">
        <StatCard 
            title="Routes"
            value={statsData.totalroute ?? 0}
            trend={statsData.RouteDiffPer ?? 0}
            trendStatus={statsData.routediffStatus}
            subValue={statsData.totalemployee ?? 0}
            subValueLabel="Employees"
            badge1={`${statsData.malecount ?? 0} Male`}
            badge2={`${statsData.femalecount ?? 0} Female`}
            color="primary"
        />
        <StatCard 
            title="Avg. Vehicle Occupancy"
            value={statsData.AvgOccupancy ?? 0}
            trend={statsData.AvgOccupancyDiff ?? 0}
            trendStatus={statsData.AvgOccupancyDiffStatus}
            color="success"
        />
        <StatCard 
            title="Seat Utilization"
            value={`${statsData.SeatUtilizePer || 0}%`}
            color="warning"
        />
        <StatCard 
            title="Guards Deployed"
            value={statsData.guardCount ?? 0}
            trend={statsData.guarddiffper ?? 0}
            trendStatus={statsData.gaurddiffstatus}
            color="primary"
        />
        <StatCard
            title="OTD"
            value={
                isDrop ? "N/A" : 
                isPick ? (statsData?.OTD > 0 ? `${statsData.OTD}%` : "N/A") :
                (statsData?.OTD != null ? `${statsData.OTD}%` : "0%")
            }
            trend={statsData.OTDDiff}
            trendStatus={statsData.OTDDiffStatus}
            color="success"
        />
        <StatCard
            title="OTA"
            value={
                isPick ? "N/A" :
                isDrop ? (statsData?.OTA > 0 ? `${statsData.OTA}%` : "N/A") :
                (statsData?.OTA != null ? `${statsData.OTA}%` : "0%")
            }
            trend={statsData.OTADiff}
            trendStatus={statsData.OTADiffStatus}
            color="success"
        />
        <StatCard 
            title="Completed"
            value={statsData.totalcompleted ?? 0}
            trend={statsData.completedPerDiff ?? 0}
            trendStatus={statsData.completedPerDiffStatus}
            color="primary"
        />
         <StatCard 
            title="Avg Trip Time"
            value={`${statsData.AvgTripHour || 0} hrs`}
            color="warning"
        />
        <StatCard 
            title="Single Emp. Trips"
            value={statsData.SingleEmpTrips || 0}
            trend={statsData.SingleEmpTripPerDiff ?? 0}
            trendStatus={statsData.SingleEmpTripPerDiffStatus}
            color="danger"
        />
        <StatCard 
            title="No Shows"
            value={statsData.totalnoshow ?? 0}
            color="danger"
        />
      </div>
    </>
  );
};

export default React.memo(RiStats);

