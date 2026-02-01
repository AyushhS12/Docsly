import { Check, X, Users, Clock, FileText, CheckCircle2 } from "lucide-react";
import type { CollabRequest, CollabRequestHandler } from "../lib/utils";
import { useEffect, useRef } from "react";
import api from "../lib/api";
import toast, { ErrorIcon } from "react-hot-toast";

interface Props {
    requests: CollabRequest[];
    onClose: () => void;
}

export default function CollabRequestsDropdown({ requests, onClose }: Props) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [onClose]);

    const handleRequest = async (data: CollabRequestHandler) => {
        const toastId = toast.loading("Loading...")
        try {
            const res = await api.post("/doc/collab/request", data)
            if (res.data.success) {
                if (data.action === "accept") {
                    setTimeout(() => {
                        toast.success("Request Accepted", {
                            id: toastId,
                            icon: <CheckCircle2 className="text-green-500" />,
                            duration: 2000,
                        })
                    }, 1300)
                } else {
                    setTimeout(() => {
                        toast.success("Request Rejected", {
                            id: toastId,
                            icon: <CheckCircle2 className="text-green-500" />,
                            duration: 2000,
                        })
                    }, 1300)
                }
                return
            }
            setTimeout(() => {
                toast.success("An error Occured", {
                    id: toastId,
                    icon: <ErrorIcon className="text-red-500" />,
                    duration: 1500,
                })
            }, 1300)
        } catch (e) {
            console.log(e)
        }
    }

    return (
        <div
            ref={ref}
            className="absolute right-0 mt-3 w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-purple-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
            {/* Header */}
            <div className="px-5 py-4 border-b border-purple-50 bg-linear-to-r from-purple-50/50 to-pink-50/50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="bg-purple-100 p-1.5 rounded-lg">
                        <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wider text-gray-700">Collaboration Requests</span>
                </div>
                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    {requests.length}
                </span>
            </div>

            {/* List */}
            <div className="max-h-112.5 overflow-y-auto">
                {requests.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Check className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-400 font-medium">No pending requests</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {requests.map(req => (
                            <div
                                key={req._id.$oid}
                                className="p-4 hover:bg-purple-50/30 transition-colors"
                            >
                                <div className="flex flex-col space-y-3">
                                    {/* User Info */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-7 h-7 bg-linear-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                                                {req.from.$oid.slice(-2).toUpperCase()}
                                            </div>
                                            <p className="text-sm font-bold text-gray-800">
                                                User <span className="text-purple-600">...{req.from.$oid.slice(-6)}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center text-[11px] text-gray-400 font-medium">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {/* Replace with actual req.timestamp if available */}
                                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>

                                    {/* Document Details */}
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <div className="flex items-center space-x-2 text-gray-700 mb-1">
                                            <FileText className="w-4 h-4 text-purple-500" />
                                            <span className="text-sm font-semibold truncate">
                                                {/* req.doc_name should be passed from backend or joined */}
                                                {req.doc.$oid || "Untitled Realtime Doc"}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 ml-6">
                                            ID: {req.doc.$oid}
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center space-x-2 pt-1">
                                        <button
                                            onClick={() => handleRequest({ action: "accept", request: req })}
                                            className="flex-1 flex items-center justify-center space-x-2 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-all shadow-md active:scale-95"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Accept</span>
                                        </button>
                                        <button
                                            onClick={() => handleRequest({ action: "reject", request: req })}
                                            className="flex-1 flex items-center justify-center space-x-2 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg text-xs font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-95"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                            <span>Decline</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}