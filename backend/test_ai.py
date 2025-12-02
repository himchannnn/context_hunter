import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# backend 모듈을 찾기 위해 경로 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.ai import AIClient

class TestAIIntegration(unittest.TestCase):
    def setUp(self):
        # 테스트 전 환경 변수 설정 (필요시)
        pass

    @patch('backend.ai.OpenAI')
    def test_similarity_check_mock(self, mock_openai):
        """유사도 판별 로직 테스트 (Mock)"""
        print("\n[Test] Similarity Check (Mock)...")
        
        # Mock 설정
        mock_client_instance = MagicMock()
        mock_openai.return_value = mock_client_instance
        
        mock_response = MagicMock()
        mock_response.choices[0].message.content = '{"is_correct": true, "similarity_score": 95, "feedback": "정확합니다!"}'
        mock_client_instance.chat.completions.create.return_value = mock_response

        client = AIClient()
        client.client = mock_client_instance
        
        result = client.check_similarity("Test Answer", "Correct Answer")
        print(f"Similarity Result: {result}")
        
        self.assertTrue(result['is_correct'])
        self.assertEqual(result['similarity_score'], 95)

    @patch('backend.ai.OpenAI')
    def test_question_generation_mock(self, mock_openai):
        """질문 생성 로직 테스트 (Mock)"""
        print("\n[Test] Question Generation (Mock)...")
        
        # Mock 설정
        mock_client_instance = MagicMock()
        mock_openai.return_value = mock_client_instance
        
        mock_response = MagicMock()
        mock_response.choices[0].message.content = '{"encoded_sentence": "Test Encoded", "original_meaning": "Test Meaning", "difficulty_level": 1}'
        mock_client_instance.chat.completions.create.return_value = mock_response

        client = AIClient()
        # API 키가 없으면 client가 None일 수 있음, 테스트를 위해 강제 설정
        client.client = mock_client_instance 
        
        result = client.generate_question("Test Context", "Test Style")
        print(f"Generated Question: {result}")
        
        self.assertEqual(result['encoded_sentence'], "Test Encoded")
        self.assertEqual(result['original_meaning'], "Test Meaning")

if __name__ == '__main__':
    unittest.main()
