// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Spin Wheel API Types
export interface SpinResult {
  id: string;
  itemId: string;
  itemName: string;
  itemColor: string;
  timestamp: string;
  userId?: string;
}

export interface SpinHistory {
  id: string;
  results: SpinResult[];
  totalSpins: number;
  createdAt: string;
  updatedAt: string;
}

export interface SpinWheelConfig {
  id: string;
  name: string;
  items: SpinWheelItem[];
  settings: SpinWheelSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SpinWheelItem {
  id: string;
  name: string;
  color: string;
  probability: number;
  isActive: boolean;
}

export interface SpinWheelSettings {
  autoSpin: boolean;
  soundEnabled: boolean;
  showHistory: boolean;
  maxSpins: number;
}

// API Request Types
export interface CreateSpinRequest {
  wheelId: string;
  userId?: string;
}

export interface UpdateWheelRequest {
  name?: string;
  items?: SpinWheelItem[];
  settings?: Partial<SpinWheelSettings>;
  isActive?: boolean;
}

export interface CreateWheelRequest {
  name: string;
  items: SpinWheelItem[];
  settings?: Partial<SpinWheelSettings>;
}

// Error Types
export interface ApiError {
  status: number;
  message: string;
  details?: any;
}
