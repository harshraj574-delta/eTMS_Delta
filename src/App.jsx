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
import EmpDump from "./components/EmpDump";
import PrivateRoute from "./components/PrivateRoute";
import Unauthorized from "./components/Unauthorized"; // Make sure path matches
import RouteDeletion from "./components/RouteDeletion";
import ShiftTimeMasterAdhoc from "./components/ShiftTimeMasterAdhoc";
import NotFound from "./components/NotFound";

// Deepak
import Location from "./components/MasterPages/Location";
import FacilityMaster from "./components/MasterPages/FacilityMaster";
import ProcessMaster from "./components/ProcessMaster";
import FeedbackMaster from "./components/FeedbackMaster";
import OTAReport from "./components/OTAReport";
import RepNoShow from "./components/RepNoShow";
import RepVehUsgVen from "./components/RepVehUsgVen";
import TrackingReport from "./components/TrackingReport";
import RepFeedbackReport from "./components/FeedbackReport";
import RepCabCompliance from "./components/RepCabCompliance";
import PerEmployeeBilling from "./components/PerEmployeeBilling";
import RepPlanAct from "./components/RepPlanAct";
import RepScheduleSummery from "./components/RepScheduleSummery";
import EmpAccessRights from "./components/EmpAccessRights";
import ManageMenu from "./components/ManageMenu";
import EmployeeMaster from "./components/EmployeeMaster";
import MapGeocoding from "./components/MapGeocoding";
import ReplicateRoster from "./components/ReplicateRoster";
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
        <Route path="/PrivateRoute" element={<PrivateRoute />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/MyFeedback" element={<PrivateRoute element={<MyFeedback />} />} />
        <Route path="/MyNoShow" element={<PrivateRoute element={<MyNoShow />} />} />
        <Route path="/Dashboard" element={<PrivateRoute element={<Dashboard />} />} />
        <Route path="/MySchedule" element={<PrivateRoute element={<MySchedule />} />} />
        <Route path="/ManageEmployee" element={<PrivateRoute element={<ManageEmployee />} />} />
        <Route path="/ReplicateSchedule" element={<PrivateRoute element={<ReplicateSchedule />} />} />
        <Route path="/DriverMaster" element={<PrivateRoute element={<DriverMaster />} />} />
        <Route path="/VehicleMaster" element={<PrivateRoute element={<VehicleMaster />} />} />
        <Route path="/VendorMaster" element={<PrivateRoute element={<VendorMaster />} />} />
        <Route path="/GuardMaster" element={<PrivateRoute element={<GuardMaster />} />} />
        <Route path="/VehicleTypeMaster" element={<PrivateRoute element={<VehicleTypeMaster />} />} />
        <Route path="/AdhocManagement" element={<PrivateRoute element={<AdhocManagement />} />} />
        <Route path="/MyAdhocRequest" element={<PrivateRoute element={<MyAdhocRequest />} />} />
        <Route path="/ViewMyRoutes" element={<PrivateRoute element={<ViewMyRoutes />} />} />
        <Route path="/ManageRoute" element={<PrivateRoute element={<ManageRoute />} />} />
        <Route path="/RouteDeletion" element={<PrivateRoute element={<RouteDeletion />} />} />
        <Route path="/ShiftTimeMasterAdhoc" element={<PrivateRoute element={<ShiftTimeMasterAdhoc />} />} />
        {/* <Route path="/RouteMap" element={<PrivateRoute element={<RouteMap />} />} /> */}
        <Route path="/RouteMap" element={<RouteMap />} />

        {/* Deepak */}
        <Route path="/Location" element={<PrivateRoute element={<Location />} />} />
        <Route path="/FacilityMaster" element={<PrivateRoute element={<FacilityMaster />} />} />
        {/* New Pages */} 
        <Route path="/CostMaster" element={<PrivateRoute element={<CostMaster />} />} />
        <Route path="/CostMasterPackage" element={<PrivateRoute element={<CostMasterPackage />} />} />
        <Route path="/VendorWiseBilling" element={<PrivateRoute element={<VendorWiseBilling />} />} />
        <Route path="/SummaryPackageReport" element={<PrivateRoute element={<SummaryPackageReport />} />} />
        <Route path="/PenaltyMaster" element={<PrivateRoute element={<PenaltyMaster />} />} />
        <Route path="/ComplianceCheck" element={<PrivateRoute element={<ComplianceCheck />} />} />
        <Route path="/DetailedBillingReport" element={<PrivateRoute element={<DetailedBillingReport />} />} />
        <Route path="/EmployeeWiseBillingReport" element={<PrivateRoute element={<EmployeeWiseBillingReport />} />} />
        <Route path="/SystemSetting" element={<PrivateRoute element={<SystemSetting />} />} />
        <Route path="/ShiftTimeMaster" element={<PrivateRoute element={<ShiftTimeMaster />} />} />
        <Route path="/MyProfile" element={<PrivateRoute element={<MyProfile />} />} />
        <Route path="/VendorAllocation" element={<PrivateRoute element={<VendorAllocation />} />} />
        <Route path="/AdminSchedule" element={<PrivateRoute element={<AdminSchedule />} />} />
        <Route path="/EmpDump" element={<PrivateRoute element={<EmpDump />} />} />
        <Route path="/ProcessMaster" element={<PrivateRoute element={<ProcessMaster />} />} />
        <Route path="/FeedbackMater" element={<PrivateRoute element={<FeedbackMaster />} />} />
        <Route path="/OTADetailReport" element={<PrivateRoute element={<OTAReport />} />} />
        <Route path="/RepNoShow" element={<PrivateRoute element={<RepNoShow />} />} />
        <Route path="/RepVehUsgVen" element={<PrivateRoute element={<RepVehUsgVen />} />} />
        <Route path="/TrackingReport" element={<PrivateRoute element={<TrackingReport />} />} />
        <Route path="/RepFeedbackReport" element={<PrivateRoute element={<RepFeedbackReport />} />} />
        <Route path="/RepCabCompliance" element={<PrivateRoute element={<RepCabCompliance />} />} />
        <Route path="/RepArrivalVendorWise" element={<PrivateRoute element={<OTAReport />} />} />
        <Route path="/RepArrivalShiftWise" element={<PrivateRoute element={<OTAReport />} />} />
        <Route path="/PerEmployeeBilling" element={<PrivateRoute element={<PerEmployeeBilling />} />} />
        <Route path="/RepPlanAct" element={<PrivateRoute element={<RepPlanAct />} />} />
        <Route path="/RepScheduleSummery" element={<PrivateRoute element={<RepScheduleSummery />} />} />
        <Route path="/EmpAccessRights" element={<PrivateRoute element={<EmpAccessRights />} />} />
        <Route path="/ManageMenu" element={<PrivateRoute element={<ManageMenu />} />} />
        <Route path="/EmployeeMaster" element={<PrivateRoute element={<EmployeeMaster />} />} />
        <Route path="/MapGeocoding" element={<PrivateRoute element={<MapGeocoding />} />} />
        <Route path="/ReplicateRoster" element={<PrivateRoute element={<ReplicateRoster />} />} />




        {/* <Route path="/EmpDump" element={<EmpDump />} /> */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
export default App;
