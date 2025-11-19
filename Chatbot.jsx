import React, { useState } from "react"; 
import axios from "axios"; 
import "./Chatbot.css"; 

export default function Chatbot() { 
  const [messages, setMessages] = useState([]); 
  const [input, setInput] = useState(""); 

  const sendMessage = async () => { 
    if (!input) return; 
    const userMessage = { sender: "user", text: input }; 
    setMessages([...messages, userMessage]); 
    setInput(""); 
    const res = await axios.post("http://localhost:3001/api/chat", { 
      message: input, 
    }); 

 
    const botMessage = { sender: "bot", text: res.data.reply }; 
    setMessages((prev) => [...prev, botMessage]); 

  }; 

 
  return ( 
    <div className="chat-window"> 
      <div className="messages"> 
        {messages.map((m, idx) => ( 
          <p key={idx} className={m.sender}> 
            {m.text} 
          </p> 
        ))} 
      </div> 

 
      <div className="input-area"> 
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Ask MusiCare anything..." 
        /> 
        <button onClick={sendMessage}>Send</button> 
      </div> 
    </div> 
  ); 
} 