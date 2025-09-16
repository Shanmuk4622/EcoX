export type Device = {
  id: string;
  name: string;
  location: string;
  coords: {
    lat: number;
    lng: number;
  };
  status: 'Normal' | 'Warning' | 'Critical';
  coLevel: number;
  timestamp: string;
  historicalData: {
    coLevel: number;
    timestamp: string;
  }[];
};

export type Alert = {
  id: string;
  deviceId: string;
  deviceName: string;
  location?: string;
  message: string;
  timestamp: string;
  severity: 'Warning' | 'Critical';
};
