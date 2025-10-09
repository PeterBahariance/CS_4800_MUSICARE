export function messagesDOM() {
    // Chat data for different conversations about music and mental health
    const chatData = {
        "dr-miller": {
            name: "Dr. Miller",
            role: "Psychiatrist",
            messages: [
                { text: "Hi there! I've been researching how music therapy can help with anxiety. Have you tried any specific techniques?", sender: "them", time: "10:30 AM" },
                { text: "Hi Dr. Miller. I've been listening to calming instrumental music when I feel anxious. It does seem to help slow my racing thoughts.", sender: "me", time: "10:32 AM" },
                { text: "That's excellent. Research shows that music with 60-80 beats per minute can synchronize with our heart rate and promote relaxation.", sender: "them", time: "10:35 AM" },
                { text: "Really? I didn't know that. Do you have any specific recommendations for genres or artists?", sender: "me", time: "10:37 AM" },
                { text: "Classical music, especially Baroque pieces, and ambient music are great starting points. I can send you some research papers if you're interested.", sender: "them", time: "10:40 AM" }
            ]
        },
        "dr-patil": {
            name: "Dr. Patil",
            role: "Therapist",
            messages: [
                { text: "Hello! Many of my patients find that creating playlists for different moods helps them regulate emotions. Have you tried this?", sender: "them", time: "Yesterday" },
                { text: "Yes, I have a 'calm' playlist and an 'energy' playlist. The calm one really helps when I'm feeling overwhelmed.", sender: "me", time: "Yesterday" },
                { text: "That's wonderful. Music can be a powerful emotional regulator. Some patients even create 'transition' playlists to help shift between emotional states.", sender: "them", time: "Yesterday" },
                { text: "A transition playlist is a great idea! Sometimes I need help moving from anxiety to calm, or from sadness to a more neutral state.", sender: "me", time: "Yesterday" },
                { text: "Exactly. The key is to gradually change the music's tempo and intensity. Start with songs that match your current mood, then slowly transition.", sender: "them", time: "Yesterday" }
            ]
        },
        "alex": {
            name: "Alex",
            role: "Friend",
            messages: [
                { text: "Hey! Remember that concert we went to last month? I still get chills thinking about how the music lifted my mood for days!", sender: "them", time: "2 hours ago" },
                { text: "I know exactly what you mean! That experience was magical. I've been chasing that high ever since.", sender: "me", time: "1 hour ago" },
                { text: "Right? There's something about live music that just resets your whole system. We should definitely go to more shows together.", sender: "them", time: "45 minutes ago" },
                { text: "Absolutely! I've been reading about how music releases dopamine - no wonder we feel so good at concerts.", sender: "me", time: "30 minutes ago" },
                { text: "Science confirms what we already knew! Music is medicine for the soul. What's been your go-to album lately?", sender: "them", time: "15 minutes ago" }
            ]
        },
        "sam": {
            name: "Sam",
            role: "Friend",
            messages: [
                { text: "Hey! I've been curating a 'calm' playlist for when I feel anxious. Want me to share it with you?", sender: "them", time: "3 days ago" },
                { text: "Yes, please! I've been meaning to update my relaxation playlist. What kind of music did you include?", sender: "me", time: "3 days ago" },
                { text: "Mostly ambient, some classical, and a few indie folk tracks with soothing vocals. I find lyrics can be distracting when I'm really anxious though.", sender: "them", time: "3 days ago" },
                { text: "I agree about lyrics. I've been listening to a lot of piano and guitar instrumentalists lately. They really help quiet my mind.", sender: "me", time: "3 days ago" },
                { text: "We should exchange playlists! I'm always looking for new music that helps with anxiety. It's amazing how personal musical preferences are for mood regulation.", sender: "them", time: "3 days ago" }
            ]
        }
    };

    // DOM elements
    const messageItems = document.querySelectorAll('.message-item');
    const chatContainer = document.getElementById('chatContainer');
    const chatTitle = document.getElementById('chatTitle');
    const chatSubtitle = document.getElementById('chatSubtitle');
    const chatMessages = document.getElementById('chatMessages');
    const closeChat = document.getElementById('closeChat');
    const overlay = document.getElementById('overlay');
    const messageInput = document.getElementById('messageInput');
    const sendMessage = document.getElementById('sendMessage');

    // Open chat when a message is clicked
    messageItems.forEach(item => {
        item.addEventListener('click', () => {
            const chatId = item.getAttribute('data-chat');
            openChat(chatId);
        });
    });

    // Close chat when X button is clicked
    closeChat.addEventListener('click', closeChatFunc);

    // Close chat when overlay is clicked
    overlay.addEventListener('click', closeChatFunc);

    // Function to open chat
    function openChat(chatId) {
        const chat = chatData[chatId];
        
        // Update chat title and subtitle
        chatTitle.textContent = chat.name;
        chatSubtitle.textContent = chat.role;
        
        // Clear previous messages
        chatMessages.innerHTML = '';
        
        // Add messages to chat
        chat.messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            messageElement.classList.add(msg.sender === 'me' ? 'sent' : 'received');
            
            messageElement.innerHTML = `
                <div>${msg.text}</div>
                <div class="message-time">${msg.time}</div>
            `;
            
            chatMessages.appendChild(messageElement);
        });
        
        // Scroll to bottom of chat
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Show chat and overlay
        chatContainer.classList.add('active');
        overlay.classList.add('active');
        
        // Focus on input
        messageInput.focus();
    }

    // Function to close chat
    function closeChatFunc() {
        chatContainer.classList.remove('active');
        overlay.classList.remove('active');
        messageInput.value = '';
    }

    // Send message function (kept for UI consistency but messages won't be stored)
    sendMessage.addEventListener('click', () => {
        const messageText = messageInput.value.trim();
        if (messageText) {
            // Create temporary message (won't be saved to chat data)
            const messageElement = document.createElement('div');
            messageElement.classList.add('message', 'sent');
            messageElement.innerHTML = `
                <div>${messageText}</div>
                <div class="message-time">Just now</div>
            `;
            chatMessages.appendChild(messageElement);
            messageInput.value = '';
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    });

    // Send message when Enter key is pressed
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage.click();
        }
    });
}