import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeOffIcon, Loader2 } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      const { session, user } = response.data;

      localStorage.setItem('token', session.access_token);
      localStorage.setItem('user', JSON.stringify(user));
      await supabase.auth.setSession(session);

      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="bg-indigo-800 min-h-screen flex justify-center items-center px-4 md:px-8 lg:px-16 py-10 bg-cover bg-center"
      style={{ backgroundImage: "url('/images/beach-bg.jpg')" }}
    >
      <div className="bg-white rounded-3xl flex flex-col md:flex-row w-full max-w-lg md:max-w-7xl overflow-hidden shadow-2xl">

        {/* LEFT SIDE (Form Section) */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 md:py-24 lg:px-16">
          <div className="w-full max-w-md text-center mb-8">
            <h1 className="font-bold text-3xl lg:text-4xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Welcome Back!
            </h1>
            <p className="text-gray-600 text-sm lg:text-base">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
            {/* Email */}
            <div className="space-y-1">
              <label htmlFor="email" className="block text-slate-700 font-medium text-left">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="px-4 py-2 rounded-xl border border-slate-600 bg-transparent 
                focus:border-sky-500 focus:outline-none focus:ring-0 w-full transition-colors duration-200"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label htmlFor="password" className="block text-slate-700 font-medium text-left">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="px-4 py-2 rounded-xl border border-slate-600 bg-transparent 
                  focus:border-sky-500 focus:outline-none focus:ring-0 w-full pr-10 transition-colors duration-200"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-sky-600 transition-colors"
                >
                  {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            <div className="min-h-[24px]">
              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
              text-white font-medium py-3 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 
              disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Register */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600 text-md">
                Don't have an account?{' '}
                <a
                  href="/register"
                  className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
                >
                  Create account
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* RIGHT SIDE (Keep same styling) */}
        <div
          className="hidden md:flex flex-[1.3] bg-cover bg-center rounded-3xl items-center justify-center m-2"
          style={{ backgroundImage: "url('/images/beach-2.jpg')" }}
        >
          <img
            src="/images/anywave.png"
            alt="AnyWave Logo"
            className="h-56 w-auto pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
