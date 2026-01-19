<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="gpstrackingnew.aspx.cs" Inherits="eTMSACENDashBoard.gpstrackingnew" %>

<!DOCTYPE html>


<html>

<head>
    <title>eTMS Drive - Location Tracking</title>
    <meta name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=yes, minimal-ui">


    <meta http-equiv="X-UA-Compatible" content="IE=edge" />

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
    <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>

    <script
        src="https://apis.mapmyindia.com/advancedmaps/v1/fd0b726bc35998059cee40b4d331acf2/map_load?v=1.5&plugin=polylinedecorator,path.drag"></script>

    <link rel="stylesheet" href="https://code.jquery.com/ui/1.10.3/themes/smoothness/jquery-ui.css" />
    <script src="https://code.jquery.com/ui/1.10.3/jquery-ui.js"></script>
    <script src='https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/Leaflet.fullscreen.min.js'></script>
    <link href='https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/leaflet.fullscreen.css'
        rel='stylesheet' />
    <!-- Latest compiled and minified CSS -->
    <!-- <link rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.12.4/css/bootstrap-select.min.css"> -->
    <!-- Latest compiled and minified JavaScript -->
    <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.12.4/js/bootstrap-select.min.js"></script> -->
    <!-- (Optional) Latest compiled and minified JavaScript translation files -->

    <!-- Bootstrap CSS -->
    <!-- <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"> -->
    <!-- Bootstrap Select CSS -->
    <!-- <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.14.0-beta3/css/bootstrap-select.min.css" rel="stylesheet"> -->

    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">

    <link href="https://cdnjs.cloudflare.com/ajax/libs/choices.js/10.0.0/styles/choices.min.css" rel="stylesheet" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/choices.js/10.0.0/choices.min.js"></script>

    <link rel="shortcut icon" href="data:image/x-icon;," type="image/x-icon">

    <link href="css/bootstrap.min.css" rel="stylesheet">
    <link href="css/style.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    </style>

    <style>
        .container {
            display: flex;
            align-items: flex-start;
            gap: 20px;
        }

        .custom-select {
            position: relative;
            width: 500px;
        }

        .select-box {
            background-color: #ffffff;
            border: 1px solid #ced4da;
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 56px;
            padding: 0 10px;
            cursor: pointer;
        }

        .selected-options {
            display: flex;
            flex-wrap: wrap;
            margin-top: 0;
        }

        .tag {
            background-color: #f2f2f2;
            color: #000;
            border-radius: 5px;
            margin-right: 5px;
            padding: 3px 4px;
            display: flex;
            align-items: center;
        }

        .remove-tag {
            margin-left: 6px;
            cursor: pointer;
        }

        .arrow {
            margin: 0 10px;
        }

        .fa-angle-down {
            color: #404040;
            font-size: 30px;
        }

        .options {
            display: none;
            position: absolute;
            width: 100%;
            background-color: #ffffff;
            border: 1px solid #ced4da;
            border-top: none;
            max-height: 225px;
            overflow-y: auto;
            z-index: 1;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
        }

        .open .options {
            display: block;
        }

        .option-search-tags {
            background-color: #ffffff;
            border: 1px solid #ced4da;
            padding: 8px 0px;
            margin: 8px;
        }

        .search-tags {
            width: 100%;
            border: none;
            outline: none;
            padding: 8px;
            font-size: 14px;
        }

        .clear {
            position: absolute;
            border: none;
            background-color: transparent;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            padding: 0;
            color: #000;
            top: 26px;
            left: auto;
            right: 15px;
        }

        .option {
            padding: 12px;
            cursor: pointer;
        }

            .option.active {
                color: #000;
                background-color: #f2f2f2;
                border-bottom: 1px solid #eaeaea;
            }

            .tag:hover,
            .option:hover {
                background-color: #eaeaea;
            }

        .no-result-message {
            padding: 0px 0px 12px 12px;
        }

        .error {
            color: #ff1a2a;
            margin-top: 8px;
        }
    </style>

    <style>
        .table-header-bg {
            background-color: #ff0000 !important; /* Change this to your desired color */
        }

        .modalloader, .modal-loader {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            background: rgba(255,255,255,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
        }

            .modal-loader img {
                position: absolute;
                top: 50%;
                left: 50%
            }

        #mapMultiTrips {
            position: fixed !important;
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: aqua;
        }

        #mapMultiFilterTrips {
            position: fixed !important;
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
        }

        @media screen and (max-width: 500px) {
            .topnav.responsive {
                position: relative;
            }

                .topnav.responsive .icon {
                    position: absolute;
                    right: 20px;
                    top: 0;
                }

                .topnav.responsive div {
                    float: none;
                    display: block;
                }

            #TilesControl {
                margin-left: 24px;
            }
        }

        input[type=text] {
            width: 70%;
            box-sizing: border-box;
            border-radius: 4px;
            font-size: 13px;
            background-color: white;
            background-position: 10px 10px;
            background-repeat: no-repeat;
            padding: 6px 6px 6px 6px;
            -webkit-transition: width 0.4s ease-in-out;
            transition: width 0.4s ease-in-out;
            color: black;
        }

            input[type=text]:focus {
                width: 70%;
            }

        body {
            cursor: pointer;
        }

        #tiledetails {
            z-index: 1000;
            padding-top: 1rem;
        }

        #map {
            height: 300px;
            margin: 0;
            padding: 10px;
        }

        #map2 {
            position: fixed !important;
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
        }

        a,
        a label {
            cursor: pointer;
        }

        tr,
        tr label {
            cursor: pointer;
        }

        .navbar-brand {
            padding: 0px;
        }

            .navbar-brand > img {
                height: 100%;
                width: auto;
            }
    </style>
    <style>
        .form-check-label {
            font-size: 13px;
            font-weight: 500;
            color: var(--grey-4);
            margin-bottom: 6px;
            margin-left: 3px;
        }

        .form-check-input {
            border-radius: 2.7px;
            border: solid 0.7px var(--grey-3);
            width: 18px;
            height: 18px;
        }

        .form-select, .form-control {
            border-radius: 6px;
            border: solid 1px var(--grey-2);
            padding: 8px 20px;
            font-size: 13px;
            font-weight: 400;
            color: var(--secondary-color);
        }

        .form-select-cs, .form-control-cs {
            padding: 7px 18px !important;
        }
    </style>

</head>

