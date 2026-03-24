<%@ Page Title="" Language="C#" EnableEventValidation="true" MasterPageFile="~/eTMSMaster.Master"
    AutoEventWireup="true" CodeFile="DummyTripsheetGen.aspx.cs" Inherits="DummyTripsheetGen"
    EnableViewState="True" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="Server">
    <%--<link href="StyleSheets/GridView.css" rel="stylesheet" type="text/css" />
    <link href="StyleSheets/TMS.css" rel="stylesheet" type="text/css" />--%>
    <style type="text/css">
        .style1 {
            color: #FFFFFF;
            font-size: small;
        }
    </style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="Server">
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>
            <span class="fs-16 fw-semibold mb-3 d-block">Generate Dummy Roster</span>
            <span class="fs-16 fw-semibold mb-3 d-block">Allows to Generate Dummy Tripsheet as Blank/Non-Blank.</span>
            
            <div>&nbsp;</div>
            <asp:RadioButtonList ID="rbtnSearchType" runat="server" AutoPostBack="True" Font-Bold="True"
                OnSelectedIndexChanged="rbtnSearchType_SelectedIndexChanged" RepeatDirection="Horizontal"
                Style="margin-left: 0px">
                <asp:ListItem Selected="True" Value="Blank">Blank Sheet</asp:ListItem>
                <asp:ListItem Value="NonBlank">With Employee</asp:ListItem>
            </asp:RadioButtonList>
            <div class="row">
                <div class="col-lg-12">
                    <div class="row">
                        <div class="col d-flex align-items-stretch">
                            <div class="cardx p-3 w-100">
                                <span class="fs-16 fw-semibold mb-3 d-block">Fill The Selection Criteria
                                    <asp:Label ID="lblFacError" runat="server" CssClass="error" Text="Select Facility"
                                    Visible="False"></asp:Label>
                                </span>
                                <div class="routes_stats">
                                    <div>
                                        <small>
                                            <b>Date:</b>
                                            <asp:TextBox ID="txtStartDate" runat="server" CssClass="TextBox" OnTextChanged="txtStartDate_TextChanged" AutoPostBack="True"></asp:TextBox>
                                            <cc1:CalendarExtender ID="txtStartDate_CalendarExtender" runat="server" Enabled="True"
                                                TargetControlID="txtStartDate" PopupButtonID="ImgBtnCalendar">
                                            </cc1:CalendarExtender>
                                            <asp:ImageButton ID="ImgBtnCalendar" runat="server" ImageUrl="Images/calendar_icon.gif"
                                                Height="17px" Width="17px" />
                                            &nbsp;<asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="txtStartDate"
                                                Display="Dynamic" ErrorMessage="Start Date Required" ValidationGroup="Submit"
                                                SetFocusOnError="True">*</asp:RequiredFieldValidator><asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="txtStartDate"
                                                    Display="Dynamic" ErrorMessage="Date Format:mm/dd/yyyy" ValidationExpression="^(([0]?[1-9]|1[0-2])/([0-2]?[0-9]|3[0-1])/[1-2]\d{3})? ?((([0-1]?\d)|(2[0-3])):[0-5]\d)?(:[0-5]\d)?$"
                                                    ValidationGroup="Submit" SetFocusOnError="True">*</asp:RegularExpressionValidator>&nbsp;&nbsp;<br />
                                        </small>
                                    </div>
                                    <div>
                                        <small>
                                            <b>Facility Name:</b>
                                            <asp:DropDownList ID="ddlfacility" runat="server" AppendDataBoundItems="True" AutoPostBack="True"
                                                OnSelectedIndexChanged="ddlfacility_SelectedIndexChanged" CssClass="DropDownListBox3">
                                                <asp:ListItem Selected="True" Value="0">-Select-</asp:ListItem>
                                            </asp:DropDownList>
                                            <asp:CompareValidator ID="CompareValidator1" runat="server" ControlToValidate="ddlfacility"
                                                ErrorMessage="Select Facility" Operator="NotEqual" ValueToCompare="0" ValidationGroup="Submit"
                                                SetFocusOnError="True">*</asp:CompareValidator>
                                        </small>
                                    </div>
                                    <div>
                                        <small>
                                            <asp:RadioButtonList ID="rdbtnlstType" runat="server" AutoPostBack="True" OnSelectedIndexChanged="rdbtnlstType_SelectedIndexChanged"
                                                RepeatDirection="Horizontal">
                                                <asp:ListItem Selected="True" Value="P">Pick</asp:ListItem>
                                                <asp:ListItem Value="D">Drop</asp:ListItem>
                                                <asp:ListItem Value="">None</asp:ListItem>
                                            </asp:RadioButtonList>
                                        </small>
                                        
                                    </div>
                                    <div>
                                        <small>
                                            <b>Shift:</b>
                                            <asp:ListBox ID="lstShift" runat="server" SelectionMode="Single" AppendDataBoundItems="True">
                                                <asp:ListItem Selected="True" Value="0">-Select-</asp:ListItem>
                                            </asp:ListBox>
                                            <asp:CompareValidator ID="CompareValidator2" runat="server" ControlToValidate="lstShift"
                                                Display="Dynamic" ErrorMessage="Select ShiftTime" Operator="NotEqual" ValidationGroup="Submit"
                                                ValueToCompare="0" SetFocusOnError="True">*</asp:CompareValidator>
                                        </small>
                                    </div>
                                    <div>
                                        <small>
                                            <b>Cab Type</b>
                                            <asp:DropDownList ID="ddlcabtype" runat="server" AppendDataBoundItems="True">
                                            </asp:DropDownList>
                                        </small>
                                    </div>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                    <div>
                                        <asp:Panel ID="Panel1" runat="server">
                                            <%--<div class="routes_stats">
                                                <div>--%>
                                                    <small>
                                                        <b>No of Sheets:</b>
                                                        <asp:TextBox ID="txtNoOfSheets" runat="server" CssClass="TextBox" MaxLength="4"></asp:TextBox>
                                                        <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="txtNoOfSheets"
                                                            Display="Dynamic" ErrorMessage="Enter No of Sheets" ValidationGroup="Submit"
                                                            SetFocusOnError="True">*</asp:RequiredFieldValidator>
                                                        <asp:RangeValidator ID="RangeValidator1" runat="server" ErrorMessage="The value must be from 1 to 100!"
                                                            MaximumValue="100" MinimumValue="1" SetFocusOnError="True" Type="Integer" ValidationGroup="Submit"
                                                            ControlToValidate="txtNoOfSheets" Display="Dynamic">*</asp:RangeValidator>
                                                        &nbsp;&nbsp;&nbsp;&nbsp;
                                                        <asp:Button ID="btnSubmit" runat="server" OnClick="btnSubmit_Click" Text="Generate"
                                                            ValidationGroup="Submit" CssClass="btn btn-primary ms-auto" />
                                                    </small>
                                                <%--</div>
                                            </div>--%>
                                        </asp:Panel>
                                    </div>
                                    <div>
                                        <asp:Panel ID="Panel2" runat="server" Visible="False">
                                            <div class="routes_stats">
                                                <div>
                                                    <small>
                                                        <b>Search Employee:</b>
                                                        <asp:Panel ID="Panel4" runat="server" DefaultButton="btnSearch">
                                                            <div class="routes_stats">
                                                                <div>
                                                                    <asp:TextBox ID="txtEmpIdName" runat="server" CssClass="TextBox1"></asp:TextBox>
                                                                    <asp:RequiredFieldValidator ID="RequiredFieldValidator3" runat="server" ControlToValidate="txtEmpIdName"
                                                                        Display="Dynamic" ErrorMessage="Please Enter Name or Id" ValidationGroup="Search"
                                                                        SetFocusOnError="True">*</asp:RequiredFieldValidator>
                                                                </div>
                                                                <div>
                                                                    <asp:Button ID="btnSearch" runat="server" OnClick="btnSubmit_Click" Text="Search"
                                                                        ValidationGroup="Search" CssClass="btn btn-primary ms-auto" />
                                                                </div>
                                                            </div>
                                                           
                                                        </asp:Panel>
                                                    </small>

                                                </div>
                                                <%--<div>
                                                    <small><b>OR</b></small>
                                                </div>--%>
                                                <div>
                                                    <small>
                                                        <b>Search RouteId:</b>
                                                        <asp:Panel ID="Panel5" runat="server" DefaultButton="btnSearchR">
                                                            <div class="routes_stats">
                                                                <div>
                                                                    <asp:TextBox ID="txtRouteId" runat="server" CssClass="TextBox1"></asp:TextBox>
                                                                    <asp:RequiredFieldValidator ID="RequiredFieldValidator4" runat="server" ControlToValidate="txtRouteId"
                                                                        Display="Dynamic" ErrorMessage="Please Enter RouteId" SetFocusOnError="True"
                                                                        ValidationGroup="SearchR">*</asp:RequiredFieldValidator>
                                                                </div>
                                                                <div>
                                                                    <asp:Button ID="btnSearchR" runat="server" CssClass="btn btn-primary ms-auto"
                                                                        Text="Search" ValidationGroup="SearchR" OnClick="btnSearchR_Click" />
                                                                </div>
                                                            </div>
                                                           
                                                        </asp:Panel>
                                                    </small>
                                                    <asp:Label ID="lblMsg" runat="server" CssClass="error" Visible="False"></asp:Label>
                                                </div>
                                            </div>

                                        </asp:Panel>
                                    </div>
                                    <div>

                                    </div>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </div>
        
            <table align="center" width="100%">
                <tr>
                    <td>
                        <table align="center" width="100%">
                            <tr>
                                <td align="center">
                                    <asp:ValidationSummary ID="ValidationSummary1" runat="server" ShowMessageBox="True"
                                        ShowSummary="False" ValidationGroup="Submit" />
                                    <asp:ValidationSummary ID="ValidationSummary2" runat="server" ShowMessageBox="True"
                                        ShowSummary="False" ValidationGroup="Search" />
                                </td>
                            </tr>
                            <tr>
                                <%--<td class="heading">Generate Dummy Roster
                                </td>--%>
                            </tr>
                            <tr>
                                <%--<td align="center">
                                    <asp:Label ID="Label2" runat="server" Font-Bold="False" Font-Overline="False" Text="Allows to Generate Dummy Tripsheet as Blank/Non-Blank."
                                        CssClass="subHeading"></asp:Label>
                                </td>--%>
                            </tr>
                            <tr>
                                <td align="center">&nbsp;
                                </td>
                            </tr>
                            <tr>
                                <%--<td align="left">
                                    <asp:RadioButtonList ID="rbtnSearchType" runat="server" AutoPostBack="True" Font-Bold="True"
                                        OnSelectedIndexChanged="rbtnSearchType_SelectedIndexChanged" RepeatDirection="Horizontal"
                                        Style="margin-left: 0px">
                                        <asp:ListItem Selected="True" Value="Blank">Blank Sheet</asp:ListItem>
                                        <asp:ListItem Value="NonBlank">With Employee</asp:ListItem>
                                    </asp:RadioButtonList>
                                </td>--%>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td>
                        <table border="0" cellpadding="4" cellspacing="0" align="left" width="90%" class="GridView">
                            <%--<tr>
                                <td align="center" class="TDbg" colspan="7">Fill The Selection Criteria
                                    <asp:Label ID="lblFacError" runat="server" CssClass="error" Text="Select Facility"
                                        Visible="False"></asp:Label>
                                    &nbsp; &nbsp; &nbsp;
                                </td>
                            </tr>--%>
                            <tr>
                                <%--<td align="right">
                                    <b>Date:</b>
                                </td>--%>
                               <%-- <td align="left" valign="middle">
                                    <asp:TextBox ID="txtStartDate" runat="server" CssClass="TextBox" OnTextChanged="txtStartDate_TextChanged" AutoPostBack="True"></asp:TextBox>
                                    <cc1:CalendarExtender ID="txtStartDate_CalendarExtender" runat="server" Enabled="True"
                                        TargetControlID="txtStartDate" PopupButtonID="ImgBtnCalendar">
                                    </cc1:CalendarExtender>
                                    <asp:ImageButton ID="ImgBtnCalendar" runat="server" ImageUrl="Images/calendar_icon.gif"
                                        Height="17px" Width="17px" />
                                    &nbsp;<asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="txtStartDate"
                                        Display="Dynamic" ErrorMessage="Start Date Required" ValidationGroup="Submit"
                                        SetFocusOnError="True">*</asp:RequiredFieldValidator><asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="txtStartDate"
                                            Display="Dynamic" ErrorMessage="Date Format:mm/dd/yyyy" ValidationExpression="^(([0]?[1-9]|1[0-2])/([0-2]?[0-9]|3[0-1])/[1-2]\d{3})? ?((([0-1]?\d)|(2[0-3])):[0-5]\d)?(:[0-5]\d)?$"
                                            ValidationGroup="Submit" SetFocusOnError="True">*</asp:RegularExpressionValidator>&nbsp;&nbsp;<br />
                                </td>--%>
                                <%--<td align="right">&nbsp; <b>Facility Name:</b>
                                </td>--%>
                                <%--<td align="left">
                                    <asp:DropDownList ID="ddlfacility" runat="server" AppendDataBoundItems="True" AutoPostBack="True"
                                        OnSelectedIndexChanged="ddlfacility_SelectedIndexChanged" CssClass="DropDownListBox3">
                                        <asp:ListItem Selected="True" Value="0">-Select-</asp:ListItem>
                                    </asp:DropDownList>
                                    <asp:CompareValidator ID="CompareValidator1" runat="server" ControlToValidate="ddlfacility"
                                        ErrorMessage="Select Facility" Operator="NotEqual" ValueToCompare="0" ValidationGroup="Submit"
                                        SetFocusOnError="True">*</asp:CompareValidator>
                                </td>--%>
                                <%--<td align="center">
                                    <asp:RadioButtonList ID="rdbtnlstType" runat="server" AutoPostBack="True" OnSelectedIndexChanged="rdbtnlstType_SelectedIndexChanged"
                                        RepeatDirection="Horizontal">
                                        <asp:ListItem Selected="True" Value="P">Pick</asp:ListItem>
                                        <asp:ListItem Value="D">Drop</asp:ListItem>
                                        <asp:ListItem Value="">None</asp:ListItem>
                                    </asp:RadioButtonList>



                                </td>--%>
                                <%--<td align="right">
                                    <b>Shift:<br />
                                    </b>
                                </td>--%>
                                <%--<td align="left">
                                    <asp:ListBox ID="lstShift" runat="server" SelectionMode="Single" AppendDataBoundItems="True">
                                        <asp:ListItem Selected="True" Value="0">-Select-</asp:ListItem>
                                    </asp:ListBox>
                                    <asp:CompareValidator ID="CompareValidator2" runat="server" ControlToValidate="lstShift"
                                        Display="Dynamic" ErrorMessage="Select ShiftTime" Operator="NotEqual" ValidationGroup="Submit"
                                        ValueToCompare="0" SetFocusOnError="True">*</asp:CompareValidator>
                                </td>--%>
                            </tr>
                            <tr>
                                <%--<td align="right"><b>Cab Type</b>
                                </td>--%>
                                <%--<td align="left">
                                    <asp:RadioButtonList ID="rdbtntype" runat="server"
                                        RepeatDirection="Horizontal">
                                        <asp:ListItem Selected="True" Value="Home">Home</asp:ListItem>
                                        <asp:ListItem Value="Station">Station</asp:ListItem>
                                    </asp:RadioButtonList>
                                    <asp:DropDownList ID="ddlcabtype" runat="server" AppendDataBoundItems="True">
                                    </asp:DropDownList>
                                </td>--%>
                                <%--<asp:Panel ID="Panel1" runat="server">
                                    <td align="right">
                                        <b>No of Sheets:</b>
                                    </td>
                                    <td align="left">
                                        <asp:TextBox ID="txtNoOfSheets" runat="server" CssClass="TextBox" MaxLength="4"></asp:TextBox>
                                        <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="txtNoOfSheets"
                                            Display="Dynamic" ErrorMessage="Enter No of Sheets" ValidationGroup="Submit"
                                            SetFocusOnError="True">*</asp:RequiredFieldValidator>
                                        <asp:RangeValidator ID="RangeValidator1" runat="server" ErrorMessage="The value must be from 1 to 100!"
                                            MaximumValue="100" MinimumValue="1" SetFocusOnError="True" Type="Integer" ValidationGroup="Submit"
                                            ControlToValidate="txtNoOfSheets" Display="Dynamic">*</asp:RangeValidator>
                                    </td>
                                    <td align="left">
                                        <asp:Button ID="btnSubmit" runat="server" OnClick="btnSubmit_Click" Text="Generate"
                                            ValidationGroup="Submit" CssClass="btn btn-primary ms-auto" />
                                    </td>
                                </asp:Panel>--%>
                                <td align="left"></td>
                                <td align="left">&nbsp;
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td>
                        <asp:Panel ID="Panel3" runat="server" Visible="False">
                            <br />
                            <table align="center" class="GridView" cellpadding="4">
                               <%-- <tr>
                                    <td align="left" class="style1">
                                        
                                    </td>
                                </tr>--%>
                                <tr>
                                    <td align="center">
                                        <b>List of to be Added Employees</b>
                                        <div class="row">
                                            <div class="col-12">
                                                <div class="card_tb p-0 overflow-hidden">
                                                    <asp:GridView ID="grdShowAddedEmp" runat="server" AutoGenerateColumns="False" CssClass="table mb-0 table-striped table-hover"
                                                        ShowFooter="True" OnPageIndexChanging="grdShowAddedEmp_PageIndexChanging">
                                                        <Columns>
                                                            <asp:TemplateField HeaderText="Employee Id">
                                                                <ItemTemplate>
                                                                    <asp:Label ID="lblEmpId" runat="server" Text='<%# Eval("empCode") %>'></asp:Label>
                                                                </ItemTemplate>
                                                            </asp:TemplateField>
                                                            <asp:TemplateField HeaderText="Employee Name">
                                                                <ItemTemplate>
                                                                    <asp:Label ID="lblEmpName" runat="server" Text='<%# Eval("empName") %>'></asp:Label>
                                                                </ItemTemplate>
                                                            </asp:TemplateField>
                                                            <asp:TemplateField HeaderText="Gender">
                                                                <ItemTemplate>
                                                                    <asp:Label ID="lblEmpFacility" runat="server" Text='<%# Eval("Gender") %>'></asp:Label>
                                                                </ItemTemplate>
                                                            </asp:TemplateField>
                                                            <asp:TemplateField HeaderText="Address" FooterStyle-HorizontalAlign="Right">
                                                                <ItemTemplate>
                                                                    <asp:Label ID="lblEmpEmail" runat="server" Text='<%# Eval("Address") %>'></asp:Label>
                                                                </ItemTemplate>
                                                                <FooterTemplate>
                                                                    <asp:Button ID="btnGenerateEmpDummy" runat="server" CssClass="btn btn-success" Text="Generate Dummy"
                                                                        ValidationGroup="Submit" OnClick="btnGenerateEmpDummy_Click" />
                                                                </FooterTemplate>
                                                                <FooterStyle HorizontalAlign="Right" />
                                                            </asp:TemplateField>
                                                        </Columns>
                                                        <%--<RowStyle CssClass="RowStyle" />
                <FooterStyle CssClass="FooterStyle" />
                <PagerStyle CssClass="PagerStyle" />
                <SelectedRowStyle CssClass="SelectedRowStyle" />
                <HeaderStyle CssClass="HeaderStyle" />
                 <EditRowStyle BackColor="#999999" />
                 <AlternatingRowStyle CssClass="AltRowStyle" />--%>
                                                    </asp:GridView>
                                                </div>
                                            </div>
                                        </div>
                                        
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                    </td>
                </tr>
                <tr>
                    <td align="left">
                        <%--<asp:Panel ID="Panel2" runat="server" Visible="False">
                            <table>
                                <tr>
                                    <td align="right">
                                        <b>Search Employee:</b>
                                    </td>
                                    <td align="left">
                                        <asp:Panel ID="Panel4" runat="server" DefaultButton="btnSearch">
                                            <asp:TextBox ID="txtEmpIdName" runat="server" CssClass="TextBox1"></asp:TextBox>
                                            <asp:RequiredFieldValidator ID="RequiredFieldValidator3" runat="server" ControlToValidate="txtEmpIdName"
                                                Display="Dynamic" ErrorMessage="Please Enter Name or Id" ValidationGroup="Search"
                                                SetFocusOnError="True">*</asp:RequiredFieldValidator>

                                            <asp:Button ID="btnSearch" runat="server" OnClick="btnSubmit_Click" Text="Search"
                                                ValidationGroup="Search" CssClass="Button" />
                                        </asp:Panel>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" colspan="2">
                                        <b>OR</b>
                                    </td>

                                </tr>
                                <tr>
                                    <td align="right">
                                        <b>Search RouteId:</b>&nbsp;</td>
                                    <td align="left">
                                        <asp:Panel ID="Panel5" runat="server" DefaultButton="btnSearchR">
                                            <asp:TextBox ID="txtRouteId" runat="server" CssClass="TextBox1"></asp:TextBox>
                                            <asp:RequiredFieldValidator ID="RequiredFieldValidator4" runat="server" ControlToValidate="txtRouteId"
                                                Display="Dynamic" ErrorMessage="Please Enter RouteId" SetFocusOnError="True"
                                                ValidationGroup="SearchR">*</asp:RequiredFieldValidator>

                                            <asp:Button ID="btnSearchR" runat="server" CssClass="Button"
                                                Text="Search" ValidationGroup="SearchR" OnClick="btnSearchR_Click" />
                                        </asp:Panel>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="right">&nbsp;</td>
                                    <td align="left">
                                        <asp:Label ID="lblMsg" runat="server" CssClass="error" Visible="False"></asp:Label>
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>--%>
                    </td>
                </tr>
                <tr>
                    <td>
                        <div class="row">
                            <div class="col-12">
                                <div class="card_tb p-0 overflow-hidden">
                                    <asp:GridView ID="GvEmployee0" runat="server" AutoGenerateColumns="False" CssClass="table mb-0 table-striped table-hover"
                                        DataKeyNames="employeeId" Width="100%" ShowFooter="True" EnableModelValidation="True">
                                        <Columns>
                                            <asp:TemplateField>
                                                <ItemTemplate>
                                                    <asp:CheckBox ID="chkTrack" runat="server" />
                                                </ItemTemplate>
                                                <ItemStyle Width="1%"></ItemStyle>
                                                <HeaderTemplate>
                                                    <asp:CheckBox ID="chkBxHeader" AutoPostBack="true" OnCheckedChanged="CheckAll" runat="server" />
                                                </HeaderTemplate>
                                            </asp:TemplateField>
                                            <asp:TemplateField HeaderText="Employee Id">
                                                <ItemTemplate>
                                                    <asp:Label ID="lblEmpId1" runat="server" Text='<%# Eval("empCode") %>'></asp:Label>
                                                </ItemTemplate>
                                                <FooterTemplate>
                                                    <asp:LinkButton ID="lkbAddEmp" runat="server" Text="Add" Font-Bold="true"
                                                        OnClick="lkbAddEmp_Click" ForeColor="White"></asp:LinkButton>
                                                </FooterTemplate>
                                            </asp:TemplateField>
                                            <asp:TemplateField HeaderText="Employee Name">
                                                <ItemTemplate>
                                                    <asp:Label ID="lblEmpName1" runat="server" Text='<%# Eval("empName") %>'></asp:Label>
                                                </ItemTemplate>
                                            </asp:TemplateField>


                                            <asp:TemplateField HeaderText="Location">
                                                <ItemTemplate>
                                                    <asp:Label ID="lblEmpEmail1" runat="server" Text='<%# Eval("Locationname") %>'></asp:Label>
                                                </ItemTemplate>
                                            </asp:TemplateField>

                                        </Columns>
                                        <%--<RowStyle CssClass="RowStyle" />
                <FooterStyle CssClass="FooterStyle" />
                <PagerStyle CssClass="PagerStyle" />
                <SelectedRowStyle CssClass="SelectedRowStyle" />
                <HeaderStyle CssClass="HeaderStyle" />
                <EditRowStyle BackColor="#999999" />
                <AlternatingRowStyle CssClass="AltRowStyle" />--%>
                                    </asp:GridView>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-12">
                                <div class="card_tb p-0 overflow-hidden">
                                    <asp:GridView ID="GvEmployee" runat="server" AutoGenerateColumns="False" CssClass="table mb-0 table-striped table-hover"
                                        DataKeyNames="Id" OnPageIndexChanging="GvEmployee_PageIndexChanging"
                                        OnSelectedIndexChanging="GvEmployee_SelectedIndexChanging" AllowPaging="True"
                                        ShowFooter="true">
                                        <Columns>
                                            <asp:CommandField SelectText="ADD" ShowSelectButton="True" />
                                            <asp:TemplateField HeaderText="Employee Id">
                                                <ItemTemplate>
                                                    <asp:Label ID="lblEmpId" runat="server" Text='<%# Eval("empCode") %>'></asp:Label>
                                                </ItemTemplate>
                                            </asp:TemplateField>
                                            <asp:TemplateField HeaderText="Employee Name">
                                                <ItemTemplate>
                                                    <asp:Label ID="lblEmpName" runat="server" Text='<%# Eval("empName") %>'></asp:Label>
                                                </ItemTemplate>
                                            </asp:TemplateField>
                                            <asp:TemplateField HeaderText="Process">
                                                <ItemTemplate>
                                                    <asp:Label ID="lblEmpProcess" runat="server" Text='<%# Eval("processName") %>'></asp:Label>
                                                </ItemTemplate>
                                            </asp:TemplateField>
                                            <asp:TemplateField HeaderText="Facility">
                                                <ItemTemplate>
                                                    <asp:Label ID="lblEmpFacility" runat="server" Text='<%# Eval("facilityName") %>'></asp:Label>
                                                </ItemTemplate>
                                            </asp:TemplateField>
                                            <asp:TemplateField HeaderText="Location">
                                                <ItemTemplate>
                                                    <asp:Label ID="lblEmpEmail" runat="server" Text='<%# Eval("PrimaryLocation") %>'></asp:Label>
                                                </ItemTemplate>
                                            </asp:TemplateField>
                                        </Columns>
                                        <%-- <RowStyle CssClass="RowStyle" />
                 <FooterStyle CssClass="FooterStyle" />
                 <PagerStyle CssClass="PagerStyle" />
                 <SelectedRowStyle CssClass="SelectedRowStyle" />
                 <HeaderStyle CssClass="HeaderStyle" />
                 <EditRowStyle BackColor="#999999" />
                 <AlternatingRowStyle CssClass="AltRowStyle" />--%>
                                    </asp:GridView>
                                </div>
                            </div>
                        </div>
                        <table >
                            <tr>
                                <td align="center">
                                    
                                    
                                   

                                    
                                </td>
                            </tr>
                            <tr>
                                <td>&nbsp;
                                </td>
                            </tr>
                            <tr>
                                <td align="center">
                                    <asp:UpdateProgress ID="UpdateProgress1" runat="server" AssociatedUpdatePanelID="UpdatePanel1"
                                        DisplayAfter="0">
                                        <ProgressTemplate>
                                            <table align="center">
                                                <tr>
                                                    <td>
                                                        <img src="images/ajax-loader.gif" style="width: 16px; height: 16px" alt="Loading" />
                                                    </td>
                                                    <td class="main_bg" align="center">Loading.....Please Wait!!!&nbsp;
                                                    </td>
                                                </tr>
                                            </table>
                                        </ProgressTemplate>
                                    </asp:UpdateProgress>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </ContentTemplate>
        <Triggers>
            <asp:PostBackTrigger ControlID="btnSubmit" />
            <asp:PostBackTrigger ControlID="grdShowAddedEmp" />
        </Triggers>
    </asp:UpdatePanel>

    <script language="javascript" type="text/javascript">
        function RedirectToNewPage() {
            alert("Welcome");
            return false;
        }
    </script>

</asp:Content>
