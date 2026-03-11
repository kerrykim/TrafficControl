// Traffic control data from Supabase
let constructionData = [];

// Function to load data from Supabase
async function loadDataFromSupabase() {
    try {
        // 1달(30일) 이전 데이터는 클라이언트 측에서 로드할 때 삭제 요청을 트리거하여 자동 제거
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        const cutoffDateStr = oneMonthAgo.toISOString().split('T')[0];
        
        // 백그라운드에서 오래된 데이터 삭제 (기다리지 않음)
        supabaseClient.from('traffic_plans')
            .delete()
            .lt('blockdate', cutoffDateStr)
            .then(({ error }) => {
                if(error) console.error("오래된 데이터 삭제 실패:", error);
            });

        // 데이터 조회 (차단일자 및 차단시간 빠른 순 정렬)
        const { data, error } = await supabaseClient
            .from('traffic_plans')
            .select('*')
            .order('blockdate', { ascending: true })
            .order('chadantime', { ascending: true });

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