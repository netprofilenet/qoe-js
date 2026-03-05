/**
 * Server configuration and discovery
 */
import { ServerInfo, ServerRegistry } from '../types/server';
export declare class ServerConfig {
    private currentServer;
    /**
     * Set the current server
     */
    setServer(server: ServerInfo): void;
    /**
     * Get the current server
     */
    getServer(): ServerInfo;
    /**
     * Load server registry from URL
     */
    loadRegistry(url: string): Promise<ServerRegistry>;
    /**
     * Discover the best server based on latency
     */
    discoverBestServer(registry: ServerRegistry): Promise<ServerInfo>;
    /**
     * Measure latency to a specific server
     */
    private measureServerLatency;
}
//# sourceMappingURL=ServerConfig.d.ts.map