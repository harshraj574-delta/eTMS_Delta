using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

public partial class ManageColony : basepage
{
    DataClasses1DataContext context = new DataClasses1DataContext();


    private int _PreviousID
    {
        get { return (int)ViewState["_PreviousID"]; }
        set { ViewState["_PreviousID"] = value; }
    }
    private int _LevelID
    {
        get { return (int)ViewState["_LevelID"]; }
        set { ViewState["_LevelID"] = value; }
    }
    private int _PrvPrntRowIndex
    {
        get { return (int)ViewState["_PrvPrntRowIndex"]; }
        set { ViewState["_PrvPrntRowIndex"] = value; }
    }

    private int _PrvRouteID
    {
        get { return (int)ViewState["_PrvRouteID"]; }
        set { ViewState["_PrvRouteID"] = value; }
    }

    private int _PrvRowIndex
    {
        get { return (int)ViewState["_PrvRowIndex"]; }
        set { ViewState["_PrvRowIndex"] = value; }
    }

    private int _facilityid
    {
        get
        {
            return (int)ViewState["_facilityid"];
        }
        set
        {
            ViewState["_facilityid"] = value;
        }
    }

    int Level = 0;

    protected void Page_Load(object sender, EventArgs e)
    {
        try
        {
            if (!IsPostBack)
            {
                BndFacility();
                _LevelID = 0;
                _PreviousID = -1;
                _PrvRowIndex = -1;
                _PrvRouteID = -1;
                _PrvPrntRowIndex = -1;
                _facilityid = Convert.ToInt32(ddlFacililty.SelectedValue);
                BindRouteSeq();

            }
            lblMessage.Text = "";
            lblMessage.Visible = false;
        }
        catch (Exception ex)
        {
            My_Error(ex);
        }
    }

