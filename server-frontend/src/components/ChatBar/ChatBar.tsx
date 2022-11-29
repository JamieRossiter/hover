import React, { FormEventHandler } from "react";
import ChatInput from "../ChatInput/ChatInput";
import Button from "../../subcomponents/Button/Button";
import "./ChatBar.css";
import { ChatBarProps } from "../../types/PropTypes";

function ChatBar(props: ChatBarProps){
    
    const [chatInputMessage, updateChatInputMessage] = React.useState("");

    function handleInput(value: string) : void {
        updateChatInputMessage(value);
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
        e.preventDefault();
        updateChatInputMessage("");
        return;
    }

    return(
        <>
            <form className="chat-bar-container" onSubmit={handleSubmit} >
                <ChatInput inputValue={chatInputMessage} onInput={(inpVal: string) => {handleInput(inpVal)}} placeholder="Send a message..." />
                <Button disabled={chatInputMessage.length <= 0} value="SEND" type="positive" onSend={() => {props.onMessageSend(chatInputMessage)}} />
            </form>
        </>
    )
}

export default ChatBar;