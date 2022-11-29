import React from "react";
import { PopupMessageProps } from "../../types/PropTypes";
import "./PopupMessage.css";

function PopupMessage(props: PopupMessageProps){
   
    return(
        <>
            <div className={`popup-message-container popup-message-${props.type}`}>
                <p>{props.message}</p>
            </div>
        </>
    )

}

export default PopupMessage;