// src/services/postsService.ts
import { collection, query, where, orderBy, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getFollowingIds } from './followService';

function chunk<T>(arr: T[], size = 10): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function loadFeedPosts(currentUserId: string, limitPerChunk = 50) {
  // include your own posts too
  const followingIds = await getFollowingIds(currentUserId);
  const authorIds = Array.from(new Set([...followingIds, currentUserId])); // avoid duplicates

  if (authorIds.length === 0) return [];

  const chunks = chunk(authorIds, 10);
  const results: any[] = [];

  for (const c of chunks) {
    const q = query(
      collection(db, 'posts'),
      where('authorId', 'in', c),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    snap.forEach((d) => results.push({ id: d.id, ...(d.data() as DocumentData) }));
  }

  // sort by createdAt descending (in case multiple chunks)
  results.sort((a, b) => {
    const at = (a.createdAt?.toMillis?.() ?? a.createdAt) as any;
    const bt = (b.createdAt?.toMillis?.() ?? b.createdAt) as any;
    return (bt || 0) - (at || 0);
  });

  return results;
}
