import { GoogleGenAI, Modality, Operation, GenerateVideosResponse } from "@google/genai";
import { UploadedFile } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const editImage = async (prompt: string, characterImages: UploadedFile[], outfitImage: UploadedFile | null, placeImage: UploadedFile | null, poseImage: UploadedFile | null): Promise<{ text: string | null; image: string | null; }> => {
  const textPart = { text: prompt };

  const parts: ({ inlineData: { data: string; mimeType: string; } } | { text: string; })[] = [];

  // Add all character images first. The prompt will explain their purpose.
  characterImages.forEach(image => {
    parts.push({
      inlineData: {
        data: image.base64,
        mimeType: image.mimeType,
      },
    });
  });

  // If an outfit reference image exists, it's added next.
  if (outfitImage) {
    parts.push({
      inlineData: {
        data: outfitImage.base64,
        mimeType: outfitImage.mimeType,
      },
    });
  }

  // If a place reference image exists, it's added next.
  if (placeImage) {
    parts.push({
      inlineData: {
        data: placeImage.base64,
        mimeType: placeImage.mimeType,
      },
    });
  }
  
  // If a pose reference image exists, it's added next.
  if (poseImage) {
    parts.push({
      inlineData: {
        data: poseImage.base64,
        mimeType: poseImage.mimeType,
      },
    });
  }

  // The text prompt is always last.
  parts.push(textPart);


  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: { parts: parts },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  let resultText: string | null = null;
  let resultImage: string | null = null;

  if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          resultText = part.text;
        } else if (part.inlineData) {
          resultImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
  }
  
  return { text: resultText, image: resultImage };
};

const parseDataUrl = (dataUrl: string): { base64: string; mimeType: string } | null => {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
};

export const upscaleImage = async (imageUrl: string): Promise<{ text: string | null; image: string | null; }> => {
  const imageData = parseDataUrl(imageUrl);
  if (!imageData) {
    throw new Error("Invalid image data URL format for upscaling.");
  }
  
  const prompt = "CRITICAL TASK: Upscale this image to a higher resolution. Enhance all details, making the image sharper and clearer. DO NOT change the artistic style, content, colors, or composition in any way. This is a technical enhancement only.";
  
  const imagePart = {
    inlineData: {
      data: imageData.base64,
      mimeType: imageData.mimeType,
    },
  };
  const textPart = { text: prompt };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: { parts: [imagePart, textPart] },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  let resultText: string | null = null;
  let resultImage: string | null = null;

  if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          resultText = part.text;
        } else if (part.inlineData) {
          resultImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
  }
  
  return { text: resultText, image: resultImage };
};


export const generateVideo = async (
    prompt: string, 
    image: UploadedFile,
    onPoll: (operation: Operation<GenerateVideosResponse>) => void
  ): Promise<string> => {
  
  let operation: Operation<GenerateVideosResponse> = await ai.models.generateVideos({
    model: 'veo-2.0-generate-001',
    prompt: prompt,
    image: {
      imageBytes: image.base64,
      mimeType: image.mimeType,
    },
    config: {
      numberOfVideos: 1
    }
  });

  onPoll(operation);

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
    operation = await ai.operations.getVideosOperation({ operation: operation });
    onPoll(operation);
  }

  const downloadLink = (operation.response?.generatedVideos?.[0] as any)?.video?.uri;

  if (!downloadLink) {
    throw new Error("Video generation completed, but no download link was found.");
  }

  const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  if (!videoResponse.ok) {
    throw new Error(`Failed to download the generated video. Status: ${videoResponse.statusText}`);
  }
  const videoBlob = await videoResponse.blob();
  const objectUrl = URL.createObjectURL(videoBlob);
  
  return objectUrl;
};