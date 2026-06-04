const FirestoreService = require('./firestoreService');
const { COLLECTIONS, KYC_STATUS } = require('../config/constants');
const ApiError = require('../utils/ApiError');

class KycService extends FirestoreService {
  constructor() {
    super(COLLECTIONS.SELLER_KYC);
  }

  async findBySellerId(sellerId) {
    return this.findOne('sellerId', sellerId);
  }

  async createPlaceholder(sellerId) {
    const existing = await this.findBySellerId(sellerId);
    if (existing) return existing;

    return this.create({
      sellerId,
      kycStatus: KYC_STATUS.PENDING,
      submittedAt: null,
    });
  }

  async submitKyc(sellerId, kycData) {
    const existing = await this.findBySellerId(sellerId);

    const payload = {
      sellerId,
      businessName: kycData.businessName,
      businessType: kycData.businessType,
      shopName: kycData.shopName,
      ownerName: kycData.ownerName,
      email: kycData.email,
      mobile: kycData.mobile,
      is24x7: kycData.is24x7 === true || kycData.is24x7 === 'true',
      state: kycData.state,
      pincode: kycData.pincode,
      area: kycData.area,
      address: kycData.address,
      latitude: parseFloat(kycData.latitude) || null,
      longitude: parseFloat(kycData.longitude) || null,
      aadhaarNumber: kycData.aadhaarNumber,
      panNumber: kycData.panNumber?.toUpperCase(),
      gstin: kycData.gstin?.toUpperCase(),
      documentUrls: kycData.documentUrls,
      kycStatus: KYC_STATUS.PENDING,
      submittedAt: new Date().toISOString(),
      rejectionReason: null,
    };

    if (existing) {
      return this.update(existing.id, payload);
    }
    return this.create(payload);
  }

  async getKycStatus(sellerId) {
    const kyc = await this.findBySellerId(sellerId);
    if (!kyc) throw ApiError.notFound('KYC record not found');
    return kyc;
  }

  async getPendingKyc() {
    const pending = await this.findMany({ kycStatus: KYC_STATUS.PENDING });
    return pending
      .filter((k) => k.submittedAt && k.documentUrls && Object.keys(k.documentUrls).length > 0)
      .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
  }

  async approveKyc(sellerId, adminId) {
    const kyc = await this.findBySellerId(sellerId);
    if (!kyc) throw ApiError.notFound('KYC record not found');
    if (!kyc.submittedAt || !kyc.documentUrls || Object.keys(kyc.documentUrls).length === 0) {
      throw ApiError.badRequest('Seller has not submitted KYC documents');
    }
    if (kyc.kycStatus === KYC_STATUS.APPROVED) {
      throw ApiError.badRequest('KYC is already approved');
    }
    return this.update(kyc.id, {
      kycStatus: KYC_STATUS.APPROVED,
      reviewedBy: adminId,
      reviewedAt: new Date().toISOString(),
      rejectionReason: null,
    });
  }

  async rejectKyc(sellerId, adminId, reason) {
    const kyc = await this.findBySellerId(sellerId);
    if (!kyc) throw ApiError.notFound('KYC record not found');
    if (kyc.kycStatus === KYC_STATUS.REJECTED) {
      throw ApiError.badRequest('KYC is already rejected');
    }
    return this.update(kyc.id, {
      kycStatus: KYC_STATUS.REJECTED,
      reviewedBy: adminId,
      reviewedAt: new Date().toISOString(),
      rejectionReason: reason,
    });
  }
}

module.exports = new KycService();
