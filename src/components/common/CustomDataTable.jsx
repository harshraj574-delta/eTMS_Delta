import React from 'react';
import { DataTable } from 'primereact/datatable';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import './CustomDataTable.css';

// Custom sort icon component with dual arrows
const CustomSortIcon = ({ sortOrder }) => {
    return (
        <span className="custom-sort-icon-wrapper">
            <ArrowDropUpIcon 
                className={`custom-sort-icon sort-up ${sortOrder === 1 ? 'active' : ''}`}
            />
            <ArrowDropDownIcon 
                className={`custom-sort-icon sort-down ${sortOrder === -1 ? 'active' : ''}`}
            />
        </span>
    );
};

export const CustomDataTable = (props) => {
    
    const className = `custom-table ${props.className || ''}`;

    return (
        <DataTable 
            {...props} 
            className={className}
            sortIcon={(options) => <CustomSortIcon sortOrder={options.sortOrder} />}
        >
            {props.children}
        </DataTable>
    );
};
