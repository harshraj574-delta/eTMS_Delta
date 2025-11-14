import { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import { Chart } from "primereact/chart";
import { BiExpand } from "react-icons/bi";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import Loader from "../common/Loader";
import React from "react";

const RiPickDrop = ({ filter }) => {
  const [barChartData, setBarChartData] = useState({});
  const [barChartOptions, setBarChartOptions] = useState({});
  const [dialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    const fetchAndPrepareChart = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = {
          sDate: filter.sDate,
          eDate: filter.eDate,
          locationid: filter.locationid || "",
          facilityid: filter.facilityid || "",
          vendorid: filter.vendorid || "",
          triptype: filter.triptype || "",
        };

        const res = await apiService.GetPickDropcount_shiftwise(params);
        const data = JSON.parse(res) || [];

        const formatShiftTime = (shiftTime) => {
          if (!shiftTime) return "";
          const hour = shiftTime.slice(0, 2);
          const minute = shiftTime.slice(2);
          return `${hour}:${minute}`;
        };

        const labels = data.map((entry) => formatShiftTime(entry.shiftTime));
        const pickupCounts = data.map((entry) => entry.totalpickup || 0);
        const dropCounts = data.map((entry) => entry.totaldrop || 0);

        const documentStyle = getComputedStyle(document.documentElement);
        const textColorSecondary = documentStyle.getPropertyValue(
          "--text-color-secondary"
        );
        const surfaceBorder =
          documentStyle.getPropertyValue("--surface-border");

        const totalPick = pickupCounts.reduce((a, b) => a + b, 0);
        const totalDrop = dropCounts.reduce((a, b) => a + b, 0);

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

        setRetryCount(0);
        setError(null);
      } catch (err) {
        console.error("PickDrop Error:", err);
        setError(err?.message || "Failed to load chart data");

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying PickDrop... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          setBarChartData({});
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAndPrepareChart();
  }, [filter, retryCount]);

  if (error && retryCount >= maxRetries) {
    return (
      <div className="cardx border-0 p-3">
        <h6>Pick/Drop Trips</h6>
        <hr />
        <div
          style={{
            padding: "2rem",
            background: "#fff3cd",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #ffc107",
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
    <div className="cardx border-0 p-3">
      <Loader isVisible={loading} fullScreen={false} />
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
      {!loading && (
        <Chart
          type="bar"
          data={barChartData}
          options={barChartOptions}
          className="w-full md:w-30rem"
        />
      )}

      <Dialog
        header={"Pick/Drop Trips"}
        visible={dialogVisible}
        style={{ width: "90vw", minHeight: "90vh" }}
        onHide={() => setDialogVisible(false)}
      >
        <Chart
          type="bar"
          data={barChartData}
          options={barChartOptions}
          className="w-full md:w-30rem"
          style={{ height: "75vh", width: "100%" }}
        />
      </Dialog>
      <Tooltip target="#pickDrop" content="Expand Chart" position="left" />
    </div>
  );
};

export default React.memo(RiPickDrop);