/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, BedDouble, Loader2, X, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import client from '../../api/client';
import { Room, RoomStatus } from '../../types';
import { useAuthStore } from '../../store/auth';

const roomSchema = z.object({
  number: z.string().min(1, 'Room number is required'),
  room_type: z.string().min(1, 'Room type is required'),
  price_per_night: z.coerce.number().min(0, 'Price must be positive'),
  description: z.string().optional(),
  status: z.enum(['available', 'occupied', 'dirty', 'maintenance', 'reserved'] as const),
});

type RoomFormValues = z.infer<typeof roomSchema>;

export const RoomsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: rooms, isLoading } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await client.get('/api/v1/rooms/');
      return res.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      status: 'available',
    }
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: RoomFormValues) => {
      if (editingRoom) {
        return client.patch(`/api/v1/rooms/${editingRoom.id}`, data);
      }
      return client.post('/api/v1/rooms/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      handleCloseModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return client.delete(`/api/v1/rooms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const handleOpenModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      reset({
        number: room.number,
        room_type: room.room_type,
        price_per_night: room.price_per_night,
        description: room.description || '',
        status: room.status,
      });
    } else {
      setEditingRoom(null);
      reset({
        status: 'available',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
    reset();
  };

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case 'available': return 'text-status-green bg-status-green bg-opacity-10';
      case 'occupied': return 'text-status-red bg-status-red bg-opacity-10';
      case 'dirty': return 'text-status-yellow bg-status-yellow bg-opacity-10';
      case 'maintenance': return 'text-status-gray bg-status-gray bg-opacity-10';
      default: return 'text-text-muted bg-bg-elevated';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <BedDouble size={28} className="text-accent-primary" />
            Room Management
          </h2>
          <p className="text-text-muted mt-1">Manage hotel inventory and status</p>
        </div>
        {(user?.role === 'super_admin' || user?.role === 'manager') && (
          <button onClick={() => handleOpenModal()} className="btn-primary">
            <Plus size={20} className="mr-2" />
            Add New Room
          </button>
        )}
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bg-elevated border-b border-border">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Number</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Price/Night</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 size={32} className="animate-spin mx-auto text-accent-primary" />
                  </td>
                </tr>
              ) : rooms?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    No rooms found. Add your first room to get started.
                  </td>
                </tr>
              ) : (
                rooms?.map((room) => (
                  <tr key={room.id} className="hover:bg-bg-elevated transition-colors group">
                    <td className="px-6 py-4 font-bold">{room.number}</td>
                    <td className="px-6 py-4">{room.room_type}</td>
                    <td className="px-6 py-4">₦ {room.price_per_night.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(room.status)}`}>
                        {room.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(user?.role === 'super_admin' || user?.role === 'manager') && (
                          <>
                            <button 
                              onClick={() => handleOpenModal(room)}
                              className="p-2 text-text-muted hover:text-accent-primary transition-colors"
                              title="Edit Room"
                            >
                              <Edit2 size={18} />
                            </button>
                            {user?.role === 'super_admin' && (
                              <button 
                                onClick={() => { if(confirm('Delete room?')) deleteMutation.mutate(room.id) }}
                                className="p-2 text-text-muted hover:text-status-red transition-colors"
                                title="Delete Room"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upsert Modal */}
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
              <BedDouble className="text-accent-primary" />
              {editingRoom ? `Edit Room ${editingRoom.number}` : 'Add New Room'}
            </h3>

            <form onSubmit={handleSubmit((data) => upsertMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Room Number</label>
                  <input {...register('number')} className={`input-base ${errors.number ? 'border-status-red' : ''}`} placeholder="e.g. 101" />
                  {errors.number && <p className="text-status-red text-xs mt-1">{errors.number.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Room Type</label>
                  <input {...register('room_type')} className={`input-base ${errors.room_type ? 'border-status-red' : ''}`} placeholder="e.g. Deluxe Double" />
                  {errors.room_type && <p className="text-status-red text-xs mt-1">{errors.room_type.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Price Per Night (₦)</label>
                  <input type="number" step="0.01" {...register('price_per_night')} className={`input-base ${errors.price_per_night ? 'border-status-red' : ''}`} />
                  {errors.price_per_night && <p className="text-status-red text-xs mt-1">{errors.price_per_night.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Initial Status</label>
                  <select {...register('status')} className="input-base">
                    <option value="available">Available</option>
                    <option value="dirty">Dirty</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Description (Optional)</label>
                <textarea {...register('description')} className="input-base min-h-[100px] resize-none" placeholder="Room features, bed size, etc."></textarea>
              </div>

              {upsertMutation.isError && (
                <div className="p-3 bg-status-red bg-opacity-10 border border-status-red border-opacity-20 rounded flex items-start gap-3 text-status-red text-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{(upsertMutation.error as any).response?.data?.detail || 'An error occurred'}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={upsertMutation.isPending} className="btn-primary px-8">
                  {upsertMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : (editingRoom ? 'Update Room' : 'Save Room')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
