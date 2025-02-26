using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using WebSocketSharp;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Threading.Tasks;

public class WebSocketManager : MonoBehaviour {

    private static WebSocketManager _instance;
    public static WebSocketManager Instance {
        get {
            if (_instance == null) {
                GameObject go = new GameObject("WebSocketManager");
                _instance = go.AddComponent<WebSocketManager>();
                DontDestroyOnLoad(go);
            }
            return _instance;
        }
    }

    [Header("WebSocket Settings")]
    [SerializeField] private string serverUrl = "ws://localhost:8080/socket.io/?EIO=4&transport=websocket";
    [SerializeField] private string gameId = "player1";

    private WebSocket webSocket;
    private bool isConnected = false;
    private bool isHandshakeComplete = false;
    private bool isSocketIOConnected = false; // New flag for Socket.IO connection

    // Events
    public event Action OnConnected;
    public event Action OnDisconnected;
    public event Action<GameState> OnGameStateReceived;

    // Socket.IO ping handling
    private float pingInterval = 25f; // Default Socket.IO ping interval is 25 seconds
    private float lastPingTime = 0f;
    private bool needToSendPing = false;
    private float pingIntervalFromServer = 25f;

    private void Awake() {
        if (_instance != null && _instance != this) {
            Destroy(gameObject);
            return;
        }

        _instance = this;
        DontDestroyOnLoad(gameObject);
    }

    private void Start() {
        Debug.Log("[WSM] connecting to server");
        ConnectToServer();
    }

    private void Update() {
        // Handle Socket.IO ping-pong to keep the connection alive
        // This is now safely running on the main thread
        if (isConnected && isHandshakeComplete && isSocketIOConnected) {
            if (needToSendPing || (Time.time - lastPingTime > pingIntervalFromServer)) {
                SendPing();
                lastPingTime = Time.time;
                needToSendPing = false;
            }
        }
    }

    private void OnDestroy() {
        DisconnectFromServer();
    }

    private void SendPing() {
        try {
            if (webSocket != null && webSocket.ReadyState == WebSocketState.Open) {
                // Socket.IO ping message is simply "2"
                webSocket.Send("2");
                Debug.Log("Sent ping to server");
            }
        } catch (Exception e) {
            Debug.LogError($"Error sending ping: {e.Message}");
        }
    }

    public void ConnectToServer() {
        try {
            // Close existing connection if any
            if (webSocket != null) {
                try {
                    webSocket.Close();
                } catch (Exception) {
                    // Ignore close errors
                }
                webSocket = null;
            }

            webSocket = new WebSocket(serverUrl);
            isConnected = false;
            isHandshakeComplete = false;
            isSocketIOConnected = false;

            webSocket.OnOpen += (sender, e) => {
                Debug.Log("WebSocket connection opened");
                isConnected = true;
                // The handshake will be completed when we receive the first message
            };

            webSocket.OnMessage += (sender, e) => {
                Debug.Log($"Message received: {e.Data}");

                // Process message on the main thread to avoid threading issues
                MainThreadDispatcher.RunOnMainThread(() => {
                    HandleSocketIOMessage(e.Data);
                });
            };

            webSocket.OnError += (sender, e) => {
                Debug.LogError($"WebSocket error: {e.Message}");
            };

            webSocket.OnClose += (sender, e) => {
                Debug.Log($"WebSocket closed: {e.Code} {e.Reason}");
                isConnected = false;
                isHandshakeComplete = false;
                isSocketIOConnected = false;

                if (OnDisconnected != null) {
                    MainThreadDispatcher.RunOnMainThread(() => {
                        OnDisconnected.Invoke();
                    });
                }

                // Try to reconnect after a delay
                MainThreadDispatcher.RunOnMainThread(() => {
                    StartCoroutine(ReconnectAfterDelay(2f));
                });
            };

            Debug.Log("Attempting to connect to WebSocket server...");
            webSocket.Connect();
        } catch (Exception e) {
            Debug.LogError($"WebSocket connection error: {e.Message}");
            // Try to reconnect after a delay
            StartCoroutine(ReconnectAfterDelay(5f));
        }
    }

    private IEnumerator ReconnectAfterDelay(float delay) {
        Debug.Log($"Will try to reconnect in {delay} seconds...");
        yield return new WaitForSeconds(delay);
        ConnectToServer();
    }

    public void DisconnectFromServer() {
        if (webSocket != null) {
            try {
                webSocket.Close();
            } catch (Exception e) {
                Debug.LogError($"Error closing WebSocket: {e.Message}");
            }
            webSocket = null;
            isConnected = false;
            isHandshakeComplete = false;
            isSocketIOConnected = false;
        }
    }

    public bool IsConnected() {
        return isConnected && isHandshakeComplete && isSocketIOConnected;
    }

