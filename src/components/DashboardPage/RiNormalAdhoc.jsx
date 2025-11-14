import { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import { Chart } from "primereact/chart";
import { BiExpand } from "react-icons/bi";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import Loader from "../common/Loader";
import React from "react";

const RiNormalAdhoc = ({ filter }) => {
  const [barChartData, setBarChartData] = useState({});
  const [barChartOptions, setBarChartOptions] = useState({});
  const [dialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

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

        const res = await apiService.GetNormalAdhoc_shiftwise(params);
        const responseData = JSON.parse(res) || [];

        if (!responseData.length) {
          setBarChartData({});
          setRetryCount(0);
          return;
        }

        const convertShiftTimeToLabel = (shiftTime) => {
          const hour = shiftTime.slice(0, 2);
          const minute = shiftTime.slice(2);
          return `${hour}:${minute}`;
        };

        const labels = responseData.map((item) =>
          convertShiftTimeToLabel(item.shiftTime)
        );
        const normalTrips = responseData.map((item) => item.NornalTripCount);
        const adhocTrips = responseData.map((item) => item.AdhocTripcount);

        setBarChartData({
          labels,
          datasets: [
            {
              type: "bar",
              label: `Normal Trips`,
              backgroundColor: "#5c92ff",
              data: normalTrips,
              barPercentage: 0.6,
              categoryPercentage: 0.6,
            },
            {
              type: "bar",
              label: `Adhoc Trips`,
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

        setRetryCount(0);
        setError(null);
      } catch (error) {
        console.error("Error fetching Normal vs Adhoc chart data:", error);
        setError(error?.message || "Failed to load chart data");

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying NormalAdhoc... Attempt ${retryCount + 1}/${maxRetries}`
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

    if (filter?.sDate && filter?.eDate) {
      fetchNormalAdhoc();
    }
  }, [filter, retryCount]);

  if (error && retryCount >= maxRetries) {
    return (
      <div className="cardx border-0 p-3 h-100">
        <h6>Normal vs Adhoc Trips</h6>
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
    <div className="cardx border-0 p-3 h-100">
      <Loader isVisible={loading} fullScreen={false} />
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
      {!loading && (
        <Chart
          type="bar"
          data={barChartData}
          options={barChartOptions}
          className="w-full md:w-30rem"
          style={{ height: "50vh", width: "100%" }}
        />
      )}

      <Dialog
        header={"Normal vs Adhoc Trips"}
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
      <Tooltip target="#adhoc" content="Expand Chart" position="left" />
    </div>
  );
};

export default React.memo(RiNormalAdhoc);