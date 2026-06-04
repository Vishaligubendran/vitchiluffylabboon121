const { getDb } = require('../config/firebase');

class FirestoreService {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  getCollection() {
    return getDb().collection(this.collectionName);
  }

  async create(data, id = null) {
    const collection = this.getCollection();
    const docRef = id ? collection.doc(id) : collection.doc();
    const now = new Date().toISOString();

    const document = {
      ...data,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    await docRef.set(document);

    return {
      id: docRef.id,
      ...document,
    };
  }

  async findById(id) {
    const doc = await this.getCollection().doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return { id: doc.id, ...doc.data() };
  }

  async findOne(field, value) {
    const snapshot = await this.getCollection()
      .where(field, '==', value)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async findMany(filters = {}, options = {}) {
    let query = this.getCollection();

    Object.entries(filters).forEach(([field, value]) => {
      query = query.where(field, '==', value);
    });

    if (options.orderBy) {
      query = query.orderBy(options.orderBy.field, options.orderBy.direction || 'desc');
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async update(id, data) {
    const docRef = this.getCollection().doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(updateData);

    return { id, ...doc.data(), ...updateData };
  }

  async delete(id) {
    const docRef = this.getCollection().doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    await docRef.delete();
    return true;
  }
}

module.exports = FirestoreService;
