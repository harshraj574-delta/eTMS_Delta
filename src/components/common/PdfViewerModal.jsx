import React from 'react';
import AppDialog from './AppDialog';
import { Button } from 'primereact/button';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import './PdfViewerModal.css';

const PdfViewerModal = ({
    visible,
    onHide,
    document,
    fileName = 'document.pdf',
    title = 'PDF Viewer'
}) => {
    const footerContent = (
        <div className="d-flex gap-2 justify-content-between w-100">
            <PDFDownloadLink document={document} fileName={fileName} className="pdf-download-btn">
                {({ loading }) =>
                    loading ? 'Preparing document...' : (
                        <><i className="pi pi-download me-2" />Download PDF</>
                    )
                }
            </PDFDownloadLink>
            <Button label="Close" outlined onClick={onHide} />
        </div>
    );

    return (
        <AppDialog
            title={title}
            icon="pi pi-file-pdf"
            iconColor="#ef4444"
            visible={visible}
            onHide={onHide}
            size="xl"
            footer={footerContent}
            maximizable
            style={{ width: '80vw', height: '90vh' }}
            contentStyle={{ padding: 0, overflow: 'hidden' }}
        >
            <div style={{ width: '100%', height: '100%', minHeight: '500px' }}>
                {visible && (
                    <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
                        {document}
                    </PDFViewer>
                )}
            </div>
        </AppDialog>
    );
};

export default PdfViewerModal;
