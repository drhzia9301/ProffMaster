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
                text: obj.question,
                correctIndex: obj.correct_index,
            };
        });
    }
}

export const dbService = DatabaseService.getInstance();
