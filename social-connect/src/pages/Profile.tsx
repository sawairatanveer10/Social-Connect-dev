import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonAvatar,
  IonText,
  IonTextarea,
  IonIcon,
  IonList,
  IonSpinner,
} from "@ionic/react";
import { addCircleOutline, logOutOutline } from "ionicons/icons";
import { auth, db, storage } from "../lib/firebase";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useHistory, useParams } from "react-router-dom";
import FollowButton from "../components/FollowButton"; // ✅ import the follow button

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
}

const Profile: React.FC = () => {
  const history = useHistory();
  const { userId } = useParams<RouteParams>();

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [loading, setLoading] = useState(true);

  // Check if viewing own profile
  const isMyProfile = !userId || userId === currentUser?.uid;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        history.replace("/signin");
      } else {
        setCurrentUser(user);
        if (isMyProfile) setEmail(user.email || "");
      }
    });

    const uid = userId || currentUser?.uid;
    if (!uid) return;

    // ✅ live updates for profile
    const userRef = doc(db, "users", uid);
    const unsubProfile = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfileUser(data);
        setName(data.name || "");
        setBio(data.bio || "");
        setPhotoURL(data.photoURL || "");
        setEmail(data.email || "");
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      unsubProfile();
    };
  }, [currentUser, userId, history, isMyProfile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const storageRef = ref(storage, `profiles/${currentUser.uid}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setPhotoURL(url);
    await updateDoc(doc(db, "users", currentUser.uid), { photoURL: url });
  };

  const handleSave = async () => {
    if (!currentUser) return;
    await updateDoc(doc(db, "users", currentUser.uid), { name, bio });
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
        <IonContent className="ion-padding">
          <IonSpinner name="crescent" /> Loading...
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
            padding: 20,
          }}
        >
          {/* Profile Avatar */}
          <div
            style={{
              position: "relative",
              width: 130,
              height: 130,
              marginBottom: 15,
            }}
          >
            <IonAvatar
              style={{
                width: 130,
                height: 130,
                border: "2px solid #ddd",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
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

            {/* Plus Icon - only if own profile */}
            {isMyProfile && (
              <>
                <label
                  htmlFor="fileUpload"
                  style={{
                    position: "absolute",
                    bottom: -10,
                    right: "calc(50% - 17.5px)",
                    background: "#0d6efd",
                    borderRadius: "50%",
                    width: 35,
                    height: 35,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    border: "2px solid #fff",
                  }}
                >
                  <IonIcon
                    icon={addCircleOutline}
                    style={{ color: "white", fontSize: 20 }}
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

          {/* Name */}
          <IonItem
            style={{
              borderRadius: 12,
              marginBottom: 15,
              paddingLeft: 12,
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              width: "100%",
              maxWidth: 350,
              background: "#fff",
            }}
          >
            <IonLabel position="stacked">Name</IonLabel>
            <IonInput
              value={name}
              onIonInput={(e) =>
                isMyProfile && setName(e.detail.value || "")
              }
              readonly={!isMyProfile}
            />
          </IonItem>

          {/* Bio */}
          <IonItem
            style={{
              borderRadius: 12,
              marginBottom: 15,
              paddingLeft: 12,
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              width: "100%",
              maxWidth: 350,
              background: "#fff",
            }}
          >
            <IonLabel position="stacked">Bio</IonLabel>
            <IonTextarea
              value={bio}
              onIonInput={(e) =>
                isMyProfile && setBio(e.detail.value || "")
              }
              rows={3}
              style={{ padding: "10px 0" }}
              readonly={!isMyProfile}
            />
          </IonItem>

          {/* Email */}
          <IonItem
            style={{
              borderRadius: 12,
              marginBottom: 20,
              paddingLeft: 12,
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              width: "100%",
              maxWidth: 350,
              background: "#fff",
            }}
          >
            <IonLabel position="stacked">Email</IonLabel>
            <IonText style={{ padding: "10px 0" }}>{email}</IonText>
          </IonItem>

          {/* ✅ Followers / Following */}
          <IonList
            style={{
              marginBottom: 20,
              width: "100%",
              maxWidth: 350,
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            }}
          >
            <IonItem>
              <IonLabel>
                <strong>{profileUser?.followersCount ?? 0}</strong> Followers
              </IonLabel>
              <IonLabel>
                <strong>{profileUser?.followingCount ?? 0}</strong> Following
              </IonLabel>
            </IonItem>
          </IonList>

          {/* ✅ Follow / Unfollow button (only on other profiles) */}
          {!isMyProfile && currentUser?.uid && (
            <FollowButton
              currentUserId={currentUser?.uid}
              targetUserId={userId!}
            />
          )}

          {/* Save button only if own profile */}
          {isMyProfile && (
            <IonButton
              expand="block"
              onClick={handleSave}
              style={{
                width: 150,
                borderRadius: 25,
                background: "#0d6efd",
                color: "#fff",
                fontWeight: 600,
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              Save
            </IonButton>
          )}

          {/* Logout button only if own profile */}
          {isMyProfile && (
            <IonButton
              expand="block"
              color="medium"
              onClick={handleLogout}
              style={{
                width: 150,
                borderRadius: 25,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IonIcon icon={logOutOutline} slot="start" />
              Logout
            </IonButton>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
