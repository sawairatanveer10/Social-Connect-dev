// src/services/followService.ts
import { doc, runTransaction, getDocs, collection, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db, serverTimestamp } from '../lib/firebase';

type Id = string;

export async function followUser(currentUserId: Id, targetUserId: Id) {
  if (!currentUserId || !targetUserId) throw new Error('Missing ids');
  if (currentUserId === targetUserId) throw new Error("You can't follow yourself");

  const followerDocRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
  const followingDocRef = doc(db, 'users', currentUserId, 'following', targetUserId);
  const targetUserRef = doc(db, 'users', targetUserId);
  const currentUserRef = doc(db, 'users', currentUserId);

  await runTransaction(db, async (tx) => {
    const targetSnap = await tx.get(targetUserRef);
    const currentSnap = await tx.get(currentUserRef);
    const followerSnap = await tx.get(followerDocRef);
    const followingSnap = await tx.get(followingDocRef);

    if (!followerSnap.exists()) tx.set(followerDocRef, { id: currentUserId, createdAt: serverTimestamp() });
    if (!followingSnap.exists()) tx.set(followingDocRef, { id: targetUserId, createdAt: serverTimestamp() });

    const targetFollowers = (targetSnap.exists() && (targetSnap.data() as any).followersCount) || 0;
    const currentFollowing = (currentSnap.exists() && (currentSnap.data() as any).followingCount) || 0;

    tx.set(targetUserRef, { followersCount: targetFollowers + 1 }, { merge: true });
    tx.set(currentUserRef, { followingCount: currentFollowing + 1 }, { merge: true });
  });
}

export async function unfollowUser(currentUserId: Id, targetUserId: Id) {
  if (!currentUserId || !targetUserId) throw new Error('Missing ids');
  if (currentUserId === targetUserId) throw new Error("Invalid operation");

  const followerDocRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
  const followingDocRef = doc(db, 'users', currentUserId, 'following', targetUserId);
  const targetUserRef = doc(db, 'users', targetUserId);
  const currentUserRef = doc(db, 'users', currentUserId);

  await runTransaction(db, async (tx) => {
    const targetSnap = await tx.get(targetUserRef);
    const currentSnap = await tx.get(currentUserRef);
    const followerSnap = await tx.get(followerDocRef);
    const followingSnap = await tx.get(followingDocRef);

    if (followerSnap.exists()) tx.delete(followerDocRef);
    if (followingSnap.exists()) tx.delete(followingDocRef);

    const targetFollowers = Math.max(((targetSnap.exists() && (targetSnap.data() as any).followersCount) || 1) - 1, 0);
    const currentFollowing = Math.max(((currentSnap.exists() && (currentSnap.data() as any).followingCount) || 1) - 1, 0);

    tx.set(targetUserRef, { followersCount: targetFollowers }, { merge: true });
    tx.set(currentUserRef, { followingCount: currentFollowing }, { merge: true });
  });
}

export async function getFollowingIds(currentUserId: Id): Promise<Id[]> {
  const col = collection(db, 'users', currentUserId, 'following');
  const snap: QuerySnapshot<DocumentData> = await getDocs(col);
  return snap.docs.map((d) => d.id);
}
