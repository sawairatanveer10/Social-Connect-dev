import React, { useEffect, useState } from "react";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { getUserChats } from "../services/chatService";
import { doc, getDoc } from "firebase/firestore";

interface ChatWithUserDetails {
  id: string;
  participants: string[];
  lastMessage?: any;
  otherUserName: string;
  otherUserPhoto: string;
}

const ChatList: React.FC = () => {
  const [chats, setChats] = useState<ChatWithUserDetails[]>([]);
  const history = useHistory();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const fetchChats = async () => {
      const userChats = await getUserChats(currentUser.uid);

      const chatsWithDetails = await Promise.all(
        userChats.map(async (chat: any) => {
          const otherUserId = chat.participants.find((id: string) => id !== currentUser.uid);
          let otherUserName = "User";
          let otherUserPhoto = "https://ionicframework.com/docs/img/demos/avatar.svg";

          if (otherUserId) {
            try {
              const userDoc = await getDoc(doc(db, "users", otherUserId));
              if (userDoc.exists()) {
                const data = userDoc.data();
                otherUserName = data.name || "User";
                otherUserPhoto = data.photoURL || otherUserPhoto;
              }
            } catch (error) {
              console.error("Error fetching other user:", error);
            }
          }

          return {
            ...chat,
            otherUserName,
            otherUserPhoto,
          };
        })
      );

      setChats(chatsWithDetails);
    };

    fetchChats();
  }, [currentUser]);

  // Inline styles for Instagram look
  const styles = {
    page: { backgroundColor: "#fafafa" },
    chatRow: (unread: boolean) => ({
      display: "flex",
      alignItems: "center",
      padding: "12px 16px",
      borderBottom: "1px solid #eee",
      cursor: "pointer",
      backgroundColor: unread ? "#fff" : "#fafafa",
      transition: "background 0.2s",
    }),
    avatar: { width: 50, height: 50, borderRadius: "50%", marginRight: 12 },
    username: (unread: boolean) => ({
      fontSize: 16,
      fontWeight: unread ? "bold" : "500",
      margin: 0,
    }),
    lastMessage: {
      fontSize: 14,
      color: "#555",
      margin: "4px 0 0 0",
      whiteSpace: "nowrap" as const,
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    newBadge: {
      backgroundColor: "#ff3b30",
      color: "#fff",
      fontSize: 12,
      fontWeight: "bold",
      padding: "4px 8px",
      borderRadius: 12,
    },
  };

  return (
    <IonPage style={styles.page}>
      <IonHeader>
        <IonToolbar color="light">
          <IonTitle>Chats</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {chats.map((chat) => {
            const lastMessage = chat.lastMessage?.text || "New chat...";
            const unread =
              chat.lastMessage?.senderId !== currentUser?.uid && chat.lastMessage;

            return (
              <div
                key={chat.id}
                onClick={() => history.push(`/chat/${chat.id}`)}
                style={styles.chatRow(!!unread)}
              >
                <img
                  src={chat.otherUserPhoto}
                  alt={chat.otherUserName}
                  style={styles.avatar}
                />

                <div style={{ flex: 1 }}>
                  <h2 style={styles.username(!!unread)}>{chat.otherUserName}</h2>
                  <p style={styles.lastMessage}>{lastMessage}</p>
                </div>

                {unread && <div style={styles.newBadge}>New</div>}
              </div>
            );
          })}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ChatList;
