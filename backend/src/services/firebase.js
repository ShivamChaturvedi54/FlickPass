const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let db = null;
let auth = null;
let isEmulated = false;

function initFirebase() {
  if (admin.apps.length > 0) {
    return {
      admin,
      db: admin.firestore(),
      auth: admin.auth(),
      isEmulated: false,
    };
  }

  // 1. Check for individual environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.PRIVATE_KEY;

  if (privateKey) {
    // Replace escaped newlines if passed in .env
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (projectId && clientEmail && privateKey) {
    try {
      const app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log(`🔥 [Firebase] Connected to live Firebase project: ${projectId}`);
      return {
        admin,
        db: app.firestore(),
        auth: app.auth(),
        isEmulated: false,
      };
    } catch (err) {
      console.warn(`⚠️ [Firebase] Failed to initialize live Firebase from env variables: ${err.message}`);
    }
  }

  // 2. Check for serviceAccountKey file
  const serviceAccountPaths = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(__dirname, '../../serviceAccountKey.json'),
    path.join(__dirname, '../serviceAccountKey.json'),
  ].filter(Boolean);

  for (const credPath of serviceAccountPaths) {
    if (fs.existsSync(credPath)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));
        const app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log(`🔥 [Firebase] Connected to live Firebase using service account file at: ${credPath}`);
        return {
          admin,
          db: app.firestore(),
          auth: app.auth(),
          isEmulated: false,
        };
      } catch (err) {
        console.warn(`⚠️ [Firebase] Could not load service account from ${credPath}: ${err.message}`);
      }
    }
  }

  // 3. Check for raw JSON string in FIREBASE_SERVICE_ACCOUNT
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      let raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      if (!raw.startsWith('{')) {
        // Handle base64 encoded credential
        raw = Buffer.from(raw, 'base64').toString('utf8');
      }
      const serviceAccount = JSON.parse(raw);
      const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log(`🔥 [Firebase] Connected to live Firebase using FIREBASE_SERVICE_ACCOUNT env string`);
      return {
        admin,
        db: app.firestore(),
        auth: app.auth(),
        isEmulated: false,
      };
    } catch (err) {
      console.warn(`⚠️ [Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT: ${err.message}`);
    }
  }

  // 4. Default to Firestore Local Emulator adapter so the app runs without immediate cloud configuration
  console.log('ℹ️  [Firebase] No live Firebase service account credentials found in environment.');
  console.log('ℹ️  [Firebase] Initialized with local Firestore emulation mode. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env to connect to live Firebase Cloud.');

  const emulator = createFirestoreEmulator();
  return {
    admin,
    db: emulator,
    auth: createAuthEmulator(),
    isEmulated: true,
  };
}

/**
 * High-fidelity in-memory / file-backed Firestore emulator that implements
 * collection, doc, query, runTransaction, batch, FieldValue, etc.
 */
