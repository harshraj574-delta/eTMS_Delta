import { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import { Chart } from "primereact/chart";
import { BiExpand } from "react-icons/bi";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import Loader from "../common/Loader";
import React from "react";

const RiDropSafeChart = ({ filter }) => {
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

    const fetchChartData = async () => {
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

        const res = await apiService.GetDropSafe_shiftwise(params);
        const apiData = typeof res === "string" ? JSON.parse(res) : res || [];

        if (!apiData || apiData.length === 0) {
          setBarChartData({});
          setRetryCount(0);
          return;
        }

        const convertShiftTimeToLabel = (shiftTime) => {
          const hour = shiftTime.slice(0, 2);
          const minute = shiftTime.slice(2);
          return `${hour}:${minute}`;
        };

        const labels = apiData.map((item) =>
          convertShiftTimeToLabel(item.shiftTime)
        );
        const femaleCounts = apiData.map((item) => Number(item.femalecount));
        const dsyCounts = apiData.map((item) => Number(item.dsycount));

        setBarChartData({
          labels,
          datasets: [
            {
              type: "bar",
              label: `Women Employees`,
              backgroundColor: "#007bff",
              data: femaleCounts,
              barPercentage: 0.7,
              categoryPercentage: 0.8,
            },
            {
              type: "bar",
              label: `DSY Count`,
              backgroundColor: "#dc3545",
              data: dsyCounts,
              barPercentage: 0.7,
              categoryPercentage: 0.8,
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
              stacked: false,
              ticks: { color: textColorSecondary },
              grid: { color: surfaceBorder },
            },
            y: {
              stacked: false,
              ticks: { color: textColorSecondary },
              grid: { color: surfaceBorder },
            },
          },
        });

        setRetryCount(0);
        setError(null);
      } catch (err) {
        console.error("Drop Safe Chart Error:", err);
        setError(err?.message || "Failed to load chart data");

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying DropSafe... Attempt ${retryCount + 1}/${maxRetries}`
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

    if (
      filter &&
      filter.sDate &&
      filter.eDate &&
      filter.locationid !== undefined &&
      filter.locationid !== null
    ) {
      fetchChartData();
    } else {
      setBarChartData({});
    }
  }, [filter, retryCount]);

  if (error && retryCount >= maxRetries) {
    return (
      <div className="cardx border-0 p-3 h-100">
        <h6>Women Employee vs DSY Count (Shift-wise)</h6>
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
        <h6>Women Employee vs DSY Count (Shift-wise)</h6>
        <span
          id="dsy"
          style={{ cursor: "pointer" }}
          onClick={() => setDialogVisible(true)}
        >
          <BiExpand />
        </span>
      </div>
      <hr />
      {!loading && barChartData?.datasets?.length > 0 ? (
        <Chart
          type="bar"
          data={barChartData}
          options={barChartOptions}
          style={{ height: "50vh", width: "100%" }}
        />
      ) : (
        !loading && (
          <div className="text-center text-muted py-5">
            <p style={{ fontSize: "16px", marginBottom: "8px" }}>
              No records found
            </p>
            <p style={{ fontSize: "14px", color: "#999" }}>
              Try adjusting your filters to see data
            </p>
          </div>
        )
      )}

      <Dialog
        header={"Women Employee vs DSY Count (Shift-wise)"}
        visible={dialogVisible}
        style={{ width: "90vw", minHeight: "90vh" }}
        onHide={() => setDialogVisible(false)}
      >
        <Chart
          type="bar"
          data={barChartData}
          options={barChartOptions}
          style={{ height: "75vh", width: "100%" }}
        />
      </Dialog>

      <Tooltip target="#dsy" content="Expand Chart" position="left" />
    </div>
  );
};

export default React.memo(RiDropSafeChart);