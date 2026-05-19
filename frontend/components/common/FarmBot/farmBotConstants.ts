/**
 * FarmBot 관련 상수 및 설정
 */

export const FARM_BOT_CONSTANTS = {
  // 페르소나 설정
  BOT_NAME: '양평이 할아버지',
  BOT_SUBTITLE: '양평군 농업 전문 컨설턴트 🌾',
  
  // 환영 메시지
  WELCOME_MESSAGE: '안녕하세요! 👋\n양평군 농업 전문 컨설턴트, 양평이 할아버지입니다.\n양평 농사에 대해 궁금한 점이 있으시면 편하게 질문해 주세요! 🌱',
  RESET_MESSAGE: '새로운 대화를 시작합니다! 👋\n무엇이든 질문해 주세요 🌱',
  
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
