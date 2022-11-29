import { Score } from "../ScoreType/ScoreType"

export type TranscriptMessage = {
    messageContent: string,
    messageScore: Score
    author: string,
    dateSent: string,
    role: string,
    hoverComment: string
}