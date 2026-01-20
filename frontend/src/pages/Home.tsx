import { useState, useEffect } from 'react';
import { FileText, Users, Zap, Globe, Check, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DocslyLanding() {
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate()
    useEffect(() => {
        const handleMouseMove = async (e: MouseEvent) => {
            setIsVisible(true)
            setCursorPos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [navigate]);

    const features = [
        { icon: <Zap className="w-6 h-6" />, title: "Real-time Editing", desc: "See changes instantly as you and your team type" },
        { icon: <Users className="w-6 h-6" />, title: "Collaborative", desc: "Work together seamlessly with your entire team" },
        { icon: <Globe className="w-6 h-6" />, title: "Accessible Anywhere", desc: "Edit from any device, anywhere in the world" },
        { icon: <Sparkles className="w-6 h-6" />, title: "Smart Features", desc: "AI-powered suggestions and formatting tools" }
    ];

    const pricing = [
        { name: "Free", price: "$0", features: ["Up to 5 documents", "2 collaborators", "Basic features", "Community support"] },
        { name: "Pro", price: "$12", features: ["Unlimited documents", "10 collaborators", "Advanced features", "Priority support"], popular: true },
        { name: "Team", price: "$29", features: ["Unlimited everything", "Unlimited collaborators", "Admin controls", "24/7 support"] }
    ];

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
            {/* Animated background elements */}
            <div
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                    background: `radial-gradient(circle 800px at ${cursorPos.x}px ${cursorPos.y}px, rgba(139, 92, 246, 0.15), transparent)`
                }}
            />

            <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse" />
            <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse delay-1000" />
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse delay-500" />

            {/* Navigation */}
            <nav className="relative z-10 container mx-auto px-6 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 group cursor-pointer">
                        <div className="bg-linear-to-br from-purple-500 to-pink-500 p-2 rounded-xl shadow-lg transform group-hover:scale-110 transition-transform">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Docsly
                        </span>
                    </div>
                    <div className="hidden md:flex space-x-8 text-gray-700">
                        <a href="#features" className="hover:text-purple-600 transition-colors">Features</a>
                        <a href="#pricing" className="hover:text-purple-600 transition-colors">Pricing</a>
                        <a href="#about" className="hover:text-purple-600 transition-colors">About</a>
                    </div>
                    <div className="flex space-x-4">
                        <button onClick = {()=>{navigate("auth")}}className="px-4 py-2 cursor-pointer text-purple-600 hover:text-purple-700 transition-colors">
                            Sign In
                        </button>
                        <button onClick={()=>{navigate("auth",{state:true})}} className="px-6 py-2 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all">
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className={`relative z-10 container mx-auto px-6 pt-20 pb-32 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="text-center max-w-4xl mx-auto">
                    <div className="inline-block mb-4 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md">
                        <span className="text-purple-600 font-semibold flex items-center space-x-2">
                            <Sparkles className="w-4 h-4" />
                            <span>Now with AI-powered features</span>
                        </span>
                    </div>
                    <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-linear-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent animate-gradient">
                        Collaborate in Real-time
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
                        The modern document editor built for teams. Edit together, see changes instantly, and create amazing content without limits.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button className="px-8 py-4 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-2xl transform hover:scale-105 transition-all flex items-center space-x-2 group">
                            <span>Start Creating Free</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="px-8 py-4 bg-white/80 backdrop-blur-sm text-purple-600 rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all">
                            Watch Demo
                        </button>
                    </div>

                    {/* Animated mockup */}
                    <div className="mt-16 relative">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition-transform border border-purple-100">
                            <div className="flex items-center space-x-2 mb-6">
                                <div className="w-3 h-3 bg-red-400 rounded-full" />
                                <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                                <div className="w-3 h-3 bg-green-400 rounded-full" />
                            </div>
                            <div className="space-y-3 text-left">
                                <div className="h-4 bg-linear-to-r from-purple-200 to-transparent rounded w-3/4 animate-pulse" />
                                <div className="h-4 bg-linear-to-r from-pink-200 to-transparent rounded w-full animate-pulse delay-100" />
                                <div className="h-4 bg-linear-to-r from-purple-200 to-transparent rounded w-5/6 animate-pulse delay-200" />
                                <div className="flex space-x-2 pt-4">
                                    <div className="w-8 h-8 bg-linear-to-br from-purple-400 to-pink-400 rounded-full animate-bounce" />
                                    <div className="w-8 h-8 bg-linear-to-br from-blue-400 to-purple-400 rounded-full animate-bounce delay-100" />
                                    <div className="w-8 h-8 bg-linear-to-br from-pink-400 to-orange-400 rounded-full animate-bounce delay-200" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative z-10 bg-white/50 backdrop-blur-sm py-20">
                <div className="container mx-auto px-6">
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Everything you need to collaborate
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all border border-purple-100 group"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="bg-linear-to-br from-purple-500 to-pink-500 w-14 h-14 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-gray-800">{feature.title}</h3>
                                <p className="text-gray-600">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="relative z-10 py-20">
                <div className="container mx-auto px-6">
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Simple, transparent pricing
                    </h2>
                    <p className="text-center text-gray-600 mb-16 text-lg">Choose the plan that fits your needs</p>
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {pricing.map((plan, idx) => (
                            <div
                                key={idx}
                                className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all border-2 ${plan.popular ? 'border-purple-500 relative' : 'border-purple-100'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-linear-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                        Most Popular
                                    </div>
                                )}
                                <h3 className="text-2xl font-bold mb-2 text-gray-800">{plan.name}</h3>
                                <div className="mb-6">
                                    <span className="text-5xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                        {plan.price}
                                    </span>
                                    <span className="text-gray-600">/month</span>
                                </div>
                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, fIdx) => (
                                        <li key={fIdx} className="flex items-center space-x-3 text-gray-700">
                                            <Check className="w-5 h-5 text-green-500 shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button className={`w-full py-3 rounded-xl font-semibold transition-all ${plan.popular
                                    ? 'bg-linear-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl transform hover:scale-105'
                                    : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                    }`}>
                                    Get Started
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 py-20">
                <div className="container mx-auto px-6">
                    <div className="bg-linear-to-r from-purple-600 via-pink-500 to-orange-400 rounded-3xl p-12 md:p-16 text-center shadow-2xl">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            Ready to transform your workflow?
                        </h2>
                        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                            Join thousands of teams already collaborating on Docsly
                        </p>
                        <button className="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-2xl transform hover:scale-105 transition-all">
                            Start Your Free Trial
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 bg-white/50 backdrop-blur-sm py-12">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-2 mb-4 md:mb-0">
                            <div className="bg-linear-to-br from-purple-500 to-pink-500 p-2 rounded-xl">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Docsly
                            </span>
                        </div>
                        <div className="text-gray-600">
                            © 2024 Docsly. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}