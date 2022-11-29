import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "../LandingPage/LandingPage";
import ChatHoverSuperwindow from '../ChatHoverSuperwindow/ChatHoverSuperwindow';
import { TherapeuticModels } from '../TherapeuticModels/TherapeuticModels';
import "./AppContainer.css";

function AppContainer(){
    return(
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/chat" element={<ChatHoverSuperwindow />} />
                    <Route path="/therapeuticModel/:model" element={<TherapeuticModels />} />
                </Routes>
            </BrowserRouter>
        </>
    )
}

export default AppContainer;