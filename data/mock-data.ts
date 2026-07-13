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

export type CameraConfigurationInput = Pick<
  Camera,
  "name" | "location" | "code" | "status" | "qualityLabel" | "recording"
>;

export type DetectionEvent = {
  id: string;
  label: string;
  cameraName: string;
  confidence: number;
  timeLabel: string;
  severity: "threat" | "safe" | "neutral" | "unknown";
  status: EventStatus;
  reviewedLabel: string | null;
  createdAt: string;
};

export type EventStatus = "new" | "reviewed" | "dismissed";

export type CreateDetectionEventInput = Omit<
  DetectionEvent,
  "id" | "status" | "reviewedLabel" | "createdAt"
>;

export type DetectionEventFilters = {
  includeDismissed?: boolean;
  cameraName?: string;
  animal?: string;
  status?: EventStatus;
  date?: string;
};

export type ReviewQueueItem = {
  id: string;
  title: string;
  cameraName: string;
  timestampLabel: string;
  confidence: number;
  suggestedLabels: string[];
  snapshotUrl: string | null;
  clipUrl: string | null;
  clipDurationSeconds: number | null;
};

export type DashboardStats = {
  eventsToday: number;
  pendingReview: number;
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
  activeAlert: ActiveAlert | null;
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
  {
    id: "cam-03",
    name: "Driveway",
    location: "East approach",
    code: "CAM-03",
    status: "online",
    feedLabel: "Live encrypted feed",
    qualityLabel: "2K / NIGHT",
    currentTimeLabel: "02:41:18 AM",
    signalStrength: 78,
    lastDetected: {
      label: "delivery vehicle",
      confidence: 96.3,
      timestampLabel: "Yesterday, 06:22:31 PM",
    },
    recording: true,
    feedVisual: {
      focalPoint: "circle_at_64%_48%",
      detectionZone: "left-[12%] top-[20%] h-[52%] w-[46%]",
      activityRegion: "bottom-[10%] right-[12%] h-[32%] w-[36%]",
    },
  },
  {
    id: "cam-04",
    name: "Side Gate",
    location: "South passage",
    code: "CAM-04",
    status: "offline",
    feedLabel: "Feed unavailable",
    qualityLabel: "1080P / IR",
    currentTimeLabel: "Last seen 01:58 AM",
    signalStrength: 0,
    lastDetected: {
      label: "raccoon",
      confidence: 91.7,
      timestampLabel: "Today, 01:56:09 AM",
    },
    recording: false,
    feedVisual: {
      focalPoint: "circle_at_45%_42%",
      detectionZone: "right-[18%] top-[24%] h-[42%] w-[34%]",
      activityRegion: "bottom-[18%] left-[12%] h-[24%] w-[30%]",
    },
  },
];

export const detectionEvents: DetectionEvent[] = [
  {
    id: "EVT-2052",
    label: "coyote",
    cameraName: "Front Porch",
    confidence: 97.4,
    timeLabel: "02:41 AM",
    severity: "threat",
    status: "new",
    reviewedLabel: null,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: "EVT-2051",
    label: "raccoon",
    cameraName: "Backyard",
    confidence: 88.6,
    timeLabel: "01:56 AM",
    severity: "neutral",
    status: "new",
    reviewedLabel: null,
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  },
  {
    id: "EVT-2050",
    label: "cat",
    cameraName: "Driveway",
    confidence: 96.8,
    timeLabel: "12:34 AM",
    severity: "safe",
    status: "reviewed",
    reviewedLabel: "cat",
    createdAt: new Date(Date.now() - 74 * 60 * 1000).toISOString(),
  },
  {
    id: "EVT-2049",
    label: "unknown animal",
    cameraName: "Side Gate",
    confidence: 54.2,
    timeLabel: "Yesterday, 11:48 PM",
    severity: "unknown",
    status: "new",
    reviewedLabel: null,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "EVT-2048",
    label: "raccoon",
    cameraName: "Front Porch",
    confidence: 91.3,
    timeLabel: "Yesterday, 10:52 PM",
    severity: "neutral",
    status: "reviewed",
    reviewedLabel: "raccoon",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "EVT-2047",
    label: "cat",
    cameraName: "Backyard",
    confidence: 99.1,
    timeLabel: "Yesterday, 09:17 PM",
    severity: "safe",
    status: "dismissed",
    reviewedLabel: null,
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "EVT-2046",
    label: "coyote",
    cameraName: "Driveway",
    confidence: 84.7,
    timeLabel: "Yesterday, 08:03 PM",
    severity: "threat",
    status: "new",
    reviewedLabel: null,
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "EVT-2045",
    label: "unknown animal",
    cameraName: "Side Gate",
    confidence: 61.2,
    timeLabel: "Yesterday, 07:38 PM",
    severity: "unknown",
    status: "dismissed",
    reviewedLabel: null,
    createdAt: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
  },
];
