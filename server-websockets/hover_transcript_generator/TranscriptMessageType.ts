import { Score } from "../types/ScoreType/ScoreType"

export type TranscriptMessage = {
    messageContent: string,
    author: string,
    dateSent: string,
    role: string,
    hoverComment: string,
    messageScore: Score
}