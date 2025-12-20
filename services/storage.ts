import { MemoryEntry, Goal } from '../types';
import { generateHistoricalData, generateMockGoals } from './mockData';

const DB_NAME = 'LifeSyncDB';
const DB_VERSION = 2; // Bump version for schema change
const STORES = {
  ENTRIES: 'entries',
  GOALS: 'goals',
  DAILY_REPORTS: 'daily_reports' // New Store for separate storage
};

// Open database connection
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("Your browser doesn't support a stable version of IndexedDB."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORES.ENTRIES)) {
        db.createObjectStore(STORES.ENTRIES, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.GOALS)) {
        db.createObjectStore(STORES.GOALS, { keyPath: 'id' });
      }

      // Create new store for Daily Reports
      if (!db.objectStoreNames.contains(STORES.DAILY_REPORTS)) {
        db.createObjectStore(STORES.DAILY_REPORTS, { keyPath: 'id' });
      }
    };
  });
};

// Generic helper for database transactions
const performTransaction = <T>(
  storeName: string, 
  mode: IDBTransactionMode, 
  callback: (store: IDBObjectStore) => IDBRequest<any> | void
): Promise<T> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      
      const request = callback(store);
      
      transaction.oncomplete = () => {
        if (request) {
           resolve(request.result);
        } else {
           resolve(undefined as T);
        }
      };
      
      transaction.onerror = () => reject(transaction.error);
    } catch (e) {
      reject(e);
    }
  });
};

export const storage = {
  // Entries & Reports Router
  saveEntry: (entry: MemoryEntry) => {
    // Route to correct store based on type
    const storeName = entry.type === 'daily_report' ? STORES.DAILY_REPORTS : STORES.ENTRIES;
    return performTransaction<void>(storeName, 'readwrite', (store) => store.put(entry));
  },
  
  // Fetch from both stores and merge
  getEntries: async () => {
    const getFromStore = (name: string) => performTransaction<MemoryEntry[]>(name, 'readonly', (store) => store.getAll());

    try {
        const [entries, reports] = await Promise.all([
            getFromStore(STORES.ENTRIES),
            getFromStore(STORES.DAILY_REPORTS)
        ]);
        // Combine them for the UI
        return [...(entries || []), ...(reports || [])];
    } catch (e) {
        console.error("Error fetching aggregated entries:", e);
        return [];
    }
  },

  deleteEntry: (id: string) => {
    // We try to delete from both because we might not know the type from ID alone immediately
    // Or we could perform a more complex check. For MVP, trying both is safe (idempotent).
    return new Promise<void>(async (resolve, reject) => {
        try {
            const db = await openDB();
            const tx = db.transaction([STORES.ENTRIES, STORES.DAILY_REPORTS], 'readwrite');
            tx.objectStore(STORES.ENTRIES).delete(id);
            tx.objectStore(STORES.DAILY_REPORTS).delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        } catch(e) { reject(e); }
    });
  },

  checkIsEmpty: async () => {
    // Just checking entries is sufficient to trigger seed
    const entries = await performTransaction<MemoryEntry[]>(STORES.ENTRIES, 'readonly', (store) => store.getAll());
    return (!entries || entries.length === 0);
  },

  seedMockData: async () => {
    console.log("Seeding historical mock data with segregated storage...");
    const db = await openDB();
    
    // Use a transaction that spans ALL stores
    const transaction = db.transaction([STORES.ENTRIES, STORES.DAILY_REPORTS, STORES.GOALS], 'readwrite');
    const entryStore = transaction.objectStore(STORES.ENTRIES);
    const reportStore = transaction.objectStore(STORES.DAILY_REPORTS);
    const goalStore = transaction.objectStore(STORES.GOALS);
    
    // 1. Seed Entries & Reports
    const historicalData = generateHistoricalData(30);
    let reportCount = 0;
    let entryCount = 0;

    historicalData.forEach(entry => {
      if (entry.type === 'daily_report') {
          reportStore.put(entry);
          reportCount++;
      } else {
          entryStore.put(entry);
          entryCount++;
      }
    });

    // 2. Seed Goals
    const mockGoals = generateMockGoals();
    mockGoals.forEach(goal => {
        goalStore.put(goal);
    });
    
    return new Promise<void>((resolve) => {
      transaction.oncomplete = () => {
        console.log(`Seeded complete: ${entryCount} Entries, ${reportCount} Reports, ${mockGoals.length} Goals.`);
        resolve();
      };
    });
  },

  clearDatabase: async () => {
      const db = await openDB();
      // Clear all 3 stores
      const transaction = db.transaction([STORES.ENTRIES, STORES.GOALS, STORES.DAILY_REPORTS], 'readwrite');
      transaction.objectStore(STORES.ENTRIES).clear();
      transaction.objectStore(STORES.GOALS).clear();
      transaction.objectStore(STORES.DAILY_REPORTS).clear();
      
      return new Promise<void>((resolve) => {
        transaction.oncomplete = () => resolve();
      });
  },

  // Goals
  saveGoal: (goal: Goal) => {
    return performTransaction<void>(STORES.GOALS, 'readwrite', (store) => store.put(goal));
  },

  getGoals: () => {
    return performTransaction<Goal[]>(STORES.GOALS, 'readonly', (store) => store.getAll());
  },
  
  deleteGoal: (id: string) => {
    return performTransaction<void>(STORES.GOALS, 'readwrite', (store) => store.delete(id));
  }
};
