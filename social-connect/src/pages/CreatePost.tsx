import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonAvatar,
  IonButton,
  IonTextarea,
  IonText,
} from "@ionic/react";
import { auth, db, storage } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { requestNotificationPermission } from "../lib/notifications";

const CreatePost: React.FC = () => {
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      setError("You must be logged in to post.");
      return;
    }
    if (!content.trim() && !file) {
      setError("Post cannot be empty.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let imageUrl = "";

      if (file) {
        const storageRef = ref(storage, `posts/${auth.currentUser.uid}_${Date.now()}`);
        await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(storageRef);
      }

      let username = auth.currentUser.displayName || "Unnamed User";
      let userPhoto = auth.currentUser.photoURL || "";

      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const uData = userDoc.data();
          username = uData.name || username;
          userPhoto = uData.photoURL || userPhoto;
        }
      } catch (err) {
        console.error("⚠️ Error fetching user profile:", err);
      }

      await addDoc(collection(db, "posts"), {
        uid: auth.currentUser.uid,
        content,
        imageUrl,
        createdAt: serverTimestamp(),
        username,
        userPhoto,
        likesCount: 0,
        commentsCount: 0,
      });

      setContent("");
      setFile(null);
      setPreview(null);
      alert("✅ Post created!");
    } catch (err: any) {
      console.error("❌ Error creating post:", err);
      setError("Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="dark">
          <IonTitle className="ion-text-center">Create Post</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" fullscreen>
        <div className="container">
          <div className="post-card">
            <div className="user-info">
              <IonAvatar className="avatar">
                <img
                  src={auth.currentUser?.photoURL || "https://ionicframework.com/docs/img/demos/avatar.svg"}
                  alt="user"
                />
              </IonAvatar>
              <span className="username">{auth.currentUser?.displayName || "You"}</span>
            </div>

            <IonTextarea
              value={content}
              onIonInput={(e) => setContent(e.detail.value!)}
              placeholder="What's on your mind?"
              autoGrow
              className="post-textarea"
            />

            {error && <IonText className="error-text">{error}</IonText>}

            <div className="upload-btn-wrapper">
              <label htmlFor="file-upload" className="upload-btn">
                <div className="plus-icon">+</div>
                <div className="upload-text">Upload File</div>
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
            </div>

            {preview && (
              <div className="image-preview">
                <img src={preview} alt="preview" />
              </div>
            )}

            <IonButton
              className="post-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Posting..." : "Post"}
            </IonButton>
          </div>
        </div>

        {/* Embedded CSS styling */}
        <style>{`
          .container {
            display: flex;
            justify-content: center;
            padding: 20px;
          }
          .post-card {
            width: 100%;
            max-width: 500px;
            background: #fff;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            gap: 15px;
          }
          .user-info {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;
          }
          .avatar {
            width: 50px;
            height: 50px;
          }
          .username {
            font-weight: bold;
            font-size: 16px;
          }
          .post-textarea {
            width: 100%;
            border-radius: 12px;
            border: 1px solid #ddd;
            padding: 12px 16px;
            background: #f9f9f9;
            resize: none;
          }
          .error-text {
            color: red;
            font-size: 14px;
          }
          .upload-btn-wrapper {
            position: relative;
            width: 120px;
            cursor: pointer;
            align-self: center; /* center upload button */
          }
          .upload-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 1px dashed #888;
            border-radius: 12px;
            padding: 10px;
            gap: 5px;
            font-weight: bold;
          }
          .plus-icon {
            font-size: 20px;
          }
          .image-preview img {
            width: 100%;
            border-radius: 12px;
            margin-top: 10px;
          }
          /* Post button styling */
          .post-btn {
            background: #000;
            color: #fff;
            border-radius: 12px;
            padding: 14px 0;
            font-weight: bold;
            width: 60%;
            align-self: center;
            font-size: 16px;
          }
        `}</style>
      </IonContent>
    </IonPage>
  );
};

export default CreatePost;
