import React, { useState } from 'react'
import SidebarNav from '../components/SidebarNav';
import UserBar from '../components/UserBar';

const Feed = () => {
    const [displayPostForm, setDisplayPostForm] = useState(false);

    return (
        <>
            <SidebarNav />
            <div className="main-content">
                <UserBar />
                <div className="playlists-grid" style={{ display: "grid", gridTemplateColumns: "auto auto" }}>
                    <div className="title" style={{ gridColumn: "span 2" }}>
                        <h2>Feed</h2>
                    </div>

                    {/* Initial "make a post" box */}
                    {!displayPostForm && (
                        <div className="playlist-card post-box" onClick={() => setDisplayPostForm(true)}>
                            <div style={{ fontSize: "50px" }}>➕</div>
                            <div>
                                <p style={{ textAlign: "center" }}><b>Create a post</b></p>
                            </div>
                        </div>
                    )}

                    {/* make a post form */}
                    {displayPostForm && (
                        <form style={{ gridColumn: "span 2" }} className="post-form">
                            <div className="playlist-card" style={{ display: "flex", flexDirection: "column", width: "550px", padding: "10px" }}>
                                {/*  upload image */}
                                <label>
                                    What song/album do you want to share?
                                    <input 
                                    type='file'
                                    name='postImage'
                                    className='input'
                                    style={{ margin: "5px" }}
                                    />
                                </label>

                                {/*  post text area */}
                                <label>
                                    How has music helped you today?
                                    <input 
                                    type='text'
                                    name='postText'
                                    className='input'
                                    placeholder='I feel happy when I listen to...'
                                    style={{ height: "100px", width: "90%", margin: "5px" }}
                                    required
                                    />
                                </label>
                                
                                {/*  post btn */}
                                <button 
                                    className="green-btn" 
                                    style={{ alignSelf: "center", marginTop: "10px" }} 
                                    type="submit">
                                    Post
                                </button>
                                <button 
                                    className="green-btn" 
                                    style={{ alignSelf: "center", marginTop: "10px" }} 
                                    type="button" 
                                    onClick={() => setDisplayPostForm(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                    

                    {/*  mock feed */}
                    <div className="playlist-card" style={{ padding: "5px", width: "270px" }}>
                        <div className="postHeader" style={{ display: "flex", flexDirection: "row" }}>
                            <div className="profilePic"></div>
                            <div style={{ margin: "auto", marginLeft: "0" }}>
                                <p><b>Dr. Ken</b></p>
                            </div>
                        </div>
                        {/*  album cover */}
                        <div className="post-album-cover">
                        </div>
                        <div className="postFooter">
                            <span>❤️ 32</span>
                            <span>💬 4</span>
                            <span>🔗 2</span>
                        </div>
                    </div>
                    <div className="playlist-card" style={{ padding: "5px", width: "270px" }}>
                        <div className="postHeader" style={{ display: "flex", flexDirection: "row" }}>
                            <div className="profilePic" style={{ height: "25px", width: "25px" }}></div>
                            <div style={{ margin: "auto", marginLeft: "0" }}>
                                <p><b>Emily</b></p>
                            </div>
                        </div>
                        {/*  album cover */}
                        <div className="post-album-cover">
                        </div>
                        <div className="postFooter">
                            <span>❤️ 32</span>
                            <span>💬 4</span>
                            <span>🔗 2</span>
                        </div>
                    </div>
                    <div className="playlist-card" style={{ padding: "5px", width: "270px" }}>
                        <div className="postHeader" style={{ display: "flex", flexDirection: "row" }}>
                            <div className="profilePic" style={{ height: "25px", width: "25px" }}></div>
                            <div style={{ margin: "auto", marginLeft: "0" }}>
                                <p><b>hello123</b></p>
                            </div>
                        </div>
                        {/*  album cover */}
                        <div className="post-album-cover">
                        </div>
                        <div className="postFooter">
                            <span>❤️ 32</span>
                            <span>💬 4</span>
                            <span>🔗 2</span>
                        </div>
                    </div>
                    <div className="playlist-card" style={{ padding: "5px", width: "270px" }}>
                        <div className="postHeader" style={{ display: "flex", flexDirection: "row" }}>
                            <div className="profilePic" style={{ height: "25px", width: "25px" }}></div>
                            <div style={{ margin: "auto", marginLeft: "0" }}>
                                <p><b>karenn1</b></p>
                            </div>
                        </div>
                        {/*  album cover */}
                        <div className="post-album-cover">
                        </div>
                        <div className="postFooter">
                            <span>❤️ 32</span>
                            <span>💬 4</span>
                            <span>🔗 2</span>
                        </div>
                    </div>
                    <div className="playlist-card" style={{ padding: "5px", width: "270px" }}>
                        <div className="postHeader" style={{ display: "flex", flexDirection: "row" }}>
                            <div className="profilePic" style={{ height: "25px", width: "25px" }}></div>
                            <div style={{ margin: "auto", marginLeft: "0" }}>
                                <p><b>aAron64</b></p>
                            </div>
                        </div>
                        {/*  album cover */}
                        <div className="post-album-cover">
                        </div>
                        <div className="postFooter">
                            <span>❤️ 32</span>
                            <span>💬 4</span>
                            <span>🔗 2</span>
                        </div>
                    </div>
                    <div className="playlist-card" style={{ padding: "5px", width: "270px" }}>
                        <div className="postHeader" style={{ display: "flex", flexDirection: "row" }}>
                            <div className="profilePic" style={{ height: "25px", width: "25px" }}></div>
                            <div style={{ margin: "auto", marginLeft: "0" }}>
                                <p><b>bob123</b></p>
                            </div>
                        </div>
                        {/*  album cover */}
                        <div className="post-album-cover">
                        </div>
                        <div className="postFooter">
                            <span>❤️ 32</span>
                            <span>💬 4</span>
                            <span>🔗 2</span>
                        </div>
                    </div>
                    <div className="playlist-card" style={{ padding: "5px", width: "270px" }}>
                        <div className="postHeader" style={{ display: "flex", flexDirection: "row" }}>
                            <div className="profilePic" style={{ height: "25px", width: "25px" }}></div>
                            <div style={{ margin: "auto", marginLeft: "0" }}>
                                <p><b>Dr. Sophie</b></p>
                            </div>
                        </div>
                        {/*  album cover */}
                        <div className="post-album-cover">
                        </div>
                        <div className="postFooter">
                            <span>❤️ 32</span>
                            <span>💬 4</span>
                            <span>🔗 2</span>
                        </div>
                    </div>
                    <div className="playlist-card" style={{ padding: "5px", width: "270px" }}>
                        <div className="postHeader" style={{ display: "flex", flexDirection: "row" }}>
                            <div className="profilePic" style={{ height: "25px", width: "25px" }}></div>
                            <div style={{ margin: "auto", marginLeft: "0" }}>
                                <p><b>Dr. Wendy</b></p>
                            </div>
                        </div>
                        {/*  album cover */}
                        <div className="post-album-cover">
                        </div>
                        <div className="postFooter">
                            <span>❤️ 32</span>
                            <span>💬 4</span>
                            <span>🔗 2</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Feed