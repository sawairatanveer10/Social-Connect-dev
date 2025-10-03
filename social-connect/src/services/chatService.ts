// src/services/chatService.ts
import { db, serverTimestamp } from "../lib/firebase";
import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
  limit,
} from "firebase/firestore";

export interface Chat {
  id: string;
  participants: string[];
  createdAt?: any;
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: number;
  };
  userDetails?: {
    uid: string;
    username: string;
    profilePic: string;
  }[];
}

// Generate a unique chatId for 2 users
export function getChatId(user1: string, user2: string): string {
  return [user1, user2].sort().join("_"); // ensures consistency
}

// Create or get existing chat
export async function getOrCreateChat(user1: string, user2: string) {
  const chatId = getChatId(user1, user2);
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      participants: [user1, user2],
      createdAt: serverTimestamp(),
    });
  }
  return chatId;
}

// Send a new message
export async function sendMessage(chatId: string, senderId: string, text: string) {
  const messagesRef = collection(db, "chats", chatId, "messages");
  await addDoc(messagesRef, {
    senderId,
    text,
    createdAt: serverTimestamp(),
  });
}

// Listen for real-time messages
export function listenForMessages(chatId: string, callback: (messages: any[]) => void) {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(msgs);
  });
}

// ✅ Get all chats for a user, including last message
export async function getUserChats(userId: string): Promise<Chat[]> {
  const q = query(collection(db, "chats"), where("participants", "array-contains", userId));
  const snap = await getDocs(q);

  const chats: Chat[] = [];

  for (const d of snap.docs) {
    const chatData: Chat = { id: d.id, ...(d.data() as any) };

    // Fetch last message
    const messagesRef = collection(db, "chats", d.id, "messages");
    const lastMsgQuery = query(messagesRef, orderBy("createdAt", "desc"), limit(1));
    const lastMsgSnap = await getDocs(lastMsgQuery);

    if (!lastMsgSnap.empty) {
      const msg = lastMsgSnap.docs[0].data();
      chatData.lastMessage = {
        text: msg.text,
        senderId: msg.senderId,
        createdAt: msg.createdAt?.toMillis?.() || Date.now(),
      };
    }

    chats.push(chatData);
  }

  return chats;
}
