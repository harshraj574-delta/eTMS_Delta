import { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import { Chart } from "primereact/chart";
import { BiExpand, BiCalendar } from "react-icons/bi";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import React from "react";
const RiShiftEmployeeOccupancy = ({ filter }) => {
  const [lineChartData, setLineChartData] = useState({});
  const [lineChartOptions, setLineChartOptions] = useState({});
  const [dialogVisible, setDialogVisible] = useState(false);

  // Format shift time as "HH:mm" (e.g., "0430" -> "04:30")
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const padded = timeStr.padStart(4, "0");
    return `${padded.slice(0, 2)}:${padded.slice(2)}`;
  };

  useEffect(() => {
    const fetchOccupancyData = async () => {
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
        // Handle different response formats
        if (Array.isArray(response)) {
          data = response;
        } else if (Array.isArray(response?.data)) {
          data = response.data;
        } else if (typeof response === "string") {
          try {
            const parsed = JSON.parse(response);
            if (Array.isArray(parsed)) data = parsed;
          } catch (e) {
            console.error("Failed to parse string response:", e);
            return;
          }
        }

        if (!Array.isArray(data) || data.length === 0) {
          console.warn("No data to display");
          return;
        }

        // Sort and map the data using "shiftTime" (API response key)
        const sortedData = data
          .filter((item) => item.shiftTime)
          .sort(
            (a, b) =>
              Number(a.shiftTime.padStart(4, "0")) -
              Number(b.shiftTime.padStart(4, "0"))
          );

        // Prepare chart labels and datasets
        const labels = sortedData.map((item) => formatTime(item.shiftTime));
        const occupancyData = sortedData.map((item) =>
          Number(item.AvgOccupancyPer || 0)
        );
        const employeeData = sortedData.map((item) =>
          Number(item.totalemplyee || item.totalemployee || 0)
        );

        // UI style variables
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue("--text-color");
        const textColorSecondary = documentStyle.getPropertyValue(
          "--text-color-secondary"
        );
        const surfaceBorder =
          documentStyle.getPropertyValue("--surface-border");

        setLineChartData({
          labels, // only actual shift times, formatted as "HH:mm"
          datasets: [
            {
              //label: `Seat Utilization % (${occupancyData.reduce((a, b) => a + b, 0)})`,
              label: `Seat Utilization %`,
              data: occupancyData,
              borderColor: "#63abfd",
              backgroundColor: "#63abfd",
              fill: false,
              tension: 0.4,
              yAxisID: "y",
            },
            {
              // label: `Number Of Employees (${employeeData.reduce((a, b) => a + b, 0)})`,
              label: `Number Of Employees`,
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
      } catch (error) {
        console.error("Error fetching occupancy data:", error);
      }
    };

    if (filter?.sDate && filter?.eDate) {
      fetchOccupancyData();
    }
  }, [filter]);

  return (
    <div className="cardx border-0 p-3">
      <div className="d-flex justify-content-between align-items-center border-0 py-1">
        <h6>Seat Utilization vs Employees Count</h6>
        <span
          id="chart"
          style={{ cursor: "pointer" }}
          onClick={() => setDialogVisible(true)}
        >
          <BiExpand />
        </span>
      </div>
      <hr />
      <Chart
        type="line"
        data={lineChartData}
        options={lineChartOptions}
        className="w-full md:w-30rem"
      />

      <Dialog
        header={"Seat Utilization vs Employees Count"}
        visible={dialogVisible}
        style={{ width: "90vw", minHeight: "90vh" }}
        onHide={() => setDialogVisible(false)}
      >
        <div>
          <Chart
            type="line"
            data={lineChartData}
            options={lineChartOptions}
            className="w-full md:w-30rem"
            style={{ height: "75vh", width: "100%" }}
          />
        </div>
      </Dialog>
      <Tooltip target="#chart" content="Expand Map" position="left" />
    </div>
  );
};

export default React.memo(RiShiftEmployeeOccupancy);
