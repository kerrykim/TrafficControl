// DOM Elements
const searchDateInput = document.getElementById('searchDate');
const searchEmployeeInput = document.getElementById('searchEmployee');
const searchBtn = document.getElementById('searchBtn');
const showDateBtn = document.getElementById('showDateBtn');
const refreshBtn = document.getElementById('refreshBtn');
const clearBtn = document.getElementById('clearBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultsHeader = document.getElementById('resultsHeader');
const resultsCount = document.getElementById('resultsCount');
const noResults = document.getElementById('noResults');
const resultsTable = document.getElementById('resultsTable');
const tableBody = document.getElementById('tableBody');

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    setupEventListeners();
    setDefaultDate();
    
    // Load initial data from Google Sheets
    try {
        await loadDataFromGoogleSheets();
        console.log('Initial data loaded successfully');
    } catch (error) {
        console.error('Failed to load initial data:', error);
    }
});

// Setup event listeners
function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    showDateBtn.addEventListener('click', handleShowByDate);
    refreshBtn.addEventListener('click', handleRefresh);
    clearBtn.addEventListener('click', handleClear);
    searchDateInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    searchEmployeeInput.addEventListener('keypress', function(e) {
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
async function handleSearch() {
    const selectedDate = searchDateInput.value;
    const selectedEmployee = searchEmployeeInput.value.trim();
    
    if (!selectedDate && !selectedEmployee) {
        alert('차단일자 또는 작성자를 입력해주세요.');
        return;
    }

    showLoading();
    
    try {
        // Always refresh data from Google Sheets before searching
        await refreshData();
        
        const results = filterData(selectedDate, selectedEmployee);
        displayResults(results, selectedDate, selectedEmployee);
    } catch (error) {
        console.error('Error during search:', error);
        hideLoading();
        alert('데이터를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// Handle refresh functionality
async function handleRefresh() {
    const refreshIcon = refreshBtn.querySelector('i');
    refreshIcon.classList.add('fa-spin');
    refreshBtn.disabled = true;
    
    try {
        await refreshData();
        
        // Show success feedback
        refreshBtn.innerHTML = '<i class="fas fa-check"></i> 완료';
        setTimeout(() => {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 새로고침';
            refreshBtn.disabled = false;
        }, 1500);
        
        console.log('Data refreshed successfully');
    } catch (error) {
        console.error('Error refreshing data:', error);
        
        // Show error feedback
        refreshBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 오류';
        setTimeout(() => {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 새로고침';
            refreshBtn.disabled = false;
        }, 2000);
        
        alert('데이터 새로고침 중 오류가 발생했습니다.');
    }
}

// Handle show by date functionality
async function handleShowByDate() {
    const selectedDate = searchDateInput.value;
    
    if (!selectedDate) {
        alert('차단일자를 선택해주세요.');
        return;
    }
    
    showLoading();
    
    try {
        // Refresh data from Google Sheets before showing data
        await refreshData();
        
        // Filter data by selected date
        const results = filterData(selectedDate, '');
        
        if (results.length === 0) {
            hideLoading();
            showNoResults();
            return;
        }
        
        // Display filtered data
        hideLoading();
        showResults(results, selectedDate, '');
        
        // Update results header
        resultsCount.textContent = `${formatDate(selectedDate)} 날짜의 ${results.length}개 교통차단정보`;
        
    } catch (error) {
        console.error('Error showing date data:', error);
        hideLoading();
        alert('데이터를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// Handle clear functionality
function handleClear() {
    searchDateInput.value = '';
    searchEmployeeInput.value = '';
    hideAllSections();
}

// Filter data by input date and/or employee
function filterData(searchDate, searchEmployee) {
    return constructionData.filter(item => {
        let dateMatch = true;
        let employeeMatch = true;
        
        if (searchDate) {
            dateMatch = item.blockdate === searchDate;
        }
        
        if (searchEmployee) {
            employeeMatch = item.employee && item.employee.toLowerCase().includes(searchEmployee.toLowerCase());
        }
        
        return dateMatch && employeeMatch;
    });
}

// Display search results
function displayResults(results, searchDate, searchEmployee) {
    hideLoading();
    
    if (results.length === 0) {
        showNoResults();
        return;
    }
    
    showResults(results, searchDate, searchEmployee);
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
function showResults(results, searchDate, searchEmployee) {
    hideAllSections();
    
    // Update results header with search criteria
    resultsHeader.classList.remove('hidden');
    let searchInfo = '';
    if (searchDate && searchEmployee) {
        searchInfo = ` (차단일자: ${formatDate(searchDate)}, 작성자: ${searchEmployee})`;
    } else if (searchDate) {
        searchInfo = ` (차단일자: ${formatDate(searchDate)})`;
    } else if (searchEmployee) {
        searchInfo = ` (작성자: ${searchEmployee})`;
    }
    resultsCount.textContent = `${results.length}개의 교통차단 정보${searchInfo}`;
    
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
