import './App.css'
import './index.css'
import './styles.css'
import { Router, Routes, Route, useNavigate } from "react-router-dom";
import { useState } from "react";

// import Footer from "./components/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Feed from './pages/Feed';
import Messages from './pages/Messages';
import Identify from './pages/Identify';
import SignUp from './pages/SignUp';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate('/')
  };

  return (
    <>
      {isLoggedIn ? (
          // Protected pages (requires login)
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
          </Routes>
      ) : (
        // Public pages (no login required)
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/identify" element={<Identify />} />
          {/* redirect anything else to login */}
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>

      )}
    </>
  );
}

export default App;
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/identify" element={<Identify />} />
            <Route path="/signup" element={<SignUp />} />
        </Routes>