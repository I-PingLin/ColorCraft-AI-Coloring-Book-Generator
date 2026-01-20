
import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, Type, Chat } from "@google/genai";

@Injectable({ providedIn: 'root' })
export class AiService {
  private ai = new GoogleGenAI({ apiKey: (window as any).process?.env?.API_KEY || '' });
  
  public isGenerating = signal<boolean>(false);
  public progressMessage = signal<string>('');

  async generatePrompts(theme: string, name: string) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 5 distinct, simple coloring page descriptions for a child named ${name} based on the theme: "${theme}". 
      Each description should be a single sentence focus on a specific scene.
      Return as a JSON array of strings.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    
    try {
      return JSON.parse(response.text);
    } catch (e) {
      return Array(5).fill(`A cute ${theme} scene for a coloring book.`);
    }
  }

  async generateImage(prompt: string, isCover: boolean = false, resolution: string = '1K') {
    // Note: Resolution mapping is simulated as the model has internal optimization
    // We add quality keywords to the prompt based on selection
    const qualitySuffix = resolution === '4K' ? 'ultra detailed lines, perfect curves' : 
                          resolution === '2K' ? 'high quality lines' : '';

    const finalPrompt = isCover 
      ? `A children's coloring book cover art, ${prompt}. Thick bold black outlines, simple shapes, white background, black and white line art. Include large friendly text at the top that says 'Coloring Fun'. ${qualitySuffix}`
      : `Children's coloring book page, ${prompt}. Simple thick bold black outlines, white background, pure black and white line art, no shading, no gradients, high contrast. ${qualitySuffix}`;

    const response = await this.ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: finalPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
      }
    });

    return `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`;
  }

  createChatSession(): Chat {
    return this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: 'You are a friendly assistant for a Children\'s Coloring Book app. You help kids and parents come up with creative themes for coloring pages. Keep your tone enthusiastic, simple, and encouraging.',
      }
    });
  }
}
