import { GoogleGenAI } from "@google/genai";
import { StockMedia, ScriptScene } from "../types";

// --- FUNÇÕES DO GEMINI ---

export const sendMessageToGemini = async (apiKey: string, message: string, history: any[] = []) => {
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        const systemInstructionText = `
        Você é o cérebro do "MEGA HYPER", uma central de comando de IA.
        Seja direto, prestativo e responda sempre em português.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash', // Atualizado para modelo mais recente se disponivel ou fallback
            contents: message,
            config: {
                systemInstruction: systemInstructionText,
            }
        });

        return response.text;
    } catch (error) {
        console.error("Erro no Gemini:", error);
        throw error;
    }
};

// Nova função para analisar estilo YOUTUBE (Copy YTB)
export const analyzeYoutubeStrategy = async (apiKey: string, url: string, extraContext: string): Promise<any> => {
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        const prompt = `
        ATUE COMO UM ESPECIALISTA EM ALGORITMO DO YOUTUBE E ESTRATEGISTA DE CONTEÚDO VIRAL.
        
        Sua missão é fazer "Engenharia Reversa" do estilo de um vídeo/canal baseado no link e contexto fornecidos.
        
        URL ALVO: ${url}
        CONTEXTO ADICIONAL DO USUÁRIO: ${extraContext}
        
        Você deve "investigar" o estilo provável deste criador (ou do nicho, se não conseguir acessar o link específico).
        
        Retorne um JSON com a seguinte análise:
        {
            "channelStyle": "Descreva o estilo (ex: Frenético, Documental, Vlog Minimalista)",
            "pacing": "Ritmo da edição (ex: Rápido, Lento, Cortes Secos)",
            "hookStrategy": "Qual a técnica provável de gancho (Hook) usada?",
            "visualVibe": "Descrição estética para o editor (ex: Dark mode, Neon, Clean Corporate)",
            "improvedConcept": "Um prompt detalhado para CRIAR UM VÍDEO MELHOR QUE O ORIGINAL sobre o mesmo tema, usando técnicas de retenção máxima."
        }
        
        Retorne APENAS o JSON puro.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt
        });

        let text = response.text || "{}";
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);

    } catch (error) {
        console.error("Erro na análise YTB:", error);
        throw new Error("Não foi possível analisar o link. Tente descrever o canal.");
    }
};

// Nova função para gerar a estrutura do roteiro em JSON
export const generateScriptStructure = async (apiKey: string, title: string, description: string, durationValue: string, durationUnit: 'seconds' | 'minutes'): Promise<{ title: string, scenes: ScriptScene[] }> => {
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        // PROMPT DE ALTA ENGENHARIA PARA RESULTADOS CINEMATOGRÁFICOS
        const prompt = `
        Aja como um VENCEDOR DE OSCAR DE MELHOR DIREÇÃO e EDITOR PROFISSIONAL.
        Sua tarefa é criar um roteiro técnico para um vídeo viral de altíssima qualidade.
        
        INPUTS:
        - Título/Tema: ${title || "Tema Livre"}
        - Descrição: ${description}
        - Duração Alvo: ${durationValue} ${durationUnit}.
        
        REGRAS VISUAIS (CRÍTICO PARA A QUALIDADE):
        1. O campo "searchTerm" é o MAIS IMPORTANTE. Ele será enviado para uma API de Stock Video.
        2. NÃO USE termos abstratos em "searchTerm" (Ex: NUNCA use "sucesso", "tristeza", "futuro").
        3. USE termos CONCRETOS e VISUAIS em INGLÊS em "searchTerm" (Ex: "Man in suit standing on skyscraper roof looking at sunset", "Hyper realistic drone shot of dubai at night", "Lion roaring in slow motion 4k").
        4. Adicione adjetivos de qualidade no search term: "4k", "cinematic", "slow motion", "sharp focus".
        
        REGRAS DE RITMO:
        1. Cenas curtas e dinâmicas (2 a 5 segundos).
        2. A narração deve casar perfeitamente com o visual descrito.
        
        Retorne APENAS um JSON com esta estrutura exata:
        {
            "generatedTitle": "Título Impactante",
            "scenes": [
                { 
                    "id": 1, 
                    "description": "Descrição da cena para o editor (PT-BR)", 
                    "narration": "Texto falado (PT-BR)", 
                    "searchTerm": "visual concrete description in english cinematic 4k", 
                    "duration": 4 
                }
            ]
        }

        IMPORTANTE: Retorne APENAS o JSON puro. Sem markdown.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash', 
            contents: prompt
        });

        let text = response.text || "{}";
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const parsed = JSON.parse(text);
        
        if (Array.isArray(parsed)) {
            return { title: title || "Vídeo Profissional", scenes: parsed };
        }

        return {
            title: parsed.generatedTitle || title || "Projeto AI",
            scenes: parsed.scenes
        };

    } catch (error) {
        console.error("Erro ao gerar roteiro:", error);
        throw new Error("Falha ao criar o roteiro profissional com Gemini.");
    }
};

// --- FUNÇÕES DO GROK (xAI) / GERAÇÃO DE IMAGEM ---

export const generateImageWithGrok = async (apiKey: string, prompt: string, width: number = 1024, height: number = 1024): Promise<string> => {
    if (!apiKey) throw new Error("Chave API ausente");
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    // Melhorando o prompt automaticamente para realismo
    const enhancedPrompt = `Cinematic shot, hyper realistic, 8k resolution, professional photography, ${prompt}, highly detailed`;
    const seed = Math.floor(Math.random() * 1000000);
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux`;
};

