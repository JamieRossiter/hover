import { Keyword } from "../KeywordType/KeywordType";
import { Repetition } from "../RepetitionInterface/RepetitionInterface";
import { Score } from "../ScoreType/ScoreType";

export type Diagnosis = {
    analysedMessage: string,
    keywords: Array<Keyword>,
    repetition: Repetition,
    score: Score,
    correctness: number
}