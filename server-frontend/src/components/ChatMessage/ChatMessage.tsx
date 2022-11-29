import React from "react";
import ChatMessageProfile from "../../components/ChatMessageProfile/ChatMessageProfile";
import ChatMessageContent from "../../subcomponents/ChatMessageContent/ChatMessageContent";
import Timestamp from "../../subcomponents/Timestamp/Timestamp";
import { ChatMessageProps } from "../../types/PropTypes";
import "./ChatMessage.css";

function ChatMessage(props: ChatMessageProps){

    return(
        <>
            <div className={`chat-message-container chat-role-${props.chatRole}`}>
                <div className={`chat-message-content-profile-container`}>
                    <div className="chat-message-profile-container">
                        <ChatMessageProfile role={props.chatRole === "sender" ? "sender" : "receiver"} username={props.profile.username} profilePicSrc={props.profile.profilePicSrc} />
                    </div>
                    <div className={`chat-message-content-container`}>
                        <ChatMessageContent message={props.message.message} keywords={props.message.keywords} isFacilitator={props.message.isFacilitator} isSender={props.chatRole === "sender"} />
                    </div>
                </div>
                <div className="chat-message-timestamp-container">
                    <Timestamp time={props.timestamp.time} />
                </div>
            </div>
        </>
    )
}

export default ChatMessage;