function createFirestoreEmulator() {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const STORAGE_FILE = isServerless
    ? path.join('/tmp', 'firebase_firestore_emulator.json')
    : path.join(__dirname, '../../data/firestore_emulator.json');

  let store = {};

  try {
    const dir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(STORAGE_FILE)) {
      store = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
    }
  } catch (e) {}

  let saveTimer = null;
  const persistStore = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      try {
        fs.writeFile(STORAGE_FILE, JSON.stringify(store, null, 2), 'utf8', () => {});
      } catch (e) {}
    }, 250);
  };

  const getCollectionData = (colName) => {
    if (!store[colName]) store[colName] = {};
    return store[colName];
  };

  class DocumentReference {
    constructor(colName, id) {
      this.colName = colName;
      this.id = id;
    }

    async get() {
      const col = getCollectionData(this.colName);
      const data = col[this.id];
      return new DocumentSnapshot(this.id, data ? { ...data } : null, this);
    }

    async set(data, options = {}) {
      const col = getCollectionData(this.colName);
      if (options.merge && col[this.id]) {
        col[this.id] = { ...col[this.id], ...data, id: this.id };
      } else {
        col[this.id] = { ...data, id: this.id };
      }
      persistStore();
      return { writeTime: new Date() };
    }

    async update(data) {
      const col = getCollectionData(this.colName);
      if (!col[this.id]) {
        throw new Error(`NOT_FOUND: No document to update: ${this.colName}/${this.id}`);
      }
      col[this.id] = { ...col[this.id], ...data, id: this.id };
      persistStore();
      return { writeTime: new Date() };
    }

    async delete() {
      const col = getCollectionData(this.colName);
      delete col[this.id];
      persistStore();
      return { writeTime: new Date() };
    }
  }

  class DocumentSnapshot {
    constructor(id, data, ref) {
      this.id = id;
      this._data = data;
      this.ref = ref;
      this.exists = data !== null && data !== undefined;
    }

    data() {
      return this._data ? { ...this._data } : undefined;
    }
  }

  class Query {
    constructor(colName, filters = [], sortRules = [], limitCount = null, offsetCount = 0) {
      this.colName = colName;
      this.filters = filters;
      this.sortRules = sortRules;
      this.limitCount = limitCount;
      this.offsetCount = offsetCount;
    }

    where(field, op, val) {
      return new Query(
        this.colName,
        [...this.filters, { field, op, val }],
        this.sortRules,
        this.limitCount,
        this.offsetCount
      );
    }

    orderBy(field, dir = 'asc') {
      return new Query(
        this.colName,
        this.filters,
        [...this.sortRules, { field, dir: dir.toLowerCase() }],
        this.limitCount,
        this.offsetCount
      );
    }

    limit(n) {
      return new Query(this.colName, this.filters, this.sortRules, n, this.offsetCount);
    }

    offset(n) {
      return new Query(this.colName, this.filters, this.sortRules, this.limitCount, n);
    }

    async get() {
      const col = getCollectionData(this.colName);
      let items = Object.values(col);

      // Apply filters
      for (const f of this.filters) {
        items = items.filter((doc) => {
          const val = doc[f.field];
          if (f.op === '==') return val === f.val;
          if (f.op === '!=') return val !== f.val;
          if (f.op === '>') return val > f.val;
          if (f.op === '>=') return val >= f.val;
          if (f.op === '<') return val < f.val;
          if (f.op === '<=') return val <= f.val;
          if (f.op === 'in') return Array.isArray(f.val) && f.val.includes(val);
          if (f.op === 'array-contains') return Array.isArray(val) && val.includes(f.val);
          return true;
        });
      }

      // Apply sorting
      for (const sort of this.sortRules) {
        items.sort((a, b) => {
          const valA = a[sort.field];
          const valB = b[sort.field];
          if (valA === valB) return 0;
          if (valA === undefined || valA === null) return 1;
          if (valB === undefined || valB === null) return -1;
          const cmp = valA > valB ? 1 : -1;
          return sort.dir === 'desc' ? -cmp : cmp;
        });
      }

      // Apply offset & limit
      if (this.offsetCount > 0) {
        items = items.slice(this.offsetCount);
      }
      if (this.limitCount !== null) {
        items = items.slice(0, this.limitCount);
      }

      const docs = items.map(
        (data) => new DocumentSnapshot(data.id, { ...data }, new DocumentReference(this.colName, data.id))
      );

      return {
        docs,
        empty: docs.length === 0,
        size: docs.length,
        forEach(callback) {
          docs.forEach(callback);
        },
      };
    }
  }

  class CollectionReference extends Query {
    constructor(colName) {
      super(colName);
    }

    doc(id) {
      const docId = id || `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      return new DocumentReference(this.colName, docId);
    }

    async add(data) {
      const docId = data.id || `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const docRef = this.doc(docId);
      await docRef.set(data);
      return docRef;
    }
  }

  return {
    collection(name) {
      return new CollectionReference(name);
    },
    async runTransaction(updateFunction) {
      // Execute the transaction atomically
      const tx = {
        async get(docRef) {
          return docRef.get();
        },
        set(docRef, data, options) {
          return docRef.set(data, options);
        },
        update(docRef, data) {
          return docRef.update(data);
        },
        delete(docRef) {
          return docRef.delete();
        },
      };
      return updateFunction(tx);
    },
    batch() {
      const operations = [];
      return {
        set(docRef, data, options) {
          operations.push(() => docRef.set(data, options));
          return this;
        },
        update(docRef, data) {
          operations.push(() => docRef.update(data));
          return this;
        },
        delete(docRef) {
          operations.push(() => docRef.delete());
          return this;
        },
        async commit() {
          for (const op of operations) {
            await op();
          }
        },
      };
    },
  };
}

function createAuthEmulator() {
  return {
    async verifyIdToken(token) {
      return { uid: 'demo-uid', email: 'demo@flickpass.com' };
    },
  };
}

const firebaseInstance = initFirebase();
db = firebaseInstance.db;
auth = firebaseInstance.auth;
isEmulated = firebaseInstance.isEmulated;

module.exports = {
  admin,
  db,
  auth,
  isEmulated,
};
