<script setup lang="ts">
import { ref } from 'vue';
import type { 
  Answer, Event, IceCandidate,
  MakeOffer, Offer, SearchPeer,
  SetId, UUID
} from '@/types/Event';
import type { SearchFilter } from '@/types/Filter';
import { jsend, jget } from '@/utils/misc';

let userId: UUID;
let connectionId: number;
const isSocketOpen = ref();

const socket = new WebSocket(`wss://localhost:8000/ws`);
const localVideo = ref();
const remoteVideo = ref();

let localStream: MediaStream;
let remoteStream: MediaStream;
let peerConnection: RTCPeerConnection;
let didIOffer = false;

const config = {
  iceServers: [{ urls: [
    "stun:stun.mystunserver.tld",
    "stun:stun.l.google.com:19302"
  ]}],
};

const fetchUserMedia = ()=>{
  return new Promise<void>(async(resolve, reject)=>{
    try{
      const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
      });
      localVideo.value.srcObject = stream;
      localStream = stream;    
      resolve();    
    }catch(err){
      console.log(err);
      reject();
    }
  })
}

const listenIce = (e) => {
  console.log('> Ice candidate found')
  if(e.candidate){
    try{
      socket.send(jsend({
        type: 'ice-candidate',
        from: didIOffer ? 'offer' : 'answer',
        connectionId,
        candidate: e.candidate
      } as IceCandidate));
    } catch(err){
      console.error(err);
    }
  }
}

const createPeerConnection = (offer?: RTCSessionDescriptionInit)=>{
    return new Promise<void>(async(resolve, reject)=>{
      peerConnection = new RTCPeerConnection(config);
      remoteStream = new MediaStream();
      remoteVideo.value.srcObject = remoteStream;

      // prepare local tracks to send
      localStream.getTracks().forEach(track=>{
        peerConnection.addTrack(track,localStream);
      })

      peerConnection.addEventListener("signalingstatechange", (event) => {
        console.log(event);
        console.log(peerConnection.signalingState);
      });

      peerConnection.addEventListener('icecandidate', listenIce);
      
      // listening for remote track
      peerConnection.addEventListener('track', e=>{
        console.log("Got a track from the other peer!! How excting");
        console.log(e);
        e.streams[0].getTracks().forEach(track=>{
          remoteStream.addTrack(track, remoteStream);
        });
      });

      if(offer != undefined){
        await peerConnection.setRemoteDescription(offer);
      }
      resolve();
    })
}


// main search start
const startSearch = async () => {
  try{
    await fetchUserMedia();
    
    const filter: SearchFilter = {
      level: 'B1',
      ageStart: 18,
      ageFinish: 25
    } 
    
    socket.send(jsend({
      type: 'search-peer',
      userId,
      filter
    } as SearchPeer));
  }
  catch(err){
    console.error(err);
  }
}

// send back an answer if offer recieved
const handleOffer = async (msg: Offer) => {
  await createPeerConnection(msg.offer);
  connectionId = msg.connectionId;

  const answer = await peerConnection.createAnswer({});
  await peerConnection.setLocalDescription(answer);

  didIOffer = false;
  socket.send(jsend({
    type: 'answer',
    connectionId: msg.connectionId,
    answer
  } as Answer));
} 

// send an offer when where selected as offerer
const handleInvite = async (msg: MakeOffer) => {
  connectionId = msg.connectionId;
  await createPeerConnection();

  try{
    const offer = await peerConnection.createOffer();
    console.log("offer", offer);
    peerConnection.setLocalDescription(offer);
    didIOffer = true;

    socket.send(jsend({
      type: 'offer',
      connectionId,
      offer
    } as Offer));
  } catch(err){
    console.log(err)
  }
}

const handleId = (msg: SetId) => {
  userId = msg.id;
  console.log("JERE");
}

const handleIce = (msg: IceCandidate) => {
  peerConnection.addIceCandidate(msg.candidate);
}

const handleAnswer = (msg: Answer) => {
  peerConnection.setRemoteDescription(msg.answer);
}

// ======= Socket listeners =======
socket.onopen = (e) => {
  isSocketOpen.value = true;
}

socket.onclose = () => {
  isSocketOpen.value = false;
}

socket.onmessage = async (event) => {
  const msg = jget(event.data);

  switch(msg.type){
    case 'set-id':
      handleId(msg as SetId);
      break;
    case 'make-offer':
      handleInvite(msg as MakeOffer);
      break;
    case 'offer':
      handleOffer(msg as Offer);
      break;
    case 'ice-candidate':
      handleIce(msg as IceCandidate);
      break;
    case 'answer':
      handleAnswer(msg as Answer);
      break;
  }
}

</script>

<template>
  <div class="flex w-screen h-screen justify-center items-center">
    <div class="flex flex-col gap-8 border-2 p-20 rounded justify-between items-center">
      <h1 class="text-3xl">Random chat</h1>
      <!-- <input 
        type="text"
        class="w-40 p-3 border rounded-full"
        placeholder="Enter your name"
        v-model="username"
      /> -->
      <div class="gap-2 flex">
        <video ref="localVideo" class="w-2/4 border-2 rounded" autoplay playsinline/>
        <video ref="remoteVideo" class="w-2/4 border-2 rounded" autoplay playsinline />
      </div>
    
      <div class="flex">
        <button 
          class="
            border px-6 py-2 rounded-full bg-blue-500 text-white
            hover:bg-blue-600
            "
          :class="{'bg-gray-500 text-gray-400': !isSocketOpen}"
          @click="startSearch"
          :disabled="!isSocketOpen"
        >
          Start
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
