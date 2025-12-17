import type { Question, VerifyResponse } from '../types';

// In production, we use a Node.js proxy (server.js) to forward /api requests to the backend.
// This solves the CORS and Remote Access issues without Nginx.
export const API_BASE_URL = '/api';

// 난이도별/분야별 문제 목록 가져오기
export const fetchQuestions = async (difficulty: number, category?: string, limit: number = 10, allowGeneration: boolean = true): Promise<Question[]> => {
  let url = `${API_BASE_URL}/questions?difficulty=${difficulty}&limit=${limit}&allow_generation=${allowGeneration}`;
  if (category) {
    url += `&category=${encodeURIComponent(category)}`;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch questions');
  const data = await response.json();
  return data.questions;
};

export interface DailyProgress {
  id: number;
  user_id: number;
  date: string;
  cleared_domains: string;
  reward_claimed: boolean;
  credits_awarded?: number;
}

export const getDailyProgress = async (token: string | null, date: string): Promise<DailyProgress> => {
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/daily-progress?date=${date}`, { headers });
  if (!response.ok) throw new Error('Failed to fetch daily progress');
  return response.json();
};

export const updateDailyProgress = async (token: string | null, date: string, domain: string): Promise<DailyProgress> => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/daily-progress`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ date, domain }),
  });
  if (!response.ok) throw new Error('Failed to update daily progress');
  return response.json();
};

// 정답 확인 및 유사도 검사 요청
// 정답 확인 및 유사도 검사 요청
export const verifyAnswer = async (questionId: string, userAnswer: string, token: string | null = null): Promise<VerifyResponse> => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ questionId, userAnswer }),
  });
  if (!response.ok) throw new Error('Failed to verify answer');
  return response.json();
};

// 오답 노트 생성 (인증 필요)
export const createNote = async (questionId: string, userAnswer: string, token: string) => {
  const response = await fetch(`${API_BASE_URL}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ question_id: questionId, user_answer: userAnswer }),
  });
  if (!response.ok) {
    throw new Error('Failed to create note');
  }
  return response.json();
};

// 내 오답 노트 조회 (인증 필요)
export const getNotes = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/notes`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch notes');
  }
  return response.json();
};

export interface RankingEntry {
  nickname: string;
  score: number;
  max_streak: number;
  difficulty: number;
  timestamp: string;
}

// 방명록(랭킹) 저장
export const saveGuestbook = async (entry: { nickname: string; score: number; max_streak: number; difficulty: number }) => {
  const response = await fetch(`${API_BASE_URL}/guestbook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(entry),
  });
  if (!response.ok) throw new Error('Failed to save guestbook entry');
  return response.json();
};

// 랭킹 목록 조회
export const fetchRankings = async (): Promise<RankingEntry[]> => {
  const response = await fetch(`${API_BASE_URL}/rankings`);
  if (!response.ok) throw new Error('Failed to fetch rankings');
  return response.json();
};

// 일일 보상 수령
export const claimDailyReward = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/daily/claim-reward`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to claim reward');
  }
  return response.json();
};

// 테마 구매
export const buyTheme = async (token: string, themeId: string) => {
  const response = await fetch(`${API_BASE_URL}/shop/buy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ theme_id: themeId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to buy theme');
  }
  return response.json();
};

// 테마 장착
export const equipTheme = async (token: string, themeId: string) => {
  const response = await fetch(`${API_BASE_URL}/user/equip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ theme_id: themeId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to equip theme');
  }
  return response.json();
};

// 게스트 로그인
export const guestLogin = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/guest`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Guest login failed');
  return response.json();
};
