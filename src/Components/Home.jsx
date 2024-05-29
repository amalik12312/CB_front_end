import { useEffect, useState } from "react";
import io from "socket.io-client";
import { Recording } from "./Recording";

function Home() {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  const [audioQueue, setAudioQueue] = useState([]);
  const [currentAudio, setCurrentAudio] = useState(null);

  useEffect(() => {
    if (socket) {
      socket.on("connect", () => {
        console.log("Connected to server");
        setConnected(true);
      });

      socket.on("message", (data) => {
        console.log(data);
      });

      const handleAudioResponse = (data) => {
        console.log("received audio", data);
        const audioBlob = new Blob([data.audio_data], { type: "audio/wav" });
        setAudioQueue((prevQueue) => [...prevQueue, audioBlob]);
      };

      socket.on("audio_response", handleAudioResponse);

      return () => {
        socket.off("connect");
        socket.off("message");
        socket.off("audio_response");
      };
    }
  }, [socket]);

  // manage audio playback
  useEffect(() => {
    if (!currentAudio && audioQueue.length > 0) {
      const nextAudioBlob = audioQueue[0];
      const audioUrl = URL.createObjectURL(nextAudioBlob);
      const newAudio = new Audio(audioUrl);

      newAudio.onended = () => {
        setCurrentAudio(null); // Reset currentAudio when audio ends
        setAudioQueue((prevQueue) => prevQueue.slice(1)); // Remove the played audio from the queue
      };

      newAudio.play();
      setCurrentAudio(newAudio);
    }
  }, [audioQueue, currentAudio]);


  // manage socket connectivity
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
    const recorder = new MediaRecorder(stream);
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
        <Recording startRecording={startRecording} stopRecording={stopRecording} recording={recording}/>
      ) : (
        <button onClick={connectToServer}>Connect to Server</button>
      )}
      {connected && (
        <button onClick={disconnectFromServer}>Disconnect from Server</button>
      )}
    </div>
  );
}

export default Home;
