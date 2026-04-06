import "./detail.css";
import { db, FIREBASE_COLLECTIONS, FIREBASE_FIELDS } from "../../lib/firbase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { toast } from "react-toastify";
import { useRef } from "react";


import { 
    doc, 
    getDoc,
    updateDoc, 
    arrayRemove, 
    arrayUnion
} from "firebase/firestore";

const Detail = () => {

    const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock, resetChat } = useChatStore();

    const { currentUser, fetchUserInfo } = useUserStore();
    const deleteConfirmRef = useRef(false);

    const handleBlock = async () => {
        if (!user || !currentUser || isCurrentUserBlocked) return;

        const userRef = doc(db, FIREBASE_COLLECTIONS.USERS, currentUser.uid);

        try {
            await updateDoc(userRef, {
                [FIREBASE_FIELDS.BLOCKED]: isReceiverBlocked
                    ? arrayRemove(user.uid)
                    : arrayUnion(user.uid)
            });

            changeBlock();
            // Refresh currentUser to update the blocked array
            await fetchUserInfo(currentUser.uid);
        } catch (err) {
            console.log(err);
        }
    };

    const handleDeleteChat = async () => {
        if (!chatId || !currentUser) return;

        if (!deleteConfirmRef.current) {
            deleteConfirmRef.current = true;
            toast.warn("Press Delete Chat again to confirm", { autoClose: 2200 });
            setTimeout(() => {
                deleteConfirmRef.current = false;
            }, 2300);
            return;
        }

        try {
            const currentUserChatsRef = doc(db, FIREBASE_COLLECTIONS.USER_CHATS, currentUser.uid);
            const currentUserChatsSnap = await getDoc(currentUserChatsRef);

            if (currentUserChatsSnap.exists()) {
                const userChats = currentUserChatsSnap.data()?.[FIREBASE_FIELDS.CHATS] || [];
                const filteredChats = userChats.filter((item) => item[FIREBASE_FIELDS.CHAT_ID] !== chatId);
                await updateDoc(currentUserChatsRef, {
                    [FIREBASE_FIELDS.CHATS]: filteredChats,
                });
            }

            resetChat();
            toast.success("Chat removed from your list");
        } catch (err) {
            console.error("Error removing chat:", err);
            toast.error("Failed to remove chat");
        } finally {
            deleteConfirmRef.current = false;
        }
    };

    return (
        <div className="detail">
            <div className="user">

                <img src={user?.[FIREBASE_FIELDS.AVATAR] || "./avtar.png"} alt="" />
                <h2>{user?.[FIREBASE_FIELDS.USERNAME]}</h2>
              
           
                <p>{user?.[FIREBASE_FIELDS.BIO] || "No bio yet"}</p>
            </div>
           

            <div className="info">
                <div className="options">
                    <div className="title">
                        <span>Chat Settings</span>
                    </div>
                </div>

                <div className="options">
                    <div className="title">
                        <span>Privacy & Help</span>
                    </div>
                </div>

                <div className="options">
                    <div className="title">
                        <span>Shared Photos</span>
                    </div>

                    <div className="photos">
                        <div className="photoItem">
                            <div className="photoDetail">
                                <img src="./avatar.png" alt="" />
                                <span>photo_2024_2.png</span>
                            </div>

                            <img src="./download.png" alt="download" />
                        </div>
                    </div>
                </div>

                <div className="options">
                    <div className="title">
                        <span></span>
                    </div>
                </div>

                <div className="options">
                    <div className="title">
                        <span>Shared Files</span>
                    </div>
                </div>

                <button
                    className="block-btn"
                    onClick={handleBlock}
                    disabled={isCurrentUserBlocked || !user}
                >
                    {isCurrentUserBlocked ? "you are blocked" :isReceiverBlocked ? "User blocked" 
                    :"Block User"}
                </button>
                <button
                    className="delete-btn"
                    onClick={handleDeleteChat}
                    disabled={!chatId}
                >
                    Delete Chat
                </button>
               
            </div>
        </div>
    );
};

export default Detail;
