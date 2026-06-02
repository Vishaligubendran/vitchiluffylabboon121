require('./helpers/testEnv');

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { LocationService } = require('../src/services/locationService');

describe('Location service', () => {
  test('lookupPincode parses India Post API response', async () => {
    const mockFetch = async () => ({
      ok: true,
      json: async () => ({
        Status: 'Success',
        PostOffice: [
          { Name: 'Egmore', State: 'Tamil Nadu', District: 'Chennai', Country: 'India' },
          { Name: 'Park Town', State: 'Tamil Nadu', District: 'Chennai', Country: 'India' },
        ],
      }),
    });

    const service = new LocationService(mockFetch);
    const result = await service.lookupPincode('600002');

    assert.equal(result.pincode, '600002');
    assert.equal(result.state, 'Tamil Nadu');
    assert.deepEqual(result.areas.sort(), ['Egmore', 'Park Town']);
  });

  test('reverseGeocode returns address fields', async () => {
    const mockFetch = async () => ({
      ok: true,
      json: async () => ({
        display_name: 'Chennai, Tamil Nadu, India',
        address: {
          state: 'Tamil Nadu',
          postcode: '600028',
          suburb: 'T Nagar',
          city: 'Chennai',
        },
      }),
    });

    const service = new LocationService(mockFetch);
    const result = await service.reverseGeocode(13.04, 80.23);

    assert.equal(result.state, 'Tamil Nadu');
    assert.equal(result.pincode, '600028');
    assert.equal(result.area, 'T Nagar');
  });
});
