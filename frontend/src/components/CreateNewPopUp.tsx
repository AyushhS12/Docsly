import { useState } from 'react';
import { Plus, X, FileText, Upload, FolderPlus, File, FileCode, Table, Presentation, Sparkles, ArrowRight, Image } from 'lucide-react';

interface CreateNewPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (type: string, name: string) => void;
}

export default function CreateNewPopup({ isOpen, onClose, onCreate }: CreateNewPopupProps) {
  const [step, setStep] = useState<'choose' | 'details'>('choose');
  const [selectedType, setSelectedType] = useState<string>('');
  const [documentName, setDocumentName] = useState('');

  ///Blank Doc Function
  

  //Quick Actions
  const quickActions = [
    {
      id: 'blank',
      name: 'Blank Document',
      description: 'Start with an empty document',
      icon: <FileText className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'upload',
      name: 'Upload File',
      description: 'Import from your computer',
      icon: <Upload className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      action: 'upload'
    },
    {
      id: 'folder',
      name: 'New Folder',
      description: 'Organize your documents',
      icon: <FolderPlus className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const templates = [
    {
      id: 'essay',
      name: 'Essay',
      description: 'Academic writing template',
      icon: <File className="w-5 h-5" />,
      color: 'from-indigo-500 to-purple-500',
    },
    {
      id: 'meeting',
      name: 'Meeting Notes',
      description: 'Structured meeting template',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'from-orange-500 to-red-500',
    },
    {
      id: 'technical',
      name: 'Technical Doc',
      description: 'Code documentation',
      icon: <FileCode className="w-5 h-5" />,
      color: 'from-cyan-500 to-blue-500',
    },
    {
      id: 'table',
      name: 'Data Table',
      description: 'Organize data in tables',
      icon: <Table className="w-5 h-5" />,
      color: 'from-pink-500 to-rose-500',
    },
    {
      id: 'presentation',
      name: 'Presentation',
      description: 'Slide-style format',
      icon: <Presentation className="w-5 h-5" />,
      color: 'from-yellow-500 to-orange-500',
    },
    {
      id: 'design',
      name: 'Design Doc',
      description: 'Visual content',
      icon: <Image className="w-5 h-5" />,
      color: 'from-teal-500 to-green-500',
    },
  ];

  const handleSelect = (id: string, action?: string) => {
    if (action === 'upload') {
      // Trigger file upload
      console.log('Opening file upload');
      onClose();
      return;
    }
    setSelectedType(id);
    setStep('details');
  };

  const handleCreate = () => {
    if (documentName.trim() && onCreate) {
      onCreate(selectedType, documentName);
    }
    handleClose();
  };

  const handleClose = () => {
    setStep('choose');
    setSelectedType('');
    setDocumentName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={handleClose}
      />

      {/* Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden pointer-events-auto animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {step === 'choose' ? (
            <>
              {/* Header */}
              <div className="relative bg-linear-to-r from-purple-600 to-pink-600 p-6 text-white">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl">
                    <Plus className="w-6 h-6 hover:scale-150 transition-transform" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Create New</h2>
                    <p className="text-white/90 text-sm mt-0.5">Choose what you'd like to create</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
                {/* Quick Actions */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {quickActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleSelect(action.id, action.action)}
                        className="flex flex-col items-center p-4 bg-linear-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-purple-200 hover:border-purple-400 rounded-2xl transition-all group text-center"
                      >
                        <div className={`bg-linear-to-br ${action.color} p-3 rounded-xl mb-3 text-white group-hover:scale-110 transition-transform`}>
                          {action.icon}
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm mb-1">{action.name}</h4>
                        <p className="text-xs text-gray-600">{action.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Templates */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Templates</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleSelect(template.id)}
                        className="flex flex-col items-start p-4 bg-white hover:bg-purple-50 border-2 border-gray-200 hover:border-purple-400 rounded-xl transition-all group"
                      >
                        <div className={`bg-linear-to-br ${template.color} p-2.5 rounded-lg mb-3 text-white group-hover:scale-110 transition-transform`}>
                          {template.icon}
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm mb-1">{template.name}</h4>
                        <p className="text-xs text-gray-600 text-left">{template.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Header - Details Step */}
              <div className="relative bg-linear-to-r from-purple-600 to-pink-600 p-6 text-white">
                <button
                  onClick={() => setStep('choose')}
                  className="absolute top-4 left-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <h2 className="text-2xl font-bold">Name Your Document</h2>
                  <p className="text-white/90 text-sm mt-1">Give it a memorable name</p>
                </div>
              </div>

              {/* Content - Details Step */}
              <div className="p-8">
                {/* Selected Template Preview */}
                <div className="text-center mb-6">
                  <div className="inline-block bg-linear-to-br from-purple-100 to-pink-100 p-5 rounded-2xl mb-3">
                    {[...quickActions, ...templates].find(t => t.id === selectedType)?.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {[...quickActions, ...templates].find(t => t.id === selectedType)?.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {[...quickActions, ...templates].find(t => t.id === selectedType)?.description}
                  </p>
                </div>

                {/* Name Input */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Document Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="e.g., Project Proposal 2024"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-all text-gray-800"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && documentName.trim()) {
                        handleCreate();
                      }
                    }}
                  />
                </div>

                {/* Options */}
                <div className="space-y-3 mb-6">
                  <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" 
                      defaultChecked 
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">Enable real-time collaboration</span>
                      <p className="text-xs text-gray-500">Allow others to edit simultaneously</p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" 
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">Start with AI suggestions</span>
                      <p className="text-xs text-gray-500">Get AI-powered content ideas</p>
                    </div>
                  </label>
                </div>

                {/* Actions */}
                <button
                  onClick={handleCreate}
                  disabled={!documentName.trim()}
                  className="w-full py-3.5 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 group"
                >
                  <span>Create Document</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}