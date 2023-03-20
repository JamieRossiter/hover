import React from "react";
import ChatHoverMessageContainer from "../../containers/ChatHoverMessageContainer/ChatHoverMessageContainer";
import ServerMessage from "../../components/ServerMessageComponent/ServerMessage";
import ChatBar from "../../components/ChatBar/ChatBar";
import { ChatHoverSuperProps } from "../../types/PropTypes";
import { UserData } from "../../types/UserDataType";
import { Message } from "../../types/MessageType";
import { Keyword } from "../../types/KeywordType";
import { HoverComment } from "../../types/HoverCommentType";
import "./ChatHoverSuperwindow.css";
import TopBar from "../../components/TopBar/TopBar";
import { useSearchParams } from "react-router-dom";
import { URLSearchParams } from "url";
import JoiningLobby from "../../components/JoiningLobby/JoiningLobby";
import { Score } from "../../types/ScoreType";
import ScrollToStartButton from "../../subcomponents/ScrollToStartButton/ScrollToStartButton";

function ChatHoverSuperwindow(){

    const CHAT_SERVER_URI: string | undefined = "localhost:9000";
    const WEBSOCKETS_PROTOCOL: string | undefined = "ws";

    const [query] = useSearchParams(); // name, email, role
    const userData: UserData = formatIncomingQueryParameters(query);
    const [messages, updateMessages] = React.useState<Array<Message>>([]);
    const [messageCount, updateMessageCount] = React.useState<number>(0);
    const [allUsers, updateAllUsers] = React.useState<Array<any>>([]);
    const [serverError, updateServerError] = React.useState<{error: boolean, message: string}>({error: false, message: ""});
    const [otherUserDisconnectMessage, updateOtherUserDisconnectMessage] = React.useState<string>("");
    const [snappedToStart, updateSnappedToStart] = React.useState<boolean>(true);
    const [scrolledToBottom, updateScrolledToBottom] = React.useState<boolean>(true);

    // Refs
    const serverRef: React.MutableRefObject<WebSocket | null> = React.useRef(null);
    const messageWallStartRef: React.MutableRefObject<HTMLDivElement | null> = React.useRef(null);
    
    // Run once on first render only
    React.useEffect(() => {

        serverRef.current = establishChatServerConnection(userData);

        serverRef.current.addEventListener("message", (message: any) => {
            handleIncomingMessage(message.data) // Handle certain messages (e.g. server or chat messages) from the WebSockets server
        })

    }, [])

    // Run when other user disconnects
    React.useEffect(() => {

        if(otherUserDisconnectMessage.length > 0 && serverRef.current){
            serverRef.current.close(); // Self destruct websocket connection here
            window.alert(otherUserDisconnectMessage);
            window.location.assign("/");
        }

    }, [otherUserDisconnectMessage])

    // Run when message received
    React.useEffect(() => {

        if(!scrolledToBottom) updateSnappedToStart(false);

    }, [messages])

    function formatIncomingQueryParameters(query: URLSearchParams): UserData {
        
        let finalParams: UserData = {
            role: "",
            name: "",
            email: ""
        }

        const role: string | null = query.get("role");
        const name: string | null = query.get("name");
        const email: string | null = query.get("email");

        if(role && name && email){

            finalParams = {
                role: role,
                name: name,
                email: email
            }

        }

        return finalParams;
    }


    // FORMAT AND PROCESS INCOMING MESSAGES
    // Message =
    // type: serverMessage or chatMessage
    // content: 
    //  message: the chat message
    //  keywords: the keywords identified in the message
    //  author: the author of the message
    //  date: the date the message was sent
    //  hover: the hover comment associated with the message
    function handleIncomingMessage(incomingMessage: any): void {

        const incomingMessageObj: any = JSON.parse(incomingMessage);
        let formattedChatMessage: Message;
        
        let chatMessage: string = "";
        let chatKeywords: Array<Keyword> | null = null;
        let chatAuthor: string = "";
        let chatHoverComment: { comment: string, score: Score, rollingScore: Score } = { comment: "", score: { depression: 0, anxiety: 0, risk: false }, rollingScore: { depression: 0, anxiety: 0, risk: false } };
        let chatRole: "sender" | "receiver" | "server" = "server";

        switch(incomingMessageObj.type){
            case "serverMessage":
                chatMessage = incomingMessageObj.content;
                chatKeywords = null;
                chatAuthor = "Server";
                chatRole = "server";
                break;
            case "chatMessage":
                const chatContent: any = JSON.parse(incomingMessageObj.content);
                chatMessage = chatContent.message;
                chatKeywords = chatContent.keywords;
                chatAuthor = chatContent.author.user;
                chatHoverComment.comment = chatContent.hover.comment;
                chatHoverComment.score = chatContent.hover.score;
                chatHoverComment.rollingScore = chatContent.hover.rollingScore;
                chatRole = determineChatRole(chatAuthor, userData.name);
                // FOR TESTING PURPOSES ONLY
                if(chatContent.author.role === "patient"){
                    generateRollingScoreObject(chatAuthor, chatHoverComment, chatMessage, chatKeywords) // If the message originates from a patient, print the rolling score to the browser
                };
                break;
            case "joinedUserDetailsMessage":
                const allUsersContent: any = JSON.parse(incomingMessageObj.content);
                updateAllUsers(allUsersContent);
                return;
            case "serverErrorMessage":
                updateServerError({error: true, message: incomingMessageObj.content})
                return;
            case "otherUserDisconnectMessage":
                updateOtherUserDisconnectMessage(incomingMessageObj.content);
                return;

        }

        formattedChatMessage = { messageContent: chatMessage, keywords: chatKeywords, author: chatAuthor, date: new Date(), chatRole: chatRole, hover: chatHoverComment }

        updateMessages(messages => [formattedChatMessage, ...messages]); // Unshift new message to "messages" state array

    }

    function scrollToStart(){
        messageWallStartRef.current?.scrollIntoView({ behavior: "smooth" });
        updateSnappedToStart(true);
    }

    function onMessageWallScroll(e: React.UIEvent<HTMLDivElement, UIEvent>){
        const messageWallEl: EventTarget & HTMLDivElement = e.currentTarget;

        if(-messageWallEl.scrollTop + messageWallEl.clientHeight <= (messageWallEl.clientHeight) + 5){
            updateScrolledToBottom(true);
        } else {
            updateScrolledToBottom(false);
        }
    }

    function determineChatRole(author: string, clientUsername: string) : "receiver" | "sender" {
        return author === clientUsername ? "sender" : "receiver";
    }

    // Make a persistent connection to the WebSockets server to send and receive messages
    function establishChatServerConnection(data: UserData) : WebSocket {
        return new WebSocket(`${WEBSOCKETS_PROTOCOL}://${CHAT_SERVER_URI}?user=${data.name}&role=${data.role}&email=${data.email}`); // WebSockets server expects "user" and "role" query parameters upon establishing a connection
    }

    function generateMessageComponents(): Array<JSX.Element> {
        const components: Array<JSX.Element> = 
            messages.map((msg: Message, index: number) => {
                return <ChatHoverMessageContainer key={`chatMsg_${msg.date.toISOString()}`} message={msg} isFacilitator={userData.role === "facilitator"} />
            })
        return components;
    }

    function sendMessage(message: string){
        if(serverRef.current){
            serverRef.current.send(message); // Send message to WebSockets server
        }
    }

    function getOtherUser(): any {
        return allUsers.find((user: any) => {
            return user.user !== userData.name
        })
    } 

    function generateRollingScoreObject(author: string, hoverComm: { comment: string, score: Score, rollingScore: Score }, msg: string, keywords: Array<Keyword> | null ) {
        console.table({ 
            "Patient Name": author, 
            "Message Content": msg,
            "Avg. Patient Depression Score": hoverComm.rollingScore.depression,
            "Avg. Patient Anxiety Score": hoverComm.rollingScore.anxiety, 
            "Avg. Patient Risk Score": hoverComm.rollingScore.risk, 
            "Raw Message Depression Score": hoverComm.score.depression,
            "Raw Message Anxiety Score": hoverComm.score.anxiety,
            "Raw Message Risk Score": hoverComm.score.risk,
        });
        if(keywords){
            const debuggableKeywords: Array<{"Raw Keyword": string, "Derived Keyword": string, "Keyword Flag": string | null}> = keywords.map((kw: Keyword) => {
                const flag: string = kw.flag ?? ""
                return { "Raw Keyword": kw.word, "Derived Keyword": kw.derived, "Keyword Flag": flag.length > 0 ? kw.flag : "positive" }
            })
            console.table(debuggableKeywords);
        }
    }

    return(
        <>
            {
                allUsers.length > 1 && !serverError.error
                ?                 
                <div className="chat-hover-superwindow-container">
                    <div className="chat-hover-superwindow-topbar-container">
                        <TopBar role={getOtherUser().role} name={getOtherUser().user} />
                    </div>
                    <div onScroll={onMessageWallScroll} className="chat-hover-superwindow-messagewall-container">
                        <div ref={messageWallStartRef}></div>
                        {serverRef.current ? generateMessageComponents() : <p>Loading...</p>}
                    </div>
                    <div hidden={snappedToStart} className="chat-hover-superwindow-scrolltostart-container">
                        <ScrollToStartButton onPress={() => scrollToStart()} />
                    </div>
                    <div className="chat-hover-superwindow-chatbar-container">
                        {serverRef.current ? <ChatBar onMessageSend={(message: string) => { sendMessage(message) }} /> : <p>Loading...</p> }   
                    </div>
                </div>
                :
                <JoiningLobby currentUser={userData} serverError={serverError} /> 
            }
        </>
    )
}

export default ChatHoverSuperwindow;