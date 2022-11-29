export type WebSocketCommunication = {
    type: "chatMessage" | "serverMessage",
    content: string
}