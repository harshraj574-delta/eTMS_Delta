import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ToastContainer } from "react-toastify";
import Loader from "./common/Loader";
import Header from "./Master/Header";
import sessionManager from "../utils/SessionManager";
import SidebarMenu from "./Master/SidebarMenu";
import { Dropdown } from "primereact/dropdown";
import { toastService } from "../services/toastService";
import ManageColonyService from "../services/compliance/ManageColonyService";
import noReportImage from "../assets/no_report.png";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import CustomPaginator from "./common/CustomPaginator";
import { CustomDataTable } from "./common/CustomDataTable";


const ManageColony = () => {
    const [facilities, setFacilities] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [routeSeqData, setRouteSeqData] = useState([]);
    const [loading, setLoading] = useState(false);
    const UserId = sessionManager.getUserSession().ID;
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [hasSearched, setHasSearched] = useState(false);
    const [first, setFirst] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [expandedRows, setExpandedRows] = useState({});
    const [expandedRowDetails, setExpandedRowDetails] = useState({});
    const [loadingDetails, setLoadingDetails] = useState(false);
    const onPageChange = (event) => {
        setFirst(event.first);
        setRowsPerPage(event.rows);
    };
    const handleToggle = async (e, rowData) => {
        e.preventDefault();
        e.stopPropagation();

        const rowId = rowData.RouteID;

        setExpandedRows(prev => {
            const newExpandedRows = { ...prev };

            if (newExpandedRows[rowId]) {
                delete newExpandedRows[rowId];
            } else {
                newExpandedRows[rowId] = true;

                if (!expandedRowDetails[rowId]) {
                    fetchRouteSeqDetail(rowData);
                }
            }

            return newExpandedRows;
        });
    };
    const fetchRouteSeqDetail = async (rowData) => {
        try {
            setLoadingDetails(true);

            const response = await ManageColonyService.GetRouteSeqDetail({
                routeID: rowData.RouteID,
                locationID: selectedFacility,
                facilityid: selectedFacility,
            });

            let details = [];

            if (typeof response === "string") {
                const parsed = JSON.parse(response);
                details = Array.isArray(parsed)
                    ? parsed
                    : Array.isArray(parsed?.data)
                        ? parsed.data
                        : [];
            } else if (Array.isArray(response)) {
                details = response;
            } else if (Array.isArray(response?.data)) {
                details = response.data;
            }

            setExpandedRowDetails(prev => ({
                ...prev,
                [rowData.RouteID]: details
            }));

        } catch (error) {
            console.error("Error fetching route details:", error);
            toastService?.error?.("Failed to load route details");
        } finally {
            setLoadingDetails(false);
        }
    };

    const actionTemplate = (rowData) => {
        const rowId = rowData.RouteID;
        const isExpanded = !!expandedRows[rowId];

        return (
            <a
                href="#!"
                className="cursor-pointer"
                onClick={(e) => handleToggle(e, rowData)}
                title={isExpanded ? "Collapse" : "Expand"}
            >
                <span className="material-icons text-primary" style={{ fontSize: '20px' }}>
                    {isExpanded ? 'remove_circle' : 'add_circle'}
                </span>
            </a>
        );
    };

    const expandedRowTemplate = (rowData) => {
        const rowId = rowData.RouteID;
        const details = Array.isArray(expandedRowDetails[rowId])
            ? expandedRowDetails[rowId]
            : [];

        return (
            <div className="leftStrip p-2">
                <div className="expanded-content">
                    <div className="table-responsive">
                        {loadingDetails ? (
                            <div className="text-center py-4">
                                <span className="spinner-border spinner-border-sm me-2" />
                                Loading details...
                            </div>
                        ) : details.length > 0 ? (
                            <DataTable
                                value={details}     // ✅ ALWAYS ARRAY
                                paginator={false}
                                responsiveLayout="scroll"
                                size="small"
                                emptyMessage="No sequence details"
                                className="w-100"
                            >
                                <Column field="SeqId" header="SeqID" />
                                <Column field="ZoneName" header="Zone" />
                                <Column field="City" header="City" />
                                <Column field="Colony" header="Area" />
                                {/* <Column field="Location" header="Area" /> */}
                                <Column field="SubColony" header="Landmark" />
                                <Column field="Metro" header="Metro" />
                                <Column field="travelTime" header="Time" />
                                <Column field="travelKm" header="Km" />
                            </DataTable>
                        ) : (
                            <div className="text-center text-muted p-3">
                                No route sequence details available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };


    const fetchFacilities = async () => {
        try {
            const response = await ManageColonyService.SelectFacility({ Userid: UserId });
            const parsed = typeof response === 'string' ? JSON.parse(response) : response;
            const formatted = (parsed || []).map(item => ({
                facilityName: item.facility || item.facilityName || "",
                Id: item.Id || item.id || item.Value || "",
            }));
            setFacilities(formatted);
            const userFacilityId = sessionManager.getUserSession().locationId;
            const defaultFacility = formatted.find(fac =>
                fac.Id == userFacilityId ||
                fac.Id.toString() === userFacilityId.toString()
            );
            if (defaultFacility) {
                setSelectedFacility(defaultFacility.Id);
            } else if (formatted.length > 0) {
                setSelectedFacility(formatted[0].Id);
            }
        } catch (err) {
            console.error("Error fetching facilities:", err);
            toastService?.error?.("Failed to load facilities. Please try again.")
        }
    }
    useEffect(() => {
        fetchFacilities();
    }, []);
    const fetchGetRouteSeq = async (facilityId) => {
        if (!facilityId) return;

        setLoading(true);
        try {
            const response = await ManageColonyService.GetRouteSeq({
                locationid: facilityId,
                facilityid: facilityId
            });
            // console.log("API Response:", response);
            let data = [];
            if (typeof response === 'string') {
                try {
                    const parsed = JSON.parse(response);
                    data = Array.isArray(parsed) ? parsed : (parsed?.data || []);
                } catch (parseError) {
                    console.error("Error parsing response:", parseError);
                    data = [];
                }
            } else if (Array.isArray(response)) {
                data = response;
            } else if (response?.data && Array.isArray(response.data)) {
                data = response.data;
            }
            setRouteSeqData(data);
            if (data.length > 0) {
                toastService?.success?.("Route sequence loaded successfully!");
            } else {
                toastService?.info?.("No route sequence found for this facility.");
            }
        } catch (error) {
            console.error("Error:", error);
            toastService?.error?.("Failed to load route sequence");
            setRouteSeqData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFacilityChange = async (e) => {
        const facilityId = e.value;
        setRouteSeqData([]);
        setIsInitialLoad(false);
        setSelectedFacility(facilityId);
        setHasSearched(true);
        const locationId = sessionManager.getUserSession().locationId || UserId;
        if (facilityId && locationId) {
            await fetchGetRouteSeq(facilityId, locationId);
        }
    };

    useEffect(() => {
        if (facilities.length > 0 && selectedFacility && isInitialLoad) {
            fetchGetRouteSeq(selectedFacility);
            setIsInitialLoad(false);
            setHasSearched(true);
        }
    }, [facilities, selectedFacility, isInitialLoad]);
    return (

        <div className="container-fluid p-0">
            <ToastContainer position="top-right" autoClose={3000} />
            <Loader isVisible={loading} fullScreen={true} />
            <Header pageTitle={"Shuttle Route Master"} mainTitle={"Admin"} />
            <SidebarMenu />
            <div className="middle">
                <div className="card_tb p-3">
                    <div className="row">
                        <div className="col-2">
                            <label>Facility</label>
                            <Dropdown
                                id="facility"
                                placeholder="Select Facility"
                                className="w-100"
                                value={selectedFacility}
                                options={facilities}
                                onChange={handleFacilityChange}
                                optionLabel="facilityName"
                                optionValue="Id"
                            />
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-12">
                        <div className="card_tb">
                            {!hasSearched && (
                                <div
                                    className="d-flex flex-column align-items-center justify-content-center p-5"
                                    style={{ minHeight: "70vh" }}
                                >
                                    <img
                                        src={noReportImage}
                                        alt="No Report Selected"
                                        style={{
                                            maxWidth: "100px",
                                            opacity: 0.5,
                                            marginBottom: "1rem",
                                        }}
                                    />
                                    <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                                        Please select above parameter to show Route Sequence
                                    </p>
                                </div>
                            )}
                            {hasSearched && routeSeqData.length === 0 && (
                                <div
                                    className="d-flex flex-column align-items-center justify-content-center p-5"
                                    style={{ minHeight: "70vh" }}
                                >
                                    <img
                                        src={noReportImage}
                                        alt="No Data"
                                        style={{
                                            maxWidth: "100px",
                                            opacity: 0.5,
                                            marginBottom: "1rem",
                                        }}
                                    />
                                    <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                                        No Route Sequence found for the selected criteria
                                    </p>
                                </div>
                            )}
                            {hasSearched && routeSeqData.length > 0 && (
                                <div className="p-3">
                                    <CustomDataTable
                                        className="p-datatable-sm clean-expansion-table"
                                        emptyMessage="No route data"
                                        value={routeSeqData}
                                        dataKey="RouteID"
                                        expandedRows={expandedRows}
                                        // onRowToggle={(e) => {
                                        //     if (expandedRows.includes(e.data.RouteID)) {
                                        //         setExpandedRows(expandedRows.filter(id => id !== e.data.RouteID));
                                        //     } else {
                                        //         setExpandedRows([...expandedRows, e.data.RouteID]);
                                        //         fetchRouteSeqDetail(e.data);
                                        //     }
                                        // }}
                                        rowExpansionTemplate={expandedRowTemplate}  >
                                        <Column body={actionTemplate} header="" style={{ width: '50px' }} />
                                        <Column field="RouteID" header="Route No" />
                                        <Column field="ZoneName" header="Zone" />
                                        <Column field="City" header="City" />
                                        <Column field="Colony" header="Colony" />
                                    </CustomDataTable>
                                    <CustomPaginator
                                        first={first}
                                        rows={rowsPerPage}
                                        totalRecords={routeSeqData.length}
                                        onPageChange={onPageChange}
                                        rowsPerPageOptions={[50, 100, 150, 200]}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default ManageColony;