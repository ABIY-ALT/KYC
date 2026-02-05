
"use client"

import React, { useEffect, useState, useRef } from 'react';
import './performance-chart.css';

const PerformanceChart = () => {
  const [activeTimeframe, setActiveTimeframe] = useState('Today');
  const containerRef = useRef<HTMLDivElement>(null);

  const animateCharts = () => {
    // Animate bars
    const bars = containerRef.current?.querySelectorAll('.bar');
    bars?.forEach(bar => {
      const value = (bar as HTMLElement).dataset.value;
      if (value) {
        (bar as HTMLElement).style.height = `${value}%`;
      }
    });

    // Animate doughnut segments
    const approved = containerRef.current?.querySelector('.doughnut-segment.approved') as HTMLElement;
    const pending = containerRef.current?.querySelector('.doughnut-segment.pending') as HTMLElement;
    const amendment = containerRef.current?.querySelector('.doughnut-segment.amendment') as HTMLElement;
    
    if (approved) {
        approved.style.clipPath = 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%, 50% 50%)';
    }
    if (pending) {
        pending.style.clipPath = 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%, 50% 50%)';
        pending.style.transform = 'rotate(270deg)'; // 75% of 360 = 270
    }
    if (amendment) {
        amendment.style.clipPath = 'polygon(50% 50%, 50% 100%, 0% 100%, 0% 50%, 50% 50%)';
        amendment.style.transform = 'rotate(324deg)'; // 90% of 360 = 324
    }

    // Animate stats
    animateCount('avgProcessingTime', 24, 2000);
    animateCount('completionRate', 92, 2000, true);
    animateCount('escalationRate', 8, 2000, true);
  };
  
  const animateCount = (elementId: string, finalValue: number, duration = 2000, isPercent = false) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    let start = 0;
    const increment = finalValue / (duration / 16);
    const suffix = isPercent ? '%' : '';
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= finalValue) {
        element.textContent = finalValue + suffix;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(start) + suffix;
      }
    }, 16);
  };

  useEffect(() => {
    const timeout = setTimeout(animateCharts, 500);
    return () => clearTimeout(timeout);
  }, [activeTimeframe]);

  const handleTimeframeClick = (timeframe: string) => {
    setActiveTimeframe(timeframe);
    // In a real app, you would fetch new data here
  };

  return (
    <div className="performance-chart-container" ref={containerRef}>
      <div className="chart-header">
        <h3>KYC Processing Performance</h3>
        <div className="chart-timeframe">
          <button 
            className={`timeframe-btn ${activeTimeframe === 'Today' ? 'active' : ''}`}
            onClick={() => handleTimeframeClick('Today')}
          >
            Today
          </button>
          <button 
            className={`timeframe-btn ${activeTimeframe === 'This Week' ? 'active' : ''}`}
            onClick={() => handleTimeframeClick('This Week')}
          >
            This Week
          </button>
          <button 
            className={`timeframe-btn ${activeTimeframe === 'This Month' ? 'active' : ''}`}
            onClick={() => handleTimeframeClick('This Month')}
          >
            This Month
          </button>
        </div>
      </div>
      
      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-title">Submission Volume</div>
          <div className="chart-visual">
            <div className="bar-chart">
              <div className="bar" data-value="85"></div>
              <div className="bar" data-value="92"></div>
              <div className="bar" data-value="78"></div>
              <div className="bar" data-value="95"></div>
              <div className="bar" data-value="88"></div>
              <div className="bar" data-value="100"></div>
              <div className="bar" data-value="82"></div>
            </div>
          </div>
          <div className="chart-labels">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
        
        <div className="chart-card">
          <div className="chart-title">Approval Rate</div>
          <div className="chart-visual">
            <div className="doughnut-chart">
              <div className="doughnut-segment approved" data-value="75"></div>
              <div className="doughnut-segment pending" data-value="15"></div>
              <div className="doughnut-segment amendment" data-value="10"></div>
              <div className="doughnut-center">
                <div className="doughnut-value">75%</div>
                <div className="doughnut-label">Approved</div>
              </div>
            </div>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color approved"></span>
              <span>Approved (75%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color pending"></span>
              <span>Pending (15%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color amendment"></span>
              <span>Amendment (10%)</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="chart-footer">
        <div className="chart-stat">
          <div className="stat-value" id="avgProcessingTime">0</div>
          <div className="stat-label">Avg. Processing Time</div>
        </div>
        <div className="chart-stat">
          <div className="stat-value" id="completionRate">0%</div>
          <div className="stat-label">Today's Completion Rate</div>
        </div>
        <div className="chart-stat">
          <div className="stat-value" id="escalationRate">0%</div>
          <div className="stat-label">Escalation Rate</div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;
