import { Keyword } from "./KeywordType";
import { UserData } from "./UserDataType";
import { Message } from "./MessageType";
import { UserInfo } from "./UserInfoType";

// HOV-21 
export type ChatWindowProps = {
    server: WebSocket,
    userData: UserData,
    updateMsgHeights: Function // Update ChatWindow's parent with the heights of ChatMessage components that are currently on screen
}

// HOV-22
export type HoverWindowProps = {
    server: WebSocket,
    corrMessageHeights: Array<string> // The heights of corresponding messages to HoverWindow's hover comments
}

// HOV-23
export type ChatMessageProps = {
    profile: ChatMessageProfileProps,
    message: ChatMessageContentProps,
    timestamp: TimestampProps,
    chatRole: "receiver" | "sender" | "server"// Determines who sent the message for styling purposes
}

// HOV-24
export type ChatBarProps = {
    onMessageSend: Function
}

// HOV-25
export type HoverCommentProps = {
    comment: string,
    timestamp: Date
}

// HOV-27
export type TopBarProfileProps = {
    role: string,
    name: string
}

// HOV-29
export type ChatMessageProfileProps =  {
    username: string,
    profilePicSrc: string,
    role: "receiver" | "sender"
}

// HOV-30
export type ChatMessageContentProps = {
    message: string,
    keywords: Array<Keyword> // Keyword = word that has been identified as noteworthy by the Hover Message Diagnosis System,
    isFacilitator: boolean,
    isSender: boolean
}

// HOV-31
export type TimestampProps = {
    time: Date
}

// HOV-32
export type ChatInputProps = {
    placeholder: string,
    onInput: Function
    inputValue: string
}

// HOV-33
export type ButtonProps = {
    onSend: Function,
    type: string,
    value: string | JSX.Element,
    disabled: boolean
}

// HOV-35
export type HoverCommentContentProps = {
    comment: string // String with HTML that will is parsed by the component
}

// ServerMessage
export type ServerMessageProps = {
    message: string
}

// ChatHoverSuper
export type ChatHoverSuperProps = {
    userData: UserData
}

// HoverBlank
export type HoverBlankProps = {
    height: string;
}

// ChatHoverMessage
export type ChatHoverMessageProps = {
    message: Message,
    isFacilitator: boolean
}

// LandingPageCompoent
export type LandingPageComponentProps = {
    onSubmit: Function,
    generalValidate: Function,
    spinner: JSX.Element | undefined
}

// PopupMessage
export type PopupMessageProps = {
    type: "positive" | "negative"
    message: string
}

// JoiningLobby 
export type JoiningLobbyProps = {
    currentUser: UserData,
    serverError: {error: boolean, message: string}
}

// ScrollToStartButton
export type ScrollToStartButtonProps = {
    onPress: Function
}