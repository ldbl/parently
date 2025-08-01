import { AIComplexityEvaluation, AIDailyPlan, AIChatResponse, AIChildInsight } from '../types';

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1/messages';
  private maxRetries = 3;
  private timeout = 10000; // 10 seconds

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Evaluate message complexity (1-5 scale)
   */
  async evaluateComplexity(message: string): Promise<AIComplexityEvaluation> {
    const prompt = `Evaluate the complexity of this parenting/financial question on a scale of 1-5:
1 = Simple factual question
2 = Basic advice needed
3 = Moderate complexity requiring context
4 = Complex situation requiring analysis
5 = Very complex requiring deep understanding

Question: "${message}"

Respond with JSON format:
{
  "complexityScore": number,
  "reasoning": "brief explanation"
}`;

    try {
      const response = await this.callClaude(prompt, 'haiku');
      const result = JSON.parse(response);
      
      return {
        complexityScore: Math.min(Math.max(result.complexityScore, 1), 5),
        reasoning: result.reasoning || 'Complexity evaluated'
      };
    } catch (error) {
      console.error('Complexity evaluation error:', error);
      return {
        complexityScore: 3, // Default to moderate complexity
        reasoning: 'Default complexity score due to evaluation error'
      };
    }
  }

  /**
   * Generate daily plan based on user context
   */
  async generatePlan(userContext: {
    recentCheckins: Array<{ emotionalState: number; financialStress: number; notes?: string }>;
    currentGoals?: string[];
    familySituation?: string;
  }): Promise<AIDailyPlan> {
    const prompt = `As a parenting and family finance AI assistant, create a concise daily plan based on this context:

Recent emotional states: ${userContext.recentCheckins.map(c => `${c.emotionalState}/10`).join(', ')}
Recent financial stress: ${userContext.recentCheckins.map(c => `${c.financialStress}/10`).join(', ')}
Current goals: ${userContext.currentGoals?.join(', ') || 'None specified'}
Family situation: ${userContext.familySituation || 'Not specified'}

Create a brief, actionable plan with:
1. Main focus for today
2. 2-3 specific tips
3. One financial action item

Format as JSON:
{
  "plan": "brief daily plan",
  "focusAreas": ["area1", "area2"],
  "tips": ["tip1", "tip2", "tip3"]
}`;

    try {
      const response = await this.callClaude(prompt, 'haiku');
      const result = JSON.parse(response);
      
      return {
        plan: result.plan || 'Focus on family well-being today',
        focusAreas: result.focusAreas || ['parenting', 'finances'],
        tips: result.tips || ['Take time for yourself', 'Review family budget']
      };
    } catch (error) {
      console.error('Plan generation error:', error);
      return {
        plan: 'Focus on family well-being and financial stability today',
        focusAreas: ['parenting', 'finances'],
        tips: ['Take time for yourself', 'Review family budget', 'Connect with your child']
      };
    }
  }

  /**
   * Handle chat conversation
   */
  async handleChat(message: string, userContext?: string): Promise<AIChatResponse> {
    // First evaluate complexity
    const complexity = await this.evaluateComplexity(message);
    
    // Choose model based on complexity
    const model = complexity.complexityScore <= 3 ? 'haiku' : 'sonnet';
    
    const prompt = `You are Parently, an AI assistant for parents and family finances. 
${userContext ? `Context: ${userContext}\n` : ''}
User message: "${message}"

Provide a helpful, empathetic response that addresses parenting and/or financial concerns. 
Keep it concise but thorough.`;

    try {
      const response = await this.callClaude(prompt, model);
      
      return {
        response,
        model,
        complexityScore: complexity.complexityScore
      };
    } catch (error) {
      console.error('Chat handling error:', error);
      return {
        response: 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.',
        model: 'haiku',
        complexityScore: 3
      };
    }
  }

  /**
   * Generate child insights for parents
   */
  async generateChildInsights(data: {
    childMessages: Array<{ message: string; timestamp: string }>;
    parentCheckins: Array<{ emotionalState: number; financialStress: number; timestamp: string }>;
  }): Promise<AIChildInsight> {
    const prompt = `Analyze this child-parent interaction data and provide insights for the parent:

Child's recent messages:
${data.childMessages.map(m => `- "${m.message}" (${m.timestamp})`).join('\n')}

Parent's recent check-ins:
${data.parentCheckins.map(c => `- Emotional: ${c.emotionalState}/10, Financial stress: ${c.financialStress}/10 (${c.timestamp})`).join('\n')}

Provide insights in JSON format:
{
  "summary": "brief summary of child's emotional state and concerns",
  "emotionalState": "overall emotional assessment",
  "concerns": ["concern1", "concern2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "suggestedActions": ["action1", "action2"]
}`;

    try {
      const response = await this.callClaude(prompt, 'sonnet');
      const result = JSON.parse(response);
      
      return {
        summary: result.summary || 'Child appears to be doing well',
        emotionalState: result.emotionalState || 'Stable',
        concerns: result.concerns || [],
        recommendations: result.recommendations || [],
        suggestedActions: result.suggestedActions || []
      };
    } catch (error) {
      console.error('Child insights generation error:', error);
      return {
        summary: 'Unable to generate insights at this time',
        emotionalState: 'Unknown',
        concerns: [],
        recommendations: ['Continue monitoring child\'s messages'],
        suggestedActions: ['Check in with your child']
      };
    }
  }

  /**
   * Make API call to Claude with retry logic
   */
  private async callClaude(prompt: string, model: 'haiku' | 'sonnet'): Promise<string> {
    const modelMap = {
      haiku: 'claude-3-haiku-20240307',
      sonnet: 'claude-3-sonnet-20240229'
    };

    const payload = {
      model: modelMap[model],
      max_tokens: model === 'haiku' ? 1000 : 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.content || !data.content[0] || !data.content[0].text) {
          throw new Error('Invalid response format from Claude API');
        }

        return data.content[0].text.trim();

      } catch (error) {
        lastError = error as Error;
        console.warn(`Claude API attempt ${attempt} failed:`, error);
        
        if (attempt < this.maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw new Error(`Claude API failed after ${this.maxRetries} attempts: ${lastError?.message}`);
  }
} 