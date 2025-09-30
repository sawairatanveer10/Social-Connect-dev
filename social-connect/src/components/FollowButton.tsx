// src/components/FollowButton.tsx
import React from 'react';
import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { personAddOutline, personRemoveOutline } from 'ionicons/icons';

interface Props {
  currentUserId?: string; // logged-in user
  targetUserId: string;   // profile being viewed
  onFollowToggled?: (isFollowing: boolean) => void;
  size?: 'small' | 'default';
  fill?: 'solid' | 'clear';
  className?: string;
  // you can pass in a custom hook output instead of letting the component call it itself
  hook?: {
    isFollowing: boolean;
    loading: boolean;
    toggleFollow: () => Promise<void>;
  } | null;
}

import useFollow from '../hooks/useFollow';

const FollowButton: React.FC<Props> = ({ currentUserId, targetUserId, onFollowToggled, size = 'default', fill='solid', className, hook = null }) => {
  const hookInternal = hook ?? useFollow(currentUserId, targetUserId);
  const { isFollowing, loading, toggleFollow } = hookInternal;

  const handleClick = async () => {
    try {
      await toggleFollow();
      if (onFollowToggled) onFollowToggled(!isFollowing);
    } catch (err) {
      // optional: show toast
      console.error(err);
    }
  };

  return (
    <IonButton
      onClick={handleClick}
      size={size}
      fill={fill}
      className={className}
      disabled={loading || currentUserId === targetUserId}
    >
      {loading ? <IonSpinner name="crescent" /> : (
        <>
          <IonIcon slot="start" icon={isFollowing ? personRemoveOutline : personAddOutline} />
          {isFollowing ? 'Unfollow' : 'Follow'}
        </>
      )}
    </IonButton>
  );
};

export default FollowButton;
