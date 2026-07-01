/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LogIn, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuthStore } from '../../store/auth';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await client.post('/api/v1/auth/login', data);
      const { access_token, user } = response.data;
      setAuth(access_token, user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg-base p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent-primary tracking-tight">AMIRABLE</h1>
          <p className="text-text-muted mt-2">Hotel Management System</p>
        </div>

        <div className="card-surface shadow-2xl">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <LogIn size={20} className="text-accent-primary" />
            Staff Login
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <User size={18} />
                </span>
                <input
                  {...register('username')}
                  type="text"
                  placeholder="Enter username"
                  className={`input-base pl-10 ${errors.username ? 'border-status-red' : ''}`}
                  autoFocus
                />
              </div>
              {errors.username && (
                <p className="text-status-red text-xs mt-1">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <Lock size={18} />
                </span>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="Enter password"
                  className={`input-base pl-10 ${errors.password ? 'border-status-red' : ''}`}
                />
              </div>
              {errors.password && (
                <p className="text-status-red text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-status-red bg-opacity-10 border border-status-red border-opacity-20 rounded flex items-start gap-3 text-status-red text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-6"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-text-muted font-mono uppercase tracking-widest">
            Developed by DroneBug Technologies
          </p>
        </div>
      </div>
    </div>
  );
};
