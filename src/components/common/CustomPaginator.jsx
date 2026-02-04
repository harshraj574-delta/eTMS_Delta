import React from 'react';
import { Paginator } from 'primereact/paginator';
import { Dropdown } from 'primereact/dropdown';
import PropTypes from 'prop-types';
import useIsMobile from './useIsMobile';

const CustomPaginator = ({
    first,
    rows,
    totalRecords,
    onPageChange,
    rowsPerPageOptions = [10, 20, 50],
    className = "",
    ...props
}) => {
    const isMobile = useIsMobile(768);

    // Desktop template - horizontal layout
    const desktopTemplate = {
        layout: 'RowsPerPageDropdown PrevPageLink CurrentPageReport NextPageLink',
        RowsPerPageDropdown: (options) => {
            const dropdownOptions = rowsPerPageOptions.map(opt => ({ label: opt, value: opt }));

            return (
                <div className="d-flex align-items-center">
                    <span className="me-1" style={{ 
                        fontFamily: 'Plus Jakarta Sans',
                        fontWeight: '500', 
                        fontSize: '12px',
                        lineClamp: 'none', 
                        lineHeight: '18px',
                        letterSpacing: '0.03em', 
                        textAlign: 'right',
                        color: '#545557',
                        userSelect: "none" 
                    }}>Rows per page:</span>
                    <Dropdown 
                        value={options.value} 
                        options={dropdownOptions} 
                        onChange={options.onChange} 
                        appendTo="self" 
                        className="p-paginator-rpp-options" 
                    />
                </div>
            );
        },
        CurrentPageReport: (options) => {
            return (
                <span className="mx-2 text-muted fs-13 fw-medium" style={{ userSelect: "none", minWidth: '30px', textAlign: 'center' }}>
                    {options.currentPage} / {options.totalPages}
                </span>
            );
        }
    };

    // Mobile template - stacked vertical layout
    const mobileTemplate = {
        layout: 'RowsPerPageDropdown PrevPageLink CurrentPageReport NextPageLink',
        RowsPerPageDropdown: (options) => {
            const dropdownOptions = rowsPerPageOptions.map(opt => ({ label: opt, value: opt }));

            return (
                <div className="d-flex align-items-center" style={{ gap: '6px' }}>
                    <span style={{ 
                        fontFamily: 'Plus Jakarta Sans',
                        fontWeight: '500', 
                        fontSize: '11px',
                        color: '#545557',
                        userSelect: "none",
                        whiteSpace: 'nowrap'
                    }}>Rows:</span>
                    <Dropdown 
                        value={options.value} 
                        options={dropdownOptions} 
                        onChange={options.onChange} 
                        appendTo="self" 
                        className="p-paginator-rpp-options"
                        style={{ minWidth: '55px' }}
                    />
                </div>
            );
        },
        CurrentPageReport: (options) => {
            return (
                <span className="text-muted" style={{ 
                    userSelect: "none", 
                    minWidth: '40px', 
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '500',
                    margin: '0 4px'
                }}>
                    {options.currentPage}/{options.totalPages}
                </span>
            );
        }
    };

    const template = isMobile ? mobileTemplate : desktopTemplate;

    // Calculate display text
    const displayText = totalRecords === 0 
        ? '0-0 of 0' 
        : `${first + 1}-${Math.min(first + rows, totalRecords)} of ${totalRecords}`;

    return (
        <div className={isMobile ? "mt-2" : "mt-3"}>
            <Paginator
                first={first}
                rows={rows}
                totalRecords={totalRecords}
                template={template}
                leftContent={!isMobile ? (
                    <span className="text-muted fs-13">
                        {displayText}
                    </span>
                ) : null}
                onPageChange={onPageChange}
                className={`custom-schedule-paginator ${isMobile ? 'justify-content-center' : 'justify-content-end'} ${className}`}
                {...props}
            />
        </div>
    );
};

CustomPaginator.propTypes = {
    first: PropTypes.number.isRequired,
    rows: PropTypes.number.isRequired,
    totalRecords: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
    rowsPerPageOptions: PropTypes.array,
    className: PropTypes.string
};

export default CustomPaginator;
