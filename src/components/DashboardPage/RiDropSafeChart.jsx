import { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import { Chart } from "primereact/chart";
import { BiExpand, BiCalendar } from "react-icons/bi";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import { data } from "react-router-dom";
import React from "react";
const RiDropSafeChart = ({ filter }) => {
  const [chartData, setChartData] = useState(null);
  const [chartOptions, setChartOptions] = useState({});
  const [dialogVisible, setDialogVisible] = useState(false);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const obj = {
          sDate: filter.sDate,
          eDate: filter.eDate,
          locationid: filter.locationid || "",
          facilityid: filter?.facilityid || "",
          vendorid: filter?.vendorid || "",
          triptype: filter?.triptype || "",
        };

        const res = await apiService.GetDropSafe_shiftwise(obj);
        const apiData = typeof res === "string" ? JSON.parse(res) : res || [];

        if (!apiData || apiData.length === 0) {
          setChartData(null);
          return;
        }

        // Extract numbers safely
        const femalecount = Number(apiData[0].femalecount) || 0;
        const dsycount = Number(apiData[0].dsycount) || 0;

        // Prepare chart data with two separate datasets (bars side by side)
        setChartData({
          labels: [""], // No label on x-axis
          datasets: [
            {
              label: `Total Women Employees (${femalecount})`,
              data: [femalecount],
              backgroundColor: "#007bff",
              borderColor: "#007bff",
              barPercentage: 0.6,
              categoryPercentage: 0.6,
            },
            {
              label: `DSY Count (${dsycount})`,
              data: [dsycount],
              backgroundColor: "#dc3545",
              borderColor: "#dc3545",
              barPercentage: 0.6,
              categoryPercentage: 0.6,
            },
          ],
        });

        setChartOptions({
          maintainAspectRatio: false,
          aspectRatio: 0.8,
          plugins: {
            tooltip: {
              mode: "nearest",
              intersect: true,
              callbacks: {
                label: function (context) {
                  return (
                    context.dataset.label +
                    ": " +
                    context.parsed.y.toLocaleString()
                  );
                },
              },
            },
            legend: {
              labels: {
                color: "#000",
                usePointStyle: true,
                pointStyle: "circle",
                padding: 20,
                font: { size: 14 },
                boxWidth: 15,
              },
              position: "bottom",
            },
          },
          scales: {
            x: {
              ticks: {
                color: "#495057",
                font: { weight: 500 },
                display: false, // Hide x-axis label
              },
              grid: {
                display: false,
                drawBorder: false,
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: "#6c757d",
                callback: (value) => value.toLocaleString(),
              },
              grid: {
                color: "#e9ecef",
                drawBorder: false,
              },
            },
          },
        });
      } catch (err) {
        console.error("Drop Safe Chart Error:", err);
        setChartData(null);
      }
    };

    if (
      filter &&
      filter.sDate &&
      filter.eDate &&
      filter.locationid !== undefined &&
      filter.locationid !== null
    ) {
      fetchChartData();
    } else {
      setChartData(null);
    }
  }, [filter]);

  return (
    <div className="cardx border-0 p-3 h-100">
      <div className="d-flex justify-content-between align-items-center">
        <h6>Women Employee & DSY Overview</h6>
        <span
          id="dsy"
          style={{ cursor: "pointer" }}
          onClick={() => setDialogVisible(true)}
        >
          <BiExpand />
        </span>
      </div>
      <hr />
      {chartData && chartData.datasets && chartData.datasets.length > 0 ? (
        <Chart type="bar" data={chartData} options={chartOptions} style={{ height: "50vh", width: "100%" }} />
      ) : (
        <div className="text-center text-muted py-5">
          <p style={{ fontSize: "16px", marginBottom: "8px" }}>
            No records found
          </p>
          <p style={{ fontSize: "14px", color: "#999" }}>
            Try adjusting your filters to see data
          </p>
        </div>
      )}

      <Dialog
        header={"Women Employee & DSY Overview"}
        visible={dialogVisible}
        style={{ width: "90vw", minHeight: "90vh" }}
        onHide={() => setDialogVisible(false)}
      >
        <div
          className=""
          //style={{ height: "710px", width: "100%", position: "relative" }}
        >
          <Chart type="bar" data={chartData} options={chartOptions} style={{ height: "75vh", width: "100%" }} />
        </div>
      </Dialog>
      <Tooltip target="#dsy" content="Expand Map" position="left" />

    </div>
  );
};

export default React.memo(RiDropSafeChart);
