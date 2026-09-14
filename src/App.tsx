import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { storageService } from './services/storageService';
import { BoardTemplate } from './types/template';
import { Navbar } from './components/layout/Navbar';
import { HomePage } from './components/home/HomePage';
import { UserBoardEditor } from './components/user/UserBoardEditor';
import { AdminTemplateStudio } from './components/admin/AdminTemplateStudio';
import { AdminLoginModal } from './components/auth/AdminLoginModal';
import { GoogleAuthModal } from './components/auth/GoogleAuthModal';
import { PurchaseTemplateModal } from './components/store/PurchaseTemplateModal';
import { HelpModal } from './components/common/HelpModal';
import './styles.css';

const MainApp: React.FC = () => {
  const { isAdmin } = useAuth();
  const [templates, setTemplates] = useState<BoardTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<BoardTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'home' | 'editor'>('home');
  const [storeTab, setStoreTab] = useState<'store' | 'my-store'>('store');
  const [initialValues, setInitialValues] = useState<Record<string, string> | null>(null);
  const [initialCustomBg, setInitialCustomBg] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [savedCount, setSavedCount] = useState<number>(0);

  // Load templates on initial mount
  useEffect(() => {
    loadTemplates();
    updateSavedCount();
  }, []);

  const updateSavedCount = () => {
    try {
      const saved = storageService.getUserBoards();
      setSavedCount(saved.length);
    } catch {
      setSavedCount(0);
    }
  };

  const loadTemplates = () => {
    const all = storageService.getAllTemplates();
    setTemplates(all);
    if (!activeTemplate && all.length > 0) {
      const firstPublished = all.find((t) => t.published) || all[0];
      setActiveTemplate(firstPublished);
    }
  };

  // Save/Publish template handler (Admin)
  const handleSaveTemplate = (updated: BoardTemplate) => {
    const saved = storageService.saveTemplate(updated);
    setTemplates(storageService.getAllTemplates());
    setActiveTemplate(saved);
  };

  // Delete template handler (Admin)
  const handleDeleteTemplate = (id: string) => {
    storageService.deleteTemplate(id);
    const refreshed = storageService.getAllTemplates();
    setTemplates(refreshed);
    if (refreshed.length === 0) {
      handleCreateNewTemplate();
    } else if (activeTemplate?.id === id) {
      setActiveTemplate(refreshed[0]);
    }
  };

  // Create new template handler (Admin)
  const handleCreateNewTemplate = () => {
    const newTemplate: BoardTemplate = {
      id: 'template_' + Date.now(),
      name: 'New Custom LED Texture (1024×1024)',
      category: 'LED Texture Sheet',
      description: 'Custom train simulator texture sheet or board.',
      aspectRatio: '1:1',
      baseWidth: 1024,
      baseHeight: 1024,
      isTextureSheet: true,
      textureResolution: 1024,
      backgroundColor: '#0c0f12',
      backgroundType: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      borderRadius: 0,
      showBolts: false,
      fixedGraphics: [],
      fields: [
        {
          id: 'field_train_no',
          label: 'Train Number Slot',
          defaultValue: '12627 / 12628',
          placeholder: 'TRAIN NUMBER',
          x: 50,
          y: 20,
          width: 70,
          height: 10,
          fontFamily: "'VT323', 'DotGothic16', monospace",
          fontSize: 58,
          fontWeight: 700,
          color: '#ff9f1c',
          align: 'center',
          textTransform: 'uppercase',
          ledGlow: true,
          glowColor: '#ff6200',
          glowRadius: 12,
          isDotMatrix: true
        },
        {
          id: 'field_train_name',
          label: 'Train Name Slot',
          defaultValue: 'KARNATAKA EXPRESS',
          placeholder: 'TRAIN NAME',
          x: 50,
          y: 40,
          width: 90,
          height: 12,
          fontFamily: "'VT323', 'DotGothic16', monospace",
          fontSize: 68,
          fontWeight: 700,
          color: '#ff9f1c',
          align: 'center',
          textTransform: 'uppercase',
          ledGlow: true,
          glowColor: '#ff6200',
          glowRadius: 14,
          isDotMatrix: true
        }
      ],
      published: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'Admin'
    };

    storageService.saveTemplate(newTemplate);
    setTemplates(storageService.getAllTemplates());
    setActiveTemplate(newTemplate);
  };

  // Published templates only for user mode
  const publishedTemplates = templates.filter((t) => t.published !== false);

  if (!activeTemplate) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Initializing Railway Board Studio...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar
        currentView={isAdmin ? 'admin' : viewMode}
        activeStoreTab={storeTab}
        savedBoardsCount={savedCount}
        onNavigateHome={() => {
          setStoreTab('store');
          setViewMode('home');
        }}
        onNavigateStore={(tab) => {
          setStoreTab(tab);
          setViewMode('home');
          updateSavedCount();
        }}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {isAdmin ? (
        <AdminTemplateStudio
          templates={templates}
          activeTemplate={activeTemplate}
          onSaveTemplate={handleSaveTemplate}
          onSelectTemplate={(tpl) => setActiveTemplate(tpl)}
          onDeleteTemplate={handleDeleteTemplate}
          onCreateNewTemplate={handleCreateNewTemplate}
        />
      ) : viewMode === 'home' ? (
        <HomePage
          templates={publishedTemplates.length > 0 ? publishedTemplates : templates}
          activeStoreTab={storeTab}
          onTabChange={(tab) => {
            setStoreTab(tab);
            updateSavedCount();
          }}
          onSelectTemplate={(tpl, userVals, customBg) => {
            setActiveTemplate(tpl);
            setInitialValues(userVals || null);
            setInitialCustomBg(customBg || null);
            setViewMode('editor');
          }}
        />
      ) : (
        <UserBoardEditor
          templates={publishedTemplates.length > 0 ? publishedTemplates : templates}
          activeTemplate={activeTemplate}
          initialValues={initialValues}
          initialCustomBackground={initialCustomBg}
          onSelectTemplate={(tpl) => {
            setActiveTemplate(tpl);
            setInitialValues(null);
            setInitialCustomBg(null);
          }}
          onBackToHome={() => {
            setStoreTab('store');
            setViewMode('home');
            updateSavedCount();
          }}
          onNavigateToMyStore={() => {
            setStoreTab('my-store');
            setViewMode('home');
            updateSavedCount();
          }}
        />
      )}

      <AdminLoginModal />
      <GoogleAuthModal />
      <PurchaseTemplateModal />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
