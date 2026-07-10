import React, { useState, useEffect, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import AppDialog from './common/AppDialog';
import { Calendar } from 'primereact/calendar';
import { Tooltip } from 'primereact/tooltip';
import MasterSidebar from "./Master/MasterSidebar";
import { apiService } from "../services/api";
import { toastService } from "../services/toastService";
import Alert from '@mui/material/Alert';
import locationIcon from '../assets/location.png';
import calendarIcon from '../assets/calendar.png';
import Loader from "./common/Loader";
import { useProfileTour } from "../hooks/useGuidedTour";

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dnzzrvbdz/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "hqudzekg";
const PROFILE_PIC_STORAGE_KEY = "profile_picture_";

const MyProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [visible, setVisible] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [profilePicDialogVisible, setProfilePicDialogVisible] = useState(false);
  const fileInputRef = useRef(null);

  const [addressDialogVisible, setAddressDialogVisible] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [addressEffectiveDate, setAddressEffectiveDate] = useState(null);
  const [updatingAddress, setUpdatingAddress] = useState(false);

  const [medicalDialogVisible, setMedicalDialogVisible] = useState(false);
  const [medicalEffectiveDate, setMedicalEffectiveDate] = useState(null);
  const [medicalFromDate, setMedicalFromDate] = useState(null);
  const [medicalToDate, setMedicalToDate] = useState(null);
  const [updatingMedical, setUpdatingMedical] = useState(false);

  const userId = sessionStorage.getItem("ID");

  // Tour starts only after profile data has loaded — no setTimeout needed.
  useProfileTour({ isReady: !loading });

  // Label typography style
  const labelStyle = {
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: 500,
    fontSize: '16px',
    lineHeight: '24px',
    letterSpacing: '-0.01em'
  };

  // Data/value typography style
  const dataStyle = {
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '24px',
    letterSpacing: '-0.01em'
  };

  useEffect(() => {
    const stored = localStorage.getItem(PROFILE_PIC_STORAGE_KEY + userId);
    if (stored) setProfilePicUrl(stored);
  }, [userId]);

  const handlePicUpload = async (file) => {
    if (!file) return;
    setUploadingPic(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      uploadFormData.append("asset_folder", `profile_pictures/${userId}`);

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: "POST",
        body: uploadFormData,
      });
      const data = await response.json();
      if (data.secure_url) {
        setProfilePicUrl(data.secure_url);
        localStorage.setItem(PROFILE_PIC_STORAGE_KEY + userId, data.secure_url);
        window.dispatchEvent(new CustomEvent("profilePictureUpdated", { detail: { url: data.secure_url } }));
      }
    } catch (err) {
      console.error("Profile picture upload failed:", err);
    } finally {
      setUploadingPic(false);
    }
  };

  const currentMedicalStatus = profileData?.medicalStatus || "NO";

  const closeMedicalDialog = () => {
    setMedicalDialogVisible(false);
    setMedicalEffectiveDate(null);
    setMedicalFromDate(null);
    setMedicalToDate(null);
  };

  const handleMedicalUpdate = async () => {
    setUpdatingMedical(true);
    try {
      let emailId = "";
      try {
        const persisted = JSON.parse(sessionStorage.getItem("session-storage") || "{}");
        emailId = persisted?.state?.user?.EmailID || "";
      } catch (_) {}

      const newStatus = currentMedicalStatus === "YES" ? "NO" : "YES";
      const bodyDetail = newStatus === "YES"
        ? `your medical status change request from NO to YES has been received (From: ${medicalFromDate?.toLocaleDateString() || ""} - To: ${medicalToDate?.toLocaleDateString() || ""}).`
        : `your medical status change request from YES to NO has been received (Effective: ${medicalEffectiveDate?.toLocaleDateString() || ""}).`;

      await apiService.SendEmail({
        ToEmail: emailId,
        CcEmail: "",
        Subject: "Medical Status Change Request",
        Body: `<font face="Calibri">Dear Transport User,<br><br>With reference to your medical status change request, ${bodyDetail} Please log in to your eTMS to check the details.<br><br>Thanks.<br><br><br>****This is a system generated mail. Please do not reply to this mail, as the mail box is not monitored****`,
      });
      toastService.success("Your request has been raised.");
      closeMedicalDialog();
    } catch (err) {
      console.error("Medical update email failed:", err);
      toastService.error("Failed to raise request. Please try again.");
    } finally {
      setUpdatingMedical(false);
    }
  };

  const handleAddressUpdate = async () => {
    if (!newAddress.trim()) return;
    setUpdatingAddress(true);
    try {
      let emailId = "";
      try {
        const persisted = JSON.parse(sessionStorage.getItem("session-storage") || "{}");
        emailId = persisted?.state?.user?.EmailID || "";
      } catch (_) {}

      await apiService.SendEmail({
        ToEmail: emailId,
        CcEmail: "",
        Subject: "Address Change Request",
        Body: `<font face="Calibri">Dear Transport User,<br><br>We have received your address change request. Your requested address will be reviewed and updated by the concerned team. Please log in to your eTMS to track the status.<br><br>Thanks.<br><br><br>****This is a system generated mail. Please do not reply to this mail, as the mail box is not monitored****`,
      });
      toastService.success("Your address change request has been raised.");
      setAddressDialogVisible(false);
      setNewAddress('');
      setAddressEffectiveDate(null);
    } catch (err) {
      console.error("Address update email failed:", err);
      toastService.error("Failed to raise request. Please try again.");
    } finally {
      setUpdatingAddress(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiService.GetEmpGeoCodeDetails({ empid: userId });
        //console.log("Raw API Response Profile:", data);

        const parsedData = typeof data === "string" ? JSON.parse(data) : data;
        //console.log("Profile Data:", parsedData);

        setProfileData(Array.isArray(parsedData) ? parsedData[0] : parsedData);
      } catch (err) {
        console.error("API Error:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <>
      <Header
        pageTitle="My Profile"
        showNewButton={false}
        onNewButtonClick={() => {}}
      />
      <Loader isVisible={loading || updatingAddress || updatingMedical} fullScreen={true} />
      <Sidebar />
      <div class="middle">
        <div class="row mt-3">
          <div class="col-lg-12">
            <div class="row mb-4">
              <div class="col-12">
                <Alert 
                  variant="outlined" 
                  severity="warning"
                  icon={false}
                  sx={{ 
                    borderLeft: '5px solid #FFC107',
                    backgroundColor: 'white',
                    fontFamily: 'Plus Jakarta Sans',
                    fontWeight: 500,
                    fontSize: '13px',
                    lineHeight: '19px',
                    letterSpacing: '0.03em'
                  }}
                >
                  This is only to view your profile details. If you want to
                  correct or modify some details please contact to your
                  manager or support team.
                </Alert>
              </div>
            </div>

            {/* <div className="row">
              <div className="col">{JSON.stringify(profileData, null, 2)}</div>
            </div> */}

            <div class="row">
              <div class="col-12 col-lg-5 d-grid align-items-stretch mb-4 mb-lg-0">
                <div 
                  class="cardx"
                  style={{
                    width: '100%',
                    height: '680px',
                    borderRadius: '20px',
                    borderWidth: '1px',
                    boxShadow: `
                      0px 0px 0px 0px #9695971A,
                      0px 3px 7px 0px #9695971A,
                      0px 12px 12px 0px #96959717,
                      0px 27px 16px 0px #9695970D,
                      0px 48px 19px 0px #96959703,
                      0px 75px 21px 0px #96959700
                    `
                  }}
                >
                  <div class="card-body p-0">
                    <div class="d-flex justify-content-start align-items-start p-5 pt-4">
                      <div
                        id="tour-profile-pic"
                        className="me-3 position-relative"
                        style={{ width: '80px', height: '80px', flexShrink: 0, cursor: 'pointer' }}
                        onClick={() => setProfilePicDialogVisible(true)}
                      >
                        {profilePicUrl ? (
                          <img
                            src={profilePicUrl}
                            alt="Profile"
                            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' }}
                          />
                        ) : (
                          <img
                            src="images/ali1.png"
                            alt="Profile"
                            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        )}
                        <div
                          style={{
                            position: 'absolute', bottom: 0, right: 0,
                            width: '26px', height: '26px',
                            borderRadius: '50%',
                            background: uploadingPic ? '#9ca3af' : '#6366f1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid #fff',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.18)'
                          }}
                        >
                          {uploadingPic ? (
                            <span className="material-icons" style={{ fontSize: '14px', color: '#fff' }}>hourglass_top</span>
                          ) : (
                            <span className="material-icons" style={{ fontSize: '14px', color: '#fff' }}>photo_camera</span>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            handlePicUpload(e.target.files?.[0]);
                            e.target.value = "";
                          }}
                        />
                      </div>
                      <div id="tour-profile-info">
                        <h5>
                          {" "}
                          <small
                            style={{
                              fontFamily: 'Plus Jakarta Sans',
                              fontWeight: 600,
                              fontSize: '24px',
                              lineHeight: '34px',
                              letterSpacing: '-0.03em'
                            }}
                          >
                            {profileData?.empName || "No Name Found"}
                          </small>
                        </h5>
                        <ul class="personal_info">
                          <li>
                            <span class="material-icons">email</span>{" "}
                            <span style={dataStyle}>{profileData?.Email || "No Email"}</span>
                          </li>
                          <li>
                            <span class="material-icons">call</span>{" "}
                            <span style={dataStyle}>{profileData?.mobile || "No Contact"}</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <ul id="tour-transport-status" class="requi_sec" style={{ paddingLeft: '50px', paddingRight: '50px', gap: '32px' }}>
                      <li>
                        <small style={labelStyle}>Transport Required</small>{" "}
                        <span
                          className={`badge rounded-pill px-3 ${
                            profileData?.tptReqText === "Yes"
                              ? "bg-success"
                              : "bg-danger"
                          }`}
                          style={{
                            width: '88px',
                            height: '24px',
                            borderRadius: '28.95px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff'
                          }}
                        >
                          {profileData?.tptReqText === "Yes" ? "YES" : "NO"}
                        </span>
                      </li>
                      <li>
                        <small style={labelStyle}>Shuttle User</small>{" "}
                        <span
                          className="badge rounded-pill px-3 bg-danger"
                          style={{
                            width: '88px',
                            height: '24px',
                            borderRadius: '28.95px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff'
                          }}
                        >
                          NO
                        </span>
                      </li>
                      <li>
                        <small style={labelStyle}>Home Geocode </small>{" "}
                        <a
                          href="#"
                          onClick={e => { e.preventDefault(); setVisible(true); }}
                        >
                          <img
                            src={locationIcon}
                            alt="Location"
                            style={{
                              width: '30px',
                              height: '30px',
                              filter: 'brightness(0) saturate(100%) invert(62%) sepia(4%) saturate(258%) hue-rotate(138deg) brightness(96%) contrast(86%)'
                            }}
                          />
                        </a>
                        {profileData && profileData.landmark ? (
                          <span style={dataStyle}>{profileData.landmark}</span>
                        ) : (
                          <span className="text-danger" style={dataStyle}>N/A</span>
                        )}
                      </li>
                    </ul>

                    <div class="emergency_contacts">
                      <h5>
                        {" "}
                        <small>Emergency Contacts</small>
                      </h5>
                      <ul>
                        <li>
                          <small style={labelStyle}>Name</small>{" "}
                          <span style={dataStyle}>{profileData?.EmergencyName || "No Name"}</span>
                        </li>
                        <li>
                          <small style={labelStyle}>Contact</small>{" "}
                          <span style={dataStyle}>{profileData?.EmergencyNo || "No Contact"}</span>
                        </li>
                        <li>
                          <small style={labelStyle}>Name</small>{" "}
                          <span
                            className={
                              !profileData?.EmergencyName2
                                ? "text-danger fw-bold"
                                : undefined
                            }
                            style={dataStyle}
                          >
                            {profileData?.EmergencyName2 || "N/A"}
                          </span>
                        </li>
                        <li>
                          <small style={labelStyle}>Contact</small>{" "}
                          <span
                            className={
                              !profileData?.EmergencyNo2
                                ? "text-danger fw-bold"
                                : undefined
                            }
                            style={dataStyle}
                          >
                            {profileData?.EmergencyNo2 || "N/A"}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-12 col-lg-7">
                <div id="tour-personal-details">
                <div
                  class="card profile_card mb-4"
                  style={{
                    width: '100%',
                    minHeight: '310px',
                    borderRadius: '20px',
                    border: '1px solid #D2D2D2'
                  }}
                >
                  <div class="card-header border-0">Personal Details</div>
                  <div class="card-body">
                    <ul>
                      <li>
                        <span style={labelStyle}>Address</span>{" "}
                        <Tooltip target="#address-edit-btn" content="Click to request address change" position="top" />
                        <a
                          id="address-edit-btn"
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setNewAddress(profileData?.address || '');
                            setAddressEffectiveDate(null);
                            setAddressDialogVisible(true);
                          }}
                          style={{ ...dataStyle, color: '#6366f1', textDecoration: 'underline', cursor: 'pointer' }}
                        >
                          {profileData?.address || "No Address"}
                        </a>
                      </li>
                      <li>
                        <span style={labelStyle}>City</span>
                        <span
                            className={
                              !profileData?.city
                                ? "text-danger fw-bold"
                                : undefined
                            }
                            style={dataStyle}
                          >
                            {profileData?.city || "N/A"}
                          </span>
                           
                      </li>
                      <li>
                        <span style={labelStyle}>Colony</span>
                        <span
                            className={
                              !profileData?.colony
                                ? "text-danger fw-bold"
                                : undefined
                            }
                            style={dataStyle}
                          >
                            {profileData?.colony || "N/A"}
                          </span>

                      </li>
                      <li>
                        <span style={labelStyle}>Pickup Point</span>
                        <span
                          className={
                            !profileData?.landmark
                              ? "text-danger fw-bold"
                              : undefined
                          }
                          style={dataStyle}
                        >
                          {profileData?.landmark || "N/A"}
                        </span>
                      </li>
                      <li>
                        <span style={labelStyle}>Medical</span>
                        <Tooltip target="#medical-edit-btn" content="Click to request medical status change" position="top" />
                        <a
                          id="medical-edit-btn"
                          href="#"
                          onClick={(e) => { e.preventDefault(); setMedicalDialogVisible(true); }}
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <span
                            className="badge rounded-pill px-3 bg-danger"
                            style={{
                              width: '88px',
                              height: '24px',
                              borderRadius: '28.95px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff'
                            }}
                          >
                            NO
                          </span>
                          <span className="material-icons" style={{ fontSize: '14px', color: '#6366f1', lineHeight: 1 }}>edit</span>
                        </a>
                      </li>
                      <li>
                        <span style={labelStyle}>Pwd</span>
                        <span
                          className="badge rounded-pill px-3 bg-danger"
                          style={{
                            width: '88px',
                            height: '24px',
                            borderRadius: '28.95px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff'
                          }}
                        >
                          NO
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div 
                  class="card profile_card"
                  style={{
                    width: '100%',
                    minHeight: '346px',
                    borderRadius: '20px',
                    border: '1px solid #D2D2D2'
                  }}
                >
                  <div class="card-header border-0">Official Details</div>
                  <div class="card-body">
                    <ul>
                      <li>
                        <span style={labelStyle}>Employee ID</span>{" "}
                        <span style={dataStyle}>{profileData?.empCode || "No Employee ID"}</span>
                      </li>
                      <li>
                        <span style={labelStyle}>Project Code</span>{" "}
                        <span
                          className={
                            !profileData?.ProjectCode
                              ? "text-danger fw-bold"
                              : undefined
                          }
                          style={dataStyle}
                        >
                          {profileData?.ProjectCode || "N/A"}
                        </span>
                      </li>
                      <li>
                        <span style={labelStyle}>Project</span>{" "}
                        <span style={dataStyle}>{profileData?.ProcessName || "No Project Name"}</span>
                      </li>
                      <li>
                        <span style={labelStyle}>Facility</span>{" "}
                        <span
                          className={
                            !profileData?.Facility
                              ? "text-danger fw-bold"
                              : undefined
                          }
                          style={dataStyle}
                        >
                          {profileData?.Facility || "N/A"}
                        </span>
                      </li>
                      <li>
                        <span style={labelStyle}>Manager</span>{" "}
                        <span
                          className={
                            !profileData?.Manager
                              ? "text-danger fw-bold"
                              : undefined
                          }
                          style={dataStyle}
                        >
                          {profileData?.Manager || "N/A"}
                        </span>
                      </li>
                      <li>
                        <span style={labelStyle}>Surrogate Manager</span>{" "}
                        {profileData?.Spoc ? (
                          <span style={dataStyle}>{profileData.Spoc}</span>
                        ) : (
                          <span className="text-danger" style={dataStyle}>N/A</span>
                        )}
                      </li>
                    </ul>
                  </div>
                </div>
                </div>{/* /tour-personal-details */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Medical Status Change Sidebar */}
      <MasterSidebar
        show={medicalDialogVisible}
        onClose={closeMedicalDialog}
        title="Update Medical Status"
        width="400px"
        footerButtons={[
          {
            label: "Cancel",
            className: "btn btn-outline-secondary",
            onClick: closeMedicalDialog,
            disabled: updatingMedical,
          },
          {
            label: updatingMedical ? "Submitting..." : "Submit Request",
            className: "btn btn-success",
            onClick: handleMedicalUpdate,
            disabled: updatingMedical || (
              currentMedicalStatus === "YES"
                ? !medicalEffectiveDate
                : !medicalFromDate || !medicalToDate
            ),
          },
        ]}
      >
        <div className="p-3">
          <div className="mb-4" style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', padding: '14px 16px', display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: '5px' }}>Current</div>
              <span style={{
                display: 'inline-block', padding: '2px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
                background: currentMedicalStatus === "YES" ? '#d1fae5' : '#fee2e2',
                color: currentMedicalStatus === "YES" ? '#065f46' : '#991b1b',
                border: `1px solid ${currentMedicalStatus === "YES" ? '#a7f3d0' : '#fca5a5'}`
              }}>
                {currentMedicalStatus}
              </span>
            </div>
            <span className="material-icons" style={{ fontSize: '16px', color: '#9ca3af', margin: '0 10px' }}>arrow_forward</span>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: '5px' }}>Requested</div>
              <span style={{
                display: 'inline-block', padding: '2px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
                background: currentMedicalStatus === "YES" ? '#fee2e2' : '#d1fae5',
                color: currentMedicalStatus === "YES" ? '#991b1b' : '#065f46',
                border: `1px solid ${currentMedicalStatus === "YES" ? '#fca5a5' : '#a7f3d0'}`
              }}>
                {currentMedicalStatus === "YES" ? "NO" : "YES"}
              </span>
            </div>
          </div>

          {currentMedicalStatus === "YES" ? (
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Effective Date <span className="text-danger">*</span>
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <img src={calendarIcon} alt="calendar" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', zIndex: 2, pointerEvents: 'none' }} />
                <Calendar
                  className="w-100"
                  inputStyle={{ paddingLeft: '36px' }}
                  value={medicalEffectiveDate}
                  onChange={(e) => setMedicalEffectiveDate(e.value)}
                  minDate={new Date()}
                  dateFormat="mm/dd/yy"
                  placeholder="Select effective date"
                  appendTo={document.body}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  From Date <span className="text-danger">*</span>
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <img src={calendarIcon} alt="calendar" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', zIndex: 2, pointerEvents: 'none' }} />
                  <Calendar
                    className="w-100"
                    inputStyle={{ paddingLeft: '36px' }}
                    value={medicalFromDate}
                    onChange={(e) => { setMedicalFromDate(e.value); if (medicalToDate && e.value > medicalToDate) setMedicalToDate(null); }}
                    minDate={new Date()}
                    dateFormat="mm/dd/yy"
                    placeholder="Select from date"
                    appendTo={document.body}
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  To Date <span className="text-danger">*</span>
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <img src={calendarIcon} alt="calendar" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', zIndex: 2, pointerEvents: 'none' }} />
                  <Calendar
                    className="w-100"
                    inputStyle={{ paddingLeft: '36px' }}
                    value={medicalToDate}
                    onChange={(e) => setMedicalToDate(e.value)}
                    minDate={medicalFromDate || new Date()}
                    dateFormat="mm/dd/yy"
                    placeholder="Select to date"
                    appendTo={document.body}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </MasterSidebar>

      {/* Address Change Sidebar */}
      <MasterSidebar
        show={addressDialogVisible}
        onClose={() => { setAddressDialogVisible(false); setNewAddress(''); setAddressEffectiveDate(null); }}
        title="Update Address"
        width="400px"
        footerButtons={[
          {
            label: "Cancel",
            className: "btn btn-outline-secondary",
            onClick: () => { setAddressDialogVisible(false); setNewAddress(''); setAddressEffectiveDate(null); },
            disabled: updatingAddress,
          },
          {
            label: updatingAddress ? "Updating..." : "Update",
            className: "btn btn-success",
            onClick: handleAddressUpdate,
            disabled: updatingAddress || !newAddress.trim() || !addressEffectiveDate,
          },
        ]}
      >
        <div className="p-3">
          <div className="mb-3">
            <label className="form-label fw-semibold">Address</label>
            <textarea
              className="form-control"
              placeholder="Enter new address"
              rows={3}
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">
              Effective Date <span className="text-danger">*</span>
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <img
                src={calendarIcon}
                alt="calendar"
                style={{
                  position: 'absolute', left: '10px', top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px', height: '20px',
                  zIndex: 2, pointerEvents: 'none'
                }}
              />
              <Calendar
                className="w-100"
                inputStyle={{ paddingLeft: '36px' }}
                value={addressEffectiveDate}
                onChange={(e) => setAddressEffectiveDate(e.value)}
                minDate={new Date()}
                dateFormat="mm/dd/yy"
                placeholder="Select effective date"
                appendTo={document.body}
              />
            </div>
          </div>
        </div>
      </MasterSidebar>

      {/* Profile Picture Dialog */}
      <AppDialog
        title="Profile Photo"
        icon="pi pi-camera"
        iconColor="#6366f1"
        visible={profilePicDialogVisible}
        onHide={() => setProfilePicDialogVisible(false)}
        size="sm"
        footer={null}
      >
        <div style={{ textAlign: 'center', padding: '4px 0 12px' }}>

          {/* Avatar with brand ring */}
          <div style={{ display: 'inline-block', position: 'relative', marginBottom: '16px' }}>
            <div style={{ width: '124px', height: '124px', borderRadius: '50%', padding: '3px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'inline-block' }}>
              <img
                src={profilePicUrl || "images/ali1.png"}
                alt="Profile"
                style={{ width: '118px', height: '118px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', display: 'block' }}
              />
            </div>
            {uploadingPic && (
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-icons" style={{ color: '#fff', fontSize: '28px' }}>hourglass_top</span>
              </div>
            )}
          </div>

          {/* Identity */}
          <div style={{ fontWeight: 700, fontSize: '17px', fontFamily: 'Plus Jakarta Sans', color: '#111827', lineHeight: '24px' }}>
            {profileData?.empName || ""}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '3px' }}>
            {profileData?.Email || ""}
          </div>
          {profileData?.empCode && (
            <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '11px', fontWeight: 600, color: '#6366f1', background: '#eef2ff', padding: '2px 12px', borderRadius: '20px', letterSpacing: '0.05em' }}>
              {profileData.empCode}
            </span>
          )}

          <hr style={{ margin: '18px 0 14px', borderColor: '#f3f4f6' }} />

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <button
              style={{ width: '100%', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, background: '#6366f1', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: uploadingPic ? 'not-allowed' : 'pointer', opacity: uploadingPic ? 0.7 : 1 }}
              disabled={uploadingPic}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="material-icons" style={{ fontSize: '16px' }}>upload</span>
              {uploadingPic ? "Uploading..." : "Upload New Photo"}
            </button>

            {profilePicUrl && (
              <button
                style={{ background: 'none', border: 'none', fontSize: '12px', color: '#9ca3af', cursor: 'pointer', padding: '2px 0', display: 'flex', alignItems: 'center', gap: '5px' }}
                disabled={uploadingPic}
                onClick={() => {
                  localStorage.removeItem(PROFILE_PIC_STORAGE_KEY + userId);
                  setProfilePicUrl(null);
                  window.dispatchEvent(new CustomEvent("profilePictureUpdated", { detail: { url: null } }));
                  setProfilePicDialogVisible(false);
                }}
              >
                <span className="material-icons" style={{ fontSize: '14px' }}>delete_outline</span>
                Remove photo
              </button>
            )}
          </div>
        </div>
      </AppDialog>

      {/* Maps Popup */}
      <AppDialog
        title="Home Geocode"
        icon="pi pi-map-marker"
        iconColor="#3b82f6"
        visible={visible}
        onHide={() => setVisible(false)}
        size="xl"
        footer={null}
        style={{ width: '90vw', minHeight: '90vh' }}
      >
        <div className="m-0">
          {profileData && profileData.geoX && profileData.geoY ? (
            <iframe
              title="Nodal Point Map"
              width="100%"
              height="700px"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${profileData.geoY},${profileData.geoX}&z=15&output=embed`}
            />
          ) : profileData && profileData.landmark ? (
            <iframe
              title="Nodal Point Map"
              width="100%"
              height="700px"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(profileData.landmark)}&z=15&output=embed`}
            />
          ) : (
            <div className="text-danger">No location data available</div>
          )}
        </div>
      </AppDialog>
    </>
  );
};

export default MyProfile;
