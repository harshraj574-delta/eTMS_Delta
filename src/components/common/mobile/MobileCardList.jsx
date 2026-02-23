import React from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { Ripple } from 'primereact/ripple';

/**
 * MobileCardList
 * 
 * A reusable mobile-first list component that handles:
 * - Loading states
 * - Empty states
 * - Pull-to-refresh (simulated via refresh button for web)
 * - Pagination (Load More)
 * 
 * @param {Array} data - Array of data items to display
 * @param {Function} itemTemplate - Render prop for each item (item, index) => ReactNode
 * @param {boolean} isLoading - Loading state
 * @param {Function} onRefresh - Callback for refresh action
 * @param {string} emptyMessage - Message to show when no data
 * @param {string} title - Optional title for the list section
 * @param {Function} onLoadMore - Optional callback for pagination
 * @param {boolean} hasMore - Whether there is more data to load
 */
const MobileCardList = ({ 
    data = [], 
    itemTemplate, 
    isLoading = false, 
    onRefresh, 
    emptyMessage = "No records found",
    title,
    onLoadMore,
    hasMore = false
}) => {
    
    // Aesthetic loading skeleton or spinner
    if (isLoading && data.length === 0) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center p-5" style={{ minHeight: '300px' }}>
                <ProgressSpinner style={{width: '50px', height: '50px'}} strokeWidth="4" />
                <span className="text-muted mt-3">Loading data...</span>
            </div>
        );
    }

    // Empty state
    if (!isLoading && data.length === 0) {
        return (
            <div className="text-center p-5 bg-light rounded-3 m-3 border border-dashed">
                <i className="pi pi-inbox text-muted mb-3" style={{ fontSize: '2rem' }}></i>
                <p className="text-muted mb-3">{emptyMessage}</p>
                {onRefresh && (
                    <Button 
                        label="Refresh" 
                        icon="pi pi-refresh" 
                        text 
                        onClick={onRefresh} 
                    />
                )}
            </div>
        );
    }

    return (
        <div className="mobile-card-list pb-3">
            {/* Optional Title / Header Row */}
            {(title || onRefresh) && (
                <div className="d-flex justify-content-between align-items-center px-3 py-2 mb-2">
                    {title && <h6 className="m-0 fw-bold text-secondary">{title}</h6>}
                    {onRefresh && (
                        <Button 
                            icon="pi pi-refresh" 
                            rounded 
                            text 
                            size="small"
                            onClick={onRefresh}
                            className="p-0 text-secondary"
                            tooltip="Refresh"
                            tooltipOptions={{ position: 'left' }}
                        />
                    )}
                </div>
            )}

            {/* List Items */}
            <div className="px-3 d-flex flex-column gap-3">
                {data.map((item, index) => (
                    <div key={item.id || index} className="mobile-card-item fade-in-up">
                        {itemTemplate(item, index)}
                    </div>
                ))}
            </div>

            {/* Load More / Pagination */}
            {onLoadMore && hasMore && (
                <div className="p-3 text-center">
                    <Button 
                        label={isLoading ? "Loading..." : "Load More"} 
                        icon={isLoading ? "pi pi-spin pi-spinner" : "pi pi-arrow-down"}
                        onClick={onLoadMore}
                        disabled={isLoading}
                        outlined
                        className="w-100 p-button-secondary"
                    />
                </div>
            )}
            
            {/* Bottom spacer for FABs or bottom nav */}
            <div style={{ height: '20px' }}></div>

            <style>{`
                .fade-in-up {
                    animation: fadeInUp 0.4s ease-out;
                }
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default MobileCardList;
