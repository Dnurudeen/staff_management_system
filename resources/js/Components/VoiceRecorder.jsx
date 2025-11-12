import { useState, useRef, useEffect } from "react";
import {
    MicrophoneIcon,
    StopIcon,
    PlayIcon,
    PauseIcon,
    TrashIcon,
} from "@heroicons/react/24/solid";
import Button from "./Button";

export default function VoiceRecorder({
    onRecordingComplete,
    maxDuration = 300,
}) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioURL, setAudioURL] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (audioURL) {
                URL.revokeObjectURL(audioURL);
            }
        };
    }, [audioURL]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: "audio/wav",
                });
                const audioURL = URL.createObjectURL(audioBlob);
                setAudioBlob(audioBlob);
                setAudioURL(audioURL);

                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);

            timerRef.current = setInterval(() => {
                setRecordingTime((prevTime) => {
                    if (prevTime >= maxDuration) {
                        stopRecording();
                        return prevTime;
                    }
                    return prevTime + 1;
                });
            }, 1000);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            if (isPaused) {
                mediaRecorderRef.current.resume();
                timerRef.current = setInterval(() => {
                    setRecordingTime((prevTime) => prevTime + 1);
                }, 1000);
            } else {
                mediaRecorderRef.current.pause();
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
            }
            setIsPaused(!isPaused);
        }
    };

    const playAudio = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const deleteRecording = () => {
        setAudioBlob(null);
        setAudioURL("");
        setRecordingTime(0);
        setIsPlaying(false);
        if (audioURL) {
            URL.revokeObjectURL(audioURL);
        }
    };

    const saveRecording = () => {
        if (audioBlob) {
            onRecordingComplete(audioBlob, recordingTime);
            deleteRecording();
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    return (
        <div className="space-y-4">
            {!audioBlob ? (
                <div className="flex items-center space-x-4">
                    {!isRecording ? (
                        <Button
                            type="button"
                            variant="primary"
                            onClick={startRecording}
                            className="flex items-center space-x-2"
                        >
                            <MicrophoneIcon className="h-5 w-5" />
                            <span>Start Recording</span>
                        </Button>
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="danger"
                                onClick={stopRecording}
                                className="flex items-center space-x-2"
                            >
                                <StopIcon className="h-5 w-5" />
                                <span>Stop</span>
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={pauseRecording}
                            >
                                {isPaused ? "Resume" : "Pause"}
                            </Button>
                            <div className="flex items-center space-x-2">
                                <div
                                    className={`h-3 w-3 rounded-full ${
                                        isPaused
                                            ? "bg-yellow-500"
                                            : "bg-red-500 animate-pulse"
                                    }`}
                                ></div>
                                <span className="text-lg font-mono">
                                    {formatTime(recordingTime)}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={playAudio}
                            className="flex items-center space-x-2"
                        >
                            {isPlaying ? (
                                <>
                                    <PauseIcon className="h-5 w-5" />
                                    <span>Pause</span>
                                </>
                            ) : (
                                <>
                                    <PlayIcon className="h-5 w-5" />
                                    <span>Play</span>
                                </>
                            )}
                        </Button>
                        <span className="text-sm text-gray-600">
                            {formatTime(recordingTime)}
                        </span>
                        <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={deleteRecording}
                        >
                            <TrashIcon className="h-4 w-4" />
                        </Button>
                    </div>
                    <audio
                        ref={audioRef}
                        src={audioURL}
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                    />
                    <div className="flex space-x-2">
                        <Button
                            type="button"
                            variant="success"
                            onClick={saveRecording}
                        >
                            Send Voice Note
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={deleteRecording}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
