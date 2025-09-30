import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  likes: number;
}

interface PostsState {
  posts: Post[];
}

const initialState: PostsState = {
  posts: [],
};

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    setPosts(state, action: PayloadAction<Post[]>) {
      state.posts = action.payload;
    },
    addPost(state, action: PayloadAction<Post>) {
      state.posts.unshift(action.payload);
    },
    updateLikes(state, action: PayloadAction<{ postId: string; likes: number }>) {
      const post = state.posts.find((p) => p.id === action.payload.postId);
      if (post) post.likes = action.payload.likes;
    },
  },
});

export const { setPosts, addPost, updateLikes } = postsSlice.actions;
export default postsSlice.reducer;
