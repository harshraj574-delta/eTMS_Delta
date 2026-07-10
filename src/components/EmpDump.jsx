import React, { useEffect, useState } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import ShiftTimeMasterService from "../services/compliance/ShiftTimeMaster";
import EmpDumpService from "../services/compliance/EmpDumpService";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import ExcelJS from 'exceljs';
import { toastService } from "../services/toastService";
import ReportButton from "./common/ReportButton";

const EmpDump = () => {
    const userID = sessionStorage.getItem("ID")
    const [facilities, setFacilities] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState("N");

    useEffect(() => {
        fetchFacilities();
    }, [])
    // Fetch facilities from API
    const fetchFacilities = async () => {
        try {
            const response = await ShiftTimeMasterService.SelectFacility({
                userid: userID,
            });
            // console.log("Facility empdump", response);
            const parsedResponse =
                typeof response === "string" ? JSON.parse(response) : response;
            const formattedData = Array.isArray(parsedResponse)
                ? parsedResponse.map((item) => ({
                    label: item.facility || item.facilityName,
                    value: item.Id,
                }))
                : [];
            setFacilities(formattedData);

        } catch (error) {
            console.error("Failed to fetch facilities:", error);
        }
    };

    const handleExport = async () => {
        if (!selectedFacility || !status) {
            toastService.warn("Please select both Facility and Status");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                facilityid: selectedFacility,
                attrited: status,
            };

            let result = await EmpDumpService.GetEmpDump(payload);

            if (typeof result === "string") result = JSON.parse(result);
            if (!Array.isArray(result)) result = result.data || [];

            if (!result || result.length === 0) {
                toastService.info("No employee data found.");
                return;
            }

            const headers = [
                "EmployeeID", "EmployeeName", "Gender", "facilityName", "Address",
                "City", "Area", "Landmark", "ZoneName", "RequiredTPT", "EmailID",
                "CostCenter", "Project", "Manager", "Mobile", "Phone", "EmergencyContact",
                "MedicalCase", "MedicalRemarks", "MedicalExpiryDate", "DateOfJoining",
                "AttritedAt", "AddressChangedOn", "OldAddress"
            ];

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("EmployeeDump");

            // Define columns
            worksheet.columns = headers.map((key) => ({
                header: key,
                key: key,
                width: key === "Address" || key === "OldAddress" ? 40 : 20,
                style: {
                    font: { name: 'Arial', size: 10 },
                    alignment: {
                        wrapText: true,
                        vertical: 'middle',
                    },
                    border: {
                        top: { style: 'thin' },
                        bottom: { style: 'thin' },
                        left: { style: 'thin' },
                        right: { style: 'thin' },
                    },
                },
            }));

            // Add data
            result.forEach((row) => {
                const rowData = headers.map((key) => row[key] || "");
                worksheet.addRow(rowData);
            });

            // Style header row
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true, name: 'Arial', size: 11 };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            saveAs(blob, "EmployeeDump.xlsx");

        } catch (error) {
            console.error("Export error:", error);
            toastService.error("Something went wrong during export.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            {isSubmitting && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        background: "rgba(255,255,255,0.7)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        className="spinner-border text-primary"
                        style={{ width: 60, height: 60, fontSize: 32 }}
                        role="status"
                    >
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}
            <Header pageTitle={"Employee Dump"} />
            <Sidebar />
            <div className="middle">
                <div className="card_tb p-3">
                    <div className="row">
                        <div className="field col-12 col-sm-6 col-md-4 col-lg-2 mb-3">
                            <label htmlFor="facility" className="form-label">Facility <span className="text-danger">*</span></label>
                            <Dropdown
                                id="facility"
                                placeholder="Select Facility"
                                className="w-100"
                                options={facilities}
                                value={selectedFacility}
                                onChange={(e) => {
                                    setSelectedFacility(e.value);

                                }}
                            // defaultValue={1}
                            />
                        </div>
                        {/* <div className="field col-3 mb-3">
                            <label>Process</label>
                            <Dropdown
                                id="process"
                                placeholder="Select Process"
                                className="w-100"
                                filter


                            />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Trip Type</label>
                            <Dropdown
                                placeholder="Select"
                                className="w-100"

                            />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Day Type</label>
                            <Dropdown
                                placeholder="Select"
                                className="w-100"

                            />
                        </div> */}
                        <div className="field col-12 col-sm-6 col-md-4 col-lg-2 mb-3">
                            {/* <div className="form-check">
                                <input type="radio" className="form-check-input" name="status" id="active" value="Active" />
                                <label htmlFor="active" className="form-check-label">Active</label>
                            </div>
                            <div className="form-check">
                                <input type="radio" className="form-check-input" name="status" id="attrited" value="Attrited" />
                                <label htmlFor="attrited" className="form-check-label">Attrited</label>
                            </div>
                            <div className="form-check mb-2">
                                <input type="radio" className="form-check-input" name="status" id="both" value="Both" />
                                <label htmlFor="both" className="form-check-label">Both</label>
                            </div> */}
                            <label htmlFor="status" className="form-label d-block mb-2">Status <span className="text-danger">*</span></label>

                            <select
                                id="status"
                                className="form-select w-100"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="N">Active</option>
                                <option value="Y">Attrited</option>
                                <option value="A">Both</option>
                            </select>

                            {/* Export Button */}
                            {/* <button className="btn btn-primary w-100">Export Employee Dump</button> */}
                        </div>
                        <div className="field col-12 col-sm-6 col-md-4 col-lg-3 mb-3 no-label">
                            <ReportButton
                                label="Export Employee Dump"
                                onClick={handleExport}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                </div>
            </div>

        </div >
    )
};
export default EmpDump;