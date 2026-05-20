using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;

public partial class RptRouteDetail : basepage
{
    DataClasses1DataContext tms = new DataClasses1DataContext();
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {

            txtStartDate.Text = DateTime.Now.Date.ToString("MM/dd/yyyy");
            txtEndDate.Text = DateTime.Now.Date.ToString("MM/dd/yyyy");
            BndDdl();
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
            if (MyApplicationSession._ISAdmin == "Y")
            {
                ddlfacility.DataSource = tms.SelectAllFacility();
            }
            else
            {
                ddlfacility.DataSource = tms.SelectFacility(MyApplicationSession._UserID);
            }
            ddlfacility.DataTextField = "facilityName";
            ddlfacility.DataValueField = "Id";
            ddlfacility.DataBind();
            ddlfacility.SelectedIndex = ddlfacility.Items.IndexOf(ddlfacility.Items.FindByValue(MyApplicationSession._FacilityID.ToString()));
        }
        catch (Exception ex)
        {

            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");

            throw (ex);

        }
    }
    protected void BtnSubmit_Click(object sender, EventArgs e)
    {

        try
        {
            GridView gvemp = new GridView();
            tms.CommandTimeout = 0;
            gvemp.DataSource = tms.RptRouteDetail(Convert.ToDateTime(txtStartDate.Text), Convert.ToDateTime(txtEndDate.Text),Convert.ToInt32(ddlfacility.SelectedValue),"","");
            gvemp.DataBind();
            GridViewExportUtil.Export("DateWiseRouteDetail.xls", gvemp);            
        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);

        }
    }

}

