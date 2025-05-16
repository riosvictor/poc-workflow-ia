import { FlowDefinition, FlowInfo } from "../types";

export function generateAssistantFlowPrompt(
  flows: FlowInfo[],
  userMessage: string
): string {
  const flowList = flows.map((f) => {
    const tags = f.tags ? ` [${f.tags.join(', ')}]` : '';
    return `- ${f.id}: ${f.name || f.description}${tags}`;
  }).join("\n");

  return `
Você é um assistente especializado em identificar a intenção e extrair informações relevantes para executar fluxos automatizados a partir de comandos em linguagem natural.

## FLUXOS DISPONÍVEIS
${flowList}

## CONTEXTO
O usuário enviou a seguinte mensagem: "${userMessage}"

## INSTRUÇÕES
1. Analise a mensagem e identifique qual dos fluxos disponíveis o usuário deseja executar
2. Extraia todos os parâmetros relevantes mencionados na mensagem
3. Identifique quais parâmetros não foram fornecidos e precisam ser solicitados

## RESPOSTA
Retorne um JSON com os seguintes campos:
- intent: o ID do fluxo a ser executado
- inputs: os valores de entrada que você conseguiu identificar
- missing: os nomes dos campos que ainda faltam
- confidence: um número de 0 a 1 que indica seu nível de confiança nesta interpretação

Formato:
\`\`\`json
{
  "intent": "id-do-fluxo",
  "inputs": {
    "campo1": "valor",
    "campo2": "valor"
  },
  "missing": ["campo3", "campo4"],
  "confidence": 0.9
}
\`\`\`

IMPORTANTE:
- Se a mensagem do usuário não mencionar claramente um fluxo disponível, escolha o que parece mais próximo da intenção dele
- Só inclua no JSON os parâmetros que foram realmente mencionados na mensagem
- Os valores do campo "inputs" devem corresponder exatamente ao tipo esperado pelo fluxo
`;
}

export function generateFlowDetailsPrompt(
  flow: FlowDefinition,
  userMessage: string
): string {
  // Criando uma lista mais detalhada dos inputs necessários
  const inputList = flow.inputs.map(input => {
    const required = input.required ? ' (obrigatório)' : ' (opcional)';
    const description = input.description ? `\n   Descrição: ${input.description}` : '';
    const examples = input.examples ? `\n   Exemplos: ${JSON.stringify(input.examples)}` : '';
    const hints = input.semanticHints ? `\n   Termos relacionados: ${input.semanticHints.join(', ')}` : '';
    
    return `- ${input.name} (${input.label}): tipo ${input.type}${required}${description}${examples}${hints}`;
  }).join("\n\n");

  // Adicionando exemplos de linguagem natural se disponíveis
  const examples = flow.naturalLanguageExamples?.length 
    ? `\n\n## EXEMPLOS DE COMANDOS\n${flow.naturalLanguageExamples.map(ex => `- "${ex}"`).join('\n')}`
    : '';

  return `
Você é um assistente especializado em extrair informações para o fluxo "${flow.name || flow.id}".

## SOBRE O FLUXO
${flow.summary || flow.description}

## PARÂMETROS NECESSÁRIOS
${inputList}
${examples}

## CONTEXTO
O usuário enviou a seguinte mensagem: "${userMessage}"

## INSTRUÇÕES
1. Analise a mensagem e extraia os valores para os parâmetros listados acima
2. Utilize o contexto dos termos relacionados e exemplos para identificar valores mesmo quando o usuário usa palavras diferentes
3. Se um parâmetro for do tipo "array", retorne como uma lista de valores
4. Só inclua os parâmetros que você conseguir identificar com confiança

## RESPOSTA
Retorne um JSON apenas com os parâmetros que você encontrou na mensagem:

\`\`\`json
{
  "param1": "valor1",
  "param2": ["valor2a", "valor2b"]
}
\`\`\`
`;
}
