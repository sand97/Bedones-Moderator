import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface AIAnalysisResult {
  action: 'none' | 'hide' | 'delete' | 'reply';
  reason: string;
  replyMessage?: string;
}

interface FAQRule {
  assertion: string;
  response: string;
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
    faqRules: FAQRule[];
  };
}

export class AIService {
  private static xaiClient: OpenAI | null = null;
  private static geminiClient: GoogleGenerativeAI | null = null;

  private static getXAIClient(): OpenAI | null {
    if (!process.env.XAI_API_KEY) {
      throw new Error('XAI_API_KEY is not provided in secrets/environement');
    }
    if (!this.xaiClient) {
      this.xaiClient = new OpenAI({
        apiKey: process.env.XAI_API_KEY,
        baseURL: 'https://api.x.ai/v1',
      });
    }
    return this.xaiClient;
  }

  private static getGeminiClient(): GoogleGenerativeAI | null {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not provided in secrets/environement');
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
        return await this.analyzeWithGrok(xaiClient, systemPrompt, userMessage);
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

  private static buildSystemPrompt(
    pageSettings: CommentContext['pageSettings'],
  ): string {
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
        '- Respond to frequently asked questions with helpful, friendly replies based on the FAQ rules below',
      );
    }

    let faqSection = '';
    if (
      pageSettings.intelligentFAQEnabled &&
      pageSettings.faqRules.length > 0
    ) {
      faqSection = `\n\nFAQ Rules (Use these to automatically reply to user questions):
${pageSettings.faqRules
  .map(
    (rule, index) =>
      `${index + 1}. When: ${rule.assertion}
   Reply with: ${rule.response}`,
  )
  .join('\n')}

IMPORTANT: When a user's comment matches one of the FAQ assertions above, you MUST use the "reply" action and provide the corresponding response as the replyMessage. Adapt the response slightly to match the user's question naturally, but keep the core information from the FAQ rule.`;
    }

    const prompt = `You are a Facebook page comment moderator AI. Your task is to analyze comments and decide what action to take.

Available capabilities:
${capabilities.join('\n')}${faqSection}

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
- When a comment matches an FAQ rule, ALWAYS use the "reply" action with the appropriate response
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
    client: OpenAI,
    systemPrompt: string,
    userMessage: string,
  ): Promise<AIAnalysisResult> {
    const response = await client.chat.completions.create({
      model: 'grok-4-fast-non-reasoning-latest',
      max_tokens: 1024,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in Grok response');
    }

    return this.parseAIResponse(content);
  }

  private static async analyzeWithGemini(
    client: GoogleGenerativeAI,
    systemPrompt: string,
    userMessage: string,
  ): Promise<AIAnalysisResult> {
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
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
    const jsonRegex = /\{[\s\S]*\}/;
    const jsonMatch = jsonRegex.exec(text);
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
