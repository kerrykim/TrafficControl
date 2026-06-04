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
    setupModalTimeOptions();
    setupEditForm();
    
    // Load initial data
    try {
        await refreshData();
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
            alert('선택한 날짜에 교통차단 정보가 없습니다.');
            return;
        }
        
        // Display filtered data
        hideLoading();
        showResults(results, selectedDate, '');
        
        // Update results header
        resultsCount.textContent = formatDateKorean(selectedDate);
        
        // Print the results
        setTimeout(() => {
            printResults(selectedDate, results);
        }, 500); // 데이터 표시 후 잠시 기다린 다음 프린트
        
    } catch (error) {
        console.error('Error showing date data:', error);
        hideLoading();
        alert('데이터를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// Print results function
function printResults(selectedDate, results) {
    // 프린트용 페이지 제목 설정
    const originalTitle = document.title;
    document.title = `${formatDateKorean(selectedDate)}의 인천국제공항고속도로 교통차단계획`;
    
    // 프린트용 클래스 추가
    document.body.classList.add('print-mode');
    
    // 프린트 실행
    window.print();
    
    // 프린트 후 원래 상태로 복원
    document.title = originalTitle;
    document.body.classList.remove('print-mode');
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
    
    // 날짜만 검색된 경우 특별한 형식으로 표시
    if (searchDate && !searchEmployee) {
        resultsCount.textContent = formatDateKorean(searchDate);
    } else {
        // 다른 검색 조건들
        let searchInfo = '';
        if (searchDate && searchEmployee) {
            searchInfo = ` (차단일자: ${formatDate(searchDate)}, 작성자: ${searchEmployee})`;
        } else if (searchEmployee) {
            searchInfo = ` (작성자: ${searchEmployee})`;
        }
        resultsCount.textContent = `교통차단 ${results.length}건${searchInfo}`;
    }
    
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
            <td class="action-buttons">
                <button class="edit-btn" onclick="editPlan(${item.id})"><i class="fas fa-edit"></i> 수정</button>
                <button class="delete-btn" onclick="deletePlan(${item.id})"><i class="fas fa-trash"></i> 삭제</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function setupModalTimeOptions() {
    const timeStart = document.getElementById('edit_chadan_start');
    const timeEnd = document.getElementById('edit_chadan_end');
    if (!timeStart || !timeEnd) return;
    let opts = '<option value="">시간 선택</option>';
    for (let i = 0; i < 24; i++) {
        const h = i.toString().padStart(2, '0');
        opts += `<option value="${h}:00">${h}:00</option>`;
        opts += `<option value="${h}:30">${h}:30</option>`;
    }
    timeStart.innerHTML = opts;
    timeEnd.innerHTML = opts;
}

function setupEditForm() {
    const form = document.getElementById('editForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit_id').value;
        const pin = sessionStorage.getItem('tc_pin');
        if (!pin) { alert('비밀번호 인증이 필요합니다.'); return; }

        const formData = {
            p_id: parseInt(id), p_pin: pin,
            p_blockdate: document.getElementById('edit_blockdate').value,
            p_const_name: document.getElementById('edit_const_name').value,
            p_direction: document.getElementById('edit_direction').value,
            p_ieejung: document.getElementById('edit_ieejung').value,
            p_chadantime: (document.getElementById('edit_chadan_start').value || '00:00') + ' ~ ' + (document.getElementById('edit_chadan_end').value || '00:00'),
            p_chadan: document.getElementById('edit_chadan').value,
            p_workers: parseInt(document.getElementById('edit_workers').value) || 0,
            p_signcar: parseInt(document.getElementById('edit_signcar').value) || 0,
            p_workcar: parseInt(document.getElementById('edit_workcar').value) || 0,
            p_contractee: document.getElementById('edit_contractee').value,
            p_employee: document.getElementById('edit_employee').value,
            p_employeephone: document.getElementById('edit_employeephone').value,
            p_sitemanager: document.getElementById('edit_sitemanager').value,
            p_smcellphone: document.getElementById('edit_smcellphone').value,
            p_reason: document.getElementById('edit_reason').value,
            p_new_pin: document.getElementById('edit_new_pin').value
        };

        try {
            const { data, error } = await supabaseClient.rpc('update_plan_full_with_pin', formData);
            if (error) throw error;
            alert('수정이 완료되었습니다.');
            closeEditModal();
            await refreshData();
            const d = searchDateInput.value, e = searchEmployeeInput.value.trim();
            displayResults(filterData(d, e), d, e);
        } catch (err) {
            if (err.message && err.message.includes('비밀번호가 일치하지')) {
                alert('비밀번호가 일치하지 않습니다.');
                sessionStorage.removeItem('tc_pin');
            } else {
                alert('수정 중 오류: ' + err.message);
            }
        }
    });
}

function openEditModal(plan) {
    document.getElementById('edit_id').value = plan.id;
    document.getElementById('edit_blockdate').value = plan.blockdate || '';
    document.getElementById('edit_const_name').value = plan.const_name || '';
    document.getElementById('edit_direction').value = plan.direction || '';
    document.getElementById('edit_ieejung').value = plan.ieejung || '';
    document.getElementById('edit_chadan_start').value = plan.chadan_start || '';
    document.getElementById('edit_chadan_end').value = plan.chadan_end || '';
    document.getElementById('edit_chadan').value = plan.chadan || '';
    document.getElementById('edit_workers').value = plan.workers || 0;
    document.getElementById('edit_signcar').value = plan.signcar || 0;
    document.getElementById('edit_workcar').value = plan.workcar || 0;
    document.getElementById('edit_contractee').value = plan.contractee || '';
    document.getElementById('edit_employee').value = plan.employee || '';
    document.getElementById('edit_employeephone').value = plan.employeephone || '';
    document.getElementById('edit_sitemanager').value = plan.sitemanager || '';
    document.getElementById('edit_smcellphone').value = plan.smcellphone || '';
    document.getElementById('edit_reason').value = plan.reason || '';
    document.getElementById('edit_new_pin').value = '';
    document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

async function editPlan(id) {
    const pin = prompt('수정 비밀번호 (4자리 숫자)를 입력하세요.');
    if (!pin || !/^\d{4}$/.test(pin)) {
        if (pin !== null) alert('비밀번호는 4자리 숫자여야 합니다.');
        return;
    }

    const plan = constructionData.find(p => p.id === id);
    if (!plan) { alert('해당 계획을 찾을 수 없습니다.'); return; }

    try {
        const { data, error } = await supabaseClient.rpc('verify_pin', { p_id: id, p_pin: pin });
        if (error) throw error;
        openEditModal(plan);
    } catch (err) {
        if (err.message && err.message.includes('비밀번호가 일치하지')) {
            alert('비밀번호가 일치하지 않습니다.');
        } else {
            alert('인증 중 오류: ' + err.message);
        }
    }
}

async function deletePlan(id) {
    const pin = prompt('삭제 비밀번호 (4자리 숫자)를 입력하세요.');
    if (!pin || !/^\d{4}$/.test(pin)) {
        if (pin !== null) alert('비밀번호는 4자리 숫자여야 합니다.');
        return;
    }

    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
        const { data, error } = await supabaseClient.rpc('delete_plan_with_pin', { p_id: id, p_pin: pin });
        if (error) throw error;
        alert('삭제가 완료되었습니다.');
        await refreshData();
        const d = searchDateInput.value, e = searchEmployeeInput.value.trim();
        displayResults(filterData(d, e), d, e);
    } catch (err) {
        if (err.message && err.message.includes('비밀번호가 일치하지')) {
            alert('비밀번호가 일치하지 않습니다.');
        } else {
            alert('삭제 중 오류: ' + err.message);
        }
    }
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

// Format date for Korean display (YYYY년 M월 D일)
function formatDateKorean(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}년 ${month}월 ${day}일`;
    } catch (e) {
        return dateString;
    }
}

// Format date for simple display (yyyy-m-d)
function formatDateSimple(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}-${month}-${day}`;
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
