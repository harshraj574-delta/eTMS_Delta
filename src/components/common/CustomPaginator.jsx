import React from 'react';
import { Paginator } from 'primereact/paginator';
import { Dropdown } from 'primereact/dropdown';
import PropTypes from 'prop-types';

const CustomPaginator = ({
    first,
    rows,
    totalRecords,
    onPageChange,
    rowsPerPageOptions = [10, 20, 50],
    className = "",
    ...props
}) => {
    

    const template = {
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

    return (
        <div className="mt-3">
            <Paginator
                first={first}
                rows={rows}
                totalRecords={totalRecords}
                template={template}
                leftContent={
                    <span className="text-muted fs-13">
                        {totalRecords === 0 ? '0-0 of 0' : `${first + 1}-${Math.min(first + rows, totalRecords)} of ${totalRecords}`}
                    </span>
                }
                onPageChange={onPageChange}
                className={`custom-schedule-paginator justify-content-end ${className}`}
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
