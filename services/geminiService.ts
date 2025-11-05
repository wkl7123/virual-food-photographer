
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ImageStyle } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getStyleDescription = (style: ImageStyle): string => {
  switch (style) {
    case ImageStyle.RUSTIC_DARK:
      return "A rustic and dark food photography style. Moody lighting, dark wooden surfaces, cast iron pans, vintage silverware, and a warm, cozy atmosphere. Focus on texture and deep colors.";
    case ImageStyle.BRIGHT_MODERN:
      return "A bright, clean, and modern food photography style. Minimalist composition, white or light-colored backgrounds, natural light, sharp focus, and vibrant colors. The aesthetic is fresh and airy.";
    case ImageStyle.SOCIAL_MEDIA:
      return "A trendy, top-down 'flat lay' food photography style, perfect for social media. The dish is arranged neatly on a surface, shot directly from above. Often includes hands in the shot, or other props like drinks or phones to create a lifestyle feel. Bright and colorful.";
    default:
      return "A beautiful, realistic photograph of food.";
  }
};

export const parseMenu = async (menuText: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a menu parsing expert. Given the following text from a restaurant menu, extract only the names of the dishes. Ignore prices, descriptions, and category headers. Return your response as a valid JSON array of strings. Menu:\n\n${menuText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "The name of a single dish from the menu."
          },
        },
      },
    });

    const jsonString = response.text.trim();
    const dishes = JSON.parse(jsonString);
    if (Array.isArray(dishes) && dishes.every(d => typeof d === 'string')) {
      return dishes;
    }
    throw new Error("Parsed menu is not a string array.");

  } catch (error) {
    console.error("Error parsing menu:", error);
    throw new Error("Failed to parse menu. Please check the format and try again.");
  }
};

export const generateFoodImage = async (dishName: string, style: ImageStyle): Promise<{ base64Image: string, mimeType: string }> => {
  const styleDescription = getStyleDescription(style);
  const prompt = `Generate an ultra-realistic, high-end, professional food photograph of: "${dishName}". The style should be: ${styleDescription}. The image must be appetizing and look like it's from a top restaurant's marketing campaign. Pay close attention to lighting, composition, and detail.`;

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64Image = response.generatedImages[0].image.imageBytes;
      return { base64Image, mimeType: 'image/png' };
    }
    throw new Error("No image was generated.");
  } catch (error) {
    console.error(`Error generating image for ${dishName}:`, error);
    throw new Error(`Failed to generate an image for ${dishName}.`);
  }
};

export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<{ base64Image: string, mimeType: string }> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return { base64Image: part.inlineData.data, mimeType: part.inlineData.mimeType };
      }
    }
    throw new Error("No edited image was returned.");

  } catch (error) {
      console.error("Error editing image:", error);
      throw new Error("Failed to edit the image.");
  }
};
