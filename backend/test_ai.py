import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# backend 모듈을 찾기 위해 경로 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.ai import EmbeddingModel, AIClient

class TestAIIntegration(unittest.TestCase):
    def setUp(self):
        # 테스트 전 환경 변수 설정 (필요시)
        pass

    def test_embedding_model_loading(self):
        """임베딩 모델이 정상적으로 로드되는지 테스트"""
        print("\n[Test] Embedding Model Loading...")
        model = EmbeddingModel.get_instance()
        if model.model is None:
            print("Warning: Model failed to load. This might be due to missing dependencies or hardware issues.")
        else:
            print("Success: Model loaded.")
        # 모델 로드 실패는 환경에 따라 다를 수 있으므로 assert로 강제하지 않고 경고만 출력할 수도 있음
        # 하지만 여기서는 로드가 되어야 정상
        self.assertIsNotNone(model.model, "Embedding model should be loaded")

    def test_similarity_check(self):
        """유사도 판별 로직 테스트"""
        print("\n[Test] Similarity Check...")
        model = EmbeddingModel.get_instance()
        
        # 유사한 문장
        result_sim = model.check_similarity("사과", "사과")
        print(f"Same word similarity: {result_sim}")
        self.assertTrue(result_sim['is_correct'], "Identical words should be correct")
        self.assertGreaterEqual(result_sim['similarity_score'], 99)

        # 의미가 유사한 문장
        result_sem = model.check_similarity("안녕하세요", "반갑습니다")
        print(f"Similar meaning similarity: {result_sem}")
        # '안녕하세요'와 '반갑습니다'는 문맥상 유사하지만 e5 모델이 어떻게 판단할지 확인 필요
        # 보통 꽤 높은 점수가 나옴

        # 완전히 다른 문장
        result_diff = model.check_similarity("나는 사과를 좋아한다", "우주는 매우 넓고 신비롭다")
        print(f"Different meaning similarity: {result_diff}")
        self.assertLess(result_diff['similarity_score'], 85, "Different sentences should have low score")

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
