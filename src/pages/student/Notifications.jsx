import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Bell, CheckCircle2, Clock, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const { toast } = useNotification();

  useEffect(() => {
    notificationsApi.getNotifications().then(setNotifications).finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id) => {
    await notificationsApi.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAll = async () => {
    await notificationsApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('All notifications marked as read.');
  };

  const filtered = notifications.filter(
    (n) => categoryFilter === 'All' || n.category.toLowerCase() === categoryFilter.toLowerCase()
  );

  if (loading) return <div className="p-8 text-center text-xs font-bold text-slate-500">Loading Notifications...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Notification Center"
        subtitle="Stay updated on new job postings, interview schedules, shortlist alerts, and placement drives."
        actions={
          <button
            onClick={handleMarkAll}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" /> Mark All Read
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-200">
        {['All', 'Jobs', 'Applications', 'Interviews', 'Placements', 'System'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              categoryFilter === cat
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-2xs overflow-hidden">
        {filtered.map((n) => (
          <div
            key={n.id}
            className={`p-4 flex items-start justify-between gap-4 transition-colors ${
              !n.read ? 'bg-indigo-50/30 font-semibold' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2.5 rounded-xl border mt-0.5 ${
                  !n.read ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                  <Badge variant="primary" size="sm">
                    {n.category}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                <span className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {n.time}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {n.link && (
                <Link
                  to={n.link}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold"
                >
                  View Details
                </Link>
              )}
              {!n.read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  title="Mark as Read"
                  className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
