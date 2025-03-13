using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;

public class LevelManager : MonoBehaviour {
    // Singleton reference
    public static LevelManager main;

    // Game properties
    public Transform startPoint;
    public Transform[] path;
    public Transform mainNode;

    public int currency;
    public int playerHealth { get; private set; }
    public int maxPlayerHealth { get; private set; }
    public int enemiesKilled { get; private set; }

    private WsClient wsClient;

    private void Awake() {
        main = this;
    }

    private void Start() {
        wsClient = WsClient.Instance;
        ResetGame();

        currency = 50;

        if (mainNode == null) {
            GameObject mainNodeObj = GameObject.FindGameObjectWithTag("MainNode");
            if (mainNodeObj != null) {
                mainNode = mainNodeObj.transform;
            } else {
                Debug.LogError("Main Node not found in scene! Please tag your main node with 'MainNode'");
            }
        }

        MainNodeHealth.OnHealthChanged += UpdatePlayerHealth;

        if (wsClient == null) {
            wsClient = FindObjectOfType<WsClient>();
        }


        if (wsClient != null) {

            SendGameStateUpdate();
        } else {
            Debug.LogWarning("LevelManager: Failed to get WsClient reference");
        }
    }

    public void ResetGame() {
        // Reset local game state
        currency = 50;
        enemiesKilled = 0;

        // Find and reset any active state
        // MainNodeHealth mainHealth = FindObjectOfType<MainNodeHealth>();
        // if (mainHealth != null) {
        //     mainHealth.ResetHealth();
        // }

        // Clear any active nodes
        // Plot[] plots = FindObjectsOfType<Plot>();
        // foreach (Plot plot in plots) {
        //     if (plot.node != null) {
        //         Destroy(plot.node.gameObject);
        //         plot.ClearNode();
        //     }
        // }

        // Notify the server about the reset
        if (wsClient != null) {
            GameResetMessage msg = new GameResetMessage {
                type = "game_reset",
                timestamp = DateTime.UtcNow.ToString("o")
            };

            string json = JsonUtility.ToJson(msg);
            wsClient.SendWebSocketMessage(json);
        }

        Debug.Log("Game reset requested");
    }

    private void OnDestroy() {
        MainNodeHealth.OnHealthChanged -= UpdatePlayerHealth;
    }

    private void UpdatePlayerHealth(int currentHealth, int maxHealth) {
        playerHealth = currentHealth;
        maxPlayerHealth = maxHealth;

        // Send structured message for health update
        if (wsClient != null) {
            HealthUpdateMessage msg = new HealthUpdateMessage {
                type = "health_update",
                currentHealth = playerHealth,
                maxHealth = maxHealth,
                timestamp = DateTime.UtcNow.ToString("o")
            };

            string json = JsonUtility.ToJson(msg);
            wsClient.SendWebSocketMessage(json);
        }
    }

    // Increase currency
    public void IncreaseCurrency(int amount) {
        currency += amount;
        Debug.Log($"Currency increased by {amount}, now: {currency}");

        if (wsClient != null) {
            CurrencyUpdateMessage msg = new CurrencyUpdateMessage {
                type = "currency_update",
                amount = amount,
                operation = "decrease",
                balance = currency,
                timestamp = DateTime.UtcNow.ToString("o")
            };

            string json = JsonUtility.ToJson(msg);
            wsClient.SendWebSocketMessage(json);
        }

    }

    // Spend currency
    public bool SpendCurrency(int amount) {
        if (amount <= currency) {
            currency -= amount;
            Debug.Log($"Spent {amount} currency, remaining: {currency}");

            if (wsClient != null) {
                CurrencyUpdateMessage msg = new CurrencyUpdateMessage {
                    type = "currency_update",
                    amount = amount,
                    operation = "decrease",
                    balance = currency,
                    timestamp = DateTime.UtcNow.ToString("o")
                };

                string json = JsonUtility.ToJson(msg);
                wsClient.SendWebSocketMessage(json);
            }

            return true;
        } else {
            Debug.Log($"Not enough currency: {currency} < {amount}");
            return false;
        }
    }

    public void IncrementEnemiesKilled() {
        enemiesKilled++;

        if (wsClient != null) {
            EnemyKilledMessage msg = new EnemyKilledMessage {
                type = "enemy_killed",
                enemiesKilled = enemiesKilled,
                timestamp = DateTime.UtcNow.ToString("o")
            };

            string json = JsonUtility.ToJson(msg);
            wsClient.SendWebSocketMessage(json);
        }
    }

    public void SendGameStateUpdate() {
        if (wsClient != null) {
            GameStateUpdateMessage msg = new GameStateUpdateMessage {
                type = "game_state_update",
                currency = currency,
                health = playerHealth,
                maxHealth = maxPlayerHealth,
                enemiesKilled = enemiesKilled,
                timestamp = DateTime.UtcNow.ToString("o")
            };

            string json = JsonUtility.ToJson(msg);
            wsClient.SendWebSocketMessage(json);
        }
    }
}

