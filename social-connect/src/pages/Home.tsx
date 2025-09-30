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
  paperPlaneOutline,
  notificationsOutline,
} from "ionicons/icons";

import { db } from "../lib/firebase";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  runTransaction,
  addDoc,
  serverTimestamp,
  limit,
} from "firebase/firestore";

import { useHistory } from "react-router-dom";
import { loadFeedPosts } from "../services/postsService"; // ✅ fetch posts from following list

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

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const history = useHistory();
  const auth = getAuth();

  // 🔹 Listen for auth changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, [auth]);

  // 🔹 Load feed (posts from self + following)
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
  }, [currentUser]);

  // 🔹 Notifications (your existing logic)
  useEffect(() => {
    if (!currentUser) return;
    const notifQuery = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(notifQuery, (snapshot) => {
      const notifArr: NotificationItem[] = [];
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.toUserId === currentUser.uid) {
          notifArr.push({
            id: docSnap.id,
            message: data.message,
            createdAt: data.createdAt,
          });
        }
      });
      setNotifications(notifArr);
    });

    return () => unsub();
  }, [currentUser]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="light">
          <IonTitle className="ion-text-center font-bold">
            Social Connect
          </IonTitle>
          <IonButton
            slot="end"
            fill="clear"
            onClick={() => setShowNotifications((prev) => !prev)}
            style={{ position: "relative" }}
          >
            <IonIcon icon={notificationsOutline} />
            {notifications.length > 0 && (
              <IonBadge
                color="danger"
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  fontSize: 12,
                }}
              >
                {notifications.length}
              </IonBadge>
            )}
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* 🔹 Notification panel */}
        {showNotifications && (
          <div
            style={{
              position: "absolute",
              top: 60,
              right: 10,
              width: 300,
              maxHeight: 400,
              background: "#fff",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              borderRadius: 12,
              overflowY: "auto",
              zIndex: 1000,
              padding: 10,
            }}
          >
            {notifications.length === 0 ? (
              <IonText color="medium">No notifications</IonText>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: "8px 6px",
                    borderBottom: "1px solid #eee",
                    fontSize: 14,
                  }}
                >
                  {n.message}
                </div>
              ))
            )}
          </div>
        )}

        {/* 🔹 Feed */}
        <div className="feed">
          {loadingFeed ? (
            <div className="ion-text-center ion-padding">
              <IonSpinner name="crescent" /> Loading feed...
            </div>
          ) : posts.length === 0 ? (
            <IonText color="medium" className="ion-padding">
              No posts yet.
            </IonText>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                history={history}
              />
            ))
          )}
        </div>
      </IonContent>

      <style>
        {`
        .feed { width: 100%; max-width: 420px; margin: 0 auto; }
        .post { border-bottom: 1px solid #e6e6e6; margin-bottom: 16px; background: #fff; }
        .post-header { display:flex; align-items:center; padding:10px; }
        .avatar { width:40px; height:40px; margin-right:10px; border-radius:50%; overflow:hidden; }
        .username { font-weight:600; font-size:14px; cursor:pointer; }
        .post-image img { width:100%; max-height:500px; object-fit:cover; display:block; }
        .post-actions { display:flex; gap:16px; padding:8px 12px; align-items:center; }
        .post-caption { padding:0 12px 4px; font-size:14px; }
        .post-time { padding:0 12px 12px; font-size:12px; color:#888; }
        .like-count { font-weight:600; margin-left:8px; }
        .comments-preview { padding:0 12px 8px; font-size:14px; color:#333; }
        .comment-line { margin-bottom:4px; }
        .comment-input { display:flex; align-items:center; gap:8px; padding:8px 12px 12px; }
        .comment-box { flex:1; background:#fff; color:#000; border-radius:16px; padding:6px 12px; font-size:14px; border:1px solid #ccc; }
        `}
      </style>
    </IonPage>
  );
};

export default Home;

// ----------------- PostCard Component -----------------
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

  // 🔹 Track if current user liked
  useEffect(() => {
    if (!currentUser) return;
    const likeDocRef = doc(db, "posts", post.id, "likes", currentUser.uid);
    const unsub = onSnapshot(likeDocRef, (snap) => setUserLiked(snap.exists()));
    return () => unsub();
  }, [post.id, currentUser]);

  useEffect(() => setLocalLikesCount(post.likesCount || 0), [post.likesCount]);

  // 🔹 Toggle like
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
          transaction.update(postRef, {
            likesCount: Math.max(0, currentCount - 1),
          });
        } else {
          transaction.set(likeRef, {
            uid: currentUser.uid,
            createdAt: serverTimestamp(),
          });
          transaction.update(postRef, { likesCount: currentCount + 1 });

          // Add notification
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

  // 🔹 Show last 2 comments
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

  // 🔹 Add comment
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

      // Add notification
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
    <div className="post">
      <div className="post-header">
        <div className="avatar">
          <img
            src={
              post.userPhoto ||
              "https://ionicframework.com/docs/img/demos/avatar.svg"
            }
            alt={post.username}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        <IonText
          className="username"
          onClick={() => history.push(`/profile/${post.uid}`)}
        >
          {post.username}
        </IonText>
      </div>

      {post.imageUrl && (
        <div className="post-image">
          <img src={post.imageUrl} alt="Post" />
        </div>
      )}

      <div className="post-actions">
        <IonIcon
          icon={userLiked ? heart : heartOutline}
          onClick={toggleLike}
          style={{ cursor: "pointer", fontSize: 22 }}
        />
        <span className="like-count">{localLikesCount}</span>

        <IonIcon
          icon={chatbubbleOutline}
          style={{ cursor: "pointer", fontSize: 22, marginLeft: 16 }}
          onClick={() => setShowCommentBox((prev) => !prev)}
        />
        <span style={{ marginLeft: 8 }}>{post.commentsCount || 0}</span>

        <div style={{ flex: 1 }} />

        <IonIcon
          icon={paperPlaneOutline}
          style={{ cursor: "pointer", fontSize: 20 }}
        />
      </div>

      <div className="post-caption">
        <IonText
          style={{ fontWeight: "bold", cursor: "pointer" }}
          onClick={() => history.push(`/profile/${post.uid}`)}
        >
          {post.username}
        </IonText>{" "}
        {post.content}
      </div>

      <div className="comments-preview">
        {latestComments.map((c) => (
          <div key={c.id} className="comment-line">
            <strong>{c.username}</strong> {c.text}
          </div>
        ))}
      </div>

      {currentUser && showCommentBox && (
        <div className="comment-input">
          <IonTextarea
            value={commentText}
            onIonInput={(e) => setCommentText(e.detail.value!)}
            placeholder="Add a comment..."
            autoGrow
            rows={1}
            className="comment-box"
          />
          <IonButton fill="clear" onClick={addComment}>
            Post
          </IonButton>
        </div>
      )}

      <div className="post-time">
        {post.createdAt?.toDate
          ? post.createdAt.toDate().toLocaleString()
          : ""}
      </div>
    </div>
  );
};
