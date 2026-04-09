<%@ Page Title="" Language="C#" MasterPageFile="~/eTMSMaster.Master" AutoEventWireup="true"
    CodeFile="DummyTripSheetEntry.aspx.cs" Inherits="DummyTripSheetEntry" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="Server">
    <%--<link href="StyleSheets/TMS.css" rel="stylesheet" type="text/css" />
    <link href="StyleSheets/GridView.css" rel="stylesheet" type="text/css" />--%>
    <style type="text/css"></style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="Server">
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>
            <span class="fs-16 fw-bold mb-3 d-block"> Dummy TripSheet Entry
            </span>
           <%-- <span class="fs-14 fw-semibold mb-3 d-block">Allows to Allocate An Employee Against Adhoc Request.
            </span>--%>
            <div>&nbsp;</div>
            <table align="center" width="100%">
                <tr>
                    <td align="center">
                        <table align="center" width="80%">
                            <tr>
                                <td align="center">
                                    <asp:Label ID="lblErrorMsg" runat="server" CssClass="error"></asp:Label>
                                    &nbsp;
                                </td>
                            </tr>
                            <tr>
                                <td class="heading">
                                    <asp:ValidationSummary ID="ValidationSummary1" runat="server" CssClass="error" ShowMessageBox="True"
                                        ShowSummary="False" ValidationGroup="trip" />
                                    <asp:ValidationSummary ID="ValidationSummary2" runat="server" CssClass="error" ShowMessageBox="True"
                                        ShowSummary="False" ValidationGroup="Search" />
                                </td>
                            </tr>
                           <%-- <tr>
                                <td class="heading">
                                    Dummy TripSheet Entry
                                </td>
                            </tr>--%>
                            <div class="row">
                                <div class="col-lg-12">
                                    <div class="row">
                                        <div class="col d-flex align-items-stretch">
                                            <div class="cardx p-3 w-100">
                                                <div class="routes_stats">
                                                    <div>
                                                        <asp:Panel ID="Panel2" runat="server" DefaultButton="btnSearch">
                                                            <div class="routes_stats">
                                                                <div>
                                                                    <label class="form-label">Shift Date:</label>
                                                                    <asp:TextBox ID="txtShiftDate" runat="server" MaxLength="10" Style="margin-left: 4px"
                                                                        CssClass="TextBox" ValidationGroup="Search" CausesValidation="true" AutoPostBack="True" OnTextChanged="txtShiftDate_TextChanged"></asp:TextBox>
                                                                    <cc1:CalendarExtender ID="txtShiftDate_CalendarExtender" runat="server" Enabled="True"
                                                                        Format="MM/dd/yyyy" TargetControlID="txtShiftDate" PopupButtonID="ibcal1">
                                                                    </cc1:CalendarExtender>
                                                                    <asp:ImageButton ID="ibcal1" runat="server" ImageUrl="~/images/calendar_icon.gif"
                                                                        CssClass="ImageButton" />
                                                                    <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="txtShiftDate"
                                                                        Display="Dynamic" ErrorMessage="Please enter a valid date in format :mm/dd/yyyy" ValidationGroup="Search"
                                                                        ValidationExpression="(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.](19|20)\d\d"
                                                                        SetFocusOnError="True">*</asp:RegularExpressionValidator>
                                                                </div>
                                                                <div>
                                                                    <label class="form-label">Trip Id:
                                                                        <asp:Label ID="lblRouteId" runat="server"></asp:Label>
                                                                        <asp:TextBox ID="txtRouteId" runat="server" MaxLength="5" Style="margin-left: 4px"
                                                                            CssClass="TextBox" ValidationGroup="Search"></asp:TextBox>
                                                                        <asp:RequiredFieldValidator ID="RequiredFieldValidator12" runat="server" ControlToValidate="txtRouteId"
                                                                            Display="Dynamic" ErrorMessage="Please Enter RouteID." ValidationGroup="Search"
                                                                            SetFocusOnError="True">*</asp:RequiredFieldValidator>
                                                                    </label>
                                                                </div>
                                                                <div>
                                                                    <asp:Button ID="btnSearch" runat="server" OnClick="btnSearch_Click" Text="Search"
                                                                        ValidationGroup="Search" CssClass="btn btn-primary ms-auto" />
                                                                </div>
                                                            </div>
                                                            <table align="center">
                                                                <%--<tr>
                                                                    <td>&nbsp;
                                                                    </td>
                                                                    <td>&nbsp;
                                                                    </td>
                                                                    <td>&nbsp;
                                                                    </td>
                                                                    <td>&nbsp;
                                                                    </td>
                                                                    <td>&nbsp;
                                                                    </td>
                                                                </tr>--%>
                                                                <tr>
                                                                    <%--<td style="text-align: right">
                                                                        <b>Shift Date:</b>
                                                                    </td>
                                                                    <td style="text-align: left">--%>
                                                                        <%--<asp:TextBox ID="txtShiftDate" runat="server" MaxLength="10" Style="margin-left: 4px"
                                                                            CssClass="TextBox" ValidationGroup="Search" CausesValidation="true" AutoPostBack="True" OnTextChanged="txtShiftDate_TextChanged"></asp:TextBox>
                                                                        <cc1:CalendarExtender ID="txtShiftDate_CalendarExtender" runat="server" Enabled="True"
                                                                            Format="MM/dd/yyyy" TargetControlID="txtShiftDate" PopupButtonID="ibcal1">
                                                                        </cc1:CalendarExtender>
                                                                        <asp:ImageButton ID="ibcal1" runat="server" ImageUrl="~/images/calendar_icon.gif"
                                                                            CssClass="ImageButton" />
                                                                        <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="txtShiftDate"
                                                                            Display="Dynamic" ErrorMessage="Please enter a valid date in format :mm/dd/yyyy" ValidationGroup="Search"
                                                                            ValidationExpression="(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.](19|20)\d\d"
                                                                            SetFocusOnError="True">*</asp:RegularExpressionValidator>--%>
                                                                    <%--</td>--%>
                                                                    <%--<td style="text-align: right">&nbsp;&nbsp;&nbsp;&nbsp;<b>Trip Id:</b>--%>
                                                                        <%--<asp:Label ID="lblRouteId" runat="server"></asp:Label>--%>
                                                                    </td>
                                                                    <td style="text-align: left">
                                                                       <%-- <asp:TextBox ID="txtRouteId" runat="server" MaxLength="5" Style="margin-left: 4px"
                                                                            CssClass="TextBox" ValidationGroup="Search"></asp:TextBox>
                                                                        <asp:RequiredFieldValidator ID="RequiredFieldValidator12" runat="server" ControlToValidate="txtRouteId"
                                                                            Display="Dynamic" ErrorMessage="Please Enter RouteID." ValidationGroup="Search"
                                                                            SetFocusOnError="True">*</asp:RequiredFieldValidator>--%>
                                                                    </td>
                                                                    <td style="text-align: left">
                                                                        <%--<asp:Button ID="btnSearch" runat="server" OnClick="btnSearch_Click" Text="Search"
                                                                            ValidationGroup="Search" CssClass="Button" />--%>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </asp:Panel>

                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <tr>
                                <td align="center">
                                   
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <asp:UpdateProgress ID="UpdateProgress1" runat="server" AssociatedUpdatePanelID="UpdatePanel1"
                                        DisplayAfter="0" DynamicLayout="False">
                                        <ProgressTemplate>
                                            <table align="center">
                                                <tr>
                                                    <td>
                                                        <img src="images/ajax-loader.gif" style="width: 16px; height: 16px" alt="Loading..." />
                                                    </td>
                                                    <td class="main_bg">
                                                        Loading.....Please Wait!!!
                                                    </td>
                                                </tr>
                                            </table>
                                        </ProgressTemplate>
                                    </asp:UpdateProgress>
                                </td>
                            </tr>
                            <tr>
                                <td align="center">
                                    <asp:MultiView ID="MultiView1" runat="server">
                                        <asp:View ID="View1" runat="server">
                                            <asp:Panel ID="panelLink" runat="server" DefaultButton="btnSave">
                                                <table border="0" align="center" width="100%">
                                                    <tr>
                                                        <td align="center">
                                                            <asp:FormView ID="fvTrip" runat="server" DefaultMode="Edit" Width="100%" CellPadding="0"
                                                                ForeColor="#333333" DataKeyNames="shiftDate,shiftTime,tripType" 
                                                                CellSpacing="0" >
                                                                <FooterStyle BackColor="#990000" Font-Bold="True" ForeColor="White" />
                                                                <RowStyle BackColor="#FEE9B8" ForeColor="#333333" />
                                                                <EditItemTemplate>
                                                                    <table border="1" bordercolor="#666666"  cellpadding="6" cellspacing="0" width="100%" style="border: thin solid #666666;
                                                                        border-collapse: collapse;">
                                                                        <tr>
                                                                            <td align="right">
                                                                                <asp:RadioButtonList ID="rdbtnlstType" runat="server" AutoPostBack="True" RepeatDirection="Horizontal"
                                                                                    OnSelectedIndexChanged="rdbtnlstType_SelectedIndexChanged">
                                                                                    <asp:ListItem Value="P">Pick</asp:ListItem>
                                                                                    <asp:ListItem Value="D">Drop</asp:ListItem>
                                                                                </asp:RadioButtonList>
                                                                                <asp:RequiredFieldValidator ID="RequiredFieldValidator12" runat="server" ControlToValidate="rdbtnlstType"
                                                                                    Display="Dynamic" ErrorMessage="Select Trip Type." ValidationGroup="trip" SetFocusOnError="True">*</asp:RequiredFieldValidator>
                                                                            </td>
                                                                            <td align="left">
                                                                                <asp:DropDownList ID="ddlShiftTime" runat="server" AppendDataBoundItems="True">
                                                                                </asp:DropDownList>
                                                                                <asp:CompareValidator ID="CompareValidator5" runat="server" ControlToValidate="ddlShiftTime"
                                                                                    ErrorMessage="Select Shift" Operator="NotEqual" ValidationGroup="trip" ValueToCompare="0"
                                                                                    SetFocusOnError="True" Display="Dynamic">*</asp:CompareValidator>
                                                                                  &nbsp;&nbsp;&nbsp;&nbsp;  
                                                                                  <%# Eval("Facility")+" - "+ Eval("CabType") %>
                                                                                <asp:Label ID="lblfacid" Style="visibility: hidden" runat="server" Text='<%# Eval("FacilityID") %>'></asp:Label>

                                                                            <%--</td>
                                                                            <td align="right">
                                                                                Route No
                                                                            </td>
                                                                            <td align="left">--%>
                                                                             <asp:DropDownList ID="ddlRouteNo" runat="server" AutoPostBack="True" Visible="false" 
                                                                                    onselectedindexchanged="ddlRouteNo_SelectedIndexChanged" 
                                                                                    AppendDataBoundItems="True"></asp:DropDownList>
                                                                               <%-- <asp:TextBox ID="txtRouteNo" runat="server" AutoPostBack="true" MaxLength="10" CssClass="TextBox"
                                                                                    OnTextChanged="txtRouteNo_TextChanged" Text='<%# Eval("RouteNo")%>' Width="100px"></asp:TextBox>--%>
                                                                            </td>
                                                                            <td align="right" colspan="3">
                                                                                <%--<asp:CheckBox ID="chkAcTrip" runat="server" Text="  A/C Trip" />--%>
                                                                                
                                                                                Employee Count 
                                                                            </td>
                                                                            <td align="left" valign="middle">

                                                                                <asp:TextBox ID="TextTotalStop" Width="30" runat="server" Text='<%# Eval("TotalStop") %>' CssClass="TextBox" MaxLength="2" ></asp:TextBox>
                                                                                <asp:RegularExpressionValidator ID="RegularExpressionValidator6" runat="server" ControlToValidate="TextTotalStop"
                                                                                    ErrorMessage="Enter neumeric in Employee Count." SetFocusOnError="True" ValidationExpression="^\d+(?:\.\d{0,2})?$"
                                                                                    ValidationGroup="trip" >*</asp:RegularExpressionValidator>

                                                                                <%--Garage KM :--%>
                                                                                <%--<asp:TextBox ID="txtGarageKM" runat="server" AutoPostBack="False" CssClass="TextBox"
                                                                                    MaxLength="10" Text='<%# Eval("actEndKm") %>' Width="50px"></asp:TextBox>
                                                                                <asp:RegularExpressionValidator ID="RegularExpressionValidator7" runat="server" ControlToValidate="txtGarageKM"
                                                                                    ErrorMessage="Enter valid Garage KM" SetFocusOnError="True" ValidationExpression="^\d+(?:\.\d{0,2})?$"
                                                                                    ValidationGroup="trip">*</asp:RegularExpressionValidator>--%>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="text-align: right">
                                                                                Vendor:
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <asp:DropDownList ID="ddlVendor" runat="server" AppendDataBoundItems="True" CssClass="DropDownListBox2"
                                                                                    AutoPostBack="True" OnSelectedIndexChanged="ddlVendor_SelectedIndexChanged">
                                                                                </asp:DropDownList>
                                                                                <asp:CompareValidator ID="CompareValidator1" runat="server" ControlToValidate="ddlVendor"
                                                                                    ErrorMessage="Select Vendor" Operator="NotEqual" ValidationGroup="trip" ValueToCompare="0"
                                                                                    SetFocusOnError="True" Display="Dynamic">*</asp:CompareValidator>
                                                                            </td>
                                                                            <td style="text-align: right">
                                                                                Vehicle Type:
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <asp:DropDownList ID="ddlVehicleType" runat="server" AppendDataBoundItems="True"
                                                                                    CssClass="DropDownListBox2" AutoPostBack="True" OnSelectedIndexChanged="ddlVehicleType_SelectedIndexChanged">
                                                                                </asp:DropDownList>
                                                                                <asp:CompareValidator ID="CompareValidator2" runat="server" ControlToValidate="ddlVehicleType"
                                                                                    ErrorMessage="Select VehicleType" Operator="NotEqual" ValidationGroup="trip"
                                                                                    ValueToCompare="0" SetFocusOnError="True" Display="Dynamic">*</asp:CompareValidator>
                                                                            </td>
                                                                            <td style="text-align: right">
                                                                                Vehicle No:
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <asp:DropDownList ID="ddlVehicleNo" runat="server" AppendDataBoundItems="True">
                                                                                </asp:DropDownList>
                                                                                <asp:CompareValidator ID="CompareValidator3" runat="server" ControlToValidate="ddlVehicleNo"
                                                                                    ErrorMessage="Select VehicleNo" Operator="NotEqual" ValidationGroup="trip" ValueToCompare="0"
                                                                                    SetFocusOnError="True" Display="Dynamic">*</asp:CompareValidator>
                                                                                <asp:TextBox ID="txtVehicleNo" runat="server" Width="100" MaxLength="50" CssClass="TextBox"
                                                                                    Text='<%# Eval("VehicleNumber") %>'></asp:TextBox>
                                                                            </td>
                                                                        </tr>
                                                                        <%--<tr>
                                                                            <td style="text-align: right">
                                                                                Start KM:
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <asp:TextBox ID="txtStartKm" runat="server" MaxLength="10" CssClass="TextBox" Text='<%# Eval("actStartKm") %>'></asp:TextBox>
                                                                                <asp:RegularExpressionValidator ID="RegularExpressionValidator3" runat="server" ControlToValidate="txtStartKm"
                                                                                    ErrorMessage="Enter valid Start KM" SetFocusOnError="True" ValidationExpression="^\d+(?:\.\d{0,2})?$"
                                                                                    ValidationGroup="trip">*</asp:RegularExpressionValidator>
                                                                            </td>
                                                                            <td style="text-align: right">
                                                                                End KM:
                                                                            </td>
                                                                            <td style="text-align: left" valign="middle">
                                                                                <asp:TextBox ID="txtEndKm" runat="server" OnTextChanged="txtEndKM_TextChanged" AutoPostBack="true"
                                                                                    MaxLength="10" CssClass="TextBox" Text='<%# Eval("actEndKm") %>'></asp:TextBox>
                                                                                <asp:CompareValidator ID="CompareValidator8" runat="server" ControlToCompare="txtStartKm"
                                                                                    ControlToValidate="txtEndKm" Display="Dynamic" ErrorMessage="End Km Cannot be less than Start Km"
                                                                                    Operator="GreaterThanEqual" ValidationGroup="trip" SetFocusOnError="True">*</asp:CompareValidator>
                                                                                <asp:RegularExpressionValidator ID="RegularExpressionValidator4" runat="server" ControlToValidate="txtEndKm"
                                                                                    ErrorMessage="Enter valid End KM" SetFocusOnError="True" ValidationExpression="^\d+(?:\.\d{0,2})?$"
                                                                                    ValidationGroup="trip" Display="Dynamic">*</asp:RegularExpressionValidator>
                                                                            </td>
                                                                            <td style="text-align: right">
                                                                                &nbsp;Act KM:
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <asp:TextBox ID="txtActKm" runat="server" CssClass="TextBox" MaxLength="10" ReadOnly="True"
                                                                                    Text='<%# Eval("actTotalKm") %>'></asp:TextBox>
                                                                            </td>
                                                                        </tr>--%>
                                                                        <%--<tr>
                                                                            <td style="text-align: right">
                                                                                Approved KM:
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <asp:TextBox ID="txtAppKM" runat="server" CssClass="TextBox" Text='<%# Eval("approvedKm") %>' MaxLength="10" ></asp:TextBox>
                                                                                <asp:RegularExpressionValidator ID="RegularExpressionValidator5" runat="server" ControlToValidate="txtAppKM"
                                                                                    ErrorMessage="Enter valid Approved KM" SetFocusOnError="True" ValidationExpression="^\d+$"
                                                                                    ValidationGroup="trip">*</asp:RegularExpressionValidator>
                                                                            </td>
                                                                            <td style="text-align: right">
                                                                                Emp Count
                                                                            </td>
                                                                            
                                                                            <td style="text-align: left">
                                                                            <asp:TextBox ID="TextTotalStop" Width="30" runat="server" Text='<%# Eval("TotalStop") %>' CssClass="TextBox" MaxLength="2" ></asp:TextBox>
                                                                                <asp:RegularExpressionValidator ID="RegularExpressionValidator6" runat="server" ControlToValidate="TextTotalStop"
                                                                                    ErrorMessage="Enter neumeric in Employee Count." SetFocusOnError="True" ValidationExpression="^\d+(?:\.\d{0,2})?$"
                                                                                    ValidationGroup="trip" >*</asp:RegularExpressionValidator>

                                                                            </td>
                                                                            <td style="text-align: right">
                                                                                Toll Rate:
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <asp:TextBox ID="txtToll" runat="server" CssClass="TextBox" MaxLength="5" Text='<%# Eval("TollRate") %>'></asp:TextBox>
                                                                                <asp:RangeValidator ID="RangeToll" runat="server" ControlToValidate="txtToll" ErrorMessage="Please Enter the Numeric Value"
                                                                                    MaximumValue="100000" MinimumValue="0" SetFocusOnError="true" Type="Double" ValidationGroup="trip">*</asp:RangeValidator>
                                                                            </td>
                                                                        </tr>--%>
                                                                        <tr valign="middle">
                                                                            <td style="text-align: right" valign="middle">
                                                                                Start Time:
                                                                            </td>
                                                                            <td style="text-align: left" valign="middle">
                                                                                <asp:TextBox ID="txtStartTime" runat="server" MaxLength="10" CssClass="TextBox"></asp:TextBox>
                                                                                <cc1:CalendarExtender ID="txtStartTime_CalendarExtender" runat="server" Format="MM/dd/yyyy"
                                                                                    Enabled="True" TargetControlID="txtStartTime">
                                                                                </cc1:CalendarExtender>
                                                                                <asp:RegularExpressionValidator ID="RegularExpressionV" runat="server" ControlToValidate="txtStartTime"
                                                                                    Display="Dynamic" ErrorMessage="Date Format:MM/dd/yyyy" ValidationExpression="(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.](19|20)\d\d"
                                                                                    ValidationGroup="trip" SetFocusOnError="True">*</asp:RegularExpressionValidator>
                                                                                <asp:RangeValidator ID="RangeValidatorStartTime" runat="server" ControlToValidate="txtStartTime"
                                                                                    Type="Date" ValidationGroup="trip" Display="Dynamic" SetFocusOnError="True">*
                                                                                </asp:RangeValidator>
                                                                                <asp:ListBox ID="lstStartHH" runat="server" AppendDataBoundItems="True" Rows="1"
                                                                                    CssClass="DropDownListBox3">
                                                                                    <asp:ListItem Value="0">HH</asp:ListItem>
                                                                                </asp:ListBox>
                                                                                <asp:CompareValidator ID="CompareValidator10" runat="server" ControlToValidate="lstStartHH"
                                                                                    ErrorMessage="Select Start HH" Operator="NotEqual" ValidationGroup="trip" ValueToCompare="0"
                                                                                    SetFocusOnError="True" Display="Dynamic">*</asp:CompareValidator>&nbsp;
                                                                                <asp:ListBox ID="lstStartMM" runat="server" AppendDataBoundItems="True" Rows="1"
                                                                                    CssClass="DropDownListBox3">
                                                                                    <asp:ListItem Value="0">MM</asp:ListItem>
                                                                                </asp:ListBox>
                                                                                <asp:CompareValidator ID="CompareValidator12" runat="server" ControlToValidate="lstStartMM"
                                                                                    ErrorMessage="Select Start MM" Operator="NotEqual" ValidationGroup="trip" ValueToCompare="0"
                                                                                    SetFocusOnError="True">*</asp:CompareValidator>
                                                                            </td>
                                                                            <td style="text-align: right">
                                                                                End Time:
                                                                            </td>
                                                                            <td style="text-align: left" valign="middle">
                                                                                <asp:TextBox ID="txtEndTime" runat="server" MaxLength="10" CssClass="TextBox"></asp:TextBox>
                                                                                <cc1:CalendarExtender ID="txtEndTime_CalendarExtender" runat="server" Format="MM/dd/yyyy"
                                                                                    Enabled="True" TargetControlID="txtEndTime">
                                                                                </cc1:CalendarExtender>
                                                                                <asp:RegularExpressionValidator ID="RegularExpressionValidator2" runat="server" ControlToValidate="txtEndTime"
                                                                                    Display="Dynamic" ErrorMessage="Date Format:MM/dd/yyyy" ValidationExpression="(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.](19|20)\d\d"
                                                                                    ValidationGroup="trip" SetFocusOnError="True">*</asp:RegularExpressionValidator>
                                                                                <asp:RangeValidator ID="RangeValidatorEndTime" runat="server" ControlToValidate="txtEndTime"
                                                                                    Type="Date" ValidationGroup="trip" Display="Dynamic" SetFocusOnError="True">*
                                                                                </asp:RangeValidator>
                                                                                <asp:CompareValidator ID="CompareValidator15" runat="server" ControlToCompare="txtStartTime"
                                                                                    ControlToValidate="txtEndTime" Display="Dynamic" ErrorMessage="End Time Cannot be less than Start Time"
                                                                                    Operator="GreaterThanEqual" SetFocusOnError="True" Type="Date" ValidationGroup="trip">*</asp:CompareValidator>&nbsp;
                                                                                <asp:ListBox ID="lstEndHH" runat="server" AppendDataBoundItems="True" Rows="1" AutoPostBack="False"
                                                                                    OnSelectedIndexChanged="lstEndMM_SelectedIndexChanged" CssClass="DropDownListBox3">
                                                                                    <asp:ListItem Value="0">HH</asp:ListItem>
                                                                                </asp:ListBox>
                                                                                <asp:CompareValidator ID="CompareValidator11" runat="server" ControlToValidate="lstEndHH"
                                                                                    ErrorMessage="Select End HH" Operator="NotEqual" ValidationGroup="trip" ValueToCompare="0"
                                                                                    SetFocusOnError="True" Display="Dynamic">*</asp:CompareValidator>&nbsp;
                                                                                <asp:ListBox ID="lstEndMM" runat="server" Rows="1" AppendDataBoundItems="True" AutoPostBack="False"
                                                                                    OnSelectedIndexChanged="lstEndMM_SelectedIndexChanged" CssClass="DropDownListBox3">
                                                                                    <asp:ListItem Value="0">MM</asp:ListItem>
                                                                                </asp:ListBox>
                                                                                <asp:CompareValidator ID="CompareValidator13" runat="server" ControlToValidate="lstEndMM"
                                                                                    ErrorMessage="Select End MM" Operator="NotEqual" ValidationGroup="trip" ValueToCompare="0"
                                                                                    SetFocusOnError="True" Display="Dynamic">*</asp:CompareValidator>
                                                                            </td>
                                                                            <td style="text-align: right">
                                                                                Delay Reason:
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <%--<asp:CheckBox ID="chkIntersateTax" runat="server" Checked='<%# Convert.ToBoolean(Eval("IntersateTax")) %>'
                                                                                    Text="Interstate Tax" />--%>
                                                                                <asp:DropDownList ID="ddlDelay" runat="server" AppendDataBoundItems="True">
                                                                                </asp:DropDownList>
                                                                                <asp:Label ID="lbldelay" runat="server" Font-Size="Small" ForeColor="Red"></asp:Label>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="text-align: right">Penalty Type:
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <asp:DropDownList ID="ddlPenaltyType" runat="server" CssClass="DropDownListBox3"
                                                                                    AppendDataBoundItems="True">   </asp:DropDownList>
                                                                            </td>
                                                                            <td style="text-align: right">Zone :
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <asp:DropDownList ID="ddlZone" runat="server" AppendDataBoundItems="True">
                                                                                </asp:DropDownList>
                                                                                <asp:CompareValidator ID="cvZone" runat="server" ControlToValidate="ddlZone"
                                                                                    Display="Dynamic" ErrorMessage="Select Zone" Operator="NotEqual"
                                                                                    SetFocusOnError="True" ValidationGroup="trip" ValueToCompare="0">*</asp:CompareValidator>
                                                                            </td>
                                                                            <td style="text-align: right" rowspan="2">Toll :
                                                                            </td>
                                                                            <td style="text-align: left; vertical-align: middle;" rowspan="2" valign="middle">
                                                                               
                                                                                <asp:ListBox ID="lbToll" runat="server" AppendDataBoundItems="true" SelectionMode="Multiple" ></asp:ListBox>
                                                                            </td>
                                                                        </tr>
                                                                        
                                                                        <tr>
                                                                            <td style="text-align: right">
                                                                                Guard:
                                                                            </td>
                                                                            <td style="text-align: left"> 
                                                                                <asp:DropDownList ID="ddlGuard" runat="server" style="font-size:7pt; width:200px" AppendDataBoundItems="True">
                                                                                </asp:DropDownList>
                                                                            </td>
                                                                            <td style="text-align: right">
                                                                                Driver:
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <asp:DropDownList ID="ddlDriver" runat="server" AppendDataBoundItems="True">
                                                                                </asp:DropDownList>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="text-align: right">
                                                                                Remarks:
                                                                            </td>
                                                                            <td style="text-align: left" colspan="3">
                                                                                <%--<asp:CompareValidator ID="CompareValidator9" runat="server" ControlToValidate="ddlDelay"
                                                                                    Display="Dynamic" ErrorMessage="Select Delay Reason" Operator="NotEqual" ValidationGroup="trip"
                                                                                    ValueToCompare="0" SetFocusOnError="True">*</asp:CompareValidator>--%>
                                                                                <asp:TextBox ID="txtRemarks" runat="server" Text='<%# Eval("remark") %>' TextMode="MultiLine"
                                                                                    Width="350" ></asp:TextBox>
                                                                               
                                                                                <asp:RegularExpressionValidator ID="txtConclusionValidator1" runat="server" ControlToValidate="txtRemarks"
                                                                                    ErrorMessage="Remarks exceeding 100 characters." SetFocusOnError="True" ValidationExpression="^[\s\S]{0,100}$"
                                                                                    ValidationGroup="trip">*</asp:RegularExpressionValidator>
                                                                                    
                                                                                     <asp:DropDownList ID="ddltripremark" runat="server" AppendDataBoundItems="True" Visible="false">
                                                                                </asp:DropDownList>
                                                                               <br />
                                                                                Max 100 characters.
                                                                            </td>
                                                                            <%--<td align="right">
                                                                                Guard:<hr />Driver:
                                                                            </td>
                                                                            <td align="left">
                                                                                <asp:DropDownList ID="ddlGuard" runat="server" style="font-size:7pt; width:200px" AppendDataBoundItems="True">
                                                                                </asp:DropDownList><hr /> <asp:DropDownList ID="ddlDriver" runat="server" AppendDataBoundItems="True">
                                                                                </asp:DropDownList>
                                                                            </td>--%>
                                                                        </tr>
                                                                    </table>
                                                                </EditItemTemplate>
                                                                <ItemTemplate>
                                                                    <table border="1" bordercolor="#666666"  cellpadding="6" cellspacing="0" width="100%" style="border: thin solid #666666;
                                                                        border-collapse: collapse;">
                                                                        <tr>
                                                                            <td style="text-align: right">
                                                                                Vendor:
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <asp:Label ID="Label1" runat="server" Text='<%# Eval("vendorName") %>'></asp:Label>
                                                                            </td>
                                                                            <td style="text-align: right">
                                                                                Vehicle Type:
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <asp:Label ID="Label2" runat="server" Text='<%# Eval("vehicle") %>'></asp:Label>
                                                                            </td>
                                                                            <td align="right">
                                                                                Vehicle No:
                                                                            </td>
                                                                            <td align="left">
                                                                                <asp:Label ID="Label3" runat="server" Text='<%# Eval("vehicleId") %>'></asp:Label>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="text-align: right">
                                                                                Start KM:
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <asp:Label ID="Label4" runat="server" Text='<%# Eval("actStartKm") %>'></asp:Label>
                                                                            </td>
                                                                            <td style="text-align: right">
                                                                                End KM:
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <asp:Label ID="Label5" runat="server" Text='<%# Eval("actEndKm") %>'></asp:Label>
                                                                            </td>
                                                                            <td align="Right">
                                                                                Shift Time:
                                                                            </td>
                                                                            <td align="Left">
                                                                                <asp:Label ID="lblShiftTime" runat="server" Text='<%# Eval("shiftTime")+"-"+Eval("tripType")+"-"+Eval("facility") %>'></asp:Label>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="text-align: right">
                                                                                Act KM:
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <asp:Label ID="Label6" runat="server" Text="Label"></asp:Label>
                                                                            </td>
                                                                            <td style="text-align: right">
                                                                                Approved KM:
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <asp:Label ID="Label7" runat="server" Text='<%# Eval("approvedKm") %>'></asp:Label>
                                                                            </td>
                                                                            <td align="Right">
                                                                                Driver:
                                                                            </td>
                                                                            <td align="Left">
                                                                                <asp:Label ID="Label8" runat="server" Text='<%# Eval("driver") %>'></asp:Label>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="text-align: right">
                                                                                Start Time:
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <asp:Label ID="Label9" runat="server" Text='<%# Eval("actVehicleStartTime") %>'></asp:Label>
                                                                            </td>
                                                                            <td style="text-align: right">
                                                                                End Time:
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <asp:Label ID="Label10" runat="server" Text='<%# Eval("actVehicleEndTime") %>'></asp:Label>
                                                                            </td>
                                                                            <td align="right">
                                                                                <asp:CheckBox ID="chkReadGuard" runat="server" Checked='<%# Convert.ToString(Eval("guard"))=="T"?true:false %>'
                                                                                    Text="Guard" />
                                                                            </td>
                                                                            <td align="left">
                                                                                <asp:CheckBox ID="CheckBox1" runat="server" Checked='<%# Convert.ToBoolean(Eval("IntersateTax")) %>'
                                                                                    Enabled="False" Text="Interstate Tax" />
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="text-align: right">
                                                                                Delay Reason:
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <asp:Label ID="Label11" runat="server" Text='<%# Eval("Incident_type") %>'></asp:Label>
                                                                            </td>
                                                                            <td style="text-align: right">
                                                                                Toll Rate:
                                                                            </td>
                                                                            <td style="text-align: left">
                                                                                <asp:Label ID="Label12" runat="server" Text='<%# Eval("TollRate") %>'></asp:Label>
                                                                            </td>
                                                                            <td align="right">
                                                                            </td>
                                                                            <td align="left">
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="text-align: right">
                                                                                Remarks:
                                                                            </td>
                                                                            <td colspan="3" style="text-align: left;">
                                                                                <asp:TextBox ID="txtRemarks" runat="server" ReadOnly="True" Text='<%# Eval("remark") %>'
                                                                                    TextMode="MultiLine" CssClass="TextBox" MaxLength="100" Width="40%"></asp:TextBox>
                                                                             <asp:Label ID="lblTripRemark" runat="server" Text='<%# Eval("TripRemark") %>'></asp:Label>
                                                                            </td>
                                                                            <td align="right">
                                                                                Penalty Type:
                                                                            </td>
                                                                            <td align="left">
                                                                                <asp:Label ID="Label13" runat="server" Text='<%# Eval("PenaltyType") %>'></asp:Label><br />
                                                                                <asp:Label ID="Label14" runat="server" Text='<%# Eval("PenaltyAmount") %>'></asp:Label>
                                                                            </td>
                                                                        </tr>
                                                                    </table>
                                                                </ItemTemplate>
                                                                <PagerStyle BackColor="#FFCC66" ForeColor="#333333" HorizontalAlign="Center" />
                                                                <HeaderStyle BackColor="#990000" Font-Bold="True" ForeColor="White" />
                                                            </asp:FormView>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td align="center">
                                                            <asp:GridView ID="GvEmpInfo" runat="server" AutoGenerateColumns="False" CssClass="GridView"
                                                                DataKeyNames="employeeId" OnRowDeleting="GvEmpInfo_RowDeleting" Width="100%">
                                                                <RowStyle CssClass="RowStyle" />
                                                                <FooterStyle CssClass="FooterStyle" />
                                                                <PagerStyle CssClass="PagerStyle" />
                                                                <SelectedRowStyle CssClass="SelectedRowStyle" />
                                                                <HeaderStyle CssClass="HeaderStyle" />
                                                                <EditRowStyle BackColor="#999999" />
                                                                <AlternatingRowStyle CssClass="AltRowStyle" />
                                                                <Columns>
                                                                    <asp:TemplateField HeaderText="Sno">
                                                                        <EditItemTemplate>
                                                                            <asp:Label ID="lblSno" runat="server" Text='<%# Eval("stopNo") %>' Width="30px"></asp:Label>
                                                                        </EditItemTemplate>
                                                                        <ItemTemplate>
                                                                            <asp:Label ID="lblStopNo" runat="server" Text='<%# Eval("stopNo") %>'></asp:Label>
                                                                        </ItemTemplate>
                                                                    </asp:TemplateField>
                                                                    <asp:TemplateField HeaderText="Emp Id">
                                                                        <EditItemTemplate>
                                                                            <asp:Label ID="lblEmpId" runat="server" Text='<%# Eval("empCode") %>'></asp:Label>
                                                                        </EditItemTemplate>
                                                                        <ItemTemplate>
                                                                            <asp:Label ID="lblEmpId0" runat="server" Text='<%# Eval("empCode") %>'></asp:Label>
                                                                        </ItemTemplate>
                                                                    </asp:TemplateField>
                                                                    <asp:TemplateField HeaderText="Emp Name">
                                                                        <EditItemTemplate>
                                                                            <asp:Label ID="lblEmpName" runat="server" Text='<%# Eval("empName") %>'></asp:Label>
                                                                        </EditItemTemplate>
                                                                        <ItemTemplate>
                                                                            <asp:Label ID="lblEmpName0" runat="server" Text='<%# Eval("empName") %>'></asp:Label>
                                                                        </ItemTemplate>
                                                                    </asp:TemplateField>
                                                                    <asp:TemplateField HeaderText="Location">
                                                                        <EditItemTemplate>
                                                                            <asp:Label ID="lblLocation" runat="server" Text='<%# Eval("locationName") %>'></asp:Label>
                                                                        </EditItemTemplate>
                                                                        <ItemTemplate>
                                                                            <asp:Label ID="lblLocation0" runat="server" Text='<%# Eval("locationName") %>'></asp:Label>
                                                                        </ItemTemplate>
                                                                    </asp:TemplateField>
                                                                    <asp:TemplateField HeaderText="Status">
                                                                        <EditItemTemplate>
                                                                            <asp:Label ID="lblStatus" runat="server"></asp:Label>
                                                                        </EditItemTemplate>
                                                                        <ItemTemplate>
                                                                            <asp:DropDownList ID="ddlStatus" runat="server" CssClass="DropDownListBox2">
                                                                                <asp:ListItem Value="0">Select Status</asp:ListItem>
                                                                                <asp:ListItem Selected="True" Value="B">Boarded</asp:ListItem>
                                                                                <asp:ListItem Value="C">Cancelled</asp:ListItem>
                                                                                <asp:ListItem Value="N">No Show</asp:ListItem>
                                                                            </asp:DropDownList>
                                                                            <asp:CompareValidator ID="CompareValidator6" runat="server" ControlToValidate="ddlStatus"
                                                                                ErrorMessage="Select Status" Operator="NotEqual" ValidationGroup="trip" ValueToCompare="0"
                                                                                Display="Dynamic">*</asp:CompareValidator>
                                                                        </ItemTemplate>
                                                                    </asp:TemplateField>
                                                                    <asp:TemplateField HeaderText="Remark">
                                                                        <EditItemTemplate>
                                                                            <asp:Label ID="lblRemarks" runat="server" Text='<%# Eval("trackingRemark") %>'></asp:Label>
                                                                        </EditItemTemplate>
                                                                        <ItemTemplate>
                                                                            <asp:TextBox ID="txtgvRemarks" runat="server" Text='<%# Eval("trackingRemark") %>'
                                                                                CssClass="TextBox" MaxLength="100"></asp:TextBox>
                                                                        </ItemTemplate>
                                                                    </asp:TemplateField>
                                                                    <asp:TemplateField ShowHeader="False">
                                                                        <ItemTemplate>
                                                                            <asp:LinkButton ID="lbtnRemove" runat="server" CausesValidation="False" CommandName="Delete"
                                                                                Text="Remove" Visible='<%# Convert.ToString(Eval("isNewAdded"))=="True"?true:false %>'></asp:LinkButton>
                                                                            <asp:Label ID="lblNew" runat="server" Font-Bold="True" Font-Size="X-Small" Text="New Added"
                                                                                Visible="False"></asp:Label>
                                                                        </ItemTemplate>
                                                                    </asp:TemplateField>
                                                                </Columns>
                                                            </asp:GridView>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td align="center">
                                                            <table width="100%" cellpadding="2" cellspacing="0">
                                                                <tr bgcolor="#D6D6D6">
                                                                    <td style="text-align: left" width="33%">
                                                                        <asp:Button ID="imbbtnAddEmp" runat="server" CssClass="Button" Text="Add Employee"
                                                                            OnClick="btnAddEmp_Click" />
                                                                        <%--<asp:ImageButton ID="imbbtnAddEmp" runat="server" ImageUrl="~/images/user_add.png"
                                                                            CausesValidation="False" OnClick="btnAddEmp_Click" ToolTip="Add Employee" Width="25px"
                                                                            BorderStyle="Ridge" BorderWidth="0px" Height="25px" />--%>
                                                                    </td>
                                                                    <td style="text-align: center" width="33%">
                                                                        <asp:Button ID="btnSave" runat="server" OnClick="btnSave_Click" Text="Save" ValidationGroup="trip"
                                                                            Width="100px" CssClass="Button" />
                                                                    </td>
                                                                    <td style="text-align: right" width="33%">
                                                                        <asp:Button ID="btnCancelTrip0" runat="server" CausesValidation="False" OnClick="btnCancelTrip_Click"
                                                                            Text="Cancel/Rollback" Width="130px" CssClass="Button" />
                                                                        <cc1:ConfirmButtonExtender ID="btnCancelTrip0_ConfirmButtonExtender" runat="server"
                                                                            ConfirmText="Are you sure? You want to cancel this Tripsheet." Enabled="True"
                                                                            TargetControlID="btnCancelTrip0">
                                                                        </cc1:ConfirmButtonExtender>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                            </asp:Panel>
                                        </asp:View>
                                    </asp:MultiView>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td align="center">
                        <table width="100%">
                            <tr>
                                <td>
                                    <asp:Button ID="btnHidden" runat="server" Style="display: none" />
                                    <cc1:ModalPopupExtender ID="ModalPopupExtender1" runat="server" Enabled="True" BackgroundCssClass="modalBackground"
                                        Drag="True" TargetControlID="btnHidden" CancelControlID="ibtnSMclose" PopupControlID="Panel1">
                                    </cc1:ModalPopupExtender>
                                    <asp:Panel ID="Panel1" runat="server" CssClass="modaltable" DefaultButton="btnEmpSearch"
                                        Width="600px" >
                                        <table width="100%">
                                            <tr>
                                                <td width="95%" bgcolor="#003366" style="color: #FFFFFF" align="center">
                                                    <b>Allow User to Insert New Employee in the Route.</b>
                                                </td>
                                                <td bgcolor="#003366">
                                                    <asp:ImageButton ID="ibtnSMclose" runat="server" ImageUrl="~/Images/Exit.jpg" OnClick="lbtnClose_Click" />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" colspan="2">
                                                    &nbsp;&nbsp;
                                                    <asp:Label ID="lblSearch" runat="server" CssClass="error"></asp:Label>
                                                    <table width="100%" class="GridView">
                                                        <tr>
                                                            <td style="text-align: right">
                                                                Stop NO:
                                                            </td>
                                                            <td style="text-align: left">
                                                                <asp:DropDownList ID="ddlStopNO" runat="server" AppendDataBoundItems="True" CssClass="DropDownListBox3">
                                                                </asp:DropDownList>
                                                                <asp:CompareValidator ID="CompareValidator14" runat="server" ControlToValidate="ddlStopNO"
                                                                    Display="Dynamic" ErrorMessage="Select Stop No" Operator="NotEqual" ValidationGroup="Add"
                                                                    ValueToCompare="0"></asp:CompareValidator>
                                                            </td>
                                                        </tr>
                                                        <%--<tr>
                                                            <td style="text-align: right" >
                                                                Address:
                                                            </td>
                                                            <td style="text-align: left">
                                                                <asp:DropDownList ID="ddlAddress" runat="server" AppendDataBoundItems="True" CssClass="DropDownListBox3">
                                                                    <asp:ListItem Text="Primary" Value="1"></asp:ListItem>
                                                                    <asp:ListItem Text="Secondary" Value="2"></asp:ListItem>
                                                                </asp:DropDownList>
                                                            </td>
                                                        </tr>--%>
                                                        <tr>
                                                            <td style="text-align: right" align="right" width="40%">
                                                                Enter&nbsp; ID or Name:
                                                            </td>
                                                            <td style="text-align: left" align="left" width="60%">
                                                                <asp:TextBox ID="txtEmpIdName" runat="server" ValidationGroup="spoc" CssClass="TextBox1"></asp:TextBox>
                                                                <asp:RequiredFieldValidator ID="RequiredFieldValidator4" runat="server" ControlToValidate="txtEmpIdName"
                                                                    Display="Dynamic" ErrorMessage="Please Enter Name or Id" ValidationGroup="search"></asp:RequiredFieldValidator>
                                                                &nbsp;
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="text-align: right">
                                                                &nbsp;
                                                            </td>
                                                            <td style="text-align: left" align="left">
                                                                <asp:Button ID="btnEmpSearch" runat="server" OnClick="btnEmpSearch_Click" Text="Search"
                                                                    ValidationGroup="search" CssClass="Button" />
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="2">
                                                                <asp:GridView ID="GvEmployee" runat="server" AllowPaging="True" AutoGenerateColumns="False"
                                                                    DataKeyNames="Id" OnPageIndexChanging="GvEmployee_PageIndexChanging" OnSelectedIndexChanging="GvEmployee_SelectedIndexChanging"
                                                                    CssClass="GridView" Visible="False" Width="100%">
                                                                    <Columns>
                                                                        <asp:TemplateField HeaderText="Employee Id">
                                                                            <ItemTemplate>
                                                                                <asp:Label ID="lblEmpId1" runat="server" Text='<%# Eval("empCode") %>'></asp:Label>
                                                                            </ItemTemplate>
                                                                        </asp:TemplateField>
                                                                        <asp:TemplateField HeaderText="Employee Name">
                                                                            <ItemTemplate>
                                                                                <asp:Label ID="lblEmpName1" runat="server" Text='<%# Eval("empName") %>'></asp:Label>
                                                                            </ItemTemplate>
                                                                        </asp:TemplateField>
                                                                        <asp:TemplateField HeaderText="Primary Location">
                                                                            <ItemTemplate>
                                                                                <asp:Label ID="lblEmpProcess" runat="server" Text='<%# Eval("PrimaryLocation") %>'></asp:Label>
                                                                            </ItemTemplate>
                                                                        </asp:TemplateField>
                                                                        <asp:TemplateField HeaderText="Secondary Location">
                                                                            <ItemTemplate>
                                                                                <asp:Label ID="lblFacility" runat="server" Text='<%# Eval("SecondaryLocation") %>'></asp:Label>
                                                                            </ItemTemplate>
                                                                        </asp:TemplateField>
                                                                        <asp:TemplateField ShowHeader="False">
                                                                            <ItemTemplate>
                                                                                <asp:LinkButton ID="LinkButton1" runat="server" CommandName="Select" Text="Add" ValidationGroup="Add"></asp:LinkButton>
                                                                            </ItemTemplate>
                                                                        </asp:TemplateField>
                                                                    </Columns>
                                                                    <RowStyle CssClass="RowStyle" />
                                                                    <PagerStyle CssClass="PagerStyle" />
                                                                    <SelectedRowStyle CssClass="SelectedRowStyle" />
                                                                    <HeaderStyle CssClass="HeaderStyle" />
                                                                    <EditRowStyle CssClass="EditRowStyle" />
                                                                    <AlternatingRowStyle CssClass="AltRowStyle" />
                                                                    <FooterStyle CssClass="FooterStyle" />
                                                                </asp:GridView>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </asp:Panel>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </ContentTemplate>
    </asp:UpdatePanel>
</asp:Content>
