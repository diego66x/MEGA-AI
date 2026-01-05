import React from 'react';
import { LayoutDashboard, Settings, Layers, Sparkles, Image as ImageIcon, FolderOpen, Search, Camera, Mic, Clapperboard, Youtube } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Visão Geral' },
    { id: 'copy_ytb', icon: Youtube, label: 'Copy YTB' }, // Novo Item
    { id: 'script_generator', icon: Clapperboard, label: 'Roteiro AI' }, 
    { id: 'library', icon: FolderOpen, label: 'Minha Biblioteca' },
    { id: 'gemini', icon: Sparkles, label: 'Gemini Chat' },
    { id: 'grok_images', icon: ImageIcon, label: 'Grok Images' },
    { id: 'pixabay', icon: Search, label: 'Pixabay' }, 
    { id: 'pexels', icon: Camera, label: 'Pexels' }, 
    { id: 'text_audio', icon: Mic, label: 'Text/Audio' }, 
    { id: 'integrations', icon: Layers, label: 'Integrações' },
  ];

  return (
    <aside className="w-20 lg:w-64 h-screen bg-black flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 shadow-xl shadow-black border-r border-zinc-900">
      <div className="h-24 flex items-center justify-center lg:justify-start lg:px-8 border-b border-zinc-900">
        <span className="hidden lg:block font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-[#E50914] to-purple-600 tracking-tighter uppercase drop-shadow-sm">MEGA AI</span>
        <span className="lg:hidden font-black text-2xl text-[#E50914]">M</span>
      </div>

      <nav className="flex-1 py-6 flex flex-col gap-2 px-4 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center justify-center lg:justify-start p-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden flex-shrink-0
                ${isActive 
                  ? 'bg-zinc-900 text-white font-bold shadow-inner' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                }`}
            >
              <item.icon className={`w-5 h-5 z-10 ${isActive ? 'text-[#E50914]' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              <span className="hidden lg:block ml-4 text-sm z-10">{item.label}</span>
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E50914] z-10" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-zinc-900">
        <button className="flex items-center justify-center lg:justify-start w-full text-zinc-500 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
          <span className="hidden lg:block ml-4 text-sm font-medium">Configurações</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;