import React from 'react';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';

/**
 * MobileHeader
 * 
 * Standardized header for mobile views.
 * 
 * @param {string} title - Page title
 * @param {string} subtitle - Optional subtitle/breadcrumbs
 * @param {Function} onBack - Custom back handler (defaults to router back)
 * @param {ReactNode} rightContent - Optional actions (buttons, icons) on the right
 * @param {boolean} showBack - Whether to show the back button (default: true)
 */
const MobileHeader = ({ 
    title, 
    subtitle, 
    onBack, 
    rightContent, 
    showBack = true,
    className = ""
}) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <div 
            className={`sticky-top bg-white border-bottom shadow-sm d-flex align-items-center justify-content-between px-3 py-2 ${className}`}
            style={{ zIndex: 1000, height: '60px' }}
        >
            <div className="d-flex align-items-center gap-2 overflow-hidden">
                {showBack && (
                    <Button 
                        icon="pi pi-arrow-left" 
                        rounded 
                        text 
                        severity="secondary" 
                        aria-label="Back"
                        onClick={handleBack}
                        className="p-0"
                        style={{ width: '32px', height: '32px' }}
                    />
                )}
                
                <div className="d-flex flex-column overflow-hidden">
                    <h5 className="mb-0 text-truncate fw-bold text-dark" style={{ fontSize: '1.1rem' }}>
                        {title}
                    </h5>
                    {subtitle && (
                        <small className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                            {subtitle}
                        </small>
                    )}
                </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-shrink-0">
                {rightContent}
            </div>
        </div>
    );
};

export default MobileHeader;
