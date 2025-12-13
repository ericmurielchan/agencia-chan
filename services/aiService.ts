import { GoogleGenAI } from "@google/genai";
import { Task, Lead } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const consultArchitect = async (question: string, contextData: string): Promise<string> => {
  if (!apiKey) return "Chave da API não configurada.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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

export const analyzeProductivity = async (tasks: Task[]): Promise<string> => {
  if (!apiKey) return "Chave API ausente.";

  const completedTasks = tasks.filter(t => t.status === 'DONE');
  const taskSummary = completedTasks.map(t => ({
    title: t.title,
    totalTime: t.timeLogs.reduce((acc, log) => acc + log.duration, 0) / 60 + " minutes",
    priority: t.priority
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analise os dados de conclusão de tarefas desta squad de marketing: ${JSON.stringify(taskSummary)}.
      Responda EM PORTUGUÊS. Dê 3 insights breves sobre eficiência e 1 sugestão de melhoria.`,
    });
    return response.text || "Não foi possível analisar os dados.";
  } catch (e) {
    return "Falha na análise.";
  }
};

export const scoreLead = async (lead: Lead): Promise<{ score: number; rationale: string }> => {
  if (!apiKey) return { score: 0, rationale: "Sem chave de API" };
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Pontue este lead de vendas de 0 a 100 com base em critérios típicos de agências de marketing B2B. Responda a justificativa em Português.
      Lead: ${JSON.stringify(lead)}
      Retorne APENAS um objeto JSON: { "score": number, "rationale": "string" }`
    });
    
    const text = response.text || "";
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    return { score: 50, rationale: "Falha na análise da IA, retornando pontuação neutra." };
  }
};