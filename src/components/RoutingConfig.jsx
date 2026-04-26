import React, { useState } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import TabSwitcher from "./common/TabSwitcher";
import ReportButton from "./common/ReportButton";
import { ToastContainer } from "react-toastify";
import { toastService } from "../services/toastService";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";

// ─── Constants ───────────────────────────────────────────────────────────────

const FACILITIES = [
    { label: "GGN – Gurugram", value: "GGN" },
    { label: "DEL – Delhi", value: "DEL" },
    { label: "BLR – Bengaluru", value: "BLR" },
    { label: "CHN – Chennai", value: "CHN" },
];

const PROFILE_TYPES = [
    { label: "Peak Shift Profile (Weekday)", value: "peak_weekday" },
    { label: "Lean Shift Profile (Weekday)", value: "lean_weekday" },
    { label: "Weekend Profile", value: "weekend" },
];

const CITY_OPTIONS = [
    { label: "Delhi / NCR", value: "delhi" },
    { label: "Bengaluru", value: "bengaluru" },
    { label: "Chennai", value: "chennai" },
];

const TRIP_TYPE_OPTIONS = [
    { label: "Pickup", value: "PICKUP" },
    { label: "Drop", value: "DROP" },
];

const DEFAULT_DEVIATION_RULES = [
    { minDistKm: 0,  maxDistKm: 5,   maxTotalOneWayKm: 9.5  },
    { minDistKm: 5,  maxDistKm: 10,  maxTotalOneWayKm: 18.0 },
    { minDistKm: 10, maxDistKm: 15,  maxTotalOneWayKm: 25.5 },
    { minDistKm: 15, maxDistKm: 20,  maxTotalOneWayKm: 32.0 },
    { minDistKm: 20, maxDistKm: 25,  maxTotalOneWayKm: 37.5 },
    { minDistKm: 25, maxDistKm: 30,  maxTotalOneWayKm: 42.0 },
    { minDistKm: 30, maxDistKm: 40,  maxTotalOneWayKm: 52.0 },
    { minDistKm: 40, maxDistKm: 50,  maxTotalOneWayKm: 62.5 },
    { minDistKm: 50, maxDistKm: 100, maxTotalOneWayKm: 96.0 },
];

const VEHICLE_TYPES = [
    { label: "s – Small", value: "s" },
    { label: "m – Medium", value: "m" },
    { label: "l – Large", value: "l" },
    { label: "xl – Extra Large", value: "xl" },
];

const CONFIG_TABS = [
    { label: "General", value: "general" },
    { label: "Deviation", value: "fleet" },
    { label: "Route Building", value: "heuristics" },
    { label: "Optimization", value: "optimization" },
];

// ─── Default Profiles ────────────────────────────────────────────────────────

