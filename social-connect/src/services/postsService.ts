// src/services/postsService.ts
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  DocumentData,
  limit,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { getFollowingIds } from "./followService";

// helper to chunk arrays (Firestore "in" supports max 10 items)
function chunk<T>(arr: T[], size = 10): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function loadFeedPosts(
  currentUserId: string,
  limitPerChunk = 50
) {
  const followingIds = await getFollowingIds(currentUserId);
  const authorIds = Array.from(new Set([...followingIds, currentUserId]));

  let results: any[] = [];

  if (authorIds.length > 0) {
    // ✅ Get posts from followed users + self
    const chunks = chunk(authorIds, 10);
    for (const c of chunks) {
      const q = query(
        collection(db, "posts"),
        where("uid", "in", c),
        orderBy("createdAt", "desc"),
        limit(limitPerChunk)
      );
      const snap = await getDocs(q);
      snap.forEach((d) =>
        results.push({ id: d.id, ...(d.data() as DocumentData) })
      );
    }
  } else {
    // ✅ Fallback → global feed
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(limitPerChunk)
    );
    const snap = await getDocs(q);
    snap.forEach((d) =>
      results.push({ id: d.id, ...(d.data() as DocumentData) })
    );
  }

  // ✅ Sort merged results (newest first)
  results.sort((a, b) => {
    const at = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds ?? 0;
    const bt = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds ?? 0;
    return bt - at;
  });

  return results;
}
