import React, { lazy, Suspense } from 'react';
import useManageRouteLogic from '../hooks/compliance/useManageRouteLogic';
import useIsMobile from './common/useIsMobile';
import Loader from './common/Loader';

// Each variant is its own chunk so phones don't download the desktop
// view (and vice versa). The shared logic hook lives in this container,
// so filters/search survive a viewport switch.
const ManageRouteDesktop = lazy(() => import('./ManageRouteDesktop'));
const ManageRouteMobile = lazy(() => import('./ManageRouteMobile'));

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
            <Suspense fallback={<Loader fullScreen />}>
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
            </Suspense>
        );
    }

    // Desktop View
    return (
        <Suspense fallback={<Loader fullScreen />}>
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
        </Suspense>
    );
};

export default ManageRoute;

