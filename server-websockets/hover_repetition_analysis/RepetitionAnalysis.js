"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyseRepetition = void 0;
const message_diagnosis_1 = require("../hover_message_diagnosis/message_diagnosis/message-diagnosis");
function analyseRepetition(message, prevMessages) {
    // const words: Array<string> = message.split(" ");
    const phrases = analysePhraseRepetition(message);
    let repetition = {};
    // words.forEach((w: string) => {
    //     if(w) repetition[w] = 0; // Init dynamic word keys with a value of zero
    // })
    phrases.forEach((p) => {
        repetition[p] = 0; // Init dynamic phrase keys with a value of zero
    });
    // words.forEach((w: string) => {
    //     if(w) repetition[w] = (repetition[w] || 0) + 1; // Iterate through each word and count number of times it is encountered
    // })
    phrases.forEach((p) => {
        repetition[p] = (repetition[p] || 0) + 1; // Iterate through each phrase and count number of times it is encountered
    });
    Object.keys(repetition).forEach((key) => {
        if (repetition[key] <= 1)
            delete repetition[key]; // Delete entries that have not been counted more than once
    });
    analyseRepetitionAcrossMessages(prevMessages, message);
    return repetition;
}
exports.analyseRepetition = analyseRepetition;
function analyseRepetitionAcrossMessages(prevMessages, currMessage) {
    // NOTE: By not passing this through getPhrases(), we are inherently analysing repetition of single words, not phrases.
    // Like the standard repetition analysis function above, this means single words can be ignored sometimes. 
    // We may be able to implement both single word AND phrase repetition analysis. Need to investigate.
    const analysedCurr = getPhrases((0, message_diagnosis_1.removeStopwords)(removePunctuation(currMessage).split(" ")));
    const analysedPrevs = prevMessages.map((prev) => removePunctuation(prev));
    let regex;
    let matches = [];
    console.log("Analysed Curr", analysedCurr);
    analysedPrevs.filter((prevs) => {
        analysedCurr.forEach((curr, index) => {
            regex = new RegExp(curr, "gi");
            // if(prevs.match(regex)) matches.push(prevs); // NOTE: Do we want to focus more on the message/message information where the repetition was located?
            // if(prevs.match(regex)) matches.push(curr); // NOTE: Or do we want to focus more on the word being repeated?
            if (prevs.match(regex))
                matches.push([curr, prevs]); // NOTE: Por que los nos dos? Return this value, or an object with "repeated word" and "original message" or "original message index"?
        });
    });
    console.log(matches);
}
function analysePhraseRepetition(message) {
    const splitMessage = removePunctuation(message).split(" ");
    const splitMessageNoStopwords = (0, message_diagnosis_1.removeStopwords)(splitMessage);
    let phraseToAnalyse = "";
    let regex; // Will be a dynamic regex that is used to find repetition within the message
    // let significantMatches: Set<string> = new Set(); // Set prevents duplicates
    let significantMatches = [];
    splitMessageNoStopwords.forEach((word, index) => {
        phraseToAnalyse = word;
        for (let i = index + 1; i < splitMessageNoStopwords.length; i++) {
            phraseToAnalyse += " " + splitMessageNoStopwords[i]; // The phrase that will be converted to a dynamic regex to find matches
            regex = new RegExp(phraseToAnalyse, "gi");
            let matches = message.match(regex);
            if (matches && (matches.length > 1)) {
                if (matches[0]) {
                    // significantMatches.add(matches[0]);
                    significantMatches.push(matches[0]);
                }
            }
        }
        console.log("Phrase to Analyse", phraseToAnalyse);
    });
    // Sort matches in a descending fashion based on their length. Longer phrases are more significant than shorter phrases.
    const ascendingSignificantMatches = Array.from(significantMatches).sort((a, b) => {
        return b.length - a.length;
    });
    // Generate unwanted sig matches based by comparing lesser significant matches to most significant matches
    const matchesToRemove = new Set();
    ascendingSignificantMatches.forEach((sigMatch, index) => {
        let regex;
        for (let i = 0; i < ascendingSignificantMatches.length; i++) {
            regex = new RegExp(ascendingSignificantMatches[i]);
            if (ascendingSignificantMatches[i] != sigMatch) {
                // console.log(`Sig Match: ${sigMatch}, Comparator: ${regex}, Regex Match: ${regex.test(sigMatch)}`);
                if (regex.test(sigMatch)) {
                    matchesToRemove.add(ascendingSignificantMatches[i]);
                }
            }
        }
    });
    // Filter out unwanted sig matches
    const filteredSignificantMatches = ascendingSignificantMatches.filter((removedMatch) => {
        return !(matchesToRemove.has(removedMatch));
    });
    return filteredSignificantMatches;
}
function getPhrases(tokenizedMessage) {
    let phrases = [];
    tokenizedMessage.forEach((word, index) => {
        let currPhrase = "";
        currPhrase = word;
        for (let i = index + 1; i < tokenizedMessage.length; i++) {
            currPhrase += " " + tokenizedMessage[i];
        }
        phrases.push(currPhrase);
    });
    return phrases;
}
function removePunctuation(message) {
    const replaceRegex = /[.,\/#!$%\^&\*;?:{}=\-_`~()]/g;
    return message.replace(replaceRegex, "");
}
