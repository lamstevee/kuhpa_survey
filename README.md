# 전공 진로 적합도 검사 — 강의용 데모

**랜딩(인트로) + 검사 + 검사 프로파일 결과** 만으로 구성한 독립 실행 강의용 데모입니다.
Holland RIASEC 이론 기반 강제선택형 검사와 전공 적합도 프로파일을 보여줍니다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5180 자동 오픈
```

빌드/배포:

```bash
npm run build    # dist/ 생성
npm run preview
npm run typecheck
```

## 화면 흐름

```
① 인트로 (PilotIntro)
   "전공 진로 적합도 검사" 소개 + 이름·학번·이메일 + 개인정보 동의
        ↓  검사 시작하기
② 관심계열 선택 (InterestSelect)      최대 3개
        ↓
③ 관심 전공 미리보기 (MajorPreview)   계열별 전공 목록 · 별표로 최대 5개 찜
        ↓  검사 시작하기
④ RIASEC 15문항 (RiasecQuestion)      A/B 강제선택 · 15개 비교쌍 × 1문항
        ↓
⑤ 검사 프로파일 결과 (RiasecResult)
   6차원 레이더 차트 · 유형 코드(예: CRS) · 추천 학과 TOP3 · 전공별 프로파일 비교 · PDF 저장
        ↓  보완문항 응답하기 / 지금은 건너뛰기
⑥ 보완문항 35~37문항 → 최종 결과(가치관·자기효능감 포함)
```

## 강의용으로 원본에서 바꾼 점

| 항목 | 원본 | 이 데모 |
|---|---|---|
| DB 저장 | Supabase `pilot_results` 테이블 INSERT | **`lib/supabase.ts` 스텁** — 네트워크 호출 없이 `localStorage`에만 저장 |
| 참가자 정보 | 이름·이메일·동의 **필수** | 화면은 그대로, **비워둬도 시작 가능** (`relaxValidation`) |
| 진입 화면 | `/landing` 등 라우팅 | 인트로가 곧 첫 화면 |
| RIASEC 문항 | 75문항 (15쌍 × 5문항) | **15문항 (15쌍 × 1문항)** — 강의 시간에 맞춰 축약 |
| 학과/전공 홈페이지 링크 | 외부 사이트로 이동 | **제거** — 페이지를 벗어나지 않음 |
| 대학·기관 브랜딩 | 특정 대학 로고·명칭·단과대학명 | **전부 일반명으로 치환** |
| 전공·직업 데이터 | 실제 학과 75개 · 직무 매칭 11,000줄 · 직업정보 4,700줄 | **직접 작성한 샘플로 대체** (전공 26 · 직무 34) |
| 제외 | 로그인·대시보드·관리자·SSO·롤모델·이력서·커리큘럼 | 없음 |

### 원래 동작으로 되돌리려면

- **필수 입력 검증 복원**: `src/App.tsx`의 `relaxValidation` 줄 삭제
- **문항 수 조정**: `src/data/questionPool.ts`의 `QUESTION_POOL`에 문항을 추가하면 진행률·결과 표기가 자동으로 따라갑니다
  (`totalQuestions`는 `QUESTION_POOL.length`로 계산됩니다). 단 `PilotIntro`의 "총 15문항" 문구는 수동입니다.
- **예전 공개 랜딩 사용**: `src/pages/PublicLanding.tsx`가 보관되어 있습니다.
  `App.tsx`에서 `phase` 상태를 두고 `<PublicLanding onStartTest={...} />`를 먼저 렌더링하면 됩니다.
  (원본에서는 파일럿 운영 시작과 함께 라우팅이 끊겨 사용되지 않던 화면입니다.)

## ⚠️ 데이터에 대한 고지

이 저장소의 **전공·직업·프로파일 데이터는 모두 강의 시연용으로 직접 작성한 예시**입니다.

- `src/data/majorList.ts` — 26개 샘플 전공과 RIASEC 벡터 (임의의 예시값)
- `src/data/occMatching.ts` — 34개 샘플 직무 프로파일 (임의의 예시값)
- `src/data/jobInfoMap.ts` — 임금·만족도·전망은 **가상의 수치**이며 실제 통계가 아닙니다

특정 대학의 실제 학과 구성이나 검증된 진단 도구가 아닙니다.
**진로 상담이나 실제 진단 목적으로 사용하지 마세요.** 화면 흐름과 계산 로직을 보여주기 위한 데모입니다.

RIASEC 문항(`src/data/questionPool.ts`)은 화면 시연에 필요해 남겨 두었습니다.

## 데모 데이터 확인

브라우저 콘솔에서:

```js
JSON.parse(localStorage.getItem('demo_pilot_results'))   // 지금까지 응답 전체
localStorage.removeItem('demo_pilot_results')            // 초기화
localStorage.removeItem('pilot_survey_progress')         // 진행 중인 검사 초기화
```

검사 완료 시 콘솔에 `[강의용 데모] 검사 결과 저장` 그룹으로 결과 코드와 RIASEC 점수가 출력됩니다.

## 구조

```
lib/supabase.ts                  저장 스텁 (원본 시그니처 유지)
src/App.tsx                      데모 진입점
src/pages/PilotSurvey.tsx        검사 단계 오케스트레이션
src/pages/PublicLanding.tsx      예전 공개 랜딩 (미사용, 보관)
src/components/pilot/            인트로 · 문항 · 결과 컴포넌트
src/data/                        문항 풀, 전공 목록, 직업 매핑 등
src/utils/                       전공 추천 · 직무 추천 · RIASEC 계산
```

---

## 단디 — 개인정보 업무 AI 도우미 프로토타입

NAVER PRIVACY CHALLENGE 2026 제안서(송리버 팀)의 발표용 프로토타입입니다.
네이버폼에 얹힌 얇은 레이어라는 설정으로, 개인정보를 **정리 → 목적별 최소정보 공유 → 마감**
세 단계로 처리하는 흐름을 여섯 화면으로 보여줍니다.

```bash
npm run dev      # http://localhost:5180/dandi.html
```

설문 앱(`index.html`)과 별개의 진입점이라 서로 영향을 주지 않습니다.

```
dandi.html                       프로토타입 진입점 (나눔고딕 웹폰트 로드)
src/dandi/DandiApp.tsx           셸 — GNB · 스텝 네비 · 화면 전환
src/dandi/data.ts                목업 응답 143건 · 목적별 최소정보 플레이북 · 마감 체크리스트
src/dandi/ui.tsx                 네이버 스타일 프리미티브 (색·버튼·카드·칩·표)
src/dandi/Step0Intro.tsx         문제 장면 — 민지 씨 4단계 + 통계
src/dandi/Step1Setup.tsx         화면 1 · 프로젝트 설정 (제안서 14p)
src/dandi/Step2Build.tsx         화면 2 · 업무용 자료 생성 (14p)
src/dandi/Step3Share.tsx         화면 3 · 안전한 공유 (15p)
src/dandi/Step4Close.tsx         화면 4 · 프로젝트 마감 (15p)
src/dandi/Step5Done.tsx          마무리 — 기존 경로 vs 단디 비교
```

발표 시 좌측 스텝 네비로 임의의 화면에 바로 갈 수 있습니다.
데이터는 전부 목업이며 실제 개인정보는 들어 있지 않습니다.
나눔고딕은 Google Fonts에서 받아오므로 **오프라인 발표라면 폰트를 미리 캐시**하세요.
