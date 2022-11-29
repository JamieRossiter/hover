import { AnalysisData } from "../types/AnalysisDataType/AnalysisDataType";
import { Repetition } from "../types/RepetitionInterface/RepetitionInterface";
import { Score } from "../types/ScoreType/ScoreType";
import { HoverMessage } from "../types/HoverMessageType/HoverMessageType";
import { generateFacilitatorSuggestion } from "../hover_facilitator_suggestion/FacilitatorSuggestion";
import { SuggestionArtifacts } from "../types/SuggestionArtifactsType/SuggestionArtifacts";

// Run facilitator suggestion
function startFacilitatorSuggestion(suggestionArtifacts: SuggestionArtifacts){
    let message: string = "";
    
    const facilitatorSuggestion = generateFacilitatorSuggestion(suggestionArtifacts);
    if(facilitatorSuggestion.therapyType.trim().length > 0){
        message += `${facilitatorSuggestion.text} <a target="_blank" href=${facilitatorSuggestion.link}>${facilitatorSuggestion.therapyType}</a> to assist.\n`
    }

    return message;
}

export function generateHoverMessage(analysisData: AnalysisData, firstTen: Array<Score>, messagesSent: number, lastAssessment: number): HoverMessage {
    let message: string = "";
    // Check for repetition in the message
    if(Object.keys(analysisData.repetition).length > 0){
        message += createRepetitionComment(analysisData.repetition);
    }
    // Check for anxiety, depression and risk scores
    // if(analysisData.newScore.anxiety || analysisData.newScore.depression || analysisData.newScore.risk){
    //     message += createScoreComment(analysisData.newScore);
    // }
    // Check for correctness of message
    if(analysisData.correctness <= 75){
        message += `Patient wrote message with ${analysisData.correctness}% correctness. Client may be showing signs of intoxication and/or depression\n`;
    }
    // Check for message speed
    if(analysisData.typingSpeed.anx_score > 0){
        message += analysisData.typingSpeed.message + "\n";
    }
    // Check for facilitator suggestion
    const suggestionArtifacts: SuggestionArtifacts = {
        rolling_anx_score: analysisData.rollingScore.anxiety,
        rolling_dpr_score: analysisData.rollingScore.depression,
        prev_anx_score: analysisData.previousScore.anxiety,
        prev_dpr_score: analysisData.previousScore.depression,
        first_ten: firstTen
    }
    
    //Only assess after 5 messages have been sent
    if(messagesSent >= 5) {
        // Check if an assessment hasnt been made
        if(lastAssessment === 0 ){
            message = startFacilitatorSuggestion(suggestionArtifacts);
        } 
        // Check if it has been 10 messages since the last assessment
        else if( (messagesSent - lastAssessment) === 10 ){
            message = startFacilitatorSuggestion(suggestionArtifacts);
        }
    }

    return { comment: message.trim(), score: analysisData.newScore, rollingScore: analysisData.rollingScore };
}

function createRepetitionComment(repetition: Repetition) : string {
    let comment: string = "";
    Object.keys(repetition).forEach((word: string) => {
        comment += `Patient repeated the term "${word}" ${repetition[word]} times.\n`;
    })
    return comment;
}

function createScoreComment(score: Score): string {
    let comment: string = "";
    if(score.anxiety > 1){
        comment += "Patient is displaying signs of anxiety.\n"
    }
    if(score.depression > 1){
        comment += "Patient is displaying signs of depression.\n"
    }
    if(score.risk){
        comment += "Patient may be a risk to themselves or others.\n"
    }
    return comment;
}