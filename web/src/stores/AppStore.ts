import { persistentMap } from "@nanostores/persistent";
import type { ChallengeStatus } from "@/types";

// Which Stores are needed?
// 1. Started Courses - Persistent -> Query
// 2. Completed Lessons - Persistent -> Query
// 3. Completed Challenges - Persistent -> Query

export const $startedCourses = persistentMap<Record<string, string>>("startedCourses", {});
export const $completedChallenges = persistentMap<Record<string, ChallengeStatus>>(
    "completedChallenges",
    {},
    { encode: JSON.stringify, decode: JSON.parse },
);
