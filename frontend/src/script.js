// client/script.js

document.addEventListener('DOMContentLoaded', () => {
    const productLinkInput = document.getElementById('productLinkInput');
    //const analyzeButton = document.getElementById('analyzeButton');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');

    const abstractAnalysisSection = document.getElementById('abstractAnalysisSection');
    const abstractAnalysisContent = document.getElementById('abstractAnalysisContent');
    const productImage = document.getElementById('productImage');
    const alternativeImagesContainer = document.getElementById('alternativeImagesContainer');
    const showDetailedAnalysisButton = document.getElementById('showDetailedAnalysisButton');

    const detailedAnalysisSection = document.getElementById('detailedAnalysisSection');
    const detailedAnalysisContent = document.getElementById('detailedAnalysisContent');
    const carbonFootprintChart = document.getElementById('carbonFootprintChart');
    const chartNoDataMessage = document.getElementById('chartNoDataMessage');
    const backToAbstractButton = document.getElementById('backToAbstractButton');

    let currentProductLink = ''; // To store the link for subsequent detailed analysis request
    let currentDetailedAnalysis = ''; // To store the detailed analysis text
    let currentCarbonFootprintData = null; // To store the parsed graph data

    // --- Event Listeners ---
   document.addEventListener('DOMContentLoaded', () => {
  const analyzeButton = document.getElementById('analyzeButton');


  if (!analyzeButton) {
    console.error("Button not found!");
    return;
  }

  analyzeButton.addEventListener('click', handleAnalyzeProduct);

  // ... rest of your logic
});

    showDetailedAnalysisButton.addEventListener('click', async () => {
        // Show loading message for detailed analysis
        loadingMessage.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        detailedAnalysisSection.classList.add('hidden'); // Hide it again while loading

        try {
            const response = await fetch('/api/get-detailed-analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productLink: currentProductLink })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch detailed analysis');
            }

            // Store detailed analysis and graph data
            currentDetailedAnalysis = data.detailedAnalysis;
            currentCarbonFootprintData = data.carbonFootprintData;

            // Hide abstract, show detailed
            abstractAnalysisSection.classList.add('hidden');
            detailedAnalysisSection.classList.remove('hidden');

            // Display detailed analysis text
            detailedAnalysisContent.innerHTML = formatDetailedAnalysis(currentDetailedAnalysis);

            // Draw the graph
            if (currentCarbonFootprintData) {
                drawCarbonFootprintChart(currentCarbonFootprintData);
                carbonFootprintChart.classList.remove('hidden');
                chartNoDataMessage.classList.add('hidden');
            } else {
                carbonFootprintChart.classList.add('hidden');
                chartNoDataMessage.classList.remove('hidden');
            }

        } catch (error) {
            console.error('Error fetching detailed analysis:', error);
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
            detailedAnalysisSection.classList.add('hidden'); // Ensure detailed section remains hidden on error
            abstractAnalysisSection.classList.remove('hidden'); // Show abstract if detailed fails
        } finally {
            loadingMessage.classList.add('hidden');
        }
    });

    backToAbstractButton.addEventListener('click', () => {
        detailedAnalysisSection.classList.add('hidden');
        abstractAnalysisSection.classList.remove('hidden');
    });

    // --- Functions ---
    async function handleAnalyzeProduct() {
        const productLink = productLinkInput.value.trim();
        if (!productLink) {
            errorMessage.textContent = 'Please enter a product link.';
            errorMessage.classList.remove('hidden');
            abstractAnalysisSection.classList.add('hidden');
            detailedAnalysisSection.classList.add('hidden');
            return;
        }

        currentProductLink = productLink; // Store the link for detailed analysis

        loadingMessage.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        abstractAnalysisSection.classList.add('hidden');
        detailedAnalysisSection.classList.add('hidden'); // Hide detailed too, just in case

        try {
            const response = await fetch('/api/analyze-abstract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productLink })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze product.');
            }

            // Display abstract analysis
            abstractAnalysisContent.innerHTML = formatAbstractAnalysis(data.abstractAnalysis);
            
            // Display main product image
            if (data.productImageUrl) {
                productImage.src = data.productImageUrl;
                productImage.alt = "Product Image";
            } else {
                productImage.src = "placeholder.png"; // Fallback image
                productImage.alt = "Image not available";
            }

            // Display alternative images
            alternativeImagesContainer.innerHTML = ''; // Clear previous images
            if (data.alternativeImageUrls && data.alternativeImageUrls.length > 0) {
                data.alternativeImageUrls.forEach(alt => {
                    const imgDiv = document.createElement('div');
                    imgDiv.classList.add('alt-image-item');

                    const img = document.createElement('img');
                    img.src = alt.url;
                    img.alt = alt.name;

                    const name = document.createElement('p');
                    name.textContent = alt.name;

                    imgDiv.appendChild(img);
                    imgDiv.appendChild(name);
                    alternativeImagesContainer.appendChild(imgDiv);
                });
            } else {
                alternativeImagesContainer.innerHTML = '<p>No eco-friendly alternative images found.</p>';
            }

            abstractAnalysisSection.classList.remove('hidden');
            showDetailedAnalysisButton.classList.remove('hidden'); // Show button to proceed

        } catch (error) {
            console.error('Error:', error);
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
            abstractAnalysisSection.classList.add('hidden'); // Hide section on error
            showDetailedAnalysisButton.classList.add('hidden'); // Hide button on error
        } finally {
            loadingMessage.classList.add('hidden');
        }
    }

    function formatAbstractAnalysis(text) {
        // Replace bold markdown with HTML <strong> tags
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Replace newlines with <br> for proper display
        formattedText = formattedText.replace(/\n/g, '<br>');
        return formattedText;
    }

    function formatDetailedAnalysis(text) {
        // Replace markdown headers with appropriate HTML tags and newlines
        let formattedText = text.replace(/^(\d+\.\s.*)/gm, '<h4>$1</h4>'); 
        formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold text
        formattedText = formattedText.replace(/\n/g, '<br>'); // Newlines
        return formattedText;
    }


    // --- Google Charts Function ---
    // Load the Visualization API and the corechart package.
    google.charts.load('current', {'packages':['corechart', 'bar']}); // 'bar' package for Material Bar Charts
    
    function drawCarbonFootprintChart(carbonData) {
        if (!carbonData || !carbonData.stages || Object.values(carbonData.stages).every(val => val === 'N/A')) {
            console.warn("No valid carbon footprint data to draw chart.");
            carbonFootprintChart.classList.add('hidden');
            chartNoDataMessage.classList.remove('hidden');
            return;
        }
        
        // Prepare data for Google Charts
        const data = new google.visualization.DataTable();
        data.addColumn('string', 'Lifecycle Stage');
        data.addColumn('number', 'Carbon Footprint (gCO2e)');

        // Add data rows for each stage
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

        // Set chart options
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
            legend: { position: 'none' }, // No legend needed for a single series bar chart
            chartArea: { left: 100, top: 50, right: 20, bottom: 50, width: '85%', height: '70%' },
            backgroundColor: 'transparent', // Make chart background transparent
            colors: ['#4CAF50'], // A nice green color for carbon footprint
            tooltip: { isHtml: true }, // For custom tooltips if needed later
            
        };

        
        const chart = new google.visualization.BarChart(document.getElementById('carbonFootprintChart'));
        chart.draw(data, options);
    }
});
