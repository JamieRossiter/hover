import React, { CSSProperties } from "react";
import Profile from "../../subcomponents/Profile/Profile";
import {ChatMessageProfileProps} from "../../types/PropTypes";


function ChatMessageProfile(props: ChatMessageProfileProps) {

    return(
        <>
            <Profile role={props.role} name={props.username} profilePicSrc={props.profilePicSrc} />
        </>
    )

}

export default ChatMessageProfile;