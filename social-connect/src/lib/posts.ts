import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export const listenPostUpdates = (postId: string, callback: (data: any) => void) => {
  const unsubscribe = onSnapshot(doc(db, "posts", postId), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    }
  });
  return unsubscribe; // unsubscribe when component unmounts
};
