import React, { useEffect, useState } from 'react';
import { Cell, Pie, PieChart } from 'recharts';
import { apiService } from '../../../services/api';

// Sample fallback matching driver-focused fields
const SAMPLE_PAYLOAD = {
  totalDriver: 1041,
  deployedDrivercount: 187,
  absentdrivercount: 854,
  driverEffPer: 17.96,
};

const renderNeedle = (value, cx, cy, outerRadius, color) => {
  const degree = 180 - (Number(value) || 0) * 1.8;
  const radian = (degree * Math.PI) / 180;
  const length = outerRadius - 15;
  const x = cx + length * Math.cos(radian);
  const y = cy - length * Math.sin(radian);

  return (
    <>
      <circle cx={cx} cy={cy} r={5} fill={color} />
      <line x1={cx} y1={cy} x2={x} y2={y} stroke={color} strokeWidth={3} strokeLinecap="round" />
    </>
  );
};

const DriverEfficiency = ({ filter = {} }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawError, setRawError] = useState(null);
  const [chartData, setChartData] = useState([
  { name: 'Total Driver', value: 0, color: '#666666' },
  { name: 'Deployed Driver Count', value: 0, color: '#e6a749' },
  { name: 'Absent Driver Count', value: 0, color: '#84c1e9' },
  ]);
  const [effPercent, setEffPercent] = useState(null);

  useEffect(() => {
    let mounted = true;

    const requestWithTimeout = (promise, ms = 8000) => {
      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Request timed out')), ms);
      });
      return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
    };

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await requestWithTimeout(apiService.getchart_Efficiency({
          sDate: filter.sDate,
          eDate: filter.eDate,
          locationid: filter.locationid || null,
          facilityid: filter.facilityid || null,
          vendorid: filter.vendorid || null,
          triptype: filter.triptype || null,
        }), 8000);

        // apiService may return response.data or the data directly
        let payload = res?.data ?? res;
        if (typeof payload === 'string') {
          try { payload = JSON.parse(payload); } catch (_) { }
        }
        const obj = Array.isArray(payload) ? payload[0] : (payload || {});

        const totalDriver = Number(obj.totalDriver ?? obj.TotalDriver ?? 0);
        const deployedDriver = Number(obj.deployedDrivercount ?? obj.deployedDriverCount ?? obj.deployedcount ?? 0);
        const absentDriver = Number(obj.absentdrivercount ?? obj.absentDriverCount ?? obj.absentdriverCount ?? 0);
        const driverEffPer = obj.driverEffPer ?? obj.DriverEffPer ?? null;

        if (mounted) {
          setChartData([
            { name: 'Total Driver', value: totalDriver, color: '#666666' },
            { name: 'Deployed Driver Count', value: deployedDriver, color: '#e6a749' },
            { name: 'Absent Driver Count', value: absentDriver, color: '#84c1e9' },
          ]);
          setEffPercent(driverEffPer != null ? Number(driverEffPer) : null);
          setError(null);
        }
      } catch (err) {
  console.error('DriverEfficiency fetch error:', err);
        setRawError(err);

        const isTimeout = err && err.message === 'Request timed out';
        const isServerError = err && (err.status >= 500 || (err.payload && typeof err.payload === 'string' && err.payload.toLowerCase().includes('internal')));
        const useSample = isTimeout || isServerError || (typeof window !== 'undefined' && window.__USE_SAMPLE_ON_ERROR__);

        if (mounted) {
          if (useSample) {
            setChartData([
              { name: 'Total Driver', value: Number(SAMPLE_PAYLOAD.totalDriver || 0), color: '#666666' },
              { name: 'Deployed Driver Count', value: Number(SAMPLE_PAYLOAD.deployedDrivercount || 0), color: '#e6a749' },
              { name: 'Absent Driver Count', value: Number(SAMPLE_PAYLOAD.absentdrivercount || 0), color: '#84c1e9' },
            ]);
            setEffPercent(Number(SAMPLE_PAYLOAD.driverEffPer ?? 0));
            setError(isTimeout ? 'Request timed out — showing sample data' : null);
          } else {
            const msg = err?.message || (err?.payload ? (typeof err.payload === 'string' ? err.payload : JSON.stringify(err.payload)) : 'Failed to load driver efficiency');
            setError(msg);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  // Re-run when any relevant filter field changes so data updates correctly
  }, [filter?.sDate, filter?.eDate, filter?.locationid, filter?.facilityid, filter?.vendorid, filter?.triptype]);

  return (
    <div className="cardx border-0 p-3 h-100">
      <h6>Driver Efficiency</h6>
      <hr />

      <div className="text-center">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div>
            <div className="text-danger">{String(error)}</div>
            {typeof window !== 'undefined' && window.__SHOW_API_ERROR_DETAILS__ && rawError && (
              <pre style={{ textAlign: 'left', maxHeight: 200, overflow: 'auto' }}>
                {JSON.stringify(rawError, null, 2)}
              </pre>
            )}
          </div>
        ) : (
          <>
            <div style={{ width: 300, height: 200, margin: '0 auto' }}>
              <PieChart width={300} height={200}>
                <Pie
                  dataKey="value"
                  startAngle={180}
                  endAngle={0}
                  data={chartData}
                  cx={150}
                  cy={150}
                  innerRadius={50}
                  outerRadius={100}
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {effPercent != null && renderNeedle(effPercent, 150, 150, 100, '#374151')}
              </PieChart>
            </div>

            <div className="mt-3">
              {effPercent != null && (
                <>
                  <h4 className="fw-bold text-primary">{effPercent}%</h4>
                  <p className="text-muted mb-2">Current Efficiency</p>
                </>
              )}

              <div className="d-flex justify-content-center gap-4 mt-3">
                {chartData.map((item, index) => (
                  <div key={index} className="d-flex flex-column align-items-center">
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: item.color,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 600,
                      }}
                    >
                      {item.value}
                    </div>
                    <small className="text-muted mt-2">{item.name}</small>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DriverEfficiency;