const buildDefault = (overrides = {}) => ({
    // Top-level runtime fields
    guard: true,
    pickupTimePerEmployee: 3,     // minutes (API = seconds × 60)
    reportingTime: 30,            // minutes
    tripType: "PICKUP",
    // profile.name (city key for routing engine)
    name: "delhi",
    // Zone strategy
    zoneBasedRouting: true,
    zoneClubbing: false,
    LargeCapacityZones: [],
    MediumCapacityZones: [],
    SmallCapacityZones: [],
    zonePairingMatrixRaw: "{}",    // JSON text for the pairing matrix
    // Duration & deviation
    maxDuration: 120,              // minutes
    deviationRules: JSON.parse(JSON.stringify(DEFAULT_DEVIATION_RULES)),
    // Fleet
    fleet: [
        { type: "s", capacity: 4,  count: 100 },
        { type: "m", capacity: 6,  count: 40  },
        { type: "l", capacity: 12, count: 15  },
    ],
    // Heuristic batching
    heuristicMaxStopDistance: 4.0,
    heuristicLinearTolerance: 75,
    heuristicDirectionPenaltyWeight: 5.0,
    heuristicCandidatePoolSize: 6,
    heuristicOsrmEvaluationTopK: 3,
    heuristicBearingPenaltyWeight: 1.5,
    heuristicFacilityOrderPenaltyWeight: 4.0,
    heuristicDistanceSpreadPenaltyWeight: 0.8,
    heuristicDurationWeight: 0.0025,
    // Consolidation
    enableRouteConsolidation: true,
    consolidationMaxInsertionDistanceKm: 5,
    consolidationLowOccupancyThreshold: 2,
    consolidationMinHostOccupancy: 1,
    consolidationLinearTolerance: 90,
    enableBidirectionalConsolidation: true,
    // Singleton
    singletonAggregationRadius: 6,
    singletonMaxClusterSize: 4,
    // Cross-route
    enableCrossRouteOptimization: true,
    crossRouteMaxIterations: 4,
    crossRouteMaxDetourKm: 4.5,
    crossRouteMaxDetourRatio: 1.2,
    crossRouteMaxHeadingDeviationDeg: 100,
    crossRouteMonotonicitySlackKm: 1.8,
    crossRouteCorridorRadiusKm: 5.0,
    crossRouteTopHostCandidates: 5,
    crossRouteMaxOsrmChecksPerIteration: 250,
    crossRouteRouteReductionBonusKm: 2.0,
    crossRouteOccupancyBonusKm: 0.8,
    crossRoutePassengerBurdenWeight: 0.35,
    crossRouteMinNetGainKm: -0.2,
    crossRouteCandidateEmployeesPerRoute: 6,
    // Local sequence
    enableLocalSequenceOptimization: true,
    localSequenceMaxIterations: 3,
    localSequenceDirectionPenaltyWeight: 4.0,
    localSequencePassengerBurdenWeight: 0.25,
    localSequenceMonotonicSlackKm: 1.5,
    ...overrides,
});

const DEFAULT_CONFIGS = {
    peak_weekday: buildDefault({
        guard: true, pickupTimePerEmployee: 3, reportingTime: 30, maxDuration: 120,
        zoneBasedRouting: true, zoneClubbing: false,
        fleet: [{ type: "s", capacity: 4, count: 100 }, { type: "m", capacity: 6, count: 40 }, { type: "l", capacity: 12, count: 15 }],
    }),
    lean_weekday: buildDefault({
        guard: false, pickupTimePerEmployee: 2, reportingTime: 15, maxDuration: 150,
        zoneBasedRouting: true, zoneClubbing: true,
        heuristicMaxStopDistance: 5.0, heuristicLinearTolerance: 80,
        singletonAggregationRadius: 8, singletonMaxClusterSize: 6,
        consolidationLowOccupancyThreshold: 3, consolidationMaxInsertionDistanceKm: 6,
        crossRouteMaxDetourKm: 5.5, crossRouteCorridorRadiusKm: 6.0,
        fleet: [{ type: "s", capacity: 4, count: 80 }, { type: "m", capacity: 6, count: 30 }],
    }),
    weekend: buildDefault({
        guard: false, pickupTimePerEmployee: 2, reportingTime: 0, maxDuration: 180,
        zoneBasedRouting: false, zoneClubbing: false,
        enableCrossRouteOptimization: false,
        heuristicMaxStopDistance: 6.0, heuristicLinearTolerance: 85,
        singletonAggregationRadius: 10, singletonMaxClusterSize: 6,
        consolidationLowOccupancyThreshold: 3, consolidationMaxInsertionDistanceKm: 7,
        fleet: [{ type: "s", capacity: 4, count: 50 }, { type: "m", capacity: 6, count: 20 }],
    }),
};

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

const LS_VERSION = "v2";
const lsKey = (fac, prof) => `routingConfig__${LS_VERSION}__${fac}__${prof}`;

const loadConfig = (fac, prof) => {
    try {
        const raw = localStorage.getItem(lsKey(fac, prof));
        if (raw) return JSON.parse(raw);
    } catch {}
    return JSON.parse(JSON.stringify(DEFAULT_CONFIGS[prof]));
};

const saveConfig = (fac, prof, cfg) => {
    localStorage.setItem(lsKey(fac, prof), JSON.stringify(cfg));
};

// ─── Small UI helpers ─────────────────────────────────────────────────────────

const SectionTitle = ({ title, subtitle }) => (
    <div className="mb-4">
        <h6 className="fw-semibold mb-1" style={{ color: "#1C1D20", fontSize: "0.92rem" }}>{title}</h6>
        {subtitle && <small className="text-muted d-block mb-2">{subtitle}</small>}
        <hr className="mt-0 mb-0" style={{ borderColor: "#e5e7eb" }} />
    </div>
);

