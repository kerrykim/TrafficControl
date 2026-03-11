---
name: trafficcontrol-architecture
description: TrafficControl 프로젝트 전체 구조 파악 시 사용. Use when working with project structure, file organization, or understanding how components interact.
---

# TrafficControl 아키텍처

## 프로젝트 개요

인천국제공항 고속도로 교통 통제 데이터 검색 앱
- **Vanilla HTML/CSS/JavaScript** (프레임워크 없음, 빌드 툴 없음)
- **데이터 소스**: Google Sheets CSV (실시간 fetch)
- **한국어 UI** 전용

## 파일 구조 및 역할

```
TrafficControl/
├── index.html          # 메인 UI (검색 폼, 결과 테이블)
├── script.js           # 핵심 로직
│   ├── DOM 초기화 및 이벤트 바인딩
│   ├── handleSearch()      - 날짜/이름 검색
│   ├── handleShowByDate()  - 날짜별 전체 조회
│   ├── filterData()        - 클라이언트 사이드 필터링
│   ├── displayResults()    - 결과 테이블 렌더링
│   └── 인쇄 기능 (A4 가로)
├── data.js             # Google Sheets 연동
│   ├── loadDataFromGoogleSheets() - CSV fetch
│   ├── parseCSV()             - CSV 파싱
│   └── constructionData[]     - 전역 데이터 배열
├── styles.css          # 스타일
│   ├── CSS Custom Properties (색상, 간격)
│   ├── 반응형 레이아웃 (CSS Grid/Flexbox)
│   └── 인쇄용 스타일 (@media print)
└── attached_assets/    # 첨부 파일
```

## 데이터 흐름

```
Google Sheets → CSV export URL
    ↓ fetch()
data.js::parseCSV()
    ↓
constructionData[] (전역 배열)
    ↓ filterData()
검색 결과 → displayResults() → DOM 테이블
```

## 외부 의존성

- **Font Awesome 6.0.0** (CDN) - 아이콘
- **Google Sheets CSV** - 데이터 소스 (CORS 허용 필요)

## 주요 제약

- 백엔드 없음 - 모든 처리는 브라우저에서
- 빌드 프로세스 없음 - 파일 직접 수정
- 데이터는 Google Sheets가 단일 소스
