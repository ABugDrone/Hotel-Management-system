/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, User, Phone, Mail, MapPin, Loader2, X, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import client from '../../api/client';
import { Guest } from '../../types';

const guestSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  id_type: z.string().optional(),
  id_number: z.string().optional(),
  address: z.string().optional(),
});

type GuestFormValues = z.infer<typeof guestSchema>;

export const GuestsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: guests, isLoading } = useQuery<Guest[]>({
    queryKey: ['guests', searchTerm],
    queryFn: async () => {
      const res = await client.get('/api/v1/guests/', { params: { search: searchTerm } });
      return res.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: GuestFormValues) => {
      return client.post('/api/v1/guests/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      handleCloseModal();
    },
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <User size={28} className="text-accent-primary" />
            Guest Registry
          </h2>
          <p className="text-text-muted mt-1">Manage guest records and history</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={20} className="mr-2" />
          Register New Guest
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            className="input-base pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bg-elevated border-b border-border">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Phone Number</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">ID Details</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 size={32} className="animate-spin mx-auto text-accent-primary" />
                  </td>
                </tr>
              ) : guests?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                    No guests found.
                  </td>
                </tr>
              ) : (
                guests?.map((guest) => (
                  <tr key={guest.id} className="hover:bg-bg-elevated transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-muted group-hover:text-accent-primary">
                          <User size={16} />
                        </div>
                        <span className="font-bold">{guest.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      <div className="flex items-center gap-2">
                        <Phone size={14} />
                        {guest.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {guest.id_type ? (
                        <span className="text-xs font-mono text-text-muted uppercase">
                          {guest.id_type}: {guest.id_number}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted italic">No ID recorded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-text-muted text-sm">
                      {new Date(guest.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-xl shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={handleCloseModal}
              className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
            >
              <X size={24} />
            </button>
            
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Plus className="text-accent-primary" />
              Register New Guest
            </h3>

            <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Full Name</label>
                  <input {...register('full_name')} className={`input-base ${errors.full_name ? 'border-status-red' : ''}`} placeholder="John Doe" />
                  {errors.full_name && <p className="text-status-red text-xs mt-1">{errors.full_name.message}</p>}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input {...register('phone')} className={`input-base pl-10 ${errors.phone ? 'border-status-red' : ''}`} placeholder="+234..." />
                  </div>
                  {errors.phone && <p className="text-status-red text-xs mt-1">{errors.phone.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input {...register('email')} className={`input-base pl-10 ${errors.email ? 'border-status-red' : ''}`} placeholder="email@example.com" />
                </div>
                {errors.email && <p className="text-status-red text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">ID Type</label>
                  <select {...register('id_type')} className="input-base">
                    <option value="">Select ID Type</option>
                    <option value="National ID">National ID</option>
                    <option value="Passport">Passport</option>
                    <option value="Drivers License">Drivers License</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">ID Number</label>
                  <input {...register('id_number')} className="input-base font-mono" placeholder="ID Number" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Home Address</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3 text-text-muted" />
                  <textarea {...register('address')} className="input-base pl-10 min-h-[80px] resize-none" placeholder="Residential address"></textarea>
                </div>
              </div>

              {createMutation.isError && (
                <div className="p-3 bg-status-red bg-opacity-10 border border-status-red border-opacity-20 rounded flex items-start gap-3 text-status-red text-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{(createMutation.error as any).response?.data?.detail || 'An error occurred'}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary px-8">
                  {createMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : 'Register Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
