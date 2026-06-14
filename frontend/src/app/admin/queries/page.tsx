'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ToastProvider';
import { Mail, CheckCircle, Trash2, Clock, Search, Filter } from 'lucide-react';

interface Query {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'resolved';
  created_at: string;
}

export default function AdminQueriesPage() {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  
  const [queries, setQueries] = useState<Query[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'resolved'>('all');
  
  // Base API url
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (isAuthenticated) {
      fetchQueries();
    }
  }, [isAuthenticated]);

  const fetchQueries = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch(`${apiUrl}/admin/queries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setQueries(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch queries');
      }
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: 'pending' | 'resolved') => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${apiUrl}/admin/queries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      
      if (res.ok) {
        setQueries(q => q.map(query => query.id === id ? { ...query, status } : query));
        showToast('Status updated', 'success');
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this query?')) return;
    
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${apiUrl}/admin/queries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setQueries(q => q.filter(query => query.id !== id));
        showToast('Query deleted', 'success');
      } else {
        throw new Error(data.message || 'Failed to delete query');
      }
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const filteredQueries = queries.filter(q => {
    const matchesSearch = q.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          q.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          q.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--secondary)]">Contact Queries</h1>
          <p className="text-[var(--text-secondary)] text-sm">Manage user inquiries and support requests</p>
        </div>
        <div className="flex bg-[var(--primary-50)] text-[var(--primary)] px-4 py-2 rounded-lg font-medium shadow-sm">
          Total: {queries.length}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, email, or subject..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)]"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'resolved'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                filterStatus === status 
                ? 'bg-[var(--primary)] text-white shadow-md' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Queries List */}
      <div className="space-y-4">
        {filteredQueries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100 text-gray-500">
            <Mail className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p>No queries found matching the criteria.</p>
          </div>
        ) : (
          filteredQueries.map(query => (
            <div key={query.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${query.status === 'resolved' ? 'bg-green-500' : 'bg-yellow-400'}`}></div>
              
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2 flex-1 pl-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-lg">{query.subject || 'No Subject'}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                      query.status === 'resolved' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {query.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500 gap-4 flex-wrap">
                    <span className="flex items-center gap-1 font-medium"><Mail size={14} className="text-gray-400" /> {query.name} ({query.email})</span>
                    <span className="flex items-center gap-1"><Clock size={14} className="text-gray-400" /> {new Date(query.created_at).toLocaleString()}</span>
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-100 whitespace-pre-wrap">
                    {query.message}
                  </div>
                </div>

                <div className="flex md:flex-col justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-4">
                  {query.status === 'pending' ? (
                    <button 
                      onClick={() => handleUpdateStatus(query.id, 'resolved')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      <CheckCircle size={16} /> Resolve
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleUpdateStatus(query.id, 'pending')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Clock size={16} /> Mark Pending
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(query.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors opacity-80 group-hover:opacity-100"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
