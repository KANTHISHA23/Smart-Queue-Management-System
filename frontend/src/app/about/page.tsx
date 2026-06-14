'use client';

/**
 * About Page
 */
import React from 'react';
import { Target, Eye, CheckCircle2, Users, TrendingUp, Award, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-hero-gradient pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-[var(--secondary)] mb-4">
            About <span className="text-[var(--primary)]">SmartQueue</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Transforming queue experiences efficiently. We&apos;re on a mission to eliminate long waiting lines and bring smart digital solutions to healthcare, banking, and government services.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[var(--primary-50)] rounded-2xl p-8 mb-10">
            <p className="text-[var(--text-secondary)] leading-relaxed text-center max-w-3xl mx-auto">
              Smart Queue is a cutting-edge queue management system designed to streamline the process of handling visitors in various sectors. By utilizing technology, we aim to eliminate the chaos and inefficiencies associated with traditional queuing methods. Our solution is tailored for hospitals, banks, government offices, and other institutions where managing a steady flow of visitors is critical.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-static">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <Target size={28} className="text-[var(--primary)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--secondary)] mb-3">Our Mission</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                We aim to provide a seamless and efficient queuing experience by minimizing wait times and enhancing customer satisfaction through innovative digital solutions.
              </p>
            </div>
            <div className="card-static">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
                <Eye size={28} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-[var(--secondary)] mb-3">Our Vision</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                To become the leading queue management solution that is synonymous with innovation and convenience, making long queues a thing of the past.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-[var(--bg-light)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-[var(--secondary)] mb-10">Benefits of Using Smart Queue</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: <CheckCircle2 size={24} />, title: 'Reduced Wait Times', desc: 'Significantly decrease customer waiting times by optimizing the queue process.', color: 'text-green-600', bg: 'bg-green-50' },
              { icon: <Users size={24} />, title: 'Enhanced Customer Satisfaction', desc: 'Provide a hassle-free, organized and transparent queuing experience.', color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: <TrendingUp size={24} />, title: 'Data-Driven Insights', desc: 'Gain valuable insights through detailed analytics, reports & trends.', color: 'text-purple-600', bg: 'bg-purple-50' },
              { icon: <Award size={24} />, title: 'Priority & Emergency Handling', desc: 'Efficiently manage high priority and emergency cases with dedicated tools.', color: 'text-red-600', bg: 'bg-red-50' },
            ].map((item, i) => (
              <div key={i} className="card-static flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                  <span className={item.color}>{item.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-[var(--secondary)] mb-1">{item.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cta-gradient py-16 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Revolutionize Your Queue Management?</h2>
          <Link href="/register" className="bg-white text-[var(--primary)] font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-lg inline-flex items-center gap-2">
            Get Started <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
