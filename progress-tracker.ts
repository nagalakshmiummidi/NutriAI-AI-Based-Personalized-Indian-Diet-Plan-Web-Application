export interface ProgressEntry {
  date: string;
  weight: number;
  notes?: string;
}

export interface UserProgress {
  userId: string;
  startDate: string;
  startWeight: number;
  targetWeight: number;
  entries: ProgressEntry[];
  totalPlanGenerated: number;
  dietaryPreferences: string[];
}

function getCurrentUserId(): string {
  return localStorage.getItem("current-user") || "default";
}

const PROGRESS_STORAGE_KEY = "user-progress";

export function getUserProgress(userId?: string): UserProgress | null {
  const uid = userId || getCurrentUserId();
  const data = localStorage.getItem(`${PROGRESS_STORAGE_KEY}-${uid}`);
  return data ? JSON.parse(data) : null;
}

export function initializeProgress(
  userId?: string,
  startWeight?: number,
  targetWeight?: number,
  dietaryPreferences: string[] = []
): UserProgress {
  const uid = userId || getCurrentUserId();
  const weight = startWeight || 70;
  const target = targetWeight || 70;

  const progress: UserProgress = {
    userId: uid,
    startDate: new Date().toISOString(),
    startWeight: weight,
    targetWeight: target,
    entries: [
      {
        date: new Date().toISOString().split("T")[0],
        weight: weight,
        notes: "Starting weight",
      },
    ],
    totalPlanGenerated: 0,
    dietaryPreferences,
  };

  localStorage.setItem(`${PROGRESS_STORAGE_KEY}-${uid}`, JSON.stringify(progress));
  return progress;
}

export function addProgressEntry(
  weight: number,
  notes?: string,
  userId?: string
): UserProgress | null {
  const uid = userId || getCurrentUserId();
  const progress = getUserProgress(uid);
  if (!progress) return null;

  progress.entries.push({
    date: new Date().toISOString().split("T")[0],
    weight,
    notes,
  });

  localStorage.setItem(`${PROGRESS_STORAGE_KEY}-${uid}`, JSON.stringify(progress));
  return progress;
}

export function incrementPlanCount(userId?: string): void {
  const uid = userId || getCurrentUserId();
  const progress = getUserProgress(uid);
  if (progress) {
    progress.totalPlanGenerated++;
    localStorage.setItem(`${PROGRESS_STORAGE_KEY}-${uid}`, JSON.stringify(progress));
  }
}

export function getProgressStats(userId?: string) {
  const uid = userId || getCurrentUserId();
  const progress = getUserProgress(uid);
  if (!progress || progress.entries.length === 0) {
    return null;
  }

  const entries = progress.entries;
  const startWeight = progress.startWeight;
  const currentWeight = entries[entries.length - 1].weight;
  const targetWeight = progress.targetWeight;

  const weightLoss = startWeight - currentWeight;
  const weightLossPercent = ((weightLoss / Math.abs(startWeight - targetWeight)) * 100).toFixed(1);
  const daysTracked = Math.floor(
    (new Date().getTime() - new Date(progress.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    currentWeight,
    startWeight,
    targetWeight,
    weightLoss: weightLoss.toFixed(1),
    weightLossPercent,
    daysTracked,
    totalPlans: progress.totalPlanGenerated,
    entries,
  };
}
