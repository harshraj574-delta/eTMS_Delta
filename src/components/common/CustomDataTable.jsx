import React from 'react';
import { DataTable } from 'primereact/datatable';
import './CustomDataTable.css';


export const CustomDataTable = (props) => {
    
    const className = `custom-table ${props.className || ''}`;

    return (
        <DataTable {...props} className={className}>
            {props.children}
        </DataTable>
    );
};
