using System;
using System.Collections;
using System.Configuration;
using System.Data;
using System.Linq;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using System.Xml.Linq;


public partial class ReplicateRoster : basepage
{
    DataClasses1DataContext tms = new DataClasses1DataContext();
    protected void Page_Load(object sender, EventArgs e)
    {
        lblErrorFlag.Visible = false;
        CompareValidator3.ValueToCompare = DateTime.Now.ToString("MM/dd/yyyy");
        if (!IsPostBack)
        {
            BndDdl();
            txtFromDate.Text = DateTime.Now.Date.ToString("MM/dd/yyyy");
            txtToDate.Text = DateTime.Now.Date.AddDays(1).ToString("MM/dd/yyyy");
            System.Text.StringBuilder sbValid = new System.Text.StringBuilder();
            sbValid.Append("if (typeof(Page_ClientValidate) == 'function') { ");
            sbValid.Append("if (Page_ClientValidate() == false) { return false; }} ");
            sbValid.Append("this.value = 'Please wait...';");
            sbValid.Append("this.disabled = true;");
            sbValid.Append("document.all." + btnSubmit.UniqueID + ".disabled = true;");
            sbValid.Append(this.Page.GetPostBackEventReference(this.btnSubmit));
            sbValid.Append(";");
            this.btnSubmit.Attributes.Add("onclick", sbValid.ToString());
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
        if (ddlfacility.SelectedIndex != 0)
        {
            BndLstShift();

        }
    }

    public void BndLstShift()
    {

        //**********************************//
        //Bind Shift Listbox              //
        //*********************************//
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
        DateTime fromDate = Convert.ToDateTime(txtFromDate.Text);
        DateTime toDate = Convert.ToDateTime(txtToDate.Text);
        char rtype = Convert.ToChar(rdbtnlstType.SelectedValue);
        int facId = Convert.ToInt32(ddlfacility.SelectedValue.ToString());
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
        tms.CommandTimeout = 0;
        var result = tms.ReplicateRoster(fromDate, toDate, facId, strShifttimes, MyApplicationSession._UserID, rtype.ToString(),0).ElementAtOrDefault(0).result.ToString();
        //tms.DeleteException(toDate, facId, strShifttimes, rtype.ToString());
        lblErrorFlag.Text = result;
        lblErrorFlag.Visible = true;
    }
    protected void btnStats_Click(object sender, EventArgs e)
    {
        try
        {
            DateTime fromDate = Convert.ToDateTime(txtFromDate.Text);
            DateTime toDate = Convert.ToDateTime(txtToDate.Text);
            char rtype = Convert.ToChar(rdbtnlstType.SelectedValue);
            int facId = Convert.ToInt32(ddlfacility.SelectedValue.ToString());
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

            if (btnStats.Text == "Show Statistics")
            {
                dvStats.DataSource = tms.GetExceptionCount(fromDate, toDate, facId, strShifttimes, rtype.ToString());
                dvStats.DataBind();
                dvStats.Visible = true;
                btnStats.Text = "Hide Statistics";
            }
            else
            {
                dvStats.DataSource = null;
                dvStats.DataBind();
                dvStats.Visible = false;
                btnStats.Text = "Show Statistics";
            }

        }
        catch (Exception ex)
        {
            // Log the exception and notify system operators
            ExceptionUtility.LogException(ex, "Catch Error");
            throw (ex);
        }
    }
    protected void btnException_Click(object sender, EventArgs e)
    {

        String fromDate = txtFromDate.Text;
        String toDate = txtToDate.Text;
        char rtype = Convert.ToChar(rdbtnlstType.SelectedValue);
        int facId = Convert.ToInt32(ddlfacility.SelectedValue.ToString());
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
        //Server.Transfer("ReplicationException.aspx?fromDate=" + Server.HtmlEncode(fromDate) + "&toDate=" + Server.HtmlEncode(toDate) + "&facId=" + Server.HtmlEncode(facId.ToString()) + "&rtype=" + Server.HtmlEncode(rtype.ToString()) + "&strShifttimes=" + Server.HtmlEncode(strShifttimes));
        string url = "ReplicationException.aspx?fromDate=" + Server.HtmlEncode(fromDate) + "&toDate=" + Server.HtmlEncode(toDate) + "&facId=" + Server.HtmlEncode(facId.ToString()) + "&rtype=" + Server.HtmlEncode(rtype.ToString()) + "&strShifttimes=" + Server.HtmlEncode(strShifttimes);
        string jScript = "window.open('" + url + "');";
        ScriptManager.RegisterStartupScript(this, this.GetType(), "TripSheet", jScript, true);

    }
}
