import { GoogleGenerativeAI } from "@google/generative-ai";
import { FlowInfo, IntentResponse, ValidationResult } from "../types";
import { getFlowDetails, getFlowInputs, validateInput } from "../services/flow.service";
import { generateAssistantFlowPrompt, generateFlowDetailsPrompt } from "../prompts/assistant-flows.prompt";
import { generateConfirmationPrompt } from "../prompts/generate-confirmation.prompt";
import { generateMissingInputsPrompt } from "../prompts/missing-inputs.prompt";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";

/**
 * Extrai JSON do texto de resposta do modelo
 */
function extractJson(response: string): any {
  try {
    // Tenta extrair o JSON de um bloco de código
    const match = response.match(/```(?:json)?([\s\S]+?)```/);
    const jsonText = match ? match[1].trim() : response.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Erro ao extrair JSON da resposta:", error);
    throw new Error("Falha ao processar resposta do modelo");
  }
}

/**
 * Identifica a intenção e extrai dados iniciais
 */
export async function askGeminiForIntent(userMessage: string, flows: FlowInfo[]): Promise<IntentResponse> {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const prompt = generateAssistantFlowPrompt(flows, userMessage);

  const result = await model.generateContent([prompt]);
  const raw = result.response.text();
  
  return extractJson(raw);
}

/**
 * Extrai dados específicos para um fluxo
 */
export async function askGeminiForFlowDetails(
  userMessage: string,
  flowId: string
): Promise<Record<string, any>> {
  const flowDetails = await getFlowDetails(flowId);
  
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const prompt = generateFlowDetailsPrompt(flowDetails, userMessage);

  const result = await model.generateContent([prompt]);
  const raw = result.response.text();
  
  return extractJson(raw);
}

/**
 * Extrai dados faltantes com contexto semântico aprimorado
 */
export async function askGeminiForMissingInputs(
  userMessage: string, 
  flowId: string, 
  missingInputFields: string[]
): Promise<Record<string, any>> {
  // Obtém detalhes completos do fluxo para usar informações semânticas
  const flowDetails = await getFlowDetails(flowId);
  const flowInputs = flowDetails.inputs;
  const requiredInputs = flowInputs.filter(input => missingInputFields.includes(input.name));
  
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  // Usando o novo formato do prompt que inclui informações semânticas
  const prompt = generateMissingInputsPrompt(userMessage, flowId, requiredInputs, flowDetails);

  const result = await model.generateContent([prompt]);
  const raw = result.response.text();
  
  return extractJson(raw);
}

/**
 * Verifica se o usuário está confirmando a execução usando contexto semântico aprimorado
 */
export async function confirmWithUser(
  userMessage: string,
  flowId: string,
  inputValues: Record<string, any>
): Promise<boolean> {
  const flowDetails = await getFlowDetails(flowId);
  
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  // Usando o novo formato do prompt de confirmação
  const prompt = generateConfirmationPrompt(userMessage, flowId, flowDetails, inputValues);

  const result = await model.generateContent([prompt]);
  const response = result.response.text();
  
  // Analisa a primeira linha da resposta para determinar se foi confirmado
  const firstLine = response.split('\n')[0].trim().toUpperCase();
  
  return firstLine === 'CONFIRMADO';
}

/**
 * Valida os inputs do fluxo com validação semântica aprimorada
 */
export async function validateInputs(
  flowId: string, 
  inputs: Record<string, any>
): Promise<ValidationResult> {
  const flowDetails = await getFlowDetails(flowId);
  const flowInputs = flowDetails.inputs;
  const invalid: Record<string, string> = {};
  
  // Verifica campos obrigatórios
  for (const input of flowInputs) {
    // Checa se campo obrigatório está presente
    if (input.required && (inputs[input.name] === undefined || inputs[input.name] === null || inputs[input.name] === '')) {
      invalid[input.name] = `O campo '${input.label}' é obrigatório`;
      continue;
    }
    
    // Pula validação se valor não está presente
    if (inputs[input.name] === undefined || inputs[input.name] === null) {
      continue;
    }
    
    // Valida tipo do dado
    const value = inputs[input.name];
    if (input.type === 'array' && !Array.isArray(value)) {
      // Se o valor não é um array mas deveria ser, tenta converter
      if (typeof value === 'string' && value.includes(',')) {
        // Tenta converter string separada por vírgula em array
        inputs[input.name] = value.split(',').map(v => v.trim());
      } else {
        // Converte valor único em array
        inputs[input.name] = [value];
      }
    }
    
    if (input.type === 'number' && typeof value !== 'number') {
      const numberValue = Number(value);
      if (isNaN(numberValue)) {
        invalid[input.name] = `O campo '${input.label}' deve ser um número`;
        continue;
      }
      // Converte para número automaticamente
      inputs[input.name] = numberValue;
    }
    
    if (input.type === 'boolean' && typeof value !== 'boolean') {
      if (typeof value === 'string') {
        if (['true', 'sim', 'yes', 's', 'y', '1'].includes(value.toLowerCase())) {
          inputs[input.name] = true;
        } else if (['false', 'não', 'no', 'n', '0'].includes(value.toLowerCase())) {
          inputs[input.name] = false;
        } else {
          invalid[input.name] = `O campo '${input.label}' deve ser um valor booleano`;
        }
      } else {
        invalid[input.name] = `O campo '${input.label}' deve ser um valor booleano`;
      }
      continue;
    }
    
    // Executa validação customizada se configurada
    if (input.validation?.url) {
      const isValid = await validateInput(input.validation.url, inputs[input.name]);
      if (!isValid) {
        invalid[input.name] = input.validation.errorMessage || 
          `O valor '${inputs[input.name]}' não é válido para ${input.label}`;
      }
    }
  }
  
  return {
    valid: Object.keys(invalid).length === 0,
    invalid,
    message: Object.keys(invalid).length > 0 ? 
      `Foram encontrados problemas em ${Object.keys(invalid).length} campo(s)` : 
      undefined
  };
}

/**
 * Enriquece os inputs com valores semânticos e faz correções automáticas
 */
export async function enrichInputs(
  flowId: string,
  inputs: Record<string, any>
): Promise<Record<string, any>> {
  const flowDetails = await getFlowDetails(flowId);
  const enrichedInputs = { ...inputs };
  
  // Para cada campo no fluxo
  for (const input of flowDetails.inputs) {
    const value = enrichedInputs[input.name];
    
    // Pula se o valor não estiver presente
    if (value === undefined || value === null) {
      continue;
    }
    
    // Aplica valores padrão se necessário
    if (value === "" && input.defaultValue !== undefined) {
      enrichedInputs[input.name] = input.defaultValue;
    }
  }
  
  return enrichedInputs;
}