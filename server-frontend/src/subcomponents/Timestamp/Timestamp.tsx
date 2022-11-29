import React from "react";
import "./Timestamp.css";
import { TimestampProps } from "../../types/PropTypes";

function Timestamp(props: TimestampProps){

    function formatTime(time: Date) : string {
        
        if(!(time instanceof Date)){
            return "null";        
        }

        let formattedTime: string;
        const splitTime: Array<string> = time.toLocaleTimeString().split(":");

        formattedTime = `${splitTime[0]}:${splitTime[1]}${extractMeridian(splitTime[2])}`;
        return formattedTime;
    }

    function extractMeridian(time: string) : string {
        return "pm";
        // return time.split(" ")[1].toLowerCase(); Dafuq is going on here? On Windows there's a meridian, on Mac there isn't...
    }

    return(
        <p className="timestamp-time">{formatTime(props.time)}</p>
    )

}

export default Timestamp;