import axios from 'axios';
import { API_BASE, attachAuth } from '../http/apiClient';

const baseUrl = API_BASE;
const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}

const api = axios.create({
    baseURL: baseUrl,
    headers

})

// Identity headers on every request; 401 logs out, 403 is left to the caller.
attachAuth(api);


export { api }