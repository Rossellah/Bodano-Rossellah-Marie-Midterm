import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";



function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_ENDPOINT_URL}/check-user`, { username, password });
      if (response.data.exist) {
        setShowError(false);
        navigate("/todo");
      } else {
        setShowError(true);
      }
    } catch (error) {
      console.error("Login error:", error);
      setShowError(true);
    }
  };

  return (
    <div
      className="w-screen h-screen flex justify-center items-center bg-gradient-to-br from-pink-100 via-pink-300 to-purple-600 relative overflow-hidden"
      style={{ fontFamily: "'Dancing Script', cursive" }}  
    >
      <div className="absolute inset-0 bg-[url('/sparkle-overlay.png')] bg-repeat opacity-10 pointer-events-none mix-blend-lighten"></div>

      <div className="w-[380px] max-w-[90%] h-[400px] backdrop-blur-lg bg-white/60 border-4 border-pink-500 p-6 rounded-2xl shadow-2xl flex flex-col items-center relative transform hover:scale-105 transition-all duration-300 ease-in-out">
        <h1
          className="text-5xl text-pink-800 text-center mb-6 font-extrabold italic tracking-tight"
          style={{
            fontFamily: "'Playfair Display', serif", 
            fontWeight: '900',  
            letterSpacing: '0.05em', 
          }}
        >
          Login
        </h1>

        <div className="h-10 w-full mb-4">
          {showError && (
            <div className="bg-white/80 text-red-500 border border-red-300 text-sm font-medium rounded-lg py-2 px-4 text-center shadow-lg">
              Invalid username or password
            </div>
          )}
        </div>

        <input
          type="text"
          placeholder="Username"
          className="w-full px-5 py-3 bg-white/90 border border-pink-300 rounded-xl text-pink-800 placeholder-pink-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-400 text-xl transition duration-200 mb-4 transform hover:scale-105"
          style={{ fontFamily: "'Arial', sans-serif" }} 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full px-5 py-3 bg-white/90 border border-pink-300 rounded-xl text-pink-800 placeholder-pink-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-400 text-xl transition duration-200 mb-6 transform hover:scale-105"
          style={{ fontFamily: "'Arial', sans-serif" }} 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full py-3 bg-gradient-to-r from-pink-500 via-pink-400 to-purple-500 text-white text-lg font-medium tracking-wide rounded-xl transform hover:scale-110 transition-all duration-300 shadow-2xl"
          style={{
            fontFamily: "'Montserrat', sans-serif", 
            fontWeight: '500', 
            textTransform: 'uppercase', 
            letterSpacing: '1px', 
          }}
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default Login;
