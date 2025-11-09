# Frontend Integration Guide

Complete guide for connecting your frontend application to the Gas Station RFID API.

## Table of Contents

1. [Quick Start](#quick-start)
2. [API Configuration](#api-configuration)
3. [Authentication Flow](#authentication-flow)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Request/Response Examples](#requestresponse-examples)
6. [Error Handling](#error-handling)
7. [TypeScript Types](#typescript-types)
8. [React Example](#react-example)
9. [React Native Example](#react-native-example)

---

## Quick Start

### 1. API Base URL

```javascript
const API_BASE_URL = 'http://localhost:4000/api/v1';
```

**Note:** The backend runs on port **4000** (configured in `.env`), not 3000.

### 2. CORS Configuration

The backend accepts requests from: `http://localhost:8081`

If your frontend runs on a different port, update the `.env` file:
```env
CORS_ORIGIN=http://localhost:YOUR_PORT
```

For multiple origins:
```env
CORS_ORIGIN=http://localhost:8081,http://localhost:3000
```

---

## API Configuration

### Axios Setup (Recommended)

```bash
npm install axios
```

```javascript
// src/api/client.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:4000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Fetch API Setup (Alternative)

```javascript
// src/api/client.js
const API_BASE_URL = 'http://localhost:4000/api/v1';

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken');

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Request failed');
  }

  return data;
}

export default apiRequest;
```

---

## Authentication Flow

### 1. Login

```javascript
// src/api/auth.js
import apiClient from './client';

export const login = async (username, password) => {
  const response = await apiClient.post('/auth/login', {
    username,
    password,
  });

  // Store token
  localStorage.setItem('accessToken', response.data.accessToken);
  localStorage.setItem('user', JSON.stringify(response.data.user));

  return response.data;
};
```

**Request:**
```javascript
await login('admin', 'admin123');
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": {
      "id": 1,
      "username": "admin",
      "fullName": "System Administrator",
      "role": "ADMIN"
    }
  }
}
```

### 2. Get Current User

```javascript
export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};
```

### 3. Logout

```javascript
export const logout = async () => {
  await apiClient.post('/auth/logout');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
};
```

---

## API Endpoints Reference

### Authentication

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/login` | No | User login |
| GET | `/auth/me` | Yes | Get current user info |
| POST | `/auth/logout` | Yes | User logout |

### Gas Stations

| Method | Endpoint | Auth Required | Admin Only | Description |
|--------|----------|---------------|------------|-------------|
| GET | `/stations` | Yes | No | List all stations |
| GET | `/stations/:id` | Yes | No | Get station details |
| POST | `/stations` | Yes | Yes | Create new station |
| PUT | `/stations/:id` | Yes | Yes | Update station |
| DELETE | `/stations/:id` | Yes | Yes | Delete station |

### Pumps

| Method | Endpoint | Auth Required | Admin Only | Description |
|--------|----------|---------------|------------|-------------|
| GET | `/stations/:stationId/pumps` | Yes | No | List pumps for station |
| GET | `/pumps/:id` | Yes | No | Get pump details |
| POST | `/stations/:stationId/pumps` | Yes | Yes | Create new pump |
| PUT | `/pumps/:id` | Yes | Yes | Update pump |
| DELETE | `/pumps/:id` | Yes | Yes | Delete pump |

### RFID Verification

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/pumps/:id/verify` | Yes | Verify RFID tags |
| GET | `/pumps/:id/verifications` | Yes | Get verification history |
| GET | `/verifications/:sessionId` | Yes | Get session details |

---

## Request/Response Examples

### Get All Stations

```javascript
// src/api/stations.js
import apiClient from './client';

export const getStations = async (params = {}) => {
  const response = await apiClient.get('/stations', { params });
  return response.data;
};

// Usage
const stations = await getStations({
  page: 1,
  limit: 10,
  status: 'ACTIVE'
});
```

### Create Station (Admin Only)

```javascript
export const createStation = async (stationData) => {
  const response = await apiClient.post('/stations', stationData);
  return response.data;
};

// Usage
const newStation = await createStation({
  name: 'Shell Centar',
  location: 'Centar, Skopje'
});
```

### Get Pumps for Station

```javascript
// src/api/pumps.js
import apiClient from './client';

export const getStationPumps = async (stationId) => {
  const response = await apiClient.get(`/stations/${stationId}/pumps`);
  return response.data;
};

// Usage
const pumps = await getStationPumps(1);
```

### Verify RFID Tags (Main Feature)

```javascript
export const verifyPump = async (pumpId, verificationData) => {
  const response = await apiClient.post(`/pumps/${pumpId}/verify`, verificationData);
  return response.data;
};

// Usage - Successful verification
const result = await verifyPump(1, {
  mainTagScanned: 'MAIN-TAG-001',
  scannedChildTags: ['CHILD-001-A', 'CHILD-001-B', 'CHILD-001-C']
});

// result.result === 'success' or 'failed'
// result.pumpStatus === 'LOCKED' or 'BROKEN'
```

### Get Verification History

```javascript
export const getVerificationHistory = async (pumpId, params = {}) => {
  const response = await apiClient.get(`/pumps/${pumpId}/verifications`, { params });
  return response.data;
};

// Usage
const history = await getVerificationHistory(1, {
  page: 1,
  limit: 20,
  result: 'FAILED' // Optional filter
});
```

---

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [] // Optional, for validation errors
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_CREDENTIALS` | 401 | Wrong username/password |
| `INVALID_TOKEN` | 401 | Token expired or invalid |
| `INSUFFICIENT_PERMISSIONS` | 403 | Admin role required |
| `RESOURCE_NOT_FOUND` | 404 | Station/Pump not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `DUPLICATE_RESOURCE` | 409 | RFID tag already in use |

### Error Handling Example

```javascript
try {
  const result = await verifyPump(1, verificationData);

  if (result.result === 'failed') {
    // Verification failed - show alert
    alert(`ALERT: ${result.message}`);
    console.log('Missing tags:', result.details.missingTags);
    console.log('Unexpected tags:', result.details.unexpectedTags);
  } else {
    // Success
    console.log('Pump verified successfully');
  }
} catch (error) {
  if (error.response?.status === 401) {
    // Unauthorized - redirect to login
    redirectToLogin();
  } else if (error.response?.status === 404) {
    // Pump not found
    alert('Pump not found');
  } else {
    // Other errors
    alert(error.response?.data?.error?.message || 'Something went wrong');
  }
}
```

---

## TypeScript Types

```typescript
// src/types/api.ts

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'OPERATOR';
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface GasStation {
  id: number;
  name: string;
  location: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  createdAt: string;
  updatedAt: string;
}

export interface Pump {
  id: number;
  gasStationId: number;
  pumpNumber: number;
  mainRfidTag: string;
  status: 'LOCKED' | 'UNLOCKED' | 'BROKEN' | 'MAINTENANCE';
  createdAt: string;
  updatedAt: string;
  expectedChildTags?: ExpectedChildTag[];
}

export interface ExpectedChildTag {
  id: number;
  tagId: string;
  description: string;
}

export interface VerificationRequest {
  mainTagScanned: string;
  scannedChildTags: string[];
}

export interface VerificationResponse {
  sessionId: number;
  result: 'success' | 'failed';
  message: string;
  details: {
    expectedCount: number;
    scannedCount: number;
    missingTags: string[];
    unexpectedTags: string[];
  };
  pumpStatus: 'LOCKED' | 'BROKEN';
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}
```

---

## React Example

### Authentication Context

```jsx
// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (token) {
      getCurrentUser()
        .then(userData => setUser(userData))
        .catch(() => localStorage.removeItem('accessToken'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const data = await apiLogin(username, password);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### Login Component

```jsx
// src/components/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(username, password);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Login</button>
    </form>
  );
}
```

### Stations List Component

```jsx
// src/components/StationsList.jsx
import React, { useState, useEffect } from 'react';
import { getStations } from '../api/stations';

