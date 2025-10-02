import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface AIAnalysisResult {
  action: 'none' | 'hide' | 'delete' | 'reply';
  reason: string;
  replyMessage?: string;
}

interface CommentContext {
  comment: {
    id: string;
    message: string;
    from: { id: string; name: string };
    created_time: string;
  };
  pageSettings: {
    undesiredCommentsEnabled: boolean;
    undesiredCommentsAction: 'hide' | 'delete';
    spamDetectionEnabled: boolean;
    spamAction: 'hide' | 'delete';
    intelligentFAQEnabled: boolean;
  };
}

export class AIService {
  private static xaiClient: Anthropic | null = null;
  private static geminiClient: GoogleGenerativeAI | null = null;

  private static getXAIClient(): Anthropic | null {
    if (!process.env.XAI_API_KEY) {
      return null;
    }
    if (!this.xaiClient) {
      this.xaiClient = new Anthropic({
        apiKey: process.env.XAI_API_KEY,
        baseURL: 'https://api.x.ai/v1',
      });
    }
    return this.xaiClient;
  }

  private static getGeminiClient(): GoogleGenerativeAI | null {
    if (!process.env.GEMINI_API_KEY) {
      return null;
    }
    if (!this.geminiClient) {
      this.geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return this.geminiClient;
  }

  /**
   * Analyze a comment using AI and determine what action to take
   */
  static async analyzeComment(
    context: CommentContext,
  ): Promise<AIAnalysisResult> {
    const systemPrompt = this.buildSystemPrompt(context.pageSettings);
    const userMessage = this.buildUserMessage(context.comment);

    try {
      // Try Grok 4 first
      const xaiClient = this.getXAIClient();
      if (xaiClient) {
        return await this.analyzeWithGrok(
          xaiClient,
          systemPrompt,
          userMessage,
        );
      }
    } catch (error) {
      console.error('Grok 4 analysis failed:', error);
    }

    // Fallback to Gemini 2.5 Flash
    try {
      const geminiClient = this.getGeminiClient();
      if (geminiClient) {
        return await this.analyzeWithGemini(
          geminiClient,
          systemPrompt,
          userMessage,
        );
      }
    } catch (error) {
      console.error('Gemini analysis failed:', error);
    }

    throw new Error('No AI service available');
  }

  private static buildSystemPrompt(pageSettings: CommentContext['pageSettings']): string {
    const capabilities: string[] = [];

    if (pageSettings.undesiredCommentsEnabled) {
      capabilities.push(
        `- Detect undesired comments (offensive, inappropriate, or violating community guidelines) and ${pageSettings.undesiredCommentsAction} them`,
      );
    }

    if (pageSettings.spamDetectionEnabled) {
      capabilities.push(
        `- Detect spam comments (promotional, repetitive, or irrelevant) and ${pageSettings.spamAction} them`,
      );
    }

    if (pageSettings.intelligentFAQEnabled) {
      capabilities.push(
        '- Respond to frequently asked questions with helpful, friendly replies',
      );
    }

    const prompt = `You are a Facebook page comment moderator AI. Your task is to analyze comments and decide what action to take.

Available capabilities:
${capabilities.join('\n')}

Available actions:
- "hide": Hide the comment from public view
- "delete": Permanently delete the comment
- "reply": Reply to the comment with a helpful message
- "none": Take no action (comment is acceptable)

You must respond with a JSON object in this exact format:
{
  "action": "none" | "hide" | "delete" | "reply",
  "reason": "Brief explanation of why this action was chosen",
  "replyMessage": "The message to reply with (only if action is 'reply')"
}

Guidelines:
- Be fair and balanced in your moderation decisions
- Only take action when clearly warranted by the comment content
- For FAQ replies, be helpful, friendly, and concise
- Consider context and intent, not just keywords
- Prioritize user experience and community safety`;

    return prompt;
  }

  private static buildUserMessage(comment: CommentContext['comment']): string {
    return `Analyze this Facebook comment:

From: ${comment.from.name} (ID: ${comment.from.id})
Posted: ${comment.created_time}
Message: "${comment.message}"

Provide your analysis and recommended action.`;
  }

  private static async analyzeWithGrok(
    client: Anthropic,
    systemPrompt: string,
    userMessage: string,
  ): Promise<AIAnalysisResult> {
    const response = await client.messages.create({
      model: 'grok-2-1212',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\n${userMessage}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Grok');
    }

    return this.parseAIResponse(content.text);
  }

  private static async analyzeWithGemini(
    client: GoogleGenerativeAI,
    systemPrompt: string,
    userMessage: string,
  ): Promise<AIAnalysisResult> {
    const model = client.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userMessage },
    ]);

    const text = result.response.text();
    return this.parseAIResponse(text);
  }

  private static parseAIResponse(text: string): AIAnalysisResult {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as AIAnalysisResult;

    // Validate the response
    if (!['none', 'hide', 'delete', 'reply'].includes(parsed.action)) {
      throw new Error('Invalid action in AI response');
    }

    if (!parsed.reason) {
      throw new Error('Missing reason in AI response');
    }

    if (parsed.action === 'reply' && !parsed.replyMessage) {
      throw new Error('Missing replyMessage for reply action');
    }

    return parsed;
  }
}
