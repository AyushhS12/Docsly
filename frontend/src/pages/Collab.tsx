import { useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";

export const Collab = () => {
    const {docId} = useParams<{docId: string}>()
    const navigate = useNavigate()
    const placePermissionRequest = useCallback(async()=>{
        try{
            const res = await api.get<{message:string,redirect: boolean}>("/doc/collab/"+docId);
        console.log(res.data)
        if(res.data.redirect){
            toast(res.data.message,{duration: 700})
            navigate("/doc/edit/" + docId)
        } else {
            navigate("/dashboard")
            toast.success("Request sent succesffuly",{duration: 700})
        }
        } catch(e){
            console.log(e)
            console.clear()
            navigate("/auth")
            toast("Please Login")
        }
    },[docId, navigate])
    useEffect(()=>{
        placePermissionRequest()
    },[placePermissionRequest])
  return null;
}
