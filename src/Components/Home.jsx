import { useEffect, useState } from "react";
import io from "socket.io-client";

function Home() {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [audio, setAudio] = useState(null);

  useEffect(() => {
    if (socket) {
      socket.on("connect", () => {
        console.log("Connected to server");
        setConnected(true);
      });

      socket.on("message", (data) => {
        console.log(data);
      });

      socket.on("audio_response", (data) => {
        const audioBlob = new Blob([data.audio_data], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log(audioBlob);

        if (audio) {
          audio.pause();
          audio.src = audioUrl;
          audio.play();
        } else {
          const newAudio = new Audio(audioUrl);
          newAudio.play();
          setAudio(newAudio);
          console.log(newAudio);
        }
      });

      return () => {
        socket.off("connect");
        socket.off("message");
        socket.off("audio_response");
      };
    }
  }, [socket]);

  const connectToServer = () => {
    const newSocket = io("http://192.168.68.106:5000");
    setSocket(newSocket);
  };

  const disconnectFromServer = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
    }
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream)
;
    setMediaRecorder(recorder);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        socket.emit("audio_message", event.data);
        console.log(event.data);
      }
    };

    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.stop();
    setRecording(false);
  };

  return (
    <div className="App">
      <h1>WebSocket Audio Conversation</h1>
      {connected ? (
        recording ? (
          <button onClick={stopRecording}>Stop Recording</button>
        ) : (
          <button onClick={startRecording}>Start Recording</button>
        )
      ) : (
        <button onClick={connectToServer}>Connect to Server</button>
      )}
      {connected && <button onClick={disconnectFromServer}>Disconnect from Server</button>}
    </div>
  );
}

export default Home;
