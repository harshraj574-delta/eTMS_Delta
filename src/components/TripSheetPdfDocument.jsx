import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Standard fonts
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
  fontWeight: 'light'
});

Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
  fontWeight: 'bold'
});

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 20,
        fontFamily: 'Helvetica',
        fontSize: 10,
    },
    headerWrapper: {
        border: '1px solid #000',
        marginBottom: 10,
    },
    headerRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #000',
        minHeight: 30,
    },
    headerCol1: {
        width: '40%',
        borderRight: '1px solid #000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCol2: {
        width: '20%',
        borderRight: '1px solid #000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCol3: {
        width: '40%',
        padding: 5,
        justifyContent: 'center'
    },
    routeText: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold'
    },
    subText: {
        fontSize: 8,
        marginTop: 4,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#f3f3f3',
        borderBottom: '1px solid #000',
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold'
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #000',
        minHeight: 25,
        alignItems: 'center',
    },
    colSno: { width: '5%', borderRight: '1px solid #000', textAlign: 'center', paddingVertical: 4 },
    colEmpId: { width: '15%', borderRight: '1px solid #000', paddingLeft: 4, paddingVertical: 4 },
    colName: { width: '25%', borderRight: '1px solid #000', paddingLeft: 4, paddingVertical: 4 },
    colGender: { width: '5%', borderRight: '1px solid #000', textAlign: 'center', paddingVertical: 4 },
    colAddress: { width: '35%', borderRight: '1px solid #000', paddingLeft: 4, paddingVertical: 4 },
    colTime: { width: '8%', borderRight: '1px solid #000', textAlign: 'center', paddingVertical: 4 },
    colSig: { width: '7%', textAlign: 'center', paddingVertical: 4 },
    footerWrapper: {
        border: '1px solid #000',
        flexDirection: 'row',
        marginTop: 10,
    },
    footerLeft: {
        width: '30%',
        borderRight: '1px solid #000',
    },
    footerMiddle: {
        width: '30%',
        borderRight: '1px solid #000',
    },
    footerRight: {
        width: '40%',
        padding: 5,
    },
    footerRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #000',
        minHeight: 20,
    },
    footerLabel: {
        width: '40%',
        borderRight: '1px solid #000',
        paddingLeft: 4,
        paddingTop: 4,
    },
    footerVal: {
        width: '60%',
        paddingLeft: 4,
        paddingTop: 4,
    },
    remarksHeader: {
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold',
        marginBottom: 20,
    },
    approvalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 'auto',
    }
});

const formatDate = (dateObj) => {
    if (!dateObj) return '';
    const d = new Date(dateObj);
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
};

/**
 * Creates the PDF rendering for dummy trip sheets. 
 * Replicates the ASPX HTML layout natively in PDF format.
 * 
 * data format: {
 *   date: Date, facility: Number, tripType: string, shift: string, action: string, cabType: string, noOfSheets: number, transId: string, 
 *   employees: []
 * }
 */
