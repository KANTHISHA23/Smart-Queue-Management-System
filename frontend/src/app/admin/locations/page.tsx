'use client';

/**
 * Admin Locations Management Page
 */
import React, { useState, useEffect } from 'react';
import { locationService } from '@/services/location.service';
import { useToast } from '@/components/ToastProvider';
import { MapPin, Plus, Edit2, Trash2, Building2, X } from 'lucide-react';

export default function AdminLocationsPage() {
  const { showToast } = useToast();
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', type: 'hospital', description: '', address: '', city: '', phone: '', email: ''
  });

  const fetchLocations = async () => {
    try {
      const res = await locationService.getAll({ limit: 50 } as any);
      setLocations(res.data.data.locations);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLocations(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await locationService.create(formData);
      showToast('Location created successfully!', 'success');
      setShowForm(false);
      setFormData({ name: '', type: 'hospital', description: '', address: '', city: '', phone: '', email: '' });
      fetchLocations();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to create location.', 'error');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This will also delete all queues and tokens.`)) return;
    try {
      await locationService.delete(id);
      showToast('Location deleted.', 'success');
      fetchLocations();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete location.', 'error');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--secondary)]">Manage Locations</h1>
          <p className="text-sm text-[var(--text-muted)]">Add and manage service locations</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Location</>}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card-static mb-6">
          <h2 className="font-bold text-[var(--secondary)] mb-4">New Location</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input value={formData.name} onChange={e => setFormData(d => ({ ...d, name: e.target.value }))} className="input" placeholder="Location name" required />
            </div>
            <div>
              <label className="label">Type *</label>
              <select value={formData.type} onChange={e => setFormData(d => ({ ...d, type: e.target.value }))} className="input">
                <option value="hospital">Hospital</option>
                <option value="clinic">Clinic</option>
                <option value="bank">Bank</option>
                <option value="government">Government</option>
                <option value="office">Office</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea value={formData.description} onChange={e => setFormData(d => ({ ...d, description: e.target.value }))} className="input min-h-[80px]" placeholder="Brief description..." />
            </div>
            <div>
              <label className="label">Address</label>
              <input value={formData.address} onChange={e => setFormData(d => ({ ...d, address: e.target.value }))} className="input" placeholder="Street address" />
            </div>
            <div>
              <label className="label">City</label>
              <input value={formData.city} onChange={e => setFormData(d => ({ ...d, city: e.target.value }))} className="input" placeholder="City" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input value={formData.phone} onChange={e => setFormData(d => ({ ...d, phone: e.target.value }))} className="input" placeholder="+91..." />
            </div>
            <div>
              <label className="label">Email</label>
              <input value={formData.email} onChange={e => setFormData(d => ({ ...d, email: e.target.value }))} className="input" type="email" placeholder="contact@..." />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="btn-primary">Create Location</button>
            </div>
          </form>
        </div>
      )}

      {/* Locations List */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-20" />)}</div>
      ) : (
        <div className="space-y-3">
          {locations.map(loc => (
            <div key={loc.id} className="card-static flex items-center justify-between !py-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--primary-50)] flex items-center justify-center">
                  <Building2 size={22} className="text-[var(--primary)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--secondary)]">{loc.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span className="badge badge-active text-[10px]">{loc.type}</span>
                    <span>{loc.city}</span>
                    <span>{loc.queue_count} queues</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(loc.id, loc.name)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
