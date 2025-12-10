import { Question } from '../types';

const STORAGE_KEY = 'supersix_saved_papers';

export interface SavedPaper {
    id: string;
    name: string;
    block: string;
    date: number;
    questions: Question[];
    type: 'full' | 'custom' | 'similar';
}

export const savePaper = (paper: SavedPaper) => {
    try {
        const existing = getSavedPapers();
        existing.unshift(paper); // Add to top
        // Limit to last 20 papers to save space
        if (existing.length > 20) existing.pop();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
        console.error('Failed to save paper:', e);
    }
};

export const getSavedPapers = (): SavedPaper[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Failed to load saved papers:', e);
        return [];
    }
};

export const deleteSavedPaper = (id: string) => {
    try {
        const existing = getSavedPapers();
        const filtered = existing.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return filtered;
    } catch (e) {
        console.error('Failed to delete paper:', e);
        return [];
    }
};
