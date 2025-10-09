import React from 'react'
import { Link } from 'react-router-dom'
import { useState } from 'react'

const SignUp = () => {
    const [isChecked, setIsChecked] = useState(false);

    const handleCheckboxChange = (event) => {
        setIsChecked(event.target.checked);
    };

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
                    <h1>Sign up</h1>
                    <form style={{ display: "flex", flexDirection: "column" }}>
                        <label>
                            Name
                            <input 
                            type='text'
                            name='name'
                            className='input'
                            placeholder='John'
                            required
                            />
                        </label>
                        <label>
                            Email
                            <input
                            type='email'
                            name='email'
                            className='input'
                            placeholder='john@gmail.com'
                            required
                            />
                        </label>
                        <label>
                            Passsword
                            <input
                            type='password'
                            name='password'
                            className='input'
                            placeholder='Password'
                            required
                            />
                        </label>
                        <label>
                            Confirm passsword
                            <input
                            type='password'
                            name='password'
                            className='input'
                            placeholder='Password'
                            required
                            />
                        </label>
                        
                        <label htmlFor="healthcarePro">
                            <input id="healthcarePro" type="checkbox" checked={isChecked} onChange={handleCheckboxChange}/>
                            I am a healthcare professional
                        </label>
                        {/* hidden verification div that appears when checkbox is checked */}                   
                        { isChecked ? 
                            <div id="getVerification" className="verificationDiv">
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <select name="" id="">
                                        <option value="select">Select professional title</option>
                                        <option value="doctor">Doctor</option>
                                        <option value="therapist">Therapist</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <select name="" id="">
                                        <option value="select">Select organization</option>
                                        <option value="hospital">Hospital</option>
                                        <option value="clinic">Clinic</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <label htmlFor="licenseNumber">
                                        License number
                                        <input type="text" name="licenseNumber" id="licenseNumber"/>
                                    </label>
                                    
                                    <span>Upload verification documents</span>  
                                    <input type="file" id="myFile" name="filename" />
                            
                                </div>
                            </div>
                        : "" }

                        <label>
                            <input type="checkbox" required />
                            I agree to the Terms and Conditions and Privacy Policy
                        </label>
                        <button className="green-btn" href="/" type="submit">Sign up</button>
                    </form>
                    <div>
                        <span>Already have an account?</span>
                        <Link to="/login" className='link-btn'>Login</Link>
                    </div>
                </div>
            </div>
        </div>
    </>
  )
}

export default SignUp