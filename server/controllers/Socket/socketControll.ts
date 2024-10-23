import { Context, Response } from "@oak/oak";
import { jget, jsend } from "../../utils/misc.ts";
import type { User, UserId } from "../../types/User.ts";
import type { Queue, QueueMember } from "../../types/Queue.ts";
import type { Connection } from "../../types/Connection.ts";
import type { 
  SearchPeer, SetId,
  Event, MakeOffer,
  SearchProcess, Offer, 
  Answer,
  IceCandidate,
  PeerConnection
} from "../../types/Event.ts";

const users: Map<UserId, User> = new Map();
const queue: Queue = {'A2': [], 'B1': [], 'B2': [], 'C1': []};
const connections: Map<number, Connection> = new Map();

function handleSearch(msg: SearchPeer){
  // try to match among
  for (let i = 0; i < queue[msg.filter.level].length; i++){
    const member = queue[msg.filter.level][i];
    // skip if does not intersect
    if(
      msg.filter.ageStart > member.filter.ageFinish ||
      msg.filter.ageFinish < member.filter.ageStart ||
      msg.userId == member.userId
    ){continue;}

    // at this point memeber matches msg
    const connectionId = connections.size;
    const memberUser = users.get(member.userId);

    // if by some reason user vanished from users, don't be friends with them
    if(memberUser == undefined){
      delete queue[msg.filter.level][i];
      continue; 
    }

    connections.set(connectionId, {
      connectionId,
      offerer: member.userId,
      answerer: msg.userId,
      status: false
    } as Connection);

    // ask first came user to make an offer
    memberUser.socket.send(jsend({type: 'make-offer', connectionId} as MakeOffer));
    delete queue[msg.filter.level][i];
    return;
  }
  // if no pair was found, we become a queue member
  queue[msg.filter.level].push({
    userId: msg.userId, 
    filter: msg.filter
  } as QueueMember);
}

function handleOffer(msg: Offer){
  const con = connections.get(msg.connectionId);

  if(con == undefined){
    console.log("Connection does not exists");
    return; // todo: make proper warning event
  }

  const answerer = users.get(con.answerer);

  if(answerer == undefined){
    console.log("User does not exists");
    return; // todo: make proper warning event
  }

  answerer.socket.send(jsend(msg));
}

function handleAnswer(msg: Answer){
  const con = connections.get(msg.connectionId);

  if(con == undefined){
    console.log("Connection does not exists");
    return; // todo: make proper warning event
  }

  const offerer = users.get(con.offerer);

  if(offerer == undefined){
    console.log("User does not exists");
    return; // todo: make proper warning event
  }

  offerer.socket.send(jsend(msg));
}

function handleIce(msg: IceCandidate){
  const con = connections.get(msg.connectionId);

  if(con == undefined){
    console.log("Connection does not exists");
    return; // todo: make proper warning event
  }

  const recieverId = msg.from == 'offer' ? con.answerer : con.offerer;
  const reciever = users.get(recieverId);

  if(reciever == undefined){
    console.log("User does not exists");
    return; // todo: make proper warning event
  }

  reciever.socket.send(jsend(msg));
}

function handlePeer(msg: PeerConnection){
  const con = connections.get(msg.connectionId);
  
  if(con == undefined){
    console.log("Connection does not exists");
    return; // todo: make proper warning event
  }

  // update connection status to be active
  con.status = true;
  connections.set(msg.connectionId, con);
}

export default function socketControll(ctx: Context){
  if(ctx.request.headers.get("upgrade") != "websocket"){
    ctx.response.body = "NOPE!"
  }

  const socket = ctx.upgrade();

  const handleQueue = () => {
    console.log("Connected!");

    const newId = crypto.randomUUID();
    users.set(newId, {userId: newId, socket: socket} as User);
    socket.send(jsend({type: 'set-id', id: newId} as SetId));
  }

  socket.onopen = handleQueue;

  socket.onmessage = (event) => {
    const msg = jget(event.data) as Event;
    

    switch(msg.type){
      case 'search-peer':
        console.log('msg recieved! - peer');
        socket.send(jsend({type: 'search-process', success: true} as SearchProcess));
        handleSearch(msg as SearchPeer);
        break;
      case 'offer':
        handleOffer(msg as Offer);
        break;
      case 'answer':
        handleAnswer(msg as Answer);
        break;
      case 'ice-candidate':
        handleIce(msg as IceCandidate);
        break;
      case 'peer-connection':
        handlePeer(msg as PeerConnection);
        break;
    }
  }

  return new Response(ctx.request);
}