import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data.json');

const ensureDb = () => {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ expressions: [], conversations: [], suggestions: [] }, null, 2));
  }
};

export const storage = {
  getExpressions: () => {
    ensureDb();
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    return data.expressions || [];
  },
  addExpression: (exp: any) => {
    ensureDb();
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    const newExp = {
      id: Math.random().toString(36).substr(2, 9),
      ...exp,
      mastery: 0,
      createdAt: exp.createdAt || new Date().toISOString()
    };
    data.expressions.push(newExp);
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    return newExp;
  },
  updateExpression: (id: string, updates: any) => {
    ensureDb();
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    const index = data.expressions.findIndex((e: any) => e.id === id);
    if (index !== -1) {
      data.expressions[index] = { ...data.expressions[index], ...updates };
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    }
  },
  deleteExpression: (id: string) => {
    ensureDb();
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    data.expressions = (data.expressions || []).filter((e: any) => e.id !== id);
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  },
  getConversations: (userId: string) => {
    ensureDb();
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    return (data.conversations || []).filter((c: any) => c.userId === userId);
  },
  addConversation: (userId: string, question: string, meaning?: string, example?: string) => {
    ensureDb();
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    const newConv = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      question,
      meaning,
      example,
      userAnswer: null,
      createdAt: new Date().toISOString()
    };
    data.conversations.push(newConv);
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    return newConv;
  },
  updateConversation: (id: string, userAnswer: string) => {
    ensureDb();
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    const index = data.conversations.findIndex((c: any) => c.id === id);
    if (index !== -1) {
      data.conversations[index].userAnswer = userAnswer;
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
      return data.conversations[index];
    }
    return null;
  },
  getSuggestions: (userId: string) => {
    ensureDb();
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    return (data.suggestions || []).filter((s: any) => s.userId === userId);
  },
  addSuggestion: (userId: string, suggestion: any) => {
    ensureDb();
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    const newSug = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      ...suggestion,
      createdAt: new Date().toISOString()
    };
    data.suggestions.push(newSug);
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    return newSug;
  },
  deleteSuggestion: (id: string) => {
    ensureDb();
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    data.suggestions = (data.suggestions || []).filter((s: any) => s.id !== id);
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }
};
