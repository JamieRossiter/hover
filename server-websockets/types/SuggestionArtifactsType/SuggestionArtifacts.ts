import { Score } from "../ScoreType/ScoreType";

export type SuggestionArtifacts = {
    rolling_anx_score: number,
    rolling_dpr_score: number,
    prev_anx_score: number,
    prev_dpr_score: number,
    first_ten: Array<Score>
}