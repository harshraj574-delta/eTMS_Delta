<%@ Page Title="Manage Colony" Language="C#" MasterPageFile="~/eTMSMaster.master"
    AutoEventWireup="true" CodeFile="ManageColony.aspx.cs" Inherits="ManageColony" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="Server">
    <link href="css/bootstrap.min.css" rel="stylesheet" />
    <style type="text/css">
        
    </style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="Server">
    <asp:Label ID="lblErrorMsg" runat="server" Visible="False" CssClass="error"></asp:Label>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>
            <%-- <table width="100%">--%>
            <%--<tr>
                    <td align="left"  class="text-muted">
                        <asp:Label ID="lblHeading" runat="server" Text="Manage Colony" Font-Bold="true" class="text-muted"></asp:Label>
                    </td>
                </tr>
                <tr>
                    <td align="left" class="text-muted">
                        <asp:Label ID="Label2" runat="server" Font-Bold="true" Font-Overline="False" Text="Allow User to Add/Edit/Move Colonies"
                            CssClass="card-subhead"></asp:Label>
                    </td>
                </tr>--%>
            <%--<div class="row">
                <div class="col-md-12">
                    <h4 class="text-muted">Manage Colony</h4>
                    <p class="text-muted">Allow User to Add/Edit/Move Colonies</p>
                </div>
            </div>--%>
             <span class="fs-16 fw-bold mb-1 d-block">Manage Colony</span>
            <span class="fs-16 fw-bold mb-3 d-block">
                <asp:Label ID="Label2" runat="server" Font-Bold="False" Font-Overline="False" Text="Allow User to Add/Edit/Move Colonies"></asp:Label>
                
            <tr>
                <td align="left"></td>
            </tr>

            <%--<tr>
                    <td>
                        <asp:UpdateProgress ID="UpdateProgress1" runat="server" AssociatedUpdatePanelID="UpdatePanel1"
                            DisplayAfter="0" DynamicLayout="False">
                            <ProgressTemplate>
                                <table align="center">
                                    <tr>
                                        <td>
                                            <img src="images/ajax-loader.gif" style="width: 16px; height: 16px" alt="Loading...." />
                                        </td>
                                        <td class="processing">Loading.....Please Wait!!!
                                        </td>
                                    </tr>
                                </table>
                            </ProgressTemplate>
                        </asp:UpdateProgress>
                    </td>
                </tr>--%>

            <tr>
                <td>
                    <asp:UpdateProgress ID="UpdateProgress1" runat="server" AssociatedUpdatePanelID="UpdatePanel1"
                        DisplayAfter="0" DynamicLayout="False">
                        <ProgressTemplate>
                            <div class="modalloader">
                                <div class="center" align="center">
                                    <img src="images/ajax-loader.gif" alt="Loding..." style="align-self: center;" /><br />
                                    <b style="color: red">Loading..... Please Wait!!!</b>
                                </div>
                            </div>
                        </ProgressTemplate>
                    </asp:UpdateProgress>
                </td>
            </tr>


            <%--  <tr>
                    <td align="center">
                        <asp:Label ID="lblMessage" Visible="False" runat="server" CssClass="message"></asp:Label>
                    </td>
                </tr>--%>
            <div class="row">
                <div class="col-md-12 text-center">
                    <asp:Label ID="lblMessage" Visible="False" runat="server" CssClass="message"></asp:Label>
                </div>

            </div>
            <%-- <tr>
                    <td align="center">
                        <table>
                            <tr>
                                <td>
                                    <label class="form-label">Facility Name:</label>
                                </td>
                                <td align="left">
                                    <asp:DropDownList ID="ddlFacililty" runat="server" AppendDataBoundItems="true"
                                        OnSelectedIndexChanged="ddlFacililty_SelectedIndexChanged" AutoPostBack="true">
                                    </asp:DropDownList>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>--%>
            <div class="row">
                <div class="col-md-12 text-center">
                    <div class="form-group">
                        <label for="ddlFacililty" class="form-label">Facility Name:</label>
                        <asp:DropDownList ID="ddlFacililty" runat="server" AppendDataBoundItems="true"
                            OnSelectedIndexChanged="ddlFacililty_SelectedIndexChanged" AutoPostBack="true">
                        </asp:DropDownList>
                    </div>
                </div>
            </div>
            <%--<tr>
                <td align="center">--%>
            <div class="row">
                <div class="col-12">
                    <div class="card_tb p-0 overflow-hidden">
                        <asp:GridView ID="gvRouteSequence" runat="server" AutoGenerateColumns="False" DataKeyNames="RouteID"
                            OnRowCommand="gvRouteSequence_RowCommand" CssClass="table mb-0 table-striped table-hover" EmptyDataText="No Data Found.">
                            <Columns>
                                <asp:TemplateField HeaderText="">
                                    <ItemTemplate>
                                        <asp:ImageButton ID="imgbtnExpand" runat="server" CausesValidation="False" CommandName="expand"
                                            ImageUrl="~/images/icon_add.png" />
                                        <asp:ImageButton ID="imgbtnClose" runat="server" CausesValidation="False" CommandName="close"
                                            ImageUrl="~/images/icon_minus.png" Visible="False" />
                                        <%--<asp:Label ID="lblRouteID" runat="server" Text='<%# Eval("RouteID") %>'></asp:Label>--%>
                                    </ItemTemplate>
                                </asp:TemplateField>
                                <asp:TemplateField HeaderText="Route No">
                                    <ItemTemplate>
                                        <%--<asp:ImageButton ID="imgbtnExpand" runat="server" CausesValidation="False" CommandName="expand"
                                            ImageUrl="~/images/plus.gif" />
                                        <asp:ImageButton ID="imgbtnClose" runat="server" CausesValidation="False" CommandName="close"
                                            ImageUrl="~/images/minus.gif" Visible="False" />--%>
                                        <asp:Label ID="lblRouteID" runat="server" Text='<%# Eval("RouteID") %>'></asp:Label>
                                    </ItemTemplate>
                                </asp:TemplateField>
                                <asp:TemplateField HeaderText="Zone">
                                    <ItemTemplate>
                                        <asp:Label ID="lblZoneName" runat="server" Text='<%# Eval("zoneName") %>'></asp:Label>
                                    </ItemTemplate>
                                </asp:TemplateField>
                                <asp:TemplateField HeaderText="City">
                                    <ItemTemplate>
                                        <asp:Label ID="lblCity" runat="server" Text='<%# Eval("City") %>'></asp:Label>
                                    </ItemTemplate>
                                </asp:TemplateField>

                                <asp:TemplateField HeaderText="Colony">
                                    <ItemTemplate>
                                        <asp:Label ID="lblColony" runat="server" Text='<%# Eval("Colony") %>'></asp:Label>
                                    </ItemTemplate>
                                </asp:TemplateField>


                                <asp:TemplateField>
                                    <ItemTemplate>
                                        <%--<tr>
                                            <td colspan="4" align="center">--%>
                                        <tr>
                                            <td colspan="12" align="left">

                                                <asp:GridView ID="gvColony" runat="server" CssClass="table mb-0 table-striped" DataKeyNames="Id,RouteID,Location"
                                                    Visible="False" AutoGenerateColumns="False" OnRowDeleting="gvColony_RowDeleting"
                                                    OnRowEditing="gvColony_RowEditing" OnRowCancelingEdit="gvColony_RowCancelingEdit"
                                                    OnRowCommand="gvColony_RowCommand" OnRowUpdating="gvColony_RowUpdating" ShowFooter="True">
                                                    <RowStyle BackColor="#EFF3FB" />
                                                    <Columns>
                                                        <asp:TemplateField>
                                                            <ItemTemplate>
                                                                <asp:CheckBox ID="chkTrack" runat="server" />
                                                            </ItemTemplate>
                                                            <%--                                                    <ItemStyle Width="1%" HorizontalAlign="Center"></ItemStyle>--%>
                                                            <FooterTemplate>
                                                                <asp:LinkButton ID="linkbtSplit" runat="server" OnClick="linkbtSplit_Click">SPLIT</asp:LinkButton>
                                                            </FooterTemplate>
                                                        </asp:TemplateField>


                                                        <asp:TemplateField HeaderText="SeqID">
                                                            <ItemTemplate>
                                                                <asp:Label ID="lblSeqId" runat="server" Text='<%# Eval("SeqId") %>'></asp:Label>
                                                            </ItemTemplate>
                                                            <EditItemTemplate>
                                                                <asp:Label ID="lblSeqId" runat="server" Text='<%# Eval("SeqId") %>'></asp:Label>
                                                            </EditItemTemplate>
                                                            <InsertItemTemplate></InsertItemTemplate>
                                                        </asp:TemplateField>

                                                        <asp:TemplateField HeaderText="Zone">
                                                            <ItemTemplate>
                                                                <asp:Label ID="lblZoneName" runat="server" Text='<%# Eval("ZoneName") %>'></asp:Label>
                                                            </ItemTemplate>
                                                            <EditItemTemplate>
                                                                <asp:DropDownList ID="ddlZoneName" runat="server">
                                                                </asp:DropDownList>
                                                            </EditItemTemplate>
                                                        </asp:TemplateField>

                                                        <asp:TemplateField HeaderText="City">
                                                            <ItemTemplate>
                                                                <asp:Label ID="lblCity" runat="server" Text='<%# Eval("City") %>'></asp:Label>
                                                            </ItemTemplate>
                                                            <EditItemTemplate>
                                                                <asp:DropDownList ID="ddlCity" runat="server">
                                                                </asp:DropDownList>
                                                            </EditItemTemplate>
                                                        </asp:TemplateField>
                                                        <asp:TemplateField HeaderText="Area">
                                                            <ItemTemplate>
                                                                <asp:Label ID="lblColony" runat="server" Text='<%# Eval("Colony") %>'></asp:Label>
                                                            </ItemTemplate>
                                                            <EditItemTemplate>
                                                                <asp:TextBox ID="txtColony" runat="server"
                                                                    Text='<%# Eval("Colony") %>'></asp:TextBox>
                                                                <asp:RequiredFieldValidator ID="RFVtxtColony" runat="server" ControlToValidate="txtColony"
                                                                    ErrorMessage="Enter Colony" Display="Dynamic" SetFocusOnError="True" ValidationGroup="edit">Please Enter Colony.</asp:RequiredFieldValidator>
                                                                <asp:RegularExpressionValidator ID="RegExptxtColony" runat="server" ControlToValidate="txtColony"
                                                                    Display="Dynamic" ErrorMessage="Colony should be alphanumeric." Text="Colony should be alphanumeric." ValidationExpression="^([\w\-]|\s)*$"
                                                                    ValidationGroup="edit" SetFocusOnError="true"></asp:RegularExpressionValidator>
                                                            </EditItemTemplate>
                                                        </asp:TemplateField>

                                                        <asp:TemplateField HeaderText="Landmark">
                                                            <ItemTemplate>
                                                                <asp:Label ID="lblSubColony" runat="server" Text='<%# Eval("SubColony") %>'></asp:Label>
                                                            </ItemTemplate>
                                                            <EditItemTemplate>
                                                                <asp:TextBox ID="txtSubColony" Width="150Px" MaxLength="100" runat="server"
                                                                    Text='<%# Eval("SubColony") %>'></asp:TextBox>
                                                                <asp:RequiredFieldValidator ID="RFVtxtSubColony" runat="server" ControlToValidate="txtSubColony"
                                                                    ErrorMessage="Enter Colony" Display="Dynamic" SetFocusOnError="True" ValidationGroup="edit">Please Enter SubColony.</asp:RequiredFieldValidator>

                                                                <asp:RegularExpressionValidator ID="RegExptxtSubColony" runat="server" ControlToValidate="txtSubColony"
                                                                    Display="Dynamic" ErrorMessage="SubColony should be alphanumeric." Text="SubColony should be alphanumeric." ValidationExpression="^([\w\-]|\s)*$"
                                                                    ValidationGroup="edit" SetFocusOnError="true"></asp:RegularExpressionValidator>
                                                            </EditItemTemplate>
                                                        </asp:TemplateField>
                                                        <asp:TemplateField HeaderText="Metro">
                                                            <ItemTemplate>
                                                                <asp:Label ID="lblMetro" runat="server" Text='<%# Eval("Metro") %>'></asp:Label>
                                                            </ItemTemplate>
                                                            <EditItemTemplate>
                                                                <asp:DropDownList ID="ddlMetro" Enabled="false" runat="server">
                                                                    <asp:ListItem Text="No" Value="false"></asp:ListItem>
                                                                    <asp:ListItem Text="Yes" Value="True"></asp:ListItem>
                                                                </asp:DropDownList>
                                                            </EditItemTemplate>
                                                        </asp:TemplateField>
                                                        <asp:TemplateField HeaderText="T Time">
                                                            <ItemTemplate>
                                                                <asp:Label ID="lblTravelTime" runat="server" Text='<%# Eval("travelTime") %>'></asp:Label>
                                                            </ItemTemplate>
                                                            <EditItemTemplate>
                                                                <asp:TextBox ID="txtTravelTime" Width="50Px" MaxLength="3" runat="server" Text='<%# Eval("travelTime") %>'></asp:TextBox>
                                                                <asp:RequiredFieldValidator ID="RFVtxtTravelTime" runat="server" ControlToValidate="txtTravelTime"
                                                                    ErrorMessage="Enter Travel Time" Display="Dynamic" SetFocusOnError="True">*</asp:RequiredFieldValidator>
                                                                <asp:RangeValidator ID="RVtxtTravelTime" runat="server" ControlToValidate="txtTravelTime"
                                                                    ErrorMessage="Enter Valid Travel Time" Display="Dynamic" MaximumValue="999" MinimumValue="1"
                                                                    SetFocusOnError="True" Type="Integer">*</asp:RangeValidator>
                                                            </EditItemTemplate>
                                                        </asp:TemplateField>
                                                        <asp:TemplateField HeaderText="Km">
                                                            <ItemTemplate>
                                                                <asp:Label ID="lblTravelKm" runat="server" Text='<%# Eval("travelKm") %>'></asp:Label>
                                                            </ItemTemplate>
                                                            <EditItemTemplate>
                                                                <asp:TextBox ID="txtTravelKm" Width="50Px" MaxLength="3" runat="server" Text='<%# Eval("travelKm") %>'></asp:TextBox>
                                                                <asp:RequiredFieldValidator ID="RFVtxtTravelKm" runat="server" ControlToValidate="txtTravelKm"
                                                                    ErrorMessage="Enter Travel Km" Display="Dynamic" SetFocusOnError="True">*</asp:RequiredFieldValidator>
                                                                <asp:RangeValidator ID="RVtxtTravelKm" runat="server" ControlToValidate="txtTravelKm"
                                                                    ErrorMessage="Enter Valid Travel Km" Display="Dynamic" MaximumValue="999" MinimumValue="1"
                                                                    SetFocusOnError="True" Type="Double">*</asp:RangeValidator>
                                                            </EditItemTemplate>
                                                        </asp:TemplateField>
                                                        <asp:TemplateField ShowHeader="False" ItemStyle-Width="60px">
                                                            <ItemTemplate>
                                                                <asp:ImageButton ID="imgBtnCut" runat="server" ImageUrl="~/images/cut1.jpg" ToolTip="Cut"
                                                                    CommandName="Cut" CommandArgument='<%#((GridViewRow)Container).RowIndex%>' Height="20px"
                                                                    Width="20px"></asp:ImageButton>
                                                                <cc1:ConfirmButtonExtender TargetControlID="imgBtnCut" ID="imgBtnCut_ConfirmButtonExtender" runat="server" ConfirmText="Cut this Colony ?" Enabled="true">
                                                                </cc1:ConfirmButtonExtender>
                                                                <asp:ImageButton ID="imgBtnPaste" runat="server" ImageUrl="~/images/paste1.jpg" ToolTip="Paste"
                                                                    CommandName="Paste" CommandArgument='<%#((GridViewRow)Container).RowIndex%>'
                                                                    Height="20px" Width="20px"></asp:ImageButton>
                                                                <cc1:ConfirmButtonExtender runat="server" ID="imgBtnPaste_ConfirmButtonExtender" TargetControlID="imgBtnPaste" ConfirmText="Paste this Colony ?" Enabled="true">
                                                                </cc1:ConfirmButtonExtender>

                                                            </ItemTemplate>
                                                            <ItemStyle Width="60px" />
                                                        </asp:TemplateField>
                                                        <asp:TemplateField ShowHeader="False">
                                                            <EditItemTemplate>
                                                                <asp:LinkButton ID="LinkButton1" runat="server" CausesValidation="True" CommandName="Update"
                                                                    CommandArgument='<%#((GridViewRow)Container).RowIndex%>' Text="Update" ValidationGroup="edit"></asp:LinkButton>
                                                                &nbsp;<asp:LinkButton ID="LinkButton2" runat="server" CausesValidation="False" CommandName="Cancel"
                                                                    CommandArgument='<%#((GridViewRow)Container).RowIndex%>' Text="Cancel"></asp:LinkButton>
                                                            </EditItemTemplate>
                                                            <ItemTemplate>
                                                                <asp:LinkButton ID="LinkButton1" runat="server" CausesValidation="False" CssClass="btn btn-outline-info" CommandName="Edit"
                                                                    CommandArgument='<%#((GridViewRow)Container).RowIndex%>' Text="Edit"></asp:LinkButton>
                                                                &nbsp;<asp:LinkButton ID="LinkButton2" runat="server" CssClass="btn btn-outline-info" CausesValidation="False" CommandName="Delete"
                                                                    CommandArgument='<%#((GridViewRow)Container).RowIndex%>' Text="Delete"></asp:LinkButton><cc1:ConfirmButtonExtender ID="LinkButton2_ConfirmButtonExtender" runat="server"
                                                                        ConfirmText="Delete this Colony?" Enabled="True" TargetControlID="LinkButton2">
                                                                    </cc1:ConfirmButtonExtender>
                                                            </ItemTemplate>
                                                            <%--                                                            <ItemStyle Width="70px" />--%>
                                                        </asp:TemplateField>
                                                        <asp:TemplateField>
                                                            <ItemTemplate>
                                                                <asp:LinkButton ID="lbtnNew" runat="server" CausesValidation="false" CssClass="btn btn-outline-info" CommandName="Insert"
                                                                    CommandArgument='<%#((GridViewRow)Container).RowIndex%>' Text="New">
                                                                </asp:LinkButton>
                                                            </ItemTemplate>
                                                            <EditItemTemplate>
                                                            </EditItemTemplate>
                                                        </asp:TemplateField>
                                                    </Columns>
                                                    <%-- <FooterStyle BackColor="#507CD1" Font-Bold="True" ForeColor="White" />
                                                    <PagerStyle BackColor="#2461BF" ForeColor="White" HorizontalAlign="Center" />
                                                    <SelectedRowStyle BackColor="#FF3300" Font-Bold="True" ForeColor="#1791B7" />
                                                    <HeaderStyle BackColor="#1791B7" Font-Bold="True" />
                                                    <EditRowStyle BackColor="#FFCC00" />
                                                    <AlternatingRowStyle BackColor="White" />--%>
                                                </asp:GridView>
                                            </td>
                                        </tr>
                                    </ItemTemplate>
                                </asp:TemplateField>
                            </Columns>
                            <%-- <EmptyDataRowStyle ForeColor="Red" HorizontalAlign="Center" VerticalAlign="Middle" />
                            <FooterStyle BackColor="#5D7B9D" Font-Bold="True" ForeColor="White" />
                            <PagerStyle BackColor="#284775" ForeColor="White" HorizontalAlign="Center" />
                            <SelectedRowStyle BackColor="#FF3300" Font-Bold="True" ForeColor="#333333" />
                            <HeaderStyle BackColor="#1791B7" Font-Bold="True" ForeColor="Black" />
                            <EditRowStyle BackColor="#999999" />
                            <AlternatingRowStyle BackColor="White" ForeColor="#284775" />--%>
                        </asp:GridView>
                        </td>
           <%-- </tr>--%>
                    </div>
                </div>
            </div>
            <%--</table>--%>

            <br />
            <br />
        </ContentTemplate>

    </asp:UpdatePanel>
</asp:Content>
