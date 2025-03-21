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
      const response = await axios.post('http://localhost:3000/check-user', { username, password });
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
    <div className="w-screen h-screen flex justify-center items-center bg-gradient-to-br from-purple-100 via-pink-300 to-purple-300 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/flower-pattern.png')] bg-repeat opacity-20"></div>
      <div className="w-[360px] h-[345px] bg-gradient-to-br from-pink-100 via-pink-100 to-pink-300 p-6 rounded-2xl shadow-lg border-4 border-pink-500 flex flex-col items-center relative">
        <h1 className="text-4xl text-pink-800 text-center font-serif font-extrabold mb-5">Login 🎀</h1>

        {showError && (
          <div className="bg-red-200 text-pink-500 p-2 rounded-lg font-medium w-full text-center mb-3">
            Invalid username or password
          </div>
        )}

        <input
          type="text"
          placeholder="Username"
          className="w-full px-4 py-2 border border-pink-400 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400 bg-pink-50 text-pink-700"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        /><br />

        <input
          type="password"
          placeholder="Password"
          className="w-full px-4 py-2 border border-pink-400 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400 bg-pink-50 text-pink-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /><br />

        <button
          className="w-full mt-3 px-4 py-2 bg-pink-600 text-white font-bold rounded-md hover:bg-pink-500 transition duration-200 shadow-md"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default Login;
