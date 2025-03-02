using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class LevelManager : MonoBehaviour {
    // Singleton reference
    public static LevelManager main;

    // Game properties
    public Transform startPoint;
    public Transform[] path;
    public Transform mainNode;

    public int currency;
    public int playerHealth { get; private set; }

    private WsClient wsClient;

    private void Awake() {
        main = this;
    }

    private void Start() {
        // Set initial currency
        currency = 100;

        if (mainNode == null) {
            GameObject mainNodeObj = GameObject.FindGameObjectWithTag("MainNode");
            if (mainNodeObj != null) {
                mainNode = mainNodeObj.transform;
            } else {
                Debug.LogError("Main Node not found in scene! Please tag your main node with 'MainNode'");
            }
        }

        MainNodeHealth.OnHealthChanged += UpdatePlayerHealth;

        wsClient = FindObjectOfType<WsClient>();

        if (wsClient != null) {
            Debug.Log("Plot: WsClient reference obtained");
        } else {
            Debug.LogWarning("Plot: Failed to get WsClient reference");
        }
    }


    private void OnDestroy() {
        MainNodeHealth.OnHealthChanged -= UpdatePlayerHealth;
        // Unsubscribe from events
        // if (webSocket != null) {
        //     webSocket.OnConnected -= HandleConnected;
        // }
    }

    private void UpdatePlayerHealth(int currentHealth, int maxHealth) {
        playerHealth = currentHealth;

        // Send WebSocket message if needed
        if (wsClient != null) {
            SendWebSocketMessage($"Player health updated: {playerHealth}/{maxHealth}");
        }
    }

    // Increase currency
    public void IncreaseCurrency(int amount) {
        currency += amount;
        Debug.Log($"Currency increased by {amount}, now: {currency}");

        if (wsClient != null) {
            SendWebSocketMessage($"Currency increased by {amount}, now: {currency}");
        }
    }

    // Spend currency
    public bool SpendCurrency(int amount) {
        if (amount <= currency) {
            currency -= amount;
            Debug.Log($"Spent {amount} currency, remaining: {currency}");

            if (wsClient != null) {
                SendWebSocketMessage($"Spent {amount} currency, remaining: {currency}");
            }

            return true;
        } else {
            Debug.Log($"Not enough currency: {currency} < {amount}");
            return false;
        }
    }

    private void SendWebSocketMessage(string message) {
        wsClient.SendWebSocketMessage(message);

    }
}