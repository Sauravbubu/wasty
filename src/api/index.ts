import axios from 'axios';

const api = axios.create({
  baseURL: 'https://wasty.in/wasty/v1', // Ensure this is correct
  timeout: 10000, // Optional: Set a timeout for requests
});

export default api;