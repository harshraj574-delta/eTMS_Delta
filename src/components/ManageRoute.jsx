import React from 'react';
import useManageRouteLogic from '../hooks/compliance/useManageRouteLogic';
import ManageRouteDesktop from './ManageRouteDesktop';
import ManageRouteMobile from './ManageRouteMobile';
import useIsMobile from './common/useIsMobile';

/**
 * ManageRoute (Container)
 * 
 * Responsibilities:
 * 1. Fetch Data using `useManageRouteLogic`
 * 2. Determine View (Mobile vs Desktop)
 * 3. Pass data & handlers to View
 */
const ManageRoute = () => {
    const { data, actions, state } = useManageRouteLogic();
    const isMobile = useIsMobile();

    // Mobile View
    if (isMobile) {
        return (
            <ManageRouteMobile 
                routes={data.routes}
                facilities={data.facilities}
                shifts={data.shifts}
                isLoading={data.isLoading}
                stats={data.stats}
                vendorSummary={data.vendorSummary}
                
                filters={state.filters}
                onFilterChange={actions.setFilter}
                onSearch={actions.search}
                
                onDeleteEmployee={actions.deleteEmployee}
                
                logic={{ data, actions, state }}
            />
        );
    }
    
    // Desktop View
    return (
        <ManageRouteDesktop 
            // Spread return values or pass explicitly
            routes={data.routes}
            facilities={data.facilities}
            shifts={data.shifts}
            isLoading={data.isLoading}
            stats={data.stats}
            vendorSummary={data.vendorSummary}
            
            // Filters
            filters={state.filters}
            onFilterChange={actions.setFilter}
            onSearch={actions.search}
            
            // Actions
            onDeleteEmployee={actions.deleteEmployee}
            
            // Pass full objects if Desktop needs specific access to things we didn't explicitly map above
            logic={{ data, actions, state }}
        />
    );
};

export default ManageRoute;

