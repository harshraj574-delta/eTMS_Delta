<%@ Page Title="" Language="C#" MasterPageFile="~/eTMSMaster.Master" AutoEventWireup="true"
    CodeFile="RptRouteDetail.aspx.cs" Inherits="RptRouteDetail" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="Server">
    <link href="StyleSheets/TMS.css" rel="stylesheet" type="text/css" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="Server">
    <table align="center" width="70%">
        <tr>
            <td>
                <asp:Label ID="lblErrorMsg" runat="server" CssClass="error" Visible="False"></asp:Label>
            </td>
        </tr>
        <tr>
            <td>
                &nbsp;&nbsp;
                <asp:ValidationSummary ID="ValidationSummary1" runat="server" 
                    ShowMessageBox="True" ShowSummary="False" ValidationGroup="order" />
            </td>
        </tr>
        <tr>
            <td class="heading">
                Export Route Information to Excel File
            </td>
        </tr>
        <tr>
            <td align="center">
                <asp:Label ID="Label2" runat="server" Font-Bold="False" Font-Overline="False" Text="Export route details in excel file,for facility of current user."
                    CssClass="subHeading"></asp:Label>
            </td>
        </tr>
        <tr>
            <td>
                <table align="center" width="100%">
                    <tr>
                        <td>
                            &nbsp;
                        </td>
                    </tr>
                    <tr>
                        <td align="left" width="30%">
                            <b>Start Date :</b>
                            <asp:TextBox ID="txtStartDate" runat="server" CssClass="TextBox"></asp:TextBox>
                            <cc1:CalendarExtender ID="txtStartDate_CalendarExtender" runat="server" Enabled="True"
                                TargetControlID="txtStartDate" PopupButtonID="ibcal1">
                            </cc1:CalendarExtender>
                            <asp:ImageButton ID="ibcal1" runat="server" ImageUrl="~/images/calendar_icon.gif"
                                Height="17px" />
                            &nbsp;<asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="txtStartDate"
                                Display="Dynamic" ErrorMessage="Start Date Required" ValidationGroup="order"
                                SetFocusOnError="True">*</asp:RequiredFieldValidator>
                            <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="txtStartDate"
                                Display="Dynamic" ErrorMessage="Date Format:mm/dd/yyyy" ValidationExpression="^(([0]?[1-9]|1[0-2])/([0-2]?[0-9]|3[0-1])/[1-2]\d{3})? ?((([0-1]?\d)|(2[0-3])):[0-5]\d)?(:[0-5]\d)?$"
                                ValidationGroup="order" SetFocusOnError="True">*</asp:RegularExpressionValidator>
                        </td>
                        <td align="left" width="30%">
                            <b>End Date :</b>
                            <asp:TextBox ID="txtEndDate" runat="server" CssClass="TextBox"></asp:TextBox>
                            <cc1:CalendarExtender ID="CalendarExtender1" runat="server" Enabled="True" TargetControlID="txtEndDate"
                                PopupButtonID="ibcal2">
                            </cc1:CalendarExtender>
                            <asp:ImageButton ID="ibcal2" runat="server" ImageUrl="~/images/calendar_icon.gif"
                                Height="17px" />
                            &nbsp;<asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="txtEndDate"
                                Display="Dynamic" ErrorMessage="End Date Required" ValidationGroup="order" SetFocusOnError="True">*</asp:RequiredFieldValidator>
                            <asp:RegularExpressionValidator ID="RegularExpressionValidator2" runat="server" ControlToValidate="txtEndDate"
                                Display="Dynamic" ErrorMessage="Date Format:mm/dd/yyyy" ValidationExpression="^(([0]?[1-9]|1[0-2])/([0-2]?[0-9]|3[0-1])/[1-2]\d{3})? ?((([0-1]?\d)|(2[0-3])):[0-5]\d)?(:[0-5]\d)?$"
                                ValidationGroup="order" SetFocusOnError="True">*</asp:RegularExpressionValidator>
                        </td>
                        <td width="30%" align="left">
                            <b>Facility : </b>
                            <asp:DropDownList ID="ddlfacility" runat="server" AppendDataBoundItems="True" CssClass="DropDownListBox3">
                                <asp:ListItem Selected="True" Value="0">- Select Facility -</asp:ListItem>
                            </asp:DropDownList>
                            <asp:CompareValidator ID="CompareValidator1" runat="server" ControlToValidate="ddlfacility"
                                ErrorMessage="Select Facility." Operator="NotEqual" ValueToCompare="0" ValidationGroup="order"
                                SetFocusOnError="True">*</asp:CompareValidator>
                        </td>
                        <td align="left" width="10%">
                            &nbsp;&nbsp;&nbsp;&nbsp;
                            <asp:Button ID="BtnSubmit" runat="server" OnClick="BtnSubmit_Click" Text="Export"
                                CssClass="Button" ValidationGroup="order" />
                        </td>
                    </tr>
                    <tr>
                        <td align="right">
                            &nbsp;
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</asp:Content>
