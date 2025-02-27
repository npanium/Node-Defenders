using UnityEngine;
using WebSocketSharp;
using System;
using System.Collections.Generic;

public class WsClient : MonoBehaviour {
    private WebSocket ws;
    public static WsClient Instance { get; private set; }

    // Game state properties from server
    public int TotalNodesPlaced { get; private set; } = 0;

    // Event for when state is updated from server
    public event Action<int> OnNodeCountUpdated;

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
        ConnectToServer();
    }

    private void ConnectToServer() {
        ws = new WebSocket("ws://localhost:8080");

        ws.OnOpen += (sender, e) => {
            Debug.Log("WebSocket connection established");
        };

        ws.OnMessage += (sender, e) => {
            try {
                if (e.IsText) {
                    Debug.Log("Message Received: " + e.Data);
                    ProcessServerMessage(e.Data);
                } else {
                    Debug.Log("Binary message received");
                }
            } catch (Exception ex) {
                Debug.LogError("Error processing WebSocket message: " + ex.Message);
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
                    }
                }
                // Handle confirmation responses
                else if (data.type == "action_confirmed") {
                    ActionConfirmedMessage actionMsg = JsonUtility.FromJson<ActionConfirmedMessage>(message);
                    Debug.Log($"Server confirmed action: {actionMsg.action} with result: {actionMsg.success}");

                    if (actionMsg.newTotal >= 0) // Check for valid value
                    {
                        TotalNodesPlaced = actionMsg.newTotal;
                        OnNodeCountUpdated?.Invoke(TotalNodesPlaced);
                    }
                }
            }
        } catch (Exception ex) {
            Debug.LogError($"Error parsing server message: {ex.Message}");
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

    public void NotifyNodeDestroyed(string nodeType = "default") {
        if (ws != null && ws.ReadyState == WebSocketState.Open) {
            NodeDestroyedMessage msg = new NodeDestroyedMessage {
                type = "node_destroyed",
                nodeType = nodeType,
                timestamp = DateTime.UtcNow.ToString("o")
            };

            string json = JsonUtility.ToJson(msg);
            ws.Send(json);
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

// Message classes that will work with Unity's JsonUtility

[Serializable]
public class ServerMessage {
    public string type;
}

[Serializable]
public class GameStateData {
    public int totalNodesPlaced;
    // Note: Unity's JsonUtility cannot directly deserialize dictionaries
    // So we'll have to handle nodeTypes differently if needed
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
}

[Serializable]
public class NodePlacedMessage : ServerMessage {
    public string nodeType;
    public string timestamp;
}

[Serializable]
public class NodeDestroyedMessage : ServerMessage {
    public string nodeType;
    public string timestamp;
}