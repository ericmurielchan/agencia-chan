
import { GoogleGenAI, Type } from "@google/genai";
import { Task, Lead, FinancialTransaction } from "../types";

// Expert consultation is a complex task requiring gemini-3.1-pro-preview for advanced reasoning
export const consultArchitect = async (question: string, contextData: string): Promise<string> => {
  if (!process.env.GEMINI_API_KEY) return "Chave da API não configurada.";

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Você é um Consultor Especialista em Operações de Agências de Marketing. O usuário está planejando/gerenciando o sistema da 'Agência Chan'.
      Pergunta do Usuário: "${question}"
      
      Contexto Atual do Sistema (Resumo JSON):
      ${contextData}

      Forneça uma resposta estratégica e concisa EM PORTUGUÊS. 
      Se perguntarem sobre funcionalidades, sugira implementações específicas.
      Se perguntarem sobre processos, sugira fluxos de trabalho ágeis de marketing.
      Formate com títulos em negrito e bullet points para facilitar a leitura.`,
    });
    return response.text || "Sem resposta gerada.";
  } catch (error) {
    console.error("Erro IA:", error);
    return "Erro ao consultar o Arquiteto IA.";
  }
};

// Simple financial analysis can use gemini-3-flash-preview for basic summarization and Q&A
export const analyzeFinancialHealth = async (transactions: FinancialTransaction[]): Promise<string> => {
  if (!process.env.GEMINI_API_KEY) return "Chave API ausente.";

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const summary = {
    totalIncome: transactions.filter(t => t.type === 'INCOME' && t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0),
    totalExpense: transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0),
    pendingIncome: transactions.filter(t => t.type === 'INCOME' && t.status === 'PENDING').reduce((acc, t) => acc + t.amount, 0),
    pendingExpense: transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PENDING').reduce((acc, t) => acc + t.amount, 0),
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise a saúde financeira desta agência de marketing com base nestes dados: ${JSON.stringify(summary)}.
      Forneça 3 insights curtos sobre fluxo de caixa e 1 recomendação para o próximo mês. Responda em Português BR.`,
    });
    return response.text || "Não foi possível analisar as finanças.";
  } catch (e) {
    return "Erro na análise financeira.";
  }
};

// Simple productivity insights can use gemini-3-flash-preview for basic text tasks
export const analyzeProductivity = async (tasks: Task[]): Promise<string> => {
  if (!process.env.GEMINI_API_KEY) return "Chave API ausente.";

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const completedTasks = tasks.filter(t => t.status === 'DONE');
  const taskSummary = completedTasks.map(t => ({
    title: t.title,
    totalTime: t.timeLogs.reduce((acc, log) => acc + log.duration, 0) / 60 + " minutes",
    priority: t.priority
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise os dados de conclusão de tarefas desta squad de marketing: ${JSON.stringify(taskSummary)}.
      Responda EM PORTUGUÊS. Dê 3 insights breves sobre eficiência e 1 sugestão de melhoria.`,
    });
    return response.text || "Não foi possível analisar os dados.";
  } catch (e) {
    return "Falha na análise.";
  }
};

// Lead scoring is a complex reasoning task requiring gemini-3.1-pro-preview
export const scoreLead = async (lead: Lead): Promise<{ score: number; rationale: string }> => {
  if (!process.env.GEMINI_API_KEY) return { score: 0, rationale: "Sem chave de API" };
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Pontue este lead de vendas de 0 a 100 com base em critérios típicos de agências de marketing B2B. Responda a justificativa em Português.
      Lead: ${JSON.stringify(lead)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.NUMBER,
              description: "The calculated score from 0 to 100.",
            },
            rationale: {
              type: Type.STRING,
              description: "Brief justification for the score in Portuguese.",
            },
          },
          required: ["score", "rationale"],
        },
      }
    });
    
    // Extract text directly from the text property
    const text = response.text || "{}";
    return JSON.parse(text.trim());
  } catch (e) {
    console.error("Erro IA ScoreLead:", e);
    return { score: 50, rationale: "Falha na análise da IA, retornando pontuação neutra." };
  }
};
