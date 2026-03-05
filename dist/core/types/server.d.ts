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
export declare function convertToRTCIceServers(server: ServerInfo): RTCIceServer[];
//# sourceMappingURL=server.d.ts.map