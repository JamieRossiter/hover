import { HoverMessage } from "../HoverMessageType/HoverMessageType";
import { ClientProfile } from "../ClientProfileType/ClientProfileType";
import { Keyword } from "../KeywordType/KeywordType";

export type ChatMessageContent = { 
    message: string, 
    keywords: Array<Keyword>, 
    author: ClientProfile, 
    date: Date,
    hover: HoverMessage
}