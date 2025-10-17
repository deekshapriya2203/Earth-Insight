// frontend/src/components/CarbonFootprintAnalyzer.jsx
import React, { useState, useEffect } from 'react';
import './styles/style.css';
function CarbonFootprintAnalyzer() {
  // --- State Variables ---
  const [productLink, setProductLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [abstractAnalysis, setAbstractAnalysis] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('placeholder.png'); // Default placeholder
  const [alternativeImageUrls, setAlternativeImageUrls] = useState([]);

  const [detailedAnalysis, setDetailedAnalysis] = useState('');
  const [carbonFootprintData, setCarbonFootprintData] = useState(null);

  // --- UI Visibility States (managed by React's conditional rendering) ---
  const [showAbstractSection, setShowAbstractSection] = useState(false);
  const [showDetailedSection, setShowDetailedSection] = useState(false);
  const [showDetailedButton, setShowDetailedButton] = useState(false);
  const [showChartNoDataMessage, setShowChartNoDataMessage] = useState(false);

  // --- Helper Functions (pure functions for text formatting) ---
  const formatAbstractAnalysis = (text) => {
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedText = formattedText.replace(/\n/g, '<br>');
    return formattedText;
  };

  const formatDetailedAnalysis = (text) => {
    let formattedText = text.replace(/^(\d+\.\s.*)/gm, '<h4>$1</h4>');
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedText = formattedText.replace(/\n/g, '<br>');
    return formattedText;
  };

  // --- Event Handlers / Logic Functions ---

  const handleAnalyzeProduct = async () => {
    if (!productLink.trim()) {
      setError('Please enter a product link.');
      setLoading(false);
      setShowAbstractSection(false);
      setShowDetailedSection(false);
      setShowDetailedButton(false);
      return;
    }

    setLoading(true);
    setError(null);
    setShowAbstractSection(false);
    setShowDetailedSection(false);
    setShowDetailedButton(false);
    setShowChartNoDataMessage(false); // Reset message for new analysis

    try {
      // Changed to absolute URL
      const response = await fetch('http://localhost:5000/api/analyze-abstract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productLink }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze product.');
      }

      setAbstractAnalysis(formatAbstractAnalysis(data.abstractAnalysis));
      setProductImageUrl(data.productImageUrl || 'placeholder.png');
      setAlternativeImageUrls(data.alternativeImageUrls || []);

      setShowAbstractSection(true);
      setShowDetailedButton(true);

    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      setShowAbstractSection(false);
      setShowDetailedButton(false);
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetailedAnalysis = async () => {
    setLoading(true);
    setError(null);
    setShowDetailedSection(false); // Hide it while loading
    setShowChartNoDataMessage(false); // Reset message

    try {
      // Changed to absolute URL
      const response = await fetch('http://localhost:5000/api/get-detailed-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productLink }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch detailed analysis');
      }

      setDetailedAnalysis(formatDetailedAnalysis(data.detailedAnalysis));
      setCarbonFootprintData(data.carbonFootprintData);

      setShowAbstractSection(false); // Hide abstract
      setShowDetailedSection(true); // Show detailed

    } catch (err) {
      console.error('Error fetching detailed analysis:', err);
      setError(err.message);
      setShowDetailedSection(false); // Ensure detailed section remains hidden on error
      setShowAbstractSection(true); // Show abstract if detailed fails
    } finally {
      setLoading(false);
    }
  };

  const handleBackToAbstract = () => {
    setShowDetailedSection(false);
    setShowAbstractSection(true);
  };

  // --- Google Charts Integration with useEffect ---
  useEffect(() => {
    if (showDetailedSection && carbonFootprintData) {
      if (window.google && window.google.charts) {
        window.google.charts.load('current', { 'packages': ['corechart', 'bar'] });
        window.google.charts.setOnLoadCallback(() => {
          drawCarbonFootprintChart(carbonFootprintData);
        });
      } else {
        console.warn("Google Charts library not available. Check public/index.html script tag or internet connection.");
      }
    }
  }, [showDetailedSection, carbonFootprintData]);

  const drawCarbonFootprintChart = (carbonData) => {
    const chartContainer = document.getElementById('carbonFootprintChart');

    if (!carbonData || !carbonData.stages || Object.values(carbonData.stages).every(val => val === 'N/A') || !chartContainer) {
      console.warn("No valid carbon footprint data or chart container element found to draw chart.");
      setShowChartNoDataMessage(true);
      return;
    }

    setShowChartNoDataMessage(false);

    const data = new window.google.visualization.DataTable();
    data.addColumn('string', 'Lifecycle Stage');
    data.addColumn('number', 'Carbon Footprint (gCO2e)');

    if (carbonData.stages.production !== 'N/A') {
      data.addRow(['Production', carbonData.stages.production]);
    }
    if (carbonData.stages.transport !== 'N/A') {
      data.addRow(['Transport', carbonData.stages.transport]);
    }
    if (carbonData.stages.use !== 'N/A') {
      data.addRow(['Use', carbonData.stages.use]);
    }
    if (carbonData.stages.disposal !== 'N/A') {
      data.addRow(['Disposal', carbonData.stages.disposal]);
    }

    const options = {
      title: 'Carbon Footprint by Lifecycle Stage',
      subtitle: `Total: ${carbonData.total !== 'N/A' ? carbonData.total + ' gCO2e' : 'Not available'}`,
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
      colors: ['#4CAF50'],
      tooltip: { isHtml: true },
    };

    const chart = new window.google.visualization.BarChart(chartContainer);
    chart.draw(data, options);
  };


  // --- Component JSX (Render Method) ---
  return (
    <div className="container">
      <h1>Carbon Footprint Analyzer</h1>
      <div className="input-section">
        <input
          type="text"
          id="productLinkInput"
          placeholder="Enter product link"
          value={productLink}
          onChange={(e) => setProductLink(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAnalyzeProduct();
            }
          }}
        />
        <button id="analyzeButton" onClick={handleAnalyzeProduct}>
          Analyze Carbon Footprint
        </button>
      </div>

      {loading && (
        <div className="loading-message">
          Analyzing... Please wait. This may take a moment as we fetch data and analyze.
        </div>
      )}
      {error && <div className="error-message">{error}</div>}

      {showAbstractSection && (
        <div id="abstractAnalysisSection" className="analysis-section">
          <h2>Abstract Analysis</h2>
          <div id="abstractAnalysisContent" className="analysis-content" dangerouslySetInnerHTML={{ __html: abstractAnalysis }}></div>
          <div className="product-images">
            <div className="main-product-image">
              <h3>Original Product</h3>
              <img id="productImage" src={productImageUrl} alt="Product" />
            </div>
            <div className="alternative-images">
              <h3>Eco-Friendly Alternatives</h3>
              <div id="alternativeImagesContainer">
                {alternativeImageUrls.length > 0 ? (
                  alternativeImageUrls.map((alt, index) => (
                    <div key={index} className="alt-image-item">
                      <img src={alt.url} alt={alt.name} />
                      <p>{alt.name}</p>
                    </div>
                  ))
                ) : (
                  <p>No eco-friendly alternative images found.</p>
                )}
              </div>
            </div>
          </div>
          {showDetailedButton && (
            <button id="showDetailedAnalysisButton" onClick={handleShowDetailedAnalysis}>
              Show Detailed Analysis
            </button>
          )}
        </div>
      )}

      {showDetailedSection && (
        <div id="detailedAnalysisSection" className="analysis-section">
          <h2>Detailed Analysis</h2>
          <div id="detailedAnalysisContent" className="analysis-content" dangerouslySetInnerHTML={{ __html: detailedAnalysis }}></div>
          
          <h3>Carbon Footprint Breakdown</h3>
          <div id="carbonFootprintChart" style={{ width: '100%', height: '400px' }}></div>
          {showChartNoDataMessage && <p className="no-data-message">Graph data not available for this product.</p>}

          <button id="backToAbstractButton" onClick={handleBackToAbstract}>
            Back to Abstract Analysis
          </button>
        </div>
      )}
    </div>
  );
}

export default CarbonFootprintAnalyzer;