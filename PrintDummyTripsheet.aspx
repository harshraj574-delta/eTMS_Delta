<%@ Page Language="C#" AutoEventWireup="true" CodeFile="PrintDummyTripsheet.aspx.cs"
    Inherits="PrintDummyTripsheet" ValidateRequest="True" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <meta http-equiv="X-UA-Compatible" content="IE=EmulateIE7" />
    <title>Print Dummy Tripsheet</title>
    <link href="StyleSheets/TMS.css" rel="stylesheet" type="text/css" />
    <link href="StyleSheets/GridView.css" rel="stylesheet" type="text/css" />
</head>
<body>
    <form id="form1" runat="server">
    <table align="left" cellspacing="0" cellpadding="0">
        <tr valign="top">
            <td align="center" valign="top">
                <asp:Label ID="lblErrorMsg" runat="server" CssClass="error"></asp:Label>
                
            </td>
        </tr>
        <tr valign="top">
            <td align="left" valign="top">
                <asp:DataList ID="dlShowRoutes" runat="server" RepeatDirection="Vertical" CellPadding="0"
                    Font-Size="Large">
                    <ItemTemplate>
                        <table border="0" width="1050px" cellpadding="1" cellspacing="0" align="left" style="border: 1px solid #333333;
                            page-break-after: always; border-collapse: collapse;">
                            <tr valign="top">
                                <td align="left" valign="top">
                                    <table cellpadding="1" border="1" bordercolor="black" cellspacing="4" width="100%"
                                        style="border: thin solid #000000; border-collapse: collapse">
                                        <tr valign="top">
                                            <td width="28%" rowspan="2" align="center" valign="middle" height="60">
                                                <asp:Label ID="lblRouteID" Font-Names="Free 3 of 9" Text='<%# "*" +Eval("RouteID")+"*" %>'
                                                    runat="server" Font-Size="40"></asp:Label>
                                                <br />
                                                RouteID -
                                                <%# DataBinder.Eval(Container.DataItem, "RouteID")%>
                                            </td>
                                            <td width="5%" style="font-weight: bold; font-size: 10pt;" align="center">
                                                mphasis
                                                <br />
                                                <%# DataBinder.Eval(Container.DataItem, "facilityName")%>
                                            </td>
                                            <td width="22%" align="center">
                                                Working Date: <b>
                                                    <%# DataBinder.Eval(Container.DataItem, "workingDate")%></b>
                                                <hr />
                                                Date:
                                                <%# DataBinder.Eval(Container.DataItem, "shiftDate")%>
                                                &nbsp; Shift: <b>
                                                    <%# DataBinder.Eval(Container.DataItem, "Shift")%></b>
                                            </td>
                                            <td width="18%" valign="top">
                                                <b>Vendor Name: &nbsp;</b>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colspan="2" align="center" style="font-size: large">
                                                <%# DataBinder.Eval(Container.DataItem, "CabType")%>&nbsp;
                                                <asp:Label ID="lblTripType" runat="server" Text='<%# DataBinder.Eval(Container.DataItem, "TripType")%>'></asp:Label>
                                                
                                                &nbsp;
                                            </td>
                                            <td>
                                                CabID:
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr valign="top">
                                <td valign="top">
                                    <%-- <table border="0" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse">
                                        <tr>
                                            <td valign="top"  >--%>
                                    <asp:GridView ID="grdViewRouteDetails"   AutoGenerateColumns="False" runat="server"
                                        BorderStyle="Solid" BorderColor="Black" CellPadding="2" Width="100%" CssClass="GridView"
                                        RowStyle-Height="25" EnableModelValidation="True" OnRowDataBound="grdViewRouteDetails_RowDataBound">
                                        <RowStyle Height="25px" />
                                        <Columns>
                                            <%--<asp:BoundField DataField="" HeaderText="SN">
                                                <ItemStyle Width="5px" />
                                            </asp:BoundField>--%>
                                            <asp:TemplateField>
                                                <ItemTemplate>
                                                    <%#Container.DataItemIndex+1 %>
                                                </ItemTemplate>
                                                <ItemStyle Width="10px" />
                                            </asp:TemplateField>
                                            <%--<asp:TemplateField HeaderText="Employee Id">
                                                <ItemTemplate>
                                                    <%# Eval("empCode") %>
                                                </ItemTemplate>
                                            </asp:TemplateField>--%>
                                            <asp:BoundField DataField="empCode" HeaderText="Employee ID">
                                                <ItemStyle Width="90px" />
                                            </asp:BoundField>
                                            <asp:BoundField DataField="EmpName" HeaderText="Employee Name">
                                                <ItemStyle Width="110px" />
                                            </asp:BoundField>
                                            <asp:BoundField DataField="Gender" HeaderText="G">
                                                <ItemStyle Width="10px" />
                                            </asp:BoundField>
                                            <asp:BoundField DataField="Address" HeaderText="Address" />
                                            <asp:TemplateField HeaderText="Time">
                                               
                                                <ItemTemplate>
                                                    <asp:Label ID="lbltime" runat="server"></asp:Label>
                                                </ItemTemplate>
                                                <ItemStyle Font-Size="8pt" Width="10px" />
                                            </asp:TemplateField>
                                            <asp:BoundField DataField="" HeaderText="Signature">
                                                <ItemStyle Width="10px" />
                                            </asp:BoundField>
                                        </Columns>
                                    </asp:GridView>
                                    <%--</td>
                                        </tr>
                                    </table>--%>
                                </td>
                            </tr>
                            <tr valign="top">
                                <td valign="top">
                                    <table border="0" cellpadding="1" cellspacing="1" width="100%" style="border-collapse: collapse">
                                        <tr>
                                            <td width="30%" valign="top">
                                                <table border="1" bordercolor="black" cellspacing="2" cellpadding="2" width="100%"
                                                    style="border-collapse: collapse">
                                                    <tr>
                                                        <td width="30%">
                                                            Start Time
                                                        </td>
                                                        <td width="70%">
                                                            &nbsp;
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td>
                                                            End Time
                                                        </td>
                                                        <td>
                                                            &nbsp;
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td>
                                                            Total Time
                                                        </td>
                                                        <td>
                                                            &nbsp;
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td height="28">
                                                            <b>Start KM</b>
                                                        </td>
                                                        <td>
                                                            &nbsp;
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td height="28">
                                                            <b>End KM</b>
                                                        </td>
                                                        <td>
                                                            &nbsp;
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                            <td width="30%" valign="top">
                                                <table cellpadding="2" cellspacing="1" width="100%" border="1" bordercolor="black"
                                                    style="border-collapse: collapse">
                                                    <tr>
                                                        <td height="38" valign="top">
                                                            <b>Driver Name</b>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td height="38" valign="top">
                                                            <b>Vehicle Number</b>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td height="38" valign="top">
                                                            <b>Vendor Name</b>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                            <td width="40%" valign="top">
                                                <table cellpadding="1" cellspacing="1" width="100%" border="1" bordercolor="black"
                                                    style="border-collapse: collapse">
                                                    <tr>
                                                        <td colspan="3" height="65" valign="top">
                                                            <b>Remarks:</b>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td>
                                                            EscortID/Name
                                                        </td>
                                                        <td>
                                                            Signature
                                                        </td>
                                                        <td>
                                                            Approval
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td height="40">
                                                            &nbsp;
                                                        </td>
                                                        <td>
                                                            &nbsp;
                                                        </td>
                                                        <td>
                                                            &nbsp;
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colspan="4">
                                                <asp:Panel ID="pnlDeclare" runat="server">
                                                    <table width="100%">
                                                        <tr>
                                                            <td align="left" height="20" width="100%" style="font-family: Verdana; font-size: 10pt;">
                                                                <b>Note : * I,__________________ will be the last drop in the cab. Signature __________________
                                                                    <br />
                                                                    <br />
                                                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span lang="en-us">&nbsp;&nbsp;&nbsp;&nbsp;
                                                                    </span>*<span lang="en-us"> </span>I, __________________ have been dropped off at __________________
                                                                    (p.m./ a.m.) Signature __________________ </b>
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
                    </ItemTemplate>
                    <SeparatorTemplate>
                        <br />
                        <br style="page-break-after: always" />
                    </SeparatorTemplate>
                </asp:DataList>
            </td>
        </tr>
    </table>
    <table>
        <tr>
            <td>
                <asp:GridView ID="GridView1" runat="server">
                </asp:GridView>
            </td>
        </tr>
    </table>
   
    </form>
</body>
</html>
