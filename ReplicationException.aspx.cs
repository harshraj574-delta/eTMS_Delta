using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Text.RegularExpressions;


public partial class ReplicationException : basepage
{
    DataClasses1DataContext tms = new DataClasses1DataContext();
    String lasttriptype = "D";
    public string _facilityid
    {
        get { return (string)ViewState["_facilityid"]; }
        set { ViewState["_facilityid"] = value; }
    }
    public string _ShiftDate
    {
        get { return (string)ViewState["_ShiftDate"]; }
        set { ViewState["_ShiftDate"] = value; }
    }
    public string _StrShift
    {
        get { return (string)ViewState["_StrShift"]; }
        set { ViewState["_StrShift"] = value; }
    }
    public string _strTripType
    {
        get { return (string)ViewState["_strTripType"]; }
        set { ViewState["_strTripType"] = value; }
    }
    protected void Page_Load(object sender, EventArgs e)
    {
        lblmsg.Visible = false;
        MultiView1.ActiveViewIndex = -1;
        CompareValidator3.ValueToCompare = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, MyApplicationSession.INDIAN_ZONE).ToString("MM/dd/yyyy");
        if (!IsPostBack)
        {
            BndDdl();
            Boolean IsValid = true;
            string fromDate = Request.QueryString["fromDate"];
            string toDate = Request.QueryString["toDate"];
            string facId = Request.QueryString["facId"];
            string rType = Request.QueryString["rtype"];
            string strShifttimes = Request.QueryString["strShifttimes"];
            if (fromDate != null && toDate != null && facId != null && rType != null && strShifttimes != null)
            {
                if (!Regex.IsMatch(fromDate, @"^(([0]?[1-9]|1[0-2])/([0-2]?[0-9]|3[0-1])/[1-2]\d{3})? ?((([0-1]?\d)|(2[0-3])):[0-5]\d)?(:[0-5]\d)?$"))
                    IsValid = false;
                if (!Regex.IsMatch(toDate, @"^(([0]?[1-9]|1[0-2])/([0-2]?[0-9]|3[0-1])/[1-2]\d{3})? ?((([0-1]?\d)|(2[0-3])):[0-5]\d)?(:[0-5]\d)?$"))
                    IsValid = false;
                if (!Regex.IsMatch(facId, @"^[0-9]"))
                    IsValid = false;
                if (IsValid == true)
                {
                    _ShiftDate = toDate;
                    _facilityid = facId;
                    _strTripType = rType;
                    _StrShift = strShifttimes;

                    txtStartDate.Text = toDate;
                    ddlfacility.SelectedIndex = ddlfacility.Items.IndexOf(ddlfacility.Items.FindByValue(facId.ToString()));
                    if (rType == "P")
                        rdbtnlstType.Items.FindByText("Pick").Selected = true;
                    else
                        rdbtnlstType.Items.FindByText("Drop").Selected = true;

                    BndLstShift();

                    var valueArray = strShifttimes.Split(',');

                    lstShift.Items[0].Selected = false;
                    for (int i = 0; i < lstShift.Items.Count; i++)
                    {
                        for (int j = 0; j < valueArray.Length; j++)
                        {
                            if (lstShift.Items[i].Text == valueArray[j].ToString())
                                lstShift.Items[i].Selected = true;
                        }
                    }
                    //lstShift.SelectedIndex = lstShift.Items.IndexOf(lstShift.Items.FindByValue(strShifttimes.ToString()));

                    //----------Bing Grid for Employee Deletion--------
                    BndGridDeleteData();
                    //----------Bing Grid for Employee Addition--------
                    BndGridAddData();
                    if (gvAddData.Rows.Count <= 0 && gvDeleteData.Rows.Count <= 0)
                        btnAllAtonce.Visible = false;
                    else
                        btnAllAtonce.Visible = true;
                }
                else
                {
                    lblErrorMsg.Text = "Parameters are not in correct format.";
                }
            }
            else
            {
                txtStartDate.Text = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, MyApplicationSession.INDIAN_ZONE).Date.ToString("MM/dd/yyyy");
            }


        }
       // this.RegisterPostBackControl();
    }
    protected void btnSubmit_Click(object sender, EventArgs e)
    {
        try
        {
            string strShifttimes = string.Empty;
            if (lstShift.SelectedIndex >= 0)
            {
                for (int i = 0; i < lstShift.Items.Count; i++)
                {
                    if (lstShift.Items[i].Selected)
                    {
                        strShifttimes = strShifttimes + lstShift.Items[i].Text.Trim() + ",";
                    }
                }
                strShifttimes = strShifttimes.Remove(strShifttimes.Length - 1, 1);
            }
            _ShiftDate = txtStartDate.Text;
            _facilityid = ddlfacility.SelectedValue.ToString();
            _StrShift = strShifttimes;
            _strTripType = rdbtnlstType.SelectedValue;

            //----------Bing Grid for Employee Deletion--------
            BndGridDeleteData();
            //----------Bing Grid for Employee Addition--------
            BndGridAddData();

            if (gvAddData.Rows.Count <= 0 && gvDeleteData.Rows.Count <= 0)
                btnAllAtonce.Visible = false;
            else
                btnAllAtonce.Visible = true;

            var result = tms.GetIsRouteFinalized(Convert.ToDateTime(txtStartDate.Text), Convert.ToInt32(_facilityid), _strTripType, _StrShift, MyApplicationSession._UserID).ElementAtOrDefault(0).result.Value.ToString();

            if (result == "True")
            {

                lblErrorMsg.Visible = true;
                lblErrorMsg.Text = "Route has been finalized for " + _StrShift + " shift.";
            }
            else
            {
                lblErrorMsg.Visible = false;
                lblErrorMsg.Text = "";
            }

            lblDelData.Visible = true;
            lblAddData.Visible = true;
            MultiView1.ActiveViewIndex = 0;
            if (gvAddData.Rows.Count <= 0 && gvDeleteData.Rows.Count <= 0)
                btnAllAtonce.Visible = false;
            else
                btnAllAtonce.Visible = true;
        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
        finally
        {
            btnSubmit.Enabled = true;
        }
    }
    public void BndGridDeleteData()
    {
        try
        {
            gvDeleteData.DataSource = tms.GetDeleteException(Convert.ToDateTime(_ShiftDate), Convert.ToDateTime(_ShiftDate), Convert.ToInt32(_facilityid), _StrShift, _strTripType);
            gvDeleteData.DataBind();
            if (gvDeleteData.Rows.Count > 0)
                btnexport1.Visible = true;
            else
                btnexport1.Visible = false;
            if (Convert.ToDateTime(txtStartDate.Text) < Convert.ToDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, MyApplicationSession.INDIAN_ZONE).Date.ToString("MM/dd/yyyy")))
                gvDeleteData.Enabled = false;
            else
                gvDeleteData.Enabled = true;
            MultiView1.ActiveViewIndex = 0;

        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }
    public void BndGridAddData()
    {
        try
        {
            gvAddData.DataSource = tms.GetAddException(Convert.ToDateTime(_ShiftDate),Convert.ToDateTime( _ShiftDate), Convert.ToInt32(_facilityid), _StrShift, _strTripType);
            gvAddData.DataBind();
            if (gvAddData.Rows.Count > 0)
                btnexport2.Visible = true;
            else
                btnexport2.Visible = false;
            if (Convert.ToDateTime(txtStartDate.Text) < Convert.ToDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, MyApplicationSession.INDIAN_ZONE).Date.ToString("MM/dd/yyyy")))
                gvAddData.Enabled = false;
            else
                gvAddData.Enabled = true;
            MultiView1.ActiveViewIndex = 0;
            
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
            if (ddlfacility.SelectedIndex != 0)
            {
                BndLstShift();
            }
        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }
    public void BndLstShift()
    {
        try
        {
            int facid = Convert.ToInt32(ddlfacility.SelectedValue.ToString());
            string type = rdbtnlstType.SelectedValue.ToString();
            lstShift.Items.Clear();
            ListItem list = new ListItem("-Select-", "0");
            lstShift.Items.Add(list);
            lstShift.DataSource = tms.GetShiftByFacilityType(facid, type);
            lstShift.DataTextField = "shiftTime";
            lstShift.DataValueField = "shiftTime";
            lstShift.DataBind();
            lstShift.SelectedIndex = 0;
        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }
    protected void ddlfacility_SelectedIndexChanged(object sender, EventArgs e)
    {
        if (ddlfacility.SelectedIndex != 0)
        {
            BndLstShift();
        }
    }
    protected void gvDeleteData_PageIndexChanging(object sender, GridViewPageEventArgs e)
    {
        gvDeleteData.PageIndex = e.NewPageIndex;
        BndGridDeleteData();
    }
    public void BndDdl()
    {
        try
        {
            ddlfacility.Items.Clear();
            ListItem lifac = new ListItem("Select Facility", "0");
            ddlfacility.Items.Add(lifac);
            ddlfacility.DataSource = tms.SelectFacility(MyApplicationSession._UserID);
            ddlfacility.DataTextField = "facilityName";
            ddlfacility.DataValueField = "Id";
            ddlfacility.DataBind();
        }
        catch (Exception ex)
        {
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }
    public void CheckAll(object sender, EventArgs e)
    {
        try
        {
            CheckBox cb = (CheckBox)sender;
            if (cb.Checked == true)
            {
                foreach (GridViewRow i in gvDeleteData.Rows)
                {
                    CheckBox cbl = (CheckBox)i.FindControl("chkTrack");
                    if (cbl != null)
                        cbl.Checked = true;
                }
            }
            else
            {
                foreach (GridViewRow i in gvDeleteData.Rows)
                {
                    CheckBox cbl = (CheckBox)i.FindControl("chkTrack");
                    if (cbl != null)
                        cbl.Checked = false;
                }
            }
            MultiView1.ActiveViewIndex = 0;
        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }
    protected void ibDelete_Click(object sender, ImageClickEventArgs e)
    {
        string EmpIdList = string.Empty;
        foreach (GridViewRow i in gvDeleteData.Rows)
        {
            CheckBox cbl = (CheckBox)i.FindControl("chkTrack");
            if (cbl.Checked == true)
            {
                EmpIdList = EmpIdList + gvDeleteData.DataKeys[i.RowIndex].Values[0].ToString() + ",";
            }
        }
        if (EmpIdList != string.Empty)
        {
            EmpIdList = EmpIdList.Remove(EmpIdList.Length - 1, 1);
            tms.SprDeleteExceptionEmp(_ShiftDate, Convert.ToInt32(_facilityid), _StrShift, _strTripType, EmpIdList, MyApplicationSession._UserID);
            BndGridDeleteData();
            ShowMessage("Selected employee deleted successfully!");
        }
        else
        {
            ShowMessage("Select atleast one employee for deletion !");
            MultiView1.ActiveViewIndex = 0;
        }
    }

    private void ShowMessage(string message)
    {
        string jScript = "alert('" + message + "');";
        ScriptManager.RegisterStartupScript(this, this.GetType(), "updated", jScript, true);

    }
    protected void gvAddData_PageIndexChanging(object sender, GridViewPageEventArgs e)
    {
        gvAddData.PageIndex = e.NewPageIndex;
        BndGridAddData();
    }

    protected void ibAddData_Click(object sender, EventArgs e)
    {
        string EmpIdList = string.Empty;
        string shift = string.Empty;
        foreach (GridViewRow i in gvAddData.Rows)
        {
            CheckBox cbl = (CheckBox)i.FindControl("chkTrack");
            if (cbl.Checked == true)
            {
                EmpIdList = EmpIdList + gvAddData.DataKeys[i.RowIndex].Values[0].ToString() + ",";
                shift = shift + ((Label) gvAddData.Rows[i.RowIndex].FindControl("lblgridShift")).Text + ",";
            }
        }

        if (EmpIdList != string.Empty)
        {
            EmpIdList = EmpIdList.Remove(EmpIdList.Length - 1, 1);
            shift = shift.Remove(shift.Length - 1, 1);
            var result = tms.MakeRouteReplicateException(Convert.ToDateTime(_ShiftDate), Convert.ToInt32(_facilityid), shift, _strTripType, EmpIdList, MyApplicationSession._UserID).ElementAtOrDefault(0).NewRouteID.ToString();
            BndGridAddData();
            BndGridDeleteData();
            ModalPopupExtender2.Hide();
            ShowMessage("Your new routeid generated is " + result);
        }
        else
        {
            ShowMessage("Select atleast one employee to make a new route!");
            MultiView1.ActiveViewIndex = 0;
        }
    }

    protected void CheckAllAdd(object sender, EventArgs e)
    {
        try
        {
            CheckBox cb = (CheckBox)sender;
            if (cb.Checked == true)
            {
                foreach (GridViewRow i in gvAddData.Rows)
                {
                    CheckBox cbl = (CheckBox)i.FindControl("chkTrack");
                    if (cbl != null)
                        cbl.Checked = true;
                }
            }
            else
            {
                foreach (GridViewRow i in gvAddData.Rows)
                {
                    CheckBox cbl = (CheckBox)i.FindControl("chkTrack");
                    if (cbl != null)
                        cbl.Checked = false;
                }
            }
            MultiView1.ActiveViewIndex = 0;
        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }


    protected void lbRouteAssign_Click(object sender, EventArgs e)
    {
        try
        {
            LinkButton btn = (LinkButton)sender;
            GridViewRow gvr = (GridViewRow)btn.NamingContainer;
            int tstop;
            int rowindex = gvr.RowIndex;
            string empid = lblAssignEmpID.Text;
            Label routeID = (Label)grdRoutes.Rows[rowindex].FindControl("lblRouteID");
            string rid = routeID.Text;
            Label totstop = (Label)grdRoutes.Rows[rowindex].FindControl("lblTotalStop");

            if(totstop.Text.Contains("/"))
            {
            if (rdbtnlstType.SelectedValue=="P")
                tstop = Convert.ToInt32(totstop.Text.Substring(totstop.Text.Length-1,1));
            else
                tstop = Convert.ToInt32(totstop.Text.Substring(0,1));
            }
            else
                tstop = Convert.ToInt32(totstop.Text.Substring(0,1));
            string[] empids;
            empids = lblAssignEmpID.Text.Split(',');
            for (int len = 0; len < empids.Length; len++)
            {
                //tms.AddEmpToRoute(Convert.ToInt32(empids[len].ToString()), tstop + 1, rid, 1, 0);
                var result = tms.AddEmpToRoute(Convert.ToInt32(empids[len].ToString()), tstop + 1, rid, 1, 1, MyApplicationSession._UserID);

                tstop = tstop + 1;
            }
            MultiView2.ActiveViewIndex = -1;
            BndGridAddData();
            BndGridDeleteData();
            MultiView1.ActiveViewIndex = 0;
            lblAssignEmpID.Text = string.Empty;
        }
        catch (Exception ex)
        {
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }
    protected void btnClose_Click(object sender, ImageClickEventArgs e)
    {
        MultiView2.ActiveViewIndex = -1;
        BndGridAddData();
        BndGridDeleteData();
    }
    protected void ibaligndata_Click(object sender, EventArgs e)
    {
        string EmpIdList = string.Empty;
        int c=0;
        foreach (GridViewRow i in gvAddData.Rows)
        {
            CheckBox cbl = (CheckBox)i.FindControl("chkTrack");
            if (cbl.Checked == true)
            {
                EmpIdList = EmpIdList + gvAddData.DataKeys[i.RowIndex].Values[0].ToString() + ",";
            }
        }
        for (int i = 0; i < lstShift.Items.Count; i++)
        {
            if (lstShift.Items[i].Selected == true)
                c = c + 1;

        }
        if (c > 1)
        {
            ShowMessage("Please select a single shift, to align in existing routes");
            BndGridAddData();
            BndGridDeleteData();
            MultiView1.ActiveViewIndex = 0;
        }
        else
        if (EmpIdList != string.Empty)
        {
            EmpIdList = EmpIdList.Remove(EmpIdList.Length - 1, 1);
            lblAssignEmpID.Text = EmpIdList;
            BndMainGrid();

        }
        else
        {
            ShowMessage("Select atleast one employee to align into the route!");
            BndGridAddData();
            BndGridDeleteData();
            MultiView1.ActiveViewIndex = 0;
        }
    }

    private void BndMainGrid()
    {
        //grdRoutes.DataSource = tms.GetRoutes(txtStartDate.Text, txtStartDate.Text, ddlfacility.SelectedValue, rdbtnlstType.SelectedValue, lstShift.SelectedValue);
        //grdRoutes.DataBind();
        //if (grdRoutes.Rows.Count > 0)
        //{
        //    MultiView3.ActiveViewIndex = 0;
        //    ModalPopupExtender1.Show();
        //}
        //else
        //{
        //    ShowMessage("No Routes in the system for given Details");
        //    BndGridAddData();
        //    BndGridDeleteData();
        //}

        grdViewRouteParent.DataSource = tms.GetRoutesByOrder(txtStartDate.Text, txtStartDate.Text, ddlfacility.SelectedValue, rdbtnlstType.SelectedValue, lstShift.SelectedValue, "Colony", "ASC",0,"");
        grdViewRouteParent.DataBind();
        if (grdViewRouteParent.Rows.Count > 0)
        {
            MultiView3.ActiveViewIndex = 0;
            ModalPopupExtender2.Show();
        }
        else
        {
            ShowMessage("No Routes in the system for given Details");
            BndGridAddData();
            BndGridDeleteData();
        }
    }


    /*-------------------------------------------------------------------------*/
    protected void ibViewRouteID_Click(object sender, ImageClickEventArgs e)
    {
        try
        {
            string RouteID = string.Empty;
            ImageButton ibViewRouteID = sender as ImageButton;
            GridViewRow row = ibViewRouteID.NamingContainer as GridViewRow;
            int rowIndex = Convert.ToInt32(row.RowIndex);
            GridView grdViewRouteChild = (GridView)grdViewRouteParent.Rows[rowIndex].FindControl("grdViewRouteChild");
            if (grdViewRouteChild.Visible == true)
            {
                ibViewRouteID.ImageUrl = "~/images/plus.gif";
                ibViewRouteID.ToolTip = "To Expand the Route Detail";
                grdViewRouteChild.Visible = false;
            }
            else
            {
                ibViewRouteID.ImageUrl = "~/images/minus.gif";
                ibViewRouteID.ToolTip = "To Collapse the Route Detail";
                RouteID = grdViewRouteParent.DataKeys[rowIndex]["RouteID"].ToString();
                grdViewRouteChild.DataSource = tms.GetRoutesDetailsnew(RouteID,1);
                grdViewRouteChild.DataBind();
                grdViewRouteChild.Visible = true;
                if (Convert.ToDateTime(txtStartDate.Text) < Convert.ToDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, MyApplicationSession.INDIAN_ZONE).Date.ToString("MM/dd/yyyy")))
                {
                    grdViewRouteChild.Enabled = false;
                }
                else
                {
                    grdViewRouteChild.Enabled = true;
                }
            }
            MultiView3.ActiveViewIndex = 0;
            MultiView1.ActiveViewIndex = -1;
            ModalPopupExtender2.Show();
        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }
    protected void grdViewRouteChild_RowDataBound(object sender, GridViewRowEventArgs e)
    {
        // Display gold color if routes been finalized and some employee added after it.
        if (e.Row.RowType == DataControlRowType.DataRow)
        {
            if (e.Row.RowIndex == 0)
                lasttriptype = Convert.ToString(DataBinder.Eval(e.Row.DataItem, "tripType"));
            if (Convert.ToString(DataBinder.Eval(e.Row.DataItem, "IsRouteFinalized")) == "True" && Convert.ToString(DataBinder.Eval(e.Row.DataItem, "IsAddedAfterFinal")) == "True")
            {
                e.Row.BackColor = System.Drawing.Color.Gold;
            }
            if (Convert.ToString(DataBinder.Eval(e.Row.DataItem, "empName")).Contains("Medical"))
            {
                e.Row.BackColor = System.Drawing.Color.Coral;
            }
            if (Convert.ToString(DataBinder.Eval(e.Row.DataItem, "tripType")).ToString() != rdbtnlstType.SelectedValue.ToString())
            //if (Convert.ToString(DataBinder.Eval(e.Row.DataItem, "tripType")).Contains("P") && rdoTripType.SelectedValue == "D")
            {
                e.Row.Enabled = false;
            }
            if (Convert.ToString(DataBinder.Eval(e.Row.DataItem, "tripType")) != lasttriptype)
            {
                foreach (TableCell cell in e.Row.Cells)
                {
                    cell.Style[HtmlTextWriterStyle.BorderStyle] = "Ridge solid solid solid";
                    cell.Style[HtmlTextWriterStyle.BorderWidth] = "4px 1px 1px 1px";
                    cell.Style[HtmlTextWriterStyle.BorderColor] = "Gray";
                }
            }
            lasttriptype = Convert.ToString(DataBinder.Eval(e.Row.DataItem, "tripType"));
        }
    }

    protected void ibUpdateStopNo_Click(object sender, ImageClickEventArgs e)
    {
        try
        {
            ImageButton ibUpdateStopNo = sender as ImageButton;
            GridView grdViewRouteChild = (GridView)ibUpdateStopNo.NamingContainer.NamingContainer;

            GridView grdViewRouteParent = (GridView)ibUpdateStopNo.NamingContainer.NamingContainer.NamingContainer.NamingContainer;
            GridViewRow grv = (GridViewRow)ibUpdateStopNo.NamingContainer.NamingContainer.NamingContainer;
            string routeID = grdViewRouteParent.DataKeys[grv.RowIndex]["RouteID"].ToString();

            //string routeID = grdViewRouteChild.DataKeys[0]["routeid"].ToString();
            DateTime strShiftdate = Convert.ToDateTime(grdViewRouteChild.DataKeys[0]["shiftdate"].ToString());

            foreach (GridViewRow i in grdViewRouteChild.Rows)
            {
                string strEmployeeID = grdViewRouteChild.DataKeys[i.RowIndex]["id"].ToString();
                string StopNo;
                Boolean isValidStopNo, isValidETAhh, isValidETAmm;
                StopNo = ((TextBox)grdViewRouteChild.Rows[i.RowIndex].FindControl("txtstopNo")).Text;
                if (ValidateNumber(StopNo))
                {
                    if (Convert.ToInt32(StopNo) > 0)
                    {
                        isValidStopNo = true;
                    }
                    else
                    {
                        isValidStopNo = false;
                    }
                }
                else
                {
                    isValidStopNo = false;
                }
                string strETAhh = ((TextBox)grdViewRouteChild.Rows[i.RowIndex].FindControl("txtETAhh")).Text;
                if (ValidateNumber(strETAhh))
                {
                    if (Convert.ToInt32(strETAhh) >= 0 && Convert.ToInt32(strETAhh) < 24)
                    {
                        isValidETAhh = true;
                    }
                    else
                    {
                        isValidETAhh = false;
                    }
                }
                else
                {
                    isValidETAhh = false;
                }
                string strETAmm = ((TextBox)grdViewRouteChild.Rows[i.RowIndex].FindControl("txtETAmm")).Text;

                if (ValidateNumber(strETAmm))
                {
                    if (Convert.ToInt32(strETAmm) >= 0 && Convert.ToInt32(strETAmm) < 60)
                    {
                        isValidETAmm = true;
                    }
                    else
                    {
                        isValidETAmm = false;
                    }
                }
                else
                {
                    isValidETAmm = false;
                }
                if (isValidStopNo == true && isValidETAhh == true && isValidETAmm == true)
                {
                    tms.UpdateRoute(routeID, strEmployeeID, strShiftdate, Convert.ToInt32(StopNo), strETAhh, strETAmm,MyApplicationSession._UserID);
                }
                else
                {
                    Label lblChildErrorMsg = (Label)grdViewRouteChild.FooterRow.FindControl("lblChildErrorMsg");
                    lblChildErrorMsg.Text = string.Empty;
                    lblChildErrorMsg.Text = "Either you entered wrong StopNo or ETA.";
                    ShowMessage("Either you entered wrong StopNo or ETA !");
                    break;
                }
            }
            grdViewRouteChild.DataSource = tms.GetRoutesDetailsnew(routeID,1);
            grdViewRouteChild.DataBind();
            MultiView3.ActiveViewIndex = 0;
            MultiView1.ActiveViewIndex = -1;
            ModalPopupExtender2.Show();
        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);
        }
    }

    protected void ImbtAddNewRoute_Click(object sender, ImageClickEventArgs e)
    {
        try
        {

            string routeid;
            ImageButton ImbtAddNewRoute = sender as ImageButton;
            GridView grdViewRouteChild = (GridView)ImbtAddNewRoute.NamingContainer.NamingContainer;
            routeid = grdViewRouteChild.DataKeys[0]["routeid"].ToString();
            if (tms.IsTripB2B(routeid).ElementAtOrDefault(0).res.ToString() == "0")
            {
                string EmpIDs = string.Empty;
                //ImageButton ImbtAddNewRoute = sender as ImageButton;
                //GridView grdViewRouteChild = (GridView)ImbtAddNewRoute.NamingContainer.NamingContainer;
                string routeID = grdViewRouteChild.DataKeys[0]["routeid"].ToString();
                foreach (GridViewRow i in grdViewRouteChild.Rows)
                {
                    CheckBox cb = (CheckBox)i.FindControl("chkBxEmployeeID");
                    if (cb != null && cb.Checked)
                    {
                        string lblEmpID = grdViewRouteChild.DataKeys[i.RowIndex]["id"].ToString();
                        EmpIDs = EmpIDs + lblEmpID.Trim() + ",";
                    }
                }

                Label lblChildErrorMsg = (Label)grdViewRouteChild.FooterRow.FindControl("lblChildErrorMsg");
                lblChildErrorMsg.Text = string.Empty;
                if (EmpIDs != string.Empty)
                {
                    EmpIDs = EmpIDs.Remove(EmpIDs.Length - 1, 1);

                    var result = tms.MakeNewRoute(routeID, EmpIDs, MyApplicationSession._UserID).ElementAtOrDefault(0).NewRouteID.ToString();

                    BndMainGrid();
                    ShowMessage("Your new routeid generated is " + result);
                }
                else
                {
                    lblChildErrorMsg.Text = "Select Atleast one employee !";
                    ShowMessage("Select atleast one employee !");
                }
            }
            else
            {
                Label lblChildErrorMsg = (Label)grdViewRouteChild.FooterRow.FindControl("lblChildErrorMsg");
                lblChildErrorMsg.Text = "New trip creation is not allowed in Back to back route";
                ShowMessage("New trip creation is not allowed in Back to back route");
            }
            MultiView3.ActiveViewIndex = -1;
            MultiView1.ActiveViewIndex = 0;
            ModalPopupExtender2.Show();

        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }

    protected void ibPasteEmployee_Click(object sender, ImageClickEventArgs e)
    {
        try
        {
            ImageButton ibPasteEmployee = sender as ImageButton;
            GridViewRow row = ibPasteEmployee.NamingContainer as GridViewRow;
            // Child row index
            int rowIndex = Convert.ToInt32(row.RowIndex);
            GridView grdViewRouteChild = (GridView)ibPasteEmployee.NamingContainer.NamingContainer;
            // to get the parent row index
            int parentRowIndex = ((GridViewRow)(grdViewRouteChild.NamingContainer)).RowIndex;
            // to get the parent routeid
            string moveToRouteID = grdViewRouteParent.DataKeys[parentRowIndex]["RouteID"].ToString();
            string moveFromRouteIDs = string.Empty;
            string empIDs = string.Empty;
            string parentGrdIndexs = string.Empty;
            foreach (GridViewRow gvr in grdViewRouteParent.Rows)
            {
                GridView grdViewRouteChildTemp = ((GridView)gvr.FindControl("grdViewRouteChild"));
                int inxParent = Convert.ToInt32(gvr.RowIndex);
                if (grdViewRouteChildTemp.Visible == true)
                {
                    foreach (GridViewRow gvrchild in grdViewRouteChildTemp.Rows)
                    {
                        CheckBox cb = (CheckBox)gvrchild.FindControl("chkBxEmployeeID");
                        if (cb.Checked == true)
                        {
                            parentGrdIndexs += inxParent + ",";
                            moveFromRouteIDs += grdViewRouteChildTemp.DataKeys[Convert.ToInt32(gvrchild.RowIndex)]["routeid"].ToString() + ",";
                            empIDs += grdViewRouteChildTemp.DataKeys[Convert.ToInt32(gvrchild.RowIndex)]["id"].ToString() + ",";
                        }
                    }
                }
            }

            if (moveFromRouteIDs != string.Empty && empIDs != string.Empty && parentGrdIndexs != string.Empty)
            {
                parentGrdIndexs = parentGrdIndexs.Remove(parentGrdIndexs.Length - 1, 1);
                moveFromRouteIDs = moveFromRouteIDs.Remove(moveFromRouteIDs.Length - 1, 1);
                empIDs = empIDs.Remove(empIDs.Length - 1, 1);
            }
            else if (lblAssignEmpID.Text != string.Empty && lblAssignEmpID.Text != "")
            {

                Label lblChildErrorMsg = (Label)grdViewRouteChild.FooterRow.FindControl("lblChildErrorMsg");
                lblChildErrorMsg.Text = string.Empty;
                lblChildErrorMsg.Text = "** Select Atleast one employee to Align ! **";
                //ShowMessage("Select Atleast one employee to Align !");
            }
            else
            {
                Label lblChildErrorMsg = (Label)grdViewRouteChild.FooterRow.FindControl("lblChildErrorMsg");
                lblChildErrorMsg.Text = string.Empty;
                lblChildErrorMsg.Text = "** Select Atleast one employee from another trip ! **";
                //ShowMessage("Select Atleast one employee from another trip !");
            }



            if (moveFromRouteIDs != string.Empty && empIDs != string.Empty && parentGrdIndexs != string.Empty)
            {
                //if (tms.UpdateCutPasteB2B(moveFromRouteIDs, empIDs, moveToRouteID, (rowIndex + 1)).ElementAtOrDefault(0).res.ToString() == "1")
                //{
                    tms.UpdateCutPaste(moveFromRouteIDs, empIDs, moveToRouteID, (rowIndex + 1),MyApplicationSession._UserID);
                    grdViewRouteChild.DataSource = tms.GetRoutesDetailsnew(moveToRouteID,1);
                    grdViewRouteChild.DataBind();

                    string[] moveFromRouteID = moveFromRouteIDs.Split(',');
                    string[] parentGrdRowIndex = parentGrdIndexs.Split(',');
                    for (int i = 0; i <= parentGrdRowIndex.Length - 1; i++)
                    {
                        GridView OldChildGridView = (GridView)grdViewRouteParent.Rows[Convert.ToInt32(parentGrdRowIndex[i])].FindControl("grdViewRouteChild");
                        OldChildGridView.DataSource = tms.GetRoutesDetailsnew(moveFromRouteID[Convert.ToInt32(i)].ToString(),1);
                        OldChildGridView.DataBind();
                    }
                //}
                //else
                //{
                //    Label lblChildErrorMsg = (Label)grdViewRouteChild.FooterRow.FindControl("lblChildErrorMsg");
                //    lblChildErrorMsg.Text = string.Empty;
                //    lblChildErrorMsg.Text = "Back to back can not be empty OR Vechiel rule overruled in back to back.";
                //    ShowMessage("Back to back can not be empty OR Vechiel rule overruled in back to back.");
                //}
            }
            else if (lblAssignEmpID.Text != string.Empty && lblAssignEmpID.Text != "")
            {

                ////////////////////////////////////////////////////
                //LinkButton btn = (LinkButton)sender;
                //GridViewRow gvr = (GridViewRow)btn.NamingContainer;
                //int rowindex = gvr.RowIndex;
                //string empid = lblAssignEmpID.Text;
                //Label routeID = (Label)grdRoutes.Rows[rowindex].FindControl("lblRouteID");
                //string rid = routeID.Text;
                int tstop;
                Label routeID = (Label)grdViewRouteParent.Rows[parentRowIndex].FindControl("lblRouteID");
                string rid = routeID.Text;
                //int tstop = Convert.ToInt32(totstop.Text);
                GridViewRow row1 = ibPasteEmployee.NamingContainer as GridViewRow;
                string stop=((TextBox) row1.FindControl("txtstopNo")).Text;
                if (stop != "")
                    tstop = (Convert.ToInt32(stop));
                else
                    tstop = (rowIndex + 1);

                string[] empids;
                empids = lblAssignEmpID.Text.Split(',');
                for (int len = 0; len < empids.Length; len++)
                {
                         //tms.AddEmpToRouteAdhoc (Convert.ToInt32(empids[len].ToString()), tstop + 1, moveToRouteID, 0,MyApplicationSession._UserID,rdbtnlstType.SelectedValue,lstShift.SelectedValue);
                    var result = tms.AddEmpToRoute(Convert.ToInt32(empids[len].ToString()), tstop + 1, moveToRouteID, 1, 0, MyApplicationSession._UserID);

                    tstop = tstop + 1;
                }
                grdViewRouteChild.DataSource = tms.GetRoutesDetailsnew(rid,1);
                grdViewRouteChild.DataBind();
                lblAssignEmpID.Text = string.Empty;
            }

            MultiView3.ActiveViewIndex = 0;
            MultiView1.ActiveViewIndex = -1;
            ModalPopupExtender2.Show();
            BndGridAddData();
            BndGridDeleteData();

        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);
        }
    }
    private bool ValidateNumber(string input)
    {
        foreach (char c in input)
        {
            if (!Char.IsNumber(c))
            {
                return false;
            }
        }
        return true;
    }



    protected void lbRouteAssignMain_Click(object sender, EventArgs e)
    {
        try
        {
            LinkButton btn = (LinkButton)sender;
            int tstop;
            GridViewRow gvr = (GridViewRow)btn.NamingContainer;
            int rowindex = gvr.RowIndex;
            string empid = lblAssignEmpID.Text;
            Label routeID = (Label)grdViewRouteParent.Rows[rowindex].FindControl("lblRouteID");
            string rid = routeID.Text;
            Label totstop = (Label)grdViewRouteParent.Rows[rowindex].FindControl("lblTotalStopMain");
            if (totstop.Text.Contains("/"))
            {
                if (rdbtnlstType.SelectedValue == "P")
                    tstop = Convert.ToInt32(totstop.Text.Substring(totstop.Text.Length - 1, 1));
                else
                    tstop = Convert.ToInt32(totstop.Text.Substring(0, 1));
            }
            else
                tstop = Convert.ToInt32(totstop.Text.Substring(0, 1));
            string[] empids;
            empids = lblAssignEmpID.Text.Split(',');
            for (int len = 0; len < empids.Length; len++)
            {
                //tms.AddEmpToRouteAdhoc (Convert.ToInt32(empids[len].ToString()), tstop + 1, rid,0,MyApplicationSession._UserID,rdbtnlstType.SelectedValue,lstShift.SelectedValue);
                var result = tms.AddEmpToRoute(Convert.ToInt32(empids[len].ToString()), tstop + 1, rid, 1, 1, MyApplicationSession._UserID);
                tstop = tstop + 1;
            }
            MultiView3.ActiveViewIndex = -1;
            BndGridAddData();
            BndGridDeleteData();
            MultiView1.ActiveViewIndex = 0;
            lblAssignEmpID.Text = string.Empty;
        }
        catch (Exception ex)
        {
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }
    protected void gvDeleteData_RowDataBound(object sender, GridViewRowEventArgs e)
    {
        //try
        //{
        //    if (e.Row.RowType == DataControlRowType.Footer)
        //    {
        //        //UpdatePanel pnl = e.Row.NamingContainer.NamingContainer as UpdatePanel;
        //        Button btn = e.Row.FindControl("btnexport1") as Button;
        //        //AsyncPostBackTrigger trigger = new AsyncPostBackTrigger();
        //        PostBackTrigger trigger = new PostBackTrigger();
        //        trigger.ControlID = btn.UniqueID;
        //        //trigger.EventName = "btnexport1_Click";
        //        this.UpdatePanel1.Triggers.Add(trigger);
        //        //pnl.Triggers.Add(trigger);
        //    }
        //}
        //catch (Exception ex)
        //{
        //    ExceptionUtility.LogException(ex, "Catch Error");
        //    throw (ex);
        //}
    }
    protected void gvAddData_RowDataBound(object sender, GridViewRowEventArgs e)
    {
       
        //if (e.Row.RowType == DataControlRowType.DataRow)
        //{
        //    if (Convert.ToDateTime(txtStartDate.Text) < Convert.ToDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, MyApplicationSession.INDIAN_ZONE).Date.ToString("MM/dd/yyyy")))
        //        e.Row.Enabled = false;
        //    else
        //        e.Row.Enabled = true;
        //    //e.Row.ForeColor = System.Drawing.Color.Black;
        //}

       
    }
    protected void grdViewRouteParent_RowDataBound(object sender, GridViewRowEventArgs e)
    {
        try
        {
            if (Convert.ToString(DataBinder.Eval(e.Row.DataItem, "tripType")).Contains("B2B"))
            {
                e.Row.CssClass = null;
                e.Row.BackColor = System.Drawing.Color.LightSalmon;

            }
        }
        catch (Exception ex)
        {
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }
    protected void btnexport1_Click(object sender, EventArgs e)
    {
        try
        {
            GridView1.DataSource = tms.GetDeleteException(Convert.ToDateTime (_ShiftDate),Convert.ToDateTime(_ShiftDate), Convert.ToInt32(_facilityid), _StrShift, _strTripType); 
            GridView1.DataBind();
            GridViewExportUtil.Export(DateTime.Now.ToString()+"_Addition_Exception.xls", GridView1);

        }

        catch (Exception ex)
        {
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }
    protected void btnexport2_Click(object sender, EventArgs e)
    {
        try
        {
            GridView2.DataSource = tms.GetAddException(Convert.ToDateTime(_ShiftDate),Convert.ToDateTime(_ShiftDate), Convert.ToInt32(_facilityid), _StrShift, _strTripType);
            GridView2.DataBind();
            GridViewExportUtil.Export(DateTime.Now.ToString() + "_Deletion_Exception.xls", GridView2);

        }

        catch (Exception ex)
        {
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }

    //private void RegisterPostBackControl()
    //{
    //    foreach (GridViewRow row in GridView1.Rows)
    //    {
    //        if (row.RowType == DataControlRowType.Footer)
    //        {


    //            Button lnkFull = row.FindControl("btnexport1") as Button;
    //            ScriptManager.GetCurrent(this).RegisterPostBackControl(lnkFull);
    //        }
    //    }
    //}


    protected void ibAutoAllocation_Click(object sender, EventArgs e)
    {
        try
        {

            string res = tms.AutoAdhocAllocation(Convert.ToDateTime(_ShiftDate), Convert.ToInt32(_facilityid), _strTripType, _StrShift, "Route").ElementAtOrDefault(0).RESULT.ToString();
            ShowMessage(res);
            BndGridAddData();
            BndGridDeleteData();

        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }
    protected void btnAllAtonce_Click(object sender, EventArgs e)
    {

        tms.CommandTimeout = 0;
        //////////////////////////Deletion/////////////////////////
        string EmpIdList = string.Empty;
        string msg = "", result = "";
        //foreach (GridViewRow i in gvDeleteData.Rows)
        //{
        //    CheckBox cbl = (CheckBox)i.FindControl("chkTrack");
        //    //if (cbl.Checked == true)
        //    {
        //        EmpIdList = EmpIdList + gvDeleteData.DataKeys[i.RowIndex].Values[0].ToString() + ",";
        //    }
        //}
        //if (EmpIdList != string.Empty)
        //{
        //    EmpIdList = EmpIdList.Remove(EmpIdList.Length - 1, 1);
            
            //tms.SprDeleteExceptionEmp(_ShiftDate, Convert.ToInt32(_facilityid), _StrShift, _strTripType, EmpIdList, MyApplicationSession._UserID);
            tms.DeleteException(Convert.ToDateTime(_ShiftDate), Convert.ToInt32(_facilityid), _StrShift, _strTripType, MyApplicationSession._UserID);
            msg="All exception employee deleted.";
        //}
        
        ////////////////////////////Auto allocation/////////////////////////
        string res = tms.AutoAdhocAllocation(Convert.ToDateTime(_ShiftDate), Convert.ToInt32(_facilityid), _strTripType, _StrShift, "Route").ElementAtOrDefault(0).RESULT.ToString();
        BndGridAddData();

        /////////////////////////////New route for pending addition//////////////////////
        string shift = string.Empty;
        EmpIdList = string.Empty;
        if (gvAddData.Rows.Count > 0)
        {
            foreach (GridViewRow i in gvAddData.Rows)
            {
                EmpIdList = EmpIdList + gvAddData.DataKeys[i.RowIndex].Values[0].ToString() + ",";
                shift = shift + ((Label)gvAddData.Rows[i.RowIndex].FindControl("lblgridShift")).Text + ",";
            }

            EmpIdList = EmpIdList.Remove(EmpIdList.Length - 1, 1);
            shift = shift.Remove(shift.Length - 1, 1);
            result = tms.MakeRouteReplicateException(Convert.ToDateTime(_ShiftDate), Convert.ToInt32(_facilityid), shift, _strTripType, EmpIdList, MyApplicationSession._UserID).ElementAtOrDefault(0).NewRouteID.ToString();
            BndGridAddData();
            BndGridDeleteData();
            ModalPopupExtender2.Hide();
            //ShowMessage("Your new routeid generated is " + result);

        }




        ShowMessage(msg + "\\n\\n" + res + "\\n\\n" + "New Route generation for unallocated Empoyees:" + "\\n" + result);
        BndGridAddData();
        BndGridDeleteData();
        if (gvAddData.Rows.Count <= 0 && gvDeleteData.Rows.Count <= 0)
            btnAllAtonce.Visible = false;
        else
            btnAllAtonce.Visible = true;
    }
}
