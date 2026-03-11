# Traffic Control - Claude Code 설정

## 프로젝트 개요

인천국제공항 고속도로 교통 통제 데이터 검색 앱
- Vanilla HTML/CSS/JavaScript (프레임워크 없음)
- 데이터는 `data.js`에 정적 저장
- 한국어 UI, 클라이언트 사이드 필터링

## 파일 구조

```
TrafficControl/
├── index.html      # 메인 HTML (검색 UI)
├── script.js       # 검색 로직, DOM 조작
├── styles.css      # 스타일 (CSS Custom Properties)
├── data.js         # 교통 통제 데이터 (정적)
└── attached_assets/ # 첨부 자료
```

## 개발 규칙

- **패키지 매니저 없음** - 빌드 툴 사용 안 함
- CDN 의존성: Font Awesome 6.0.0
- 한국어 출력 필수 (날짜 형식: yyyy년 m월 d일)
- 인쇄 기능: A4 가로 형식

## 데이터 구조 (data.js)

교통 통제 레코드의 주요 필드:
- 날짜 (입력일, 차단일)
- 공사 정보 (공사명, 방향, 위치)
- 인력/장비 (작업자, 차량)
- 연락처 (담당자, 시공사, 현장 관리자)
- 작업 사양 (차선 폐쇄, 시간 제한)

## 금지 사항

- ❌ 외부 프레임워크/라이브러리 추가 (CDN 제외)
- ❌ 백엔드 서버 도입
- ❌ data.js 구조 변경 없이 새 필드 추가

## Git 운영

```bash
git add -A
git commit -m "작업 내용"
```
