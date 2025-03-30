import { supabase } from '../lib/supabase';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const articleService = {
  // Generate new article using OpenAI
  async generateArticle(category: string): Promise<any> {
    try {
      // Generate article content
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert AI technology and market analyst. Write an insightful article about ${category} in the AI industry. Include current trends, statistics, and future predictions. Format the response in markdown.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const content = completion.choices[0].message.content;

      // Generate title
      const titleCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Generate a compelling title for this article:",
          },
          {
            role: "user",
            content
          }
        ],
        temperature: 0.7,
        max_tokens: 50
      });

      const title = titleCompletion.choices[0].message.content;

      // Generate summary
      const summaryCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Generate a brief 2-3 sentence summary of this article:",
          },
          {
            role: "user",
            content
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      });

      const summary = summaryCompletion.choices[0].message.content;

      // Save article to database
      const { data, error } = await supabase
        .from('ai_articles')
        .insert([
          {
            title: title?.replace(/["']/g, ''),
            content,
            summary,
            category,
            status: 'published',
            published_at: new Date().toISOString(),
            image_url: `https://source.unsplash.com/featured/?${category},technology,ai`
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating article:', error);
      throw error;
    }
  },

  // Get latest articles
  async getLatestArticles(limit = 3): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ai_articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching articles:', error);
      throw error;
    }
  },

  // Get article by ID
  async getArticleById(id: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('ai_articles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching article:', error);
      throw error;
    }
  },

  // Schedule article generation
  async scheduleArticleGeneration(): Promise<void> {
    try {
      // Generate 3 articles per day
      const categories = ['market_trends', 'technology', 'business_impact'];
      
      for (const category of categories) {
        await this.generateArticle(category);
      }
    } catch (error) {
      console.error('Error scheduling article generation:', error);
      throw error;
    }
  }
};