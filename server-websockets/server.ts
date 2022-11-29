
/* TODO: 
    - ASSIGN ALL MESSAGES SENT BY A CLIENT TO THE CLIENT OBJECT FOR TYPING SPEED/MESSAGE SPEED ANALYSIS
    - Broadcast chat room information to clients so they are aware of who they are chatting to.
*/

import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import url from "url";
import { v4 as uuidv4 } from "uuid";
import { ClientProfile } from "./types/ClientProfileType/ClientProfileType";
import { WebSocketCommunication } from "./types/WebSocketCommunicationType/WebSocketCommunicationType";
import { ProfileValidation } from "./types/ProfileValidationType/ProfileValidationType";
import { SocketClosureCodes } from "./types/SocketClosureCodes/SocketClosureCodes";
import { Keyword } from "./types/KeywordType/KeywordType";
import { createMessageDiagnosis } from "./hover_message_diagnosis/message_diagnosis/message-diagnosis";
import { Diagnosis } from "./types/DiagnosisType/DiagnosisType";
import { ChatMessageContent } from "./types/ChatMessageContentType/ChatMessageContentType";
import { generateTranscript } from "./hover_transcript_generator/transcript_generator";
import { TranscriptMessage } from "./types/TranscriptMessageType/TranscriptMessageType";
import { detectTypingSpeed, flagTypingSpeed } from "./hover_detect_typing_speed/DetectTypingSpeed";
import { TypingSpeedMessage } from "./types/TypingSpeedMessageType/TypingSpeedMessageType";
import { generateHoverMessage } from "./hover_generate_hover_message/GenerateHoverMessage";
import { Score } from "./types/ScoreType/ScoreType";
import { TypingSpeedAnalysis } from "./types/TypingSpeedAnalysisType/TypingSpeedAnalysisType";
import { HoverMessage } from "./types/HoverMessageType/HoverMessageType";
require("dotenv").config();

const USER_DATA_URI: string = "localhost";
// const USER_DATA_URI: string = "https://server-hover-userdata.herokuapp.com/"
const MAX_CLIENTS: number = 2;
const WEBSOCKETS_PORT: number = 9000;
const server: WebSocketServer = new WebSocketServer({ port: process.env.PORT as any || WEBSOCKETS_PORT });
let users: Array<ClientProfile> = [];
let messageHistory: Array<string> = []; // ChatMessageContent - content: stringified JSON [message: string, keywords: Array<string>, author: ClientProfile, date: Date, hover: HoverMessage[comment: string, score: Score, rollingScore: Score]]
let patientScores: Array<Score> = [];
// My Janky implementation to only complete assessements every 10 messages
let lastAssessmentMade: number = 0;

