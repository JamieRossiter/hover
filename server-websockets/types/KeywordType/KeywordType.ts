// Keyword Type
// word: the actual keyword itself.
// derived: this is the base word the word was generated from (e.g. via synonymisation or spell checking). Null if not applicable
// flag: is the word flagged as anxiety, depression or risk
// position: the position in the original string that the keyword reflects

export type Keyword = {
    word: string,
    score: {anxiety: number, depression: number, risk: boolean},
    derived: string,
    flag: string | null,
    position: Array<number> | null
}