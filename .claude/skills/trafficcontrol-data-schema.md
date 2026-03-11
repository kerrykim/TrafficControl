---
name: trafficcontrol-data-schema
description: 교통 통제 데이터 구조 작업 시 사용. Use when adding/modifying data, working with data.js, Google Sheets integration, or CSV parsing.
---

# TrafficControl 데이터 스키마

## Google Sheets 연동

```javascript
// data.js
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=0';

// 페이지 로드 시 자동 실행
loadDataFromGoogleSheets() → parseCSV() → constructionData[]

// 수동 새로고침
refreshData()
```

## CSV 컬럼 구조 (Google Sheets 헤더 기준)

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `date` | string | 입력일 (YYYY-MM-DD) |
| `blockdate` | string | 차단일 (YYYY-MM-DD) |
| `construction` | string | 공사명 |
| `direction` | string | 방향 |
| `location` | string | 위치 |
| `workers` | number | 작업자 수 |
| `signcar` | number | 안전 차량 수 |
| `workcar` | number | 작업 차량 수 |
| `employee` | string | 담당자 이름 |
| `contact` | string | 담당자 연락처 |
| `contractor` | string | 시공사명 |
| `manager` | string | 현장 관리자 |
| `managercontact` | string | 현장 관리자 연락처 |
| `laneclosure` | string | 차선 폐쇄 정보 |
| `timestart` | string | 작업 시작 시간 |
| `timeend` | string | 작업 종료 시간 |

> ⚠️ 실제 필드명은 Google Sheets 1행(헤더)에서 결정됩니다.
> `parseCSV()`가 헤더를 동적으로 읽어 객체 키로 사용합니다.

## 숫자 자동 변환 필드

```javascript
// parseCSV() 내부 처리
if (header === 'workers' || header === 'signcar' || header === 'workcar') {
    value = parseInt(value) || 0;
}
```

## 검색 로직

```javascript
// script.js::filterData(date, employee)
// - date: 'blockdate' 필드와 비교
// - employee: 'employee' 필드에서 부분 일치 검색
```

## 데이터 수정 방법

직접 수정 불가 → **Google Sheets에서 수정** → 앱에서 새로고침 버튼 클릭
