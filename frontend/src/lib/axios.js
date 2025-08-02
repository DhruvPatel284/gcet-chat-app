import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
console.log("backend url : ",backendUrl)
export const axiosInstance = axios.create({
  baseURL: (backendUrl ? backendUrl + "/api" : "http://localhost:5001/api"),
  withCredentials: true,
});

