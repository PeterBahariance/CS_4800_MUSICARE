async function sendChat() {
    const inputBox = document.getElementById("chat-input");
    const messages = document.getElementById("chat-messages");

    const userMsg = inputBox.value.trim();
    if (!userMsg) return;

    // Display user message
    messages.innerHTML += `<p><b>You:</b> ${userMsg}</p>`;
    inputBox.value = "";
    messages.scrollTop = messages.scrollHeight;

    // Send message to backend (your Node.js server)
    const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
    });

    const data = await response.json();
    const reply = data.reply;

    messages.innerHTML += `<p><b>AI:</b> ${reply}</p>`;
    messages.scrollTop = messages.scrollHeight;
}

