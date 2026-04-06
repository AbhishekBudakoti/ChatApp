import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { db, FIREBASE_COLLECTIONS, FIREBASE_FIELDS } from "../../lib/firbase";
import { useUserStore } from "../../lib/userStore";
import ThemeToggle from "../themeToggle/themeToggle";
import "./profileSetup.css";

const ProfileSetup = () => {
  const [loading, setLoading] = useState(false);
  const { currentUser, fetchUserInfo } = useUserStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid) return;

    const formData = new FormData(e.target);
    const username = formData.get("username")?.toString().trim();
    const bio = formData.get("bio")?.toString().trim();

    if (!username || !bio) {
      toast.warning("Please enter username and bio");
      return;
    }

    try {
      setLoading(true);
      await updateDoc(doc(db, FIREBASE_COLLECTIONS.USERS, currentUser.uid), {
        [FIREBASE_FIELDS.USERNAME]: username,
        [FIREBASE_FIELDS.BIO]: bio,
      });
      await fetchUserInfo(currentUser.uid);
      toast.success("Profile updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-setup">
      <div className="profile-card">
        <div className="profile-top">
          <ThemeToggle />
        </div>
        <h2>Complete your profile</h2>
        <p>Add your username and bio to continue.</p>
        <form onSubmit={handleSubmit}>
          <input type="text" name="username" placeholder="Username" required />
          <textarea name="bio" placeholder="Your bio" rows="3" required />
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
