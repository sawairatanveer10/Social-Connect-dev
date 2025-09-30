// src/services/followService.ts
import {
  doc,
  runTransaction,
  getDocs,
  collection,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db, serverTimestamp } from '../lib/firebase';

type Id = string;

/**
 * Follow user: creates
 * - users/{targetUserId}/followers/{currentUserId}
 * - users/{currentUserId}/following/{targetUserId}
 * and increments followersCount / followingCount on user docs.
 */
export async function followUser(currentUserId: Id, targetUserId: Id) {
  if (!currentUserId || !targetUserId) throw new Error('Missing ids');
  if (currentUserId === targetUserId) throw new Error("You can't follow yourself");

  const followerDocRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
  const followingDocRef = doc(db, 'users', currentUserId, 'following', targetUserId);
  const targetUserRef = doc(db, 'users', targetUserId);
  const currentUserRef = doc(db, 'users', currentUserId);

  await runTransaction(db, async (tx) => {
    // create subdocs
    tx.set(followerDocRef, { id: currentUserId, createdAt: serverTimestamp() });
    tx.set(followingDocRef, { id: targetUserId, createdAt: serverTimestamp() });

    // update counts (create field if missing)
    const targetSnap = await tx.get(targetUserRef);
    const currentSnap = await tx.get(currentUserRef);

    const targetFollowers = (targetSnap.exists() && (targetSnap.data() as any).followersCount) || 0;
    const currentFollowing = (currentSnap.exists() && (currentSnap.data() as any).followingCount) || 0;

    tx.set(targetUserRef, { followersCount: targetFollowers + 1 }, { merge: true });
    tx.set(currentUserRef, { followingCount: currentFollowing + 1 }, { merge: true });
  });
}

/**
 * Unfollow user: removes the two subdocs and decrements counts (bounded at 0).
 */
export async function unfollowUser(currentUserId: Id, targetUserId: Id) {
  if (!currentUserId || !targetUserId) throw new Error('Missing ids');
  if (currentUserId === targetUserId) throw new Error("Invalid operation");

  const followerDocRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
  const followingDocRef = doc(db, 'users', currentUserId, 'following', targetUserId);
  const targetUserRef = doc(db, 'users', targetUserId);
  const currentUserRef = doc(db, 'users', currentUserId);

  await runTransaction(db, async (tx) => {
    // delete subdocs (tx.delete requires doc ref)
    tx.delete(followerDocRef);
    tx.delete(followingDocRef);

    const targetSnap = await tx.get(targetUserRef);
    const currentSnap = await tx.get(currentUserRef);

    const targetFollowers = Math.max(((targetSnap.exists() && (targetSnap.data() as any).followersCount) || 1) - 1, 0);
    const currentFollowing = Math.max(((currentSnap.exists() && (currentSnap.data() as any).followingCount) || 1) - 1, 0);

    tx.set(targetUserRef, { followersCount: targetFollowers }, { merge: true });
    tx.set(currentUserRef, { followingCount: currentFollowing }, { merge: true });
  });
}

/**
 * Return array of IDs that currentUser is following.
 */
export async function getFollowingIds(currentUserId: Id): Promise<Id[]> {
  const col = collection(db, 'users', currentUserId, 'following');
  const snap: QuerySnapshot<DocumentData> = await getDocs(col);
  return snap.docs.map((d) => d.id);
}
