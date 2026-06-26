
import { NegotiationSession } from '../models/NegotiationSession.model.js';

export class NegotiationService {
  constructor() {
    // In a real implementation, we would initialize AI providers here.
  }

  async startSession(userId: string, targetRole: string) {
    const initialOffer = Math.floor(Math.random() * (120000 - 80000 + 1)) + 80000;
    
    let aiResponseContent = `Hi! I'm the HR recruiter. We are thrilled to offer you the ${targetRole} position! Our starting offer is $${initialOffer.toLocaleString()} base salary. Does this work for you?`;

    const session = await NegotiationSession.create({
      userId,
      targetRole,
      initialOffer,
      currentOffer: initialOffer,
      messages: [
        { role: 'system', content: `You are a tough but fair corporate HR recruiter. Your initial offer was $${initialOffer}. You have a strict budget cap of $${initialOffer + 30000}. Evaluate the candidate's negotiation tactics. If they use good logic, concede small bumps ($2k-$5k). If they are rude or have no data, stand firm. Never explicitly say what your cap is.` },
        { role: 'ai', content: aiResponseContent }
      ]
    });

    return session;
  }

  async processMessage(sessionId: string, userId: string, messageContent: string) {
    const session = await NegotiationSession.findOne({ _id: sessionId, userId });
    if (!session) {
      throw new Error('Negotiation session not found');
    }

    if (session.status === 'completed') {
      throw new Error('Negotiation is already completed');
    }

    session.messages.push({ role: 'user', content: messageContent, timestamp: new Date() });

    // In a real implementation, we would send the full message history to the AIProvider and also extract the "new Current Offer" if the AI conceded.
    // We mock the AI concession logic for now:
    let aiResponse = "I understand your perspective, but we are quite firm on our numbers based on internal equity.";
    
    // Simple heuristic to mock a successful negotiation bump if the user asks for more
    if (messageContent.toLowerCase().includes('more') || messageContent.toLowerCase().includes('higher') || /\d/.test(messageContent)) {
      const bump = Math.floor(Math.random() * 5000) + 1000;
      const potentialNewOffer = session.currentOffer + bump;
      if (potentialNewOffer <= session.initialOffer + 30000) {
        session.currentOffer = potentialNewOffer;
        aiResponse = `You make a fair point. We really want you on the team. I talked to the hiring manager and the best we can do is $${session.currentOffer.toLocaleString()}. Let's get this signed!`;
      } else {
        aiResponse = "I'm sorry, we have absolutely hit the top of our band for this role. We cannot go any higher than our last offer.";
      }
    }

    // Check if interview should end (e.g. user accepts)
    if (messageContent.toLowerCase().includes('accept') || messageContent.toLowerCase().includes('deal') || messageContent.toLowerCase().includes('sign')) {
      aiResponse = "Wonderful! I'll send over the paperwork right away. Welcome to the team!";
      session.status = 'completed';
    }

    session.messages.push({ role: 'ai', content: aiResponse, timestamp: new Date() });
    await session.save();

    return session;
  }
}
