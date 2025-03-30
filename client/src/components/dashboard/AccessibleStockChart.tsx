import React, { useEffect, useRef, useState } from 'react';

interface ChartDataPoint {
  date: string;
  value: number;
}

interface AccessibleStockChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  isLoading?: boolean;
  colorScheme?: {
    line: string;
    gradient: {
      top: string;
      bottom: string;
    };
    tooltip: {
      background: string;
      text: string;
      border: string;
    };
    grid: string;
  };
}

export const AccessibleStockChart: React.FC<AccessibleStockChartProps> = ({
  data,
  width = 800,
  height = 300,
  isLoading = false,
  colorScheme = {
    line: '#22c55e',
    gradient: {
      top: 'rgba(34, 197, 94, 0.3)',
      bottom: 'rgba(34, 197, 94, 0.0)'
    },
    tooltip: {
      background: '#18181b',
      text: '#ffffff',
      border: '#22c55e'
    },
    grid: '#27272a'
  }
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{visible: boolean, x: number, y: number, value: number, date: string}>({
    visible: false,
    x: 0,
    y: 0,
    value: 0,
    date: ''
  });

  useEffect(() => {
    if (!data || data.length === 0 || isLoading) return;

    // Render the chart when data changes
    renderChart();
  }, [data, width, height, isLoading]);

  const renderChart = () => {
    if (!svgRef.current || data.length === 0) return;

    // Clear previous content
    while (svgRef.current.firstChild) {
      svgRef.current.removeChild(svgRef.current.firstChild);
    }

    // Calculate dimensions
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Find min and max values
    const values = data.map(d => d.value);
    const minValue = Math.min(...values) * 0.95; // Add some padding
    const maxValue = Math.max(...values) * 1.05;

    // Create scales
    const xScale = (index: number) => (index / (data.length - 1)) * chartWidth;
    const yScale = (value: number) => chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;

    // Create group element
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${margin.left},${margin.top})`);
    svgRef.current.appendChild(g);

    // Draw grid lines (horizontal)
    const gridCount = 5;
    for (let i = 0; i <= gridCount; i++) {
      const y = (i / gridCount) * chartHeight;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', y.toString());
      line.setAttribute('x2', chartWidth.toString());
      line.setAttribute('y2', y.toString());
      line.setAttribute('stroke', colorScheme.grid);
      line.setAttribute('stroke-width', '0.5');
      line.setAttribute('stroke-dasharray', '3,3');
      g.appendChild(line);
    }

    // Create path for the line
    const pathData = data.map((d, i) => {
      const x = xScale(i);
      const y = yScale(d.value);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // Draw the line
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', colorScheme.line);
    path.setAttribute('stroke-width', '2');
    g.appendChild(path);

    // Create gradient for the area
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'area-gradient');
    gradient.setAttribute('x1', '0');
    gradient.setAttribute('y1', '0');
    gradient.setAttribute('x2', '0');
    gradient.setAttribute('y2', '1');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', colorScheme.gradient.top);

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', colorScheme.gradient.bottom);

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svgRef.current.appendChild(defs);

    // Draw the area
    const areaData = [
      ...data.map((d, i) => {
        const x = xScale(i);
        const y = yScale(d.value);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      }),
      `L ${chartWidth} ${chartHeight}`,
      `L 0 ${chartHeight}`,
      'Z'
    ].join(' ');

    const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    area.setAttribute('d', areaData);
    area.setAttribute('fill', 'url(#area-gradient)');
    g.appendChild(area);

    // Add interaction layer
    const interactionLayer = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    interactionLayer.setAttribute('x', '0');
    interactionLayer.setAttribute('y', '0');
    interactionLayer.setAttribute('width', chartWidth.toString());
    interactionLayer.setAttribute('height', chartHeight.toString());
    interactionLayer.setAttribute('fill', 'transparent');
    interactionLayer.setAttribute('pointer-events', 'all');
    
    // Add mouse events for tooltip
    interactionLayer.addEventListener('mousemove', (event) => {
      const svgRect = svgRef.current!.getBoundingClientRect();
      const mouseX = event.clientX - svgRect.left - margin.left;
      
      // Find closest data point
      const index = Math.min(
        Math.max(0, Math.round((mouseX / chartWidth) * (data.length - 1))),
        data.length - 1
      );
      
      const dataPoint = data[index];
      const x = xScale(index);
      const y = yScale(dataPoint.value);
      
      // Update tooltip
      setTooltip({
        visible: true,
        x: x + margin.left,
        y: y + margin.top,
        value: dataPoint.value,
        date: dataPoint.date
      });
      
      // Add tooltip marker
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      marker.setAttribute('cx', x.toString());
      marker.setAttribute('cy', y.toString());
      marker.setAttribute('r', '4');
      marker.setAttribute('fill', colorScheme.line);
      
      // Remove previous marker if exists
      const existingMarker = g.querySelector('.tooltip-marker');
      if (existingMarker) {
        g.removeChild(existingMarker);
      }
      
      marker.classList.add('tooltip-marker');
      g.appendChild(marker);
    });
    
    interactionLayer.addEventListener('mouseleave', () => {
      setTooltip({ ...tooltip, visible: false });
      const existingMarker = g.querySelector('.tooltip-marker');
      if (existingMarker) {
        g.removeChild(existingMarker);
      }
    });
    
    g.appendChild(interactionLayer);
  };

  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="relative w-full h-full" role="figure" aria-label="Stock price chart">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400">
          No data available
        </div>
      ) : (
        <>
          <svg 
            ref={svgRef}
            width={width}
            height={height}
            className="w-full h-full"
            aria-hidden="true"
          />
          {/* Accessible table for screen readers */}
          <table className="sr-only">
            <caption>Stock price historical data</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Price</th>
              </tr>
            </thead>
            <tbody>
              {data.map((point, i) => (
                <tr key={i}>
                  <td>{point.date}</td>
                  <td>{formatCurrency(point.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Tooltip */}
          {tooltip.visible && (
            <div 
              className="absolute pointer-events-none px-3 py-2 rounded shadow-lg"
              style={{
                left: `${tooltip.x}px`,
                top: `${tooltip.y - 40}px`,
                backgroundColor: colorScheme.tooltip.background,
                color: colorScheme.tooltip.text,
                border: `1px solid ${colorScheme.tooltip.border}`
              }}
            >
              <div className="font-medium">{formatCurrency(tooltip.value)}</div>
              <div className="text-xs opacity-80">{tooltip.date}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}; 