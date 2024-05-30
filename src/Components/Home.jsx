import { useEffect, useState } from "react";
import io from "socket.io-client";
import { Recording } from "./Recording";
import { useMicVAD ,utils} from "@ricky0123/vad-react";

function Home() {
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


  const vad = useMicVAD({
    startOnLoad: true,
    onSpeechEnd: (audio) => {
      
      const wavBuffer = utils.encodeWAV(audio)
   

      socket.emit("audio_message", wavBuffer);
      
      console.log("User stopped talking",wavBuffer)
    },
  })



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


  //clear audio when user speaks
  useEffect(()=>{
    if(vad.userSpeaking && currentAudio){
      currentAudio.pause()
      setAudioQueue([])
      setCurrentAudio(null)
    }
  },[vad.userSpeaking])


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


  return (
    <div className="App">
      <h1 className="gradient-text">WebSocket Audio Conversation</h1>
      <h2 className="gradient-text" style={{marginBottom:"70px"}}>Crafting digital solutions one line of code</h2>
      {connected ? (
        <Recording vad={vad}/>
      ) : (
        <button className="gradient-button"  onClick={connectToServer}>Connect to Server</button>
      )}
      {connected && (
        <button className="gradient-button" onClick={disconnectFromServer}>Disconnect from Server</button>
      )}
    </div>
  );
}

export default Home;
