import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase"; // your Firebase initialization file

export const searchUsersOrPosts = async (searchText: string) => {
  if (!searchText.trim()) return { users: [], posts: [] };

  // Search users by name
  const usersQuery = query(
    collection(db, "users"),
    where("name", ">=", searchText),
    where("name", "<=", searchText + "\uf8ff")
  );

  // Search posts by title or content
  const postsQuery = query(
    collection(db, "posts"),
    where("title", ">=", searchText),
    where("title", "<=", searchText + "\uf8ff")
  );

  const [usersSnapshot, postsSnapshot] = await Promise.all([
    getDocs(usersQuery),
    getDocs(postsQuery),
  ]);

  const users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const posts = postsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return { users, posts };
};