server.on("connection", (socket: WebSocket, request: http.IncomingMessage) => {

    // Create connecting client's profile (id and username)
    const client: any = socket;
    client.isConnected = true;
    client.profile = getClientProfile(request.url); // ClientProfile type
    
    // Handle an incoming client connection
    if(handleConnection(socket, request, client)){

        sendConnectionMessages(client); // Send messages as a result of incoming client connection

        // Ping socket every 50 seconds to prevent Heroku closing the socket after 55 seconds of inactivity
        setInterval(() => {
            if(client.isConnected){
                client.ping();
                console.log(`Socket ${client.profile.id} pinged the server.`);
            }
        }, 50000)

    } else {
        client.close(SocketClosureCodes.INVALID_REQUEST);
        return;
    }
    
    // Handle client disconnect
    client.on("close", (code: number, reason: Buffer) => {

        client.isConnected = false;

        // Save patient and facilitator data
        const patientClientEmail: string | undefined = users.find((patient: ClientProfile) => patient.role === "patient")?.email;;
        const facilitatorClientEmail: string | undefined = users.find((patient: ClientProfile) => patient.role === "facilitator")?.email;
        const patientMessageList: Array<string> = messageHistory.filter((message: string) => JSON.parse(JSON.parse(message).content).author.role === "patient");
        const lastPatientMessageString: string = patientMessageList[patientMessageList.length-1];
        
        if(patientClientEmail && facilitatorClientEmail && lastPatientMessageString){
            const patientMessageScore: Score = JSON.parse(JSON.parse(lastPatientMessageString).content).hover.rollingScore;
            if(patientMessageScore.depression || patientMessageScore.anxiety || patientMessageScore.risk) performSaveData({facilitatorEmail: facilitatorClientEmail, patientEmail: patientClientEmail, dprScore: patientMessageScore.depression.toString(), anxScore: patientMessageScore.anxiety.toString()});
        }
        
        let message: string = "";

        if(messageHistory.length > 0) generateChatTranscript(messageHistory); // Generate chat transcript if there are messages in message history
        // Clear message history between clients
        messageHistory = [];
        patientScores = [];
        lastAssessmentMade = 0;

        // Send scores to user data server
        
        if(code !== SocketClosureCodes.INVALID_REQUEST){

            message = `${client.profile.user} has left the chat.`;
            broadcastMessage(server, processServerMessage(message), false, client); // Broadcast message to all clients
            removeUserFromGlobalUsersList(client);

            console.log(`${client.profile.user} (id: ${client.profile.id}, role: ${client.profile.role}) has disconnected from the server.`);
        }

        // Tell all other users connected to the server to disconnect by sending them a self destruct message
        client.close(SocketClosureCodes.OTHER_USER_DISCONNECT);
        message = `${client.profile.user} disconnected. You will be sent back to the landing page.`;
        broadcastMessage(server, processOtherUserDisconnectMessage(message), true, client);
        removeUserFromGlobalUsersList(client);

    })

    // Handle message reception
    socket.on("message", msg => {

        const receivedMessage: string = processChatMessage(msg.toString(), client.profile);
        broadcastMessage(server, receivedMessage, false, client); // Broadcast message to all clients

    })

})

function handleConnection(socket: WebSocket, request: http.IncomingMessage, client: any) : boolean {

    let error: boolean = false;
    let message: string = "";
    
    // If the client's user profile is not valid, close the current connecting client's connection
    const clientUserProfileValidation: ProfileValidation = validateUserProfile(client.profile, server);
    if(!clientUserProfileValidation.valid){

        message = clientUserProfileValidation.reason + "\n";
        error = true;

    }
    
    // If number of clients exceeds max, close the current connecting client's connection (04/10/22 - Issue with clients being locked out of the app due to clients not disconnecting properly)
    if(server.clients.size > MAX_CLIENTS){

        message = `Connection failed: too many clients. This server permits a maximum of ${MAX_CLIENTS} clients at one time.\n`;
        error = true;

    }

    // If chat room already contains one of either facilitator or patient, close the current connecting client's connection (04/10/22 - Issue with clients being locked out of the app due to clients not disconnecting properly)
    users.forEach((u: ClientProfile) => {
        if(u.role && (u.role === client.profile.role)){
            error = true;
            message += `Connection failed: a ${client.profile.role} already exists in this room.\n`;
            return;
        }
    })

    // If a username cannot be extracted from the client's query, close the current connecting client's connection
    if(!(client.profile.user && client.profile.role)){

        message += "Connection failed: incorrect query provided. Please provide 'user' and 'role' query parameters in WebSocket request.\n";
        error = true;

    } 

    // Handle connection errors
    if(!error){

        console.log(`${client.profile.user} (id: ${client.profile.id}, role: ${client.profile.role}) has connected to the server.`);
        users.push(client.profile); // Add client to the global users list 

    } else { 

        client.send(processServerErrorMessage(message));
        console.log(`${client.profile.user} (id: ${client.profile.id}, role: ${client.profile.role}) unsuccessfully attempted to connect to the server.`);

    }
    
    return !error;

}

function removeUserFromGlobalUsersList(user: any): void {
    users = users.filter((removedUser: ClientProfile) => { // Remove the user from the global user list
        return removedUser.id !== user.profile.id
    })
}

