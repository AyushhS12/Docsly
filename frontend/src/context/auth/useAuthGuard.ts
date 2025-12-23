import { useCallback } from "react"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"
import api from "../../lib/api"

const useAuthGuard = () => {
    const token = localStorage.getItem("docsly_token")
    const navigate = useNavigate()
    const guard = useCallback(async () => {
        if (!token) {
            toast.error("Please Login")
            navigate("/auth")
        } else {
            try {
                const res = await api.get<{ success: boolean }>("/auth/me", { withCredentials: true });
                if (res.data.success) {
                    return
                } else {
                    toast.error("Please Login Again")
                    navigate("/auth")
                }
            } catch (e) {
                // toast.error("Please Login Again")
                //     navigate("/auth")
                console.error(e)
            }
        }
    }, [navigate, token])
    const logout = useCallback(() => {
        const token = localStorage.getItem("docsly_token")
        if (token) {
            localStorage.removeItem("docsly_token")
            toast.success("Logged out Successfully")
            navigate("/auth")
        }
        navigate("/auth")
    }, [navigate])
    return { guard, logout }
}

export default useAuthGuard