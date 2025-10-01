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
  IonTextarea,
  IonBadge,
  IonSpinner,
} from "@ionic/react";
import {
  heartOutline,
  heart,
  chatbubbleOutline,
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
} from "firebase/firestore";
import { useHistory } from "react-router-dom";
import { loadFeedPosts } from "../services/postsService";
import { followUser, getFollowingIds } from "../services/followService";

// ------------------ Types ------------------
interface Post {
  id: string;
  uid: string;
  content?: string;
  imageUrl?: string;
  createdAt?: any;
  username?: string;
  userPhoto?: string;
  likesCount?: number;
  commentsCount?: number;
}

interface NotificationItem {
  id: string;
  message: string;
  createdAt: any;
}

interface UserProfile {
  id: string;
  name?: string;
  username?: string;
  photoURL?: string;
}

// ------------------ Home Component ------------------
const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  const history = useHistory();
  const auth = getAuth();

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsub();
  }, [auth]);

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
      } catch (err) {
        console.error("Failed to load feed:", err);
      }
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
          if (userId !== currentUser.uid && !followingIds.includes(userId)) {
            users.push({
              id: userId,
              name: data.name || "",
              username: data.username || data.name || "Unnamed",
              photoURL: data.photoURL || "",
            });
          }
        });
        setSuggestedUsers(users);
      } catch (err) {
        console.error("Failed to load suggested users:", err);
      }
    };

    loadSuggestions();
  }, [currentUser, followingIds]);

  // Optimistic follow
  const handleFollow = async (targetUserId: string) => {
    if (!currentUser) return;
    setFollowingIds((prev) => [...prev, targetUserId]);
    try {
      await followUser(currentUser.uid, targetUserId);
    } catch (err) {
      console.error("Follow failed:", err);
      setFollowingIds((prev) => prev.filter((id) => id !== targetUserId));
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="light">
          <IonTitle className="ion-text-center font-bold">Social Connect</IonTitle>
          <IonButton slot="end" fill="clear" onClick={() => setShowNotifications((prev) => !prev)} style={{ position: "relative" }}>
            <IonIcon icon={notificationsOutline} />
            {notifications.length > 0 && (
              <IonBadge color="danger" style={{ position: "absolute", top: -4, right: -4, fontSize: 12 }}>
                {notifications.length}
              </IonBadge>
            )}
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Notifications */}
        {showNotifications && (
          <div style={{
            position: "absolute",
            top: 60,
            right: 10,
            width: 300,
            maxHeight: 400,
            background: "#fff",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            borderRadius: 12,
            overflowY: "auto",
            zIndex: 1000,
            padding: 12
          }}>
            {notifications.length === 0 ? <IonText color="medium">No notifications</IonText> :
              notifications.map((n) => <div key={n.id} style={{ padding: "10px 8px", borderBottom: "1px solid #eee", fontSize: 14 }}>{n.message}</div>)}
          </div>
        )}

        {/* Main Layout */}
        <div style={{
          display: "flex",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          justifyContent: "center",
          gap: 24,
          padding: 16,
        }}>
          {/* Feed */}
          <div style={{ flex: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
            {loadingFeed ? (
              <div className="ion-text-center ion-padding">
                <IonSpinner name="crescent" /> Loading feed...
              </div>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} currentUser={currentUser} history={history} />)
            )}
          </div>

          {/* Suggested Users */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <IonText color="medium" style={{ fontWeight: "bold", fontSize: 16, marginBottom: 12 }}>Suggested Users</IonText>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 120px)", gap: 16, justifyContent: "center" }}>
              {suggestedUsers.map((u) => (
                <div key={u.id} style={{
                  width: 120,
                  height: 140,
                  borderRadius: 16,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  background: "#fff",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  padding: 8,
                  transition: "all 0.2s ease-in-out",
                }}
                  onMouseEnter={(e: any) => e.currentTarget.style.transform = "translateY(-4px)"}
                  onMouseLeave={(e: any) => e.currentTarget.style.transform = "translateY(0px)"}
                >
                  <img src={u.photoURL || "https://ionicframework.com/docs/img/demos/avatar.svg"} alt={u.username} style={{ width: 60, height: 60, borderRadius: "50%", marginBottom: 6 }} />
                  <IonText style={{ fontSize: 14, fontWeight: "bold", marginBottom: 6 }}>{u.username}</IonText>
                  <IonButton size="small" color="primary" onClick={() => handleFollow(u.id)}>Follow</IonButton>
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
    const q = query(collection(db, "posts", post.id, "comments"), orderBy("createdAt", "desc"), limit(2));
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
    <div style={{
      border: "1px solid #eee",
      borderRadius: 16,
      marginBottom: 24,
      backgroundColor: "#fff",
      width: 600,
      fontFamily: "Arial, sans-serif",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: 12 }}>
        <img src={post.userPhoto || "https://ionicframework.com/docs/img/demos/avatar.svg"} alt={post.username} style={{ width: 44, height: 44, borderRadius: "50%", marginRight: 12 }} />
        <IonText style={{ fontWeight: "bold", cursor: "pointer", fontSize: 15 }} onClick={() => history.push(`/profile/${post.uid}`)}>{post.username}</IonText>
      </div>

      {/* Image */}
      {post.imageUrl && <img src={post.imageUrl} alt="Post" style={{ width: "100%", maxHeight: 450, objectFit: "cover" }} />}

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 12px" }}>
        <IonIcon icon={userLiked ? heart : heartOutline} onClick={toggleLike} style={{ fontSize: 28, cursor: "pointer" }} />
        <span style={{ marginLeft: 8, fontWeight: "bold" }}>{localLikesCount} likes</span>

        <IonIcon icon={chatbubbleOutline} style={{ fontSize: 28, cursor: "pointer", marginLeft: 18 }} onClick={() => setShowCommentBox((prev) => !prev)} />
        <span style={{ marginLeft: 6 }}>{post.commentsCount || 0}</span>
      </div>

      {/* Caption */}
      <div style={{ padding: "0 12px 10px", fontSize: 14 }}>
        <IonText style={{ fontWeight: "bold", cursor: "pointer" }} onClick={() => history.push(`/profile/${post.uid}`)}>{post.username} </IonText>
        {post.content}
      </div>

      {/* Comments */}
      <div style={{ padding: "0 12px", fontSize: 14, color: "#555" }}>
        {latestComments.map(c => <div key={c.id} style={{ marginBottom: 4 }}><strong>{c.username}</strong> {c.text}</div>)}
      </div>

      {/* Add comment */}
      {currentUser && showCommentBox && (
        <div style={{ display: "flex", padding: 8, borderTop: "1px solid #eee" }}>
          <IonTextarea value={commentText} onIonInput={(e) => setCommentText(e.detail.value!)} placeholder="Add a comment..." autoGrow rows={1} style={{ flex: 1, border: "none", padding: "6px 8px", fontSize: 14, resize: "none" }} />
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
