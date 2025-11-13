import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// UPDATED URL (Render Link)
const ENDPOINT = 'https://mern-chat-app-gark.onrender.com';
const socket = io(ENDPOINT);

function Chat() {
    const [room, setRoom] = useState("");
    const [message, setMessage] = useState("");
    const [messageList, setMessageList] = useState([]);
    const [joinedRoom, setJoinedRoom] = useState(false);
    const [typingUser, setTypingUser] = useState("");
    const [file, setFile] = useState(null);

    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');

    const navigate = useNavigate();
    const chatBodyRef = useRef(null);
    let typingTimeout = null;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
    };

    const joinRoom = async () => {
        if (username && room !== "") {
            socket.emit('join_room', room);
            setJoinedRoom(true);

            try {
                // UPDATED AXIOS CALL
                const res = await axios.get(`${ENDPOINT}/api/messages/${room}`, {
                    headers: { 'x-auth-token': token }
                });
                setMessageList(res.data);
            } catch (error) {
                console.error("Error fetching messages", error);
                if (error.response && error.response.status === 401) handleLogout();
            }
        }
    };

    const selectFile = (e) => {
        setMessage(e.target.files[0].name);
        setFile(e.target.files[0]);
    };

    const sendMessage = async () => {
        if (message !== "" || file) {
            let imageBase64 = null;
            if (file) {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = async () => {
                    imageBase64 = reader.result;
                    await emitMessage(imageBase64);
                };
            } else {
                await emitMessage(null);
            }
        }
    };

    const emitMessage = async (imageBase64) => {
        const messageData = {
            room: room,
            author: username,
            message: file ? "" : message,
            image: imageBase64,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        await socket.emit('send_message', messageData);
        setMessage("");
        setFile(null);
        socket.emit('stop_typing', { room });
    };

    const handleInput = (e) => {
        setMessage(e.target.value);
        socket.emit('typing', { room, username });
        if (typingTimeout) clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => { socket.emit('stop_typing', { room }); }, 2000);
    };

    useEffect(() => {
        if (!token) navigate('/login');

        const messageListener = (data) => {
            setMessageList((list) => [...list, data]);
            if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        };

        socket.on('display_typing', (user) => setTypingUser(`${user} is typing...`));
        socket.on('hide_typing', () => setTypingUser(""));
        socket.on('receive_message', messageListener);

        return () => {
            socket.off('receive_message', messageListener);
            socket.off('display_typing');
            socket.off('hide_typing');
        };
    }, [token, navigate]);

    useEffect(() => {
        if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }, [messageList]);

    return (
        <div className="App">
            <button onClick={handleLogout} className="logout-button">Logout</button>
            {!joinedRoom ? (
                <div className="joinChatContainer">
                    <h3>Join Chat Room</h3>
                    <p>Logged in as: <strong>{username}</strong></p>
                    <input type="text" placeholder="Enter Room ID..." onChange={(e) => setRoom(e.target.value)} />
                    <button onClick={joinRoom}>Join Room</button>
                </div>
            ) : (
                <div className="chat-window">
                    <div className="chat-header"><p>Live Chat 🟢 {room}</p></div>
                    <div className="chat-body" ref={chatBodyRef}>
                        {messageList.map((msg, index) => (
                            <div key={index} className="message" id={username === msg.author ? "you" : "other"}>
                                <div>
                                    <div className="message-content">
                                        {msg.image && <img src={msg.image} alt="sent" style={{ maxWidth: "150px", borderRadius: "10px" }} />}
                                        {msg.message && <p>{msg.message}</p>}
                                    </div>
                                    <div className="message-meta">
                                        <p id="time">{msg.time}</p>
                                        <p id="author">{msg.author}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="typing-area">{typingUser && <p><em>{typingUser}</em></p>}</div>

                    <div className="chat-footer">
                        <label htmlFor="file-upload" style={{ cursor: "pointer", fontSize: "20px", marginRight: "10px" }}>
                            📎
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={selectFile}
                        />
                        <input
                            type="text"
                            value={message}
                            placeholder="Type a message..."
                            onChange={handleInput}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button onClick={sendMessage}>&#9658;</button>
                    </div>
                </div>
            )}
        </div>
    );
}
export default Chat;