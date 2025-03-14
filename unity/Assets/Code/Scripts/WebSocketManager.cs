using UnityEngine;
// using WebSocketSharp;
using System;
using System.Collections.Generic;
using System.Collections.Concurrent;
using NativeWebSocket;

public class WsClient : MonoBehaviour {
    private WebSocket ws;
    public static WsClient Instance { get; private set; }

    // Game state properties from server
    public int TotalNodesPlaced { get; private set; } = 0;

    // Dictionary to track node IDs
    public Dictionary<string, Plot> NodePlots { get; private set; } = new Dictionary<string, Plot>();

    // Currently selected node
    public string SelectedNodeId { get; private set; } = null;

    // Main node health tracking
    public int MainNodeCurrentHealth { get; private set; } = 100;
    public int MainNodeMaxHealth { get; private set; } = 100;

    // Events
    public event Action<int> OnNodeCountUpdated;
    public event Action<string> OnNodeSelected;
    public event Action<string, NodeStatsData> OnNodeStatsUpdate;
    public event Action<string, int, int> OnNodeHealthUpdate;
    public event Action<string> OnGameOver;

    // Queue for messages to process on main thread
    private ConcurrentQueue<string> messageQueue = new ConcurrentQueue<string>();

    // Cache of Plot objects in the scene for quick access
    private Plot[] allPlots;

    // Reference to main node health component
    private MainNodeHealth mainNodeHealth;

    private void Awake() {
        // Simple singleton pattern
        if (Instance == null) {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        } else {
            Destroy(gameObject);
        }
    }

    private void Start() {
        // Cache all plot components in the scene
        allPlots = FindObjectsOfType<Plot>();

        // Find main node health component
        mainNodeHealth = FindObjectOfType<MainNodeHealth>();

        ConnectToServer();
    }

    private void Update() {
        // Process messages on main thread
        ProcessQueuedMessages();

        // Required for WebSocket to work properly in Unity
#if !UNITY_WEBGL || UNITY_EDITOR
        if (ws != null) {
            ws.DispatchMessageQueue();
        }
#endif
    }

    private async void ConnectToServer() {

        // #if UNITY_WEBGL && !UNITY_EDITOR
        //         Debug.Log("WebSocket connection skipped in WebGL build");
        //         return;
        // #endif

        ws = new WebSocket("ws://localhost:4000");

        ws.OnOpen += () => {
            Debug.Log("WebSocket connection established");
        };

        ws.OnMessage += (bytes) => {
            // Convert bytes to string
            string message = System.Text.Encoding.UTF8.GetString(bytes);
            // Queue the message for processing on main thread
            messageQueue.Enqueue(message);
            Debug.Log("Message received and queued: " + message);
        };

        ws.OnError += (e) => {
            Debug.LogError("WebSocket Error: " + e);
        };

        ws.OnClose += (e) => {
            Debug.Log("WebSocket connection closed: " + e);
        };

        try {
            await ws.Connect();
        } catch (Exception e) {
            Debug.LogError($"Failed to connect to WebSocket: {e.Message}");
        }
    }

    // Check if the WebSocket is connected
    public bool IsConnected() {
        return ws != null && ws.State == WebSocketState.Open;
    }

    private void ProcessQueuedMessages() {
        // Process all queued messages
        string message;
        while (messageQueue.TryDequeue(out message)) {
            try {
                ProcessServerMessage(message);
            } catch (Exception ex) {
                Debug.LogError($"Error processing server message: {ex.Message}\n{ex.StackTrace}");
            }
        }
    }