<body class="offwhite">

    <div class="header">
        <div class="logo">
            <img src="images/logo.svg" class="d-none d-md-block" alt="">
            <img src="images/logo-icon.png" class=" d-block d-md-none" alt="">
        </div>
        <div>
            <span id="headerCode" style='color: black; font-size: small; font-weight: bolder;'></span>
        </div>
        <div class="header-mid">
            <ul class="map-switch" id="mapViewActive">
                <li class="active" id="listViewButton"><a href="#!"><span class="material-icons">format_list_bulleted</span> List</a></li>
                <li id="mapViewButton"><a href="#!"><span class="material-icons">location_on</span> Map</a></li>
            </ul>
            <ul class="ms-4" id="routeFilter"></ul>
            <ul class="ms-4" id="advancedFilter" style="display:none"></ul>
            <ul class="link-right ms-auto">
                <li>
                    <a href="#!" data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight" aria-controls="offcanvasRight"></a>
                </li>
                <li><a visible="true" class="company_logo">
                    <img src="images/zinnia-logo.png" alt=""></a></li>
                <li>
                <li class="dropdown"><a href="#!" data-bs-toggle="offcanvas" data-bs-target="#profileSidebar" aria-controls="profileSidebar">
                    <img src="images/icons/account.png" alt=""></a>

                </li>
            </ul>
        </div>
    </div>

    <!-- Loader -->
    <div class="modal-loader" id="loader" style="display: none">
        <img src="images/loaders/tms_2_loader.gif" alt="Loading.." style="height: 50px; width: 50px;" />
    </div>
    <!-- Loader -->

    <!-- map for showing status of current trips -->
    <div id="mapMultiTrips" style="display: none;"></div>
    <!-- map for showing status of current trips -->

    <!-- map for showing status of current trips -->
    <div id="mapMultiFilterTrips" style="display: none;"></div>
    <!-- map for showing status of current trips -->

    <!-- Middle -->
    <div class="middle1" style="width: 100%; padding: 15px" id="content">

        <div class="row">
            <div class="col-lg-12">
                <div class="row">
                    <div class="col" id="activeTripBox">
                        <div class="cardx p-3 bg-secondary text-white">
                            <h3><strong id="activeTripCount">--</strong></h3>
                            <span class="subtitle_sm" id="activeTripText">Active</span>
                        </div>
                    </div>
                    <div class="col" id="tripsNotStartedBox">
                        <div class="cardx p-3">
                            <h3><strong class="text-warning" id="tripsNotStartedCount">--</strong></h3>
                            <span class="subtitle_sm">Trips Not Started</span>
                        </div>
                    </div>
                    <div class="col" id="noCommunicationBox">
                        <div class="cardx p-3">
                            <h3><strong class="text-primary" id="noCommunicationCount">--</strong></h3>
                            <span class="subtitle_sm">No Communication</span>
                        </div>
                    </div>
                    <div class="col" id="femaleEmployeeTripsBox">
                        <div class="cardx p-3">
                            <h3><strong class="text-female" id="femaleEmployeeTripsCount">--</strong></h3>
                            <span class="subtitle_sm">Female Employee Trips</span>
                        </div>
                    </div>
                    <div class="col" id="overSpeedingAlertBox">
                        <div class="cardx p-3 border-danger">
                            <h3><strong class="text-danger" id="overSpeedingAlertCount">--</strong></h3>
                            <span class="subtitle_sm">Over speeding Alert</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="tableAllRoutes" style="display: none;" class="row" >
            <div class="col-12">
                <div class="card_tb p-0 overflow-hidden">
                    <div class="row">
                        <div class="col">
                            <div class="d-flex justify-content-between p-3">
                                <ul class="d-inline-flex align-items-center">
                                    <!-- <li><span class="material-icons" id="routeFilter">filter_alt</span></li> -->
                                    <!-- <li class="ps-3"><span class="material-icons">add</span>
                                        <small>AdvancedFilter</small>
                                    </li> -->
                                </ul>

                                <ul class="d-inline-flex align-items-center">
                                    <li>
                                        <div class="input-group" id="searchBoxControl">
                                            <input type="text" class="form-control border-right-0" placeholder="Search Trips"
                                                id="inputTripSearch">
                                            <button class="input-group-text" id="buttonTripSearch" data-toggle="tooltip"
                                                title="Search Route Id">
                                                <span class="material-icons">search</span>
                                            </button>
                                        </div>
                                    </li>
                                    <li class="px-3">
                                        <button id="refresh_active" class="rounded-circle border-0">
                                            <span class="material-icons">sync</span>
                                        </button>
                                    </li>
                                    <!-- <li >
                                        <span class="material-icons">south</span>
                                    </li> -->
                                    <!-- <li >
                                        <span class="material-icons">more_horiz</span>
                                    </li> -->
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="col-sm-12" style="padding: 0;">
                        <div class="panel panel-danger">
                            <!-- <div class="panel-heading clearfix">
                                <h4 class="panel-title pull-left" style="padding-top: 7.5px;">ALL ACTIVE</h4>
                                <div class="btn-group pull-right">
                                    <button class="btn btn-primary">
                                        <span class="glyphicon glyphicon-refresh"></span>
                                    </button>
                                </div>
                            </div> -->
                            <div class="table-responsive">
                                <table class="table mb-0 table-hover">
                                    <thead class="table-header-bg">
                                        <tr id="trip-columns">
                                            <th style="display: none;"></th>
                                            <th>Route Id</th>
                                            <th>Shift</th>
                                            <th>Total Emp.</th>
                                            <th>Start/End Time</th>
                                            <th>Distance(Kms)</th>
                                            <th>Vendor/Vehicle No</th>
                                            <th>Driver Info</th>
                                            <th>Trip Status</th>
                                            <%--<th>Speed</th>
                                            <th>Last Updated</th>--%>
                                        </tr>
                                    </thead>
                                    <tbody id="tableAllRoutesBody">
                                    </tbody>
                                </table>

                            </div>
                            <!-- <div id='ajax_loader' style="position: fixed; left: 45%; top: 50%; z-index:999">
                                <img src="ajax-loader.gif"></img>
                            </div> -->
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>

    <!-- new adhoc -->
    <div class="offcanvas offcanvas-end offcanvas_long" tabindex="-1" id="offcanvasBottom"
        aria-labelledby="offcanvasBottomLabel">
        <div class="offcanvas-header bg-secondary text-white offcanvas-header-lg">
            <h5 class="subtitle fw-bold" id="textRouteId">023584R0055</h5>
            <!-- onclick="ShowMap(this)" -->
            <div class="form-check form-switch ms-auto me-5">
                <input class="form-check-input checked-success" type="checkbox" id="chkPassport" onclick="toggleMap()" disabled>
                <label class="form-check-label text-white" for="chkPassport">Show Map</label>
            </div>

            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body">

            <div class="rounded-3 p-2 mb-3 border" id="tableSelectedRouteBg">
                <table class="table mb-0 fs-13 bg-transparent" id="tableSelectedRoute">
                    <thead>
                        <tr>
                            <th>RouteId</th>
                            <th>Shift</th>
                            <th>Total Emp.</th>
                            <th>Start/End Time</th>
                            <th>Distance(Kms)</th>
                            <th>Vendor/Vehicle Id</th>
                            <th>Driver Info</th>
                            <th>Trip Status</th>
                            <%--<th>Last Updated</th>--%>
                        </tr>
                    </thead>
                    <tbody id="tableSelectedRouteBody">
                    </tbody>
                </table>
            </div>

            <div id="selectedRouteTrackingMapContainer"></div>

            <table class="table tb_raiseAdhoc mb-0 table-striped table-hover" id="tableEmployeeInTrip">
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>OTP</th>
                        <th>Drop OTP</th>
                        <th>Shift</th>
                        <th>Mobile</th>
                        <th>Stop No.</th>
                        <th>ETA</th>
                        <th>Status</th>
                        <th>Location</th>
                    </tr>
                </thead>
                <tbody id="tableEmployeeInTripBody">
                </tbody>
            </table>
        </div>
    </div>
    <!-- new adhoc -->

    <!-- Message Toast -->
    <div class="toast-container position-fixed top-0 end-0 p-3">
        <div id="liveToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div id="toastHeader" class="toast-header">
                <span id="toastIcon" class="material-icons me-2">info</span>
                <strong id="toastTitle" class="me-auto">Notification</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div id="toastBody" class="toast-body">
                Message goes here...
            </div>
        </div>
    </div>
    <!-- Message Toast -->

    <!-- Modal Driver Info-->
    <%--<div class="modal fade" id="modalRouteFilter" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-body">
                    <div class="modal-header border-bottom-0 pb-0">
                        <h5 class="modal-title fw-bold">Route Filter</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="row mb-3 mt-4">
                        <label class="form-label">Date</label>
                        <input type="date" id="datepicker" class="form-control">
                    </div>
                    <div class="row mb-3">
                        <label class="form-label">Trip Type</label>
                        <select id="triptype" class="form-select">
                            <option selected disabled>Select Trip type</option>
                            <option value="p">Pickup</option>
                            <option value="d">Drop</option>
                        </select>
                    </div>
                    <div class="container mt-5"><label class="form-label">Shift Time</label></div>
                    <div class="container">
                        <div class="custom-select">
                            <div class="select-box">
                                <input type="text" class="tags_input" name="tags" hidden />
                                <div class="selected-options">
                                </div>
                                <div class="arrow">
                                    <i class="fa fa-angle-down"></i>
                                </div>
                            </div>
                            <div class="options">
                                <div class="option-search-tags">
                                    <input type="text" class="search-tags" placeholder="Search trips..." />
                                    <button type="button" class="clear">
                                        <i class="fa fa-close"></i>
                                    </button>
                                </div>
                                <div class="option all-tags" data-value="All">Select All</div>

                                <div class="no-result-message" style="display: none;">No result</div>
                            </div>
                            <span class="tag_error_msg error"></span>
                        </div>
                        <input type="button" class="btn_submit" value="Submit" style="display: none;">
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-info" id="search">Submit</button>
                    </div>
                </div>
            </div>
        </div>
    </div>--%>

    <div class="modal fade" id="modalRouteFilter" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-lg">
    <div class="modal-content">
      <!-- Header -->
      <div class="modal-header text-black">
        <h5 class="modal-title fw-bold" id="exampleModalLabel">Route Filter</h5>
        <button type="button" class="btn-close btn-close-black" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>

      <!-- Body -->
      <div class="modal-body px-4">
        <div class="row mb-3">
          <div class="col-md-6">
            <label class="form-label">Date</label>
            <input type="date" id="datepicker" class="form-control">
          </div>
          <div class="col-md-6">
            <label class="form-label">Trip Type</label>
            <select id="triptype" class="form-select">
              <option selected disabled>Select Trip type</option>
              <option value="p">Pickup</option>
              <option value="d">Drop</option>
            </select>
          </div>
        </div>

        <!-- Shift Time Multi-Select -->
        <div class="mt-4">
          <label class="form-label">Shift Time</label>
          <div class="custom-select">
            <div class="select-box">
              <input type="text" class="tags_input" name="tags" hidden />
              <div class="selected-options">
                <span class="placeholder">Select Shift(s)</span>
              </div>
              <div class="arrow">
                <i class="fa fa-angle-down"></i>
              </div>
            </div>
            <div class="options">
              <div class="option-search-tags">
                <input type="text" class="search-tags" placeholder="Search trips..." />
                <button type="button" class="clear"><i class="fa fa-close"></i></button>
              </div>
              <div class="option all-tags" data-value="All">Select All</div>
              <!-- Dynamically add options below -->
              <!-- Example:
              <div class="option" data-value="6:00 AM">6:00 AM</div>
              -->
              <div class="no-result-message" style="display: none;">No result</div>
            </div>
            <span class="tag_error_msg error text-danger small mt-1 d-block"></span>
          </div>
          <input type="button" class="btn_submit" value="Submit" style="display: none;">
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer px-4">
        <button type="button" class="btn btn-info w-20" id="search">Submit</button>
      </div>
    </div>
  </div>
