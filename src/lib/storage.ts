import { prisma } from './prisma';

export const storage = {
  getExpressions: async (userId?: string) => {
    if (userId) {
      return await prisma.expression.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    }
    return await prisma.expression.findMany({
      orderBy: { createdAt: 'desc' }
    });
  },

  addExpression: async (data: any) => {
    return await prisma.expression.create({
      data: {
        expression: data.expression,
        meaning: data.meaning,
        explanation: data.explanation,
        type: data.type,
        userId: data.userId,
        priority: data.priority,
        mastery: data.mastery || 0,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        lastUsed: data.lastUsed ? new Date(data.lastUsed) : undefined
      }
    });
  },

  updateExpression: async (id: string, updates: any) => {
    const data: any = { ...updates };
    if (updates.lastUsed) data.lastUsed = new Date(updates.lastUsed);
    if (updates.createdAt) data.createdAt = new Date(updates.createdAt);
    
    return await prisma.expression.update({
      where: { id },
      data
    });
  },

  deleteExpression: async (id: string) => {
    return await prisma.expression.delete({
      where: { id }
    });
  },

  getConversations: async (userId: string) => {
    return await prisma.conversation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  },

  addConversation: async (userId: string, question: string, meaning?: string, example?: string, targetExpression?: string) => {
    return await prisma.conversation.create({
      data: {
        userId,
        question,
        meaning,
        example,
        targetExpression,
        createdAt: new Date()
      }
    });
  },

  updateConversation: async (id: string, userAnswer: string) => {
    return await prisma.conversation.update({
      where: { id },
      data: { userAnswer }
    });
  },

  getSuggestions: async (userId: string) => {
    return await prisma.suggestion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  },

  addSuggestion: async (userId: string, suggestion: any) => {
    return await prisma.suggestion.create({
      data: {
        userId,
        original: suggestion.original,
        expression: suggestion.expression,
        type: suggestion.type,
        meaning: suggestion.meaning,
        explanation: suggestion.explanation,
        createdAt: new Date()
      }
    });
  },

  deleteSuggestion: async (id: string) => {
    return await prisma.suggestion.delete({
      where: { id }
    });
  },
  
  deleteConversations: async (ids: string[]) => {
    return await prisma.conversation.deleteMany({
      where: { id: { in: ids } }
    });
  }
};
