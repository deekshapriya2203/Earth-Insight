import React, { useEffect, useRef } from 'react';

const CarbonFootprintChart = ({ carbonData }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!carbonData || !carbonData.stages) return;

    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.onload = () => {
      if (window.google) {
        window.google.charts.load('current', { packages: ['corechart', 'bar'] });
        window.google.charts.setOnLoadCallback(drawChart);
      }
    };
    document.body.appendChild(script);

    function drawChart() {
      const { production, transport, use, disposal } = carbonData.stages;

      const data = new window.google.visualization.DataTable();
      data.addColumn('string', 'Lifecycle Stage');
      data.addColumn('number', 'Carbon Footprint (gCO2e)');

      if (production !== 'N/A') data.addRow(['Production', production]);
      if (transport !== 'N/A') data.addRow(['Transport', transport]);
      if (use !== 'N/A') data.addRow(['Use', use]);
      if (disposal !== 'N/A') data.addRow(['Disposal', disposal]);

      const options = {
        title: 'Carbon Footprint by Lifecycle Stage',
        hAxis: {
          title: 'Carbon Footprint (gCO2e)',
          minValue: 0,
        },
        vAxis: {
          title: 'Lifecycle Stage'
        },
        legend: { position: 'none' },
        chartArea: { left: 100, top: 50, right: 20, bottom: 50, width: '85%', height: '70%' },
        backgroundColor: 'transparent',
        colors: ['#4CAF50']
      };

      const chart = new window.google.visualization.BarChart(chartRef.current);
      chart.draw(data, options);
    }
  }, [carbonData]);

  if (!carbonData || !carbonData.stages || Object.values(carbonData.stages).every(val => val === 'N/A')) {
    return <p className="text-red-500">No valid carbon footprint data to display.</p>;
  }

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
};

export default CarbonFootprintChart;
