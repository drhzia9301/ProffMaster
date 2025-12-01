import { Note } from '../types';

const STORAGE_KEY_NOTES = 'supersix_ai_notes';

export const notesService = {
    getNotes: (): Note[] => {
        try {
            const data = localStorage.getItem(STORAGE_KEY_NOTES);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load notes:', error);
            return [];
        }
    },

    saveNote: (note: Note): void => {
        try {
            const notes = notesService.getNotes();
            // Check if updating existing
            const index = notes.findIndex(n => n.id === note.id);
            if (index >= 0) {
                notes[index] = note;
            } else {
                notes.unshift(note); // Add to top
            }
            localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
        } catch (error) {
            console.error('Failed to save note:', error);
            throw error;
        }
    },

    deleteNote: (id: string): void => {
        try {
            const notes = notesService.getNotes().filter(n => n.id !== id);
            localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
        } catch (error) {
            console.error('Failed to delete note:', error);
            throw error;
        }
    },

    getNoteById: (id: string): Note | undefined => {
        return notesService.getNotes().find(n => n.id === id);
    }
};
