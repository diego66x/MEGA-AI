import React, { useState, useEffect, useRef } from 'react';
import { 
  Loader2,
  AlertCircle,
  Play,
  CheckCircle2,
  Lock,
  Power,
  Trash2,
  XCircle,
  Send,
  Sparkles,
  Bot,
  User,
  Image as ImageIcon,
  Download,
  Share2,
  Cpu,
  Activity,
  Square,
  Smartphone as MobileIcon,
  Monitor,
  FolderOpen,
  FileText,
  Music,
  Video,
  Search,
  Camera,
  Mic,
  Save,
  Pause,
  Maximize2,
  Heart,
  X,
  Clapperboard,
  Film,
  RotateCcw,
  Video as VideoIcon,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Palette,
  Type,
  LayoutTemplate,
  Wand2,
  Youtube,
  Layers
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import StatCard from './components/StatCard';
import { 
  verifyCredential, 
  sendMessageToGemini, 
  generateImageWithGrok, 
  searchPixabay, 
  searchPexels, 
  generateElevenLabsAudio,
  generateScriptStructure,
  analyzeYoutubeStrategy
} from './services/api';
import { StockMedia, VideoProject, ScriptScene } from './types';

interface ApiKeys {
    gemini: string;
    grok: string;
    pixabay: string;
    pexels: string;
    elevenlabs: string;
}

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
}

interface GeneratedImage {
    url: string;
    prompt: string;
    ratio: string;
    timestamp: Date;
}

// Estrutura unificada para a Biblioteca
interface LibraryItem {
    id: string;
    type: 'image' | 'video' | 'audio' | 'pdf';
    url: string;
    title: string; // Prompt ou nome do arquivo
    meta?: string; // Proporção, duração, etc
    timestamp: string; // Salvo como string para facilitar JSON
}

type AspectRatio = '1:1' | '9:16' | '16:9';
type Orientation = 'all' | 'horizontal' | 'vertical';
// NOVOS ESTILOS DE LEGENDA ADICIONADOS
type CaptionStyle = 'classic' | 'modern' | 'box' | 'neon' | 'comic' | 'minimal' | 'glitch';

interface YtbAnalysis {
    channelStyle: string;
    pacing: string;
    hookStrategy: string;
    visualVibe: string;
    improvedConcept: string;
}

