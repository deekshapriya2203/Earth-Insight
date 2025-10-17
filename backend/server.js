// server.js (Now exports a router for the analyser APIs)

require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors'); // Keep cors for individual router if needed, or remove if main app handles
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch'); // Still needed for Google Search API
const axios = require('axios'); // Still needed for web scraping
const cheerio = require('cheerio'); // Still needed for web scraping

// Create an Express Router instance
const router = express.Router();

// Middleware specific to these analyser routes (if not handled globally in index.js)

router.use(cors());
router.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const Google_Search_API_KEY = process.env.Google_Search_API_KEY;
const CUSTOM_SEARCH_ENGINE_ID = process.env.CUSTOM_SEARCH_ENGINE_ID;

// Basic check for API keys.
if (!GEMINI_API_KEY || !Google_Search_API_KEY || !CUSTOM_SEARCH_ENGINE_ID) {
    console.warn("⚠️ Warning: One or more required environment variables (GEMINI_API_KEY, Google Search_API_KEY, CUSTOM_SEARCH_ENGINE_ID) are missing. Analyser APIs may not function correctly.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- Helper Functions ---
async function scrapeProductDetails(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 15000
        });

        if (response.status !== 200) return null;

        const $ = cheerio.load(response.data);
        const title = $('h1.product-title').first().text().trim() || $('meta[property="og:title"]').attr('content')?.trim() || $('title').text().trim();
        const description = $('div.product-description').text().trim() || $('meta[name="description"]').attr('content')?.trim();
        const price = $('span.product-price').first().text().trim() || $('div.price').first().text().trim() || $('meta[property="product:price:amount"]').attr('content')?.trim();
        const brand = $('a.product-brand').first().text().trim() || $('meta[property="product:brand"]').attr('content')?.trim() || $('meta[itemprop="brand"]').attr('content')?.trim();

        let productTextForGemini = `Product Details:\n`;
        if (title) productTextForGemini += `Name: ${title}\n`;
        if (brand) productTextForGemini += `Brand: ${brand}\n`;
        if (price) productTextForGemini += `Price: ${price}\n`;
        if (description) productTextForGemini += `Description: ${description}\n`;

        return {
            title: title,
            textForGemini: productTextForGemini
        };

    } catch (error) {
        console.error(`[Scraping] Error: ${error.message}`);
        return null;
    }
}

