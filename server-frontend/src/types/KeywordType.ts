// Keyword Type = a word that has been identified as noteworthy by the Hover Message Diagnosis System
// word: the actual keyword itself.
// derived: this is the base word the word was generated from (e.g. via synonymisation or spell checking). Null if not applicable
// flag: is the word flagged as anxiety, depression or risk
// position: the position in the original string that the keyword reflects

export type Keyword = {
    word: string,
    derived: string,
    flag: string | null,
    position: Array<number> | null
}