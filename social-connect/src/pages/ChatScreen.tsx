import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../lib/firebase";
import { sendMessage, listenForMessages } from "../services/chatService";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

interface RouteParams {
  chatId: string;
}

const ChatScreen: React.FC = () => {
  const { chatId } = useParams<RouteParams>();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [otherUserName, setOtherUserName] = useState("User");
  const [otherUserPhoto, setOtherUserPhoto] = useState(
    "https://ionicframework.com/docs/img/demos/avatar.svg"
  );
  const contentRef = useRef<HTMLDivElement | null>(null);

  const currentUser = auth.currentUser;

  // Fetch messages in real-time
  useEffect(() => {
    if (!chatId) return;
    const unsub = listenForMessages(chatId, setMessages);
    return () => unsub();
  }, [chatId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch the other user's name and photo from Firestore
  useEffect(() => {
    const fetchOtherUser = async () => {
      if (!chatId || !currentUser) return;

      // Assuming chatId contains both UIDs, e.g., "uid1_uid2"
      const userIds = chatId.split("_");
      const otherUserId = userIds.find((id) => id !== currentUser.uid);
      if (!otherUserId) return;

      try {
        const userDoc = await getDoc(doc(db, "users", otherUserId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setOtherUserName(data.name || "User");
          setOtherUserPhoto(data.photoURL || "https://ionicframework.com/docs/img/demos/avatar.svg");
        }
      } catch (error) {
        console.error("Error fetching other user:", error);
      }
    };

    fetchOtherUser();
  }, [chatId, currentUser]);

  const handleSend = async () => {
    if (!currentUser || !text.trim()) return;
    await sendMessage(chatId, currentUser.uid, text.trim());
    setText("");
  };

  // Inline styles for Instagram look
  const styles = {
    page: {
      display: "flex",
      flexDirection: "column" as const,
      height: "100vh",
      backgroundColor: "#fafafa",
    },
    header: {
      display: "flex",
      alignItems: "center",
      padding: 10,
      borderBottom: "1px solid #ddd",
      backgroundColor: "#fff",
      position: "sticky" as const,
      top: 0,
      zIndex: 10,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      marginRight: 10,
    },
    username: {
      fontWeight: "bold",
      fontSize: 16,
    },
    content: {
      flex: 1,
      padding: 12,
      overflowY: "auto" as const,
      display: "flex",
      flexDirection: "column" as const,
      gap: 8,
    },
    message: (isCurrentUser: boolean) => ({
      display: "flex",
      alignItems: "flex-end",
      justifyContent: isCurrentUser ? "flex-end" : "flex-start",
    }),
    messageAvatar: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      marginRight: 6,
    },
    messageBubble: (isCurrentUser: boolean) => ({
      maxWidth: "70%",
      padding: "10px 14px",
      borderRadius: 20,
      backgroundColor: isCurrentUser ? "#0b93f6" : "#e5e5ea",
      color: isCurrentUser ? "#fff" : "#000",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "flex-end",
      wordBreak: "break-word" as const,
    }),
    messageTime: {
      fontSize: 10,
      marginTop: 4,
      textAlign: "right" as const,
      color: "#555",
    },
    inputContainer: {
      display: "flex",
      padding: 8,
      borderTop: "1px solid #ddd",
      backgroundColor: "#fff",
      gap: 6,
    },
    input: {
      flex: 1,
      borderRadius: 50,
      border: "none",
      padding: "10px 16px",
      backgroundColor: "#f0f0f0",
    },
    sendButton: {
      borderRadius: 50,
      backgroundColor: "#0b93f6",
      color: "#fff",
      border: "none",
      padding: "0 16px",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <img src={otherUserPhoto} alt={otherUserName} style={styles.avatar} />
        <span style={styles.username}>{otherUserName}</span>
      </div>

      {/* Messages */}
      <div style={styles.content} ref={contentRef}>
        {messages.map((msg) => {
          const isCurrentUser = msg.senderId === currentUser?.uid;
          return (
            <div key={msg.id} style={styles.message(isCurrentUser)}>
              {!isCurrentUser && (
                <img
                  src={msg.userPhoto || otherUserPhoto}
                  alt={msg.senderName || "User"}
                  style={styles.messageAvatar}
                />
              )}
              <div style={styles.messageBubble(isCurrentUser)}>
                {msg.text}
                {msg.createdAt && (
                  <div style={styles.messageTime}>
                    {msg.createdAt?.toDate
                      ? msg.createdAt.toDate().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={text}
          placeholder="Message..."
          onChange={(e) => setText(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleSend} style={styles.sendButton}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatScreen;
