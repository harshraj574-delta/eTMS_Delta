import { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import { Chart } from "primereact/chart";
import { BiExpand } from "react-icons/bi";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import Loader from "../common/Loader";
import React from "react";

const RiShiftEmployeeOccupancy = ({ filter }) => {
  const [lineChartData, setLineChartData] = useState({});
  const [lineChartOptions, setLineChartOptions] = useState({});
  const [dialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const padded = timeStr.padStart(4, "0");
    return `${padded.slice(0, 2)}:${padded.slice(2)}`;
  };

  useEffect(() => {
    const fetchOccupancyData = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = {
          sDate: filter.sDate,
          eDate: filter.eDate,
          locationid: filter.locationid || "",
          facilityid: filter.facilityid,
          vendorid: filter.vendorid || "",
          triptype: filter.triptype || "",
        };

        const response = await apiService.GetEmpOccupancy(params);

        let data = [];
        if (Array.isArray(response)) data = response;
        else if (Array.isArray(response?.data)) data = response.data;
        else if (typeof response === "string") {
          try {
            const parsed = JSON.parse(response);
            if (Array.isArray(parsed)) data = parsed;
          } catch {
            throw new Error("Invalid JSON response");
          }
        }
        if (!Array.isArray(data) || data.length === 0)
          throw new Error("No data available");

        const sortedData = data
          .filter((item) => item.shiftTime)
          .sort(
            (a, b) =>
              Number(a.shiftTime.padStart(4, "0")) -
              Number(b.shiftTime.padStart(4, "0"))
          );

        const labels = sortedData.map((item) => formatTime(item.shiftTime));
        const occupancyData = sortedData.map((item) =>
          Number(item.AvgOccupancyPer || 0)
        );
        const employeeData = sortedData.map((item) =>
          Number(item.totalemplyee || item.totalemployee || 0)
        );

        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue("--text-color");
        const textColorSecondary =
          documentStyle.getPropertyValue("--text-color-secondary");
        const surfaceBorder =
          documentStyle.getPropertyValue("--surface-border");

        setLineChartData({
          labels,
          datasets: [
            {
              label: `Seat Utilization % (${occupancyData.reduce(
                (a, b) => a + b,
                0
              )})`,
              data: occupancyData,
              borderColor: "#63abfd",
              backgroundColor: "#63abfd",
              fill: false,
              tension: 0.4,
              yAxisID: "y",
            },
            {
              label: `Number Of Employees (${employeeData.reduce(
                (a, b) => a + b,
                0
              )})`,
              data: employeeData,
              borderColor: "#e697ff",
              backgroundColor: "#e697ff",
              fill: false,
              tension: 0.4,
              yAxisID: "y1",
            },
          ],
        });

        setLineChartOptions({
          responsive: true,
          maintainAspectRatio: false,
          aspectRatio: 0.6,
          layout: { padding: { top: 6, right: 6, bottom: 6, left: 6 } },
          stacked: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: textColor,
                usePointStyle: true,
                pointStyle: "circle",
              },
            },
          },
          scales: {
            x: {
              type: "category",
              title: {
                display: true,
                text: "Shift Time (24-hour)",
                color: textColorSecondary,
              },
              ticks: { autoskip: false, color: textColorSecondary },
              grid: { color: surfaceBorder },
            },
            y: {
              beginAtZero: true,
              suggestedMax: Math.max(
                20,
                Math.ceil(Math.max(...occupancyData) / 10) * 10
              ),
              title: {
                display: true,
                text: "Seat Utilization %",
                color: textColorSecondary,
              },
              ticks: { color: textColorSecondary },
              grid: { color: surfaceBorder },
              position: "left",
            },
            y1: {
              beginAtZero: true,
              suggestedMax: Math.max(
                700,
                Math.ceil(Math.max(...employeeData) / 100) * 100
              ),
              title: {
                display: true,
                text: "Number Of Employees",
                color: textColorSecondary,
              },
              ticks: { color: textColorSecondary },
              grid: { color: surfaceBorder },
              position: "right",
            },
          },
        });

        setRetryCount(0);
        setError(null);
      } catch (error) {
        console.error("Error fetching occupancy data:", error);
        setError(error?.message || "Failed to load chart data");

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying Occupancy... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          setLineChartData({});
        }
      } finally {
        setLoading(false);
      }
    };

    if (filter?.sDate && filter?.eDate) {
      fetchOccupancyData();
    }
  }, [filter, retryCount]);

  if (error && retryCount >= maxRetries) {
    return (
      <div className="cardx border-0 p-3 h-100 d-flex flex-column">
        <h6>Seat Utilization vs Employees Count</h6>
        <hr />
        <div
          style={{
            padding: "2rem",
            background: "#fff3cd",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #ffc107",
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <p style={{ color: "#856404", marginBottom: "1rem" }}>
            ⚠️ Failed to load chart data
          </p>
          <button
            onClick={() => setRetryCount(0)}
            style={{
              padding: "0.5rem 1rem",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cardx border-0 p-3 h-100 d-flex flex-column">
      <Loader isVisible={loading} fullScreen={false} />
      <div className="cardx-header">
        <h6 className="mb-0">Seat Utilization vs Employees Count</h6>
        <span
          id="chart"
          className="icon-btn"
          onClick={() => setDialogVisible(true)}
        >
          <BiExpand />
        </span>
      </div>
      <div className="chart-container flex-grow-1">
        {!loading && (
          <Chart
            type="line"
            data={lineChartData}
            options={lineChartOptions}
            style={{ height: "100%", width: "100%" }}
          />
        )}
      </div>

      <Dialog
        header={"Seat Utilization vs Employees Count"}
        visible={dialogVisible}
        style={{ width: "90vw", minHeight: "90vh" }}
        onHide={() => setDialogVisible(false)}
      >
        <Chart
          type="line"
          data={lineChartData}
          options={lineChartOptions}
          style={{ height: "75vh", width: "100%" }}
        />
      </Dialog>
      <Tooltip target="#chart" content="Expand" position="left" />
    </div>
  );
};

export default React.memo(RiShiftEmployeeOccupancy);