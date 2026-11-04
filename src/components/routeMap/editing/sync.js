import { useEffect, useRef } from 'react';

/**
 * Cross-tab route-edit notifications.
 *
 * RouteMap opens in its own tab, so it has its own TanStack Query cache.
 * Whenever either page changes routes on the server it posts here, and the
 * other tab invalidates its cache. One shared channel instance is used for
 * both posting and listening, so a tab never receives its own messages.
 */
const CHANNEL_NAME = 'etms-route-edits';

let channel = null;
const getChannel = () => {
    if (channel) return channel;
    if (typeof BroadcastChannel === 'undefined') return null;
    try {
        channel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
        channel = null;
    }
    return channel;
};

/** @param {{ source: string, action: string, routeIds?: string[] }} payload */
export const notifyRouteEdit = (payload) => {
    try {
        getChannel()?.postMessage({ ...payload, at: Date.now() });
    } catch {
        // Notifications are best effort; the other tab still refreshes on focus.
    }
};

export const useRouteEditListener = (onEdit) => {
    const onEditRef = useRef(onEdit);
    onEditRef.current = onEdit;

    useEffect(() => {
        const ch = getChannel();
        if (!ch) return undefined;
        const handler = (event) => onEditRef.current?.(event.data);
        ch.addEventListener('message', handler);
        return () => ch.removeEventListener('message', handler);
    }, []);
};