    // Handle Socket.IO specific messages
    private void HandleSocketIOMessage(string message) {
        if (string.IsNullOrEmpty(message)) return;

        // Handle Socket.IO message types
        switch (message[0]) {
            case '0': // Socket.IO handshake
                try {
                    Debug.Log("Handling Socket.IO handshake");
                    JObject handshake = JObject.Parse(message.Substring(1));
                    if (handshake.TryGetValue("pingInterval", out JToken pingIntervalToken)) {
                        // Convert from milliseconds to seconds and store
                        pingIntervalFromServer = pingIntervalToken.Value<long>() / 1000f;
                        Debug.Log($"Ping interval set to {pingIntervalFromServer} seconds");
                    }
                    isHandshakeComplete = true;
                    lastPingTime = Time.time;
                    needToSendPing = true; // Signal to send ping on next Update

                    // Send Socket.IO connect message (40) after handshake
                    webSocket.Send("40");
                    Debug.Log("Sent Socket.IO connect message (40)");
                } catch (Exception e) {
                    Debug.LogError($"Error parsing handshake: {e.Message}");
                }
                break;

            case '4': // Socket.IO message types
                if (message.StartsWith("40")) {
                    Debug.Log("Socket.IO connection established");
                    isSocketIOConnected = true;

                    // Now it's safe to send join_game event after Socket.IO connection is established
                    string joinEvent = $"42[\"join_game\",\"{gameId}\"]";
                    webSocket.Send(joinEvent);
                    Debug.Log($"Sent join_game event for game ID: {gameId}");

                    // Notify connection completed
                    if (OnConnected != null) {
                        OnConnected.Invoke();
                    }
                } else if (message.StartsWith("42")) {
                    ProcessSocketIOEvent(message.Substring(2));
                }
                break;

            case '1': // Socket.IO connect confirmation
                Debug.Log("Socket.IO connect confirmed");
                break;

            case '2': // Socket.IO ping
                // Reply with pong
                try {
                    webSocket.Send("3");
                    Debug.Log("Received ping, sent pong");
                } catch (Exception e) {
                    Debug.LogError($"Error sending pong: {e.Message}");
                }
                break;

            case '3': // Socket.IO pong
                Debug.Log("Received pong from server");
                break;

            default:
                Debug.Log($"Unhandled Socket.IO message type: {message}");
                break;
        }
    }

    // Process Socket.IO events (messages starting with 42)
    private void ProcessSocketIOEvent(string jsonData) {
        try {
            JArray msgArray = JArray.Parse(jsonData);
            string eventName = msgArray[0].ToString();
            JToken eventData = msgArray[1];

            Debug.Log($"Received Socket.IO event: {eventName}");

            switch (eventName) {
                case "game_state_update":
                    GameState gameState = eventData.ToObject<GameState>();
                    Debug.Log($"Game state update: currency={gameState.Currency}");

                    if (OnGameStateReceived != null) {
                        OnGameStateReceived.Invoke(gameState);
                    }
                    break;

                default:
                    Debug.Log($"Unhandled event: {eventName}");
                    break;
            }
        } catch (Exception e) {
            Debug.LogError($"Error processing Socket.IO event: {e.Message}");
        }
    }

    // Send an event to update currency
    public void UpdateCurrency(int amount) {
        var payload = new JObject();
        payload["amount"] = amount;

        SendUnityEvent("currency_update", payload);
    }

    // Send event when a node/tower is placed
    public void SendNodePlaced(string nodeType, int cost) {
        var payload = new JObject();
        payload["turretType"] = nodeType;
        payload["cost"] = cost;
        payload["createPool"] = true;

        SendUnityEvent("turret_placed", payload);
    }

    // Generic method to send Unity events
    private void SendUnityEvent(string eventType, JObject payload) {
        if (!IsConnected()) {
            Debug.LogWarning($"Cannot send event {eventType}: WebSocket not fully connected");
            return;
        }

        try {
            var eventData = new JObject();
            eventData["gameId"] = gameId;
            eventData["eventType"] = eventType;
            eventData["payload"] = payload;

            string jsonData = JsonConvert.SerializeObject(eventData);
            // Log the raw JSON data
            Debug.Log($"[WSM-SendUnityEvent] JSON payload being sent: {jsonData}");

            string socketMessage = $"42[\"unity_event\",{jsonData}]";
            // Log the complete Socket.IO message
            Debug.Log($"Complete Socket.IO message: {socketMessage}");

            webSocket.Send(socketMessage);
            Debug.Log($"Sent event: {eventType}");
        } catch (Exception e) {
            Debug.LogError($"Error sending event: {e.Message}");
            // If we get an error while sending, the connection might be broken
            // Try to reconnect
            if (webSocket != null && webSocket.ReadyState != WebSocketState.Open) {
                Debug.Log("Connection seems broken, attempting to reconnect...");
                ConnectToServer();
            }
        }
    }

    public void LogConnectionStatus() {
        Debug.Log($"WebSocketManager Status:");
        Debug.Log($"- Raw WebSocket Connected: {isConnected}");
        Debug.Log($"- Handshake Complete: {isHandshakeComplete}");
        Debug.Log($"- Socket.IO Connected: {isSocketIOConnected}");

        if (webSocket != null) {
            Debug.Log($"- WebSocket ReadyState: {webSocket.ReadyState}");
        } else {
            Debug.Log("- WebSocket is null!");
        }

        Debug.Log($"- Overall IsConnected(): {IsConnected()}");
    }
}

// Helper class to dispatch events to the main thread
public class MainThreadDispatcher : MonoBehaviour {
    private static readonly Queue<Action> _executionQueue = new Queue<Action>();
    private static MainThreadDispatcher _instance = null;

    public static void RunOnMainThread(Action action) {
        lock (_executionQueue) {
            _executionQueue.Enqueue(action);
        }
    }

    private void Awake() {
        if (_instance == null) {
            _instance = this;
            DontDestroyOnLoad(this.gameObject);
        }
    }

    private void Update() {
        lock (_executionQueue) {
            while (_executionQueue.Count > 0) {
                _executionQueue.Dequeue().Invoke();
            }
        }
    }

    private void OnDestroy() {
        _instance = null;
    }
}