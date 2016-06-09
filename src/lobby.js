/* @flow */

const _ = require('lodash');
const LobbyModel = require('./models/Lobby.js');

type User = {
  id: string,
  language: string,
  friends: Array<string>,
  joinTime: Date,
  happiness: number
}
type Room = Array<User>;

// weights for competing goals
const wantFullRoom = 100;
const wantNoWait = 100;
const wantSameLanguage = 100;
const wantFriends = 100;

const maxWaitSeconds = 10;
const startThreshold = 200;
const fullRoom = 10;

class Lobby {

  id: string;

  constructor(id: string = 'default'): void {
    this.id = id
    setTimeout(() => matchmake(this.id), 1000)
  }
}

function matchmake (lobbyId: string): void {
  LobbyModel.getWaitingMembers(lobbyId)
  .then((users: Array<User>) => {
    _.sortBy(users, calcHappiness);
    users.splice(0, fullRoom);
    if(averageHappiness(users) > startThreshold) {
      startRoom(users);
    }
  })
}

function makeRoomId (): string {
  return Math.round(Math.random() * 1000000000000).toString();
}

function startRoom (users: Array<User>) {
  const roomId = makeRoomId();
  LobbyModel.assignRoom(roomId, users);
}

function calcHappiness(user: User, room: Room): number {
  user.happiness = 0;
  user.happiness += calcHappinessFromFriends(user, room);
  user.happiness += calcHappinessFromFullRoom(user, room);
  user.happiness += calcHappinessFromLanguage(user, room);
  user.happiness += calcHappinessFromBoredom(user);
  return user.happiness;
}

function calcHappinessFromFriends (user: User, room: Room): number {
  if(!user.fiends) {
    return 0;
  }
  let friends = 0;
  for (let otherUser: User of room) {
    if(user !== otherUser && user.friends.indexOf(otherUser.id) !== -1) {
      friends++;
    }
  }
  return friends * wantFriends / fullRoom;
}

function calcHappinessFromLanguage (user: User, room: Room): number {
  let sameLanguage: number = 0;
  for(let otherUser: User of room) {
    if(user !== otherUser && otherUser.language === user.language) {
      sameLanguage++;
    }
  }
  return sameLanguage * wantSameLanguage / fullRoom;
}

function calcHappinessFromFullRoom (user: User, room: Room): number {
  const roomSize = Math.min(room.length, fullRoom);
  return roomSize * wantFullRoom / fullRoom;
}

function calcHappinessFromBoredom (user: User) {
  const secondsWaited = Math.round((new Date() - user.joinTime) / 1000);
  return secondsWaited * wantNoWait / maxWaitSeconds;
}

function averageHappiness(room: Room): number {
  let total = 0,
      average;
  for(let user of room) {
    total += user.happiness;
  }
  average = total / room.length;
  return average;
}
