import React, { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import Loader from "../../common/Loader";

const chartData = [
  { name: "Excellent", value: 35, color: "#666666" },
  { name: "Good", value: 40, color: "#e6a749" },
  { name: "Poor", value: 25, color: "#84c1e9" },
];

const RADIAN = Math.PI / 180;

const renderNeedle = (value, data, cx, cy, iR, oR, color) => {
  const total = data.reduce((sum, entry) => sum + entry.value, 0);
  const angle = 180.0 * (1 - value / total);
  const length = (iR + 2 * oR) / 3;
  const sin = Math.sin(-RADIAN * angle);
  const cos = Math.cos(-RADIAN * angle);
  const radius = 5;
  const x0 = cx;
  const y0 = cy;
  const xba = x0 + radius * sin;
  const yba = y0 - radius * cos;
  const xbb = x0 - radius * sin;
  const ybb = y0 + radius * cos;
  const xp = x0 + length * cos;
  const yp = y0 + length * sin;

  return [
    <circle key="needle-center" cx={x0} cy={y0} r={radius} fill={color} />,
    <path
      key="needle-pointer"
      d={`M${xba} ${yba}L${xbb} ${ybb} L${xp} ${yp} L${xba} ${yba}`}
      fill={color}
    />,
  ];
};

const TripEfficiency = () => {
  const [loading, setLoading] = useState(false);
  const cx = 150;
  const cy = 150;
  const iR = 50;
  const oR = 100;
  const currentValue = 80;

  return (
    <div className="cardx border-0 p-3">
      <Loader isVisible={loading} fullScreen={false} />
      <h6>Trip Efficiency</h6>
      <hr />

      <div className="text-center">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              dataKey="value"
              startAngle={180}
              endAngle={0}
              data={chartData}
              cx={cx}
              cy={cy}
              innerRadius={iR}
              outerRadius={oR}
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {renderNeedle(currentValue, chartData, cx, cy, iR, oR, "#374151")}
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-3">
          <h4 className="fw-bold text-primary">{currentValue}%</h4>
          <p className="text-muted mb-2">Current Efficiency</p>

          <div className="d-flex justify-content-center gap-3 mt-3">
            {chartData.map((item, index) => (
              <div key={index} className="d-flex align-items-center">
                <div
                  className="me-2"
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: item.color,
                    borderRadius: "50%",
                  }}
                ></div>
                <small className="text-muted">{item.name}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripEfficiency;