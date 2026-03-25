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
        padding: 24,
        fontFamily: 'Helvetica',
        fontSize: 10,
    },
    topHeaderTable: {
        flexDirection: 'row',
        border: '1px solid #000',
        marginBottom: 4,
    },
    topHeaderCol1: {
        width: '28%',
        borderRight: '1px solid #000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4
    },
    topHeaderCol2: {
        width: '22%',
        borderRight: '1px solid #000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4
    },
    topHeaderCol3: {
        width: '30%',
        borderRight: '1px solid #000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4
    },
    topHeaderCol4: {
        width: '20%',
        padding: 4
    },
    innerGridRow: {
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center'
    },
    barcodeText: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 24,
        marginBottom: 4
    },
    dataGridTable: {
        width: '100%',
        border: '1px solid #000',
        borderBottom: 'none',
        marginBottom: 5,
    },
    dataGridHeaderRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #000',
        backgroundColor: '#f3f3f3',
        minHeight: 20,
        alignItems: 'center'
    },
    dataGridRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #000',
        minHeight: 20,
        alignItems: 'center'
    },
    colSno: { width: '4%', borderRight: '1px solid #000', textAlign: 'center', padding: 2, minHeight: 20 },
    colEmpId: { width: '15%', borderRight: '1px solid #000', padding: 2, minHeight: 20 },
    colName: { width: '25%', borderRight: '1px solid #000', padding: 2, minHeight: 20 },
    colGender: { width: '4%', borderRight: '1px solid #000', textAlign: 'center', padding: 2, minHeight: 20 },
    colAddress: { width: '38%', borderRight: '1px solid #000', padding: 2, minHeight: 20, fontSize: 8 },
    colTime: { width: '6%', borderRight: '1px solid #000', textAlign: 'center', padding: 2, minHeight: 20 },
    colSig: { width: '8%', padding: 2, minHeight: 20 },
    
    footerTableContainer: {
        flexDirection: 'row',
        width: '100%'
    },
    footerBlockCol1: {
        width: '30%',
        border: '1px solid #000',
        borderRight: 'none'
    },
    footerBlockCol2: {
        width: '30%',
        border: '1px solid #000',
        borderRight: 'none'
    },
    footerBlockCol3: {
        width: '40%',
        border: '1px solid #000',
    },
    footerInnerRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #000',
        padding: 4,
        minHeight: 22,
        alignItems: 'center'
    },
    footerLabelCol: { width: '40%', paddingLeft: 2 },
    footerValCol: { width: '60%' },
    footerBold: { fontFamily: 'Helvetica-Bold' },
    declarationLabel: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        marginTop: 15,
        lineHeight: 1.5,
    }
});

const TripSheetPdfDocument = ({ data }) => {
    if (!data) return null;

    // Support single object fallback or array of sheets.
    const sheetsData = Array.isArray(data) ? data : [data];

    const generatePage = (sheet, sheetIndex) => {
        // Standard ASPX 12 rows
        const maxRows = Math.max(12, (sheet.employees || []).length);
        const rowsToRender = [];
        
        for (let i = 0; i < maxRows; i++) {
            rowsToRender.push(sheet.employees?.[i] || null);
        }

        const isDrop = sheet.TripType && sheet.TripType.toUpperCase().includes('DROP') || sheet.TripType === 'Drop';

        return (
            <Page size="A4" orientation="landscape" style={styles.page} key={sheetIndex}>
                {/* Legacy Top Header Section */}
                <View style={styles.topHeaderTable}>
                    {/* Col 1 */}
                    <View style={styles.topHeaderCol1}>
                        <Text style={styles.barcodeText}>*{sheet.RouteID}*</Text>
                        <Text style={{ fontFamily: 'Helvetica-Bold' }}>RouteID - {sheet.RouteID}</Text>
                        <View style={{ flexDirection: 'row', marginTop: 15 }}>
                            <Text style={styles.footerBold}>{sheet.CabType}  </Text>
                            <Text>{sheet.TripType}</Text>
                        </View>
                    </View>
                    
                    {/* Col 2 */}
                    <View style={styles.topHeaderCol2}>
                        <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 6 }}>mphasis</Text>
                        <Text style={{ marginBottom: 6 }}>{sheet.facilityName}</Text>
                        <Text style={{ marginTop: 6 }}></Text>
                    </View>
                    
                    {/* Col 3 */}
                    <View style={styles.topHeaderCol3}>
                        <Text style={{ marginBottom: 6 }}>Working Date: <Text style={styles.footerBold}>{sheet.workingDate}</Text></Text>
                        <View style={{ borderBottom: '1px solid #ccc', width: '100%', marginBottom: 6 }} />
                        <Text>Date: {sheet.shiftDate}   Shift: <Text style={styles.footerBold}>{sheet.Shift}</Text></Text>
                    </View>

                    {/* Col 4 */}
                    <View style={styles.topHeaderCol4}>
                        <Text style={styles.footerBold}>Vendor Name: </Text>
                        <Text style={{ marginTop: 20 }}>CabID: </Text>
                    </View>
                </View>

                {/* Main Employee Grid */}
                <View style={styles.dataGridTable}>
                    <View style={styles.dataGridHeaderRow}>
                        <Text style={styles.colSno}>SN</Text>
                        <Text style={styles.colEmpId}>Employee ID</Text>
                        <Text style={styles.colName}>Employee Name</Text>
                        <Text style={styles.colGender}>G</Text>
                        <Text style={styles.colAddress}>Address</Text>
                        <Text style={styles.colTime}>Time</Text>
                        <Text style={styles.colSig}>Signature</Text>
                    </View>
                    
                    {rowsToRender.map((emp, i) => (
                        <View style={styles.dataGridRow} key={`row-${i}`}>
                            <Text style={styles.colSno}>{i + 1}</Text>
                            <Text style={styles.colEmpId}>{emp ? emp.empCode || emp.empcode : ''}</Text>
                            <Text style={styles.colName}>{emp ? emp.EmpName || emp.empName : ''}</Text>
                            <Text style={styles.colGender}>{emp ? emp.Gender : ''}</Text>
                            <Text style={styles.colAddress}>{emp ? (emp.Address || emp.address) : ''}</Text>
                            <Text style={styles.colTime}>{emp ? (emp.ETA || emp.time || emp.Time) : ''}</Text>
                            <Text style={styles.colSig}></Text>
                        </View>
                    ))}
                </View>

                {/* Legacy Summary Footer */}
                <View style={styles.footerTableContainer}>
                    {/* Left Footer Block */}
                    <View style={styles.footerBlockCol1}>
                        <View style={styles.footerInnerRow}>
                            <Text style={styles.footerLabelCol}>Start Time</Text>
                            <Text style={styles.footerValCol}></Text>
                        </View>
                        <View style={styles.footerInnerRow}>
                            <Text style={styles.footerLabelCol}>End Time</Text>
                            <Text style={styles.footerValCol}></Text>
                        </View>
                        <View style={styles.footerInnerRow}>
                            <Text style={styles.footerLabelCol}>Total Time</Text>
                            <Text style={styles.footerValCol}></Text>
                        </View>
                        <View style={styles.footerInnerRow}>
                            <Text style={[styles.footerLabelCol, styles.footerBold]}>Start KM</Text>
                            <Text style={styles.footerValCol}></Text>
                        </View>
                        <View style={[styles.footerInnerRow, { borderBottom: 'none' }]}>
                            <Text style={[styles.footerLabelCol, styles.footerBold]}>End KM</Text>
                            <Text style={styles.footerValCol}></Text>
                        </View>
                    </View>

                    {/* Middle Footer Block */}
                    <View style={styles.footerBlockCol2}>
                        <View style={[styles.footerInnerRow, { flex: 1 }]}>
                            <Text style={styles.footerBold}>Driver Name</Text>
                        </View>
                        <View style={[styles.footerInnerRow, { flex: 1 }]}>
                            <Text style={styles.footerBold}>Vehicle Number</Text>
                        </View>
                        <View style={[styles.footerInnerRow, { flex: 1, borderBottom: 'none' }]}>
                            <Text style={styles.footerBold}>Vendor Name</Text>
                        </View>
                    </View>

                    {/* Right Footer Block */}
                    <View style={styles.footerBlockCol3}>
                        <View style={[styles.footerInnerRow, { borderBottom: 'none', padding: 6 }]}>
                            <Text style={styles.footerBold}>Remarks:</Text>
                        </View>
                        <View style={[styles.footerInnerRow, { borderBottom: 'none', paddingBottom: 0 }]}>
                            <Text style={{ width: '33.33%' }}>EscortID/Name</Text>
                            <Text style={{ width: '33.33%' }}>Signature</Text>
                            <Text style={{ width: '33.33%' }}>Approval</Text>
                        </View>
                        <View style={[styles.footerInnerRow, { borderBottom: 'none', height: 40 }]}></View>
                    </View>
                </View>

                {/* Legacy Declaration (Visible mostly for Drops) */}
                {isDrop && (
                    <View>
                        <Text style={styles.declarationLabel}>
                            Note : * I,__________________ will be the last drop in the cab. Signature __________________{"\n\n"}
                            {"       "}* I, __________________ have been dropped off at __________________ (p.m./ a.m.) Signature __________________
                        </Text>
                    </View>
                )}
            </Page>
        );
    };

    return (
        <Document>
            {sheetsData.map((sheet, index) => generatePage(sheet, index))}
        </Document>
    );
};

export default TripSheetPdfDocument;

