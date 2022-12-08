/* TODO: 
*/

import { Diagnosis } from "../../types/DiagnosisType/DiagnosisType";
import { Keyword } from "../../types/KeywordType/KeywordType";
import { TagInitial } from "../../types/TagInitialType/TagInitialType";
import { WordLists } from "../../types/WordListsType/WordListsType";
import * as fs from "fs";
import { Score } from "../../types/ScoreType/ScoreType";
const pos = require("pos");
const lemmatize = require("wink-lemmatizer");
const synonyms = require("synonyms");
const spellchecker = require("simple-spellchecker");
import { stringCorrectness } from "../../hover_string_correctness/string-correctness";
import { analyseRepetition } from "../../hover_repetition_analysis/RepetitionAnalysis";

type WordListItem = {
    word: string, dpr_score: number, anx_score: number, risk_flag: number
}

// Create POS tagger, for determining if words are nouns, adjectives or verbs
const tagger: any = new pos.Tagger();

// Create an array (list) of words with ratings from a text file
function createWordRatingListFromDictionaryJson(): Array<WordListItem> {
    let file: Buffer = fs.readFileSync("./hover_message_diagnosis/wordlists/dictionary.json");
    const list: Array<WordListItem> = JSON.parse(file.toString()).dictionary;
    return list;
}

function createWordListFromFile(filePath: string): Array<string> {
    let file = fs.readFileSync(filePath);
    const list: Array<string> = file.toString("utf-8").split("\n");
    return list;
}

// Analyse the message and return a "Diagnosis" object
export function createMessageDiagnosis(message: string, prevMessages: Array<string>):  Diagnosis {

     // List of words extracted from external text files containing categories of words
    const externalWordList: Array<WordListItem> = createWordRatingListFromDictionaryJson();
    // console.log("External Word List", externalWordList);

    const tokenizedMessage: Array<Keyword> = tokenizeMessage(message); // Split the message into indiviual "tokens" that take the form of Keyword types
    // console.log("Tokenized Message", tokenizedMessage);

    // const spellCheckedTokens: Array<Keyword> = tokenizedMessage.concat(spellCheckMessage(tokenizedMessage)); // Concatenate the tokenized message with spellcheck suggestions and perform spell check on original message (not keywords)
    // console.log("Spellchecked tokens", spellCheckedTokens);

    // const optimisedTokens: Array<Keyword> = optimiseTokens(spellCheckedTokens); // Synonymized list of keywords (no longer lemmatized)
    const finalisedTokens: Array<Keyword> = finaliseTokens(tokenizedMessage, externalWordList, message); // Filter tokens based on external word lists, flag tokens with "anxiety", "depression", "risk" and assign positions of tokens based on original message
    // console.log("Finalised Tokens", finalisedTokens);

    // console.log("Calculate Message Score Result", calculateMessageScore(finalisedTokens));

    return {
        analysedMessage: message,
        keywords: finalisedTokens,
        repetition: analyseRepetition(message, prevMessages),
        score: calculateMessageScore(finalisedTokens),
        correctness: parseFloat(stringCorrectness(message))
    };

}

// Tokenize the message by separating it into individual words
function tokenizeMessage(message: string): Array<Keyword> {

    const tokenized = removeStopwords(message.toLowerCase().split(" "));
    return tokenized.map(word => {
        let token: Keyword = { word: word, score: { anxiety: 0, depression: 0, risk: false }, derived: word, flag: null, position: null };
        return token;
    })
    
}

// Get the position of a particular token within an original message, returns an array of tuples in case of duplicate tokens
// function getTokenPositionInMessage(token: string, message: string): Array<[ number, number ]> {

//     let positions: Array<[number, number]> = []; // index 0 = start pos, index 1 = end pos
//     let index: number = message.indexOf(token);

//     while(index !== -1){
//         positions.push([index + 1, index + token.length]);
//         index = message.indexOf(token, index + 1);
//     }

//     return positions;

// }

