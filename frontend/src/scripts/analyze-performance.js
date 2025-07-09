#!/usr/bin/env node

/**
 * Performance Analysis Script for PlotWeaver
 * Analyzes exported performance data and generates reports
 */

const fs = require('fs');
const path = require('path');

function analyzePerformanceData(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!Array.isArray(data) || data.length === 0) {
      console.log('No performance data found in file');
      return;
    }

    console.log('📊 Performance Analysis Report');
    console.log('==============================');
    console.log(`Data points: ${data.length}`);
    console.log(`Time range: ${new Date(data[0].timestamp).toLocaleString()} - ${new Date(data[data.length - 1].timestamp).toLocaleString()}`);
    console.log('');

    // Overall statistics
    const totalRenders = data.length;
    const slowRenders = data.filter(d => d.actualDuration > 16);
    const averageDuration = data.reduce((sum, d) => sum + d.actualDuration, 0) / data.length;
    const slowestRender = Math.max(...data.map(d => d.actualDuration));
    const fastestRender = Math.min(...data.map(d => d.actualDuration));

    console.log('🔍 Overall Statistics');
    console.log(`Total renders: ${totalRenders}`);
    console.log(`Slow renders (>16ms): ${slowRenders.length} (${((slowRenders.length / totalRenders) * 100).toFixed(1)}%)`);
    console.log(`Average duration: ${averageDuration.toFixed(2)}ms`);
    console.log(`Slowest render: ${slowestRender.toFixed(2)}ms`);
    console.log(`Fastest render: ${fastestRender.toFixed(2)}ms`);
    console.log('');

    // Component analysis
    const componentStats = {};
    data.forEach(d => {
      if (!componentStats[d.id]) {
        componentStats[d.id] = {
          renders: 0,
          slowRenders: 0,
          totalDuration: 0,
          maxDuration: 0,
          minDuration: Infinity,
          mounts: 0,
          updates: 0
        };
      }
      
      const stats = componentStats[d.id];
      stats.renders++;
      stats.totalDuration += d.actualDuration;
      stats.maxDuration = Math.max(stats.maxDuration, d.actualDuration);
      stats.minDuration = Math.min(stats.minDuration, d.actualDuration);
      
      if (d.actualDuration > 16) {
        stats.slowRenders++;
      }
      
      if (d.phase === 'mount') {
        stats.mounts++;
      } else {
        stats.updates++;
      }
    });

    console.log('🧩 Component Analysis');
    console.log('Component'.padEnd(30) + 'Renders'.padEnd(10) + 'Slow'.padEnd(8) + 'Avg (ms)'.padEnd(12) + 'Max (ms)'.padEnd(12) + 'Mounts'.padEnd(8) + 'Updates');
    console.log('-'.repeat(90));
    
    Object.entries(componentStats)
      .sort((a, b) => b[1].totalDuration - a[1].totalDuration)
      .forEach(([component, stats]) => {
        const avgDuration = (stats.totalDuration / stats.renders).toFixed(2);
        const slowPercentage = ((stats.slowRenders / stats.renders) * 100).toFixed(1);
        
        console.log(
          component.padEnd(30) +
          stats.renders.toString().padEnd(10) +
          `${stats.slowRenders} (${slowPercentage}%)`.padEnd(8) +
          avgDuration.padEnd(12) +
          stats.maxDuration.toFixed(2).padEnd(12) +
          stats.mounts.toString().padEnd(8) +
          stats.updates.toString()
        );
      });

    console.log('');

    // Performance issues
    console.log('⚠️  Performance Issues');
    const criticalComponents = Object.entries(componentStats)
      .filter(([_, stats]) => stats.slowRenders > 0)
      .sort((a, b) => b[1].slowRenders - a[1].slowRenders);

    if (criticalComponents.length > 0) {
      criticalComponents.forEach(([component, stats]) => {
        const slowPercentage = ((stats.slowRenders / stats.renders) * 100).toFixed(1);
        console.log(`- ${component}: ${stats.slowRenders} slow renders (${slowPercentage}% of total)`);
      });
    } else {
      console.log('No performance issues detected! 🎉');
    }

    console.log('');

    // Recommendations
    console.log('💡 Recommendations');
    if (slowRenders.length > totalRenders * 0.1) {
      console.log('- Consider optimizing components with high slow render rates');
      console.log('- Use React.memo() for components that re-render frequently');
      console.log('- Implement useMemo() and useCallback() for expensive computations');
    }
    
    if (averageDuration > 8) {
      console.log('- Overall render time is above optimal (8ms)');
      console.log('- Consider code splitting to reduce bundle size');
      console.log('- Review component complexity and break down large components');
    }
    
    const heavyComponents = Object.entries(componentStats)
      .filter(([_, stats]) => stats.totalDuration / stats.renders > 10)
      .sort((a, b) => (b[1].totalDuration / b[1].renders) - (a[1].totalDuration / a[1].renders));
    
    if (heavyComponents.length > 0) {
      console.log('- Heavy components detected:');
      heavyComponents.slice(0, 3).forEach(([component, stats]) => {
        console.log(`  - ${component}: ${(stats.totalDuration / stats.renders).toFixed(2)}ms average`);
      });
    }

  } catch (error) {
    console.error('Error analyzing performance data:', error.message);
  }
}

// CLI usage
if (require.main === module) {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.log('Usage: node analyze-performance.js <performance-data.json>');
    process.exit(1);
  }
  
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }
  
  analyzePerformanceData(filePath);
}

module.exports = { analyzePerformanceData };