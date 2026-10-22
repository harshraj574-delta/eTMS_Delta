import axios from 'axios';

const baseUrl = "/api/api/v1";
const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}

const api = axios.create({
    baseURL: baseUrl,
    headers

})

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            try {
                // Dynamic import to avoid circular dependency
                const { default: useSessionStore } = await import('../../store/useSessionStore');
                useSessionStore.getState().logout();
                // Optional: Redirect to login if needed, but logout usually handles it via state change
                // window.location.href = '/'; 
            } catch (e) {
                console.error("Error during logout interceptor:", e);
            }
        }
        return Promise.reject(error);
    }
);

export { api }