import initSqlJs, { Database } from 'sql.js';

export class DatabaseService {
    private static instance: DatabaseService;
    private db: Database | null = null;
    private isInitializing = false;
    private isInitialized = false;
    private initPromise: Promise<void> | null = null;

    private constructor() { }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.log('Database already initialized, skipping...');
            return;
        }

        if (this.isInitializing && this.initPromise) {
            console.log('Database initialization in progress, waiting...');
            return this.initPromise;
        }

        this.isInitializing = true;
        this.initPromise = this._doInitialize();

        try {
            await this.initPromise;
            this.isInitialized = true;
        } finally {
            this.isInitializing = false;
        }
    }

    private async _doInitialize(): Promise<void> {
        try {
            console.log('🔧 Initializing SQL.js database...');

            const SQL = await initSqlJs({
                locateFile: (file) => `/assets/${file}`
            });
            console.log('✓ SQL.js initialized');

            const savedDb = await this.loadFromIndexedDB();
            if (savedDb) {
                try {
                    console.log('Loading existing database from IndexedDB...');
                    this.db = new SQL.Database(savedDb);
                    console.log('✓ Database loaded from storage');
                } catch (e) {
                    console.error('Failed to load database from storage, creating new one:', e);
                    this.db = new SQL.Database();
                    await this.seedDatabase();
                    await this.saveDatabase();
                }
            } else {
                console.log('Creating new database...');
                this.db = new SQL.Database();
                console.log('✓ New database created');

                await this.seedDatabase();
                await this.saveDatabase();
            }

            // Ensure preproff table exists (migration)
            try {
                this.db?.run(`
                    CREATE TABLE IF NOT EXISTS preproff_questions (
                        id TEXT PRIMARY KEY,
                        text TEXT,
                        options TEXT,
                        correct_index INTEGER,
                        explanation TEXT,
                        subject TEXT,
                        topic TEXT,
                        difficulty TEXT,
                        block TEXT,
                        college TEXT,
                        year TEXT
                    )
                `);
                console.log('✓ Preproff table verified');
            } catch (e) {
                console.error('Error creating preproff table:', e);
            }

            console.log('✓ Database initialization complete!');
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    private async saveDatabase(): Promise<void> {
        if (!this.db) return;

        try {
            const data = this.db.export();
            await this.saveToIndexedDB(data);
            console.log('✓ Database saved to IndexedDB');
        } catch (error) {
            console.error('Error saving database:', error);
        }
    }

    // --- IndexedDB Helpers ---

    private openIndexedDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('SuperSixDB', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                db.createObjectStore('sqlite', { keyPath: 'key' });
            };
        });
    }

    private async saveToIndexedDB(data: Uint8Array): Promise<void> {
        const db = await this.openIndexedDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['sqlite'], 'readwrite');
            const store = transaction.objectStore('sqlite');
            const request = store.put({ key: 'main_db', data });
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    private async loadFromIndexedDB(): Promise<Uint8Array | null> {
        try {
            const db = await this.openIndexedDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['sqlite'], 'readonly');
                const store = transaction.objectStore('sqlite');
                const request = store.get('main_db');
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    const result = request.result;
                    resolve(result ? result.data : null);
                };
            });
        } catch (error) {
            console.warn('Failed to load from IndexedDB:', error);
            return null;
        }
    }

    private async seedDatabase(): Promise<void> {
        if (!this.db) return;

        console.log('Seeding database from initial_db.enc...');
        try {
            const response = await fetch('/assets/initial_db.enc');
            if (!response.ok) {
                throw new Error(`Failed to fetch encrypted SQL file: ${response.status}`);
            }

            // Get encrypted buffer
            const encryptedBuffer = await response.arrayBuffer();
            const encryptedBytes = new Uint8Array(encryptedBuffer);

            console.log(`Loaded encrypted file, size: ${encryptedBytes.length} bytes`);

            // Decrypt
            const key = "SUPERSIX_SECURE_KEY_2025";
            const keyBytes = new TextEncoder().encode(key);
            const decryptedBytes = new Uint8Array(encryptedBytes.length);

            for (let i = 0; i < encryptedBytes.length; i++) {
                decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
            }

            const sql = new TextDecoder().decode(decryptedBytes);
            console.log(`Decrypted SQL, size: ${sql.length} characters`);

            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            console.log(`Found ${statements.length} SQL statements`);

            const BATCH_SIZE = 50;
            let executed = 0;

            for (let i = 0; i < statements.length; i += BATCH_SIZE) {
                const batch = statements.slice(i, Math.min(i + BATCH_SIZE, statements.length));

                for (const stmt of batch) {
                    if (stmt && stmt.trim()) {
                        try {
                            this.db.run(stmt);
                            executed++;
                        } catch (e) {
                            console.warn(`Error executing statement ${executed}:`, e);
                        }
                    }
                }

                const progress = Math.round((executed / statements.length) * 100);
                console.log(`✓ Executed ${executed}/${statements.length} statements (${progress}%)`);
            }

            console.log('✓ Database seeding complete!');

            try {
                const verifyCheck = this.db.exec("SELECT count(*) as count FROM questions");
                if (verifyCheck.length > 0) {
                    console.log(`✓ Verified: ${verifyCheck[0].values[0][0]} questions in database`);
                }
            } catch (error) {
                console.log('Unable to verify question count');
            }
        } catch (error) {
            console.error('Error seeding database:', error);
            throw error;
        }
    }

    public async getQuestionsBySubject(subject: string): Promise<any[]> {
        if (!this.db) {
            console.warn('Database not initialized in getQuestionsBySubject, attempting to initialize...');
            await this.initialize();
            if (!this.db) throw new Error('Database not initialized');
        }

        const result = this.db.exec(`SELECT * FROM questions WHERE subject = ?`, [subject]);
        return this.transformResults(result);
    }

    public async getQuestionsByTopic(topic: string): Promise<any[]> {
        if (!this.db) {
            await this.initialize();
            if (!this.db) throw new Error('Database not initialized');
        }

        const result = this.db.exec(`SELECT * FROM questions WHERE topic = ?`, [topic]);
        return this.transformResults(result);
    }

    private async fetchAndDecrypt(url: string): Promise<string> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        const encryptedBuffer = await response.arrayBuffer();
        const encryptedBytes = new Uint8Array(encryptedBuffer);
        const key = "SUPERSIX_SECURE_KEY_2025";
        const keyBytes = new TextEncoder().encode(key);
        const decryptedBytes = new Uint8Array(encryptedBytes.length);

        for (let i = 0; i < encryptedBytes.length; i++) {
            decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
        }

        return new TextDecoder().decode(decryptedBytes);
    }

    public async getPreproffQuestions(block: string, college: string, year: string): Promise<any[]> {
        if (!this.db) {
            await this.initialize();
            if (!this.db) throw new Error('Database not initialized');
        }

        // Check if we have data for this combination
        const check = this.db.exec(
            `SELECT count(*) as count FROM preproff_questions WHERE block = ? AND college = ? AND year = ?`,
            [block, college, year]
        );

        const count = check[0]?.values[0][0] as number;

        // Always fetch the file to check for updates
        try {
            const filename = `${college.toLowerCase()} ${block.replace('Block ', '')}.enc`;
            const text = await this.fetchAndDecrypt(`/qbanks/${filename}`);

            let rawQuestions: any[] = [];
            try {
                // Try parsing as JSON first
                let parsed = JSON.parse(text);
                if (Array.isArray(parsed)) rawQuestions = parsed.flat();
            } catch (jsonError) {
                // Fallback to text parsing if JSON fails
                console.log("JSON parse failed, attempting text parsing...");
                const questionRegex = /Question:\s*(.*?)\s*Options:\s*(.*?)(?=\nQuestion:|$)/gs;
                let match;
                while ((match = questionRegex.exec(text)) !== null) {
                    const questionText = match[1].trim();
                    const optionsText = match[2].trim();
                    // Split options by comma, but handle cases where commas are inside options?
                    // Simple split for now, assuming comma separated
                    const options = optionsText.split(',').map(o => o.trim());

                    if (questionText && options.length > 1) {
                        rawQuestions.push({
                            text: questionText,
                            options: options,
                            // We don't have correct index or explanation in this simple text format
                            // Defaulting to 0 and empty explanation
                            correctIndex: 0,
                            explanation: ""
                        });
                    }
                }
            }

            rawQuestions = rawQuestions.filter((q: any) => q && q.options && Array.isArray(q.options));

            if (count !== rawQuestions.length) {
                console.log(`Local count (${count}) differs from file count (${rawQuestions.length}). Re-importing...`);
                // Delete existing for this block to ensure clean state
                this.db.run(`DELETE FROM preproff_questions WHERE block = ? AND college = ? AND year = ?`, [block, college, year]);
                await this.importPreproffQuestions(block, college, year);
            }
        } catch (e) {
            console.error("Error checking for updates:", e);
        }

        const result = this.db.exec(
            `SELECT * FROM preproff_questions WHERE block = ? AND college = ? AND year = ?`,
            [block, college, year]
        );
        return this.transformResults(result);
    }

    private async importPreproffQuestions(block: string, college: string, year: string): Promise<void> {
        if (!this.db) return;

        try {
            // Construct filename e.g., "kmc J.enc"
            const filename = `${college.toLowerCase()} ${block.replace('Block ', '')}.enc`;
            console.log(`Fetching ${filename}...`);

            const text = await this.fetchAndDecrypt(`/qbanks/${filename}`);

            let rawQuestions: any[] = [];
            try {
                let parsed = JSON.parse(text);
                if (Array.isArray(parsed)) rawQuestions = parsed.flat();
            } catch (jsonError) {
                console.log("JSON parse failed during import, attempting text parsing...");
                const questionRegex = /Question:\s*(.*?)\s*Options:\s*(.*?)(?=\nQuestion:|$)/gs;
                let match;
                while ((match = questionRegex.exec(text)) !== null) {
                    const questionText = match[1].trim();
                    const optionsText = match[2].trim();
                    const options = optionsText.split(',').map(o => o.trim());

                    if (questionText && options.length > 1) {
                        rawQuestions.push({
                            text: questionText,
                            options: options,
                            correctIndex: 0,
                            explanation: ""
                        });
                    }
                }
            }

            // Handle nested arrays (flatten) - redundant if we init rawQuestions as [] but keeping for safety if logic changes
            if (Array.isArray(rawQuestions)) {
                rawQuestions = rawQuestions.flat();
            }

            // Filter out invalid questions
            rawQuestions = rawQuestions.filter((q: any) => q && q.options && Array.isArray(q.options));

            console.log(`Importing ${rawQuestions.length} questions...`);

            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO preproff_questions 
                (id, text, options, correct_index, explanation, subject, topic, difficulty, block, college, year)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            this.db.exec('BEGIN TRANSACTION');

            for (const q of rawQuestions) {
                // Transform Data
                // 1. Options: Remove "A. ", "B. " etc.
                const cleanOptions = q.options.map((opt: string) => opt.replace(/^[A-E]\.\s*/, ''));

                // 2. Answer: Convert "A", "B" to index 0, 1
                const answerMap: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4 };
                const correctIndex = answerMap[q.answer] ?? 0;

                stmt.run([
                    `${college}_${year}_${q.id}`, // Unique ID
                    q.question,
                    JSON.stringify(cleanOptions),
                    correctIndex,
                    q.explanation,
                    block, // Subject = Block for now
                    block, // Topic
                    'Medium',
                    block,
                    college,
                    year
                ]);
            }

            this.db.exec('COMMIT');
            stmt.free();
            await this.saveDatabase();
            console.log('✓ Import complete');

        } catch (error) {
            console.error('Error importing preproff questions:', error);
            try {
                this.db.exec('ROLLBACK');
            } catch (e) {
                // Ignore rollback error if no transaction was active
            }
            throw error;
        }
    }

    public async getAllQuestions(): Promise<any[]> {
        if (!this.db) {
            await this.initialize();
            if (!this.db) throw new Error('Database not initialized');
        }

        const result = this.db.exec(`SELECT * FROM questions`);
        return this.transformResults(result);
    }

    public async getWeakQuestions(): Promise<any[]> {
        if (!this.db) {
            await this.initialize();
            if (!this.db) throw new Error('Database not initialized');
        }

        const sql = `
            SELECT q.* 
            FROM questions q
            JOIN attempts a ON q.id = a.question_id
            WHERE a.timestamp = (
                SELECT MAX(timestamp) 
                FROM attempts 
                WHERE question_id = q.id
            )
            AND a.is_correct = 0
            GROUP BY q.id
        `;

        const result = this.db.exec(sql);
        return this.transformResults(result);
    }

    public async clearAttempts(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        this.db.run('DELETE FROM attempts');
        await this.saveDatabase();
    }

    public async saveAttempt(attempt: any): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const sql = `
            INSERT INTO attempts (question_id, selected_option_index, is_correct, timestamp, time_spent_seconds)
            VALUES (?, ?, ?, ?, ?)
        `;

        this.db.run(sql, [
            attempt.questionId,
            attempt.selectedOptionIndex,
            attempt.isCorrect ? 1 : 0,
            attempt.timestamp,
            attempt.timeSpentSeconds
        ]);

        await this.saveDatabase();
    }

    private transformResults(results: any[]): any[] {
        if (!results || results.length === 0) return [];

        const result = results[0];
        if (!result || !result.values) return [];

        const columns = result.columns;
        return result.values.map((row: any[]) => {
            const obj: any = {};
            columns.forEach((col: string, index: number) => {
                obj[col] = row[index];
            });

            return {
                ...obj,
                options: JSON.parse(obj.options || '[]'),
                tags: obj.topic ? [obj.topic] : [],
                text: obj.question || obj.text,
                correctIndex: obj.correct_index,
            };
        });
    }
}

export const dbService = DatabaseService.getInstance();
