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

  /** ✅ When a user selects an image, instantly show local preview */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f) {
      setFile(f);
      const objectURL = URL.createObjectURL(f);
      setPreview(objectURL);
    } else {
      setFile(null);
      setPreview(null);
    }
  };

  /** ✅ Upload to Firebase when user presses Post */
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

      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        const uData = userDoc.data();
        username = uData.name || username;
        userPhoto = uData.photoURL || userPhoto;
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
    } catch (err) {
      console.error("❌ Error creating post:", err);
      setError("Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="light">
          <IonTitle className="ion-text-center">Create Post</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" fullscreen>
        <div className="container">
          <div className="post-card">
            <div className="user-info">
              <IonAvatar className="avatar">
                <img
                  src={
                    auth.currentUser?.photoURL ||
                    "https://ionicframework.com/docs/img/demos/avatar.svg"
                  }
                  alt="user"
                />
              </IonAvatar>
              <span className="username">
                {auth.currentUser?.displayName || "You"}
              </span>
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
                <div className="plus-icon">＋</div>
                <div className="upload-text">Upload Photo</div>
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
            </div>

            {/* ✅ Live preview appears instantly after image pick */}
            {preview && (
              <div className="image-preview">
                <img src={preview} alt="preview" />
                <button
                  className="remove-preview-btn"
                  onClick={() => {
                    setPreview(null);
                    setFile(null);
                  }}
                >
                  ✕
                </button>
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

        {/* ---------- LIGHT-MODE INSTAGRAM-STYLE CSS ---------- */}
        <style>{`
          .container {
            display: flex;
            justify-content: center;
            padding: 20px;
          }

          .post-card {
            width: 100%;
            max-width: 500px;
            background: #ffffff;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .user-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .avatar {
            width: 48px;
            height: 48px;
          }

          .username {
            font-weight: 600;
            font-size: 15px;
          }

          .post-textarea {
            border-radius: 10px;
            border: 1px solid #ddd;
            background: #fafafa;
            padding: 10px;
            font-size: 15px;
          }

          .error-text {
            color: red;
            font-size: 13px;
          }

          .upload-btn-wrapper {
            display: flex;
            justify-content: center;
          }

          .upload-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 1px dashed #aaa;
            border-radius: 12px;
            padding: 10px 16px;
            color: #333;
            font-weight: 500;
            background: #fdfdfd;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .upload-btn:hover {
            background: #f2f2f2;
          }

          .plus-icon {
            font-size: 22px;
            margin-bottom: 2px;
          }

          /* 📸 Instagram-style square preview */
          .image-preview {
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: 100%;
            border-radius: 12px;
            overflow: hidden;
            margin-top: 12px;
          }

          .image-preview img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 12px;
          }

          .remove-preview-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(0,0,0,0.5);
            color: #fff;
            border: none;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            font-size: 16px;
            cursor: pointer;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s ease;
          }

          .remove-preview-btn:hover {
            background: rgba(255,0,0,0.7);
          }

          .post-btn {
            background: #000;
            color: #fff;
            border-radius: 12px;
            padding: 13px 0;
            font-weight: 600;
            width: 60%;
            align-self: center;
            font-size: 15px;
            margin-top: 8px;
          }
        `}</style>
      </IonContent>
    </IonPage>
  );
};

export default CreatePost;
