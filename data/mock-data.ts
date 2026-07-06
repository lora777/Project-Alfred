export type DetectionLabel = "coyote" | "Bruce" | "raccoon" | "unknown animal";

export type Camera = {
  id: string;
  name: string;
  location: string;
  status: "online" | "offline";
  lastDetected: DetectionLabel;
  confidence: number;
  timestamp: string;
  signal: number;
};

export type DetectionEvent = {
  id: string;
  label: DetectionLabel;
  camera: string;
  confidence: number;
  timestamp: string;
  needsReview?: boolean;
};

export const cameras: Camera[] = [
  {
    id: "cam-01",
    name: "Front Porch",
    location: "North entrance",
    status: "online",
    lastDetected: "coyote",
    confidence: 97.4,
    timestamp: "Today, 02:41:18 AM",
    signal: 92,
  },
  {
    id: "cam-02",
    name: "Backyard",
    location: "West perimeter",
    status: "online",
    lastDetected: "Bruce",
    confidence: 99.1,
    timestamp: "Yesterday, 11:17:04 PM",
    signal: 86,
  },
];

export const recentEvents: DetectionEvent[] = [
  {
    id: "EVT-2048",
    label: "coyote",
    camera: "Front Porch",
    confidence: 97.4,
    timestamp: "02:41 AM",
  },
  {
    id: "EVT-2047",
    label: "Bruce",
    camera: "Backyard",
    confidence: 99.1,
    timestamp: "11:17 PM",
  },
  {
    id: "EVT-2046",
    label: "raccoon",
    camera: "Backyard",
    confidence: 88.6,
    timestamp: "10:52 PM",
  },
  {
    id: "EVT-2045",
    label: "unknown animal",
    camera: "Front Porch",
    confidence: 61.2,
    timestamp: "09:38 PM",
  },
];

export const reviewQueue: DetectionEvent[] = [
  {
    id: "EVT-2044",
    label: "unknown animal",
    camera: "Backyard",
    confidence: 73.8,
    timestamp: "Yesterday, 08:14 PM",
    needsReview: true,
  },
  {
    id: "EVT-2043",
    label: "unknown animal",
    camera: "Front Porch",
    confidence: 68.5,
    timestamp: "Yesterday, 07:46 PM",
    needsReview: true,
  },
];

export const activeAlert = {
  active: true,
  label: "Coyote",
  camera: "Front Porch",
  detectedAt: "02:41:18 AM",
};
