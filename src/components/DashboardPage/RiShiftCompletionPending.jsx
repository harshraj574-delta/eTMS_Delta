import { useState, useEffect } from "react";
import { ProgressBar } from "primereact/progressbar";
import { apiService } from "../../services/api"; // Adjust if needed
import { BiExpand, BiCalendar } from "react-icons/bi";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";

const RiShiftCompletionPending = ({ filter }) => {
  const [chartValues, setChartValues] = useState([]);
  const [isAllZero, setIsAllZero] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);

  useEffect(() => {
    const fetchChartData = async () => {
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
            return;
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

        const colors = ["#9e9e9e", "#3b00ed", "#0baa60", "#d81b60", "#ff9800", "#000"];

        setIsAllZero(values.every((v) => v === 0));
        setChartValues(
          labels.map((label, idx) => ({
            label: label,
            value: values[idx],
            color: colors [idx],
          }))
        );
      } catch (error) {
        console.error("Error fetching shift data", error);
      }
    };

    fetchChartData();
  }, [filter]);

  return (
    <div className="cardx border-0 p-3">
      <div className="d-flex justify-content-between align-items-center border-0">
        <h6>Route Completion</h6>
        {/* <span
          id="routeCompletion"
          style={{ cursor: "pointer" }}
          onClick={() => setDialogVisible(true)}
        >
          <BiExpand />
        </span> */}
      </div>
      <hr />

      <div className="row py-5 mt-5 d-flex align-items-center">
        <div className="col-12 px-0">
          {!isAllZero ? (
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm p-3">
              {chartValues.map((item, idx) => (
                <div key={idx} className="flex flex-col mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <small style={{ fontSize: "12px" }}>{item.label}:</small>
                    <small style={{ fontSize: "12px", fontWeight: "bold" }}>
                      {item.value}
                    </small>
                  </div>
                  <ProgressBar
                    value={item.value}
                    style={{ height: "6px" }}
                    color={item.color}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted mt-2 text-sm">
              Note: All values are currently zero for this period.
            </p>
          )}
        </div>
      </div>

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
          {chartValues.map((item, idx) => (
            <div key={idx} className="flex flex-col mb-3">
              <div className="d-flex justify-content-between mb-1">
                <small style={{ fontSize: "12px" }}>{item.label}:</small>
                <small style={{ fontSize: "12px", fontWeight: "bold" }}>
                  {item.value}
                </small>
              </div>
              <ProgressBar
                value={item.value}
                style={{ height: "6px" }}
                color={item.color}
              />
            </div>
          ))}
        </div>
      </Dialog>
      <Tooltip target="#routeCompletion" content="Expand Map" position="top" />
    </div>
  );
};

export default RiShiftCompletionPending;
