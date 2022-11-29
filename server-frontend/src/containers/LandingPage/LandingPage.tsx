import React from 'react';
import { UserInfo } from '../../types/UserInfoType';
import PatientComponent from "./PatientComponent";
import FacilitatorComponent from "./FacilitatorComponent";
import "./LandingPage.css";
import PopupMessage from "../../subcomponents/PopupMessage/PopupMessage";
import { Oval } from "react-loader-spinner";

const USER_DATA_URI: string = "http://server-hover-userdata.herokuapp.com";
const ILLEGAL_CHARACTERS_REGEX: RegExp = /[/?!#$%^&*()+\\[\]';:,`~<>=]/g;

function LandingPage() {
  
  const [showPatientPage, updateShowPatientPage] = React.useState<boolean>(true);
  const [popupInfo, updatePopupInfo] = React.useState<{message: string, isPositive: boolean} | null>(null);
  const [isLoading, updateIsLoading] = React.useState<boolean>(false);

  function onRadioChange(e: React.MouseEvent<HTMLInputElement, MouseEvent>): void{

    if(e.currentTarget.value === "facilitator"){
      updateShowPatientPage(false);
    } else {
      updateShowPatientPage(true);
    }

  }

  function submit(userInfo: UserInfo | null, facilitatorEmail: string | null): void {
    
    updateIsLoading(true);

    if(userInfo){

      checkPatientExists(userInfo).then((jsonResponse: any) => {

        if(jsonResponse.code && jsonResponse.response && jsonResponse.message){

          updatePopupInfo({ message: jsonResponse.message, isPositive: jsonResponse.response })

          if(jsonResponse.code === 200 && jsonResponse.response){
            setTimeout(() => {
              window.location.assign(formatOutgoingUserInfo(userInfo));
            }, 1000)
          }

        } else {
          updatePopupInfo({ message: "There was an internal server error.", isPositive: false })
        }

        updateIsLoading(false);

      })

      return;

    }

    if(facilitatorEmail){

      checkFacilitatorExists(facilitatorEmail).then((jsonResponse: any) => {
        
        if(jsonResponse.code && jsonResponse.message){
          
          updatePopupInfo({ message: jsonResponse.message, isPositive: jsonResponse.response });

          if(jsonResponse.code === 200 && jsonResponse.response){
            setTimeout(() => {
              window.location.assign(formatOutgoingUserInfo(JSON.parse(jsonResponse.response)[0]));
            }, 1000)
          }

        } else {
          updatePopupInfo({ message: "There was an internal server error.", isPositive: false });
        }

        updateIsLoading(false);

      })

      return;
    }

  }

  async function checkPatientExists(patientInfo: UserInfo) : Promise<any> {

    const info: {name: string, email: string, phone: string, role: string} = {
      name: patientInfo.name,
      email: patientInfo.email,
      phone: patientInfo.phone,
      role: "patient"
    }

    if(!USER_DATA_URI){
      console.error("The user data server URI is undefined.");
      return;
    }

    let res: Response = await fetch(USER_DATA_URI, { 
      method: "POST", 
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(info)
    })

    return res.json();

  }

  async function checkFacilitatorExists(facilitatorEmail: string): Promise<any> {

    if(!USER_DATA_URI){
      console.error("The user data URI is undefined.");
      return;
    }

    let res: Response = await fetch(USER_DATA_URI, {
      method: "POST",
      headers: {
        "Content-Type": "application/text"
      },
      body: facilitatorEmail
    })

    return res.json();

  }

  function formatOutgoingUserInfo(outgoingInfo: UserInfo): string{
    return `/chat?name=${outgoingInfo.name}&role=${outgoingInfo.isPatient ? "patient" : "facilitator"}&email=${outgoingInfo.email}&img=${outgoingInfo.img}`;
  }

  function performGeneralValidation(value: string): [boolean, Array<string>]{
    let isValid: boolean = true;
    let comment: Array<string> = [];

    if(!(value.length > 0)){
      isValid = false;
      comment.push("Field cannot be empty.");
    }
    if(ILLEGAL_CHARACTERS_REGEX.test(value)){
      isValid = false;
      comment.push("Field cannot include any illegal characters.");
    }

    return [isValid, comment];
  }

  return (
    <>
    <div className="landing-page-supercontainer">
      <div className="landing-page-container">
        {popupInfo ? <PopupMessage message={popupInfo.message} type={popupInfo.isPositive ? "positive" : "negative"} /> : <></>}
        <img src="res/logo_placeholder.png" alt="logo" id="landing-page-logo" />
          <div className="landing-page-welcome" id="landing-page-form-container">
          <br/><br/>
          <div className={`landing-page-radio-container${showPatientPage ? "-selected" : ""}`}>
            <label className="landing-page-label" htmlFor="landing-page-patient-input">PATIENT</label>
            <input disabled={isLoading} defaultChecked className="landing-page-radio-input" id="landing-page-patient-input" type="radio" name='user' value="client" onClick={(e: React.MouseEvent<HTMLInputElement, MouseEvent>) => onRadioChange(e)}/>
          </div>
          <div className={`landing-page-radio-container${showPatientPage ? "" : "-selected"}`}>
            <label className="landing-page-label" htmlFor="landing-page-facilitator-input">FACILITATOR</label>
            <input disabled={isLoading} className="landing-page-radio-input" type="radio" name='user' id="landing-page-facilitator-input" value="facilitator" onClick={(e: React.MouseEvent<HTMLInputElement, MouseEvent>) => onRadioChange(e)}/>
          </div>
          </div>
          <div className="landing-page-welcome" id="landing-page-form-container">
            {
              showPatientPage ? 
              <PatientComponent spinner={isLoading ? <Oval height={30} strokeWidth={6} color="yellow" secondaryColor="red" /> : undefined} generalValidate={performGeneralValidation} onSubmit={(patientInfo: UserInfo) => { submit(patientInfo, null) }} /> :
              <FacilitatorComponent spinner={isLoading ? <Oval height={30} strokeWidth={6} color="yellow" secondaryColor="red" /> : undefined} generalValidate={performGeneralValidation} onSubmit={(facilitatorEmail: string) => { submit(null, facilitatorEmail) }} /> 
            }
          </div>
        </div>
    </div>
    </>
  );
}

export default LandingPage;