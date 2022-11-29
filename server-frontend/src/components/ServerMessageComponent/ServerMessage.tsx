import React from "react";
import { ServerMessageProps } from "../../types/PropTypes";
import "./ServerMessage.css";

function ServerMessage(props: ServerMessageProps){

    return(
        <>
            <p className="server-message-text">{props.message}</p>
        </>
    )
}

export default ServerMessage;