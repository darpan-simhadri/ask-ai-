import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { z } from 'zod';
import { Sparkles, Mail, Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFields = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFields | 'api', string>>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof LoginFields, string>> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof LoginFields] = err.message;
        }
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrors({ api: error.message });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setErrors({ api: 'An unexpected error occurred. Please try again.' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-[#020617] px-4 relative overflow-hidden">
      {/* Background neon glows */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Logo and header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 mb-4">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-indigo-100 to-white bg-clip-text text-transparent">
            Welcome to AskFlow AI
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Sign in to start your intelligent conversation flows
          </p>
        </div>

        {/* Login form Card */}
        <div className="glass-panel rounded-3xl p-8 shadow-2xl relative border border-gray-800/60 bg-gray-950/75">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.api && (
              <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-200">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
                <span>{errors.api}</span>
              </div>
            )}

            {/* Email input */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-gray-900/50 border rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 focus:bg-gray-900/80
                    ${errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'}
                  `}
                  placeholder="name@example.com"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password input */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-gray-900/50 border rounded-2xl py-3 pl-11 pr-11 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 focus:bg-gray-900/80
                    ${errors.password ? 'border-red-500/50 focus:border-red-500' : 'border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'}
                  `}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/15 hover:opacity-95 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Switch to signup */}
          <div className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline transition-all"
            >
              Sign up for free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
