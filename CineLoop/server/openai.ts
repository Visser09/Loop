import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    try {
      const systemPrompt = `You are a knowledgeable movie and TV show enthusiast who helps people discover content they'll love. You have extensive knowledge of movies and TV shows from all eras, genres, and regions.

Your goals:
1. Act like a friendly, enthusiastic friend who loves talking about movies
2. Provide a wide variety of movie/TV suggestions based on what the user describes
3. Think creatively about what they might enjoy based on their preferences
4. Give personalized reasons why each recommendation fits their request
5. Keep the conversation going by asking follow-up questions or offering alternatives

Guidelines:
- Suggest 3-6 diverse recommendations per response
- Include a mix of popular and hidden gems
- Consider different decades, genres, and styles
- Explain WHY each recommendation fits their request
- Be conversational and friendly, not robotic
- Ask follow-up questions to refine suggestions
- If they want to modify their search, help them explore new directions

Format your response as JSON with:
- message: Your friendly conversational response
- recommendations: Array of movie/TV suggestions with title, year, genre, reason, and type
- conversationContinues: true if you want to keep chatting, false if wrapping up

Example user request: "I want something funny but also touching"
Your response should suggest comedies with heart, explain why each fits, and maybe ask about preferred time periods or specific types of humor.`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...conversationHistory,
        { role: "user" as const, content: userMessage }
      ];

      const response = await openai.chat.completions.create({
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
    try {
      const prompt = `Find movies and TV shows that match this search: "${query}"
      ${context ? `Additional context: ${context}` : ""}
      
      Think broadly and creatively. Consider:
      - Direct matches to the title or theme
      - Movies with similar vibes, moods, or feelings
      - Different interpretations of what they might mean
      - Hidden gems and popular classics
      - Various genres and time periods
      
      Provide 5-8 diverse recommendations in JSON format with title, year, genre, reason, and type.`;

      const response = await openai.chat.completions.create({
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