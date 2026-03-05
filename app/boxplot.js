/**
 * Box Plot Renderer
 *
 * Creates custom HTML/CSS box plot visualizations showing:
 * - Min, Q1, Median, Q3, Max values
 * - Visual box-and-whisker chart
 * - Scatter points for all samples
 */

/**
 * Create a box plot visualization
 *
 * @param {HTMLElement} container - Container element to append box plot to
 * @param {Object} stats - Statistics object with min, max, p25, p50, p75
 * @param {Array} samples - Array of sample values
 * @param {string} label - Label for the box plot
 * @param {string} unit - Unit of measurement (e.g., "Mbps", "ms")
 * @param {string} color - Color for the box plot (e.g., "#FF9966")
 * @returns {HTMLElement} The created box plot element
 */
export function createBoxPlot(container, stats, samples, label, unit, color) {
  const { min, max, p25, p50, p75 } = stats;

  // Create wrapper div
  const wrapper = document.createElement('div');
  wrapper.className = 'boxplot';

  // Header with label and sample count
  const header = document.createElement('div');
  header.className = 'boxplot-label';
  header.textContent = `${label} (${samples.length} samples)`;
  wrapper.appendChild(header);

  // Statistics text
  const statsText = document.createElement('div');
  statsText.className = 'boxplot-stats';
  statsText.innerHTML = `
    Min: ${min.toFixed(2)} |
    Q1: ${p25.toFixed(2)} |
    Median: ${p50.toFixed(2)} |
    Q3: ${p75.toFixed(2)} |
    Max: ${max.toFixed(2)} ${unit}
  `;
  wrapper.appendChild(statsText);

  // Visual box plot
  const visual = createBoxPlotVisual(min, max, p25, p50, p75, samples, color);
  wrapper.appendChild(visual);

  container.appendChild(wrapper);
  return wrapper;
}

/**
 * Create the visual box plot element
 *
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} q1 - First quartile (25th percentile)
 * @param {number} median - Median value (50th percentile)
 * @param {number} q3 - Third quartile (75th percentile)
 * @param {Array} samples - Array of sample values
 * @param {string} color - Color for the box plot
 * @returns {HTMLElement} Visual box plot element
 */
function createBoxPlotVisual(min, max, q1, median, q3, samples, color) {
  const visual = document.createElement('div');
  visual.className = 'boxplot-visual';
  visual.style.borderColor = color;

  // Calculate range with 10% padding
  const range = max - min;
  const paddedMin = min - range * 0.1;
  const paddedMax = max + range * 0.1;
  const paddedRange = paddedMax - paddedMin;

  // Helper function to convert value to percentage position
  const valueToPercent = (value) => {
    return ((value - paddedMin) / paddedRange) * 100;
  };

  // Create whisker (min to max line)
  const whisker = document.createElement('div');
  whisker.className = 'boxplot-whisker';
  whisker.style.left = `${valueToPercent(min)}%`;
  whisker.style.width = `${valueToPercent(max) - valueToPercent(min)}%`;
  whisker.style.backgroundColor = color;
  visual.appendChild(whisker);

  // Create box (Q1 to Q3)
  const box = document.createElement('div');
  box.className = 'boxplot-box';
  box.style.left = `${valueToPercent(q1)}%`;
  box.style.width = `${valueToPercent(q3) - valueToPercent(q1)}%`;
  box.style.borderColor = color;
  box.style.backgroundColor = color + '40'; // Add transparency
  visual.appendChild(box);

  // Create median line
  const medianLine = document.createElement('div');
  medianLine.className = 'boxplot-median';
  medianLine.style.left = `${valueToPercent(median)}%`;
  medianLine.style.backgroundColor = color;
  visual.appendChild(medianLine);

  // Create min marker
  const minMarker = document.createElement('div');
  minMarker.className = 'boxplot-marker';
  minMarker.style.left = `${valueToPercent(min)}%`;
  minMarker.style.backgroundColor = color;
  visual.appendChild(minMarker);

  // Create max marker
  const maxMarker = document.createElement('div');
  maxMarker.className = 'boxplot-marker';
  maxMarker.style.left = `${valueToPercent(max)}%`;
  maxMarker.style.backgroundColor = color;
  visual.appendChild(maxMarker);

  // Add scatter points for all samples
  samples.forEach(value => {
    const point = document.createElement('div');
    point.className = 'boxplot-point';
    point.style.left = `${valueToPercent(value)}%`;
    point.style.backgroundColor = color;
    visual.appendChild(point);
  });

  // Add axis labels
  const axis = document.createElement('div');
  axis.className = 'boxplot-axis';

  const minLabel = document.createElement('span');
  minLabel.style.left = '0%';
  minLabel.textContent = min.toFixed(1);
  axis.appendChild(minLabel);

  const maxLabel = document.createElement('span');
  maxLabel.style.left = '100%';
  maxLabel.textContent = max.toFixed(1);
  axis.appendChild(maxLabel);

  visual.appendChild(axis);

  return visual;
}

/**
 * Clear all box plots from a container
 *
 * @param {HTMLElement} container - Container element
 */
export function clearBoxPlots(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}
