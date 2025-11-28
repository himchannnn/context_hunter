// API 설정
// 실제 백엔드 URL로 변경하세요
const API_BASE_URL = 'http://localhost:8000';

export interface Question {
  id: string;
  encoded: string;
  // 정답은 클라이언트에서 보관하지 않음 (백엔드에서만 관리)
}

export interface QuestionsResponse {
  questions: Question[];
}

export interface VerifyAnswerRequest {
  questionId: string;
  userAnswer: string;
}

export interface VerifyAnswerResponse {
  isCorrect: boolean;
  feedback?: string;
  correctAnswer?: string; // 틀렸을 때만 반환
  similarity: number; // 유사도 0-100
}

export interface GuestbookEntry {
  nickname: string;
  score: number;
  maxStreak: number;
  difficulty: number;
}

export interface RankingEntry {
  nickname: string;
  score: number;
  maxStreak: number;
  timestamp: string;
}

// 문제 가져오기
export async function fetchQuestions(difficulty: number): Promise<Question[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/questions?difficulty=${difficulty}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch questions');
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Response is not JSON');
    }

    const data: QuestionsResponse = await response.json();
    return data.questions;
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
}

// 정답 확인 (LLM 사용)
export async function verifyAnswer(
  questionId: string,
  userAnswer: string
): Promise<VerifyAnswerResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionId,
        userAnswer,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify answer');
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Response is not JSON');
    }

    const data: VerifyAnswerResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error verifying answer:', error);
    throw error;
  }
}

// 방명록 저장
export async function saveGuestbook(entry: GuestbookEntry): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/guestbook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      throw new Error('Failed to save guestbook');
    }
  } catch (error) {
    console.error('Error saving guestbook:', error);
    throw error;
  }
}

// 랭킹 조회
export async function fetchRankings(difficulty: number): Promise<RankingEntry[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rankings?difficulty=${difficulty}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch rankings');
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Response is not JSON');
    }

    const data: RankingEntry[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return [];
  }
}

