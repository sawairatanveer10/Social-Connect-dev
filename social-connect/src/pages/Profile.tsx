import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonAvatar,
  IonText,
  IonButton,
  IonIcon,
  IonInput,
  IonTextarea,
  IonSpinner,
} from "@ionic/react";
import {
  addCircleOutline,
  logOutOutline,
  chatbubbleOutline,
  shareOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";
import { auth, db, storage } from "../lib/firebase";
import {
  doc,
  onSnapshot,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useHistory, useParams } from "react-router-dom";
import FollowButton from "../components/FollowButton";
import { getOrCreateChat } from "../services/chatService";   // ✅ Added

interface RouteParams {
  userId?: string;
}
interface UserProfile {
  name?: string;
  bio?: string;
  email?: string;
  photoURL?: string;
  followersCount?: number;
  followingCount?: number;
  website?: string;
  verified?: boolean;
}
interface Post {
  id: string;
  imageUrl: string;
}

const Profile: React.FC = () => {
  const history = useHistory();
  const { userId } = useParams<RouteParams>();
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [photoURL, setPhotoURL] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "reels" | "tagged">(
    "posts"
  );

  const isMyProfile = !userId || userId === currentUser?.uid;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) history.replace("/signin");
      else setCurrentUser(user);
    });

    const uid = userId || currentUser?.uid;
    if (!uid) return;

    const userRef = doc(db, "users", uid);
    const unsubProfile = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfileUser(data);
        setPhotoURL(data.photoURL || "");
        setName(data.name || "");
        setBio(data.bio || "");
      }
      setLoading(false);
    });

    const fetchPosts = async () => {
      const postsRef = collection(db, "posts");
      const q = query(
        postsRef,
        where("uid", "==", uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const postArr: Post[] = [];
      snap.forEach((doc) =>
        postArr.push({ id: doc.id, imageUrl: doc.data().imageUrl })
      );
      setPosts(postArr);
    };
    fetchPosts();

    return () => unsubProfile();
  }, [currentUser, userId, history]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const storageRef = ref(storage, `profiles/${currentUser.uid}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setPhotoURL(url);
    await setDoc(
      doc(db, "users", currentUser.uid),
      { photoURL: url },
      { merge: true }
    );
  };

  const handleSave = async () => {
    if (!currentUser) return;
    await setDoc(
      doc(db, "users", currentUser.uid),
      { name, bio },
      { merge: true }
    );
    alert("Profile updated!");
  };

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.removeItem("user");
    history.replace("/signin");
  };

  if (loading)
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    );

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: 16,
            maxWidth: 700,
            margin: "0 auto",
          }}
        >
          {/* Top section: Avatar + Info */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              marginBottom: 16,
            }}
          >
            {/* Avatar */}
            <div style={{ position: "relative" }}>
              <IonAvatar
                style={{
                  width: 64,
                  height: 64,
                  border: "2px solid #ddd",
                  boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
                }}
              >
                <img
                  src={
                    photoURL ||
                    "https://ionicframework.com/docs/img/demos/avatar.svg"
                  }
                  alt="Profile"
                  style={{ objectFit: "cover" }}
                />
              </IonAvatar>
              {isMyProfile && (
                <>
                  <label
                    htmlFor="fileUpload"
                    style={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      background: "#0d6efd",
                      borderRadius: "50%",
                      width: 20,
                      height: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      border: "2px solid #fff",
                    }}
                  >
                    <IonIcon
                      icon={addCircleOutline}
                      style={{ color: "#fff", fontSize: 10 }}
                    />
                  </label>
                  <input
                    id="fileUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                </>
              )}
            </div>

            {/* Info */}
            <div style={{ marginLeft: 12, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {isMyProfile ? (
                  <IonInput
                    value={name}
                    onIonInput={(e) => setName(e.detail.value || "")}
                    placeholder="Username"
                    style={{ fontSize: 16, fontWeight: 600, padding: 4 }}
                  />
                ) : (
                  <>
                    <h2
                      style={{ margin: 0, fontSize: 16, fontWeight: 600 }}
                    >
                      {profileUser?.name || "Unnamed"}
                    </h2>
                    {profileUser?.verified && (
                      <IonIcon
                        icon={checkmarkCircleOutline}
                        style={{ color: "#3498db", fontSize: 16 }}
                      />
                    )}
                  </>
                )}
              </div>

              <div style={{ marginTop: 4 }}>
                {isMyProfile ? (
                  <IonTextarea
                    value={bio}
                    onIonInput={(e) => setBio(e.detail.value || "")}
                    placeholder="Your bio"
                    style={{
                      fontSize: 13,
                      padding: 4,
                      height: 50,
                      resize: "none",
                    }}
                  />
                ) : (
                  profileUser?.bio && (
                    <p style={{ margin: 0, fontSize: 13, color: "#555" }}>
                      {profileUser.bio}
                    </p>
                  )
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 16,
                  marginTop: 8,
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <strong>{posts.length}</strong>
                  <div style={{ fontSize: 12, color: "#555" }}>Posts</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <strong>{profileUser?.followersCount ?? 0}</strong>
                  <div style={{ fontSize: 12, color: "#555" }}>Followers</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <strong>{profileUser?.followingCount ?? 0}</strong>
                  <div style={{ fontSize: 12, color: "#555" }}>Following</div>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                {isMyProfile ? (
                  <>
                    <IonButton
                      style={{ flex: 1, borderRadius: 18, fontSize: 12 }}
                      onClick={handleSave}
                    >
                      Save
                    </IonButton>
                    <IonButton
                      style={{ flex: 1, borderRadius: 18, fontSize: 12 }}
                      color="medium"
                      onClick={handleLogout}
                    >
                      <IonIcon icon={logOutOutline} /> Logout
                    </IonButton>
                  </>
                ) : (
                  <>
                    <FollowButton
                      currentUserId={currentUser?.uid!}
                      targetUserId={userId!}
                    />
                    <IonButton
                      style={{ flex: 1, borderRadius: 18, fontSize: 12 }}
                      onClick={async () => {
                        if (!currentUser || !userId) return;
                        const chatId = await getOrCreateChat(
                          currentUser.uid,
                          userId
                        );
                        history.push(`/chat/${chatId}`);
                      }}
                    >
                      <IonIcon icon={chatbubbleOutline} /> Message
                    </IonButton>
                    <IonButton
                      style={{ flex: 1, borderRadius: 18, fontSize: 12 }}
                    >
                      <IonIcon icon={shareOutline} /> Share
                    </IonButton>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              width: "100%",
              borderTop: "1px solid #ddd",
              borderBottom: "1px solid #ddd",
              marginBottom: 8,
            }}
          >
            {["posts", "reels", "tagged"].map((tab) => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                style={{
                  padding: "8px 0",
                  cursor: "pointer",
                  fontWeight: activeTab === tab ? "600" : "400",
                  fontSize: 12,
                  borderBottom:
                    activeTab === tab ? "2px solid #000" : "none",
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </div>
            ))}
          </div>

          {/* Posts Grid */}
          {activeTab === "posts" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 2,
                width: "100%",
              }}
            >
              {posts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    width: "100%",
                    aspectRatio: "1/1",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={p.imageUrl}
                    alt="Post"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Placeholder for other tabs */}
          {activeTab !== "posts" && (
            <div
              style={{
                width: "100%",
                padding: 16,
                textAlign: "center",
                color: "#999",
              }}
            >
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content
              coming soon
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
