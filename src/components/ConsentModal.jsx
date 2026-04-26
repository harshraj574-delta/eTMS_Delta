import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import ConsentModalService from '../services/compliance/ConsentModalService';
import useSessionStore from '../store/useSessionStore';

const ConsentModal = ({ visible, onAgree }) => {
    const userId = useSessionStore((state) => state.user?.ID);
    const [disclaimerText, setDisclaimerText] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!visible) return;
        const fetchDisclaimer = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await ConsentModalService.sp_getempdisclaimer();
                const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setDisclaimerText(parsed[0].description || '');
                }
            } catch {
                setError('Unable to load consent information. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchDisclaimer();
    }, [visible]);

    const handleAgree = async () => {
        setSubmitting(true);
        setError('');
        try {
            await ConsentModalService.InsertUserDisclaimerStatus({ Status: 1, UpdatedBy: Number(userId) });
            onAgree();
        } catch {
            setError('Failed to record your consent. Please try again.');
            setSubmitting(false);
        }
    };

    const headerTemplate = (
        <div className="consent-modal-header">
            <div className="consent-modal-icon">
                <i className="pi pi-shield" />
            </div>
            <div>
                <div className="consent-modal-title">Terms &amp; Consent</div>
                <div className="consent-modal-subtitle">Please read and accept to continue</div>
            </div>
        </div>
    );

    const footerTemplate = (
        <div className="consent-modal-footer">
            <button
                className="consent-agree-btn"
                onClick={handleAgree}
                disabled={submitting || loading || !!error}
            >
                {submitting ? (
                    <>
                        <ProgressSpinner style={{ width: '16px', height: '16px' }} strokeWidth="4" />
                        <span>Processing...</span>
                    </>
                ) : (
                    <>
                        <i className="pi pi-check" />
                        <span>I Agree &amp; Continue</span>
                    </>
                )}
            </button>
        </div>
    );

    return (
        <>
            <style>{`
                .consent-modal .p-dialog {
                    border-radius: 14px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px -12px rgba(74, 54, 236, 0.25), 0 8px 24px rgba(0,0,0,0.12);
                    border: none;
                    animation: consentSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes consentSlideIn {
                    from { opacity: 0; transform: scale(0.96) translateY(16px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0);    }
                }

                .consent-modal .p-dialog-mask {
                    backdrop-filter: blur(6px);
                    -webkit-backdrop-filter: blur(6px);
                    background: rgba(28, 29, 32, 0.6);
                }

                .consent-modal .p-dialog-header {
                    padding: 20px 24px 16px;
                    border-bottom: 1px solid #f0eeff;
                    background: #fff;
                }

                .consent-modal .p-dialog-header-icons {
                    display: none;
                }

                .consent-modal .p-dialog-content {
                    padding: 20px 24px;
                    background: #fff;
                }

                .consent-modal .p-dialog-footer {
                    padding: 16px 24px 20px;
                    border-top: 1px solid #f0eeff;
                    background: #fff;
                }

                /* Header */
                .consent-modal-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .consent-modal-icon {
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #4a36ec 0%, #6c56f5 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 4px 12px rgba(74, 54, 236, 0.35);
                }

                .consent-modal-icon .pi {
                    color: #fff;
                    font-size: 17px;
                }

                .consent-modal-title {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-weight: 700;
                    font-size: 16px;
                    color: #1c1d20;
                    line-height: 1.3;
                }

                .consent-modal-subtitle {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 12px;
                    color: #6b7280;
                    font-weight: 400;
                    margin-top: 2px;
                }

                /* Notice banner */
                .consent-notice {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #f5f3ff;
                    border: 1px solid #ddd6fe;
                    border-radius: 8px;
                    padding: 8px 12px;
                    margin-bottom: 16px;
                }

                .consent-notice .pi {
                    color: #4a36ec;
                    font-size: 13px;
                    flex-shrink: 0;
                }

                .consent-notice span {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 12px;
                    font-weight: 600;
                    color: #4a36ec;
                }

                /* Disclaimer text area */
                .consent-text-area {
                    max-height: 220px;
                    overflow-y: auto;
                    scrollbar-width: thin;
                    scrollbar-color: #c4b8fb #f0eeff;
                    padding-right: 6px;
                }

                .consent-text-area::-webkit-scrollbar {
                    width: 5px;
                }

                .consent-text-area::-webkit-scrollbar-track {
                    background: #f0eeff;
                    border-radius: 4px;
                }

                .consent-text-area::-webkit-scrollbar-thumb {
                    background: #c4b8fb;
                    border-radius: 4px;
                }

                .consent-text {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 14px;
                    line-height: 1.75;
                    color: #374151;
                    margin: 0;
                    white-space: pre-wrap;
                }

                /* Loading state */
                .consent-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 32px 0;
                    gap: 14px;
                }

                .consent-loading span {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 13px;
                    color: #6b7280;
                }

                /* Error state */
                .consent-error {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 8px;
                    padding: 14px 16px;
                }

                .consent-error .pi {
                    color: #dc2626;
                    flex-shrink: 0;
                    margin-top: 1px;
                }

                .consent-error span {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 14px;
                    color: #dc2626;
                }

                /* Footer */
                .consent-modal-footer {
                    display: flex;
                    justify-content: flex-end;
                }

                .consent-agree-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: linear-gradient(135deg, #4a36ec 0%, #6c56f5 100%);
                    color: #fff;
                    border: none;
                    border-radius: 8px;
                    padding: 10px 28px;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: opacity 0.2s, transform 0.15s;
                    box-shadow: 0 4px 14px rgba(74, 54, 236, 0.35);
                }

                .consent-agree-btn:hover:not(:disabled) {
                    opacity: 0.88;
                    transform: translateY(-1px);
                }

                .consent-agree-btn:active:not(:disabled) {
                    transform: translateY(0);
                }

                .consent-agree-btn:disabled {
                    background: linear-gradient(135deg, #a0a0a0 0%, #b8b8b8 100%);
                    box-shadow: none;
                    cursor: not-allowed;
                }
            `}</style>

            <Dialog
                visible={visible}
                header={headerTemplate}
                footer={footerTemplate}
                closable={false}
                dismissableMask={false}
                modal
                className="consent-modal"
                style={{ width: '500px', maxWidth: '95vw' }}
                breakpoints={{ '768px': '95vw' }}
            >
                {loading ? (
                    <div className="consent-loading">
                        <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="4" />
                        <span>Loading consent information...</span>
                    </div>
                ) : error ? (
                    <div className="consent-error">
                        <i className="pi pi-exclamation-triangle" />
                        <span>{error}</span>
                    </div>
                ) : (
                    <>
                        <div className="consent-notice">
                            <i className="pi pi-info-circle" />
                            <span>Action required — you must agree to continue</span>
                        </div>
                        <div className="consent-text-area">
                            <p className="consent-text">{disclaimerText}</p>
                        </div>
                    </>
                )}
            </Dialog>
        </>
    );
};

export default ConsentModal;
