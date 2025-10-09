import React from 'react'
import '../styles.css'
import { Link } from "react-router-dom";


const Login = ({ onLogin }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(); // this updates isLoggedIn in App.jsx

        // Normally you'd check username/password here (API call, etc.)
        /*
        if (username === "admin" && password === "1234") {
            onLogin(); // this updates isLoggedIn in App.jsx
        } else {
            alert("Invalid credentials");
        }*/
    }

    return (
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
                    <h1>Login</h1>
                    <form onSubmit={handleSubmit}>
                        <label>
                            Email
                            <input
                            style={{ height: "25px" }}
                            type='email'
                            name='email'
                            className='input'
                            placeholder='Email'
                            required
                            />
                        </label>
                        <label>
                            Password
                            <input 
                            style={{ height: "25px" }}
                            type='password'
                            name='passsword'
                            className='input'
                            placeholder='Password'
                            required
                            />
                        </label>
                        <button className="green-btn" type="submit">Login</button>

                    </form>
                    <div>
                        <Link to="/identify" className="link-btn">Forgot password?</Link>
                    </div>
                    <br />
                    <hr />
                    <div>
                        <Link to="/signup" className="green-btn">Create new account</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login