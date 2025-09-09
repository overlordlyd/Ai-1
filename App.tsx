import React, { useState, useCallback, useEffect } from 'react';
import { AppMode, UploadedFile, GenerationResult } from './types';
import { VIDEO_GENERATION_LOADING_MESSAGES } from './constants';
import { editImage, generateVideo, upscaleImage } from './services/geminiService';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { CharacterReferenceInput } from './components/CharacterReferenceInput';
import { OutfitReferenceInput } from './components/OutfitReferenceInput';
import { PlaceReferenceInput } from './components/PlaceReferenceInput';
import { PoseReferenceInput } from './components/PoseReferenceInput';
import { LoadingDisplay } from './components/LoadingDisplay';
import { ResultDisplay } from './components/ResultDisplay';
import { GenerationHistory } from './components/GenerationHistory';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>(AppMode.ImageToImage);
  const [characterFiles, setCharacterFiles] = useState<UploadedFile[]>([]);
  const [outfitReferenceFile, setOutfitReferenceFile] = useState<UploadedFile | null>(null);
  const [placeReferenceFile, setPlaceReferenceFile] = useState<UploadedFile | null>(null);
  const [poseReferenceFile, setPoseReferenceFile] = useState<UploadedFile | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [poseAndComposition, setPoseAndComposition] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [history, setHistory] = useState<GenerationResult[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading && appMode === AppMode.ImageToVideo) {
      setLoadingMessage(VIDEO_GENERATION_LOADING_MESSAGES[0]);
      let messageIndex = 1;
      interval = setInterval(() => {
        setLoadingMessage(VIDEO_GENERATION_LOADING_MESSAGES[messageIndex % VIDEO_GENERATION_LOADING_MESSAGES.length]);
        messageIndex++;
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading, appMode]);
  
  const resetResults = () => {
    setError(null);
    setResultImage(null);
    setResultVideoUrl(null);
    setResultText(null);
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt || characterFiles.length === 0) {
      setError("A prompt and at least one source character image are required to conjure your vision.");
      return;
    }

    setIsLoading(true);
    resetResults();
    
    let fullPrompt = prompt;

    if (appMode === AppMode.ImageToImage) {
      let imageCounter = characterFiles.length;
      const characterImageIndices = Array.from({ length: characterFiles.length }, (_, i) => i + 1).join(', ');
      
      let outfitImageIndex: number | null = null;
      if (outfitReferenceFile) {
        imageCounter++;
        outfitImageIndex = imageCounter;
      }

      let placeImageIndex: number | null = null;
      if (placeReferenceFile) {
        imageCounter++;
        placeImageIndex = imageCounter;
      }

      let poseImageIndex: number | null = null;
      if (poseReferenceFile) {
        imageCounter++;
        poseImageIndex = imageCounter;
      }

      const fidelityProtocol = `Your mission is to forge a new, unique image with the highest possible fidelity to the source character's face. You are given multiple reference images. It is CRITICAL to synthesize these into a coherent, new piece of art and not simply copy one of them.

**CRITICAL INSTRUCTION: FACE FIDELITY PROTOCOL**
- You are provided with several images of the same character (Image${characterFiles.length > 1 ? 's' : ''} ${characterImageIndices}).
- Study these images carefully. The facial structure, features (eyes, nose, mouth), and unique details are your primary reference.
- The face in your generated image MUST be a highly accurate and consistent representation of this character. This is the most important part of your task. Do not change the character's identity.

**MISSION BRIEF:**
- Image${characterFiles.length > 1 ? 's' : ''} ${characterImageIndices} are the **SUBJECT CHARACTER**. Use them to understand the character's appearance, especially the face.
`;

      let missionBrief = '';
      if (outfitImageIndex) {
        missionBrief += `- Image ${outfitImageIndex} is the **OUTFIT REFERENCE**. **OUTFIT REPLICATION MANDATE:** Your task is to take the complete outfit—including all clothes, garments, and accessories—from this image and accurately dress the subject character in it. Replicate the style, color, design, and details of the clothing and any accessories precisely. IGNORE the person wearing the outfit in the reference; transfer ONLY the garments.\n`;
      }
      if (placeImageIndex) {
        missionBrief += `- Image ${placeImageIndex} is the **PLACE/BACKGROUND REFERENCE**. The final scene's environment must match the style, mood, and elements of this image. **CRITICAL LIGHTING INSTRUCTION:** Pay close attention to the lighting conditions, color temperature, and shadow direction in this background image. The lighting on the subject character MUST be adjusted to match the environment perfectly, creating a natural and believable composite. Integrate the subject seamlessly into this new background.\n`;
      }
      if (poseImageIndex) {
        missionBrief += `- Image ${poseImageIndex} is the **POSE REFERENCE**. **CRITICAL POSE REPLICATION MANDATE (CONTROLNET SIMULATION):**
  - This image provides ONLY the anatomical pose for the subject character. Treat it as a structural guide, like a ControlNet reference or a digital mannequin.
  - Your SOLE TASK for this image is to extract the body position, posture, and limb arrangement of the figure.
  - You MUST apply this exact pose to the subject character defined by Image(s) ${characterImageIndices}.
  - **IT IS ABSOLUTELY FORBIDDEN TO COPY ANYTHING ELSE FROM THE POSE REFERENCE.** You MUST completely IGNORE and DISCARD the following from Image ${poseImageIndex}:
    - The person/character's identity, face, and body type.
    - ALL clothing, outfits, and garments.
    - ALL accessories (e.g., hats, jewelry, weapons).
    - The lighting, shadows, and color scheme.
    - The background and any environmental elements.
  - The purpose of this image is structural and anatomical ONLY. Replicate the pose and nothing else.\n`;
      }
      
      const finalInstructions = `Combine all these elements into a single, cohesive, and new masterpiece. Finally, apply the following specific user instructions to the combined image: ${prompt}`;

      fullPrompt = fidelityProtocol + missionBrief + finalInstructions;
    }

    if (poseAndComposition) {
      fullPrompt += ` --- POSE & COMPOSITION: ${poseAndComposition}`;
    }

    if (negativePrompt) {
      fullPrompt += ` --- DO NOT INCLUDE THE FOLLOWING: ${negativePrompt}`;
    }

    try {
      if (appMode === AppMode.ImageToImage) {
        setLoadingMessage("Applying malignant makeover...");
        const result = await editImage(fullPrompt, characterFiles, outfitReferenceFile, placeReferenceFile, poseReferenceFile);
        
        if (result.image) {
          setLoadingMessage("Enhancing wicked details...");
          const upscaledResult = await upscaleImage(result.image);
          
          const finalImage = upscaledResult.image || result.image; // Fallback to original if upscaling fails
          const finalText = upscaledResult.text || result.text;
          
          setResultImage(finalImage);
          setResultText(finalText);
          const newResult: GenerationResult = { id: Date.now(), type: 'image', status: 'success', url: finalImage, text: finalText };
          setHistory(prev => [newResult, ...prev]);
        } else {
          setError("The dark ritual yielded no image. The vision was censored by the ether.");
          const originalImageUrl = URL.createObjectURL(characterFiles[0].file);
          const newResult: GenerationResult = { 
            id: Date.now(), 
            type: 'image', 
            status: 'censored', 
            url: originalImageUrl, 
            text: 'Original Material' 
          };
          setHistory(prev => [newResult, ...prev]);
        }
      } else { // Image to Video
        const videoSourceImage = characterFiles[0]; // Use the first character image for video
        const videoUrl = await generateVideo(prompt, videoSourceImage, (op) => {
            console.log('Polling video status:', op);
        });
        setResultVideoUrl(videoUrl);
        const newResult: GenerationResult = { id: Date.now(), type: 'video', status: 'success', url: videoUrl, text: "Sinister Animation" };
        setHistory(prev => [newResult, ...prev]);
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unknown dark force interfered with the operation.";
      setError(errorMessage);
      console.error(err);
      const originalImageUrl = URL.createObjectURL(characterFiles[0]!.file);
      const newResult: GenerationResult = { 
        id: Date.now(), 
        type: appMode === AppMode.ImageToImage ? 'image' : 'video', 
        status: 'censored', 
        url: originalImageUrl, 
        text: 'Original Material' 
      };
      setHistory(prev => [newResult, ...prev]);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [prompt, negativePrompt, characterFiles, appMode, outfitReferenceFile, placeReferenceFile, poseReferenceFile, poseAndComposition]);

  const handleModeChange = (newMode: AppMode) => {
      setAppMode(newMode);
      resetResults();
      if (newMode !== AppMode.ImageToImage) {
        setOutfitReferenceFile(null);
        setPlaceReferenceFile(null);
        setPoseReferenceFile(null);
        setPoseAndComposition('');
      }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-mono">
      <div className="w-full max-w-4xl pb-40"> {/* Added padding-bottom for history bar */}
        <Header />
        <main className="mt-8 bg-gray-800/50 p-6 rounded-2xl shadow-2xl shadow-purple-900/20 border border-purple-500/20">
          <ModeSelector currentMode={appMode} onModeChange={handleModeChange} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="flex flex-col space-y-4">
              <CharacterReferenceInput onFileSelect={setCharacterFiles} />
              
              {appMode === AppMode.ImageToImage && (
                <>
                  <OutfitReferenceInput onFileSelect={setOutfitReferenceFile} />
                  <PlaceReferenceInput onFileSelect={setPlaceReferenceFile} />
                  <PoseReferenceInput onFileSelect={setPoseReferenceFile} />
                </>
              )}

              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-purple-400 mb-2">
                  Incantation (Your Prompt)
                </label>
                <textarea
                  id="prompt"
                  rows={4}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder-gray-500"
                  placeholder={
                    appMode === AppMode.ImageToImage 
                    ? "e.g., add a glowing magical aura and a villainous monocle"
                    : "e.g., make the clouds swirl ominously and add a lightning strike"
                  }
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {appMode === AppMode.ImageToImage && (
                <div>
                  <label htmlFor="pose-composition" className="block text-sm font-medium text-purple-400 mb-2">
                    Pose, Size & Composition
                  </label>
                  <textarea
                    id="pose-composition"
                    rows={2}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder-gray-500"
                    placeholder="e.g., full body shot, dynamic fighting pose, 16:9 aspect ratio"
                    value={poseAndComposition}
                    onChange={(e) => setPoseAndComposition(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              )}

               <div>
                <label htmlFor="negative-prompt" className="block text-sm font-medium text-gray-500 mb-2">
                  Negative Incantation (Banish these things)
                </label>
                <textarea
                  id="negative-prompt"
                  rows={2}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all placeholder-gray-500"
                  placeholder="e.g., bright colors, smiles, puppies"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt || characterFiles.length === 0}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-purple-500/30"
              >
                {isLoading ? 'Conjuring...' : 'Unleash Vision'}
              </button>
            </div>
            
            <div className="bg-gray-900/70 rounded-lg p-4 border border-gray-700 flex items-center justify-center min-h-[300px]">
              {isLoading ? (
                <LoadingDisplay message={loadingMessage} />
              ) : (
                <ResultDisplay
                  image={resultImage}
                  videoUrl={resultVideoUrl}
                  text={resultText}
                  error={error}
                />
              )}
            </div>
          </div>
        </main>
      </div>
      <GenerationHistory history={history} setHistory={setHistory} />
    </div>
  );
};

export default App;