import React, { CSSProperties } from "react";
import "./Profile.css";

type ProfileProps =  {
    name: string,
    profilePicSrc: string,
    role: "receiver" | "sender"
}

function Profile(props: ProfileProps) {

    return(
        <>
            <div className="profile-super-container">
                <div className={`profile-container-${props.role}`}>
                    <img className="profile-image" src={props.profilePicSrc} alt="Profile" />
                    <p className={`profile-name-${props.role}`}>{props.name}</p>
                </div>
            </div>
        </>
    )

}

export default Profile;

