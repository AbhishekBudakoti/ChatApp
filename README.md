## React Chat App + Firebase (Firestore) Overview

This project is a **real‑time chat application** built with React (Vite) and **Firebase**.  
It uses **Firebase Authentication** for users and **Cloud Firestore** to store chats, messages and user chat lists.

### Key Firebase Files

- **`src/lib/firbase.js`**
  - Initializes the Firebase app.
  - Exports:
    - `auth` – Firebase Auth instance.
    - `db` – Firestore instance.
    - `FIREBASE_COLLECTIONS` – names of collections used in Firestore:
      - `CHATS` → `"chats"`
      - `USERS` → `"users"`
      - `USER_CHATS` → `"userChats"`
    - `FIREBASE_FIELDS` – common field names used across documents (e.g. `chatId`, `messages`, `lastMessage`, `isSeen`, `receiverId`, etc.).

### Firestore Data Model

- **`users` collection**
  - One document per user (document ID is the user’s `uid`).
  - Example fields:
    - `uid` – Firebase Auth UID.
    - `username`
    - `email`
    - `avatar`
    - `blocked` – array of user UIDs that this user has blocked.

- **`chats` collection**
  - One document per chat between two users (document ID is `chatId` stored in the Zustand `chatStore`).
  - Fields:
    - `messages` – **array** of message objects:
      - `senderId` – UID of sender.
      - `text` – message text.
      - `createdAt` – timestamp (number: `Date.now()`).

- **`userChats` collection**
  - One document per user (document ID is the user’s `uid`).
  - Fields:
    - `chats` – array of chat summary objects:
      - `chatId` – ID of the chat document in `chats` collection.
      - `lastMessage` – last message text for that chat.
      - `isSeen` – whether this user has seen the last message.
      - `updatedAt` – timestamp of last update.
      - `receiverId` – UID of the *other* user in this chat.

### How the Chat Screen Works (`src/components/chat/chat.jsx`)

- **State & Stores**
  - Uses `useUserStore` to get `currentUser`.
  - Uses `useChatStore` to get:
    - `chatId` – ID of the current chat document.
    - `user` – the other user in the current conversation.
    - `isCurrentUserBlocked` / `isReceiverBlocked` – flags that control if typing is allowed.

- **Real‑time Messages**
  - `onSnapshot(doc(db, "chats", chatId), ...)`:
    - Subscribes to the chat document in the `chats` collection.
    - Whenever `messages` changes, it updates local `chat` state and auto‑scrolls to the bottom.
    - It also updates the corresponding `userChats` entries for both users with the **latest**:
      - `lastMessage`
      - `isSeen`
      - `updatedAt`
      - `receiverId`
    - If a `userChats` document does **not** exist yet, it is automatically created with a new `chats` array.

- **Sending a Message (`handleSend`)**
  - Validates input and that `chatId`, `currentUser.uid`, and `user.uid` exist.
  - **Step 1 – `chats` collection**
    - Uses `setDoc(..., { merge: true })` on `doc(db, "chats", chatId)` with `arrayUnion`:
      - If the chat document does **not** exist (e.g. collection was deleted), it is **created automatically**.
      - Appends a new message object into the `messages` array.
  - **Step 2 – `userChats` collection**
    - For each of the two users (`currentUser.uid` and `user.uid`):
      - Reads `doc(db, "userChats", userId)`.
      - Builds a chat summary entry containing `chatId`, `lastMessage`, `isSeen`, `updatedAt`, and `receiverId`.
      - If the `userChats` document already exists:
        - Updates the corresponding chat entry if found.
        - Otherwise pushes a new chat entry into the `chats` array.
      - If the `userChats` document does **not** exist:
        - Creates a new document with a `chats` array containing this single chat entry.
  - This means that **even if your `chats` and `userChats` collections are deleted**, sending a message will automatically:
    - Re‑create the chat document in `chats`.
    - Re‑create the related user summary documents in `userChats`.

### Error Handling Improvements

- The chat screen:
  - Guards against missing `chatId` or user information before sending a message.
  - Uses `setDoc(..., { merge: true })` so Firestore documents are created if missing.
  - Handles the case where `userChats` documents do not exist, preventing `No document to update` and `indexOf` errors from the Firestore internals.

### Running the App

- **Install dependencies**
  - `npm install`
- **Start the development server**
  - `npm run dev`
- Open the printed `http://localhost:xxxx` URL in your browser and log in / register.
- Start a conversation and send a message – the necessary Firestore documents in `chats` and `userChats` will be created or updated automatically.

If you ever accidentally delete the `chats` or `userChats` collections again, just open a chat and send a new message – the app will rebuild the required documents on its own.
