import { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import { BiExpand } from "react-icons/bi";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import Loader from "../common/Loader";
import React from "react";

const RiShiftCompletionPending = ({ filter }) => {
  const [chartValues, setChartValues] = useState([]);
  const [isAllZero, setIsAllZero] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await apiService.getShiftCompletePending({
          sDate: filter.sDate,
          eDate: filter.eDate,
          locationid: filter.locationid || "",
          facilityid: filter.facilityid || "",
          vendorid: filter.vendorid || "",
          triptype: filter.triptype || "",
        });

        let responseData = [];

        if (typeof res === "string") {
          try {
            responseData = JSON.parse(res);
          } catch (err) {
            console.error("Invalid JSON from API", err);
            throw err;
          }
        } else {
          responseData = res;
        }

        const data = responseData[0] || {};

        const values = [
          Number(data?.TotalRoutes ?? 0),
          Number(data?.Allocated ?? 0),
          Number(data?.Accepted ?? 0),
          Number(data?.VehicleStart ?? 0),
          Number(data?.VehicleEnd ?? 0),
          Number(data?.VehicleNoStart ?? 0),
        ];

        const labels = [
          "Total Routes",
          "Allocated",
          "Accepted by Drivers",
          "Started",
          "Trip Completed",
          "Vehicle Not Started",
        ];

        const colors = [
          "#9e9e9e",
          "#3b00ed",
          "#0baa60",
          "#d81b60",
          "#ff9800",
          "#000",
        ];

        const total = values[0];
        setIsAllZero(values.every((v) => v === 0));

        setChartValues(
          labels.map((label, idx) => {
            const absoluteValue = values[idx];
            const relativeValue =
              total > 0 ? Math.min((absoluteValue / total) * 100, 100) : 0;
            return {
              label,
              value: relativeValue,
              displayValue: absoluteValue,
              color: colors[idx],
            };
          })
        );

        setRetryCount(0);
        setError(null);
      } catch (error) {
        console.error("Error fetching shift data", error);
        setError(error?.message || "Failed to load chart data");

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying ShiftCompletion... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          setChartValues([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [filter, retryCount]);

  if (error && retryCount >= maxRetries) {
    return (
      <div className="cardx border-0 p-3">
        <h6>Route Completion</h6>
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
      <div className="d-flex justify-content-between align-items-center border-0">
        <h6>Route Completion</h6>
      </div>
      <hr />

      <div className="row py-5 mt-5 d-flex align-items-center">
        <div className="col-12 px-0">
          {!loading && !isAllZero ? (
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm p-3">
              {chartValues.map((item, idx) => (
                <div key={idx} className="flex flex-col mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <small style={{ fontSize: "12px" }}>{item.label}:</small>
                    <small style={{ fontSize: "12px", fontWeight: "bold" }}>
                      {item.displayValue}
                    </small>
                  </div>
                  <div
                    className="progress-container"
                    style={{
                      backgroundColor: "#eee",
                      borderRadius: "8px",
                      overflow: "hidden",
                      height: "6px",
                    }}
                  >
                    <div
                      style={{
                        width: `${item.value}%`,
                        backgroundColor: item.color,
                        height: "6px",
                        transition: "width 0.8s ease-in-out",
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <p className="text-muted mt-2 text-sm">
                Note: All values are currently zero for this period.
              </p>
            )
          )}
        </div>
      </div>

      <Dialog
        header={"Route Completion"}
        visible={dialogVisible}
        style={{ width: "90vw", minHeight: "90vh" }}
        onHide={() => setDialogVisible(false)}
      >
        <div className="m-0 bg-light">
          {chartValues.map((item, idx) => (
            <div key={idx} className="flex flex-col mb-3">
              <div className="d-flex justify-content-between mb-1">
                <small style={{ fontSize: "12px" }}>{item.label}:</small>
                <small style={{ fontSize: "12px", fontWeight: "bold" }}>
                  {item.displayValue}
                </small>
              </div>
              <div
                className="progress-container"
                style={{
                  backgroundColor: "#eee",
                  borderRadius: "8px",
                  overflow: "hidden",
                  height: "6px",
                }}
              >
                <div
                  style={{
                    width: `${item.value}%`,
                    backgroundColor: item.color,
                    height: "6px",
                    transition: "width 0.8s ease-in-out",
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </Dialog>
      <Tooltip target="#routeCompletion" content="Expand" position="top" />
    </div>
  );
};

export default React.memo(RiShiftCompletionPending);