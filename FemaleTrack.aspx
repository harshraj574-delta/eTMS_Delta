<%@ Page Title="Tracking for lady employees" Language="C#" MasterPageFile="~/etmsmaster.Master" AutoEventWireup="true"
    CodeFile="FemaleTrack.aspx.cs" Inherits="FemaleTrack" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="Server">
    <link href="StyleSheets/TMS.css" rel="stylesheet" type="text/css" />
    <link href="StyleSheets/GridView.css" rel="stylesheet" type="text/css" />
    <link href="StyleSheets/SoftGreyGridView.css" rel="stylesheet" type="text/css" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="Server">
    <table align="center" width="100%">
        <tr>
            <td align="center">
                <asp:ValidationSummary ID="ValidationSummary1" runat="server" ShowMessageBox="True"
                    ShowSummary="False" ValidationGroup="save" />
            </td>
        </tr>
        <tr>
            <td align="center">
                <asp:Label ID="lblErrorMsg" runat="server" CssClass="error" Visible="False"></asp:Label>
            </td>
        </tr>
        <tr>
            <td align="center"><strong>Track Female Employees
            </strong>
            </td>
        </tr>
        <tr>
            <td align="center">Allow to Track First Pickup or Last Drop Female Employees
            </td>
        </tr>
        <tr>
            <td align="left">
                <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                    <ContentTemplate>
                        <table border="0" cellpadding="3" cellspacing="3" align="left" width="100%">
                            <tr>
                                <td align="left" valign="middle" colspan="3">
                                    <table border="0" cellpadding="4" cellspacing="0" align="center" width="50%"
                                        class="GridView">
                                        <tr>
                                            <td align="center" class="TDbg" colspan="5">Fill The Selection Criteria
                                                <asp:Label ID="lblFacError" runat="server" CssClass="error" Text="Select Facility"
                                                    Visible="False"></asp:Label>
                                                &nbsp; &nbsp; &nbsp;
                                            </td>
                                        </tr>
                                        <tr align="center">
                                            <td align="left" valign="top">
                                                <b>Shift Date:</b>
                                            </td>
                                            <td align="left" valign="top">
                                                <b>Facility Name: </b>
                                            </td>
                                            <td align="left" rowspan="2" valign="middle">
                                                <asp:RadioButtonList ID="rdoTripType" runat="server" RepeatColumns="3"
                                                    RepeatDirection="Horizontal"
                                                    OnSelectedIndexChanged="rdoTripType_SelectedIndexChanged" AutoPostBack="True">
                                                    <asp:ListItem Selected="True" Value="P">Pick</asp:ListItem>
                                                    <asp:ListItem Value="D">Drop</asp:ListItem>
                                                </asp:RadioButtonList>
                                            </td>
                                            <td align="left" valign="top">
                                                <b>Shift:</b><br />
                                                <em>ctrl-click for multi - select</em>
                                            </td>
                                            <td align="left" rowspan="2" valign="middle">
                                                <asp:Button ID="btnSubmit" runat="server" Text="Submit" ValidationGroup="Submit"
                                                    OnClick="btnSubmit_Click" CssClass="Button" />
                                            </td>
                                        </tr>
                                        <tr align="center">
                                            <td align="left" valign="top">
                                                <asp:TextBox ID="txtStartDate" runat="server" CssClass="TextBox"></asp:TextBox>
                                                <cc1:CalendarExtender ID="txtStartDate_CalendarExtender" runat="server" Enabled="true"
                                                    TargetControlID="txtStartDate" PopupButtonID="ibcal1">
                                                </cc1:CalendarExtender>
                                                &nbsp;<asp:ImageButton ID="ibcal1" runat="server" ImageUrl="~/images/calendar_icon.gif"
                                                    Height="17px" /><br />
                                                <i>(mm/dd/yyyy)</i>
                                                <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="txtStartDate"
                                                    Display="Dynamic" ErrorMessage="Enter Valid Start Date" ValidationExpression="^(([0]?[1-9]|1[0-2])/([0-2]?[0-9]|3[0-1])/[1-2]\d{3})? ?((([0-1]?\d)|(2[0-3])):[0-5]\d)?(:[0-5]\d)?$"
                                                    ValidationGroup="Submit">*</asp:RegularExpressionValidator>
                                                <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ErrorMessage="Enter Start Date"
                                                    ControlToValidate="txtStartDate" ValidationGroup="Submit">*</asp:RequiredFieldValidator>
                                            </td>
                                            <td align="left" valign="top">
                                                <asp:DropDownList ID="ddlfacility" runat="server" AppendDataBoundItems="True"
                                                    OnSelectedIndexChanged="ddlfacility_SelectedIndexChanged"
                                                    CssClass="DropDownListBox3" AutoPostBack="True">
                                                </asp:DropDownList>
                                                <asp:CompareValidator ID="CompareValidator1" runat="server" ControlToValidate="ddlFacility"
                                                    Display="Dynamic" ErrorMessage="Select Facility" Operator="NotEqual" ValidationGroup="Submit"
                                                    ValueToCompare="0">*</asp:CompareValidator>
                                            </td>
                                            <td align="left" valign="top">
                                                <asp:ListBox ID="lstShift" runat="server" SelectionMode="Multiple" AppendDataBoundItems="True">
                                                    <asp:ListItem Selected="True" Value="0" Text="-Select Shift-"></asp:ListItem>
                                                </asp:ListBox>
                                                <asp:CompareValidator ID="CompareValidator2" runat="server" ControlToValidate="lstShift"
                                                    ErrorMessage="Select Shift Time" Operator="NotEqual" ValidationGroup="Submit"
                                                    ValueToCompare="0">*</asp:CompareValidator>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td align="left" width="33%">
                                    <asp:Label ID="lblMsg" runat="server" ForeColor="Red" Visible="False"></asp:Label>
                                </td>
                                <td align="center" width="33%">
                                    <asp:UpdateProgress ID="UpdateProgress1" runat="server" AssociatedUpdatePanelID="UpdatePanel1"
                                        DisplayAfter="0" DynamicLayout="False">
                                        <ProgressTemplate>
                                            <table align="center">
                                                <tr>
                                                    <td>
                                                        <img src="images/ajax-loader.gif" style="width: 16px; height: 16px" alt="Loading" />
                                                    </td>
                                                    <td class="main_bg" align="left">Loading.....Please Wait!!!&nbsp;
                                                    </td>
                                                </tr>
                                            </table>
                                        </ProgressTemplate>
                                    </asp:UpdateProgress>
                                </td>
                                <td align="right">
                                    <asp:LinkButton ID="lbtnPrintExcel1" runat="server" Visible="False">Export to Excel</asp:LinkButton>
                                    <br />
                                    <asp:HyperLink ID="lbtnPrintExcel" runat="server" CssClass="linkButton" Target="new" Visible="False">Export to Excel</asp:HyperLink>
                                </td>
                            </tr>
                            <tr>
                                <td colspan="3">
                                    <asp:GridView ID="gvFemaleData" runat="server" AllowSorting="True" AutoGenerateColumns="False"
                                        Width="100%" CellPadding="5" EmptyDataText="No Record Found!" DataKeyNames="Routeid,id"
                                        OnRowUpdating="gvFemaleData_RowUpdating" OnPageIndexChanging="gvFemaleData_PageIndexChanging"
                                        OnRowDataBound="gvFemaleData_RowDataBound" CaptionAlign="Bottom" CssClass="GridView"
                                        BackColor="White" BorderColor="#999999" BorderStyle="None" BorderWidth="1px">
                                        <Columns>
                                            <asp:BoundField DataField="employeeID" HeaderText="Employee ID">
                                                <ControlStyle Width="2%" />
                                                <ItemStyle HorizontalAlign="Left" Width="2%" />
                                            </asp:BoundField>
                                            <asp:BoundField DataField="EmpName" HeaderText="Employee Name">
                                                <ItemStyle HorizontalAlign="Left" />
                                            </asp:BoundField>
                                            <asp:BoundField DataField="mobile" HeaderText="Phone Number">
                                                <ItemStyle HorizontalAlign="Left" />
                                            </asp:BoundField>
                                            <asp:BoundField DataField="Shifttime" HeaderText="Shift Time">
                                                <ControlStyle Width="2%" />
                                                <ItemStyle HorizontalAlign="Center" Width="2%" />
                                            </asp:BoundField>
                                            <asp:BoundField DataField="RouteID" HeaderText="Route No">
                                                <ItemStyle HorizontalAlign="Left" />
                                            </asp:BoundField>
                                            <asp:BoundField DataField="vehicleID" HeaderText="Vehicle Reg. No.">
                                                <ItemStyle HorizontalAlign="Center" />
                                            </asp:BoundField>
                                              <asp:BoundField DataField="travelkm" HeaderText="Dist">
                                                <ItemStyle HorizontalAlign="Center" Width="1%" />
                                            </asp:BoundField>
                                            <asp:BoundField DataField="stopno" HeaderText="Stop No">
                                                <ControlStyle Width="2%" />
                                                <ItemStyle HorizontalAlign="Center" Width="2%" />
                                            </asp:BoundField>
                                            <asp:BoundField DataField="ETA" HeaderText="ETA" DataFormatString="{0:g}">
                                                <ItemStyle HorizontalAlign="Left" />
                                            </asp:BoundField>
                                            <asp:BoundField DataField="Location" HeaderText="Location">
                                                <ItemStyle HorizontalAlign="Left" />
                                            </asp:BoundField>
                                            <asp:TemplateField HeaderText="Helpdesk Status">
                                                <ItemTemplate>
                                                    <asp:Label ID="lblstatus" runat="server" Font-Bold="True"></asp:Label>
                                                </ItemTemplate>
                                            </asp:TemplateField>
                                            <asp:TemplateField HeaderText="Tracking">
                                                <ItemTemplate>
                                                    <asp:DropDownList ID="ddlAction" runat="server" AppendDataBoundItems="True" Font-Bold="False"
                                                        Font-Size="Medium">
                                                        <asp:ListItem Value="0">-Select-</asp:ListItem>
                                                        <asp:ListItem Value="B">Boarded</asp:ListItem>
                                                        <asp:ListItem Value="N">No-Show</asp:ListItem>
                                                        <asp:ListItem Value="C">Cancelled</asp:ListItem>
                                                        <asp:ListItem Value="X">No Confirmation</asp:ListItem>
                                                    </asp:DropDownList>
                                                </ItemTemplate>
                                                <ItemStyle HorizontalAlign="Center" />
                                            </asp:TemplateField>
                                            <asp:TemplateField HeaderText="Remark">
                                                <ItemTemplate>
                                                    <asp:TextBox ID="txtRemark" runat="server" MaxLength="500" Text='<%# Eval("Remark") %>'
                                                        Width="100px"></asp:TextBox>
                                                    <asp:RegularExpressionValidator ID="RegExpAlphanum" runat="server" ControlToValidate="txtRemark"
                                                        Display="Dynamic" ErrorMessage="Remark Should be Alphanumeric." Text="*" ValidationExpression="^([\w\-,.:]|\s)*$"
                                                        ValidationGroup="save"></asp:RegularExpressionValidator>
                                                </ItemTemplate>
                                                <ItemStyle HorizontalAlign="Left" />
                                            </asp:TemplateField>
                                            <asp:TemplateField HeaderText="Save">
                                                <ItemTemplate>
                                                    <asp:Button ID="btnSave" runat="server" CommandName="Update" Text=" Save " ValidationGroup="save"
                                                        CssClass="Button" />
                                                </ItemTemplate>
                                                <ItemStyle HorizontalAlign="Center" />
                                            </asp:TemplateField>
                                        </Columns>
                                        <FooterStyle BackColor="#CCCCCC" ForeColor="Black" />
                                        <PagerStyle BackColor="#999999" ForeColor="Black" HorizontalAlign="Center" />
                                        <SelectedRowStyle BackColor="#008A8C" Font-Bold="True" ForeColor="White" />
                                        <HeaderStyle BackColor="#003366" Font-Bold="True" ForeColor="White" HorizontalAlign="Center"
                                            VerticalAlign="Middle" />
                                        <AlternatingRowStyle BackColor="#DCDCDC" />
                                        <RowStyle BackColor="#EEEEEE" ForeColor="Black" />
                                        <EmptyDataRowStyle ForeColor="Red" Font-Bold="true" />
                                    </asp:GridView>
                            </tr>
                            <tr>
                                <td colspan="3"></td>
                            </tr>
                        </table>
                    </ContentTemplate>
                   <%-- <Triggers>
                        <asp:PostBackTrigger ControlID="lbtnPrintExcel" />
                    </Triggers>--%>
                </asp:UpdatePanel>
            </td>
        </tr>
        <tr>
            <td align="center">
                <asp:GridView ID="GridView1"  runat="server" AutoGenerateColumns="False" Visible="False">
                    <Columns>
                        <asp:BoundField DataField="Shiftdate" HeaderText="Date" />
                        <asp:BoundField DataField="Shifttime" HeaderText="Shift" />
                        <asp:BoundField DataField="TripType" HeaderText="Pick/Drop" />
                        <asp:BoundField DataField="Routeid" HeaderText="Trip ID" />
                        <asp:BoundField DataField="employeeid" HeaderText="Employee ID" />
                        <asp:BoundField DataField="Empname" HeaderText="Emp Name" />
                        <asp:BoundField DataField="Processname" HeaderText="Process" />
                        <asp:BoundField DataField="Location" HeaderText="Location" />
                        <asp:BoundField DataField="mobile" HeaderText="Contact" />
                        <asp:BoundField DataField="StopNo" HeaderText="Stop No" />
                        <asp:BoundField DataField="ETA" HeaderText="ETA/ETD" />
                        <asp:BoundField DataField="Driver" HeaderText="Driver Detail" />
                        <asp:BoundField DataField="VehicleID" HeaderText="Cab Number" />
                        <asp:BoundField DataField="Tracked_excel" HeaderText="Tracked" />
                        <asp:BoundField DataField="action_excel" HeaderText="Tracking Status" />
                        <asp:BoundField DataField="Remark" HeaderText="Remark" />
                        <asp:BoundField DataField="UpdatedBy" HeaderText="Updated By" />
                        <asp:BoundField DataField="UpdatedOn" HeaderText="UpdatedOn" />
                    </Columns>
                </asp:GridView>
            </td>
        </tr>
    </table>
</asp:Content>
