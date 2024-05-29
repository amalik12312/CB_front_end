import React from "react";

export const Recording = ({recording,startRecording,stopRecording,}) => {
  return (
    <div>
      {recording ? (
        <button onClick={stopRecording}>Stop Recording</button>
      ) : (
        <button onClick={startRecording}>Start Recording</button>
      )}
    </div>
  );
};
