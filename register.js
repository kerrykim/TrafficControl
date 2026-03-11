document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    
    // 기본 날짜를 다음 영업일로 설정 (대한민국 기준, 주말 및 공휴일 제외)
    const dateInput = document.getElementById('blockdate');
    if (dateInput) {
        const now = new Date();
        
        // 오늘 이전 날짜 선택 불가능하게 만들기 (min 속성 설정)
        const tzOffsetToday = now.getTimezoneOffset() * 60000;
        const todayStr = new Date(now.getTime() - tzOffsetToday).toISOString().split('T')[0];
        dateInput.setAttribute('min', todayStr);
        
        let nextDate = new Date(now);
        
        // 알려진 대한민국 공휴일 (예: 2026년 기준)
        // 필요시 매년 업데이트하거나 공공데이터 API를 연동하여 사용할 수 있습니다.
        const krHolidays = [
            "2026-01-01", // 신정
            "2026-02-16", "2026-02-17", "2026-02-18", // 설날 연휴
            "2026-03-01", "2026-03-02", // 삼일절 및 대체공휴일
            "2026-05-05", // 어린이날
            "2026-05-24", "2026-05-25", // 부처님오신날 및 대체공휴일
            "2026-06-06", // 현충일
            "2026-08-15", // 광복절
            "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-28", // 추석 연휴 및 대체공휴일
            "2026-10-03", // 개천절
            "2026-10-09", // 한글날
            "2026-12-25"  // 기독탄신일(성탄절)
        ];
        
        // 내일부터 검사 시작
        nextDate.setDate(nextDate.getDate() + 1);
        
        while (true) {
            const dayOfWeek = nextDate.getDay(); // 0: 일요일, 6: 토요일
            
            // 현지 타임존 오프셋을 반영하여 YYYY-MM-DD 포맷 가져오기
            const tzOffset = nextDate.getTimezoneOffset() * 60000;
            const dateStr = new Date(nextDate.getTime() - tzOffset).toISOString().split('T')[0];
            
            // 주말이거나 지정된 공휴일 목록에 포함되어 있다면
            if (dayOfWeek === 0 || dayOfWeek === 6 || krHolidays.includes(dateStr)) {
                // 하루를 더하고 다시 검사
                nextDate.setDate(nextDate.getDate() + 1);
            } else {
                // 평일이면서 공휴일이 아니면 (영업일이면) 종료
                dateInput.value = dateStr;
                break;
            }
        }
    }

    // 시간 선택 드롭다운 30분 단위 초기화
    const timeStart = document.getElementById('chadan_start');
    const timeEnd = document.getElementById('chadan_end');
    if (timeStart && timeEnd) {
        let optionsHtml = '<option value="">시간 선택</option>';
        for (let i = 0; i < 24; i++) {
            const hour = i.toString().padStart(2, '0');
            optionsHtml += `<option value="${hour}:00">${hour}:00</option>`;
            optionsHtml += `<option value="${hour}:30">${hour}:30</option>`;
        }
        timeStart.innerHTML = optionsHtml;
        timeEnd.innerHTML = optionsHtml;
    }

    // 전화번호 자동 포맷팅 (010-1234-5678 형식)
    const phoneInputs = ['employeephone', 'smcellphone'];
    phoneInputs.forEach(id => {
        const input = document.getElementById(id);
        if(input) {
            input.addEventListener('input', function(e) {
                // 숫자만 남김 (최대 11자리로 제한)
                let val = e.target.value.replace(/\D/g, '').substring(0, 11);
                
                // 길이에 따라 하이픈 추가 (3자리-4자리-4자리 고정)
                let formattedValue = '';
                if (val.length < 4) {
                    formattedValue = val;
                } else if (val.length < 8) {
                    formattedValue = val.substr(0, 3) + '-' + val.substr(3);
                } else {
                    formattedValue = val.substr(0, 3) + '-' + val.substr(3, 4) + '-' + val.substr(7, 4);
                }
                
                e.target.value = formattedValue;
            });
        }
    });

    // 폼 제출 이벤트
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // 기본 폼 제출 동작(새로고침) 방지
        
        const formData = new FormData(registerForm);
        const data = Object.fromEntries(formData.entries());

        // 0. 필수 입력값 검증 (모든 항목 필수)
        const validationRules = [
            { field: 'blockdate', name: '차단일자' },
            { field: 'const_name', name: '공사명' },
            { field: 'direction', name: '방향' },
            { field: 'ieejung', name: '위치' },
            { field: 'chadan_start', name: '차단 시작 시간' },
            { field: 'chadan_end', name: '차단 종료 시간' },
            { field: 'chadan', name: '차단구간' },
            { field: 'workers', name: '작업자 수' },
            { field: 'signcar', name: '신호차 댓수' },
            { field: 'workcar', name: '작업차 댓수' },
            { field: 'contractee', name: '계약업체' },
            { field: 'employee', name: '담당자' },
            { field: 'employeephone', name: '담당자 연락처' },
            { field: 'sitemanager', name: '현장관리자' },
            { field: 'smcellphone', name: '관리자 연락처' }
        ];

        for (const rule of validationRules) {
            if (!data[rule.field] || String(data[rule.field]).trim() === '') {
                alert(`${rule.name}이(가) 입력 되지 않았습니다.`);
                
                // 해당 입력 칸으로 포커스(커서) 이동하여 사용자가 바로 입력할 수 있게 도움
                const inputElement = document.getElementById(rule.field);
                if (inputElement) inputElement.focus();
                
                return; // 폼 제출 완전 중단
            }
        }

        // 전화번호 13자리 형식 (010-0000-0000) 필수 검증
        if (data.employeephone.length < 13) {
            alert('담당자 연락처를 올바른 형식(예: 010-1234-5678)으로 입력해주세요.');
            document.getElementById('employeephone').focus();
            return;
        }
        if (data.smcellphone.length < 13) {
            alert('관리자 연락처를 올바른 형식(예: 010-1234-5678)으로 입력해주세요.');
            document.getElementById('smcellphone').focus();
            return;
        }
        
        // 1. 차단시간 조합 및 임시 변수 정리
        data.chadantime = `${data.chadan_start} ~ ${data.chadan_end}`;
        delete data.chadan_start;
        delete data.chadan_end;

        // 2. 숫자 필드 변환
        data.workers = parseInt(data.workers) || 0;
        data.signcar = parseInt(data.signcar) || 0;
        data.workcar = parseInt(data.workcar) || 0;
        
        console.log('제출된 데이터:', data);
        
        // 3. 중복 데이터 체크 (동일 날짜, 동일 방향 검증)
        try {
            const { data: existingData, error: checkError } = await supabaseClient
                .from('traffic_plans')
                .select('id')
                .eq('blockdate', data.blockdate)
                .eq('direction', data.direction);
                
            if (checkError) throw checkError;
            
            if (existingData && existingData.length > 0) {
                const proceed = confirm(`해당 차단일자(${data.blockdate})에 이미 [${data.direction}] 교통차단 계획이 존재합니다.\n그래도 등록하시겠습니까?`);
                if (!proceed) {
                    return; // 등록 중단
                }
            }
        } catch (error) {
            console.error('Error checking duplicates:', error);
            // 에러가 나도 저장을 원천 차단하지 않고 진행할 수 있게 하려면 여기서 throw 대신 alert를 띄웁니다.
            alert('중복 데이터 확인 중 문제가 발생했습니다. (계속 진행됩니다)');
        }

        // 4. Supabase 데이터베이스에 데이터 저장
        try {
            const { error } = await supabaseClient
                .from('traffic_plans')
                .insert([data]);

            if (error) {
                throw error;
            }

            alert('교통차단 계획이 성공적으로 등록되었습니다.');
            window.location.href = 'index.html'; // 저장 성공 후 메인 목록 화면으로 이동
        } catch (error) {
            console.error('Error inserting data:', error);
            alert('데이터 저장 중 오류가 발생했습니다: ' + error.message);
        }
    });
});
