import axios from "axios";

export const BaseUrl = import.meta.env.VITE_BACKEND_URL==="http://localhost:7878"?"":import.meta.env.VITE_BACKEND_URL

const api = axios.create({baseURL:BaseUrl+"/api",withCredentials:true})

export default api 