// Componente de Bloqueio para Menus sem API
const LockedView = ({ serviceName, icon: Icon, onGoToIntegrations }: { serviceName: string, icon: any, onGoToIntegrations: () => void }) => (
  <div className="h-[80vh] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
    <div className="relative group">
        <div className="absolute inset-0 bg-[#E50914] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>
        <div className="relative w-32 h-32 bg-zinc-900 rounded-full flex items-center justify-center mb-8 border border-zinc-800 shadow-2xl group-hover:border-[#E50914] transition-colors duration-300">
            <Lock className="w-12 h-12 text-[#E50914]" />
            <div className="absolute -bottom-2 -right-2 bg-black p-2 rounded-full border border-zinc-800">
                <Icon className="w-6 h-6 text-zinc-400" />
            </div>
        </div>
    </div>
    <h3 className="text-3xl font-black text-white mb-3 tracking-tight">Recurso Bloqueado</h3>
    <p className="text-zinc-400 max-w-md mb-8 text-lg leading-relaxed">
      Para acessar o <strong>{serviceName}</strong>, é necessário conectar a API correspondente no menu de Integrações.
    </p>
    <button 
      onClick={onGoToIntegrations}
      className="bg-white hover:bg-zinc-200 text-black px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg hover:scale-105 flex items-center gap-3"
    >
      <Layers className="w-5 h-5" />
      Conectar API Agora
    </button>
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Integrations State
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
      gemini: '',
      grok: '',
      pixabay: '',
      pexels: '',
      elevenlabs: ''
  });
  
  const [connectedStatus, setConnectedStatus] = useState({
      gemini: false,
      grok: false,
      pixabay: false,
      pexels: false,
      elevenlabs: false
  });

  const [connectingService, setConnectingService] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<{service: string, message: string} | null>(null);

  // Gemini Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Grok Image State
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageRatio, setImageRatio] = useState<AspectRatio>('1:1');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false); 
  const [imageIsLoading, setImageIsLoading] = useState(false); 
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [activeImage, setActiveImage] = useState<GeneratedImage | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Pixabay State
  const [pixabayQuery, setPixabayQuery] = useState('');
  const [pixabayType, setPixabayType] = useState<'image' | 'video'>('image');
  const [pixabayOrientation, setPixabayOrientation] = useState<Orientation>('horizontal');
  const [pixabayResults, setPixabayResults] = useState<StockMedia[]>([]);
  const [pixabayLoading, setPixabayLoading] = useState(false);

  // Pexels State
  const [pexelsQuery, setPexelsQuery] = useState('');
  const [pexelsType, setPexelsType] = useState<'image' | 'video'>('image');
  const [pexelsOrientation, setPexelsOrientation] = useState<Orientation>('horizontal');
  const [pexelsResults, setPexelsResults] = useState<StockMedia[]>([]);
  const [pexelsLoading, setPexelsLoading] = useState(false);

  // ElevenLabs State
  const [ttsText, setTtsText] = useState('');
  const [ttsVoice, setTtsVoice] = useState('21m00Tcm4TlvDq8ikWAM'); // Default Rachel
  const [ttsLoading, setTtsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Script to Video State (ROTEIRO)
  const [scriptTitle, setScriptTitle] = useState('');
  const [scriptPrompt, setScriptPrompt] = useState('');
  const [scriptDuration, setScriptDuration] = useState(''); 
  const [scriptDurationUnit, setScriptDurationUnit] = useState<'seconds' | 'minutes'>('minutes');
  const [scriptFormat, setScriptFormat] = useState<'9:16' | '16:9'>('16:9');
  
  // CONFIGURAÇÃO DE VÍDEO
  const [captionPosition, setCaptionPosition] = useState<'bottom' | 'center' | 'top'>('bottom');
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>('modern'); // Default modern

  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptStatus, setScriptStatus] = useState<string>('');
  const [activeProject, setActiveProject] = useState<VideoProject | null>(null);
  const [isPlayingProject, setIsPlayingProject] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

  // COPY YTB STATE
  const [ytbLink, setYtbLink] = useState('');
  const [ytbContext, setYtbContext] = useState('');
  const [isAnalyzingYtb, setIsAnalyzingYtb] = useState(false);
  const [ytbAnalysis, setYtbAnalysis] = useState<YtbAnalysis | null>(null);
  
  // Refs para Player e Gravador
  const videoPlayerRef = useRef<HTMLVideoElement>(null); // Ref para o elemento de vídeo OCULTO
  const imagePlayerRef = useRef<HTMLImageElement>(null); // Ref para o elemento de imagem OCULTO
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Library State
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'pdf'>('all');

  // Modal Preview State
  const [previewMedia, setPreviewMedia] = useState<StockMedia | null>(null);
  const [justSavedId, setJustSavedId] = useState<string | null>(null);
  const [projectSaved, setProjectSaved] = useState(false);

  // Load Data on Mount
  useEffect(() => {
      // Keys
      const savedKeys = localStorage.getItem('mega_hyper_keys');
      if (savedKeys) {
          try {
              const parsed = JSON.parse(savedKeys);
              setApiKeys({
                  gemini: parsed.gemini || '',
                  grok: parsed.grok || '',
                  pixabay: parsed.pixabay || '',
                  pexels: parsed.pexels || '',
                  elevenlabs: parsed.elevenlabs || ''
              });
              setConnectedStatus({
                  gemini: !!parsed.gemini,
                  grok: !!parsed.grok,
                  pixabay: !!parsed.pixabay,
                  pexels: !!parsed.pexels,
                  elevenlabs: !!parsed.elevenlabs
              });
          } catch (e) {
              console.error("Erro ao carregar chaves", e);
          }
      }

      // Library
      const savedLibrary = localStorage.getItem('mega_hyper_library');
      if (savedLibrary) {
          try {
              setLibraryItems(JSON.parse(savedLibrary));
          } catch (e) {
              console.error("Erro ao carregar biblioteca", e);
          }
      }
  }, []);

  // Save Library on Change
  useEffect(() => {
      localStorage.setItem('mega_hyper_library', JSON.stringify(libraryItems));
  }, [libraryItems]);

  useEffect(() => {
      if (activeTab === 'gemini') {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, [chatMessages, activeTab]);

  // --- PROJECT PLAYER LOGIC (Auto-Advance & Canvas Rendering) ---
  useEffect(() => {
      let timeoutId: ReturnType<typeof setTimeout>;

      const handleNextScene = () => {
          if (!activeProject) return;

          if (currentSceneIndex < activeProject.scenes.length - 1) {
              setCurrentSceneIndex(prev => prev + 1);
          } else {
              console.log("Fim do projeto. Parando player e gravação.");
              setIsPlayingProject(false);
              setCurrentSceneIndex(0);
              
              if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                  mediaRecorderRef.current.stop();
              }
          }
      };

      if (isPlayingProject && activeProject) {
          const scene = activeProject.scenes[currentSceneIndex];
          const audioEl = audioPlayerRef.current;
          const videoEl = videoPlayerRef.current;

          if (scene.mediaType === 'video' && videoEl) {
              videoEl.currentTime = 0;
              videoEl.play().catch(e => console.log("Erro play video (ignorar se hidden):", e)); 
          }

          if (audioEl && scene.audioUrl) {
              audioEl.onended = handleNextScene;
              audioEl.onerror = () => {
                  console.warn("Erro ao carregar áudio, usando fallback de tempo.");
                  timeoutId = setTimeout(handleNextScene, (scene.duration || 5) * 1000);
              };

              const playPromise = audioEl.play();
              if (playPromise !== undefined) {
                  playPromise.catch(error => {
                      console.warn("Autoplay de áudio falhou ou abortado:", error);
                      timeoutId = setTimeout(handleNextScene, (scene.duration || 5) * 1000);
                  });
              }
          } else {
              const duration = (scene.duration || 5) * 1000;
              timeoutId = setTimeout(handleNextScene, duration);
          }
      }

      return () => {
          if (timeoutId) clearTimeout(timeoutId);
          if (audioPlayerRef.current) {
              audioPlayerRef.current.onended = null;
              audioPlayerRef.current.onerror = null;
          }
      };
  }, [isPlayingProject, currentSceneIndex, activeProject, isRecording]);

  useEffect(() => {
      if (activeProject) {
          const scene = activeProject.scenes[currentSceneIndex];
          if (!scene) return;

          if (scene.mediaType === 'video' && videoPlayerRef.current) {
              videoPlayerRef.current.src = scene.mediaUrl || '';
              videoPlayerRef.current.load();
          } else if (imagePlayerRef.current) {
              imagePlayerRef.current.src = scene.mediaUrl || '';
          }
      }
  }, [currentSceneIndex, activeProject, isPlayingProject]);

  useEffect(() => {
      if (!activeProject || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = activeProject.format === '16:9' ? 1280 : 720;
      const height = activeProject.format === '16:9' ? 720 : 1280;
      
      canvas.width = width;
      canvas.height = height;

      let animationId: number;
      
      const render = () => {
          if (!activeProject) return;
          const scene = activeProject.scenes[currentSceneIndex];
          
          let source: HTMLVideoElement | HTMLImageElement | null = null;
          let isReady = false;
          
          if (scene.mediaType === 'video' && videoPlayerRef.current) {
              source = videoPlayerRef.current;
              isReady = videoPlayerRef.current.readyState >= 2; 
          } else if (imagePlayerRef.current) {
              source = imagePlayerRef.current;
              isReady = imagePlayerRef.current.complete && imagePlayerRef.current.naturalWidth > 0;
          }

          if (source && isReady) {
             try {
                 const sWidth = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
                 const sHeight = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;
                 
                 if (sWidth > 0 && sHeight > 0) {
                     const scale = Math.max(width / sWidth, height / sHeight);
                     const x = (width / 2) - (sWidth / 2) * scale;
                     const y = (height / 2) - (sHeight / 2) * scale;
                     ctx.drawImage(source, x, y, sWidth * scale, sHeight * scale);
                 }
             } catch (e) { }
          } else {
              if (!isReady && currentSceneIndex === 0) {
                  ctx.fillStyle = '#000000';
                  ctx.fillRect(0, 0, width, height);
              }
          }

          if (scene.narration) {
              const fontSize = activeProject.format === '16:9' ? 44 : 38;
              let textY = height - (height * 0.15); 
              if (captionPosition === 'center') textY = height / 2;
              if (captionPosition === 'top') textY = height * 0.15;

              ctx.textAlign = 'center';
              ctx.textBaseline = captionPosition === 'top' ? 'top' : (captionPosition === 'center' ? 'middle' : 'bottom');
              
              const text = scene.narration;
              const textX = width / 2;
              const maxWidth = width * 0.9;

              if (captionStyle === 'classic') {
                  ctx.font = `900 ${fontSize}px Inter, sans-serif`;
                  ctx.lineWidth = 8;
                  ctx.strokeStyle = '#000000';
                  ctx.strokeText(text, textX, textY, maxWidth);
                  ctx.fillStyle = '#FFD700'; // Ouro
                  ctx.fillText(text, textX, textY, maxWidth);

              } else if (captionStyle === 'modern') {
                  ctx.font = `800 ${fontSize}px Inter, sans-serif`;
                  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
                  ctx.shadowBlur = 4;
                  ctx.shadowOffsetX = 2;
                  ctx.shadowOffsetY = 2;
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillText(text, textX, textY, maxWidth);
                  ctx.shadowColor = "transparent";

              } else if (captionStyle === 'box') {
                  ctx.font = `bold ${fontSize}px monospace`;
                  const metrics = ctx.measureText(text);
                  const boxHeight = fontSize * 1.4;
                  const boxWidth = Math.min(metrics.width + 40, maxWidth + 40);
                  
                  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                  let boxY = textY;
                  if (captionPosition === 'bottom') boxY = textY - boxHeight + 10;
                  if (captionPosition === 'center') boxY = textY - (boxHeight/2);
                  
                  ctx.fillRect(textX - (boxWidth/2), boxY, boxWidth, boxHeight);
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillText(text, textX, textY, maxWidth);

              } else if (captionStyle === 'neon') {
                  ctx.font = `900 ${fontSize}px Inter, sans-serif`;
                  ctx.shadowColor = "#00FFFF";
                  ctx.shadowBlur = 15;
                  ctx.lineWidth = 3;
                  ctx.strokeStyle = '#FFFFFF';
                  ctx.strokeText(text, textX, textY, maxWidth);
                  ctx.fillStyle = '#00FFFF';
                  ctx.fillText(text, textX, textY, maxWidth);
                  ctx.shadowColor = "transparent";
                  
              } else if (captionStyle === 'comic') {
                  ctx.font = `900 ${fontSize + 4}px Impact, sans-serif`;
                  ctx.lineWidth = 6;
                  ctx.lineJoin = 'round';
                  ctx.strokeStyle = '#000000';
                  ctx.strokeText(text, textX, textY, maxWidth);
                  const gradient = ctx.createLinearGradient(textX, textY - fontSize, textX, textY);
                  gradient.addColorStop(0, '#FFEB3B');
                  gradient.addColorStop(1, '#FF9800');
                  ctx.fillStyle = gradient;
                  ctx.fillText(text, textX, textY, maxWidth);
                  
              } else if (captionStyle === 'minimal') {
                   ctx.font = `400 ${fontSize - 4}px Inter, sans-serif`;
                   const metrics = ctx.measureText(text);
                   const boxHeight = fontSize * 1.2;
                   const boxWidth = Math.min(metrics.width + 20, maxWidth + 20);
                   
                   ctx.fillStyle = "#000000";
                   let boxY = textY;
                   if (captionPosition === 'bottom') boxY = textY - boxHeight + 8;
                   if (captionPosition === 'center') boxY = textY - (boxHeight/2);
                   
                   ctx.fillRect(textX - (boxWidth/2), boxY, boxWidth, boxHeight);
                   ctx.fillStyle = '#FFFFFF';
                   ctx.fillText(text, textX, textY, maxWidth);
                   
              } else if (captionStyle === 'glitch') {
                   ctx.font = `900 ${fontSize}px "Courier New", monospace`;
                   ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
                   ctx.fillText(text, textX - 4, textY, maxWidth);
                   ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
                   ctx.fillText(text, textX + 4, textY, maxWidth);
                   ctx.fillStyle = '#FFFFFF';
                   ctx.fillText(text, textX, textY, maxWidth);
              }
          }

          if (isRecording) {
              ctx.fillStyle = '#E50914';
              ctx.beginPath();
              ctx.arc(width - 50, 50, 20, 0, Math.PI * 2);
              ctx.fill();
          }

          animationId = requestAnimationFrame(render);
      };

      render();

      return () => cancelAnimationFrame(animationId);
  }, [activeProject, currentSceneIndex, isRecording, captionPosition, captionStyle]);

  const handleDownloadFullVideo = async () => {
      if (!activeProject || !canvasRef.current || !audioPlayerRef.current) return;
      if (!confirm("Renderização iniciada!\n\nO vídeo será reproduzido do início ao fim para garantir a captura perfeita.\nPor favor, aguarde o término.")) return;

      if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioDestRef.current = audioContextRef.current.createMediaStreamDestination();
          const source = audioContextRef.current.createMediaElementSource(audioPlayerRef.current);
          source.connect(audioDestRef.current);
          source.connect(audioContextRef.current.destination);
      }

      if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
      }

      const canvasStream = canvasRef.current.captureStream(30); 
      const audioStream = audioDestRef.current!.stream;
      const combinedStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...audioStream.getAudioTracks()
      ]);

      const mimeTypes = ['video/mp4;codecs=h264,aac', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
      const selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
      const fileExtension = selectedMimeType.includes('mp4') ? 'mp4' : 'webm';

      const recorder = new MediaRecorder(combinedStream, {
          mimeType: selectedMimeType,
          videoBitsPerSecond: 8000000 // 8Mbps - Alta Qualidade
      });

      recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
              recordedChunksRef.current.push(e.data);
          }
      };

      recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: selectedMimeType || 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `${activeProject.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_completo.${fileExtension}`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 200);
          recordedChunksRef.current = [];
          setIsRecording(false);
          alert("Vídeo salvo com sucesso!");
      };

      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      setCurrentSceneIndex(0);
      setIsRecording(true);
      recorder.start();
      setTimeout(() => { setIsPlayingProject(true); }, 500);
  };

  const updateApiKey = (key: keyof ApiKeys, value: string) => {
      setApiKeys(prev => {
          const newKeys = { ...prev, [key]: value };
          localStorage.setItem('mega_hyper_keys', JSON.stringify(newKeys));
          return newKeys;
      });
  };

  const handleConnectKey = async (key: keyof ApiKeys) => {
      if (!apiKeys[key]) return;
      setConnectingService(key);
      setConnectionError(null);
      try {
          await verifyCredential(key as any, apiKeys[key]);
          const currentKeys = { ...apiKeys };
          localStorage.setItem('mega_hyper_keys', JSON.stringify(currentKeys));
          setConnectedStatus(prev => ({ ...prev, [key]: true }));
      } catch (err: any) {
          console.error("Falha ao conectar:", err);
          setConnectedStatus(prev => ({ ...prev, [key]: false }));
          setConnectionError({ service: key, message: err.message || "Não foi possível conectar. Verifique a chave." });
      } finally {
          setConnectingService(null);
      }
  };

  const handleDisconnectKey = (key: keyof ApiKeys) => {
      const newKeys = { ...apiKeys, [key]: '' };
      setApiKeys(newKeys);
      localStorage.setItem('mega_hyper_keys', JSON.stringify(newKeys));
      setConnectedStatus(prev => ({ ...prev, [key]: false }));
      setConnectionError(null);
  };

  const handleAnalyzeYtb = async () => {
      if (!ytbLink || !apiKeys.gemini) return;
      setIsAnalyzingYtb(true);
      setYtbAnalysis(null);
      try {
          const analysis = await analyzeYoutubeStrategy(apiKeys.gemini, ytbLink, ytbContext);
          setYtbAnalysis(analysis);
      } catch (err) {
          alert("Erro na análise. Verifique sua chave Gemini ou tente ser mais específico na descrição.");
      } finally {
          setIsAnalyzingYtb(false);
      }
  };

  const handleGenerateFromYtb = () => {
      if (!ytbAnalysis) return;
      setScriptTitle("Remix Viral: " + (ytbAnalysis.channelStyle || "Novo Projeto"));
      setScriptPrompt(ytbAnalysis.improvedConcept || "");
      setScriptDuration("60"); 
      setScriptDurationUnit("seconds");
      setScriptFormat("9:16");
      setActiveTab('script_generator');
  };

  const handleResetScript = () => {
      setScriptTitle('');
      setScriptPrompt('');
      setScriptDuration('');
      setActiveProject(null);
      setScriptStatus('');
      setIsGeneratingScript(false);
      setCurrentSceneIndex(0);
      setIsPlayingProject(false);
      setIsRecording(false);
      setProjectSaved(false);
  };

  const handleSaveProjectToLibrary = () => {
      if (!activeProject || projectSaved) return;
      const thumb = activeProject.scenes[0]?.mediaUrl || '';
      addToLibrary(thumb, 'video', activeProject.title, `PROJETO COMPLETO - ${activeProject.format}`);
      setProjectSaved(true);
      alert("Projeto salvo na biblioteca!");
  };

  const handleCreateScriptVideo = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!connectedStatus.gemini || !connectedStatus.elevenlabs || !connectedStatus.pexels) {
           alert("Erro: Para qualidade profissional, conecte Gemini, Pexels e ElevenLabs.");
           return;
      }
      if (!scriptPrompt || !scriptDuration) return;

      setIsGeneratingScript(true);
      setScriptStatus('Diretor de Arte AI Iniciando...');
      setActiveProject(null);
      setProjectSaved(false);

      try {
          setScriptStatus('Criando Roteiro e Definindo Estética Visual...');
          const { title: finalTitle, scenes } = await generateScriptStructure(apiKeys.gemini, scriptTitle, scriptPrompt, scriptDuration, scriptDurationUnit);
          
          if (!scriptTitle && finalTitle) {
              setScriptTitle(finalTitle);
          }
          if (!scenes || scenes.length === 0) throw new Error("Falha ao gerar cenas.");

          const processedScenes: ScriptScene[] = [];
          let successCount = 0;

          for (let i = 0; i < scenes.length; i++) {
              const scene = scenes[i];
              setScriptStatus(`Produzindo Cena ${i + 1}/${scenes.length}: ${scene.description.substring(0, 30)}...`);
              
              let audioUrl = '';
              try {
                  audioUrl = await generateElevenLabsAudio(apiKeys.elevenlabs, scene.narration, ttsVoice);
              } catch (err) {
                  console.error(`Erro audio cena ${i}:`, err);
              }

              let mediaUrl = '';
              let mediaType: 'video' | 'image' = 'video';
              const orientation = scriptFormat === '9:16' ? 'vertical' : 'horizontal';
              
              try {
                  let videos = await searchPexels(apiKeys.pexels, scene.searchTerm, 'video', orientation);
                  if (videos.length === 0) {
                       const simpleTerm = scene.searchTerm.split(' ')[0] || "cinematic";
                       console.warn(`Vídeo específico não encontrado para "${scene.searchTerm}", buscando genérico: ${simpleTerm}`);
                       videos = await searchPexels(apiKeys.pexels, `${simpleTerm} cinematic`, 'video', orientation);
                  }

                  if (videos.length > 0) {
                       mediaUrl = videos[0].downloadUrl; 
                       mediaType = 'video';
                       successCount++;
                  } else {
                       if (connectedStatus.grok) {
                           console.warn("Fallback para Grok Image");
                           const width = scriptFormat === '16:9' ? 1280 : 720;
                           const height = scriptFormat === '16:9' ? 720 : 1280;
                           mediaUrl = await generateImageWithGrok(apiKeys.grok, scene.description, width, height);
                           mediaType = 'image';
                           successCount += 0.5;
                       } else {
                           mediaUrl = ""; 
                       }
                  }
              } catch (err) {
                  console.error(`Erro visual cena ${i}:`, err);
              }
              processedScenes.push({ ...scene, id: i, audioUrl, mediaUrl, mediaType });
          }

          const score = Math.min(99, Math.max(70, Math.round((successCount / scenes.length) * 100)));
          const newProject: VideoProject = {
              id: crypto.randomUUID(),
              title: finalTitle || scriptTitle || "Projeto Sem Título",
              format: scriptFormat,
              scenes: processedScenes,
              score: score,
              createdAt: new Date().toISOString()
          };

          setActiveProject(newProject);
          setScriptStatus('Vídeo Finalizado!');
      } catch (error: any) {
          alert(`Erro na criação: ${error.message}`);
          setScriptStatus('Erro.');
      } finally {
          setIsGeneratingScript(false);
      }
  };

  const handleGlobalSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      if (query && activeTab !== 'library') {
          setActiveTab('library');
      }
  };

  const handleDownloadUrl = async (url: string, filename: string) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
    } catch (error) {
        console.error("Erro no download:", error);
        window.open(url, '_blank');
    }
  };

  const handleGenerateImage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!imagePrompt.trim() || !apiKeys.grok) return;
    setIsGeneratingImage(true);
    let width = 1024, height = 1024;
    if (imageRatio === '16:9') { width = 1280; height = 720; } 
    else if (imageRatio === '9:16') { width = 720; height = 1280; }
    try {
        const imageUrl = await generateImageWithGrok(apiKeys.grok, imagePrompt, width, height);
        const timestamp = new Date();
        const newImage = { url: imageUrl, prompt: imagePrompt, ratio: imageRatio, timestamp: timestamp };
        setGeneratedImages(prev => [newImage, ...prev]);
        setActiveImage(newImage);
        setImageIsLoading(true);
        addToLibrary(imageUrl, 'image', imagePrompt, imageRatio);
        setImagePrompt('');
    } catch (err) {
        alert("Erro ao gerar imagem. Verifique a chave API do Grok.");
    } finally {
        setIsGeneratingImage(false);
    }
  };

  const handlePixabaySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!pixabayQuery.trim()) return;
    setPixabayLoading(true);
    try {
        const results = await searchPixabay(apiKeys.pixabay, pixabayQuery, pixabayType, pixabayOrientation);
        setPixabayResults(results);
    } catch(err) {
        alert("Erro ao buscar no Pixabay. Verifique a chave API.");
    } finally {
        setPixabayLoading(false);
    }
  };

  const handlePexelsSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!pexelsQuery.trim()) return;
    setPexelsLoading(true);
    try {
        const results = await searchPexels(apiKeys.pexels, pexelsQuery, pexelsType, pexelsOrientation);
        setPexelsResults(results);
    } catch(err) {
        alert("Erro ao buscar no Pexels. Verifique a chave API.");
    } finally {
        setPexelsLoading(false);
    }
  };

  const handleGenerateTTS = async () => {
      if(!ttsText.trim() || !apiKeys.elevenlabs) return;
      setTtsLoading(true);
      try {
          const url = await generateElevenLabsAudio(apiKeys.elevenlabs, ttsText, ttsVoice);
          setAudioUrl(url);
          addToLibrary(url, 'audio', ttsText.substring(0, 30) + '...', 'TTS');
      } catch(err) {
          alert("Erro ao gerar áudio. Verifique a chave API.");
      } finally {
          setTtsLoading(false);
      }
  };

  const addToLibrary = (url: string, type: 'image' | 'video' | 'audio' | 'pdf', title: string, meta: string) => {
      const newItem: LibraryItem = {
          id: crypto.randomUUID(),
          type,
          url,
          title,
          meta,
          timestamp: new Date().toISOString()
      };
      setLibraryItems(prev => [newItem, ...prev]);
  };

  const handleSelectImage = (img: GeneratedImage) => {
      if (activeImage !== img) {
        setActiveImage(img);
        setImageIsLoading(true);
      }
  };

  const handleDeleteLibraryItem = (id: string) => {
      if (confirm('Tem certeza que deseja excluir este item da biblioteca? A ação é irreversível.')) {
          setLibraryItems(prev => prev.filter(item => item.id !== id));
          if (previewMedia && String(previewMedia.id) === id) {
              setPreviewMedia(null);
          }
      }
  };

  const handleSaveFromPreview = () => {
      if (!previewMedia) return;
      addToLibrary(
          previewMedia.downloadUrl, 
          previewMedia.type, 
          `${activeTab === 'pixabay' ? 'Pixabay' : 'Pexels'} - ${previewMedia.author}`, 
          `${activeTab === 'pixabay' ? pixabayOrientation : pexelsOrientation}`
      );
      setJustSavedId(String(previewMedia.id));
      setTimeout(() => setJustSavedId(null), 2000);
  };

  const openLibraryItemInPreview = (item: LibraryItem) => {
    setPreviewMedia({
        id: item.id,
        type: item.type as 'image' | 'video',
        url: item.url,
        downloadUrl: item.url,
        thumbnail: item.type === 'video' ? '' : item.url, 
        author: item.title,
        width: 0, 
        height: 0 
    });
  };

  const filteredLibrary = libraryItems.filter(item => {
    if (libraryFilter !== 'all' && item.type !== libraryFilter) return false;
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(query) || 
               item.type.toLowerCase().includes(query) ||
               (item.meta && item.meta.toLowerCase().includes(query));
    }
    return true;
  });

  const handleSendGemini = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!chatInput.trim() || !apiKeys.gemini) return;
      const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: new Date() };
      setChatMessages(prev => [...prev, userMsg]);
      setChatInput('');
      setChatLoading(true);
      try {
          const responseText = await sendMessageToGemini(apiKeys.gemini, userMsg.text);
          if (responseText) {
            setChatMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: new Date() }]);
          }
      } catch (err) {
          setChatMessages(prev => [...prev, { role: 'model', text: "Erro: Não foi possível conectar ao Gemini. Verifique sua chave API ou tente novamente.", timestamp: new Date() }]);
      } finally {
          setChatLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex font-inter relative">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {previewMedia && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setPreviewMedia(null)}>
            <div className="absolute top-4 right-4 z-[110]">
                 <button onClick={() => setPreviewMedia(null)} className="p-3 bg-zinc-900/50 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all border border-white/10">
                     <X className="w-6 h-6" />
                 </button>
            </div>
            
            <div className="relative max-w-7xl w-full h-full max-h-[90vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                <div className="relative group max-w-full max-h-full flex items-center justify-center">
                    
                    {previewMedia.type === 'video' ? (
                        <video src={previewMedia.downloadUrl} controls autoPlay loop className="max-h-[85vh] max-w-full rounded-lg shadow-2xl border border-zinc-800" />
                    ) : 
                    previewMedia.type === 'audio' ? (
                        <div className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-2xl flex flex-col items-center">
                             <div className="w-32 h-32 bg-zinc-800 rounded-full flex items-center justify-center mb-6 shadow-inner relative overflow-hidden group-hover:scale-105 transition-transform">
                                <Music className="w-16 h-16 text-zinc-400" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 animate-pulse"></div>
                             </div>
                             <h3 className="text-xl font-bold text-white mb-2 text-center break-all">{previewMedia.author}</h3>
                             <p className="text-zinc-500 text-sm mb-6 uppercase tracking-widest font-bold">Preview de Áudio</p>
                             <audio controls src={previewMedia.downloadUrl} className="w-full" autoPlay />
                        </div>
                    ) : (
                        <img src={previewMedia.downloadUrl} alt="Preview" className="max-h-[85vh] max-w-full rounded-lg shadow-2xl border border-zinc-800 object-contain" />
                    )}

                    <div className="absolute top-4 right-4 flex flex-col gap-3">
                        {activeTab === 'library' ? (
                            <button 
                                onClick={() => handleDeleteLibraryItem(String(previewMedia.id))}
                                className="p-3 rounded-full backdrop-blur-md border border-red-500/30 shadow-xl transition-all duration-300 transform hover:scale-110 bg-black/40 hover:bg-red-600 text-white"
                                title="Excluir da Biblioteca"
                            >
                                <Trash2 className="w-6 h-6" />
                            </button>
                        ) : (
                            <button 
                                onClick={handleSaveFromPreview}
                                className={`p-3 rounded-full backdrop-blur-md border border-white/20 shadow-xl transition-all duration-300 transform hover:scale-110 ${justSavedId === String(previewMedia.id) ? 'bg-red-500 border-red-500 text-white' : 'bg-black/40 hover:bg-black/70 text-white'}`}
                                title="Salvar na Biblioteca"
                            >
                                <Heart className={`w-6 h-6 ${justSavedId === String(previewMedia.id) ? 'fill-current' : ''}`} />
                            </button>
                        )}
                        
                        <button 
                            onClick={() => handleDownloadUrl(previewMedia.downloadUrl, `download-${previewMedia.id}`)}
                            className="p-3 rounded-full backdrop-blur-md border border-white/20 shadow-xl transition-all duration-300 transform hover:scale-110 bg-black/40 hover:bg-black/70 text-white"
                            title="Baixar arquivo"
                        >
                            <Download className="w-6 h-6" />
                        </button>
                    </div>

                    {previewMedia.type !== 'audio' && (
                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white text-sm flex items-center gap-2">
                            <User className="w-4 h-4" /> {previewMedia.author}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      <main className="flex-1 lg:ml-64 p-4 lg:p-10 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-white mb-2 tracking-tight">
              {activeTab === 'dashboard' && 'Central de Comando AI'}
              {activeTab === 'copy_ytb' && 'YouTube Copycat AI'} 
              {activeTab === 'script_generator' && 'Roteiro & Vídeo AI'}
              {activeTab === 'library' && 'Minha Biblioteca'}
              {activeTab === 'gemini' && 'Gemini Chatbot'}
              {activeTab === 'grok_images' && 'Grok Images'}
              {activeTab === 'pixabay' && 'Pixabay Search'}
              {activeTab === 'pexels' && 'Pexels Search'}
              {activeTab === 'text_audio' && 'Text to Audio'}
              {activeTab === 'integrations' && 'Conexões API'}
            </h1>
            <p className="text-zinc-400 text-sm">
                {activeTab === 'dashboard' && 'Monitore suas inteligências e performance em tempo real.'}
                {activeTab === 'copy_ytb' && 'Analise e recrie o estilo de sucesso de qualquer canal ou vídeo viral.'}
                {activeTab === 'script_generator' && 'Crie roteiros e gere vídeos automáticos com a combinação de todas as IAs.'}
                {activeTab === 'library' && 'Seu acervo completo de criações geradas por Inteligência Artificial.'}
                {activeTab === 'gemini' && 'Seu assistente de inteligência artificial pessoal do Google.'}
                {activeTab === 'grok_images' && 'Geração de imagens ultra-realistas com tecnologia xAI.'}
                {activeTab === 'pixabay' && 'Busque imagens e vídeos gratuitos de alta qualidade.'}
                {activeTab === 'pexels' && 'Explore o melhor banco de vídeos e fotos livres de direitos.'}
                {activeTab === 'text_audio' && 'Transforme texto em fala realista com ElevenLabs.'}
                {activeTab === 'integrations' && 'Gerencie suas chaves de acesso.'}
            </p>
          </div>
          
          <div className="flex items-center gap-6 flex-1 justify-end">
             <div className="relative w-full max-w-md hidden md:block">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Search className="h-5 w-5 text-zinc-500" />
                 </div>
                 <input 
                    type="search" 
                    value={searchQuery}
                    onChange={handleGlobalSearch}
                    placeholder="Buscar na biblioteca..." 
                    className="block w-full pl-10 pr-3 py-3 border border-zinc-700 rounded-full leading-5 bg-[#1f1f1f] text-zinc-300 placeholder-zinc-500 focus:outline-none focus:bg-black focus:border-[#E50914] focus:ring-0 sm:text-sm transition-colors"
                 />
             </div>

             <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-[#E50914] to-purple-600 px-4 py-1.5 rounded font-black text-white shadow-lg tracking-widest text-sm flex items-center justify-center hover:opacity-90 transition-opacity cursor-default">
                    PRO
                </div>
                <div className="w-10 h-10 rounded-full bg-[#1f1f1f] border border-zinc-700 flex items-center justify-center font-bold text-white shadow-lg">
                    <User className="w-5 h-5" />
                </div>
             </div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-10 animate-fade-in">
             <div className="relative w-full h-64 md:h-72 bg-gradient-to-r from-zinc-900 to-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800 flex items-center">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-1.2.1&auto=format&fit=crop&w=1567&q=80')] bg-cover bg-center opacity-30"></div>
                 <div className="relative z-10 px-8 md:px-12 max-w-2xl">
                    <span className="text-purple-500 font-bold tracking-widest uppercase text-xs mb-2 block">Novidade</span>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">POTÊNCIA <br/>CRIATIVA</h2>
                    <p className="text-lg text-zinc-300 mb-6">Integre Pixabay, Pexels e ElevenLabs ao seu fluxo de trabalho.</p>
                    <div className="flex gap-4">
                        <button onClick={() => setActiveTab('pixabay')} className="bg-white text-black px-6 py-2.5 rounded font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all">
                            <Search className="w-5 h-5" /> Buscar Mídia
                        </button>
                    </div>
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Itens na Biblioteca" value={libraryItems.length} icon={FolderOpen} trend="+12%" />
              <StatCard title="Imagens Geradas" value={generatedImages.length} icon={ImageIcon} />
              <StatCard title="Mensagens Gemini" value={chatMessages.length} icon={Sparkles} />
              <StatCard title="APIs Ativas" value={Object.values(connectedStatus).filter(Boolean).length} icon={Cpu} />
            </div>
          </div>
        )}

        {/* --- COPY YTB TAB --- */}
        {activeTab === 'copy_ytb' && (
            connectedStatus.gemini ? (
            <div className="max-w-4xl mx-auto animate-fade-in pb-10">
                <div className="bg-[#181818] rounded-xl border border-zinc-800 shadow-2xl overflow-hidden">
                    <div className="p-8 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-black relative">
                         <div className="absolute top-0 right-0 p-4 opacity-10">
                             <Youtube className="w-32 h-32 text-red-600" />
                         </div>
                         <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-3 relative z-10">
                             <Youtube className="w-8 h-8 text-[#E50914]" />
                             Engenharia Reversa YouTube
                         </h2>
                         <p className="text-zinc-400 max-w-xl relative z-10">
                             Cole o link de um vídeo ou canal. Nossa IA irá investigar o estilo, ritmo e estrutura, e permitirá que você crie uma versão 2.0 melhorada instantaneamente.
                         </p>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="space-y-4">
                             <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Link do Vídeo ou Canal</label>
                                <input 
                                    type="text" 
                                    value={ytbLink}
                                    onChange={(e) => setYtbLink(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-white placeholder-zinc-600 focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none transition-all font-medium"
                                />
                             </div>
                             
                             <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Contexto Adicional (Opcional)</label>
                                <textarea 
                                    value={ytbContext}
                                    onChange={(e) => setYtbContext(e.target.value)}
                                    placeholder="Ajude a IA: Sobre o que é o vídeo? Cole a transcrição ou descreva o nicho para uma análise mais precisa..."
                                    className="w-full h-24 bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-white placeholder-zinc-600 focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none transition-all text-sm resize-none"
                                />
                             </div>

                             <button 
                                onClick={handleAnalyzeYtb}
                                disabled={isAnalyzingYtb || !ytbLink}
                                className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-lg
                                    ${isAnalyzingYtb 
                                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                                        : 'bg-white text-black hover:bg-zinc-200'
                                    }`}
                             >
                                {isAnalyzingYtb ? (
                                    <><Loader2 className="animate-spin w-5 h-5" /> INVESTIGANDO ESTILO...</>
                                ) : (
                                    <><Search className="w-5 h-5" /> ANALISAR ESTRATÉGIA</>
                                )}
                             </button>
                        </div>

                        {ytbAnalysis && (
                            <div className="animate-in slide-in-from-bottom-5 duration-500 space-y-6 pt-6 border-t border-zinc-800">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-[#46d369]" />
                                    Blueprint Viral Detectado
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-zinc-900/50 p-5 rounded-lg border border-zinc-800">
                                        <div className="text-xs font-bold text-zinc-500 uppercase mb-2">Estilo do Canal</div>
                                        <div className="text-white font-medium">{ytbAnalysis.channelStyle}</div>
                                    </div>
                                    <div className="bg-zinc-900/50 p-5 rounded-lg border border-zinc-800">
                                        <div className="text-xs font-bold text-zinc-500 uppercase mb-2">Ritmo (Pacing)</div>
                                        <div className="text-white font-medium">{ytbAnalysis.pacing}</div>
                                    </div>
                                    <div className="bg-zinc-900/50 p-5 rounded-lg border border-zinc-800">
                                        <div className="text-xs font-bold text-zinc-500 uppercase mb-2">Estratégia de Hook</div>
                                        <div className="text-white font-medium">{ytbAnalysis.hookStrategy}</div>
                                    </div>
                                    <div className="bg-zinc-900/50 p-5 rounded-lg border border-zinc-800">
                                        <div className="text-xs font-bold text-zinc-500 uppercase mb-2">Vibe Visual</div>
                                        <div className="text-white font-medium">{ytbAnalysis.visualVibe}</div>
                                    </div>
                                </div>

                                <div className="bg-zinc-900/80 p-6 rounded-xl border border-[#E50914]/30 relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-64 h-64 bg-[#E50914]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                                     <div className="relative z-10">
                                         <h4 className="text-lg font-bold text-white mb-2">Conceito Melhorado (Versão 2.0)</h4>
                                         <p className="text-zinc-300 text-sm mb-6 leading-relaxed bg-black/30 p-4 rounded-lg border border-white/5">
                                             {ytbAnalysis.improvedConcept}
                                         </p>
                                         
                                         <button 
                                            onClick={handleGenerateFromYtb}
                                            className="w-full py-4 rounded-lg font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 bg-gradient-to-r from-[#E50914] to-red-600 text-white hover:shadow-lg hover:shadow-red-900/40 transition-all transform hover:scale-[1.01]"
                                         >
                                             <Clapperboard className="w-5 h-5 fill-current" />
                                             GERAR VÍDEO MELHORADO AGORA
                                         </button>
                                     </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            ) : (
                <LockedView serviceName="YouTube Copycat AI" icon={Youtube} onGoToIntegrations={() => setActiveTab('integrations')} />
            )
        )}

        {/* --- SCRIPT TO VIDEO TAB --- */}
        {activeTab === 'script_generator' && (
            connectedStatus.gemini ? (
            <div className="animate-fade-in flex flex-col xl:flex-row gap-8 h-full">
                <div className="w-full xl:w-1/3 flex flex-col gap-6">
                    <div className="bg-[#181818] p-8 rounded-2xl border border-zinc-800 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
                             <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center shadow-lg">
                                    <Clapperboard className="w-6 h-6 text-white" />
                                 </div>
                                 <div>
                                     <h2 className="text-2xl font-black text-white tracking-tight">Criar Roteiro</h2>
                                     <p className="text-xs text-zinc-500 font-medium tracking-wide">STUDIO AI GENERATOR</p>
                                 </div>
                             </div>
                             <div className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-400">
                                 PRO MODE
                             </div>
                        </div>

                        <div className="space-y-6">
                            
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 text-[#E50914]" /> Conceito & Narrativa
                                </label>
                                <div className="space-y-3">
                                    <input 
                                        type="text" 
                                        value={scriptTitle}
                                        onChange={(e) => setScriptTitle(e.target.value)}
                                        placeholder="Título do Projeto (Opcional)"
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3.5 text-white placeholder-zinc-600 focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none transition-all text-sm font-medium"
                                    />
                                    <textarea 
                                        value={scriptPrompt}
                                        onChange={(e) => setScriptPrompt(e.target.value)}
                                        placeholder="Descreva seu vídeo com detalhes. Ex: 'Um vídeo épico sobre a evolução da tecnologia, com cortes rápidos e futuristas...'"
                                        className="w-full h-28 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3.5 text-white placeholder-zinc-600 focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none resize-none transition-all text-sm leading-relaxed"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Duração</label>
                                    <div className="flex bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden focus-within:border-[#E50914] transition-colors">
                                        <input 
                                            type="number" 
                                            value={scriptDuration}
                                            onChange={(e) => setScriptDuration(e.target.value)}
                                            placeholder="30"
                                            className="w-full bg-transparent p-3 text-white outline-none text-sm font-bold text-center"
                                        />
                                        <select 
                                            value={scriptDurationUnit}
                                            onChange={(e) => setScriptDurationUnit(e.target.value as 'seconds' | 'minutes')}
                                            className="bg-zinc-800 text-zinc-400 text-xs font-bold px-2 outline-none border-l border-zinc-700"
                                        >
                                            <option value="seconds">SEG</option>
                                            <option value="minutes">MIN</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Formato</label>
                                    <select 
                                        value={scriptFormat}
                                        onChange={(e) => setScriptFormat(e.target.value as '9:16' | '16:9')}
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-white outline-none focus:border-[#E50914] transition-all text-sm font-bold appearance-none"
                                    >
                                        <option value="9:16">📱 Vertical (Reels/TikTok)</option>
                                        <option value="16:9">💻 Horizontal (YouTube)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                    <Type className="w-3 h-3" /> Legendas Profissionais
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { id: 'classic', label: 'Clássico', color: 'text-yellow-400' },
                                        { id: 'modern', label: 'Netflix', color: 'text-white' },
                                        { id: 'box', label: 'Box', color: 'text-white bg-black/50 px-1 rounded' },
                                        { id: 'neon', label: 'Neon', color: 'text-cyan-400 drop-shadow-md' },
                                        { id: 'comic', label: 'Comic', color: 'text-orange-500 font-black' },
                                        { id: 'minimal', label: 'Minimal', color: 'text-zinc-300 font-light' },
                                        { id: 'glitch', label: 'Glitch', color: 'text-red-500 tracking-widest' },
                                    ].map((style) => (
                                        <button
                                            key={style.id}
                                            onClick={() => setCaptionStyle(style.id as any)}
                                            className={`h-10 rounded-lg border text-[10px] font-bold transition-all ${captionStyle === style.id ? 'border-[#E50914] bg-zinc-800 text-white' : 'border-zinc-800 bg-zinc-900/30 text-zinc-500 hover:border-zinc-700'}`}
                                        >
                                            <span className={style.color}>{style.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                     {['top', 'center', 'bottom'].map((pos) => (
                                         <button 
                                            key={pos}
                                            onClick={() => setCaptionPosition(pos as any)}
                                            className={`py-1.5 rounded border text-[10px] uppercase font-bold transition-all ${captionPosition === pos ? 'bg-zinc-700 text-white border-zinc-600' : 'bg-transparent text-zinc-600 border-zinc-800'}`}
                                         >
                                             {pos === 'top' ? 'Topo' : pos === 'center' ? 'Centro' : 'Base'}
                                         </button>
                                     ))}
                                </div>
                            </div>

                             <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                    <Mic className="w-3 h-3" /> Narração (ElevenLabs)
                                </label>
                                <select value={ttsVoice} onChange={(e) => setTtsVoice(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-white focus:border-[#E50914] outline-none text-sm appearance-none">
                                    <option value="21m00Tcm4TlvDq8ikWAM">Rachel (Feminina - Americana)</option>
                                    <option value="ErXwobaYiN019PkySvjV">Antoni (Masculina - Americana)</option>
                                    <option value="pNInz6obpgDQGcFmaJgB">Adam (Narrador Profundo)</option>
                                </select>
                             </div>

                            <div className="pt-2 flex flex-col gap-3">
                                <button 
                                    onClick={handleCreateScriptVideo}
                                    disabled={isGeneratingScript || !scriptPrompt || !scriptDuration}
                                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl
                                        ${isGeneratingScript 
                                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                                            : 'bg-gradient-to-r from-[#E50914] to-red-700 text-white hover:shadow-red-900/30 hover:brightness-110'
                                        }`}
                                >
                                    {isGeneratingScript ? (
                                        <><Loader2 className="animate-spin w-5 h-5" /> CRIANDO MÁGICA...</>
                                    ) : (
                                        <><Play className="fill-current w-5 h-5" /> INICIAR CRIAÇÃO</>
                                    )}
                                </button>

                                <button 
                                    onClick={handleResetScript}
                                    disabled={isGeneratingScript}
                                    className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all border border-zinc-800"
                                >
                                    <RotateCcw className="w-3 h-3" /> Novo Projeto
                                </button>
                            </div>

                            {!connectedStatus.gemini && <p className="text-[10px] text-center text-red-500/80">*Conecte as APIs na aba Integrações para usar.</p>}
                        </div>
                    </div>
                </div>

                <div className="w-full xl:w-2/3 flex flex-col bg-black rounded-2xl border border-zinc-800 overflow-hidden relative shadow-2xl">
                    {activeProject ? (
                        <div className="h-full flex flex-col">
                             <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden group">
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <canvas 
                                        ref={canvasRef}
                                        className={`max-w-full max-h-full ${activeProject.format === '9:16' ? 'aspect-[9/16]' : 'aspect-video'} object-contain shadow-2xl z-20 relative`}
                                    />
    
                                    <video 
                                        ref={videoPlayerRef}
                                        className="absolute top-0 left-0 w-full h-full object-contain -z-10 opacity-0" 
                                        crossOrigin="anonymous" 
                                        playsInline 
                                        muted 
                                        loop 
                                    />
                                    <img 
                                        ref={imagePlayerRef} 
                                        className="absolute top-0 left-0 w-full h-full object-contain -z-10 opacity-0" 
                                        crossOrigin="anonymous" 
                                        alt="source" 
                                    />

                                    <div className="absolute top-6 right-6 z-40 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                         <button 
                                            onClick={handleDownloadFullVideo}
                                            disabled={isRecording}
                                            className="bg-black/60 hover:bg-[#E50914] text-white p-3.5 rounded-full backdrop-blur-md border border-white/10 transition-all shadow-xl hover:scale-110"
                                            title="Baixar Vídeo Renderizado"
                                         >
                                            {isRecording ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                         </button>
                                    </div>
                                    
                                    <div className="absolute top-6 left-6 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                         <button 
                                            onClick={handleSaveProjectToLibrary}
                                            disabled={projectSaved}
                                            className={`p-3.5 rounded-full backdrop-blur-md border border-white/10 transition-all shadow-xl hover:scale-110 ${projectSaved ? 'bg-green-500/80 text-white' : 'bg-black/60 hover:bg-pink-600 text-white'}`}
                                            title="Salvar na Biblioteca"
                                         >
                                            {projectSaved ? <CheckCircle2 className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                                         </button>
                                    </div>
                                </div>
                                
                                <audio 
                                    ref={audioPlayerRef}
                                    src={activeProject.scenes[currentSceneIndex]?.audioUrl}
                                    className="hidden"
                                    crossOrigin="anonymous"
                                />

                                {!isRecording && (
                                    <>
                                        <div 
                                            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors cursor-pointer z-30"
                                            onClick={() => setIsPlayingProject(!isPlayingProject)}
                                        >
                                            {!isPlayingProject && (
                                                <div className="bg-white/10 p-8 rounded-full border border-white/20 backdrop-blur-md transform hover:scale-110 transition-transform shadow-2xl group-hover:bg-[#E50914]/80 group-hover:border-[#E50914]">
                                                    <Play className="w-12 h-12 text-white fill-current ml-2" />
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                                
                                {isRecording && (
                                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-5 py-2 rounded-full text-xs font-black animate-pulse flex items-center gap-3 z-50 shadow-red-900/50 shadow-2xl border border-red-400/50 backdrop-blur-sm">
                                        <div className="w-2.5 h-2.5 bg-white rounded-full shadow"></div> REC
                                    </div>
                                )}
                             </div>

                             <div className="h-auto bg-[#181818] border-t border-zinc-800 p-6 flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <button 
                                            onClick={() => setIsPlayingProject(!isPlayingProject)}
                                            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-colors shadow-lg"
                                            disabled={isRecording}
                                        >
                                            {isPlayingProject ? <Pause className="fill-current w-5 h-5" /> : <Play className="fill-current ml-1 w-5 h-5" />}
                                        </button>
                                        <div>
                                            <h3 className="font-bold text-white text-base">Cena {currentSceneIndex + 1} <span className="text-zinc-600">/</span> {activeProject.scenes.length}</h3>
                                            <p className="text-xs text-zinc-500 truncate max-w-[300px] font-medium mt-0.5">{activeProject.scenes[currentSceneIndex]?.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Qualidade IA</p>
                                            <div className="flex items-center gap-2 text-[#46d369] font-black text-2xl justify-end">
                                                <Sparkles className="w-5 h-5" /> {activeProject.score}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={handleDownloadFullVideo}
                                    disabled={isRecording}
                                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all ${isRecording ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-[#E50914] hover:bg-[#b20710] text-white shadow-lg hover:shadow-red-900/20'}`}
                                >
                                    {isRecording ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> RENDERIZANDO VÍDEO FINAL...</>
                                    ) : (
                                        <><VideoIcon className="w-5 h-5" /> BAIXAR VÍDEO COMPLETO (MP4)</>
                                    )}
                                </button>
                             </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-700 p-12 text-center relative">
                             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-50"></div>
                            {isGeneratingScript ? (
                                <div className="flex flex-col items-center gap-6 animate-pulse z-10">
                                    <div className="w-20 h-20 rounded-2xl bg-[#E50914]/10 flex items-center justify-center border border-[#E50914]/20">
                                        <Film className="w-10 h-10 text-[#E50914]" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white mb-2">PRODUZINDO FILME</h3>
                                        <p className="max-w-md text-zinc-400 text-sm font-medium">{scriptStatus}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="z-10 flex flex-col items-center">
                                    <Clapperboard className="w-24 h-24 mb-6 opacity-20" />
                                    <h3 className="text-2xl font-bold text-zinc-500 mb-2">Estúdio Vazio</h3>
                                    <p className="text-zinc-600 max-w-xs">Configure seu roteiro no painel lateral para iniciar a produção automática.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            ) : (
                <LockedView serviceName="Roteiro & Vídeo AI" icon={Clapperboard} onGoToIntegrations={() => setActiveTab('integrations')} />
            )
        )}

        {activeTab === 'library' && (
             <div className="animate-fade-in space-y-8">
                 <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                     <div className="flex gap-2">
                        {['all', 'image', 'video', 'audio'].map(type => (
                            <button
                                key={type}
                                onClick={() => setLibraryFilter(type as any)}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${libraryFilter === type ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-white'}`}
                            >
                                {type === 'all' ? 'Tudo' : type}
                            </button>
                        ))}
                     </div>
                 </div>

                 {filteredLibrary.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredLibrary.map(item => (
                            <div 
                                key={item.id}
                                onClick={() => openLibraryItemInPreview(item)}
                                className="group relative aspect-square bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 cursor-pointer hover:border-zinc-500 transition-all shadow-lg"
                            >
                                 {item.type === 'video' ? (
                                     <div className="w-full h-full relative">
                                        <video src={item.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted loop onMouseOver={e => e.currentTarget.play()} onMouseOut={e => {e.currentTarget.pause(); e.currentTarget.currentTime = 0;}} />
                                        <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full"><Video className="w-3 h-3 text-white"/></div>
                                     </div>
                                 ) : item.type === 'audio' ? (
                                     <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 group-hover:text-white transition-colors bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 to-black">
                                         <Music className="w-12 h-12 mb-3" />
                                         <span className="text-[10px] uppercase font-bold tracking-widest">Audio Track</span>
                                     </div>
                                 ) : (
                                     <img src={item.url} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                 )}
                                 
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-4">
                                     <p className="text-white text-xs font-bold truncate mb-0.5">{item.title}</p>
                                     <div className="flex items-center justify-between">
                                        <p className="text-zinc-400 text-[10px] uppercase">{item.meta}</p>
                                        <div className="flex gap-2">
                                            <button onClick={(e) => {e.stopPropagation(); handleDeleteLibraryItem(item.id)}} className="text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                     </div>
                                 </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-96 text-zinc-700">
                        <FolderOpen className="w-24 h-24 mb-4 opacity-20" />
                        <p className="text-lg font-medium">Sua biblioteca está vazia.</p>
                        <p className="text-sm">Gere conteúdo ou salve mídias para vê-las aqui.</p>
                    </div>
                )}
             </div>
        )}

        {activeTab === 'gemini' && (
            connectedStatus.gemini ? (
            <div className="h-[calc(100vh-140px)] flex flex-col bg-[#181818] rounded-xl border border-zinc-800 overflow-hidden shadow-2xl animate-fade-in">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-zinc-900/30">
                    {chatMessages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                                <Sparkles className="w-10 h-10 text-zinc-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Google Gemini AI</h3>
                            <p className="text-sm text-zinc-500 max-w-sm text-center">Seu assistente inteligente. Peça ajuda para roteiros, ideias, traduções e muito mais.</p>
                        </div>
                    )}
                    {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                            <div className={`max-w-[80%] p-5 rounded-2xl shadow-lg ${msg.role === 'user' ? 'bg-[#E50914] text-white rounded-br-none' : 'bg-[#2a2a2a] text-zinc-200 rounded-bl-none border border-zinc-700'}`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {chatLoading && (
                         <div className="flex justify-start">
                            <div className="bg-[#2a2a2a] p-4 rounded-2xl rounded-bl-none flex gap-2 items-center border border-zinc-700">
                                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-100"></span>
                                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-200"></span>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendGemini} className="p-4 border-t border-zinc-800 bg-[#181818] flex gap-4">
                    <input 
                        type="text" 
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder="Digite sua mensagem..." 
                        className="flex-1 bg-black border border-zinc-700 rounded-full px-6 py-4 text-white placeholder-zinc-500 focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none transition-all shadow-inner"
                    />
                    <button type="submit" disabled={!chatInput.trim() || chatLoading} className="bg-white hover:bg-zinc-200 text-black p-4 rounded-full disabled:opacity-50 transition-all shadow-lg hover:scale-105 active:scale-95">
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
            ) : (
                <LockedView serviceName="Gemini Chat" icon={Sparkles} onGoToIntegrations={() => setActiveTab('integrations')} />
            )
        )}

        {activeTab === 'grok_images' && (
            connectedStatus.grok ? (
            <div className="animate-fade-in space-y-8">
                <div className="bg-gradient-to-r from-zinc-900 to-black p-8 rounded-2xl border border-zinc-800 shadow-2xl">
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 w-full space-y-3">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" /> Prompt da Imagem
                            </label>
                            <input 
                                type="text" 
                                value={imagePrompt} 
                                onChange={e => setImagePrompt(e.target.value)}
                                placeholder="Descreva a imagem que deseja criar..." 
                                className="w-full bg-black/50 border border-zinc-700 rounded-xl p-4 text-white focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none transition-all font-medium"
                            />
                        </div>
                        <div className="w-full md:w-48 space-y-3">
                             <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Formato</label>
                             <select value={imageRatio} onChange={(e) => setImageRatio(e.target.value as any)} className="w-full bg-black/50 border border-zinc-700 rounded-xl p-4 text-white outline-none cursor-pointer hover:border-zinc-600 transition-colors appearance-none">
                                 <option value="1:1">1:1 (Quadrado)</option>
                                 <option value="16:9">16:9 (Horizontal)</option>
                                 <option value="9:16">9:16 (Vertical)</option>
                             </select>
                        </div>
                        <button 
                            onClick={handleGenerateImage} 
                            disabled={isGeneratingImage || !imagePrompt} 
                            className="w-full md:w-auto px-8 py-4 bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-wider rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                        >
                            {isGeneratingImage ? <Loader2 className="animate-spin w-5 h-5" /> : <Wand2 className="w-5 h-5" />}
                            CRIAR
                        </button>
                    </div>
                </div>

                {generatedImages.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {generatedImages.map((img, idx) => (
                            <div key={idx} onClick={() => handleSelectImage(img)} className="group relative rounded-2xl overflow-hidden border border-zinc-800 aspect-square cursor-pointer bg-zinc-900 shadow-xl">
                                <img src={img.url} alt={img.prompt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                                    <div className="flex gap-4">
                                        <button onClick={(e) => {e.stopPropagation(); handleDownloadUrl(img.url, `grok-${idx}.png`)}} className="p-4 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-lg">
                                            <Download className="w-6 h-6" />
                                        </button>
                                         <button onClick={(e) => {e.stopPropagation(); addToLibrary(img.url, 'image', img.prompt, img.ratio); alert('Salvo na Biblioteca!')}} className="p-4 bg-[#E50914] text-white rounded-full hover:scale-110 transition-transform shadow-lg">
                                            <Heart className="w-6 h-6 fill-current" />
                                        </button>
                                    </div>
                                    <p className="px-6 text-center text-xs text-white/80 font-medium line-clamp-2">{img.prompt}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            ) : (
                <LockedView serviceName="Grok Images" icon={ImageIcon} onGoToIntegrations={() => setActiveTab('integrations')} />
            )
        )}

        {(activeTab === 'pixabay') && (
            connectedStatus.pixabay ? (
            <div className="animate-fade-in space-y-8">
                 <div className="bg-[#181818] p-8 rounded-2xl border border-zinc-800 shadow-2xl">
                    <form onSubmit={handlePixabaySearch} className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 w-full space-y-3">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <Search className="w-4 h-4" /> Buscar em Pixabay
                            </label>
                            <input 
                                type="text" 
                                value={pixabayQuery} 
                                onChange={e => setPixabayQuery(e.target.value)}
                                placeholder="Ex: Nature, City, Business..." 
                                className="w-full bg-black/50 border border-zinc-700 rounded-xl p-4 text-white focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none transition-all font-medium"
                            />
                        </div>
                        <div className="w-full md:w-32 space-y-3">
                             <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tipo</label>
                             <select 
                                value={pixabayType} 
                                onChange={(e) => setPixabayType(e.target.value as any)} 
                                className="w-full bg-black/50 border border-zinc-700 rounded-xl p-4 text-white outline-none cursor-pointer appearance-none"
                             >
                                 <option value="image">Imagem</option>
                                 <option value="video">Vídeo</option>
                             </select>
                        </div>
                         <div className="w-full md:w-40 space-y-3">
                             <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Orientação</label>
                             <select 
                                value={pixabayOrientation} 
                                onChange={(e) => setPixabayOrientation(e.target.value as any)} 
                                className="w-full bg-black/50 border border-zinc-700 rounded-xl p-4 text-white outline-none cursor-pointer appearance-none"
                             >
                                 <option value="horizontal">Horizontal</option>
                                 <option value="vertical">Vertical</option>
                                 <option value="all">Todas</option>
                             </select>
                        </div>
                        <button 
                            type="submit"
                            disabled={pixabayLoading} 
                            className="w-full md:w-auto px-8 py-4 bg-[#E50914] hover:bg-[#b20710] text-white font-black uppercase tracking-wider rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-red-900/30 transition-all"
                        >
                            {pixabayLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
                            BUSCAR
                        </button>
                    </form>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                     {pixabayResults.map((item) => (
                        <div key={item.id} onClick={() => setPreviewMedia(item)} className="group relative aspect-[9/16] md:aspect-square bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 cursor-pointer shadow-lg hover:shadow-2xl transition-all">
                             <img src={item.thumbnail || item.url} alt="Result" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                             {item.type === 'video' && (
                                 <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full z-10">
                                     <Video className="w-3 h-3 text-white" />
                                 </div>
                             )}
                             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                 <span className="text-white text-xs font-bold uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full border border-white/20">Preview</span>
                             </div>
                        </div>
                     ))}
                 </div>
            </div>
            ) : (
                <LockedView serviceName="Pixabay Search" icon={Search} onGoToIntegrations={() => setActiveTab('integrations')} />
            )
        )}

        {(activeTab === 'pexels') && (
            connectedStatus.pexels ? (
            <div className="animate-fade-in space-y-8">
                 <div className="bg-[#181818] p-8 rounded-2xl border border-zinc-800 shadow-2xl">
                    <form onSubmit={handlePexelsSearch} className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 w-full space-y-3">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <Camera className="w-4 h-4" /> Buscar em Pexels
                            </label>
                            <input 
                                type="text" 
                                value={pexelsQuery} 
                                onChange={e => setPexelsQuery(e.target.value)}
                                placeholder="Ex: Nature, City, Business..." 
                                className="w-full bg-black/50 border border-zinc-700 rounded-xl p-4 text-white focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none transition-all font-medium"
                            />
                        </div>
                        <div className="w-full md:w-32 space-y-3">
                             <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tipo</label>
                             <select 
                                value={pexelsType} 
                                onChange={(e) => setPexelsType(e.target.value as any)} 
                                className="w-full bg-black/50 border border-zinc-700 rounded-xl p-4 text-white outline-none cursor-pointer appearance-none"
                             >
                                 <option value="image">Imagem</option>
                                 <option value="video">Vídeo</option>
                             </select>
                        </div>
                         <div className="w-full md:w-40 space-y-3">
                             <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Orientação</label>
                             <select 
                                value={pexelsOrientation} 
                                onChange={(e) => setPexelsOrientation(e.target.value as any)} 
                                className="w-full bg-black/50 border border-zinc-700 rounded-xl p-4 text-white outline-none cursor-pointer appearance-none"
                             >
                                 <option value="horizontal">Horizontal</option>
                                 <option value="vertical">Vertical</option>
                                 <option value="all">Todas</option>
                             </select>
                        </div>
                        <button 
                            type="submit"
                            disabled={pexelsLoading} 
                            className="w-full md:w-auto px-8 py-4 bg-[#E50914] hover:bg-[#b20710] text-white font-black uppercase tracking-wider rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-red-900/30 transition-all"
                        >
                            {pexelsLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
                            BUSCAR
                        </button>
                    </form>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                     {pexelsResults.map((item) => (
                        <div key={item.id} onClick={() => setPreviewMedia(item)} className="group relative aspect-[9/16] md:aspect-square bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 cursor-pointer shadow-lg hover:shadow-2xl transition-all">
                             <img src={item.thumbnail || item.url} alt="Result" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                             {item.type === 'video' && (
                                 <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full z-10">
                                     <Video className="w-3 h-3 text-white" />
                                 </div>
                             )}
                             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                 <span className="text-white text-xs font-bold uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full border border-white/20">Preview</span>
                             </div>
                        </div>
                     ))}
                 </div>
            </div>
            ) : (
                <LockedView serviceName="Pexels Search" icon={Camera} onGoToIntegrations={() => setActiveTab('integrations')} />
            )
        )}

        {activeTab === 'text_audio' && (
             connectedStatus.elevenlabs ? (
             <div className="max-w-3xl mx-auto animate-fade-in space-y-8">
                 <div className="bg-[#181818] p-8 rounded-2xl border border-zinc-800 shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                     
                     <div className="flex items-center gap-3 mb-6 relative z-10">
                         <div className="p-3 bg-orange-500/20 text-orange-500 rounded-xl">
                            <Mic className="w-6 h-6" />
                         </div>
                         <h2 className="text-2xl font-black text-white">Estúdio de Voz Neural</h2>
                     </div>

                     <div className="space-y-6 relative z-10">
                         <div className="space-y-2">
                             <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Seu Texto</label>
                             <textarea 
                                value={ttsText}
                                onChange={e => setTtsText(e.target.value)}
                                placeholder="Digite o texto que você quer transformar em fala realista..."
                                className="w-full h-40 bg-black/50 border border-zinc-700 rounded-xl p-5 text-white placeholder-zinc-600 focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none transition-all resize-none text-lg leading-relaxed"
                             />
                         </div>

                         <div className="space-y-2">
                             <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Voz AI</label>
                             <select value={ttsVoice} onChange={e => setTtsVoice(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-xl p-4 text-white outline-none cursor-pointer">
                                <option value="21m00Tcm4TlvDq8ikWAM">Rachel (Feminina - Americana)</option>
                                <option value="ErXwobaYiN019PkySvjV">Antoni (Masculina - Americana)</option>
                                <option value="pNInz6obpgDQGcFmaJgB">Adam (Narrador Profundo)</option>
                             </select>
                         </div>

                         <button 
                            onClick={handleGenerateTTS} 
                            disabled={ttsLoading || !ttsText} 
                            className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:scale-[1.01] transition-all"
                        >
                            {ttsLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                            GERAR ÁUDIO
                        </button>
                     </div>
                 </div>

                 {audioUrl && (
                     <div className="bg-[#1f1f1f] p-6 rounded-xl border border-zinc-700 shadow-xl flex flex-col items-center animate-in slide-in-from-bottom-4">
                         <h3 className="text-white font-bold mb-4">Resultado Gerado</h3>
                         <audio controls src={audioUrl} className="w-full" autoPlay />
                         <div className="flex gap-4 mt-6">
                             <button onClick={() => handleDownloadUrl(audioUrl!, 'audio.mp3')} className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-white text-sm font-bold transition-colors">
                                 Download
                             </button>
                             <button onClick={() => {addToLibrary(audioUrl!, 'audio', ttsText.substring(0, 20), 'TTS'); alert('Salvo!')}} className="px-6 py-2 bg-[#E50914] hover:bg-[#b20710] rounded-full text-white text-sm font-bold transition-colors">
                                 Salvar na Lib
                             </button>
                         </div>
                     </div>
                 )}
             </div>
             ) : (
                <LockedView serviceName="Text to Audio (ElevenLabs)" icon={Mic} onGoToIntegrations={() => setActiveTab('integrations')} />
             )
        )}

        {activeTab === 'integrations' && (
          <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
            <div className="bg-[#181818] p-8 rounded-2xl border border-zinc-800 shadow-2xl">
              <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <Layers className="w-8 h-8 text-[#E50914]" />
                Conexões & API Keys
              </h2>
              <p className="text-zinc-400 mb-8">
                Gerencie suas chaves de API para desbloquear todos os recursos da MEGA HYPER AI.
                Suas chaves são salvas localmente no seu navegador.
              </p>

              <div className="space-y-4">
                {[
                  { id: 'gemini', name: 'Google Gemini AI', icon: Sparkles, desc: 'Chatbot, Análise de Roteiros, Estratégia YouTube' },
                  { id: 'grok', name: 'xAI Grok (Pollinations)', icon: ImageIcon, desc: 'Geração de Imagens Ultra-realistas' },
                  { id: 'pixabay', name: 'Pixabay', icon: Search, desc: 'Busca de Imagens e Vídeos Stock (Gratuito)' },
                  { id: 'pexels', name: 'Pexels', icon: Camera, desc: 'Busca de Vídeos Cinematográficos 4K' },
                  { id: 'elevenlabs', name: 'ElevenLabs', icon: Mic, desc: 'Geração de Voz Neural (Text-to-Speech)' },
                ].map((service) => (
                  <div key={service.id} className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-3 rounded-lg ${connectedStatus[service.id as keyof ApiKeys] ? 'bg-green-500/20 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
                        <service.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white flex items-center gap-2">
                          {service.name}
                          {connectedStatus[service.id as keyof ApiKeys] && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        </h3>
                        <p className="text-xs text-zinc-500">{service.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                       {connectedStatus[service.id as keyof ApiKeys] ? (
                           <div className="flex items-center gap-2 w-full md:w-auto">
                               <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-xs font-bold flex items-center gap-2 flex-1 md:flex-none justify-center">
                                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> CONECTADO
                               </div>
                               <button 
                                  onClick={() => handleDisconnectKey(service.id as keyof ApiKeys)}
                                  className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                                  title="Desconectar"
                               >
                                   <XCircle className="w-5 h-5" />
                               </button>
                           </div>
                       ) : (
                           <div className="flex gap-2 w-full md:w-auto">
                               <input 
                                  type="password" 
                                  value={apiKeys[service.id as keyof ApiKeys]}
                                  onChange={(e) => updateApiKey(service.id as keyof ApiKeys, e.target.value)}
                                  placeholder={`API Key ${service.name}`}
                                  className="flex-1 md:w-64 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#E50914] outline-none"
                               />
                               <button 
                                  onClick={() => handleConnectKey(service.id as keyof ApiKeys)}
                                  disabled={connectingService === service.id || !apiKeys[service.id as keyof ApiKeys]}
                                  className="bg-white hover:bg-zinc-200 disabled:opacity-50 text-black px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider min-w-[100px] flex items-center justify-center"
                               >
                                  {connectingService === service.id ? <Loader2 className="animate-spin w-4 h-4" /> : 'Conectar'}
                               </button>
                           </div>
                       )}
                    </div>
                  </div>
                ))}
              </div>
              
              {connectionError && (
                  <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-bottom-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p><strong>Erro na conexão com {connectionError.service}:</strong> {connectionError.message}</p>
                  </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;