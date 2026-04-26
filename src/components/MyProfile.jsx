import React, { useState, useEffect } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { apiService } from "../services/api";
import Alert from '@mui/material/Alert';
import locationIcon from '../assets/location.png';
import Loader from "./common/Loader";

const MyProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [visible, setVisible] = useState(false);

  const userId = sessionStorage.getItem("ID");

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
      <Loader isVisible={loading} fullScreen={true} />
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
                      <img src="images/ali1.png" class="me-3" alt="" />
                      <div>
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

                    <ul class="requi_sec" style={{ paddingLeft: '50px', paddingRight: '50px', gap: '32px' }}>
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
                        <span style={dataStyle}>{profileData?.address || "No Address"}</span>
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Maps Popup */}
      <Dialog
        header="Home Geocode"
        visible={visible} 
        style={{ width: '90vw', minHeight: '90vh' }} 
        onHide={() => setVisible(false)}
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
      </Dialog>
    </>
  );
};

export default MyProfile;
