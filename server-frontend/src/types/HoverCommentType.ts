// Hover Comment Type = represents the Hover Comment based on the analysis made by the system.
// messageContent: the textual content of the message
// author: the name of the user who sent the message. Will be hard coded to "Hover"
// img: will be hard coded to the logo for Hover
// date: the date at which the message was sent

export type HoverComment = {
    messageContent: string,
    author: string,
    img: string,
    date: Date,
    isBlank: boolean
}