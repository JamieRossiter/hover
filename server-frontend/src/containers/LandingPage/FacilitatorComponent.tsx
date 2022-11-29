import React from "react";
import { LandingPageComponentProps } from "../../types/PropTypes";
import Button from "../../subcomponents/Button/Button";
import * as EmailValidator from "email-validator";
import "./LandingPage.css";
import ReactTooltip from "react-tooltip";

let isFirstRenderEmail: boolean = true;

function FacilitatorComponent(props: LandingPageComponentProps){

    const [emailState, updateEmailState] = React.useState<string>("");
    const [emailError, updateEmailError] = React.useState<[boolean, Array<string>]>([true, []]);

    React.useEffect(() => {

        if(isFirstRenderEmail){
            isFirstRenderEmail = false;
            return;
        }
        updateEmailError(validateEmail(emailState));

    }, [emailState])

    function handleSubmit(e: React.FormEvent<HTMLFormElement>){
        e.preventDefault();
    }

    function validateEmail(emailValue: string): [boolean, Array<string>] {

        let isValid: boolean = true;
        let comment: Array<string> = [];

        const generalValidation: [boolean, Array<string>] = props.generalValidate(emailValue);
        if(!generalValidation[0]){
            isValid = false;
            generalValidation[1].forEach((gComment: string) => comment.push(gComment));
        }

        if(!EmailValidator.validate(emailValue)){
            isValid = false;
            comment.push("Please enter a valid email address.");
        }

        return [isValid, comment];

    }

    return(
        <div>
        {
            ! emailError[0]
            ? <ReactTooltip id="tip-error-email" effect="solid" place="right">
                <ul>
                    {emailError[1].map((err: string) => <li>{err}</li>)}
                </ul>
            </ReactTooltip>
            : <></>
        }
            <form onSubmit={handleSubmit}>
                <br />
                <input data-testid="email" disabled={!!props.spinner} data-for="tip-error-email" data-tip="email-error" value={emailState} className={`landing-page-text-input ${(!emailError[0]) ? "landing-page-error" : ""}`} type="text" placeholder="Email" onChange={(e)=>{updateEmailState(e.target.value)}}/><br/>
                <br/>
                <div className="landing-page-button">
                    <Button disabled={!emailError[0] || emailState.length <= 0 || !!props.spinner} type="login" onSend={()=> props.onSubmit(emailState)} value={props.spinner ?? "LOG IN"} />
                </div>
            </form>
        </div>
    )
}

export default FacilitatorComponent;