import { useState, useCallback } from "react";

export const useRetry = (asyncFunction, maxRetries = 3, delayMs = 1000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      setRetryCount(0);

      let lastError = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await asyncFunction(...args);
          setData(result);
          setLoading(false);
          setRetryCount(0);
          return result;
        } catch (err) {
          lastError = err;
          setRetryCount(attempt + 1);

          if (attempt < maxRetries) {
            const waitTime = delayMs * Math.pow(2, attempt); // Exponential backoff
            console.log(
              `Attempt ${attempt + 1} failed. Retrying in ${waitTime}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          }
        }
      }

      setError(lastError);
      setLoading(false);
      throw lastError;
    },
    [asyncFunction, maxRetries, delayMs]
  );

  const retry = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  return { data, loading, error, retryCount, execute, retry };
};