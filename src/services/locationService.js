const ApiError = require('../utils/ApiError');

const DEFAULT_FETCH = global.fetch;

class LocationService {
  constructor(fetchImpl = DEFAULT_FETCH) {
    this.fetch = fetchImpl;
  }

  async lookupPincode(pincode) {
    if (!/^[0-9]{6}$/.test(pincode)) {
      throw ApiError.badRequest('Pincode must be 6 digits');
    }

    const response = await this.fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    if (!response.ok) {
      throw ApiError.badGateway('Pincode lookup service unavailable');
    }

    const data = await response.json();
    if (data.Status !== 'Success' || !data.PostOffice?.length) {
      throw ApiError.notFound('Invalid pincode or no areas found');
    }

    const offices = data.PostOffice;
    const state = offices[0].State;
    const areas = [...new Set(offices.map((o) => o.Name).filter(Boolean))];

    return {
      pincode,
      state,
      areas,
      district: offices[0].District,
      country: offices[0].Country,
    };
  }

  async reverseGeocode(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw ApiError.badRequest('Invalid coordinates');
    }

    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');

    const response = await this.fetch(url.toString(), {
      headers: {
        'User-Agent': '247Shop/1.0 (seller-onboarding)',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw ApiError.badGateway('Reverse geocoding service unavailable');
    }

    const data = await response.json();
    const addr = data.address || {};

    return {
      latitude: lat,
      longitude: lng,
      displayName: data.display_name,
      state: addr.state || null,
      pincode: addr.postcode || null,
      area: addr.suburb || addr.neighbourhood || addr.city_district || addr.village || null,
      city: addr.city || addr.town || addr.county || null,
      address: data.display_name,
    };
  }
}

const locationService = new LocationService();

module.exports = locationService;
module.exports.LocationService = LocationService;
