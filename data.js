// Traffic control data from Supabase
let constructionData = [];

// Function to load data from Supabase
async function loadDataFromSupabase() {
    try {
        // 오래된 데이터 정리는 백엔드(Supabase 스케줄 작업)에서 처리하고,
        // 프론트는 조회만 담당한다.

        // Supabase는 한 번에 최대 1000건만 반환하므로, 보관 기간(30일) 이내 데이터만 조회한다.
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        const tzOffset = cutoff.getTimezoneOffset() * 60000;
        const cutoffStr = new Date(cutoff.getTime() - tzOffset).toISOString().split('T')[0];

        // 데이터 조회 (차단일자 및 차단시간 빠른 순 정렬, 동일 시간대는 등록 순)
        const { data, error } = await supabaseClient
            .from('traffic_plans')
            .select('*')
            .gte('blockdate', cutoffStr)
            .order('blockdate', { ascending: true })
            .order('chadantime', { ascending: true })
            .order('id', { ascending: true });

        if (error) {
            throw error;
        }

        constructionData = data || [];
        console.log('Data loaded from Supabase:', constructionData.length, 'records');
        return constructionData;
    } catch (error) {
        console.error('Error loading data from Supabase:', error);
        // Fallback to empty array if loading fails
        constructionData = [];
        return constructionData;
    }
}

// Load data when the page loads
document.addEventListener('DOMContentLoaded', function() {
    loadDataFromSupabase();
});

// Function to refresh data manually (called by script.js)
function refreshData() {
    return loadDataFromSupabase();
}