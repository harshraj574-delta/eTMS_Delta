<%@ Page Language="C#" MasterPageFile="~/eTMSMaster.Master" AutoEventWireup="true"
    CodeFile="ReplicateRoster.aspx.cs" Inherits="ReplicateRoster" Title="Replicate Roster" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="Server">
    <link href="StyleSheets/GridView.css" rel="stylesheet" type="text/css" />
    <link href="StyleSheets/TMS.css" rel="stylesheet" type="text/css" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="Server">
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>
            <table align="center" width="50%">
                <tr>
                    <td align="center">
                        <asp:ValidationSummary ID="ValidationSummary1" runat="server" ShowMessageBox="True"
                            ShowSummary="False" ValidationGroup="order" />
                    </td>
                </tr>
                <tr>
                    <td align="center">
                        <asp:Label ID="lblErrorMsg" runat="server" CssClass="error" Visible="False"></asp:Label>
                    </td>
                </tr>
                <tr>
                    <td align="center">
                        <img alt="Replicate Routes" src="images/Replicate.jpg" style="height: 43px; width: 57px" />
                    </td>
                </tr>
                <tr>
                    <td class="heading">
                        Day Wise Route Replication
                    </td>
                </tr>
                <tr>
                    <td align="center">
                        <asp:Label ID="Label2" runat="server" Font-Bold="False" Font-Overline="False" Text="Allows to replicate routes from one day to another day."
                            CssClass="subHeading"></asp:Label>
                    </td>
                </tr>
                <tr>
                    <td>
                        <asp:UpdateProgress ID="UpdateProgress1" DynamicLayout="false" runat="server" AssociatedUpdatePanelID="UpdatePanel1"
                            DisplayAfter="0">
                            <ProgressTemplate>
                                <table align="center">
                                    <tr>
                                        <td>
                                            <img src="images/ajax-loader.gif" style="width: 16px; height: 16px" alt="Loading" />
                                        </td>
                                        <td class="main_bg" align="center">
                                            Please Wait!!!
                                        </td>
                                    </tr>
                                </table>
                            </ProgressTemplate>
                        </asp:UpdateProgress>
                    </td>
                </tr>
                <tr>
                    <td>
                        <fieldset>
                            <legend style="font-weight: 700">Replicate From:</legend>
                            <table align="left" width="100%">
                                <tr>
                                    <td align="right">
                                        Date:
                                    </td>
                                    <td align="left">
                                        <asp:TextBox ID="txtFromDate" runat="server" CssClass="TextBox"></asp:TextBox>
                                        <cc1:CalendarExtender ID="txtFromDate_CalendarExtender" runat="server" Enabled="True"
                                            TargetControlID="txtFromDate" PopupButtonID="ImgBtnCalendar">
                                        </cc1:CalendarExtender>
                                        <asp:ImageButton ID="ImgBtnCalendar" runat="server" ImageUrl="Images/calendar_icon.gif"
                                            Height="17px" Width="17px" />
                                        <i>&nbsp;(mm/dd/yyyy)</i> &nbsp;<asp:RequiredFieldValidator ID="RequiredFieldValidator1"
                                            runat="server" ControlToValidate="txtFromDate" Display="Dynamic" ErrorMessage="Start Date Required"
                                            ValidationGroup="order" SetFocusOnError="True">*</asp:RequiredFieldValidator><asp:RegularExpressionValidator
                                                ID="RegularExpressionValidator1" runat="server" ControlToValidate="txtFromDate"
                                                Display="Dynamic" ErrorMessage="Date Format:mm/dd/yyyy" ValidationExpression="^(([0]?[1-9]|1[0-2])/([0-2]?[0-9]|3[0-1])/[1-2]\d{3})? ?((([0-1]?\d)|(2[0-3])):[0-5]\d)?(:[0-5]\d)?$"
                                                ValidationGroup="order" SetFocusOnError="True">*</asp:RegularExpressionValidator>&nbsp;&nbsp;<br />
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                    </td>
                                    <td align="left">
                                        <asp:Label ID="lblFacError" runat="server" CssClass="error" Text="Select Facility"
                                            Visible="False"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="right">
                                        Facility Name:
                                    </td>
                                    <td align="left">
                                        <asp:DropDownList ID="ddlfacility" runat="server" AppendDataBoundItems="True" AutoPostBack="True"
                                            OnSelectedIndexChanged="ddlfacility_SelectedIndexChanged" CssClass="DropDownListBox3">
                                            <asp:ListItem Selected="True" Value="0">Select Facility</asp:ListItem>
                                        </asp:DropDownList>
                                        <asp:CompareValidator ID="CompareValidator1" runat="server" ControlToValidate="ddlfacility"
                                            ErrorMessage="Select Facility" Operator="NotEqual" ValueToCompare="0" ValidationGroup="order"
                                            SetFocusOnError="True">*</asp:CompareValidator>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                    </td>
                                    <td align="left">
                                        <asp:RadioButtonList ID="rdbtnlstType" runat="server" AutoPostBack="True" RepeatDirection="Horizontal"
                                            OnSelectedIndexChanged="rdbtnlstType_SelectedIndexChanged">
                                            <asp:ListItem Selected="True" Value="P">Pick</asp:ListItem>
                                            <asp:ListItem Value="D">Drop</asp:ListItem>
                                        </asp:RadioButtonList>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="right">
                                        Shift:<br />
                                        <em>ctrl-click for multi-select</em>
                                    </td>
                                    <td align="left">
                                        <asp:ListBox ID="lstShift" runat="server" SelectionMode="Multiple" AppendDataBoundItems="True">
                                            <asp:ListItem Selected="True" Value="0">-Select-</asp:ListItem>
                                        </asp:ListBox>
                                        <asp:CompareValidator ID="CompareValidator2" runat="server" ControlToValidate="lstShift"
                                            Display="Dynamic" ErrorMessage="Select ShiftTime" Operator="NotEqual" ValidationGroup="order"
                                            ValueToCompare="0" SetFocusOnError="True">*</asp:CompareValidator>
                                    </td>
                                </tr>
                            </table>
                        </fieldset>
                    </td>
                </tr>
                <tr>
                    <td>
                        <fieldset>
                            <legend style="font-weight: 700">Replicate To:</legend>
                            <table width="100%">
                                <tr>
                                    <td align="right" width="40%">
                                        Date:
                                    </td>
                                    <td align="left">
                                        <asp:TextBox ID="txtToDate" runat="server" CssClass="TextBox"></asp:TextBox>
                                        <cc1:CalendarExtender ID="txtToDate_CalendarExtender" runat="server" Enabled="True"
                                            TargetControlID="txtToDate" PopupButtonID="ImgBtnCalendar1">
                                        </cc1:CalendarExtender>
                                        <asp:ImageButton ID="ImgBtnCalendar1" runat="server" ImageUrl="Images/calendar_icon.gif"
                                            Height="17px" Width="17px" />
                                        <i>&nbsp;(mm/dd/yyyy)</i> &nbsp;<asp:RequiredFieldValidator ID="RequiredFieldValidator2"
                                            runat="server" ControlToValidate="txtToDate" Display="Dynamic" ErrorMessage="Replicate To Date is Required"
                                            ValidationGroup="order" SetFocusOnError="True">*</asp:RequiredFieldValidator><asp:RegularExpressionValidator
                                                ID="RegularExpressionValidator2" runat="server" ControlToValidate="txtToDate"
                                                Display="Dynamic" ErrorMessage="Date Format:mm/dd/yyyy" ValidationExpression="^(([0]?[1-9]|1[0-2])/([0-2]?[0-9]|3[0-1])/[1-2]\d{3})? ?((([0-1]?\d)|(2[0-3])):[0-5]\d)?(:[0-5]\d)?$"
                                                ValidationGroup="order" SetFocusOnError="True">*</asp:RegularExpressionValidator><asp:CompareValidator
                                                    ID="CompareValidator15" runat="server" ControlToCompare="txtFromDate" ControlToValidate="txtToDate"
                                                    ErrorMessage="Replicate To Date cannot be less than equal to Replicate From Date."
                                                    Operator="GreaterThan" SetFocusOnError="True" Type="Date" ValidationGroup="order">*</asp:CompareValidator><asp:CompareValidator
                                                        ID="CompareValidator3" ControlToValidate="txtToDate" Operator="GreaterThanEqual"
                                                        Type="Date" runat="server" ErrorMessage="Replicate To Date must be greater than equal to current date"
                                                        ValidationGroup="order" enabled="false" Display="Dynamic">*</asp:CompareValidator>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" colspan="2" width="40%">
                                        <asp:CheckBox ID="chkRepVendor" runat="server" Style="font-weight: 700" Text=" Also Replicate Vendors" Visible="False" />
                                    </td>
                                </tr>
                            </table>
                        </fieldset>
                    </td>
                </tr>
                <tr>
                    <td height="60">
                        <asp:GridView ID="dvStats" runat="server" AutoGenerateColumns="False" BackColor="White"
                            BorderColor="#999999" BorderStyle="None" BorderWidth="1px" CellPadding="4" GridLines="Vertical"
                            HorizontalAlign="Center">
                            <RowStyle BackColor="#EEEEEE" ForeColor="Black" />
                            <Columns>
                                <asp:BoundField DataField="SourceRoutes" HeaderText="Source Routes" ItemStyle-HorizontalAlign="Center" />
                                <asp:BoundField DataField="SourceEmp" HeaderText="Source Employees" ItemStyle-HorizontalAlign="Center" />
                                <asp:BoundField DataField="DelExceptionCount" HeaderText="Delete Exception" ItemStyle-HorizontalAlign="Center" />
                                <asp:BoundField DataField="AddExceptionCount" HeaderText="Add Exception" ItemStyle-HorizontalAlign="Center" />
                            </Columns>
                            <FooterStyle BackColor="#CCCCCC" ForeColor="Black" />
                            <PagerStyle BackColor="#999999" ForeColor="Black" HorizontalAlign="Center" />
                            <SelectedRowStyle BackColor="#008A8C" Font-Bold="True" ForeColor="White" />
                            <HeaderStyle BackColor="#003366" Font-Bold="True" ForeColor="White" />
                            <AlternatingRowStyle BackColor="#DCDCDC" />
                        </asp:GridView>
                        <%-- <asp:DetailsView ID="dvStats" runat="server" Height="50px" Width="200px" HorizontalAlign="Center"
                            BackColor="White" BorderColor="Black" BorderStyle="None" BorderWidth="1px" CellPadding="4"
                            GridLines="Vertical" HeaderText="Replication Statistics">
                            <FooterStyle BackColor="#CCCCCC" ForeColor="Black" />
                            <RowStyle BackColor="#EEEEEE" ForeColor="Black" />
                            <FieldHeaderStyle Font-Bold="True" HorizontalAlign="Left" VerticalAlign="Middle"
                                Width="50%" />
                            <PagerStyle BackColor="#999999" ForeColor="Black" HorizontalAlign="Center" />
                            <HeaderStyle BackColor="#003366" Font-Bold="True" ForeColor="White" HorizontalAlign="Center"
                                VerticalAlign="Middle" />
                            <EditRowStyle BackColor="#008A8C" Font-Bold="True" ForeColor="White" />
                            <AlternatingRowStyle BackColor="#DCDCDC" />
                        </asp:DetailsView>--%>
                    </td>
                </tr>
                <tr>
                    <td align="center">
                        <asp:Button ID="btnStats" runat="server" Text="Show Statistics" ValidationGroup="order"
                            CssClass="Button" OnClick="btnStats_Click" />&nbsp;&nbsp;
                        <asp:Button ID="btnSubmit" runat="server" OnClick="btnSubmit_Click" Text="Replicate"
                            ValidationGroup="order" CssClass="Button" Font-Bold="True" />&nbsp;&nbsp;
                        <cc1:ConfirmButtonExtender ID="ConfirmButton_btnSave" TargetControlID="btnSubmit"
                            runat="server" ConfirmOnFormSubmit="False" ConfirmText="Are you sure? you want to replicate the Routes.">
                        </cc1:ConfirmButtonExtender>
                        <asp:Button ID="btnException" runat="server" Text="Go To Exception" ValidationGroup="order"
                            CssClass="Button" OnClick="btnException_Click" />
                    </td>
                </tr>
                <tr>
                    <td align="center">
                        <asp:Label ID="lblErrorFlag" runat="server" ForeColor="Red" Style="font-weight: 700"></asp:Label>
                    </td>
                </tr>
            </table>
        </ContentTemplate>
        <Triggers>
        <asp:PostBackTrigger ControlID="btnException" />
        </Triggers>
    </asp:UpdatePanel>
</asp:Content>
