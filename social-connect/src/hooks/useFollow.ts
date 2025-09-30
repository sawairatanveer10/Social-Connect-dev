// src/hooks/useFollow.ts
import { useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { followUser, unfollowUser } from '../services/followService';

export default function useFollow(currentUserId?: string, targetUserId?: string) {
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!currentUserId || !targetUserId) {
      setIsFollowing(false);
      return;
    }
    if (currentUserId === targetUserId) {
      setIsFollowing(false);
      return;
    }

    const followDocRef = doc(db, 'users', currentUserId, 'following', targetUserId);
    const unsub = onSnapshot(followDocRef, (snap: DocumentSnapshot) => {
      setIsFollowing(snap.exists());
    }, (err) => {
      console.error('follow onSnapshot error', err);
    });

    return () => unsub();
  }, [currentUserId, targetUserId]);

  const toggleFollow = useCallback(async () => {
    if (!currentUserId || !targetUserId) return;
    setLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(currentUserId, targetUserId);
      } else {
        await followUser(currentUserId, targetUserId);
      }
    } catch (err) {
      console.error('toggleFollow error', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUserId, targetUserId, isFollowing]);

  return { isFollowing, loading, toggleFollow };
}
