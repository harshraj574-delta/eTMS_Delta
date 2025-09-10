import { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import { Chart } from "primereact/chart";
import { BiExpand, BiCalendar } from "react-icons/bi";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";

const RiPickDrop = ({ filter }) => {
  const [barChartData, setBarChartData] = useState({});
  const [barChartOptions, setBarChartOptions] = useState({});
  const [dialogVisible, setDialogVisible] = useState(false);

  useEffect(() => {
    const fetchAndPrepareChart = async () => {
      try {
        const params = {
          sDate: filter.sDate,
          eDate: filter.eDate,
          locationid: filter.locationid || "",
          facilityid: filter.facilityid || "",
          vendorid: filter.vendorid || "",
          triptype: filter.triptype || "",
        };
        // console.log("RiPickDrop API params:", params);
        const res = await apiService.GetPickDropcount_shiftwise(params);
        //const data = JSON.parse(res) || [];

        // Utility to format shift time
        // const formatShiftTime = (shiftTime) => {
        //   if (!shiftTime) return "";
        //   const hour = parseInt(shiftTime.slice(0, 2), 10);
        //   const minute = shiftTime.slice(2);
        //   const ampm = hour >= 12 ? "PM" : "AM";
        //   const hour12 = hour % 12 === 0 ? 12 : hour % 12;
        //   return minute === "00"
        //     ? `${hour12}${ampm}`
        //     : `${hour12}:${minute}${ampm}`;
        // };

        const data = JSON.parse(res) || [];

        const formatShiftTime = (shiftTime) => {
          if (!shiftTime) return "";
          const hour = shiftTime.slice(0, 2);
          const minute = shiftTime.slice(2);
          return `${hour}:${minute}`;
        };

        const labels = data.map((entry) => formatShiftTime(entry.shiftTime));

        //const labels = data.map((entry) => formatShiftTime(entry.shiftTime));
        const pickupCounts = data.map((entry) => entry.totalpickup || 0);
        const dropCounts = data.map((entry) => entry.totaldrop || 0);

        // Chart style variables
        const documentStyle = getComputedStyle(document.documentElement);
        const textColorSecondary = documentStyle.getPropertyValue(
          "--text-color-secondary"
        );
        const surfaceBorder =
          documentStyle.getPropertyValue("--surface-border");

        setBarChartData({
          labels,
          datasets: [
            {
              type: "bar",
              label: "Pick Trips",
              backgroundColor: "#3377ff",
              data: pickupCounts,
              barPercentage: 0.6,
              categoryPercentage: 0.6,
            },
            {
              type: "bar",
              label: "Drop Trips",
              backgroundColor: "#ea7878",
              data: dropCounts,
              barPercentage: 0.6,
              categoryPercentage: 0.6,
            },
          ],
        });

        // Calculate totals for legend
        const totalPick = pickupCounts.reduce((a, b) => a + b, 0);
        const totalDrop = dropCounts.reduce((a, b) => a + b, 0);

        setBarChartOptions({
          maintainAspectRatio: false,
          aspectRatio: 0.8,
          plugins: {
            tooltip: { mode: "index", intersect: false },
            legend: {
              labels: {
                color: "#000",
                usePointStyle: true,
                pointStyle: "circle",
                padding: 30,
                fontSize: "24px",
                boxWidth: 20,
                // Show total count in legend
                generateLabels: (chart) => {
                  const datasets = chart.data.datasets;
                  return datasets.map((ds, i) => {
                    let total = i === 0 ? totalPick : totalDrop;
                    return {
                      text: `${ds.label} (${total})`,
                      fillStyle: ds.backgroundColor,
                      strokeStyle: ds.backgroundColor,
                      lineWidth: 1,
                      hidden: !chart.isDatasetVisible(i),
                      index: i,
                    };
                  });
                },
              },
              position: "bottom",
            },
          },
          scales: {
            x: {
              stacked: true,
              ticks: { color: textColorSecondary },
              grid: { color: surfaceBorder },
            },
            y: {
              stacked: true,
              ticks: { color: textColorSecondary, reverse: true },
              grid: { color: surfaceBorder },
            },
          },
        });
      } catch {
        setBarChartData({});
      }
    };
    fetchAndPrepareChart();
  }, [filter]);

  return (
    <div className="cardx border-0 p-3">
      <div className="d-flex align-items-center justify-content-between">
        <h6>Pick/Drop Trips</h6>
        <span
          id="pickDrop"
          style={{ cursor: "pointer" }}
          onClick={() => setDialogVisible(true)}
        >
          <BiExpand />
        </span>
      </div>
      <hr />
      <Chart
        type="bar"
        data={barChartData}
        options={barChartOptions}
        className="w-full md:w-30rem"
      />

      <Dialog
        header={"Pick/Drop Trips"}
        visible={dialogVisible}
        style={{ width: "90vw", minHeight: "90vh" }}
        onHide={() => setDialogVisible(false)}
      >
        <div
          className="m-0 bg-light"
          style={{ height: "710px", width: "100%", position: "relative" }}
        >
          <Chart
            type="bar"
            data={barChartData}
            options={barChartOptions}
            className="w-full md:w-30rem"
          />
        </div>
      </Dialog>
      <Tooltip target="#pickDrop" content="Expand Map" position="left" />
    </div>
  );
};

export default RiPickDrop;
