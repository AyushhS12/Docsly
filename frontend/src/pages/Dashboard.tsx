import { useState } from 'react';
import { FileText, Plus, Upload, Edit3, Search, Filter, MoreVertical, Clock, Users, Star, Trash2, Share2, Download, FolderOpen, Grid, List, Bell, Settings, User, LogOut } from 'lucide-react';

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Sample documents data
  const documents = [
    { id: 1, title: 'Product Roadmap 2024', lastEdited: '2 hours ago', collaborators: 3, starred: true, owner: 'You' },
    { id: 2, title: 'Marketing Strategy', lastEdited: '5 hours ago', collaborators: 5, starred: false, owner: 'Sarah Chen' },
    { id: 3, title: 'Engineering Specs', lastEdited: '1 day ago', collaborators: 7, starred: true, owner: 'You' },
    { id: 4, title: 'Meeting Notes - Q4', lastEdited: '2 days ago', collaborators: 2, starred: false, owner: 'Alex Kim' },
    { id: 5, title: 'Design System Guidelines', lastEdited: '3 days ago', collaborators: 4, starred: false, owner: 'You' },
    { id: 6, title: 'Sales Pitch Deck', lastEdited: '1 week ago', collaborators: 6, starred: true, owner: 'Maria Garcia' },
  ];

  const [docs, setDocs] = useState(documents);

  const toggleStar = (id: number) => {
    setDocs(docs.map(doc => doc.id === id ? { ...doc, starred: !doc.starred } : doc));
  };

  const filteredDocs = docs.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white/80 backdrop-blur-sm border-r border-purple-100 shadow-lg z-20">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-8 group cursor-pointer">
            <div className="bg-linear-to-br from-purple-500 to-pink-500 p-2 rounded-xl shadow-lg transform group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Docsly
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-8">
            <button className="w-full flex items-center space-x-3 px-4 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-xl transform hover:scale-105 transition-all group">
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Create New</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 bg-white border-2 border-purple-200 text-purple-600 rounded-xl hover:border-purple-400 hover:shadow-md transition-all group">
              <Upload className="w-5 h-5" />
              <span className="font-semibold">Upload</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-purple-600 bg-purple-50 rounded-lg font-medium">
              <FileText className="w-5 h-5" />
              <span>My Documents</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg font-medium transition-colors">
              <Users className="w-5 h-5" />
              <span>Shared with me</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg font-medium transition-colors">
              <Star className="w-5 h-5" />
              <span>Starred</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg font-medium transition-colors">
              <Clock className="w-5 h-5" />
              <span>Recent</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg font-medium transition-colors">
              <Trash2 className="w-5 h-5" />
              <span>Trash</span>
            </button>
          </nav>

          {/* Storage indicator */}
          <div className="mt-8 p-4 bg-purple-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Storage</span>
              <span className="text-xs text-gray-600">3.2 GB / 15 GB</span>
            </div>
            <div className="w-full bg-white rounded-full h-2">
              <div className="bg-linear-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: '21%' }} />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-purple-100 shadow-sm">
          <div className="flex items-center justify-between px-8 py-4">
            {/* Search */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4 ml-6">
              <button className="p-2 hover:bg-purple-50 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <button className="p-2 hover:bg-purple-50 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-linear-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-purple-100 py-2">
                    <button className="w-full px-4 py-2 text-left hover:bg-purple-50 transition-colors flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button className="w-full px-4 py-2 text-left hover:bg-purple-50 transition-colors flex items-center space-x-2">
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <hr className="my-2 border-gray-200" />
                    <button className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 transition-colors flex items-center space-x-2">
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              My Documents
            </h1>
            <p className="text-gray-600">Access and manage all your documents</p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-purple-200 text-purple-600 rounded-lg hover:border-purple-400 hover:shadow-md transition-all">
                <Filter className="w-4 h-4" />
                <span className="font-medium">Filter</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-purple-200 text-purple-600 rounded-lg hover:border-purple-400 hover:shadow-md transition-all">
                <FolderOpen className="w-4 h-4" />
                <span className="font-medium">Folders</span>
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex bg-white border-2 border-purple-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Documents Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-100 hover:border-purple-300 hover:shadow-xl transform hover:-translate-y-1 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-linear-to-br from-purple-100 to-pink-100 p-3 rounded-xl">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleStar(doc.id)}
                        className="p-1 hover:bg-purple-50 rounded transition-colors"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            doc.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                          }`}
                        />
                      </button>
                      <button className="p-1 hover:bg-purple-50 rounded transition-colors">
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                    {doc.title}
                  </h3>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{doc.lastEdited}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{doc.collaborators}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-600">By {doc.owner}</span>
                    <div className="flex space-x-1">
                      <button className="p-2 hover:bg-purple-50 rounded-lg transition-colors">
                        <Share2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-purple-50 rounded-lg transition-colors">
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-purple-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Document</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Owner</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Last Edited</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Collaborators</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-purple-50 transition-colors cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-linear-to-br from-purple-100 to-pink-100 p-2 rounded-lg">
                              <FileText className="w-5 h-5 text-purple-600" />
                            </div>
                            <span className="font-semibold text-gray-800">{doc.title}</span>
                            {doc.starred && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{doc.owner}</td>
                        <td className="px-6 py-4 text-gray-600">{doc.lastEdited}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-1 text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>{doc.collaborators}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button className="p-2 hover:bg-white rounded-lg transition-colors">
                              <Edit3 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button className="p-2 hover:bg-white rounded-lg transition-colors">
                              <Share2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button className="p-2 hover:bg-white rounded-lg transition-colors">
                              <MoreVertical className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredDocs.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-linear-to-br from-purple-100 to-pink-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-12 h-12 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No documents found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or create a new document</p>
              <button className="px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all">
                Create New Document
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}