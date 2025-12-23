import axios from "axios";

const baseUrl = import.meta.env.VITE_BACKEND_URL
const url = baseUrl===undefined||baseUrl==""?"/":baseUrl

const api = axios.create({baseURL:url,withCredentials:true})

export default api 