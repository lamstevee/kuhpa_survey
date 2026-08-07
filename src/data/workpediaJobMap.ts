// ============================================================
// 직업 상세정보 링크
// ------------------------------------------------------------
// 원본에는 직무명 → 공식 직업코드 매핑 테이블이 있었으나,
// 이 데모의 직무 데이터는 예시용 샘플이라 실제 코드와 대응하지 않습니다.
// 따라서 코드 매핑 없이 공개 직업정보 사이트의 통합검색으로 연결합니다.
// ============================================================

export interface WorkpediaJob {
  code: string;
  name: string;
}

const SEARCH_BASE =
  'https://www.wagework.go.kr/pt/a/b/retrieveUntySrch.do?pageId=PT01000000&topPageId=PT01000000&searchWord=';

/**
 * 직무명에서 검색용 핵심 키워드를 추출합니다.
 */
function extractSearchKeyword(jobName: string): string {
  const stopWords = ['및', '의', '관련', '기타', '전문', '종사자'];
  let keyword = jobName.replace(/\(.*?\)/g, '').trim();

  for (const sw of stopWords) {
    keyword = keyword.replace(new RegExp(sw + '$'), '').trim();
    keyword = keyword.replace(new RegExp('^' + sw + ' '), '').trim();
  }

  keyword = keyword.replace(/\s+/g, ' ').trim();

  if (keyword.length > 15) {
    keyword = keyword.split(' ').slice(0, 2).join(' ');
  }

  return keyword || jobName;
}

/** 데모에서는 직업코드 매핑을 사용하지 않습니다. */
export function getWorkpediaJobCode(_jobName: string): string | null {
  return null;
}

/** 직무명으로 공개 직업정보 사이트를 검색하는 URL을 만듭니다. */
export function getWorkpediaJobUrl(jobName: string): string {
  return SEARCH_BASE + encodeURIComponent(extractSearchKeyword(jobName));
}

export function getWorkpediaJobInfo(_jobName: string): WorkpediaJob | null {
  return null;
}
