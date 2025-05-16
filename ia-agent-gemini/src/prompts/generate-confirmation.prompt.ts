import { FlowDefinition, FlowInput } from "../types";

export function generateConfirmationPrompt(
  userMessage: string,
  flowId: string,
  flowDetails: FlowDefinition,
  inputs: Record<string, any>
): string {
  // Formatando os parâmetros de entrada para exibição
  const inputSummary = Object.entries(inputs)
    .map(([key, value]) => {
      const inputDetail = flowDetails.inputs.find(i => i.name === key);
      if (!inputDetail) return null;
      
      const label = inputDetail.label;
      
      if (Array.isArray(value)) {
        return `- ${label}: ${value.join(', ')}`;
      }
      
      return `- ${label}: ${value}`;
    })
    .filter(item => item !== null)
    .join('\n');

  // Gerando um resumo da ação que será executada
  const flowName = flowDetails.name || flowId;
  const flowSummary = flowDetails.summary || flowDetails.description;
  
  // Lista dos efeitos esperados (se disponível nos outputs)
  const effectsDescription = flowDetails.outputs?.length
    ? `\n\n## RESULTADOS ESPERADOS\n${flowDetails.outputs.map(o => `- ${o.description}`).join('\n')}`
    : '';

  return `
Você é um assistente especializado em analisar se o usuário está confirmando uma ação.

## AÇÃO PROPOSTA
${flowSummary}

## PARÂMETROS INFORMADOS
${inputSummary}
${effectsDescription}

## MENSAGEM DO USUÁRIO
"${userMessage}"

## TAREFA
Determine se a mensagem do usuário:
1. CONFIRMA explicitamente a execução do fluxo "${flowName}" (por exemplo: "sim", "confirmo", "pode executar", "prossiga")
2. NEGA explicitamente a execução (por exemplo: "não", "cancele", "pare", "desisto")
3. NÃO DEIXA CLARO se confirma ou não (mensagem ambígua ou com outro assunto)

## RESPOSTA
Responda APENAS com uma das seguintes opções:
- "CONFIRMADO" - se o usuário claramente confirmou
- "NEGADO" - se o usuário claramente negou
- "AMBÍGUO" - se não está claro se o usuário confirmou ou negou

E, em uma nova linha, uma breve explicação da sua decisão.
`;
}