const FieldRow = ({ label, hint, children, col = "col-12 col-sm-6 col-md-4 col-lg-3" }) => (
    <div className={col}>
        <label className="form-label" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151" }}>
            {label}
        </label>
        {children}
        {hint && <div className="form-text" style={{ fontSize: "0.72rem" }}>{hint}</div>}
    </div>
);

const NumInput = ({ value, onChange, min, max, step = 0.1 }) => (
    <input
        type="number"
        className="form-control form-control-sm"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(e.target.value === "" ? "" : Number(e.target.value))}
    />
);

const Toggle = ({ checked, onChange, label }) => (
    <div className="form-check form-switch mt-1">
        <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            checked={!!checked}
            onChange={e => onChange(e.target.checked)}
            style={{ cursor: "pointer" }}
        />
        {label && <label className="form-check-label" style={{ fontSize: "0.82rem" }}>{label}</label>}
    </div>
);

// Tag input for zone name lists
const ZoneTagInput = ({ values, onChange, placeholder }) => {
    const [input, setInput] = useState("");
    const add = () => {
        const v = input.trim();
        if (v && !values.includes(v)) onChange([...values, v]);
        setInput("");
    };
    return (
        <div>
            <div className="d-flex flex-wrap gap-1 mb-1">
                {values.map(z => (
                    <span key={z} className="badge rounded-pill fw-normal d-inline-flex align-items-center gap-1"
                        style={{ background: "#e0e7ff", color: "#3730a3", fontSize: "0.75rem" }}>
                        {z}
                        <button type="button" className="btn-close btn-close-sm ms-1"
                            style={{ fontSize: "0.55rem" }}
                            onClick={() => onChange(values.filter(x => x !== z))} />
                    </span>
                ))}
            </div>
            <div className="input-group input-group-sm">
                <input className="form-control form-control-sm" placeholder={placeholder}
                    value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())} />
                <button className="btn btn-outline-secondary btn-sm" type="button" onClick={add}>Add</button>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const RoutingConfig = () => {
    const [facility, setFacility] = useState(null);
    const [profileType, setProfileType] = useState(null);
    const [config, setConfig] = useState(null);
    const [activeTab, setActiveTab] = useState("general");
    const [zoneTagInput, setZoneTagInput] = useState("");
    const [newFleetRow, setNewFleetRow] = useState({ type: "s", capacity: 4, count: 10 });
    const [confirmModal, setConfirmModal] = useState({ open: false, message: "", onConfirm: null });

    const set = (key, val) => setConfig(prev => ({ ...prev, [key]: val }));

    const showConfirm = (message, onConfirm) => setConfirmModal({ open: true, message, onConfirm });
    const hideConfirm = () => setConfirmModal({ open: false, message: "", onConfirm: null });

    const handleLoad = () => {
        if (!facility) { toastService.warn("Please select a facility."); return; }
        if (!profileType) { toastService.warn("Please select a profile."); return; }
        const cfg = loadConfig(facility, profileType);
        setConfig(cfg);
        setActiveTab("general");
        toastService.success("Profile loaded.");
    };

    const handleSave = () => {
        if (!config) return;
        showConfirm("Are you sure you want to save this profile? This will overwrite the saved configuration for the selected facility and profile.", () => {
            saveConfig(facility, profileType, config);
            toastService.success("Profile saved.");
        });
    };

    const handleReset = () => {
        if (!profileType) return;
        showConfirm("Are you sure you want to reset to defaults? All unsaved changes will be lost.", () => {
            const fresh = JSON.parse(JSON.stringify(DEFAULT_CONFIGS[profileType]));
            setConfig(fresh);
            toastService.info("Reset to defaults.");
        });
    };

    // Fleet helpers
    const updateFleetRow = (idx, field, val) => {
        const updated = config.fleet.map((r, i) => i === idx ? { ...r, [field]: field === "type" ? val : Number(val) } : r);
        set("fleet", updated);
    };
    const removeFleetRow = (idx) => set("fleet", config.fleet.filter((_, i) => i !== idx));
    const addFleetRow = () => {
        set("fleet", [...config.fleet, { ...newFleetRow }]);
        setNewFleetRow({ type: "s", capacity: 4, count: 10 });
    };

    // Deviation rule helpers
    const updateDevRule = (idx, field, val) => {
        const updated = config.deviationRules.map((r, i) => i === idx ? { ...r, [field]: Number(val) } : r);
        set("deviationRules", updated);
    };
    const removeDevRule = (idx) => set("deviationRules", config.deviationRules.filter((_, i) => i !== idx));
    const addDevRule = () => set("deviationRules", [...config.deviationRules, { minDistKm: 0, maxDistKm: 10, maxTotalOneWayKm: 16 }]);

    // ── Tab: General ─────────────────────────────────────────────────────────

    const renderGeneral = () => (
        <div className="card_tb p-4">
            <SectionTitle title="Shift & Trip Settings" subtitle="Top-level parameters sent with every route-generation request" />
            <div className="row gx-4 gy-3">
                <FieldRow label="Routing City" hint="Maps to profile.name — selects the city routing rules">
                    <Dropdown value={config.name} options={CITY_OPTIONS}
                        onChange={e => set("name", e.value)} className="w-100 p-inputtext-sm" />
                </FieldRow>
                <FieldRow label="Trip Type" hint="Controls pickup vs drop direction, ordering, and optimization">
                    <Dropdown value={config.tripType} options={TRIP_TYPE_OPTIONS}
                        onChange={e => set("tripType", e.value)} className="w-100 p-inputtext-sm" />
                </FieldRow>
                <FieldRow label="Wait Time per Stop (min)"
                    hint="Per-stop service time (pickupTimePerEmployee). API expects seconds.">
                    <NumInput value={config.pickupTimePerEmployee} min={0} max={30} step={1}
                        onChange={v => set("pickupTimePerEmployee", v)} />
                </FieldRow>
                <FieldRow label="Reporting Time (min)"
                    hint="Extra offset used in pickup-time scheduling (reportingTime)">
                    <NumInput value={config.reportingTime} min={0} max={120} step={5}
                        onChange={v => set("reportingTime", v)} />
                </FieldRow>
                <FieldRow label="Max Duration of Trip (min)"
                    hint="Route duration ceiling — routes above this are rejected (maxDuration)">
                    <NumInput value={config.maxDuration} min={30} max={480} step={10}
                        onChange={v => set("maxDuration", v)} />
                </FieldRow>
                <FieldRow label="Guard Required"
                    hint="Master switch — a guard is added when the critical employee position is female">
                    <Toggle checked={config.guard} onChange={v => set("guard", v)} />
                </FieldRow>
            </div>
        </div>
    );

    // ── Tab: Fleet & Deviation ───────────────────────────────────────────────

    const renderFleet = () => (
        <div className="card_tb p-4">
                <SectionTitle title="Route Deviation Rules"
                    subtitle="Rejects routes whose total one-way length exceeds the band limit for the farthest employee" />
                <div className="table-responsive">
                    <table className="table table-sm table-bordered align-middle mb-2"
                        style={{ fontSize: "0.83rem" }}>
                        <thead className="table-light">
                            <tr>
                                <th>Min Dist (km)</th>
                                <th>Max Dist (km)</th>
                                <th>Max Route Length (km)</th>
                                <th style={{ width: 60 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {config.deviationRules.map((rule, idx) => (
                                <tr key={idx}>
                                    {["minDistKm", "maxDistKm", "maxTotalOneWayKm"].map(field => (
                                        <td key={field}>
                                            <input type="number" className="form-control form-control-sm"
                                                value={rule[field]} min={0} step={0.5}
                                                onChange={e => updateDevRule(idx, field, e.target.value)} />
                                        </td>
                                    ))}
                                    <td className="text-center">
                                        <button className="btn btn-link btn-sm text-danger p-0"
                                            onClick={() => removeDevRule(idx)}>
                                            <i className="pi pi-trash" style={{ fontSize: "0.85rem" }} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                    onClick={addDevRule}>+ Add Band</button>
        </div>
    );

    // ── Tab: Route Building (Heuristics) ─────────────────────────────────────

    const renderHeuristics = () => (
        <div className="card_tb p-4">
            <SectionTitle title="Heuristic Batching Controls"
                subtitle="Parameters governing how the initial route groups are built before OR-Tools optimization" />
            <div className="row gx-4 gy-3">
                <FieldRow label="Max Stop Distance (km)"
                    hint="Max allowed distance between the last stop and the next candidate during route growth">
                    <NumInput value={config.heuristicMaxStopDistance} min={0.5} max={20} step={0.5}
                        onChange={v => set("heuristicMaxStopDistance", v)} />
                </FieldRow>
                <FieldRow label="Linear Tolerance (°)"
                    hint="Angular tolerance for the 'keep moving in a linear direction' check">
                    <NumInput value={config.heuristicLinearTolerance} min={10} max={180} step={5}
                        onChange={v => set("heuristicLinearTolerance", v)} />
                </FieldRow>
                <FieldRow label="Direction Penalty Weight"
                    hint="Penalty for candidates moving the route in the wrong direction">
                    <NumInput value={config.heuristicDirectionPenaltyWeight} min={0} max={20} step={0.5}
                        onChange={v => set("heuristicDirectionPenaltyWeight", v)} />
                </FieldRow>
                <FieldRow label="Candidate Pool Size"
                    hint="Number of top candidates shortlisted before OSRM evaluation">
                    <NumInput value={config.heuristicCandidatePoolSize} min={1} max={20} step={1}
                        onChange={v => set("heuristicCandidatePoolSize", v)} />
                </FieldRow>
                <FieldRow label="OSRM Evaluation Top-K"
                    hint="Number of shortlisted candidates that get full OSRM route evaluation per step">
                    <NumInput value={config.heuristicOsrmEvaluationTopK} min={1} max={10} step={1}
                        onChange={v => set("heuristicOsrmEvaluationTopK", v)} />
                </FieldRow>
                <FieldRow label="Bearing Penalty Weight"
                    hint="Weight for penalizing angular deviation from the preferred direction">
                    <NumInput value={config.heuristicBearingPenaltyWeight} min={0} max={10} step={0.1}
                        onChange={v => set("heuristicBearingPenaltyWeight", v)} />
                </FieldRow>
                <FieldRow label="Facility Order Penalty Weight"
                    hint="Extra penalty when a candidate breaks the toward/away-from-facility ordering">
                    <NumInput value={config.heuristicFacilityOrderPenaltyWeight} min={0} max={20} step={0.5}
                        onChange={v => set("heuristicFacilityOrderPenaltyWeight", v)} />
                </FieldRow>
                <FieldRow label="Distance Spread Penalty Weight"
                    hint="Penalizes candidates whose facility distance differs a lot from the current route shape">
                    <NumInput value={config.heuristicDistanceSpreadPenaltyWeight} min={0} max={5} step={0.1}
                        onChange={v => set("heuristicDistanceSpreadPenaltyWeight", v)} />
                </FieldRow>
                <FieldRow label="Duration Weight"
                    hint="Converts estimated route duration into part of the candidate score (higher = care more about duration)">
                    <NumInput value={config.heuristicDurationWeight} min={0} max={0.05} step={0.0005}
                        onChange={v => set("heuristicDurationWeight", v)} />
                </FieldRow>
            </div>
        </div>
    );

    // ── Tab: Optimization ────────────────────────────────────────────────────

    const renderOptimization = () => (
        <>
            {/* Route Consolidation */}
            <div className="card_tb p-4 mb-3">
                <SectionTitle title="Route Consolidation"
                    subtitle="Post OR-Tools phase — merges low-occupancy routes into larger ones" />
                <div className="row gx-4 gy-3">
                    <FieldRow label="Enable Route Consolidation" col="col-12 col-sm-6 col-md-3 mb-3">
                        <Toggle checked={config.enableRouteConsolidation}
                            onChange={v => set("enableRouteConsolidation", v)} />
                    </FieldRow>
                    <FieldRow label="Bidirectional Consolidation"
                        hint="Allows small routes to merge into each other, not only into larger hosts"
                        col="col-12 col-sm-6 col-md-3 mb-3">
                        <Toggle checked={config.enableBidirectionalConsolidation}
                            onChange={v => set("enableBidirectionalConsolidation", v)} />
                    </FieldRow>
                </div>
                {config.enableRouteConsolidation && (
                    <div className="row gx-4 gy-3">
                        <FieldRow label="Max Insertion Distance (km)"
                            hint="Max employee-to-host-route proximity for consolidation">
                            <NumInput value={config.consolidationMaxInsertionDistanceKm} min={0.5} max={20} step={0.5}
                                onChange={v => set("consolidationMaxInsertionDistanceKm", v)} />
                        </FieldRow>
                        <FieldRow label="Low Occupancy Threshold"
                            hint="Routes with occupancy ≤ this are merge candidates">
                            <NumInput value={config.consolidationLowOccupancyThreshold} min={1} max={10} step={1}
                                onChange={v => set("consolidationLowOccupancyThreshold", v)} />
                        </FieldRow>
                        <FieldRow label="Min Host Occupancy"
                            hint="Minimum occupancy a route needs before acting as a host">
                            <NumInput value={config.consolidationMinHostOccupancy} min={1} max={10} step={1}
                                onChange={v => set("consolidationMinHostOccupancy", v)} />
                        </FieldRow>
                        <FieldRow label="Linear Tolerance (°)"
                            hint="Direction tolerance when checking merged employee keeps route linear">
                            <NumInput value={config.consolidationLinearTolerance} min={10} max={180} step={5}
                                onChange={v => set("consolidationLinearTolerance", v)} />
                        </FieldRow>
                    </div>
                )}
            </div>

            {/* Singleton Aggregation */}
            <div className="card_tb p-4 mb-3">
                <SectionTitle title="Singleton Aggregation"
                    subtitle="Clusters one-employee routes together to reduce total route count" />
                <div className="row gx-4 gy-3">
                    <FieldRow label="Aggregation Radius (km)"
                        hint="Max distance allowed when clustering singleton routes">
                        <NumInput value={config.singletonAggregationRadius} min={1} max={30} step={0.5}
                            onChange={v => set("singletonAggregationRadius", v)} />
                    </FieldRow>
                    <FieldRow label="Max Cluster Size"
                        hint="Largest allowed employee count in a singleton-aggregation cluster">
                        <NumInput value={config.singletonMaxClusterSize} min={1} max={12} step={1}
                            onChange={v => set("singletonMaxClusterSize", v)} />
                    </FieldRow>
                </div>
            </div>

            {/* Cross-Route Optimization */}
            <div className="card_tb p-4 mb-3">
                <SectionTitle title="Cross-Route Optimization"
                    subtitle="Moves employees between existing routes when it improves net efficiency" />
                <div className="row gx-4 gy-3">
                    <FieldRow label="Enable Cross-Route Optimization" col="col-12 col-sm-6 col-md-3 mb-3">
                        <Toggle checked={config.enableCrossRouteOptimization}
                            onChange={v => set("enableCrossRouteOptimization", v)} />
                    </FieldRow>
                </div>
                {config.enableCrossRouteOptimization && (
                    <div className="row gx-4 gy-3">
                        <FieldRow label="Max Iterations"
                            hint="Maximum number of relocation rounds">
                            <NumInput value={config.crossRouteMaxIterations} min={1} max={20} step={1}
                                onChange={v => set("crossRouteMaxIterations", v)} />
                        </FieldRow>
                        <FieldRow label="Max Detour (km)"
                            hint="Hard cap on added route distance when inserting one employee">
                            <NumInput value={config.crossRouteMaxDetourKm} min={0} max={20} step={0.5}
                                onChange={v => set("crossRouteMaxDetourKm", v)} />
                        </FieldRow>
                        <FieldRow label="Max Detour Ratio"
                            hint="Relative cap on insertion detour vs the replaced base segment">
                            <NumInput value={config.crossRouteMaxDetourRatio} min={1.0} max={3.0} step={0.05}
                                onChange={v => set("crossRouteMaxDetourRatio", v)} />
                        </FieldRow>
                        <FieldRow label="Max Heading Deviation (°)"
                            hint="Max directional mismatch for relocation candidates">
                            <NumInput value={config.crossRouteMaxHeadingDeviationDeg} min={10} max={180} step={5}
                                onChange={v => set("crossRouteMaxHeadingDeviationDeg", v)} />
                        </FieldRow>
                        <FieldRow label="Monotonicity Slack (km)"
                            hint="Allowed slack for monotonic facility-distance check through the route">
                            <NumInput value={config.crossRouteMonotonicitySlackKm} min={0} max={10} step={0.1}
                                onChange={v => set("crossRouteMonotonicitySlackKm", v)} />
                        </FieldRow>
                        <FieldRow label="Corridor Radius (km)"
                            hint="Candidate employee must be close enough to the host route corridor">
                            <NumInput value={config.crossRouteCorridorRadiusKm} min={0.5} max={20} step={0.5}
                                onChange={v => set("crossRouteCorridorRadiusKm", v)} />
                        </FieldRow>
                        <FieldRow label="Top Host Candidates"
                            hint="Best host routes shortlisted before deeper validation">
                            <NumInput value={config.crossRouteTopHostCandidates} min={1} max={20} step={1}
                                onChange={v => set("crossRouteTopHostCandidates", v)} />
                        </FieldRow>
                        <FieldRow label="Max OSRM Checks / Iteration"
                            hint="Configured budget — actual cap is max(this, dynamic budget based on route count)">
                            <NumInput value={config.crossRouteMaxOsrmChecksPerIteration} min={10} max={1000} step={10}
                                onChange={v => set("crossRouteMaxOsrmChecksPerIteration", v)} />
                        </FieldRow>
                        <FieldRow label="Route Reduction Bonus (km)"
                            hint="Score bonus when relocation removes an entire source route">
                            <NumInput value={config.crossRouteRouteReductionBonusKm} min={0} max={10} step={0.1}
                                onChange={v => set("crossRouteRouteReductionBonusKm", v)} />
                        </FieldRow>
                        <FieldRow label="Occupancy Bonus (km)"
                            hint="Score bonus for improving host-route occupancy">
                            <NumInput value={config.crossRouteOccupancyBonusKm} min={0} max={5} step={0.1}
                                onChange={v => set("crossRouteOccupancyBonusKm", v)} />
                        </FieldRow>
                        <FieldRow label="Passenger Burden Weight"
                            hint="Penalty for making existing passengers carry more burden due to insertion">
                            <NumInput value={config.crossRoutePassengerBurdenWeight} min={0} max={2} step={0.05}
                                onChange={v => set("crossRoutePassengerBurdenWeight", v)} />
                        </FieldRow>
                        <FieldRow label="Min Net Gain (km)"
                            hint="Minimum required net gain to accept a relocation — negative = more willing to move">
                            <NumInput value={config.crossRouteMinNetGainKm} min={-2} max={5} step={0.1}
                                onChange={v => set("crossRouteMinNetGainKm", v)} />
                        </FieldRow>
                        <FieldRow label="Candidate Employees per Route"
                            hint="Number of candidate employees pulled from each source route">
                            <NumInput value={config.crossRouteCandidateEmployeesPerRoute} min={1} max={20} step={1}
                                onChange={v => set("crossRouteCandidateEmployeesPerRoute", v)} />
                        </FieldRow>
                    </div>
                )}
            </div>

            {/* Local Sequence */}
            <div className="card_tb p-4">
                <SectionTitle title="Local Sequence Optimization"
                    subtitle="Reorders stops within a route to improve direction and passenger burden" />
                <div className="row gx-4 gy-3">
                    <FieldRow label="Enable Local Sequence Optimization" col="col-12 col-sm-6 col-md-3 mb-3">
                        <Toggle checked={config.enableLocalSequenceOptimization}
                            onChange={v => set("enableLocalSequenceOptimization", v)} />
                    </FieldRow>
                </div>
                {config.enableLocalSequenceOptimization && (
                    <div className="row gx-4 gy-3">
                        <FieldRow label="Max Iterations"
                            hint="Number of local sequence-improvement passes">
                            <NumInput value={config.localSequenceMaxIterations} min={1} max={10} step={1}
                                onChange={v => set("localSequenceMaxIterations", v)} />
                        </FieldRow>
                        <FieldRow label="Direction Penalty Weight"
                            hint="Penalty weight for ordering that breaks the preferred direction">
                            <NumInput value={config.localSequenceDirectionPenaltyWeight} min={0} max={20} step={0.5}
                                onChange={v => set("localSequenceDirectionPenaltyWeight", v)} />
                        </FieldRow>
                        <FieldRow label="Passenger Burden Weight"
                            hint="Penalty weight for making passenger order worse during local reordering">
                            <NumInput value={config.localSequencePassengerBurdenWeight} min={0} max={2} step={0.05}
                                onChange={v => set("localSequencePassengerBurdenWeight", v)} />
                        </FieldRow>
                        <FieldRow label="Monotonic Slack (km)"
                            hint="Allowed slack for local monotonic-distance checks">
                            <NumInput value={config.localSequenceMonotonicSlackKm} min={0} max={10} step={0.1}
                                onChange={v => set("localSequenceMonotonicSlackKm", v)} />
                        </FieldRow>
                    </div>
                )}
            </div>
        </>
    );

    // ── Render ────────────────────────────────────────────────────────────────

    const tabContent = {
        general: renderGeneral,
        fleet: renderFleet,
        heuristics: renderHeuristics,
        optimization: renderOptimization,
    };

    return (
        <div>
            <Header pageTitle="Routing Configuration" />
            <Sidebar />
            <ToastContainer position="top-right" autoClose={3000} />

            <Dialog
                visible={confirmModal.open}
                onHide={hideConfirm}
                header="Confirm Action"
                style={{ width: "380px" }}
                modal
                draggable={false}
                resizable={false}
                footer={
                    <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={hideConfirm}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-sm btn-danger rounded-pill px-3"
                            onClick={() => { confirmModal.onConfirm?.(); hideConfirm(); }}
                        >
                            Confirm
                        </button>
                    </div>
                }
            >
                <p className="mb-0">{confirmModal.message}</p>
            </Dialog>

            <div className="middle">
                <div className="row">
                    <div className="col-12">
                        <h6 className="pageTitle">Routing Configuration</h6>
                    </div>
                </div>

                {/* ── Selection card ── */}
                <div className="card_tb p-3 mb-3">
                    <div className="row g-2 align-items-end">
                        <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                            <label className="form-label">
                                Facility <span className="text-danger">*</span>
                            </label>
                            <Dropdown
                                value={facility}
                                options={FACILITIES}
                                onChange={e => { setFacility(e.value); setConfig(null); }}
                                placeholder="Select Facility"
                                className="w-100"
                            />
                        </div>
                        <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                            <label className="form-label">
                                Profile <span className="text-danger">*</span>
                            </label>
                            <Dropdown
                                value={profileType}
                                options={PROFILE_TYPES}
                                onChange={e => { setProfileType(e.value); setConfig(null); }}
                                placeholder="Select Profile"
                                className="w-100"
                            />
                        </div>
                        <div className="col-12 col-sm-6 col-md-2 col-lg-2">
                            <ReportButton label="Load Profile" onClick={handleLoad} />
                        </div>
                    </div>
                </div>

                {/* ── Config editor ── */}
                {config && (
                    <>
                        {/* Section tabs + actions in one row */}
                        <div className="d-flex align-items-center justify-content-between mb-3" style={{ gap: "1rem" }}>
                            <div style={{ minWidth: 0 }}>
                                <TabSwitcher
                                    tabs={CONFIG_TABS}
                                    activeTab={activeTab}
                                    onTabChange={setActiveTab}
                                    size="medium"
                                />
                            </div>
                            <div className="d-flex gap-2" style={{ flexShrink: 0 }}>
                                <Button
                                    label="Reset to Defaults"
                                    icon="pi pi-refresh"
                                    className="btn btn-secondary"
                                    raised
                                    rounded
                                    onClick={handleReset}
                                />
                                <Button
                                    label="Save Profile"
                                    icon="pi pi-save"
                                    className="btn btn-primary"
                                    raised
                                    rounded
                                    onClick={handleSave}
                                />
                            </div>
                        </div>

                        {/* Active tab content */}
                        {tabContent[activeTab]?.()}
                    </>
                )}

                {/* Empty state */}
                {!config && (
                    <div className="card_tb d-flex flex-column align-items-center justify-content-center py-5"
                        style={{ minHeight: 300 }}>
                        <i className="pi pi-sliders-h text-muted mb-3" style={{ fontSize: "2.5rem" }} />
                        <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                            Select a facility and profile, then click <strong>Load Profile</strong> to view and edit routing parameters.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoutingConfig;
