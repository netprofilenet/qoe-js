/**
 * Server configuration types
 */

export interface TURNServer {
  urls: string;
  username?: string;
  credential?: string;
}

export interface ServerInfo {
  id: string;
  name: string;
  country: string;
  httpUrl: string;
  webrtcSignalingUrl: string;
  stunServers: string[];
  turnServers: TURNServer[];
  enabled: boolean;
}

export interface ServerRegistry {
  servers: ServerInfo[];
}

export function convertToRTCIceServers(server: ServerInfo): RTCIceServer[] {
  const iceServers: RTCIceServer[] = [];

  // Add STUN servers
  server.stunServers.forEach(url => {
    iceServers.push({ urls: url });
  });

  // Add TURN servers
  server.turnServers.forEach(turn => {
    iceServers.push({
      urls: turn.urls,
      username: turn.username,
      credential: turn.credential
    });
  });

  return iceServers;
}
