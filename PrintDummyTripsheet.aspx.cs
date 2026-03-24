using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Web.SessionState;

public partial class PrintDummyTripsheet : basepage2
{
    DataClasses1DataContext tms = new DataClasses1DataContext();

    public string _RouteId
    {
        get
        {
            return (string)ViewState["_RouteId"];
        }
        set
        {
            ViewState["_RouteId"] = value;
        }
    }
    DataTable EmpDataTable = new DataTable();
    protected void Page_Load(object sender, EventArgs e)
    {
        try
        {
            Boolean IsValid = true;
            _RouteId = Request.QueryString["RouteID"];

            if (_RouteId == null)
            {
                DateTime sDate = Convert.ToDateTime(MyPageSession._sDate);
                Int32 FacilityID = MyPageSession._Facility;
                string TripType = MyPageSession._TripType;
                string Shift = MyPageSession._Shift;
                string Action = MyPageSession._Action;
                Int32 NoOfSheets = MyPageSession._NoOfSheets;
                EmpDataTable = MyPageSession._EmpDataTable;
                String SpecialID = MyPageSession._SpecialID;
                //string CabType = MyPageSession._CabType;
                string CabType = MyPageSession._CabType;
                string transid = MyPageSession._transaction;
                string EmpIDs = "";

                if (Action == "Blank")
                {
                    DataTable MyDataTable = (DataTable)MakeDataTable();
                    EmpDataTable = MyDataTable;
                    dlShowRoutes.DataSource = tms.GenerateDummySheets(sDate, FacilityID, TripType, Shift, Action, NoOfSheets, CabType, EmpIDs, MyApplicationSession._UserID, transid);
                    dlShowRoutes.DataBind();

                    if (dlShowRoutes.Items.Count > 0)
                    {
                        for (int i = 0; i < dlShowRoutes.Items.Count; i++)
                        {
                            GridView grdViewRouteDetails = (GridView)dlShowRoutes.Items[i].FindControl("grdViewRouteDetails");
                            grdViewRouteDetails.DataSource = MyDataTable;
                            grdViewRouteDetails.DataBind();
                            if (CabType == "Station")
                            {
                                grdViewRouteDetails.Columns[4].HeaderText = "Station Name";
                                grdViewRouteDetails.DataBind();
                            }
                            Panel pnl = (Panel)dlShowRoutes.Items[i].FindControl("pnlDeclare");
                            if (TripType == "P")
                                pnl.Visible = false;
                            else
                                pnl.Visible = true;
                        }
                    }
                    else
                    {
                        lblErrorMsg.Text = "Dummy sheet count reached to Maximum limit (1000) for selected date and selected facility. Try with another date or another facility.";
                    }
                }
                else if (Action == "NonBlank")
                {
                    if (EmpDataTable.Rows.Count > 0)
                    {
                        foreach (DataRow dr in EmpDataTable.Rows)
                        {
                            EmpIDs += dr["ID"].ToString() + ",";
                        }
                    }
                    EmpIDs = EmpIDs.Remove(EmpIDs.Length - 1, 1);

                    dlShowRoutes.DataSource = tms.GenerateDummySheets(sDate, FacilityID, TripType, Shift, Action, NoOfSheets, CabType, EmpIDs, MyApplicationSession._UserID, transid);
                    dlShowRoutes.DataBind();

                    for (int i = 0; i < dlShowRoutes.Items.Count; i++)
                    {
                        string RouteID = ((Label)dlShowRoutes.Items[i].FindControl("lblRouteID")).Text.ToString();
                        RouteID = RouteID.Replace("*", "");
                        GridView grdViewRouteDetails = (GridView)dlShowRoutes.Items[i].FindControl("grdViewRouteDetails");

                        grdViewRouteDetails.DataSource = tms.GetDummyRoutesDetails(RouteID);
                        grdViewRouteDetails.DataBind();

                        //----------------
                        DataTable dt = new DataTable();
                        dt.Columns.AddRange(CreateCells(grdViewRouteDetails.Columns.Count));

                        for (int j = 0; j < grdViewRouteDetails.Rows.Count; j++)
                        {

                           
                            
                            //TableCellCollection fields = e.Row.Cells;
                            DataRow dr = dt.NewRow();
                            for (int col = 0; col < grdViewRouteDetails.Columns.Count; col++)
                            {

                                dr[col] = grdViewRouteDetails.Rows[j].Cells[col].Text.Replace("&nbsp;", "");
                            }
                            dt.Rows.Add(dr);

                        }
                        for (int j = grdViewRouteDetails.Rows.Count; j < 12; j++)
                        {
                            DataRow dr = dt.NewRow();
                            dr[0] = (j + 1).ToString();
                            dt.Rows.Add(dr);
                        }
                        grdViewRouteDetails.DataSource = dt;
                        grdViewRouteDetails.DataBind();
                        //----------------
                        Panel pnl = (Panel)dlShowRoutes.Items[i].FindControl("pnlDeclare");
                        if (TripType == "P")
                            pnl.Visible = false;
                        else
                            pnl.Visible = true;
                    }
                }
                else if (Action == "Special")
                {
                    dlShowRoutes.DataSource = tms.AllocateSpecialRequest(sDate, FacilityID, MyApplicationSession._UserID, Convert.ToInt32(SpecialID));
                    dlShowRoutes.DataBind();
                    for (int i = 0; i < dlShowRoutes.Items.Count; i++)
                    {
                        string RouteID = ((Label)dlShowRoutes.Items[i].FindControl("lblRouteID")).Text.ToString();
                        RouteID = RouteID.Replace("*", "");
                        GridView grdViewRouteDetails = (GridView)dlShowRoutes.Items[i].FindControl("grdViewRouteDetails");

                        grdViewRouteDetails.DataSource = tms.GetDummyRouteDetails(RouteID);
                        grdViewRouteDetails.DataBind();

                        //----------------
                        DataTable dt = new DataTable();
                        dt.Columns.AddRange(CreateCells(grdViewRouteDetails.Columns.Count));

                        for (int j = 0; j < grdViewRouteDetails.Rows.Count; j++)
                        {
                            //TableCellCollection fields = e.Row.Cells;
                            DataRow dr = dt.NewRow();
                            for (int col = 0; col < grdViewRouteDetails.Columns.Count; col++)
                            {
                                string aa = grdViewRouteDetails.Rows[j].Cells[col].Text.ToString();
                                dr[col] = grdViewRouteDetails.Rows[j].Cells[col].Text.Replace("&nbsp;", "");
                                //string bb = grdViewRouteDetails.Rows[j].Cells[col].Text.ToString();
                                //dr[col] = grdViewRouteDetails.Rows[j].Cells[col].Text.Replace("&nbsp;", "");
                            }
                            dt.Rows.Add(dr);

                        }
                        for (int j = grdViewRouteDetails.Rows.Count; j < 12; j++)
                        {
                            DataRow dr = dt.NewRow();
                            dr[0] = (j + 1).ToString();
                            dt.Rows.Add(dr);
                        }

                        GridView1.DataSource = dt;
                        GridView1.DataBind();

                        grdViewRouteDetails.DataSource = tms.GetDummyRouteDetails(RouteID);
                        grdViewRouteDetails.DataBind();
                        //----------------
                        Panel pnl = (Panel)dlShowRoutes.Items[i].FindControl("pnlDeclare");
                        if (TripType == "P")
                            pnl.Visible = false;
                        else
                            pnl.Visible = true;
                    }
                }
            }
            else
            {
                dlShowRoutes.DataSource = tms.SelectDummyTripSheetById(_RouteId);
                dlShowRoutes.DataBind();
                for (int i = 0; i < dlShowRoutes.Items.Count; i++)
                {
                    string RouteID = ((Label)dlShowRoutes.Items[i].FindControl("lblRouteID")).Text.ToString();
                    string tripType = ((Label)dlShowRoutes.Items[i].FindControl("lblTripType")).Text.ToString(); 
                    RouteID = RouteID.Replace("*", "");
                    GridView grdViewRouteDetails = (GridView)dlShowRoutes.Items[i].FindControl("grdViewRouteDetails");

                    grdViewRouteDetails.DataSource = tms.GetDummyRoutesDetails(RouteID);
                    grdViewRouteDetails.DataBind();

                    //----------------
                    DataTable dt = new DataTable();
                    dt.Columns.AddRange(CreateCells(grdViewRouteDetails.Columns.Count));

                    for (int j = 0; j < grdViewRouteDetails.Rows.Count; j++)
                    {
                        //TableCellCollection fields = e.Row.Cells;
                        DataRow dr = dt.NewRow();
                        for (int col = 0; col < grdViewRouteDetails.Columns.Count; col++)
                        {

                            dr[col] = grdViewRouteDetails.Rows[j].Cells[col].Text.Replace("&nbsp;", "");
                        }
                        dt.Rows.Add(dr);

                    }
                    for (int j = grdViewRouteDetails.Rows.Count; j < 12; j++)
                    {
                        DataRow dr = dt.NewRow();
                        dr[0] = (j + 1).ToString();
                        dt.Rows.Add(dr);
                    }

                    grdViewRouteDetails.DataSource = dt;
                    grdViewRouteDetails.DataBind();
                    //----------------
                    Panel pnl = (Panel)dlShowRoutes.Items[i].FindControl("pnlDeclare");
                    if (tripType == "PickUP")
                        pnl.Visible = false;
                    else
                        pnl.Visible = true;
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

    private DataTable MakeDataTable()
    {
        DataTable MyDataTable = new DataTable("MyDataTable");
        DataColumn column;
        DataRow row;

        column = new DataColumn();
        column.DataType = System.Type.GetType("System.String");
        column.ColumnName = "SN";
        MyDataTable.Columns.Add(column);

        column = new DataColumn();
        column.DataType = System.Type.GetType("System.String");
        column.ColumnName = "empCode";
        MyDataTable.Columns.Add(column);

        column = new DataColumn();
        column.DataType = System.Type.GetType("System.String");
        column.ColumnName = "EmpName";
        MyDataTable.Columns.Add(column);

        column = new DataColumn();
        column.DataType = System.Type.GetType("System.String");
        column.ColumnName = "Gender";
        MyDataTable.Columns.Add(column);

        column = new DataColumn();
        column.DataType = System.Type.GetType("System.String");
        column.ColumnName = "Address";
        MyDataTable.Columns.Add(column);

        column = new DataColumn();
        column.DataType = System.Type.GetType("System.String");
        column.ColumnName = "Time";
        MyDataTable.Columns.Add(column);

        column = new DataColumn();
        column.DataType = System.Type.GetType("System.String");
        column.ColumnName = "Sign";
        MyDataTable.Columns.Add(column);

        for (int i = 0; i < 12; i++)
        {
            row = MyDataTable.NewRow();
            row["SN"] = "";
            row["empCode"] = "";
            row["EmpName"] = "";
            row["Gender"] = "";
            row["Address"] = "";
            row["Time"] = "";
            row["Sign"] = "";
            MyDataTable.Rows.Add(row);
        }
        return MyDataTable;
    }


    private DataColumn[] CreateCells(int i)
    {
        DataColumn[] cells = new DataColumn[i];
        DataColumn cell;
        cell = new DataColumn("SN");
        cells[0] = cell;
        cell = new DataColumn("empCode");
        cells[1] = cell;
        cell = new DataColumn("EmpName");
        cells[2] = cell;
        cell = new DataColumn("Gender");
        cells[3] = cell;
        cell = new DataColumn("Address");
        cells[4] = cell;
        cell = new DataColumn("Time");
        cells[5] = cell;
        cell = new DataColumn("Signature");
        cells[6] = cell;
        return cells;
    }
    protected void grdViewRouteDetails_RowDataBound(object sender, GridViewRowEventArgs e)
    {
        if (e.Row.RowType == DataControlRowType.DataRow)
        {
            foreach (DataRow dr1 in EmpDataTable.Rows)
            {
                if (dr1["empcode"].ToString() == e.Row.Cells[1].Text.ToString())
                    ((Label)e.Row.FindControl("lbltime")).Text = dr1["ETA"].ToString();
            }
            //GridViewRow dr =sender as GridViewRow;
            //DataList dl =(DataList) dr.NamingContainer.NamingContainer.NamingContainer.NamingContainer;
            //Label l=(Label) dl.FindControl("lblTripType");
            //String a= l.Text;
            
        }
    }
}
