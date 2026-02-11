import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, Plus, Upload, Edit3, Search, Filter, MoreVertical, Clock, Users, Star, Share2, FolderOpen, Grid, List, Bell, Settings, User, LogOut, CheckCircle } from 'lucide-react';
import useAuthGuard from '../context/auth/useAuthGuard';
import CreateNewPopup from '../components/CreateNewPopUp';
import api, { BaseUrl } from '../lib/api';
import toast, { ErrorIcon } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import type { CollabRequest, Doc, UploadedDoc, UploadedFile } from '../lib/utils';
import CollabRequestsDropdown from '../components/CollabRequestDropdown';
import DocumentGrid from '../components/DocumentGrid';


export default function Dashboard() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [collabs, setCollabs] = useState<Doc[]>([]);
  const [uploads, setUploads] = useState<UploadedDoc[]>([]);

  const [requests, setRequests] = useState<CollabRequest[]>();
  const { guard, logout } = useAuthGuard()
  const navigate = useNavigate()

  const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);

  //Upload states
  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


  const onOpen = (id: string) => {
    navigate("/doc/edit/" + id);
  }

  const shareDoc = (id: string) => {
    const toastId = toast.loading("Copying link...")
    try {
      let shareLink;
      if (BaseUrl === "") {
        shareLink = "http://localhost:5173/doc/collab/" + id;
      } else {
        shareLink = import.meta.url + "/doc/collab/" + id;
      }
      navigator.clipboard.writeText(shareLink)
      setTimeout(() => {
        toast.success("Link copied to clipboard", {
          id: toastId,
          icon: <CheckCircle className="text-green-500" />,
          duration: 900,
        })
      }, 1500)
    } catch (e) {
      console.log(e)
      toast.error("An error occurred", {
        id: toastId,
        icon: <ErrorIcon className="text-red-500" />,
        duration: 900,
      })
    }
  }

  const getCollabRequests = async () => {
    try {
      const res = await api.get<{ requests: CollabRequest[] }>("/doc/get_collab_requests");
      setRequests(res.data.requests)
    } catch (e) {
      console.log(e)
    }
  }

  const getUserDocs = useCallback(async () => {
    const res = await api.get<{ docs: Doc[], collabs: Doc[], uploads: UploadedFile[] }>("/doc/get_docs", { withCredentials: true })
    if (res.data) {
      setDocs(res.data.docs)
      setCollabs(res.data.collabs)
      res.data.uploads.forEach((x) => {
        const bytes = new Uint8Array(x.data)
        const text = new TextDecoder("utf-8").decode(bytes)
        setUploads(prev => {
          const exists = prev.find(u => u._id.$oid === x._id.$oid);
          if (exists) {
            // update existing
            return prev.map(u =>
              u._id.$oid === x._id.$oid
                ? {
                  ...u,
                  author: x.owner,
                  title: x.filename,
                  content: text,
                }
                : u
            );
          }
          // insert new
          return [
            ...prev,
            {
              _id: x._id,
              author: x.owner,
              title: x.filename,
              content: text,
            },
          ];
        });
      })
    }
  }, [])
  const onCreate = useCallback(async (type: string, name: string) => {
    const toastId = toast.loading("Creating Document... Please wait")
    try {
      const res = await api.post<{ success: boolean, message: string }>("/doc/create", { title: name, type, collaborators: [] })
      if (res.data.success) {
        getUserDocs()
        setTimeout(() => {
          toast.success(res.data.message, {
            id: toastId,
            icon: <CheckCircle className="text-green-500" />,
            duration: 1500,
          })
        }, 1000)
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      setTimeout(() => {
        setTimeout(() => {
          toast.error("An error occurred", {
            id: toastId,
            icon: <ErrorIcon className="text-red-500" />,
            duration: 1500,
          })
        }, 1000)
      })
    }
  }, [getUserDocs])


  useEffect(() => {
    const init = async () => {
      await guard()
      await getUserDocs()
      await getCollabRequests()
    }
    init()
  }, [guard, getUserDocs])

  const toggleStar = (id: string) => {
    setDocs(docs.map(doc => doc._id.$oid === id ? { ...doc, starred: !doc.starred } : doc));
    setCollabs(collabs.map(doc => doc._id.$oid === id ? { ...doc, starred: !doc.starred } : doc));
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    const toastId = toast.loading("Uploading file...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      await api.put("/doc/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      toast.success("File uploaded successfully", {
        id: toastId,
        icon: <CheckCircle className="text-green-500" />,
        duration: 1500,
      });

      setIsUploadPopupOpen(false);
      setSelectedFile(null);
      getUserDocs(); // refresh list
    } catch (e) {
      console.error(e);
      toast.error("Upload failed", {
        id: toastId,
        duration: 1500,
      });
    }
  };

  const filteredDocs = useMemo(() => {
    return docs.filter(doc =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [docs, searchQuery]);

  const filteredCollabs = useMemo(() => {
    return collabs.filter(doc => doc.title.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [collabs, searchQuery])

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Create New Pop Up */}
      <CreateNewPopup
        isOpen={isCreatePopupOpen}
        onClose={() => setIsCreatePopupOpen(false)}
        onCreate={onCreate}
      />
      {isUploadPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Upload File
            </h2>

            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="w-full mb-4 file:mr-4 file:py-2 file:px-4
          file:rounded-lg file:border-0
          file:bg-purple-600 file:text-white
          hover:file:bg-purple-700
          cursor-pointer"
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsUploadPopupOpen(false);
                  setSelectedFile(null);
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                disabled={!selectedFile}
                onClick={() => {
                  uploadFile()
                  setIsUploadPopupOpen(false);
                }}
                className={`px-4 py-2 rounded-lg text-white font-semibold transition
            ${selectedFile
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-gray-400 cursor-not-allowed"
                  }`}
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

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
            <button onClick={() => setIsCreatePopupOpen(true)} className="w-full flex items-center space-x-3 px-4 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-xl transform hover:scale-105 transition-all group">
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Create New</span>
            </button>
            <button
              onClick={() => setIsUploadPopupOpen(true)}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-white border-2 border-purple-200 text-purple-600 rounded-xl hover:border-purple-400 hover:shadow-md transition-all group"
            >
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
              <Star className="w-5 h-5" />
              <span>Starred</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg font-medium transition-colors">
              <Clock className="w-5 h-5" />
              <span>Recent</span>
            </button>
          </nav>
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
              <div className="relative">
                <button
                  onClick={() => setShowRequests(prev => !prev)}
                  className="p-2 hover:bg-purple-50 rounded-lg transition-colors relative"
                >
                  <Bell className="w-5 h-5 cursor-pointer transform hover:translate-y-1 transition-all text-gray-600" />
                  {requests && requests.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>

                {showRequests && (
                  <CollabRequestsDropdown
                    requests={requests ?? []}
                    onClose={() => setShowRequests(false)}
                  />
                )}
              </div>
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
                    <button onClick={logout} className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 transition-colors flex items-center space-x-2">
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
                className={`p-2 rounded transition-all ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:text-purple-600'
                  }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-all ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:text-purple-600'
                  }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Documents Grid/List */}
          {viewMode === 'grid' ? (
            <>
              <DocumentGrid
                docs={filteredDocs}
                onShare={shareDoc}
                onOpen={onOpen}
                onToggleStar={toggleStar}
              />
              {/* Collabs */}
              {collabs.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold mt-12 mb-4 text-gray-800">
                    Shared With Me
                  </h2>

                  <DocumentGrid
                    docs={filteredCollabs}
                    onOpen={onOpen}
                    onShare={shareDoc}
                    onToggleStar={toggleStar}
                  />
                </>
              )}
            </>
          ) : (
            <>
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
                        <tr key={doc._id.$oid} className="hover:bg-purple-50 transition-colors cursor-pointer">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="bg-linear-to-br from-purple-100 to-pink-100 p-2 rounded-lg">
                                <FileText className="w-5 h-5 text-purple-600" />
                              </div>
                              <span className="font-semibold text-gray-800">{doc.title}</span>
                              {doc.starred && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{doc.author.id.$oid}</td>
                          <td className="px-6 py-4 text-gray-600">{doc.last_update.toString()}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-1 text-gray-600">
                              <Users className="w-4 h-4" />
                              {doc.collaborators.map(x => {
                                return (
                                  <span>{x.$oid}</span>
                                )
                              })}
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
              {filteredCollabs.length !== 0 && <>
                <h2 className="text-2xl font-bold mt-12 mb-4 text-gray-800">
                  Shared With Me
                </h2>
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
                        {filteredCollabs.map((doc) => (
                          <tr key={doc._id.$oid} className="hover:bg-purple-50 transition-colors cursor-pointer">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="bg-linear-to-br from-purple-100 to-pink-100 p-2 rounded-lg">
                                  <FileText className="w-5 h-5 text-purple-600" />
                                </div>
                                <span className="font-semibold text-gray-800">{doc.title}</span>
                                {doc.starred && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-700">{doc.author.id.$oid}</td>
                            {/* <td className="px-6 py-4 text-gray-600">{doc.last_update}</td> */}
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-1 text-gray-600">
                                <Users className="w-4 h-4" />
                                {doc.collaborators.map(x => {
                                  return (
                                    <span>{x.$oid}</span>
                                  )
                                })}
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
              </>}
            </>
          )}

          {filteredDocs.length === 0 && collabs.length === 0 && uploads.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-linear-to-br from-purple-100 to-pink-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-12 h-12 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No documents found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or create a new document</p>
              <button onClick={() => setIsCreatePopupOpen(true)} className="px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all">
                Create New Document
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}