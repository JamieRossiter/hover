import React from "react";
import ChatMessage from "../../components/ChatMessage/ChatMessage";
import HoverComment from "../../components/HoverComment/HoverComment";
import ServerMessage from "../../components/ServerMessageComponent/ServerMessage";
import { ChatHoverMessageProps } from "../../types/PropTypes";
import { Keyword } from "../../types/KeywordType";
import "./ChatHoverMessageContainer.css"

function ChatHoverMessageContainer(props: ChatHoverMessageProps){

    return(
        <>
            <div className="chat-comment-container">
                <div className={`chat-comment-chat-container${!props.isFacilitator ? "-no-comment" : ""}`}>
                    {props.message.chatRole === "server" 
                        ? <ServerMessage message={props.message.messageContent} /> 
                        : <ChatMessage profile={{username: props.message.author, profilePicSrc: "res/profile_placeholder.png", role: props.message.chatRole}} message={{isSender: props.message.chatRole === "sender", isFacilitator: props.isFacilitator, message: props.message.messageContent, keywords: props.message.keywords ?? new Array<Keyword>()}} timestamp={{time: props.message.date}} chatRole={props.message.chatRole}  />}
                </div>
                <div hidden={!props.isFacilitator} className="chat-comment-comment-container">
                    {(props.message.hover.comment && props.message.chatRole === "receiver") ? <HoverComment comment={props.message.hover.comment} timestamp={props.message.date} /> : <></>}
                </div>
            </div>
        </>
    )
}

export default ChatHoverMessageContainer;