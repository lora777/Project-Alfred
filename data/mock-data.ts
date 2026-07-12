export type Camera = {
  id: string;
  name: string;
  location: string;
  code: string;
  status: "online" | "offline";
  feedLabel: string;
  qualityLabel: string;
  currentTimeLabel: string;
  signalStrength: number;
  lastDetected: {
    label: string;
    confidence: number;
    timestampLabel: string;
  };
  recording: boolean;
  feedVisual: {
    focalPoint: string;
    detectionZone: string;
    activityRegion: string;
  };
};

export type DetectionEvent = {
  id: string;
  label: string;
  cameraName: string;
  confidence: number;
  timeLabel: string;
  severity: "threat" | "safe" | "neutral" | "unknown";
};

export type CreateDetectionEventInput = Omit<DetectionEvent, "id">;

export type ReviewQueueItem = {
  id: string;
  title: string;
  cameraName: string;
  timestampLabel: string;
  suggestedLabels: string[];
};

export type DashboardStats = {
  eventsToday: number;
  storageLabel: string;
  threatStateLabel: "Active" | "Clear";
};

export type ActiveAlert = {
  active: boolean;
  label: string;
  camera: string;
  detectedAt: string;
};

export type DashboardData = {
  cameras: Camera[];
  detectionEvents: DetectionEvent[];
  reviewQueue: ReviewQueueItem[];
  dashboardStats: DashboardStats;
  activeAlert: ActiveAlert;
};

export const cameras: Camera[] = [
  {
    id: "cam-01",
    name: "Front Porch",
    location: "North entrance",
    code: "CAM-01",
    status: "online",
    feedLabel: "Live encrypted feed",
    qualityLabel: "1080P / IR",
    currentTimeLabel: "02:41:18 AM",
    signalStrength: 92,
    lastDetected: {
      label: "coyote",
      confidence: 97.4,
      timestampLabel: "Today, 02:41:18 AM",
    },
    recording: true,
    feedVisual: {
      focalPoint: "circle_at_56%_45%",
      detectionZone: "left-[18%] top-[22%] h-[44%] w-[36%]",
      activityRegion: "bottom-[16%] right-[10%] h-[25%] w-[32%]",
    },
  },
  {
    id: "cam-02",
    name: "Backyard",
    location: "West perimeter",
    code: "CAM-02",
    status: "online",
    feedLabel: "Live encrypted feed",
    qualityLabel: "4K / COLOR",
    currentTimeLabel: "11:17:04 PM",
    signalStrength: 86,
    lastDetected: {
      label: "Bruce",
      confidence: 99.1,
      timestampLabel: "Yesterday, 11:17:04 PM",
    },
    recording: true,
    feedVisual: {
      focalPoint: "circle_at_38%_52%",
      detectionZone: "right-[14%] top-[18%] h-[48%] w-[42%]",
      activityRegion: "bottom-[12%] left-[8%] h-[30%] w-[38%]",
    },
  },
];

export const detectionEvents: DetectionEvent[] = [
  {
    id: "EVT-2048",
    label: "coyote",
    cameraName: "Front Porch",
    confidence: 97.4,
    timeLabel: "02:41 AM",
    severity: "threat",
  },
  {
    id: "EVT-2047",
    label: "Bruce",
    cameraName: "Backyard",
    confidence: 99.1,
    timeLabel: "11:17 PM",
    severity: "safe",
  },
  {
    id: "EVT-2046",
    label: "raccoon",
    cameraName: "Backyard",
    confidence: 88.6,
    timeLabel: "10:52 PM",
    severity: "neutral",
  },
  {
    id: "EVT-2045",
    label: "unknown animal",
    cameraName: "Front Porch",
    confidence: 61.2,
    timeLabel: "09:38 PM",
    severity: "unknown",
  },
];

export const reviewQueue: ReviewQueueItem[] = [
  {
    id: "EVT-2044",
    title: "Unverified motion #1",
    cameraName: "Backyard",
    timestampLabel: "Yesterday, 08:14 PM",
    suggestedLabels: ["Bruce", "Coyote", "Raccoon", "Unknown"],
  },
  {
    id: "EVT-2043",
    title: "Unverified motion #2",
    cameraName: "Front Porch",
    timestampLabel: "Yesterday, 07:46 PM",
    suggestedLabels: ["Bruce", "Coyote", "Raccoon", "Unknown"],
  },
];

export const dashboardStats: DashboardStats = {
  eventsToday: 12,
  storageLabel: "82%",
  threatStateLabel: "Active",
};

export const activeAlert: ActiveAlert = {
  active: true,
  label: "Coyote",
  camera: "Front Porch",
  detectedAt: "02:41:18 AM",
};
