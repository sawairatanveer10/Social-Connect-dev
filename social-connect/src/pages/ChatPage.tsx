import React, { useEffect, useState, useRef } from "react";
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonAvatar,
  IonText,
} from "@ionic/react";
import { useParams } from "react-router-dom";
import { auth } from "../lib/firebase";
import { sendMessage, listenForMessages } from "../services/chatService";

interface RouteParams {
  chatId: string;
}

const ChatPage: React.FC = () => {
  const { chatId } = useParams<RouteParams>();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [otherUserName, setOtherUserName] = useState("User");
  const [otherUserPhoto, setOtherUserPhoto] = useState(
    "https://ionicframework.com/docs/img/demos/avatar.svg"
  );
  const contentRef = useRef<HTMLIonContentElement | null>(null);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!chatId) return;
    const unsub = listenForMessages(chatId, setMessages);
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.getScrollElement().then((el) => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!currentUser || !text.trim()) return;
    await sendMessage(chatId, currentUser.uid, text.trim());
    setText("");
  };

  return (
    <IonPage style={{ backgroundColor: "#fff" }}>
      {/* Custom Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 12px",
          borderBottom: "1px solid #ddd",
          position: "sticky",
          top: 0,
          backgroundColor: "#fff",
          zIndex: 1000,
        }}
      >
        <IonAvatar style={{ width: 40, height: 40 }}>
          <img src={otherUserPhoto} alt={otherUserName} />
        </IonAvatar>
        <div style={{ marginLeft: 10, fontWeight: "bold", fontSize: 16 }}>
          {otherUserName}
        </div>
      </div>

      {/* Chat Messages */}
      <IonContent
        ref={contentRef}
        style={{
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          backgroundColor: "#fafafa",
        }}
      >
        {messages.map((msg) => {
          const isCurrentUser = msg.senderId === currentUser?.uid;
          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: isCurrentUser ? "flex-end" : "flex-start",
              }}
            >
              {!isCurrentUser && (
                <IonAvatar style={{ width: 36, height: 36, marginRight: 6 }}>
                  <img
                    src={msg.userPhoto || "https://ionicframework.com/docs/img/demos/avatar.svg"}
                    alt={msg.senderName || "User"}
                  />
                </IonAvatar>
              )}
              <div
                style={{
                  backgroundColor: isCurrentUser ? "#0b93f6" : "#e5e5ea",
                  color: isCurrentUser ? "#fff" : "#000",
                  padding: "10px 14px",
                  borderRadius: 20,
                  maxWidth: "70%",
                  wordBreak: "break-word",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
              >
                <IonText style={{ wordWrap: "break-word" }}>{msg.text}</IonText>
                {msg.createdAt && (
                  <div
                    style={{
                      fontSize: 10,
                      color: isCurrentUser ? "#d0f0ff" : "#555",
                      marginTop: 4,
                      textAlign: "right",
                    }}
                  >
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
      </IonContent>

      {/* Input */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: 8,
          borderTop: "1px solid #ddd",
          backgroundColor: "#fff",
        }}
      >
        <IonInput
          value={text}
          placeholder="Message..."
          onIonChange={(e) => setText(e.detail.value || "")}
          style={{
            flex: 1,
            borderRadius: 50,
            backgroundColor: "#f0f0f0",
            padding: "10px 16px",
            border: "none",
          }}
        />
        <IonButton
          onClick={handleSend}
          style={{
            borderRadius: 50,
            padding: "0 16px",
            backgroundColor: "#0b93f6",
            color: "#fff",
          }}
        >
          Send
        </IonButton>
      </div>
    </IonPage>
  );
};

export default ChatPage;
