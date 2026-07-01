/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, LogIn, LogOut, Loader2, X, User, Calendar, AlertCircle, Info, CheckCircle2, BedDouble } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import client from '../../api/client';
import { Room, RoomStatus, Guest } from '../../types';

interface DashboardStats {
  total_rooms: number;
  available_rooms: number;
  occupied_rooms: number;
  today_revenue: number;
  total_debt: number;
  occupancy_rate: number;
}

const checkInSchema = z.object({
  guest_id: z.string().min(1, 'Guest is required'),
  expected_check_out_date: z.string().min(1, 'Expected check-out date is required'),
});

type CheckInFormValues = z.infer<typeof checkInSchema>;

export const Dashboard = () => {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: stats, isLoading: isStatsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await client.get('/api/v1/rooms/stats/summary');
      return res.data;
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  const { data: rooms, isLoading: isRoomsLoading } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await client.get('/api/v1/rooms/');
      return res.data;
    },
  });

  const { data: guests } = useQuery<Guest[]>({
    queryKey: ['guests'],
    queryFn: async () => {
      const res = await client.get('/api/v1/guests/');
      return res.data;
    },
    enabled: isCheckInModalOpen,
  });

  const checkInMutation = useMutation({
    mutationFn: async (data: any) => {
      return client.post('/api/v1/rooms/check-in', {
        ...data,
        room_id: selectedRoom?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsCheckInModalOpen(false);
      setSelectedRoom(null);
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      // For now, simple checkout without additional payment in this turn
      // In a real app, we'd open a payment modal
      return client.post('/api/v1/rooms/check-out', {
        assignment_id: assignmentId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSelectedRoom(null);
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<CheckInFormValues>({
    resolver: zodResolver(checkInSchema),
  });

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case 'available': return 'bg-status-green';
      case 'occupied': return 'bg-status-red';
      case 'dirty': return 'bg-status-yellow';
      case 'maintenance': return 'bg-status-gray';
      default: return 'bg-text-muted';
    }
  };

  const statCards = [
    { label: "Today's Occupancy", value: `${Math.round(stats?.occupancy_rate || 0)}%`, color: "text-accent-primary" },
    { label: "Available Rooms", value: stats?.available_rooms || 0, color: "text-status-green" },
    { label: "Daily Revenue", value: `₦ ${(stats?.today_revenue || 0).toLocaleString()}`, color: "text-status-green" },
    { label: "Outstanding Debts", value: `₦ ${(stats?.total_debt || 0).toLocaleString()}`, color: "text-accent-warm" },
  ];

  return (
    <div className="space-y-6 relative h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <LayoutDashboard size={28} className="text-accent-primary" />
          Reception Dashboard
        </h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="card-surface">
            <p className="text-sm font-medium text-text-muted uppercase tracking-wider">{stat.label}</p>
            {isStatsLoading ? (
              <Loader2 className="animate-spin text-text-muted mt-2" size={20} />
            ) : (
              <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Room Grid */}
      <div className="card-surface">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Live Room Status</h3>
          <div className="flex gap-4 text-xs font-bold uppercase">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-status-green"></div> Available</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-status-red"></div> Occupied</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-status-yellow"></div> Dirty</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-status-gray"></div> Maintenance</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {isRoomsLoading ? (
            <div className="col-span-full py-12 flex justify-center">
              <Loader2 size={32} className="animate-spin text-accent-primary" />
            </div>
          ) : (
            rooms?.map((room) => (
              <button 
                key={room.id} 
                onClick={() => setSelectedRoom(room)}
                className={`aspect-square bg-bg-elevated border border-border rounded-lg p-4 flex flex-col justify-between hover:border-accent-primary transition-all text-left group relative overflow-hidden ${selectedRoom?.id === room.id ? 'ring-2 ring-accent-primary border-transparent' : ''}`}
              >
                <div className="flex justify-between items-start z-10">
                  <span className="text-lg font-bold group-hover:text-accent-primary transition-colors">
                    {room.number}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(room.status)} shadow-lg`}></div>
                </div>
                <div className="z-10">
                  <p className="text-[10px] text-text-muted uppercase font-bold truncate">{room.room_type}</p>
                  <p className={`text-[10px] uppercase font-bold mt-0.5 ${room.status === 'available' ? 'text-status-green' : 'text-text-primary'}`}>
                    {room.status}
                  </p>
                </div>
                {/* Visual background indicator */}
                <div className={`absolute bottom-0 left-0 w-1 h-full opacity-30 ${getStatusColor(room.status)}`}></div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Room Details Side Panel */}
      {selectedRoom && (
        <div className="fixed inset-y-0 right-0 w-96 bg-bg-surface border-l border-border shadow-2xl z-[60] flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <BedDouble size={24} className="text-accent-primary" />
              Room {selectedRoom.number}
            </h3>
            <button onClick={() => setSelectedRoom(null)} className="text-text-muted hover:text-text-primary">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-bg-elevated rounded-lg border border-border">
                <span className="text-sm text-text-muted">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(selectedRoom.status)} text-white`}>
                  {selectedRoom.status}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-bg-elevated rounded-lg border border-border">
                <span className="text-sm text-text-muted">Rate</span>
                <span className="font-bold text-status-green">₦ {selectedRoom.price_per_night.toLocaleString()} / Night</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                <Info size={14} /> Details
              </h4>
              <p className="text-sm leading-relaxed">{selectedRoom.description || 'No additional features listed for this room.'}</p>
            </div>

            {/* Context Actions */}
            <div className="pt-4 border-t border-border">
              {selectedRoom.status === 'available' && (
                <button 
                  onClick={() => setIsCheckInModalOpen(true)}
                  className="btn-primary w-full gap-2"
                >
                  <LogIn size={20} />
                  Initiate Check-In
                </button>
              )}
              
              {selectedRoom.status === 'occupied' && (
                <div className="space-y-4">
                  <div className="p-4 bg-accent-primary bg-opacity-5 rounded-lg border border-accent-primary border-opacity-20 flex flex-col items-center text-center">
                    <User size={32} className="text-accent-primary mb-2" />
                    <p className="font-bold">Active Stay</p>
                    <p className="text-xs text-text-muted mt-1 italic">Guest ledger currently open</p>
                  </div>
                  <button 
                    onClick={() => {
                      if(confirm('Finalize check-out for this room? Ensure all payments are recorded.')) {
                        // In Phase 2, we just trigger the simple backend checkout
                        // We'll need the assignment ID. For now I'll fetch it from an 'active' query if needed, 
                        // but let's assume we implement a 'get active assignment for room' helper or endpoint.
                        client.get(`/api/v1/rooms/assignments/active`).then(res => {
                          const stay = res.data.find((s: any) => s.room_number === selectedRoom.number);
                          if (stay) checkOutMutation.mutate(stay.assignment_id);
                        });
                      }
                    }}
                    className="w-full bg-status-red hover:bg-opacity-90 text-white font-medium py-3 rounded flex items-center justify-center gap-2"
                  >
                    <LogOut size={20} />
                    Process Check-Out
                  </button>
                </div>
              )}

              {selectedRoom.status === 'dirty' && (
                <button 
                  onClick={() => {
                    client.patch(`/api/v1/rooms/${selectedRoom.id}/status`, null, { params: { status: 'available' } })
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['rooms'] });
                        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                        setSelectedRoom(null);
                      });
                  }}
                  className="w-full border border-status-green text-status-green hover:bg-status-green hover:bg-opacity-10 py-3 rounded font-bold flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  Mark as Clean
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Check-In Modal */}
      {isCheckInModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsCheckInModalOpen(false)}
              className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
            >
              <X size={24} />
            </button>
            
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <LogIn className="text-accent-primary" />
              Check-In to Room {selectedRoom?.number}
            </h3>

            <form onSubmit={handleSubmit((data) => checkInMutation.mutate(data))} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Select Registered Guest</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <select {...register('guest_id')} className={`input-base pl-10 ${errors.guest_id ? 'border-status-red' : ''}`}>
                    <option value="">Choose a guest...</option>
                    {guests?.map(g => (
                      <option key={g.id} value={g.id}>{g.full_name} ({g.phone})</option>
                    ))}
                  </select>
                </div>
                {errors.guest_id && <p className="text-status-red text-xs mt-1">{errors.guest_id.message}</p>}
                <p className="text-[10px] text-text-muted mt-2">If guest is not registered, please go to Guests Registry first.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Expected Check-Out Date</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input 
                    type="date" 
                    {...register('expected_check_out_date')} 
                    className={`input-base pl-10 ${errors.expected_check_out_date ? 'border-status-red' : ''}`} 
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                {errors.expected_check_out_date && <p className="text-status-red text-xs mt-1">{errors.expected_check_out_date.message}</p>}
              </div>

              <div className="bg-bg-elevated p-4 rounded-lg border border-border">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-muted">Initial Charge</span>
                  <span className="font-bold text-status-green">₦ {selectedRoom?.price_per_night.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-text-muted mt-2">First night will be posted to ledger immediately upon check-in.</p>
              </div>

              {checkInMutation.isError && (
                <div className="p-3 bg-status-red bg-opacity-10 border border-status-red border-opacity-20 rounded flex items-start gap-3 text-status-red text-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{(checkInMutation.error as any).response?.data?.detail || 'An error occurred'}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsCheckInModalOpen(false)} className="px-6 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated">
                  Cancel
                </button>
                <button type="submit" disabled={checkInMutation.isPending} className="btn-primary px-8">
                  {checkInMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : 'Confirm Check-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
