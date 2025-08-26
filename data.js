// Traffic control data for Incheon International Airport Expressway from Google Sheets
// This will be populated dynamically from Google Sheets
let constructionData = [];

// Google Sheets URL for CSV export
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/10R8pLgJmujkO6yiVR59ZqOe_qyQKcRMv4fh_C47BjqM/export?format=csv&gid=0';

// Function to parse CSV data
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim()); // Add the last value
        
        if (values.length >= headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                let value = values[index] || '';
                // Clean up the value
                value = value.replace(/^["']|["']$/g, ''); // Remove quotes
                
                // Convert numeric values
                if (header === 'workers' || header === 'signcar' || header === 'workcar') {
                    value = parseInt(value) || 0;
                }
                
                row[header.trim()] = value;
            });
            data.push(row);
        }
    }
    
    return data;
}

// Function to load data from Google Sheets
async function loadDataFromGoogleSheets() {
    try {
        const response = await fetch(GOOGLE_SHEETS_CSV_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch data from Google Sheets');
        }
        
        const csvText = await response.text();
        constructionData = parseCSV(csvText);
        
        console.log('Data loaded from Google Sheets:', constructionData.length, 'records');
        return constructionData;
    } catch (error) {
        console.error('Error loading data from Google Sheets:', error);
        // Fallback to empty array if loading fails
        constructionData = [];
        return constructionData;
    }
}

// Load data when the page loads
document.addEventListener('DOMContentLoaded', function() {
    loadDataFromGoogleSheets();
});

// Function to refresh data manually
function refreshData() {
    return loadDataFromGoogleSheets();
}