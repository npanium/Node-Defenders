using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
using System;
using UnityEngine.SceneManagement;

public class MainNodeHealth : MonoBehaviour {
    [Header("Health Settings")]
    [SerializeField] private int maxHealth = 100;
    [SerializeField] private int currentHealth;

    [Header("UI References")]
    [SerializeField] private TextMeshProUGUI healthText;

    [Header("Game Over")]
    [SerializeField] private GameObject gameOverPanel;

    private WsClient wsClient;

    // Events
    public delegate void HealthChangedHandler(int currentHealth, int maxHealth);
    public static event HealthChangedHandler OnHealthChanged;

    private void Start() {
        currentHealth = maxHealth;
        UpdateHealthUI();

        // Hide game over panel if assigned
        if (gameOverPanel != null) {
            gameOverPanel.SetActive(false);
        }

        wsClient = WsClient.Instance;
        if (wsClient == null) {
            wsClient = FindObjectOfType<WsClient>();
            Debug.LogWarning("WsClient not found as singleton, searching in scene");
        }

        // Send initial health status
        if (wsClient != null) {
            SendHealthUpdateToServer();
        }
    }

    private void OnCollisionEnter2D(Collision2D collision) {
        // Check if collided with an enemy
        if (collision.gameObject.layer == LayerMask.NameToLayer("Enemy")) {
            // Get enemy attack power
            int attackPower = 1; // Default value
            Enemy enemy = collision.gameObject.GetComponent<Enemy>();
            if (enemy != null) {
                attackPower = enemy.GetAttackPower();
            }

            // Take damage
            TakeDamage(attackPower);

            // Destroy the enemy
            Destroy(collision.gameObject);

            // Make sure to invoke enemy destroy event so enemy counter updates
            EnemySpawner.onEnemyDestroy.Invoke();
        }
    }

    public void TakeDamage(int damage) {
        int previousHealth = currentHealth;
        currentHealth -= damage;

        // Ensure health doesn't go below 0
        currentHealth = Mathf.Max(0, currentHealth);

        // Update UI
        UpdateHealthUI();

        // Trigger event
        if (OnHealthChanged != null) {
            OnHealthChanged.Invoke(currentHealth, maxHealth);
        }

        if (currentHealth != previousHealth && wsClient != null) {
            SendHealthUpdateToServer();
        }

        // Check for game over
        if (currentHealth <= 0) {
            GameOver();
        }
    }

    private void SendHealthUpdateToServer() {
        if (wsClient == null || !wsClient.IsConnected()) {
            Debug.LogWarning("WebSocket is not connected. Cannot send health update.");
            return;
        }

        try {
            // Create health update message
            HealthUpdateMessage msg = new HealthUpdateMessage {
                type = "node_health_update",
                nodeId = "main_node", // consistent ID
                currentHealth = currentHealth,
                maxHealth = maxHealth,
                healthPercentage = GetHealthPercentage(),
                timestamp = DateTime.UtcNow.ToString("o")
            };

            string json = JsonUtility.ToJson(msg);
            wsClient.SendWebSocketMessage(json);
            Debug.Log($"Sent health update: {currentHealth}/{maxHealth}");
        } catch (Exception ex) {
            Debug.LogError($"Error sending health update: {ex.Message}");
        }
    }

    private void UpdateHealthUI() {
        if (healthText != null) {
            healthText.text = $"Health: {currentHealth}/{maxHealth}";
        }
    }

    private void GameOver() {
        Debug.Log("Game Over - Main Node Destroyed!");

        // Show game over panel if assigned
        if (gameOverPanel != null) {
            gameOverPanel.SetActive(true);
        }

        // Send game over message to server
        if (wsClient != null) {
            try {
                GameOverMessage msg = new GameOverMessage {
                    type = "game_over",
                    cause = "main_node_destroyed",
                    timestamp = DateTime.UtcNow.ToString("o")
                };

                string json = JsonUtility.ToJson(msg);
                wsClient.SendWebSocketMessage(json);
                Debug.Log("Sent game over notification to server");
            } catch (Exception ex) {
                Debug.LogError($"Error sending game over message: {ex.Message}");
            }
        }


        Time.timeScale = 0;
        SceneManager.LoadScene(2);
    }

    public void Heal(int amount) {
        int previousHealth = currentHealth;
        currentHealth += amount;

        // Cap health at max health
        currentHealth = Mathf.Min(currentHealth, maxHealth);

        // Update UI
        UpdateHealthUI();

        // Trigger event
        if (OnHealthChanged != null) {
            OnHealthChanged.Invoke(currentHealth, maxHealth);
        }

        // Send update to server if health actually changed
        if (currentHealth != previousHealth && wsClient != null) {
            SendHealthUpdateToServer();
        }
    }

    // Getter for current health (%)
    public float GetHealthPercentage() {
        return (float)currentHealth / maxHealth;
    }

    public int GetHealth() {
        return currentHealth;
    }

    public void SetHealth(int newHealth) {
        // Only update if different to avoid infinite loops
        if (newHealth != currentHealth) {
            currentHealth = Mathf.Clamp(newHealth, 0, maxHealth);
            UpdateHealthUI();

            // Trigger event but don't send another update to server
            if (OnHealthChanged != null) {
                OnHealthChanged.Invoke(currentHealth, maxHealth);
            }

            // Check for game over
            if (currentHealth <= 0) {
                GameOver();
            }
        }
    }
}

[Serializable]
public class HealthUpdateMessage {
    public string type;
    public string nodeId;
    public int currentHealth;
    public int maxHealth;
    public float healthPercentage;
    public string timestamp;
}

[Serializable]
public class GameOverMessage {
    public string type;
    public string cause;
    public string timestamp;
}