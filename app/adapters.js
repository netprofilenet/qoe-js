/**
 * Custom Adapters for Web UI
 *
 * Specialized adapters that transform raw metrics for real-time UI updates:
 * - ChartUpdateAdapter: Updates Chart.js instances
 * - MetricsDisplayAdapter: Updates metric display elements
 * - ProgressAdapter: Updates progress bar and status
 */

import { MetricAdapter } from '../dist/core.mjs';

/**
 * Chart Update Adapter
 * Updates Chart.js instances in real-time as metrics arrive
 */
export class ChartUpdateAdapter extends MetricAdapter {
  constructor(charts) {
    super({});
    this.charts = charts; // Chart.js instances
    this.testStartTime = null;
  }

  onMetric(metric) {
    if (!this.testStartTime) {
      this.testStartTime = metric.timestamp;
    }

    const timeSeconds = (metric.timestamp - this.testStartTime) / 1000;

    // Update download chart
    if (metric.type === 'httpDownload' && metric.data?.bandwidth) {
      const bandwidthMbps = metric.data.bandwidth / 1_000_000;
      this.updateChart(this.charts.downloadChart, timeSeconds, bandwidthMbps);
    }

    // Update upload chart
    if (metric.type === 'httpUpload' && metric.data?.bandwidth) {
      const bandwidthMbps = metric.data.bandwidth / 1_000_000;
      this.updateChart(this.charts.uploadChart, timeSeconds, bandwidthMbps);
    }
  }

  updateChart(chart, x, y) {
    if (!chart) return;
    chart.data.datasets[0].data.push({ x, y });
    chart.update('none'); // No animation for real-time updates
  }

  reset() {
    this.testStartTime = null;
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.data.datasets[0].data = [];
        chart.update();
      }
    });
  }
}

/**
 * Metrics Display Adapter
 * Updates DOM elements showing current metrics (download, upload, latency)
 */
export class MetricsDisplayAdapter extends MetricAdapter {
  constructor(elements) {
    super({});
    this.elements = elements; // DOM elements to update
    this.maxDownload = 0;
    this.maxUpload = 0;
    this.latencySamples = [];
  }

  onMetric(metric) {
    // Track max bandwidth
    if (metric.type === 'httpDownload' && metric.data?.bandwidth) {
      this.maxDownload = Math.max(this.maxDownload, metric.data.bandwidth);
      this.updateElement('download', this.maxDownload / 1_000_000);
    }

    if (metric.type === 'httpUpload' && metric.data?.bandwidth) {
      this.maxUpload = Math.max(this.maxUpload, metric.data.bandwidth);
      this.updateElement('upload', this.maxUpload / 1_000_000);
    }

    // Track latency
    if (metric.type === 'latencyProbe' && metric.data?.latency) {
      this.latencySamples.push(metric.data.latency);
      const median = this.calculateMedian(this.latencySamples);
      this.updateElement('latency', median);
    }
  }

  updateElement(key, value) {
    const el = this.elements[key];
    if (el) {
      el.textContent = value.toFixed(2);
    }
  }

  calculateMedian(samples) {
    if (samples.length === 0) return 0;
    const sorted = [...samples].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  reset() {
    this.maxDownload = 0;
    this.maxUpload = 0;
    this.latencySamples = [];
    Object.keys(this.elements).forEach(key => {
      this.updateElement(key, 0);
    });
  }
}

/**
 * Progress Adapter
 * Updates progress bar and status text based on test completion
 */
export class ProgressAdapter extends MetricAdapter {
  constructor(statusElement, progressBar) {
    super({});
    this.statusElement = statusElement;
    this.progressBar = progressBar;
    this.totalSteps = 0;
    this.completedSteps = 0;
    this.currentStep = '';
  }

  setTotalSteps(count) {
    this.totalSteps = count;
    this.completedSteps = 0;
  }

  setCurrentStep(name) {
    this.currentStep = name;
    this.updateStatus();
  }

  onMetric(_metric) {
    // Metrics arrive continuously, so we don't increment on every metric
    // Instead, we'll update based on step completion in the main app
  }

  incrementStep() {
    this.completedSteps++;
    this.updateStatus();
  }

  updateStatus() {
    if (this.totalSteps === 0) return;

    const percentage = (this.completedSteps / this.totalSteps) * 100;

    if (this.progressBar) {
      this.progressBar.style.width = `${percentage}%`;
    }

    if (this.statusElement) {
      if (this.currentStep) {
        this.statusElement.textContent = `${this.currentStep} - ${percentage.toFixed(0)}%`;
      } else {
        this.statusElement.textContent = `Testing... ${percentage.toFixed(0)}%`;
      }
    }
  }

  onComplete() {
    if (this.statusElement) {
      this.statusElement.textContent = 'Test Complete';
    }
    if (this.progressBar) {
      this.progressBar.style.width = '100%';
    }
  }

  reset() {
    this.totalSteps = 0;
    this.completedSteps = 0;
    this.currentStep = '';
    if (this.statusElement) {
      this.statusElement.textContent = '';
    }
    if (this.progressBar) {
      this.progressBar.style.width = '0%';
    }
  }
}
