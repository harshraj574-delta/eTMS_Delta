import React, { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { apiService } from '../../../services/api';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload || {};
  const isPercent = p.skill && p.skill.includes('%');
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.12)', padding: 8, borderRadius: 4, minWidth: 160 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{p.skill}</div>
      <div style={{ fontSize: 13 }}>{isPercent ? `${payload[0].value}%` : `${payload[0].value} count`}</div>
    </div>
  );
};

const DriverFragmentation = ({ filter = {} }) => {
  const [driverData, setDriverData] = useState([]);
 const { sDate = '', eDate = '', locationid = '', facilityid = '', vendorid = '', triptype = '' } = filter;
  useEffect(() => {
    let mounted = true;

    const requestWithTimeout = (promise, ms = 8000) => {
      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Request timed out')), ms);
      });
      return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
    };

    const fetchData = async () => {
      try {
        const res = await requestWithTimeout(apiService.getchart_Efficiency({
          sDate: filter.sDate,
          eDate: filter.eDate,
          locationid: filter.locationid || null,
          facilityid: filter.facilityid || null,
          vendorid: filter.vendorid || null,
          triptype: filter.triptype || null,
        }));

        // apiService may return data directly or wrapped inside { data }
        let payload = res?.data ?? res;
        if (typeof payload === 'string') {
          try { payload = JSON.parse(payload); } catch (e) { /* ignore */ }
        }

        const obj = Array.isArray(payload) ? payload[0] : (payload || {});

        // tolerant field extraction with fallbacks
        const d = obj || {};
        const formattedData = [
          { skill: 'On-time Count', current: Number(d.ontimecount ?? d.OnTimeCount ?? d.onTimeCount ?? 0) },
          { skill: 'BGC Done', current: Number(d.BGCDone ?? d.BGCDoneCount ?? d.bgcdone ?? 0) },
          { skill: 'Driver Refusal Count', current: Number(d.DriverRefusalCount ?? d.DriverRefusal ?? d.driverRefusalCount ?? 0) },
          { skill: 'Drivers 50+ (%)', current: Number(d.DriverfifthyAbovePer ?? d.DriverFiftyAbovePer ?? d.Driver50AbovePer ?? 0) },
          { skill: 'Duty Hour >12 Count', current: Number(d.dutyhourAboveTwelvecount ?? d.DutyHourAbove12Count ?? d.dutyHourAbove12Count ?? 0) },
        ];

        if (mounted) setDriverData(formattedData);
      } catch (err) {
        console.error('API Error:', err);
        // ensure component doesn't stay in a perpetual loading state
        if (mounted) setDriverData([]);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [sDate, eDate, locationid, facilityid, vendorid, triptype]);

  if (!driverData.length) return <div className="p-3">Loading...</div>;

  // domain max calculate karo (percent ke liye kam se kam 100 rakho)
  const maxVal = Math.max(100, ...driverData.map(d => (typeof d.current === 'number' ? d.current : 0)));

  return (
    <div className="cardx border-0 p-3">
      <h6>Driver Fragmentation</h6>
      <hr />
      <div style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={driverData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <PolarGrid gridType="polygon" />
            <PolarAngleAxis
              dataKey="skill"
              tick={{ fontSize: 11, fill: '#666', textAnchor: 'middle' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, maxVal]}
              tick={{ fontSize: 10, fill: '#999' }}
              tickFormatter={(value) => `${value}`}
            />
            <Radar
              name="Driver Metrics"
              dataKey="current"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom label counts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
        {driverData.map((d, i) => {
          const isPercent = d.skill && d.skill.includes('%');
          return (
            <div key={i} style={{ flex: '1 1 18%', minWidth: 110, textAlign: 'center', padding: '6px 8px', borderRadius: 6, background: '#fafafa', border: '1px solid rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 4, whiteSpace: 'pre-wrap' }}>{d.skill}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#222' }}>{isPercent ? `${d.current}%` : d.current}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DriverFragmentation;
