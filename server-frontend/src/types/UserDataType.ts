// UserData = this is the user information that is passed to the WebSockets server when initiating a connection
// role: the user's role, either a facilitator or a patient
// name: the user's name
// email: the user's email

export type UserData = {
    role: string,
    name: string,
    email: string
}