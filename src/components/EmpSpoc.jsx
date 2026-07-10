import React, { useState, useEffect } from "react";
import trashIcon from "../assets/trash-can-outline.png";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import MasterSidebar from "./Master/MasterSidebar";
import { CustomDataTable } from "./common/CustomDataTable";
import ResponsiveDataTable from "./common/ResponsiveDataTable";
import CustomPaginator from "./common/CustomPaginator";
import TabSwitcher from "./common/TabSwitcher";
import TableToolbar from "./common/TableToolbar";
import Loader from "./common/Loader";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import ReportButton from "./common/ReportButton";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import sessionManager from "../utils/SessionManager";
import { apiService } from "../services/api";
import EmpSpocService from "../services/compliance/EmpSpocService";
import { toastService } from "../services/toastService";
import {
    useSpocSearchQuery,
    useSpocTeamQuery,
    useBackupSpocQuery,
    useAssignEmpSearchQuery,
    useProcessByFacilityQuery,
    useEmpByProcessQuery,
    useAssignSpocMutation,
    useAssignBackupSpocMutation,
    useRemoveSpocMutation,
    useRemoveBackupSpocMutation,
    useAssignAllSpocMutation,
} from "../hooks/empSpocQueries";

const ASSIGN_TABS = [
    { label: "By Name / ID", value: "byName" },
    { label: "By Process", value: "byProcess" },
    { label: "Bulk IDs", value: "bulk" },
];

const SIDEBAR_TABS = [
    { label: "SPOC Team", value: "team" },
    { label: "Assign Employee", value: "assign" },
    { label: "Backup SPOC", value: "backup" },
];