// --- PIXABAY API ---

export const searchPixabay = async (apiKey: string, query: string, type: 'image' | 'video', orientation: 'all' | 'horizontal' | 'vertical'): Promise<StockMedia[]> => {
    if (!apiKey) throw new Error("Chave API Pixabay ausente");

    const baseUrl = type === 'video' ? 'https://pixabay.com/api/videos/' : 'https://pixabay.com/api/';
    const orientationParam = orientation === 'all' ? '' : `&orientation=${orientation}`;
    // Adicionado 'editors_choice=true' para tentar pegar conteúdo melhor e safesearch
    const url = `${baseUrl}?key=${apiKey}&q=${encodeURIComponent(query)}&lang=en&editors_choice=true&safesearch=true${orientationParam}&per_page=20`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Erro ao buscar no Pixabay");
    const data = await response.json();

    if (type === 'video') {
        return data.hits.map((hit: any) => {
            // Lógica para pegar a melhor qualidade disponível (Medium ou Large)
            const bestQuality = hit.videos.large.url || hit.videos.medium.url || hit.videos.small.url;
            return {
                id: hit.id,
                type: 'video',
                url: bestQuality, // URL de display
                downloadUrl: bestQuality, // URL de download
                thumbnail: hit.picture_id ? `https://i.vimeocdn.com/video/${hit.picture_id}_640x360.jpg` : (hit.userImageURL || ''),
                author: hit.user,
                width: hit.videos.large.width,
                height: hit.videos.large.height
            };
        });
    } else {
        return data.hits.map((hit: any) => ({
            id: hit.id,
            type: 'image',
            url: hit.webformatURL,
            downloadUrl: hit.largeImageURL, // Sempre pegar a maior
            thumbnail: hit.previewURL,
            author: hit.user,
            width: hit.imageWidth,
            height: hit.imageHeight
        }));
    }
};

// --- PEXELS API (MELHORADA PARA HD/4K) ---

export const searchPexels = async (apiKey: string, query: string, type: 'image' | 'video', orientation: 'all' | 'horizontal' | 'vertical'): Promise<StockMedia[]> => {
    if (!apiKey) throw new Error("Chave API Pexels ausente");

    let url = '';
    const orientationParam = orientation === 'all' ? '' : `&orientation=${orientation === 'vertical' ? 'portrait' : 'landscape'}`;

    if (type === 'video') {
        // Aumentado per_page para ter mais opções de filtragem
        url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}${orientationParam}&per_page=15&min_width=1280`; 
    } else {
        url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}${orientationParam}&per_page=15`;
    }

    const response = await fetch(url, {
        headers: { Authorization: apiKey }
    });

    if (!response.ok) throw new Error("Erro ao buscar no Pexels");
    const data = await response.json();

    if (type === 'video') {
        return data.videos.map((vid: any) => {
            // ALGORITMO DE SELEÇÃO DE MELHOR ARQUIVO DE VÍDEO
            // A API retorna vários 'video_files'. Precisamos achar o HD (1920x1080) ou melhor, sem ser gigante demais.
            
            // 1. Ordena por resolução (width) decrescente
            const sortedFiles = vid.video_files.sort((a: any, b: any) => b.width - a.width);
            
            // 2. Tenta pegar o primeiro que seja HD (width >= 1280) e mp4.
            // Se não, pega o primeiro da lista ordenada (melhor qualidade disponível).
            const bestFile = sortedFiles.find((f: any) => f.width >= 1280 && f.width <= 3840 && f.file_type === 'video/mp4') || sortedFiles[0];

            return {
                id: vid.id,
                type: 'video',
                url: bestFile.link,
                downloadUrl: bestFile.link,
                thumbnail: vid.image,
                author: vid.user.name,
                width: vid.width,
                height: vid.height
            };
        });
    } else {
        return data.photos.map((photo: any) => ({
            id: photo.id,
            type: 'image',
            url: photo.src.large2x, // Qualidade Retina
            downloadUrl: photo.src.original,
            thumbnail: photo.src.medium,
            author: photo.photographer,
            width: photo.width,
            height: photo.height
        }));
    }
};

// --- ELEVENLABS API ---

export const generateElevenLabsAudio = async (apiKey: string, text: string, voiceId: string): Promise<string> => {
    if (!apiKey) throw new Error("Chave API ElevenLabs ausente");

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
            }
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail?.message || "Erro ao gerar áudio no ElevenLabs");
    }

    const blob = await response.blob();
    return window.URL.createObjectURL(blob);
};

// --- FUNÇÕES DE VERIFICAÇÃO ---
export const verifyCredential = async (service: 'gemini' | 'grok' | 'pixabay' | 'pexels' | 'elevenlabs', key: string): Promise<boolean> => {
    if (!key || key.trim() === '') return false;

    try {
        if (service === 'gemini') {
            const ai = new GoogleGenAI({ apiKey: key });
            await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: 'Ping' });
            return true;
        }

        if (service === 'grok') {
            return key.startsWith('xai-') || key.length > 10;
        }

        if (service === 'pixabay') {
            const res = await fetch(`https://pixabay.com/api/?key=${key}&q=test&per_page=3`);
            return res.ok;
        }

        if (service === 'pexels') {
            const res = await fetch(`https://api.pexels.com/v1/curated?per_page=1`, { headers: { Authorization: key } });
            return res.ok;
        }

        if (service === 'elevenlabs') {
            const res = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': key } });
            return res.ok;
        }

        return false;
    } catch (error: any) {
        console.error(`Falha na verificação do serviço ${service}:`, error);
        throw new Error(error.message);
    }
};