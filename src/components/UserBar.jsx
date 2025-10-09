import React, { useState } from 'react'
import { Link } from "react-router-dom";

import Notifications from './Notifications';

const UserBar = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    
    const toggleNotifications = () => {
        setShowNotifications((prev) => !prev);
    };

    return (
        
        <div>
            <div className="user-bar">
                <Link to='/' className='green-btn'>Home</Link>
                <button className="green-btn" onClick={toggleNotifications}><a>Notifications</a></button>
                {showNotifications && <Notifications />}
                <Link to='/feed' className='green-btn'>Feed</Link>
                <Link to='/messages' className='green-btn'>Messages</Link>
                <Link to='/login' className='green-btn'>Logout</Link>
            </div>
        </div>
    )
}

export default UserBar