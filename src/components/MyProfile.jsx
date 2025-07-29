import React, { useState, useEffect } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { apiService } from "../services/api";
import { BiMap } from "react-icons/bi";

const MyProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [visible, setVisible] = useState(false);

  const userId = sessionStorage.getItem("ID");

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
      <Sidebar />
      <div class="middle">
        <div class="row mt-3">
          <div class="col-lg-12">
            <div class="row mb-4">
              <div class="col-12">
                <div class="card border-warning alert-dismissible">
                  <div class="card-body d-flex justify-content-start align-items-center cutoff">
                    <p class="overline_text">
                      This is only to view your profile details. If you want to
                      correct or modify some details please contact to your
                      manager or support team.
                    </p>
                    {/* <button
                      type="button"
                      class="btn-close"
                      data-bs-dismiss="alert"
                      aria-label="Close"
                    ></button> */}
                  </div>
                </div>
              </div>
            </div>

            {/* <div className="row">
              <div className="col">{JSON.stringify(profileData, null, 2)}</div>
            </div> */}

            <div class="row">
              <div class="col-5 d-grid align-items-stretch">
                <div class="cardx">
                  <div class="card-body p-0">
                    <div class="d-flex justify-content-start align-items-start p-5 pt-4">
                      <img src="images/ali1.png" class="me-3" alt="" />
                      <div>
                        <h5>
                          {" "}
                          <small>
                            {profileData?.empName || "No Name Found"}
                          </small>
                        </h5>
                        <ul class="personal_info">
                          <li>
                            <span class="material-icons">email</span>{" "}
                            {profileData?.Email || "No Email"}
                          </li>
                          <li>
                            <span class="material-icons">call</span>{" "}
                            {profileData?.mobile || "No Contact"}
                          </li>
                        </ul>
                      </div>
                    </div>

                    <ul class="requi_sec">
                      <li>
                        <small>Transport Required</small>{" "}
                        <span
                          className={`badge rounded-pill px-3 ${
                            profileData?.tptReqText === "Yes"
                              ? "bg-success"
                              : "bg-danger"
                          }`}
                        >
                          {profileData?.tptReqText === "Yes" ? "YES" : "NO"}
                        </span>
                      </li>
                      <li>
                        <small>Nodal Point </small>{" "}
                        {/* {profileData?.geoX}-{profileData?.geoY} */}
                        <a href="#" onClick={e => { e.preventDefault(); setVisible(true); }}><BiMap /></a>
                        {/* <span
                          style={{
                            cursor:
                              profileData && profileData.geoX && profileData.geoY
                                ? "pointer"
                                : "default",
                          }}
                          onClick={() => {
                            if (profileData && profileData.geoX && profileData.geoY) {
                              window.open(
                                `https://www.google.com/maps?q=${profileData.geoX},${profileData.geoY}`,
                                "_blank"
                              );
                            } else if (profileData && profileData.landmark) {
                              const query = encodeURIComponent(
                                profileData.landmark
                              );
                              window.open(
                                `https://www.google.com/maps/search/?api=1&query=${query}`,
                                "_blank"
                              );
                            }
                          }}
                        >
                          <BiMap
                            style={{
                              color:
                                profileData && profileData.geoX && profileData.geoY
                                  ? "#007bff"
                                  : undefined,
                            }}
                          />
                        </span>{" "} */}
                        {profileData && profileData.landmark ? (
                          profileData.landmark
                        ) : (
                          <span className="text-danger">N/A</span>
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
                          <small>Name</small>{" "}
                          {profileData?.EmergencyName || "No Name"}
                        </li>
                        <li>
                          <small>Contact</small>{" "}
                          {profileData?.EmergencyNo || "No Contact"}
                        </li>
                        <li>
                          <small>Name</small>{" "}
                          <span
                            className={
                              !profileData?.EmergencyName2
                                ? "text-danger fw-bold"
                                : undefined
                            }
                          >
                            {profileData?.EmergencyName2 || "N/A"}
                          </span>
                        </li>
                        <li>
                          <small>Contact</small>{" "}
                          <span
                            className={
                              !profileData?.EmergencyNo2
                                ? "text-danger fw-bold"
                                : undefined
                            }
                          >
                            {profileData?.EmergencyNo2 || "N/A"}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-7">
                <div class="card profile_card mb-4">
                  <div class="card-header border-0">Personal Details</div>
                  <div class="card-body">
                    <ul>
                      <li>
                        <span>Address</span>{" "}
                        {profileData?.address || "No A ddress"}
                      </li>
                      <li>
                        <span>City</span>
                        <span
                            className={
                              !profileData?.city
                                ? "text-danger fw-bold"
                                : undefined
                            }
                          >
                            {profileData?.city || "N/A"}
                          </span>
                           
                      </li>
                      <li>
                        <span>Colony</span>
                        <span
                            className={
                              !profileData?.colony
                                ? "text-danger fw-bold"
                                : undefined
                            }
                          >
                            {profileData?.colony || "N/A"}
                          </span>
                           
                      </li>
                    </ul>
                  </div>
                </div>

                <div class="card profile_card">
                  <div class="card-header border-0">Official Details</div>
                  <div class="card-body">
                    <ul>
                      <li>
                        <span>Employee ID</span>{" "}
                        {profileData?.empCode || "No Employee ID"}
                      </li>
                      <li>
                        <span>Project Code</span>{" "}
                        <span
                          className={
                            !profileData?.ProjectCode
                              ? "text-danger fw-bold"
                              : undefined
                          }
                        >
                          {profileData?.ProjectCode || "N/A"}
                        </span>
                      </li>
                      <li>
                        <span>Project</span>{" "}
                        {profileData?.ProcessName || "No Project Name"}
                      </li>
                      <li>
                        <span>Facility</span>{" "}
                        <span
                          className={
                            !profileData?.Facility
                              ? "text-danger fw-bold"
                              : undefined
                          }
                        >
                          {profileData?.Facility || "N/A"}
                        </span>
                      </li>
                      <li>
                        <span>Manager</span>{" "}
                        <span
                          className={
                            !profileData?.Manager
                              ? "text-danger fw-bold"
                              : undefined
                          }
                        >
                          {profileData?.Manager || "N/A"}
                        </span>
                      </li>
                      <li>
                        <span>Surrogate Manager</span>{" "}
                        {profileData?.Spoc ? (
                          profileData.Spoc
                        ) : (
                          <span className="text-danger">N/A</span>
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
      <div className="card flex justify-content-center">
        <Dialog 
          header="Nodal Point Location"
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
      </div>
    </>
  );
};

export default MyProfile;
