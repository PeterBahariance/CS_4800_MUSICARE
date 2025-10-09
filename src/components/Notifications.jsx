import React from 'react'
import "../styles.css"

const Notifications = () => {
    return (
        <div className="playlists-grid notifications">
            <div className="title">
                <h2>Notifications</h2>
            </div>
            <div className="playlist-card" style={{ padding: "5px" }}>
                <h3><em>@hello123</em> liked what <em>@bob12</em> is listening to: <i><a href="http://">Weightless</a> by Macaroni Union</i></h3>
            </div>
            <div className="playlist-card" style={{ padding: "5px" }}>
                <h3><em>@bob12</em> is listening to <a href="http://">Weightless</a> by Macaroni Union</h3>
            </div>
            <div className="playlist-card" style={{ padding: "5px" }}>
                <h3><em>@bob12</em> left a comment on <em>@itsmemario</em>'s post: <i>"cool song!!"</i></h3>
            </div>
            <div className="playlist-card" style={{ padding: "5px" }}>
                <h3><em>@daisylolz</em> added <a href="http://">Moonlight Sonata</a> by Ludwig van Beethoven to playlist</h3>
            </div>
            <div className="playlist-card" style={{ padding: "5px" }}>
                <h3><em>@karen4412</em> is listening to <a href="http://">River</a> by Macaroni Union</h3>
            </div>
            <div className="playlist-card" style={{ padding: "5px" }}>
                <h3><em>@luigi101</em> has been listening for 2 hours. Go say hi!</h3>
            </div>
        </div>
    )
}

export default Notifications