function sendConnectionMessages(client: any): void {

    const message: string = `${client.profile.user} has joined the chat.`;
    sendWelcomeMessage(client); // Send connecting client a welcome message
    broadcastMessage(server, processServerMessage(message), true, client); // Broadcast server message to clients indicating the newly-joined client has joined
    broadcastMessage(server, processUserDetailsMessage(users), false, client) // Broadcast newly-joined client's details
    
}

    
function formatAMPM(date: Date) {
    var hours: number = date.getHours();
    var minutes: any = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

function sendWelcomeMessage(client: any): void { 
    const welcomeMessage: string = `Welcome to the chat, ${client.profile.user}! Hover is ready to go!`;
    const welcomeMessage2: string = `Chat started at ${formatAMPM(new Date())}`;
    client.send(processServerMessage(welcomeMessage2)); // Send message to current connecting client

}

function broadcastMessage(server: WebSocketServer, message: string, excludeCurrentClient: boolean, currentClient: any): void {

    server.clients.forEach((c: any) => {

        if(excludeCurrentClient){
            if(c.profile.user !== currentClient.profile.user) c.send(message); // Broadcast message to everyone except current connecting client
        } else {
            c.send(message)
        }
        
    })
}

function getClientProfile(reqUrl: string | undefined): ClientProfile {

    let profile: ClientProfile = { id: "", user: undefined, role: undefined, email: undefined, typingSpeed: 0 };

    if(reqUrl){
        profile.id = uuidv4(); // Generate unique identifier
        profile.user = extractDataFromUrl(url.parse(reqUrl as string), "user"); // Extract user name from query params
        profile.role = extractDataFromUrl(url.parse(reqUrl as string), "role"); // Extract user name from query params
        profile.email = extractDataFromUrl(url.parse(reqUrl as string), "email") // Extract user email from query params
    } 

    return profile;

}

function extractDataFromUrl(url: url.UrlWithStringQuery, extractToken: string) : string | undefined {
    
    let query: string | undefined = undefined;

    if(url.query){
        if(url.query.includes(`${extractToken}=`)){
            query = url.query.split(`${extractToken}=`)[1].split("&")[0]; // Split the query param by the extract token, then split it by an ampersand (&), which indicates next query param
            if(query.includes("%20")) query = query.replace(/%20/g, " ");
        }
    }

    console.log(url);

    return query;

}

function validateUserProfile(profile: ClientProfile, server: WebSocketServer): ProfileValidation {

    let valid: boolean = true;
    let reason: string = "";

    // Username validation
    if(profile.user){

        // Check username character length
        const maxCharacters: number = 20; // TODO: Update this based on frontend requirements
        const minCharacters: number = 1;
        if(profile.user.length > maxCharacters){
            valid = false;
            reason += "\u2022 Username contains too many characters\n";
        } else if (profile.user.length < minCharacters) {
            valid = false;
            reason += "\u2022 Username contains too few characters\n";
        }

        // Check username does not contain illegal characters
        const illegalRegExp: RegExp = /[/?!@#$%^&*()+\\[\]';:,`~<>=]/g;
        if(illegalRegExp.test(profile.user)){
            valid = false;
            reason += "\u2022 Username contains illegal characters\n";
        }

        // Check to see if username is already being used in the chat room
        let dupes: number = 0;
        server.clients.forEach((c: any)=> {

            if(c.profile.user === profile.user){
                dupes++;
            }

            if(dupes > 1){
                valid = false;
                reason += "\u2022 Username is already being used in this chat room\n";
            }

        })

        // Check to see if username contains spaces - DEPRECATED. User names can now contain white spaces.
        // if(profile.user.split(" ").length > 1){
        //     valid = false;
        //     reason += "\u2022 Username cannot contain whitespaces\n"
        // }

    } else {
        valid = false;
        reason += "\u2022 Username does not exist\n";
    }

    // User Role validation
    if(profile.role){

        // Check that role conforms to "patient" or "facilitator"
        const role: string = profile.role.toLowerCase();
        if(!(role === "patient" || role === "facilitator")){
            valid = false;
            reason += "\u2022 User does not have a valid role. User must be a 'client' or a 'faciliator'\n";
        }

    } else {
        valid = false;
        reason += "\u2022 Role does not exist\n";
    }

    return { valid: valid, reason: reason }

}

function processUserDetailsMessage(clients: Array<ClientProfile>){
    return JSON.stringify({type: "joinedUserDetailsMessage", content: JSON.stringify(clients)}); // User
}

function processServerMessage(message: string) : string {
    return JSON.stringify({ type: "serverMessage", content: message }); // WebSocketCommunication Type
}

function processServerErrorMessage(message: string) : string {
    return JSON.stringify({ type: "serverErrorMessage", content: message});
}

function processOtherUserDisconnectMessage(message: string): string {
    return JSON.stringify({ type: "otherUserDisconnectMessage", content: message });
}




function processChatMessage(message: string, client: ClientProfile) : string {    
    // Get score for last session
    var previous_score: Score = {
        depression: 0,
        anxiety: 0,
        risk: false
    };

    if (messageHistory.length > 0) {
        var patientMessageList: Array<string> = messageHistory.filter((message: string) => {
            return JSON.parse(JSON.parse(message).content).author.role === "patient";
        });

        if(patientMessageList.length > 0){
            var lastPatientMessageString: string = patientMessageList[patientMessageList.length - 1];
            previous_score = JSON.parse(JSON.parse(lastPatientMessageString).content).hover.rollingScore;
        }
    
        // Updates patient scores once 10 messages have been sent since last message
        if( (messageHistory.length - lastAssessmentMade) === 10 ){
            for( var j = lastAssessmentMade; j < messageHistory.length; j++ ){
                const currMessage: Score = JSON.parse(JSON.parse(patientMessageList[j]).content).hover.rollingScore;
            
                patientScores[j] = currMessage; 
            }
        }
    }

    const currentDate: Date = new Date();

    const diagnosis: Diagnosis = createMessageDiagnosis(message);
    // console.log("Raw Diagnosis Score", diagnosis.score);

    // If there is more than 5 messages sent by a user, calculate characters per second between most recently sent message and current message
    const userMessageHistory: Array<string> = messageHistory.filter((msg: string) => {
        if(JSON.parse(JSON.parse(msg).content)) return JSON.parse(JSON.parse(msg).content).author.id === client.id
        else return "" === client.id;
    });
    let typingSpeed: TypingSpeedAnalysis = { message: "", anx_score: 0, speed: 0 };
    if(userMessageHistory.length > 5){
        typingSpeed = calculateTypingSpeed({message: message, date: currentDate}, client.id); // Use this to generate a Hover message.
        diagnosis.score.anxiety += typingSpeed.anx_score; // Add typing speed anxiety score to diagnosis anxiety
    }

    const chatMessageContent: ChatMessageContent = {
        message: diagnosis.analysedMessage,
        keywords: diagnosis.keywords,
        author: client,
        date: new Date(),
        hover: generateHoverMessage(
            {
                previousScore: previous_score,
                rollingScore: generateRollingScore(client.id, messageHistory),
                newScore: diagnosis.score,
                repetition: diagnosis.repetition,
                correctness: diagnosis.correctness,
                typingSpeed: typingSpeed
            },
            patientScores,
            messageHistory.length,
            lastAssessmentMade
        )
    }

    // Create variables to check if a suggestion was made
    const checkFacSugg = chatMessageContent.hover.comment.slice(0, 33);
    const startFacSugg: string = "Client appears to be experiencing";

    // If a suggestion was made...
    if(checkFacSugg === startFacSugg){
        // Save the point which the last asssessment was made
        lastAssessmentMade = messageHistory.length;
    }

    messageHistory.push(JSON.stringify({content: JSON.stringify(chatMessageContent)})); // Add to message history

    return JSON.stringify({ type: "chatMessage", content: JSON.stringify(chatMessageContent) }); // WebSocketCommunication Type
}

function generateRollingScore(clientId: string, history: Array<string>): Score {
    const idScoresArray: Array<{id: string, score: Score}> = [];

    history.forEach((msg: string) => {
        const userIdAndScore: { id: string, score: Score } = { id: "", score: { anxiety: 0, depression: 0, risk: false } };
        const parsedMsg: WebSocketCommunication = JSON.parse(msg);
        if(parsedMsg){
            userIdAndScore.id = JSON.parse(parsedMsg.content).author.id 
            userIdAndScore.score = JSON.parse(parsedMsg.content).hover.score;
        } else return;
        idScoresArray.push(userIdAndScore);
    })

    const filteredIdScores: Array<{id: string, score: Score}> = idScoresArray.filter((idScore: { id: string, score: Score }) => {
        return idScore.id === clientId;
    })

    let finalScore: Score = { anxiety: 0, depression: 0, risk: false };
    filteredIdScores.forEach((idScore: {id: string, score: Score}) => {
        if(idScore.id && idScore.score){
            finalScore.anxiety = finalScore.anxiety + idScore.score.anxiety;
            finalScore.depression = finalScore.depression + idScore.score.depression;
        }
    })

    finalScore.anxiety = finalScore.anxiety / filteredIdScores.length;
    finalScore.depression = finalScore.depression / filteredIdScores.length;

    // console.log("Average anxiety score", finalScore.anxiety);
    // console.log("Average depression score", finalScore.depression);

    return finalScore;
}

function generateChatTranscript(history: Array<string>){

    const transcriptMessageObjects: Array<TranscriptMessage> = history.map(websocketcomm => {

        const parsedComm: WebSocketCommunication = JSON.parse(websocketcomm);
        const parsedContent: ChatMessageContent = JSON.parse(parsedComm.content);
        const parsedAuthor: { user: string, role: string } = { user: "Hover", role: "server" }
        let parsedHoverComment: string = "";
        let parsedMessage: string = "";

        // Check that author properties exist on parsedContent
        if(parsedContent.author.user){
            parsedAuthor.user = parsedContent.author.user;
        }
        if(parsedContent.author.role){
            parsedAuthor.role = parsedContent.author.role;
        }

        // Remove line breaks and commas from Hover comment for CSV format
        if(parsedContent.hover.comment.length > 0){
            parsedHoverComment = parsedContent.hover.comment.replace(/\n/g, " ").replace(/,/g, " ");
        }

        // Remove commas from message and Hover comments for CSV format
        if(parsedContent.message.length > 0){
            parsedMessage = parsedContent.message.replace(/,/g, " ");
        }

        return { messageContent: parsedMessage, author: parsedAuthor.user, dateSent: parsedContent.date.toLocaleString(), role: parsedAuthor.role, hoverComment: parsedHoverComment, messageScore: parsedContent.hover.score }

    })

    generateTranscript(transcriptMessageObjects);

}

function calculateTypingSpeed(current: {message: string, date: Date}, userId: string ): TypingSpeedAnalysis {
    const prevMsg: ChatMessageContent = JSON.parse(JSON.parse(messageHistory[messageHistory.length - 1]).content);

    const prevTypingSpeedMsg: TypingSpeedMessage = { content: prevMsg.message, timestamp: prevMsg.date };
    const currTypingSpeedMsg: TypingSpeedMessage = { content: current.message, timestamp: current.date }

    const messageSpeedDetection: number = detectTypingSpeed(prevTypingSpeedMsg, currTypingSpeedMsg);
    const user: ClientProfile | undefined = users.find((user: ClientProfile) => user.id === userId);
    if(user){
        const flagged: TypingSpeedAnalysis = flagTypingSpeed(user.typingSpeed, messageSpeedDetection, messageHistory);
        user.typingSpeed = flagged.speed;
        return flagged;
    } else {
        return { message: "", anx_score: 0, speed: 0 }
    }
}

function performSaveData(saveData: { facilitatorEmail: string, patientEmail: string, dprScore: string, anxScore: string }): void {

    const req: http.ClientRequest = http.request({ 
        host: USER_DATA_URI, 
        port: 5050, 
        method: "POST", 
        headers: {
        "Content-Type": "application/json"
        }
    })

    req.on("error", (error: Error) => {
        console.error("Save Data Error", error);
    })

    req.write(JSON.stringify(saveData));
    req.end();
    
}

console.log(`Hover Server v1.0 is running on port ${WEBSOCKETS_PORT}`);