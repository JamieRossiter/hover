import React from "react";
import { JoiningLobbyProps } from "../../types/PropTypes";
import "./JoiningLobby.css";

function JoiningLobby(props: JoiningLobbyProps){

    return(
        <>
            <div className="joining-lobby-supercontainer">
                <div className="joining-lobby-container">
                    <img className="joining-lobby-logo" src="res/logo_placeholder.png" alt="Hover Logo" />
                    <h1 className="joining-lobby-heading">{props.serverError.error ? "There was an error!" : `Hi ${props.currentUser.name}!`}</h1>
                    <p className="joining-lobby-subheading">{props.serverError.error ? props.serverError.message : `Please wait patiently while we connect you to a ${props.currentUser.role === "facilitator" ? "patient" : "facilitator"}.`}</p>
                    <img className="joining-lobby-loader" src="res/loader_placeholder.gif" alt="Loading..." />
                </div>
            </div>
        </>
    )

}

export default JoiningLobby;