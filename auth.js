// 공용 인증 모듈
// Supabase Auth 기반 로그인 상태 관리

// 현재 로그인한 사용자 반환 (비로그인 시 null)
async function getCurrentUser() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session ? session.user : null;
}

// 로그인 상태 확인 - 미인증 시 login.html로 이동
async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

// 로그아웃 - 세션 종료 후 login.html로 이동
async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
}