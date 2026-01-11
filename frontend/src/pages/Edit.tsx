/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Share2, Save, MoreVertical, Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Link, Image, Code, Undo, Redo, Menu, X, MessageSquare, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
// import toast from 'react-hot-toast';
import useAuthGuard from '../context/auth/useAuthGuard';
import { applyRemoteUpdate, type DeleteUpdate, type Doc, type InsertUpdate, type User } from '../lib/utils';
import { useBatchUpdates } from '../lib/batchUpdate';
import api from '../lib/api';

export default function Edit() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState("Untitled Document")
  const [isSaving, setIsSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [collaborators, _setCollaborators] = useState<User[]>([]);
  const { guard } = useAuthGuard()
  const wsRef = useRef<WebSocket | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lastContentRef = useRef('');
  const cursorPositionRef = useRef(0);
  const navigate = useNavigate()
  const { docId } = useParams<{ docId: string }>()

  const fetchDoc = useCallback(async() => {
    const res = await api.get<Doc>("/doc/get_doc?id="+docId)
    setTitle(res.data.title)
    setContent(res.data.content)
  },[docId])

  useEffect(()=>{
    const f = ()=>{
      fetchDoc()
    }
    f()
  },[fetchDoc])

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(async () => {
    try {
      const ws = new WebSocket("/api/doc/edit/" + docId);
      ws.onopen = (_) => {
        console.log("Connected to Websocket");
        setIsConnected(true);
      }
      ws.onerror = (e) => {
        console.log(e)
      }
      ws.onclose = (e) => {
        console.log("Connection Closed")
        console.log("Connecting to websocket again in 2 seconds")
        console.error(e)
        // setTimeout(connectWebSocket,2000)
      }
      ws.onmessage = (msg) => {
        console.log(msg.data)
        const update = JSON.parse(msg.data) as InsertUpdate | DeleteUpdate
        setContent(prev => applyRemoteUpdate(prev,update))
      }
      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    }
  }, [docId])

  useEffect(() => {
    guard()
    const ws = () => {
      connectWebSocket()
    }
    ws()
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket, guard, navigate]);
  const sendUpdate = useCallback((update: InsertUpdate | DeleteUpdate) => {
    if (isConnected) {
      console.log('Sending update to WebSocket:', update);
      wsRef.current?.send(JSON.stringify(update));
    }
  }, [isConnected])

  //Batch Updates
  const { queueUpdate } = useBatchUpdates(sendUpdate)

  // Debounced SendUpdate
  // const pendingInsertRef = useRef<string>("");
  // const pendingDeleteRef = useRef<number>(0);
  // const startPositionRef = useRef<number | null>(null);
  // const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // const sendUpdateBatch = useCallback((update: InsertUpdate | DeleteUpdate) => {
  //   // Set start position only once per batch
  //   if (startPositionRef.current === null) {
  //     startPositionRef.current = update.position;
  //   }
  //   // Merge updates
  //   if (update.type.update === "insert") {
  //     pendingInsertRef.current += update.type.data;
  //   }

  //   if (update.type.update === "delete") {
  //     pendingDeleteRef.current += update.type.length;
  //   }

  //   // Reset debounce timer
  //   if (debounceTimerRef.current) {
  //     clearTimeout(debounceTimerRef.current);
  //   }

  //   debounceTimerRef.current = setTimeout(() => {
  //     // Send INSERT batch
  //     if (pendingInsertRef.current.length > 0) {
  //       sendUpdate({
  //         position: startPositionRef.current!,
  //         type: {
  //           update: "insert",
  //           data: pendingInsertRef.current
  //         },
  //         timestamp: new Date().toISOString()
  //       });
  //     }

  //     // Send DELETE batch
  //     if (pendingDeleteRef.current > 0) {
  //       sendUpdate({
  //         position: startPositionRef.current!,
  //         type: {
  //           update: "delete",
  //           length: pendingDeleteRef.current
  //         },
  //         timestamp: new Date().toISOString()
  //       });
  //     }

  //     // Reset batch state
  //     pendingInsertRef.current = "";
  //     pendingDeleteRef.current = 0;
  //     startPositionRef.current = null;
  //     debounceTimerRef.current = null;
  //   }, 3000);
  // },[sendUpdate])


  //Delete Function
  const createDeleteUpdate = useCallback((
    oldContent: string,
    newContent: string,
  ) => {
    let start = 0;
    while (
      start < newContent.length &&
      oldContent[start] === newContent[start]
    ) {
      start++;
    }

    const deletedLength = oldContent.length - newContent.length;

    const update: DeleteUpdate = {
      position: start,
      type: {
        update: "delete",
        length: deletedLength
      },
      timestamp: (new Date()).toISOString()
    };
    queueUpdate(update);
  },[queueUpdate])

  // Handle content changes and send to WebSocket
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const oldContent = content;
    const cursorPosition = e.target.selectionStart;

    // Detect changes
    if (newContent.length > oldContent.length) {
      // Insertion detected
      const insertedText = newContent.slice(oldContent.length > 0 ? cursorPosition - (newContent.length - oldContent.length) : 0, cursorPosition);
      const insertPosition = cursorPosition - insertedText.length;
      const update: InsertUpdate = {
        position: insertPosition,
        type: {
          update: 'insert',
          data: insertedText
        },
        timestamp: (new Date()).toISOString()
      }
      queueUpdate(update)
    } else if (newContent.length < oldContent.length) {
      // Deletion detected
      createDeleteUpdate(oldContent, newContent)
    }

    lastContentRef.current = newContent;
    setContent(newContent);
    cursorPositionRef.current = cursorPosition;

    // Simulate auto-save
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  }, [content, createDeleteUpdate, queueUpdate])

  const formatText = (command: string) => {
    // Placeholder for text formatting
    console.log('Format command:', command);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-purple-50 rounded-lg transition-colors lg:hidden"
            >
              {showSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center space-x-2">
              <div className="bg-linear-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:bg-white px-2 py-1 rounded transition-colors"
                placeholder="Untitled Document"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-600 hidden sm:inline">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Saving Status */}
            {isSaving && (
              <span className="text-sm text-gray-600 hidden sm:inline">Saving...</span>
            )}

            {/* Collaborators */}
            <div className="flex -space-x-2">
              {collaborators.map((collab) => (
                <div
                  key={collab.id.$oid}
                  className={`w-8 h-8 rounded-full bg-linear-to-br flex items-center justify-center text-white text-xs font-semibold border-2 border-white relative group cursor-pointer`}
                  title={collab.name}
                >
                  {collab.name.charAt(0)}
                  {collab && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowComments(!showComments)}
              className="p-2 hover:bg-purple-50 rounded-lg transition-colors relative"
            >
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            <button className="p-2 hover:bg-purple-50 rounded-lg transition-colors">
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>

            <button className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all">
              <Save className="w-4 h-4" />
              <span className="font-semibold">Share</span>
            </button>

            <button className="p-2 hover:bg-purple-50 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="border-t border-gray-200 px-6 py-2 overflow-x-auto">
          <div className="flex items-center space-x-1 min-w-max">
            <button onClick={() => formatText('undo')} className="p-2 hover:bg-purple-50 rounded transition-colors" title="Undo">
              <Undo className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => formatText('redo')} className="p-2 hover:bg-purple-50 rounded transition-colors" title="Redo">
              <Redo className="w-4 h-4 text-gray-600" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            <button onClick={() => formatText('bold')} className="p-2 hover:bg-purple-50 rounded transition-colors" title="Bold">
              <Bold className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => formatText('italic')} className="p-2 hover:bg-purple-50 rounded transition-colors" title="Italic">
              <Italic className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => formatText('underline')} className="p-2 hover:bg-purple-50 rounded transition-colors" title="Underline">
              <Underline className="w-4 h-4 text-gray-600" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            <button onClick={() => formatText('alignLeft')} className="p-2 hover:bg-purple-50 rounded transition-colors" title="Align Left">
              <AlignLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => formatText('alignCenter')} className="p-2 hover:bg-purple-50 rounded transition-colors" title="Align Center">
              <AlignCenter className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => formatText('alignRight')} className="p-2 hover:bg-purple-50 rounded transition-colors" title="Align Right">
              <AlignRight className="w-4 h-4 text-gray-600" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            <button onClick={() => formatText('bulletList')} className="p-2 hover:bg-purple-50 rounded transition-colors" title="Bullet List">
              <List className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => formatText('numberedList')} className="p-2 hover:bg-purple-50 rounded transition-colors" title="Numbered List">
              <ListOrdered className="w-4 h-4 text-gray-600" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            <button onClick={() => formatText('link')} className="p-2 hover:bg-purple-50 rounded transition-colors" title="Insert Link">
              <Link className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => formatText('image')} className="p-2 hover:bg-purple-50 rounded transition-colors" title="Insert Image">
              <Image className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => formatText('code')} className="p-2 hover:bg-purple-50 rounded transition-colors" title="Code Block">
              <Code className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-purple-100 min-h-[calc(100vh-250px)] p-8 md:p-12">
              <textarea
                ref={editorRef}
                value={content}
                onChange={handleContentChange}
                placeholder="Start typing your document..."
                className="w-full min-h-[calc(100vh-300px)] text-gray-800 text-lg leading-relaxed focus:outline-none bg-transparent resize-none"
                style={{ fontFamily: 'Georgia, serif' }}
              />
            </div>

            {/* Document Info */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>{content.length} characters</span>
                <span>{content.split(/\s+/).filter(w => w).length} words</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Last edited 2 minutes ago</span>
              </div>
            </div>
          </div>
        </main>

        {/* Comments Sidebar */}
        {showComments && (
          <aside className="w-80 bg-white/80 backdrop-blur-sm border-l border-purple-100 shadow-lg overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">Comments</h3>
                <button onClick={() => setShowComments(false)} className="p-1 hover:bg-purple-50 rounded transition-colors">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Comment */}
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="flex items-start space-x-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold">
                      S
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-800 text-sm">Sarah Chen</span>
                        <span className="text-xs text-gray-500">10m ago</span>
                      </div>
                      <p className="text-gray-700 text-sm">
                        Great work on this section! Should we add more details about the timeline?
                      </p>
                    </div>
                  </div>
                  <button className="text-purple-600 text-sm font-medium hover:underline ml-11">
                    Reply
                  </button>
                </div>

                {/* Comment */}
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="flex items-start space-x-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                      Y
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-800 text-sm">You</span>
                        <span className="text-xs text-gray-500">5m ago</span>
                      </div>
                      <p className="text-gray-700 text-sm">
                        Yes, I'll add that in the next revision. Thanks for the feedback!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Comment */}
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="flex items-start space-x-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-sm font-semibold">
                      A
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-800 text-sm">Alex Kim</span>
                        <span className="text-xs text-gray-500">1h ago</span>
                      </div>
                      <p className="text-gray-700 text-sm">
                        Can we schedule a call to discuss the budget section?
                      </p>
                    </div>
                  </div>
                  <button className="text-purple-600 text-sm font-medium hover:underline ml-11">
                    Reply
                  </button>
                </div>
              </div>

              {/* Add Comment */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <textarea
                  placeholder="Add a comment..."
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 resize-none"
                  rows={3}
                />
                <button className="mt-2 w-full py-2 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                  Post Comment
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowSidebar(false)}>
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            {/* Sidebar content can go here */}
          </div>
        </div>
      )}
    </div>
  );
}