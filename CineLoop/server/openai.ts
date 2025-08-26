import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
let openaiClient: OpenAI | null = null;

if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
  console.warn('OPENAI_API_KEY is not set - AI features will be disabled');
}

export interface MovieRecommendation {
  title: string;
  year?: number;
  genre?: string;
  reason: string;
  type: "movie" | "tv";
}

export interface ConversationalResponse {
  message: string;
  recommendations: MovieRecommendation[];
  conversationContinues: boolean;
}

export class OpenAIService {
  async getMovieRecommendations(
    userMessage: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
  ): Promise<ConversationalResponse> {
    if (!openaiClient) {
      return {
        message: "AI recommendations are currently unavailable. Please configure your OpenAI API key.",
        recommendations: [],
        conversationContinues: false
      };
    }

    try {
      const systemPrompt = `You are a knowledgeable movie and TV show enthusiast who helps people discover content they'll love. You have extensive knowledge of movies and TV shows from all eras, genres, and regions.

Your goals:
1. Act like a friendly, enthusiastic friend who loves talking about movies
2. Provide a wide variety of movie/TV suggestions based on what the user describes
3. Think creatively about what they might enjoy based on their preferences
4. Give personalized reasons why each recommendation fits their request
5. Keep the conversation going by asking follow-up questions or offering alternatives

Guidelines:
- Suggest 15-25 diverse recommendations per response (aim for at least 20)
- Include a mix of popular blockbusters, indie gems, international films, and hidden treasures
- Consider different decades (from classics to modern), genres, and styles
- Explain WHY each recommendation fits their request in 1-2 sentences
- Be conversational and friendly, not robotic
- Ask follow-up questions to refine suggestions
- Include both movies and TV shows when appropriate
- Consider different moods, themes, and viewing experiences

Format your response as JSON with:
- message: Your friendly conversational response (keep it concise)
- recommendations: Array of 15-25 movie/TV suggestions with title, year, genre, reason, and type
- conversationContinues: true if you want to keep chatting, false if wrapping up

Example user request: "I want something funny but also touching"
Your response should suggest 20+ comedies with heart, explain why each fits, and maybe ask about preferred time periods or specific types of humor.`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...conversationHistory,
        { role: "user" as const, content: userMessage }
      ];

      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.8, // Higher creativity for diverse suggestions
        max_tokens: 1500,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      // Ensure we always return the expected format
      return {
        message: result.message || "I'd be happy to help you find some great movies!",
        recommendations: result.recommendations || [],
        conversationContinues: result.conversationContinues !== false
      };

    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error("Failed to get movie recommendations from AI");
    }
  }

  async searchMoviesWithContext(
    query: string,
    context?: string
  ): Promise<MovieRecommendation[]> {
    if (!openaiClient) {
      console.warn('OpenAI not available for search');
      return [];
    }

    try {
      const prompt = `Find movies and TV shows that match this search: "${query}"
      ${context ? `Additional context: ${context}` : ""}

      Think broadly and creatively. Consider:
      - Direct matches to the title or theme
      - Movies with similar vibes, moods, or feelings
      - Different interpretations of what they might mean
      - Hidden gems and popular classics
      - Various genres and time periods
      - International films and shows
      - Different decades and eras

      Provide 15-20 diverse recommendations in JSON format with title, year, genre, reason, and type. Make sure to include both obvious matches and creative suggestions.`;

      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a movie expert who finds diverse, creative recommendations. Always respond with valid JSON containing an array of recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.9,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.recommendations || [];

    } catch (error) {
      console.error("OpenAI search error:", error);
      throw new Error("Failed to search movies with AI");
    }
  }
}

export const openaiService = new OpenAIService();