async function getSingleProductImage(productName) {
    if (!productName || !Google_Search_API_KEY || !CUSTOM_SEARCH_ENGINE_ID) return '';

    let cleanedProductName = productName.replace(/Buy |Online|Price @ \u20B9\d+|\| Instant Delivery \| Zepto|near me|best prices|with \d+-min\* home delivery and exciting offers|Shop Water online with Zepto today!/gi, '')
                                     .replace(/ +/g, ' ')
                                     .replace(/ -$/, '')
                                     .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
                                     .trim();

    if (!cleanedProductName) return '';

    try {
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${Google_Search_API_KEY}&cx=${CUSTOM_SEARCH_ENGINE_ID}&q=${encodeURIComponent(cleanedProductName)}&searchType=image&num=1`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (searchData.items && searchData.items.length > 0) return searchData.items[0].link;
        return '';
    } catch (error) {
        console.error(`[Image Search] Error: ${error.message}`);
        return '';
    }
}

const ABSTRACT_GEMINI_PROMPT = (productText) => `Analyze the carbon footprint of the following product based on its description:\n\n${productText}\n\nProvide output in four key points, very concisely (10-15 words per point max).
1. Carbon footprint score: [e.g., 250-400 gCO2e and High, Moderate, or Low]
2. Recyclability: [e.g., Recyclable to a lower grade, Widely recyclable, Not recyclable]
3. Eco-friendly alternative: [List 2-3 relevant common, tangible examples ONLY(usually materials+product name), separated by commas for easy image search(e.g., "Steel water bottle", "Copper bottle","glass bottle" another instance "bamboo toothbrush","wooden toothbrush")].
4. Other greener options: List 1-2 specific company names or brands that produce reusable products (e.g., "Hydro Flask", "Stanley Tumbler" for a plastic bottle).
Finally, in one short sentence, state how much carbon is saved by choosing greener options.`;

const DETAILED_GEMINI_PROMPT = (productText) => `Provide a detailed analysis for the following product based on its description:\n\n${productText}\n\nFocus on these categories, providing detailed explanations (max 50-70 words per point).

1. Carbon footprint (detailed explanation of production, transport, disposal impact).
2. Product category (e.g., plastic, electronics, apparel).
3. Recyclability (detailed explanation, including limitations or benefits of the material).
4. Pollution index (how the product contributes towards pollution of the environment).
5. Eco-friendly alternatives (detailed benefits of mentioned alternatives compared to the original products).
6. Other greener options (detailed benefits of specific reusable product companies/brands).

--CARBON FOOTPRINT DATA FOR GRAPH--
Provide specific approximate value for carbon footprint data in a parseable format for visualization:
Total Carbon Footprint: **[X]** gCO2e
Lifecycle Stages: Production: **[Y]** gCO2e, Transport: **[Z]** gCO2e, Use: **[A]** gCO2e, Disposal: **[B]** gCO2e.`;

// --- API Endpoint for Abstract Analysis and Image Search ---
router.post('/analyze-abstract', async (req, res) => {
    const { productLink } = req.body;

    if (!productLink) {
        return res.status(400).json({ error: "Product link is required." });
    }
    if (!GEMINI_API_KEY || !Google_Search_API_KEY || !CUSTOM_SEARCH_ENGINE_ID) {
        return res.status(500).json({ error: "Server configuration error: Missing API keys for analysis." });
    }

    try {
        const scrapedData = await scrapeProductDetails(productLink);

        if (!scrapedData || !scrapedData.textForGemini || scrapedData.textForGemini.trim().length < 50) {
            return res.status(400).json({ error: "Could not scrape sufficient product details from the provided link. The website's structure might have changed, or it blocked scraping. Please try another link or provide more details manually." });
        }

        console.log("[Gemini] Sending abstract prompt for analysis...");
        const geminiResult = await geminiModel.generateContent(ABSTRACT_GEMINI_PROMPT(scrapedData.textForGemini));
        const geminiResponse = await geminiResult.response;
        const geminiText = geminiResponse.text();
        console.log("[Gemini] Received abstract analysis from Gemini. Content length:", geminiText.length);
        console.log("--- DEBUG: Full Abstract Analysis Text ---");
        console.log(geminiText);
        console.log("-----------------------------------------");

        // --- PART A: Get image for the primary product ---
        let productImageUrl = await getSingleProductImage(scrapedData.title);

        // --- PART B: Extract alternative product names from Gemini's text and get their images ---
        const alternativeProducts = [];
        const alternativeImageUrls = [];

        const ecoAlternativeMatch = geminiText.match(/3\.\s*\**Eco-friendly alternative:\**\s*(.+?)(?=\n\s*\d+\.|\n\s*Finally,|$)/si);

        console.log("--- DEBUG: ecoAlternativeMatch[1] ---");
        console.log(ecoAlternativeMatch ? ecoAlternativeMatch[1] : "No match for ecoAlternativeMatch");
        console.log("-------------------------------------");

        if (ecoAlternativeMatch && ecoAlternativeMatch[1]) {
            let rawAltText = ecoAlternativeMatch[1].replace(/\*\*/g, '').trim();
            rawAltText = rawAltText.replace(/^(list|here are|consider|examples include|e\.g\.|such as|try using|only):?\s*/i, '').trim();

            console.log("--- DEBUG: rawAltText after initial cleaning ---");
            console.log(rawAltText);
            console.log("---------------------------------------------");

            const individualAlternatives = rawAltText.split(/,\s*|\s+and\s+|\s+or\s+|(?<=\w)\.\s*/)
                                                     .map(item => item.trim().replace(/\.$/, ''))
                                                     .filter(item => item.length > 0 && !item.toLowerCase().includes("n/a") && !item.toLowerCase().includes("not applicable"));

            console.log("--- DEBUG: individualAlternatives after split and filter ---");
            console.log(individualAlternatives);
            console.log("-----------------------------------------------------");


            for (let i = 0; i < Math.min(individualAlternatives.length, 3); i++) {
                if (individualAlternatives[i].toLowerCase() !== 'these have significantly lower carbon footprints over their lifetime' &&
                    individualAlternatives[i].toLowerCase() !== 'for easy image search') {
                    alternativeProducts.push(individualAlternatives[i]);
                }
            }
        }

        console.log("[Image Search] Identified alternative products for image search:", alternativeProducts);

        const imagePromises = alternativeProducts.map(async (altProductName) => {
            const imageUrl = await getSingleProductImage(altProductName);
            if (imageUrl) {
                return { name: altProductName, url: imageUrl };
            }
            return null;
        });

        const resolvedImages = await Promise.all(imagePromises);
        resolvedImages.forEach(img => {
            if (img) {
                alternativeImageUrls.push(img);
            }
        });

        res.json({
            abstractAnalysis: geminiText,
            productImageUrl: productImageUrl,
            alternativeImageUrls: alternativeImageUrls,
            originalProductLink: productLink
        });

    } catch (error) {
        console.error("Error in /api/analyze-abstract endpoint (full stack trace):", error);
        let errorMessage = "An unexpected error occurred during abstract analysis.";

        if (error.message && error.message.includes("[GoogleGenerativeAI Error]")) {
            errorMessage = `Gemini API Error: ${error.message}`;
            if (error.message.includes("429 Too Many Requests")) {
                errorMessage += " - You've hit a quota limit. Please wait or enable billing.";
            } else if (error.message.includes("403 Forbidden")) {
                errorMessage += " - API key invalid or project not authorized. Please check your GEMINI_API_KEY.";
            }
        } else if (error.request) {
            errorMessage = `Network Error during abstract analysis: No response received from target site or API. ${error.message}`;
        } else {
            errorMessage = `An unexpected error occurred during abstract analysis: ${error.message}`;
        }
        res.status(500).json({ error: errorMessage });
    }
});

// --- API Endpoint for Detailed Analysis ---
router.post('/get-detailed-analysis', async (req, res) => {
    const { productLink } = req.body;

    if (!productLink) {
        return res.status(400).json({ error: "Product link is required for detailed analysis." });
    }
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: "Server configuration error: Missing GEMINI_API_KEY for detailed analysis." });
    }

    try {
        const scrapedData = await scrapeProductDetails(productLink);

        if (!scrapedData || !scrapedData.textForGemini || scrapedData.textForGemini.trim().length < 50) {
            return res.status(400).json({ error: "Could not scrape sufficient product details for detailed analysis. The website's structure might have changed, or it blocked scraping." });
        }

        // --- Fetch Abstract Analysis (for combined display) ---
        console.log("[Gemini] Sending abstract prompt for combined display...");
        const abstractGeminiResult = await geminiModel.generateContent(ABSTRACT_GEMINI_PROMPT(scrapedData.textForGemini));
        const abstractGeminiResponse = await abstractGeminiResult.response;
        const abstractAnalysisText = abstractGeminiResponse.text();
        console.log("[Gemini] Received abstract analysis for combined display.");

        // --- Fetch Detailed Analysis ---
        console.log("[Gemini] Sending detailed prompt for analysis...");
        const detailedGeminiResult = await geminiModel.generateContent(DETAILED_GEMINI_PROMPT(scrapedData.textForGemini));
        const detailedGeminiResponse = await detailedGeminiResult.response;
        const detailedAnalysisText = detailedGeminiResponse.text();
        console.log("[Gemini] Received detailed analysis from Gemini. Content length:", detailedAnalysisText.length);
        console.log("--- DEBUG: Full Detailed Analysis Text ---");
        console.log(detailedAnalysisText);
        console.log("-----------------------------------------");

        // --- Parse Carbon Footprint Data for Graph ---
        let totalCarbonFootprint = 'N/A';
        let lifecycleStages = {
            production: 'N/A',
            transport: 'N/A',
            use: 'N/A',
            disposal: 'N/A'
        };
        let carbonFootprintDataAvailable = false;

        const totalMatch = detailedAnalysisText.match(/Total Carbon Footprint:\s*\*\*([\d.]+)\*\*?\s*gCO2e/i);
        if (totalMatch && parseFloat(totalMatch[1])) {
            totalCarbonFootprint = parseFloat(totalMatch[1]);
            carbonFootprintDataAvailable = true;
        }

        const stagesRegex = /Lifecycle Stages:\s*Production:\s*\*\*([\d.]+)\*\*?\s*gCO2e,\s*Transport:\s*\*\*([\d.]+)\*\*?\s*gCO2e,\s*Use:\s*\*\*([\d.]+)\*\*?\s*gCO2e,\s*Disposal:\s*\*\*([\d.]+)\*\*?\s*gCO2e/i;
        const stagesMatch = detailedAnalysisText.match(stagesRegex);

        console.log("--- DEBUG: stagesMatch result ---");
        console.log(stagesMatch);
        console.log("---------------------------------");

        if (stagesMatch && stagesMatch.length === 5) {
            lifecycleStages.production = parseFloat(stagesMatch[1]);
            lifecycleStages.transport = parseFloat(stagesMatch[2]);
            lifecycleStages.use = parseFloat(stagesMatch[3]);
            lifecycleStages.disposal = parseFloat(stagesMatch[4]);
            carbonFootprintDataAvailable = true;
        } else if (detailedAnalysisText.includes("Carbon footprint data: Not available")) {
            carbonFootprintDataAvailable = false;
        } else if (totalCarbonFootprint === 'N/A' && Object.values(lifecycleStages).every(val => val === 'N/A')) {
            carbonFootprintDataAvailable = false;
        }

        const carbonFootprintData = carbonFootprintDataAvailable ? { total: totalCarbonFootprint, stages: lifecycleStages } : null;
        console.log("--- DEBUG: Final carbonFootprintData object ---");
        console.log(carbonFootprintData);
        console.log("---------------------------------------------");

        res.json({
            abstractAnalysis: abstractAnalysisText,
            detailedAnalysis: detailedAnalysisText,
            carbonFootprintData: carbonFootprintData
        });

    } catch (error) {
        console.error("Error in /api/get-detailed-analysis endpoint (full stack trace):", error);
        let errorMessage = "An unexpected error occurred during detailed analysis.";

        if (error.message && error.message.includes("[GoogleGenerativeAI Error]")) {
            errorMessage = `Gemini API Error: ${error.message}`;
            if (error.message.includes("429 Too Many Requests")) {
                errorMessage += " - You've hit a quota limit. Please wait or enable billing.";
            } else if (error.message.includes("403 Forbidden")) {
                errorMessage += " - API key invalid or project not authorized. Please check your GEMINI_API_KEY.";
            }
        } else if (error.request) {
            errorMessage = `Network Error during detailed analysis: No response received from target site or API. ${error.message}`;
        } else {
            errorMessage = `An unexpected error occurred during detailed analysis: ${error.message}`;
        }
        res.status(500).json({ error: errorMessage });
    }
});

module.exports = router;