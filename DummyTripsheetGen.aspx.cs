using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.SessionState;
using System.Data;

public partial class DummyTripsheetGen : basepage
{
    DataClasses1DataContext tms = new DataClasses1DataContext();
    public DataTable _MyDataTable
    {
        get
        {
            return (DataTable)ViewState["_MyDataTable"];
        }

        set
        {
            ViewState["_MyDataTable"] = value;
        }
    }

    public int _sno
    {
        get
        {
            return (int)ViewState["_sno"];
        }

        set
        {
            ViewState["_sno"] = value;
        }
    }

    public string _routeids
    {
        get
        {
            return (string)ViewState["_routeids"];
        }

        set
        {
            ViewState["_routeids"] = value;
        }
    }
    DataColumn column;
    DataRow row;

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            BndDdl();
            _sno = 0;
            txtStartDate.Text = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, MyApplicationSession.INDIAN_ZONE).Date.ToString("MM/dd/yyyy");
            _MyDataTable = new DataTable();
            _MyDataTable = (DataTable)MakeDataTableColumn();
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
            ListItem lifac = new ListItem("-Select-", "0");
            ddlfacility.Items.Add(lifac);
            ddlfacility.DataSource = tms.SelectFacility(MyApplicationSession._UserID);
            ddlfacility.DataTextField = "facilityName";
            ddlfacility.DataValueField = "Id";
            ddlfacility.DataBind();

            ddlcabtype.Items.Clear();
            ddlcabtype.DataSource = tms.GetDummyCabTypeData(MyApplicationSession._FacilityID);
            ddlcabtype.DataTextField = "CabType";
            ddlcabtype.DataValueField = "CabType";
            ddlcabtype.DataBind();
            ddlcabtype.SelectedIndex = ddlcabtype.Items.IndexOf(ddlcabtype.Items.FindByText("Blank"));
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
            string i="0";
            int facid = Convert.ToInt32(ddlfacility.SelectedValue.ToString());
            string type = rdbtnlstType.SelectedValue.ToString();
            lstShift.Items.Clear();
            ListItem list = new ListItem("-Select-", "0");
            lstShift.Items.Add(list);
            ListItem list1 = new ListItem("Blank", "");
            lstShift.Items.Add(list1);
            string wkday=Convert.ToDateTime(txtStartDate.Text).DayOfWeek.ToString();
            //lstShift.DataSource = tms.GetShiftByFacilityType(facid, type);
            if(wkday.ToUpper()=="SUNDAY" || wkday.ToUpper()=="SATURDAY")
                i="1";
            else
                i="0";
            lstShift.DataSource = tms.GetDummyShiftsbyDays(facid, type, "0", -1);
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

    protected void rdbtnlstType_SelectedIndexChanged(object sender, EventArgs e)
    {
        try
        {
            if (ddlfacility.SelectedIndex != 0)
            {

                BndLstShift();
                lblFacError.Visible = false;
            }
            else
            {

                lblFacError.Visible = true;

            }
        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);
        }
    }
    protected void btnSubmit_Click(object sender, EventArgs e)
    {
        try
        {
            switch (rbtnSearchType.SelectedItem.Value)
            {
                case "Blank":
                    //EncryptQueryString ObjEQT = new EncryptQueryString();
                    MyPageSession._sDate = txtStartDate.Text;
                    MyPageSession._Facility = Convert.ToInt32(ddlfacility.SelectedValue);
                    MyPageSession._TripType = rdbtnlstType.SelectedValue;
                    MyPageSession._Shift = lstShift.SelectedValue;
                    MyPageSession._NoOfSheets = Convert.ToInt32(txtNoOfSheets.Text);
                    MyPageSession._Action = rbtnSearchType.SelectedValue;
                    MyPageSession._CabType = ddlcabtype.SelectedValue;
                    string transid = tms.getTransactionId().ElementAtOrDefault(0).transid.ToString();
                    MyPageSession._transaction = transid;
                    Type cstype = this.GetType();
                    ClientScriptManager cs = Page.ClientScript;
                    //var url = "PrintDummyTripsheet.aspx?sDate=" + txtStartDate.Text + "&Facility=" + ddlfacility.SelectedValue + "&TripType=" + rdbtnlstType.SelectedValue + "&Shift=" + lstShift.SelectedValue + "&Action=" + rbtnSearchType.SelectedValue;
                    HttpSessionState ss = HttpContext.Current.Session;
                    //cs.RegisterStartupScript(cstype, "dateSrpt", "<script>window.open('PrintDummyTripsheet.aspx?sDate=" + Server.HtmlEncode(txtStartDate.Text) + "&Facility=" + Server.HtmlEncode(ddlfacility.SelectedValue) + "&TripType=" + Server.HtmlEncode(rdbtnlstType.SelectedValue.Trim()) + "&Shift=" + Server.HtmlEncode(lstShift.SelectedValue.Trim()) + "&Action=" + Server.HtmlEncode(rbtnSearchType.SelectedValue.Trim()) + "&NoOfSheets=" + Server.HtmlEncode(txtNoOfSheets.Text.Trim()) + "&SessionState=" + Server.HtmlEncode(ss.SessionID) + "')</script>");
                    cs.RegisterStartupScript(cstype, "dateSrpt", "<script>window.open('PrintDummyTripsheet.aspx')</script>");
                    BndDdl();
                    BndLstShift();
                    txtNoOfSheets.Text = "";
                    break;
                case "NonBlank":
                    BndEmpGrid();
                    break;
            }
            _routeids = string.Empty;
        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);
        }

    }
    protected void rbtnSearchType_SelectedIndexChanged(object sender, EventArgs e)
    {
        try
        {
            switch (rbtnSearchType.SelectedItem.Value)
            {
                case "Blank":
                    Panel1.Visible = true;
                    Panel2.Visible = false;
                    txtEmpIdName.Text = "";
                    btnSubmit.Text = "Generate";
                    BndEmpGrid();
                    BndDdl();
                    BndLstShift();
                    lblMsg.Text = "";
                    _MyDataTable = new DataTable();
                    _MyDataTable = (DataTable)MakeDataTableColumn();
                    grdShowAddedEmp.DataSource = null;
                    grdShowAddedEmp.DataBind();
                    Panel3.Visible = false;
                    break;
                case "NonBlank":
                    Panel1.Visible = false;
                    Panel2.Visible = true;
                    BndDdl();
                    BndLstShift();
                    txtNoOfSheets.Text = "";
                    btnSubmit.Text = "Search";
                    txtEmpIdName.Focus();
                    break;
            }
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
        //********************************************************************//
        //Bind the Employee grid with the with the search Criteria            //
        //********************************************************************//
        try
        {
            GvEmployee.DataSource = tms.EmpSearch(txtEmpIdName.Text, Convert.ToInt32((Session["LocationId"].ToString())), "N");
            GvEmployee.DataBind();
            if (GvEmployee.Rows.Count < 1)
            {
                lblMsg.Visible = true;
                lblMsg.Text = "No Record Found!!!";
                txtEmpIdName.Focus();
            }
            else
            {
                GvEmployee.SelectedIndex = -1;
                lblMsg.Visible = false;
                //GvEmployee.Columns[0].Visible = true;
                //GvEmployee.FooterRow.Visible = false;
                GvEmployee0.Visible = false;
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
    protected void GvEmployee_SelectedIndexChanging(object sender, GridViewSelectEventArgs e)
    {
        int empID;
        empID = Convert.ToInt32(GvEmployee.DataKeys[e.NewSelectedIndex].Value.ToString());
        Boolean IsExists = false;
        if (_MyDataTable.Rows.Count > 0)
        {
            foreach (DataRow dr in _MyDataTable.Rows)
            {
                if (empID == Convert.ToInt32(dr["ID"].ToString()))
                {
                    IsExists = true;
                    break;

                }
            }
        }
        if (!IsExists)
        {
            var result = tms.GetEmployee(empID);
            _sno = _sno + 1;
            foreach (var result1 in result)
            {
                row = _MyDataTable.NewRow();
                row["stopNo"] = _sno;
                row["ID"] = empID;
                row["empCode"] = result1.empCode;
                row["empName"] = result1.empName;
                row["Gender"] = result1.Gender;
                row["Address"] = result1.address;
                _MyDataTable.Rows.Add(row);
            }
            Panel3.Visible = true;
            grdShowAddedEmp.DataSource = _MyDataTable;
            grdShowAddedEmp.DataBind();
            txtEmpIdName.Text = "";
            BndEmpGrid();
            lblMsg.Text = "";
        }
        else
        {
            lblMsg.Visible = true;
            lblMsg.Text = "Employee already exists.";
        }
    }
    protected void GvEmployee_PageIndexChanging(object sender, GridViewPageEventArgs e)
    {
        GvEmployee.PageIndex = e.NewPageIndex;
        BndEmpGrid();
    }

    private DataTable MakeDataTableColumn()
    {
        // Create first column and add to the DataTable.
        column = new DataColumn();
        column.DataType = System.Type.GetType("System.String");
        column.ColumnName = "stopNo";
        _MyDataTable.Columns.Add(column);
        
        column = new DataColumn();
        column.DataType = System.Type.GetType("System.String");
        column.ColumnName = "ETA";
        _MyDataTable.Columns.Add(column);

        // Create second column and add to the DataTable.
        column = new DataColumn();
        column.DataType = System.Type.GetType("System.String");
        column.ColumnName = "ID";
        _MyDataTable.Columns.Add(column);

        // Create second column and add to the DataTable.
        column = new DataColumn();
        column.DataType = System.Type.GetType("System.String");
        column.ColumnName = "empCode";
        _MyDataTable.Columns.Add(column);

        // Create second column and add to the DataTable.
        column = new DataColumn();
        column.DataType = System.Type.GetType("System.String");
        column.ColumnName = "empName";
        _MyDataTable.Columns.Add(column);

        // Create second column and add to the DataTable.
        column = new DataColumn();
        column.DataType = System.Type.GetType("System.String");
        column.ColumnName = "Gender";
        _MyDataTable.Columns.Add(column);

        // Create second column and add to the DataTable.
        column = new DataColumn();
        column.DataType = System.Type.GetType("System.String");
        column.ColumnName = "Address";
        _MyDataTable.Columns.Add(column);


        return _MyDataTable;
    }

    private void ShowMessage(string message)
    {
        string jScript = "alert('" + message + "');";
        ScriptManager.RegisterStartupScript(this, this.GetType(), "updated", jScript, true);

    }

    protected void btnGenerateEmpDummy_Click(object sender, EventArgs e)
    {
        try
        {
            int? res = -1;
            tms.GetRoutesDummyMatch(_routeids, "", Convert.ToDateTime(txtStartDate.Text), lstShift.SelectedValue, rdbtnlstType.SelectedValue, Convert.ToInt32(ddlfacility.SelectedValue), ref res);

           

            if (_routeids != "" && _routeids != null && _routeids != string.Empty && res == 0)
            { ShowMessage("Entered trip details is not matching with dummy trip details."); }
            else
            {
                MyPageSession._sDate = txtStartDate.Text;
                MyPageSession._Facility = Convert.ToInt32(ddlfacility.SelectedValue);
                MyPageSession._TripType = rdbtnlstType.SelectedValue;
                MyPageSession._Shift = lstShift.SelectedValue;
                MyPageSession._Action = rbtnSearchType.SelectedValue;
                MyPageSession._EmpDataTable = _MyDataTable;
                MyPageSession._CabType = ddlcabtype.SelectedValue;
                Type cstype = this.GetType();
                ClientScriptManager cs = Page.ClientScript;
                HttpSessionState ss = HttpContext.Current.Session;
                string transid = tms.getTransactionId().ElementAtOrDefault(0).transid.ToString();
                MyPageSession._transaction = transid;
                cs.RegisterStartupScript(cstype, "dateSrpt", "<script>window.open('PrintDummyTripsheet.aspx')</script>");
                BndDdl();
                BndLstShift();
                _MyDataTable = new DataTable();
                _MyDataTable = (DataTable)MakeDataTableColumn();
                grdShowAddedEmp.DataSource = null;
                grdShowAddedEmp.DataBind();
                Panel3.Visible = false;
            }
        }
        catch (Exception ex)
        {
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }
    protected void grdShowAddedEmp_PageIndexChanging(object sender, GridViewPageEventArgs e)
    {
        grdShowAddedEmp.PageIndex = e.NewPageIndex;
        grdShowAddedEmp.DataSource = _MyDataTable;
        grdShowAddedEmp.DataBind();
    }
    protected void btnSearchR_Click(object sender, EventArgs e)
    {
        try
        {
            if (txtRouteId.Text.Length > 3)
                _routeids = txtRouteId.Text;
            else
                _routeids = GetRouteIDs();

            BndGridByRouteId();
        }
        catch (Exception ex)
        {
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }

    private string GetRouteIDs()
    {
        try
        {
            string routeno;
            int count;
            DateTime dt1 = Convert.ToDateTime("01/01/2010");
            DateTime dt2 = Convert.ToDateTime(txtStartDate.Text);

            TimeSpan ts = dt2 - dt1;
            string days = Convert.ToString(ts.Days);
            if (days.Length < 4)
            {
                days = '0' + days;
            }

            string Facility = Convert.ToString(Convert.ToInt32(ddlfacility.SelectedValue));
            if (Facility.Length < 2)
            {
                Facility = '0' + Facility;
            }

            routeno = string.Empty;
            routeno = Facility + days + "R";
            //routeno = days + "R";
            count = txtRouteId.Text.ToString().Trim().Length;
            string txtInput = txtRouteId.Text.ToString().Trim();

            // code for the split routeID
            if (txtInput.Substring((txtInput.Length - 1), 1).ToUpper() == "S")
            {
                count = count - 1;
            }
            for (int i = 1; i <= 4 - count; i++)
            {
                routeno += "0";
            }
            routeno += txtRouteId.Text.ToString();

            return routeno;
        }
        catch (Exception ex)
        {
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }

    protected void BndGridByRouteId()
    {
        try
        {
            GridView gv = new GridView();
            gv.DataSource = tms.GetEmpByRoute(_routeids);
            gv.DataBind();
            if (gv.Rows.Count > 0)
            {

                    GvEmployee0.DataSource = tms.GetEmpByRoute(_routeids);
                    GvEmployee0.DataBind();

                    if (GvEmployee0.Rows.Count < 1)
                    {
                        lblMsg.Text = "No Record Found!";
                        lblMsg.Visible = true;
                    }
                    else
                    {
                        lblMsg.Visible = false;
                        GvEmployee0.Visible = true;
                        GvEmployee.Visible = false;
                    }
                
            }

            else
            {
                lblMsg.Text = "No Record Found!";
                lblMsg.Visible = true;
            }
        }
        catch (Exception ex)
        {
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }
    protected void lkbAddEmp_Click(object sender, EventArgs e)
    {
        try
        {
            //Boolean IsExists = false;
            //if (_MyDataTable.Rows.Count > 0)
            //{
            //    IsExists = true;
            //}

            //if (!IsExists)
            //{
            //    var result = tms.GetEmpByRoute(_routeids);
            //    _sno = _sno + 1;
            //    foreach (var result1 in result)
            //    {
            //        row = _MyDataTable.NewRow();
            //        row["stopNo"] = _sno;
            //        row["ID"] = result1.employeeId;
            //        row["empCode"] = result1.empCode;
            //        row["empName"] = result1.empName;
            //        row["Gender"] = result1.Gender;
            //        row["Address"] = result1.Address;
            //        _MyDataTable.Rows.Add(row);
            //    }
            //    Panel3.Visible = true;
            //    grdShowAddedEmp.DataSource = _MyDataTable;
            //    grdShowAddedEmp.DataBind();
            //    lblMsg.Text = "";
            //}
            //else
            //{
            //    lblMsg.Visible = true;
            //    lblMsg.Text = "Route already exists.";
            //}
            string EmpIdList = string.Empty;
            int empID=0;
            foreach (GridViewRow i in GvEmployee0.Rows)
            {
                CheckBox cbl = (CheckBox)i.FindControl("chkTrack");
                if (cbl.Checked == true)
                {
                    empID = Convert.ToInt32(GvEmployee0.DataKeys[i.RowIndex].Values[0].ToString());
                    Boolean IsExists = false;
                    if (_MyDataTable.Rows.Count > 0)
                    {
                        foreach (DataRow dr in _MyDataTable.Rows)
                        {
                            if (empID == Convert.ToInt32(dr["ID"].ToString()))
                            {
                                IsExists = true;
                                break;

                            }
                        }
                    }
                    if (!IsExists)
                    {
                        var result = tms.GetEmployee(empID);
                        _sno = _sno + 1;
                        foreach (var result1 in result)
                        {
                            //String eta=((Label)GvEmployee0.Rows[i.RowIndex].FindControl("lblEmpETA")).Text.ToString();
                            row = _MyDataTable.NewRow();
                            row["stopNo"] = _sno;
                            row["ID"] = empID;
                            row["empCode"] = result1.empCode;
                            row["empName"] = result1.empName;
                            row["Gender"] = result1.Gender;
                            row["Address"] = result1.address;
                            //if (eta == null || eta == "")
                            //    row["ETA"] = "";
                            //else
                            //    row["ETA"] = Convert.ToDateTime(eta).ToString("HH:mm");
                            _MyDataTable.Rows.Add(row);
                        }
                        Panel3.Visible = true;
                        grdShowAddedEmp.DataSource = _MyDataTable;
                        grdShowAddedEmp.DataBind();
                        txtEmpIdName.Text = "";
                        BndEmpGrid();
                        lblMsg.Text = "";
                    }
                    else
                    {
                        lblMsg.Visible = true;
                        lblMsg.Text = "Some employees are already added";
                    }
                }

                if (empID==0 )
               
                {
                    lblMsg.Text="Select atleast one employee to add.";
                    lblMsg.Visible = true;
                }

            }
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
                foreach (GridViewRow i in GvEmployee0.Rows)
                {
                    CheckBox cbl = (CheckBox)i.FindControl("chkTrack");
                    if (cbl != null)
                        cbl.Checked = true;
                }
            }
            else
            {
                foreach (GridViewRow i in GvEmployee0.Rows)
                {
                    CheckBox cbl = (CheckBox)i.FindControl("chkTrack");
                    if (cbl != null)
                        cbl.Checked = false;
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
    protected void txtStartDate_TextChanged(object sender, EventArgs e)
    {
        BndLstShift();
    }
}
