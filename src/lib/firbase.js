import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore();

// Firebase Collections
export const FIREBASE_COLLECTIONS = {
  CHATS: "chats",
  USERS: "users",
  USER_CHATS: "userChats",
};

// Firebase Field Names
export const FIREBASE_FIELDS = {
  CHAT_ID: "chatId",
  MESSAGES: "messages",
  CHATS: "chats",
  RECEIVER_ID: "receiverId",
  LAST_MESSAGE: "lastMessage",
  UPDATED_AT: "updatedAt",
  IS_SEEN: "isSeen",
  CREATED_AT: "createdAt",
  SENDER_ID: "senderId",
  TEXT: "text",
  BLOCKED: "blocked",
  USER: "user",
  AVATAR: "avatar",
  USERNAME: "username",
  BIO: "bio",
  EMAIL: "email",
  UID: "uid",
};

// Store Property Names
export const STORE_PROPERTIES = {
  IS_CURRENT_USER_BLOCKED: "isCurrentUserBlocked",
  IS_RECEIVER_BLOCKED: "isReceiverBlocked",
  CHAT_ID: "chatId",
  USER: "user",
  CURRENT_USER: "currentUser",
};

// Common Variable Names (for consistency)
export const VAR_NAMES = {
  CHAT_DATA: "chatData",
  USER_CHAT_DATA: "userChatData",
  USER_CHATS: "userChats",
  LAST_MESSAGE: "lastMessage",
  CURRENT_USER: "currentUser",
};
