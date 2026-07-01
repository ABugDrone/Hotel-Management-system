/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, FileText, Loader2, PieChart, RefreshCw, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';
import apiClient from '../../api/client';

const COLORS = ['#4F7FFF', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

const sampleDailyPerformance = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - 6 + i);
  return { date: d.toISOString().slice(0, 10), room_revenue: 80000 + Math.random() * 120000, food_revenue: 30000 + Math.random() * 60000, other_revenue: Math.random() * 20000 };
});

const sampleRevenueBreakdown = [
  { category: 'Room Revenue', amount: 812500, percentage: 65, count: 45 },
  { category: 'Food & Beverage', amount: 250000, percentage: 20, count: 120 },
  { category: 'Other Services', amount: 125000, percentage: 10, count: 30 },
  { category: 'Miscellaneous', amount: 62500, percentage: 5, count: 15 },
];

const ReportsPage = () => {
  const [reportType, setReportType] = useState('DAILY');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: dailyReport, isLoading: isLoadingDaily } = useQuery({
    queryKey: ['daily-report', startDate],
    queryFn: async () => { const res = await apiClient.get(`/api/v1/reports/daily?date=${startDate}`); return res.data; },
    enabled: reportType === 'DAILY',
  });

  const { data: monthlyReport, isLoading: isLoadingMonthly } = useQuery({
    queryKey: ['monthly-report', startDate.slice(0, 7)],
    queryFn: async () => { const res = await apiClient.get(`/api/v1/reports/monthly?month=${startDate.slice(0, 7)}`); return res.data; },
    enabled: reportType === 'MONTHLY',
  });

  const dailyPerformance = useMemo(() => {
    if (monthlyReport?.daily_performance?.length) return monthlyReport.daily_performance;
    return sampleDailyPerformance;
  }, [monthlyReport]);

  const revenueBreakdown = useMemo(() => {
    if (monthlyReport?.revenue_breakdown?.length) return monthlyReport.revenue_breakdown;
    return sampleRevenueBreakdown;
  }, [monthlyReport]);

  const dailyChartData = useMemo(() => {
    if (dailyReport) {
      return [
        { name: 'Room Revenue', value: dailyReport.room_revenue || 0 },
        { name: 'Food Revenue', value: dailyReport.food_revenue || 0 },
      ];
    }
    return [
      { name: 'Room Revenue', value: 450000 },
      { name: 'Food Revenue', value: 185000 },
    ];
  }, [dailyReport]);

  const generateReport = () => {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const downloadReport = (_format: 'pdf' | 'excel') => {};

  const renderDailyReport = () => {
    if (isLoadingDaily) return <div className="py-8 flex justify-center"><Loader2 size={32} className="animate-spin text-accent-primary" /></div>;
    if (!dailyReport) return <div className="py-12 text-center text-text-muted">No daily report data</div>;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-surface">
            <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Room Revenue</p>
            <p className="text-3xl font-bold text-accent-primary mt-2">{formatCurrency(dailyReport.room_revenue || 0)}</p>
          </div>
          <div className="card-surface">
            <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Food Revenue</p>
            <p className="text-3xl font-bold text-status-green mt-2">{formatCurrency(dailyReport.food_revenue || 0)}</p>
          </div>
          <div className="card-surface">
            <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Check-ins</p>
            <p className="text-3xl font-bold text-accent-warm mt-2">{dailyReport.check_ins || 0}</p>
          </div>
          <div className="card-surface">
            <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Check-outs</p>
            <p className="text-3xl font-bold mt-2">{dailyReport.check_outs || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-surface">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2"><BarChart3 size={16} /> Revenue Comparison</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={{ stroke: '#2A2D3A' }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={{ stroke: '#2A2D3A' }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1D2E', border: '1px solid #2A2D3A', borderRadius: 8, color: '#EAEAEA' }} formatter={(value: any) => [formatCurrency(value), 'Revenue']} />
                <Bar dataKey="value" fill="#4F7FFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card-surface">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2"><PieChart size={16} /> Revenue Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <RePieChart>
                <Pie data={dailyChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={4}>
                  {dailyChartData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1A1D2E', border: '1px solid #2A2D3A', borderRadius: 8, color: '#EAEAEA' }} formatter={(value: any) => [formatCurrency(value), '']} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9CA3AF' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-6 pt-6">
            <div>
              <h3 className="text-lg font-semibold">Daily Transactions</h3>
              <p className="text-sm text-text-muted">Transactions for {formatDate(startDate)}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-bg-elevated border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Guest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(dailyReport.transactions || []).slice(0, 10).map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-bg-elevated transition-colors">
                    <td className="px-6 py-4 text-sm">{new Date(tx.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-6 py-4 text-sm">{tx.type}</td>
                    <td className="px-6 py-4 text-sm">{tx.description}</td>
                    <td className={`px-6 py-4 font-semibold ${tx.amount > 0 ? 'text-status-green' : 'text-status-red'}`}>{formatCurrency(Math.abs(tx.amount))}</td>
                    <td className="px-6 py-4 text-sm">{tx.guest_name || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderMonthlyReport = () => {
    if (isLoadingMonthly) return <div className="py-8 flex justify-center"><Loader2 size={32} className="animate-spin text-accent-primary" /></div>;
    if (!monthlyReport) return <div className="py-12 text-center text-text-muted">No monthly report data</div>;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-surface">
            <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Total Revenue</p>
            <p className="text-3xl font-bold text-status-green mt-2">{formatCurrency(monthlyReport.total_revenue || 0)}</p>
          </div>
          <div className="card-surface">
            <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Avg. Occupancy</p>
            <p className="text-3xl font-bold text-accent-primary mt-2">{monthlyReport.avg_occupancy || 0}%</p>
          </div>
          <div className="card-surface">
            <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Total Guests</p>
            <p className="text-3xl font-bold text-accent-warm mt-2">{monthlyReport.total_guests || 0}</p>
          </div>
          <div className="card-surface">
            <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Room Nights</p>
            <p className="text-3xl font-bold mt-2">{monthlyReport.room_nights || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-surface">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2"><TrendingUp size={16} /> Daily Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: '#2A2D3A' }} tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: '#2A2D3A' }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1D2E', border: '1px solid #2A2D3A', borderRadius: 8, color: '#EAEAEA' }} labelFormatter={(v) => formatDate(v)} formatter={(value: any) => [formatCurrency(value), '']} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9CA3AF' }} />
                <Line type="monotone" dataKey="room_revenue" stroke="#4F7FFF" strokeWidth={2} dot={{ fill: '#4F7FFF', r: 3 }} name="Room Revenue" />
                <Line type="monotone" dataKey="food_revenue" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E', r: 3 }} name="Food Revenue" />
                <Line type="monotone" dataKey="other_revenue" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B', r: 3 }} name="Other Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card-surface">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2"><PieChart size={16} /> Revenue Breakdown</h3>
            <ResponsiveContainer width="100%" height={280}>
              <RePieChart>
                <Pie data={revenueBreakdown} cx="50%" cy="50%" outerRadius={100} dataKey="amount" nameKey="category" label={({ payload }: any) => `${payload.category} ${payload.percentage}%`}>
                  {revenueBreakdown.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1A1D2E', border: '1px solid #2A2D3A', borderRadius: 8, color: '#EAEAEA' }} formatter={(value: any) => [formatCurrency(value), '']} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-surface">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2"><BarChart3 size={16} /> Revenue by Category</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: '#2A2D3A' }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="category" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: '#2A2D3A' }} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1D2E', border: '1px solid #2A2D3A', borderRadius: 8, color: '#EAEAEA' }} formatter={(value: any) => [formatCurrency(value), '']} />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                  {revenueBreakdown.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card-surface">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2"><TrendingUp size={16} /> Quick Stats</h3>
            <div className="space-y-3">
              {[
                { label: 'Current Month Revenue', value: formatCurrency(monthlyReport.total_revenue || 1250000) },
                { label: 'Occupancy Rate', value: `${monthlyReport.avg_occupancy || 78}%` },
                { label: 'Avg. Room Rate', value: formatCurrency(monthlyReport.avg_room_rate || 15000) },
                { label: 'RevPAR', value: formatCurrency(monthlyReport.revpar || 11700) },
              ].map((s, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-text-muted">{s.label}</span>
                  <span className="font-semibold">{s.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Recent Activity</h4>
              <div className="space-y-2">
                {[
                  { label: "Today's Check-ins", value: monthlyReport.today_check_ins ?? '8' },
                  { label: "Today's Check-outs", value: monthlyReport.today_check_outs ?? '6' },
                  { label: 'Pending Payments', value: monthlyReport.pending_payments ?? '3' },
                  { label: 'Low Stock Items', value: monthlyReport.low_stock_items ?? '5' },
                ].map((s, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-text-muted">{s.label}</span>
                    <span className="font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card-surface overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-6 pt-6">
            <div>
              <h3 className="text-lg font-semibold">Revenue Breakdown</h3>
              <p className="text-sm text-text-muted">Monthly revenue by category</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-bg-elevated border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Percentage</th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(monthlyReport.revenue_breakdown || []).map((item: any) => (
                  <tr key={item.category} className="hover:bg-bg-elevated transition-colors">
                    <td className="px-6 py-4 font-medium">{item.category}</td>
                    <td className="px-6 py-4">{formatCurrency(item.amount)}</td>
                    <td className="px-6 py-4">{item.percentage}%</td>
                    <td className="px-6 py-4">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-surface overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-6 pt-6">
            <div>
              <h3 className="text-lg font-semibold">Daily Performance</h3>
              <p className="text-sm text-text-muted">Revenue by day</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-bg-elevated border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Room Revenue</th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Food Revenue</th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Other</th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(monthlyReport.daily_performance || []).slice(0, 10).map((day: any) => (
                  <tr key={day.date} className="hover:bg-bg-elevated transition-colors">
                    <td className="px-6 py-4">{formatDate(day.date)}</td>
                    <td className="px-6 py-4">{formatCurrency(day.room_revenue)}</td>
                    <td className="px-6 py-4">{formatCurrency(day.food_revenue)}</td>
                    <td className="px-6 py-4">{formatCurrency(day.other_revenue)}</td>
                    <td className="px-6 py-4 font-bold">{formatCurrency(day.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <BarChart3 size={28} className="text-accent-primary" />
            Reports & Analytics
          </h2>
          <p className="text-text-muted mt-1">Generate and view hotel performance reports</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={generateReport} className="px-4 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors flex items-center gap-2 min-h-[44px]">
            <RefreshCw size={18} /> Refresh
          </button>
          <button onClick={() => downloadReport('pdf')} className="px-4 py-2 rounded font-medium border border-border text-text-primary hover:bg-bg-elevated transition-colors flex items-center gap-2 min-h-[44px]">
            <FileText size={18} /> PDF
          </button>
          <button onClick={() => downloadReport('excel')} className="px-4 py-2 rounded font-medium border border-border text-text-primary hover:bg-bg-elevated transition-colors flex items-center gap-2 min-h-[44px]">
            <FileText size={18} /> Excel
          </button>
        </div>
      </div>

      <div className="card-surface">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Report Type</label>
            <select className="input-base" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="DAILY">Daily Report</option>
              <option value="WEEKLY">Weekly Report</option>
              <option value="MONTHLY">Monthly Report</option>
              <option value="YEARLY">Yearly Report</option>
              <option value="CUSTOM">Custom Period</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Start Date</label>
            <input className="input-base" type={reportType === 'MONTHLY' ? 'month' : 'date'} value={reportType === 'MONTHLY' ? startDate.slice(0, 7) : startDate} onChange={(e) => setStartDate(reportType === 'MONTHLY' ? e.target.value + '-01' : e.target.value)} />
          </div>
          {reportType === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">End Date</label>
              <input className="input-base" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">&nbsp;</label>
            <button onClick={generateReport} className="btn-primary w-full gap-2">
              <BarChart3 size={18} /> Generate
            </button>
          </div>
        </div>
      </div>

      {reportType === 'DAILY' && renderDailyReport()}
      {reportType === 'MONTHLY' && renderMonthlyReport()}
      {!['DAILY', 'MONTHLY'].includes(reportType) && (
        <div className="py-12 text-center text-text-muted">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Select a report type and click Generate</p>
          <p className="text-sm mt-1">Daily and monthly reports are currently available with full charting</p>
        </div>
      )}

      <div className="card-surface">
        <h3 className="text-lg font-semibold mb-4">Available Reports</h3>
        <p className="text-sm text-text-muted mb-6">Select from various report types</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-bg-elevated border border-border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Financial Reports</h4>
            <ul className="space-y-1 text-sm text-text-muted">
              {['Income Statement', 'Balance Sheet', 'Cash Flow Statement', 'Revenue Analysis'].map((item, i) => (
                <li key={i} className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-text-muted" />{item}</li>
              ))}
            </ul>
          </div>
          <div className="bg-bg-elevated border border-border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Operational Reports</h4>
            <ul className="space-y-1 text-sm text-text-muted">
              {['Occupancy Report', 'Guest Statistics', 'Room Performance', 'Staff Productivity'].map((item, i) => (
                <li key={i} className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-text-muted" />{item}</li>
              ))}
            </ul>
          </div>
          <div className="bg-bg-elevated border border-border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Inventory Reports</h4>
            <ul className="space-y-1 text-sm text-text-muted">
              {['Stock Levels', 'Consumption Report', 'Purchase Orders', 'Supplier Analysis'].map((item, i) => (
                <li key={i} className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-text-muted" />{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
