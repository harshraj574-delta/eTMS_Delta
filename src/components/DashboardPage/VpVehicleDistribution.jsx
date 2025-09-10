
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip, Legend } from "recharts";
import { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import { filter } from "lodash";


const VpVehicleDistribution = ({filter}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          sDate: filter.sDate, // selectedPeriod
          eDate: filter.eDate, // selectedPeriod
          locationid: filter.locationid || "", // selCity
          facilityid: filter?.facilityid || "", // selFacility
          vendorid: filter?.vendorid || "", // selVendor
          triptype: filter?.triptype || "", // selectedTripType
        };
        const result = await apiService.getchart_vehDist(params);
        console.log("Vehicle Distribution Data (raw API):", result);
        const colorMap = [
          '#3182bd', '#e6550d', '#31a354', '#6baed6', '#fd8d3c', '#fdae6b', '#74c476', '#a1d99b', '#FFD700', '#FFA500'
        ];
        let arr = result;
        if (typeof arr === 'string') {
          try {
            arr = JSON.parse(arr);
            console.log('Parsed string result to array:', arr);
          } catch (e) {
            console.error('Failed to parse result string:', e);
            arr = [];
          }
        }
        // Outer ring: Vehicle Types
        const vehicleTypeMap = {};
        (Array.isArray(arr) ? arr : []).forEach(item => {
          const vt = item.Vehicletype;
          const val = Number(item.totalvehicle);
          if (!vehicleTypeMap[vt]) vehicleTypeMap[vt] = 0;
          vehicleTypeMap[vt] += isNaN(val) ? 0 : val;
        });
        const vehicleTypeData = Object.entries(vehicleTypeMap).map(([name, value], idx) => ({
          name,
          value,
          color: colorMap[idx % colorMap.length],
        }));

        // Inner ring: Billing Types
        const billingTypeMap = {};
        (Array.isArray(arr) ? arr : []).forEach(item => {
          const bt = item.BillingType;
          const val = Number(item.totalvehicle);
          if (!billingTypeMap[bt]) billingTypeMap[bt] = 0;
          billingTypeMap[bt] += isNaN(val) ? 0 : val;
        });
        const billingTypeData = Object.entries(billingTypeMap).map(([name, value], idx) => ({
          name,
          value,
          color: colorMap[(idx + 3) % colorMap.length],
        }));

        setData({ vehicleTypeData, billingTypeData });
      } catch (err) {
        setError(err?.message || 'Error fetching data');
      }
      setLoading(false);
    };
    fetchData();
  }, [filter]);


  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  console.log('Chart Data for PieChart:', {
    vehicleTypeData: data?.vehicleTypeData,
    billingTypeData: data?.billingTypeData
  });
  if (!data || !data.vehicleTypeData || !data.billingTypeData || data.vehicleTypeData.length === 0 || data.billingTypeData.length === 0) return <>
    <div>No data available for chart.</div>
    <pre style={{textAlign:'left',fontSize:12,background:'#f8f8f8',padding:8,border:'1px solid #eee',margin:'10px auto',maxWidth:600}}>
      {JSON.stringify(data, null, 2)}
    </pre>
  </>;

  return (
    <div className="cardx border-0 p-3">
      <h6>Vehicle Distribution</h6>
      <hr />
      <style>{`
        .recharts-legend-wrapper {
          font-size: 11px !important;
          font-weight: 500 !important;
          padding-top: 10px !important;
        }
        .recharts-legend-item-text {
          font-size: 11px !important;
          color: #333 !important;
        }
      `}</style>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          {/* Outer ring: Vehicle Types */}
          <Pie
            data={data.vehicleTypeData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={50}
            startAngle={90}
            endAngle={450}
            label
          >
            {data.vehicleTypeData.map((entry, index) => (
              <Cell key={`cell-outer-${index}`} fill={entry.color || '#3182bd'} />
            ))}
          </Pie>
          {/* Inner ring: Billing Types */}
          <Pie
            data={data.billingTypeData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={45}
            innerRadius={20}
            startAngle={90}
            endAngle={450}
            label={false}
          >
            {data.billingTypeData.map((entry, index) => (
              <Cell key={`cell-inner-${index}`} fill={entry.color || '#e6550d'} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              // Only show the hovered segment's info
              const p = payload[0];
              return (
                <div style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 3, padding: 8, fontSize: 12 }}>
                  <span style={{ fontWeight: 600 }}>{p.name || p.payload.name}</span>
                  <br />
                  <span>{p.value}</span>
                </div>
              );
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            payload={
              (data.billingTypeData || []).map((entry, idx) => ({
                value: `${entry.name} (${entry.value})`,
                type: 'circle',
                color: entry.color,
                id: `legend-billing-${idx}`
              }))
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VpVehicleDistribution;
