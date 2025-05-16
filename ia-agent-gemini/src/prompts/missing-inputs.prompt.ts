import { FlowDefinition, FlowInput } from "../types";

export function generateMissingInputsPrompt(
  userMessage: string,
  flowId: string,
  missingInputs: FlowInput[],
  flowDetails?: FlowDefinition
): string {
  // Criando descrições ricas para cada input faltante
  const inputsDescription = missingInputs.map(input => {
    const description = input.description ? `\n   Descrição: ${input.description}` : '';
    const examples = input.examples 
      ? `\n   Exemplos: ${JSON.stringify(input.examples)}` 
      : '';
    const hints = input.semanticHints 
      ? `\n   Termos relacionados: ${input.semanticHints.join(', ')}` 
      : '';
    
    return `- ${input.name} (${input.label}): tipo ${input.type}${description}${examples}${hints}`;
  }).join("\n\n");

  // Incluindo exemplos de linguagem natural se disponíveis
  const examples = flowDetails?.naturalLanguageExamples?.length 
    ? `\n\n## EXEMPLOS DE COMANDOS\n${flowDetails.naturalLanguageExamples.map(ex => `- "${ex}"`).join('\n')}`
    : '';

  // Descrição do fluxo
  const flowDescription = flowDetails?.summary || 
                         flowDetails?.description || 
                         `Fluxo ${flowId}`;

  return `
Você é um assistente especializado em extrair informações específicas de mensagens de usuário.

## SOBRE O FLUXO
${flowDescription}

## PARÂMETROS FALTANTES
Preciso extrair os seguintes campos da mensagem do usuário:
${inputsDescription}
${examples}

## CONTEXTO
Mensagem do usuário: "${userMessage}"

## INSTRUÇÕES
1. Analise a mensagem e extraia os valores para os parâmetros listados acima
2. Para cada parâmetro, verifique cuidadosamente se a mensagem do usuário contém uma informação correspondente
3. Use os termos relacionados e exemplos para reconhecer diferentes formas de expressar o mesmo conceito
4. Se um parâmetro for do tipo "array", retorne como uma lista de valores
5. Só inclua no resultado os parâmetros que você conseguir identificar com confiança
6. NÃO invente ou pressuponha informações que não estejam explícitas na mensagem

## RESPOSTA
Retorne apenas um JSON com os parâmetros que você encontrou:

\`\`\`json
{
  "campo1": "valor1",
  "campo2": ["valor2a", "valor2b"]
}
\`\`\`
`;
}