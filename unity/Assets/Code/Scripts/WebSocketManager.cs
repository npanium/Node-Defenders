using UnityEngine;
using WebSocketSharp;
using System;
using System.Collections.Generic;
using System.Collections.Concurrent;

public class WsClient : MonoBehaviour {
    private WebSocket ws;
    public static WsClient Instance { get; private set; }

    // Game state properties from server
    public int TotalNodesPlaced { get; private set; } = 0;

    // Dictionary to track node IDs
    public Dictionary<string, Plot> NodePlots { get; private set; } = new Dictionary<string, Plot>();

    // Currently selected node
    public string SelectedNodeId { get; private set; } = null;

    // Events
    public event Action<int> OnNodeCountUpdated;
    public event Action<string> OnNodeSelected;

    // Queue for messages to process on main thread
    private ConcurrentQueue<string> messageQueue = new ConcurrentQueue<string>();

    // Cache of Plot objects in the scene for quick access
    private Plot[] allPlots;

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

        ConnectToServer();
    }

    private void Update() {
        // Process any queued messages on the main thread
        ProcessQueuedMessages();
    }

    private void ConnectToServer() {
        ws = new WebSocket("ws://localhost:4000");

        ws.OnOpen += (sender, e) => {
            Debug.Log("WebSocket connection established");
        };

        ws.OnMessage += (sender, e) => {
            try {
                if (e.IsText) {
                    // Instead of processing immediately, queue the message
                    // to be processed on the main thread
                    messageQueue.Enqueue(e.Data);
                    Debug.Log("Message received and queued: " + e.Data);
                } else {
                    Debug.Log("Binary message received");
                }
            } catch (Exception ex) {
                Debug.LogError("Error in WebSocket message handler: " + ex.Message);
            }
        };

        ws.OnError += (sender, e) => {
            Debug.LogError("WebSocket Error: " + e.Message);
        };

        ws.OnClose += (sender, e) => {
            Debug.Log("WebSocket connection closed: " + e.Reason);
        };

        ws.Connect();
    }

    private void ProcessQueuedMessages() {
        // Process all queued messages
        string message;
        while (messageQueue.TryDequeue(out message)) {
            try {
                ProcessServerMessage(message);
            } catch (Exception ex) {
                Debug.LogError($"Error processing server message: {ex.Message}");
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
            } else {
                // Handle text messages (not JSON)
                Debug.Log("Non-JSON message: " + message);
            }
        } catch (Exception ex) {
            Debug.LogError($"Error parsing server message: {ex.Message}");
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

    public void NotifyNodePlaced(string nodeType = "default") {
        if (ws == null || ws.ReadyState != WebSocketState.Open) {
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
            ws.Send(json);
            Debug.Log($"Sent node placed notification for node type: {nodeType}");
        } catch (Exception ex) {
            Debug.LogError($"Error sending node placed notification: {ex.Message}");
        }
    }

    public void NotifyNodeDestroyed(string nodeType = "default", string nodeId = null) {
        if (ws != null && ws.ReadyState == WebSocketState.Open) {
            NodeDestroyedMessage msg = new NodeDestroyedMessage {
                type = "node_destroyed",
                nodeType = nodeType,
                nodeId = nodeId,
                timestamp = DateTime.UtcNow.ToString("o")
            };

            string json = JsonUtility.ToJson(msg);
            ws.Send(json);
        }
    }

    // Method to select a node
    public void SelectNode(string nodeId) {
        if (ws != null && ws.ReadyState == WebSocketState.Open) {
            NodeSelectedMessage msg = new NodeSelectedMessage {
                type = "node_selected",
                nodeId = nodeId
            };

            string json = JsonUtility.ToJson(msg);
            ws.Send(json);
            Debug.Log($"Sent node selection request for node: {nodeId}");
        }
    }

    // Public method to send text messages (legacy support)
    public void SendWebSocketMessage(string message) {
        if (ws != null && ws.ReadyState == WebSocketState.Open) {
            ws.Send(message);
            Debug.Log("Sent plain text message: " + message);
        } else {
            Debug.LogWarning("WebSocket is not connected. Cannot send message.");
        }
    }

    private void OnDestroy() {
        if (ws != null && ws.ReadyState == WebSocketState.Open) {
            ws.Close();
        }
    }
}

// Enhanced message classes

[Serializable]
public class ServerMessage {
    public string type;
}

[Serializable]
public class GameStateData {
    public int totalNodesPlaced;
    public string selectedNodeId;
}

[Serializable]
public class StateUpdateMessage : ServerMessage {
    public GameStateData data;
}

[Serializable]
public class ActionConfirmedMessage : ServerMessage {
    public string action;
    public bool success;
    public int newTotal;
    public string nodeId;
}

[Serializable]
public class NodePlacedMessage : ServerMessage {
    public string nodeType;
    public Position position;
    public string timestamp;
}

[Serializable]
public class NodeDestroyedMessage : ServerMessage {
    public string nodeType;
    public string nodeId;
    public string timestamp;
}

// [Serializable]
// public class NodeSelectedMessage : ServerMessage {
//     public string nodeId;
// } 