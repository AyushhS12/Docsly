import { useCallback } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";

const useAuthGuard = () => {
    const navigate = useNavigate();

    const guard = useCallback(async () => {
        try {
            const res = await api.get<{ success: boolean }>("/auth/me", {
                withCredentials: true,
            });

            if (!res.data.success) {
                throw new Error("Not authenticated");
            }
        } catch (err) {
            console.error(err)
            toast.error("Please login");
            navigate("/auth", { replace: true });
        }   
    }, [navigate]);

    const logout = useCallback(async () => {
        try {
            await api.get("/auth/logout", { withCredentials: true });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {
            // ignore
        } finally {
            toast.success("Logged out successfully");
            navigate("/auth", { replace: true });
        }
    }, [navigate]);

    return { guard, logout };
};

export default useAuthGuard;
