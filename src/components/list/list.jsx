import ChatList from "./chatList/chatList";
import "./list.css"
import UserInfo from "./userInfo/userInfo.jsx";
const List = () => {
    return (
        <div className="list">
            <UserInfo />
            <ChatList />

        </div>
    )
}
export default List;