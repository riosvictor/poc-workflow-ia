# 🧠 POC Workflow IA: Automatização de Fluxos com IA 🤖

![Workflow IA](/docs/workflow-ia-banner.png)

## 💡 Sobre o Projeto

Este projeto demonstra a integração de Inteligência Artificial (Google Gemini) com fluxos de trabalho automatizados, permitindo que usuários iniciem processos através de comandos em linguagem natural.

Por exemplo, em vez de preencher um formulário, você pode simplesmente dizer:
> "Adicione os usuários Alice e Bob ao time de engenharia da Google"

E o sistema:
1. 🔍 Identifica a intenção (adicionar usuários ao time)
2. 📝 Extrai os parâmetros necessários (organização, time, usuários)
3. 🤔 Solicita informações adicionais se necessário
4. ✅ Valida os dados fornecidos
5. 🚀 Executa o fluxo de trabalho automatizado

## 🏗️ Arquitetura

O projeto é composto por três APIs principais:

### 🧠 IA Agent Gemini
- **Papel**: Interface conversacional inteligente que interpreta comandos, extrai dados e gerencia o fluxo de conversa
- **Tecnologias**: TypeScript, Express, Google Gemini API
- **Recursos**: Detecção de intenção, extração de parâmetros, enriquecimento semântico, confirmação com usuário

### ⚙️ Flow Orchestrator API
- **Papel**: Gerencia os fluxos de trabalho e suas definições
- **Tecnologias**: TypeScript, Express
- **Recursos**: Catálogo de fluxos disponíveis, execução de fluxos, gerenciamento de definições

### 🔍 Flow Validator API
- **Papel**: Valida os dados fornecidos pelos usuários
- **Tecnologias**: TypeScript, Express
- **Recursos**: Validação contextual de parâmetros, regras específicas por domínio

## 🚀 Como Iniciar

### Pré-requisitos
- Node.js 18+
- Conta Google AI Studio para API Key do Gemini

### Instalação e Execução

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/poc-workflow-ia.git
   cd poc-workflow-ia
   ```

2. **Configure a API Key do Google Gemini**
   - Crie uma chave API em [Google AI Studio](https://makersuite.google.com/)
   - Adicione a chave no arquivo `.env` do diretório `ia-agent-gemini`

3. **Instale as dependências e inicie os serviços**
   ```bash
   # Flow Validator API
   cd flow-validator-api
   npm install
   npm run dev
   
   # Flow Orchestrator API (em outra janela de terminal)
   cd ../flow-orchestrator-api  
   npm install
   npm run dev
   
   # IA Agent Gemini (em outra janela de terminal)
   cd ../ia-agent-gemini
   npm install
   npm run dev
   ```

4. **Teste a aplicação**
   - Use o arquivo `api.http` para enviar comandos de teste
   - Ou construa uma interface própria consumindo a API em `http://localhost:3001/conversation`

## ✨ Recursos Principais

- 💬 **Compreensão de Linguagem Natural**: Entende comandos escritos normalmente
- 🔄 **Conversas Contextual**: Mantém o contexto ao longo da conversa
- 🧩 **Extração Semântica**: Reconhece parâmetros mesmo quando expressos de formas diferentes
- ✅ **Validação Inteligente**: Valida entrada e solicita correções quando necessário
- 🔄 **Fluxos Extensíveis**: Fácil adição de novos fluxos de trabalho

## 🌟 Exemplos de Uso

- "Adicione Alice e Bob ao time de engenharia da Google"
- "Inclua os colaboradores Carlos e Ana na equipe de produto da Meta"
- "Quero adicionar Fernando ao time de alquimia do Boticário"

## 📚 Estrutura do Projeto

```
/
├── ia-agent-gemini/       # Agente de IA com Gemini
├── flow-orchestrator-api/ # Gerenciador de fluxos de trabalho
├── flow-validator-api/    # Validador de parâmetros
└── api.http               # Exemplos de chamadas de API
```

## 🔮 Próximos Passos

- [ ] Interface Web para interação
- [ ] Suporte a mais fluxos de trabalho
- [ ] Integração com Microsoft Teams/Slack
- [ ] Histórico de execuções
- [ ] Dashboard de análise

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para mais detalhes.
