import { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import { Chart } from "primereact/chart";
import { BiExpand, BiCalendar } from "react-icons/bi";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import React from "react";
const RiNormalAdhoc = ({ filter }) => {
  const [barChartData, setBarChartData] = useState({});
  const [barChartOptions, setBarChartOptions] = useState({});
  const [dialogVisible, setDialogVisible] = useState(false);

  useEffect(() => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue("--text-color").trim();
    const textColorSecondary = documentStyle
      .getPropertyValue("--text-color-secondary")
      .trim();
    const surfaceBorder = documentStyle
      .getPropertyValue("--surface-border")
      .trim();

    const fetchNormalAdhoc = async () => {
      try {
        const params = {
          sDate: filter.sDate,
          eDate: filter.eDate,
          locationid: filter.locationid || "",
          facilityid: filter.facilityid || "",
          vendorid: filter.vendorid || "",
          triptype: filter.triptype || "",
        };

        const res = await apiService.GetNormalAdhoc_shiftwise(params);
        const responseData = JSON.parse(res) || [];

        if (!responseData.length) {
          setBarChartData({});
          return;
        }

        // Convert shiftTime to HH:mm (24-hour) format
        const convertShiftTimeToLabel = (shiftTime) => {
          const hour = shiftTime.slice(0, 2);
          const minute = shiftTime.slice(2);
          return `${hour}:${minute}`;
        };

        const labels = responseData.map((item) =>
          convertShiftTimeToLabel(item.shiftTime)
        );
        const normalTrips = responseData.map((item) => item.NornalTripCount); // fix typo remains in response data property?
        const adhocTrips = responseData.map((item) => item.AdhocTripcount);

        setBarChartData({
          labels,
          datasets: [
            {
              type: "bar",
              label: `Normal Trips (${normalTrips.reduce((a, b) => a + b, 0)})`,
              backgroundColor: "#5c92ff",
              data: normalTrips,
              barPercentage: 0.6,
              categoryPercentage: 0.6,
            },
            {
              type: "bar",
              label: `Adhoc Trips (${adhocTrips.reduce((a, b) => a + b, 0)})`,
              backgroundColor: "#e3a008",
              data: adhocTrips,
              barPercentage: 0.6,
              categoryPercentage: 0.6,
            },
          ],
        });

        setBarChartOptions({
          maintainAspectRatio: false,
          aspectRatio: 0.58,
          plugins: {
            tooltip: {
              mode: "index",
              intersect: false,
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || "";
                  const value = context.parsed.y ?? context.parsed;
                  return `${label}: ${value}`;
                },
              },
            },
            legend: {
              labels: {
                color: textColor,
                usePointStyle: true,
                pointStyle: "circle",
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
      } catch (error) {
        console.error("Error fetching Normal vs Adhoc chart data:", error);
        setBarChartData({});
      }
    };

    if (filter?.sDate && filter?.eDate) {
      fetchNormalAdhoc();
    }
  }, [filter]);

  return (
    <div className="cardx border-0 p-3 h-100">
      <div className="d-flex justify-content-between align-items-center">
      <h6>Normal vs Adhoc Trips</h6>
      <span
        id="adhoc"
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
        style={{ height: "50vh", width: "100%" }}
      />

      <Dialog
        header={"Normal vs Adhoc Trips"}
        visible={dialogVisible}
        style={{ width: "90vw", minHeight: "90vh" }}
        onHide={() => setDialogVisible(false)}
      >
        <div
          className=""
          //style={{ height: "710px", width: "100%", position: "relative" }}
        >
          <Chart
        type="bar"
        data={barChartData}
        options={barChartOptions}
        className="w-full md:w-30rem"
        style={{ height: "75vh", width: "100%" }}
      />
        </div>
      </Dialog>
      <Tooltip target="#adhoc" content="Expand Map" position="left" />

    </div>
  );
};

export default React.memo(RiNormalAdhoc);
