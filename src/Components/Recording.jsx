import React from "react";
import { Mic_icon } from "./mic_icon/Mic_icon";


export const Recording = ({vad}) => {
  
  return (
    <div className="recording gradient-text" >
      <Mic_icon/>
      <div>{vad.userSpeaking ? "Listening..." : 'Not Listening' }</div>
    </div>
  );
};