const TripSheetPdfDocument = ({ data }) => {
    if (!data) return null;

    // Based on whether there's an employee list, we figure out rows.
    // Standard ASPX prints a 12 row table even if empty.
    const emptyRows = Array.from({ length: 12 });
    
    // Construct exactly the requested number of identical sheets for 'Blank' runs or 1 sheet for 'NonBlank' actual list
    const sheetsToGenerate = Array.from({ length: data.noOfSheets || 1 }).map((_, sheetIndex) => {
        
        let rowData = [...emptyRows];
        if (data.employees && data.employees.length > 0) {
            rowData = data.employees.concat(emptyRows).slice(0, 12);
        }

        const dateStr = formatDate(data.date);
        
        // Mock route calculation for display based on ASPX logic: FacId + daysDiff + 'R' + counter + TripType
        // E.g *015926R00DR2* or *015926Blank*
        const displayRouteId = `${String(data.facility).padStart(2,'0')} - ${data.action === 'Blank' ? 'Blank' : 'Adhoc'} ${data.tripType === 'P' ? 'Pick' : 'Drop'}`;

        return (
            <Page size="A4" orientation="landscape" style={styles.page} key={sheetIndex}>
                {/* Header */}
                <View style={styles.headerWrapper}>
                    <View style={styles.headerRow}>
                        <View style={styles.headerCol1}>
                            <Text style={styles.routeText}>*{data.transId || 'DUMMYROUTE'}*</Text>
                            <Text style={styles.subText}>RouteID - {data.transId || 'DUMMYROUTE'}</Text>
                        </View>
                        <View style={styles.headerCol2}>
                            <Text style={{ textAlign: 'center', marginBottom: 4, fontFamily: 'Helvetica-Bold' }}>Facility: {data.facility}</Text>
                        </View>
                        <View style={styles.headerCol3}>
                            <Text>Vendor Name: </Text>
                        </View>
                    </View>
                    <View style={[styles.headerRow, { borderBottom: 'none' }]}>
                        <View style={styles.headerCol1}>
                            <Text style={{ marginTop: 8 }}>{data.tripType === 'P' ? 'Adhoc PickUP' : 'Adhoc Drop'}</Text>
                        </View>
                        <View style={styles.headerCol2}>
                            <Text style={{ textAlign: 'center', fontSize: 9 }}>Working Date: {dateStr}</Text>
                            <Text style={{ textAlign: 'center', fontSize: 9, marginTop: 4 }}>Date: {dateStr}   Shift: {data.shift}</Text>
                        </View>
                        <View style={styles.headerCol3}>
                            <Text>CabID: </Text>
                        </View>
                    </View>
                </View>

                {/* Table Header */}
                <View style={[styles.headerWrapper, { marginBottom: 0 }]}>
                    <View style={styles.tableHeaderRow}>
                        <Text style={styles.colSno}></Text>
                        <Text style={styles.colEmpId}>Employee ID</Text>
                        <Text style={styles.colName}>Employee Name</Text>
                        <Text style={styles.colGender}>G</Text>
                        <Text style={styles.colAddress}>Address</Text>
                        <Text style={styles.colTime}>Time</Text>
                        <Text style={styles.colSig}>Signature</Text>
                    </View>

                    {/* Table Rows */}
                    {rowData.map((emp, i) => (
                        <View style={[styles.tableRow, i === 11 ? { borderBottom: 'none' } : {}]} key={i}>
                            <Text style={styles.colSno}>{i + 1}</Text>
                            <Text style={styles.colEmpId}>{emp ? emp.empCode : ''}</Text>
                            <Text style={styles.colName}>{emp ? emp.empName : ''}</Text>
                            <Text style={styles.colGender}>{emp ? emp.Gender : ''}</Text>
                            <Text style={styles.colAddress}>{emp ? emp.Address : ''}</Text>
                            <Text style={styles.colTime}>{emp ? emp.ETA : ''}</Text>
                            <Text style={styles.colSig}></Text>
                        </View>
                    ))}
                </View>

                {/* Footer block */}
                <View style={styles.footerWrapper}>
                    <View style={styles.footerLeft}>
                        {[
                            ['Start Time', ''],
                            ['End Time', ''],
                            ['Total Time', ''],
                            ['Start KM', ''],
                            ['End KM', '']
                        ].map((row, i) => (
                            <View style={[styles.footerRow, i === 4 ? { borderBottom: 'none', height: 25 } : {}]} key={i}>
                                <Text style={styles.footerLabel}>{row[0]}</Text>
                                <Text style={styles.footerVal}>{row[1]}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.footerMiddle}>
                        <View style={[styles.footerRow, { height: '33.33%' }]}>
                            <Text style={{ padding: 4 }}>Driver Name</Text>
                        </View>
                        <View style={[styles.footerRow, { height: '33.33%' }]}>
                             <Text style={{ padding: 4 }}>Vehicle Number</Text>
                        </View>
                        <View style={[styles.footerRow, { borderBottom: 'none', height: '33.33%' }]}>
                            <Text style={{ padding: 4 }}>Vendor Name</Text>
                        </View>
                    </View>

                    <View style={styles.footerRight}>
                        <Text style={styles.remarksHeader}>Remarks:</Text>
                        <View style={styles.approvalRow}>
                            <Text>EscortID/Name</Text>
                            <Text>Signature</Text>
                            <Text>Approval</Text>
                        </View>
                    </View>
                </View>
            </Page>
        );
    });

    return (
        <Document>
            {sheetsToGenerate}
        </Document>
    );
};

export default TripSheetPdfDocument;
