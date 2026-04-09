using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

public partial class DummyTripSheetEntry : basepage
{
    DataClasses1DataContext tms = new DataClasses1DataContext();

    public string _routeid
    {
        get
        {
            return (string)ViewState["_routeid"];
        }

        set
        {
            ViewState["_routeid"] = value;
        }
    }

    public string _empIdName
    {
        get
        {
            return (string)ViewState["_empIdName"];
        }

        set
        {
            ViewState["_empIdName"] = value;
        }
    }

    public string _save
    {
        get
        {
            return (string)ViewState["_save"];
        }

        set
        {
            ViewState["_save"] = value;
        }
    }
    routeDet rd = new routeDet();
    route r = new route();
    static int size = 0;
    static string[,] arr = new string[size, 3];

    protected void Page_Load(object sender, EventArgs e)
    {
        try
        {
            if (!IsPostBack)
            {
                txtShiftDate.Text = DateTime.Now.Date.ToString("MM/dd/yyyy");
                lblRouteId.Text = GetRoutePreFix();
                txtRouteId.Focus();
                _save = "False";
            }
        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);
        }
    }
    public void BndFvtrip()
    {
        //**************************************************//
        //Binds Trip Formview with the searched routeId //
        //**************************************************//
        try
        {
            fvTrip.DataSource = tms.GetDummyRouteInfo(_routeid);
            fvTrip.DataBind();
        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);

        }
    }
    public void BndFvDropDown()
    {
        //**************************************************//
        //Binds dropdown in trip formview      //
        //**************************************************//
        try
        {
            ListBox lststhh = (ListBox)fvTrip.FindControl("lstStartHH");
            ListBox lststmm = (ListBox)fvTrip.FindControl("lstStartMM");
            ListBox lstendhh = (ListBox)fvTrip.FindControl("lstEndHH");
            ListBox lstendmm = (ListBox)fvTrip.FindControl("lstEndMM");

            lststhh.Items.Clear();
            lststmm.Items.Clear();
            lstendhh.Items.Clear();
            lstendmm.Items.Clear();
            ListItem lihh = new ListItem("HH", "0");
            ListItem limm = new ListItem("MM", "0");
            ListItem lihh1 = new ListItem("HH", "0");
            ListItem limm1 = new ListItem("MM", "0");
            lststhh.Items.Add(lihh);
            lstendhh.Items.Add(lihh1);
            lststmm.Items.Add(limm);
            lstendmm.Items.Add(limm1);
            for (int i = 0; i < 24; i++)
            {
                if (i < 10)
                {
                    lststhh.Items.Add("0" + i.ToString());
                    lstendhh.Items.Add("0" + i.ToString());
                }
                else
                {
                    lststhh.Items.Add(i.ToString());
                    lstendhh.Items.Add(i.ToString());
                }
            }
            for (int j = 0; j < 60; j++)
            {
                if (j < 10)
                {
                    lststmm.Items.Add("0" + j.ToString());
                    lstendmm.Items.Add("0" + j.ToString());
                }
                else
                {
                    lststmm.Items.Add(j.ToString());
                    lstendmm.Items.Add(j.ToString());
                }
            }
            lstendhh.SelectedIndex = 0;
            lstendmm.SelectedIndex = 0;
            lststhh.SelectedIndex = 0;
            lststmm.SelectedIndex = 0;
            //------------------------------//
            DropDownList ddlvt = (DropDownList)fvTrip.FindControl("ddlVehicleType");
            DropDownList ddlven = (DropDownList)fvTrip.FindControl("ddlVendor");
            
            DropDownList ddlDriver = (DropDownList)fvTrip.FindControl("ddlDriver");
            DropDownList ddlVehicleNo = (DropDownList)fvTrip.FindControl("ddlVehicleNo");
            DropDownList ddlGuard = (DropDownList)fvTrip.FindControl("ddlGuard");
            
            ListItem livdriver = new ListItem("-Select-", "0");
            ListItem livt = new ListItem("-Select-", "0");
            ListItem livg = new ListItem("-Select-", "0");

            DropDownList ddlZone = (DropDownList)fvTrip.FindControl("ddlZone");
            ListItem liZone = new ListItem("-Select-", "0");
            ddlZone.Items.Add(liZone);
            ddlZone.DataSource = tms.SelectZoneByFac(MyApplicationSession._LocationId);
            ddlZone.DataTextField = "zone";
            ddlZone.DataValueField = "id";
            ddlZone.DataBind();

            ddlGuard.Items.Clear();
            ddlGuard.Items.Add(livg);
            ddlGuard.DataSource = tms.GetGuardDetails(MyApplicationSession._FacilityID, "");
            ddlGuard.DataTextField = "IDnName";
            ddlGuard.DataValueField = "ID";
            ddlGuard.DataBind();

            ListItem liven = new ListItem("-Select-", "0");
            ddlven.Items.Clear();
            ddlven.Items.Add(liven);
            ddlven.DataSource = tms.GetVendorByFacility(MyApplicationSession._FacilityID);
            ddlven.DataTextField = "vendorName";
            ddlven.DataValueField = "Id";
            ddlven.DataBind();

            ddlvt.Items.Clear();
            ddlvt.Items.Add(livt);
            ddlvt.DataSource = tms.SelectVehicleType(0);
            ddlvt.DataTextField = "vehicle";
            ddlvt.DataValueField = "Id";
            ddlvt.DataBind();

            
            ddlDriver.Items.Clear();
            ddlDriver.Items.Add(livdriver);
            ddlDriver.DataSource = tms.GetDriverDetails(MyApplicationSession._FacilityID,"ALL");
            ddlDriver.DataTextField = "Name";
            ddlDriver.DataValueField = "id";
            ddlDriver.DataBind();

            ddlVehicleNo.Items.Clear();
            ListItem livno2 = new ListItem("-Select-", "0");
            ddlVehicleNo.Items.Add(livno2);
            ListItem livno3 = new ListItem("Adhoc", "-1");
            ddlVehicleNo.Items.Add(livno3);

            ListItem liShift = new ListItem("-Select Shift-", "0");
            DropDownList ddlShift = (DropDownList)fvTrip.FindControl("ddlShiftTime");
            ddlShift.Items.Clear();
            ddlShift.DataSource = tms.GetShiftByFacilityType(MyApplicationSession._FacilityID, "P");
            ddlShift.DataTextField = "ShiftTime";
            ddlShift.DataValueField = "ShiftTime";
            ddlShift.Items.Add(liShift);
            ddlShift.DataBind();

            ListBox lbtoll = (ListBox)fvTrip.FindControl("lbToll");
            lbtoll.Items.Clear();
            ListItem toll = new ListItem("-SELECT--", "0");
            lbtoll.Items.Add(toll);
            lbtoll.DataSource = tms.SelectTollMaster(MyApplicationSession._UserID, "N", _routeid);
            lbtoll.DataTextField = "tollname";
            lbtoll.DataValueField = "id";
            lbtoll.DataBind();

        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);

        }

    }


    protected void ddlVendor_SelectedIndexChanged(object sender, EventArgs e)
    {
        //**************************************************//
        //For Selected Vendor binds the vehicle dropdown //
        //**************************************************//
        try
        {
            DropDownList ddlven = sender as DropDownList;
            int vendorid = Convert.ToInt32(ddlven.SelectedValue);
            DropDownList ddlvt = (DropDownList)fvTrip.FindControl("ddlVehicleType");

            ListItem livt = new ListItem("-Select-", "0");
            ddlvt.Items.Clear();
            ddlvt.Items.Add(livt);
            ddlvt.DataSource = tms.SelectVehicleType(vendorid);
            ddlvt.DataTextField = "vehicle";
            ddlvt.DataValueField = "Id";
            ddlvt.DataBind();
            ddlvt.Focus();

            DropDownList ddlPenaltyType = (DropDownList)fvTrip.FindControl("ddlPenaltyType");

            ListItem livno = new ListItem("-Select-", "0");
            ddlPenaltyType.Items.Clear();
            ddlPenaltyType.Items.Add(livno);
            ddlPenaltyType.DataSource = tms.GetPenaltyType(Convert.ToInt32(vendorid));
            ddlPenaltyType.DataTextField = "HeadName";
            ddlPenaltyType.DataValueField = "ID";
            ddlPenaltyType.DataBind();
        }
        catch (Exception ex)
        {

            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);

        }
    }
    public void DateChanged()
    {
        //*********************************************************//
        //Displayes route id prefix according to the date selected //
        //********************************************************//
        try
        {
            lblRouteId.Text = GetRoutePreFix();
        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);
        }

    }
    public void BndEmpGrid()
    {
        //**************************************************//
        //**************************************************//
        try
        {
            GvEmpInfo.DataSource = tms.GetDummyEmpByRoute(_routeid);
            GvEmpInfo.DataBind();

        }
        catch (Exception ex)
        {

            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);
        }

    }
    public void BndEmpGridData()
    {
        //***************************************************************//
        //Binds the employee grid with data to display in read only mode //
        //**************************************************************//
        try
        {
            foreach (GridViewRow gvr in GvEmpInfo.Rows)
            {

                //((TextBox)gvr.FindControl("txtStopNo")).ReadOnly = true;
                //((TextBox)gvr.FindControl("txtgvRemarks")).ReadOnly = true;
                //if (((LinkButton)gvr.FindControl("lbtnRemove")).Visible == true)
                //{
                //    ((Label)gvr.FindControl("lblNew")).Visible = true;
                //    gvr.BackColor = System.Drawing.Color.LightSlateGray;
                //}
                ((LinkButton)gvr.FindControl("lbtnRemove")).Visible = true;
                DropDownList ddl = (DropDownList)gvr.FindControl("ddlStatus");

                ddl.SelectedIndex = ddl.Items.IndexOf(ddl.Items.FindByValue(tms.GetDummyEmpByRoute(_routeid).ElementAtOrDefault(gvr.RowIndex).trackingStatus.ToString()));
                if (fvTrip.CurrentMode.ToString() == "Edit")
                {
                    ddl.Enabled = true;

                }
                else
                {
                    ddl.Enabled = false;
                }

            }

        }
        catch (Exception ex)
        {

            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);
        }

    }


    protected void btnSearch_Click(object sender, EventArgs e)
    {
        //**************************************************//
        //Displayes the searched route information        //
        //**************************************************//
        try
        {
            _routeid = GetRouteID(); ;
            //_routeid = "0518R0000005";
            //txtRouteId.Text = string.Empty;
            //txtRouteId.Text = _routeid.ToString();
            int count;
            count = tms.GetDummyRouteInfo(_routeid).Count();
            if (count > 0)
            {
                MultiView1.ActiveViewIndex = 0;
                lblErrorMsg.Visible = false;

                var ISAdmin = tms.GetISAdmin(MyApplicationSession._UserID).ElementAtOrDefault(0).result.Value.ToString();

                if ((tms.GetDummyRouteInfo(_routeid).ElementAtOrDefault(0).isFinal == true) && (ISAdmin == "0"))
                {
                    fvTrip.ChangeMode(FormViewMode.ReadOnly);
                    BndFvtrip();
                    //BndFvDropDown();
                    panelLink.Visible = true;
                    BndEmpGrid();
                    BndEmpGridData();
                    ((CheckBox)fvTrip.FindControl("chkReadGuard")).Enabled = false;
                    btnSave.Enabled = false;
                    imbbtnAddEmp.Enabled = false;
                    btnCancelTrip0.Enabled = false;

                }
                else
                {
                    //   tms.DeleteTempEmpFromRoute(_routeid);
                    var result = tms.GetDummyRouteInfo(_routeid);
                    foreach (var r in result)
                    {
                        fvTrip.ChangeMode(FormViewMode.Edit);
                        BndFvtrip();
                        BndFvDropDown();
                        BndEmpGrid();
                        BndEmpGridData();
                        panelLink.Visible = true;

                        RangeValidator RangeValidatorStartTime = (RangeValidator)fvTrip.FindControl("RangeValidatorStartTime");
                        RangeValidatorStartTime.MinimumValue = Convert.ToDateTime(txtShiftDate.Text).AddDays(-1).ToShortDateString();
                        RangeValidatorStartTime.MaximumValue = Convert.ToDateTime(txtShiftDate.Text).ToShortDateString();

                        RangeValidatorStartTime.ErrorMessage = "Start date should be between " + Convert.ToDateTime(txtShiftDate.Text).AddDays(-1).ToShortDateString() + " and " + Convert.ToDateTime(txtShiftDate.Text).ToShortDateString();

                        RangeValidator RangeValidatorEndTime = (RangeValidator)fvTrip.FindControl("RangeValidatorEndTime");
                        RangeValidatorEndTime.MinimumValue = Convert.ToDateTime(txtShiftDate.Text).ToShortDateString();
                        RangeValidatorEndTime.MaximumValue = Convert.ToDateTime(txtShiftDate.Text).AddDays(1).ToShortDateString();

                        RangeValidatorEndTime.ErrorMessage = "End date should be between " + Convert.ToDateTime(txtShiftDate.Text).AddDays(-1).ToShortDateString() + " and " + Convert.ToDateTime(txtShiftDate.Text).ToShortDateString();

                        ((TextBox)fvTrip.FindControl("txtStartTime")).Text = Convert.ToDateTime(r.actVehicleStartTime).ToString("MM/dd/yyyy");
                        ((TextBox)fvTrip.FindControl("txtEndTime")).Text = Convert.ToDateTime(r.actVehicleEndTime).ToString("MM/dd/yyyy");

                        DropDownList ddlVendor = (DropDownList)fvTrip.FindControl("ddlVendor");
                        DropDownList ddlZone = (DropDownList)fvTrip.FindControl("ddlZone");

                        ddlVendor.SelectedIndex = ddlVendor.Items.IndexOf(ddlVendor.Items.FindByValue(r.vendorId.ToString()));
                        ddlZone.SelectedIndex = ddlZone.Items.IndexOf(ddlZone.Items.FindByValue(r.ZoneID.ToString()));
                        ddlVendor.Focus();

                        DropDownList ddlVehicleType = (DropDownList)fvTrip.FindControl("ddlVehicleType");
                        DropDownList ddlPenaltyType = (DropDownList)fvTrip.FindControl("ddlPenaltyType");
                        if (ddlVendor.SelectedValue != "0")
                        {
                            ListItem livt = new ListItem("-Select-", "0");
                            ddlVehicleType.Items.Clear();
                            ddlVehicleType.Items.Add(livt);
                            ddlVehicleType.DataSource = tms.SelectVehicleType(Convert.ToInt32(ddlVendor.SelectedValue));
                            ddlVehicleType.DataTextField = "vehicle";
                            ddlVehicleType.DataValueField = "Id";
                            ddlVehicleType.DataBind();

                            
                            ListItem livno = new ListItem("-Select-", "0");
                            ddlPenaltyType.Items.Clear();
                            ddlPenaltyType.Items.Add(livno);
                            ddlPenaltyType.DataSource = tms.GetPenaltyType(Convert.ToInt32(ddlVendor.SelectedValue));
                            ddlPenaltyType.DataTextField = "HeadName";
                            ddlPenaltyType.DataValueField = "ID";
                            ddlPenaltyType.DataBind();

                        }

                        ddlVehicleType.SelectedIndex = ddlVehicleType.Items.IndexOf(ddlVehicleType.Items.FindByValue(r.vehicleType.ToString()));
                        ddlPenaltyType.SelectedIndex = ddlPenaltyType.Items.IndexOf(ddlPenaltyType.Items.FindByValue(r.PenaltyID.ToString()));

                        ListBox lstStartHH = (ListBox)fvTrip.FindControl("lstStartHH");
                        lstStartHH.SelectedIndex = lstStartHH.Items.IndexOf(lstStartHH.Items.FindByValue(r.sHH.ToString()));

                        ListBox lstStartMM = (ListBox)fvTrip.FindControl("lstStartMM");
                        lstStartMM.SelectedIndex = lstStartMM.Items.IndexOf(lstStartMM.Items.FindByValue(r.sMM.ToString()));

                        ListBox lstEndHH = (ListBox)fvTrip.FindControl("lstEndHH");
                        lstEndHH.SelectedIndex = lstEndHH.Items.IndexOf(lstEndHH.Items.FindByValue(r.eHH.ToString()));

                        ListBox lstEndMM = (ListBox)fvTrip.FindControl("lstEndMM");
                        lstEndMM.SelectedIndex = lstEndMM.Items.IndexOf(lstEndMM.Items.FindByValue(r.eMM.ToString()));

                        //((TextBox)fvTrip.FindControl("txtGarageKM")).Text = (r.GarageKM).ToString();
                        //((CheckBox)fvTrip.FindControl("ChkAcTrip")).Checked = Convert.ToBoolean(r.AcTrip);

                        
                        //DropDownList ddlPenaltyType = (DropDownList)fvTrip.FindControl("ddlPenaltyType");
                        //ddlPenaltyType.SelectedIndex = ddlPenaltyType.Items.IndexOf(ddlPenaltyType.Items.FindByValue(tms.GetDummyRouteInfo(_routeid).ElementAtOrDefault(0).PenaltyID.ToString()));

                        //((TextBox)fvTrip.FindControl("txtAppKM")).Text = r.approvedKm.ToString();


                        //if (tms.GetDummyRouteInfo(_routeid).ElementAtOrDefault(0).PenaltyType == "Cab No-Show")
                        //{
                        //    txtPenaltyAmount.Visible = true;
                        //    txtPenaltyAmount.Text = tms.GetDummyRouteInfo(_routeid).ElementAtOrDefault(0).PenaltyAmount.ToString();
                        //}
                        //else
                        //{
                        //    txtPenaltyAmount.Visible = false;
                        //}

                        DropDownList ddlDelay = (DropDownList)fvTrip.FindControl("ddlDelay");

                        DropDownList ddlVehicleNo = (DropDownList)fvTrip.FindControl("ddlVehicleNo");
                        DropDownList ddlven = (DropDownList)fvTrip.FindControl("ddlVendor");

                        ListItem livn = new ListItem("-Select-", "0");
                        ListItem livn1 = new ListItem("Adhoc", "-1");
                        ddlVehicleNo.Items.Clear();
                        ddlVehicleNo.Items.Add(livn);
                        ddlVehicleNo.Items.Add(livn1);
                        ddlVehicleNo.DataSource = tms.GetVehicleByVendorType(Convert.ToInt32(ddlven.SelectedValue), Convert.ToInt32(ddlVehicleType.SelectedValue));
                        ddlVehicleNo.DataTextField = "vehicleNo";
                        ddlVehicleNo.DataValueField = "Id";
                        ddlVehicleNo.DataBind();
                        ddlVehicleNo.SelectedIndex = ddlVehicleNo.Items.IndexOf(ddlVehicleNo.Items.FindByValue(r.vehicleId.ToString()));


                        int delayID = Convert.ToInt32(r.DelayID.ToString());

                        //if (delayID > 0)
                        //{
                        ddlDelay.Items.Clear();
                        ListItem lidel = new ListItem("Select Delay Reason", "0");
                        ddlDelay.Items.Add(lidel);
                        ddlDelay.DataSource = tms.GetIncidentMaster();
                        ddlDelay.DataTextField = "Incident_type";
                        ddlDelay.DataValueField = "id";
                        ddlDelay.DataBind();
                        ddlDelay.SelectedIndex = ddlDelay.Items.IndexOf(ddlDelay.Items.FindByValue(r.DelayID.ToString()));
                        //}


                        DropDownList ddlTripRemark = (DropDownList)fvTrip.FindControl("ddltripremark");
                        ddlTripRemark.Items.Clear();
                        ListItem lide2 = new ListItem("-Select Trip Remark-", "0");
                        ddlTripRemark.Items.Add(lide2);
                        ddlTripRemark.DataSource = tms.GetTripRemark();
                        ddlTripRemark.DataTextField = "Incident_type";
                        ddlTripRemark.DataValueField = "id";
                        ddlTripRemark.DataBind();
                        ddlTripRemark.SelectedIndex = ddlTripRemark.Items.IndexOf(ddlTripRemark.Items.FindByValue(r.TripRemark.ToString()));

                        
                        DropDownList ddlDriver = (DropDownList)fvTrip.FindControl("ddlDriver");

                        ddlDriver.SelectedIndex = ddlDriver.Items.IndexOf(ddlDriver.Items.FindByValue(r.driver.ToString()));
                        DropDownList ddlGuard = (DropDownList)fvTrip.FindControl("ddlGuard");

                        ddlGuard.SelectedIndex = ddlGuard.Items.IndexOf(ddlGuard.Items.FindByValue(r.GuardID.ToString()));

                        RadioButtonList rdb = (RadioButtonList)fvTrip.FindControl("rdbtnlstType");
                        rdb.SelectedValue = tms.GetDummyRouteInfo(_routeid).ElementAtOrDefault(0).tripType;
                        string triptype = tms.GetDummyRouteInfo(_routeid).ElementAtOrDefault(0).tripType;
                        string shift = tms.GetDummyRouteInfo(_routeid).ElementAtOrDefault(0).shiftTime;
                        ListItem liShift = new ListItem("-Select Shift-", "0");
                        DropDownList ddlShift = (DropDownList)fvTrip.FindControl("ddlShiftTime");
                        ddlShift.Items.Clear();
                        ddlShift.DataSource = tms.GetShiftByFacilityType(r.FacilityID, triptype);
                        ddlShift.DataTextField = "ShiftTime";
                        ddlShift.DataValueField = "ShiftTime";
                        ddlShift.Items.Add(liShift);
                        ddlShift.DataBind();

                        ddlShift.SelectedIndex = ddlShift.Items.IndexOf(ddlShift.Items.FindByValue(shift));
                        //if (shift == "") ddlShift.Enabled = true; else ddlShift.Enabled = false;
                        // if (triptype == "") rdb.Enabled = true; else rdb.Enabled = false;

                        btnSave.Enabled = true;
                        imbbtnAddEmp.Enabled = true;
                        if (ISAdmin != "0")
                            btnCancelTrip0.Enabled = true;
                        DropDownList ddlrouteno = (DropDownList)fvTrip.FindControl("ddlRouteNo");
                        ddlrouteno.Items.Clear();
                        ListItem liderouteno = new ListItem("-Select Tag-", "");
                        ddlrouteno.Items.Add(liderouteno);

                        ddlrouteno.DataSource = tms.GetVehicleTagNumbers(MyApplicationSession._FacilityID);
                        ddlrouteno.DataTextField = "RouteNo";
                        ddlrouteno.DataValueField = "RouteNo";

                        ddlrouteno.DataBind();
                        ddlrouteno.SelectedIndex = ddlrouteno.Items.IndexOf(ddlrouteno.Items.FindByValue(r.RouteNo.ToString()));

                        ListBox lbtoll = (ListBox)fvTrip.FindControl("lbToll");
                        //DropDownList ddlToll = ((DropDownList)fvTrip.FindControl("ddlToll"));
                        //string tollId = tms.SelectTollByRouteId(_routeid).ElementAtOrDefault(0).Tollname.ToString();
                        var r1 = tms.SelectTollidbyroute(_routeid);
                        //ddlToll.SelectedIndex=ddlToll.Items.IndexOf(ddlToll.Items.FindByValue(r.ElementAtOrDefault(0).tollid.ToString()));
                        TextBox txtVehicleNo = ((TextBox)fvTrip.FindControl("txtVehicleNo"));
                        foreach (var rest in r1)
                        {
                            // ddlToll.SelectedIndex = ddlToll.Items.IndexOf(ddlToll.Items.FindByValue(rest.tollid.ToString()));
                            for (int tollid = 0; tollid < lbtoll.Items.Count; tollid++)
                            {
                                if (lbtoll.Items[tollid].Value.ToString() == rest.tollid.ToString())
                                {
                                    lbtoll.Items[tollid].Selected = true;
                                }
                            }
                        }
                        ddlrouteno.Focus();
                        //((TextBox)fvTrip.FindControl("txtRouteNo")).Focus();
                    }
                }
            }
            else
            {
                lblErrorMsg.Text = "No Record Found!!!";
                lblErrorMsg.Visible = true;
                panelLink.Visible = false;


            }
        }
        catch (Exception ex)
        {

            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);
        }
    }

    private string GetRouteID()
    {
        string routeno;
        int count;
        DateTime dt1 = Convert.ToDateTime("01/01/2010");
        DateTime dt2 = Convert.ToDateTime(txtShiftDate.Text);

        TimeSpan ts = dt2 - dt1;
        string days = Convert.ToString(ts.Days);
        if (days.Length < 4)
        {
            days = '0' + days;
        }

        string Facility = Convert.ToString(MyApplicationSession._FacilityID);
        if (Facility.Length < 2)
        {
            Facility = '0' + Facility;
        }

        routeno = string.Empty;
        routeno = Facility + days + "R";
        //routeno = days + "R";
        count = txtRouteId.Text.ToString().Trim().Length;
        for (int i = 1; i <= 5 - count; i++)
        {
            routeno += "0";
        }
        routeno += txtRouteId.Text.ToString();
        return routeno;
    }

    private string GetRoutePreFix()
    {
        string routeno;
        DateTime dt1 = Convert.ToDateTime("01/01/2010");
        DateTime dt2 = Convert.ToDateTime(txtShiftDate.Text);

        TimeSpan ts = dt2 - dt1;
        string days = Convert.ToString(ts.Days);
        if (days.Length < 4)
        {
            days = '0' + days;
        }

        string Facility = Convert.ToString(MyApplicationSession._FacilityID);
        if (Facility.Length < 2)
        {
            Facility = '0' + Facility;
        }

        routeno = string.Empty;
        routeno = Facility + days + "R";
        return routeno;
    }


    protected void btnAddEmp_Click(object sender, EventArgs e)
    {
        //**************************************************//
        //Opens popup to search and add new employee to route //
        //**************************************************//
        try
        {
            Panel1.Style.Add(HtmlTextWriterStyle.Visibility, "visible");
            GvEmployee.Visible = false;
            lblSearch.Visible = false;
            ddlStopNO.Items.Clear();
            ListItem li = new ListItem("Select Stop No", "0");
            string val = string.Empty;
            ddlStopNO.Items.Add(li);
            for (int i = 0; i <= GvEmpInfo.Rows.Count; i++)
            {
                val = (i + 1).ToString();

                ddlStopNO.Items.Add(val.ToString());

            }
            GetGvData();
            ModalPopupExtender1.Show();
            txtEmpIdName.Focus();
        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);

        }
    }
    public void GetGvData()
    {

        //**************************************************//
        //Saves the entered data in empinfo gridview into an array //
        //**************************************************//
        try
        {
            size = GvEmpInfo.Rows.Count;
            arr = new string[size, 3];
            for (int i = 0; i < GvEmpInfo.Rows.Count; i++)
            {

                arr[i, 0] = GvEmpInfo.DataKeys[i].Value.ToString();
                arr[i, 1] = ((DropDownList)GvEmpInfo.Rows[i].FindControl("ddlStatus")).SelectedValue;
                arr[i, 2] = ((TextBox)GvEmpInfo.Rows[i].FindControl("txtgvRemarks")).Text;
            }
        }
        catch (Exception ex)
        {

            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);

        }

    }

    protected void lbtnClose_Click(object sender, EventArgs e)
    {
        ModalPopupExtender1.Hide();
        imbbtnAddEmp.Focus();
    }

    protected void btnEmpSearch_Click(object sender, EventArgs e)
    {
        //*************************************************************//
        //calls the function to bind employee grid with serach criteria //
        //*************************************************************//
        try
        {
            _empIdName = txtEmpIdName.Text;
            txtEmpIdName.Text = string.Empty;
            BndManGrid();

            ModalPopupExtender1.Show();
        }
        catch (Exception ex)
        {

            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);

        }
    }
    public void BndManGrid()
    {

        //*************************************************************//
        // Binds the employee grid with serach criteria //
        //*************************************************************//
        try
        {

            GvEmployee.DataSource = tms.EmpSearch(_empIdName, MyApplicationSession._LocationId, "N");
            GvEmployee.DataBind();
            if (GvEmployee.Rows.Count < 1)
            {

                lblSearch.Visible = true;
                lblSearch.Text = "No Record Found!!!";
            }
            else
            {
                lblSearch.Visible = false;
                txtEmpIdName.Text = string.Empty;
                GvEmployee.Visible = true;

            }

        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);
        }
    }

    protected void GvEmployee_PageIndexChanging(object sender, GridViewPageEventArgs e)
    {
        GvEmployee.PageIndex = e.NewPageIndex;
        BndManGrid();
        ModalPopupExtender1.Show();
    }


    protected void GvEmployee_SelectedIndexChanging(object sender, GridViewSelectEventArgs e)
    {
        //*************************************************************//
        //Adds the selected employee to the route      //
        //*************************************************************//
        try
        {
            int empId = Convert.ToInt32(GvEmployee.DataKeys[e.NewSelectedIndex].Value.ToString());
            int stopNo = Convert.ToInt32(ddlStopNO.SelectedValue);
            int addresstype = 1;
            string result = tms.AddEmpToDummyRoute(empId, stopNo, _routeid, MyApplicationSession._UserID,addresstype).ElementAtOrDefault(0).result.Value.ToString();

            if (result.Equals("1"))
            {
                BndEmpGrid();
                BndEmpGridData();
                SetGvData();
                imbbtnAddEmp.Focus();
            }
            else
            {
                lblSearch.Text = "Employee Already Exists In TripSheet";
                lblSearch.Visible = true;
                ModalPopupExtender1.Show();

            }
        }
        catch (Exception ex)
        {

            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);

        }
    }

    public void SetGvData()
    {
        //****************************************************************************//
        //Binds the empinfo grid with the temporarily saved information after postback //
        //***************************************************************************//
        try
        {
            for (int i = 0; i < size; i++)
            {
                for (int j = 0; j < GvEmpInfo.Rows.Count; j++)
                {

                    if (arr[i, 0].ToString().Equals(GvEmpInfo.DataKeys[j].Value.ToString()))
                    {
                        DropDownList ddl = (DropDownList)GvEmpInfo.Rows[j].FindControl("ddlStatus");
                        TextBox txt = (TextBox)GvEmpInfo.Rows[j].FindControl("txtgvRemarks");
                        ddl.SelectedIndex = ddl.Items.IndexOf(ddl.Items.FindByValue(arr[i, 1].ToString()));
                        txt.Text = arr[i, 2].ToString();


                    }

                }
            }
        }
        catch (Exception ex)
        {

            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);

        }
    }
    protected void GvEmpInfo_RowDeleting(object sender, GridViewDeleteEventArgs e)
    {
        //*************************************************************//
        //Removes the recently added employee from the route   //
        //*************************************************************//
        try
        {
            int empId = Convert.ToInt32(GvEmpInfo.DataKeys[e.RowIndex].Value.ToString());
            tms.DeleteEmpFromRoute(empId, _routeid);
            GetGvData();
            BndEmpGrid();
            SetGvData();
        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);

        }
    }

    protected void txtEndKM_TextChanged(object sender, EventArgs e)
    {
        //*********************************************************************//
        //Calculates the KM travelled by subtracting start km from the end Km  //
        //********************************************************************//
        try
        {
            TextBox txtstart = (TextBox)fvTrip.FindControl("txtStartKM");
            TextBox txtEnd = (TextBox)fvTrip.FindControl("txtEndKM");
            TextBox txtAct = (TextBox)fvTrip.FindControl("txtActKM");
            TextBox txtApp = (TextBox)fvTrip.FindControl("txtAppKM");

            if ((txtEnd.Text.ToString().Trim().Length > 0) && (txtstart.Text.ToString().Trim().Length > 0) && System.Text.RegularExpressions.Regex.IsMatch(txtEnd.Text, @"^\d+(?:\.\d{0,2})?$"))
            {
                txtAct.Text = ((Convert.ToDecimal(txtEnd.Text)) - Convert.ToDecimal(txtstart.Text)).ToString();
                txtApp.Focus();

            }
        }
        catch (Exception ex)
        {

            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);

        }
    }

    protected void lstEndMM_SelectedIndexChanged(object sender, EventArgs e)
    {
        //CompDate();
        ListBox lstmm = (ListBox)fvTrip.FindControl("lstEndMM");
        lstmm.Focus();

    }
    public void CompDate()
    {

        //******************************************************************************//
        //Compares the End time with the shift time and prompts the selection for delay //
        //****************************************************************************//
        try
        {
            int delayBuffer = 0;
            var resultLock = tms.GetLockDetails(MyApplicationSession._FacilityID);
            foreach (var result1 in resultLock)
            {
                delayBuffer = Convert.ToInt32(result1.DelayBuffer);
            }

            ListBox lstmm = (ListBox)fvTrip.FindControl("lstEndMM");
            ListBox lsthh = (ListBox)fvTrip.FindControl("lstEndHH");
            TextBox txtdate = (TextBox)fvTrip.FindControl("txtEndTime");
            Label lblsh = (Label)fvTrip.FindControl("lblShiftTime");
            DropDownList ddldel = (DropDownList)fvTrip.FindControl("ddlDelay");

            if (lsthh.SelectedIndex != 0 && lstmm.SelectedIndex != 0)
            {
                string routeDate = Convert.ToDateTime(fvTrip.DataKey[0].ToString()).ToString("MM/dd/yyyy");
                //string Shift = fvTrip.DataKey[1].ToString();
                //string tripType = fvTrip.DataKey[2].ToString();
                string tripType = ((RadioButtonList)fvTrip.FindControl("rdbtnlstType")).SelectedValue;
                string Shift = ((DropDownList)fvTrip.FindControl("ddlShiftTime")).SelectedValue;

                DateTime sdate = Convert.ToDateTime(routeDate + " " + Shift.Substring(0, 2) + ":" + Shift.Substring(2, 2) + ":00");
                DateTime actdate = Convert.ToDateTime(txtdate.Text + " " + lsthh.Text + ":" + lstmm.Text + ":00");

                sdate = sdate.AddMinutes(delayBuffer);
                if ((sdate < actdate) && (tripType == "P"))
                {
                    //if (ddldel.Items.Count < 1)
                    if (ddldel.SelectedIndex <= 0)
                    {
                        //ddldel.Items.Clear();
                        //ListItem lidel = new ListItem("Select Delay Reason", "0");
                        //ddldel.Items.Add(lidel);
                        //ddldel.DataSource = tms.GetIncidentMaster();
                        //ddldel.DataTextField = "Incident_type";
                        //ddldel.DataValueField = "id";
                        //ddldel.DataBind();
                        _save = "False";
                        lblErrorMsg.Visible = true;
                        lblErrorMsg.Text = "Please Select Delay Reason.";
                        //System.Windows.Forms.MessageBox.Show("Please Select A Delay Reason.");
                        ddldel.Focus();
                    }
                    else
                    {
                        _save = "True";

                    }

                }
                else
                {
                    //ddldel.Items.Clear();
                    _save = "True";
                }

            }

        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);

        }

    }

    protected void btnSave_Click(object sender, EventArgs e)
    {
        //*************************************************************//
        //Saves the route information into the DB   //
        //*************************************************************//

        try
        {
            CompDate();
            if (_save.Equals("True"))
            {
                //if (((TextBox)fvTrip.FindControl("txtEndKm")).Text == "")
                //{
                r.actEndKm = 0;
                //}
                //else
                //{
                //    r.actEndKm = Convert.ToInt32(((TextBox)fvTrip.FindControl("txtEndKm")).Text);
                //}

                //if (((TextBox)fvTrip.FindControl("txtStartKm")).Text == "")
                //{
                    r.actStartKm = 0;
                //}
                //else
                //{
                //    r.actStartKm = Convert.ToInt32(((TextBox)fvTrip.FindControl("txtStartKm")).Text);
                //}

                r.actTotalStop = GvEmpInfo.Rows.Count;
                ListBox lstendmm = (ListBox)fvTrip.FindControl("lstEndMM");
                ListBox lstendhh = (ListBox)fvTrip.FindControl("lstEndHH");
                TextBox txtenddate = (TextBox)fvTrip.FindControl("txtEndTime");
                ListBox lststartmm = (ListBox)fvTrip.FindControl("lstStartMM");
                ListBox lststarthh = (ListBox)fvTrip.FindControl("lstStartHH");
                TextBox txtstartdate = (TextBox)fvTrip.FindControl("txtStartTime");
                r.actVehicleEndTime = Convert.ToDateTime(txtenddate.Text + " " + lstendhh.Text + ":" + lstendmm.Text + ":00");
                r.actVehicleStartTime = Convert.ToDateTime(txtstartdate.Text + " " + lststarthh.Text + ":" + lststartmm.Text + ":00");

                DropDownList ddlGuard = (DropDownList)fvTrip.FindControl("ddlGuard");
                r.GuardID  = Convert.ToInt32(ddlGuard.SelectedValue);
                DropDownList ddlVehicleNo = (DropDownList)fvTrip.FindControl("ddlVehicleNo");

                r.vehicleId = ddlVehicleNo.SelectedValue;
                r.vendorId = Convert.ToInt32(((DropDownList)fvTrip.FindControl("ddlVendor")).SelectedValue);
                r.vehicleType = Convert.ToInt32(((DropDownList)fvTrip.FindControl("ddlVehicleType")).SelectedValue);
                r.remark = ((TextBox)fvTrip.FindControl("txtRemarks")).Text;
                //  DropDownList ddlVehicleNo = (DropDownList)fvTrip.FindControl("ddlVehicleNo");
                if (ddlVehicleNo.SelectedValue.ToString() == "-1")
                    r.vehicleNo = ((TextBox)fvTrip.FindControl("txtVehicleNo")).Text;
                else
                    r.vehicleNo = ddlVehicleNo.SelectedItem.ToString();

                //if (((TextBox)fvTrip.FindControl("txtAppKm")).Text == "")
                //{
                r.approvedKm = 0;
                //}
                //else
                //{
                //    r.approvedKm = Convert.ToInt32(((TextBox)fvTrip.FindControl("txtAppKm")).Text);
                //}
                //if (((TextBox)fvTrip.FindControl("txtToll")).Text == "")
                //{
                r.TollRate = 0;
                //}
                //else
                //{
                //    r.TollRate = Convert.ToDouble(((TextBox)fvTrip.FindControl("txtToll")).Text);
                //}

                //if (((CheckBox)fvTrip.FindControl("chkIntersateTax")).Checked == true)
                //{
                //    r.IntersateTax = Convert.ToBoolean(1);

                //}
                //else
                //{
                //    r.IntersateTax = Convert.ToBoolean(0);

                //}

                DropDownList ddlDel = (DropDownList)fvTrip.FindControl("ddlDelay");
                if (ddlDel.Items.Count > 1)
                {
                    r.delayReason = Convert.ToInt32(ddlDel.SelectedValue);

                }
                else
                {
                    r.delayReason = 0;
                }
                r.Id = _routeid;
                r.updatedBy = MyApplicationSession._UserID;
                DropDownList ddlDriver = (DropDownList)fvTrip.FindControl("ddlDriver");

                r.driver = ddlDriver.SelectedValue;
                
                r.tripType = Convert.ToChar(((RadioButtonList)fvTrip.FindControl("rdbtnlstType")).SelectedValue);
                r.shiftTime = ((DropDownList)fvTrip.FindControl("ddlShiftTime")).SelectedValue;
                r.RouteNo = ((DropDownList)fvTrip.FindControl("ddlRouteNo")).SelectedValue;

                string totalstop = ((TextBox)fvTrip.FindControl("TextTotalStop")).Text;
                if(totalstop=="") r.totalStop=0; else r.totalStop=Convert.ToInt32(totalstop);
                r.TripRemark = Convert.ToInt32(((DropDownList)fvTrip.FindControl("ddlTripRemark")).SelectedValue);
                int d=Convert.ToInt32(((DropDownList)fvTrip.FindControl("ddlPenaltyType")).SelectedValue);
                r.PenaltyType = Convert.ToInt32(((DropDownList)fvTrip.FindControl("ddlPenaltyType")).SelectedValue);
                r.ZoneID = Convert.ToInt32(((DropDownList)fvTrip.FindControl("ddlZone")).SelectedValue);
                r.ACtrip = 0;
                //if (((TextBox)fvTrip.FindControl("txtGarageKM")).Text == "")
                    r.GarageKM = 0;
                //else
                //    r.GarageKM = Convert.ToDouble(((TextBox)fvTrip.FindControl("txtGarageKM")).Text);


                int i = 0;
                foreach (GridViewRow gvr in GvEmpInfo.Rows)
                {
                    i++;
                    if (GvEmpInfo.DataKeys[gvr.RowIndex].Value.ToString() == "0")
                    {
                        rd.employeeId = i;
                    }
                    else
                    {
                        rd.employeeId = Convert.ToInt32(GvEmpInfo.DataKeys[gvr.RowIndex].Value.ToString());
                    }
                    //rd.employeeId =
                    rd.routeid = _routeid;
                    rd.stopNo = Convert.ToInt32(((Label)gvr.FindControl("lblStopNo")).Text);
                    rd.trackingRemark = ((TextBox)gvr.FindControl("txtgvRemarks")).Text;
                    rd.trackingStatus = ((DropDownList)gvr.FindControl("ddlStatus")).SelectedValue;

                    DropDownList ddlToll = ((DropDownList)fvTrip.FindControl("ddlToll"));
                    string toll = null;
                    //toll = ddlToll.SelectedValue;
                    ListBox lbtoll = (ListBox)fvTrip.FindControl("lbToll");
                    for (int tollid = 0; tollid < lbtoll.Items.Count; tollid++)
                    {
                        if (lbtoll.Items[tollid].Selected == true)
                        {
                            toll = toll + lbtoll.Items[tollid].Value.ToString() + ",";
                        }
                    }
                    if (toll == null)
                    {
                        toll = "0";
                    }
                    else
                    {
                        toll = toll.Remove(toll.Length - 1, 1);
                    }

                    tms.AddtolltoRoute(_routeid, toll);

                    tms.SaveDummyRouteDetInfo(rd.routeid, rd.employeeId, rd.stopNo, rd.trackingRemark, rd.trackingStatus, MyApplicationSession._UserID, r.tripType.ToString(), r.shiftTime);
                }
                if (GvEmpInfo.Rows.Count>0)
                {
                    tms.SaveDummyRouteInfo(r.tripType.ToString(), r.shiftTime, r.vehicleId, r.vendorId, r.vehicleType, r.actStartKm, r.actEndKm, r.approvedKm, r.actVehicleStartTime, r.actVehicleEndTime, r.guard, r.vehicleNo, r.driver, r.remark, r.delayReason, r.Id, r.updatedBy, r.TollRate, r.IntersateTax, r.PenaltyType, r.PenaltyAmount, r.ZoneID, r.RouteNo, r.totalStop, r.TripRemark, r.GuardID, r.ACtrip, r.GarageKM);

                lblErrorMsg.Visible = true;
                lblErrorMsg.Text = "TripSheet Saved Successfully";
                MultiView1.ActiveViewIndex = -1;
                }
                else
                {
                lblErrorMsg.Visible = true;
                lblErrorMsg.Text="Please add at least one employee to save";
                }
            }
        }
        catch (Exception ex)
        {

            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);
        }



    }
    private void ShowMessage(string message)
    {
        string jScript = "alert('" + message + "');";
        ScriptManager.RegisterStartupScript(this, this.GetType(), "updated", jScript, true);

    }

    protected void btnCancelTrip_Click(object sender, EventArgs e)
    {
        //*************************************************************//
        //Saves the Tripsheet into the DB as Cancelled //
        //*************************************************************//
        try
        {
            tms.CancelTripSheet(_routeid);
            MultiView1.ActiveViewIndex = -1;
            lblErrorMsg.Text = " Trip Canceled for: " + _routeid.ToString();
        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);

        }
    }
    //protected void ddlPenaltyType_SelectedIndexChanged(object sender, EventArgs e)
    //{
    //    DropDownList ddlPenaltyType = sender as DropDownList;
    //    TextBox txtPenaltyAmount = (TextBox)fvTrip.FindControl("txtPenaltyAmount");
    //    if (ddlPenaltyType.SelectedItem.Text == "Cab No-Show")
    //    {
    //        txtPenaltyAmount.Visible = true;
    //        txtPenaltyAmount.Focus();
    //    }
    //    else
    //    {
    //        txtPenaltyAmount.Text = "";
    //        txtPenaltyAmount.Visible = false;
    //    }
    //}

    protected void ddlVehicleType_SelectedIndexChanged(object sender, EventArgs e)
    {
        //**************************************************//
        //For Selected Vendor binds the vehicle dropdown //
        //**************************************************//
        try
        {

            DropDownList ddlvt = sender as DropDownList;
            int VehicleTypeID = Convert.ToInt32(ddlvt.SelectedValue);
            DropDownList ddlven = (DropDownList)fvTrip.FindControl("ddlVendor");
            DropDownList ddlVehicleNo = (DropDownList)fvTrip.FindControl("ddlVehicleNo");
            ddlVehicleNo.Items.Clear();
            ListItem livt = new ListItem("-Select-", "0");
            ListItem livt2 = new ListItem("Adhoc", "-1");

            ddlVehicleNo.Items.Add(livt);
            ddlVehicleNo.Items.Add(livt2);

            ddlVehicleNo.DataSource = tms.GetVehicleByVendorType(Convert.ToInt32(ddlven.SelectedValue), Convert.ToInt32(ddlvt.SelectedValue));
            ddlVehicleNo.DataTextField = "vehicleNo";
            ddlVehicleNo.DataValueField = "Id";
            ddlVehicleNo.DataBind();


            ddlvt.Focus();
        }
        catch (Exception ex)
        {

            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);

        }
    }
   
    protected void rdbtnlstType_SelectedIndexChanged(object sender, EventArgs e)
    {
        try
        {
            int facid = Convert.ToInt32(((Label)fvTrip.FindControl("lblfacid")).Text);
            DropDownList ddlShiftTime = (DropDownList)fvTrip.FindControl("ddlShiftTime");
            RadioButtonList rdbtnlstType = (RadioButtonList)fvTrip.FindControl("rdbtnlstType");
            string type = rdbtnlstType.SelectedValue.ToString();
            ddlShiftTime.Items.Clear();
            ListItem list = new ListItem("-Select Shift-", "0");
            ddlShiftTime.DataSource = tms.GetShiftByFacilityType(facid, type);
            ddlShiftTime.DataTextField = "shiftTime";
            ddlShiftTime.DataValueField = "shiftTime";
            ddlShiftTime.Items.Add(list);
            ddlShiftTime.DataBind();
            ddlShiftTime.SelectedIndex = 0;
        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);

        }

    }
    protected void txtShiftDate_TextChanged(object sender, EventArgs e)
    {
        DateChanged();
    }
    protected void ddlRouteNo_SelectedIndexChanged(object sender, EventArgs e)
    {
        try
        {
              
            String Rvendorid, Rvehiclytypeid, Rvehicleid;
            Rvendorid = string.Empty;
            Rvehiclytypeid = string.Empty;
            Rvehicleid = string.Empty;
            //TextBox txtRouteNo = (TextBox)fvTrip.FindControl("txtRouteNo");
            DropDownList ddlroutno = (DropDownList)fvTrip.FindControl("ddlRouteNo");
            var result = tms.GetVehicleInfoByRouteNo(ddlroutno.SelectedValue , MyApplicationSession._FacilityID);
            foreach (var r in result)
            {
                Rvendorid = r.vendorId.ToString();
                Rvehiclytypeid = r.vehicleTypeId.ToString();
                Rvehicleid = r.Id.ToString();
            }
            DropDownList ddlVendor = (DropDownList)fvTrip.FindControl("ddlVendor");
            ddlVendor.SelectedIndex = ddlVendor.Items.IndexOf(ddlVendor.Items.FindByValue(Rvendorid));
            int vendorid = Convert.ToInt32(ddlVendor.SelectedValue);
            if (vendorid == 0) vendorid = -1;

            DropDownList ddlvt = (DropDownList)fvTrip.FindControl("ddlVehicleType");
            ListItem livt = new ListItem("-Select-", "0");
            ddlvt.Items.Clear();
            ddlvt.Items.Add(livt);
            ddlvt.DataSource = tms.SelectVehicleType(vendorid);
            ddlvt.DataTextField = "vehicle";
            ddlvt.DataValueField = "Id";
            ddlvt.DataBind();
            ddlvt.SelectedIndex = ddlvt.Items.IndexOf(ddlvt.Items.FindByValue(Rvehiclytypeid));

            DropDownList ddlVehicleNo = (DropDownList)fvTrip.FindControl("ddlVehicleNo");
            ListItem liv = new ListItem("-Select-", "0");
            ListItem liv1 = new ListItem("Adhoc", "1");

            ddlVehicleNo.Items.Clear();
            ddlVehicleNo.Items.Add(liv);
            ddlVehicleNo.Items.Add(liv1);

            ddlVehicleNo.DataSource = tms.GetVehicleByVendorType(vendorid, Convert.ToInt32(ddlvt.SelectedValue));
            ddlVehicleNo.DataTextField = "vehicleNo";
            ddlVehicleNo.DataValueField = "Id";
            ddlVehicleNo.DataBind();
            ddlVehicleNo.SelectedIndex = ddlVehicleNo.Items.IndexOf(ddlVehicleNo.Items.FindByValue(Rvehicleid ));


        }
        catch (Exception ex)
        {

            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }
}
