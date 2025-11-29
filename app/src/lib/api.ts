import type { Question, VerifyResponse } from '../types';

const API_BASE_URL = 'http://localhost:8001/api';

// 난이도별 문제 목록 가져오기
export const fetchQuestions = async (difficulty: number): Promise<Question[]> => {
  const response = await fetch(`${API_BASE_URL}/questions?difficulty=${difficulty}`);
  if (!response.ok) throw new Error('Failed to fetch questions');
  const data = await response.json();
  return data.questions;
};

// 정답 확인 및 유사도 검사 요청
export const verifyAnswer = async (questionId: string, userAnswer: string): Promise<VerifyResponse> => {
  const response = await fetch(`${API_BASE_URL}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