function getTokenPositionInMessage(token: string, message: string): Array<number> {

    let positions: Array<number> = [];
    let splitMessage: Array<string> = message.split(" ");

    splitMessage.forEach((word: string, index: number) => {
        if(word.toLowerCase() === token.toLowerCase()) positions.push(index);
    })

    return positions;
    
}

// Remove stop words (e.g. i, you, me) from a tokenized message
export function removeStopwords(tokenizedMessage: Array<string>): Array<string>{

    const stopwordsList: Array<string> = createWordListFromFile("./hover_message_diagnosis/wordlists/stopwords.txt");
    return tokenizedMessage.filter(token => { return !stopwordsList.includes(token) })

}

// Lemmatize and synonymize all analysis words
function optimiseTokens(analysisWords: Array<Keyword>): Array<Keyword> {

    // const keywordListPosForLemm: Array<[Keyword, string]> = getWordPosInKeywordList(analysisWords);
    // const keywordListLemmatized: Array<Keyword> = lemmatizeKeywordList(keywordListPosForLemm); // Lemmatize words from analysis

    const keywordListPosForSyno: Array<[Keyword, string]> = getWordPosInKeywordList(analysisWords); 
    const keywordListSynonymized: Array<Keyword> = synonymizeKeywordList(keywordListPosForSyno); // Synonymize lemmatized analysis words

    const amalgamatedWordList: Array<Keyword> = analysisWords.concat(keywordListSynonymized); // Combine the original analysis words and synonymized word list together
    const keywordListOptimised: Array<Keyword> = removeDuplicatesFromKeywordList(amalgamatedWordList); // Remove duplicates

    return keywordListOptimised;

}

// Filter tokens based on word lists, flag them appropriately (anxiety, depression, risk) and assign their positions based on original message
function finaliseTokens(tokens: Array<Keyword>, wordList: Array<WordListItem>, message: string) : Array<Keyword> {

    let tokenFlags: Array<Keyword> = [];

    tokens.forEach((tok: Keyword) => {

        wordList.forEach((item: WordListItem) => {
            // const isScored: boolean = (item.anx_score > 0) || (item.dpr_score > 0) || (item.risk_flag != 0);
            if(item.word === tok.word) tokenFlags.push({word: tok.word, score: {anxiety: item.anx_score, depression: item.dpr_score, risk: item.risk_flag ? true : false }, flag: determineWordFlag(item.anx_score, item.dpr_score, item.risk_flag), derived: tok.derived, position: getTokenPositionInMessage(tok.derived, message)});
        })

    })

    return tokenFlags;

}

function determineWordFlag(anx_score: number, dpr_score: number, risk_flag: number): string {

    let flag: string = "";

    if((anx_score > 0 || dpr_score > 0)){
        flag = (anx_score > dpr_score) ? "anxiety" : "depression";
    }

    if(risk_flag > 0) flag = "risk";

    return flag;

}

// Removes all duplicates from a list/array of Keyword types
function removeDuplicatesFromKeywordList(list: Array<Keyword>): Array<Keyword> {

    return list.filter((keyword: Keyword, index: number, self: Array<Keyword>) => {

        return index === self.findIndex((k) => (
            k.word === keyword.word && k.derived === keyword.derived
        ))

    })

}

// Take a list of words, determine their POS (part of speech e.g. adjective, noun, verb) and lemmatize accordingly
function lemmatizeKeywordList(wordListPos: Array<[Keyword, string]>): Array<Keyword> {

    const lemmatized: Array<string> = [];
    
    wordListPos.forEach(wordPos => {

        const wordPosTagInitial: TagInitial = getWordPosTagInitial(wordPos);

        switch(wordPosTagInitial.initial){
            case "V" || "R": // Verb or Adverb
                lemmatized.push(lemmatize.verb(wordPosTagInitial.word));
                break;
            case "N": // Noun
                lemmatized.push(lemmatize.noun(wordPosTagInitial.word));
                break;
            case "J": // Adjective
                lemmatized.push(lemmatize.adjective(wordPosTagInitial.word));
                break;
            default:
                lemmatized.push(lemmatize.noun(wordPosTagInitial.word));
        }

    })

    return wordListPos.map((pos: [Keyword, string], index: number) => { // Convert Array[Keyword, string] tuple into lemmatized Array<Keyword> 
        pos[0].word = lemmatized[index];
        return pos[0];
    })

}

