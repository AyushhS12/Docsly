import axios from "axios";

const url = import.meta.env.VITE_BACKEND_URL==="http://localhost:7878"?"/api":import.meta.env.VITE_BACKEND_URL

const api = axios.create({baseURL:url,withCredentials:true})

export default api 