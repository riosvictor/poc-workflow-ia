import { ConversationResponse, ConversationState } from "../types";

/**
 * Resposta quando são necessárias mais informações
 */
export function responseNeedMoreInfo(
  conversationId: string, 
  state: ConversationState, 
  customMessage: string
): ConversationResponse {
  return {
    conversationId,
    intent: state.flowId,
    inputs: state.inputs,
    missing: state.missing,
    needMoreInfo: true,
    message: customMessage
  };
}

/**
 * Resposta quando existem inputs inválidos
 */
export function responseInvalidInputs(
  conversationId: string, 
  state: ConversationState, 
  invalid: Record<string, string>
): ConversationResponse {
  const invalidMessages = Object.values(invalid);
  
  // Mensagem mais detalhada sobre os problemas
  let errorMessage: string;
  if (invalidMessages.length === 1) {
    errorMessage = `Encontrei um problema: ${invalidMessages[0]}. Por favor, corrija este valor.`;
  } else {
    errorMessage = `Encontrei ${invalidMessages.length} problemas: \n- ${invalidMessages.join('\n- ')}\n\nPor favor, corrija estes valores.`;
  }
  
  return {
    conversationId,
    intent: state.flowId,
    inputs: state.inputs,
    missing: state.missing,
    invalid,
    needMoreInfo: true,
    message: errorMessage
  };
}

/**
 * Resposta quando é necessário confirmar a execução
 */
export function responseNeedConfirmation(
  conversationId: string, 
  state: ConversationState, 
  flowDescription: string, 
  paramsList: string
): ConversationResponse {
  return {
    conversationId,
    intent: state.flowId,
    inputs: state.inputs,
    needConfirmation: true,
    message: `Vou executar o fluxo "${flowDescription}" com os seguintes parâmetros:\n${paramsList}\n\nVocê confirma?`
  };
}

/**
 * Resposta quando o fluxo foi completado
 */
export function responseCompleted(
  conversationId: string, 
  state: ConversationState
): ConversationResponse {
  return {
    conversationId,
    intent: state.flowId,
    inputs: state.inputs,
    completed: true,
    result: state.result,
    message: `Fluxo "${state.flowId}" executado com sucesso!`
  };
}
