import React, { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { toastService } from "../services/toastService";
import Loader from "./common/Loader";
import sessionManager from "../utils/SessionManager";

const CLOUDINARY_CLOUD = "dnzzrvbdz";
const CLOUDINARY_UPLOAD_PRESET = "hqudzekg";
const CLOUDINARY_RAW_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/raw/upload`;
const SAMPLE_TEMPLATE_URL =
    "https://res.cloudinary.com/dnzzrvbdz/raw/upload/v1778524853/hr_templates/TMSDataFeedsample.xls";
const UPLOAD_HISTORY_KEY = "hr_excel_upload_history";

const REQUIRED_HEADERS = [
    "EmployeeID", "EmployeeName", "Gender", "Mobile",
    "Address", "City", "Email", "Project",
    "ManagerID", "Facility", "CostCenter", "TPTFor", "OPSLeadId",
];

const REQUIRED_FIELDS = new Set([
    "EmployeeID", "EmployeeName", "Gender", "Mobile",
    "Address", "Facility", "TPTFor", "OPSLeadId",
]);

function validateRow(rowArr, idx) {
    const obj = {};
    REQUIRED_HEADERS.forEach((h, i) => {
        obj[h] = (rowArr[i] ?? "").toString().trim();
    });
    const errors = {};

    REQUIRED_FIELDS.forEach((field) => {
        if (!obj[field]) errors[field] = "Required";
    });

    if (obj.Gender && !errors.Gender) {
        const g = obj.Gender.toUpperCase();
        if (!["MALE", "FEMALE", "M", "F"].includes(g))
            errors.Gender = "Must be Male or Female";
    }

    if (obj.Mobile && !errors.Mobile) {
        if (!/^[0-9]+$/.test(obj.Mobile))
            errors.Mobile = "Numeric only";
    }

    if (obj.TPTFor && !errors.TPTFor) {
        if (!["PICK", "DROP", "BOTH"].includes(obj.TPTFor.toUpperCase()))
            errors.TPTFor = "Must be Pick, Drop, or Both";
    }

    return { ...obj, _rowNo: idx + 2, _errors: errors, _isValid: Object.keys(errors).length === 0 };
}

function fmtFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Step indicator ──────────────────────────────────────────────────────────
const StepIndicator = ({ current }) => {
    const steps = ["Select File", "Validate & Preview", "Upload"];
    return (
        <div className="d-flex align-items-center gap-0 mb-4">
            {steps.map((label, i) => {
                const n = i + 1;
                const done = current > n;
                const active = current === n;
                return (
                    <React.Fragment key={n}>
                        <div className="d-flex flex-column align-items-center" style={{ minWidth: 100 }}>
                            <div
                                className="d-flex align-items-center justify-content-center rounded-circle"
                                style={{
                                    width: 32, height: 32, fontSize: 13, fontWeight: 700,
                                    background: done ? "#22c55e" : active ? "#0d6efd" : "#e9ecef",
                                    color: done || active ? "#fff" : "#6c757d",
                                    transition: "background 0.2s",
                                }}
                            >
                                {done ? <i className="pi pi-check" style={{ fontSize: 13 }} /> : n}
                            </div>
                            <span style={{ fontSize: 11, marginTop: 4, color: active ? "#0d6efd" : done ? "#22c55e" : "#6c757d", fontWeight: active ? 600 : 400 }}>
                                {label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div style={{ flex: 1, height: 2, background: done ? "#22c55e" : "#e9ecef", marginBottom: 18, transition: "background 0.2s" }} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ─── Preview table ───────────────────────────────────────────────────────────
const PreviewTable = ({ rows }) => {
    const CELL_STYLES = {
        error: { background: "#fee2e2", color: "#dc2626", fontWeight: 600 },
        ok: {},
    };
    return (
        <div style={{ overflowX: "auto", maxHeight: 400, overflowY: "auto", border: "1px solid #dee2e6", borderRadius: 8 }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
                <thead style={{ position: "sticky", top: 0, background: "#f8f9fa", zIndex: 1 }}>
                    <tr>
                        <th style={thStyle}>#</th>
                        {REQUIRED_HEADERS.map((h) => (
                            <th key={h} style={thStyle}>{h}</th>
                        ))}
                        <th style={thStyle}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row._rowNo} style={{ background: row._isValid ? "#fff" : "#fff5f5" }}>
                            <td style={tdStyle}>{row._rowNo}</td>
                            {REQUIRED_HEADERS.map((h) => {
                                const hasErr = !!row._errors[h];
                                return (
                                    <td
                                        key={h}
                                        style={{ ...tdStyle, ...(hasErr ? CELL_STYLES.error : {}) }}
                                        title={hasErr ? row._errors[h] : undefined}
                                    >
                                        {row[h] || <span style={{ color: "#adb5bd" }}>—</span>}
                                        {hasErr && (
                                            <span style={{ fontSize: 10, display: "block", color: "#ef4444" }}>
                                                {row._errors[h]}
                                            </span>
                                        )}
                                    </td>
                                );
                            })}
                            <td style={{ ...tdStyle, textAlign: "center" }}>
                                {row._isValid
                                    ? <span style={{ color: "#16a34a", fontSize: 13 }}><i className="pi pi-check-circle" /></span>
                                    : <span style={{ color: "#dc2626", fontSize: 13 }}><i className="pi pi-times-circle" /></span>
                                }
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const thStyle = {
    padding: "8px 10px", borderBottom: "2px solid #dee2e6",
    textAlign: "left", whiteSpace: "nowrap", fontWeight: 600,
    fontSize: 12, color: "#374151",
};
const tdStyle = {
    padding: "6px 10px", borderBottom: "1px solid #f0f0f0",
    verticalAlign: "top", whiteSpace: "nowrap",
};

// ─── Main component ──────────────────────────────────────────────────────────
const HrImportExcel = () => {
    const userId = sessionManager.getUserSession()?.ID;

    const [step, setStep] = useState(1);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [parsedRows, setParsedRows] = useState([]);
    const [headerErrors, setHeaderErrors] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [lastUploadUrl, setLastUploadUrl] = useState("");
    const [uploadHistory, setUploadHistory] = useState(() => {
        try { return JSON.parse(localStorage.getItem(UPLOAD_HISTORY_KEY) || "[]"); }
        catch { return []; }
    });

    const fileInputRef = useRef(null);

    const reset = () => {
        setSelectedFile(null);
        setParsedRows([]);
        setHeaderErrors([]);
        setStep(1);
        setLastUploadUrl("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const processFile = useCallback((file) => {
        const ext = file.name.split(".").pop().toLowerCase();
        if (!["xls", "xlsx"].includes(ext)) {
            toastService.warn("Please upload an Excel file (.xls or .xlsx)");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

                if (!rawRows.length) { toastService.error("The file is empty."); return; }

                const fileHeaders = rawRows[0].map((h) => (h ?? "").toString().trim());
                const hErrors = REQUIRED_HEADERS.reduce((acc, expected, i) => {
                    if ((fileHeaders[i] || "").toUpperCase() !== expected.toUpperCase())
                        acc.push({ col: i + 1, expected, found: fileHeaders[i] || "(empty)" });
                    return acc;
                }, []);

                setHeaderErrors(hErrors);
                setSelectedFile(file);

                const dataRows = rawRows.slice(1).filter((r) => r.some((c) => (c ?? "") !== ""));
                setParsedRows(dataRows.map(validateRow));
                setStep(2);
            } catch {
                toastService.error("Failed to parse the Excel file. Ensure it is a valid .xls/.xlsx file.");
            }
        };
        reader.readAsArrayBuffer(file);
    }, []);

    const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback(() => setIsDragging(false), []);
    const handleDrop = useCallback((e) => {
        e.preventDefault(); setIsDragging(false);
        if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
    }, [processFile]);
    const handleFileChange = (e) => { if (e.target.files[0]) processFile(e.target.files[0]); };

    const handleUpload = async () => {
        if (!selectedFile || !canUpload) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
            formData.append("folder", `hr_excel_uploads/${userId}`);
            formData.append("public_id", `${Date.now()}_${selectedFile.name.replace(/\s+/g, "_")}`);

            const res = await fetch(CLOUDINARY_RAW_URL, { method: "POST", body: formData });
            const data = await res.json();
            if (!data.secure_url) throw new Error(data.error?.message || "Upload failed");

            const entry = {
                id: Date.now().toString(),
                filename: selectedFile.name,
                uploadDate: new Date().toISOString(),
                cloudUrl: data.secure_url,
                totalRows: parsedRows.length,
                validRows: parsedRows.filter((r) => r._isValid).length,
                errorRows: parsedRows.filter((r) => !r._isValid).length,
            };
            const updated = [entry, ...uploadHistory].slice(0, 30);
            setUploadHistory(updated);
            localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(updated));
            setLastUploadUrl(data.secure_url);
            toastService.success("File uploaded to cloud successfully!");
            setStep(3);
        } catch (err) {
            toastService.error("Upload failed: " + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const deleteHistory = (id) => {
        const updated = uploadHistory.filter((h) => h.id !== id);
        setUploadHistory(updated);
        localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(updated));
    };

    const validCount = parsedRows.filter((r) => r._isValid).length;
    const errorCount = parsedRows.filter((r) => !r._isValid).length;
    const hasHeaderErrors = headerErrors.length > 0;
    const canUpload = !hasHeaderErrors && parsedRows.length > 0 && errorCount === 0;

    return (
        <>
            <style>{`
                .hr-import-page .drop-zone {
                    border: 2px dashed #ced4da;
                    border-radius: 12px;
                    background: #f8faff;
                    transition: border-color 0.2s, background 0.2s;
                    cursor: pointer;
                }
                .hr-import-page .drop-zone:hover,
                .hr-import-page .drop-zone.dragging {
                    border-color: #0d6efd;
                    background: #eff6ff;
                }
                .hr-import-page .drop-zone.dragging {
                    border-style: solid;
                }
                .hr-import-page .history-card {
                    border: 1px solid #e9ecef;
                    border-radius: 10px;
                    padding: 12px 16px;
                    transition: box-shadow 0.15s;
                }
                .hr-import-page .history-card:hover {
                    box-shadow: 0 2px 12px rgba(0,0,0,0.07);
                }
                .hr-import-page .stat-pill {
                    display: inline-flex; align-items: center; gap: 4px;
                    padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;
                }
                .hr-import-page .col-required::after {
                    content: " *";
                    color: #dc2626;
                }
                .hr-import-page .btn-outline-primary.history-dl-btn:hover,
                .hr-import-page .btn-outline-primary.history-dl-btn:active,
                .hr-import-page .btn-outline-primary.history-dl-btn:focus {
                    background-color: transparent !important;
                    color: #0d6efd !important;
                    border-color: #0d6efd !important;
                    box-shadow: none !important;
                }
            `}</style>

            <Loader isVisible={isUploading} fullScreen />
            <Header pageTitle="HR Employee Data Import" />
            <Sidebar />

            <div className="middle hr-import-page">
                <div className="row">
                    <div className="col-12">
                        <h6 className="pageTitle">HR Employee Data Import</h6>
                    </div>

                    {/* ── Step indicator ─────────────────────────────────── */}
                    <div className="col-12">
                        <div className="card_tb p-4 mb-3">
                            <StepIndicator current={step} />

                            {/* ══ STEP 1: Select file ══ */}
                            {step === 1 && (
                                <div className="row g-4">
                                    {/* Drop zone */}
                                    <div className="col-12 col-lg-8">
                                        <div
                                            className={`drop-zone p-5 text-center ${isDragging ? "dragging" : ""}`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".xls,.xlsx"
                                                className="d-none"
                                                onChange={handleFileChange}
                                            />
                                            <div style={{ fontSize: 48, color: "#93c5fd", marginBottom: 12 }}>
                                                <i className="pi pi-file-excel" />
                                            </div>
                                            <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 6 }}>
                                                Drag & drop your Excel file here
                                            </p>
                                            <p style={{ color: "#6c757d", fontSize: "0.82rem", marginBottom: 16 }}>
                                                or click to browse from your computer
                                            </p>
                                            <span
                                                className="btn btn-primary btn-sm px-4"
                                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                            >
                                                <i className="pi pi-upload me-2" style={{ fontSize: 12 }} />
                                                Browse File
                                            </span>
                                            <p style={{ color: "#adb5bd", fontSize: "0.75rem", marginTop: 14, marginBottom: 0 }}>
                                                Supported formats: .xls, .xlsx
                                            </p>
                                        </div>
                                    </div>

                                    {/* Template download + column guide */}
                                    <div className="col-12 col-lg-4">
                                        <div
                                            className="rounded p-3 mb-3"
                                            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
                                        >
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <i className="pi pi-download" style={{ color: "#16a34a", fontSize: 14 }} />
                                                <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#166534" }}>
                                                    Download Template
                                                </span>
                                            </div>
                                            <p style={{ fontSize: "0.78rem", color: "#4b7c56", marginBottom: 12 }}>
                                                Use the official template to ensure your data matches the required format.
                                            </p>
                                            <a
                                                href={SAMPLE_TEMPLATE_URL}
                                                download="TMSDataFeedsample.xls"
                                                className="btn btn-success btn-sm w-100"
                                            >
                                                <i className="pi pi-file-excel me-2" style={{ fontSize: 12 }} />
                                                TMSDataFeedsample.xls
                                            </a>
                                        </div>

                                        <div
                                            className="rounded p-3"
                                            style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
                                        >
                                            <p style={{ fontWeight: 600, fontSize: "0.82rem", color: "#92400e", marginBottom: 8 }}>
                                                <i className="pi pi-info-circle me-1" />
                                                Required Columns
                                            </p>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 8px" }}>
                                                {REQUIRED_HEADERS.map((h) => (
                                                    <span
                                                        key={h}
                                                        style={{
                                                            fontSize: 11, color: REQUIRED_FIELDS.has(h) ? "#dc2626" : "#374151",
                                                            fontWeight: REQUIRED_FIELDS.has(h) ? 600 : 400,
                                                        }}
                                                    >
                                                        {REQUIRED_FIELDS.has(h) ? "* " : "· "}{h}
                                                    </span>
                                                ))}
                                            </div>
                                            <p style={{ fontSize: 10, color: "#b45309", marginTop: 8, marginBottom: 0 }}>
                                                * Mandatory fields
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ══ STEP 2: Preview & Validate ══ */}
                            {step === 2 && (
                                <div>
                                    {/* File info bar */}
                                    <div
                                        className="d-flex align-items-center gap-3 p-3 rounded mb-4"
                                        style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}
                                    >
                                        <div style={{ fontSize: 28, color: "#22c55e" }}>
                                            <i className="pi pi-file-excel" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: 600, marginBottom: 0, fontSize: "0.9rem" }}>{selectedFile?.name}</p>
                                            <p style={{ color: "#6c757d", fontSize: "0.78rem", marginBottom: 0 }}>
                                                {fmtFileSize(selectedFile?.size || 0)} &nbsp;·&nbsp; {parsedRows.length} data rows
                                            </p>
                                        </div>
                                        <button className="btn btn-sm btn-outline-secondary" onClick={reset}>
                                            <i className="pi pi-refresh me-1" style={{ fontSize: 11 }} />
                                            Change File
                                        </button>
                                    </div>

                                    {/* Header validation */}
                                    <div
                                        className="rounded p-3 mb-3"
                                        style={{
                                            background: hasHeaderErrors ? "#fff5f5" : "#f0fdf4",
                                            border: `1px solid ${hasHeaderErrors ? "#fecaca" : "#bbf7d0"}`,
                                        }}
                                    >
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <i
                                                className={`pi ${hasHeaderErrors ? "pi-times-circle" : "pi-check-circle"}`}
                                                style={{ color: hasHeaderErrors ? "#dc2626" : "#16a34a", fontSize: 15 }}
                                            />
                                            <span style={{ fontWeight: 600, fontSize: "0.85rem", color: hasHeaderErrors ? "#991b1b" : "#166534" }}>
                                                {hasHeaderErrors ? `Header Mismatch (${headerErrors.length} column${headerErrors.length > 1 ? "s" : ""})` : "Header Validation Passed"}
                                            </span>
                                        </div>
                                        {hasHeaderErrors && (
                                            <ul style={{ margin: "6px 0 0 20px", padding: 0, fontSize: "0.78rem", color: "#dc2626" }}>
                                                {headerErrors.map((e) => (
                                                    <li key={e.col}>
                                                        Column {e.col}: expected <strong>{e.expected}</strong>, found <strong>{e.found}</strong>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {/* Row validation summary */}
                                    {!hasHeaderErrors && (
                                        <div className="d-flex gap-3 mb-3 flex-wrap">
                                            <div className="stat-pill" style={{ background: "#dbeafe", color: "#1e40af" }}>
                                                <i className="pi pi-list" style={{ fontSize: 11 }} />
                                                {parsedRows.length} Total Rows
                                            </div>
                                            <div className="stat-pill" style={{ background: "#dcfce7", color: "#15803d" }}>
                                                <i className="pi pi-check" style={{ fontSize: 11 }} />
                                                {validCount} Valid
                                            </div>
                                            {errorCount > 0 && (
                                                <div className="stat-pill" style={{ background: "#fee2e2", color: "#dc2626" }}>
                                                    <i className="pi pi-exclamation-triangle" style={{ fontSize: 11 }} />
                                                    {errorCount} Errors
                                                </div>
                                            )}
                                            {errorCount > 0 && (
                                                <span style={{ fontSize: "0.78rem", color: "#6c757d", alignSelf: "center" }}>
                                                    Fix errors in your file and re-upload to proceed
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Preview table */}
                                    {!hasHeaderErrors && parsedRows.length > 0 && (
                                        <PreviewTable rows={parsedRows} />
                                    )}

                                    {/* Actions */}
                                    <div
                                        className="d-flex justify-content-end gap-2 mt-4 pt-3"
                                        style={{ borderTop: "1px solid #e9ecef" }}
                                    >
                                        <button className="btn btn-outline-secondary px-4" onClick={reset}>
                                            Cancel
                                        </button>
                                        <button
                                            className="btn btn-primary px-4 d-flex align-items-center gap-2"
                                            onClick={handleUpload}
                                            disabled={!canUpload || isUploading}
                                            title={!canUpload ? (hasHeaderErrors ? "Fix header issues first" : "Fix row errors before uploading") : ""}
                                        >
                                            {isUploading
                                                ? <span className="spinner-border spinner-border-sm" />
                                                : <i className="pi pi-cloud-upload" />
                                            }
                                            Upload to Cloud
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ══ STEP 3: Success ══ */}
                            {step === 3 && (
                                <div className="text-center py-4">
                                    <div style={{ fontSize: 56, color: "#22c55e", marginBottom: 16 }}>
                                        <i className="pi pi-check-circle" />
                                    </div>
                                    <h5 style={{ fontWeight: 700, color: "#166534", marginBottom: 8 }}>
                                        File Uploaded Successfully
                                    </h5>
                                    <p style={{ color: "#6c757d", fontSize: "0.88rem", marginBottom: 24 }}>
                                        Your Excel file has been stored in the cloud and added to the upload history below.
                                    </p>
                                    <div className="d-flex justify-content-center gap-3 flex-wrap">
                                        <a
                                            href={lastUploadUrl}
                                            download
                                            className="btn btn-outline-success"
                                        >
                                            <i className="pi pi-download me-2" style={{ fontSize: 12 }} />
                                            Download Uploaded File
                                        </a>
                                        <button className="btn btn-primary" onClick={reset}>
                                            <i className="pi pi-upload me-2" style={{ fontSize: 12 }} />
                                            Upload Another File
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Upload history ─────────────────────────────────── */}
                    <div className="col-12">
                        <div className="card_tb p-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <h6 style={{ fontWeight: 700, marginBottom: 2 }}>Upload History</h6>
                                    <span style={{ fontSize: "0.78rem", color: "#6c757d" }}>
                                        Previously uploaded files stored locally
                                    </span>
                                </div>
                                {uploadHistory.length > 0 && (
                                    <span className="badge bg-primary">{uploadHistory.length}</span>
                                )}
                            </div>

                            {uploadHistory.length === 0 ? (
                                <div className="text-center py-5" style={{ color: "#adb5bd" }}>
                                    <i className="pi pi-inbox" style={{ fontSize: 36, display: "block", marginBottom: 10 }} />
                                    <span style={{ fontSize: "0.85rem" }}>No uploads yet</span>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-2">
                                    {uploadHistory.map((entry) => (
                                        <div key={entry.id} className="history-card">
                                            <div className="d-flex align-items-center gap-3">
                                                <div style={{ fontSize: 24, color: "#22c55e", flexShrink: 0 }}>
                                                    <i className="pi pi-file-excel" />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {entry.filename}
                                                    </p>
                                                    <div className="d-flex flex-wrap gap-2 align-items-center">
                                                        <span style={{ fontSize: 11, color: "#6c757d" }}>
                                                            <i className="pi pi-calendar me-1" style={{ fontSize: 10 }} />
                                                            {fmtDate(entry.uploadDate)}
                                                        </span>
                                                        <span className="stat-pill" style={{ background: "#dbeafe", color: "#1e40af", fontSize: 11 }}>
                                                            {entry.totalRows} rows
                                                        </span>
                                                        <span className="stat-pill" style={{ background: "#dcfce7", color: "#15803d", fontSize: 11 }}>
                                                            <i className="pi pi-check" style={{ fontSize: 9 }} />
                                                            {entry.validRows} valid
                                                        </span>
                                                        {entry.errorRows > 0 && (
                                                            <span className="stat-pill" style={{ background: "#fee2e2", color: "#dc2626", fontSize: 11 }}>
                                                                <i className="pi pi-times" style={{ fontSize: 9 }} />
                                                                {entry.errorRows} errors
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="d-flex gap-2 flex-shrink-0">
                                                    <a
                                                        href={entry.cloudUrl}
                                                        download={entry.filename}
                                                        className="btn btn-sm btn-outline-primary history-dl-btn"
                                                        title="Download this file"
                                                    >
                                                        <i className="pi pi-download" style={{ fontSize: 12 }} />
                                                    </a>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        title="Remove from history"
                                                        onClick={() => deleteHistory(entry.id)}
                                                    >
                                                        <i className="pi pi-trash" style={{ fontSize: 12 }} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HrImportExcel;