    private void ProcessServerMessage(string message) {
        try {
            // Simple check for JSON format
            if (message.StartsWith("{") && message.EndsWith("}")) {
                // Parse using simple Json utility
                var data = JsonUtility.FromJson<ServerMessage>(message);

                // If we can't parse it as our expected format, try a more generic approach
                if (data == null || string.IsNullOrEmpty(data.type)) {
                    Debug.LogWarning("Message didn't match expected format: " + message);
                    return;
                }

                // Handle state updates
                if (data.type == "state_update") {
                    StateUpdateMessage stateMsg = JsonUtility.FromJson<StateUpdateMessage>(message);
                    if (stateMsg != null && stateMsg.data != null) {
                        int newTotal = stateMsg.data.totalNodesPlaced;

                        // Only update if different
                        if (newTotal != TotalNodesPlaced) {
                            TotalNodesPlaced = newTotal;

                            // Notify subscribers
                            OnNodeCountUpdated?.Invoke(TotalNodesPlaced);

                            Debug.Log($"Total nodes placed updated: {TotalNodesPlaced}");
                        }

                        // Handle node selection update from server
                        if (stateMsg.data.selectedNodeId != null && stateMsg.data.selectedNodeId != SelectedNodeId) {
                            SelectedNodeId = stateMsg.data.selectedNodeId;
                            OnNodeSelected?.Invoke(SelectedNodeId);

                            // Update all plots' selection state
                            UpdateNodeSelectionState();
                        }
                    }
                }
                // Handle confirmation responses
                else if (data.type == "action_confirmed") {
                    ActionConfirmedMessage actionMsg = JsonUtility.FromJson<ActionConfirmedMessage>(message);
                    Debug.Log($"Server confirmed action: {actionMsg.action} with result: {actionMsg.success}");

                    if (actionMsg.newTotal >= 0) {
                        TotalNodesPlaced = actionMsg.newTotal;
                        OnNodeCountUpdated?.Invoke(TotalNodesPlaced);
                    }

                    // Handle node placement confirmation and get the node ID
                    if (actionMsg.action == "node_placed" && actionMsg.success && !string.IsNullOrEmpty(actionMsg.nodeId)) {
                        // Store the newly created node ID and link it to the most recently placed node
                        UpdateRecentNodeWithId(actionMsg.nodeId);
                    }

                    // Handle node selection confirmation
                    if (actionMsg.action == "node_selected" && actionMsg.success && !string.IsNullOrEmpty(actionMsg.nodeId)) {
                        SelectedNodeId = actionMsg.nodeId;
                        OnNodeSelected?.Invoke(SelectedNodeId);
                        UpdateNodeSelectionState();
                    }
                }
                // Handle node stats update
                else if (data.type == "node_stats_update") {
                    NodeStatsUpdateMessage statsMsg = JsonUtility.FromJson<NodeStatsUpdateMessage>(message);
                    if (statsMsg != null && !string.IsNullOrEmpty(statsMsg.nodeId)) {
                        Debug.Log($"Received stats update for node {statsMsg.nodeId}: Damage={statsMsg.stats.damage}, Range={statsMsg.stats.range}, Speed={statsMsg.stats.speed}, Efficiency={statsMsg.stats.efficiency}");

                        // Notify subscribers about the stats update
                        OnNodeStatsUpdate?.Invoke(statsMsg.nodeId, statsMsg.stats);

                        // Find the node and update its stats
                        UpdateNodeStats(statsMsg.nodeId, statsMsg.stats);
                    }
                }
                // Handle node health update
                else if (data.type == "node_health_update") {
                    NodeHealthUpdateMessage healthMsg = JsonUtility.FromJson<NodeHealthUpdateMessage>(message);
                    if (healthMsg != null && !string.IsNullOrEmpty(healthMsg.nodeId)) {
                        Debug.Log($"Received health update for node {healthMsg.nodeId}: Health={healthMsg.currentHealth}/{healthMsg.maxHealth}");

                        // Check if this is the main node
                        if (healthMsg.nodeId == "main_node") {
                            MainNodeCurrentHealth = healthMsg.currentHealth;
                            MainNodeMaxHealth = healthMsg.maxHealth;

                            // Update main node health if component is available
                            if (mainNodeHealth != null && healthMsg.currentHealth != mainNodeHealth.GetHealth()) {
                                mainNodeHealth.SetHealth(healthMsg.currentHealth);
                            }
                        }

                        // Notify subscribers about the health update
                        OnNodeHealthUpdate?.Invoke(healthMsg.nodeId, healthMsg.currentHealth, healthMsg.maxHealth);
                    }
                }
                // Handle game over notification
                else if (data.type == "game_over") {
                    GameOverMessage gameOverMsg = JsonUtility.FromJson<GameOverMessage>(message);
                    if (gameOverMsg != null) {
                        Debug.Log($"Game over notification received. Cause: {gameOverMsg.cause}");

                        // Notify subscribers about game over
                        OnGameOver?.Invoke(gameOverMsg.cause);
                    }
                }
            } else {
                // Handle text messages (not JSON)
                Debug.Log("Non-JSON message: " + message);
            }
        } catch (Exception ex) {
            Debug.LogError($"Error parsing server message: {ex.Message}\n{ex.StackTrace}");
        }
    }

