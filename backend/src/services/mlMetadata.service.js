/**
 * ML insights for admin dashboards — model metadata, service health, production usage.
 */
const fs = require('fs');
const path = require('path');
const analyticsRepository = require('../repositories/analytics.repository');

const METADATA_PATH = path.join(__dirname, '../../../ml/models/model_metadata.json');
const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || 'http://localhost:8001').replace(/\/$/, '');
const ML_PREDICTION_ENABLED = process.env.ML_PREDICTION_ENABLED !== 'false';
const ML_TIMEOUT_MS = parseInt(process.env.ML_TIMEOUT_MS || '2000', 10);

function formatFeatureLabel(name) {
  return name
    .replace(/^priority_level_/, 'Priority: ')
    .replace(/^location_type_/, 'Location: ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function getMlServiceHealth() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`, { signal: controller.signal });
    if (!response.ok) {
      return { online: false, url: ML_SERVICE_URL, message: `Service responded with ${response.status}` };
    }
    const data = await response.json();
    return {
      online: true,
      url: ML_SERVICE_URL,
      model_loaded: data.model_loaded ?? false,
      version: data.version ?? null,
      trained_at: data.trained_at ?? null,
    };
  } catch (error) {
    return {
      online: false,
      url: ML_SERVICE_URL,
      message: error.name === 'AbortError' ? 'Connection timed out' : error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function readModelMetadata() {
  if (!fs.existsSync(METADATA_PATH)) {
    return {
      available: false,
      message: 'Model not trained yet. Run ml/retrain.bat or ml/retrain.sh.',
    };
  }

  const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'));
  const featureImportance = Object.entries(metadata.feature_importance || {})
    .map(([name, score]) => ({
      feature: formatFeatureLabel(name),
      raw_name: name,
      importance: Number(score),
      importance_pct: Number((Number(score) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.importance - a.importance);

  return {
    available: true,
    version: metadata.version,
    trained_at: metadata.trained_at,
    training_rows: metadata.training_rows,
    use_ml_in_production: metadata.use_ml_in_production,
    model_type: 'Random Forest Regressor',
    baseline_metrics: metadata.baseline_metrics,
    random_forest_metrics: metadata.random_forest_metrics,
    mae_improvement_pct: metadata.mae_improvement_pct,
    feature_importance: featureImportance,
    comparison: [
      {
        model: 'Rule-based heuristic',
        key: 'baseline',
        mae: metadata.baseline_metrics?.mae,
        rmse: metadata.baseline_metrics?.rmse,
        within_5_pct: metadata.baseline_metrics?.within_5_pct,
        r2: metadata.baseline_metrics?.r2,
      },
      {
        model: 'Random Forest (ML)',
        key: 'random_forest',
        mae: metadata.random_forest_metrics?.mae,
        rmse: metadata.random_forest_metrics?.rmse,
        within_5_pct: metadata.random_forest_metrics?.within_5_pct,
        r2: metadata.random_forest_metrics?.r2,
      },
    ],
  };
}

async function getMlInsights() {
  const [health, usageResult, accuracyResult] = await Promise.all([
    getMlServiceHealth(),
    analyticsRepository.getMlProductionStats(),
    analyticsRepository.getMlProductionAccuracy(),
  ]);

  const usageBySource = usageResult.rows.reduce(
    (acc, row) => {
      acc[row.prediction_source] = row.count;
      return acc;
    },
    { ml: 0, heuristic: 0 }
  );

  const totalPredictions = usageBySource.ml + usageBySource.heuristic;
  const productionAccuracy = accuracyResult.rows.map((row) => ({
    prediction_source: row.prediction_source,
    completed_with_estimate: row.completed_with_estimate,
    mae_minutes: Number(row.mae_minutes),
    within_5_pct: Number(row.within_5_pct),
  }));

  return {
    ok: true,
    data: {
      model: readModelMetadata(),
      service: {
        enabled: ML_PREDICTION_ENABLED,
        ...health,
      },
      production: {
        total_predictions: totalPredictions,
        ml_predictions: usageBySource.ml,
        heuristic_predictions: usageBySource.heuristic,
        ml_share_pct:
          totalPredictions > 0 ? Number(((usageBySource.ml / totalPredictions) * 100).toFixed(1)) : 0,
        accuracy_by_source: productionAccuracy,
      },
      pipeline: [
        { step: 1, title: 'Feature extraction', detail: 'Queue state, priority, time, location type' },
        { step: 2, title: 'ML inference', detail: 'FastAPI Random Forest via POST /predict' },
        { step: 3, title: 'Graceful fallback', detail: 'Rule-based heuristic if ML service is offline' },
        { step: 4, title: 'Live delivery', detail: 'Estimated wait shown on user dashboard & tracking page' },
      ],
    },
  };
}

/** @deprecated Use getMlInsights — kept for route compatibility */
function getModelMetadata() {
  const model = readModelMetadata();
  if (!model.available) {
    return { ok: true, data: model };
  }
  return {
    ok: true,
    data: {
      available: true,
      version: model.version,
      trained_at: model.trained_at,
      training_rows: model.training_rows,
      use_ml_in_production: model.use_ml_in_production,
      baseline_mae: model.baseline_metrics?.mae,
      random_forest_mae: model.random_forest_metrics?.mae,
      mae_improvement_pct: model.mae_improvement_pct,
    },
  };
}

module.exports = {
  getMlInsights,
  getModelMetadata,
};
