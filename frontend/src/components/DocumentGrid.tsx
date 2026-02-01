import { FileText, Share2, Users } from "lucide-react";
import DocumentOptionsDropdown from "./DocumentOptionsDropdown";
import type { Doc } from "../lib/utils";

function DocumentGrid({
    docs,
    onOpen,
    onShare,
    onToggleStar
}: {
    docs: Doc[];
    onOpen: (id: string) => void;
    onShare: (id: string) => void;
    onToggleStar: (id: string) => void;
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {docs.map((doc) => (
                <div
                    key={doc._id.$oid}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-100 hover:border-purple-300 hover:shadow-xl transform hover:-translate-y-1 transition-all cursor-pointer group"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div
                            onClick={() => onOpen(doc._id.$oid)}
                            className="bg-linear-to-br from-purple-100 to-pink-100 p-3 rounded-xl"
                        >
                            <FileText className="w-6 h-6 text-purple-600" />
                        </div>

                        <DocumentOptionsDropdown
                            onEdit={() => onOpen(doc._id.$oid)}
                            onDelete={() => console.log("Delete", doc._id.$oid)}
                            onSave={() => console.log("Save", doc._id.$oid)}
                            onShare={() => onShare(doc._id.$oid)}
                        />
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-purple-600">
                        {doc.title}
                    </h3>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{doc.collaborators.length}</span>
                        </div>

                        {onToggleStar && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleStar(doc._id.$oid);
                                }}
                                className="p-1 rounded hover:bg-yellow-100"
                            >
                                {doc.starred ? "⭐" : "☆"}
                            </button>
                        )}
                    </div>


                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <span className="text-sm text-gray-600">
                            Author: {doc.author.name}
                        </span>
                        <button
                            onClick={() => onShare(doc._id.$oid)}
                            className="p-2 hover:bg-purple-50 rounded-lg"
                        >
                            <Share2 className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default DocumentGrid