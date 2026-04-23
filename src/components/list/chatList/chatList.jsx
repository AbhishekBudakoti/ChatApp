import { useEffect, useState } from "react";
import "./chatList.css";
import { FaSearch, FaPlus, FaMinus } from "react-icons/fa";

import AddUser from "./addUser/addUser";
import { useUserStore } from "../../../lib/userStore";
import { doc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { db, FIREBASE_COLLECTIONS, FIREBASE_FIELDS } from "../../../lib/firbase";
import { useChatStore } from "../../../lib/chatStore";


const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);

  const [input, setInput] = useState("");

  const { currentUser } = useUserStore();
  const { changeChat } = useChatStore();

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Listen to changes in userChats collection
    const unSub = onSnapshot(doc(db, FIREBASE_COLLECTIONS.USER_CHATS, currentUser.uid), async (res) => {
      const items = res.data()?.[FIREBASE_FIELDS.CHATS] || [];

      // Resolve each chat to include other user data
      const promises = items.map(async (item) => {
        try {
          const userDocRef = doc(db, FIREBASE_COLLECTIONS.USERS, item[FIREBASE_FIELDS.RECEIVER_ID]);
          const userDocSnap = await getDoc(userDocRef);
          const user = userDocSnap.exists() ? userDocSnap.data() : null;

          return { ...item, user };
        } catch (err) {
          console.error("Error loading chat user:", err);
          return { ...item, user: null };
        }
      });

      const chatData = await Promise.all(promises);

      // Sort by last updated
      setChats(chatData.sort((a, b) => b[FIREBASE_FIELDS.UPDATED_AT] - a[FIREBASE_FIELDS.UPDATED_AT]));
    });

    return () => unSub();
  }, [currentUser?.uid]);

  // Listen to all chats and update lastMessage when new messages arrive
  useEffect(() => {
    if (!currentUser?.uid || chats.length === 0) return;

    const unsubscribers = chats.map((chat) => {
      if (!chat.chatId) return null;

      return onSnapshot(doc(db, FIREBASE_COLLECTIONS.CHATS, chat[FIREBASE_FIELDS.CHAT_ID]), async (snapshot) => {
        const chatData = snapshot.data();
        if (!chatData?.[FIREBASE_FIELDS.MESSAGES] || chatData[FIREBASE_FIELDS.MESSAGES].length === 0) return;

        const lastMessage = chatData[FIREBASE_FIELDS.MESSAGES][chatData[FIREBASE_FIELDS.MESSAGES].length - 1];
        
        // Only update if this is a new message (not already the lastMessage)
        try {
          const userChatRef = doc(db, FIREBASE_COLLECTIONS.USER_CHATS, currentUser.uid);
          const userChatsSnapshot = await getDoc(userChatRef);
          
          if (userChatsSnapshot.exists()) {
            const userChatData = userChatsSnapshot.data();
            const userChats = userChatData[FIREBASE_FIELDS.CHATS] || [];
            const chatIndex = userChats.findIndex((c) => c[FIREBASE_FIELDS.CHAT_ID] === chat[FIREBASE_FIELDS.CHAT_ID]);
            
            if (chatIndex !== -1) {
              // Only update if the message is newer or different
              const currentLastMessage = userChats[chatIndex][FIREBASE_FIELDS.LAST_MESSAGE];
              const currentUpdatedAt = userChats[chatIndex][FIREBASE_FIELDS.UPDATED_AT] || 0;
              
              if (lastMessage[FIREBASE_FIELDS.TEXT] !== currentLastMessage || lastMessage[FIREBASE_FIELDS.CREATED_AT] > currentUpdatedAt) {
                userChats[chatIndex][FIREBASE_FIELDS.LAST_MESSAGE] = lastMessage[FIREBASE_FIELDS.TEXT];
                // Only mark as unseen if the message is from the other person
                if (lastMessage[FIREBASE_FIELDS.SENDER_ID] !== currentUser.uid) {
                  userChats[chatIndex][FIREBASE_FIELDS.IS_SEEN] = false;
                }
                userChats[chatIndex][FIREBASE_FIELDS.UPDATED_AT] = lastMessage[FIREBASE_FIELDS.CREATED_AT];
                await updateDoc(userChatRef, { [FIREBASE_FIELDS.CHATS]: userChats });
              }
            }
          }
        } catch (error) {
          console.error("Error updating lastMessage:", error);
        }
      });
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub && unsub());
    };
  }, [currentUser?.uid, chats]);

  // ✅ Select chat & mark as seen
  const handleSelect = async (chat) => {
    try {
   
      const userChats = chats.map((item) => {
        const { user, ...rest } = item;
        return rest;
      });

      // Find this chat
      const chatIndex = userChats.findIndex((item) => item[FIREBASE_FIELDS.CHAT_ID] === chat[FIREBASE_FIELDS.CHAT_ID]);

      if (chatIndex !== -1) {
        userChats[chatIndex][FIREBASE_FIELDS.IS_SEEN] = true; // mark seen
      }

      // Update Firestore
      const userChatsRef = doc(db, FIREBASE_COLLECTIONS.USER_CHATS, currentUser.uid);
      await updateDoc(userChatsRef, { [FIREBASE_FIELDS.CHATS]: userChats });

      // Switch to chat
      changeChat(chat[FIREBASE_FIELDS.CHAT_ID], chat.user);
    } catch (error) {
      console.error("Error selecting chat:", error);
    }
  };


  const filteredChats = chats.filter((chat) =>
    (chat.user?.username || "").toLowerCase().includes(input.toLowerCase())
  );
  const existingChatUserIds = chats.map((chat) => chat[FIREBASE_FIELDS.RECEIVER_ID]).filter(Boolean);

  const Icon = addMode ? FaMinus : FaPlus;

  return (
    <div className="chatList">
      {/* Search Bar */}
      <div className="search">
        <div className="searchBar">
          <FaSearch />
          <input type="text" placeholder="Search"  onChange={(e) => setInput(e.target.value)}/>
        </div>
        <Icon className="add" onClick={() => setAddMode((prev) => !prev)} />
      </div>

      {/* Chats */}
      {filteredChats.map((chat) => (
        <div
          className="items"
          key={chat[FIREBASE_FIELDS.CHAT_ID]}
          onClick={() => handleSelect(chat)}
          style={{ backgroundColor: chat?.[FIREBASE_FIELDS.IS_SEEN] ? "transparent" : "rgba(255, 255, 255, 0.08)" }}
        >
          <img src={chat.user?.[FIREBASE_FIELDS.BLOCKED]?.includes(currentUser.uid) ? "/avtar.png" : chat.user?.[FIREBASE_FIELDS.AVATAR] || "/avtar.png"} alt="avatar" />
          <div className="text">
            <span>{chat.user?.[FIREBASE_FIELDS.BLOCKED]?.includes(currentUser.uid) ? "Blocked User" : chat.user?.[FIREBASE_FIELDS.USERNAME] || "Unknown User" }</span>
            <p>{chat[FIREBASE_FIELDS.LAST_MESSAGE] || ""}</p>
          </div>
        </div>
      ))}

      {/* Add User Panel */}
      {addMode && (
        <AddUser
          onClose={() => setAddMode(false)}
          existingChatUserIds={existingChatUserIds}
        />
      )}
    </div>
  );
};

export default ChatList;
