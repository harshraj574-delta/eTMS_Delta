using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.IO;
using System.Text.RegularExpressions;


public partial class FemaleTrack : basepage
{
    DataClasses1DataContext tms = new DataClasses1DataContext();
    string strShifttimes = string.Empty;
    public string _facilityid
    {
        get
        {
            return (string)ViewState["_facilityid"];
        }

        set
        {
            ViewState["_facilityid"] = value;
        }
    }
    public string _ShiftDate
    {
        get
        {
            return (string)ViewState["_ShiftDate"];
        }

        set
        {
            ViewState["_ShiftDate"] = value;
        }
    }
    public string _StrShift
    {
        get
        {
            return (string)ViewState["_StrShift"];
        }

        set
        {
            ViewState["_StrShift"] = value;
        }
    }
    public string _strTripType
    {
        get
        {
            return (string)ViewState["_strTripType"];
        }

        set
        {
            ViewState["_strTripType"] = value;
        }
    }
    protected void Page_Load(object sender, EventArgs e)
    {
        lblMsg.Visible = false;
        if (!IsPostBack)
        {
            BndDdl();
            txtStartDate.Text = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, MyApplicationSession.INDIAN_ZONE).Date.ToString("MM/dd/yyyy");
        }
    }
    protected void btnSubmit_Click(object sender, EventArgs e)
    {
        try
        {
            string sDate = txtStartDate.Text;
            int facId = Convert.ToInt32(ddlfacility.SelectedValue.ToString());

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
            _strTripType = rdoTripType.SelectedValue;

            BndGridFemaleData();

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
    public void BndDdl()
    {
        //**********************************//
        //Binds Facility Dropdown          //
        //*********************************//
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

            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }
    protected void ddlfacility_SelectedIndexChanged(object sender, EventArgs e)
    {
        lblFacError.Visible = false;
        BndLstShift();

    }
    public void BndLstShift()
    {
        //**********************************//
        //Bind Shift Listbox              //
        //*********************************//
        try
        {
            int facid = Convert.ToInt32(ddlfacility.SelectedValue.ToString());
            string type = rdoTripType.SelectedValue.ToString();
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

    public void BndGridFemaleData()
    {
        try
        {
            gvFemaleData.DataSource = tms.GetFemaleRouteData(Convert.ToDateTime(_ShiftDate), Convert.ToDateTime(_ShiftDate), Convert.ToInt32(_facilityid), _StrShift, _strTripType,0);
            gvFemaleData.DataBind();
            if (gvFemaleData.Rows.Count > 0)
            {
                lbtnPrintExcel.Visible = true;
                lbtnPrintExcel.NavigateUrl = "~/FemaleTrackExcel.aspx?Startdate=" + Server.HtmlEncode(_ShiftDate) + "&EndDate=" + Server.HtmlEncode(_ShiftDate) + "&FacilityID=" + Server.HtmlEncode(_facilityid) + "&TripType=" + Server.HtmlEncode(_strTripType) + "&Shifttimes=" + Server.HtmlEncode(_StrShift) ;

            }
            else
                lbtnPrintExcel.Visible = false;

        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);

        }
    }




    protected void gvFemaleData_RowUpdating(object sender, GridViewUpdateEventArgs e)
    {
        try
        {
            DropDownList ddlaction = (DropDownList)gvFemaleData.Rows[e.RowIndex].FindControl("ddlAction");
            if (ddlaction.SelectedValue != "0")
            {
                string ResTxtRemark = ((TextBox)gvFemaleData.Rows[e.RowIndex].FindControl("TxtRemark")).Text;
                string ResRouteid = gvFemaleData.DataKeys[e.RowIndex].Values[0].ToString();
                string ResEmpid = gvFemaleData.DataKeys[e.RowIndex].Values[1].ToString();
                tms.UpdateFemaleTrackDetail(ResRouteid, ResEmpid, 1, Server.HtmlEncode(ResTxtRemark), MyApplicationSession._UserID, ddlaction.SelectedValue,"",0);
                lblMsg.Visible = true;
                lblMsg.Text = "Record updated successfully.";
                BndGridFemaleData();
                ShowMessage("Data Sucessfully Saved.");
            }
            else
            {
                lblMsg.Text = "Select atleast one option";
                ShowMessage("Select atleast one option.");
                ddlaction.Focus();

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
    protected void gvFemaleData_PageIndexChanging(object sender, GridViewPageEventArgs e)
    {
        gvFemaleData.PageIndex = e.NewPageIndex;
        BndGridFemaleData();
    }
    protected void rdoTripType_SelectedIndexChanged(object sender, EventArgs e)
    {
        try
        {
            BndLstShift();
        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }
    //protected void lbtnPrintExcel_Click(object sender, EventArgs e)
    //{
    //    try
    //    {

    //        //GridView1.DataSource = tms.GetFemaleRouteData(Convert.ToDateTime(_ShiftDate), Convert.ToDateTime(_ShiftDate), Convert.ToInt32(_facilityid), _StrShift, _strTripType,0);
    //        // GridView1.DataBind();
    //        // GridViewExportUtil.Export("FemaleTrack.xls", GridView1);
    //        //ExportDataSetToExcel(ConvertToDataTable(), fileName);


    //        string fileName;
    //        DataTable dt = new DataTable();
           
    //        DataColumn dc = new DataColumn("Date", typeof(System.String));
    //        dt.Columns.Add(dc);
    //        dc = new DataColumn("Shift", typeof(System.String));
    //        dt.Columns.Add(dc);
    //        dc = new DataColumn("TripType", typeof(System.String));
    //        dt.Columns.Add(dc);
    //        dc = new DataColumn("TripID", typeof(System.String));
    //        dt.Columns.Add(dc);
    //        dc = new DataColumn("EmployeeID", typeof(System.String));
    //        dt.Columns.Add(dc);
    //        dc = new DataColumn("EmpName", typeof(System.String));
    //        dt.Columns.Add(dc);
    //        dc = new DataColumn("Process", typeof(System.String));
    //        dt.Columns.Add(dc);
    //        dc = new DataColumn("Location", typeof(System.String));
    //        dt.Columns.Add(dc);
    //        dc = new DataColumn("Contact", typeof(System.String));
    //        dt.Columns.Add(dc);
    //        dc = new DataColumn("Stop No", typeof(System.String));
    //        dt.Columns.Add(dc);
    //        dc = new DataColumn("ETA/ETD", typeof(System.String));
    //        dt.Columns.Add(dc);
    //        dc = new DataColumn("Driver Detail", typeof(System.String));
    //        dt.Columns.Add(dc);
    //        dc = new DataColumn("Cab Number", typeof(System.String));
    //        dt.Columns.Add(dc);
    //        dc = new DataColumn("Tracked", typeof(System.String));
    //        dt.Columns.Add(dc);
    //        dc = new DataColumn("Tracking Status", typeof(System.String));
    //        dt.Columns.Add(dc);
    //        dc = new DataColumn("Remark", typeof(System.String));
    //        dt.Columns.Add(dc);
    //        dc = new DataColumn("Updated By", typeof(System.String));
    //        dt.Columns.Add(dc);
    //        dc = new DataColumn("UpdatedOn", typeof(System.String));
    //        dt.Columns.Add(dc);
          

    //        Random r = new Random();
    //        fileName = "DropChart" + r.Next().ToString() + ".xls";
    //        var result = tms.GetFemaleRouteData(Convert.ToDateTime(_ShiftDate), Convert.ToDateTime(_ShiftDate), Convert.ToInt32(_facilityid), _StrShift, _strTripType, 0);
    //        foreach (var result1 in result)
    //        {
    //            DataRow dr = dt.NewRow();
    //            dr["Date"] = result1.shiftDate;
    //            dr["Shift"] = result1.shiftTime;
    //            dr["TripType"] = result1.tripType;
    //            dr["TripID"] = result1.Routeid;
    //            dr["EmployeeID"] = result1.employeeid;
    //            dr["EmpName"] = result1.empName;
    //            dr["Process"] = result1.processName;
    //            dr["Location"] = result1.Location;
    //            dr["Contact"] = result1.mobile;
    //            dr["Stop No"] = result1.stopNo;
    //            dr["ETA/ETD"] = result1.eta;
    //            dr["Driver Detail"] = result1.driver;
    //            dr["Cab Number"] = result1.vehicleid;
    //            dr["Tracked"] = result1.Tracked_Excel;
    //            dr["Tracking Status"] = result1.action_Excel;
    //            dr["Remark"] = result1.Remark;
    //            dr["Updated By"] = result1.UpdatedBy;
    //            dr["UpdatedOn"] = result1.UpdatedOn;
    //            dt.Rows.Add(dr);
    //        }

    //        HttpResponse response = HttpContext.Current.Response;
    //        response.Clear();
    //        response.Charset = string.Empty;
    //        response.ContentType = "application/vnd.ms-excel";
    //        response.AddHeader("Content-Disposition", "attachment;filename=\"" + fileName + "\"");
            
    //        using (StringWriter sw = new StringWriter())
    //        {
    //            using (HtmlTextWriter htw = new HtmlTextWriter(sw))
    //            {
    //                DataGrid dg = new DataGrid();
    //                dg.DataSource = dt;
    //                dg.DataBind();
    //                dg.RenderControl(htw);
    //                response.Write(sw.ToString());
    //                response.End();

    //                //if (HttpContext.Current != null)
    //                //{
    //                    //  Page page = (Page)HttpContext.Current.Handler;
    //                    //  GridView gv = ((GridView)page.FindControl("GridView1"));
    //                    //  gv.DataSource = dt;
    //                    //  gv.DataBind();
    //                    //  gv.RenderControl(htw);
    //                    //   response.Write(sw.ToString());
    //                    //  response.End();
    //                    //  GridViewExportUtil.Export(fileName, gv);
    //                //}
    //            }
    //        }

    //    }
    //    catch (Exception ex)
    //    {
    //        // Log the exception and notify system operators
    //        ExceptionUtility.LogException(ex, "Catch Error");

    //        throw (ex);
    //    }
    //}
    protected void gvFemaleData_RowDataBound(object sender, GridViewRowEventArgs e)
    {



        if (e.Row.RowType == DataControlRowType.DataRow)
        {
            DropDownList ddlAction = (DropDownList)e.Row.FindControl("ddlAction");
            if (ddlAction != null)
            {
                ddlAction.Items.Clear();
                ddlAction.Items.Add(new ListItem("-Select-", "0"));
                if (_strTripType == "P")
                    ddlAction.Items.Add(new ListItem("Pickup Confirmed", "B"));
                else
                    ddlAction.Items.Add(new ListItem("Drop Confirmed", "B"));
                ddlAction.Items.Add(new ListItem("No-Show", "N"));
                ddlAction.Items.Add(new ListItem("No Confirmation", "X"));
            }
            string strTrackingStatus = Convert.ToString(DataBinder.Eval(e.Row.DataItem, "TrackingStatus"));
            string strAction = Convert.ToString(DataBinder.Eval(e.Row.DataItem, "action"));
            string isAdd = Convert.ToString(DataBinder.Eval(e.Row.DataItem, "IsNewAdded"));
            Label lblaction = (Label)e.Row.FindControl("lblstatus");
            ddlAction.SelectedIndex = ddlAction.Items.IndexOf(ddlAction.Items.FindByValue(strAction.ToString()));
            
            TextBox txtRemark = (TextBox)e.Row.FindControl("txtRemark");
            Button btnSave = (Button)e.Row.FindControl("btnSave");
            if (Convert.ToString(DataBinder.Eval(e.Row.DataItem, "Tracked")) == "1")
            {
                ddlAction.Enabled = false;
                txtRemark.Enabled = false;
                btnSave.Enabled = false;
            }
            else
            {
                ddlAction.Enabled = true;
                txtRemark.Enabled = true;
                btnSave.Enabled = true;
            }
            //18APR22 : Commented isAdd, Status was not appearing proparly
            if (strTrackingStatus == "B") //&& isAdd == "False"
            {
                lblaction.Text = "Boarded";
                lblaction.ForeColor = System.Drawing.Color.Green;
            }
            else if (strTrackingStatus == "N") // && isAdd == "False"
            {
                lblaction.Text = "NoShow";
                lblaction.ForeColor = System.Drawing.Color.Red;
            }
            else if (strTrackingStatus == "C") //&& isAdd == "False"
            {
                lblaction.Text = "Cancelled";
                lblaction.ForeColor = System.Drawing.Color.Goldenrod;
            }
            
            //else if (isAdd == "True")
            //{
            //    lblaction.Text = "UnRostered";
            //    lblaction.ForeColor = System.Drawing.Color.MediumSlateBlue;
            //}
            if (DataBinder.Eval(e.Row.DataItem, "Tracked_Excel").ToString() == "Not Tracked - Overdue")
                e.Row.BackColor = System.Drawing.Color.Tomato;

        }
    }
}
