/**
 * In-memory Firestore mock for automated tests.
 * Supports: set, get, update, delete, where+limit queries.
 */
class InMemoryFirestore {
  constructor() {
    this.collections = new Map();
  }

  reset() {
    this.collections.clear();
  }

  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }

    const docs = this.collections.get(name);

    return {
      doc: (id) => {
        const docId = id || `auto_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        return {
          id: docId,
          set: async (data) => {
            docs.set(docId, { ...data });
          },
          get: async () => {
            const exists = docs.has(docId);
            return {
              exists,
              id: docId,
              data: () => (exists ? docs.get(docId) : undefined),
            };
          },
          update: async (data) => {
            if (!docs.has(docId)) {
              throw new Error(`Document ${docId} not found`);
            }
            docs.set(docId, { ...docs.get(docId), ...data });
          },
          delete: async () => {
            docs.delete(docId);
          },
        };
      },
      where: (field, _op, value) => ({
        limit: (_n) => ({
          get: async () => {
            const matches = [];

            docs.forEach((data, id) => {
              if (data[field] === value) {
                matches.push({ id, data: () => data });
              }
            });

            return {
              empty: matches.length === 0,
              docs: matches,
            };
          },
        }),
        get: async () => {
          const matches = [];

          docs.forEach((data, id) => {
            if (data[field] === value) {
              matches.push({ id, data: () => data });
            }
          });

          return {
            empty: matches.length === 0,
            docs: matches,
          };
        },
      }),
      get: async () => ({
        docs: Array.from(docs.entries()).map(([id, data]) => ({
          id,
          data: () => data,
        })),
      }),
    };
  }
}

module.exports = InMemoryFirestore;
