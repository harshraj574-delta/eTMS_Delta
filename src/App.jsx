import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Login from "./components/Login";
import MyFeedback from "./components/MyFeedback";
import MyNoShow from "./components/MyNoShow";
import { Routes, Route } from "react-router-dom";
// import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Dashboard from "./components/Dashboard";
import MySchedule from "./components/MySchedule";
import ManageEmployee from "./components/ManageEmployee";
import ReplicateSchedule from "./components/ReplicateSchedule";
import DriverMaster from "./components/DriverMaster";
import VehicleMaster from "./components/VehicleMaster";
import VendorMaster from "./components/VendorMaster";
//import GuardMaster from './components/GuardMaster'
import GuardMaster from "./components/GuardMaster";
import VehicleTypeMaster from "./components/VehicleTypeMaster";
import AdhocManagement from "./components/AdhocManagement";
import MyAdhocRequest from "./components/MyAdhocRequest";
import ViewMyRoutes from "./components/ViewMyRoutes";
import ManageRoute from "./components/ManageRoute";
import CostMaster from "./components/CostMaster";
import CostMasterPackage from "./components/CostMasterPackage";
import VendorWiseBilling from "./components/VendorWiseBilling";
import SummaryPackageReport from "./components/SummaryPackageReport";
import PenaltyMaster from "./components/PenaltyMaster";
import ComplianceCheck from "./components/ComplianceCheck";
import DetailedBillingReport from "./components/DetailedBillingReport";
import EmployeeWiseBillingReport from "./components/EmployeeWiseBillingReport";
import "primereact/resources/themes/saga-blue/theme.css";
import RouteMap from "./components/RouteMap";
import SystemSetting from "./components/SystemSetting";
import ShiftTimeMaster from "./components/ShiftTimeMaster";
import MyProfile from "./components/MyProfile";
import VendorAllocation from "./components/VendorAllocation";
import AdminSchedule from "./components/AdminSchedule";


// Deepak
import Location from "./components/MasterPages/Location";
import FacilityMaster from "./components/MasterPages/FacilityMaster";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/MyFeedback" element={<MyFeedback />} />
        <Route path="/MyNoShow" element={<MyNoShow />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/MySchedule" element={<MySchedule />} />
        <Route path="/ManageEmployee" element={<ManageEmployee />} />
        <Route path="/ReplicateSchedule" element={<ReplicateSchedule />} />
        <Route path="/DriverMaster" element={<DriverMaster />} />F
        <Route path="/VehicleMaster" element={<VehicleMaster />} />
        <Route path="/VendorMaster" element={<VendorMaster />} />
        <Route path="/GuardMaster" element={<GuardMaster />} />
        <Route path="/VehicleTypeMaster" element={<VehicleTypeMaster />} />
        <Route path="/AdhocManagement" element={<AdhocManagement />} />
        <Route path="/MyAdhocRequest" element={<MyAdhocRequest />} />
        <Route path="/ViewMyRoutes" element={<ViewMyRoutes />} />
        <Route path="/ManageRoute" element={<ManageRoute />} />
        <Route path="/RouteMap" element={<RouteMap />} />
        {/* Deepak */}
        <Route path="/Location" element={<Location />} />
        <Route path="/FacilityMaster" element={<FacilityMaster />} />
        {/* New Pages */}
        <Route path="/CostMaster" element={<CostMaster />} />
        <Route path="/CostMasterPackage" element={<CostMasterPackage />} />
        <Route path="/VendorWiseBilling" element={<VendorWiseBilling />} />
        <Route path="/SummaryPackageReport" element={<SummaryPackageReport />} />
        <Route path="/PenaltyMaster" element={<PenaltyMaster />} />
        <Route path="/ComplianceCheck" element={<ComplianceCheck />} />
        <Route path="/DetailedBillingReport" element={<DetailedBillingReport />} />
        <Route path="/EmployeeWiseBillingReport" element={<EmployeeWiseBillingReport />} />
        <Route path="/SystemSetting" element={<SystemSetting />} />
        <Route path="/ShiftTimeMaster" element={<ShiftTimeMaster />} />
        <Route path="/MyProfile" element={<MyProfile />} />
        <Route path="/VendorAllocation" element={<VendorAllocation />} />
        <Route path="/AdminSchedule" element={<AdminSchedule />} />

      </Routes>
    </>
  );
}
export default App;
