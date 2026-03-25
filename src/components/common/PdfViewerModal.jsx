import React from 'react';
import { Dialog } from 'primereact/dialog';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import './PdfViewerModal.css';

/**
 * A reusable modal that renders a given PDF Document definition.
 *
 * @param {boolean} visible Controls modal visibility
 * @param {function} onHide Callback when modal closes
 * @param {React.ReactElement} document The @react-pdf/renderer Document component to render
 * @param {string} fileName The default filename for downloading
 * @param {string} title Modal title
 */
const PdfViewerModal = ({
    visible,
    onHide,
    document,
    fileName = 'document.pdf',
    title = 'PDF Viewer'
}) => {
    const renderHeader = () => {
        return (
            <div className="d-flex w-100 justify-content-between align-items-center me-2 gap-2">
                <span>{title}</span>

                <PDFDownloadLink
                    document={document}
                    fileName={fileName}
                    className="pdf-download-btn"
                >
                    {({ loading }) =>
                        loading ? (
                            'Preparing document...'
                        ) : (
                            <>
                                <i className="pi pi-download me-2"></i>
                                Download PDF
                            </>
                        )
                    }
                </PDFDownloadLink>
            </div>
        );
    };

    return (
        <Dialog
            header={renderHeader()}
            visible={visible}
            style={{ width: '80vw', height: '90vh' }}
            maximizable
            modal
            onHide={onHide}
            contentStyle={{ padding: 0, overflow: 'hidden' }}
            baseZIndex={1300}
        >
            <div style={{ width: '100%', height: '100%', minHeight: '500px' }}>
                {visible && (
                    <PDFViewer
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                    >
                        {document}
                    </PDFViewer>
                )}
            </div>
        </Dialog>
    );
};

export default PdfViewerModal;