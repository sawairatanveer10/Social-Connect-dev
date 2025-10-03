import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonText,
  IonIcon,
  IonButton,
  IonBadge,
  IonSpinner,
  IonTextarea,
  IonAvatar,
} from "@ionic/react";
import {
  heartOutline,
  heart,
  chatbubbleOutline,
  chatbubblesOutline,
  notificationsOutline,
} from "ionicons/icons";
import { db, serverTimestamp } from "../lib/firebase";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  runTransaction,
  addDoc,
  limit,
  getDocs,
  where,
} from "firebase/firestore";
import { useHistory } from "react-router-dom";
import { loadFeedPosts } from "../services/postsService";
import { followUser, unfollowUser, getFollowingIds } from "../services/followService";

// ------------------ Types ------------------
interface Post { id: string; uid: string; content?: string; imageUrl?: string; createdAt?: any; username?: string; userPhoto?: string; likesCount?: number; commentsCount?: number; }
interface NotificationItem { id: string; message: string; createdAt: any; }
interface UserProfile { id: string; name?: string; username?: string; photoURL?: string; }
interface Chat { id: string; participants: string[]; lastMessage?: string; lastMessageTime?: any; otherUserId: string; otherUserName?: string; otherUserPhoto?: string; unreadBy?: string[]; }

// ------------------ Home Component ------------------
const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMessages, setShowMessages] = useState(false);

  const history = useHistory();
  const auth = getAuth();

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsub();
  }, []);

  // Load following IDs
  useEffect(() => {
    if (!currentUser) return;
    getFollowingIds(currentUser.uid).then(setFollowingIds);
  }, [currentUser]);

  // Load feed
  useEffect(() => {
    if (!currentUser) return;
    const fetchFeed = async () => {
      setLoadingFeed(true);
      try {
        const feed = await loadFeedPosts(currentUser.uid);
        setPosts(feed as Post[]);
      } catch (err) { console.error(err); }
      setLoadingFeed(false);
    };
    fetchFeed();
  }, [currentUser, followingIds]);

  // Notifications
  useEffect(() => {
    if (!currentUser) return;
    const notifQuery = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(notifQuery, (snapshot) => {
      const notifArr: NotificationItem[] = [];
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.toUserId === currentUser.uid) {
          notifArr.push({ id: docSnap.id, message: data.message, createdAt: data.createdAt });
        }
      });
      setNotifications(notifArr);
    });
    return () => unsub();
  }, [currentUser]);

  // Suggested users
  useEffect(() => {
    if (!currentUser) return;
    const loadSuggestions = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const users: UserProfile[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const userId = d.id;
          if (userId !== currentUser.uid) {
            users.push({
              id: userId,
              name: data.name || "",
              username: data.username || data.name || "Unnamed",
              photoURL: data.photoURL || "",
            });
          }
        });
        setSuggestedUsers(users);
      } catch (err) { console.error(err); }
    };
    loadSuggestions();
  }, [currentUser, followingIds]);

  // Load chats
  useEffect(() => {
    if (!currentUser) return;
    const chatsQuery = query(collection(db, "chats"), where("participants", "array-contains", currentUser.uid));
    const unsub = onSnapshot(chatsQuery, (snapshot) => {
      const chatArr: Chat[] = [];
      let unread = 0;
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const otherUserId = data.participants.find((id: string) => id !== currentUser.uid);
        chatArr.push({
          id: docSnap.id,
          ...data,
          otherUserId,
          otherUserName: data.userNames?.[otherUserId] || "User",
          otherUserPhoto: data.userPhotos?.[otherUserId] || "https://ionicframework.com/docs/img/demos/avatar.svg",
          unreadBy: data.unreadBy || [],
        });
        if (data.unreadBy?.includes(currentUser.uid)) unread++;
      });
      chatArr.sort((a, b) => (b.lastMessageTime?.toDate?.() || 0) - (a.lastMessageTime?.toDate?.() || 0));
      setChats(chatArr);
      setUnreadCount(unread);
    });
    return () => unsub();
  }, [currentUser]);

  // Follow / Unfollow
  const handleToggleFollow = async (targetUserId: string) => {
    if (!currentUser) return;
    const isFollowing = followingIds.includes(targetUserId);
    if (isFollowing) {
      setFollowingIds((prev) => prev.filter((id) => id !== targetUserId));
      try { await unfollowUser(currentUser.uid, targetUserId); } catch { setFollowingIds((prev) => [...prev, targetUserId]); }
    } else {
      setFollowingIds((prev) => [...prev, targetUserId]);
      try { await followUser(currentUser.uid, targetUserId); } catch { setFollowingIds((prev) => prev.filter((id) => id !== targetUserId)); }
    }
  };

  return (
    <IonPage>
     <IonHeader>
  <IonToolbar
    color="light"
    style={{
      flexDirection: "column",
      alignItems: "stretch",
      padding: "8px 12px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    }}
  >
    {/* App title */}
    <div style={{ width: "100%", textAlign: "center", marginBottom: 8 }}>
      <IonTitle style={{ fontWeight: "bold", fontSize: 22, color: "#222" }}>
        Social Connect
      </IonTitle>
    </div>

    {/* Icons row */}
    <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: 12, paddingLeft: 4 }}>
      
      {/* Notifications */}
      <div style={{ position: "relative" }}>
        <IonButton
          fill="solid"
          onClick={() => setShowNotifications(prev => !prev)}
          style={{
            borderRadius: "50%",
            backgroundColor: "#FF3B30", // red
            minWidth: 44,
            minHeight: 44,
            padding: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e: any) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e: any) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <IonIcon icon={notificationsOutline} style={{ fontSize: 22, color: "#fff" }} />
        </IonButton>
        {notifications.length > 0 && (
          <IonBadge
            color="danger"
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              fontSize: 11,
              minWidth: 18,
              height: 18,
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#fff",
              color: "#FF3B30",
              fontWeight: "bold",
              padding: 0,
            }}
          >
            {notifications.length}
          </IonBadge>
        )}
      </div>

      {/* Messages */}
      <div style={{ position: "relative" }}>
        <IonButton
          fill="solid"
          onClick={() => history.push("/chats")}
          style={{
            borderRadius: "50%",
            backgroundColor: "#007AFF", // blue
            minWidth: 44,
            minHeight: 44,
            padding: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e: any) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e: any) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <IonIcon icon={chatbubblesOutline} style={{ fontSize: 22, color: "#fff" }} />
        </IonButton>
        {unreadCount > 0 && (
          <IonBadge
            color="danger"
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              fontSize: 11,
              minWidth: 18,
              height: 18,
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#fff",
              color: "#FF3B30",
              fontWeight: "bold",
              padding: 0,
            }}
          >
            {unreadCount}
          </IonBadge>
        )}
      </div>
    </div>
  </IonToolbar>