    protected void BndFacility()
    {
        try
        {
            ddlFacililty.Items.Clear();
            ListItem lstFac = new ListItem("-Select-", "0");
            ddlFacililty.Items.Add(lstFac);
            ddlFacililty.DataSource = context.SelectFacility(MyApplicationSession._UserID);
            //ddlFacililty.DataSource = context.SelectUserLocation(MyApplicationSession._UserID, MyApplicationSession._IsSuperAdmin);
            ddlFacililty.DataTextField = "facilityName";
            ddlFacililty.DataValueField = "Id";
            ddlFacililty.DataBind();

            ddlFacililty.SelectedIndex = ddlFacililty.Items.IndexOf(ddlFacililty.Items.FindByValue(MyApplicationSession._FacilityID.ToString()));
            //_FacId = Convert.ToInt32(ddlFacililty.SelectedValue);
        }
        catch (Exception ex)
        {
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }

    protected void BindRouteSeq()
    {
        try
        {
            //if (context.GetRouteSeq(_LocationId, _LocationId).Count() == 0)
            //{
            //    lblMessage.Text = "No Data Found......";
            //    lblMessage.Visible = true;
            //}
            gvRouteSequence.DataSource = context.GetRouteSeq(_facilityid, _facilityid);
            gvRouteSequence.DataBind();
            if (gvRouteSequence.Rows.Count > 0)
            {
                foreach (GridViewRow gvMain in gvRouteSequence.Rows)
                {
                    int RouteID = Convert.ToInt32(gvRouteSequence.DataKeys[gvMain.RowIndex].Value);
                    GridView gvSub = (GridView)gvMain.FindControl("gvColony");
                    gvSub.DataSource = context.GetRouteSeqDetail(RouteID, MyApplicationSession._LocationId, _facilityid);
                    gvSub.DataBind();
                }
            }
        }
        catch (Exception ex)
        {
            My_Error(ex);
        }
    }
    protected void gvRouteSequence_RowCommand(object sender, GridViewCommandEventArgs e)
    {
        try
        {
            if (Level == 1)
            {

            }
            else
            {
                GridViewRow gvr = (GridViewRow)((ImageButton)e.CommandSource).NamingContainer;
                GridView gvSub = (GridView)gvr.FindControl("gvColony");
                ImageButton imgEx = (ImageButton)gvr.FindControl("imgbtnExpand");
                ImageButton imgCl = (ImageButton)gvr.FindControl("imgbtnClose");
                if (e.CommandName.Equals("expand"))
                {
                    imgCl.Visible = true;
                    imgEx.Visible = false;
                    gvSub.Visible = true;
                }
                else if (e.CommandName.Equals("close"))
                {
                    gvSub.Visible = false;
                    imgCl.Visible = false;
                    imgEx.Visible = true;
                }
            }

        }
        catch (Exception ex)
        {
            My_Error(ex);
        }
    }
    protected void gvColony_RowEditing(object sender, GridViewEditEventArgs e)
    {
        try
        {
            GridView gvSub = (GridView)sender;
            int RouteID = Convert.ToInt32(gvSub.DataKeys[e.NewEditIndex].Values[1].ToString());
            string City = ((Label)gvSub.Rows[e.NewEditIndex].FindControl("lblCity")).Text;
            string Zone = ((Label)gvSub.Rows[e.NewEditIndex].FindControl("lblZoneName")).Text;
            //string Bus = ((Label)gvSub.Rows[e.NewEditIndex].FindControl("lblBus")).Text;
            string Metro = ((Label)gvSub.Rows[e.NewEditIndex].FindControl("lblMetro")).Text;
            //string Toll = ((Label)gvSub.Rows[e.NewEditIndex].FindControl("lblTollName")).Text;
            gvSub.DataSource = context.GetRouteSeqDetail(RouteID, MyApplicationSession._LocationId, _facilityid);
            gvSub.EditIndex = e.NewEditIndex;
            gvSub.DataBind();
            DropDownList ddlstbxCity = (DropDownList)gvSub.Rows[e.NewEditIndex].FindControl("ddlCity");
            ddlstbxCity.DataSource = context.GetRouteSeqCity(MyApplicationSession._LocationId, _facilityid);
            ddlstbxCity.DataTextField = "City";
            ddlstbxCity.DataValueField = "City";
            ddlstbxCity.DataBind();
            ddlstbxCity.SelectedIndex = ddlstbxCity.Items.IndexOf(ddlstbxCity.Items.FindByText(City));
            DropDownList ddlstbxZone = (DropDownList)gvSub.Rows[e.NewEditIndex].FindControl("ddlZoneName");
            ddlstbxZone.DataSource = context.GetRouteSeqZone(MyApplicationSession._LocationId, _facilityid);
            ddlstbxZone.DataTextField = "zoneName";
            ddlstbxZone.DataValueField = "zoneName";
            ddlstbxZone.DataBind();
            ddlstbxZone.SelectedIndex = ddlstbxZone.Items.IndexOf(ddlstbxZone.Items.FindByText(Zone));
            DropDownList ddlMetro = (DropDownList)gvSub.Rows[e.NewEditIndex].FindControl("ddlMetro");
            ddlMetro.SelectedIndex = ddlMetro.Items.IndexOf(ddlMetro.Items.FindByText(Metro));
            //DropDownList ddlBus = (DropDownList)gvSub.Rows[e.NewEditIndex].FindControl("ddlBus");

            //DropDownList ddlTollName = (DropDownList)gvSub.Rows[e.NewEditIndex].FindControl("ddlTollName");
            //ListItem lstToll = new ListItem("Select", "0");
            //ddlTollName.Items.Clear();
            //ddlTollName.Items.Add(lstToll);
            //ddlTollName.DataSource = context.SelectTollMaster(_LocationId);
            //ddlTollName.DataTextField = "TollName";
            //ddlTollName.DataValueField = "Id";
            //ddlTollName.DataBind();

            //ddlTollName.SelectedIndex = ddlTollName.Items.IndexOf(ddlTollName.Items.FindByText(Toll));
            //ddlBus.SelectedIndex = ddlBus.Items.IndexOf(ddlBus.Items.FindByText(Bus));
            _LevelID = 1;
        }
        catch (Exception ex)
        {
            My_Error(ex);
        }
    }
    protected void gvColony_RowDeleting(object sender, GridViewDeleteEventArgs e)
    {
        try
        {
            GridView gvSub = (GridView)sender;
            int ID = Convert.ToInt32(gvSub.DataKeys[e.RowIndex].Values[0].ToString());
            context.DeleteRouteSeqColony(ID, Session["UserID"].ToString());
            int RouteID = Convert.ToInt32(gvSub.DataKeys[e.RowIndex].Values[1].ToString());
            gvSub.DataSource = context.GetRouteSeqDetail(RouteID, MyApplicationSession._LocationId, _facilityid);
            gvSub.EditIndex = -1;
            gvSub.DataBind();
        }
        catch (Exception ex)
        {
            My_Error(ex);
        }
    }

    protected void gvColony_RowCancelingEdit(object sender, GridViewCancelEditEventArgs e)
    {
        try
        {
            _LevelID = 0;
            GridView gvSub = (GridView)sender;
            int RouteID = Convert.ToInt32(gvSub.DataKeys[e.RowIndex].Values[1].ToString());
            gvSub.DataSource = context.GetRouteSeqDetail(RouteID, MyApplicationSession._LocationId, _facilityid);
            gvSub.EditIndex = -1;
            gvSub.DataBind();
        }
        catch (Exception ex)
        {
            My_Error(ex);
        }
    }
    protected void gvColony_RowCommand(object sender, GridViewCommandEventArgs e)
    {
        try
        {
            Level = 1;
            if (_LevelID != 2)
            {
                GridView gvSub = (GridView)sender;
                int rowindex = Convert.ToInt32(e.CommandArgument);
                int ID = Convert.ToInt32(gvSub.DataKeys[rowindex].Values[0].ToString());
                int RouteID = Convert.ToInt32(gvSub.DataKeys[rowindex].Values[1].ToString());
                switch (e.CommandName)
                {
                    case "Insert":
                        gvSub.DataSource = context.GetRouteSeqDetail(RouteID, MyApplicationSession._LocationId, _facilityid);
                        gvSub.EditIndex = rowindex;
                        gvSub.DataBind();
                        TextBox txtBox = (TextBox)gvSub.Rows[rowindex].FindControl("txtColony");
                        ((Label)gvSub.Rows[rowindex].FindControl("lblSeqId")).Text = "";
                        ((CheckBox)gvSub.Rows[rowindex].FindControl("chktrack")).Visible = false;
                        txtBox.Text = "";
                        txtBox.Enabled = true;
                        ((TextBox)gvSub.Rows[rowindex].FindControl("txtSubColony")).Text = "";
                        DropDownList ddlstbxCity = (DropDownList)gvSub.Rows[rowindex].FindControl("ddlCity");
                        ddlstbxCity.DataSource = context.GetRouteSeqCity(MyApplicationSession._LocationId, _facilityid);
                        ddlstbxCity.DataTextField = "City";
                        ddlstbxCity.DataValueField = "City";
                        ddlstbxCity.DataBind();
                        ddlstbxCity.SelectedIndex = 0;
                        ddlstbxCity.Enabled = true;
                        DropDownList ddlstbxZone = (DropDownList)gvSub.Rows[rowindex].FindControl("ddlZoneName");
                        ddlstbxZone.DataSource = context.GetRouteSeqZone(MyApplicationSession._LocationId, _facilityid);
                        ddlstbxZone.DataTextField = "zoneName";
                        ddlstbxZone.DataValueField = "zoneName";
                        ddlstbxZone.DataBind();
                        ddlstbxZone.SelectedIndex = 0;
                        //_LocationId = Convert.ToInt32(ddlFacililty.SelectedValue);

                        //DropDownList ddlToll = (DropDownList)gvSub.Rows[rowindex].FindControl("ddlTollName");
                        //ListItem lstToll = new ListItem("Select", "0");
                        //ddlToll.Items.Clear();
                        //ddlToll.Items.Add(lstToll);
                        //ddlToll.DataSource = context.SelectTollMaster(_LocationId);
                        //ddlToll.DataTextField = "TollName";
                        //ddlToll.DataValueField = "Id";
                        //ddlToll.DataBind();
                        //ddlToll.SelectedIndex = 0;


                        break;
                    case "Cut":
                        _PreviousID = ID;
                        if (_PrvPrntRowIndex != -1)
                        {
                            GridView prvGvSub = (GridView)gvRouteSequence.Rows[Convert.ToInt32(_PrvPrntRowIndex)].FindControl("gvColony");
                            prvGvSub.Rows[_PrvRowIndex].BackColor = System.Drawing.Color.White;
                        }
                        gvSub.Rows[rowindex].BackColor = System.Drawing.Color.OrangeRed;
                        _PrvRouteID = Convert.ToInt32(gvSub.DataKeys[rowindex]["RouteID"].ToString());
                        _PrvPrntRowIndex = ((GridViewRow)(gvSub.NamingContainer)).RowIndex;
                        _PrvRowIndex = rowindex;
                        break;
                    case "Paste":
                        context.MoveColony(_PreviousID, ID, Session["UserID"].ToString());
                        if (_PrvRowIndex != -1)
                        {
                            GridView prvGvSub = (GridView)gvRouteSequence.Rows[Convert.ToInt32(_PrvPrntRowIndex)].FindControl("gvColony");
                            prvGvSub.DataSource = context.GetRouteSeqDetail(_PrvRouteID, MyApplicationSession._LocationId, _facilityid);
                            prvGvSub.DataBind();
                        }
                        gvSub.DataSource = context.GetRouteSeqDetail(RouteID, MyApplicationSession._LocationId, _facilityid);
                        gvSub.DataBind();
                        _PreviousID = -1;
                        break;
                }
            }

        }
        catch (Exception ex)
        {
            My_Error(ex);
        }
    }
    protected void gvColony_RowUpdating(object sender, GridViewUpdateEventArgs e)
    {
        try
        {
            GridView gvSub = (GridView)sender;
            int ID = Convert.ToInt32(gvSub.DataKeys[e.RowIndex].Values[0].ToString());
            string ZoneName = ((DropDownList)gvSub.Rows[e.RowIndex].FindControl("ddlZoneName")).SelectedValue;
            Boolean Bus = false;
            //Boolean Bus = Boolean.Parse(((DropDownList)gvSub.Rows[e.RowIndex].FindControl("ddlBus")).SelectedValue);
            Boolean Metro = Boolean.Parse(((DropDownList)gvSub.Rows[e.RowIndex].FindControl("ddlMetro")).SelectedValue);
            int TravelTime = Convert.ToInt32(((TextBox)gvSub.Rows[e.RowIndex].FindControl("txtTravelTime")).Text);
            Double TravelKm = Convert.ToDouble(((TextBox)gvSub.Rows[e.RowIndex].FindControl("txtTravelKm")).Text);

            //int Toll = Convert.ToInt32(((DropDownList)gvSub.Rows[e.RowIndex].FindControl("ddlTollName")).SelectedValue);

            DropDownList ddlCity = (DropDownList)gvSub.Rows[e.RowIndex].FindControl("ddlCity");
            TextBox txtColony = (TextBox)gvSub.Rows[e.RowIndex].FindControl("txtColony");
            TextBox txtSubColony = (TextBox)gvSub.Rows[e.RowIndex].FindControl("txtSubColony");
            if (_LevelID == 1)
            {
                // Update Record 
                context.UpdateRouteSeqColony(ID, ZoneName, Bus, Metro, TravelTime, TravelKm, Session["UserID"].ToString(), _facilityid, 0, txtColony.Text, txtSubColony.Text);
            }
            else
            {
                // New Record
                context.SaveRouteSeqColony(ID, ddlCity.SelectedValue, txtColony.Text, ZoneName, Bus, Metro, TravelTime, TravelKm, Session["UserID"].ToString(), _facilityid, 0, txtSubColony.Text);
            }

            int RouteID = Convert.ToInt32(gvSub.DataKeys[e.RowIndex].Values[1].ToString());
            gvSub.DataSource = context.GetRouteSeqDetail(RouteID, MyApplicationSession._LocationId, _facilityid);
            gvSub.EditIndex = -1;
            gvSub.DataBind();
        }

        catch (Exception ex)
        {
            My_Error(ex);
        }
    }
    private void My_Error(Exception ex)
    {
        // Log the exception and notify system operators
        ExceptionUtility.LogException(ex, "Catch Error");
        throw (ex);
    }

    protected void ddlFacililty_SelectedIndexChanged(object sender, EventArgs e)
    {
        try
        {
            _PreviousID = -1;
            _PrvRowIndex = -1;
            _PrvRouteID = -1;
            _PrvPrntRowIndex = -1;
            _facilityid = Convert.ToInt32(ddlFacililty.SelectedValue);
            BindRouteSeq();
        }
        catch (Exception ex)
        {
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }
    protected void linkbtSplit_Click(object sender, EventArgs e)
    {
        try
        {
            _LevelID = 2;
            string RouteIDs = string.Empty;
            LinkButton lbtnsplit = sender as LinkButton;
            GridView grdViewRouteChild = (GridView)lbtnsplit.NamingContainer.NamingContainer;
            foreach (GridViewRow i in grdViewRouteChild.Rows)
            {
                CheckBox cb = (CheckBox)i.FindControl("chkTrack");
                if (cb != null && cb.Checked)
                {
                    string lblEmpID = grdViewRouteChild.DataKeys[i.RowIndex]["Id"].ToString();
                    RouteIDs = RouteIDs + lblEmpID.Trim() + ",";
                }
            }

            if (RouteIDs != string.Empty)
            {
                RouteIDs = RouteIDs.Remove(RouteIDs.Length - 1, 1);

                string routeno = context.SplitRouteCluster(RouteIDs, MyApplicationSession._UserID).ElementAtOrDefault(0).Routeno.ToString(); ;
                ShowMessage("New Route Created with Number " + routeno + " .");
                BindRouteSeq();

            }
            else
            {
                ShowMessage("Please select atleast one record.");
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
}