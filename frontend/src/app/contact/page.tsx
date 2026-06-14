'use client';

/**
 * Contact Page
 */
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export default function ContactPage() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Use the generic /api endpoint routing strategy seen elsewhere
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit query. Please try again later.');
      }

      showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-hero-gradient pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-[var(--secondary)] mb-4">Contact Us</h1>
          <p className="text-lg text-[var(--text-secondary)]">Get in touch with us for any questions or support.</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Info */}
            <div>
              <h2 className="text-2xl font-bold text-[var(--secondary)] mb-4">Empowering Efficient Queue Management</h2>
              <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
                Smart Queue is a cutting-edge queue management system designed to streamline the process of handling visitors in various sectors. By utilizing technology, we aim to eliminate the chaos and inefficiencies associated with traditional queuing methods.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: <Mail size={24} />, label: 'Email Us', value: 'vijay931111@gmail.com' },
                  { icon: <Phone size={24} />, label: 'Call Us', value: '+91 6201135206' },
                  { icon: <MapPin size={24} />, label: 'Visit Us', value: 'Vikash Nagar, Hazaribagh, India' },
                ].map((item, i) => (
                  <div key={i} className="card-static text-center">
                    <div className="w-12 h-12 rounded-xl bg-[var(--primary-50)] flex items-center justify-center mx-auto mb-3">
                      <span className="text-[var(--primary)]">{item.icon}</span>
                    </div>
                    <h3 className="font-semibold text-[var(--secondary)] text-sm mb-1">{item.label}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="card-static">
              <h2 className="text-xl font-bold text-[var(--secondary)] mb-6 flex items-center gap-2">
                <Send size={20} className="text-[var(--primary)]" /> Send Us a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Your Name</label>
                  <input value={formData.name} onChange={e => setFormData(d => ({ ...d, name: e.target.value }))} className="input" placeholder="Your Name" required />
                </div>
                <div>
                  <label className="label">Your Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData(d => ({ ...d, email: e.target.value }))} className="input" placeholder="Your Email" required />
                </div>
                <div>
                  <label className="label">Subject</label>
                  <select value={formData.subject} onChange={e => setFormData(d => ({ ...d, subject: e.target.value }))} className="input">
                    <option value="">Select subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>
                <div>
                  <label className="label">Message</label>
                  <textarea value={formData.message} onChange={e => setFormData(d => ({ ...d, message: e.target.value }))} className="input min-h-[120px]" placeholder="Your message..." required />
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center disabled:opacity-70">
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <><Send size={16} /> Send Message</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-[var(--bg-light)]">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-[var(--secondary)] mb-8">Frequently Asked Questions</h2>
          {[
            { q: 'How do I book a token online?', a: 'Simply sign up, select a location, choose a queue, and click "Book Token". You\'ll receive a digital token with your queue position.' },
            { q: 'What should I do if I miss my turn?', a: 'If you miss your turn, your token may be skipped. You can rebook a new token from the locations page.' },
            { q: 'Is my data secure with SmartQueue?', a: 'Absolutely. We use industry-standard encryption (JWT tokens, bcrypt password hashing) and follow best security practices.' },
            { q: 'Can I cancel my token?', a: 'Yes, you can cancel any waiting token from your dashboard before it\'s called.' },
          ].map((faq, i) => (
            <details key={i} className="card-static mb-3 group">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-[var(--secondary)]">
                <span className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[var(--primary)] text-white text-sm flex items-center justify-center font-bold">{i + 1}</span>
                  {faq.q}
                </span>
                <span className="text-[var(--primary)] group-open:rotate-45 transition-transform text-xl">+</span>
              </summary>
              <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed pl-10">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cta-gradient py-14 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-4">We&apos;re here to simplify your queue management needs.</h2>
          <a href="mailto:vijay931111@gmail.com" className="bg-white text-[var(--primary)] font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-all shadow-lg inline-block">
            Talk to Us
          </a>
        </div>
      </section>
    </div>
  );
}
