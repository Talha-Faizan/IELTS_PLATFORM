"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { createSubmission } from "@/lib/slices/submissionSlice";
import { usePracticeQuestion } from "@/lib/hooks/usePracticeQuestion";
import { getQuestionTitle } from "@/lib/dataTransforms";
import api from "@/lib/api";

export default function SpeakingPracticeContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("id");
  const { question, loading, error } = usePracticeQuestion("speaking", { requestedId });
  const { loading: submitting } = useSelector((state) => state.submission);

  // States: disconnected, part1, part2_prep, part2_speak, part3, completed
  const [testState, setTestState] = useState("disconnected");
  const [elapsed, setElapsed] = useState(0); 
  const [transcript, setTranscript] = useState([]);
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const manualStopRef = useRef(false);

  useEffect(() => {
    if (testState === "disconnected" || testState === "completed") return;
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [testState]);

  // Clean up audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Handle Part 2 Prep 60s countdown
  useEffect(() => {
    if (testState === "part2_prep" && elapsed >= 60) {
      setTestState("part2_speak");
      setElapsed(0);
      speakText("The 1-minute preparation is over. Please start speaking now for 1 to 2 minutes.");
    }
  }, [testState, elapsed]);

  const speakText = (text) => {
    if (!("speechSynthesis" in window)) return;
    setIsSpeaking(true);
    stopListening(); // Stop listening while examiner is speaking

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Store in global window to prevent Chrome garbage collection bug
    window.utterances = window.utterances || [];
    window.utterances.push(utterance);
    
    // Force a high-quality British female voice if available
    const voices = window.speechSynthesis.getVoices();
    const bestVoice = voices.find(v => v.name.includes("Natural") && v.lang.includes("en-GB") && v.name.toLowerCase().includes("female")) ||
                      voices.find(v => v.name.includes("Google UK English Female")) ||
                      voices.find(v => v.name.includes("Serena")) ||
                      voices.find(v => v.name.includes("Hazel")) ||
                      voices.find(v => v.lang.includes("en-GB") && v.name.toLowerCase().includes("female")) ||
                      voices.find(v => v.lang.includes("en-GB")) ||
                      voices.find(v => v.lang.includes("en-US"));
                      
    if (bestVoice) utterance.voice = bestVoice;
    utterance.rate = 0.95; 
    utterance.pitch = 1.1; // Slightly higher pitch for female tuning if default
    
    utterance.onend = () => {
       setIsSpeaking(false);
       if (testState === "part1" || testState === "part2_speak" || testState === "part3") {
          startListening();
       }
    };
    
    utterance.onerror = (e) => {
       console.error("Speech synthesis error", e);
       setIsSpeaking(false);
       if (testState === "part1" || testState === "part2_speak" || testState === "part3") {
          startListening();
       }
    };
    
    setTranscript(prev => [...prev, { role: "assistant", text }]);
    window.speechSynthesis.speak(utterance);
  };

  const startListening = async () => {
    if (testState === "part2_prep" || testState === "completed") return false;
    
    try {
      // 1. Create AudioContext synchronously BEFORE the await, to satisfy Brave's user gesture requirements.
      if (!audioContextRef.current) {
         audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioContextRef.current.state === "suspended") {
         await audioContextRef.current.resume();
      }

      // 2. Request Audio Only. (Video PIP causes hardware deadlocks on some machines).
      let stream = streamRef.current;
      if (!stream || stream.getTracks().length === 0) {
         stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(err => {
            console.error("Audio permission denied", err);
            throw new Error("Microphone permission denied.");
         });
         streamRef.current = stream;
      }
      
      const audioContext = audioContextRef.current;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.minDecibels = -80;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // 4. Initialize MediaRecorder with standard mime types that don't crash
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 
                       MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        setIsListening(false);
        setVolumeLevel(0);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (!manualStopRef.current && audioBlob.size > 1000) {
           handleAudioTurnEnd(audioBlob);
        } else if (!manualStopRef.current) {
           // Audio too short or empty, just restart if not processing
           if (!isProcessing && testState !== "part2_prep" && testState !== "completed" && testState !== "disconnected") {
              startListening();
           }
        }
        
        manualStopRef.current = false; // reset
      };
      
      mediaRecorder.start();
      setIsListening(true);
      
      // VAD Loop
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let isUserCurrentlySpeaking = false;
      
      const checkVolume = () => {
        if (mediaRecorder.state !== "recording") return;
        
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        let average = sum / bufferLength;
        
        // Normalize volume roughly 0-100 for UI
        setVolumeLevel(Math.min(100, Math.round((average / 128) * 100)));
        
        if (average > 15) { // Speaking threshold
           if (silenceTimerRef.current) {
             clearTimeout(silenceTimerRef.current);
             silenceTimerRef.current = null;
           }
           isUserCurrentlySpeaking = true;
        } else if (isUserCurrentlySpeaking) {
            // Started silence
           if (!silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                 isUserCurrentlySpeaking = false;
                 manualStopRef.current = false; // Let the onstop handler trigger the turn
                 mediaRecorder.stop();
              }, 2000); // 2 seconds silence -> stop recording
           }
        }
        
        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };
      
      checkVolume();
      return true;
      
    } catch (err) {
      console.error("Microphone access denied or failed", err);
      alert("Microphone access failed. Please ensure your microphone is connected and permissions are granted.");
      return false;
    }
  };

  const stopListening = () => {
    manualStopRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  };

  // Turn logic with Audio Payload
  const handleAudioTurnEnd = async (audioBlob) => {
    setIsProcessing(true);
    
    // Convert Blob to Base64
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64AudioData = reader.result.split(',')[1];
      
      try {
        const res = await api.post("/speaking/chat", {
          transcript,
          currentPart: testState,
          questionData: testState === "part1" ? question.content.questions.filter(q=>q.part==="Part 1") :
                        testState === "part3" ? question.content.questions.filter(q=>q.part==="Part 3") :
                        question.content.cueCard,
          audioBase64: base64AudioData
        });
        
        setIsProcessing(false);
        
        if (res.data.success) {
           const newTranscript = [...transcript];
           if (res.data.transcription) {
             newTranscript.push({ role: "user", text: res.data.transcription });
           }
           setTranscript(newTranscript);
           speakText(res.data.text);
        } else {
           window.alert("Examiner error: " + res.data.message);
        }
      } catch(err) {
        setIsProcessing(false);
        window.alert("Network error reaching examiner.");
      }
    };
  };

  const connectGemini = async () => {
    if (!question) return;
    
    // IMPORTANT: Start the microphone synchronously on the button click!
    // Initialize TTS engine synchronously to bind to the user gesture
    if ("speechSynthesis" in window) {
       const dummy = new SpeechSynthesisUtterance("");
       dummy.volume = 0;
       window.speechSynthesis.speak(dummy);
    }
    
    const success = await startListening();
    if (!success) return; 
    
    setTestState("part1");
    setElapsed(0);
    
    // Send initial ping to get first question
    setIsProcessing(true);
    try {
      const res = await api.post("/speaking/chat", {
        transcript: [],
        currentPart: "part1",
        questionData: question.content.questions.filter(q=>q.part==="Part 1")
      });
      setIsProcessing(false);
      if (res.data.success) {
         speakText(res.data.text);
      } else {
         alert("Examiner error: " + res.data.message);
         setTestState("disconnected");
      }
    } catch(err) {
      console.error("Failed to connect to examiner", err);
      setIsProcessing(false);
      alert("Network error reaching examiner. Ensure the backend is running.");
      setTestState("disconnected");
      stopListening();
    }
  };

  const endSessionAndSubmit = async () => {
    stopListening();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setTestState("completed");

    const transcriptPayload = transcript.map(t => ({
      part: t.role,
      text: t.text
    }));

    if (transcriptPayload.length === 0) {
       window.alert("No audio was captured. Test cannot be scored.");
       return;
    }

    const result = await dispatch(createSubmission({
      section: "speaking",
      type: "practice",
      questionId: question.id,
      content: {
        audioUrl: "gemini-local-stream", 
        transcript: transcriptPayload,
      },
      timeSpent: elapsed,
    }));

    if (createSubmission.fulfilled.match(result)) {
      router.push(`/practice/feedback?submissionId=${result.payload.id}`);
    }
  };

  const triggerPart2Prep = () => {
    stopListening();
    setTestState("part2_prep");
    setElapsed(0);
    const topic = question.content?.cueCard?.topic;
    speakText(`Thank you. That is the end of Part 1. Now I will give you a topic and I'd like you to talk about it for 1 to 2 minutes. The topic is: ${topic}. You have 1 minute to prepare.`);
  };

  const triggerPart3 = async () => {
    stopListening();
    setTestState("part3");
    setElapsed(0);
    setIsProcessing(true);
    
    // Send a manual override without audio to move to part 3
    try {
      const res = await api.post("/speaking/chat", {
        transcript,
        currentPart: "part3",
        questionData: question.content.questions.filter(q=>q.part==="Part 3")
      });
      setIsProcessing(false);
      if (res.data.success) {
         speakText(res.data.text);
      }
    } catch(err) {
      setIsProcessing(false);
      window.alert("Network error reaching examiner.");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getLatestQuestion = () => {
    if (transcript.length === 0) return "Waiting for examiner...";
    const lastAssistantMessage = [...transcript].reverse().find(t => t.role === "assistant");
    return lastAssistantMessage ? lastAssistantMessage.text : "Waiting for examiner...";
  };

  return (
    <ProtectedRoute>
      <div className="bg-[#FDFBF7] text-[#4A2010] flex flex-col h-screen overflow-hidden font-montserrat">
        
        {/* Header */}
        <header className="flex justify-between items-center h-16 px-8 w-full border-b border-[#E5DFD3] shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/practice" className="text-[#8A3311] hover:opacity-80 transition-opacity">
              <Icon name="arrow_back" size={24} />
            </Link>
            <div className="flex items-center gap-2">
              <Icon name="record_voice_over" size={24} className="text-[#8A3311]" />
              <span className="text-lg font-black text-[#4A2010] tracking-tight">IELTS Scholar</span>
              <span className="text-xs font-medium text-[#8A3311]/60 border-l border-[#E5DFD3] pl-4 ml-2">Speaking Simulator</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-[#FEE2E2] text-[#DC2626] px-3 py-1 rounded-full text-[10px] font-bold tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse"></span>
              LIVE SESSION
            </div>
            <div className="flex items-center gap-2 text-[#4A2010]">
              <Icon name="timer" size={18} />
              <span className="text-lg tracking-wider font-semibold">
                {testState === "part2_prep" ? `Prep: ${60 - elapsed}s` : formatTime(elapsed)}
              </span>
            </div>
          </div>
        </header>

        {loading ? (
           <main className="flex-1 flex items-center justify-center">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#8A3311]"></div>
           </main>
        ) : error || !question ? (
           <main className="flex-1 flex items-center justify-center p-8">
             <div className="bg-white p-8 rounded-2xl shadow-sm text-center border border-[#E5DFD3]">
               <h2 className="text-2xl font-bold text-[#4A2010] mb-2">Error</h2>
               <p className="text-[#8A3311]/80">{error || "Prompt not found."}</p>
             </div>
           </main>
        ) : (
           <main className="flex-1 max-w-7xl mx-auto px-6 py-4 flex flex-col gap-4 w-full h-full overflow-hidden">
             
             {/* Stepper */}
             <div className="flex items-center justify-center gap-6 bg-white py-2 px-8 rounded-full mx-auto shadow-sm border border-[#E5DFD3] shrink-0 text-sm">
               <div className={`flex items-center gap-2 ${testState === 'part1' ? 'text-[#8A3311] font-bold' : 'text-[#8A3311]/40 font-medium'}`}>
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${testState === 'part1' ? 'bg-[#8A3311]' : 'bg-[#E5DFD3] text-[#8A3311]'}`}>1</div>
                 <span>Introduction & Interview</span>
               </div>
               <div className="w-12 h-px bg-[#E5DFD3]"></div>
               <div className={`flex items-center gap-2 ${testState === 'part2_prep' || testState === 'part2_speak' ? 'text-[#8A3311] font-bold' : 'text-[#8A3311]/40 font-medium'}`}>
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${(testState === 'part2_prep' || testState === 'part2_speak') ? 'bg-[#8A3311]' : 'bg-[#E5DFD3] text-[#8A3311]'}`}>2</div>
                 <span>Long Turn</span>
               </div>
               <div className="w-12 h-px bg-[#E5DFD3]"></div>
               <div className={`flex items-center gap-2 ${testState === 'part3' ? 'text-[#8A3311] font-bold' : 'text-[#8A3311]/40 font-medium'}`}>
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${testState === 'part3' ? 'bg-[#8A3311]' : 'bg-[#E5DFD3] text-[#8A3311]'}`}>3</div>
                 <span>Discussion</span>
               </div>
             </div>

             <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
               
               {/* Left Pane: Examiner Image */}
               <div className="flex-1 relative rounded-[1.5rem] overflow-hidden shadow-lg border-4 border-white bg-[#E5DFD3] h-full">
                 {testState === "disconnected" ? (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FDFBF7] z-10 p-8 text-center">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mb-6">
                         <img src="/examiner.png" alt="Kiki Baessell" className="w-full h-full object-cover" />
                      </div>
                      <h2 className="text-3xl font-bold text-[#4A2010] mb-2">Kiki Baessell</h2>
                      <p className="text-lg text-[#8A3311]/80 mb-8 max-w-md">Your AI Examiner is ready to begin the test. Please ensure your microphone and camera are connected.</p>
                      <button onClick={connectGemini} className="bg-[#8A3311] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#6A2308] transition-colors shadow-md">
                        Start Live Session
                      </button>
                   </div>
                 ) : (
                   <>
                     <img src="/examiner.png" alt="AI Examiner" className="absolute inset-0 w-full h-full object-cover" />
                     <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-sm text-sm font-bold text-[#4A2010]">
                       <Icon name="verified_user" size={16} className="text-[#8A3311]" />
                       Examiner (AI)
                     </div>
                     {/* Removed Picture-in-Picture Webcam to prevent hardware deadlocks */}
                   </>
                 )}
               </div>

               {/* Right Pane: Question & Visualizer */}
               <div className="w-full lg:w-[380px] flex flex-col gap-4 h-full shrink-0">
                 <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5DFD3] flex-1 flex flex-col overflow-y-auto min-h-0 relative">
                   
                   <div className="flex items-center gap-2 text-[#8A3311] mb-4 text-[10px] font-bold tracking-widest uppercase">
                     <Icon name="forum" size={14} />
                     Current Question
                   </div>
                   
                   <h2 className="text-xl leading-tight font-bold text-[#4A2010] mb-4 shrink-0">
                     {getLatestQuestion()}
                   </h2>
                   
                   {(testState === "part2_prep" || testState === "part2_speak" || testState === "part3") && question?.content?.cueCard && (
                      <div className="mt-2 bg-[#FDFBF7] border border-[#E5DFD3] p-3 rounded-xl text-left w-full text-xs shrink-0 mb-4">
                        <p className="font-bold text-[#8A3311] mb-1 uppercase text-[10px] tracking-wider">Cue Card</p>
                        <p className="font-semibold text-[#4A2010] mb-1">{question.content.cueCard.topic}</p>
                        <ul className="list-disc pl-4 text-[#4A2010]/80 space-y-0.5 mb-1">
                          {question.content.cueCard.bulletPoints?.map((bp, i) => <li key={i}>{bp}</li>)}
                        </ul>
                      </div>
                   )}

                   <div className="mt-auto bg-[#FDFBF7] rounded-xl p-4 flex flex-col items-center justify-center border border-[#E5DFD3] shrink-0 mb-4">
                     
                     {isSpeaking || isProcessing ? (
                        <div className="h-10 flex items-center justify-center mb-2">
                           {isProcessing ? (
                             <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#8A3311] border-t-transparent"></div>
                           ) : (
                             <Icon name="volume_up" size={32} className="text-[#8A3311] animate-pulse" />
                           )}
                        </div>
                     ) : (
                        <div className="h-10 flex items-end justify-center gap-1.5 mb-2">
                           {/* Custom Vertical Bar Visualizer */}
                           {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
                             // Create a simple wave pattern using the volumeLevel
                             const heightPercent = isListening ? Math.max(15, volumeLevel * (1 - Math.abs(5 - i) * 0.15)) : 10;
                             return (
                               <div key={i} className="w-1.5 bg-[#8A3311] rounded-full transition-all duration-75" style={{ height: `${heightPercent}%`, minHeight: '10%' }}></div>
                             );
                           })}
                        </div>
                     )}
                     
                     <p className="text-xs text-[#8A3311]/60 font-medium">
                       {isProcessing ? "Processing..." : isSpeaking ? "Kiki is speaking..." : isListening ? "Recording your answer..." : "Waiting..."}
                     </p>
                   </div>

                   <div className="flex flex-col gap-2 shrink-0">
                     <button 
                       onClick={() => {
                          if (testState === "part1") triggerPart2Prep();
                          else if (testState === "part2_speak" || testState === "part2_prep") triggerPart3();
                          else endSessionAndSubmit();
                       }} 
                       disabled={submitting}
                       className="w-full bg-[#8A3311] text-white py-3 rounded-xl font-bold text-base hover:bg-[#6A2308] transition-colors flex items-center justify-center gap-2"
                     >
                       <Icon name="stop_circle" size={18} />
                       {testState === "part3" ? (submitting ? "Submitting..." : "Finish Test") : "Finish Answer"}
                     </button>
                     
                     {testState !== "part3" && testState !== "disconnected" && (
                       <button 
                         onClick={() => {
                            if (testState === "part1") triggerPart2Prep();
                            else if (testState === "part2_speak" || testState === "part2_prep") triggerPart3();
                         }}
                         className="w-full bg-transparent border border-[#8A3311] text-[#8A3311] py-3 rounded-xl font-bold text-base hover:bg-[#8A3311]/5 transition-colors flex items-center justify-center gap-2"
                       >
                         Next Question <Icon name="arrow_forward" size={18} />
                       </button>
                     )}
                   </div>

                 </div>
               </div>

             </div>
           </main>
        )}
      </div>
    </ProtectedRoute>
  );
}