export default function StationsList() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const data = await getStations();
        setStations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Gas Stations</h1>
      <ul>
        {stations.map(station => (
          <li key={station.id}>
            <strong>{station.name}</strong> - {station.location}
            <span className={`status ${station.status}`}>{station.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### RFID Verification Component

```jsx
// src/components/RFIDVerification.jsx
import React, { useState } from 'react';
import { verifyPump } from '../api/pumps';

export default function RFIDVerification({ pumpId }) {
  const [mainTag, setMainTag] = useState('');
  const [childTags, setChildTags] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const data = await verifyPump(pumpId, {
        mainTagScanned: mainTag,
        scannedChildTags: childTags.split(',').map(tag => tag.trim()),
      });

      setResult(data);
    } catch (err) {
      setResult({
        result: 'error',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Verify RFID Tags</h2>
      <form onSubmit={handleVerify}>
        <input
          type="text"
          placeholder="Main Tag (e.g., MAIN-TAG-001)"
          value={mainTag}
          onChange={(e) => setMainTag(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Child Tags (comma separated)"
          value={childTags}
          onChange={(e) => setChildTags(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      {result && (
        <div className={`result ${result.result}`}>
          <h3>{result.result === 'success' ? '✓ Success' : '✗ Failed'}</h3>
          <p>{result.message}</p>
          {result.details && (
            <div>
              <p>Expected: {result.details.expectedCount}</p>
              <p>Scanned: {result.details.scannedCount}</p>
              {result.details.missingTags?.length > 0 && (
                <p className="error">Missing: {result.details.missingTags.join(', ')}</p>
              )}
              {result.details.unexpectedTags?.length > 0 && (
                <p className="error">Unexpected: {result.details.unexpectedTags.join(', ')}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## React Native Example

### API Client for React Native

```javascript
// src/api/client.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://YOUR_COMPUTER_IP:4000/api/v1', // Use your computer's IP, not localhost
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('accessToken');
      // Navigate to login screen
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Login Screen

```jsx
// src/screens/LoginScreen.jsx
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../api/auth';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const data = await login(username, password);
      await AsyncStorage.setItem('accessToken', data.accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      navigation.replace('Dashboard');
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.error?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title={loading ? 'Logging in...' : 'Login'} onPress={handleLogin} disabled={loading} />
    </View>
  );
}
```

### RFID Scanner Screen (with barcode scanner)

```jsx
// src/screens/RFIDScannerScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner'; // Install: expo install expo-barcode-scanner
import { verifyPump } from '../api/pumps';

export default function RFIDScannerScreen({ route }) {
  const { pumpId } = route.params;
  const [hasPermission, setHasPermission] = useState(null);
  const [scannedTags, setScannedTags] = useState([]);
  const [mainTag, setMainTag] = useState(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    if (!mainTag) {
      setMainTag(data);
      Alert.alert('Main Tag Scanned', `Tag: ${data}`);
    } else {
      setScannedTags([...scannedTags, data]);
      Alert.alert('Child Tag Scanned', `Tag: ${data}`);
    }
  };

  const handleVerify = async () => {
    setScanning(false);
    try {
      const result = await verifyPump(pumpId, {
        mainTagScanned: mainTag,
        scannedChildTags: scannedTags,
      });

      Alert.alert(
        result.result === 'success' ? 'Verification Success' : 'Verification Failed',
        result.message
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      {scanning && (
        <BarCodeScanner
          onBarCodeScanned={scanning ? handleBarCodeScanned : undefined}
          style={{ flex: 1 }}
        />
      )}
      <View style={{ padding: 20 }}>
        <Text>Main Tag: {mainTag || 'Not scanned'}</Text>
        <Text>Child Tags: {scannedTags.length}</Text>
        <Button title="Verify" onPress={handleVerify} disabled={!mainTag || scannedTags.length === 0} />
        <Button title="Reset" onPress={() => { setMainTag(null); setScannedTags([]); setScanning(true); }} />
      </View>
    </View>
  );
}
```

---

## Additional Notes

### Rate Limiting

The API has rate limiting enabled:
- **100 requests per minute** per IP address
- Exceeding this will result in `429 Too Many Requests` response

### Default Credentials

After seeding the database:

```
Admin:
  Username: admin
  Password: admin123

Controller:
  Username: controller
  Password: controller123
```

### Health Check Endpoint

```javascript
// Check if API is running
const response = await fetch('http://localhost:4000/health');
// Returns: { status: 'ok' }
```

---

## Troubleshooting

### CORS Errors

If you get CORS errors, make sure:
1. Your frontend URL is in the `CORS_ORIGIN` environment variable
2. Backend is running
3. You're not using `localhost` and `127.0.0.1` interchangeably

### 401 Unauthorized

- Check if token is stored correctly
- Check if token is being sent in `Authorization` header
- Token expires after 24 hours - user needs to login again

### Connection Refused

- Make sure backend is running on port **4000**
- For React Native, use your computer's IP address, not `localhost`
- Check firewall settings

---

**Need help? Check the [API_TESTING.md](./API_TESTING.md) for detailed endpoint testing examples.**
