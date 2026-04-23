import "./chat.css";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { MdEmojiEmotions } from "react-icons/md";
import { useEffect, useState, useRef } from "react";
import { arrayUnion, doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { db, FIREBASE_COLLECTIONS, FIREBASE_FIELDS } from "../../lib/firbase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { toast } from "react-toastify";

const Chat = ({ onToggleDetail }) => {
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, resetChat } = useChatStore();

  const endRef = useRef(null);
  const emojiRef = useRef(null);
  const deleteConfirmRef = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.[FIREBASE_FIELDS.MESSAGES]]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!emojiRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen to chat updates
  useEffect(() => {
    if (!chatId) return;

    const unSub = onSnapshot(doc(db, FIREBASE_COLLECTIONS.CHATS, chatId), async (res) => {
      const chatData = res.data();
      setChat(chatData);

      // Update lastMessage in userChats when new messages arrive
      if (chatData?.[FIREBASE_FIELDS.MESSAGES] && chatData[FIREBASE_FIELDS.MESSAGES].length > 0) {
        const lastMessage =
          chatData[FIREBASE_FIELDS.MESSAGES][chatData[FIREBASE_FIELDS.MESSAGES].length - 1];
        const userIds = [currentUser?.uid, user?.uid].filter(Boolean);

        userIds.forEach(async (id) => {
          try {
            const userChatRef = doc(db, FIREBASE_COLLECTIONS.USER_CHATS, id);
            const userChatsSnapshot = await getDoc(userChatRef);

            const baseEntry = {
              [FIREBASE_FIELDS.CHAT_ID]: chatId,
              [FIREBASE_FIELDS.LAST_MESSAGE]: lastMessage[FIREBASE_FIELDS.TEXT],
              [FIREBASE_FIELDS.IS_SEEN]: id === currentUser?.uid,
              [FIREBASE_FIELDS.UPDATED_AT]: lastMessage[FIREBASE_FIELDS.CREATED_AT],
              [FIREBASE_FIELDS.RECEIVER_ID]: id === currentUser?.uid ? user?.uid : currentUser?.uid,
            };

            if (userChatsSnapshot.exists()) {
              const userChatData = userChatsSnapshot.data() || {};
              const chats = userChatData[FIREBASE_FIELDS.CHATS] || [];
              const chatIndex = chats.findIndex((c) => c[FIREBASE_FIELDS.CHAT_ID] === chatId);

              if (chatIndex !== -1) {
                chats[chatIndex] = {
                  ...chats[chatIndex],
                  ...baseEntry,
                };
              } else {
                chats.push(baseEntry);
              }

              await updateDoc(userChatRef, { [FIREBASE_FIELDS.CHATS]: chats });
            } else {
              // Create userChats document if it does not exist
              await setDoc(userChatRef, {
                [FIREBASE_FIELDS.CHATS]: [baseEntry],
              });
            }
          } catch (error) {
            console.error("Error updating lastMessage:", error);
          }
        });
      }
    });

    return () => unSub();
  }, [chatId, currentUser?.uid, user?.uid]);

  // Add emoji
  const handleEmoji = (emojiData) => {
    if (!emojiData?.emoji) return;
    setText((prev) => prev + emojiData.emoji);
  };

  // Send message
  const handleSend = async () => {
    if (text.trim() === "") {
      return;
    }

    if (!chatId || !currentUser?.uid || !user?.uid) {
      console.error("Cannot send message: missing chatId or user information");
      return;
    }

    try {
      // 1. Create/update messages in chats collection
      await setDoc(
        doc(db, FIREBASE_COLLECTIONS.CHATS, chatId),
        {
          [FIREBASE_FIELDS.MESSAGES]: arrayUnion({
            [FIREBASE_FIELDS.SENDER_ID]: currentUser.uid,
            [FIREBASE_FIELDS.TEXT]: text,
            [FIREBASE_FIELDS.CREATED_AT]: Date.now(),
          }),
        },
        { merge: true }
      );

      // 2. Update / create userChats for both users
      const userIds = [currentUser.uid, user.uid];

      userIds.forEach(async (id) => {
        const userChatRef = doc(db, FIREBASE_COLLECTIONS.USER_CHATS, id);
        const userChatsSnapshot = await getDoc(userChatRef);

        const baseEntry = {
          [FIREBASE_FIELDS.CHAT_ID]: chatId,
          [FIREBASE_FIELDS.LAST_MESSAGE]: text,
          [FIREBASE_FIELDS.IS_SEEN]: id === currentUser.uid,
          [FIREBASE_FIELDS.UPDATED_AT]: Date.now(),
          [FIREBASE_FIELDS.RECEIVER_ID]: id === currentUser.uid ? user.uid : currentUser.uid,
        };

        if (userChatsSnapshot.exists()) {
          const userChatData = userChatsSnapshot.data() || {};
          const chats = userChatData[FIREBASE_FIELDS.CHATS] || [];

          const chatIndex = chats.findIndex((c) => c[FIREBASE_FIELDS.CHAT_ID] === chatId);

          if (chatIndex !== -1) {
            // Update existing chat entry
            chats[chatIndex] = {
              ...chats[chatIndex],
              ...baseEntry,
            };
          } else {
            // Create new chat entry in existing userChats document
            chats.push(baseEntry);
          }

          await updateDoc(userChatRef, { [FIREBASE_FIELDS.CHATS]: chats });
        } else {
          // Create userChats document if it does not exist
          await setDoc(userChatRef, {
            [FIREBASE_FIELDS.CHATS]: [baseEntry],
          });
        }
      });

      setText(""); // clear input
      setOpen(false);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="chat">
      {/* Top Bar */}
      <div className="top" onClick={onToggleDetail} style={{ cursor: "pointer" }}>
        <div className="user">
          <img src={user?.avatar || "/avtar.png"} alt="avatar" />
          <div className="text">
            <span>{user?.username || "Unknown User"}</span>
            <p>{user?.bio || "No bio yet"}</p>
          </div>
        </div>
     
      </div>

      {/* Messages */}
      <div className="center">
        {chat?.[FIREBASE_FIELDS.MESSAGES]?.map((message) => (
          <div
            className={`message ${
              message[FIREBASE_FIELDS.SENDER_ID] === currentUser?.uid ? "own" : ""
            }`}
            key={message[FIREBASE_FIELDS.CREATED_AT]}
          >
            <div className="text">
              {message.img && <img src={message.img} alt="attachment" />}
              <p>{message[FIREBASE_FIELDS.TEXT]}</p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Bottom Input */}
      <div className="bottom">
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "You cannot type a message"
              : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji" ref={emojiRef}>
          <button
            type="button"
            className="emoji-button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Toggle emoji picker"
          >
            <MdEmojiEmotions />
          </button>
          {open && (
            <div className="picker">
              <EmojiPicker
                onEmojiClick={handleEmoji}
                theme={
                  document.body.getAttribute("data-theme") === "light"
                    ? Theme.LIGHT
                    : Theme.DARK
                }
                width={300}
                height={380}
              />
            </div>
          )}
        </div>
        <button
          className="send-button"
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
