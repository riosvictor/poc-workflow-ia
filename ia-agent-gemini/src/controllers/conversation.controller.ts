import { Request, Response } from "express";
import { 
  askGeminiForIntent, 
  askGeminiForMissingInputs, 
  confirmWithUser,
  validateInputs,
  enrichInputs
} from "../agents/gemini.agent";
import { 
  getAvailableFlows, 
  getFlowDetails,
  executeFlow 
} from "../services/flow.service";
import { ConversationState } from "../types";
import { getConversationState, setConversationState, deleteConversationState, hasConversationState } from "./conversation.state";
import { responseNeedMoreInfo, responseInvalidInputs, responseNeedConfirmation, responseCompleted } from "./conversation.responses";

export async function processMessage(req: Request, res: Response): Promise<void> {
  const { message, conversationId } = req.body;
  
  if (!message) {
    res.status(400).json({ error: "Mensagem é obrigatória" });
    return;
  }
  
  // Criar ou recuperar o estado da conversa
  const conversationStateId = conversationId || Date.now().toString();
  let state = getConversationState(conversationStateId) || {
    inputs: {},
    missing: [],
    confirmed: false,
    completed: false,
    createdAt: new Date()
  };
  
  // Atualizar a data de modificação
  state.updatedAt = new Date();
  
  try {
    // Se o fluxo não foi identificado, identificá-lo
    if (!state.flowId) {
      const flows = await getAvailableFlows();
      const intentResponse = await askGeminiForIntent(message, flows);
      
      state.flowId = intentResponse.intent;
      
      // Enriquecer os inputs identificados com valores semânticos
      const enrichedInputs = await enrichInputs(state.flowId, intentResponse.inputs);
      state.inputs = { ...state.inputs, ...enrichedInputs };
      state.missing = intentResponse.missing;
      
      // Verificar se há informações faltantes
      if (state.missing.length > 0) {
        setConversationState(conversationStateId, state);
        // Obter detalhes do fluxo para mensagem mais informativa
        const flowDetails = await getFlowDetails(state.flowId);
        const flowName = flowDetails.name || flowDetails.id;
        
        // Criar uma lista dos campos faltantes com suas descrições
        const missingFields = await Promise.all(
          state.missing.map(async (field) => {
            const input = flowDetails.inputs.find(i => i.name === field);
            return input ? `${input.label}${input.description ? ` (${input.description})` : ''}` : field;
          })
        );
        
        res.json(responseNeedMoreInfo(
          conversationStateId,
          state,
          `Identifiquei que você quer ${flowDetails.summary || `executar o fluxo "${flowName}"`}. Preciso de mais algumas informações: ${missingFields.join(', ')}.`
        ));
        return;
      }
    }
    // Se faltam informações, tente extraí-las
    else if (state.missing.length > 0 && !state.confirmed) {
      const extractedInputs = await askGeminiForMissingInputs(
        message, 
        state.flowId, 
        state.missing
      );
      
      // Enriquecer os inputs extraídos com valores semânticos
      const enrichedInputs = await enrichInputs(state.flowId, extractedInputs);
      
      // Atualizar as entradas e recalcular o que está faltando
      state.inputs = { ...state.inputs, ...enrichedInputs };
      state.missing = state.missing.filter(field => state.inputs[field] === undefined || state.inputs[field] === null);
      
      // Verificar se ainda faltam informações
      if (state.missing.length > 0) {
        setConversationState(conversationStateId, state);
        // Obter detalhes do fluxo para mensagens mais informativas
        const flowDetails = await getFlowDetails(state.flowId);
        
        // Criar uma lista dos campos faltantes restantes com suas descrições
        const missingFields = await Promise.all(
          state.missing.map(async (field) => {
            const input = flowDetails.inputs.find(i => i.name === field);
            return input ? `${input.label}${input.description ? ` (${input.description})` : ''}` : field;
          })
        );
        
        res.json(responseNeedMoreInfo(
          conversationStateId,
          state,
          `Obrigado. Ainda preciso de: ${missingFields.join(', ')}.`
        ));
        return;
      }
    }
    
    // Validar os inputs
    const validationResult = await validateInputs(state.flowId!, state.inputs);
    if (!validationResult.valid) {
      // Salvar referência aos campos inválidos
      state.invalidInputs = validationResult.invalid;
      
      // Adicionar os campos inválidos de volta à lista de missing
      Object.keys(validationResult.invalid).forEach(field => {
        if (!state.missing.includes(field)) {
          state.missing.push(field);
        }
      });
      
      setConversationState(conversationStateId, state);
      res.json(responseInvalidInputs(conversationStateId, state, validationResult.invalid));
      return;
    }
    
    // Se tudo está OK mas não confirmado, pedir confirmação
    if (!state.confirmed) {
      // Verificar se a mensagem é uma confirmação
      const isConfirmed = await confirmWithUser(message, state.flowId!, state.inputs);
      
      if (!isConfirmed) {
        setConversationState(conversationStateId, state);
        
        // Obter detalhes do fluxo para mostrar na confirmação
        const flowDetails = await getFlowDetails(state.flowId!);
        
        // Formatar os parâmetros para exibição
        const paramsList = Object.entries(state.inputs)
          .map(([key, value]) => {
            const input = flowDetails.inputs.find(i => i.name === key);
            return `- ${input?.label || key}: ${Array.isArray(value) ? value.join(', ') : value}`;
          })
          .join('\n');
        
        // Usar o nome ou a descrição mais rica do fluxo
        const flowDescription = flowDetails.name || flowDetails.description;
        
        res.json(responseNeedConfirmation(
          conversationStateId,
          state,
          flowDescription,
          paramsList
        ));
        return;
      }
      
      state.confirmed = true;
    }
    
    // Se tudo está confirmado e não concluído, executar o fluxo
    if (state.confirmed && !state.completed) {
      const result = await executeFlow(state.flowId!, state.inputs);
      state.completed = true;
      state.result = result;
    }
    
    // Retornar o resultado final
    setConversationState(conversationStateId, state);
    
    // Obter detalhes do fluxo para mensagem de conclusão personalizada
    const flowDetails = await getFlowDetails(state.flowId!);
    const flowName = flowDetails.name || flowDetails.id;
    
    // Personalizar a mensagem de sucesso com base nos outputs, se definidos
    let successMessage = `Fluxo "${flowName}" executado com sucesso!`;
    
    if (state.result && flowDetails.outputs?.length) {
      const outputSummary = flowDetails.outputs
        .map(output => {
          const resultValue = state.result?.[output.name];
          if (resultValue) {
            const displayValue = Array.isArray(resultValue) 
              ? resultValue.join(', ') 
              : resultValue;
            return `- ${output.description}: ${displayValue}`;
          }
          return null;
        })
        .filter(Boolean)
        .join('\n');
      
      if (outputSummary) {
        successMessage += `\n\nResultados:\n${outputSummary}`;
      }
    }
    
    const response = responseCompleted(conversationStateId, state);
    response.message = successMessage;
    
    res.json(response);
    
  } catch (error: any) {
    console.error("Erro no processamento da mensagem:", error);
    res.status(500).json({ 
      error: "Erro ao processar a mensagem", 
      details: error.message 
    });
  }
}

export async function resetConversation(req: Request, res: Response) {
  const { conversationId } = req.params;
  
  if (hasConversationState(conversationId)) {
    deleteConversationState(conversationId);
    res.status(200).json({ message: "Conversa reiniciada com sucesso" });
    return;
  }
  
  res.status(404).json({ error: "Conversa não encontrada" });
}