import "./userInfo.css"
import { useUserStore } from "../../../lib/userStore";
import { auth } from "../../../lib/firbase";
import { DEFAULT_AVATAR } from "../../../lib/assets";
import { IoIosLogOut } from "react-icons/io";
import { signOut } from "firebase/auth";
import ThemeToggle from "../../themeToggle/themeToggle";

const UserInfo = () => {
  const { currentUser } = useUserStore();

  return (
    <div className="userInfo">
      <div className="left">
        <img src={currentUser?.avatar || DEFAULT_AVATAR} alt="avatar" />
        <h2>{currentUser?.username}</h2>
      </div>

      <div className="actions">
        <ThemeToggle />
        <button className="logout" onClick={() => signOut(auth)}>
          <IoIosLogOut />
        </button>
      </div>
    </div>

  )

}
export default UserInfo;