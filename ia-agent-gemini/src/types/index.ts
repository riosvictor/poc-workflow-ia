/**
 * Informações básicas sobre um fluxo
 */
export interface FlowInfo {
  id: string;
  name: string;
  description: string;
  category?: string;
  tags?: string[];
  version?: string;
}

/**
 * Tipos de inputs suportados
 */
export type InputType = 'string' | 'number' | 'boolean' | 'array' | 'object';

/**
 * Exemplo para ajudar a IA a entender os valores esperados
 */
export type InputExample = string | number | boolean | Array<any> | object;

/**
 * Definição de um input para um fluxo
 */
export interface FlowInput {
  name: string;
  type: InputType;
  label: string;
  description?: string;
  required?: boolean;
  itemType?: InputType;
  minItems?: number;
  maxItems?: number;
  examples?: InputExample[];
  semanticHints?: string[];
  validation?: {
    url: string;
    errorMessage?: string;
  };
  defaultValue?: any;
}

/**
 * Definição de um output de fluxo
 */
export interface FlowOutput {
  name: string;
  type: InputType;
  description: string;
}

/**
 * Definição completa de um fluxo
 */
export interface FlowDefinition extends FlowInfo {
  inputs: FlowInput[];
  outputs?: FlowOutput[];
  summary?: string;
  naturalLanguageExamples?: string[];
}

/**
 * Resposta de intenção do modelo AI
 */
export interface IntentResponse {
  intent: string;
  inputs: Record<string, any>;
  missing: string[];
  confidence?: number;
}

/**
 * Resultado da validação de inputs
 */
export interface ValidationResult {
  valid: boolean;
  invalid: Record<string, string>;
  message?: string;
}

/**
 * Estado da conversa
 */
export interface ConversationState {
  flowId?: string;
  inputs: Record<string, any>;
  missing: string[];
  confirmed: boolean;
  completed: boolean;
  result?: any;
  invalidInputs?: Record<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Resposta da API para o cliente
 */
export interface ConversationResponse {
  conversationId: string;
  intent?: string;
  inputs: Record<string, any>;
  missing?: string[];
  needMoreInfo?: boolean;
  needConfirmation?: boolean;
  completed?: boolean;
  result?: any;
  message: string;
  invalid?: Record<string, string>;
}