function getWordPosInKeywordList(list: Array<Keyword>): Array<[Keyword, string]> {
    const rawWordList: Array<string> = list.map(item => { return item.word }) // Extract raw words from Keyword type
    const taggedWordList: Array<Array<string>> = tagger.tag(rawWordList); // Tag POS
    const keywordWordList: Array<[Keyword, string]> = []; // Create a tuple that holds a Keyword type and an array of strings

    list.forEach((keyword: Keyword, index: number) => {
        keywordWordList.push([keyword, taggedWordList[index][1]]); // Push the original keyword 
    })

    return keywordWordList;
}

function getWordPosTagInitial(wordPos: [Keyword, string]): TagInitial {
    return { 
        word: wordPos[0].word, // Get actual word
        initial: wordPos[1][0] // Get initial letter of tag. This will denote its status as noun, verb or adjective.
    } 
}

// Take a list of lemmatized words and synonymize them
function synonymizeKeywordList(wordListPos: Array<[Keyword, string]>): Array<Keyword> {

    const synonymized: Array<Keyword> = [];

    wordListPos.forEach(wordPos => {
        
        const wordPosTagInitial: TagInitial = getWordPosTagInitial(wordPos);

        switch(wordPosTagInitial.initial){
            case "V": // Verb or Adverb
                synonyms(wordPosTagInitial.word, "v")?.forEach((synonym: string) => {
                    synonymized.push(
                        {
                            word: synonym,
                            score: { depression: 0, anxiety: 0, risk: false },
                            derived: wordPos[0].derived, // The derived word is the word that was in the original message,
                            flag: null,
                            position: wordPos[0].position
                        }
                    );
                })
                break;
            case "N": // Noun
                synonyms(wordPosTagInitial.word, "n")?.forEach((synonym: string) => {
                    synonymized.push(
                        {
                            word: synonym,
                            score: { depression: 0, anxiety: 0, risk: false },
                            derived: wordPos[0].derived, // The derived word is the word that was in the original message
                            flag: null,
                            position: wordPos[0].position 
                        }
                    );
                })
                break;
            case "J": // Adjective
                synonyms(wordPosTagInitial.word, "s")?.forEach((synonym: string) => {
                    synonymized.push(
                        {
                            word: synonym,
                            score: { depression: 0, anxiety: 0, risk: false },
                            derived: wordPos[0].derived, // The derived word is the word that was in the original message
                            flag: null,
                            position: wordPos[0].position
                        }
                    );
                })
                break;
        }

    })

    return synonymized;

}

// Check the originally analysed message (not keywords) for any spelling errors, then return suggestions
function spellCheckMessage(tokenizedMessage: Array<Keyword>): Array<Keyword> {

    let suggestions: Array<Keyword> = [];

    const dictionary = spellchecker.getDictionarySync("en-GB");

    tokenizedMessage.forEach(token => {

        if(!dictionary.spellCheck(token.word)){

            dictionary.getSuggestions(token.word).forEach( (sugg: any) => { 
                let keyword: Keyword = { word: sugg, score: { depression: 0, anxiety: 0, risk: false }, derived: token.word, flag: null, position: token.position };
                suggestions.push(keyword); 
            });
    
        }

    })

    return suggestions;
}

function calculateMessageScore(tokens: Array<Keyword>): Score {
    const finalScore: Score = {anxiety: 0, depression: 0, risk: false};
    tokens.forEach((tok: Keyword) => {
        finalScore.anxiety += tok.score.anxiety;
        finalScore.depression += tok.score.depression;
        finalScore.risk = tok.score.risk;
    })
    return finalScore;
}

