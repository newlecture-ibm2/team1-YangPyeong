/**
 * FarmBot 관련 상수 및 설정
 */

export const FARM_BOT_CONSTANTS = {
  // 페르소나 설정
  BOT_NAME: '양평이 할아버지',
  BOT_SUBTITLE: '양평군 40년차 베테랑 농부 🌾',
  
  // 환영 메시지
  WELCOME_MESSAGE: '허허, 어서 와요~ 👋\n양평 농사에 대해 궁금한 게 있으면 편하게 물어봐요!\n아래 버튼을 눌러도 되고, 직접 입력해도 된답니다~ 🌱',
  RESET_MESSAGE: '허허, 새로 시작하자고요? 좋아요~ 👋\n뭐든 물어봐요! 🌱',
  
  // 에러 메시지
  ERROR_MESSAGE: '죄송합니다. 일시적인 오류가 발생했어요. 다시 시도해주세요.',
  NETWORK_ERROR: '네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
  
  // 빠른 질문 목록
  QUICK_QUESTIONS: [
    { emoji: '🌶️', text: '요즘 뭐 심으면 좋아요?' },
    { emoji: '💰', text: '농업 보조금 정보 알려줘요' },
    { emoji: '🌱', text: '초보 농부인데 뭐부터 해야 해요?' },
  ],
  
  // 설정
  HISTORY_LIMIT: 10,
  API_TIMEOUT: 30000,
};
