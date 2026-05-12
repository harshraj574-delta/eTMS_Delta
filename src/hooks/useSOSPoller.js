import { useEffect } from 'react';
import { sosService } from '../services/compliance/SOSService';
import useSOSStore from '../store/useSOSStore';

const POLL_INTERVAL = 20000;

const useSOSPoller = () => {
  const setAlerts = useSOSStore((state) => state.setAlerts);

  useEffect(() => {
    const fetchSOS = async () => {
      if (document.hidden) return;
      try {
        const alerts = await sosService.checkSOS();
        setAlerts(alerts);
      } catch {
        // silent — don't break UI on poll failure
      }
    };

    fetchSOS();
    const interval = setInterval(fetchSOS, POLL_INTERVAL);

    const handleVisibility = () => {
      if (!document.hidden) fetchSOS();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [setAlerts]);
};

export default useSOSPoller;
