import React, { useEffect, useState } from 'react';
import { FileText, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast, { ErrorIcon } from 'react-hot-toast';
import api from '../lib/api';

export default function DocslyAuth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const location = useLocation()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [focusedField, setFocusedField] = useState('');

  const handleModeSwitch = (signUpMode: boolean) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsSignUp(signUpMode);
      setIsTransitioning(false);
    }, 150);
  };

  const handleSubmit = async () => {
    const toastId = toast.loading("Loading...", {
      icon: <Loader2 className="animate-spin" />,
    })
    try {
      if (!isSignUp) {
        const { email, password } = { ...formData }
        const res = await api.post<{ token: string, success: boolean }>("/auth/login", { email, password })
        if (res.data.success) {
          // Success Toast
          localStorage.setItem("docsly_token", res.data.token)
          setTimeout(() => {
            toast.success("Login successfully", {
              id: toastId,
              icon: <CheckCircle2 className="text-green-500" />,
              duration: 2000,
            })
            navigate("/dashboard")
          }, 1500)
          //
        }
      } else {
        const res = await api.post<{ success: boolean }>("/auth/signup", formData)
        if (res.data.success) {
          toast.loading("Creating account...", {
            id:toastId,
            icon: <Loader2 className="animate-spin" />,
          })

          setTimeout(() => {
            toast.success("Account created successfully", {
              id: toastId,
              icon: <CheckCircle2 className="text-green-500" />,
              duration: 2000,
            })
            handleModeSwitch(false)
          }, 1500)
        }
      }
    } catch (e) {
      console.error(e)
      setTimeout(() => {
        toast.error("An error occurred, please try again", {
          id: toastId,
          icon: <ErrorIcon className="text-green-500" />,
          duration: 1500,
        })
      }, 1000)
    }
  };

  useEffect(() => {
    if (location.state) {
      const a = () => {
        handleModeSwitch(true)
      }
      return a
    }
  }, [location.state])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse" style={{ animationDelay: '0.5s' }} />

      {/* Main container */}
      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col space-y-8 pr-8">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="bg-linear-to-br from-purple-500 to-pink-500 p-3 rounded-2xl shadow-lg transform group-hover:scale-110 transition-transform">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <span className="text-4xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Docsly
            </span>
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl font-bold leading-tight">
              <span className="bg-linear-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                Collaborate in Real-time
              </span>
            </h1>
            <p className="text-xl text-gray-700 leading-relaxed">
              Join thousands of teams creating amazing documents together. Experience the future of collaborative editing.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            {[
              { icon: '⚡', text: 'Real-time collaboration' },
              { icon: '🔒', text: 'Secure & encrypted' },
              { icon: '🌍', text: 'Access from anywhere' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center space-x-3 text-gray-700">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-lg">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Decorative element */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-red-400 rounded-full" />
              <div className="w-3 h-3 bg-yellow-400 rounded-full" />
              <div className="w-3 h-3 bg-green-400 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-linear-to-r from-purple-200 to-transparent rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-linear-to-r from-pink-200 to-transparent rounded w-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="h-3 bg-linear-to-r from-purple-200 to-transparent rounded w-5/6 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>

        {/* Right side - Auth form */}
        <div className="w-full">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 border border-purple-100">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center space-x-2 mb-8">
              <div className="bg-linear-to-br from-purple-500 to-pink-500 p-2 rounded-xl shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Docsly
              </span>
            </div>

            {/* Tab switcher */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
              <button
                onClick={() => handleModeSwitch(false)}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${!isSignUp
                  ? 'bg-white text-purple-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Sign In
              </button>
              <button
                onClick={() => handleModeSwitch(true)}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${isSignUp
                  ? 'bg-white text-purple-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Sign Up
              </button>
            </div>

            <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
              <h2 className="text-2xl font-bold mb-2 text-gray-800">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="text-gray-600 mb-8">
                {isSignUp
                  ? 'Start collaborating with your team today'
                  : 'Sign in to continue to your documents'}
              </p>
            </div>

            {/* Social login buttons */}
            {/* <div className="space-y-3 mb-8">
              <button className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all group">
                <Chrome className="w-5 h-5 text-gray-700 group-hover:text-purple-600 transition-colors" />
                <span className="font-semibold text-gray-700 group-hover:text-purple-600 transition-colors">
                  Continue with Google
                </span>
              </button>
              <button className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all group">
                <Github className="w-5 h-5 text-gray-700 group-hover:text-purple-600 transition-colors" />
                <span className="font-semibold text-gray-700 group-hover:text-purple-600 transition-colors">
                  Continue with GitHub
                </span>
              </button>
            </div> */}

            {/* Divider */}
            {/* <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/80 text-gray-500">Or continue with email</span>
              </div>
            </div> */}

            {/* Form fields */}
            <div className={`space-y-5 transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
              {isSignUp && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className={`relative group ${focusedField === 'name' ? 'scale-[1.02]' : ''} transition-transform`}>
                    <User className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${focusedField === 'name' ? 'text-purple-600' : 'text-gray-400'
                      }`} />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField('')}
                      placeholder="Enter your name"
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${focusedField === 'name'
                        ? 'border-purple-500 shadow-lg'
                        : 'border-gray-200 hover:border-purple-300'
                        }`}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className={`relative group ${focusedField === 'email' ? 'scale-[1.02]' : ''} transition-transform`}>
                  <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${focusedField === 'email' ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField('')}
                    placeholder="you@example.com"
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${focusedField === 'email'
                      ? 'border-purple-500 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300'
                      }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className={`relative group ${focusedField === 'password' ? 'scale-[1.02]' : ''} transition-transform`}>
                  <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${focusedField === 'password' ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                    placeholder="Enter your password"
                    className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:outline-none transition-all ${focusedField === 'password'
                      ? 'border-purple-500 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {!isSignUp && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                    <span className="text-gray-700 group-hover:text-purple-600 transition-colors">Remember me</span>
                  </label>
                  <button className="text-purple-600 hover:text-purple-700 font-semibold">
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                onClick={handleSubmit}
                className="w-full py-4 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-2xl transform hover:scale-[1.02] transition-all flex items-center justify-center space-x-2 group"
              >
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {isSignUp && (
              <p className="text-xs text-gray-600 text-center mt-6">
                By signing up, you agree to our{' '}
                <button className="text-purple-600 hover:underline">Terms of Service</button>
                {' '}and{' '}
                <button className="text-purple-600 hover:underline">Privacy Policy</button>
              </p>
            )}
          </div>

          {/* Bottom link */}
          <p className="text-center mt-6 text-gray-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => handleModeSwitch(!isSignUp)}
              className="text-purple-600 font-semibold hover:text-purple-700 transition-colors"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
