import { create } from 'zustand'
import { doc, getDoc } from 'firebase/firestore'
import { db, FIREBASE_FIELDS } from './firbase'
import { useUserStore } from './userStore'

export const useChatStore = create((set) => ({
  chatId: null,
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,
  changeChat:(chatId,user)=>{
    const currentUser = useUserStore.getState().currentUser

    // CHECK IF THE USER IS BLOCKED
    if (user?.[FIREBASE_FIELDS.BLOCKED]?.includes(currentUser?.uid)) {
      
        return set( {
            chatId,
            user: null,
            isCurrentUserBlocked: true,
            isReceiverBlocked: false,})
    }
     // CHECK IF THE RECIEVER IS BLOCKED
     else if (currentUser?.[FIREBASE_FIELDS.BLOCKED]?.includes(user?.uid)) {
        return set( {
            chatId,
            user: user,
            isCurrentUserBlocked: false,
            isReceiverBlocked: true,})
    }
    else {return set({ chatId, user, isCurrentUserBlocked: false, isReceiverBlocked: false 

    })
}
  },

  changeBlock:()=>{set((state)=>({...state,isReceiverBlocked:!state.isReceiverBlocked}));
},

  resetChat:()=>{
    set({
      chatId: null,
      user: null,
      isCurrentUserBlocked: false,
      isReceiverBlocked: false
    });
  },

}))