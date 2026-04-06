import { useEffect, useState } from "react";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import "./themeToggle.css";

const ThemeToggle = ({ className = "" }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme === "dark" : true;
  });

  useEffect(() => {
    const theme = isDarkMode ? "dark" : "light";
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [isDarkMode]);

  return (
    <button
      type="button"
      className={`themeToggle ${className}`.trim()}
      onClick={() => setIsDarkMode((prev) => !prev)}
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? <MdLightMode /> : <MdDarkMode />}
    </button>
  );
};

export default ThemeToggle;
