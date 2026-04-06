import React, { useEffect, useState } from "react";
import List from "./components/list/list";
import Chat from "./components/chat/chat";
import Detail from "./components/detail/detail";
import Login from "./components/login/login";
import ProfileSetup from "./components/profileSetup/profileSetup";
import Notification from "./components/notification/notification";
import { onAuthStateChanged } from "firebase/auth";
import { useUserStore } from "./lib/userStore";
import { useChatStore } from "./lib/chatStore";
import { auth } from "./lib/firbase";

export const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid);
    });
    return () => unSub();
  }, [fetchUserInfo]);

  useEffect(() => {
    setShowDetail(false);
  }, [chatId]);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  const needsProfileSetup =
    currentUser &&
    (!currentUser?.username?.trim?.() || !currentUser?.bio?.trim?.());

  return (
    <div className="container">
      {currentUser ? (
        needsProfileSetup ? (
          <ProfileSetup />
        ) : (
          <>
            <List />
            {chatId && (
              <>
                <Chat onToggleDetail={() => setShowDetail((prev) => !prev)} />
                {showDetail && <Detail />}
              </>
            )}
          </>
        )
      ) : (
        <Login />
      )}
      <Notification />
    </div>
  );
};
