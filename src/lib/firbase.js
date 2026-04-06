import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA4G0HhN7CvoFkl7QOL0ie8jkB3h3zHtJ4",
  authDomain: "reactchat-ade1c.firebaseapp.com",
  projectId: "reactchat-ade1c",
  storageBucket: "reactchat-ade1c.firebasestorage.app",
  messagingSenderId: "1079250169983",
  appId: "1:1079250169983:web:ceb06712dc2fec8a22cf4a"
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
