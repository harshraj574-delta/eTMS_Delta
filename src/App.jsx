import { useState, useEffect, lazy, Suspense } from "react";
import useSessionStore from "./store/useSessionStore";
import ConsentModal from "./components/ConsentModal";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import { Routes, Route, useNavigate } from "react-router-dom";
// import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "primereact/resources/themes/saga-blue/theme.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

// ── Eagerly loaded (app shell — needed on first paint / every route) ──────────
import Login from "./components/Login";
import PrivateRoute from "./components/PrivateRoute";
import Unauthorized from "./components/Unauthorized"; // Make sure path matches
import NotFound from "./components/NotFound";
import AnnouncementBar from "./components/common/AnnouncementBar";
import Loader from "./components/common/Loader";
import ErrorBoundary from "./components/common/ErrorBoundary";

// ── Lazily loaded route pages (each becomes its own on-demand chunk) ──────────
const MyFeedback = lazy(() => import("./components/MyFeedback"));
const MyNoShow = lazy(() => import("./components/MyNoShow"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const MySchedule = lazy(() => import("./components/MySchedule"));
const ManageEmployee = lazy(() => import("./components/ManageEmployee"));
const ReplicateSchedule = lazy(() => import("./components/ReplicateSchedule"));
const DriverMaster = lazy(() => import("./components/DriverMaster"));
const VehicleMaster = lazy(() => import("./components/VehicleMaster"));
const VendorMaster = lazy(() => import("./components/VendorMaster"));
const GuardMaster = lazy(() => import("./components/GuardMaster"));
const VehicleTypeMaster = lazy(() => import("./components/VehicleTypeMaster"));
const AdhocManagement = lazy(() => import("./components/AdhocManagement"));
const MyAdhocRequest = lazy(() => import("./components/MyAdhocRequest"));
const ViewMyRoutes = lazy(() => import("./components/ViewMyRoutes"));
const ManageRoute = lazy(() => import("./components/ManageRoute"));
const CostMaster = lazy(() => import("./components/CostMaster"));
const CostMasterPackage = lazy(() => import("./components/CostMasterPackage"));
const VendorWiseBilling = lazy(() => import("./components/VendorWiseBilling"));
const SummaryPackageReport = lazy(() => import("./components/SummaryPackageReport"));
const PenaltyMaster = lazy(() => import("./components/PenaltyMaster"));
const ComplianceCheck = lazy(() => import("./components/ComplianceCheck"));
const DetailedBillingReport = lazy(() => import("./components/DetailedBillingReport"));
const EmployeeWiseBillingReport = lazy(() => import("./components/EmployeeWiseBillingReport"));
const RouteMap = lazy(() => import("./components/RouteMap"));
const SystemSetting = lazy(() => import("./components/SystemSetting"));
const ShiftTimeMaster = lazy(() => import("./components/ShiftTimeMaster"));
const MyProfile = lazy(() => import("./components/MyProfile"));
const VendorAllocation = lazy(() => import("./components/VendorAllocation"));
const AdminSchedule = lazy(() => import("./components/AdminSchedule"));
const EmpDump = lazy(() => import("./components/EmpDump"));
const RouteDeletion = lazy(() => import("./components/RouteDeletion"));
const ShiftTimeMasterAdhoc = lazy(() => import("./components/ShiftTimeMasterAdhoc"));

// Deepak
const Location = lazy(() => import("./components/MasterPages/Location"));
const FacilityMaster = lazy(() => import("./components/MasterPages/FacilityMaster"));
const ProcessMaster = lazy(() => import("./components/ProcessMaster"));
const FeedbackMaster = lazy(() => import("./components/FeedbackMaster"));
const OTAReport = lazy(() => import("./components/OTAReport"));
const RepNoShow = lazy(() => import("./components/RepNoShow"));
const RepVehUsgVen = lazy(() => import("./components/RepVehUsgVen"));
const TrackingReport = lazy(() => import("./components/TrackingReport"));
const RepFeedbackReport = lazy(() => import("./components/FeedbackReport"));
const RepCabCompliance = lazy(() => import("./components/RepCabCompliance"));
const PerEmployeeBilling = lazy(() => import("./components/PerEmployeeBilling"));
const RepPlanAct = lazy(() => import("./components/RepPlanAct"));
const RepScheduleSummery = lazy(() => import("./components/RepScheduleSummery"));
const EmpAccessRights = lazy(() => import("./components/EmpAccessRights"));
const ManageMenu = lazy(() => import("./components/ManageMenu"));
const EmployeeMaster = lazy(() => import("./components/EmployeeMaster"));
const MapGeocoding = lazy(() => import("./components/MapGeocoding"));
const ReplicateRoster = lazy(() => import("./components/ReplicateRoster"));
const ReplicationException = lazy(() => import("./components/ReplicationException"));
const ReplyFeedback = lazy(() => import("./components/ReplyFeedback"));
const ManageColony = lazy(() => import("./components/ManageColony"));
const FemaleTrack = lazy(() => import("./components/FemaleTrack"));
const DummyTripSheet = lazy(() => import("./components/DummyTripSheet"));
const DummyTripSheetEntry = lazy(() => import("./components/DummyTripSheetEntry"));
const HelpDesk = lazy(() => import("./components/HelpDesk"));
const ScrollingMessages = lazy(() => import("./components/ScrollingMessages"));
const DisclaimerMaster = lazy(() => import("./components/DisclaimerMaster"));
const EmployeeRecordSwapping = lazy(() => import("./components/EmployeeRecordSwapping"));
const EmpSpoc = lazy(() => import("./components/EmpSpoc"));
const RoutingConfig = lazy(() => import("./components/RoutingConfig"));
const AdhocChange = lazy(() => import("./components/AdhocChange"));
const HrImportExcel = lazy(() => import("./components/HRImportExcel"));
const BCPMaster = lazy(() => import("./components/BCPMaster"));
const ExportRoster = lazy(() => import("./components/ExportRoster"));
const ExportRouteDetail = lazy(() => import("./components/ExportRouteDetail"));

function App() {
  const navigate              = useNavigate();
  const isAuthenticated       = useSessionStore((state) => state.isAuthenticated);
  const disclaimerStatus      = useSessionStore((state) => state.user?.DisclaimerStatus);
  const updateDisclaimerStatus = useSessionStore((state) => state.updateDisclaimerStatus);
  const startTour             = useSessionStore((state) => state.startTour);

  const showConsentModal =
    isAuthenticated &&
    (Number(disclaimerStatus) === 0 || Number(disclaimerStatus) === 2);

  useEffect(() => {
    if (!isAuthenticated) {
      sessionStorage.removeItem("etms_dismissed_announcements");
    }
  }, [isAuthenticated]);

  const handleConsentAgree = () => {
    // Capture the original status BEFORE updating it.
    // DisclaimerStatus === 0 means first-ever login (API-provided signal).
    // DisclaimerStatus === 2 means disclaimer was updated by admin — no tour.
    const isFirstTimeUser = Number(disclaimerStatus) === 0;
    updateDisclaimerStatus(1);
    if (isFirstTimeUser) {
      startTour();          // sets tourPending=true, tourPage='profile' in Zustand
      navigate('/MyProfile'); // take user to the first tour page
    }
  };

  return (
    <>
      {showConsentModal && (
        <ConsentModal onAgree={handleConsentAgree} />
      )}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="light"
        limit={5}
      />
      {isAuthenticated && !showConsentModal && <AnnouncementBar />}
      <ErrorBoundary>
        <Suspense fallback={<Loader fullScreen />}>
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
          <Route path="/ReplicationException" element={<PrivateRoute element={<ReplicationException />} />} />
          <Route path="/ReplyFeedback" element={<PrivateRoute element={<ReplyFeedback />} />} />
          <Route path="/ManageColony" element={<PrivateRoute element={<ManageColony />} />} />
          <Route path="/FemaleTrack" element={<PrivateRoute element={<FemaleTrack />} />} />
          <Route path="/DummyTripsheetGen" element={<PrivateRoute element={<DummyTripSheet />} />} />
          <Route path="/DummyTripsheetEntry" element={<PrivateRoute element={<DummyTripSheetEntry />} />} />
          <Route path="/HelpDesk" element={<PrivateRoute element={<HelpDesk />} />} />
          <Route path="/EmpSpoc" element={<PrivateRoute element={<EmpSpoc />} />} />
          <Route path="/RoutingConfig" element={<PrivateRoute element={<RoutingConfig />} />} />
          <Route path="/ScrollingMessages" element={<PrivateRoute element={<ScrollingMessages />} />} />
          <Route path="/DisclaimerMaster" element={<PrivateRoute element={<DisclaimerMaster />} />} />
          <Route path="/EmployeeRecordSwapping" element={<PrivateRoute element={<EmployeeRecordSwapping />} />} />
          <Route path="/AdhocChange" element={<PrivateRoute element={<AdhocChange />} />} />
          <Route path="/EmpXlsDataUpload" element={<PrivateRoute element={<HrImportExcel />} />} />
          <Route path="/BCPMaster" element={<PrivateRoute element={<BCPMaster />} />} />
          <Route path="/ExportRoster" element={<PrivateRoute element={<ExportRoster />} />} />
          <Route path="/rptRouteDetail" element={<PrivateRoute element={<ExportRouteDetail />} />} />


          {/* <Route path="/EmpDump" element={<EmpDump />} /> */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
export default App;
