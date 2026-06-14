'use client';

/**
 * Admin ML Insights — model evaluation, feature importance, and production usage.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { analyticsService } from '@/services/analytics.service';
import {
  Brain,
  Activity,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Cpu,
  RefreshCw,
  Zap,
  Target,
} from 'lucide-react';

interface ModelMetrics {
  mae?: number;
  rmse?: number;
  within_5_pct?: number;
  r2?: number;
}

interface MlInsightsData {
  model: {
    available: boolean;
    message?: string;
    version?: string;
    trained_at?: string;
    training_rows?: number;
    use_ml_in_production?: boolean;
    model_type?: string;
    mae_improvement_pct?: number;
    baseline_metrics?: ModelMetrics;
    random_forest_metrics?: ModelMetrics;
    feature_importance?: Array<{
      feature: string;
      importance: number;
      importance_pct: number;
    }>;
    comparison?: Array<{
      model: string;
      key: string;
      mae?: number;
      rmse?: number;
      within_5_pct?: number;
      r2?: number;
    }>;
  };
  service: {
    enabled: boolean;
    online: boolean;
    url: string;
    message?: string;
    model_loaded?: boolean;
  };
  production: {
    total_predictions: number;
    ml_predictions: number;
    heuristic_predictions: number;
    ml_share_pct: number;
    accuracy_by_source: Array<{
      prediction_source: string;
      completed_with_estimate: number;
      mae_minutes: number;
      within_5_pct: number;
    }>;
  };
  pipeline: Array<{ step: number; title: string; detail: string }>;
}

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="card-static">
      <p className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
      <p className="text-sm font-semibold text-[var(--secondary)] mt-1">{label}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
    </div>
  );
}

function formatMetric(value?: number, suffix = '') {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return `${Number(value).toFixed(value < 10 ? 2 : 1)}${suffix}`;
}

export default function AdminMlInsightsPage() {
  const [insights, setInsights] = useState<MlInsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async (silent = false) => {
    if (silent) setIsRefreshing(true);
    else setIsLoading(true);
    setError('');
    try {
      const res = await analyticsService.getMlInsights();
      setInsights(res.data.data);
    } catch (err) {
      console.error('Failed to fetch ML insights:', err);
      setError('Failed to load ML insights. Ensure you are signed in as admin.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const topFeatures = useMemo(
    () => insights?.model.feature_importance?.slice(0, 8) ?? [],
    [insights]
  );

  const maxImportance = useMemo(
    () => Math.max(...topFeatures.map((f) => f.importance), 0.01),
    [topFeatures]
  );

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="skeleton h-8 w-56 mb-2" />
        <div className="skeleton h-5 w-80 mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-72" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="p-6 lg:p-8">
        <div className="card-static text-center py-12">
          <AlertTriangle size={32} className="text-amber-500 mx-auto mb-3" />
          <p className="text-[var(--text-secondary)]">{error || 'No data available'}</p>
          <button type="button" onClick={() => load()} className="btn-primary mt-4">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { model, service, production, pipeline } = insights;
  const rfMetrics = model.random_forest_metrics;
  const serviceStatus = service.online
    ? { label: 'Online', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    : { label: 'Offline (fallback active)', className: 'bg-amber-50 text-amber-700 border-amber-200' };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Brain size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--secondary)]">Model Overview</h1>
              <p className="text-sm text-[var(--text-muted)]">
                Wait-time prediction — evaluation metrics, feature signals & live usage
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={isRefreshing}
          className="px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-60"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {!model.available ? (
        <div className="card-static border-amber-200 bg-amber-50/50">
          <div className="flex items-start gap-3">
            <AlertTriangle size={22} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-[var(--secondary)]">Model not trained</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{model.message}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Key outcomes */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              label="Predictions within ±5 min"
              value={`${formatMetric(rfMetrics?.within_5_pct, '%')}`}
              sub="Random Forest on test set"
              accent="text-indigo-600"
            />
            <MetricCard
              label="MAE improvement vs baseline"
              value={`${formatMetric(model.mae_improvement_pct, '%')}`}
              sub="Mean absolute error reduction"
              accent="text-emerald-600"
            />
            <MetricCard
              label="Training samples"
              value={model.training_rows ?? '—'}
              sub="Completed historical tokens"
              accent="text-[var(--secondary)]"
            />
            <MetricCard
              label="Live ML predictions"
              value={production.ml_predictions}
              sub={`${production.ml_share_pct}% of all bookings`}
              accent="text-violet-600"
            />
          </div>

          {/* Service status + pipeline */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div className="card-static">
              <div className="flex items-center gap-2 mb-4">
                <Cpu size={20} className="text-[var(--primary)]" />
                <h2 className="font-bold text-[var(--secondary)]">Inference Service</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50">
                  <span className="text-sm text-[var(--text-secondary)]">Status</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${serviceStatus.className}`}>
                    {serviceStatus.label}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50">
                  <span className="text-sm text-[var(--text-secondary)]">ML enabled</span>
                  <span className="text-sm font-semibold text-[var(--secondary)]">
                    {service.enabled ? 'Yes' : 'No (heuristic only)'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50">
                  <span className="text-sm text-[var(--text-secondary)]">Model</span>
                  <span className="text-sm font-semibold text-[var(--secondary)]">{model.model_type}</span>
                </div>
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50">
                  <span className="text-sm text-[var(--text-secondary)]">Last trained</span>
                  <span className="text-sm font-semibold text-[var(--secondary)]">
                    {model.trained_at
                      ? new Date(model.trained_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </span>
                </div>
                {!service.online && service.message && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                    {service.message}. Bookings still work via rule-based fallback.
                  </p>
                )}
              </div>
            </div>

            <div className="card-static">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={20} className="text-[var(--primary)]" />
                <h2 className="font-bold text-[var(--secondary)]">Prediction Pipeline</h2>
              </div>
              <ol className="space-y-3">
                {pipeline.map((step) => (
                  <li key={step.step} className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {step.step}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--secondary)]">{step.title}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Model comparison */}
          <div className="card-static mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Target size={20} className="text-[var(--primary)]" />
              <h2 className="font-bold text-[var(--secondary)]">Model Evaluation (Test Set)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-3 font-semibold text-[var(--text-secondary)]">Approach</th>
                    <th className="pb-3 font-semibold text-[var(--text-secondary)] text-right">MAE (min)</th>
                    <th className="pb-3 font-semibold text-[var(--text-secondary)] text-right">RMSE (min)</th>
                    <th className="pb-3 font-semibold text-[var(--text-secondary)] text-right">Within ±5 min</th>
                    <th className="pb-3 font-semibold text-[var(--text-secondary)] text-right">R²</th>
                  </tr>
                </thead>
                <tbody>
                  {(model.comparison ?? []).map((row) => (
                    <tr
                      key={row.key}
                      className={`border-b border-gray-50 ${row.key === 'random_forest' ? 'bg-indigo-50/40' : ''}`}
                    >
                      <td className="py-3 font-medium text-[var(--secondary)]">
                        {row.model}
                        {row.key === 'random_forest' && (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                            Selected
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right tabular-nums">{formatMetric(row.mae)}</td>
                      <td className="py-3 text-right tabular-nums">{formatMetric(row.rmse)}</td>
                      <td className="py-3 text-right tabular-nums">{formatMetric(row.within_5_pct, '%')}</td>
                      <td className="py-3 text-right tabular-nums">{formatMetric(row.r2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-4">
              Baseline: people ahead × average service time of last 20 completions. ML uses queue context,
              priority, time-of-day, and location type.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Feature importance */}
            <div className="card-static">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={20} className="text-[var(--primary)]" />
                <h2 className="font-bold text-[var(--secondary)]">Feature Importance</h2>
              </div>
              <div className="space-y-3">
                {topFeatures.map((feature) => {
                  const width = (feature.importance / maxImportance) * 100;
                  return (
                    <div key={feature.feature}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium text-[var(--secondary)] truncate">
                          {feature.feature}
                        </span>
                        <span className="text-xs font-bold text-indigo-600 tabular-nums flex-shrink-0">
                          {feature.importance_pct}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(width, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live booking sources */}
            <div className="card-static">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={20} className="text-[var(--primary)]" />
                <h2 className="font-bold text-[var(--secondary)]">Live Booking Sources</h2>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                How recent bookings were estimated. ML is used when the inference service is running;
                otherwise the system falls back to the rule-based formula.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
                  <p className="text-2xl font-bold text-indigo-700 tabular-nums">{production.ml_predictions}</p>
                  <p className="text-xs font-medium text-indigo-600 mt-1">ML predictions</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                  <p className="text-2xl font-bold text-gray-700 tabular-nums">{production.heuristic_predictions}</p>
                  <p className="text-xs font-medium text-gray-500 mt-1">Heuristic fallback</p>
                </div>
              </div>
              {production.ml_predictions === 0 && service.online && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
                  No bookings have used ML yet. Book a new token while the service is online, then refresh
                  this page — the ML count will update.
                </p>
              )}
              {production.ml_predictions === 0 && !service.online && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
                  ML service is offline, so all bookings use the heuristic fallback. Start the ML service
                  (`ml/start-ml.bat`) and book a new token to see ML predictions.
                </p>
              )}
              {production.accuracy_by_source.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                    Completed token accuracy (live data)
                  </p>
                  {production.accuracy_by_source.map((row) => (
                    <div
                      key={row.prediction_source}
                      className="p-3 rounded-xl bg-gray-50 border border-gray-100"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-semibold text-[var(--secondary)]">
                          {row.prediction_source === 'ml' ? 'Random Forest' : 'Rule-based heuristic'}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {row.completed_with_estimate} completed
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-[var(--text-secondary)]">
                          MAE: <strong>{row.mae_minutes} min</strong>
                        </span>
                        <span className="text-[var(--text-secondary)]">
                          Within ±5 min: <strong>{row.within_5_pct}%</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No completed tokens with estimates yet.</p>
              )}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--text-muted)]">
                  For model selection, use the <strong>Model Evaluation (Test Set)</strong> table above — it
                  compares ML vs baseline on 343 held-out training records.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
