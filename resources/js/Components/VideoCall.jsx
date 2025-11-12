import { useState, useEffect, useRef } from "react";
import Modal from "@/Components/Modal";
import Button from "@/Components/Button";
import {
    PhoneIcon,
    PhoneXMarkIcon,
    VideoCameraIcon,
    VideoCameraSlashIcon,
    MicrophoneIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    ArrowsPointingOutIcon,
    UserGroupIcon,
} from "@heroicons/react/24/solid";

export default function VideoCall({
    show,
    onClose,
    conversationId,
    participants = [],
    callType = "video",
    initiator = false,
}) {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({});
    const [peerConnections, setPeerConnections] = useState({});
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isSpeakerOff, setIsSpeakerOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [callStatus, setCallStatus] = useState("connecting"); // connecting, connected, ended

    const localVideoRef = useRef(null);
    const remoteVideoRefs = useRef({});
    const callTimerRef = useRef(null);
    const screenStreamRef = useRef(null);

    // ICE servers configuration (STUN/TURN servers)
    const iceServers = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
        ],
    };

    // Initialize call
    useEffect(() => {
        if (show) {
            initializeCall();
        } else {
            cleanupCall();
        }

        return () => {
            cleanupCall();
        };
    }, [show]);

    // Start call timer
    useEffect(() => {
        if (callStatus === "connected") {
            callTimerRef.current = setInterval(() => {
                setCallDuration((prev) => prev + 1);
            }, 1000);
        }

        return () => {
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
            }
        };
    }, [callStatus]);

    const initializeCall = async () => {
        try {
            // Get user media
            const constraints = {
                audio: true,
                video:
                    callType === "video"
                        ? {
                              width: { ideal: 1280 },
                              height: { ideal: 720 },
                              facingMode: "user",
                          }
                        : false,
            };

            const stream = await navigator.mediaDevices.getUserMedia(
                constraints
            );
            setLocalStream(stream);

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Initialize peer connections for each participant
            participants.forEach((participant) => {
                if (participant.id !== window.Laravel.user.id) {
                    createPeerConnection(participant.id, stream);
                }
            });

            setCallStatus("connected");

            // If initiator, create offers
            if (initiator) {
                participants.forEach((participant) => {
                    if (participant.id !== window.Laravel.user.id) {
                        createOffer(participant.id);
                    }
                });
            }
        } catch (error) {
            console.error("Error initializing call:", error);
            alert(
                "Failed to access camera/microphone. Please check permissions."
            );
            onClose();
        }
    };

    const createPeerConnection = (participantId, stream) => {
        const peerConnection = new RTCPeerConnection(iceServers);

        // Add local stream tracks to peer connection
        stream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, stream);
        });

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                // Send ICE candidate to remote peer via signaling server
                sendSignalingMessage({
                    type: "ice-candidate",
                    candidate: event.candidate,
                    to: participantId,
                });
            }
        };

        // Handle remote stream
        peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams;
            setRemoteStreams((prev) => ({
                ...prev,
                [participantId]: remoteStream,
            }));

            // Set remote video element
            if (remoteVideoRefs.current[participantId]) {
                remoteVideoRefs.current[participantId].srcObject = remoteStream;
            }
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
            console.log(`Connection state: ${peerConnection.connectionState}`);
            if (
                peerConnection.connectionState === "disconnected" ||
                peerConnection.connectionState === "failed"
            ) {
                // Handle disconnection
                removeParticipant(participantId);
            }
        };

        setPeerConnections((prev) => ({
            ...prev,
            [participantId]: peerConnection,
        }));

        return peerConnection;
    };

    const createOffer = async (participantId) => {
        const peerConnection = peerConnections[participantId];
        if (!peerConnection) return;

        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            // Send offer to remote peer
            sendSignalingMessage({
                type: "offer",
                offer: offer,
                to: participantId,
            });
        } catch (error) {
            console.error("Error creating offer:", error);
        }
    };

    const handleOffer = async (offer, fromId) => {
        const peerConnection =
            peerConnections[fromId] ||
            createPeerConnection(fromId, localStream);

        try {
            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(offer)
            );
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            // Send answer back
            sendSignalingMessage({
                type: "answer",
                answer: answer,
                to: fromId,
            });
        } catch (error) {
            console.error("Error handling offer:", error);
        }
    };

    const handleAnswer = async (answer, fromId) => {
        const peerConnection = peerConnections[fromId];
        if (!peerConnection) return;

        try {
            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(answer)
            );
        } catch (error) {
            console.error("Error handling answer:", error);
        }
    };

    const handleIceCandidate = async (candidate, fromId) => {
        const peerConnection = peerConnections[fromId];
        if (!peerConnection) return;

        try {
            await peerConnection.addIceCandidate(
                new RTCIceCandidate(candidate)
            );
        } catch (error) {
            console.error("Error handling ICE candidate:", error);
        }
    };

    const sendSignalingMessage = (message) => {
        // Send via Laravel Echo (websocket)
        if (window.Echo) {
            window.Echo.private(`call.${conversationId}`).whisper(
                "signaling",
                message
            );
        }
    };

    // Listen for signaling messages
    useEffect(() => {
        if (window.Echo && show) {
            window.Echo.private(`call.${conversationId}`).listenForWhisper(
                "signaling",
                (message) => {
                    switch (message.type) {
                        case "offer":
                            handleOffer(message.offer, message.from);
                            break;
                        case "answer":
                            handleAnswer(message.answer, message.from);
                            break;
                        case "ice-candidate":
                            handleIceCandidate(message.candidate, message.from);
                            break;
                    }
                }
            );
        }
    }, [show]);

    const toggleMute = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const toggleSpeaker = () => {
        setIsSpeakerOff(!isSpeakerOff);
        // Mute/unmute all remote streams
        Object.values(remoteVideoRefs.current).forEach((videoElement) => {
            if (videoElement) {
                videoElement.muted = !isSpeakerOff;
            }
        });
    };

    const startScreenShare = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" },
                audio: false,
            });

            screenStreamRef.current = screenStream;
            const screenTrack = screenStream.getVideoTracks()[0];

            // Replace video track in all peer connections
            Object.values(peerConnections).forEach((pc) => {
                const sender = pc
                    .getSenders()
                    .find((s) => s.track?.kind === "video");
                if (sender) {
                    sender.replaceTrack(screenTrack);
                }
            });

            // Update local video
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = screenStream;
            }

            setIsScreenSharing(true);

            // Handle when user stops sharing
            screenTrack.onended = () => {
                stopScreenShare();
            };
        } catch (error) {
            console.error("Error sharing screen:", error);
        }
    };

    const stopScreenShare = () => {
        if (screenStreamRef.current) {
            screenStreamRef.current
                .getTracks()
                .forEach((track) => track.stop());
        }

        // Restore camera video
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            Object.values(peerConnections).forEach((pc) => {
                const sender = pc
                    .getSenders()
                    .find((s) => s.track?.kind === "video");
                if (sender && videoTrack) {
                    sender.replaceTrack(videoTrack);
                }
            });

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream;
            }
        }

        setIsScreenSharing(false);
    };

    const removeParticipant = (participantId) => {
        setRemoteStreams((prev) => {
            const updated = { ...prev };
            delete updated[participantId];
            return updated;
        });
    };

    const endCall = () => {
        setCallStatus("ended");
        cleanupCall();
        onClose();
    };

    const cleanupCall = () => {
        // Stop all tracks
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
        }

        if (screenStreamRef.current) {
            screenStreamRef.current
                .getTracks()
                .forEach((track) => track.stop());
        }

        // Close all peer connections
        Object.values(peerConnections).forEach((pc) => pc.close());

        // Clear states
        setLocalStream(null);
        setRemoteStreams({});
        setPeerConnections({});
        setCallDuration(0);
    };

    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
                .toString()
                .padStart(2, "0")}`;
        }
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <Modal
            show={show}
            onClose={endCall}
            maxWidth="7xl"
            showCloseButton={false}
        >
            <div
                className="relative bg-gray-900 rounded-lg overflow-hidden"
                style={{ height: "80vh" }}
            >
                {/* Call Header */}
                <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center space-x-3">
                            <UserGroupIcon className="h-6 w-6" />
                            <div>
                                <p className="font-semibold">
                                    {callType === "video"
                                        ? "Video Call"
                                        : "Audio Call"}
                                </p>
                                <p className="text-sm text-gray-300">
                                    {callStatus === "connecting"
                                        ? "Connecting..."
                                        : formatDuration(callDuration)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-300">
                                {Object.keys(remoteStreams).length + 1}{" "}
                                participants
                            </span>
                        </div>
                    </div>
                </div>

                {/* Video Grid */}
                <div className="h-full flex items-center justify-center p-4">
                    {Object.keys(remoteStreams).length === 0 ? (
                        /* Single user (local only) */
                        <div className="relative w-full h-full max-w-4xl">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover rounded-lg"
                            />
                            {isVideoOff && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
                                    <div className="text-center text-white">
                                        <div className="w-20 h-20 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                                            <span className="text-3xl font-bold">
                                                {window.Laravel?.user?.name?.charAt(
                                                    0
                                                ) || "U"}
                                            </span>
                                        </div>
                                        <p className="text-lg">Camera is off</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Multiple participants grid */
                        <div
                            className={`grid gap-2 w-full h-full ${
                                Object.keys(remoteStreams).length === 1
                                    ? "grid-cols-2"
                                    : Object.keys(remoteStreams).length <= 3
                                    ? "grid-cols-2 grid-rows-2"
                                    : "grid-cols-3 grid-rows-2"
                            }`}
                        >
                            {/* Local video (small) */}
                            <div className="relative">
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover rounded-lg"
                                />
                                {isVideoOff && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
                                        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                                            <span className="text-2xl font-bold text-white">
                                                {window.Laravel?.user?.name?.charAt(
                                                    0
                                                ) || "U"}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
                                    You {isMuted && "🔇"}
                                </div>
                            </div>

                            {/* Remote videos */}
                            {Object.entries(remoteStreams).map(
                                ([participantId, stream]) => {
                                    const participant = participants.find(
                                        (p) => p.id === parseInt(participantId)
                                    );
                                    return (
                                        <div
                                            key={participantId}
                                            className="relative"
                                        >
                                            <video
                                                ref={(el) =>
                                                    (remoteVideoRefs.current[
                                                        participantId
                                                    ] = el)
                                                }
                                                autoPlay
                                                playsInline
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
                                                {participant?.name ||
                                                    "Participant"}
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    )}
                </div>

                {/* Call Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-6">
                    <div className="flex items-center justify-center space-x-4">
                        {/* Mute */}
                        <button
                            onClick={toggleMute}
                            className={`p-4 rounded-full transition-colors ${
                                isMuted
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-gray-700 hover:bg-gray-600"
                            }`}
                            title={isMuted ? "Unmute" : "Mute"}
                        >
                            <MicrophoneIcon
                                className={`h-6 w-6 text-white ${
                                    isMuted ? "opacity-50" : ""
                                }`}
                            />
                        </button>

                        {/* Video Toggle */}
                        {callType === "video" && (
                            <button
                                onClick={toggleVideo}
                                className={`p-4 rounded-full transition-colors ${
                                    isVideoOff
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-gray-700 hover:bg-gray-600"
                                }`}
                                title={
                                    isVideoOff
                                        ? "Turn on camera"
                                        : "Turn off camera"
                                }
                            >
                                {isVideoOff ? (
                                    <VideoCameraSlashIcon className="h-6 w-6 text-white opacity-50" />
                                ) : (
                                    <VideoCameraIcon className="h-6 w-6 text-white" />
                                )}
                            </button>
                        )}

                        {/* Screen Share */}
                        {callType === "video" && (
                            <button
                                onClick={
                                    isScreenSharing
                                        ? stopScreenShare
                                        : startScreenShare
                                }
                                className={`p-4 rounded-full transition-colors ${
                                    isScreenSharing
                                        ? "bg-blue-600 hover:bg-blue-700"
                                        : "bg-gray-700 hover:bg-gray-600"
                                }`}
                                title={
                                    isScreenSharing
                                        ? "Stop sharing"
                                        : "Share screen"
                                }
                            >
                                <ArrowsPointingOutIcon className="h-6 w-6 text-white" />
                            </button>
                        )}

                        {/* Speaker */}
                        <button
                            onClick={toggleSpeaker}
                            className={`p-4 rounded-full transition-colors ${
                                isSpeakerOff
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-gray-700 hover:bg-gray-600"
                            }`}
                            title={
                                isSpeakerOff ? "Unmute speaker" : "Mute speaker"
                            }
                        >
                            {isSpeakerOff ? (
                                <SpeakerXMarkIcon className="h-6 w-6 text-white opacity-50" />
                            ) : (
                                <SpeakerWaveIcon className="h-6 w-6 text-white" />
                            )}
                        </button>

                        {/* End Call */}
                        <button
                            onClick={endCall}
                            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                            title="End call"
                        >
                            <PhoneXMarkIcon className="h-6 w-6 text-white" />
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
