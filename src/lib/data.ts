import type { Device } from './types';

const now = new Date();

const generateHistoricalData = (baseLevel: number) => {
  const data = [];
  for (let i = 20; i > 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60000).toISOString();
    const coLevel = parseFloat(
      (baseLevel + Math.random() * 5 - 2.5).toFixed(2)
    );
    data.push({ coLevel: Math.max(0, coLevel), timestamp });
  }
  return data;
};

export const initialDevices: Device[] = [
  {
    id: 'DEV001',
    name: 'Downtown Office',
    location: '123 Main St, Metropolis',
    coords: { lat: 40.7128, lng: -74.006 },
    status: 'Normal',
    coLevel: 5.2,
    timestamp: now.toISOString(),
    historicalData: generateHistoricalData(5),
  },
  {
    id: 'DEV002',
    name: 'Industrial Park Unit 7',
    location: '456 Factory Rd, Gotham',
    coords: { lat: 40.73, lng: -74.02 },
    status: 'Warning',
    coLevel: 9.8,
    timestamp: new Date(now.getTime() - 2 * 60000).toISOString(),
    historicalData: generateHistoricalData(9),
  },
  {
    id: 'DEV003',
    name: 'Suburban Residence',
    location: '789 Oak Ave, Smallville',
    coords: { lat: 40.69, lng: -73.98 },
    status: 'Normal',
    coLevel: 2.1,
    timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
    historicalData: generateHistoricalData(2),
  },
  {
    id: 'DEV004',
    name: 'Central Station Platform 3',
    location: '101 Rail Way, Star City',
    coords: { lat: 40.75, lng: -73.99 },
    status: 'Normal',
    coLevel: 6.5,
    timestamp: new Date(now.getTime() - 1 * 60000).toISOString(),
    historicalData: generateHistoricalData(6),
  },
    {
    id: 'DEV005',
    name: 'City Library Basement',
    location: '212 Knowledge Blvd, Central City',
    coords: { lat: 40.70, lng: -74.01 },
    status: 'Normal',
    coLevel: 4.3,
    timestamp: new Date(now.getTime() - 3 * 60000).toISOString(),
    historicalData: generateHistoricalData(4),
  },
];
