// Message Type = represents a message sent by a user in the chat application
// message: the textual content of the message
// author: the name of the user who sent the message
// date: the date at which the message was sent
// chatRole: where has the message originated from (receiver, sender or server)
// hover: the Hover comment associated with the message

import { Keyword } from "./KeywordType"
import { Score } from "./ScoreType"

export type Message = {
    messageContent: string,
    keywords: Array<Keyword> | null,
    author: string,
    date: Date,
    chatRole: "receiver" | "sender" | "server",
    hover: { comment: string, score: Score }
}