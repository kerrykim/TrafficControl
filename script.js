// DOM Elements
const searchDateInput = document.getElementById('searchDate');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultsHeader = document.getElementById('resultsHeader');
const resultsCount = document.getElementById('resultsCount');
const noResults = document.getElementById('noResults');
const resultsTable = document.getElementById('resultsTable');
const tableBody = document.getElementById('tableBody');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setDefaultDate();
});

// Setup event listeners
function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    clearBtn.addEventListener('click', handleClear);
    searchDateInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Auto-search when date changes
    searchDateInput.addEventListener('change', handleSearch);
}

// Set default date to today
function setDefaultDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    searchDateInput.value = formattedDate;
}

// Handle search functionality
function handleSearch() {
    const selectedDate = searchDateInput.value;
    
    if (!selectedDate) {
        alert('검색할 날짜를 선택해주세요.');
        return;
    }

    showLoading();
    
    // Simulate loading delay for better UX
    setTimeout(() => {
        const results = filterDataByDate(selectedDate);
        displayResults(results, selectedDate);
    }, 500);
}

// Handle clear functionality
function handleClear() {
    searchDateInput.value = '';
    hideAllSections();
}

// Filter data by input date
function filterDataByDate(searchDate) {
    return constructionData.filter(item => {
        return item.inputdate === searchDate;
    });
}

// Display search results
function displayResults(results, searchDate) {
    hideLoading();
    
    if (results.length === 0) {
        showNoResults();
        return;
    }
    
    showResults(results, searchDate);
}

// Show loading state
function showLoading() {
    hideAllSections();
    loadingIndicator.classList.remove('hidden');
}

// Hide loading state
function hideLoading() {
    loadingIndicator.classList.add('hidden');
}

// Show no results state
function showNoResults() {
    hideAllSections();
    noResults.classList.remove('hidden');
}

// Show results
function showResults(results, searchDate) {
    hideAllSections();
    
    // Update results header
    resultsHeader.classList.remove('hidden');
    resultsCount.textContent = `${results.length}개의 공사 정보`;
    
    // Generate table rows
    generateTableRows(results);
    
    // Show results table
    resultsTable.classList.remove('hidden');
}

// Generate table rows
function generateTableRows(results) {
    tableBody.innerHTML = '';
    
    results.forEach(item => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${formatDate(item.inputdate)}</td>
            <td>${formatDate(item.blockdate)}</td>
            <td class="construction-name">${escapeHtml(item.const_name)}</td>
            <td>${escapeHtml(item.direction)}</td>
            <td>${escapeHtml(item.ieejung)}</td>
            <td>${escapeHtml(item.chadantime)}</td>
            <td>${formatChadan(item.chadan)}</td>
            <td class="workers-count">${item.workers}</td>
            <td class="vehicle-count">${item.signcar}</td>
            <td class="vehicle-count">${item.workcar}</td>
            <td>${escapeHtml(item.employee)}</td>
            <td class="phone">${formatPhone(item.employeephone)}</td>
            <td>${escapeHtml(item.contractee)}</td>
            <td>${escapeHtml(item.sitemanager)}</td>
            <td class="phone">${formatPhone(item.smcellphone)}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Hide all sections
function hideAllSections() {
    loadingIndicator.classList.add('hidden');
    resultsHeader.classList.add('hidden');
    noResults.classList.add('hidden');
    resultsTable.classList.add('hidden');
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

// Format phone number
function formatPhone(phone) {
    if (!phone) return '-';
    
    // Remove any existing formatting
    const cleaned = phone.replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    } else if (cleaned.length === 10) {
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    
    return phone;
}

// Format chadan (blocking areas)
function formatChadan(chadan) {
    if (!chadan) return '-';
    
    // Handle JSON array format
    if (chadan.startsWith('[') && chadan.endsWith(']')) {
        try {
            const parsed = JSON.parse(chadan);
            return parsed.join(', ');
        } catch (e) {
            return chadan;
        }
    }
    
    return chadan;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '-';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        filterDataByDate,
        formatDate,
        formatPhone,
        formatChadan,
        escapeHtml
    };
}
