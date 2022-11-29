import React from "react";
import { UserInfo } from "../../types/UserInfoType";
import { LandingPageComponentProps } from "../../types/PropTypes";
import PhoneInput, { formatPhoneNumber, isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import * as EmailValidator from "email-validator";
import Button from "../../subcomponents/Button/Button";
import "./LandingPage.css";
import { CountryCode, E164Number } from "libphonenumber-js/types";
import ReactTooltip from "react-tooltip";

let isFirstRender: { 
  name: boolean, 
  email: boolean, 
  phone: boolean 
} = { name: true, email: true, phone: true };

function PatientComponent(props: LandingPageComponentProps){

  const [nameState, updateNameState] = React.useState<string>('');
  const [nameError, updateNameValid] = React.useState<[boolean, Array<string>]>([true, []]);
  const [emailState, updateEmailState] = React.useState<string>('');
  const [emailError, updateEmailValid] = React.useState<[boolean, Array<string>]>([true, []]);
  const [phoneCountryState, updatePhoneCountryState] = React.useState<CountryCode>("AU");
  const [phoneState, updatePhoneState] = React.useState<E164Number>("");
  const [phoneError, updatePhoneValid] = React.useState<[boolean, Array<string>]>([true, []]);

  // Run every time nameState is updated
  React.useEffect(() => {

    if(isFirstRender.name){
      isFirstRender.name = false;
      return;
    }

    updateNameValid(validateName(nameState));

  }, [nameState])

  React.useEffect(() => {

    if(isFirstRender.email){
      isFirstRender.email = false;
      return;
    }

    updateEmailValid(validateEmail(emailState));

  }, [emailState])

  React.useEffect(() => {

    if(isFirstRender.phone){
      isFirstRender.phone = false;
      return;
    }

    updatePhoneValid(validatePhone(phoneState));

  }, [phoneState])

  function validateName(nameValue: string): [boolean, Array<string>] {

    let isValid: boolean = true;
    let comment: Array<string> = [];

    const generalValidation: [boolean, Array<string>] = props.generalValidate(nameValue);
    if(!generalValidation[0]){
      isValid = false;
      generalValidation[1].forEach((genComment: string) => comment.push(genComment))
    }

    if(/[0-9]/g.test(nameValue)){
      isValid = false;
      comment.push("Name cannot include numbers.");
    }

    const maxNameLength: number = 20;
    if(nameValue.length > maxNameLength){
      isValid = false;
      comment.push(`Name cannot be more than ${maxNameLength} characters.`);
    }

    return [isValid, comment];
  }

  function validateEmail(emailValue: string): [boolean, Array<string>] {

    let isValid: boolean = true;
    let comment: Array<string> = [];

    const generalValidation: [boolean, Array<string>] = props.generalValidate(emailValue);
    if(!generalValidation[0]){
      isValid = false;
      generalValidation[1].forEach((genComment: string) => comment.push(genComment))
    }

    if(!EmailValidator.validate(emailValue)){
      isValid = false;
      comment.push("Please enter a valid email address.");
    }

    return [isValid, comment];

  }

  function validatePhone(phoneValue: string): [boolean, Array<string>] {

    let isValid: boolean = true;
    let comment: Array<string> = [];
    const formattedPhoneNumber: string = formatPhoneNumber(phoneValue);

    const generalValidation: [boolean, Array<string>] = props.generalValidate(formattedPhoneNumber);
    if(!generalValidation[0]){
      isValid = false;
      generalValidation[1].forEach((genComment: string) => comment.push(genComment))
    }

    if(!isValidPhoneNumber(formattedPhoneNumber, phoneCountryState)){
      isValid = false;
      comment.push("Please enter a valid phone number.");
    }

    return [isValid, comment];

  }
  
  function prepareForSubmit(): void{
      const patientInfo: UserInfo = { name: nameState, email: emailState, phone: formatPhoneNumber(phoneState).replace(/ /g, ""), img: "res/hover_placeholder.jpg", isPatient: true };
      props.onSubmit(patientInfo);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault();
  }

  return(
    <div>
      <br/>
      {
        !nameError[0] 
        ? <ReactTooltip id="tip-error-name" effect="solid" place="right">
          <ul>
            {nameError[1].map((err: string) => <li>{err}</li>)}
          </ul>
        </ReactTooltip>
        : <></>
      }
      {
        !emailError[0]
        ? <ReactTooltip id="tip-error-email" effect="solid" place="right">
          <ul>
            {emailError[1].map((err: string) => <li>{err}</li>)}
          </ul>
        </ReactTooltip>
        : <></>
      }
      {
        !phoneError[0]
        ? <ReactTooltip id="tip-error-phone" effect="solid" place="right">
          <ul>
            {phoneError[1].map((err: string) => <li>{err}</li>)}
          </ul>
        </ReactTooltip>
        : <></>
      }
      <form onSubmit={handleSubmit}>
        <input data-testid="name" disabled={!!props.spinner} data-for="tip-error-name" data-tip="name-error" value={nameState} className={`landing-page-text-input ${(!nameError[0]) ? "landing-page-error" : ""}`} type="text" placeholder="Name" onChange={(e)=>{updateNameState(e.target.value)}}/><br/>
        <input data-testid="email" disabled={!!props.spinner} data-for="tip-error-email" data-tip="email-error" value={emailState} className={`landing-page-text-input ${(!emailError[0]) ? "landing-page-error" : ""}`} type="text" placeholder="Email" onChange={(e)=>{updateEmailState(e.target.value)}}/><br/>
        <div className={`landing-page-phone-input-container ${(!phoneError[0]) ? "landing-page-error" : ""}`}>
          <PhoneInput data-testid="phone" disabled={!!props.spinner} data-for="tip-error-phone" data-tip="phone-error"  value={phoneState} defaultCountry="AU" className="landing-page-phone-input" placeholder="Mobile number" onCountryChange={(e)=>{if(e) updatePhoneCountryState(e)}} onChange={(e)=>{if(e) updatePhoneState(e)}} />
        </div>
        {/* <input className="landing-page-text-input" type="text" placeholder="Phone no." onChange={(e)=>{updatePhoneState(e.target.value)}}/><br/> */}
        <br/>
        <div className="landing-page-button">
          <Button 
            disabled={(!nameError[0] || !emailError[0] || !phoneError[0] || nameState.length <= 0 || emailState.length <= 0 || phoneState.length <= 0) || !!props.spinner} 
            type="login" 
            onSend={()=> prepareForSubmit()} 
            value={props.spinner ?? "LOG IN"}
          />
        </div>
      </form>
    </div>
  )
} 

export default PatientComponent;