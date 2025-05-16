import { ConversationState } from "../types";

// Em uma aplicação real, isso seria armazenado em um banco de dados
const conversations = new Map<string, ConversationState>();

export function getConversationState(conversationId: string): ConversationState | undefined {
  return conversations.get(conversationId);
}

export function setConversationState(conversationId: string, state: ConversationState): void {
  conversations.set(conversationId, state);
}

export function deleteConversationState(conversationId: string): void {
  conversations.delete(conversationId);
}

export function hasConversationState(conversationId: string): boolean {
  return conversations.has(conversationId);
}
