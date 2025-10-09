import React from 'react'
import { Link } from 'react-router-dom'
import '../styles.css'

const Identify = () => {
  return (
    <>
      <div className="login-page">
        <div className="welcome-message">
            <h1>Welcome to Musicare</h1>
            <p>Music curated for your mood and well-being</p>
        </div>
        <div className="playlist-card">
            <div className="playlist-cover"> 
                <div className="cover-gradient anxiety"></div>
            </div>
            <div className="playlist-info">
                <h1>Find your account</h1>
                <form style={{ display: "flex", flexDirection: "column" }}>
                    <label>
                        Enter your email address and we'll send you a link to reset your password.
                        <input 
                        type='email'
                        name='email'
                        className='input'
                        placeholder='Email'
                        required
                        />
                    </label>
                    {/* Send back to login for now */}
                    <Link to="/login" className='green-btn'>Send link</Link>
                </form>
            </div>
        </div>
      </div>
    </>
  )
}

export default Identify