import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../Master/SidebarMenu";
import Notifications from "../Master/Notifications";
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap CSS
import "bootstrap/dist/js/bootstrap.bundle.min.js"; // Import Bootstrap JS
import "../css/style.css";
import Header from "../Master/Header";
import sessionManager from "../../utils/SessionManager.js";
import { toastService } from "../../services/toastService";
import { MultiSelect } from "primereact/multiselect";
import { Column } from "primereact/column";
import "primereact/resources/themes/lara-light-blue/theme.css"; // Theme
import "primereact/resources/primereact.min.css"; // Core CSS
import "primeicons/primeicons.css"; // Icons
import { Button } from "primereact/button"; // Import Button component from PrimeReact
import { Offcanvas } from "bootstrap";
import Loader from "../common/Loader.jsx";
import TableToolbar from "../common/TableToolbar.jsx";
import ResponsiveDataTable from "../common/ResponsiveDataTable";
import CustomPaginator from "../common/CustomPaginator";
import ChatIcon from "../common/ChatIcon";
import TabSwitcher from "../common/TabSwitcher";
import AnimatedCounter from "../common/AnimatedCounter";
import { useQueryClient } from "@tanstack/react-query";
import {
  myFeedbackKeys,
  useFeedbackListQuery,
  useTicketRepliesQuery,
  useCategoriesQuery,
  useComplaintTypesQuery,
  useTripIdsQuery,
  useFeedbackCountsQuery,
  useSubmitFeedbackMutation,
  useReopenTicketMutation,
} from "./hooks/useMyFeedbackQueries";
const MyFeedback = () => {
  const queryClient = useQueryClient();
  const empId = sessionManager.getUserSession()?.ID;

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);
  const [isRaiseFeedbackOpen, setIsRaiseFeedbackOpen] = useState(false); // State for Raise Feedback offcanvas
  const [feedbackText, setFeedbackText] = useState(""); // State for feedback text
  const [reopenRemark, setReopenRemark] = useState(""); // State for the remark entered in the offcanvas
  const [feedbackFilter, setFeedbackFilter] = useState("total"); // "all", "open", "closed", "total"
  const [addRaiseFeedback, setAddRaiseFeedback] = useState(false);
  // Raise Feedback form selections the option queries cascade from
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [travelDate, setTravelDate] = useState("");
  const [globalFilter, setGlobalFilter] = useState(null);

  const { data: feedbackData = [], isFetching: listFetching } = useFeedbackListQuery();
  const { data: ticketReplies = [], isFetching: repliesFetching } =
    useTicketRepliesQuery(selectedTicket);
  const { data: categoryDropDown = [] } = useCategoriesQuery(
    sessionStorage.getItem("FacilityID")
  );
  const { data: complaintTypeDropDown = [] } = useComplaintTypesQuery(selectedCategoryId);
  const { data: tripIdDropDown = [] } = useTripIdsQuery(travelDate, empId);
  const { data: feedbackCount = { total: 0, open: 0, closed: 0 } } =
    useFeedbackCountsQuery(empId);
  const submitFeedbackMutation = useSubmitFeedbackMutation();
  const reopenTicketMutation = useReopenTicketMutation();

  const loading =
    listFetching ||
    repliesFetching ||
    submitFeedbackMutation.isPending ||
    reopenTicketMutation.isPending;

  // Preserve the legacy side effect: first category id is kept in sessionStorage
  useEffect(() => {
    if (categoryDropDown.length > 0) {
      sessionStorage.setItem("ComplaintCategoryId", categoryDropDown[0].id);
    }
  }, [categoryDropDown]);
  const [filters, setFilters] = useState({
    TypeName: null,
    Status: null,
    RouteId: null,
    TicketNo: null,
  });

  // Pagination state
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(50);

  const onPageChange = (event) => {
      setFirst(event.first);
      setRows(event.rows);
  };

  const op = useRef(null);
  const filterButtonRef = useRef(null);

  const getUniqueValues = (field) => {
    const values = feedbackData.map((item) => item[field]).filter(Boolean);
    return [...new Set(values)].map((val) => ({ label: val, value: val }));
  };

  const clearAdvancedFilters = () => {
    setFilters({
      TypeName: null,
      Status: null,
      RouteId: null,
      TicketNo: null,
    });
    if (op.current) op.current.hide();
    toastService.info("Filters cleared");
  };
  const handleReopen = (ticketNo) => {
    setSelectedTicket(ticketNo); // Set the selected ticket number
    setIsOffcanvasOpen(true); // Open the offcanvas
  };
  useEffect(() => {
    // Refetch on offcanvas close, matching the legacy behavior
    const invalidateAll = () =>
      queryClient.invalidateQueries({ queryKey: myFeedbackKeys.all });

    const onReopenHidden = () => {
      setIsOffcanvasOpen(false);
      invalidateAll();
    };
    const onFeedbackHidden = () => {
      setIsRaiseFeedbackOpen(false);
      invalidateAll();
    };

    const reopenOffcanvas = document.getElementById("raise_Reopen");
    const feedbackOffcanvas = document.getElementById("raise_Feedback");
    reopenOffcanvas?.addEventListener("hidden.bs.offcanvas", onReopenHidden);
    feedbackOffcanvas?.addEventListener("hidden.bs.offcanvas", onFeedbackHidden);

    return () => {
      reopenOffcanvas?.removeEventListener("hidden.bs.offcanvas", onReopenHidden);
      feedbackOffcanvas?.removeEventListener("hidden.bs.offcanvas", onFeedbackHidden);
    };
  }, [queryClient]);

  // Ticket link click — the replies query follows the selected ticket
  const fetchTicketReplies = (ticketNo) => {
    setSelectedTicket(ticketNo);
  };

  const handleTravelDateChange = (e) => {
    setTravelDate(e.target.value);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId || null);
  };
  const handleSubmitFeedback = async () => {
    // Check if required fields are filled
    const selectedCategory = document.getElementById("categorySelect").value;
    if (!selectedCategory) {
      toastService.warn("Please select a category type");
      return;
    }

    if (!feedbackText) {
      toastService.warn("Please enter feedback text");
      return;
    }

    const FeedTypeId = document.getElementById("complaintTypeSelect").value;
    if (!FeedTypeId || FeedTypeId === "0") {
      toastService.warn("Please select a complaint type");
      return;
    }

    const ticketNo = selectedTicket;
    const desc = feedbackText;
    const actionid = 0;
    const statusid = 0;
    const RaisedDate = document.getElementById("travelDate").value || new Date().toISOString().split("T")[0];
    const RaisedById = sessionManager.getUserSession()?.ID;
    const RouteId = document.getElementById("tripIdSelect").value || "";
    // Clear the fields after submission
    document.getElementById("categorySelect").value = "";
    document.getElementById("complaintTypeSelect").value = "";
    document.getElementById("travelDate").value = "";
    document.getElementById("tripIdSelect").value = "";
    setFeedbackText("");
    setTravelDate("");
    setSelectedCategoryId(null);
    setIsRaiseFeedbackOpen(false);
    const offcanvasElement = document.getElementById("raise_Feedback");
    const closeButton = offcanvasElement.querySelector(
      '[data-bs-dismiss="offcanvas"]'
    );
    if (closeButton) {
      closeButton.click();
    }
    const params = {
      ticketNo,
      desc,
      actionid,
      statusid,
      FeedTypeId,
      RaisedDate,
      RaisedById,
      RouteId,
    };

    try {
      await submitFeedbackMutation.mutateAsync(params);
      toastService.success("Feedback submitted successfully!");
      const offcanvasElement = document.getElementById("raise_Reopen");
      const closeButton = offcanvasElement.querySelector(
        '[data-bs-dismiss="offcanvas"]'
      );
      if (closeButton) {
        closeButton.click();
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toastService.error("Error submitting feedback. Please try again.");
    }
  };
  const handleReopenSave = async () => {
    const params = {
      ticketNo: selectedTicket, // Assuming you have the selected ticket number
      desc: reopenRemark, // Use the remark entered by the user
      actionid: sessionManager.getUserSession()?.ID, // Set the appropriate action ID if needed
      statusid: 0, // Set the appropriate status ID if needed
    };

    try {
      await reopenTicketMutation.mutateAsync(params);
      toastService.success("Ticket reopened successfully.");
      // Reset the remark state
      setReopenRemark("");
      setIsOffcanvasOpen(false); // Close the offcanvas
      document.getElementById("reopenRemark").value = ""; // Clear the textarea
    } catch (error) {
      console.error("Error submitting reopen remark:", error);
      toastService.error("Error reopening the ticket. Please try again.");
    }
  };

  // Add this function to handle opening the Raise Feedback offcanvas
  const handleOpenRaiseFeedback = () => {
    setIsRaiseFeedbackOpen(true);
  };
  const handleNewButtonClick = () => {
    const offcanvasElement = document.getElementById("raise_Feedback");
    if (offcanvasElement) {
      const offcanvas = new Offcanvas(offcanvasElement);
      offcanvas.show();
    }
    // optional: resetFormValues();
  };
  // Tab switching - Immediate UI update
  const handleFilterClick = (filter) => {
    setFeedbackFilter(filter);
  };

  // search filter - MEMOIZED
  const applyGlobalFilter = (data, search) => {
    if (!search || !search.trim()) return data;

    const searchLower = search.toLowerCase();

    return data.filter((row) =>
      Object.values(row ?? {}).some((val) =>
        String(val ?? "")
          .toLowerCase()
          .includes(searchLower)
      )
    );
  };

  const deferredFeedbackFilter = React.useDeferredValue(feedbackFilter);
  const isStale = feedbackFilter !== deferredFeedbackFilter;

  const filteredByStatus = React.useMemo(() => {
    return deferredFeedbackFilter === "total"
      ? feedbackData
      : deferredFeedbackFilter === "open"
        ? feedbackData.filter(
          (item) => item.Status && item.Status.toLowerCase() === "open"
        )
        : deferredFeedbackFilter === "closed"
          ? feedbackData.filter(
            (item) => item.Status && item.Status.toLowerCase() === "closed"
          )
          : feedbackData;
  }, [deferredFeedbackFilter, feedbackData]);

  // Apply Advanced Filters - MEMOIZED
  const filteredByAdvanced = React.useMemo(() => {
    return filteredByStatus.filter((item) => {
      return Object.keys(filters).every((key) => {
        if (!filters[key] || filters[key].length === 0) return true;
        return filters[key].includes(item[key]);
      });
    });
  }, [filteredByStatus, filters]);

  const finalTableData = React.useMemo(() => {
    return applyGlobalFilter(filteredByAdvanced, globalFilter);
  }, [filteredByAdvanced, globalFilter]);

  // Refresh data function
  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: myFeedbackKeys.all });
    toastService.success("Data has been successfully refreshed.");
  };
  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <Loader isVisible={loading} fullScreen={true} />
      <Header
        pageTitle={"My Feedback"}
        showNewButton={true}
        //onNewClick={handleOpenRaiseFeedback} 
        onNewButtonClick={handleNewButtonClick}
      />

      {/* Sidebar */}
      <Sidebar />

      {/* Middle Content */}
      <div className="middle">
        {/* <div className="row">
          <div className="col-lg-12">
            <div className="row">
              <div className="col">
                <div
                  className="cardx p-3 bg-secondary text-white"
                  style={{ cursor: "pointer" }}
                  onClick={() => setFeedbackFilter("total")}
                >
                  <h3>
                    <strong className="text-white">
                      {feedbackCount.total}
                    </strong>
                  </h3>
                  <span className="subtitle_sm text-white">
                    Total Feedbacks
                  </span>
                </div>
              </div>
              <div className="col">
                <div
                  className="cardx p-3"
                  style={{ cursor: "pointer" }}
                  onClick={() => setFeedbackFilter("open")}
                >
                  <h3>
                    <strong className="text-warning">
                      {feedbackCount.open}
                    </strong>
                  </h3>
                  <span className="subtitle_sm">Open Tickets</span>
                </div>
              </div>
              <div className="col">
                <div
                  className="cardx p-3"
                  style={{ cursor: "pointer" }}
                  onClick={() => setFeedbackFilter("closed")}
                >
                  <h3>
                    <strong className="text-dark text-opacity-50">
                      {feedbackCount.closed}
                    </strong>
                  </h3>
                  <span className="subtitle_sm">Closed Tickets</span>
                </div>
              </div>
            </div>
          </div>
        </div> */}
        <div className="row mt-3">
          <div className="col">
            <div className="cardNew p-4 bg-white">
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '31px', lineHeight: '40px', letterSpacing: '-0.03em' }} className="text-dark"><AnimatedCounter value={feedbackCount.total} /></h3>
              <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', lineHeight: '28px', letterSpacing: '-0.02em', verticalAlign: 'middle', color: '#545557' }}>Total Feedbacks</span>
            </div>
          </div>
          <div className="col">
            <div className="cardNew p-4 bg-white">
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '31px', lineHeight: '40px', letterSpacing: '-0.03em' }} className="text-warning"><AnimatedCounter value={feedbackCount.open} /></h3>
              <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', lineHeight: '28px', letterSpacing: '-0.02em', verticalAlign: 'middle', color: '#545557' }}>Open Tickets</span>
            </div>
          </div>
          <div className="col">
            <div className="cardNew p-4 bg-white">
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '31px', lineHeight: '40px', letterSpacing: '-0.03em' }} className="text-dark text-opacity-50"><AnimatedCounter value={feedbackCount.closed} /></h3>
              <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', lineHeight: '28px', letterSpacing: '-0.02em', verticalAlign: 'middle', color: '#545557' }}>Closed Tickets</span>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-12">
            <TabSwitcher
              tabs={[
                { label: "Open Tickets", value: "open" },
                { label: "Closed Tickets", value: "closed" },
                { label: "Total Tickets", value: "total" },
              ]}
              activeTab={feedbackFilter}
              onTabChange={(value) => handleFilterClick(value)}
            />
          </div>
        </div>
        {/* Feedback Table */}
        <div className="row">
          <div className="col-12">
            <div 
              className="card_tb"
              style={{
                opacity: isStale ? 0.5 : 1,
                transition: 'opacity 0.2s ease'
              }}
            >
              <div className="p-3">
                <TableToolbar
                  showExport={false}
                  showFilter={true}
                  onRefresh={() => handleRefresh()}
                  search={globalFilter}
                  onSearch={(e) => setGlobalFilter(e.target.value)}
                  filters={filters}
                  setFilters={setFilters}
                  overlayRef={op}
                  filterButtonRef={filterButtonRef}
                >
                  <div className="ota-filter-header">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <span className="ota-filter-icon">
                          <i className="pi pi-filter" />
                        </span>
                        <div>
                          <div className="ota-filter-title">Advanced filters</div>
                          <div className="ota-filter-subtitle">
                            Refine feedback list
                          </div>
                        </div>
                      </div>
                      {Object.values(filters).filter(
                        (f) => Array.isArray(f) && f.length > 0
                      ).length > 0 && (
                          <span
                            className="badge bg-primary"
                            style={{ fontSize: "0.7rem", borderRadius: "999px" }}
                          >
                            {Object.values(filters).filter(
                              (f) => Array.isArray(f) && f.length > 0
                            ).length}
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="ota-filter-body">
                    <div className="ota-filter-field">
                      <label className="ota-filter-label">Ticket No</label>
                      <MultiSelect
                        value={filters.TicketNo}
                        options={getUniqueValues("TicketNo")}
                        onChange={(e) =>
                          setFilters({ ...filters, TicketNo: e.value })
                        }
                        placeholder="Select Ticket No"
                        maxSelectedLabels={2}
                        className="w-100 p-inputtext-sm"
                        display="chip"
                        filter
                        showClear
                      />
                    </div>
                    <div className="ota-filter-field">
                      <label className="ota-filter-label">Type</label>
                      <MultiSelect
                        value={filters.TypeName}
                        options={getUniqueValues("TypeName")}
                        onChange={(e) =>
                          setFilters({ ...filters, TypeName: e.value })
                        }
                        placeholder="Select Type"
                        maxSelectedLabels={2}
                        className="w-100 p-inputtext-sm"
                        display="chip"
                        filter
                        showClear
                      />
                    </div>
                    <div className="ota-filter-field">
                      <label className="ota-filter-label">Route ID</label>
                      <MultiSelect
                        value={filters.RouteId}
                        options={getUniqueValues("RouteId")}
                        onChange={(e) =>
                          setFilters({ ...filters, RouteId: e.value })
                        }
                        placeholder="Select Route ID"
                        maxSelectedLabels={2}
                        className="w-100 p-inputtext-sm"
                        display="chip"
                        filter
                        showClear
                      />
                    </div>
                    <div className="ota-filter-field">
                      <label className="ota-filter-label">Status</label>
                      <MultiSelect
                        value={filters.Status}
                        options={getUniqueValues("Status")}
                        onChange={(e) =>
                          setFilters({ ...filters, Status: e.value })
                        }
                        placeholder="Select Status"
                        maxSelectedLabels={2}
                        className="w-100 p-inputtext-sm"
                        display="chip"
                        filter
                        showClear
                      />
                    </div>
                  </div>

                  <div className="ota-filter-footer">
                    <Button
                      label="Clear all filters"
                      icon="pi pi-filter-slash"
                      className="p-button-outlined p-button-secondary w-100"
                      onClick={clearAdvancedFilters}
                      size="small"
                    />
                  </div>
                </TableToolbar>
                <ResponsiveDataTable
                    value={finalTableData.slice(first, first + rows)}
                    loading={loading}
                    emptyMessage="No feedback data available"
                    className="p-datatable-sm"
                    rowClassName={(data, props) => {
                      let className = props.rowIndex % 2 !== 0 ? "ota-row-odd" : "";
                      if (data && data.Status && data.Status.toLowerCase() === "closed") {
                        className += " column";
                      }
                      return className;
                    }}
                  >
                    <Column
                      header="Ticket No."
                      mobile={{ primary: true }}
                      body={(rowData) => {
                        const hasConversation = rowData.ActionBy !== null && rowData.ActionBy !== '';
                        const textColor = hasConversation ? '#0BAA60' : 'inherit';
                        return (
                          <a
                            href="#!"
                            className="btn-text"
                            data-bs-toggle="offcanvas"
                            data-bs-target="#ticketNumber"
                            aria-controls="offcanvasRight"
                            onClick={() => fetchTicketReplies(rowData.TicketNo)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                          >
                            <ChatIcon hasConversation={hasConversation} />
                            <span style={{ color: textColor, fontWeight: hasConversation ? '500' : 'normal' }}>
                              {rowData.TicketNo}
                            </span>
                          </a>
                        );
                      }}
                    />
                    <Column
                      field="RaisedDate"
                      header="Shift Date"
                      mobile={{ subtitle: true }}
                      body={(rowData) =>
                        new Date(rowData.RaisedDate).toLocaleDateString()
                      }
                    />
                    <Column field="TypeName" header="Type" mobile={{ hidden: true }} />
                    <Column
                      field="Desrp"
                      header="Description"
                      body={(rowData) => (
                        <div
                          className="position-relative"
                          title={rowData.Desrp}
                          style={{
                            maxWidth: "200px",
                            overflow: "hidden",
                            cursor: "pointer",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {rowData.Desrp}
                        </div>
                      )}
                    />
                    <Column field="RouteId" header="Route ID" mobile={{ hidden: true }} />
                    <Column field="ActionBy" header="Last Action By" mobile={{ hidden: true }} />
                    <Column
                      field="Status"
                      header="Status"
                      mobile={{ badge: true }}
                      body={(rowData) => (
                        <span
                          className={`badgee ${rowData &&
                            rowData.Status &&
                            rowData.Status.toLowerCase() === "open"
                            ? "badge_warning"
                            : "badge_muted"
                            }`}
                        >
                          {rowData && rowData.Status ? rowData.Status : "N/A"}
                        </span>
                      )}
                    />
                    <Column
                      header="Action"
                      mobile={{ action: true }}
                      body={(rowData) => (
                        <button
                          data-bs-toggle="offcanvas"
                          data-bs-target="#raise_Reopen"
                          aria-controls="offcanvasRightReope"
                          className={`btn btn-sm ${rowData &&
                            rowData.Status &&
                            rowData.Status.toLowerCase() === "closed"
                            ? "btn-outline-success"
                            : "btn-outline-danger"
                            }`}
                          onClick={() =>
                            rowData &&
                            rowData.ReOpenStatus &&
                            handleReopen(rowData.TicketNo)
                          }
                          disabled={!rowData.ReOpenStatus}
                        >
                          <span style={{ whiteSpace: "nowrap" }}>
                            {rowData.StatusText}
                          </span>
                        </button>
                      )}
                    />
                  </ResponsiveDataTable>
                  <CustomPaginator
                      first={first}
                      rows={rows}
                      totalRecords={finalTableData.length}
                      onPageChange={onPageChange}
                      rowsPerPageOptions={[50, 100, 150, 200]}
                  />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* // Offcanvas component reopen*/}
      <div
        className={`offcanvas offcanvas-end ${isOffcanvasOpen ? "show" : ""}`}
        tabIndex="-1"
        id="raise_Reopen"
        aria-labelledby="offcanvasRightReope"
      >
        <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <h5 className="subtitle fw-normal">Re-open Remark</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => setIsOffcanvasOpen(false)}
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body px-4">
          <div className="row">
            <div className="col-12 mb-3">
              <label className="form-label">Ticket No:</label>
              <input
                type="text"
                className="form-control"
                value={selectedTicket || ""}
                readOnly
              />{" "}
              {/* Display the selected ticket number */}
            </div>
            <div className="col-12 mb-3">
              <label className="form-label">
                Please Enter Reason for Reopening this Ticket:
              </label>
              <textarea
                id="reopenRemark"
                className="form-control"
                rows="3"
                placeholder="Please Select"
                value={reopenRemark} // Bind the textarea value to the state
                onChange={(e) => setReopenRemark(e.target.value)} // Update state on change
              ></textarea>
            </div>
          </div>
        </div>
        <div className="offcanvas-footer">
          <button
            className="btn btn-outline-secondary"
            data-bs-dismiss="offcanvas"
            onClick={() => setIsOffcanvasOpen(false)}
          >
            Cancel
          </button>
          <button
            className="btn btn-success mx-3"
            onClick={() => {
              handleReopenSave();
              setIsOffcanvasOpen(false);
            }}
          >
            Save
          </button>
        </div>
      </div>

      {/* // Offcanvas component reopen */}

      {/* New My Feedback Prime Sidebar */}
      {/* <PrimeSidebar visible={addRaiseFeedback} position="right" 
    showCloseIcon={false} 
    dismissable={false} 
    style={{width:'25%'}}
>
<div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
        <h6 className="sidebarTitle">Dummy Prime Sidebar</h6>
        <Button 
            icon="pi pi-times" 
            className="p-button-rounded p-button-text" 
            onClick={() => {setAddRaiseFeedback(false)}} 
        />
    </div>
    <div className="sidebarBody">
      Dummy
    </div>
    <div className="sidebar-fixed-bottom position-absolute pe-3">
        <div className="d-flex gap-3 justify-content-end">
            <Button label="Cancel" className="btn btn-outline-secondary"/>
            <Button label="Save" className="btn btn-success"/>
        </div>
    </div>
</PrimeSidebar> */}
      {/* New My Feedback Prime Sidebar */}

      {/* <!-- Raise Feedback Rightbar --> */}
      <div
        className={`offcanvas offcanvas-end ${isRaiseFeedbackOpen ? "show" : ""
          }`}
        tabIndex="-1"
        id="raise_Feedback"
        aria-labelledby="offcanvasRightLabel"
      >
        <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <h5 className="subtitle fw-normal">Raise Feedback</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
            onClick={() => {
              document.querySelector("#categorySelect").value = "";
              document.querySelector("#complaintTypeSelect").value = "";
              document.querySelector("#travelDate").value = "";
              document.querySelector("#tripIdSelect").value = "";
              setFeedbackText("");
              setTravelDate("");
              setSelectedCategoryId(null);
              setIsRaiseFeedbackOpen(false);
              queryClient.invalidateQueries({ queryKey: myFeedbackKeys.all });
            }}
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body px-4">
          <div className="row">
            <div className="col-12 mb-3">
              <label className="form-label" htmlFor="categorySelect">
                Category
              </label>
              <select
                id="categorySelect"
                className="form-select"
                onChange={(e) => handleCategorySelect(e.target.value)}
              >
                <option value="">Please Select</option>
                {categoryDropDown.map((category, index) => (
                  //<option key={category.id} value={category.id}>
                  <option key={`${category.id}-${index}`} value={category.id}>
                    {category.Category}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 mb-3">
              <label className="form-label" htmlFor="complaintTypeSelect">
                Complaint Type
              </label>
              <select id="complaintTypeSelect" className="form-select">
                <option value="">Please Select</option>
                {complaintTypeDropDown.map((type, index) => (
                  //<option key={type.id} value={type.id}>
                  <option key={`${type.id}-${index}`} value={type.id}>
                    {type.CompName}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 mb-3">
              <label className="form-label" htmlFor="travelDate">
                Travel Date
              </label>
              <input
                type="date"
                id="travelDate"
                className="form-control"
                onChange={handleTravelDateChange}
              />
            </div>
            <div className="col-12 mb-3">
              <label className="form-label" htmlFor="tripIdSelect">
                Trip Id <em>(Optional)</em>
              </label>
              <select id="tripIdSelect" className="form-select" defaultValue="">
                <option value="">Please Select</option>
                {tripIdDropDown.map((trip, index) => (
                  <option key={`${trip.routeid}-${index}`} value={trip.routeid}>
                    {trip.RouteValue}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 mb-3">
              <label className="form-label" htmlFor="feedbackTextArea">
                Feedback
              </label>
              <textarea
                id="feedbackTextArea"
                className="form-control"
                rows="3"
                placeholder="Please Select"
                value={feedbackText} // Bind the textarea value to the state
                onChange={(e) => setFeedbackText(e.target.value)} // Update state on change
              ></textarea>
            </div>
          </div>
        </div>
        <div className="offcanvas-footer">
          <button
            className="btn btn-outline-secondary"
            data-bs-dismiss="offcanvas"
            onClick={() => {
              setTravelDate("");
              setSelectedCategoryId(null);
              setIsRaiseFeedbackOpen(false);
              queryClient.invalidateQueries({ queryKey: myFeedbackKeys.all });
            }}
          >
            Cancel
          </button>
          <button
            className="btn btn-success mx-3"
            onClick={handleSubmitFeedback}
          >
            Submit
          </button>
        </div>
      </div>
      {/* <!-- Raise Feedback Rightbar  --> */}
      {/* <!-- Ticket Number Rightbar  --> */}
      <div
        className="offcanvas offcanvas-end"
        tabIndex="-1"
        id="ticketNumber"
        aria-labelledby="offcanvasRightLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title subtitle_sm">
            <small className="overline_text d-block text-secondary">
              Ticket No. - {selectedTicket}
            </small>
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body">
          {ticketReplies.length > 0 ? (
            ticketReplies.map((reply, index) => (
              <div className="ticketBx" key={index}>
                <small>
                  {new Date(reply.UpdatedAt).toLocaleString()}
                  <span>
                    By {reply.empCode} - {reply.empName}
                  </span>
                </small>
                <p>{reply.Descp}</p>
              </div>
            ))
          ) : (
            // Show empty state when no replies
            <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center">
              <i
                className="pi pi-comments text-muted mb-3"
                style={{ fontSize: "3rem", opacity: 0.5 }}
              />
              <h6 className="text-muted mb-2">No replies were found.</h6>
              <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                This ticket has not received any replies yet.
              </p>
            </div>
          )}

        </div>
      </div>
      {/* <!-- Ticket Number Rightbar  -->*/}
      <Notifications />
    </div >
  );
};

export default MyFeedback;
