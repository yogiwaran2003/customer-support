import React from "react";
import { ChatProvider } from "./context/ChatContext";
import ChatWindow from "./components/ChatWindow";
import "./App.css";

function App() {
  return (
    <div className="App">
      <ChatProvider>
        <ChatWindow />
      </ChatProvider>
    </div>
  );
}

export default App;
