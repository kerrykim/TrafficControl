-- traffic_plans 테이블 RLS(Row Level Security) 설정
-- SELECT: 익명(모든 사용자) 허용
-- INSERT/UPDATE/DELETE: 인증된 사용자만 허용

-- RLS 활성화
ALTER TABLE traffic_plans ENABLE ROW LEVEL SECURITY;

-- SELECT 정책: 모든 사용자(익명 포함) 조회 허용
CREATE POLICY "traffic_plans_select_policy" ON traffic_plans
    FOR SELECT
    USING (true);

-- INSERT 정책: 인증된 사용자만 등록 허용
CREATE POLICY "traffic_plans_insert_policy" ON traffic_plans
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE 정책: 인증된 사용자만 수정 허용
CREATE POLICY "traffic_plans_update_policy" ON traffic_plans
    FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- DELETE 정책: 인증된 사용자만 삭제 허용
CREATE POLICY "traffic_plans_delete_policy" ON traffic_plans
    FOR DELETE
    USING (auth.uid() IS NOT NULL);