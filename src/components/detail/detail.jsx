import "./detail.css";
import { db, FIREBASE_COLLECTIONS, FIREBASE_FIELDS } from "../../lib/firbase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";


import { 
    doc, 
    updateDoc, 
    arrayRemove, 
    arrayUnion,
    deleteDoc,
    getDoc
} from "firebase/firestore";

const Detail = () => {

    const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock, resetChat } = useChatStore();

    const { currentUser, fetchUserInfo } = useUserStore();

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
        if (!chatId || !user || !currentUser) return;
        

        try {
            // Delete the chat document
            const chatRef = doc(db, FIREBASE_COLLECTIONS.CHATS, chatId);
            await deleteDoc(chatRef);

            // Remove chat from current user's USER_CHATS
            const currentUserChatsRef = doc(db, FIREBASE_COLLECTIONS.USER_CHATS, currentUser.uid);
            const currentUserChatsSnap = await getDoc(currentUserChatsRef);
            
            if (currentUserChatsSnap.exists()) {
                const userChats = currentUserChatsSnap.data()[FIREBASE_FIELDS.CHATS] || [];
                const filteredChats = userChats.filter(
                    (chat) => chat[FIREBASE_FIELDS.CHAT_ID] !== chatId
                );
                await updateDoc(currentUserChatsRef, {
                    [FIREBASE_FIELDS.CHATS]: filteredChats
                });
            }

            // Remove chat from other user's USER_CHATS
            const otherUserChatsRef = doc(db, FIREBASE_COLLECTIONS.USER_CHATS, user.uid);
            const otherUserChatsSnap = await getDoc(otherUserChatsRef);
            
            if (otherUserChatsSnap.exists()) {
                const userChats = otherUserChatsSnap.data()[FIREBASE_FIELDS.CHATS] || [];
                const filteredChats = userChats.filter(
                    (chat) => chat[FIREBASE_FIELDS.CHAT_ID] !== chatId
                );
                await updateDoc(otherUserChatsRef, {
                    [FIREBASE_FIELDS.CHATS]: filteredChats
                });
            }

            // Close the chat page by resetting the chat state
            resetChat();
        } catch (err) {
            console.error("Error deleting chat:", err);
        }
    };

    return (
        <div className="detail">
            <div className="user">

                <img src={user?.[FIREBASE_FIELDS.AVATAR] || "./avtar.png"} alt="" />
                <h2>{user?.[FIREBASE_FIELDS.USERNAME]}</h2>
              
           
                <p>Lorem ipsum dolor sit amet ectetur adipisicing elit.</p>
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
                    onClick={handleBlock}
                    disabled={isCurrentUserBlocked || !user}
                >
                    {isCurrentUserBlocked ? "you are blocked" :isReceiverBlocked ? "User blocked" 
                    :"Block User"}
                </button>
                <button onClick={handleDeleteChat}>
                 Delete Chat
                </button>
               
            </div>
        </div>
    );
};

export default Detail;