const stripIds = (text) =>
    text
        .replace(/\r\n/g, ",")
        .replace(/\n/g, ",")
        .replace(/ /g, ",")
        .replace(/,+/g, ",")
        .replace(/;/g, ",")
        .replace(/'/g, ",")
        .trim()
        .replace(/^,|,$/g, "");

const EmpSpoc = () => {
    const session = sessionManager.getUserSession();
    const locationId = session.locationId;
    const isAdmin = session.ISadmin;
    const facilityId = session.FacilityID;
    const userId = session.ID;

    // --- Confirm modal state ---
    const [confirmModal, setConfirmModal] = useState({ open: false, message: "", onConfirm: null });
    const showConfirm = (message, onConfirm) => setConfirmModal({ open: true, message, onConfirm });
    const hideConfirm = () => setConfirmModal({ open: false, message: "", onConfirm: null });

    // --- Main search state ---
    const [spocInput, setSpocInput] = useState("");
    const [spocTerm, setSpocTerm] = useState("");
    const [spocEnabled, setSpocEnabled] = useState(false);
    const [spocFirst, setSpocFirst] = useState(0);
    const [spocRows, setSpocRows] = useState(20);

    // --- Sidebar state ---
    const [selectedSpoc, setSelectedSpoc] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarTab, setSidebarTab] = useState("team");

    // Team table pagination
    const [teamFirst, setTeamFirst] = useState(0);
    const [teamRows, setTeamRows] = useState(20);

    // Backup table pagination
    const [backupFirst, setBackupFirst] = useState(0);
    const [backupRows, setBackupRows] = useState(10);

    // Table search states (sidebar)
    const [teamSearch, setTeamSearch] = useState("");
    const [assignSearch, setAssignSearch] = useState("");
    const [backupSearch, setBackupSearch] = useState("");

    // Assign section state
    const [assignTab, setAssignTab] = useState("byName");
    const [assignInput, setAssignInput] = useState("");
    const [assignTerm, setAssignTerm] = useState("");
    const [assignEnabled, setAssignEnabled] = useState(false);
    const [selectedFacilityId, setSelectedFacilityId] = useState(null);
    const [selectedProcessId, setSelectedProcessId] = useState(null);
    const [processEmpEnabled, setProcessEmpEnabled] = useState(false);
    const [bulkInput, setBulkInput] = useState("");
    const [bulkIds, setBulkIds] = useState("");
    const [bulkEnabled, setBulkEnabled] = useState(false);
    const [assignFirst, setAssignFirst] = useState(0);
    const [assignRows, setAssignRows] = useState(20);

    // Facilities for "By Process" tab
    const [facilities, setFacilities] = useState([]);

    // --- Queries ---
    const spocSearchQuery = useSpocSearchQuery(locationId, spocTerm, isAdmin, spocEnabled);
    const spocTeamQuery = useSpocTeamQuery(selectedSpoc?.id);
    const backupSpocQuery = useBackupSpocQuery(selectedSpoc?.id);
    const assignEmpQuery = useAssignEmpSearchQuery(locationId, assignTerm, isAdmin, assignEnabled);
    const processByFacilityQuery = useProcessByFacilityQuery(selectedFacilityId);
    const empByProcessQuery = useEmpByProcessQuery(selectedProcessId || 0, "", locationId, processEmpEnabled);
    const empByBulkQuery = useEmpByProcessQuery(0, bulkIds, locationId, bulkEnabled);

    // --- Mutations ---
    const assignSpoc = useAssignSpocMutation();
    const assignBackupSpoc = useAssignBackupSpocMutation();
    const removeSpoc = useRemoveSpocMutation();
    const removeBackupSpoc = useRemoveBackupSpocMutation();
    const assignAllSpoc = useAssignAllSpocMutation();

    // Fetch facilities once when sidebar opens
    useEffect(() => {
        if (sidebarOpen && facilities.length === 0) {
            apiService.SelectFacility({ Userid: userId })
                .then(data => setFacilities(Array.isArray(data) ? data : []))
                .catch(() => {});
        }
    }, [sidebarOpen]);

    // Reset assign section when sidebar closes
    useEffect(() => {
        if (!sidebarOpen) {
            setSidebarTab("team");
            setAssignTab("byName");
            setTeamSearch("");
            setAssignSearch("");
            setBackupSearch("");
            setAssignInput("");
            setAssignTerm("");
            setAssignEnabled(false);
            setSelectedFacilityId(null);
            setSelectedProcessId(null);
            setProcessEmpEnabled(false);
            setBulkInput("");
            setBulkIds("");
            setBulkEnabled(false);
            setAssignFirst(0);
            setTeamFirst(0);
            setBackupFirst(0);
        }
    }, [sidebarOpen]);

    // --- Handlers ---
    const handleSpocSearch = () => {
        if (!spocInput.trim()) {
            toastService.warn("Please enter a SPOC ID or Name.");
            return;
        }
        setSpocTerm(spocInput.trim());
        setSpocEnabled(true);
        setSpocFirst(0);
    };

    const handleViewDetails = (row) => {
        setSelectedSpoc(row);
        setSidebarTab("team");
        setSidebarOpen(true);
    };

    const handleFacilityChange = (facId) => {
        setSelectedFacilityId(facId);
        setSelectedProcessId(null);
        setProcessEmpEnabled(false);
        setAssignFirst(0);
    };

    const handleProcessChange = (procId) => {
        setSelectedProcessId(procId);
        setProcessEmpEnabled(true);
        setAssignFirst(0);
    };

    const handleAssignSearch = () => {
        if (!assignInput.trim()) {
            toastService.warn("Please enter an Employee ID or Name.");
            return;
        }
        setAssignTerm(assignInput.trim());
        setAssignEnabled(true);
        setAssignFirst(0);
    };

    const handleBulkSearch = () => {
        const stripped = stripIds(bulkInput);
        if (!stripped) {
            toastService.warn("Please enter at least one Employee ID.");
            return;
        }
        setBulkIds(stripped);
        setBulkEnabled(true);
        setAssignFirst(0);
    };

    const handleAssign = (row) => {
        assignSpoc.mutate({ spocid: selectedSpoc.id, empid: row.Id || row.id });
    };

    const handleAssignBackup = (row) => {
        assignBackupSpoc.mutate({
            SpocID: selectedSpoc.id,
            BackupSpocId: row.Id || row.id,
            CreatedBy: userId,
        });
    };

    const handleRemove = (row) => {
        if (!window.confirm("Are you sure you want to remove this employee?")) return;
        removeSpoc.mutate({ SpocID: row.spocId, EmployeeId: row.id, EmpIds: "" });
    };

    const handleRemoveAll = () => {
        const team = spocTeamQuery.data || [];
        if (team.length === 0) return;
        if (!window.confirm("Are you sure you want to remove all team members?")) return;
        const empIds = team.map(r => r.id).join(",");
        removeSpoc.mutate({ SpocID: selectedSpoc.id, EmployeeId: 0, EmpIds: empIds });
    };

    const handleRemoveBackup = (row) => {
        if (!window.confirm("Are you sure you want to remove this backup SPOC?")) return;
        removeBackupSpoc.mutate({ SpocId: row.spocId, BackupSpocId: row.id });
    };

    const handleAssignAll = () => {
        if (!selectedSpoc) return;
        if (assignTab === "byProcess") {
            const empIds = assignResults
                .map(e => e.Id || e.id)
                .filter(Boolean)
                .join(",");
            assignAllSpoc.mutate({
                ProcessId: selectedProcessId || 0,
                SpocId: selectedSpoc.id,
                LocationId: Number(locationId),
                EmpIDs: empIds,
            });
        } else if (assignTab === "bulk") {
            assignAllSpoc.mutate({
                ProcessId: 0,
                SpocId: selectedSpoc.id,
                LocationId: Number(locationId),
                EmpIDs: bulkIds,
            });
        }
    };

    // --- Export handlers ---
    const exportToExcel = (data, filename, sheetName) => {
        const rows = typeof data === "string" ? JSON.parse(data) : data;
        const ws = XLSX.utils.json_to_sheet(Array.isArray(rows) ? rows : []);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        saveAs(
            new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }),
            filename
        );
    };

    const handleSpocExport = async () => {
        try {
            const data = await EmpSpocService.GetSpocDump({ FacId: facilityId });
            exportToExcel(data, "SpocDump.xlsx", "SpocDump");
        } catch {
            toastService.error("Spoc export failed.");
        }
    };

    const handleBackupSpocExport = async () => {
        try {
            const data = await EmpSpocService.GetBackupSpocDump({ FacId: facilityId });
            exportToExcel(data, "BackupSpocDump.xlsx", "BackupSpocDump");
        } catch {
            toastService.error("Backup SPOC export failed.");
        }
    };

    // --- Derived data ---
    const assignResults =
        assignTab === "byName" ? (assignEmpQuery.data || []) :
        assignTab === "byProcess" ? (empByProcessQuery.data || []) :
        (empByBulkQuery.data || []);

    const assignLoading =
        assignTab === "byName" ? assignEmpQuery.isFetching :
        assignTab === "byProcess" ? empByProcessQuery.isFetching :
        empByBulkQuery.isFetching;

    const showAssignAll = assignTab !== "byName" && assignResults.length > 0;

    const facilityOptions = facilities.map(f => ({ label: f.facilityName || f.FacilityName, value: f.Id }));
    const processOptions = (processByFacilityQuery.data || []).map(p => ({ label: p.processName || p.ProcessName, value: p.Id || p.processId }));

    const filterBySearch = (arr, search) => {
        if (!search) return arr;
        const s = search.toLowerCase();
        return arr.filter(r => Object.values(r).some(v => String(v ?? "").toLowerCase().includes(s)));
    };

    // Paginated slices
    const spocData = spocSearchQuery.data || [];
    const pagedSpoc = spocData.slice(spocFirst, spocFirst + spocRows);

    const teamData = spocTeamQuery.data || [];
    const filteredTeam = filterBySearch(teamData, teamSearch);
    const pagedTeam = filteredTeam.slice(teamFirst, teamFirst + teamRows);

    const backupData = backupSpocQuery.data || [];
    const filteredBackup = filterBySearch(backupData, backupSearch);
    const pagedBackup = filteredBackup.slice(backupFirst, backupFirst + backupRows);

    const filteredAssign = filterBySearch(assignResults, assignSearch);
    const pagedAssign = filteredAssign.slice(assignFirst, assignFirst + assignRows);

    // --- Column body templates ---
    const removeTemplate = (row) => (
        <button
            className="btn btn-link p-0 border-0"
            onClick={() => handleRemove(row)}
            disabled={removeSpoc.isPending}
            title="Remove"
        >
            <img src={trashIcon} alt="Remove" style={{ width: 18, height: 18, opacity: removeSpoc.isPending ? 0.4 : 1 }} />
        </button>
    );

    const removeBackupTemplate = (row) => (
        <button
            className="btn btn-link p-0 border-0"
            onClick={() => handleRemoveBackup(row)}
            disabled={removeBackupSpoc.isPending}
            title="Remove"
        >
            <img src={trashIcon} alt="Remove" style={{ width: 18, height: 18, opacity: removeBackupSpoc.isPending ? 0.4 : 1 }} />
        </button>
    );

    const assignActionsTemplate = (row) => (
        <div className="d-flex gap-1 flex-nowrap">
            <button
                className="btn btn-sm btn-outline-success rounded-pill"
                onClick={() => handleAssign(row)}
                disabled={assignSpoc.isPending}
                style={{ whiteSpace: "nowrap" }}
            >
                Assign
            </button>
            <button
                className="btn btn-sm btn-outline-warning rounded-pill"
                onClick={() => handleAssignBackup(row)}
                disabled={assignBackupSpoc.isPending}
                style={{ whiteSpace: "nowrap" }}
            >
                Assign Backup
            </button>
        </div>
    );

    return (
        <>
            <Header pageTitle="Manage SPOC" />
            <Sidebar />

            <div className="middle">
                <div className="row">
                    <div className="col-12">
                        <h6 className="pageTitle">Manage SPOC</h6>
                    </div>

                    {/* Search + Export card */}
                    <div className="col-12 mb-3">
                        <div className="card_tb p-3">
                            <div className="row g-2 align-items-end">
                                <div className="col-12 col-sm-6 col-md-5 col-lg-4">
                                    <label htmlFor="spocSearch" className="form-label">
                                        Enter SPOC ID or Name <span className="text-danger">*</span>
                                    </label>
                                    <InputText
                                        id="spocSearch"
                                        value={spocInput}
                                        onChange={e => setSpocInput(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && handleSpocSearch()}
                                        placeholder="Search by ID or Name"
                                        className="w-100"
                                        maxLength={100}
                                    />
                                </div>
                                <div className="col-12 col-sm-6 col-md-3 col-lg-2 d-flex align-items-end">
                                    <ReportButton
                                        label="Search"
                                        icon="pi pi-search"
                                        onClick={handleSpocSearch}
                                        disabled={spocSearchQuery.isFetching}
                                    />
                                </div>
                                <div className="col-12 col-md-4 col-lg-6 d-flex align-items-end justify-content-md-end gap-2 flex-wrap">
                                    <ReportButton
                                        label="Spoc Data Export"
                                        icon="pi pi-download"
                                        onClick={handleSpocExport}
                                        fullWidth={false}
                                    />
                                    <ReportButton
                                        label="Backup Spoc Export"
                                        icon="pi pi-download"
                                        onClick={handleBackupSpocExport}
                                        fullWidth={false}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SPOC results table */}
                    {spocEnabled && (
                        <div className="col-12">
                            <div className="card_tb p-0 overflow-hidden">
                                {spocSearchQuery.isFetching ? (
                                    <Loader />
                                ) : (
                                    <>
                                        <ResponsiveDataTable
                                            value={pagedSpoc}
                                            emptyMessage="No records found."
                                        >
                                            <Column
                                                header="Employee Code"
                                                mobile={{ subtitle: true }}
                                                body={(row) => (
                                                    <a
                                                        href="#!"
                                                        className="text-primary fw-semibold text-decoration-none"
                                                        onClick={(e) => { e.preventDefault(); handleViewDetails(row); }}
                                                    >
                                                        {row.empCode}
                                                    </a>
                                                )}
                                            />
                                            <Column field="empName" header="Employee Name" mobile={{ primary: true }} />
                                            <Column field="managerId" header="Manager ID" mobile={{ hidden: true }} />
                                            <Column field="processName" header="Process" />
                                            <Column field="facilityName" header="Facility" />
                                        </ResponsiveDataTable>
                                        <CustomPaginator
                                            first={spocFirst}
                                            rows={spocRows}
                                            totalRecords={spocData.length}
                                            onPageChange={e => { setSpocFirst(e.first); setSpocRows(e.rows); }}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* SPOC Detail Sidebar */}
            <MasterSidebar
                show={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                title={selectedSpoc ? `${selectedSpoc.empName} (${selectedSpoc.empCode})` : "Manage SPOC"}
                width="75vw"
                headerBgColor="bg-secondary"
                headerTextColor="text-white"
            >
                {selectedSpoc && (
                    <div className="d-flex flex-column h-100">
                        {/* Sidebar top-level tab bar */}
                        <div className="px-3 pt-2 pb-1 border-bottom">
                            <TabSwitcher
                                tabs={SIDEBAR_TABS}
                                activeTab={sidebarTab}
                                onTabChange={tab => setSidebarTab(tab)}
                            />
                        </div>

                        <div className="px-3 pt-2 pb-5 flex-grow-1 overflow-auto">

                            {/* ── Tab: SPOC Team ── */}
                            {sidebarTab === "team" && (
                                <div className="card_tb overflow-hidden">
                                    <div className="px-3 pt-3 pb-0">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            {teamData.length > 0 && (
                                                <button
                                                    className="btn btn-sm btn-outline-danger rounded-pill"
                                                    onClick={handleRemoveAll}
                                                    disabled={removeSpoc.isPending}
                                                    style={{ whiteSpace: "nowrap" }}
                                                >
                                                    Remove All
                                                </button>
                                            )}
                                            <div className="flex-grow-1">
                                                <TableToolbar
                                                    search={teamSearch}
                                                    onSearch={e => { setTeamSearch(e.target.value); setTeamFirst(0); }}
                                                    onRefresh={() => spocTeamQuery.refetch()}
                                                    showFilter={false}
                                                    showExport={false}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {spocTeamQuery.isFetching ? <Loader /> : (
                                        <>
                                            <ResponsiveDataTable value={pagedTeam} emptyMessage="No employees assigned to this SPOC.">
                                                <Column field="empCode" header="Employee Id" mobile={{ primary: true }} />
                                                <Column field="empName" header="Employee Name" mobile={{ subtitle: true }} />
                                                <Column field="processName" header="Process" mobile={{ hidden: true }} />
                                                <Column field="facilityName" header="Facility" mobile={{ hidden: true }} />
                                                <Column header="Actions" body={removeTemplate} mobile={{ action: true }} style={{ width: "60px", textAlign: "center" }} />
                                            </ResponsiveDataTable>
                                            <CustomPaginator
                                                first={teamFirst}
                                                rows={teamRows}
                                                totalRecords={filteredTeam.length}
                                                onPageChange={e => { setTeamFirst(e.first); setTeamRows(e.rows); }}
                                            />
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ── Tab: Assign Employee ── */}
                            {sidebarTab === "assign" && (
                                <>
                                    <div className="mb-3">
                                        <TabSwitcher
                                            tabs={ASSIGN_TABS}
                                            activeTab={assignTab}
                                            onTabChange={tab => { setAssignTab(tab); setAssignFirst(0); }}
                                            size="small"
                                        />
                                    </div>

                                    {/* By Name */}
                                    {assignTab === "byName" && (
                                        <div className="row g-2 align-items-end mb-3">
                                            <div className="col">
                                                <label className="form-label">
                                                    Employee ID or Name <span className="text-danger">*</span>
                                                </label>
                                                <InputText
                                                    value={assignInput}
                                                    onChange={e => setAssignInput(e.target.value)}
                                                    onKeyDown={e => e.key === "Enter" && handleAssignSearch()}
                                                    placeholder="Search by ID or Name"
                                                    className="w-100"
                                                />
                                            </div>
                                            <div className="col-auto d-flex align-items-end">
                                                <ReportButton
                                                    label="Search"
                                                    icon="pi pi-search"
                                                    onClick={handleAssignSearch}
                                                    disabled={assignEmpQuery.isFetching}
                                                    fullWidth={false}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* By Process */}
                                    {assignTab === "byProcess" && (
                                        <div className="row g-2 mb-3">
                                            <div className="col-12 col-sm-6">
                                                <label className="form-label">Select Facility</label>
                                                <Dropdown
                                                    value={selectedFacilityId}
                                                    options={facilityOptions}
                                                    onChange={e => handleFacilityChange(e.value)}
                                                    placeholder="Select Facility"
                                                    className="w-100"
                                                    filter
                                                />
                                            </div>
                                            <div className="col-12 col-sm-6">
                                                <label className="form-label">Select Process</label>
                                                <Dropdown
                                                    value={selectedProcessId}
                                                    options={processOptions}
                                                    onChange={e => handleProcessChange(e.value)}
                                                    placeholder={processByFacilityQuery.isFetching ? "Loading..." : "Select Process"}
                                                    className="w-100"
                                                    disabled={!selectedFacilityId || processByFacilityQuery.isFetching}
                                                    filter
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Bulk IDs */}
                                    {assignTab === "bulk" && (
                                        <div className="row g-2 align-items-end mb-3">
                                            <div className="col-12">
                                                <label className="form-label">
                                                    Enter Employee IDs <span className="text-danger">*</span>
                                                </label>
                                                <InputTextarea
                                                    value={bulkInput}
                                                    onChange={e => setBulkInput(e.target.value)}
                                                    placeholder="Comma, semicolon, or newline separated IDs"
                                                    rows={4}
                                                    className="w-100"
                                                />
                                            </div>
                                            <div className="col-12 col-sm-auto">
                                                <ReportButton
                                                    label="Search"
                                                    icon="pi pi-search"
                                                    onClick={handleBulkSearch}
                                                    disabled={empByBulkQuery.isFetching}
                                                    fullWidth={false}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="card_tb overflow-hidden">
                                        <div className="px-3 pt-3 pb-0">
                                            <div className="d-flex align-items-center gap-2">
                                                {showAssignAll && (
                                                    <button
                                                        className="btn btn-sm btn-outline-success rounded-pill"
                                                        onClick={handleAssignAll}
                                                        disabled={assignAllSpoc.isPending}
                                                        style={{ whiteSpace: "nowrap" }}
                                                    >
                                                        {assignAllSpoc.isPending ? "Assigning..." : "Assign All"}
                                                    </button>
                                                )}
                                                <div className="flex-grow-1">
                                                    <TableToolbar
                                                        search={assignSearch}
                                                        onSearch={e => { setAssignSearch(e.target.value); setAssignFirst(0); }}
                                                        showFilter={false}
                                                        showExport={false}
                                                        showRefresh={false}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        {assignLoading ? <Loader /> : (
                                            <>
                                                <ResponsiveDataTable value={pagedAssign} emptyMessage="No employees found.">
                                                    <Column field="empCode" header="Employee Id" mobile={{ primary: true }} />
                                                    <Column field="empName" header="Employee Name" mobile={{ subtitle: true }} />
                                                    <Column field="processName" header="Process" mobile={{ hidden: true }} />
                                                    <Column field="facilityName" header="Facility" mobile={{ hidden: true }} />
                                                    <Column field="email" header="E-mail" mobile={{ hidden: true }} />
                                                    <Column header="Actions" body={assignActionsTemplate} mobile={{ action: true }} style={{ width: "175px" }} />
                                                </ResponsiveDataTable>
                                                <CustomPaginator
                                                    first={assignFirst}
                                                    rows={assignRows}
                                                    totalRecords={filteredAssign.length}
                                                    onPageChange={e => { setAssignFirst(e.first); setAssignRows(e.rows); }}
                                                />
                                            </>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* ── Tab: Backup SPOC ── */}
                            {sidebarTab === "backup" && (
                                <div className="card_tb overflow-hidden">
                                    <div className="px-3 pt-3 pb-0">
                                        <TableToolbar
                                            search={backupSearch}
                                            onSearch={e => { setBackupSearch(e.target.value); setBackupFirst(0); }}
                                            onRefresh={() => backupSpocQuery.refetch()}
                                            showFilter={false}
                                            showExport={false}
                                        />
                                    </div>
                                    {backupSpocQuery.isFetching ? <Loader /> : (
                                        <>
                                            <ResponsiveDataTable value={pagedBackup} emptyMessage="No backup SPOC assigned.">
                                                <Column field="empCode" header="Employee Id" mobile={{ primary: true }} />
                                                <Column field="empName" header="Employee Name" mobile={{ subtitle: true }} />
                                                <Column field="processName" header="Process" mobile={{ hidden: true }} />
                                                <Column field="facilityName" header="Facility" mobile={{ hidden: true }} />
                                                <Column header="Actions" body={removeBackupTemplate} mobile={{ action: true }} style={{ width: "60px", textAlign: "center" }} />
                                            </ResponsiveDataTable>
                                            <CustomPaginator
                                                first={backupFirst}
                                                rows={backupRows}
                                                totalRecords={filteredBackup.length}
                                                onPageChange={e => { setBackupFirst(e.first); setBackupRows(e.rows); }}
                                            />
                                        </>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </MasterSidebar>
        </>
    );
};

export default EmpSpoc;