    // Find the most recently placed node and assign it the ID from the server
    private void UpdateRecentNodeWithId(string nodeId) {
        // Find the most recently placed node that doesn't have an ID yet
        foreach (var plot in allPlots) {
            if (plot.node != null && string.IsNullOrEmpty(plot.nodeId)) {
                plot.SetNodeId(nodeId);

                // Store in our node dictionary
                NodePlots[nodeId] = plot;

                Debug.Log($"Updated node ID: {nodeId} for plot at position {plot.transform.position}");
                break;
            }
        }
    }

    // Update the visual selection state for all plots
    private void UpdateNodeSelectionState() {
        foreach (var plot in allPlots) {
            if (!string.IsNullOrEmpty(plot.nodeId) && plot.nodeId == SelectedNodeId) {
                // This is the selected node
                plot.isSelected = true;
                plot.SelectNode();
            } else if (plot.isSelected) {
                // This was previously selected but no longer is
                plot.DeselectNode();
            }
        }
    }

    // Update a node's stats
    private void UpdateNodeStats(string nodeId, NodeStatsData stats) {
        if (NodePlots.TryGetValue(nodeId, out Plot plot) && plot.node != null) {
            Node node = plot.node;

            // Update the node stats
            node.SetDamage(stats.damage);
            node.SetTargetingRange(stats.range);
            node.SetBPS(stats.speed);
            node.SetBulletSpeed(stats.efficiency);

            Debug.Log($"Updated stats for node {nodeId} in Unity");
        } else {
            Debug.LogWarning($"Could not find node with ID {nodeId} to update stats");
        }
    }

    public async void NotifyNodePlaced(string nodeType = "default") {
        if (ws == null || ws.State != WebSocketState.Open) {
            Debug.LogWarning("WebSocket is not connected. Cannot send node placed notification.");
            return;
        }

        try {
            // Create a message
            NodePlacedMessage msg = new NodePlacedMessage {
                type = "node_placed",
                nodeType = nodeType,
                timestamp = DateTime.UtcNow.ToString("o")
            };

            string json = JsonUtility.ToJson(msg);
            await ws.SendText(json);
            Debug.Log($"Sent node placed notification for node type: {nodeType}");
        } catch (Exception ex) {
            Debug.LogError($"Error sending node placed notification: {ex.Message}");
        }
    }

    public async void NotifyNodeDestroyed(string nodeType = "default", string nodeId = null) {
        if (ws != null && ws.State == WebSocketState.Open) {
            NodeDestroyedMessage msg = new NodeDestroyedMessage {
                type = "node_destroyed",
                nodeType = nodeType,
                nodeId = nodeId,
                timestamp = DateTime.UtcNow.ToString("o")
            };

            string json = JsonUtility.ToJson(msg);
            await ws.SendText(json);
        }
    }

    public async void NotifyEnemyDestroyed(int currencyEarned) {
        if (ws == null || ws.State != WebSocketState.Open) {
            Debug.LogWarning("WebSocket is not connected. Cannot send enemy destroyed notification.");
            return;
        }

        try {
            // Create a message
            EnemyDestroyedMessage msg = new EnemyDestroyedMessage {
                type = "enemy_destroyed",
                currencyEarned = currencyEarned,
                timestamp = DateTime.UtcNow.ToString("o")
            };

            string json = JsonUtility.ToJson(msg);
            await ws.SendText(json);
            Debug.Log($"Sent enemy destroyed notification with currency earned: {currencyEarned}");
        } catch (Exception ex) {
            Debug.LogError($"Error sending enemy destroyed notification: {ex.Message}");
        }
    }

