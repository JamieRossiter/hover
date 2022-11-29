import { Score } from "../ScoreType/ScoreType";
import { Suggestion } from "../SuggestionType/SuggestionType";

export type HoverMessage = {
    comment: string,
    score: Score,
    rollingScore: Score
}