</div>




    <!-- Modal Driver Info-->
    <div class="modal fade" id="modalAdvancedRouteFilter" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-body">
                    <div>
                        <h1>Route Filter</h1>
                    </div>
                    <div class="row mb-3 mt-4">
                        <label class="form-label">Date</label>
                        <input type="date" id="datepicker1" class="form-select">
                    </div>
                    <div class="row mb-3">
                        <label class="form-label">Trip Type</label>
                        <select id="triptype1" class="form-select">
                            <option selected disabled>Select Trip type</option>
                            <option value="p">Pickup</option>
                            <option value="d">Drop</option>
                        </select>
                    </div>
                    <div class="row mb-3">
                        <label class="form-label">Shift</label>
                        <select id="shift1" multiple title="Select Shift" class="form-select">
                            <option selected disabled>Select Shift</option>
                        </select>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-info" id="search1">Submit</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!--Modal Driver Info-->



    <!-- end wrapper -->
    <script src="assets/plugins/jquery-1.10.2.js"></script>
    <script src="assets/plugins/metisMenu/jquery.metisMenu.js"></script>
    <script src="js/bootstrap.bundle.min.js"></script>
    <script src="js/custom.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.3/dist/umd/popper.min.js"></script>
    <script src="js/toastr.min.js"></script>
    <link href="assets/css/toastr.min.css" rel="stylesheet" />
    <script src="js/jquery.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.3/dist/umd/popper.min.js"></script>

    <script type="text/javascript">
        function ajaxRequest(url, data, callback, method, username, password) {
            const ajaxOptions = {
                type: method,
                url: url,
                cache: false,
                crossDomain: true,
                data: method === "GET" ? data : JSON.stringify(data),
                contentType: method === "GET" ? undefined : "application/json; charset=utf-8",
                dataType: "json",
                success: callback,
                failure: function (response) {
                    //alert(response.d);
                    showLog("failure", response);
                },
                error: function (response) {
                    //alert(response.d);
                    showLog("error", response);
                }
            };

            // Add username and password if provided
            if (username && password) {
                ajaxOptions.username = username;
                ajaxOptions.password = password;
            }

            $.ajax(ajaxOptions);
        }

        function showLog(caller, message) {
            console.log(`${caller}: `, message);
        }
        var locationUpdate;
        document.getElementById("listViewButton").addEventListener("click", function () {
            //document.getElementById("tabularview").style.display = "block";
            mapMultiTrips.style.display = "none";
            document.getElementById('searchBoxControl').style.display = "";
            this.classList.add("active");
            document.getElementById("mapViewButton").classList.remove("active");
            clearInterval(locationUpdate)
        });

        document.getElementById("mapViewButton").addEventListener("click", function () {
            //document.getElementById("tabularview").style.display = "none";
            //mapMultiTrips.style.display = "block";
            this.classList.add("active");
            document.getElementById("listViewButton").classList.remove("active");
            document.getElementById('searchBoxControl').style.display = "none";
            displayCurrentlyRunningTripsOnMap(GpsLoggerMultiFilterData, facilityDetailData);
            locationUpdate = setInterval(async () => {
                await fetchGpsLoggerMultiFilterData(filterShiftDate, filterShiftTime, filterTripType, isFiltered = false, isMapVisible = true);
                displayCurrentlyRunningTripsOnMap(GpsLoggerMultiFilterData, facilityDetailData);
            }, 15000);


        });

        // Helper function to wrap ajaxRequest in a Promise
        function ajaxRequestPromise(url, data, method, username, password) {
            return new Promise((resolve, reject) => {
                loader.style.display = 'block';
                ajaxRequest(url, data, resolve, method, username, password);
            });
        }

        var TrackURL;
        var BASE_URL;
        var URL_CabValidation;
        var URL_ProfilePicture;
        var URL_CallingAPI;
        var URL_RouteInfo;
        var URL_RouteDetail;
        var URL_GetGPSLogger;
        var URL_UpdateCabNoShow;
        var URL_UpdateTrackingSelf;
        var URL_TripStatusFilter;
        var URL_GetFacilityDetail;
        var URL_GetGPSLoggerMultiFilter;
        var URL_GetTripStateDetailFilter;
        var URL_GetTripStateDetailOverSpeedFilter;
        var URL_GetGPSLoggerMultisession;
        var URL_GetRouteInfo;
        var URL_GetShiftTime;
        var URL_GetRouteTracking;
        const activeTripBox = document.getElementById('activeTripBox');
        const refresh_active = document.getElementById('refresh_active');
        const tableAllRoutesBody = document.getElementById('tableAllRoutesBody');
        const tableAllRoutes = document.getElementById('tableAllRoutes');
        const activeTripCount = document.getElementById('activeTripCount');
        const activeTripText = document.getElementById('activeTripText');
        const tripsNotStartedCount = document.getElementById('tripsNotStartedCount');
        const noCommunicationCount = document.getElementById('noCommunicationCount');
        const femaleEmployeeTripsCount = document.getElementById('femaleEmployeeTripsCount');
        const overSpeedingAlertCount = document.getElementById('overSpeedingAlertCount');
        const tableSelectedRoute = document.getElementById('tableSelectedRoute');
        const tableSelectedRouteBody = document.getElementById('tableSelectedRouteBody');
        const tableSelectedRouteBg = document.getElementById('tableSelectedRouteBg');
        const tableEmployeeInTrip = document.getElementById('tableEmployeeInTrip');
        const tableEmployeeInTripBody = document.getElementById('tableEmployeeInTripBody');
        const textRouteId = document.getElementById('textRouteId');
        const routeFilter = document.getElementById('routeFilter');
        const modalRouteFilter = new bootstrap.Modal(document.getElementById('modalRouteFilter'));
        const modalAdvancedRouteFilter = new bootstrap.Modal(document.getElementById('modalAdvancedRouteFilter'));
        const inputTripSearch = document.getElementById('inputTripSearch');
        const buttonTripSearch = document.getElementById('buttonTripSearch');
        const offcanvasBottom = new bootstrap.Offcanvas(document.getElementById('offcanvasBottom'));
        const checkbox = document.getElementById('chkPassport');
        const tripType = document.getElementById('triptype');
        const tripType1 = document.getElementById('triptype1');
        const shift = document.getElementById('shift');
        const shift1 = document.getElementById('shift1');
        const mapMultiTrips = document.getElementById('mapMultiTrips');
        const mapMultiFilterTrips = document.getElementById('mapMultiFilterTrips');
        const advancedFilter = document.getElementById('advancedFilter');
        const loader = document.getElementById('loader');
        const headerCode = document.getElementById('headerCode');
        const colors = [
            "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#800000", "#808000", "#008000", "#800080",
            "#008080", "#000080", "#FF5733", "#FFBD33", "#DBFF33", "#75FF33", "#33FF57", "#33FFBD", "#33DBFF", "#3375FF",
            "#5733FF", "#BD33FF", "#FF33DB", "#FF3375", "#FF6666", "#FF9966", "#FFCC66", "#FFFF66", "#CCFF66", "#99FF66",
            "#66FF66", "#66FF99", "#66FFCC", "#66FFFF", "#66CCFF", "#6699FF", "#6666FF", "#9966FF", "#CC66FF", "#FF66FF",
            "#FF66CC", "#FF6699", "#FF33CC", "#FF66CC", "#FF99CC", "#FFCCCC", "#FFCCFF", "#FFFFCC", "#CCFFFF", "#CCFFCC",
            "#CCFF99", "#99FF99", "#99CCFF", "#CCCCFF", "#CCCCCC", "#999999", "#666666", "#333333", "#9999FF", "#9966FF",
            "#9933FF", "#6600CC", "#3300CC", "#330066", "#660099", "#CC00CC", "#FF00CC", "#FF0099", "#CC0099", "#990066",
            "#990033", "#CC3333", "#FF3333", "#FF6633", "#FF9933", "#CC9933", "#996633", "#663300", "#996666", "#CC6666",
            "#FF6666", "#FF6666", "#FF9966", "#FF9966", "#FF9966", "#FFCC99", "#FFCC66", "#FFFF99", "#FFFF66", "#FFFF33",
            "#FFFF00", "#FFCC00", "#FF9900", "#FF6600", "#FF3300", "#FF0000", "#CC0000", "#990000", "#660000", "#330000",
            "#330033", "#660066", "#993399", "#CC66CC", "#FF99FF", "#FF99CC", "#FF6699", "#FF3366", "#FF0033", "#FF3333",
            "#FF3366", "#FF3399", "#FF33CC", "#FF33FF", "#CC33FF", "#9900FF", "#6600FF", "#3300FF", "#0000FF", "#0033FF",
            "#0066FF", "#0099FF", "#00CCFF", "#00FFFF", "#00FFCC", "#00FF99", "#00FF66", "#00FF33", "#00FF00", "#33FF00",
            "#66FF00", "#99FF00", "#CCFF00", "#FFFF00", "#FFCC00", "#FF9900", "#FF6600", "#FF3300", "#FF0000", "#CC0000",
            "#990000", "#660000", "#330000", "#333333", "#666666", "#999999", "#CCCCCC", "#FFFFFF"
        ];

        var clientCode;
        var clientid = '<%=eTMSACENDashBoard.Models.PasswordEncryption.Decrypt(Request.QueryString["clientid"])%>';
        //var clientid = 28;
        showLog("clientid", clientid);
        var value = 1;
        var value1 = 2;
        var vendorId = '<%=eTMSACENDashBoard.Models.PasswordEncryption.Decrypt(Request.QueryString["vendorid"])%>';
        showLog("vendorid", vendorId);
        var facilityId = '<%=eTMSACENDashBoard.Models.PasswordEncryption.Decrypt(Request.QueryString["facilityid"])%>';
        showLog("facilityId", facilityId);
        var filterTripType = 0;
        var filterShiftDate = "01-01-1900";
        //var filterShiftDate = new Date().toISOString().split('T')[0];
        var filterShiftTime = 0;
        var map;
        var locationDataPoints = [];
        var GpsLoggerMultiFilterData;
        document.addEventListener('DOMContentLoaded', function () {
            fetchGetClientDetailsById(clientid);
            searchTripClick();
            handleFilterButtonChange(false);
        });

        function handleFilterButtonChange(isFiltered) {
            if (isFiltered) {
                routeFilter.innerHTML = '<li class="btn btn-danger ms-1"><span class="material-icons">filter_alt_off</span>Remove Filter</li>'
            }
            else {
                routeFilter.innerHTML = '<li class="btn btn-dark ms-1"><span class="material-icons">filter_alt</span>Apply Filter</li>'
            }
        }

        function handleAdvancedFilterButtonChange(isFiltered) {
            if (isFiltered) {
                advancedFilter.innerHTML = '<li class="btn btn-danger ms-1"><span class="material-icons">filter_list_off</span>Remove Filter</li>'
            }
            else {
                advancedFilter.innerHTML = '<li class="btn btn-dark ms-1"><span class="material-icons">filter_list</span>Apply Filter</li>'
            }
        }

        function formatDate(date) {
            // Ensure the input is a Date object
            if (!(date instanceof Date)) {
                date = new Date(date);
            }

            // Extract month, day, and year from the date
            const month = ("0" + (date.getMonth() + 1)).slice(-2);
            const day = ("0" + date.getDate()).slice(-2);
            const year = date.getFullYear();

            // Return the formatted date string
            return `${month}-${day}-${year}`;
        }


        routeFilter.addEventListener('click', function (event) {
            // Check if the click was on an <li> element
            if (event.target.tagName === 'LI') {
                // Check the class and trigger the appropriate function
                if (event.target.classList.contains('btn-danger')) {
                    fetchGpsLoggerMultiFilterData(filterShiftDate, filterShiftTime, filterTripType, isFiltered = false, isMapVisible = false);
                } else if (event.target.classList.contains('btn-dark')) {
                    modalRouteFilter.show();
                }
            }

        });

        advancedFilter.addEventListener('click', function (event) {
            // Check if the click was on an <li> element
            if (event.target.tagName === 'LI') {
                // Check the class and trigger the appropriate function
                if (event.target.classList.contains('btn-danger')) {
                    fetchGpsLoggerMultiFilterData1(filterShiftDate, filterShiftTime, filterTripType, isFiltered = false, isMapVisible = true);
                    mapMultiTrips.style.display = "none";
                } else if (event.target.classList.contains('btn-dark')) {
                    modalAdvancedRouteFilter.show();

                }
            }
        });


        //Boxes Handler
        // Select all the divs with the desired IDs
        const statusBoxes = [
            {
                element: document.getElementById('activeTripBox'),
                //callback: activeTripHandler
                //callback: fetchGpsLoggerMultiFilterData(filterShiftDate = "01-01-1900", filterShiftTime = 0, filterTripType = 0, isFiltered=false, isMapVisible=false)
            },
            {
                element: document.getElementById('tripsNotStartedBox'),
                callback: tripNotStartedHandler
            },
            {
                element: document.getElementById('noCommunicationBox'),
                callback: noCommunicationHandler
            },
            {
                element: document.getElementById('femaleEmployeeTripsBox'),
                callback: femaleEmployeeTripsHandler
            },
            {
                element: document.getElementById('overSpeedingAlertBox'),
                callback: overSpeedingAlertHandler
            },

        ];

        // Function to handle the click and class toggle
        function handleDivClick(event, callback) {
            // Remove the 'bg-secondary text-white' class from all divs
            statusBoxes.forEach(box => {
                box.element.querySelector('.cardx').classList.remove('bg-secondary', 'text-white');
            });

            // Add 'bg-secondary text-white' class to the clicked div
            event.currentTarget.querySelector('.cardx').classList.add('bg-secondary', 'text-white');

            if (typeof callback === 'function') {
                callback(event);
            }
        }

        // Function to add event listeners
        function addEventListeners() {
            statusBoxes.forEach(box => {
                // Store the event listener function
                box.listener = (event) => handleDivClick(event, box.callback);
                box.element.addEventListener('click', box.listener);
            });
        }

        // Function to remove event listeners
        function removeEventListeners() {
            statusBoxes.forEach(box => {
                if (box.listener) {
                    box.element.removeEventListener('click', box.listener);
                }
            });
        }

        //Boxes Hanlder

        //Boxes Functions
        async function tripNotStartedHandler() {
            try {
                loader.style.display = 'block';
                const response = await ajaxRequestPromise(URL_GetTripStateDetailFilter, { type: 1, vendorid: vendorId, facilityid: facilityId, shiftdate: filterShiftDate, shifttime: filterShiftTime, triptype: filterTripType }, "POST", "user1", "Acc@bang10");
                const details = JSON.parse(response);
                showLog("tripNotStartedHandler", details);

                renderTableAllRoutes(details);
            }
            catch (eror) {
                showLog("tripNotStartedHandler", error);
            }
            finally {
                loader.style.display = 'none';
            }

        }

        async function noCommunicationHandler() {
            try {
                const response = await ajaxRequestPromise(URL_GetTripStateDetailFilter, { type: 2, vendorid: vendorId, facilityid: facilityId, shiftdate: filterShiftDate, shifttime: filterShiftTime, triptype: filterTripType }, "POST", "user1", "Acc@bang10");
                const details = JSON.parse(response);
                showLog("noCommunicationHandler", details);

                renderTableAllRoutes(details);
            }
            catch (error) {
                showLog("noCommunicationHandler", error);
            }
            finally {
                loader.style.display = 'none';
            }
        }

        async function femaleEmployeeTripsHandler() {
            try {
                const response = await ajaxRequestPromise(URL_GetTripStateDetailFilter, { type: 3, vendorid: vendorId, facilityid: facilityId, shiftdate: filterShiftDate, shifttime: filterShiftTime, triptype: filterTripType }, "POST", "user1", "Acc@bang10");
                const details = JSON.parse(response);
                showLog("femaleEmployeeTripsHandler", details);

                renderTableAllRoutes(details);
            }
            catch (error) {
                showLog("femaleEmployeeTripsHandler", error);
            }
            finally {
                loader.style.display = 'none';
            }
        }

        async function overSpeedingAlertHandler() {
            try {
                const response = await ajaxRequestPromise(URL_GetTripStateDetailOverSpeedFilter, { clientid: clientid, vendorid: vendorId, facilityid: facilityId, shiftdate: filterShiftDate, shifttime: filterShiftTime, triptype: filterTripType }, "POST", "user1", "Acc@bang10");
                const details = JSON.parse(response);
                showLog("overSpeedingAlertHandler", details);

                renderTableAllRoutes(details);
            }
            catch (error) {
                showLog("overSpeedingAlertHandler", error);
            }
            finally {
                loader.style.display = 'none';
            }
        }
        //Boxes Functions

        async function fetchGetClientDetailsById(clientid) {
            try {
                const response = await ajaxRequestPromise("https://www.etmsdrive.in/appControlRest/api/v1/getClientDetailById", { CID: clientid }, "GET", "user1", "Acc@bang10");
                const details = JSON.parse(response);
                showLog("GetClientDetailByIdData", details);
                createUrlFromClientDetails(details[0]);


            }
            catch (error) {
                showLog("GetClientDetailByIdData", error);
            }
            finally {
                loader.style.display = 'none';
            }
        }

        function createUrlFromClientDetails(data) {
            if (data != null) {
                BASE_URL = data.trackurl
                URL_GetRouteInfoMyCab = BASE_URL + "GetRouteInfoMyCab";
                URL_GetRouteInfo = BASE_URL + "GetRouteInfo";
                URL_GetRouteTracking = BASE_URL + "GetRouteTracking";
                showLog("createUrlFromClientDetails", URL_RouteInfo);
                URL_RouteDetail = BASE_URL + "GetRouteDetail";
                URL_GetGPSLogger = BASE_URL + "GetGPSLogger";
                URL_TripStatusFilter = BASE_URL + 'TripStatusFilter';
                URL_GetFacilityDetail = BASE_URL + "GetFacilityDetail";
                URL_GetGPSLoggerMultiFilter = BASE_URL + "GetGPSLoggerMultiFilter";
                URL_GetTripStateDetailFilter = BASE_URL + "GetTripStateDetailFilter";
                URL_GetTripStateDetailOverSpeedFilter = BASE_URL + "GetTripStateDetailOverSpeedFilter";
                URL_GetGPSLoggerMultisession = BASE_URL + "GetGPSLoggerMultisession";
                URL_GetShiftTime = BASE_URL + "GetShiftTime";
                showLog("createUrlFromClientDetails", URL_GetGPSLoggerMultiFilter);
                showLog("createUrlFromClientDetails", URL_GetTripStateDetailFilter);
                showLog("createUrlFromClientDetails", URL_GetTripStateDetailOverSpeedFilter);
                showLog("createUrlFromClientDetails", URL_GetGPSLogger);
                showLog("createUrlFromClientDetails", URL_GetGPSLoggerMultisession);
                showLog("createUrlFromClientDetails", URL_GetRouteInfo);
                clientCode = data.clientCode;
                showLog("createUrlFromClientDetails", clientCode)
            }

            fetchGpsLoggerMultiFilterData(filterShiftDate, filterShiftTime, filterTripType, isFiltered = false, isMapVisible = false);
            fetchFacilityDetailData();

        }

        async function fetchTripStatusData(filterShiftDate, filterShiftTime, filterTripType, isFiltered) {
            try {
                const response = await ajaxRequestPromise(URL_TripStatusFilter, { vendorid: vendorId, facilityid: facilityId, shiftdate: filterShiftDate, shifttime: filterShiftTime, triptype: filterTripType }, "POST", "user1", "Acc@bang10");
                const details = JSON.parse(response);
                showLog("fetchTripStatusData", details);

                updateTripStatusNumbers(details[0]);
            }
            catch (error) {
                showLog("fetchTripStatusData", error);
            }
            finally {
                loader.style.display = 'none';
            }
        }

        function updateTripStatusNumbers(data) {
            tripsNotStartedCount.textContent = data.TripNotStarted < 10 ? `0${data.TripNotStarted}` : `${data.TripNotStarted}`;
            noCommunicationCount.textContent = data.TripWithIdleState < 10 ? `0${data.TripWithIdleState}` : `${data.TripWithIdleState}`;
            femaleEmployeeTripsCount.textContent = data.TripWithFemales < 10 ? `0${data.TripWithFemales}` : `${data.TripWithFemales}`;
            overSpeedingAlertCount.textContent = data.TripWithOverSpeed < 10 ? `0${data.TripWithOverSpeed}` : `${data.TripWithOverSpeed}`;
        }

        async function fetchGpsLoggerMultiFilterData(filterShiftDate, filterShiftTime, filterTripType, isFiltered, isMapVisible) {
            try {
                const response = await ajaxRequestPromise(URL_GetGPSLoggerMultiFilter, { vendorid: vendorId, facilityid: facilityId, shiftdate: filterShiftDate, shifttime: filterShiftTime, triptype: filterTripType }, "GET", "user1", "Acc@bang10");
                const details = JSON.parse(response);
                showLog("fetchGpsLoggerMultiFilterData", details);
                GpsLoggerMultiFilterData = details;
                activeTripCount.textContent = details.length;
                if (isFiltered) {
                    removeEventListeners();
                    activeTripText.textContent = "Filtered Routes";
                    handleFilterButtonChange(isFiltered);
                    //handleAdvancedFilterButtonChange(isFiltered);
                } else {
                    addEventListeners();
                    activeTripText.textContent = "Active";
                    handleFilterButtonChange(isFiltered);
                    handleAdvancedFilterButtonChange(isFiltered);
                }
                if (!isMapVisible) {
                    renderTableAllRoutes(details);
                    fetchTripStatusData(filterShiftDate, filterShiftTime, filterTripType);
                }

            }
            catch (error) {
                showLog("fetchGpsLoggerMultiFilterData", error);
            }
            finally {
                loader.style.display = 'none';
            }

        }

        async function fetchGpsLoggerMultiFilterData1(filterShiftDate, filterShiftTime, filterTripType, isFiltered, isMapVisible) {
            try {
                const response = await ajaxRequestPromise(URL_GetGPSLoggerMultiFilter, { vendorid: vendorId, facilityid: facilityId, shiftdate: filterShiftDate, shifttime: filterShiftTime, triptype: filterTripType }, "GET", "user1", "Acc@bang10");
                const details = JSON.parse(response);
                showLog("fetchGpsLoggerMultiFilterData", details);

                activeTripCount.textContent = details.length;
                if (isFiltered) {
                    removeEventListeners();
                    activeTripText.textContent = "Filtered Routes";
                    //handleFilterButtonChange(isFiltered);
                    handleAdvancedFilterButtonChange(isFiltered);
                } else {
                    addEventListeners();
                    //handleFilterButtonChange(isFiltered);
                    handleAdvancedFilterButtonChange(isFiltered);
                }
                if (isMapVisible) {
                    renderTableAllRoutes(details);
                    fetchTripStatusData(filterShiftDate, filterShiftTime, filterTripType);
                    mapMultiTrips.style.display = "none";
                }


                //showLog("filteredMultiSessionData", filteredMultiSessionData);
                fetchAllSessions(details).then(() => {
                    displayFilteredRouteDataOnMap(filteredMultiSessionData, details);
                });
            }
            catch (error) {
                showLog("fetchGpsLoggerMultiFilterData", error);
            }
            finally {
                loader.style.display = 'none';
            }
        }

        activeTripBox.addEventListener('click', function (event) {
            event.preventDefault();
            fetchGpsLoggerMultiFilterData(filterShiftDate = "01-01-1900", filterShiftTime = 0, filterTripType = 0, isFiltered = false, isMapVisible = false)
        });

        refresh_active.addEventListener('click', function (event) {
            event.preventDefault();
            fetchGpsLoggerMultiFilterData(filterShiftDate = "01-01-1900", filterShiftTime = 0, filterTripType = 0, isFiltered = false, isMapVisible = false)
            showToast('Data refreshed successfully!', 'success');
        });

        async function fetchAllSessions(data) {
            try {
                const promises = data.map((item, index) => fetchGpsLoggerMultiSessionData(item.deviceId));

                const results = await Promise.all(promises);
                results.forEach((item, index) => {
                    showLog("fetchAllSessions", item);
                    filteredMultiSessionData[index] = item;
                });
            }
            catch (error) {
                showLog("fetchAllSessions", error);
            }
            finally {
                loader.style.display = 'none';
            }
        }

        async function fetchRouteDetailData(deviceId) {
            try {
                const response = await ajaxRequestPromise(URL_RouteDetail, { RouteID: deviceId, flag: 4 }, "POST", "user1", "Acc@bang10");
                const details = JSON.parse(response);
                showLog("fetchRouteDetailData", details);

                renderTableEmployeeInTrip(details);
            }
            catch (error) {
                showLog("fetchRouteDetailData", error);
            }
            finally {
                loader.style.display = 'none';
            }
        }

        async function fetchGpsLoggerData(deviceId) {
            try {
                const response = await ajaxRequestPromise(URL_GetGPSLogger, { deviceId: deviceId, vendorid: vendorId, facilityid: facilityId }, "POST", "user1", "Acc@bang10");
                const details = JSON.parse(response);
                showLog("fetchGpsLoggerData", details);

                renderTableSelectedRoute(details[0]);
            }
            catch (error) {
                showLog("fetchGpsLoggerData", error);
            }
            finally {
                loader.style.display = 'none';
            }
        }

        var gpsLoggerMultiSessionData;
        async function fetchGpsLoggerMultiSessionData(deviceId) {
            // Disable the checkbox while the API call is being processed
            const checkbox = document.getElementById('chkPassport');
            checkbox.disabled = true;

            try {
                const response = await ajaxRequestPromise(URL_GetGPSLoggerMultisession, { deviceId: deviceId, session: '', vendorid: vendorId }, "POST", "user1", "Acc@bang10");
                const details = JSON.parse(response);

                // Log the fetched data
                showLog("fetchGpsLoggerMultiSessionData", details);
                gpsLoggerMultiSessionData = details;

                // Enable the checkbox once the API call is successful
                checkbox.disabled = false;
                //displaySelectedTripRouteMap(details);
                return gpsLoggerMultiSessionData;
            } catch (error) {
                console.error("Error fetching GPS logger data:", error);
                // Optionally, you can enable the checkbox even if there’s an error to allow further attempts
                checkbox.disabled = true;
            }
            finally {
                loader.style.display = 'none';
            }



        }

        async function fetchGetRouteInfoData(routeId) {
            try {
                const response = await ajaxRequestPromise(URL_GetRouteInfo, { RouteID: routeId }, "POST", "user1", "Acc@bang10");
                const details = JSON.parse(response);
                showLog("fetchGetRouteInfoData", details);

                displaySearchedTripRouteMap(details[0]);
            }
            catch (error) {
                showLog("fetchGetRouteInfoData", error);
            }
            finally {
                loader.style.display = 'none';
            }
        }

        inputTripSearch.onkeypress = function (event) {
            if (!event) {
                event = window.event;
            }
            var keyCode = event.keyCode || event.which;
            if (keyCode == '13') {
                searchTripClick();
                return false;
            }
        }

        async function searchTripClick() {
            buttonTripSearch.onclick = function () {
                try {
                    var routeId = "x" + inputTripSearch.value.trim();
                    if (routeId == null || routeId == "") {
                        showToast('Field cannot be empty', 'error');
                    }
                    else {
                        fetchGetRouteInfoData(routeId);
                    }
                    showLog("searchTripClick", routeId);
                }
                catch (error) {
                    showLog("searchTripClick", error);
                }
                finally {
                    loader.style.display = 'none';
                }
            }
            //buttonTripSearch.addEventListener("click", function(){
            //event.preventDefault();

            //});

        }

        async function fetchShiftTimeData(tripType) {
            try {
                const response = await ajaxRequestPromise(URL_GetShiftTime, { facilityid: facilityId, triptype: tripType }, "POST", "user1", "Acc@bang10");
                const details = JSON.parse(response);

                showLog("fetchShiftTimeData", details);
                populateShiftTime(details);
                populateShiftTime1(details);
                initializeCustomSelects();
            }
            catch (error) {
                showLog("fetchShiftTimeData", error);
            }
            finally {
                loader.style.display = 'none';
            }

        }

        tripType.addEventListener('change', function () {
            const selectedTripType = tripType.value;
            showLog("triptype", selectedTripType);
            fetchShiftTimeData(selectedTripType);
        });

        tripType1.addEventListener('change', function () {
            const selectedTripType = tripType1.value;
            showLog("triptype", selectedTripType);
            fetchShiftTimeData(selectedTripType);
        });

        function populateShiftTime1(data) {
            data.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.shiftTime;
                optionElement.textContent = option.shiftTime;
                shift1.appendChild(optionElement);

            });

        }

        function populateShiftTime(data) {
            const optionsContainer = document.querySelector(".options");
            optionsContainer.querySelectorAll(".option:not(.all-tags)").forEach(option => option.remove());

            data.forEach(option => {
                const optionElement = document.createElement('div');
                optionElement.classList.add('option');
                optionElement.setAttribute("data-value", option.shiftTime);
                optionElement.textContent = option.shiftTime;

                optionsContainer.appendChild(optionElement);
            });

        }
        var shiftValues = [];
        var selectedShiftValues;
        var selectedOptions;
        function updateSelectedOptions(customSelect) {
            selectedOptions = Array.from(customSelect.querySelectorAll(".option.active"))
                .filter(option => option !== customSelect.querySelector(".option.all-tags"))
                .map(option => ({
                    value: option.getAttribute("data-value"),
                    text: option.textContent.trim()
                }));
            showLog("updateSelectedOptions", selectedOptions);
            const selectedValues = selectedOptions.map(option => option.value);
            customSelect.querySelector(".tags_input").value = selectedValues.join(', ');

            let tagsHTML = "";
            if (selectedOptions.length === 0) {
                tagsHTML = '<span class="placeholder">Select Shift(s)</span>';
            } else {
                const maxTagsToShow = 4;
                let additionTagsCount = 0;

                selectedOptions.forEach((option, index) => {
                    if (index < maxTagsToShow) {
                        tagsHTML += '<span class="tag">' + option.text + '<span class="remove-tag" data-value="' + option.value + '">&times;</span></span>';
                    } else {
                        additionTagsCount++;
                    }
                });
                if (additionTagsCount > 0) {
                    tagsHTML += '<span class="tag">+' + additionTagsCount + '</span>';
                }
            }
            customSelect.querySelector(".selected-options").innerHTML = tagsHTML;
        }

        function initializeCustomSelects() {
            const customSelects = document.querySelectorAll(".custom-select");
            customSelects.forEach(function (customSelect) {
                const searchInput = customSelect.querySelector(".search-tags");
                const optionsContainer = customSelect.querySelector(".options");
                const noResultMessage = customSelect.querySelector(".no-result-message");
                const options = customSelect.querySelectorAll(".option");
                const allTagsOption = customSelect.querySelector(".option.all-tags");
                const clearButton = customSelect.querySelector(".clear");

                allTagsOption.addEventListener("click", function () {
                    const isActive = allTagsOption.classList.contains("active");
                    options.forEach(function (option) {
                        if (option !== allTagsOption) {
                            option.classList.toggle("active", !isActive);
                        }
                    });
                    if (isActive) {
                        allTagsOption.textContent = "Select All";
                    }
                    else {
                        allTagsOption.textContent = "Deselect All";
                    }
                    updateSelectedOptions(customSelect);
                });

                clearButton.addEventListener('click', function () {
                    searchInput.value = "";
                    options.forEach(function (option) {
                        option.style.display = "block";
                    });
                    noResultMessage.style.display = "none";
                });

                searchInput.addEventListener("input", function () {
                    const searchTerm = searchInput.value.toLowerCase();

                    options.forEach(function (option) {
                        const optionText = option.textContent.trim().toLocaleLowerCase();
                        const shouldShow = optionText.includes(searchTerm);
                        option.style.display = shouldShow ? "block" : "none";
                    })

                    const anyOptionsMatch = Array.from(options).some(option => option.style.display == "block");
                    noResultMessage.style.display = anyOptionsMatch ? "none" : "block";

                    if (searchTerm) {
                        optionsContainer.classList.add("option-search-active");
                    }
                    else {
                        optionsContainer.classList.remove("option-search-active");
                    }
                });
            });

            customSelects.forEach(customSelect => {
                const options = customSelect.querySelectorAll(".option");
                options.forEach(option => {
                    option.addEventListener("click", function () {
                        option.classList.toggle("active");
                        updateSelectedOptions(customSelect);
                    });
                });
            });

            document.addEventListener("click", function (event) {
                const removeTag = event.target.closest(".remove-tag");
                if (removeTag) {
                    const customSelect = removeTag.closest(".custom-select");
                    const valueToRemove = removeTag.getAttribute("data-value");
                    const optionToRemove = customSelect.querySelector(".option[data-value='" + valueToRemove + "']");
                    optionToRemove.classList.remove("active");

                    const otherSelectedOptions = customSelect.querySelectorAll(".option.active:not(.all-tags)");
                    const allTagsOption = customSelect.querySelector(".option.all-tags");

                    if (otherSelectedOptions.length === 0) {
                        allTagsOption.classList.remove("active");
                    }
                    updateSelectedOptions(customSelect);
                }
            });

            const selectBoxes = document.querySelectorAll(".select-box");
            selectBoxes.forEach(selectBox => {
                selectBox.addEventListener('click', function (event) {
                    if (!event.target.closest(".tag")) {
                        selectBox.parentNode.classList.toggle("open");
                    }
                });
            });


            document.addEventListener('click', function (event) {
                if (!event.target.closest(".custom-select") || event.target.classList.contains("remove-tag")) {
                    customSelects.forEach(customSelect => {
                        customSelect.classList.remove("open");
                    });
                }
            });

            function resetCustomSelects() {
                customSelects.forEach(customSelect => {
                    customSelect.querySelectorAll(".option.active").forEach(option => {
                        option.classList.remove("active");
                    });
                    customSelect.querySelector(".option.all-tags").classList.remove("active");
                    updateSelectedOptions(customSelect);
                });
            }
        }


        document.getElementById('search').addEventListener('click', function (event) {
            event.preventDefault();
            var shiftValues = [];
            selectedOptions.forEach(option => {
                shiftValues.push(option.value);
            });
            showLog("fetchFilteredRouteData", shiftValues);
            const selectedShiftValues = shiftValues.join(",");
            showLog("fetchFilteredRouteData", selectedShiftValues);
            fetchFilteredRouteData(formatDate(document.getElementById('datepicker').value), selectedShiftValues, tripType.value);
            modalRouteFilter.hide();
        });

        var filteredMultiSessionData = [];
        document.getElementById('search1').addEventListener('click', function (event) {
            event.preventDefault();
            var filteredRouteData = fetchFilteredRouteData1(formatDate(document.getElementById('datepicker1').value), shift1.value, tripType1.value);

            //showLog("filteredMultiSessionData1029", filteredMultiSessionData);
            modalAdvancedRouteFilter.hide();
        });

        function displayFilteredRouteDataOnMap(filteredMultiSessionData, data) {
            showLog("displayFilteredRouteDataOnMap", filteredMultiSessionData);
            showLog("displayFilteredRouteDataOnMap", filteredMultiSessionData[0]?.[0].lat)
            mapMultiFilterTrips.style.display = 'block';
            map = new MapmyIndia.Map('mapMultiFilterTrips', {
                zoomControl: true,
                hybrid: false
            });
            filteredMultiSessionData.forEach((item, index) => {
                var polylineParam =
                {
                    weight: 6, // The thickness of the polyline 
                    opacity: 1,
                    color: colors[index],
                    //The opacity of the polyline colour 
                };
                var poly = new L.Polyline(item, polylineParam);
                //map.setCenter(filteredMultiSessionData[0[0].lat], filteredMultiSessionData[0[0].lng]);
                // Bind a hover event listener to display the popup
                poly.on('mouseover', function (e) {
                    var popupContent = `RouteId: ${data[index].deviceId}<br>
                                        Driver's Name: ${data[index].DriverName}<br>
                                        Driver Contact: ${data[index].driverContact}<br>
                                        Vehicle No: ${data[index].vehicleNo}<br>
                                        Vendor Name: ${data[index].vendorName}<br>
                                        Female Employee: ${data[index].totalEmpFemale}<br>
                                        Male Employee: ${data[index].totalEmpMale}<br>
                                        Boarded: ${data[index].totalEmpBoarded}<br>
                                        Updated At: ${data[index].updatedAt}<br>
                                        Shift Time: ${data[index].shiftTime}<br>`;
                    var popup = L.popup()
                        .setLatLng(e.latlng)
                        .setContent(popupContent)
                        .openOn(map);
                });

                // Remove the popup on mouseout
                poly.on('mouseout', function () {
                    map.closePopup();
                });

                map.addLayer(poly);
                //map.panTo(item[0]?.[0].lat);
                map.fitBounds(poly.getBounds());
            });

        }

        var facilityDetailData;
        async function fetchFacilityDetailData() {
            try {
                const response = await ajaxRequestPromise(URL_GetFacilityDetail, { facilityid: facilityId }, "GET", "user1", "Acc@bang10");
                const details = JSON.parse(response);
                showLog("initMapMultiple", details);

                headerCode.textContent = `${clientCode}.${details[0].facilityName}`;
                facilityDetailData = details[0];
            }
            catch (error) {
                showLog("initMapMultiple", error);
            }
            finally {
                loader.style.display = 'none';
            }
        }
        var Pointsi = [];
        var Pointsj = [];
        var DriverNamei = [];
        var DriverNamej = [];
        var deviceIdi = [];
        var deviceIdj = [];
        var vehicleidi = [];
        var vehicleidj = [];
        var shifti = [];
        var shiftj = [];
        var empcounti = [];
        var empcountj = [];
        var Clat = [];
        var Clng = [];
        var tripTypei;
        var markeri = [];
        var markerj = [];
        function displayCurrentlyRunningTripsOnMap(GpsLoggerMultiFilterData, facilityDetailData) {
            var i = 0;
            var j = 0;
            Pointsj = [];
            Pointsi = [];
            DriverNamei = [];
            DriverNamej = [];
            deviceIdi = [];
            deviceIdj = [];
            mapmyindia_removeMarker();
            var center = new L.LatLng(facilityDetailData.geoY, facilityDetailData.geoX)
            if (!map) {
                map = new MapmyIndia.Map('mapMultiTrips', {
                    center: center,
                    zoomControl: true,
                    hybrid: false,
                });
            }

            GpsLoggerMultiFilterData.forEach((item, index) => {

                if (item.tripType == "P") {
                    triptypei = "Pickup";
                } else {
                    triptypei = "Drop";
                }
                if (item.facility == 'Completed') {
                    Pointsi.push(new L.LatLng(item.lat, item.lng));
                    DriverNamei.push(item.DriverName);
                    deviceIdi.push(item.deviceId);
                    vehicleidi.push(item.vehicleNo);
                    shifti.push(item.shiftTime);
                    empcounti.push(item.totalEmp + " (" + item.totalEmpMale + "M / " + item.totalEmpFemale + "F)")
                }
                else {
                    Clat.push(item.lat);
                    Clng.push(item.lng);
                    Pointsj.push(new L.LatLng(item.lat, item.lng));
                    DriverNamej.push(item.DriverName);
                    deviceIdj.push(item.deviceId);
                    vehicleidj.push(item.vehicleNo);
                    shiftj.push(item.shiftTime);
                    empcountj.push(item.totalEmp + " (" + item.totalEmpMale + "M / " + item.totalEmpFemale + "F)")
                }
            });

            for (i = 0; i < Pointsi.length; i++) {
                var icon = L.icon({
                    iconUrl: "images/green.png",
                    iconRetinaUrl: 'images/green.png',
                    iconSize: [30, 30]
                });
                //  console.log(i);

                markeri.push(addMarker(Pointsi[i], icon, i, 'C').addTo(map));
            }

            for (j = 0; j < Pointsj.length; j++) {
                var icon = L.icon({
                    iconUrl: "images/red.png",
                    iconRetinaUrl: 'images/red.png',
                    iconSize: [30, 30]
                });
                // console.log(j);
                markerj.push(addMarker(Pointsj[j], icon, j, 'S').addTo(map));
            }
            mapMultiTrips.style.display = "block";
        }

        function mapmyindia_removeMarker() {
            var markerlength = markeri.length;
            if (markerlength > 0) {
                for (var i = 0; i < markerlength; i++) {
                    map.removeLayer(markeri[i]); /* deletion of marker object from the map */
                }
            }
            var markerlengthj = markerj.length;
            if (markerlengthj > 0) {
                for (var i = 0; i < markerlengthj; i++) {
                    map.removeLayer(markerj[i]); /* deletion of marker object from the map */
                }
            }
            delete markeri;
            delete markerj;
            markeri = []; markerj = [];
        }

        function fetchFilteredRouteData(shiftDate, shiftTime, tripType) {
            fetchGpsLoggerMultiFilterData(shiftDate, shiftTime, tripType, isFiltered = true);
        }

        function fetchFilteredRouteData1(shiftDate, shiftTime, tripType) {
            fetchGpsLoggerMultiFilterData1(shiftDate, shiftTime, tripType, isFiltered = true);
        }

        async function displaySearchedTripRouteMap(data) {
            try {
                if (data == null || data.length == 0) {
                    showToast('Route Info unavailable', 'error');
                }
                if (data.routeID != null) {
                    fetchGpsLoggerData(data.routeID);
                    fetchRouteDetailData(data.routeID);
                    fetchGpsLoggerMultiSessionData(data.routeID);
                    offcanvasBottom.show();
                }
                else {
                    showToast('Invalid RouteId', 'error');
                }
            }
            catch (error) {
                showLog('displaySearchedTripRouteMap', error);
            }
            finally {
                loader.style.display = 'none';
            }
        }

        function toggleMap() {
            const checkbox = document.getElementById('chkPassport');
            if (checkbox.checked) {
                initializeMap(gpsLoggerMultiSessionData);
                tableEmployeeInTrip.style.display = "none";
            } else {
                removeMap();
                tableEmployeeInTrip.style.display = "";
            }
        }



        var Bloc = [];
        var deviceId;
        var Blat = [];
        var Blng = [];
        var stoplat;
        var stoplng;
        var startlat = [];
        var startlng = [];
        var startpts = [];
        var emparray = [];
        var trackingStatus = [];
        var updated_At = [];
        var emphome = [];
        var empidmap = [];
        var empnamemap = [];
        // Function to initialize the map
        function initializeMap(data) {

            // Create the map container dynamically
            const mapContainer = document.createElement('div');
            mapContainer.id = 'selectedRouteTrackingMap';
            mapContainer.style.height = '400px';

            // Append the map container below the table
            const mapPlaceholder = document.getElementById('selectedRouteTrackingMapContainer');
            mapPlaceholder.innerHTML = ''; // Clear if there's any existing map
            mapPlaceholder.appendChild(mapContainer);

            locationDataPoints = [];
            var counter = 1;
            var count = 0;
            var Bpts;
            var Npts;
            var Dpts;
            var empCode;
            var Nlat;
            var Dlat;
            var Nlng;
            var Dlng;
            var bhomedist;
            var empcolumn = [];
            var updated_At1;
            var stoppts;
            var markerH = [];
            data.forEach(item => {
                lat = item.lat;
                lng = item.lng;
                if (count == 0) {
                    if (item.accuracy < 1000) {
                        lat = item.lat;
                        lng = item.lng;
                        startlat.push(lat);
                        startlng.push(lng);
                        startpts.push(new L.LatLng(lat, lng));
                        trackingStatus.push(item.trackingStatus);
                        updated_At.push(item.updatedAt);

                        locationDataPoints.push(new L.LatLng(lat, lng));
                        count++;
                    } else {
                        count = 0;
                    }
                }
                else {
                    //Bpts.push(item.trackingStatus);
                    if (item.trackingStatus == 'B') {
                        Bpts = new L.LatLng(lat, lng);
                        empCode = item.empCode + " " + item.empName + " (" + item.Gender + ")";
                        updatedAt = item.updatedAt;
                        Blat.push(lat);
                        Blng.push(lng);
                        bhomedist = item.boarddistance;
                        empcolumn = [Bpts, empCode, updatedAt, counter, item.trackingStatus, bhomedist]

                        emparray.push(empcolumn);
                        counter++;
                    }
                    if (item.trackingStatus == 'N') {
                        Npts = new L.LatLng(lat, lng);
                        empCode = item.empCode + " " + item.empName + " (" + item.Gender + ")";
                        updatedAt = item.updatedAt;
                        Nlat = lat;
                        Nlng = lng;
                        Blat.push(lat);
                        Blng.push(lng);
                        bhomedist = item.boarddistance;

                        empcolumn = [Npts, empCode, updatedAt, counter, item.trackingStatus, bhomedist]

                        emparray.push(empcolumn);
                        counter++;

                    }
                    if (item.trackingStatus == 'D') {
                        Dpts = new L.LatLng(lat, lng);
                        empCode = item.empCode + " " + item.empName + " (" + item.Gender + ")";
                        updatedAt = item.updatedAt;
                        Dlat = lat;
                        Dlng = lng;
                        Blat.push(lat);
                        Blng.push(lng);
                        bhomedist = item.boarddistance;

                        empcolumn = [Dpts, empCode, updatedAt, counter, item.trackingStatus, bhomedist]

                        emparray.push(empcolumn);
                        counter++;
                    }

                    if (item.trackingStatus == 'stop' || item.trackingStatus == 'waypoint') {
                        stoplat = lat;
                        stoplng = lng;
                        stoppts = new L.LatLng(lat, lng);
                        trackingStatus.push(item.trackingStatus);
                        updated_At1 = item.updatedAt;
                    }

                    locationDataPoints.push(new L.LatLng(lat, lng));

                    count++;
                }
            });

            showLog("displaySelectedTripRouteMap", locationDataPoints);
            //initializeMap(locationDataPoints);

            // Initialize the map using locationDataPoints argument
            map = new MapmyIndia.Map('selectedRouteTrackingMap', {
                center: locationDataPoints[0],
                zoomControl: true,
                hybrid: false
            });

            for (var i = 0; i < emparray.length; i++) {
                if (emparray[i][4] == 'B') {
                    var icon = L.icon({
                        iconUrl: "images/pickup/number_" + (emparray[i][3]) + ".png",
                        iconRetinaUrl: "images/pickup/number_" + (emparray[i][3]) + ".png",
                        iconSize: [30, 30]
                    });
                    //(position, icon, title,type)
                    mk = addMarker(emparray[i][0], icon, emparray[i][3], emparray[i][4], emparray[i][1], emparray[i][2]).addTo(map);

                }
                else if (emparray[i][4] == 'N') {
                    var icon = L.icon({
                        iconUrl: "images/noshow/number_" + emparray[i][3] + ".png",
                        iconRetinaUrl: "images/noshow/number_" + emparray[i][3] + ".png",
                        iconSize: [30, 30]
                    });
                    //(position, icon, title,type)
                    mk = addMarker(emparray[i][0], icon, emparray[i][3], emparray[i][4], emparray[i][1], emparray[i][2]).addTo(map);


                }
                else if (emparray[i][4] == 'D') {
                    var icon = L.icon({
                        iconUrl: "images/deboarded/number_" + emparray[i][3] + ".png",
                        iconRetinaUrl: "images/deboarded/number_" + emparray[i][3] + ".png",
                        iconSize: [30, 30]
                    });
                    //(position, icon, title,type)
                    mk = addMarker(emparray[i][0], icon, emparray[i][3], emparray[i][4], emparray[i][1], emparray[i][2]).addTo(map);


                }
            }

            for (var i = 0; i < startpts.length; i++) {
                var icon = L.icon({
                    iconUrl: "images/r1.png",
                    iconRetinaUrl: 'images/r1.png',
                    iconSize: [30, 30]
                });
                //reversegeocode(startlat[i],startlng[i],a,'Start');
                mk = addMarker(startpts[i], icon, 0, 'Start', "", updated_At[0]).addTo(map);


                //L.marker(Dpts[i]).addTo(map);
            }

            for (var i = 0; i < 1; i++) {

                var icon = L.icon({
                    iconUrl: "images/r2.png",
                    iconRetinaUrl: 'images/r2.png',
                    iconSize: [30, 30]
                });
                //  reversegeocode(stoplat,stoplng,a,'Stop');
                mk = addMarker(stoppts, icon, 1, 'Stop', "", updated_At1).addTo(map);
                //mk = addMarker(stoppts[i],icon, "Stop").addTo(map);

                //	var content = create_content("<b>Routeid: </b>"+deviceId, "<b>Status: </b>"+trackingStatus[1], "<b>Time: </b>"+updatedAt[i],"<b>Location: </b>"); 

                //	mk.bindPopup(content);
                //L.marker(Dpts[i]).addTo(map);
            }

             for (var i = 0; i < emphome.length; i++) {

                 var icon = L.icon({
                     iconUrl: 'images/home/home' + (i + 1) + '.png',
                     iconRetinaUrl: 'images/home/home' + (i + 1) + '.png',
                     iconSize: [30, 30]
                 });

                 markerH.push(addMarker(emphome[i], icon, empidmap[i], 'Home', empnamemap[i], i).addTo(map));
             }

            var polylineParam =
            {
                weight: 2, // The thickness of the polyline 
                opacity: 1,
                color: "darkblue"
                //The opacity of the polyline colour 
            };

            var poly = new L.Polyline(locationDataPoints, polylineParam);
            //map.setCenter(locationDataPoints[0]);
            map.addLayer(poly);
            map.panTo(locationDataPoints[0]);


            map.fitBounds(poly.getBounds());
            map.setZoom(12);

        }

        // Function to remove the map
        function removeMap() {
            const mapPlaceholder = document.getElementById('selectedRouteTrackingMapContainer');
            mapPlaceholder.innerHTML = ''; // Clear the map container
        }




        function renderTableSelectedRoute(item) {
            if (item == null || item.length == 0 || item == "") {
                tableSelectedRoute.style.display = "none";
                showToast('No data available', 'error');
                return;
            }
            if (item.facility === "Completed") {
                tableSelectedRouteBg.style.backgroundColor = "#d4edda";
            }
            else {
                tableSelectedRouteBg.style.backgroundColor = "";
            }
            deviceId = item.deviceId;
            // Parse the date and time from item.updatedAt or any other date field
            // Parse the date and time from item.updatedAt or any other date field
            const startDateTime = item.actvehiclestarttime != '----' ? castDateObject(item.actvehiclestarttime) : '----';
            const endDateTime = item.actvehicleendtime != '----' ? castDateObject(item.actvehicleendtime) : '----';


            var formattedStartDate;
            var formattedEndDate;
            var formattedStartTime;
            var formattedEndTime;

            // Format the date and time as needed
            formattedStartDate = startDateTime != '----' ? `${startDateTime.dateObject.month} ${startDateTime.dateObject.day}` : '----';
            formattedEndDate = endDateTime != '----' ? `${endDateTime.dateObject.month} ${endDateTime.dateObject.day}` : '----';
            formattedStartTime = startDateTime != '----' ? `${startDateTime.timeObject.hour} ${startDateTime.timeObject.period}` : '----';
            formattedEndTime = endDateTime != '----' ? `${endDateTime.timeObject.hour} ${endDateTime.timeObject.period}` : '----';

            //This table column has to be added to the table body below this is being removed for demo
            //<td>Geocode: <a target="new" href="https://maps.google.com/?q=${item.lat},${item.lng}">${item.lat},${item.lng}</a> <span class="d-block">Updated at: ${item.updatedAt}</span></td>

            tableSelectedRouteBody.innerHTML = `
                <tr>
                    <td>${item.deviceId}</td>
                    <td><span class="d-block">${convertTimeToHHMM(item.shiftTime)}</span> <span class="badge ${item.tripType == "P" ? `text-bg-primary` : `bg-danger`}  rounded-pill text-uppercase">${item.tripType == "P" ? `PICK` : `DROP`}</span></td>
                    <td>
                        <span class="d-block">${item.totalEmp}</span>
                        <span class="badge bg-primary-subtle rounded-pill text-dark">${item.totalEmpMale}M</span>
                        <span class="badge bg-danger-subtle rounded-pill text-dark">${item.totalEmpFemale}F</span>
                    </td>
                    <td>
                        <div class="d-flex justify-content-between">
                            <div><span class="d-block text-muted">${formattedStartDate}</span> ${formattedStartTime}</div>
                            <div>-</div>
                            <div><span class="d-block text-muted">${formattedEndDate != "" ? `${formattedEndDate}` : `----`}</span> ${formattedEndTime != "" ? `${formattedEndTime}` : `----`}</div>
                        </div>
                    </td>
                    <td>${parseFloat((item.totaldist) / 1000).toFixed(3)}</td>
                    <td>${item.vendorName} <span class="d-block">${item.vehicle}</span> </td>
                    <td>${item.DriverName} <span class="d-block">+91 ${item.driverContact}</span></td>
                    <td><span class="badgee ${item.facility != 'Started' ? `bg-success text-white` : `bg-warning text-black`}">${item.facility}</span></td>
                    
                </tr>
            `;

            tableSelectedRoute.style.display = "";
        }

        function renderTableEmployeeInTrip(data) {
            if (data == null || data.length == 0 || data == "") {
                tableEmployeeInTrip.style.display = "none";
                showToast('No data available', 'error');
                return;
            }
            emphome = [];
            tableEmployeeInTripBody.innerHTML = data.map(item => {
                emphome.push(new L.LatLng(item.lat, item.lng));
                empnamemap.push(item.empName);
                empidmap.push(item.employeeID);
                // Parse the date and time from item.updatedAt or any other date field
                var deboardingDateTime;
                if (item.trackingTime != null || item.trackingTime != undefined || item.trackingTime != "") {
                    deboardingDateTime = castDateObject(item.trackingTime);
                }
                else {
                    deboardingDateTime = "NA";
                }


                var deboardingDate = "NA";
                var deboardingTime = "NA";

                // // Format the date and time as needed
                if (deboardingDate != "" || deboardingTime != "") {
                    deboardingDate = `${(deboardingDateTime.dateObject.month != undefined) ? deboardingDateTime.dateObject.month : 'NA'} ${(deboardingDateTime.dateObject.day != undefined) ? deboardingDateTime.dateObject.day : 'NA'}`;
                    deboardingTime = `${(deboardingDateTime.timeObject.hour != undefined) ? deboardingDateTime.timeObject.hour : 'NA'} ${(deboardingDateTime.timeObject.period != undefined) ? deboardingDateTime.timeObject.period : 'NA'}`;
                }
                
                return `
                <tr>
                    <td>
                        <span class="d-block">${item.empName}</span>
                        <span class="badge ${item.Gender == "M" ? `bg-primary` : `bg-female`} rounded-pill">${item.Gender}</span>
                        <span class="badge text-dark">${item.employeeID}</span>
                    </td>
                    <td>${item.boardingOTP}</td>
                    <td>${item.deboardingOTP}</td>
                    <td>${convertTimeToHHMM(item.Shift)} <br> <span class="badge ${item.tripType == "P" ? `text-bg-primary` : `bg-danger`}  rounded-pill text-uppercase">${item.tripType == "P" ? `PICK` : `DROP`}</span></td>
                    <td>${item.Gender == "M" ? `${item.EmpMobile}` : `----`}</td>
                    <td>0${item.stopNo}</td>
                    <td>${item.ETAhh != null ? `${item.ETAhh}` : `----`}:${item.ETAmm != null ? `${item.ETAmm}` : `----`}</td>
                    <td><span class="badgee ${item.trackingStatus != 'Boarded' ? `badge_success` : `badge_warning`}">${item.trackingStatus}</span> <span class="d-block">${deboardingDate} - ${deboardingTime}</span></td>
                    <td>${item.location}</td>
                </tr>
            `;
            }).join("");
            tableEmployeeInTrip.style.display = "inline-table";
        }

        function renderOverspeedDataTable(data) {
            if (data == null || data.length == 0 || data == "") {
                tableOverSpeedRoutesBody.style.display = "none";
                showToast('No data available', 'error');
                return;
            }

            tableOverSpeedRoutesBody.innerHTML = data.map((item, index) => {
                return `
                    <tr>
                        <td><a href="#!" data-bs-toggle="offcanvas" data-bs-target="#offcanvasBottom" aria-controls="offcanvasBottom" onclick="openTripDetailsCanvas('${item.routeid}')">${item.routeid}</a></td>
                        <td>${item.vendorName}</td>
                        <td>${item.driverName}</td>
                        <td>${item.driverContact}</td>
                        <td>${item.vehicleRegistrationNo}</td>
                        <td>${item.vehicleNo}</td>
                        <td>${item.speed}</td>
                        <td>Geocode: <a target="new" href="https://maps.google.com/?q=${item.lat},${item.lng}">${item.lat},${item.lng}</a> <span class="d-block">Updated at: ${item.updatedAt}</span></td>
                    </tr>
                `;
            });
        }

        function renderTableAllRoutes(data) {
            if (data == null || data.length == 0 || data == "") {
                tableAllRoutes.style.display = "none";
                showToast('No data available', 'error');
                return;
            }

            tableAllRoutesBody.innerHTML = data.map((item, index) => {

                // Parse the date and time from item.updatedAt or any other date field
                var startDateTime;
                var endDateTime;
                var formattedStartDate;
                var formattedEndDate;
                var formattedStartTime;
                var formattedEndTime;
                if (item.actvehiclestarttime) {
                    startDateTime = item.actvehiclestarttime != '----' ? castDateObject(item.actvehiclestarttime) : '----';
                    endDateTime = item.actvehicleendtime != '----' ? castDateObject(item.actvehicleendtime) : '----';

                    // Format the date and time as needed
                    formattedStartDate = startDateTime != '----' ? `${startDateTime.dateObject.month} ${startDateTime.dateObject.day}` : 'NA';
                    formattedEndDate = endDateTime != '----' ? `${endDateTime.dateObject.month} ${endDateTime.dateObject.day}` : 'NA';
                    formattedStartTime = startDateTime != '----' ? `${startDateTime.timeObject.hour} ${startDateTime.timeObject.period}` : 'NA';
                    formattedEndTime = endDateTime != '----' ? `${endDateTime.timeObject.hour} ${endDateTime.timeObject.period}` : 'NA';

                }
                //<td><span class="material-icons" data-bs-toggle="collapse" onclick="toggleCollapse(this, '${item.deviceId}', '${index}')"
                //    data-bs-target="#TransportTbOne${index}" aria-expanded="true" aria-controls="TransportTbOne${index}" style="cursor:pointer;">add</span>
                //</td>
                //These two columns have been removed due to demo but should be restored inside the below table
                //<td>${(item.speed !== null && item.speed !== '' && item.speed != undefined) ? `${item.speed}` : `NA`}</td>
                //<td>Geocode: ${(item.lat !== null && item.lat !== '' && item.lat !== undefined) ? `<a target="new" href="https://maps.google.com/?q=${item.lat},${item.lng}">${item.lat},${item.lng}</a>` : `NA`}<span class="d-block">Updated at: ${(item.updatedAt !== null && item.updatedAt !== '' && item.updatedAt !== undefined) ? `${item.updatedAt}` : (item.updatedat !== null && item.updatedat !== '' && item.updatedat !== undefined) ? `${item.updatedat}` : `NA`}</span></td>
                return `
                <tr class="${(item.facility !== 'Started' && item.facility !== 'Not Started') ? `table-success` : ``}">
                    <td><a href="#!" data-bs-toggle="offcanvas" data-bs-target="#offcanvasBottom" aria-controls="offcanvasBottom" onclick="openTripDetailsCanvas('${(item.deviceId !== null && item.deviceId !== '' && item.deviceId !== undefined) ? `${item.deviceId}` : `${item.deviceid}`}')">${(item.deviceId !== null && item.deviceId !== '' && item.deviceId !== undefined) ? `${item.deviceId}` : `${item.deviceid}`}</a></td>
                    <td><span class="d-block">${convertTimeToHHMM(item.shiftTime)}</span> <span class="badge ${item.tripType == "P" ? `text-bg-primary` : `bg-danger`}  rounded-pill text-uppercase">${item.tripType == "P" ? `PICK` : `DROP`}</span></td>
                    <td>
                        <span class="d-block">${(item.totalEmp !== null && item.totalEmp !== '' && item.totalEmp !== undefined) ? item.totalEmp : `NA`}</span>
                        <span class="badge bg-primary-subtle rounded-pill text-dark">${(item.totalEmpMale !== null && item.totalEmpMale !== '' && item.totalEmpMale !== undefined) ? `${item.totalEmpMale}M` : `NA`}</span>
                        <span class="badge bg-danger-subtle rounded-pill text-dark">${(item.totalEmpFemale !== null && item.totalEmpFemale !== '' && item.totalEmpFemale !== undefined) ? `${item.totalEmpFemale}F` : `NA`}</span>
                    </td>
                    <td>
                        <div class="d-flex justify-content-between">
                            <div><span class="d-block text-muted">${(item.actvehiclestarttime != null && item.actvehiclestarttime !== '' && item.actvehiclestarttime !== undefined) ? formattedStartDate : `NA`}</span> ${(item.actvehiclestarttime !== null && item.actvehiclestarttime !== '' && item.actvehiclestarttime !== undefined) ? formattedStartTime : `NA`}</div>
                            <div>-</div>
                            <div><span class="d-block text-muted">${(item.actvehicleendtime !== null && item.actvehicleendtime !== '' && item.actvehicleendtime !== undefined) ? formattedEndDate : `NA`}</span> ${(item.actvehicleendtime !== null && item.actvehicleendtime !== '' && item.actvehicleendtime !== undefined) ? formattedEndTime : `NA`}</div>
                        </div>
                    </td>
                    <td>${(item.totaldist !== null && item.totaldist !== '' && item.totaldist !== undefined) ? parseFloat((item.totaldist) / 1000).toFixed(3) : `NA`}</td>
                    <td>${item.vendorName}<span class="d-block">${item.vehicle}</span></td>
                    <td>${item.DriverName} <span class="d-block">+91 ${item.driverContact}</span></td>
                    <td><span class="badgee ${(item.facility !== null && item.facility !== '' && item.facility !== undefined) ? (item.facility != 'Started' && item.facility != 'Not Started') ? `bg-success text-white` : `badge_warning` : ``}">${(item.facility !== null && item.facility !== '' && item.facility !== undefined) ? item.facility : `NA`}</span></td>
                </tr>

                <tr>
                    <td colspan="12" class="p-0 ps-5">
                        <div id="TransportTbOne${index}" class="accordion-collapse collapse position-relative" aria-labelledby="headingOne" data-bs-parent="#TransportTb">
                            <div class="accordion-body p-0 indent-line">
                                <div class="accordion border-0" id="sub-accordionExample${index}">
                                    <div class="accordion-item">
                                        <table class="table m-0">
                                            <thead class="sticky-header">
                                                <tr>
                                                    <th>Employee ID</th>
                                                    <th>Employee Name</th>
                                                    <th>Boarding OTP</th>
                                                    <th>Deboarding OTP</th>
                                                    <th>Gender</th>
                                                    <th>Mobile</th>
                                                    <th>Shift</th>
                                                    <th>Stop No</th>
                                                    <th>ETA</th>
                                                    <th>Status</th>
                                                    <th>Location</th>
                                                </tr>
                                            </thead>
                                            <tbody id="subTransportBody${index}">
                                                <!-- Sub rows will be added here dynamically -->
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            }).join("");
            tableAllRoutes.style.display = "block";
        }

        async function toggleCollapse(element, routeId, index) {
            const target = document.querySelector(element.dataset.bsTarget);
            if (target.classList.contains('show')) {
                target.classList.remove('show');
            } else {
                target.classList.add('show');
                if (!target.dataset.loaded) {
                    try {
                        loader.style.display = 'block';
                        const response = await ajaxRequestPromise(URL_GetRouteTracking, { RouteID: routeId, flag: 4 }, "POST", "user1", "Acc@bang10");
                        const details = JSON.parse(response);
                        showLog("transportSubData: ", details);

                        renderSubTable(details, index);
                        target.dataset.loaded = true;
                    }
                    catch (error) {
                        showLog("error while fetching transportSubData: ", error);
                    }
                    finally {
                        loader.style.display = 'none';
                    }

                }
            }
            element.textContent = target.classList.contains('show') ? 'remove' : 'add';
        }

        function renderSubTable(subData, index) {
            const subTransportBody = document.getElementById(`subTransportBody${index}`);
            const rows = subData.map((subItem, subIndex) => `
                <tr onclick="trActive(this)">
                    <td>${subItem.employeeID}</td>
                    <td>${subItem.empName}</td>
                    <td>${subItem.boardingOTP}</td>
                    <td>${subItem.deboardingOTP}</td>
                    <td>${subItem.Gender}</td>
                    <td>${subItem.Gender == "M" ? `${subItem.EmpMobile}` : `----`}</td>
                    <td>${subItem.Shift}</td>
                    <td>${subItem.stopNo}</td>
                    <td>${subItem.ETA}</td>
                    <td>${subItem.trackingStatus} at ${subItem.trackingTime}</td>
                    <td>${subItem.location}</td>
                </tr>
            `).join('');
            subTransportBody.innerHTML = rows
        }

        async function openTripDetailsCanvas(deviceId) {
            try {
                loader.style.display = 'block';
                //offcanvasBottom.show();
                fetchGpsLoggerData(deviceId);
                fetchRouteDetailData(deviceId);
                fetchGpsLoggerMultiSessionData(deviceId);
                textRouteId.textContent = deviceId;
            }
            catch (error) {
                showLog("openTripDetailsCanvas", error);
            }
            finally {
                loader.style.display = 'none';
            }
        }

        function addMarker(position, icon, title, type) {
            /*** position must be instance of L.LatLng ***/

            if (icon == '') {
                var mk1;
                /***Marker with a default icon and optional parameter draggable, title***/
                mk1 = new L.Marker(position, {
                    draggable: false,
                    title: title
                });
            } else {
                /***Marker with a custom icon and optional parameter draggable, title***/
                var mk1;
                mk1 = new L.Marker(position, {
                    icon: icon,
                    draggable: false,
                    title: title
                });
            }
            /*Add the marker to the map*/
            map.addLayer(mk1);
            //map2.setZoom(11);

            /**Marker events**/
            mk1.on("click", function (e) {
                if (type == 'S') {
                    var j = title;
                    newid = deviceIdj[j];
                    //var content = create_content(deviceIdj[j], "Driver: "+DriverNamej[j],"","","","",""); 
                    var content = create_content("<b> Routeid: " + deviceIdj[j] + "</b>", "<b>Vehicle: " + vehicleidj[j] + "</b>", "<b>Driver: " + DriverNamej[j] + "</b>", "<b>Shift: " + shiftj[j] + "</b>", "<b>Employees: " + empcountj[j] + "</b>", "", "<a id='click1'> Click to view History</a>");
                    markerj[j].bindPopup(content);
                }
                if (type == 'C') {
                    //reversegeocode(Clat[i],Clng[i],a,'C');
                    var i = title;
                    newid = deviceIdi[i];
                    var content = create_content("<b> Routeid: " + deviceIdi[i] + "</b>", "<b>Vehicle: " + vehicleid[i] + "</b>", "<b>Driver: " + DriverNamei[i] + "</b>", "<b>Shift: " + shift[i] + "</b>", "<b>Employees: " + empcount[i] + "</b>", "", "<a id='click'> Click to view History</a>");
                    markeri[i].bindPopup(content);
                    //	  map.panTo(Points2[i]);
                }
            });
            return mk1;
        }


        function addMarker(position, icon, title, type, empdetails, time) {
            /*** position must be instance of L.LatLng ***/

            var mk = [];
            if (icon == '') {
                /***Marker with a default icon and optional parameter draggable, title***/
                mk.push(new L.Marker(position, {
                    draggable: false,
                    title: title
                }));

            } else {
                /***Marker with a custom icon and optional parameter draggable, title***/
                mk.push(new L.Marker(position, {
                    icon: icon,
                    draggable: false,
                    title: title
                }));
            }
            /*Add the marker to the map*/
            map.addLayer(mk[0]);
            /**Marker events**/
            mk[0].on("click", function (e) {
                if (type == 'B') {
                    var i = title - 1;
                    reverseGeocode(Blat[i], Blng[i], abcd, 'B', i, mk[0]);
                }
                if (type == 'N') {
                    var i = title - 1;
                    reverseGeocode(Blat[i], Blng[i], abcd, 'N', i, mk[0]);
                }
                if (type == 'D') {
                    var i = title - 1;
                    reverseGeocode(Blat[i], Blng[i], abcd, 'D', i, mk[0]);
                }

                if (type == 'Start') {
                    var i = title;
                    reverseGeocode(startlat[0], startlng[0], abcd, 'S', i, mk[0]);
                }
                if (type == 'Stop') {
                    var i = time;
                    reverseGeocode(stoplat, stoplng, abcd, 'St', i, mk[0]);
                }
                if (type == 'Home') {
                    var i = time;
                    reverseGeocode(stoplat, stoplng, abcd, 'Home', i, mk[0]);
                }
            });
            return mk[0];

        }
        async function reverseGeocode(alat, alng, callback, type, counter, mk) {
            try {
                const response = await ajaxRequestPromise("https://apis.mapmyindia.com/advancedmaps/v1/fd0b726bc35998059cee40b4d331acf2/rev_geocode", { lat: alat, lng: alng }, "GET");
                const details = response;
                showLog("reverseGeocode", details);
                var address = details.results[0].formatted_address;
                showLog("reverseGeocode", address);
                callback(address, type, counter, mk);
                return address;
                // function OnSuccess7(data, status) {
                //     var a = data.results[0].formatted_address;
                //     callback(a, type, counter, mk);
                //     return a;

                // }

                // function OnError7(request, status, error) {
                //     //      $("#output").html(request.statusText);
                //     return ("")

                // }
            }
            catch (error) {
                showLog("reverseGeocode", error);
            }
            finally {
                loader.style.display = 'none';
            }
        }

        function abcd(response, type, counter, mk) {
            var i = counter;
            console.log(response);
            if (type == 'B') {
                Bloc.push(response);
                var l;
                //console.log(Object.keys(Bloc).length);
                l = Object.keys(Bloc).length - 1;
                var content = create_content("<b>Routeid: </b>" + deviceId, "<b>Employee: </b>" + emparray[i][1], "<b>Boarded on: </b>" + emparray[i][2], "<b>Location: </b>" + Bloc[l], "<b>Distance from home: </b>" + emparray[i][5]);
                mk.bindPopup(content);
                mk.openPopup();
            }
            if (type == 'N') {
                Bloc.push(response);
                var l;
                //console.log(Object.keys(Bloc).length);
                l = Object.keys(Bloc).length - 1;
                var content = create_content("<b>Routeid: </b>" + deviceId, "<b>Employee: </b>" + emparray[i][1], "<b>NoShow on: </b>" + emparray[i][2], "<b>Location: </b>" + Bloc[l], "<b>Distance from home: </b>" + emparray[i][5]);
                mk.bindPopup(content);
                mk.openPopup();
            }
            if (type == 'D') {
                Bloc.push(response);
                var l;
                //console.log(Object.keys(Bloc).length);
                l = Object.keys(Bloc).length - 1;
                var content = create_content("<b>Routeid: </b>" + deviceId, "<b>Employee: </b>" + emparray[i][1], "<b>Deboarded on: </b>" + emparray[i][2], "<b>Location: </b>" + Bloc[l], "<b>Distance from home: </b>" + emparray[i][5]);
                mk.bindPopup(content);
                mk.openPopup();
            }
            if (type == 'S') {
                Bloc.push(response);
                var l;
                //console.log(Object.keys(Bloc).length);
                l = Object.keys(Bloc).length - 1;
                var content = create_content("<b>Routeid: </b>" + deviceId, "<b>Status:Start </b>", "<b>Time: </b>" + updated_At[i], "<b>Location: </b>" + Bloc[l]);
                mk.bindPopup(content);
                mk.openPopup();
            } if (type == 'St') {
                Bloc.push(response);
                var l;
                //console.log(Object.keys(Bloc).length);
                l = Object.keys(Bloc).length - 1;
                var content = create_content("<b>Routeid: </b>" + deviceId, "<b>Status:Last Location </b>", "<b>Time: </b>" + i, "<b>Location: </b>" + Bloc[l]);
                mk.bindPopup(content);
                mk.openPopup();
            }
            if (type == 'Home') {
                var content = create_content("<b>Empid: </b>" + empidmap[i], "<b>Empname: </b>" + empnamemap[i], "", "");
                mk.bindPopup(content);
                mk.openPopup();
            }

        }

        var create_content = function (title, content, content1, content2) {
            var h = new Array();
            h.push("<div>");
            h.push("<div>");
            h.push("<div class=\"info_css\">");
            //h.push("<b>");
            h.push(title);
            //h.push("</b>");
            h.push("</div> ");
            h.push("</div>");
            h.push("<div class=\"info_css\">");
            h.push(content);
            h.push("</div>");
            h.push("<div class=\"info_css\">");
            h.push(content1);
            h.push("</div>");
            h.push("<div class=\"info_css\">");
            h.push(content2);
            h.push("</div>");
            h.push("</div>");
            return h.join("");
        };

        function convertTimeToHHMM(timeValue) {
            var shiftTime = timeValue.toString();
            var hours = shiftTime.substring(0, 2);
            var minutes = shiftTime.substring(2, shiftTime.length);
            return hours + ':' + minutes;
        }

        function castDateObject(input) {
            if (input != '----') {
                // Split the input into date and time components
                const parts = input.trim().split(/\s+/);

                const [month, day, year, time] = parts;
                // Create date and time objects
                const dateObject = {
                    month: month,
                    day: day,
                    year: year
                };

                const timeObject = {
                    hour: time.slice(0, -2),  // Extract '2:55'
                    period: time.slice(-2)    // Extract 'PM'
                };

                // Return both objects
                return { dateObject, timeObject };
            }
            else {

                return { dateObject: "", timeObject: "" };
            }
        }


        function showToast(message, type) {
            // Get elements of the toast
            const toastElement = document.getElementById('liveToast');
            const toastHeader = document.getElementById('toastHeader');
            const toastIcon = document.getElementById('toastIcon');
            const toastTitle = document.getElementById('toastTitle');
            const toastBody = document.getElementById('toastBody');

            // Update the message
            toastBody.textContent = message;

            // Update the title and icon based on type
            if (type === 'success') {
                toastElement.classList.add('text-bg-success');
                toastElement.classList.remove('text-bg-danger');
                toastHeader.classList.add('text-bg-success');
                toastHeader.classList.remove('text-bg-danger');
                toastIcon.textContent = 'check_circle';
                toastTitle.textContent = 'Success';
            } else if (type === 'error') {
                toastElement.classList.add('text-bg-danger');
                toastElement.classList.remove('text-bg-success');
                toastHeader.classList.add('text-bg-danger');
                toastHeader.classList.remove('text-bg-success');
                toastIcon.textContent = 'error';
                toastTitle.textContent = 'Error';
            }

            // Show the toast
            const toast = new bootstrap.Toast(toastElement);
            toast.show();
        }

        document.getElementById('offcanvasBottom').addEventListener('hidden.bs.offcanvas', () => {
            showLog("offcanvasBottom", "closed");
            removeMap();
            checkbox.checked = false; // Toggle check state
        });



    </script>
    <!-- jQuery (required for Bootstrap Select) -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

    <!-- Bootstrap Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <!-- Bootstrap Select JS -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.14.0-beta3/js/bootstrap-select.min.js"></script>

    <!-- <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.1/js/bootstrap.bundle.min.js"></script> -->
    <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.13.1/js/bootstrap-select.min.js"></script> -->


</body>

</html>