    public async void NotifyGameStats(int currency, int enemiesKilled) {
        if (ws == null || ws.State != WebSocketState.Open) {
            Debug.LogWarning("WebSocket is not connected. Cannot send game stats.");
            return;
        }

        try {
            // Create a message
            GameStatsMessage msg = new GameStatsMessage {
                type = "game_stats",
                currency = currency,
                enemiesKilled = enemiesKilled,
                timestamp = DateTime.UtcNow.ToString("o")
            };

            string json = JsonUtility.ToJson(msg);
            await ws.SendText(json);
            Debug.Log($"Sent game stats: Currency {currency}, Enemies killed {enemiesKilled}");
        } catch (Exception ex) {
            Debug.LogError($"Error sending game stats: {ex.Message}");
        }
    }

    public async void NotifyWaveCountdown(int waveNumber, float countdown, int maxWaves) {
        if (ws == null || ws.State != WebSocketState.Open) {
            Debug.LogWarning("WebSocket is not connected. Cannot send wave countdown.");
            return;
        }

        try {
            // Create wave countdown message
            WaveCountdownMessage msg = new WaveCountdownMessage {
                type = "wave_countdown",
                waveNumber = waveNumber,
                countdown = countdown,
                maxWaves = maxWaves,
                timestamp = DateTime.UtcNow.ToString("o")
            };

            string json = JsonUtility.ToJson(msg);
            await ws.SendText(json);
            Debug.Log($"Sent wave countdown: Wave {waveNumber}, Countdown {countdown}s");
        } catch (Exception ex) {
            Debug.LogError($"Error sending wave countdown: {ex.Message}");
        }
    }

    public async void NotifyWaveStarted(int waveNumber, int enemiesInWave, int maxWaves) {
        if (ws == null || ws.State != WebSocketState.Open) {
            Debug.LogWarning("WebSocket is not connected. Cannot send wave started notification.");
            return;
        }

        try {
            // Create wave started message
            WaveStartedMessage msg = new WaveStartedMessage {
                type = "wave_started",
                waveNumber = waveNumber,
                enemiesInWave = enemiesInWave,
                maxWaves = maxWaves,
                timestamp = DateTime.UtcNow.ToString("o")
            };

            string json = JsonUtility.ToJson(msg);
            await ws.SendText(json);
            Debug.Log($"Sent wave started: Wave {waveNumber}/{maxWaves}, Enemies: {enemiesInWave}");
        } catch (Exception ex) {
            Debug.LogError($"Error sending wave started notification: {ex.Message}");
        }
    }

    public async void NotifyGameWon(string reason) {
        if (ws == null || ws.State != WebSocketState.Open) {
            Debug.LogWarning("WebSocket is not connected. Cannot send game won notification.");
            return;
        }

        try {
            // Create game won message
            GameWonMessage msg = new GameWonMessage {
                type = "game_won",
                reason = reason,
                timestamp = DateTime.UtcNow.ToString("o")
            };

            string json = JsonUtility.ToJson(msg);
            await ws.SendText(json);
            Debug.Log($"Sent game won notification. Reason: {reason}");
        } catch (Exception ex) {
            Debug.LogError($"Error sending game won notification: {ex.Message}");
        }
    }

    // Method to select a node
    public async void SelectNode(string nodeId) {
        if (ws != null) {
            NodeSelectedMessage msg = new NodeSelectedMessage {
                type = "node_selected",
                nodeId = nodeId
            };

            string json = JsonUtility.ToJson(msg);
            await ws.SendText(json);
            Debug.Log($"Sent node selection request for node: {nodeId}");
        }
    }

    // Public method to send text messages (legacy support)
    public async void SendWebSocketMessage(string message) {
        if (IsConnected()) {
            try {
                await ws.SendText(message);
                Debug.Log("Sent message: " + message);
            } catch (Exception ex) {
                Debug.LogError($"Error sending WebSocket message: {ex.Message}");
            }
        } else {
            Debug.LogWarning("WebSocket is not connected. Cannot send message.");
        }
    }

    private async void OnDestroy() {
        if (ws != null) {
            await ws.Close();
        }
    }
}
