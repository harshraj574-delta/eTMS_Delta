<%@ Page Title="" Language="C#" MasterPageFile="~/eTMSMaster.Master" AutoEventWireup="true"
    CodeFile="ReplicationException.aspx.cs" Inherits="ReplicationException" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="Server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="Server">
    <asp:UpdatePanel runat="server" ID="UpdatePanel1">
        <ContentTemplate>
            <span class="fs-16 fw-semibold mb-3 d-block">Exceptions for Replicated Routes.</span>
            <span class="fs-16 fw-semibold mb-3 d-block">Allows to Delete/Make a New Route for Employees in Replicated Routes.</span>
            
            <div>&nbsp;</div>

            

            <div class="row">
                <div class="col-lg-12">
                    <div class="row">
                        <div class="col d-flex align-items-stretch">
                            <div class="cardx p-3 w-100">
                                <span class="fs-16 fw-semibold mb-3 d-block">Fill the Selection Creiteria</span>
                                <div class="routes_stats">
                                    <div>
                                        <p><b>Date</b></p>
                                        <asp:TextBox ID="txtStartDate" runat="server" CssClass="TextBox"></asp:TextBox>
                                        <cc1:CalendarExtender ID="txtStartDate_CalendarExtender" runat="server" Enabled="True"
                                            TargetControlID="txtStartDate" PopupButtonID="ImgBtnCalendar">
                                        </cc1:CalendarExtender>
                                        <asp:ImageButton ID="ImgBtnCalendar" runat="server" ImageUrl="Images/calendar_icon.gif"
                                            Height="17px" Width="17px" /><br />
                                        <i>(mm/dd/yyyy)</i> &nbsp;<asp:RequiredFieldValidator ID="RequiredFieldValidator1"
                                            runat="server" ControlToValidate="txtStartDate" Display="Dynamic" ErrorMessage="Start Date Required"
                                            ValidationGroup="order" SetFocusOnError="True">*</asp:RequiredFieldValidator>
                                        <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="txtStartDate"
                                            Display="Dynamic" ErrorMessage="Date Format:mm/dd/yyyy" ValidationExpression="^(([0]?[1-9]|1[0-2])/([0-2]?[0-9]|3[0-1])/[1-2]\d{3})? ?((([0-1]?\d)|(2[0-3])):[0-5]\d)?(:[0-5]\d)?$"
                                            ValidationGroup="order" SetFocusOnError="True">*</asp:RegularExpressionValidator>
                                        <asp:CompareValidator ID="CompareValidator3" ControlToValidate="txtStartDate" Operator="GreaterThanEqual"
                                            Type="Date" runat="server" ErrorMessage="Date must be greater than equal to current date"
                                            ValidationGroup="order" Enabled="false" Display="Dynamic">*</asp:CompareValidator>
                                    </div>
                                    <div>
                                        <p><b>Facility Name</b></p>
                                        <asp:DropDownList ID="ddlfacility" runat="server" AppendDataBoundItems="True" AutoPostBack="True"
                                            OnSelectedIndexChanged="ddlfacility_SelectedIndexChanged" CssClass="DropDownListBox3">
                                            <asp:ListItem Selected="True" Value="0">Select Facility</asp:ListItem>
                                        </asp:DropDownList>
                                        <asp:CompareValidator ID="CompareValidator1" runat="server" ControlToValidate="ddlfacility"
                                            ErrorMessage="Select Facility" Operator="NotEqual" ValueToCompare="0" ValidationGroup="order"
                                            SetFocusOnError="True">*</asp:CompareValidator>
                                    </div>
                                    <div>
                                        <p><b>Trip type</b></p>
                                        <asp:DropDownList ID="rdbtnlstType" runat="server" AutoPostBack="True" RepeatDirection="Horizontal"
                                            OnSelectedIndexChanged="rdbtnlstType_SelectedIndexChanged">
                                            <asp:ListItem Selected="True" Value="P">Pick</asp:ListItem>
                                            <asp:ListItem Value="D">Drop</asp:ListItem>
                                        </asp:DropDownList>
                                    </div>
                                    <div>
                                        <p><b>Shift</b></p>
                                        <asp:ListBox ID="lstShift" runat="server" AppendDataBoundItems="True" SelectionMode="Multiple">
                                            <asp:ListItem Selected="True" Value="0">-Select-</asp:ListItem>
                                        </asp:ListBox>
                                        <asp:CompareValidator ID="CompareValidator2" runat="server" ControlToValidate="lstShift"
                                            Display="Dynamic" ErrorMessage="Select ShiftTime" Operator="NotEqual" ValidationGroup="order"
                                            ValueToCompare="0" SetFocusOnError="True">*</asp:CompareValidator>
                                    </div>
                                    <div>
                                        <p><b>&nbsp;</b></p>
                                        <asp:Button ID="btnSubmit" runat="server" OnClick="btnSubmit_Click" Text="Submit"
                                            ValidationGroup="order" CssClass="btn btn-primary ms-auto" />
                                    </div>
                                    
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <table align="center" width="100%" cellpadding="4" cellspacing="2">
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
                <%--<tr>
                    <td class="heading">Exceptions for Replicated Routes.
                    </td>
                </tr>--%>
                <%--<tr>
                    <td class="subHeading">Allows to Delete/Make a New Route for Employees in Replicated Routes.
                    </td>
                </tr>--%>
                <tr>
                    <td>
                        <asp:UpdateProgress ID="UpdateProgress1" runat="server" AssociatedUpdatePanelID="UpdatePanel1"
                            DisplayAfter="0" DynamicLayout="False">
                            <ProgressTemplate>
                                <table align="center">
                                    <tr>
                                        <td>
                                            <img src="images/ajax-loader.gif" style="width: 16px; height: 16px" alt="Loading" />
                                        </td>
                                        <td class="main_bg" align="left">Loading.....Please Wait!!!
                                        </td>
                                    </tr>
                                </table>
                            </ProgressTemplate>
                        </asp:UpdateProgress>
                        <table border="1" cellpadding="4" cellspacing="1" align="center" width="80%" style="border-collapse: collapse">
                            <%--<tr>
                                <td align="center" class="TDbg" colspan="5">Fill the Selection Creiteria
                                </td>
                            </tr>--%>
                            <%--<tr align="left" style="font-weight: bold">
                                <td>Date
                                </td>
                                <td>Facility Name
                                </td>
                                <td>Trip Type
                                </td>
                                <td>Shift
                                </td>
                                <td>&nbsp;
                                </td>
                            </tr>--%>
                            <tr>
                                <%--<td align="left" valign="middle">
                                    <asp:TextBox ID="txtStartDate" runat="server" CssClass="TextBox"></asp:TextBox>
                                    <cc1:CalendarExtender ID="txtStartDate_CalendarExtender" runat="server" Enabled="True"
                                        TargetControlID="txtStartDate" PopupButtonID="ImgBtnCalendar">
                                    </cc1:CalendarExtender>
                                    <asp:ImageButton ID="ImgBtnCalendar" runat="server" ImageUrl="Images/calendar_icon.gif"
                                        Height="17px" Width="17px" /><br />
                                    <i>(mm/dd/yyyy)</i> &nbsp;<asp:RequiredFieldValidator ID="RequiredFieldValidator1"
                                        runat="server" ControlToValidate="txtStartDate" Display="Dynamic" ErrorMessage="Start Date Required"
                                        ValidationGroup="order" SetFocusOnError="True">*</asp:RequiredFieldValidator>
                                    <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="txtStartDate"
                                        Display="Dynamic" ErrorMessage="Date Format:mm/dd/yyyy" ValidationExpression="^(([0]?[1-9]|1[0-2])/([0-2]?[0-9]|3[0-1])/[1-2]\d{3})? ?((([0-1]?\d)|(2[0-3])):[0-5]\d)?(:[0-5]\d)?$"
                                        ValidationGroup="order" SetFocusOnError="True">*</asp:RegularExpressionValidator>
                                    <asp:CompareValidator ID="CompareValidator3" ControlToValidate="txtStartDate" Operator="GreaterThanEqual"
                                        Type="Date" runat="server" ErrorMessage="Date must be greater than equal to current date"
                                        ValidationGroup="order" Enabled="false" Display="Dynamic">*</asp:CompareValidator>
                                </td>--%>
                                <%--<td align="left" valign="middle">
                                    <asp:DropDownList ID="ddlfacility" runat="server" AppendDataBoundItems="True" AutoPostBack="True"
                                        OnSelectedIndexChanged="ddlfacility_SelectedIndexChanged" CssClass="DropDownListBox3">
                                        <asp:ListItem Selected="True" Value="0">Select Facility</asp:ListItem>
                                    </asp:DropDownList>
                                    <asp:CompareValidator ID="CompareValidator1" runat="server" ControlToValidate="ddlfacility"
                                        ErrorMessage="Select Facility" Operator="NotEqual" ValueToCompare="0" ValidationGroup="order"
                                        SetFocusOnError="True">*</asp:CompareValidator>
                                </td>--%>
                                <%--<td align="left" valign="middle">
                                    <asp:RadioButtonList ID="rdbtnlstType" runat="server" AutoPostBack="True" RepeatDirection="Horizontal"
                                        OnSelectedIndexChanged="rdbtnlstType_SelectedIndexChanged">
                                        <asp:ListItem Selected="True" Value="P">Pick</asp:ListItem>
                                        <asp:ListItem Value="D">Drop</asp:ListItem>
                                    </asp:RadioButtonList>
                                </td>--%>
                                <%--<td align="left" valign="middle">
                                    <asp:ListBox ID="lstShift" runat="server" AppendDataBoundItems="True" SelectionMode="Multiple">
                                        <asp:ListItem Selected="True" Value="0">-Select-</asp:ListItem>
                                    </asp:ListBox>
                                    <asp:CompareValidator ID="CompareValidator2" runat="server" ControlToValidate="lstShift"
                                        Display="Dynamic" ErrorMessage="Select ShiftTime" Operator="NotEqual" ValidationGroup="order"
                                        ValueToCompare="0" SetFocusOnError="True">*</asp:CompareValidator>
                                </td>--%>
                                <%--<td align="center" valign="middle">
                                    <asp:Button ID="btnSubmit" runat="server" OnClick="btnSubmit_Click" Text="Submit"
                                        ValidationGroup="order" CssClass="Button" />
                                </td>--%>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            <asp:MultiView ID="MultiView1" runat="server">
                <asp:View ID="View1" runat="server">
                    <table align="center" width="100%">
                        <tr><td align="center"> <asp:Button ID="btnAllAtonce" runat="server"  Text="One Click : Delete All  | Auto Allocate All | Make New Route"
                                        CssClass="btn btn-primary ms-auto" OnClick="btnAllAtonce_Click" Visible="False" Width="450px" /></td></tr>
                        
                        <tr>
                            <td align="center">&nbsp;<asp:Label ID="lblDelData" runat="server" Font-Bold="True" Text="Employee List For Deletion in Routes"
                                Visible="true"></asp:Label>
                            </td>
                        </tr>
                        <tr>
                            <td align="center">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="card_tb p-0 overflow-hidden">
                                            <asp:GridView ID="gvDeleteData" runat="server" AllowSorting="True" CssClass="table mb-0 table-striped table-hover"
                                                AutoGenerateColumns="False" CellPadding="0" EmptyDataText="No Record Found!"
                                                DataKeyNames="EmpId" OnPageIndexChanging="gvDeleteData_PageIndexChanging" ShowFooter="True"
                                                PageSize="20" BorderWidth="0px" OnRowDataBound="gvDeleteData_RowDataBound" EnableModelValidation="True">
                                                <Columns>
                                                    <asp:BoundField DataField="RouteID" HeaderText="Route ID">
                                                        <ItemStyle Width="10%"></ItemStyle>
                                                    </asp:BoundField>
                                                    <asp:BoundField DataField="shifttime" HeaderText="Shift">
                                                        <ItemStyle Width="5%"></ItemStyle>
                                                    </asp:BoundField>
                                                    <asp:BoundField DataField="empCode" HeaderText="Employee ID">
                                                        <ItemStyle Width="12%"></ItemStyle>
                                                    </asp:BoundField>
                                                    <asp:BoundField DataField="EmpName" HeaderText="Employee Name">
                                                        <ItemStyle Width="10%"></ItemStyle>
                                                    </asp:BoundField>
                                                    <asp:BoundField DataField="ProcessName" HeaderText="Process">
                                                        <ItemStyle Width="10%"></ItemStyle>
                                                    </asp:BoundField>
                                                    <asp:BoundField DataField="mobile" HeaderText="Mobile">
                                                        <ItemStyle Width="10%"></ItemStyle>
                                                    </asp:BoundField>
                                                    <asp:BoundField DataField="stopNo" HeaderText="StopNo">
                                                        <ItemStyle Width="5%"></ItemStyle>
                                                    </asp:BoundField>
                                                    <asp:BoundField DataField="address" HeaderText="Location">
                                                        <ItemStyle Width="30%"></ItemStyle>
                                                    </asp:BoundField>
                                                    <asp:TemplateField HeaderText="Reason">
                                                        <ItemTemplate>
                                                            <asp:Label ID="Label1" runat="server" Text='<%# Bind("Reason") %>'></asp:Label>
                                                        </ItemTemplate>
                                                        <ItemStyle Width="10%" />
                                                        <FooterTemplate>
                                                        </FooterTemplate>
                                                    </asp:TemplateField>
                                                    <asp:TemplateField HeaderText="Track">
                                                        <ItemTemplate>
                                                            <asp:CheckBox ID="chkTrack" runat="server" />
                                                        </ItemTemplate>
                                                        <ItemStyle Width="3%"></ItemStyle>
                                                        <HeaderTemplate>
                                                            <asp:CheckBox ID="chkBxHeader" AutoPostBack="true" OnCheckedChanged="CheckAll" runat="server" />
                                                        </HeaderTemplate>
                                                        <FooterTemplate>
                                                            &nbsp;<asp:ImageButton ID="ibDeleteData" runat="server" ImageUrl="~/images/remove.png"
                                                                OnClick="ibDelete_Click" ToolTip="Delete Selected" />
                                                            <cc1:ConfirmButtonExtender ID="ConfirmButton_ibDelete" TargetControlID="ibDeleteData"
                                                                runat="server" ConfirmOnFormSubmit="False" ConfirmText="Are you sure you want to delete the selected employee?">
                                                            </cc1:ConfirmButtonExtender>
                                                        </FooterTemplate>
                                                    </asp:TemplateField>
                                                </Columns>
                                                <%--<RowStyle CssClass="RowStyle" />
    <FooterStyle CssClass="FooterStyle" />
    <PagerStyle CssClass="PagerStyle" />
    <SelectedRowStyle CssClass="SelectedRowStyle" />
    <HeaderStyle CssClass="HeaderStyle" />
    <EditRowStyle BackColor="#999999" />
    <AlternatingRowStyle CssClass="AltRowStyle" />
    <EmptyDataRowStyle ForeColor="Red" Font-Bold="true" />--%>
                                            </asp:GridView>
                                        </div>
                                    </div>
                                </div>
                                
                            </td>
                        </tr>
                        <tr>
                            <td align="center">&nbsp;
                                        <asp:Button ID="btnexport1" runat="server" Visible="false" CssClass="btn btn-primary ms-auto" Text="Export To Excel" OnClick="btnexport1_Click" />
                            </td>
                        </tr>
                        <tr>
                            <td>&nbsp;</td>
                        </tr>
                        <tr>
                            <td align="center">
                                <asp:Label ID="lblAddData" runat="server" Font-Bold="True" Text="Employee List For Addition in Routes"
                                    Visible="true"></asp:Label>
                                <br />
                                <asp:Label ID="lblmsg" runat="server" Font-Bold="True" ForeColor="Red" Visible="False"></asp:Label>
                            </td>
                        </tr>
                        <tr>
                            <td align="center">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="card_tb p-0 overflow-hidden">
                                            <asp:GridView ID="gvAddData" runat="server" AllowSorting="True" CssClass="table mb-0 table-striped table-hover"
                                                AutoGenerateColumns="False" CellPadding="0" EmptyDataText="No Record Found!"
                                                DataKeyNames="Id" OnPageIndexChanging="gvAddData_PageIndexChanging" ShowFooter="True"
                                                PageSize="20" BorderWidth="0px" OnRowDataBound="gvAddData_RowDataBound" EnableModelValidation="True">
                                                <Columns>
                                                    <asp:TemplateField HeaderText="RequestID">
                                                        <ItemTemplate>
                                                            <asp:Label ID="lblrequest" runat="server" Text='<%#Eval("adhocid") %>'></asp:Label>
                                                        </ItemTemplate>
                                                        <ItemStyle Width="2%" />
                                                    </asp:TemplateField>
                                                    <asp:BoundField DataField="empCode" HeaderText="Employee ID">
                                                        <ItemStyle HorizontalAlign="Left" />
                                                    </asp:BoundField>
                                                    <asp:BoundField DataField="EmpName" HeaderText="Employee Name">
                                                        <ItemStyle HorizontalAlign="Left" />
                                                    </asp:BoundField>
                                                    <asp:BoundField DataField="ProcessName" HeaderText="Process">
                                                        <ItemStyle HorizontalAlign="Left" />
                                                    </asp:BoundField>
                                                    <asp:BoundField DataField="mobile" HeaderText="Mobile">
                                                        <ItemStyle HorizontalAlign="Left" />
                                                    </asp:BoundField>
                                                    <asp:BoundField DataField="Location" HeaderText="Location">
                                                        <ItemStyle HorizontalAlign="Left" />
                                                    </asp:BoundField>
                                                    <asp:TemplateField HeaderText="Shift">
                                                        <ItemTemplate>
                                                            <asp:Label ID="lblgridShift" runat="server" Text='<%#Eval("shift") %>'></asp:Label>
                                                        </ItemTemplate>
                                                        <FooterTemplate>
                                                            <%--&nbsp;<asp:ImageButton ID="ibaligndata" runat="server" ImageUrl="~/images/user_add.png"
                    ToolTip="Align to the routes" Height="26px" Width="27px" OnClick="ibaligndata_Click" />--%>


                                                            <asp:Button ID="ibAutoAllocation" Text="Auto Allocation"
                                                                runat="server" CssClass="btn btn-primary ms-auto" OnClick="ibAutoAllocation_Click" />

                                                        </FooterTemplate>
                                                        <ControlStyle Width="5%" />
                                                        <ItemStyle HorizontalAlign="Center" Width="5%" />
                                                    </asp:TemplateField>
                                                    <asp:TemplateField HeaderText="Type">
                                                        <EditItemTemplate>
                                                            <asp:TextBox ID="TextBox1" runat="server" Text='<%# Bind("stype") %>'></asp:TextBox>
                                                        </EditItemTemplate>
                                                        <ItemTemplate>
                                                            <asp:Label ID="Label1" runat="server" Text='<%# Bind("stype") %>'></asp:Label>
                                                        </ItemTemplate>
                                                        <ItemStyle HorizontalAlign="Left" />
                                                        <FooterTemplate>
                                                            <asp:Button ID="ibaligndata" OnClick="ibaligndata_Click" Width="80" Text=" Align "
                                                                runat="server" CssClass="btn btn-primary ms-auto" />
                                                        </FooterTemplate>
                                                    </asp:TemplateField>
                                                    <asp:TemplateField HeaderText="Track">
                                                        <FooterTemplate>
                                                            <%--&nbsp;<asp:ImageButton ID="ibAddData" Height="26px" Width="27px" runat="server" ImageUrl="~/images/MakeNewRoute.png"
                    OnClick="ibAddData_Click" ToolTip="Make A New route" />--%>
                                                            <asp:Button ID="ibAddData" runat="server" CssClass="btn btn-primary ms-auto" OnClick="ibAddData_Click" Text=" New " Width="80" />
                                                            <cc1:ConfirmButtonExtender ID="ConfirmButton_ibAdd" runat="server" ConfirmOnFormSubmit="True" ConfirmText="Are you sure you want to make a new route for selected employee?" TargetControlID="ibAddData">
                                                            </cc1:ConfirmButtonExtender>
                                                        </FooterTemplate>
                                                        <HeaderTemplate>
                                                            <asp:CheckBox ID="chkBxHeader" runat="server" AutoPostBack="true" OnCheckedChanged="CheckAllAdd" />
                                                        </HeaderTemplate>
                                                        <ItemTemplate>
                                                            <asp:CheckBox ID="chkTrack" runat="server" />
                                                        </ItemTemplate>
                                                        <ControlStyle Width="5%" />
                                                        <ItemStyle HorizontalAlign="Center" Width="5%" />
                                                    </asp:TemplateField>
                                                </Columns>
                                                <%--<RowStyle CssClass="RowStyle" />
    <FooterStyle CssClass="FooterStyle" />
    <PagerStyle CssClass="PagerStyle" />
    <SelectedRowStyle CssClass="SelectedRowStyle" />
    <HeaderStyle CssClass="HeaderStyle" />
    <EditRowStyle BackColor="#999999" />
    <AlternatingRowStyle CssClass="AltRowStyle" />
    <EmptyDataRowStyle ForeColor="Red" Font-Bold="true" />--%>
                                            </asp:GridView>
                                        </div>
                                    </div>
                                </div>
                                
                            </td>
                        </tr>
                        <tr>
                            <td align="center">
                                <asp:Button ID="btnexport2" runat="server" Visible="false" CssClass="btn btn-primary ms-auto" Text="Export To Excel" OnClick="btnexport2_Click" />
                            </td>
                        </tr>
                    </table>
                </asp:View>
            </asp:MultiView>
            <asp:MultiView ID="MultiView2" runat="server">
                <asp:View ID="View2" runat="server">
                    <center>
                        <asp:Panel ID="Panel1" runat="server" ScrollBars="vertical" Height="80%" Width="100%">
                            <table>
                                <tr>
                                    <td align="right" bgcolor="blue">
                                        <asp:ImageButton ID="btnClose" runat="server" ImageUrl="~/images/no_icon.jpg" OnClick="btnClose_Click" />
                                    </td>
                                </tr>
                                <tr align="center">
                                    <td align="center">
                                        <asp:Label ID="lblAssignEmpID" runat="server" Text="" Visible="false"></asp:Label>
                                        <asp:GridView ID="grdRoutes" Width="100%" runat="server" AutoGenerateColumns="false"
                                            CssClass="GridView">
                                            <Columns>
                                                <asp:TemplateField HeaderText="RouteID">
                                                    <ItemTemplate>
                                                        <asp:Label ID="lblRouteID" runat="server" Text='<%#Eval("RouteID") %>'></asp:Label>
                                                    </ItemTemplate>
                                                </asp:TemplateField>
                                                <asp:TemplateField HeaderText="Shift Time">
                                                    <ItemTemplate>
                                                        <asp:Label ID="lblShiftTime" runat="server" Text='<%#Eval("ShiftTime") %>'></asp:Label>
                                                    </ItemTemplate>
                                                </asp:TemplateField>
                                                <asp:TemplateField HeaderText="Location">
                                                    <ItemTemplate>
                                                        <asp:Label ID="lblAddress" runat="server" Text='<%#Eval("Location") %>'></asp:Label>
                                                    </ItemTemplate>
                                                </asp:TemplateField>
                                                <asp:BoundField DataField="vehicleid" HeaderText="CabID" />
                                                <asp:TemplateField HeaderText="Total Stop">
                                                    <ItemTemplate>
                                                        <asp:Label ID="lblTotalStop" runat="server" Text='<%#Eval("totalstop") %>'></asp:Label>
                                                    </ItemTemplate>
                                                </asp:TemplateField>
                                                <asp:TemplateField HeaderText="Action">
                                                    <ItemTemplate>
                                                        <asp:LinkButton ID="lbRouteAssign" Text="Assign" runat="server" OnClick="lbRouteAssign_Click"></asp:LinkButton>
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
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                    </center>
                    <asp:Button ID="Button2" runat="server" Style="visibility: hidden" />
                    <cc1:ModalPopupExtender ID="ModalPopupExtender1" runat="server" Enabled="True" BackgroundCssClass="modalBackground"
                        TargetControlID="Button2" PopupControlID="Panel1" DropShadow="false">
                    </cc1:ModalPopupExtender>
                </asp:View>
            </asp:MultiView>
            <asp:MultiView ID="MultiView3" runat="server">
                <asp:View ID="View3" runat="server">
                    <center>
                        <asp:Panel ID="Panel2" runat="server" ScrollBars="None" Width="80%" Height="80%"
                            BackColor="#333333" BorderStyle="Solid" BorderColor="#333333" BorderWidth="2px">
                            <table cellpadding="0" width="100%" cellspacing="0" style="border-collapse: collapse">
                                <tr>
                                    <td align="left" bgcolor="blue" height="25" class="TDbg" valign="middle">&nbsp;Align and club employees in selected routes.
                                    </td>
                                    <td align="right" bgcolor="blue" height="25" class="TDbg" valign="middle">
                                        <asp:ImageButton ID="ImageButton1" runat="server" ImageUrl="~/images/Exit.jpg" OnClick="btnClose_Click" />&nbsp;
                                    </td>
                                </tr>
                            </table>
                            <asp:Panel ID="Panel3" runat="server" ScrollBars="Vertical" Width="100%" Height="100%">
                                <asp:GridView ID="grdViewRouteParent" runat="server" AutoGenerateColumns="False"
                                    DataKeyNames="RouteID" Width="100%" EmptyDataText="No record found" CssClass="GridView"
                                    ShowFooter="True" OnRowDataBound="grdViewRouteParent_RowDataBound">
                                    <Columns>
                                        <asp:TemplateField HeaderText="RouteID" ItemStyle-Width="10%" SortExpression="RouteID">
                                            <ItemTemplate>
                                                <asp:ImageButton ID="ibViewRouteID" runat="server" ImageUrl="images/plus.gif" OnClick="ibViewRouteID_Click" />
                                                <asp:Label ID="lblRouteID" runat="server" Text='<%# Bind("RouteID") %>'></asp:Label>
                                            </ItemTemplate>
                                            <ItemStyle Width="10%"></ItemStyle>
                                        </asp:TemplateField>
                                        <asp:TemplateField HeaderText="Address" SortExpression="Address">
                                            <ItemTemplate>
                                                <asp:Label ID="Label2" runat="server" Text='<%# Bind("Address") %>'></asp:Label>
                                            </ItemTemplate>
                                            <ItemStyle Width="20%" />
                                            <FooterTemplate>
                                                <asp:Label ID="lblParentErrorMsg" runat="server" Font-Bold="True" Font-Size="Small"
                                                    ForeColor="Red"></asp:Label>
                                            </FooterTemplate>
                                        </asp:TemplateField>
                                        <asp:BoundField DataField="Colony" HeaderText="Location" ReadOnly="True" ItemStyle-Width="5%"
                                            SortExpression="Colony">
                                            <ItemStyle Width="15%"></ItemStyle>
                                        </asp:BoundField>
                                        <asp:BoundField DataField="Zone" HeaderText="Zone" ReadOnly="True" ItemStyle-Width="5%"
                                            SortExpression="Zone">
                                            <ItemStyle Width="1%"></ItemStyle>
                                        </asp:BoundField>
                                        <asp:TemplateField HeaderText="Stop">
                                            <ItemTemplate>
                                                <asp:Label ID="lblTotalStopMain" runat="server" Text='<%#Eval("totalstop") %>'></asp:Label>
                                            </ItemTemplate>
                                            <ItemStyle Width="1%"></ItemStyle>
                                        </asp:TemplateField>
                                        <asp:BoundField DataField="shiftTime" HeaderText="Shift" ReadOnly="True" ItemStyle-Width="1%">
                                            <ItemStyle Width="1%"></ItemStyle>
                                        </asp:BoundField>
                                        <asp:BoundField DataField="vendorName" HeaderText="vendorName" ReadOnly="True" ItemStyle-Width="1%"
                                            SortExpression="vendorName">
                                            <ItemStyle Width="1%"></ItemStyle>
                                        </asp:BoundField>
                                        <%-- <asp:BoundField DataField="vehicleNo" HeaderText="CabID" ReadOnly="True" ItemStyle-Width="2%"
                                            SortExpression="vehicleNo">
                                            <ItemStyle Width="2%"></ItemStyle>
                                        </asp:BoundField>
                                        <asp:BoundField DataField="totalDist" HeaderText="KM" ReadOnly="True" ItemStyle-Width="1%"
                                            SortExpression="totalDist">
                                            <ItemStyle Width="1%"></ItemStyle>
                                        </asp:BoundField>--%>
                                        <asp:TemplateField HeaderText="Action" ItemStyle-Width="1%">
                                            <ItemTemplate>
                                                <asp:LinkButton ID="lbRouteAssignMain" Text="Assign" runat="server" OnClick="lbRouteAssignMain_Click"></asp:LinkButton>
                                            </ItemTemplate>
                                            <ItemStyle Width="1%" />
                                        </asp:TemplateField>
                                        <asp:TemplateField HeaderText="" ItemStyle-Width=".5%">
                                            <ItemTemplate>
                                                <tr>
                                                    <td colspan="8" align="center">
                                                        <asp:UpdatePanel ID="UpdatePanel3" runat="server">
                                                            <ContentTemplate>
                                                                <asp:GridView ID="grdViewRouteChild" runat="server" CssClass="Childgrid" AutoGenerateColumns="False"
                                                                    Width="95%" Visible="False" ShowFooter="True" DataKeyNames="routeid,id,shiftdate"
                                                                    OnRowDataBound="grdViewRouteChild_RowDataBound" CellPadding="2">
                                                                    <Columns>
                                                                        <asp:TemplateField HeaderText="Employee Detail">
                                                                            <ItemTemplate>
                                                                                <%# Eval("empCode") %>
                                                                                -
                                                                                <%# Eval("EmpName") %>
                                                                            </ItemTemplate>
                                                                            <ItemStyle Width="20%"></ItemStyle>
                                                                        </asp:TemplateField>
                                                                        <asp:TemplateField HeaderText="G">
                                                                            <ItemTemplate>
                                                                                <asp:Label ID="Label2" runat="server" Text='<%# Bind("Gender") %>'></asp:Label>
                                                                            </ItemTemplate>
                                                                            <ItemStyle Width="1%"></ItemStyle>
                                                                            <FooterTemplate>
                                                                            </FooterTemplate>
                                                                        </asp:TemplateField>
                                                                        <asp:TemplateField HeaderText="address">
                                                                            <ItemTemplate>
                                                                                <asp:Label ID="Label1" runat="server" Text='<%# Bind("address") %>'></asp:Label>
                                                                            </ItemTemplate>
                                                                            <ItemStyle Width="45%"></ItemStyle>
                                                                            <FooterTemplate>
                                                                                <asp:Label ID="lblChildErrorMsg" runat="server" Font-Bold="True" Font-Size="Small"
                                                                                    ForeColor="#FF9966"></asp:Label>
                                                                            </FooterTemplate>
                                                                        </asp:TemplateField>
                                                                        <asp:BoundField DataField="Shift" HeaderText="Shift" ItemStyle-Width="1%">
                                                                            <ItemStyle Width="1%" />
                                                                        </asp:BoundField>
                                                                        <asp:BoundField DataField="tripType" HeaderText="" ItemStyle-Width="1%">
                                                                            <ItemStyle Width="1%" />
                                                                        </asp:BoundField>
                                                                        <asp:TemplateField HeaderText="SNo">
                                                                            <ItemTemplate>
                                                                                <asp:TextBox ID="txtstopNo" Text='<%# Eval("stopNo")%>' runat="server" Height="12px"
                                                                                    Width="15px" MaxLength="2" TabIndex="1"></asp:TextBox>
                                                                            </ItemTemplate>
                                                                            <ItemStyle Width="1%"></ItemStyle>
                                                                        </asp:TemplateField>
                                                                        <asp:TemplateField HeaderText="ETA" SortExpression="ETA">
                                                                            <ItemTemplate>
                                                                                <div style="width: 50px;">
                                                                                    <asp:TextBox ID="txtETAhh" Text='<%# Eval("ETAhh")%>' runat="server" CssClass="TextBox"
                                                                                        Width="15px" MaxLength="2" TabIndex="2"></asp:TextBox>
                                                                                    <asp:TextBox ID="txtETAmm" Text='<%# Eval("ETAmm")%>' runat="server" CssClass="TextBox"
                                                                                        Width="15px" MaxLength="2" TabIndex="2"></asp:TextBox>
                                                                                </div>
                                                                            </ItemTemplate>
                                                                            <FooterTemplate>
                                                                                <asp:ImageButton ID="ibUpdateStopNo" runat="server" ImageUrl="~/images/save.png"
                                                                                    ToolTip="Update Stop No & ETA" CommandName="UpdateStopNo" OnClick="ibUpdateStopNo_Click"
                                                                                    TabIndex="2" />
                                                                            </FooterTemplate>
                                                                            <ItemStyle Width="1%"></ItemStyle>
                                                                        </asp:TemplateField>
                                                                        <asp:TemplateField HeaderText="">
                                                                            <ItemTemplate>
                                                                                <asp:CheckBox ID="chkBxEmployeeID" runat="server" />
                                                                            </ItemTemplate>
                                                                            <ItemStyle Width="2%"></ItemStyle>
                                                                            <FooterTemplate>
                                                                                <asp:ImageButton ID="ImbtAddNewRoute" runat="server" CausesValidation="false" ImageAlign="AbsMiddle"
                                                                                    ImageUrl="~/images/MakeNewRoute.png" ToolTip="Make a New Route" OnClick="ImbtAddNewRoute_Click" />
                                                                            </FooterTemplate>
                                                                        </asp:TemplateField>
                                                                        <asp:TemplateField HeaderText="">
                                                                            <ItemTemplate>
                                                                                <asp:ImageButton ID="ibPasteEmployee" runat="server" ImageUrl="~/images/Move.png"
                                                                                    ToolTip="Move Employee" ValidationGroup="Update" OnClick="ibPasteEmployee_Click" />
                                                                            </ItemTemplate>
                                                                            <ItemStyle Width="2%"></ItemStyle>
                                                                        </asp:TemplateField>
                                                                    </Columns>
                                                                    <RowStyle BackColor="#E7E7FF" HorizontalAlign="Left" />
                                                                    <AlternatingRowStyle BackColor="#F7F7F7" BorderColor="Black" HorizontalAlign="Left" />
                                                                    <PagerStyle BackColor="#E7E7FF" HorizontalAlign="Right" />
                                                                    <HeaderStyle CssClass="ChildgridHeaderStyle" />
                                                                    <FooterStyle CssClass="ChildgridFooterStyle" />
                                                                </asp:GridView>
                                                            </ContentTemplate>
                                                        </asp:UpdatePanel>
                                                    </td>
                                                </tr>
                                            </ItemTemplate>
                                            <ItemStyle Width="1%"></ItemStyle>
                                        </asp:TemplateField>
                                    </Columns>
                                    <RowStyle CssClass="RowStyle" />
                                    <PagerStyle CssClass="PagerStyle" />
                                    <SelectedRowStyle CssClass="SelectedRowStyle" />
                                    <HeaderStyle CssClass="HeaderStyle" />
                                    <EditRowStyle CssClass="EditRowStyle" />
                                    <AlternatingRowStyle CssClass="AltRowStyle" />
                                    <FooterStyle CssClass="FooterStyle" />
                                    <EmptyDataRowStyle ForeColor="Red" Font-Bold="true" HorizontalAlign="Left" />
                                </asp:GridView>
                            </asp:Panel>
                        </asp:Panel>
                    </center>
                    <asp:Button ID="btnhide" runat="server" Style="visibility: hidden" />
                    <cc1:ModalPopupExtender ID="ModalPopupExtender2" runat="server" Enabled="True" BackgroundCssClass="modalBackground"
                        TargetControlID="btnhide" PopupControlID="Panel2" DropShadow="false">
                    </cc1:ModalPopupExtender>
                </asp:View>
            </asp:MultiView>
            <asp:MultiView ID="MultiView4" runat="server">
                <asp:View ID="View4" runat="server">
                    <asp:GridView ID="GridView1" runat="server"
                        AutoGenerateColumns="False" Width="99%" EmptyDataText="No Record Found!"
                        BorderWidth="0">
                        <Columns>
                            <asp:BoundField DataField="RouteID" HeaderText="Route ID"></asp:BoundField>
                            <asp:BoundField DataField="empCode" HeaderText="Employee ID"></asp:BoundField>
                            <asp:BoundField DataField="EmpName" HeaderText="Employee Name"></asp:BoundField>
                            <asp:BoundField DataField="ProcessName" HeaderText="Process"></asp:BoundField>
                            <asp:BoundField DataField="mobile" HeaderText="Mobile"></asp:BoundField>
                            <asp:BoundField DataField="stopNo" HeaderText="StopNo"></asp:BoundField>
                            <asp:BoundField DataField="address" HeaderText="Location"></asp:BoundField>
                            <asp:BoundField DataField="Reason" HeaderText="Reason"></asp:BoundField>
                        </Columns>
                    </asp:GridView>
                    <asp:GridView ID="GridView2" runat="server"
                        AutoGenerateColumns="False" Width="99%" EmptyDataText="No Record Found!">
                        <Columns>
                            <asp:TemplateField HeaderText="RequestID">
                                <ItemTemplate>
                                    <asp:Label ID="lblrequest" runat="server" Text='<%#Eval("adhocid") %>'></asp:Label>
                                </ItemTemplate>
                            </asp:TemplateField>
                            <asp:BoundField DataField="empCode" HeaderText="Employee ID"></asp:BoundField>
                            <asp:BoundField DataField="EmpName" HeaderText="Employee Name"></asp:BoundField>
                            <asp:BoundField DataField="ProcessName" HeaderText="Process"></asp:BoundField>
                            <asp:BoundField DataField="mobile" HeaderText="Mobile">
                                <ItemStyle HorizontalAlign="Left" />
                            </asp:BoundField>
                            <asp:BoundField DataField="Location" HeaderText="Location">
                                <ItemStyle HorizontalAlign="Left" />
                            </asp:BoundField>
                            <asp:TemplateField HeaderText="Shift">
                                <ItemTemplate>
                                    <asp:Label ID="lblgridShift" runat="server" Text='<%#Eval("shift") %>'></asp:Label>
                                </ItemTemplate>
                                <ControlStyle Width="5%" />
                                <ItemStyle HorizontalAlign="Center" Width="5%" />
                            </asp:TemplateField>
                            <asp:BoundField DataField="stype" HeaderText="Type">
                                <ItemStyle HorizontalAlign="Left" />
                            </asp:BoundField>
                        </Columns>
                    </asp:GridView>
                </asp:View>
            </asp:MultiView>
        </ContentTemplate>
        <Triggers>
            <asp:PostBackTrigger ControlID="btnexport1" />
            <asp:PostBackTrigger ControlID="btnexport2"></asp:PostBackTrigger>
<asp:PostBackTrigger ControlID="btnexport2"></asp:PostBackTrigger>
<asp:PostBackTrigger ControlID="btnexport2"></asp:PostBackTrigger>
<asp:PostBackTrigger ControlID="btnexport2"></asp:PostBackTrigger>
<asp:PostBackTrigger ControlID="btnexport2"></asp:PostBackTrigger>
        </Triggers>
        <Triggers>
            <asp:PostBackTrigger ControlID="btnexport2" />
        </Triggers>
    </asp:UpdatePanel>
</asp:Content>