</IonHeader>



      <IonContent>
        {/* Notifications Dropdown */}
        {showNotifications && (
          <div style={{ position: "absolute", top: 60, right: 10, width: 300, maxHeight: 400, background: "#fff", boxShadow: "0 4px 15px rgba(0,0,0,0.2)", borderRadius: 12, overflowY: "auto", zIndex: 1000, padding: 12 }}>
            {notifications.length === 0 ? <IonText color="medium">No notifications</IonText> :
              notifications.map((n) => <div key={n.id} style={{ padding: "10px 8px", borderBottom: "1px solid #eee", fontSize: 14 }}>{n.message}</div>)}
          </div>
        )}

        {/* Main Feed Layout */}
        <div style={{ display: "flex", flexDirection: window.innerWidth < 768 ? "column" : "row", justifyContent: "center", gap: 24, padding: 16 }}>
          <div style={{ flex: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
            {loadingFeed ? <IonSpinner name="crescent" /> :
              posts.map((post) => <PostCard key={post.id} post={post} currentUser={currentUser} history={history} />)}
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <IonText color="medium" style={{ fontWeight: "bold", fontSize: 16, marginBottom: 12 }}>Suggested Users</IonText>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 120px)", gap: 16, justifyContent: "center" }}>
              {suggestedUsers.map((u) => (
                <div key={u.id} style={{ width: 120, height: 140, borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", cursor: "pointer", padding: 8 }}
                  onMouseEnter={(e: any) => (e.currentTarget.style.transform = "translateY(-4px)")}
                  onMouseLeave={(e: any) => (e.currentTarget.style.transform = "translateY(0px)")}
                >
     <IonAvatar style={{ width: 60, height: 60, marginBottom: 6 }}>
  <img src={u.photoURL || "https://ionicframework.com/docs/img/demos/avatar.svg"} alt={u.username} />
</IonAvatar>

                  <IonText style={{ fontSize: 14, fontWeight: "bold", marginBottom: 6 }}>{u.username}</IonText>
                  <IonButton size="small" color={followingIds.includes(u.id) ? "medium" : "primary"} onClick={() => handleToggleFollow(u.id)}>
                    {followingIds.includes(u.id) ? "Unfollow" : "Follow"}
                  </IonButton>
                </div>
              ))}
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;



// ------------------ PostCard Component ------------------
interface PostCardProps {
  post: Post;
  currentUser: User | null;
  history: any;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUser, history }) => {
  const [userLiked, setUserLiked] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(post.likesCount || 0);
  const [latestComments, setLatestComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const likeDocRef = doc(db, "posts", post.id, "likes", currentUser.uid);
    const unsub = onSnapshot(likeDocRef, (snap) => setUserLiked(snap.exists()));
    return () => unsub();
  }, [post.id, currentUser]);

  useEffect(() => setLocalLikesCount(post.likesCount || 0), [post.likesCount]);

  const toggleLike = async () => {
    if (!currentUser) return;
    const postRef = doc(db, "posts", post.id);
    const likeRef = doc(db, "posts", post.id, "likes", currentUser.uid);

    setUserLiked((prev) => !prev);
    setLocalLikesCount((c) => (userLiked ? Math.max(0, c - 1) : c + 1));

    try {
      await runTransaction(db, async (transaction) => {
        const likeSnap = await transaction.get(likeRef);
        const postSnap = await transaction.get(postRef);
        if (!postSnap.exists()) throw new Error("Post does not exist");

        let currentCount = postSnap.data()?.likesCount || 0;
        if (likeSnap.exists()) {
          transaction.delete(likeRef);
          transaction.update(postRef, { likesCount: Math.max(0, currentCount - 1) });
        } else {
          transaction.set(likeRef, { uid: currentUser.uid, createdAt: serverTimestamp() });
          transaction.update(postRef, { likesCount: currentCount + 1 });
          await addDoc(collection(db, "notifications"), {
            type: "like",
            message: `${currentUser.displayName || "Someone"} liked your post`,
            createdAt: serverTimestamp(),
            fromUserId: currentUser.uid,
            toUserId: post.uid,
            postId: post.id,
          });
        }
      });
    } catch (err) {
      console.error("Like transaction failed:", err);
      setUserLiked((prev) => !prev);
      setLocalLikesCount(post.likesCount || 0);
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, "posts", post.id, "comments"),
      orderBy("createdAt", "desc"),
      limit(2)
    );
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLatestComments(arr.reverse());
    });
    return () => unsub();
  }, [post.id]);

  const addComment = async () => {
    if (!currentUser) return;
    const text = commentText.trim();
    if (!text) return;

    const commentsCol = collection(db, "posts", post.id, "comments");
    const postRef = doc(db, "posts", post.id);

    setCommentText("");

    try {
      await addDoc(commentsCol, {
        uid: currentUser.uid,
        username: currentUser.displayName || "Unnamed",
        userPhoto: currentUser.photoURL || "",
        text,
        createdAt: serverTimestamp(),
      });

      await runTransaction(db, async (transaction) => {
        const postSnap = await transaction.get(postRef);
        if (!postSnap.exists()) return;
        const currentCount = postSnap.data()?.commentsCount || 0;
        transaction.update(postRef, { commentsCount: currentCount + 1 });
      });

      await addDoc(collection(db, "notifications"), {
        type: "comment",
        message: `${currentUser.displayName || "Someone"} commented: ${text}`,
        createdAt: serverTimestamp(),
        fromUserId: currentUser.uid,
        toUserId: post.uid,
        postId: post.id,
      });
    } catch (err) {
      console.error("Add comment failed:", err);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: 16,
        marginBottom: 24,
        backgroundColor: "#fff",
        width: 600,
        fontFamily: "Arial, sans-serif",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: 12 }}>
        <img
          src={post.userPhoto || "https://ionicframework.com/docs/img/demos/avatar.svg"}
          alt={post.username}
          style={{ width: 44, height: 44, borderRadius: "50%", marginRight: 12 }}
        />
        <IonText
          style={{ fontWeight: "bold", cursor: "pointer", fontSize: 15 }}
          onClick={() => history.push(`/profile/${post.uid}`)}
        >
          {post.username}
        </IonText>
      </div>

      {/* Image */}
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Post"
          style={{ width: "100%", maxHeight: 450, objectFit: "cover" }}
        />
      )}

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 12px" }}>
        <IonIcon
          icon={userLiked ? heart : heartOutline}
          onClick={toggleLike}
          style={{ fontSize: 28, cursor: "pointer" }}
        />
        <span style={{ marginLeft: 8, fontWeight: "bold" }}>{localLikesCount} likes</span>

        <IonIcon
          icon={chatbubbleOutline}
          style={{ fontSize: 28, cursor: "pointer", marginLeft: 18 }}
          onClick={() => setShowCommentBox((prev) => !prev)}
        />
        <span style={{ marginLeft: 6 }}>{post.commentsCount || 0}</span>
      </div>

      {/* Caption */}
      <div style={{ padding: "0 12px 10px", fontSize: 14 }}>
        <IonText
          style={{ fontWeight: "bold", cursor: "pointer" }}
          onClick={() => history.push(`/profile/${post.uid}`)}
        >
          {post.username}{" "}
        </IonText>
        {post.content}
      </div>

      {/* Comments */}
      <div style={{ padding: "0 12px", fontSize: 14, color: "#555" }}>
        {latestComments.map((c) => (
          <div key={c.id} style={{ marginBottom: 4 }}>
            <strong>{c.username}</strong> {c.text}
          </div>
        ))}
      </div>

      {/* Add comment */}
      {currentUser && showCommentBox && (
        <div style={{ display: "flex", padding: 8, borderTop: "1px solid #eee" }}>
          <IonTextarea
            value={commentText}
            onIonInput={(e) => setCommentText(e.detail.value!)}
            placeholder="Add a comment..."
            autoGrow
            rows={1}
            style={{ flex: 1, border: "none", padding: "6px 8px", fontSize: 14, resize: "none" }}
          />
          <IonButton fill="clear" onClick={addComment}>Post</IonButton>
        </div>
      )}

      {/* Time */}
      <div style={{ padding: "6px 12px 12px", fontSize: 12, color: "#999" }}>
        {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ""}
      </div>
    </div>
  );
};
