import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  serverTimestamp,
  doc,
  getDoc,
  arrayUnion,
} from "firebase/firestore";
import "./addUser.css";
import { db, FIREBASE_COLLECTIONS, FIREBASE_FIELDS } from "../../../../lib/firbase";
import { DEFAULT_AVATAR } from "../../../../lib/assets";
import { useState } from "react";
import { useUserStore } from "../../../../lib/userStore";
import { useChatStore } from "../../../../lib/chatStore";
import { toast } from "react-toastify";

const AddUser = ({ onClose, existingChatUserIds = [] }) => {
  const [searchedUser, setSearchedUser] = useState(null);

  const currentUser = useUserStore((state) => state.currentUser);
  const changeChat = useChatStore((state) => state.changeChat);

  // 🔍 Search user by username
  const handleSearch = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const username = formData.get("username")?.trim();

    if (!username) {
      toast.warning("Please enter a username");
      return;
    }

    try {
      const userRef = collection(db, FIREBASE_COLLECTIONS.USERS);
      const q = query(userRef, where(FIREBASE_FIELDS.USERNAME, "==", username));
      const result = await getDocs(q);

      if (result.empty) {
        setSearchedUser(null);
        toast.error("User not found ❌");
        return;
      }

      const userData = {
        id: result.docs[0].id,
        ...result.docs[0].data(),
      };

      if (userData.id === currentUser.uid) {
        toast.warning("You cannot start a chat with yourself 😅");
        return;
      }

      if (existingChatUserIds.includes(userData.id)) {
        setSearchedUser(null);
        toast.info("This user is already in your chat list");
        return;
      }

      setSearchedUser(userData);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Something went wrong while searching ❌");
    }
  };

  // ➕ Add or Open Chat
  const handleAddUser = async () => {
    if (!searchedUser || !currentUser) return;

    try {
      const currentUserChatRef = doc(db, FIREBASE_COLLECTIONS.USER_CHATS, currentUser.uid);

      // Check if userChats exists
      const userChatsSnap = await getDoc(currentUserChatRef);
      const userChats = userChatsSnap.exists()
        ? userChatsSnap.data()[FIREBASE_FIELDS.CHATS] || []
        : [];

      // 🔍 Check if chat already exists
      const existingChat = userChats.find(
        (c) => c[FIREBASE_FIELDS.RECEIVER_ID] === searchedUser.id
      );

      if (existingChat) {
        // 🔥 Chat already exists — open it
        toast.info("Chat already exists — opening it 📂");
        changeChat(existingChat[FIREBASE_FIELDS.CHAT_ID], searchedUser);
        if (onClose) onClose();
        return;
      }

      // 🆕 Create a new chat
      const newChatRef = doc(collection(db, FIREBASE_COLLECTIONS.CHATS));
      await setDoc(newChatRef, {
        [FIREBASE_FIELDS.CREATED_AT]: serverTimestamp(),
        [FIREBASE_FIELDS.MESSAGES]: [],
      });

      const newChatObjForCurrent = {
        [FIREBASE_FIELDS.CHAT_ID]: newChatRef.id,
        [FIREBASE_FIELDS.RECEIVER_ID]: searchedUser.id,
        [FIREBASE_FIELDS.UPDATED_AT]: Date.now(),
      };

      const newChatObjForOther = {
        [FIREBASE_FIELDS.CHAT_ID]: newChatRef.id,
        [FIREBASE_FIELDS.RECEIVER_ID]: currentUser.uid,
        [FIREBASE_FIELDS.UPDATED_AT]: Date.now(),
      };

      // Add chat to current user
      await setDoc(
        currentUserChatRef,
        { [FIREBASE_FIELDS.CHATS]: arrayUnion(newChatObjForCurrent) },
        { merge: true }
      );

      // Add chat to searched user
      const otherUserChatRef = doc(db, FIREBASE_COLLECTIONS.USER_CHATS, searchedUser.id);
      await setDoc(
        otherUserChatRef,
        { [FIREBASE_FIELDS.CHATS]: arrayUnion(newChatObjForOther) },
        { merge: true }
      );

      toast.success("Chat created successfully 🎉");

      // Open the new chat
      changeChat(newChatRef.id, searchedUser);

      setSearchedUser(null);
      if (onClose) onClose();
    } catch (error) {
      console.error("Chat creation error:", error);
      toast.error("Failed to create chat ❌");
    }
  };

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" />
        <button type="submit">Search</button>
      </form>

      {searchedUser && (
        <div className="user">
          <div className="detail">
            <img
              src={searchedUser[FIREBASE_FIELDS.AVATAR] || DEFAULT_AVATAR}
              alt="avatar"
            />
            <span>{searchedUser[FIREBASE_FIELDS.USERNAME]}</span>
          </div>
          <button onClick={handleAddUser}>Add User</button>
        </div>
      )}
    </div>
  );
};

export default AddUser;
