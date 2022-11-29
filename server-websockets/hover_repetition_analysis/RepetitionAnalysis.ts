import { Repetition } from "../types/RepetitionInterface/RepetitionInterface";
import { removeStopwords } from "../hover_message_diagnosis/message_diagnosis/message-diagnosis"

export function analyseRepetition(message: string): Repetition {

    // const words: Array<string> = message.split(" ");
    const phrases: Array<string> = analysePhraseRepetition(message);

    let repetition: Repetition = {};
    
    // words.forEach((w: string) => {
    //     if(w) repetition[w] = 0; // Init dynamic word keys with a value of zero
    // })

    phrases.forEach((p: string) => {
        repetition[p] = 0; // Init dynamic phrase keys with a value of zero
    })

    // words.forEach((w: string) => {
    //     if(w) repetition[w] = (repetition[w] || 0) + 1; // Iterate through each word and count number of times it is encountered
    // })

    phrases.forEach((p: string) => {
        repetition[p] = (repetition[p] || 0) + 1; // Iterate through each phrase and count number of times it is encountered
    })

    Object.keys(repetition).forEach((key: string) => {
        if(repetition[key] <= 1) delete repetition[key]; // Delete entries that have not been counted more than once
    })

    return repetition;

}

function analysePhraseRepetition(message: string): Array<string> {

    const splitMessage: Array<string> = removePunctuation(message).split(" ");
    const splitMessageNoStopwords: Array<string> = removeStopwords(splitMessage);

    let phraseToAnalyse: string = "";
    let regex: RegExp; // Will be a dynamic regex that is used to find repetition within the message
    // let significantMatches: Set<string> = new Set(); // Set prevents duplicates
    let significantMatches: Array<string> = [];

    splitMessageNoStopwords.forEach((word: string, index: number) => {

        phraseToAnalyse = word;

        for(let i = index + 1; i < splitMessageNoStopwords.length; i++){
            phraseToAnalyse += " " + splitMessageNoStopwords[i]; // The phrase that will be converted to a dynamic regex to find matches
            regex = new RegExp(phraseToAnalyse, "gi");

            let matches: RegExpMatchArray | null = message.match(regex);
            if(matches && (matches.length > 1)){
                if(matches[0]){
                    // significantMatches.add(matches[0]);
                    significantMatches.push(matches[0]);
                }
            }
        }

    })

    // Sort matches in a descending fashion based on their length. Longer phrases are more significant than shorter phrases.
    const ascendingSignificantMatches: Array<string> = Array.from(significantMatches).sort((a, b) => {
        return b.length - a.length
    })

    // Generate unwanted sig matches based by comparing lesser significant matches to most significant matches
    const matchesToRemove: Set<string> = new Set();
    ascendingSignificantMatches.forEach((sigMatch: string, index: number) => {
        let regex: RegExp;
        for(let i = 0; i < ascendingSignificantMatches.length; i++){
            regex = new RegExp(ascendingSignificantMatches[i]);
            if(ascendingSignificantMatches[i] != sigMatch){
                // console.log(`Sig Match: ${sigMatch}, Comparator: ${regex}, Regex Match: ${regex.test(sigMatch)}`);
                if(regex.test(sigMatch)){
                    matchesToRemove.add(ascendingSignificantMatches[i]);
                }
            }
        }
    })

    // Filter out unwanted sig matches
    const filteredSignificantMatches: Array<string> = ascendingSignificantMatches.filter((removedMatch: string) => {
        return !(matchesToRemove.has(removedMatch));
    })

    return filteredSignificantMatches;
}

function removePunctuation(message: string): string {
    const replaceRegex: RegExp = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g;
    return message.replace(replaceRegex, "");
}