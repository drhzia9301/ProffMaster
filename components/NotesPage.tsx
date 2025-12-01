import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Calendar, Tag, BookOpen, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Note } from '../types';
import { notesService } from '../services/notesService';

import { useTheme } from '../contexts/ThemeContext';

const NotesPage: React.FC = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = () => {
        setNotes(notesService.getNotes());
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this note?')) {
            notesService.deleteNote(id);
            loadNotes();
            if (selectedNote?.id === id) {
                setSelectedNote(null);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10 transition-colors duration-300">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
                    <button
                        onClick={() => selectedNote ? setSelectedNote(null) : navigate(-1)}
                        className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedNote ? 'Note Details' : 'My Study Notes'}
                    </h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {selectedNote ? (
                    // Note Detail View
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-fade-in transition-colors duration-300">
                        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 bg-indigo-50/30 dark:bg-indigo-900/20">
                            <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: theme === 'dark' ? 'white' : 'black' }}>{selectedNote.title}</h2>
                            <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: theme === 'dark' ? '#9ca3af' : '#1f2937' }}>
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={16} />
                                    {new Date(selectedNote.date).toLocaleDateString()}
                                </div>
                                {selectedNote.tags.length > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <Tag size={16} />
                                        {selectedNote.tags.join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-4 sm:p-6 prose prose-slate dark:prose-invert max-w-none w-full">
                            <ReactMarkdown
                                components={{
                                    h1: ({ node, ...props }) => <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-900 dark:text-indigo-300 mb-4 sm:mb-6 pb-2 border-b-2 border-indigo-100 dark:border-indigo-800" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mt-6 sm:mt-8 mb-3 sm:mb-4 flex items-center gap-2" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-lg sm:text-xl font-semibold text-indigo-700 dark:text-indigo-400 mt-4 sm:mt-6 mb-2 sm:mb-3" {...props} />,
                                    p: ({ node, ...props }) => <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4 text-base" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 sm:pl-6 space-y-2 mb-4 sm:mb-6 text-gray-700 dark:text-gray-300" {...props} />,
                                    li: ({ node, ...props }) => <li className="pl-1 leading-relaxed" {...props} />,
                                    strong: ({ node, ...props }) => <strong className="font-bold text-gray-900 dark:text-white bg-yellow-50 dark:bg-yellow-900/30 px-1 rounded border border-yellow-200 dark:border-yellow-700" {...props} />,
                                    em: ({ node, ...props }) => <em className="text-gray-900 dark:text-white font-medium not-italic bg-yellow-50 dark:bg-yellow-900/30 px-1 rounded border border-yellow-200 dark:border-yellow-700" {...props} />,
                                    blockquote: ({ node, ...props }) => (
                                        <blockquote className="border-l-4 border-indigo-500 dark:border-indigo-600 pl-3 sm:pl-4 py-2 my-4 sm:my-6 bg-indigo-50/50 dark:bg-indigo-900/30 rounded-r-lg text-gray-700 dark:text-gray-300" {...props} />
                                    ),
                                }}
                            >
                                {selectedNote.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                ) : (
                    // Notes List View
                    <div className="space-y-4">
                        {notes.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                                    <BookOpen size={32} className="text-gray-400 dark:text-gray-500" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Notes Yet</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Generate AI notes from your quiz sessions to see them here.
                                </p>
                            </div>
                        ) : (
                            notes.map(note => (
                                <div
                                    key={note.id}
                                    onClick={() => setSelectedNote(note)}
                                    className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {note.title}
                                            </h3>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {new Date(note.date).toLocaleDateString()}
                                                </span>
                                                {note.tags.length > 0 && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-slate-700 rounded-full">
                                                        <Tag size={12} />
                                                        {note.tags[0]} {note.tags.length > 1 && `+${note.tags.length - 1}`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, note.id)}
                                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotesPage;
