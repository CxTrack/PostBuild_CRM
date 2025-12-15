// Hash function to generate consistent color for each user
export const hashUserId = (userId: string): number => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Color palette for different users (excluding purple which is reserved for current user)
// Format: [colorName][brightnessLevel] = hex color
// Brightness levels: 0=600 (darkest), 1=500, 2=400, 3=300, 4=200 (lightest)
export const colorMap: Record<string, Record<number, string>> = {
  // Purple for current user
  purple: {
    0: '#9333ea', // purple-600
    1: '#a855f7', // purple-500
    2: '#c084fc', // purple-400
    3: '#d8b4fe', // purple-300
    4: '#e9d5ff', // purple-200
  },
  // Blue for other users
  blue: {
    0: '#2563eb', // blue-600
    1: '#3b82f6', // blue-500
    2: '#60a5fa', // blue-400
    3: '#93c5fd', // blue-300
    4: '#bfdbfe', // blue-200
  },
  // Green for other users
  green: {
    0: '#059669', // green-600
    1: '#10b981', // green-500
    2: '#34d399', // green-400
    3: '#6ee7b7', // green-300
    4: '#a7f3d0', // green-200
  },
  // Orange for other users
  orange: {
    0: '#ea580c', // orange-600
    1: '#f97316', // orange-500
    2: '#fb923c', // orange-400
    3: '#fdba74', // orange-300
    4: '#fed7aa', // orange-200
  },
  // Red for other users
  red: {
    0: '#dc2626', // red-600
    1: '#ef4444', // red-500
    2: '#f87171', // red-400
    3: '#fca5a5', // red-300
    4: '#fecaca', // red-200
  },
  // Indigo for other users
  indigo: {
    0: '#4f46e5', // indigo-600
    1: '#6366f1', // indigo-500
    2: '#818cf8', // indigo-400
    3: '#a5b4fc', // indigo-300
    4: '#c7d2fe', // indigo-200
  },
  // Teal for other users
  teal: {
    0: '#0d9488', // teal-600
    1: '#14b8a6', // teal-500
    2: '#2dd4bf', // teal-400
    3: '#5eead4', // teal-300
    4: '#99f6e4', // teal-200
  },
  // Pink for other users
  pink: {
    0: '#db2777', // pink-600
    1: '#ec4899', // pink-500
    2: '#f472b6', // pink-400
    3: '#f9a8d4', // pink-300
    4: '#fbcfe8', // pink-200
  },
  // Yellow for other users
  yellow: {
    0: '#ca8a04', // yellow-600
    1: '#eab308', // yellow-500
    2: '#facc15', // yellow-400
    3: '#fde047', // yellow-300
    4: '#fef08a', // yellow-200
  },
};

export const userColorNames = ['blue', 'green', 'orange', 'red', 'indigo', 'teal', 'pink', 'yellow'];

// Color hex values for each user color (using 500 shade as default for legend)
export const userColors: Record<string, string> = {
  purple: '#a855f7', // purple-500 (for current user)
  blue: '#3b82f6',   // blue-500
  green: '#10b981',  // green-500
  orange: '#f97316', // orange-500
  red: '#ef4444',    // red-500
  indigo: '#6366f1', // indigo-500
  teal: '#14b8a6',   // teal-500
  pink: '#ec4899',   // pink-500
  yellow: '#eab308', // yellow-500
};

// Get brightness level based on event type
// Order from darkest to brightest: custom -> task -> invoice -> expense -> holiday
export const getBrightnessLevel = (type: string): number => {
  const brightnessMap: Record<string, number> = {
    'custom': 0,     // darkest (600)
    'task': 1,       // 500
    'invoice': 2,    // 400
    'expense': 3,    // 300
    'holiday': 4,    // lightest (200)
  };
  return brightnessMap[type] ?? 2; // default to 400 (invoice level)
};

// Get color for a calendar based on user_id (for legend/selector)
export const getCalendarColor = (userId: string, currentUserId: string | null | undefined): string => {
  // If it's the current user, use purple
  if (currentUserId && userId === currentUserId) {
    return userColors.purple;
  }
  
  // For other users, assign consistent color based on user_id
  const hash = hashUserId(userId);
  const colorIndex = hash % userColorNames.length;
  const colorName = userColorNames[colorIndex];
  return userColors[colorName] || '#6b7280'; // default gray
};

// Get event color based on user_id and event type (for calendar events)
export const getEventColor = (
  userId: string | undefined,
  eventType: string,
  currentUserId: string | null | undefined
): string => {
  if (!userId) {
    return '#6b7280'; // default gray
  }

  const brightness = getBrightnessLevel(eventType);
  
  // If it's the current user's event, use purple
  if (currentUserId && userId === currentUserId) {
    return colorMap.purple[brightness] || colorMap.purple[2];
  }
  
  // For other users, assign consistent color based on user_id
  const hash = hashUserId(userId);
  const colorIndex = hash % userColorNames.length;
  const colorName = userColorNames[colorIndex];
  return colorMap[colorName]?.[brightness] || '#6b7280';
};

