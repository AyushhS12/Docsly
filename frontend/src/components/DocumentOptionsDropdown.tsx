import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit3, Trash2, Save, Share2} from 'lucide-react';

interface DropdownMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  onShare?: () => void;
}

export default function DocumentOptionsDropdown({
  onEdit,
  onDelete,
  onSave,
  onShare,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (callback?: () => void) => {
    if (callback) {
      callback();
    }
    setIsOpen(false);
  };

  const menuItems = [
    { icon: Edit3, label: 'Edit', onClick: onEdit, color: 'text-blue-600', hoverBg: 'hover:bg-blue-50' },
    { icon: Save, label: 'Save', onClick: onSave, color: 'text-green-600', hoverBg: 'hover:bg-green-50' },
    { icon: Share2, label: 'Share', onClick: onShare, color: 'text-purple-600', hoverBg: 'hover:bg-purple-50' },
    { icon: Trash2, label: 'Delete', onClick: onDelete, color: 'text-red-600', hoverBg: 'hover:bg-red-50', divider: true },
  ];

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-purple-50 rounded transition-colors"
      >
        <MoreVertical className="w-5 h-5 text-gray-400" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-30 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-40 overflow-hidden animate-slideDown">
            <div className="py-1">
              {menuItems.map((item, index) => (
                <React.Fragment key={index}>
                  {item.divider && (
                    <div className="my-1 border-t border-gray-200" />
                  )}
                  {item.onClick && (
                    <button
                      onClick={() => handleAction(item.onClick)}
                      className={`w-full flex items-center space-x-3 px-4 py-2.5 text-left transition-colors ${item.hoverBg} group`}
                    >
                      <item.icon className={`w-4 h-4 ${item.color} transition-transform group-hover:scale-110`} />
                      <span className={`text-sm font-medium ${item.color}`}>
                        {item.label}
                      </span>
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.15s ease-out;
        }
      `}</style>
    </div>
  );
}


// // Example usage in a document card
// function DocumentCard() {
//   const handleEdit = () => console.log('Edit clicked');
//   const handleDelete = () => console.log('Delete clicked');
//   const handleSave = () => console.log('Save clicked');
//   const handleShare = () => console.log('Share clicked');
//   const handleDownload = () => console.log('Download clicked');
//   const handleDuplicate = () => console.log('Duplicate clicked');
//   const handleArchive = () => console.log('Archive clicked');

//   return (
//     <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
//       <div className="max-w-md mx-auto bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
//         <div className="flex items-start justify-between mb-4">
//           <div>
//             <h3 className="text-lg font-bold text-gray-800">Project Document</h3>
//             <p className="text-sm text-gray-600">Last edited 2 hours ago</p>
//           </div>
          
//           <DocumentOptionsDropdown
//             onEdit={handleEdit}
//             onDelete={handleDelete}
//             onSave={handleSave}
//             onShare={handleShare}
//             onDownload={handleDownload}
//             onDuplicate={handleDuplicate}
//             onArchive={handleArchive}
//           />
//         </div>
        
//         <p className="text-gray-700">
//           This is a sample document card with a dropdown menu in the top right corner.
//           Click the three dots to see the options.
//         </p>
//       </div>
//     </div>
//   );
// }