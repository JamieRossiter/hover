import "./ChatInput.css";
import { ChatInputProps } from "../../types/PropTypes";


function ChatInput(props: ChatInputProps){

    return(
        <input value={props.inputValue} onChange={(e) => {props.onInput(e.target.value)}} className="chat-input-text-input" type="text" placeholder={props.placeholder} />
    )

}

export default ChatInput;