/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { FileText, Home, ArrowLeft, Sparkles, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundWithoutAuth() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [_isHovering, setIsHovering] = useState(false);
    const navigate = useNavigate()
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const floatingDocs = [
        { id: 1, rotation: 15, delay: 0, x: 20, y: 10 },
        { id: 2, rotation: -20, delay: 0.5, x: 70, y: 15 },
        { id: 3, rotation: 10, delay: 1, x: 40, y: 70 },
        { id: 4, rotation: -15, delay: 1.5, x: 80, y: 60 },
        { id: 5, rotation: 25, delay: 2, x: 10, y: 80 },
    ];

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden flex items-center justify-center p-4">
            {/* Animated background elements */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse" />
            <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse" style={{ animationDelay: '0.5s' }} />

            {/* Floating documents in background */}
            {floatingDocs.map((doc) => (
                <div
                    key={doc.id}
                    className="absolute opacity-10 pointer-events-none"
                    style={{
                        left: `${doc.x}%`,
                        top: `${doc.y}%`,
                        transform: `rotate(${doc.rotation}deg)`,
                        animation: `float 6s ease-in-out infinite`,
                        animationDelay: `${doc.delay}s`,
                    }}
                >
                    <FileText className="w-16 h-16 text-purple-600" />
                </div>
            ))}

            {/* Interactive cursor effect */}
            <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                    background: `radial-gradient(circle 600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(168, 85, 247, 0.15), transparent)`,
                }}
            />

            {/* Main Content */}
            <div className="relative z-10 max-w-2xl mx-auto text-center">
                {/* Logo */}
                <div className="flex items-center justify-center space-x-2 mb-8">
                    <div className="bg-linear-to-br from-purple-500 to-pink-500 p-3 rounded-2xl shadow-lg">
                        <FileText className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-3xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Docsly
                    </span>
                </div>

                {/* 404 Animation */}
                <div className="mb-8 relative">
                    <h1 className="text-9xl md:text-[12rem] font-bold bg-linear-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent leading-none select-none">
                        404
                    </h1>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <Sparkles className="w-12 h-12 text-yellow-400 animate-pulse" />
                    </div>
                </div>

                {/* Message */}
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
                    Oops! Page not found
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    The document you're looking for seems to have wandered off into the cloud.
                    Don't worry, we'll help you find your way back.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                    <button
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                        onClick={()=>{
                            navigate("/")
                        }}
                        className="px-8 py-4 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-2xl transform hover:scale-105 transition-all flex items-center space-x-2 group"
                    >
                        <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Go to Home</span>
                    </button>
                </div>

                {/* Quick Links */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-100 shadow-lg">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                        Quick Links
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={()=>{navigate("/auth")}} className="flex items-center space-x-2 px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
                            <User className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-700">Login/Signup</span>
                        </button>
                        <button onClick={()=>{navigate(-1)}} className="flex items-center space-x-2 px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
                            <ArrowLeft className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-700">Go Back</span>
                        </button>
                    </div>
                </div>

                {/* Fun Message */}
                <p className="mt-8 text-sm text-gray-500 italic">
                    "Even the best explorers get lost sometimes. Let's get you back on track! 🚀"
                </p>
            </div>

            <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(var(--rotation));
          }
          50% {
            transform: translateY(-20px) rotate(calc(var(--rotation) + 10deg));
          }
        }
      `}</style>
        </div>
    );
}